import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, ShopScopeGuard, PermissionsGuard)
@RequirePermission('canAccessDashboard')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Last 24 hours of new SKUs and current low-stock lines for the scoped shop. */
  @Get('activity')
  activity(@Req() req: Request) {
    return this.notificationsService.getShopActivity(req.effectiveShopCode!);
  }
}
