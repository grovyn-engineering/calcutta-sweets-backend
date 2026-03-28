import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type CategoryProductSummary = {
  id: string;
  name: string;
  totalStock: number;
};

export type CategoryShopSummary = {
  id: string;
  name: string;
  createdAt: Date;
  products: CategoryProductSummary[];
  totalStock: number;
};

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Categories with products (current shop) and per-product + total stock from variants. */
  async findAllWithShopSummary(shopCode: string): Promise<CategoryShopSummary[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        products: {
          where: { shopCode },
          include: {
            variants: { select: { quantity: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    return categories.map((cat) => {
      const products: CategoryProductSummary[] = cat.products.map((p) => {
        const totalStock = p.variants.reduce((s, v) => s + v.quantity, 0);
        return { id: p.id, name: p.name, totalStock };
      });
      const totalStock = products.reduce((s, p) => s + p.totalStock, 0);
      return {
        id: cat.id,
        name: cat.name,
        createdAt: cat.createdAt,
        products,
        totalStock,
      };
    });
  }

  async findOneSummaryForShop(id: string, shopCode: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    const agg = await this.prisma.productVariant.aggregate({
      where: {
        product: {
          categoryId: id,
          shopCode,
        },
      },
      _sum: { quantity: true },
    });
    const totalStock = agg._sum.quantity ?? 0;
    return { ...category, totalStock };
  }

  async findProductsPage(
    categoryId: string,
    shopCode: string,
    page: number,
    size: number,
  ) {
    await this.ensureCategoryExists(categoryId);

    const where = { categoryId, shopCode };

    const total = await this.prisma.product.count({ where });
    const lastPage = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(1, page), lastPage);

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (safePage - 1) * size,
      take: size,
      include: {
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    return {
      data: products,
      last_page: lastPage,
      page: safePage,
      size,
      total,
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({ data: createCategoryDto });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.ensureCategoryExists(id);
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async delete(id: string) {
    await this.ensureCategoryExists(id);
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }

  private async ensureCategoryExists(id: string) {
    const row = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Category #${id} not found`);
    }
  }
}
