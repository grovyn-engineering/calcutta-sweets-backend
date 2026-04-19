import {
  BadRequestException,
  ConflictException,
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
    const row = await this.prisma.productVariant.findFirst({
      where: {
        barcode,
        product: { shopCode },
      },
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
    const existing = await this.findVariantById(id, shopCode);

    if (dto.barcode !== undefined) {
      const next = dto.barcode.trim();
      if (!next) {
        throw new BadRequestException('Barcode cannot be empty');
      }
      if (next !== existing.barcode) {
        const taken = await this.prisma.productVariant.findFirst({
          where: {
            barcode: next,
            NOT: { id },
            product: { shopCode },
          },
        });
        if (taken) {
          throw new ConflictException(
            'That barcode is already used by another variant',
          );
        }
      }
    }

    const variantName =
      dto.name !== undefined ? dto.name.trim() : undefined;
    if (variantName !== undefined && !variantName) {
      throw new BadRequestException('Variant name cannot be empty');
    }

    const productName =
      dto.productName !== undefined ? dto.productName.trim() : undefined;
    if (productName !== undefined && !productName) {
      throw new BadRequestException('Product name cannot be empty');
    }

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
        ...(variantName !== undefined ? { name: variantName } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode.trim() } : {}),
        product: {
          update: {
            ...(productName !== undefined ? { name: productName } : {}),
            ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
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

  async deleteVariantsByIds(shopCode: string, variantIds: string[]) {
    const unique = [...new Set(variantIds)].filter(Boolean);
    if (unique.length === 0) {
      throw new BadRequestException('Select at least one variant');
    }

    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
      select: { isFactory: true },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    if (shop.isFactory) {
      throw new BadRequestException(
        'Bulk variant delete is not available for the factory warehouse',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const found = await tx.productVariant.findMany({
        where: { id: { in: unique }, product: { shopCode } },
        select: { id: true, productId: true },
      });
      if (found.length !== unique.length) {
        throw new BadRequestException(
          'Some variants were not found in this shop or may have already been removed',
        );
      }

      const ids = found.map((f) => f.id);

      await tx.orderItem.deleteMany({
        where: { productVariantId: { in: ids } },
      });

      await tx.productVariant.deleteMany({
        where: { id: { in: ids } },
      });

      const productIds = [...new Set(found.map((f) => f.productId))];
      let productsRemoved = 0;
      for (const pid of productIds) {
        const left = await tx.productVariant.count({
          where: { productId: pid },
        });
        if (left === 0) {
          await tx.productImage.deleteMany({ where: { productId: pid } });
          await tx.product.delete({ where: { id: pid } });
          productsRemoved += 1;
        }
      }

      const emptyCats = await tx.category.findMany({
        where: { products: { none: {} } },
        select: { id: true },
      });
      const catDel = await tx.category.deleteMany({
        where: { id: { in: emptyCats.map((c) => c.id) } },
      });

      return {
        variantsRemoved: ids.length,
        productsRemoved,
        orphanCategoriesRemoved: catDel.count,
      };
    });
  }
}
