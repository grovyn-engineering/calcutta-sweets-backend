const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const istDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

/** IST calendar day (`YYYY-MM-DD`) `delta` days from today; the API buckets sales by IST day. */
export function istDayOffset(delta = 0): string {
  // IST has no daylight saving, so whole-day steps are exact.
  return istDayFormat.format(new Date(Date.now() + delta * 86_400_000));
}

/**
 * Turns a calendar day (`YYYY-MM-DD`) into a short label for chart axes.
 */
export function chartDayLabel(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Full INR formatting (symbol + two decimals) for stats and tables. */
export function formatInrFull(n: number): string {
  return inrFull.format(Number.isFinite(n) ? n : 0);
}

const inrDigits = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Same grouping/decimals as {@link formatInrFull}, but ASCII `Rs.` prefix.
 * Use in jsPDF: bundled fonts do not include ₹ (U+20B9), which shows as a stray glyph.
 */
export function formatInrForPdf(n: number): string {
  return `Rs. ${inrDigits.format(Number.isFinite(n) ? n : 0)}`;
}
