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
  const rule = '-'.repeat(w);
  const lines: string[] = [];

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

  const center = (s: string): string => {
    const t = s.trim();
    if (t.length >= w) return t;
    const pad = Math.floor((w - t.length) / 2);
    return ' '.repeat(pad) + t;
  };

  const pushCentered = (arr: string[], s: string) => {
    wrap(s).forEach((chunk) => arr.push(center(chunk)));
  };

  const pushWrapped = (arr: string[], s: string) => {
    wrap(s).forEach((x) => arr.push(x));
  };

  const row = (left: string, right: string): string => {
    const spaces = Math.max(1, w - left.length - right.length);
    return `${left}${' '.repeat(spaces)}${right}`;
  };

  // --- Header (centered) ---
  pushCentered(lines, bill.shopName.toUpperCase());
  if (bill.shopAddress.trim()) pushCentered(lines, bill.shopAddress.trim());
  if (bill.shopPhone.trim()) pushCentered(lines, `Contact No. :- ${bill.shopPhone.trim()}`);
  if (bill.showShopGstin && bill.gstin.trim()) {
    pushCentered(lines, `GSTIN: ${bill.gstin.trim()}`);
  }
  if (bill.fssaiNumber.trim()) pushCentered(lines, `FSSAI No.${bill.fssaiNumber.trim()}`);
  if (bill.showCustomerGstin && bill.customerGstin.trim()) {
    pushCentered(lines, `Cust GSTIN: ${bill.customerGstin.trim()}`);
  }
  lines.push(rule);

  // --- Bill info ---
  pushCentered(lines, (bill.billTitle || 'TAX INVOICE').toUpperCase());

  const dt = bill.issuedAt ? new Date(bill.issuedAt) : new Date();
  const dd = String(dt.getDate()).padStart(2, '0');
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const h = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  lines.push(row(`${dd}/${mo}/${dt.getFullYear()}`, `${h}:${mins} ${ampm}`));

  lines.push(`Bill No:${bill.billNumber}`);
  if (bill.billerName?.trim()) lines.push(`Biller Name:${bill.billerName.trim()}`);
  if (bill.customerName.trim()) lines.push(`Customer: ${bill.customerName.trim()}`);
  if (bill.customerPhone.trim()) lines.push(`Phone: ${bill.customerPhone.trim()}`);
  lines.push(rule);

  // --- Items (4 columns: Name | Qty | SP | Amt) ---
  // widths: name=14, space+qty=4, space+sp=7, space+amt=7  → total 32
  const C_NAME = 14;
  lines.push(
    'Item Name'.padEnd(C_NAME) +
    ' ' + 'Qty'.padStart(3) +
    ' ' + 'SP'.padStart(6) +
    ' ' + 'Amt'.padStart(6),
  );
  lines.push(rule);

  let totalQty = 0;
  for (const it of bill.items) {
    totalQty += it.qty;
    const qtyFmt = Number.isInteger(it.qty) ? `${it.qty}` : it.qty.toFixed(1);
    const spFmt = it.rate.toFixed(2);
    const amtFmt = it.amount.toFixed(2);
    const rawName = it.name.trim();
    if (rawName.length <= C_NAME) {
      lines.push(
        rawName.padEnd(C_NAME) +
        ' ' + qtyFmt.padStart(3) +
        ' ' + spFmt.padStart(6) +
        ' ' + amtFmt.padStart(6),
      );
    } else {
      pushWrapped(lines, rawName);
      lines.push(
        ''.padEnd(C_NAME) +
        ' ' + qtyFmt.padStart(3) +
        ' ' + spFmt.padStart(6) +
        ' ' + amtFmt.padStart(6),
      );
    }
  }
  lines.push(rule);

  // --- Totals ---
  const itemCount = bill.items.length;
  const totalQtyFmt = Number.isInteger(totalQty) ? `${totalQty}` : totalQty.toFixed(1);
  lines.push(`Items/Qty:${itemCount}/${totalQtyFmt}`);
  lines.push('');

  if (bill.cgstAmount > 0.005 && bill.sgstAmount > 0.005) {
    lines.push(row('Taxable:', bill.taxableBase.toFixed(2)));
    lines.push(row(`CGST ${bill.cgstPercent}%:`, bill.cgstAmount.toFixed(2)));
    lines.push(row(`SGST ${bill.sgstPercent}%:`, bill.sgstAmount.toFixed(2)));
  } else if (bill.tax > 0.005) {
    lines.push(row('Taxable:', bill.taxableBase.toFixed(2)));
    lines.push(row(`${bill.taxLabel}:`, bill.tax.toFixed(2)));
  }
  if (bill.discount > 0.005) lines.push(row('Discount:', `-${bill.discount.toFixed(2)}`));

  lines.push(row('Net Amount:', bill.total.toFixed(2)));
  lines.push(rule);
  lines.push(row('Cash Paid:', bill.amountPaid.toFixed(2)));
  lines.push('');
  lines.push(row('', 'Signature'));
  lines.push(rule);

  // --- Footer ---
  lines.push('* Tax not payable on reverse charge basis');
  if (bill.footerNote?.trim()) pushWrapped(lines, bill.footerNote.trim());
  if (bill.footerMessage.trim()) pushWrapped(lines, bill.footerMessage.trim());
  if (bill.bankAccountNumber.trim()) {
    pushWrapped(lines, `A/c. No. : ${bill.bankAccountNumber.trim()}`);
  }
  if (bill.bankIfsc.trim()) pushWrapped(lines, `IFSC : ${bill.bankIfsc.trim()}`);
  lines.push('E&OE');

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
