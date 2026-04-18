import type { CustomerFormValues } from '@/components/CustomerDetails';

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
  invoiceNo: string;
  issuedAt?: string;
  customer: CustomerFormValues | null;
  lines: InvoiceLineInput[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  discount: number;
  total: number;
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
  return `<div class="box">
        <div class="box-title">Bill to</div>
        <div><strong>${esc(data.customer.name)}</strong></div>
        <div>Mobile: ${esc(data.customer.phone)}</div>
        ${data.customer.email ? `<div>${esc(data.customer.email)}</div>` : ''}
        ${data.customer.address ? `<div class="pre">${esc(data.customer.address)}</div>` : ''}
        ${data.customer.notes ? `<div class="note">Note: ${esc(data.customer.notes)}</div>` : ''}
      </div>`;
}

function customerBlockReceipt(data: PrintInvoiceInput): string {
  if (!data.customer) {
    return '<div class="cust muted">Walk-in</div>';
  }
  return `<div class="cust">
    <strong>${esc(data.customer.name)}</strong>
    · ${esc(data.customer.phone)}
  </div>`;
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${esc(data.invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    html {
      margin: 0;
      padding: 0;
      height: auto;
    }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #1a110c;
      margin: 0 auto;
      padding: 4mm 3mm;
      width: 72mm;
      max-width: 72mm;
      min-height: 0;
      height: auto !important;
      font-size: 10px;
      line-height: 1.3;
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
    .meta { font-size: 9px; margin: 6px 0; color: #3d2818; }
    .meta div { margin: 1px 0; }
    .cust { font-size: 9px; margin: 6px 0; padding: 4px 0; border-top: 1px dashed #b8a08a; border-bottom: 1px dashed #b8a08a; }
    .cust.muted { color: #6b4a30; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9px; }
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
    td { padding: 3px 2px 4px 0; vertical-align: top; border-bottom: 1px dotted #e0d5c8; }
    td.num { text-align: right; white-space: nowrap; }
    .item-name { font-weight: 600; }
    .item-meta { color: #5c4030; font-size: 8px; margin-top: 1px; }
    .item-block:last-child td { border-bottom: none; }
    .totals { margin-top: 8px; font-size: 9px; }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 0; gap: 8px; }
    .totals-row.grand { font-size: 11px; font-weight: 700; border-top: 2px solid #1a110c; margin-top: 4px; padding-top: 6px; }
    .footer { margin-top: 10px; padding-top: 6px; border-top: 1px dashed #b8a08a; font-size: 8px; color: #6b4a30; text-align: center; }
    /* Browsers often ignore custom roll sizes; thermal output is still correct when the printer is chosen. */
    @page { margin: 2mm; size: 80mm auto; }
    @media print {
      .print-hint { display: none !important; }
      html {
        height: auto !important;
        min-height: 0 !important;
      }
      body {
        padding: 2mm 2mm 3mm;
        width: 72mm;
        max-width: 72mm;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <p class="print-hint">
    <strong>Testing:</strong> Open <strong>Destination</strong> and pick your <strong>TVS / thermal printer</strong>.
    &quot;Save as PDF&quot; always uses a full sheet, so the receipt looks tiny with empty space below. If you see paper size, choose 80&nbsp;mm or the driver&apos;s roll option.
  </p>
  <div class="head">
    <h1>${esc(data.shopName)}</h1>
    <div class="sub">Calcutta Sweets · Shop ${esc(data.shopCode)}</div>
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
    <div class="totals-row"><span>Subtotal</span><span>₹${formatMoney(data.subtotal)}</span></div>
    <div class="totals-row"><span>GST (${(data.gstRate * 100).toFixed(0)}%)</span><span>₹${formatMoney(data.gstAmount)}</span></div>
    <div class="totals-row"><span>Discount</span><span>₹${formatMoney(data.discount)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>₹${formatMoney(data.total)}</span></div>
  </div>
  <div class="footer">Thank you. Computer-generated bill.</div>
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
    .tagline { color: #6b4a30; font-size: 9pt; margin-bottom: 16px; }
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
  <div class="tagline">Calcutta Sweets · Est. 2000 · Shop ${esc(data.shopCode)}</div>
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
    <div class="totals-row"><span>Subtotal</span><span>₹${formatMoney(data.subtotal)}</span></div>
    <div class="totals-row"><span>GST (${(data.gstRate * 100).toFixed(0)}%)</span><span>₹${formatMoney(data.gstAmount)}</span></div>
    <div class="totals-row"><span>Discount</span><span>₹${formatMoney(data.discount)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>₹${formatMoney(data.total)}</span></div>
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
