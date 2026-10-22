import type { Rule } from "antd/es/form";

/**
 * GSTIN: 2-digit state code, 10-char PAN, entity number, `Z`, checksum.
 * Same pattern as the API (`apps/api/src/common/gstin.ts`).
 */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Uppercases and strips spaces; caps at 15 - use with Form.Item `normalize`. */
export function normalizeGstinFormValue(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 15);
}

/** Empty is allowed; if filled, must be a well-formed GSTIN. */
export const gstinOptionalRules: Rule[] = [
  {
    validator(_rule, value) {
      const raw = String(value ?? "").trim().toUpperCase();
      if (!raw || GSTIN_PATTERN.test(raw)) return Promise.resolve();
      return Promise.reject(
        new Error("Enter a valid 15-character GSTIN, e.g. 22AAAAA0000A1Z5"),
      );
    },
  },
];

/** Empty is allowed; if filled, must be a 6-digit Indian PIN code. */
export const pincodeOptionalRules: Rule[] = [
  { pattern: /^\d{6}$/, message: "PIN code must be 6 digits" },
];
