import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogSyncService } from './catalog-sync.service';
import { ShopCatalogPurgeService } from './shop-catalog-purge.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, CatalogSyncService, ShopCatalogPurgeService],
})
export class InventoryModule {}
