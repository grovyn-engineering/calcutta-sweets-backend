import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { purgeShopCatalog } from './shop-catalog-purge';

@Injectable()
export class ShopCatalogPurgeService {
  constructor(private readonly prisma: PrismaService) {}

  async purgeCurrentShop(targetShopCode: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode: targetShopCode },
    });
    if (!shop) {
      throw new BadRequestException(`Shop "${targetShopCode}" not found`);
    }
    if (shop.isFactory) {
      throw new BadRequestException(
        'The factory shop cannot be wiped. Switch to a retail location.',
      );
    }

    try {
      return await purgeShopCatalog(this.prisma, targetShopCode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(msg);
    }
  }
}
