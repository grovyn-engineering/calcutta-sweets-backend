/** Units a variant can be stocked and sold in (mirrors the Prisma `Unit` enum). */
export const UNIT_OPTIONS = [
  { value: "KG", label: "KG (by weight)" },
  { value: "GM", label: "GM (by weight)" },
  { value: "LTR", label: "LTR (by volume)" },
  { value: "ML", label: "ML (by volume)" },
  { value: "PC", label: "PC (per piece / pack)" },
];

/**
 * Price policy, kept in step with `PRICE_MIN` / `PRICE_MAX` in apps/api/src/common/money.ts:
 * selling prices are ₹0.01 to ₹10,00,000 with at most 2 decimals (paise).
 * Cost price may be 0.
 */
export const PRICE_MIN = 0.01;
export const PRICE_MAX = 1_000_000;

export const priceInputProps = {
  min: PRICE_MIN,
  max: PRICE_MAX,
  precision: 2,
  step: 1,
} as const;

export const costPriceInputProps = { ...priceInputProps, min: 0 } as const;

export const sellingPriceRules = [
  { required: true, message: "Enter a selling price" },
  {
    type: "number" as const,
    min: PRICE_MIN,
    max: PRICE_MAX,
    message: "Price must be between ₹0.01 and ₹10,00,000",
  },
];
