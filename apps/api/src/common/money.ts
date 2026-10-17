import { Prisma } from '@calcutta/database';

export type DecimalLike = Prisma.Decimal | number | string;

export function dec(v: DecimalLike | null | undefined): Prisma.Decimal {
  return new Prisma.Decimal(v ?? 0);
}

/** Rupees, rounded half-up to paise. */
export function money(v: DecimalLike): Prisma.Decimal {
  return dec(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Stock quantity, rounded to 3 dp (grams for KG items). */
export function qty(v: DecimalLike): Prisma.Decimal {
  return dec(v).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);
}

export function num(v: DecimalLike | null | undefined): number {
  return v == null ? 0 : Number(v);
}

/** Tax contained in a GST-inclusive amount: amount × r / (100 + r). */
export function inclusiveTax(amount: DecimalLike, ratePercent: DecimalLike) {
  const r = dec(ratePercent);
  if (r.lte(0)) return dec(0);
  return money(dec(amount).mul(r).div(r.add(100)));
}
