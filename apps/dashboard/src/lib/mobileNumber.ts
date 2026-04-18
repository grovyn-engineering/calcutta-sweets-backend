import type { Rule } from "antd/es/form";

/**
 * Indian mobile without country code: exactly 10 digits, first digit 6–9.
 */
export const INDIAN_MOBILE_10_DIGIT = /^[6-9]\d{9}$/;

export function digitsOnlyMobile(value: unknown): string {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

/** Strips non-digits; caps at 10 - use with Form.Item `normalize`. */
export function normalizeMobileFormValue(value: unknown): string {
  return digitsOnlyMobile(value);
}

export const indianMobileRequiredRules: Rule[] = [
  { required: true, message: "Enter a 10-digit mobile number" },
  {
    pattern: INDIAN_MOBILE_10_DIGIT,
    message: "Use 10 digits only, starting with 6–9",
  },
];

/** Empty is allowed; if filled, must be exactly 10 valid digits. */
export const indianMobileOptionalRules: Rule[] = [
  {
    validator(_rule, value) {
      const raw = String(value ?? "").trim();
      if (!raw) return Promise.resolve();
      const d = digitsOnlyMobile(raw);
      if (INDIAN_MOBILE_10_DIGIT.test(d)) return Promise.resolve();
      return Promise.reject(
        new Error("Enter a valid 10-digit mobile number (digits only)"),
      );
    },
  },
];
