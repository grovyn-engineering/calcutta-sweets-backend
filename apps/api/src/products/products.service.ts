import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Unit } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBarcode(): Promise<string> {
    const lastVariant = await this.prisma.productVariant.findFirst({
      where: { barcode: { startsWith: 'CS' } },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastVariant?.barcode) {
      const tail = lastVariant.barcode.replace(/^CS/, '');
      const lastNumber = parseInt(tail, 10);
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `CS${nextNumber.toString().padStart(6, '0')}`;
  }

  async create(createProductDto: CreateProductDto, shopCode: string) {
    const barcode =
      createProductDto.barcode ?? (await this.generateBarcode());

    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        shopCode,
        ...(createProductDto.categoryId
          ? { categoryId: createProductDto.categoryId }
          : {}),
        variants: {
          create: {
            name: 'Regular',
            price: createProductDto.price,
            barcode,
            quantity: 0,
            unit: Unit.PC,
          },
        },
      },
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

  /**
   * Paginated products for a shop (optional `page` on GET /products).
   * Supports `q` (name contains, case-insensitive) and `categoryId`.
   */
  async findPage(
    shopCode: string,
    page: number,
    size: number,
    opts?: { search?: string; categoryId?: string },
  ) {
    const search = opts?.search?.trim();
    const where: Prisma.ProductWhereInput = {
      shopCode,
      ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
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
      await tx.product.update({
        where: { id: existing.id },
        data: productFields,
      });

      if (price !== undefined || barcode !== undefined) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: id },
          orderBy: { createdAt: 'asc' },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              ...(price !== undefined ? { price } : {}),
              ...(barcode !== undefined ? { barcode } : {}),
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

  async remove(id: string, shopCode: string) {
    await this.findOneForShop(id, shopCode);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
