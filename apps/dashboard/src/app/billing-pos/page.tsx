'use client';

import { useState, useCallback } from 'react';
import useFetch from '@/hooks/useFetch';
import { LoadingDots } from '@/components/LoadingDots/LoadingDots';
import { ProductCard, type ProductCardProduct, type ProductBadge } from '@/components/ProductCard/ProductCard';
import { BillDrawer, type BillItem } from '@/components/BillDrawer/BillDrawer';
import { ShoppingCart } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'ALL' },
  { key: 'bengali', label: 'BENGALI MITHAI' },
  { key: 'dry', label: 'DRY SWEETS' },
  { key: 'seasonal', label: 'SEASONAL' },
];

export default function BillingPOSPage() {
  const { data: products, error, loading } = useFetch(
    `/products?shopCode=${process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE}`,
    { method: 'GET' }
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const addToBill = useCallback((product: ProductCardProduct) => {
    setBillItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
          unit: product.unit || 'unit',
        },
      ];
    });
    setDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromBill = useCallback((productId: string) => {
    setBillItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const getBadge = (product: ProductCardProduct): ProductBadge => {
    if (product.category?.toLowerCase().includes('seasonal')) return 'SEASONAL';
    return null;
  };

  if (loading) return <LoadingDots />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">
        Error: {String(error)}
      </div>
    );
  }

  const productList = Array.isArray(products) ? products : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? 'bg-[var(--ochre-100)] text-[var(--ochre-600)]'
                  : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--linen-95)] border border-[var(--pearl-bush)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ochre-500)] text-white font-medium hover:bg-[var(--ochre-600)] transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          Current Bill
          {billItems.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-sm">
              {billItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto">
        {productList.map((product: ProductCardProduct) => (
          <ProductCard
            key={product.id}
            product={product}
            badge={getBadge(product)}
            onAdd={addToBill}
          />
        ))}
      </div>

      {productList.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          No products found. Add products in the Products section.
        </div>
      )}

      <BillDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={billItems}
        onQuantityChange={updateQuantity}
        onRemove={removeFromBill}
        orderId="8429"
      />
    </div>
  );
}
