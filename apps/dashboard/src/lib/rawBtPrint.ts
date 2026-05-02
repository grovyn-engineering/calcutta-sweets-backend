/**
 * RawBT (ru.a402d.rawbtprinter) — fallback printing on Android via intent URL.
 * @see https://github.com/402d/DemoRawBtPrinter — rawbt:base64,<data>
 *
 * `rawbt:base64` sends a **raw byte stream** to the printer. RawBT `{tags}` are for
 * template mode and are often printed as plain text in this path — we use plain
 * UTF-8 lines plus ESC/POS feed + cut.
 *
 * One-time in RawBT: pick USB printer → Settings → Auto print + Skip preview → set default printer.
 */

import type { NativeAndroidBillPayload } from '@/lib/usbPrinter';

/** Conservative limit; very long receipts may need Generate bill instead. */
const MAX_RAWBT_HREF_CHARS = 48_000;

const ESC = 0x1b;
const GS = 0x1d;

/** 80mm thermal profile (Font A): 48 printable columns. */
export const THERMAL_RECEIPT_WIDTH = 48;

/** When shop profile fields are empty, match printed stationery defaults. */
export const THERMAL_FALLBACK_SHOP_NAME = 'CALCUTTA SWEETS';
export const THERMAL_FALLBACK_ADDRESS =
  'Gurudwara Complex, Tatibandh, Raipur (C.G)';
export const THERMAL_FALLBACK_PHONE = '9993060082';
export const THERMAL_FALLBACK_GSTIN = '22AGPPB9798P1ZF';
export const THERMAL_FALLBACK_FSSAI = '10522016000762';
export const THERMAL_FALLBACK_BANK_AC = '72910200000019';
export const THERMAL_FALLBACK_IFSC = 'BARB0DBTATI';

export const THERMAL_POWERED_BY_LINE = 'Powered By Grovyn';

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
 * Small tail after last line (reference slip style), then cut.
 */
export function textToRawBtPrinterBytes(body: string): Uint8Array {
  const bodyBytes = utf8Encode(body);
  const prefix = new Uint8Array([ESC, 0x40]); // ESC @ init
  const nl = new Uint8Array([0x0a, 0x0a, 0x0a]);
  const feedLines = 4;
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

/** Fix `.,` joins and drop redundant `, Raipur, Chhattisgarh` when `(C.G)` line already has Raipur. */
function normalizeShopAddressForThermal(raw: string): string {
  let s = raw
    .replace(/\s+/g, ' ')
    .replace(/\.\s*,/g, ',')
    .replace(/,\s*,/g, ',')
    .trim();
  const hasRaipurCg = /\bRaipur\s*\(\s*C\.G\s*\)/i.test(s);
  if (hasRaipurCg && /,\s*Raipur,\s*Chhattisgarh\s*$/i.test(s)) {
    s = s.replace(/,\s*Raipur,\s*Chhattisgarh\s*$/i, '');
  }
  return s.trim();
}

/** Break at spaces; long tokens split hard. */
function wrapWords(text: string, maxWidth: number): string[] {
  const input = text.trim();
  if (!input) return [];
  const words = input.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  const flush = () => {
    if (current) {
      lines.push(current);
      current = '';
    }
  };
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxWidth) {
      current = candidate;
      continue;
    }
    flush();
    if (word.length <= maxWidth) {
      current = word;
      continue;
    }
    let rest = word;
    while (rest.length > maxWidth) {
      lines.push(rest.slice(0, maxWidth));
      rest = rest.slice(maxWidth);
    }
    current = rest;
  }
  flush();
  return lines;
}

function buildThermalReceiptBody(bill: NativeAndroidBillPayload): string {
  const w = THERMAL_RECEIPT_WIDTH;
  const centerLine = (s: string) => {
    const t = s.trim();
    if (!t) return '';
    if (t.length >= w) return t.slice(0, w);
    const left = Math.floor((w - t.length) / 2);
    return `${' '.repeat(left)}${t}`;
  };
  const cutStr = (s: string, max: number) =>
    s.length <= max ? s : `${s.slice(0, Math.max(0, max - 3))}...`;
  const row = (left: string, right = '', leftMax = w) => {
    const l = cutStr(left, leftMax);
    const r = cutStr(right, w);
    const spaces = Math.max(1, w - l.length - r.length);
    return `${l}${' '.repeat(spaces)}${r}`;
  };

  const shopName =
    bill.shopName.trim() || THERMAL_FALLBACK_SHOP_NAME;
  const shopAddress = normalizeShopAddressForThermal(
    bill.shopAddress.trim() || THERMAL_FALLBACK_ADDRESS,
  );
  const shopPhone = bill.shopPhone.trim() || THERMAL_FALLBACK_PHONE;
  const gstin =
    bill.showShopGstin && bill.gstin.trim()
      ? bill.gstin.trim()
      : bill.showShopGstin
        ? THERMAL_FALLBACK_GSTIN
        : '';
  const fssai =
    bill.fssaiNumber.trim() || THERMAL_FALLBACK_FSSAI;
  const bankAc =
    bill.bankAccountNumber.trim() || THERMAL_FALLBACK_BANK_AC;
  const bankIfsc = bill.bankIfsc.trim() || THERMAL_FALLBACK_IFSC;

  const rule = '-'.repeat(w);
  const lines: string[] = [];

  // ESC @ init already resets the printer; leading blanks risk clipping on
  // some RawBT/driver combos — put them AFTER the header block instead.
  lines.push(centerLine(shopName.toUpperCase()));
  lines.push('');
  for (const ln of wrapWords(shopAddress, w)) lines.push(centerLine(ln));
  lines.push(centerLine(`Contact No. :- ${shopPhone}`));
  if (gstin) lines.push(centerLine(`GSTIN: ${gstin}`));
  lines.push(centerLine(`FSSAI No.${fssai}`));
  if (bill.showCustomerGstin && bill.customerGstin.trim()) {
    lines.push(centerLine(`Cust GSTIN: ${bill.customerGstin.trim()}`));
  }
  lines.push(rule);
  lines.push(centerLine((bill.billTitle || 'TAX INVOICE').toUpperCase()));

  const issued = bill.issuedAt ? new Date(bill.issuedAt) : new Date();
  const dateStr = issued.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = issued
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  lines.push(row(dateStr, timeStr));
  lines.push(`Bill No:${bill.billNumber}`);
  if (bill.billerName?.trim()) {
    lines.push(`Biller Name:${bill.billerName.trim()}`);
  }
  if (bill.customerName.trim()) {
    for (const ln of wrapWords(`Customer: ${bill.customerName.trim()}`, w)) {
      lines.push(ln);
    }
  }
  if (bill.customerPhone.trim()) {
    lines.push(`Phone: ${bill.customerPhone.trim()}`);
  }
  lines.push(rule);

  const nameW = 27;
  const qtyW = 4;
  const spW = 7;
  const amtW = 7;
  lines.push(
    `${'Item Name'.padEnd(nameW)} ${'Qty'.padStart(qtyW)} ${'SP'.padStart(spW)} ${'Amt'.padStart(amtW)}`,
  );

  const pushItemRows = (
    name: string,
    qtyStr: string,
    sp: number,
    amt: number,
  ) => {
    const spS = sp.toFixed(2);
    const amtS = amt.toFixed(2);
    const suffix = ` ${qtyStr.padStart(qtyW)} ${spS.padStart(spW)} ${amtS.padStart(amtW)}`;
    const maxName = nameW;
    if (name.length <= maxName) {
      lines.push(`${name.padEnd(nameW)}${suffix}`);
      return;
    }
    lines.push(`${name.slice(0, maxName)}${suffix}`);
    let rest = name.slice(maxName);
    while (rest.length > 0) {
      lines.push(`  ${rest.slice(0, w - 2)}`);
      rest = rest.slice(w - 2);
    }
  };

  for (const it of bill.items) {
    const qty = Number.isInteger(it.qty) ? `${it.qty}` : it.qty.toFixed(1);
    pushItemRows(it.name.trim(), qty, it.rate, it.amount);
  }
  lines.push(rule);

  const itemKinds = bill.items.length;
  const qtySum = bill.items.reduce((s, x) => s + x.qty, 0);
  const allIntQty = bill.items.every((x) => Number.isInteger(x.qty));
  const qtyPart = allIntQty
    ? String(Math.round(qtySum))
    : qtySum.toFixed(2);
  lines.push(`Items/Qty:${itemKinds}/${qtyPart}`);
  lines.push(rule);

  lines.push(row('Taxable:', `Rs.${bill.taxableBase.toFixed(2)}`));
  if (bill.cgstAmount > 0.005 && bill.sgstAmount > 0.005) {
    lines.push(row(`CGST ${bill.cgstPercent}%:`, `Rs.${bill.cgstAmount.toFixed(2)}`));
    lines.push(row(`SGST ${bill.sgstPercent}%:`, `Rs.${bill.sgstAmount.toFixed(2)}`));
  } else if (bill.tax > 0.005) {
    lines.push(row(`${bill.taxLabel}:`, `Rs.${bill.tax.toFixed(2)}`));
  }
  if (bill.discount > 0.005) {
    lines.push(row('Discount:', `-Rs.${bill.discount.toFixed(2)}`));
  }
  lines.push(row('Net Amount:', bill.total.toFixed(2)));
  lines.push(rule);

  const mode = bill.paymentMode.trim();
  const payLabel =
    mode.toLowerCase() === 'cash'
      ? 'Cash Paid:'
      : mode
        ? `${cutStr(mode, 18)} Paid:`
        : 'Paid:';
  lines.push(row(payLabel, bill.amountPaid.toFixed(2)));

  lines.push('');
  lines.push('');
  lines.push(row('', 'Signature'));

  lines.push(rule);
  if (bill.footerNote?.trim()) {
    for (const ln of wrapWords(bill.footerNote.trim(), w)) {
      lines.push(ln);
    }
  }
  if (bill.footerMessage.trim()) {
    lines.push(centerLine(bill.footerMessage.trim()));
  }
  lines.push(centerLine(`A/c. No. : ${bankAc}`));
  lines.push(centerLine(`IFSC : ${bankIfsc}`));
  lines.push(centerLine(shopName));

  const powered = (bill.poweredBy?.trim() || THERMAL_POWERED_BY_LINE).slice(
    0,
    w,
  );
  lines.push(row('E&OE', powered));

  return lines.join('\n');
}

export function buildPlainTextReceiptForRawBt(bill: NativeAndroidBillPayload): string {
  return buildThermalReceiptBody(bill);
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
        'RawBT runs on Android. Install "RawBT" from Play Store, set USB printer, enable Auto print + Skip preview.',
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
  const text =
    bill.thermalPlainText?.trim() || buildPlainTextReceiptForRawBt(bill);
  return launchRawBtPrintFromText(text);
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