import { BadRequestException } from '@nestjs/common';

/** Indian mobile without country code: 10 digits, first digit 6–9. */
export const INDIAN_MOBILE_10 = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(
  input: string | undefined | null,
): string {
  return (input ?? '').replace(/\D/g, '').slice(0, 10);
}

export function assertIndianMobile10(
  digits: string,
  fieldLabel = 'Mobile number',
): void {
  if (!INDIAN_MOBILE_10.test(digits)) {
    throw new BadRequestException(
      `${fieldLabel} must be exactly 10 digits (digits only, starting with 6–9)`,
    );
  }
}

/** For optional POS / profile phone: null if empty; otherwise normalized + validated. */
export function optionalIndianMobileOrNull(
  raw: string | undefined | null,
): string | null {
  const d = normalizeIndianMobile(raw);
  if (d === '') return null;
  assertIndianMobile10(d);
  return d;
}
