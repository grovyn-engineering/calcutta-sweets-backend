import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { OrderStatus, Prisma } from '@calcutta/database';
import {
  normalizeIndianMobile,
  optionalIndianMobileOrNull,
} from '../common/indian-mobile';
import { dec, inclusiveTax, money, num, qty } from '../common/money';
import { istFinancialYear } from '../common/ist';
import { applyStockChange, LONG_TX, nextSequence } from '../common/stock';

type Tx = Prisma.TransactionClient;

/** Price drift tolerated between the POS cart and the catalog (float rounding on the client). */
const PRICE_TOLERANCE = 0.005;

export type PricedLine = {
  variantId: string | null;
  productId: string | null;
  customName: string | null;
  productName: string;
  variantName: string | null;
  barcode: string | null;
  hsnCode: string | null;
  quantity: Prisma.Decimal;
  price: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  posLabelQuantity: Prisma.Decimal | null;
  posLabelUnit: string | null;
  label: string;
};

/**
 * Splits the bill discount across lines in proportion to their value (last line takes
 * the rounding remainder) and computes GST-inclusive tax per line.
 */
export function computeBill(
  lines: PricedLine[],
  discountIn: Prisma.Decimal.Value,
) {
  const gross = money(
    lines.reduce((s, l) => s.add(l.quantity.mul(l.price)), dec(0)),
  );
  const discount = money(discountIn);
  if (discount.gt(gross)) {
    throw new BadRequestException(
      `Discount (₹${discount.toFixed(2)}) cannot exceed the bill amount (₹${gross.toFixed(2)})`,
    );
  }
  let remaining = discount;
  const taxed = lines.map((l, i) => {
    const lineGross = money(l.quantity.mul(l.price));
    const share =
      i === lines.length - 1 || gross.isZero()
        ? remaining
        : money(discount.mul(lineGross).div(gross));
    remaining = remaining.sub(share);
    const net = lineGross.sub(share);
    return { ...l, taxAmount: inclusiveTax(net, l.taxRate) };
  });
  const tax = money(taxed.reduce((s, l) => s.add(l.taxAmount), dec(0)));
  return { lines: taxed, gross, discount, total: gross.sub(discount), tax };
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findCustomerByPhone(shopCode: string, rawPhone: string) {
    const phone = normalizeIndianMobile(rawPhone);
    if (!phone) return null;
    return this.prisma.customer.findUnique({
      where: { shopCode_phone: { shopCode, phone } },
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        notes: true,
        gstin: true,
      },
    });
  }

  /** Next bill number for the shop's financial-year series, e.g. `26-27/000042`. */
  static async allocateBillNo(tx: Tx, shopCode: string, at: Date) {
    const fy = istFinancialYear(at);
    const seq = await nextSequence(
      tx,
      `${shopCode}-FY${String(fy.startYear).slice(-2)}`,
    );
    return `${fy.label}/${String(seq).padStart(6, '0')}`;
  }

  async createPosOrder(
    shopCode: string,
    userId: string | undefined,
    dto: CreatePosOrderDto,
  ) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
      select: { cgstRate: true, sgstRate: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    const shopRate = dec(shop.cgstRate).add(shop.sgstRate);

    const variantIds = [
      ...new Set(
        dto.items.map((i) => i.variantId).filter((id): id is string => !!id),
      ),
    ];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, shopCode },
      include: { product: { select: { name: true, isActive: true } } },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        'One or more line items are not valid for this shop',
      );
    }
    const vmap = new Map(variants.map((v) => [v.id, v]));

    // Catalog lines are always priced from the DB. A stale cart is rejected rather than
    // silently re-priced, so the receipt the POS prints matches what is stored.
    const lines: PricedLine[] = dto.items.map((line) => {
      const quantity = qty(line.quantity);
      if (quantity.lte(0))
        throw new BadRequestException('Quantity must be positive');
      const posLabelQuantity =
        line.displayQuantity != null ? qty(line.displayQuantity) : null;
      const posLabelUnit = line.displayUnit?.trim() || null;
      if (line.variantId) {
        const v = vmap.get(line.variantId)!;
        if (Math.abs(line.unitPrice - num(v.price)) > PRICE_TOLERANCE) {
          throw new ConflictException(
            `Price of ${v.product.name} (${v.name}) is now ₹${dec(v.price).toFixed(2)}. Refresh the cart and try again.`,
          );
        }
        return {
          variantId: v.id,
          productId: v.productId,
          customName: null,
          productName: v.product.name,
          variantName: v.name,
          barcode: v.barcode,
          hsnCode: v.hsnCode,
          quantity,
          price: dec(v.price),
          taxRate: v.taxRate != null ? dec(v.taxRate) : shopRate,
          posLabelQuantity,
          posLabelUnit,
          label: `${v.product.name} (${v.name})`,
        };
      }
      const name = line.customName?.trim() || 'Manual Item';
      return {
        variantId: null,
        productId: null,
        customName: name,
        productName: name,
        variantName: null,
        barcode: null,
        hsnCode: null,
        quantity,
        price: money(line.unitPrice),
        taxRate: shopRate,
        posLabelQuantity,
        posLabelUnit,
        label: name,
      };
    });

    const bill = computeBill(lines, dto.discount ?? 0);

    let backdatedAt: Date | undefined;
    if (dto.createdAt) {
      const parsed = new Date(dto.createdAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid sale date/time');
      }
      if (parsed.getTime() > Date.now() + 60_000) {
        throw new BadRequestException('Sale date/time cannot be in the future');
      }
      backdatedAt = parsed;
    }
    const saleAt = backdatedAt ?? new Date();

    const customerPhone = optionalIndianMobileOrNull(dto.customerPhone);
    const customerName = dto.customerName?.trim() || null;
    const customerEmail = dto.customerEmail?.trim() || null;
    const customer = {
      email: customerEmail,
      address: dto.customerAddress?.trim() || null,
      notes: dto.customerNotes?.trim() || null,
      gstin: dto.customerGstin?.trim().toUpperCase() || null,
    };

    const order = await this.prisma.$transaction(async (tx) => {
      if (customerPhone) {
        // Only overwrite fields the cashier actually filled in.
        const filled = Object.fromEntries(
          Object.entries(customer).filter(([, v]) => v != null),
        );
        await tx.customer.upsert({
          where: { shopCode_phone: { shopCode, phone: customerPhone } },
          update: {
            ...(customerName ? { name: customerName } : {}),
            ...filled,
          },
          create: {
            shopCode,
            phone: customerPhone,
            name: customerName ?? 'Walk-in',
            ...customer,
          },
        });
      }

      const billNo = await OrdersService.allocateBillNo(tx, shopCode, saleAt);
      const o = await tx.order.create({
        data: {
          shopCode,
          billNo,
          totalAmount: bill.total,
          discount: bill.discount,
          tax: bill.tax,
          status: OrderStatus.PAID,
          paymentMethod: dto.paymentMethod,
          createdById: userId ?? null,
          customerName,
          customerPhone,
          customerEmail,
          ...(backdatedAt ? { createdAt: backdatedAt } : {}),
        },
      });

      await tx.orderItem.createMany({
        data: bill.lines.map((l) => ({
          orderId: o.id,
          productId: l.productId,
          productVariantId: l.variantId,
          customName: l.customName,
          productName: l.productName,
          variantName: l.variantName,
          barcode: l.barcode,
          hsnCode: l.hsnCode,
          quantity: l.quantity,
          price: l.price,
          taxRate: l.taxRate,
          taxAmount: l.taxAmount,
          posLabelQuantity: l.posLabelQuantity,
          posLabelUnit: l.posLabelUnit,
        })),
      });

      // Aggregate per variant so the same item on two lines is checked against its total.
      const perVariant = new Map<
        string,
        { q: Prisma.Decimal; label: string }
      >();
      for (const l of bill.lines) {
        if (!l.variantId) continue;
        const prev = perVariant.get(l.variantId);
        perVariant.set(l.variantId, {
          q: (prev?.q ?? dec(0)).add(l.quantity),
          label: l.label,
        });
      }
      for (const [variantId, { q, label }] of perVariant) {
        await applyStockChange(tx, {
          variantId,
          shopCode,
          delta: q.neg(),
          reason: 'SALE',
          refId: o.id,
          userId,
          label,
        });
      }
      return o;
    }, LONG_TX);

    return this.billSummary(order, shop);
  }

  private billSummary(
    order: {
      id: string;
      billNo: string | null;
      createdAt: Date;
      totalAmount: Prisma.Decimal;
      tax: Prisma.Decimal;
      discount: Prisma.Decimal;
      paymentMethod: string;
    },
    shop: { cgstRate: Prisma.Decimal; sgstRate: Prisma.Decimal },
  ) {
    const rate = dec(shop.cgstRate).add(shop.sgstRate);
    const cgst = rate.isZero()
      ? dec(0)
      : money(dec(order.tax).mul(shop.cgstRate).div(rate));
    return {
      id: order.id,
      billNo: order.billNo,
      createdAt: order.createdAt.toISOString(),
      totalAmount: order.totalAmount,
      subtotal: dec(order.totalAmount).add(order.discount),
      tax: order.tax,
      cgstAmount: cgst,
      sgstAmount: dec(order.tax).sub(cgst),
      taxableValue: dec(order.totalAmount).sub(order.tax),
      discount: order.discount,
      paymentMethod: order.paymentMethod,
    };
  }

  async findPage(shopCode: string, page: number, size: number, q?: string) {
    const qt = q?.trim();
    const where: Prisma.OrderWhereInput = {
      shopCode,
      status: { not: OrderStatus.DRAFT },
      ...(qt
        ? {
            OR: [
              { customerName: { contains: qt, mode: 'insensitive' as const } },
              { customerPhone: { contains: qt, mode: 'insensitive' as const } },
              { billNo: { contains: qt, mode: 'insensitive' as const } },
              { id: { equals: qt } },
            ],
          }
        : {}),
    };

    const total = await this.prisma.order.count({ where });
    const lastPage = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(1, page), lastPage);

    const rows = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * size,
      take: size,
      include: {
        _count: { select: { items: true } },
      },
    });

    return {
      data: rows.map((o) => ({
        id: o.id,
        billNo: o.billNo,
        createdAt: o.createdAt.toISOString(),
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        status: o.status,
        orderSource: o.orderSource,
        pickupTime: o.pickupTime?.toISOString() ?? null,
        cancelledAt: o.cancelledAt?.toISOString() ?? null,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        itemCount: o._count.items,
      })),
      last_page: lastPage,
      page: safePage,
      size,
      total,
    };
  }

  /**
   * Cancels a bill. The order (and its bill number) stays in the series for GST;
   * stock is returned for paid orders. Safe under concurrent cancels.
   */
  async cancel(
    shopCode: string,
    id: string,
    userId: string | undefined,
    reason?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopCode },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    await this.prisma.$transaction(async (tx) => {
      const flipped = await tx.order.updateMany({
        where: { id, shopCode, status: order.status },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId ?? null,
          cancelReason: reason?.trim() || null,
        },
      });
      if (flipped.count !== 1) {
        throw new ConflictException(
          'Order was changed by someone else. Reload and retry.',
        );
      }
      // DRAFT web orders never took stock; PAID ones did.
      if (order.status !== OrderStatus.PAID) return;
      for (const item of order.items) {
        if (!item.productVariantId) continue;
        const stillExists = await tx.productVariant.findFirst({
          where: { id: item.productVariantId, shopCode },
          select: { id: true },
        });
        if (!stillExists) continue;
        await applyStockChange(tx, {
          variantId: item.productVariantId,
          shopCode,
          delta: item.quantity,
          reason: 'SALE_CANCEL',
          refId: order.id,
          userId,
        });
      }
    }, LONG_TX);

    return { id, status: OrderStatus.CANCELLED };
  }

  async findOne(shopCode: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopCode },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            productVariant: { select: { unit: true } },
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const subtotal = money(
      order.items.reduce((s, i) => s.add(dec(i.quantity).mul(i.price)), dec(0)),
    );
    return {
      id: order.id,
      billNo: order.billNo,
      createdAt: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      tax: order.tax,
      discount: order.discount,
      status: order.status,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancelReason: order.cancelReason,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      subtotal,
      items: order.items.map((i) => {
        const stockQty = num(i.quantity);
        const catalogRate = num(i.price);
        const lineTotal = num(money(dec(i.quantity).mul(i.price)));
        const dispQ =
          i.posLabelQuantity != null ? num(i.posLabelQuantity) : stockQty;
        const dispU = i.posLabelUnit?.trim() || i.productVariant?.unit || 'PC';
        const dispRate = dispQ > 0 ? lineTotal / dispQ : catalogRate;
        return {
          quantity: dispQ,
          unitPrice: dispRate,
          lineTotal,
          productName: i.customName || i.productName || 'Manual Item',
          variantLabel: i.variantName ?? '-',
          unit: dispU,
          barcode: i.barcode ?? '',
          hsnCode: i.hsnCode,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
        };
      }),
    };
  }
}
