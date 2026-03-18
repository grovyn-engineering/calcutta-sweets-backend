import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shop.delete({
      where: { id },
    });
  }
}
