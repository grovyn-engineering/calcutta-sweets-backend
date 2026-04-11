'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import InventoryTable from '@/components/InventoryTable/InventoryTable';
import { Button } from 'antd';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './ShopDetailPage.module.css';

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopCode = params.shopCode as string;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            type="text" 
            icon={<ChevronLeft size={20} />} 
            onClick={() => router.push('/shops')}
            className={styles.backButton}
          >
            Back to Shops
          </Button>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Shop Inventory: {shopCode}</h1>
            <p className={styles.subtitle}>Viewing current stock levels for this retail location.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <InventoryTable shopCodeOverride={shopCode} />
      </div>
    </div>
  );
}
