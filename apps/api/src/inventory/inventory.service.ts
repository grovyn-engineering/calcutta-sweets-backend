import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateVariantDto } from './dto/update-variant.dto';

export type VariantListFilters = {
  search?: string;
  category?: string;
  activeOnly?: boolean;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantByBarcode(barcode: string, shopCode: string) {
    const row = await this.prisma.productVariant.findFirst({
      where: {
        barcode,
        product: { shopCode },
      },
      include: {
        product: { include: { category: true } },
      },
    });
    if (!row) {
      throw new NotFoundException(`No product found for barcode ${barcode}`);
    }
    if (!row.product.isActive) {
      throw new NotFoundException(`No product found for barcode ${barcode}`);
    }
    return {
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      variantName: row.name,
      barcode: row.barcode,
      price: row.price,
      unit: row.unit ?? 'PC',
      stock: row.quantity,
    };
  }

  async findVariantById(id: string, shopCode: string) {
    const row = await this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: { include: { category: true, shop: true } },
      },
    });
    if (!row) {
      throw new NotFoundException(`Variant #${id} not found`);
    }
    if (row.product.shopCode !== shopCode) {
      throw new ForbiddenException('Variant is not in the active shop scope');
    }
    return row;
  }

  async updateVariant(id: string, dto: UpdateVariantDto, shopCode: string) {
    await this.findVariantById(id, shopCode);
    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.minStock !== undefined ? { minStock: dto.minStock } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.costPrice !== undefined ? { costPrice: dto.costPrice } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.hsnCode !== undefined ? { hsnCode: dto.hsnCode } : {}),
      },
      include: {
        product: { include: { category: true, shop: true } },
      },
    });
  }

  /** Paginated SKUs for inventory and POS; optional search, category, active-only. */
  async findVariantsPage(
    shopCode: string,
    page: number,
    size: number,
    filters: VariantListFilters = {},
  ) {
    const search = filters.search?.trim();
    const category = filters.category?.trim();

    const productWhere: Prisma.ProductWhereInput = {
      shopCode,
      ...(filters.activeOnly ? { isActive: true } : {}),
      ...(category
        ? {
            category: {
              name: category,
            },
          }
        : {}),
    };

    const where: Prisma.ProductVariantWhereInput = {
      product: productWhere,
      ...(search
        ? {
            OR: [
              {
                product: {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
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
            ],
          }
        : {}),
    };

    const skip = (page - 1) * size;

    const [total, rows] = await Promise.all([
      this.prisma.productVariant.count({ where }),
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: size,
        orderBy: [{ product: { name: 'asc' } }, { name: 'asc' }],
        include: {
          product: { include: { category: true } },
        },
      }),
    ]);

    const last_page = Math.max(1, Math.ceil(total / size) || 1);
    const hasMore = page < last_page;

    const data = rows.map((v) => ({
      id: v.id,
      productId: v.productId,
      productName: v.product.name,
      variantName: v.name,
      sku: v.sku ?? '',
      barcode: v.barcode,
      category: v.product.category?.name ?? '—',
      quantity: v.quantity,
      minStock: v.minStock,
      unit: v.unit ?? 'PC',
      price: v.price,
      costPrice: v.costPrice,
    }));

    return {
      data,
      last_page,
      page,
      size,
      total,
      hasMore,
    };
  }
}
