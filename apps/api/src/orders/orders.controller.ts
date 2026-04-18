import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, ShopScopeGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('pos')
  @RequirePermission('canAccessBilling')
  createPos(@Req() req: Request, @Body() dto: CreatePosOrderDto) {
    const user = req.user;
    return this.ordersService.createPosOrder(
      req.effectiveShopCode!,
      user?.id,
      dto,
    );
  }

  @Get()
  @RequirePermission('canAccessOrders')
  list(
    @Req() req: Request,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
    @Query('q') q?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const size = Math.min(
      100,
      Math.max(1, parseInt(sizeStr ?? '15', 10) || 15),
    );
    return this.ordersService.findPage(req.effectiveShopCode!, page, size, q);
  }

  @Get(':id')
  @RequirePermission('canAccessOrders')
  findOne(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(req.effectiveShopCode!, id);
  }
}
