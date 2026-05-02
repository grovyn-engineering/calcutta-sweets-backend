import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertIndianMobile10,
  normalizeIndianMobile,
} from '../common/indian-mobile';
import { PrismaService } from '../prisma.service';
import { OrderSource, OrderStatus } from '@calcutta/database';

@Injectable()
export class PublicService {
    constructor(private readonly prisma: PrismaService) { }

    async getMenu(shopCode: string) {
        const shop = await this.prisma.shop.findUnique({
            where: { shopCode },
            select: {
                shopCode: true,
                name: true,
                allowNextDayBooking: true,
                allowBookingWhenOutOfStock: true,
                upiId: true,
            }
        });

        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        const categories = await this.prisma.category.findMany({
            include: {
                products: {
                    where: {
                        shopCode,
                        isActive: true,
                        isListedOnWebsite: true,
                    },
                    include: {
                        variants: {
                            orderBy: { price: 'asc' },
                        },
                        images: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return {
            shop,
            categories,
        };
    }

    /**
     * Flat list of active website-listed products in the "Sweets" category for the marketing site admin sync.
     */
    async getMarketingSweetsItems(shopCode: string) {
        const shop = await this.prisma.shop.findUnique({
            where: { shopCode },
            select: { shopCode: true, name: true },
        });

        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        const sweetsCategory = await this.prisma.category.findFirst({
            where: { name: { equals: 'Sweets', mode: 'insensitive' } },
        });

        if (!sweetsCategory) {
            return { shop, items: [] };
        }

        const publicBase =
            process.env.INVENTORY_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';

        const products = await this.prisma.product.findMany({
            where: {
                shopCode,
                categoryId: sweetsCategory.id,
                isActive: true,
                isListedOnWebsite: true,
            },
            include: {
                variants: { orderBy: { price: 'asc' } },
                images: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { name: 'asc' },
        });

        const items = products.map((p) => {
            const variant = p.variants[0];
            const image = p.images[0];
            let imageUrl = image?.url ?? null;
            if (imageUrl && publicBase && imageUrl.startsWith('/')) {
                imageUrl = `${publicBase}${imageUrl}`;
            }

            return {
                inventoryProductId: p.id,
                name: p.name,
                description: p.description ?? '',
                price: variant ? Math.round(variant.price) : 0,
                unit: variant?.name?.trim() || '200g',
                categoryLabel: 'Sweets',
                imageUrl,
            };
        });

        return { shop, items };
    }

    async createWebsiteOrder(dto: {
        shopCode: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        pickupTime: string;
        items: { productId: string; variantId: string; quantity: number }[];
    }) {
        const shop = await this.prisma.shop.findUnique({
            where: { shopCode: dto.shopCode },
        });

        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        const customerPhone = normalizeIndianMobile(dto.customerPhone);
        if (!customerPhone) {
            throw new BadRequestException('customerPhone is required');
        }
        assertIndianMobile10(customerPhone, 'customerPhone');

        // Calculate total
        let totalAmount = 0;
        const orderItems: any[] = [];

        for (const item of dto.items) {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true },
            });

            if (!variant || variant.product.shopCode !== dto.shopCode) {
                throw new NotFoundException(`Product variant ${item.variantId} not found`);
            }

            // Inventory check
            if (!shop.allowBookingWhenOutOfStock && variant.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${variant.product.name} (${variant.name})`);
            }

            totalAmount += variant.price * item.quantity;
            orderItems.push({
                product: { connect: { id: variant.productId } },
                productVariant: { connect: { id: variant.id } },
                quantity: item.quantity,
                price: variant.price,
            });
        }

        return this.prisma.order.create({
            data: {
                shopCode: dto.shopCode,
                totalAmount,
                customerName: dto.customerName,
                customerPhone,
                customerEmail: dto.customerEmail,
                pickupTime: new Date(dto.pickupTime),
                orderSource: OrderSource.WEBSITE,
                status: OrderStatus.DRAFT,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                        productVariant: true,
                    },
                },
            },
        });
    }
}
