import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateCustomerDto } from './dto/create-customer.dto';
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

  /** Paginated customers with bill count / total spent, for the Customers screen. */
  @Get('list')
  @RequireAnyPermission('canAccessBilling', 'canAccessOrders')
  list(
    @Req() req: Request,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
    @Query('q') q?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const size = Math.min(
      100,
      Math.max(1, parseInt(sizeStr ?? '20', 10) || 20),
    );
    return this.customersService.findPage(
      req.effectiveShopCode!,
      page,
      size,
      q,
    );
  }

  @Post()
  @RequireAnyPermission('canAccessBilling', 'canAccessOrders')
  create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.effectiveShopCode!, dto);
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
