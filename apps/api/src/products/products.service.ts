import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBarcode() {
    const lastProduct = await this.prisma.product.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
  
    let nextNumber = 1;
  
    if (lastProduct?.barcode) {
      const lastNumber = parseInt(lastProduct.barcode.replace('CS', ''));
      nextNumber = lastNumber + 1;
    }
  
    return `CS${nextNumber.toString().padStart(6, '0')}`;
  }
  async create(createProductDto: CreateProductDto) {
    const barcode = await this.generateBarcode();
    createProductDto.barcode = barcode;
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        barcode,
      },
    });
  }

  async findAll(shopCode?: string | null) {
    return this.prisma.product.findMany({
      where: shopCode ? { shopCode } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // throws if not found
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // throws if not found
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
