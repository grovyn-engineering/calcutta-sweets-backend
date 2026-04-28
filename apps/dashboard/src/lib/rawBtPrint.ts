/**
 * RawBT (ru.a402d.rawbtprinter) — fallback printing on Android via intent URL.
 * @see https://github.com/402d/DemoRawBtPrinter — rawbt:base64,<data>
 *
 * One-time in RawBT: pick USB printer → Settings → Auto print + Skip preview → set default printer.
 */

import type { NativeAndroidBillPayload } from '@/lib/usbPrinter';

/** Conservative limit; very long receipts may need Generate bill instead. */
const MAX_RAWBT_HREF_CHARS = 48_000;

export function isLikelyAndroidForRawBt(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function utf8ToBase64(text: string): string {
  if (typeof TextEncoder !== 'undefined') {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }
  // Android 7 WebView fallback.
  return btoa(unescape(encodeURIComponent(text)));
}

export function buildPlainTextReceiptForRawBt(bill: NativeAndroidBillPayload): string {
  const w = 32;
  const cut = (s: string) => (s.length <= w ? s : `${s.slice(0, w - 3)}...`);
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
    const l = cut(left);
    const r = cut(right);
    const spaces = Math.max(1, w - l.length - r.length);
    return `${l}${' '.repeat(spaces)}${r}`;
  };
  const rule = '-'.repeat(w);
  const lines: string[] = [];

  // RawBT formatting tags: force clean state + Latin codepage before content.
  lines.push('{reset}');
  lines.push('{codepage:0}');
  lines.push('{center}{b}' + cut(bill.shopName.toUpperCase()) + '{/b}');
  lines.push('{left}');
  if (bill.shopAddress.trim()) pushWrapped(lines, bill.shopAddress.trim());
  if (bill.shopPhone.trim()) pushWrapped(lines, `Contact: ${bill.shopPhone.trim()}`);
  if (bill.showShopGstin && bill.gstin.trim()) pushWrapped(lines, `GSTIN: ${bill.gstin.trim()}`);
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
    const name = it.name.trim().slice(0, 16);
    lines.push(row(name, `x${qty} Rs.${it.amount.toFixed(2)}`));
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
  lines.push('{b}' + row('TOTAL:', `Rs.${bill.total.toFixed(2)}`) + '{/b}');
  if (bill.paymentMode.trim()) pushWrapped(lines, bill.paymentMode.trim());
  lines.push(rule);
  if (bill.footerNote?.trim()) pushWrapped(lines, bill.footerNote.trim());
  if (bill.footerMessage.trim()) pushWrapped(lines, bill.footerMessage.trim());
  if (bill.bankAccountNumber.trim()) pushWrapped(lines, `A/c: ${bill.bankAccountNumber.trim()}`);
  if (bill.bankIfsc.trim()) pushWrapped(lines, `IFSC: ${bill.bankIfsc.trim()}`);
  lines.push('');
  lines.push('Thank you. Come again!');
  // Feed buffer reduces top/bottom clipping on some thermal mechanisms.
  lines.push('');
  lines.push('');
  lines.push('{cut}');
  return lines.join('\n');
}

export type RawBtLaunchResult = { ok: true } | { ok: false; error: string };

/**
 * Sends UTF-8 receipt text as base64 (RawBT raw stream — plain text on 58/80mm).
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
  const b64 = utf8ToBase64(text);
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
