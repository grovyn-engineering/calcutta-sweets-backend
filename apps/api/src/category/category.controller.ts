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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAllForShop(@Req() req: Request) {
    return this.categoryService.findAllWithShopSummary(req.effectiveShopCode!);
  }

  @Get(':id/products')
  findProductsPage(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const size = Math.min(
      100,
      Math.max(1, parseInt(sizeStr ?? '20', 10) || 20),
    );
    return this.categoryService.findProductsPage(
      id,
      req.effectiveShopCode!,
      page,
      size,
    );
  }

  @Get(':id')
  findOneForShop(@Req() req: Request, @Param('id') id: string) {
    return this.categoryService.findOneSummaryForShop(
      id,
      req.effectiveShopCode!,
    );
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
