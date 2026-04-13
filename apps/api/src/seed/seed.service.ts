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
  constructor(private readonly prisma: PrismaService) { }

  async run(): Promise<void> {
    if (!process.env['DATABASE_URL']) {
      throw new Error(
        'DATABASE_URL is required (set it in .env or the environment)',
      );
    }

    const shopCode = process.env['SEED_SHOP_CODE'] ?? 'SH000001';
    const isFactory = shopCode.toLowerCase().includes('factory') || shopCode === 'FACTORY01';

    if (process.env['SEED_CLEAN'] === 'true') {
      console.log(`🧹 Cleaning existing data for shop ${shopCode}...`);
      const productsToDelete = await this.prisma.product.findMany({
        where: { shopCode },
        select: { id: true }
      });
      const productIds = productsToDelete.map(p => p.id);

      await this.prisma.productVariant.deleteMany({
        where: { productId: { in: productIds } }
      });
      await this.prisma.product.deleteMany({
        where: { shopCode }
      });
    }

    console.log(`🚀 Processing ${productMap.size} products into ${shopCode} (Factory: ${isFactory})`);

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
        // High stock for Factory, default for retail
        const initialQuantity = isFactory ? 5000 : (variant.unit === Unit.KG ? 20 : 100);

        await this.prisma.productVariant.create({
          data: {
            productId: product.id,
            name: extractVariant(variant.name),
            price: variant.price,
            hsnCode: variant.hsnCode,
            unit: variant.unit,
            quantity: initialQuantity,
            barcode: randomUUID(),
          },
        });
      }
    }

    console.log('✅ FULL DATA SEEDED SUCCESSFULLY');
  }

  async fixCategories(): Promise<void> {
    console.log('Skipping category fix (not implemented)');
  }
}
