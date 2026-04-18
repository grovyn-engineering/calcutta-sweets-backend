/**
 * Proportional “instant” POS lines: e.g. sell 400 g from a variant priced per 1 kg pack.
 * Stock is deducted in variant inventory units (float); catalog price is always per that unit.
 */

export type ContentMode = 'MASS_G' | 'VOL_ML';

/** Grams (mass) or millilitres (volume) represented by one inventory count for this variant. */
export function contentPerStockUnit(
  variantLabel: string,
  inventoryUnit: string | null | undefined,
): { base: number; mode: ContentMode } | null {
  const name = variantLabel ?? '';
  const u = (inventoryUnit ?? 'PC').toUpperCase();

  const kg = name.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kg) return { base: parseFloat(kg[1]) * 1000, mode: 'MASS_G' };
  const g = name.match(/(\d+(?:\.\d+)?)\s*(g|gm)\b/i);
  if (g) return { base: parseFloat(g[1]), mode: 'MASS_G' };

  const l = name.match(/(\d+(?:\.\d+)?)\s*(l|ltr|litre)\b/i);
  if (l) return { base: parseFloat(l[1]) * 1000, mode: 'VOL_ML' };
  const ml = name.match(/(\d+(?:\.\d+)?)\s*ml\b/i);
  if (ml) return { base: parseFloat(ml[1]), mode: 'VOL_ML' };

  if (u === 'KG') return { base: 1000, mode: 'MASS_G' };
  if (u === 'GM') return { base: 1, mode: 'MASS_G' };
  if (u === 'LTR') return { base: 1000, mode: 'VOL_ML' };
  if (u === 'ML') return { base: 1, mode: 'VOL_ML' };

  return null;
}

function inventoryBasePerStockUnit(
  variantLabel: string,
  inventoryUnit: string | null | undefined,
): { base: number; mode: ContentMode } {
  const parsed = contentPerStockUnit(variantLabel, inventoryUnit);
  if (parsed) return parsed;
  const u = (inventoryUnit ?? 'PC').toUpperCase();
  if (u === 'KG') return { base: 1000, mode: 'MASS_G' };
  if (u === 'GM') return { base: 1, mode: 'MASS_G' };
  if (u === 'LTR') return { base: 1000, mode: 'VOL_ML' };
  if (u === 'ML') return { base: 1, mode: 'VOL_ML' };
  return { base: 1, mode: 'MASS_G' };
}

function userAmountToBase(
  qty: number,
  displayUnit: string,
  mode: ContentMode,
): number {
  const du = displayUnit.toUpperCase();
  if (mode === 'MASS_G') {
    if (du === 'KG') return qty * 1000;
    if (du === 'GM') return qty;
    return qty;
  }
  if (du === 'LTR' || du === 'L') return qty * 1000;
  if (du === 'ML') return qty;
  return qty;
}

/** Units the cashier can choose for an instant line. */
export function allowedInstantDisplayUnits(
  variantLabel: string,
  inventoryUnit: string | null | undefined,
): string[] {
  const u = (inventoryUnit ?? 'PC').toUpperCase();
  const c = contentPerStockUnit(variantLabel, inventoryUnit);
  if (u === 'KG' || u === 'GM') return ['GM', 'KG'];
  if (u === 'LTR' || u === 'ML') return ['ML', 'LTR'];
  if (u === 'PC') {
    if (!c) return ['PC'];
    return c.mode === 'MASS_G' ? ['PC', 'GM', 'KG'] : ['PC', 'ML', 'LTR'];
  }
  return ['PC'];
}

export function defaultInstantDisplay(
  variantLabel: string,
  inventoryUnit: string | null | undefined,
): { displayQuantity: number; displayUnit: string } {
  const u = (inventoryUnit ?? 'PC').toUpperCase();
  const c = contentPerStockUnit(variantLabel, inventoryUnit);
  if (u === 'KG') return { displayQuantity: 500, displayUnit: 'GM' };
  if (u === 'GM') return { displayQuantity: 250, displayUnit: 'GM' };
  if (u === 'LTR') return { displayQuantity: 500, displayUnit: 'ML' };
  if (u === 'ML') return { displayQuantity: 200, displayUnit: 'ML' };
  if (u === 'PC' && c?.mode === 'MASS_G')
    return { displayQuantity: c.base, displayUnit: 'GM' };
  if (u === 'PC' && c?.mode === 'VOL_ML')
    return { displayQuantity: c.base, displayUnit: 'ML' };
  return { displayQuantity: 1, displayUnit: 'PC' };
}

/**
 * How many variant stock units to deduct for an instant line
 * (`catalogUnitPrice` is always the price for one such unit).
 */
export function computeInstantStockDeduction(
  variantLabel: string,
  inventoryUnit: string | null | undefined,
  displayQuantity: number,
  displayUnit: string,
): number {
  const du = displayUnit.toUpperCase();
  const catalogU = (inventoryUnit ?? 'PC').toUpperCase();

  if (du === 'PC') {
    return Math.max(0, displayQuantity);
  }

  const content = contentPerStockUnit(variantLabel, inventoryUnit);
  if (catalogU === 'PC' && !content) {
    return Math.max(0, displayQuantity);
  }

  const inv = inventoryBasePerStockUnit(variantLabel, inventoryUnit);
  const mode =
    content?.mode ??
    (catalogU === 'KG' || catalogU === 'GM'
      ? 'MASS_G'
      : catalogU === 'LTR' || catalogU === 'ML'
        ? 'VOL_ML'
        : inv.mode);

  const userBase = userAmountToBase(displayQuantity, displayUnit, mode);
  if (inv.base <= 0) return 0;
  return Math.max(0, userBase / inv.base);
}

export function billLineSubtotal(
  stockUnitsToDeduct: number,
  catalogUnitPrice: number,
): number {
  return stockUnitsToDeduct * catalogUnitPrice;
}

export function billDisplayUnitPrice(
  stockUnitsToDeduct: number,
  catalogUnitPrice: number,
  displayQuantity: number,
): number {
  if (!displayQuantity || !Number.isFinite(displayQuantity)) return 0;
  return billLineSubtotal(stockUnitsToDeduct, catalogUnitPrice) / displayQuantity;
}
