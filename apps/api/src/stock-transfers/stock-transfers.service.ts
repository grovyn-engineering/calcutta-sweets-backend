import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransferStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class StockTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the factory shop. Throws if none exists.
   */
  private async getFactoryShop() {
    const factory = await this.prisma.shop.findFirst({
      where: { isFactory: true },
    });
    if (!factory) {
      throw new BadRequestException(
        'No factory/warehouse shop is configured. Ask a super admin to mark a shop as factory.',
      );
    }
    return factory;
  }

  /**
   * Create a refill request from the requesting shop to the factory.
   */
  async create(dto: CreateTransferDto, shopCode: string, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required.');
    }

    const factory = await this.getFactoryShop();

    if (shopCode === factory.shopCode) {
      throw new BadRequestException(
        'The factory shop cannot request refills from itself.',
      );
    }

    return this.prisma.stockTransferRequest.create({
      data: {
        fromShopCode: factory.shopCode,
        toShopCode: shopCode,
        note: dto.note,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            barcode: item.barcode,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true, fromShop: true, toShop: true },
    });
  }

  /**
   * List transfers visible to the given shop.
   * Factory sees all, regular shops see only their own.
   */
  async findAll(shopCode: string, status?: TransferStatus) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
    });

    const where: any = {};

    if (shop?.isFactory) {
      // Factory sees incoming (fromShopCode = factory)
      where.fromShopCode = shopCode;
    } else {
      // Regular shops see their outgoing requests
      where.toShopCode = shopCode;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.stockTransferRequest.findMany({
      where,
      include: {
        items: true,
        fromShop: { select: { name: true, shopCode: true } },
        toShop: { select: { name: true, shopCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.stockTransferRequest.findUnique({
      where: { id },
      include: {
        items: true,
        fromShop: { select: { name: true, shopCode: true } },
        toShop: { select: { name: true, shopCode: true } },
      },
    });
    if (!request) {
      throw new NotFoundException(`Transfer request #${id} not found`);
    }
    return request;
  }

  /**
   * Approve a pending request. Only factory/super-admin can do this.
   */
  async approve(id: string, userId: string, shopCode: string) {
    const request = await this.findOne(id);
    await this.assertFactoryAccess(shopCode, request.fromShopCode);

    if (request.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a request with status ${request.status}`,
      );
    }

    return this.prisma.stockTransferRequest.update({
      where: { id },
      data: { status: TransferStatus.APPROVED, approvedById: userId },
      include: { items: true, fromShop: true, toShop: true },
    });
  }

  /**
   * Reject a pending request.
   */
  async reject(id: string, userId: string, shopCode: string) {
    const request = await this.findOne(id);
    await this.assertFactoryAccess(shopCode, request.fromShopCode);

    if (request.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a request with status ${request.status}`,
      );
    }

    return this.prisma.stockTransferRequest.update({
      where: { id },
      data: { status: TransferStatus.REJECTED, approvedById: userId },
      include: { items: true, fromShop: true, toShop: true },
    });
  }

  /**
   * Fulfill an approved request:
   *  1. Subtract stock from factory variants (by barcode)
   *  2. Add stock to destination shop variants (by barcode, auto-create if missing)
   *  3. Mark status as FULFILLED
   */
  async fulfill(id: string, userId: string, shopCode: string) {
    const request = await this.findOne(id);
    await this.assertFactoryAccess(shopCode, request.fromShopCode);

    if (
      request.status !== TransferStatus.APPROVED &&
      request.status !== TransferStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot fulfill a request with status ${request.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of request.items) {
        // 1. Find factory variant by barcode
        const factoryVariant = await tx.productVariant.findFirst({
          where: {
            barcode: item.barcode,
            product: { shopCode: request.fromShopCode },
          },
          include: { product: { include: { category: true } } },
        });

        if (!factoryVariant) {
          throw new BadRequestException(
            `Product with barcode ${item.barcode} not found in factory inventory.`,
          );
        }

        if (factoryVariant.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock in factory for ${item.productName} (${item.variantName}). Available: ${factoryVariant.quantity}, Requested: ${item.quantity}`,
          );
        }

        // Subtract from factory
        await tx.productVariant.update({
          where: { id: factoryVariant.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // 2. Find or create destination variant
        let destVariant = await tx.productVariant.findFirst({
          where: {
            barcode: item.barcode,
            product: { shopCode: request.toShopCode },
          },
        });

        if (destVariant) {
          // Add stock to existing variant
          await tx.productVariant.update({
            where: { id: destVariant.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          // Auto-create product + variant in destination shop
          let destProduct = await tx.product.findFirst({
            where: {
              name: factoryVariant.product.name,
              shopCode: request.toShopCode,
            },
          });

          if (!destProduct) {
            destProduct = await tx.product.create({
              data: {
                name: factoryVariant.product.name,
                shopCode: request.toShopCode,
                categoryId: factoryVariant.product.categoryId,
                isActive: true,
              },
            });
          }

          await tx.productVariant.create({
            data: {
              productId: destProduct.id,
              name: factoryVariant.name,
              price: factoryVariant.price,
              costPrice: factoryVariant.costPrice,
              barcode: item.barcode, // Use original barcode
              sku: factoryVariant.sku,
              hsnCode: factoryVariant.hsnCode,
              quantity: item.quantity,
              minStock: factoryVariant.minStock,
              unit: factoryVariant.unit,
            },
          });
        }
      }

      // 3. Mark as fulfilled
      return tx.stockTransferRequest.update({
        where: { id },
        data: {
          status: TransferStatus.FULFILLED,
          approvedById: userId,
        },
        include: { items: true, fromShop: true, toShop: true },
      });
    });
  }

  private async assertFactoryAccess(
    currentShopCode: string,
    factoryShopCode: string,
  ) {
    const currentShop = await this.prisma.shop.findUnique({
      where: { shopCode: currentShopCode },
    });
    // Allow if current shop IS the factory, or if we're a super admin viewing from factory scope
    if (!currentShop?.isFactory && currentShopCode !== factoryShopCode) {
      throw new ForbiddenException(
        'Only the factory shop can approve, reject, or fulfill transfer requests.',
      );
    }
  }
}
