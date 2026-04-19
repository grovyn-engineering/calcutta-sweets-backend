import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  syncFactoryCatalogToShop,
  syncFactoryCatalogToShopBatch,
} from './catalog-sync';
import type { CloneCatalogDto } from './dto/clone-catalog.dto';

@Injectable()
export class CatalogSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async cloneFactoryCatalogBatch(
    targetShopCode: string,
    dto: CloneCatalogDto,
  ) {
    const target = await this.prisma.shop.findUnique({
      where: { shopCode: targetShopCode },
    });
    if (!target) {
      throw new BadRequestException(`Shop "${targetShopCode}" not found`);
    }
    if (target.isFactory) {
      throw new BadRequestException(
        'Switch to a retail shop. The factory catalog is the source, not the destination.',
      );
    }

    const skip = dto.skip ?? 0;
    const take = dto.take ?? 6;

    try {
      return await syncFactoryCatalogToShopBatch(
        this.prisma,
        targetShopCode,
        skip,
        take,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(msg);
    }
  }

  async cloneFactoryCatalogFull(targetShopCode: string) {
    const target = await this.prisma.shop.findUnique({
      where: { shopCode: targetShopCode },
    });
    if (!target) {
      throw new BadRequestException(`Shop "${targetShopCode}" not found`);
    }
    if (target.isFactory) {
      throw new BadRequestException(
        'Switch to a retail shop. The factory catalog is the source, not the destination.',
      );
    }

    try {
      return await syncFactoryCatalogToShop(this.prisma, targetShopCode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(msg);
    }
  }
}
