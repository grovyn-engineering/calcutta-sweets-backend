import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransferStatus } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { StockTransfersService } from './stock-transfers.service';
import { ShopsService } from '../shops/shops.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('stock-transfers')
@UseGuards(JwtAuthGuard, ShopScopeGuard, PermissionsGuard)
@RequirePermission('canAccessInventory')
export class StockTransfersController {
  constructor(
    private readonly service: StockTransfersService,
    private readonly shopsService: ShopsService
  ) { }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTransferDto) {
    const user = req.user as any;
    return this.service.create(dto, req.effectiveShopCode!, user?.id);
  }

  @Get()
  async findAll(@Req() req: Request, @Query('status') status?: string) {
    const isFactory = await this.shopsService.isFactory(req.effectiveShopCode!);
    if (!isFactory) {
      // If not factory, they can't see the transfer list (user's request: "Stock Transfers only for Factory")
      return [];
    }

    const s = status?.toUpperCase() as TransferStatus | undefined;
    const validStatuses: string[] = Object.values(TransferStatus);
    const statusFilter = s && validStatuses.includes(s) ? s : undefined;
    return this.service.findAll(req.effectiveShopCode!, statusFilter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.service.approve(id, user?.id, req.effectiveShopCode!);
  }

  @Patch(':id/reject')
  reject(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.service.reject(id, user?.id, req.effectiveShopCode!);
  }

  @Patch(':id/fulfill')
  fulfill(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.service.fulfill(id, user?.id, req.effectiveShopCode!);
  }
}
