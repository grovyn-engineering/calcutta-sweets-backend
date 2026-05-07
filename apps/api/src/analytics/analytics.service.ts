import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '@calcutta/database';
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

function utcMonthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthToUtcStart(month: string): Date {
  const m = month.match(/^(\d{4})-(\d{2})$/);
  if (!m) throw new BadRequestException('month must be YYYY-MM');
  const year = Number(m[1]);
  const monthNum = Number(m[2]);
  if (monthNum < 1 || monthNum > 12) {
    throw new BadRequestException('month must be YYYY-MM');
  }
  return new Date(Date.UTC(year, monthNum - 1, 1));
}

function utcMonthStartFromDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

type ReportsSummaryQuery = {
  days: number;
  start?: string;
  end?: string;
  month?: string;
  bucket: 'day' | 'month';
};

function buildReportsRange(now: Date, query: ReportsSummaryQuery): {
  startKey: string;
  endKey: string;
  rangeStart: Date;
  rangeEndExclusive: Date;
} {
  if (query.month) {
    const monthStart = monthToUtcStart(query.month);
    const monthEndExclusive = addUtcMonths(monthStart, 1);
    const endKey = addUtcDays(utcDayKey(monthEndExclusive), -1);
    return {
      startKey: utcDayKey(monthStart),
      endKey,
      rangeStart: monthStart,
      rangeEndExclusive: monthEndExclusive,
    };
  }

  if (query.start && query.end) {
    const startD = utcDayStart(query.start);
    const endD = utcDayStart(query.end);
    if (endD < startD) {
      throw new BadRequestException('end must be on or after start');
    }
    return {
      startKey: utcDayKey(startD),
      endKey: utcDayKey(endD),
      rangeStart: startD,
      rangeEndExclusive: utcDayStart(addUtcDays(utcDayKey(endD), 1)),
    };
  }

  const todayKey = utcDayKey(now);
  const startKey = addUtcDays(todayKey, -(query.days - 1));
  return {
    startKey,
    endKey: todayKey,
    rangeStart: utcDayStart(startKey),
    rangeEndExclusive: utcDayStart(addUtcDays(todayKey, 1)),
  };
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

  async getReportsSummary(shopCode: string, query: ReportsSummaryQuery) {
    const now = new Date();
    const { startKey, endKey, rangeStart, rangeEndExclusive } = buildReportsRange(
      now,
      query,
    );
    const days =
      Math.max(
        1,
        Math.round(
          (rangeEndExclusive.getTime() - rangeStart.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      ) || 1;

    const [ordersInRange, paymentMix, itemsInRange] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          shopCode,
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          status: { not: OrderStatus.DRAFT },
        },
        select: { createdAt: true, totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          shopCode,
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          status: { not: OrderStatus.DRAFT },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            shopCode,
            createdAt: { gte: rangeStart, lt: rangeEndExclusive },
            status: { not: OrderStatus.DRAFT },
          },
        },
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true } },
        },
      }),
    ]);

    const buckets = new Map<string, { revenue: number; orderCount: number }>();
    if (query.bucket === 'month') {
      let cur = utcMonthStartFromDate(rangeStart);
      const endMonth = utcMonthStartFromDate(utcDayStart(endKey));
      while (cur.getTime() <= endMonth.getTime()) {
        buckets.set(`${utcMonthKey(cur)}-01`, { revenue: 0, orderCount: 0 });
        cur = addUtcMonths(cur, 1);
      }
      for (const o of ordersInRange) {
        const k = `${utcMonthKey(o.createdAt)}-01`;
        const b = buckets.get(k);
        if (b) {
          b.revenue += o.totalAmount;
          b.orderCount += 1;
        }
      }
    } else {
      for (let i = 0; i < days; i++) {
        buckets.set(addUtcDays(startKey, i), { revenue: 0, orderCount: 0 });
      }
      for (const o of ordersInRange) {
        const k = utcDayKey(o.createdAt);
        const b = buckets.get(k);
        if (b) {
          b.revenue += o.totalAmount;
          b.orderCount += 1;
        }
      }
    }

    const daily = [...buckets.entries()].map(([date, b]) => ({
      date,
      revenue: b.revenue,
      orderCount: b.orderCount,
    }));

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
      bucket: query.bucket,
      range: { start: startKey, end: endKey },
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

  async getReportsExportData(shopCode: string, query: ReportsSummaryQuery) {
    const summary = await this.getReportsSummary(shopCode, query);
    const rangeStart = utcDayStart(summary.range.start);
    const rangeEndExclusive = utcDayStart(addUtcDays(summary.range.end, 1));

    const ORDERS_CAP = 10_000;
    const LINES_CAP = 50_000;

    const [orders, lineRows] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          shopCode,
          status: { not: OrderStatus.DRAFT },
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
        },
        orderBy: { createdAt: 'desc' },
        take: ORDERS_CAP,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            shopCode,
            status: { not: OrderStatus.DRAFT },
            createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          },
        },
        orderBy: [{ orderId: 'asc' }, { id: 'asc' }],
        take: LINES_CAP,
        include: {
          order: {
            select: {
              id: true,
              createdAt: true,
              customerName: true,
              customerPhone: true,
              paymentMethod: true,
            },
          },
          product: { select: { name: true } },
          productVariant: { select: { name: true, barcode: true } },
        },
      }),
    ]);

    const ordersPayload = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount,
      discount: o.discount ?? 0,
      tax: o.tax ?? 0,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      itemCount: o._count.items,
    }));

    const lineItems = lineRows.map((row) => {
      const qty = Number(row.quantity);
      const price = Number(row.price);
      return {
        orderId: row.orderId,
        orderCreatedAt: row.order.createdAt.toISOString(),
        customerName: row.order.customerName,
        customerPhone: row.order.customerPhone,
        paymentMethod: row.order.paymentMethod,
        productName: row.product.name,
        variantName: row.productVariant?.name ?? null,
        barcode: row.productVariant?.barcode ?? null,
        quantity: qty,
        unitPrice: price,
        lineTotal: qty * price,
      };
    });

    return {
      ...summary,
      export: {
        orders: ordersPayload,
        lineItems,
        ordersCapped: orders.length >= ORDERS_CAP,
        lineItemsCapped: lineRows.length >= LINES_CAP,
      },
    };
  }

  /**
   * Monthly GST-style totals from POS orders. Uses shop CGST/SGST% and stored
   * inclusive tax; IGST is not modeled (intra-state assumption).
   */
  async getGstMonthlySummary(shopCode: string, month: string) {
    const m = month.match(/^(\d{4})-(\d{2})$/);
    if (!m) {
      throw new BadRequestException('month must be YYYY-MM');
    }
    const year = Number(m[1]);
    const monthNum = Number(m[2]);
    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('month must be YYYY-MM');
    }

    const rangeStart = new Date(Date.UTC(year, monthNum - 1, 1));
    const rangeEndExclusive = new Date(Date.UTC(year, monthNum, 1));

    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
      select: {
        name: true,
        gstNumber: true,
        cgstRate: true,
        sgstRate: true,
      },
    });
    if (!shop) {
      throw new BadRequestException('Shop not found');
    }

    const cgstR = Number(shop.cgstRate ?? 0);
    const sgstR = Number(shop.sgstRate ?? 0);
    const combinedR = cgstR + sgstR;
    const totalRateFraction = combinedR / 100;

    const orders = await this.prisma.order.findMany({
      where: {
        shopCode,
        status: { not: OrderStatus.DRAFT },
        createdAt: { gte: rangeStart, lt: rangeEndExclusive },
      },
      select: {
        totalAmount: true,
        tax: true,
        discount: true,
      },
    });

    let grossInclusive = 0;
    let sumStoredTax = 0;
    let sumDiscount = 0;
    for (const o of orders) {
      grossInclusive += Number(o.totalAmount);
      sumDiscount += Number(o.discount ?? 0);
      sumStoredTax += Number(o.tax ?? 0);
    }

    let totalTax = sumStoredTax;
    const taxInferred =
      orders.length > 0 &&
      sumStoredTax === 0 &&
      combinedR > 0 &&
      grossInclusive > 0;
    if (taxInferred) {
      totalTax = grossInclusive * (totalRateFraction / (1 + totalRateFraction));
    }

    const taxableValue = Math.max(0, grossInclusive - totalTax);
    const denom = cgstR + sgstR;
    const cgstPayable = denom > 0 ? totalTax * (cgstR / denom) : 0;
    const sgstPayable = denom > 0 ? totalTax * (sgstR / denom) : 0;

    const fmtMonth = `${year}-${String(monthNum).padStart(2, '0')}`;

    return {
      month: fmtMonth,
      range: {
        startUtc: rangeStart.toISOString(),
        endUtcExclusive: rangeEndExclusive.toISOString(),
      },
      shopCode,
      shopName: shop.name,
      gstNumber: shop.gstNumber,
      cgstRate: cgstR,
      sgstRate: sgstR,
      combinedRatePercent: combinedR,
      billCount: orders.length,
      discountTotal: sumDiscount,
      grossInclusive,
      taxableValue,
      totalTax,
      cgstPayable,
      sgstPayable,
      igstPayable: 0,
      taxInferred,
    };
  }
}
