/**
 * POS payment modes and receipt payment lines. The API is authoritative for the policy
 * (apps/api/src/orders/payments.ts): legs must equal the bill total to the paisa, and
 * only cash may be over-tendered (change = tendered - cash leg).
 */

export type PaymentLegMethod = 'CASH' | 'UPI' | 'CARD';

/** Mode chosen at checkout. */
export type PosPaymentMode = PaymentLegMethod | 'SPLIT';

export const PAYMENT_LEG_METHODS: PaymentLegMethod[] = ['CASH', 'UPI', 'CARD'];

/** `method` may also be a legacy order-level value (UPI_CARD, ONLINE) for old bills. */
export type PaymentLeg = { method: string; amount: number };

export type PaymentDetails = {
  payments?: PaymentLeg[] | null;
  cashTendered?: number | null;
  changeDue?: number | null;
};

export function paymentLabel(raw: string | null | undefined, empty = '-'): string {
  switch (raw) {
    case 'CASH':
      return 'Cash';
    case 'UPI':
      return 'UPI';
    case 'CARD':
      return 'Card';
    case 'SPLIT':
      return 'Split';
    case 'UPI_CARD':
      return 'UPI / Card';
    case 'ONLINE':
      return 'Online';
    default:
      return raw || empty;
  }
}

/** Paise-safe rupee rounding for client-side previews. */
export function roundRupees(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type ReceiptPaymentRow = { label: string; amount: number };

/**
 * Payment lines printed under the bill total: one "<Mode> Paid" per leg, then
 * "Tendered" and "Change" when cash change was given. Without legs the whole total is
 * shown against `fallbackMode` (old orders, or callers that only know the mode).
 */
export function receiptPaymentRows(
  details: PaymentDetails,
  total: number,
  fallbackMode?: string | null,
): ReceiptPaymentRow[] {
  const legs =
    details.payments && details.payments.length > 0
      ? details.payments
      : [{ method: fallbackMode || 'CASH', amount: total }];
  const rows = legs.map((l) => ({
    label: `${paymentLabel(l.method, 'Cash')} Paid`,
    amount: l.amount,
  }));
  const change = details.changeDue ?? 0;
  if (change > 0.005 && details.cashTendered != null) {
    rows.push({ label: 'Tendered', amount: details.cashTendered });
    rows.push({ label: 'Change', amount: change });
  }
  return rows;
}

export type SplitRow = { method: PaymentLegMethod; amount: number | null };

export type CheckoutPaymentPlan = {
  /** Legs to send; omitted for single-mode bills so the server charges its own total. */
  payments?: { method: PaymentLegMethod; amount: number }[];
  cashTendered?: number;
  /** Bill total minus what is covered; > 0 means short. */
  remaining: number;
  change: number;
  ready: boolean;
  /** Why the bill cannot be generated yet. */
  blocker?: string;
};

const paise = (n: number) => Math.round(n * 100);

/**
 * Client preview of the server payment policy for the checkout panel. Works in paise
 * so 0.1 + 0.2 style drift never blocks an exact payment.
 */
export function planCheckoutPayment(
  mode: PosPaymentMode | null,
  total: number,
  cashReceived: number | null,
  splitRows: SplitRow[],
): CheckoutPaymentPlan {
  const totalP = paise(total);
  if (!mode) {
    return { remaining: total, change: 0, ready: false, blocker: 'Select a payment mode first.' };
  }
  const tenderFor = (cashLegP: number) => {
    if (cashReceived == null) return { change: 0, shortP: 0 };
    const tenderedP = paise(cashReceived);
    return tenderedP >= cashLegP
      ? { change: (tenderedP - cashLegP) / 100, shortP: 0 }
      : { change: 0, shortP: cashLegP - tenderedP };
  };

  if (mode !== 'SPLIT') {
    const { change, shortP } = mode === 'CASH' ? tenderFor(totalP) : { change: 0, shortP: 0 };
    return {
      ...(mode === 'CASH' && cashReceived != null ? { cashTendered: cashReceived } : {}),
      remaining: shortP / 100,
      change,
      ready: shortP === 0,
      blocker: shortP > 0 ? `Cash short by ₹${(shortP / 100).toFixed(2)}` : undefined,
    };
  }

  const legs = splitRows
    .filter((r) => r.amount != null && paise(r.amount) > 0)
    .map((r) => ({ method: r.method, amount: paise(r.amount ?? 0) / 100 }));
  const remainingP = totalP - legs.reduce((s, l) => s + paise(l.amount), 0);
  const cashLeg = legs.find((l) => l.method === 'CASH');
  const { change, shortP } = cashLeg ? tenderFor(paise(cashLeg.amount)) : { change: 0, shortP: 0 };
  let blocker: string | undefined;
  if (legs.length === 0) blocker = 'Enter the amount paid in each mode.';
  else if (remainingP > 0) blocker = `Payment short by ₹${(remainingP / 100).toFixed(2)}`;
  else if (remainingP < 0)
    blocker = `Split exceeds the bill by ₹${(-remainingP / 100).toFixed(2)}`;
  else if (shortP > 0) blocker = `Cash short by ₹${(shortP / 100).toFixed(2)}`;
  return {
    payments: legs,
    ...(cashLeg && cashReceived != null ? { cashTendered: cashReceived } : {}),
    remaining: remainingP / 100,
    change,
    ready: blocker == null,
    blocker,
  };
}
