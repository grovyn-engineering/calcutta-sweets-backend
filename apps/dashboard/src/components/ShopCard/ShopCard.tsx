import React from 'react'
import { Button, Card } from 'antd'
import Image from 'next/image'
import { Shop } from '@prisma/client';
import ShopPlaceholder from '@/assets/shop.jpeg'
import { useRouter } from 'next/navigation';

const ShopCard = ({ shop }: { shop: Shop }) => {
    const router = useRouter();
    return (
        <Card style={{width: '300px'}}>
            <Card.Meta title={shop.name} description={shop.address} avatar={<Image src={shop.logoUrl ?? ShopPlaceholder} alt={shop.name} width={100} height={100} />} />
            <Button type="primary"
             onClick={() => {
                router.push(`/shops/${shop.shopCode}`);
            }}
            className='w-full mt-5'
            >
                View
            </Button>
        </Card>
    )
}

export default ShopCard