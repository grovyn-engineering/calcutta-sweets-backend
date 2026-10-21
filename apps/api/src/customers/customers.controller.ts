import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequireAnyPermission } from '../auth/permissions.decorator';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, ShopScopeGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /** Saved customers of the active shop matching `q` (name or phone digits). */
  @Get()
  @RequireAnyPermission('canAccessBilling', 'canAccessOrders')
  search(
    @Req() req: Request,
    @Query('q') q?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = parseInt(limitStr ?? '20', 10) || 20;
    return this.customersService.search(req.effectiveShopCode!, q, limit);
  }

  /** Phone changes are limited to SUPER_ADMIN / ADMIN / MANAGER (checked in the service). */
  @Patch(':id')
  @RequireAnyPermission('canAccessBilling', 'canAccessOrders')
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      req.effectiveShopCode!,
      id,
      req.user?.role,
      dto,
    );
  }
}
