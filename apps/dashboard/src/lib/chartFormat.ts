const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/**
 * Turns a UTC calendar day (`YYYY-MM-DD`) into a short label for chart axes.
 */
export function chartDayLabel(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Full INR formatting (symbol + two decimals) for stats and tables. */
export function formatInrFull(n: number): string {
  return inrFull.format(Number.isFinite(n) ? n : 0);
}
