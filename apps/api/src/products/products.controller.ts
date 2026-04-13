import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Req() req: Request, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(
      createProductDto,
      req.effectiveShopCode!,
    );
  }

  /**
   * Lists products for the scoped shop. If `page` is omitted, returns the full list; otherwise
   * paginates with optional `q` / `search`, `categoryId`, and `status` (`active` | `inactive`).
   */
  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
    @Query('q') q?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    const shop = req.effectiveShopCode;
    if (pageStr === undefined || pageStr === '') {
      return this.productsService.findAll(shop);
    }
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const size = Math.min(
      100,
      Math.max(1, parseInt(sizeStr ?? '20', 10) || 20),
    );
    const st = status?.trim().toLowerCase();
    const statusFilter =
      st === 'active' || st === 'inactive' ? st : undefined;
    return this.productsService.findPage(shop!, page, size, {
      search: (q ?? search)?.trim() || undefined,
      categoryId: categoryId?.trim() || undefined,
      status: statusFilter,
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.productsService.findOneForShop(id, req.effectiveShopCode!);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto, req.effectiveShopCode!);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.productsService.remove(id, req.effectiveShopCode!);
  }
}
