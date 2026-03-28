import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Rolling 24h product/variant additions + current low-stock alerts for the active shop. */
  @Get('activity')
  activity(@Req() req: Request) {
    return this.notificationsService.getShopActivity(req.effectiveShopCode!);
  }
}
