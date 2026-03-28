import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import {
  Unit,
  cleanName,
  extractVariant,
  getCategory,
  productMap,
} from './catalog';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (!process.env['DATABASE_URL']) {
      throw new Error(
        'DATABASE_URL is required (set it in .env or the environment)',
      );
    }

    const shopCode = process.env['SEED_SHOP_CODE'] ?? 'SH000001';

    await this.prisma.shop.upsert({
      where: { shopCode },
      create: {
        shopCode,
        name: process.env['SEED_SHOP_NAME'] ?? 'Calcutta Sweets',
      },
      update: {},
    });

    console.log(`🚀 Processing ${productMap.size} products`);

    const categoryCache: Record<string, string> = {};

    for (const [, variants] of Array.from(productMap.entries())) {
      const displayName = cleanName(variants[0].name);

      const categoryName = getCategory(displayName);

      if (!categoryCache[categoryName]) {
        const cat = await this.prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });

        categoryCache[categoryName] = cat.id;
      }

      const product = await this.prisma.product.create({
        data: {
          name: displayName,
          shopCode,
          categoryId: categoryCache[categoryName],
        },
      });

      for (const variant of variants) {
        await this.prisma.productVariant.create({
          data: {
            productId: product.id,
            name: extractVariant(variant.name),
            price: variant.price,
            hsnCode: variant.hsnCode,
            unit: variant.unit,
            quantity: variant.unit === Unit.KG ? 20 : 100,
            barcode: randomUUID(),
          },
        });
      }
    }

    console.log('✅ FULL DATA SEEDED WITH VARIANTS');
  }
}
