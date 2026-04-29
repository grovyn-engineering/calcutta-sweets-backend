import type { CustomerFormValues } from '@/components/CustomerDetails';
import { encodeRawBtBase64Payload } from '@/lib/rawBtPrint';

export type InvoiceLineInput = {
  name: string;
  variantLabel: string;
  barcode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type PrintInvoiceInput = {
  shopName: string;
  shopCode: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  gstNumber?: string | null;
  fssaiNumber?: string | null;
  showGstinOnBill?: boolean;
  invoiceNo: string;
  issuedAt?: string;
  customer: CustomerFormValues | null;
  lines: InvoiceLineInput[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  cgstPercent?: number;
  sgstPercent?: number;
  cgstAmountSplit?: number;
  sgstAmountSplit?: number;
  discount: number;
  total: number;
  /** Screen receipt only: URL for “Back” (e.g. `${origin}/billing-pos`). */
  returnHref?: string | null;
};

export type InvoicePrintFormat = 'a4' | 'receipt';

function esc(s: string | undefined | null): string {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function buildLineRowsA4(data: PrintInvoiceInput): string {
  return data.lines
    .map((line) => {
      const lineTotal = line.quantity * line.unitPrice;
      const variant =
        line.variantLabel && line.variantLabel !== 'Regular'
          ? ` (${esc(line.variantLabel)})`
          : '';
      return `<tr>
      <td>${esc(line.name)}${variant}</td>
      <td class="num">${line.quantity}</td>
      <td>${esc(line.unit)}</td>
      <td class="num">₹${formatMoney(line.unitPrice)}</td>
      <td class="num">₹${formatMoney(lineTotal)}</td>
    </tr>`;
    })
    .join('');
}

function buildLineRowsReceipt(data: PrintInvoiceInput): string {
  return data.lines
    .map((line) => {
      const lineTotal = line.quantity * line.unitPrice;
      const variant =
        line.variantLabel && line.variantLabel !== 'Regular'
          ? ` (${esc(line.variantLabel)})`
          : '';
      return `<tr class="item-block">
      <td colspan="2">
        <div class="item-name">${esc(line.name)}${variant}</div>
        <div class="item-meta">${line.quantity} ${esc(line.unit)} × ₹${formatMoney(line.unitPrice)}</div>
      </td>
      <td class="num amt">₹${formatMoney(lineTotal)}</td>
    </tr>`;
    })
    .join('');
}

function customerBlockA4(data: PrintInvoiceInput): string {
  if (!data.customer) {
    return '<div class="box muted">Walk-in customer</div>';
  }
  const phoneLine = data.customer.phone?.trim()
    ? `<div>Mobile: ${esc(data.customer.phone)}</div>`
    : '';
  const gstinLine = data.customer.gstin?.trim()
    ? `<div>GSTIN: ${esc(data.customer.gstin.trim())}</div>`
    : '';
  return `<div class="box">
        <div class="box-title">Bill to</div>
        <div><strong>${esc(data.customer.name)}</strong></div>
        ${phoneLine}
        ${gstinLine}
        ${data.customer.email ? `<div>${esc(data.customer.email)}</div>` : ''}
        ${data.customer.address ? `<div class="pre">${esc(data.customer.address)}</div>` : ''}
        ${data.customer.notes ? `<div class="note">Note: ${esc(data.customer.notes)}</div>` : ''}
      </div>`;
}

function customerBlockReceipt(data: PrintInvoiceInput): string {
  if (!data.customer) {
    return '<div class="cust muted">Walk-in</div>';
  }
  const phone = data.customer.phone?.trim();
  const gst = data.customer.gstin?.trim();
  const parts: string[] = [];
  if (phone) parts.push(phone);
  if (gst) parts.push(`GSTIN ${gst}`);
  const metaHtml = parts.length
    ? `<div class="cust-meta">${esc(parts.join(' · '))}</div>`
    : '';
  return `<div class="cust">
    <strong>${esc(data.customer.name)}</strong>
    ${metaHtml}
  </div>`;
}

function shopHeaderBlock(
  data: PrintInvoiceInput,
  variant: 'receipt' | 'a4',
): string {
  const c = variant === 'receipt' ? 'sub' : 'shop-extra';
  const ca = variant === 'receipt' ? 'sub addr' : 'shop-extra addr';
  const lines: string[] = [];
  if (data.shopAddress?.trim()) {
    lines.push(`<div class="${ca}">${esc(data.shopAddress.trim())}</div>`);
  }
  if (data.shopPhone?.trim()) {
    lines.push(
      `<div class="${c}">Contact: ${esc(data.shopPhone.trim())}</div>`,
    );
  }
  const showGstin =
    data.showGstinOnBill !== false && Boolean(data.gstNumber?.trim());
  if (showGstin) {
    lines.push(
      `<div class="${c}">GSTIN: ${esc(data.gstNumber!.trim())}</div>`,
    );
  }
  if (data.fssaiNumber?.trim()) {
    lines.push(
      `<div class="${c}">FSSAI No. ${esc(data.fssaiNumber.trim())}</div>`,
    );
  }
  return lines.join('');
}

function totalsRowsHtml(data: PrintInvoiceInput): string {
  const hasSplitFields =
    data.cgstAmountSplit != null &&
    data.sgstAmountSplit != null &&
    data.cgstPercent != null &&
    data.sgstPercent != null;
  const split =
    hasSplitFields && (data.gstAmount ?? 0) > 0.005;
  const base = data.subtotal;

  let taxBlock: string;
  if (split) {
    const cgst = data.cgstAmountSplit!;
    const sgst = data.sgstAmountSplit!;
    const cp = data.cgstPercent!;
    const sp = data.sgstPercent!;
    taxBlock = `<div class="totals-row"><span>Subtotal</span><span>₹${formatMoney(base)}</span></div>
    <div class="totals-row"><span>CGST (${cp}%)</span><span>₹${formatMoney(cgst)}</span></div>
    <div class="gst-on">on ₹${formatMoney(base)}</div>
    <div class="totals-row"><span>SGST (${sp}%)</span><span>₹${formatMoney(sgst)}</span></div>
    <div class="gst-on">on ₹${formatMoney(base)}</div>`;
  } else {
    taxBlock = `<div class="totals-row"><span>Subtotal</span><span>₹${formatMoney(data.subtotal)}</span></div>
    <div class="totals-row"><span>GST (${(data.gstRate * 100).toFixed(0)}%)</span><span>₹${formatMoney(data.gstAmount)}</span></div>`;
  }

  return `${taxBlock}
    <div class="totals-row"><span>Discount</span><span>₹${formatMoney(data.discount)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>₹${formatMoney(data.total)}</span></div>`;
}

/** Plain text body for RawBT (ESC/POS feed+cut appended by encodeRawBtBase64Payload). */
function buildPlainTextReceiptFromPrintInvoiceInput(data: PrintInvoiceInput): string {
  const w = 32;
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

  pushWrapped(lines, data.shopName.toUpperCase());
  if (data.shopAddress?.trim()) pushWrapped(lines, data.shopAddress.trim());
  if (data.shopPhone?.trim()) pushWrapped(lines, `Contact: ${data.shopPhone.trim()}`);
  if (data.showGstinOnBill !== false && data.gstNumber?.trim()) {
    pushWrapped(lines, `GSTIN: ${data.gstNumber.trim()}`);
  }
  if (data.fssaiNumber?.trim()) pushWrapped(lines, `FSSAI: ${data.fssaiNumber.trim()}`);
  lines.push(rule);
  pushWrapped(lines, `Bill: ${data.invoiceNo}`);
  const when = data.issuedAt ? new Date(data.issuedAt) : new Date();
  pushWrapped(
    lines,
    `${when.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
  );
  if (data.customer) {
    pushWrapped(lines, data.customer.name || 'Customer');
    if (data.customer.phone?.trim()) pushWrapped(lines, data.customer.phone.trim());
    if (data.customer.gstin?.trim()) pushWrapped(lines, `GSTIN ${data.customer.gstin.trim()}`);
  } else {
    lines.push('Walk-in');
  }
  lines.push(rule);
  for (const line of data.lines) {
    const variant =
      line.variantLabel && line.variantLabel !== 'Regular'
        ? ` (${line.variantLabel})`
        : '';
    const amt = line.quantity * line.unitPrice;
    const label = `${line.name}${variant}`.trim();
    const right = `Rs.${formatMoney(amt)}`;
    const meta = `${line.quantity} ${line.unit} x Rs.${formatMoney(line.unitPrice)}`;
    if (label.length <= 14) {
      lines.push(row(label.slice(0, 14), right));
    } else {
      pushWrapped(lines, label);
      lines.push(row(`  ${meta}`, right));
    }
  }
  lines.push(rule);
  const hasSplit =
    data.cgstAmountSplit != null &&
    data.sgstAmountSplit != null &&
    data.cgstPercent != null &&
    data.sgstPercent != null &&
    (data.gstAmount ?? 0) > 0.005;
  if (hasSplit) {
    lines.push(row('Subtotal', `Rs.${formatMoney(data.subtotal)}`));
    lines.push(
      row(`CGST ${data.cgstPercent}%`, `Rs.${formatMoney(data.cgstAmountSplit!)}`),
    );
    lines.push(
      row(`SGST ${data.sgstPercent}%`, `Rs.${formatMoney(data.sgstAmountSplit!)}`),
    );
  } else {
    lines.push(row('Subtotal', `Rs.${formatMoney(data.subtotal)}`));
    lines.push(row('GST', `Rs.${formatMoney(data.gstAmount)}`));
  }
  if (data.discount > 0.005) lines.push(row('Discount', `-Rs.${formatMoney(data.discount)}`));
  lines.push(row('TOTAL', `Rs.${formatMoney(data.total)}`));
  lines.push(rule);
  lines.push('Thank you. Calcutta Sweets.');
  return lines.join('\n');
}

function buildInvoiceHtml(data: PrintInvoiceInput, format: InvoicePrintFormat): string {
  const when = data.issuedAt ? new Date(data.issuedAt) : new Date();
  const dateStr = when.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = when.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (format === 'receipt') {
    const rows = buildLineRowsReceipt(data);
    const rawBtPlain = buildPlainTextReceiptFromPrintInvoiceInput(data);
    const rawBtPayloadB64 = encodeRawBtBase64Payload(rawBtPlain);
    const returnHref = (data.returnHref ?? '').trim();
    const returnAttr = returnHref
      ? `href="${esc(returnHref)}"`
      : `href="#" data-fallback-close="1"`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="light" />
  <title>Receipt ${esc(data.invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    html {
      margin: 0;
      padding: 0;
      height: auto;
      color-scheme: light;
    }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #1a110c;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-size: 10px;
      line-height: 1.3;
      background: #ebe4d8;
    }
    .page {
      max-width: 100%;
      padding-left: max(12px, env(safe-area-inset-left, 0px));
      padding-right: max(12px, env(safe-area-inset-right, 0px));
      padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
    }
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: max(10px, env(safe-area-inset-top, 0px)) 0 12px;
      margin-bottom: 8px;
      background: linear-gradient(180deg, #ebe4d8 70%, rgba(235,228,216,0));
    }
    .action-bar a, .action-bar button {
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      padding: 10px 16px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
    }
    .action-bar .btn-back {
      background: #fffef9;
      color: #3d2818;
      border: 1px solid rgba(44, 24, 16, 0.15);
      box-shadow: 0 1px 3px rgba(44, 24, 16, 0.06);
    }
    .action-bar .btn-print {
      background: #c9932d;
      color: #1a110c;
      border: 1px solid #a67c23;
      box-shadow: 0 2px 6px rgba(166, 124, 35, 0.25);
    }
    .action-bar .btn-rawbt {
      background: #fffef9;
      color: #a67c23;
      border: 2px solid #c9932d;
      box-shadow: 0 1px 3px rgba(44, 24, 16, 0.06);
    }
    .receipt-paper {
      margin: 0 auto;
      padding: 4mm 4mm;
      width: 100%;
      max-width: 72mm;
      background: #fffef9;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(44, 24, 16, 0.08);
    }
    .print-hint {
      font-size: 10px;
      line-height: 1.35;
      color: #5c4030;
      margin: 0 0 10px;
      padding: 8px 10px;
      background: #fff4e0;
      border: 1px solid #e8c48a;
      border-radius: 6px;
    }
    .print-hint strong { color: #1a110c; }
    .head { text-align: center; margin-bottom: 6px; }
    h1 {
      margin: 0 0 2px;
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .sub { color: #5c4030; font-size: 9px; }
    .sub.addr { white-space: pre-wrap; }
    .gst-on {
      font-size: 7px;
      color: #5c4030;
      text-align: right;
      margin: -3px 0 4px;
      padding-right: 0;
    }
    .meta { font-size: 9px; margin: 6px 0; color: #3d2818; }
    .meta div { margin: 1px 0; }
    .cust { font-size: 9px; margin: 6px 0; padding: 4px 0; border-top: 1px dashed #b8a08a; border-bottom: 1px dashed #b8a08a; }
    .cust-meta { font-size: 8px; color: #5c4030; margin-top: 2px; font-weight: normal; }
    .cust.muted { color: #6b4a30; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8px; table-layout: fixed; }
    th {
      text-align: left;
      border-bottom: 1px solid #1a110c;
      padding: 4px 2px 3px 0;
      font-size: 8px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #3d2818;
    }
    th.num { text-align: right; }
    td { padding: 3px 2px 4px 0; vertical-align: top; border-bottom: 1px dotted #e0d5c8; word-wrap: break-word; overflow-wrap: anywhere; }
    td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .item-name { font-weight: 600; }
    .item-meta { color: #5c4030; font-size: 8px; margin-top: 1px; }
    .item-block:last-child td { border-bottom: none; }
    .totals { margin-top: 8px; font-size: 9px; }
    .totals-row { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; gap: 6px; }
    .totals-row span:first-child { min-width: 0; flex: 1; padding-right: 4px; }
    .totals-row span:last-child { flex-shrink: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .totals-row.grand { font-size: 10px; font-weight: 700; border-top: 2px solid #1a110c; margin-top: 4px; padding-top: 6px; }
    .footer { margin-top: 10px; padding-top: 6px; border-top: 1px dashed #b8a08a; font-size: 8px; color: #6b4a30; text-align: center; }
    @page { margin: 3mm 3mm 12mm 3mm; size: 80mm auto; }
    @media print {
      @page { margin: 3mm 3mm 12mm 3mm; size: 80mm auto; }
      .action-bar { display: none !important; }
      .print-hint { display: none !important; }
      html {
        height: auto !important;
        min-height: 0 !important;
      }
      body {
        background: #fff !important;
        padding: 0 !important;
      }
      .page {
        padding: 0 !important;
        max-width: none !important;
      }
      .receipt-paper {
        margin: 0 auto !important;
        padding: 2mm 3mm 10mm !important;
        width: 70mm !important;
        max-width: 70mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: #fff !important;
        height: auto !important;
        min-height: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="page">
  <div class="action-bar">
    <a class="btn-back" ${returnAttr}>← Back to POS</a>
    <button type="button" class="btn-print" id="printBillBtn">Print</button>
    <button type="button" class="btn-rawbt" id="rawBtReceiptBtn">RawBT</button>
  </div>
  <div class="receipt-paper">
  <p class="print-hint">
    <strong>Tip:</strong> Tap <strong>Print</strong> for the system print dialog (PDF, network, etc.). On <strong>Android</strong> with the RawBT app, use <strong>RawBT</strong> to send this bill as plain text. For 80&nbsp;mm thermal, pick the matching paper size if the dialog offers it.
  </p>
  <div class="head">
    <h1>${esc(data.shopName)}</h1>
    ${shopHeaderBlock(data, 'receipt')}
    <div class="sub">Shop ${esc(data.shopCode)} · Calcutta Sweets</div>
  </div>
  <div class="meta">
    <div><strong>Bill</strong> ${esc(data.invoiceNo)}</div>
    <div>${esc(dateStr)} · ${esc(timeStr)}</div>
  </div>
  ${customerBlockReceipt(data)}
  <table>
    <thead>
      <tr>
        <th colspan="2">Item</th>
        <th class="num">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="totals">
    ${totalsRowsHtml(data)}
  </div>
  <div class="footer">Thank you. Computer-generated bill.</div>
  </div>
  </div>
  <script>
    (function () {
      var back = document.querySelector('a[data-fallback-close]');
      if (back) {
        back.addEventListener('click', function (e) {
          e.preventDefault();
          if (window.history.length > 1) window.history.back();
          else window.close();
        });
      }
      var btn = document.getElementById('printBillBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          window.focus();
          window.print();
        });
      }
      var rawBtB64 = ${JSON.stringify(rawBtPayloadB64)};
      var rawBtBtn = document.getElementById('rawBtReceiptBtn');
      if (rawBtBtn) {
        rawBtBtn.addEventListener('click', function () {
          if (!/Android/i.test(navigator.userAgent)) {
            alert('RawBT works on Android with the RawBT app. On this computer use Print, or open this receipt on your Android tablet.');
            return;
          }
          if (rawBtB64.length > 45000) {
            alert('Receipt is too long for RawBT.');
            return;
          }
          window.location.href = 'rawbt:base64,' + rawBtB64;
        });
      }
    })();
  </script>
</body>
</html>`;
  }

  const rows = buildLineRowsA4(data);
  const customerBlock = customerBlockA4(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(data.invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #1a110c;
      margin: 0;
      padding: 12mm;
      font-size: 11pt;
      line-height: 1.35;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 18pt;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .tagline { color: #6b4a30; font-size: 9pt; margin-bottom: 8px; }
    .shop-extra { font-size: 9pt; color: #3d2818; margin-bottom: 4px; }
    .shop-extra.addr { white-space: pre-wrap; }
    .meta { display: flex; flex-wrap: wrap; gap: 16px 32px; margin-bottom: 14px; font-size: 10pt; color: #3d2818; }
    .meta strong { color: #1a110c; }
    .box {
      border: 1px solid #c5ad94;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 16px;
      background: #fffef9;
    }
    .box.muted { color: #6b4a30; font-style: italic; }
    .box-title { font-size: 8pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8a6b4a; margin-bottom: 6px; }
    .pre { white-space: pre-wrap; margin-top: 4px; font-size: 10pt; }
    .note { margin-top: 6px; font-size: 9pt; color: #4e3420; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
    th {
      text-align: left;
      border-bottom: 2px solid #1a110c;
      padding: 8px 6px;
      font-size: 8pt;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #3d2818;
    }
    th.num, td.num { text-align: right; }
    td { padding: 8px 6px; border-bottom: 1px solid #e8e2d9; vertical-align: top; }
    .totals { margin-top: 14px; margin-left: auto; width: 100%; max-width: 260px; font-size: 10pt; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .gst-on { font-size: 8pt; color: #6b4a30; text-align: right; margin: -4px 0 6px; }
    .totals-row.grand { font-size: 13pt; font-weight: 700; border-top: 2px solid #1a110c; margin-top: 8px; padding-top: 10px; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px dashed #c5ad94; font-size: 9pt; color: #6b4a30; text-align: center; }
    @page { margin: 10mm; size: A4 portrait; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${esc(data.shopName)}</h1>
  ${shopHeaderBlock(data, 'a4')}
  <div class="tagline">Shop ${esc(data.shopCode)} · Calcutta Sweets</div>
  <div class="meta">
    <div><strong>Invoice no.</strong> ${esc(data.invoiceNo)}</div>
    <div><strong>Date</strong> ${esc(dateStr)}</div>
    <div><strong>Time</strong> ${esc(timeStr)}</div>
  </div>
  ${customerBlock}
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th>Unit</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="totals">
    ${totalsRowsHtml(data)}
  </div>
  <div class="footer">
    Thank you for your visit. For queries, contact the store.<br />
    This is a computer-generated invoice.
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`;
}

export function openPrintableInvoice(
  data: PrintInvoiceInput,
  format: InvoicePrintFormat = 'a4',
): boolean {
  const html = buildInvoiceHtml(data, format);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  const revokeSoon = () =>
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  if (w.document.readyState === 'complete') {
    revokeSoon();
  } else {
    w.addEventListener('load', revokeSoon, { once: true });
  }
  return true;
}

export function makeInvoiceNo(prefix = 'INV'): string {
  const t = Date.now();
  const r = Math.floor(Math.random() * 1e3)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${t.toString(36).toUpperCase()}-${r}`;
}

export function orderIdToInvoiceRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 12).toUpperCase();
}
