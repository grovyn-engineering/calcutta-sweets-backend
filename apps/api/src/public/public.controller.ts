import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('menu/:shopCode')
    getMenu(@Param('shopCode') shopCode: string) {
        return this.publicService.getMenu(shopCode);
    }

    @Get('marketing-sweets/:shopCode')
    getMarketingSweets(@Param('shopCode') shopCode: string) {
        return this.publicService.getMarketingSweetsItems(shopCode);
    }

    @Post('order')
    createOrder(
        @Body()
        dto: {
            shopCode: string;
            customerName: string;
            customerPhone: string;
            customerEmail?: string;
            pickupTime: string;
            items: { productId: string; variantId: string; quantity: number }[];
        },
    ) {
        return this.publicService.createWebsiteOrder(dto);
    }
}
