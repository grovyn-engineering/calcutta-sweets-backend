/**
 * Business-day helpers. Every shop runs on India Standard Time (UTC+05:30, no DST),
 * so days, months and financial years are cut at IST midnight, not UTC midnight.
 */
const IST_OFFSET_MS = 330 * 60 * 1000;

/** `YYYY-MM-DD` of the IST calendar day containing `d`. */
export function istDayKey(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `YYYY-MM` of the IST calendar month containing `d`. */
export function istMonthKey(d: Date): string {
  return istDayKey(d).slice(0, 7);
}

/** Instant at which the IST day `YYYY-MM-DD` starts. */
export function istDayStart(dayKey: string): Date {
  return new Date(
    new Date(`${dayKey}T00:00:00.000Z`).getTime() - IST_OFFSET_MS,
  );
}

export function addDays(dayKey: string, delta: number): string {
  const t = new Date(`${dayKey}T00:00:00.000Z`);
  t.setUTCDate(t.getUTCDate() + delta);
  return t.toISOString().slice(0, 10);
}

/** Instant at which the IST month `YYYY-MM` starts. */
export function istMonthStart(monthKey: string): Date {
  return istDayStart(`${monthKey}-01`);
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + delta, 1));
  return t.toISOString().slice(0, 7);
}

/**
 * Indian financial year (April–March) containing `d`, e.g. 2026-04-01 IST → `26-27`.
 */
export function istFinancialYear(d: Date): {
  startYear: number;
  label: string;
} {
  const [y, m] = istMonthKey(d).split('-').map(Number);
  const startYear = m >= 4 ? y : y - 1;
  const a = String(startYear).slice(-2);
  const b = String(startYear + 1).slice(-2);
  return { startYear, label: `${a}-${b}` };
}
