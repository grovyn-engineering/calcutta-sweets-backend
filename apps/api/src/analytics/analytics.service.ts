import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utcDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function addUtcDays(isoDate: string, delta: number): string {
  const t = utcDayStart(isoDate);
  t.setUTCDate(t.getUTCDate() + delta);
  return utcDayKey(t);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(shopCode: string) {
    const now = new Date();
    const todayKey = utcDayKey(now);
    const todayStart = utcDayStart(todayKey);
    const tomorrowStart = utcDayStart(addUtcDays(todayKey, 1));
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const sevenStartKey = addUtcDays(todayKey, -6);
    const sevenStart = utcDayStart(sevenStartKey);

    const [
      todayAgg,
      monthAgg,
      chartOrders,
      recentOrders,
      productCount,
      variantCount,
      variantsForStock,
      paymentToday,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          shopCode,
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { shopCode, createdAt: { gte: monthStart } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { shopCode, createdAt: { gte: sevenStart } },
        select: { createdAt: true, totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { shopCode },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.product.count({ where: { shopCode } }),
      this.prisma.productVariant.count({
        where: { product: { shopCode } },
      }),
      this.prisma.productVariant.findMany({
        where: { product: { shopCode } },
        select: {
          id: true,
          name: true,
          quantity: true,
          minStock: true,
          product: { select: { name: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          shopCode,
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const dayKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      dayKeys.push(addUtcDays(sevenStartKey, i));
    }

    const byDay = new Map<string, { revenue: number; orderCount: number }>();
    for (const k of dayKeys) {
      byDay.set(k, { revenue: 0, orderCount: 0 });
    }
    for (const o of chartOrders) {
      const k = utcDayKey(o.createdAt);
      const b = byDay.get(k);
      if (b) {
        b.revenue += o.totalAmount;
        b.orderCount += 1;
      }
    }

    const last7Days = dayKeys.map((date) => {
      const b = byDay.get(date)!;
      return { date, revenue: b.revenue, orderCount: b.orderCount };
    });

    const lowStockAll = variantsForStock.filter(
      (v) =>
        v.quantity <= 0 ||
        (v.minStock != null && v.quantity <= v.minStock),
    );
    const lowStockVariants = lowStockAll
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10)
      .map((v) => ({
        id: v.id,
        productName: v.product.name,
        variantName: v.name,
        quantity: v.quantity,
        minStock: v.minStock,
      }));

    return {
      shopCode,
      generatedAt: now.toISOString(),
      today: {
        orderCount: todayAgg._count.id,
        revenue: todayAgg._sum.totalAmount ?? 0,
      },
      monthToDate: {
        orderCount: monthAgg._count.id,
        revenue: monthAgg._sum.totalAmount ?? 0,
      },
      last7Days,
      catalog: {
        productCount,
        variantCount,
        lowStockCount: lowStockAll.length,
      },
      paymentToday: paymentToday.map((p) => ({
        paymentMethod: p.paymentMethod,
        orderCount: p._count.id,
        revenue: p._sum.totalAmount ?? 0,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        itemCount: o._count.items,
      })),
      lowStockVariants,
    };
  }

  async getReportsSummary(shopCode: string, days: number) {
    const now = new Date();
    const todayKey = utcDayKey(now);
    const startKey = addUtcDays(todayKey, -(days - 1));
    const rangeStart = utcDayStart(startKey);

    const [ordersInRange, paymentMix, itemsInRange] = await Promise.all([
      this.prisma.order.findMany({
        where: { shopCode, createdAt: { gte: rangeStart } },
        select: { createdAt: true, totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { shopCode, createdAt: { gte: rangeStart } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { shopCode, createdAt: { gte: rangeStart } },
        },
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true } },
        },
      }),
    ]);

    const dayKeys: string[] = [];
    for (let i = 0; i < days; i++) {
      dayKeys.push(addUtcDays(startKey, i));
    }

    const byDay = new Map<string, { revenue: number; orderCount: number }>();
    for (const k of dayKeys) {
      byDay.set(k, { revenue: 0, orderCount: 0 });
    }
    for (const o of ordersInRange) {
      const k = utcDayKey(o.createdAt);
      const b = byDay.get(k);
      if (b) {
        b.revenue += o.totalAmount;
        b.orderCount += 1;
      }
    }

    const daily = dayKeys.map((date) => {
      const b = byDay.get(date)!;
      return { date, revenue: b.revenue, orderCount: b.orderCount };
    });

    const totals = ordersInRange.reduce(
      (acc, o) => {
        acc.orderCount += 1;
        acc.revenue += o.totalAmount;
        return acc;
      },
      { orderCount: 0, revenue: 0 },
    );

    const productMap = new Map<
      string,
      { qtySold: number; revenue: number }
    >();
    for (const line of itemsInRange) {
      const name = line.product.name;
      const prev = productMap.get(name) ?? { qtySold: 0, revenue: 0 };
      prev.qtySold += line.quantity;
      prev.revenue += line.quantity * line.price;
      productMap.set(name, prev);
    }

    const topProducts = [...productMap.entries()]
      .map(([productName, v]) => ({
        productName,
        qtySold: v.qtySold,
        revenue: v.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return {
      shopCode,
      days,
      range: { start: startKey, end: todayKey },
      generatedAt: now.toISOString(),
      totals,
      daily,
      paymentMix: paymentMix.map((p) => ({
        paymentMethod: p.paymentMethod,
        orderCount: p._count.id,
        revenue: p._sum.totalAmount ?? 0,
      })),
      topProducts,
    };
  }
}
