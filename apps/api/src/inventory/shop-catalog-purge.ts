import type { PrismaClient } from '@prisma/client';

export type PurgeShopCatalogResult = {
  orderItems: number;
  orders: number;
  variants: number;
  images: number;
  products: number;
  orphanCategoriesRemoved: number;
};

export async function purgeShopCatalog(
  prisma: PrismaClient,
  shopCode: string,
): Promise<PurgeShopCatalogResult> {
  const shop = await prisma.shop.findUnique({ where: { shopCode } });
  if (!shop) {
    throw new Error(`Shop "${shopCode}" not found`);
  }
  if (shop.isFactory) {
    throw new Error('Cannot purge the factory / warehouse shop.');
  }

  // Orders are tax records and are never deleted; their lines keep a snapshot and the
  // variant/product FKs are SET NULL. Categories are shared across shops and are kept.
  return prisma.$transaction(async (tx) => {
    const pv = await tx.productVariant.deleteMany({ where: { shopCode } });
    const img = await tx.productImage.deleteMany({
      where: { product: { shopCode } },
    });
    const pr = await tx.product.deleteMany({ where: { shopCode } });

    return {
      orderItems: 0,
      orders: 0,
      variants: pv.count,
      images: img.count,
      products: pr.count,
      orphanCategoriesRemoved: 0,
    };
  });
}
