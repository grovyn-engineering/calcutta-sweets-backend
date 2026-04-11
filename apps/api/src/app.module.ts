import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { ProductsModule } from './products/products.module';
import { ShopsModule } from './shops/shops.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RoleRequestsModule } from './role-requests/role-requests.module';
import { SettingsModule } from './settings/settings.module';
import { PublicModule } from './public/public.module';
import { PaymentModule } from './payment/payment.module';
import { StockTransfersModule } from './stock-transfers/stock-transfers.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ShopsModule,
    ProductsModule,
    InventoryModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    OrdersModule,
    NotificationsModule,
    AnalyticsModule,
    RoleRequestsModule,
    SettingsModule,
    PublicModule,
    PaymentModule,
    StockTransfersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
