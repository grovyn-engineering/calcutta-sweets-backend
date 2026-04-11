import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ROLLING_HOURS = 24;

export type ActivityItemDto = {
  type: 'new_product' | 'new_variant' | 'low_stock';
  at: string;
  title: string;
  body: string;
  hrefHint?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) { }

  async getShopActivity(shopCode: string): Promise<{
    since: string;
    items: ActivityItemDto[];
  }> {
    const since = new Date(Date.now() - ROLLING_HOURS * 60 * 60 * 1000);

    const [newProducts, newVariants, variantsWithMin] = await Promise.all([
      this.prisma.product.findMany({
        where: { shopCode, createdAt: { gte: since } },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.productVariant.findMany({
        where: { product: { shopCode }, createdAt: { gte: since } },
        select: {
          id: true,
          name: true,
          createdAt: true,
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.productVariant.findMany({
        where: {
          product: { shopCode },
          minStock: { not: null },
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          minStock: true,
          updatedAt: true,
          product: { select: { name: true } },
        },
      }),
    ]);

    const items: ActivityItemDto[] = [];

    for (const p of newProducts) {
      items.push({
        type: 'new_product',
        at: p.createdAt.toISOString(),
        title: 'New product',
        body: `${p.name} was added in the last ${ROLLING_HOURS} hours.`,
        hrefHint: `/products`,
      });
    }

    for (const v of newVariants) {
      items.push({
        type: 'new_variant',
        at: v.createdAt.toISOString(),
        title: 'New variant / SKU',
        body: `${v.product.name} - ${v.name} was added.`,
        hrefHint: `/inventory/${v.id}`,
      });
    }

    for (const v of variantsWithMin) {
      const min = v.minStock ?? 0;
      if (v.quantity <= min) {
        items.push({
          type: 'low_stock',
          at: v.updatedAt.toISOString(),
          title: 'At or below minimum stock',
          body: `${v.product.name} (${v.name}): ${v.quantity} on hand (minimum ${min}).`,
          hrefHint: `/inventory/${v.id}`,
        });
      }
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return { since: since.toISOString(), items };
  }
}
