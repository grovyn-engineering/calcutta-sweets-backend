import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { CreateShopWithInventoryDto } from './dto/create-shop-with-inventory.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBarcode() {
    const lastShop = await this.prisma.shop.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
  
    let nextNumber = 1;
  
    if (lastShop?.shopCode) {
      const lastNumber = parseInt(lastShop.shopCode.replace('SH', ''));
      nextNumber = lastNumber + 1;
    }
  
    return `SH${nextNumber.toString().padStart(6, '0')}`;
  }

  async create(createShopDto: CreateShopDto) {
    const shopCode = await this.generateBarcode();
    createShopDto.shopCode = shopCode;
    return this.prisma.shop.create({
      data: {
        ...createShopDto,
        shopCode: shopCode,
      },
    });
  }

  async createWithInitialInventory(dto: CreateShopWithInventoryDto) {
    const shopCode = dto.shopCode || (await this.generateBarcode());

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the new Shop
      const newShop = await tx.shop.create({
        data: {
          name: dto.name,
          shopCode,
          currency: dto.currency || 'INR',
        },
      });

      if (!dto.initialInventory || dto.initialInventory.length === 0) {
        return newShop;
      }

      // 2. Clone inventory items
      for (const item of dto.initialInventory) {
        // Find source variant and its parent product
        const sourceVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!sourceVariant) continue;

        // Check if the product already exists in the new shop (by name)
        let targetProduct = await tx.product.findFirst({
          where: {
            name: sourceVariant.product.name,
            shopCode: newShop.shopCode,
          },
        });

        // If not, clone the product
        if (!targetProduct) {
          targetProduct = await tx.product.create({
            data: {
              name: sourceVariant.product.name,
              description: sourceVariant.product.description,
              categoryId: sourceVariant.product.categoryId,
              shopCode: newShop.shopCode,
              isActive: sourceVariant.product.isActive,
            },
          });
        }

        // Create the variant in the new shop
        await tx.productVariant.create({
          data: {
            productId: targetProduct.id,
            name: sourceVariant.name,
            price: sourceVariant.price,
            costPrice: sourceVariant.costPrice,
            barcode: sourceVariant.barcode,
            sku: sourceVariant.sku,
            unit: sourceVariant.unit,
            quantity: item.quantity,
          },
        });

        // Decrement stock from source shop (Physical transfer)
        await tx.productVariant.update({
          where: { id: sourceVariant.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return newShop;
    });
  }

  async findAll() {
    return this.prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { products: true, users: true },
    });
    if (!shop) {
      throw new NotFoundException(`Shop #${id} not found`);
    }
    return shop;
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    await this.findOne(id);
    return this.prisma.shop.update({
      where: { id },
      data: updateShopDto,
    });
  }

  async isFactory(shopCode: string): Promise<boolean> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
      select: { isFactory: true },
    });
    return !!shop?.isFactory;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shop.delete({
      where: { id },
    });
  }
}
