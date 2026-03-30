import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from '../email/email.module';
import { RedisService } from '../redis.provider';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ShopScopeGuard } from './shop-scope.guard';

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, JwtAuthGuard, RolesGuard, ShopScopeGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, ShopScopeGuard],
})
export class AuthModule {}
