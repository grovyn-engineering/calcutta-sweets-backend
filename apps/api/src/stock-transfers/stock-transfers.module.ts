import { Module } from '@nestjs/common';
import { StockTransfersController } from './stock-transfers.controller';
import { StockTransfersService } from './stock-transfers.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ShopsModule } from '../shops/shops.module';

@Module({
  imports: [PrismaModule, AuthModule, ShopsModule],
  controllers: [StockTransfersController],
  providers: [StockTransfersService],
})
export class StockTransfersModule {}
