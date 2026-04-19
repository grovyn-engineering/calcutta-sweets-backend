import type { PrismaClient } from '@calcutta/database';

export type DeleteShopResult = {
  shopCode: string;
  orderItems: number;
  orders: number;
  stockTransfers: number;
  roleRequests: number;
  users: number;
  variants: number;
  images: number;
  products: number;
  orphanCategoriesRemoved: number;
};

export async function deleteShopAndDependencies(
  prisma: PrismaClient,
  shopId: string,
): Promise<DeleteShopResult> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, shopCode: true, isFactory: true },
  });
  if (!shop) {
    throw new Error(`Shop not found`);
  }
  if (shop.isFactory) {
    throw new Error('Cannot delete the factory / warehouse shop.');
  }

  const shopCode = shop.shopCode;

  return prisma.$transaction(async (tx) => {
    const userRows = await tx.user.findMany({
      where: { shopCode },
      select: { id: true },
    });
    const userIds = userRows.map((u) => u.id);

    const oi = await tx.orderItem.deleteMany({
      where: { order: { shopCode } },
    });

    await tx.order.updateMany({
      where: { shopCode },
      data: { createdById: null },
    });

    const ord = await tx.order.deleteMany({ where: { shopCode } });

    const st = await tx.stockTransferRequest.deleteMany({
      where: {
        OR: [{ fromShopCode: shopCode }, { toShopCode: shopCode }],
      },
    });

    const rr = await tx.roleRequest.deleteMany({
      where:
        userIds.length > 0
          ? { OR: [{ shopCode }, { userId: { in: userIds } }] }
          : { shopCode },
    });

    if (userIds.length) {
      await tx.order.updateMany({
        where: { createdById: { in: userIds } },
        data: { createdById: null },
      });
    }

    const usr = await tx.user.deleteMany({ where: { shopCode } });

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

    await tx.shop.delete({ where: { id: shopId } });

    return {
      shopCode,
      orderItems: oi.count,
      orders: ord.count,
      stockTransfers: st.count,
      roleRequests: rr.count,
      users: usr.count,
      variants: pv.count,
      images: img.count,
      products: pr.count,
      orphanCategoriesRemoved: cat.count,
    };
  });
}
