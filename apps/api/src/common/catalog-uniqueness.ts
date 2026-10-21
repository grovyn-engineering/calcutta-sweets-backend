import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Db = Prisma.TransactionClient;

/**
 * Catalog identity rules, per shop:
 * - barcode: unique (DB constraint `@@unique([shopCode, barcode])`), so a scan resolves to one variant;
 * - SKU: unique when set, case-insensitive;
 * - product name: unique, case-insensitive and trimmed (add a variant instead of a second product).
 */
export async function assertProductNameAvailable(
  db: Db,
  shopCode: string,
  name: string,
  excludeProductId?: string,
) {
  const clash = await db.product.findFirst({
    where: {
      shopCode,
      name: { equals: name.trim(), mode: Prisma.QueryMode.insensitive },
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictException(
      `A product named "${name.trim()}" already exists in this shop`,
    );
  }
}

export async function assertSkuAvailable(
  db: Db,
  shopCode: string,
  sku: string | null | undefined,
  excludeVariantId?: string,
) {
  const next = sku?.trim();
  if (!next) return;
  const clash = await db.productVariant.findFirst({
    where: {
      shopCode,
      sku: { equals: next, mode: Prisma.QueryMode.insensitive },
      ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictException(`SKU "${next}" is already used in this shop`);
  }
}
