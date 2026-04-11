import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { OrderStatus, Prisma } from '@calcutta/database';

const POS_GST_RATE = 0.05;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async createPosOrder(
    shopCode: string,
    userId: string | undefined,
    dto: CreatePosOrderDto,
  ) {
    const variantIds = [...new Set(dto.items.map((i) => i.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { shopCode },
      },
      include: { product: true },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        'One or more line items are not valid for this shop',
      );
    }
    const vmap = new Map(variants.map((v) => [v.id, v]));

    for (const line of dto.items) {
      const v = vmap.get(line.variantId)!;
      if (v.quantity < line.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${v.product.name} (${v.name})`,
        );
      }
    }

    const subtotal = dto.items.reduce(
      (s, i) => s + i.quantity * i.unitPrice,
      0,
    );
    const discount = dto.discount ?? 0;
    const tax = subtotal * POS_GST_RATE;
    const totalAmount = subtotal + tax - discount;

    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          shopCode,
          totalAmount,
          discount,
          tax,
          status: 'PAID',
          paymentMethod: dto.paymentMethod,
          createdById: userId ?? null,
          customerName: dto.customerName?.trim() || null,
          customerPhone: dto.customerPhone?.trim() || null,
          customerEmail: dto.customerEmail?.trim() || null,
        },
      });

      for (const line of dto.items) {
        const v = vmap.get(line.variantId)!;
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            productId: v.productId,
            productVariantId: v.id,
            quantity: line.quantity,
            price: line.unitPrice,
          },
        });
        await tx.productVariant.update({
          where: { id: v.id },
          data: { quantity: { decrement: line.quantity } },
        });
      }

      return o;
    });

    return {
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      totalAmount,
      tax,
      discount,
      paymentMethod: dto.paymentMethod,
    };
  }

  async findPage(
    shopCode: string,
    page: number,
    size: number,
    q?: string,
  ) {
    const qt = q?.trim();
    const where: Prisma.OrderWhereInput = {
      shopCode,
      status: { not: OrderStatus.DRAFT },
      ...(qt
        ? {
          OR: [
            { customerName: { contains: qt, mode: 'insensitive' as const } },
            { customerPhone: { contains: qt, mode: 'insensitive' as const } },
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
        createdAt: o.createdAt.toISOString(),
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        status: o.status,
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

  async findOne(shopCode: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopCode },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            product: { select: { name: true } },
            productVariant: {
              select: { name: true, unit: true, barcode: true },
            },
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const subtotal = order.items.reduce(
      (s, i) => s + i.quantity * i.price,
      0,
    );
    return {
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      tax: order.tax ?? 0,
      discount: order.discount ?? 0,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      subtotal,
      items: order.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.price,
        productName: i.product.name,
        variantLabel: i.productVariant?.name ?? '-',
        unit: i.productVariant?.unit ?? null,
        barcode: i.productVariant?.barcode ?? '',
      })),
    };
  }
}
