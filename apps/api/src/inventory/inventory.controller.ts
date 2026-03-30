import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { InventoryService } from './inventory.service';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /** Declared before `/:id` so paths like `variants/lookup` are not treated as ids. */
  @Get('variants/lookup')
  lookupByBarcode(@Req() req: Request, @Query('barcode') barcode?: string) {
    const b = barcode?.trim();
    if (!b) {
      throw new BadRequestException('Query parameter "barcode" is required');
    }
    return this.inventoryService.findVariantByBarcode(
      b,
      req.effectiveShopCode!,
    );
  }

  @Get('variants')
  findVariants(
    @Req() req: Request,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
    @Query('q') q?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const size = Math.min(
      100,
      Math.max(1, parseInt(sizeStr ?? '20', 10) || 20),
    );
    const rawCat = category?.trim();
    const catFilter =
      rawCat && rawCat.toLowerCase() !== 'all' ? rawCat : undefined;
    const searchText = (q ?? search)?.trim() || undefined;
    const onlyActive =
      activeOnly === '1' ||
      activeOnly === 'true' ||
      activeOnly === 'yes';

    return this.inventoryService.findVariantsPage(
      req.effectiveShopCode!,
      page,
      size,
      {
        search: searchText,
        category: catFilter,
        activeOnly: onlyActive || undefined,
      },
    );
  }

  @Get('variants/:id')
  findVariantById(@Req() req: Request, @Param('id') id: string) {
    return this.inventoryService.findVariantById(id, req.effectiveShopCode!);
  }

  @Patch('variants/:id')
  updateVariant(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.inventoryService.updateVariant(
      id,
      dto,
      req.effectiveShopCode!,
    );
  }
}
