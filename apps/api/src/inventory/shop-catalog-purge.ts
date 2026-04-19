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

  return prisma.$transaction(async (tx) => {
    const oi = await tx.orderItem.deleteMany({
      where: { order: { shopCode } },
    });
    const ord = await tx.order.deleteMany({ where: { shopCode } });
    const pv = await tx.productVariant.deleteMany({
      where: { product: { shopCode } },
    });
    const img = await tx.productImage.deleteMany({
      where: { product: { shopCode } },
    });
    const pr = await tx.product.deleteMany({ where: { shopCode } });

    const emptyCats = await tx.category.findMany({
      where: { products: { none: {} } },
      select: { id: true },
    });
    const cat = await tx.category.deleteMany({
      where: { id: { in: emptyCats.map((c) => c.id) } },
    });

    return {
      orderItems: oi.count,
      orders: ord.count,
      variants: pv.count,
      images: img.count,
      products: pr.count,
      orphanCategoriesRemoved: cat.count,
    };
  });
}
