/**
 * RawBT (ru.a402d.rawbtprinter) — fallback printing on Android via intent URL.
 * @see https://github.com/402d/DemoRawBtPrinter — rawbt:base64,<data>
 *
 * `rawbt:base64` sends a **raw byte stream** to the printer. RawBT `{tags}` are for
 * template mode and are often printed as plain text in this path — we use plain
 * ASCII/UTF-8 lines plus real ESC/POS feed + cut bytes at the end (like SnapBizz-style drivers).
 *
 * One-time in RawBT: pick USB printer → Settings → Auto print + Skip preview → set default printer.
 */

import type { NativeAndroidBillPayload } from '@/lib/usbPrinter';

/** Conservative limit; very long receipts may need Generate bill instead. */
const MAX_RAWBT_HREF_CHARS = 48_000;

const ESC = 0x1b;
const GS = 0x1d;

function utf8Encode(s: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(s);
  }
  const utf8 = unescape(encodeURIComponent(s));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i += 1) {
    arr[i] = utf8.charCodeAt(i) & 0xff;
  }
  return arr;
}

/**
 * Init + UTF-8 body + line feeds + ESC/POS feed + partial cut.
 * Matches common thermal behaviour (TVS / ESC/POS) better than `{cut}` text.
 */
export function textToRawBtPrinterBytes(body: string): Uint8Array {
  const bodyBytes = utf8Encode(body);
  const prefix = new Uint8Array([ESC, 0x40]); // ESC @ init
  const nl = new Uint8Array([0x0a, 0x0a, 0x0a]);
  const feedLines = 10;
  const feed = new Uint8Array([ESC, 0x64, feedLines & 0xff]); // ESC d n
  const cut = new Uint8Array([GS, 0x56, 0x01]); // GS V 1 partial cut

  const total =
    prefix.length + bodyBytes.length + nl.length + feed.length + cut.length;
  const out = new Uint8Array(total);
  let o = 0;
  out.set(prefix, o);
  o += prefix.length;
  out.set(bodyBytes, o);
  o += bodyBytes.length;
  out.set(nl, o);
  o += nl.length;
  out.set(feed, o);
  o += feed.length;
  out.set(cut, o);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** Base64 payload for `rawbt:base64,<...>` including ESC/POS trailer. */
export function encodeRawBtBase64Payload(plainTextBody: string): string {
  return bytesToBase64(textToRawBtPrinterBytes(plainTextBody));
}

export function isLikelyAndroidForRawBt(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** 32 columns — safe on 58mm and avoids double-width clipping on 80mm. */
const LINE_CHARS = 32;

export function buildPlainTextReceiptForRawBt(bill: NativeAndroidBillPayload): string {
  const w = LINE_CHARS;
  const cutStr = (s: string) => (s.length <= w ? s : `${s.slice(0, w - 3)}...`);
  const wrap = (s: string): string[] => {
    const input = s.trimEnd();
    if (!input) return [''];
    const out: string[] = [];
    let idx = 0;
    while (idx < input.length) {
      out.push(input.slice(idx, idx + w));
      idx += w;
    }
    return out;
  };
  const pushWrapped = (arr: string[], s: string) => {
    wrap(s).forEach((x) => arr.push(x));
  };
  const row = (left: string, right = '') => {
    const l = cutStr(left);
    const r = cutStr(right);
    const spaces = Math.max(1, w - l.length - r.length);
    return `${l}${' '.repeat(spaces)}${r}`;
  };
  const rule = '-'.repeat(w);
  const lines: string[] = [];

  pushWrapped(lines, bill.shopName.toUpperCase());
  if (bill.shopAddress.trim()) pushWrapped(lines, bill.shopAddress.trim());
  if (bill.shopPhone.trim()) pushWrapped(lines, `Contact: ${bill.shopPhone.trim()}`);
  if (bill.showShopGstin && bill.gstin.trim()) {
    pushWrapped(lines, `GSTIN: ${bill.gstin.trim()}`);
  }
  if (bill.fssaiNumber.trim()) pushWrapped(lines, `FSSAI: ${bill.fssaiNumber.trim()}`);
  if (bill.showCustomerGstin && bill.customerGstin.trim()) {
    pushWrapped(lines, `Cust GSTIN: ${bill.customerGstin.trim()}`);
  }
  lines.push(rule);
  pushWrapped(lines, (bill.billTitle || 'TAX INVOICE').toUpperCase());
  pushWrapped(lines, `Bill: ${bill.billNumber}`);
  if (bill.billerName?.trim()) pushWrapped(lines, `Biller: ${bill.billerName.trim()}`);
  if (bill.customerName.trim()) pushWrapped(lines, `Customer: ${bill.customerName.trim()}`);
  if (bill.customerPhone.trim()) pushWrapped(lines, `Phone: ${bill.customerPhone.trim()}`);
  lines.push(rule);

  for (const it of bill.items) {
    const qty = Number.isInteger(it.qty) ? `${it.qty}` : it.qty.toFixed(1);
    const rawName = it.name.trim();
    if (rawName.length <= 14) {
      lines.push(row(rawName.slice(0, 14), `x${qty} Rs.${it.amount.toFixed(2)}`));
    } else {
      pushWrapped(lines, rawName);
      lines.push(row('', `x${qty} Rs.${it.amount.toFixed(2)}`));
    }
  }
  lines.push(rule);
  lines.push(row('Taxable:', `Rs.${bill.taxableBase.toFixed(2)}`));
  if (bill.cgstAmount > 0.005 && bill.sgstAmount > 0.005) {
    lines.push(row(`CGST ${bill.cgstPercent}%:`, `Rs.${bill.cgstAmount.toFixed(2)}`));
    lines.push(row(`SGST ${bill.sgstPercent}%:`, `Rs.${bill.sgstAmount.toFixed(2)}`));
  } else if (bill.tax > 0.005) {
    lines.push(row(`${bill.taxLabel}:`, `Rs.${bill.tax.toFixed(2)}`));
  }
  if (bill.discount > 0.005) lines.push(row('Discount:', `-Rs.${bill.discount.toFixed(2)}`));
  lines.push(row('TOTAL:', `Rs.${bill.total.toFixed(2)}`));
  if (bill.paymentMode.trim()) pushWrapped(lines, bill.paymentMode.trim());
  lines.push(rule);
  if (bill.footerNote?.trim()) pushWrapped(lines, bill.footerNote.trim());
  if (bill.footerMessage.trim()) pushWrapped(lines, bill.footerMessage.trim());
  if (bill.bankAccountNumber.trim()) {
    pushWrapped(lines, `A/c: ${bill.bankAccountNumber.trim()}`);
  }
  if (bill.bankIfsc.trim()) pushWrapped(lines, `IFSC: ${bill.bankIfsc.trim()}`);
  if (bill.poweredBy.trim()) pushWrapped(lines, bill.poweredBy.trim());

  return lines.join('\n');
}

export type RawBtLaunchResult = { ok: true } | { ok: false; error: string };

/**
 * Sends receipt as base64 raw stream: UTF-8 text + ESC/POS feed + cut.
 */
export function launchRawBtPrintFromText(text: string): RawBtLaunchResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'RawBT is only available in the browser.' };
  }
  if (!isLikelyAndroidForRawBt()) {
    return {
      ok: false,
      error:
        'RawBT runs on Android. Install “RawBT” from Play Store, set USB printer, enable Auto print + Skip preview.',
    };
  }
  const b64 = encodeRawBtBase64Payload(text);
  const href = `rawbt:base64,${b64}`;
  if (href.length > MAX_RAWBT_HREF_CHARS) {
    return {
      ok: false,
      error: 'Receipt too long for RawBT. Use Generate bill or split the sale.',
    };
  }
  window.location.href = href;
  return { ok: true };
}

export function launchRawBtPrintFromBill(
  bill: NativeAndroidBillPayload,
): RawBtLaunchResult {
  return launchRawBtPrintFromText(buildPlainTextReceiptForRawBt(bill));
}

/**
 * Print from a **public** http(s) file URL (e.g. PDF). RawBT downloads it.
 * Must be reachable without session cookies.
 */
export function launchRawBtPrintFromPublicFileUrl(fileUrl: string): RawBtLaunchResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Not available server-side.' };
  }
  if (!isLikelyAndroidForRawBt()) {
    return { ok: false, error: 'RawBT is for Android.' };
  }
  const u = fileUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    return { ok: false, error: 'URL must start with http:// or https://' };
  }
  window.location.href = `rawbt:print?url=${encodeURIComponent(u)}`;
  return { ok: true };
}
