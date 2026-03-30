import { Unit } from '@prisma/client';

export class UpdateVariantDto {
  quantity?: number;
  minStock?: number | null;
  price?: number;
  costPrice?: number | null;
  sku?: string | null;
  unit?: Unit;
  hsnCode?: string | null;
}
