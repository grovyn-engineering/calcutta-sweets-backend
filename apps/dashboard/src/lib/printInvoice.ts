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
  /** Bill header date/time. Omit for the current time; use the stored sale time when reprinting. */
  issuedAt?: string;
  customer: CustomerFormValues | null;
  lines: InvoiceLineInput[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  discount: number;
  total: number;
};

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

/**
 * Opens the invoice HTML in a new window and runs the browser print dialog.
 * @returns `false` if the window was blocked.
 */
export function openPrintableInvoice(data: PrintInvoiceInput): boolean {
  const when = data.issuedAt ? new Date(data.issuedAt) : new Date();
  const rows = data.lines.map((line) => {
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
  });

  const customerBlock = data.customer
    ? `<div class="box">
        <div class="box-title">Bill to</div>
        <div><strong>${esc(data.customer.name)}</strong></div>
        <div>Mobile: ${esc(data.customer.phone)}</div>
        ${data.customer.email ? `<div>${esc(data.customer.email)}</div>` : ''}
        ${data.customer.address ? `<div class="pre">${esc(data.customer.address)}</div>` : ''}
        ${data.customer.notes ? `<div class="note">Note: ${esc(data.customer.notes)}</div>` : ''}
      </div>`
    : '<div class="box muted">Walk-in customer</div>';

  const html = `<!DOCTYPE html>
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
    <div><strong>Date</strong> ${esc(when.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))}</div>
    <div><strong>Time</strong> ${esc(when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}</div>
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
      ${rows.join('')}
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

  // Avoid `noopener` in the feature string — some browsers still open a tab but return `null` from `window.open`.
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

/** Compact bill reference derived from the order id (what we show on printed invoices). */
export function orderIdToInvoiceRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 12).toUpperCase();
}
