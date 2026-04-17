import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateVariantDto } from './dto/update-variant.dto';

type VariantDetailRow = Prisma.ProductVariantGetPayload<{
  include: {
    product: { include: { category: true; shop: true; images: true } };
  };
}>;

export type VariantListFilters = {
  search?: string;
  category?: string;
  activeOnly?: boolean;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Prefix relative `/uploads/...` (and similar) paths with the public API origin so clients
   * can load them without guessing the Nest host (e.g. when the dashboard proxies `/api` only).
   */
  absoluteAssetUrl(url: string): string {
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const base =
      process.env.PUBLIC_ASSET_ORIGIN?.trim().replace(/\/+$/, '') ||
      process.env.API_UPSTREAM_URL?.trim().replace(/\/+$/, '') ||
      'http://127.0.0.1:3000';
    if (u.startsWith('/')) return `${base}${u}`;
    return `${base}/${u}`;
  }

  private mapVariantDetailAbsoluteUrls(row: VariantDetailRow): VariantDetailRow {
    return {
      ...row,
      product: {
        ...row.product,
        images: row.product.images.map((img) => ({
          ...img,
          url: this.absoluteAssetUrl(img.url),
        })),
      },
    };
  }

  async findVariantByBarcode(barcode: string, shopCode: string) {
    // `barcode` is @unique: use findUnique (single index seek) then scope in app.
    const row = await this.prisma.productVariant.findUnique({
      where: { barcode },
      select: {
        id: true,
        productId: true,
        name: true,
        barcode: true,
        price: true,
        unit: true,
        quantity: true,
        product: {
          select: {
            name: true,
            isActive: true,
            shopCode: true,
            category: { select: { name: true } },
            images: {
              orderBy: { createdAt: 'asc' },
              take: 48,
              select: { id: true, url: true },
            },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(`No product found for barcode ${barcode}`);
    }
    if (row.product.shopCode !== shopCode || !row.product.isActive) {
      throw new NotFoundException(`No product found for barcode ${barcode}`);
    }
    const images = row.product.images.map((img) => ({
      id: img.id,
      url: this.absoluteAssetUrl(img.url),
    }));
    return {
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      variantName: row.name,
      barcode: row.barcode,
      price: row.price,
      unit: row.unit ?? 'PC',
      stock: row.quantity,
      category: row.product.category?.name ?? null,
      images,
      imageUrl: images[0]?.url ?? null,
    };
  }

  async findVariantById(id: string, shopCode: string) {
    const row = await this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: { include: { category: true, shop: true, images: true } },
      },
    });
    if (!row) {
      throw new NotFoundException(`Variant #${id} not found`);
    }
    if (row.product.shopCode !== shopCode) {
      throw new ForbiddenException('Variant is not in the active shop scope');
    }
    return this.mapVariantDetailAbsoluteUrls(row);
  }

  async updateVariant(id: string, dto: UpdateVariantDto, shopCode: string) {
    await this.findVariantById(id, shopCode);
    const updated = await this.prisma.productVariant.update({
      where: { id },
      data: {
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.minStock !== undefined ? { minStock: dto.minStock } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.costPrice !== undefined ? { costPrice: dto.costPrice } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.hsnCode !== undefined ? { hsnCode: dto.hsnCode } : {}),
        product: {
          update: {
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.isListedOnWebsite !== undefined ? { isListedOnWebsite: dto.isListedOnWebsite } : {}),
            ...(dto.images !== undefined ? {
              images: {
                deleteMany: {},
                create: dto.images.map(url => ({ url })),
              }
            } : {}),
          },
        },
      },
      include: {
        product: { include: { category: true, shop: true, images: true } },
      },
    });
    return this.mapVariantDetailAbsoluteUrls(updated);
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
          product: {
            include: {
              category: true,
              images: { orderBy: { createdAt: 'asc' }, take: 1 },
            },
          },
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
      category: v.product.category?.name ?? '-',
      quantity: v.quantity,
      minStock: v.minStock,
      unit: v.unit ?? 'PC',
      price: v.price,
      costPrice: v.costPrice,
      imageUrl: v.product.images[0]?.url
        ? this.absoluteAssetUrl(v.product.images[0].url)
        : null,
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
