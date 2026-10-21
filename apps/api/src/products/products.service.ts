import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Unit } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  assertProductNameAvailable,
  assertSkuAvailable,
} from '../common/catalog-uniqueness';
import { qty } from '../common/money';
import { applyStockChange, nextSequence } from '../common/stock';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Next `CS000123`-style barcode from a per-shop counter (no read-max-then-add race). */
  async generateBarcode(shopCode: string, tx?: Prisma.TransactionClient) {
    const n = await nextSequence(tx ?? this.prisma, `BARCODE-${shopCode}`);
    return `CS${n.toString().padStart(6, '0')}`;
  }

  async create(createProductDto: CreateProductDto, shopCode: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await assertProductNameAvailable(tx, shopCode, createProductDto.name);
        await assertSkuAvailable(tx, shopCode, createProductDto.sku);
        const barcode =
          createProductDto.barcode?.trim() ||
          (await this.generateBarcode(shopCode, tx));
        return this.createWithBarcode(tx, createProductDto, shopCode, barcode);
      });
    } catch (e) {
      throw this.mapBarcodeConflict(e);
    }
  }

  private mapBarcodeConflict(e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new ConflictException('That barcode is already used in this shop');
    }
    return e;
  }

  private async createWithBarcode(
    tx: Prisma.TransactionClient,
    createProductDto: CreateProductDto,
    shopCode: string,
    barcode: string,
  ) {
    const quantity = qty(createProductDto.quantity ?? 0);
    const product = await tx.product.create({
      data: {
        name: createProductDto.name.trim(),
        description: createProductDto.description,
        isListedOnWebsite: createProductDto.isListedOnWebsite ?? false,
        shopCode,
        ...(createProductDto.categoryId
          ? { categoryId: createProductDto.categoryId }
          : {}),
        variants: {
          create: {
            shopCode,
            name: createProductDto.variantName?.trim() || 'Regular',
            price: createProductDto.price,
            barcode,
            quantity: 0,
            unit: createProductDto.unit ?? Unit.PC,
            ...(createProductDto.costPrice !== undefined
              ? { costPrice: createProductDto.costPrice }
              : {}),
            ...(createProductDto.sku?.trim()
              ? { sku: createProductDto.sku.trim() }
              : {}),
            ...(createProductDto.hsnCode
              ? { hsnCode: createProductDto.hsnCode }
              : {}),
            ...(createProductDto.minStock !== undefined
              ? { minStock: createProductDto.minStock }
              : {}),
          },
        },
      },
      include: { variants: true, category: true },
    });
    if (quantity.gt(0)) {
      await applyStockChange(tx, {
        variantId: product.variants[0].id,
        shopCode,
        delta: quantity,
        reason: 'ADJUSTMENT',
        note: 'Opening stock',
      });
    }
    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { variants: true, category: true },
    });
  }

  async findAll(shopCode?: string | null) {
    return this.prisma.product.findMany({
      where: shopCode ? { shopCode } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findPage(
    shopCode: string,
    page: number,
    size: number,
    opts?: {
      search?: string;
      categoryId?: string;
      status?: 'active' | 'inactive';
    },
  ) {
    const search = opts?.search?.trim();
    const where: Prisma.ProductWhereInput = {
      shopCode,
      ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts?.status === 'active' ? { isActive: true } : {}),
      ...(opts?.status === 'inactive' ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                category: {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                variants: {
                  some: {
                    OR: [
                      {
                        name: {
                          contains: search,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        barcode: {
                          contains: search,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        sku: {
                          contains: search,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const skip = (page - 1) * size;
    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: { orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);
    const last_page = Math.max(1, Math.ceil(total / size) || 1);
    return {
      data,
      page,
      size,
      total,
      last_page,
      hasMore: page < last_page,
    };
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForShop(id: string, shopCode: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, shopCode },
      include: {
        shop: true,
        category: true,
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    shopCode: string,
  ) {
    const existing = await this.findOneForShop(id, shopCode);

    const { price, barcode, ...productFields } = updateProductDto;

    return this.prisma.$transaction(async (tx) => {
      if (productFields.name !== undefined) {
        productFields.name = productFields.name.trim();
        await assertProductNameAvailable(
          tx,
          shopCode,
          productFields.name,
          existing.id,
        );
      }
      await tx.product.update({
        where: { id: existing.id },
        data: {
          ...productFields,
          ...(updateProductDto.isListedOnWebsite !== undefined
            ? { isListedOnWebsite: updateProductDto.isListedOnWebsite }
            : {}),
        },
      });

      if (price !== undefined || barcode !== undefined) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: id },
          orderBy: { createdAt: 'asc' },
        });
        if (variant) {
          if (barcode !== undefined) {
            const next = barcode.trim();
            const taken = await tx.productVariant.findFirst({
              where: { barcode: next, NOT: { id: variant.id }, shopCode },
            });
            if (taken) {
              throw new ConflictException(
                'That barcode is already used in this shop',
              );
            }
          }
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              ...(price !== undefined ? { price } : {}),
              ...(barcode !== undefined ? { barcode: barcode.trim() } : {}),
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: existing.id },
        include: { variants: true, shop: true },
      });
    });
  }

  /**
   * Deletes the product with its variants and images (FK cascade). Past order lines keep
   * their name/price snapshot; their product/variant links become NULL.
   */
  async remove(id: string, shopCode: string) {
    await this.findOneForShop(id, shopCode);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
