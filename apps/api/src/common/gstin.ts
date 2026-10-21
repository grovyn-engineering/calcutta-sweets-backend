/**
 * GSTIN: 2-digit state code, 10-char PAN, entity number, `Z`, checksum. Empty is allowed
 * because forms send '' for a cleared optional field.
 */
export const GSTIN_OR_EMPTY = /^$|^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export const GSTIN_MESSAGE =
  'GSTIN must be 15 characters in the format 22AAAAA0000A1Z5';

/** Indian PIN code: 6 digits, or empty. */
export const PINCODE_OR_EMPTY = /^$|^\d{6}$/;
