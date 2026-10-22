import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CreateWebsiteOrderDto } from './dto/create-website-order.dto';
import { PublicRateLimitGuard } from './rate-limit.guard';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('menu/:shopCode')
  getMenu(@Param('shopCode') shopCode: string) {
    return this.publicService.getMenu(shopCode);
  }

  @Get('marketing-sweets/:shopCode')
  getMarketingSweets(@Param('shopCode') shopCode: string) {
    return this.publicService.getMarketingSweetsItems(shopCode);
  }

  @Post('order')
  @UseGuards(PublicRateLimitGuard)
  createOrder(@Body() dto: CreateWebsiteOrderDto) {
    return this.publicService.createWebsiteOrder(dto);
  }
}
