'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';

export type ProductBadge = 'TOP SELLER' | 'SEASONAL' | null;

export interface ProductCardProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  imageUrl?: string | null;
  category?: string | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
  badge?: ProductBadge;
  onAdd: (product: ProductCardProduct) => void;
}

const placeholderImage = 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=500&fit=crop';

export function ProductCard({ product, badge, onAdd }: ProductCardProps) {
  const priceDisplay = product.unit
    ? `₹${product.price}/${product.unit}`
    : `₹${product.price}`;

  return (
    <article className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden border border-[var(--pearl-bush)] hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/5] bg-[var(--linen-95)]">
        <Image
          src={product.imageUrl || placeholderImage}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
        {badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              badge === 'TOP SELLER'
                ? 'bg-[var(--ochre-500)] text-white'
                : 'bg-[var(--bistre-700)] text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-[var(--bistre-700)]">
            {priceDisplay}
          </span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ochre-500)] text-white hover:bg-[var(--ochre-600)] transition-colors"
            aria-label={`Add ${product.name} to bill`}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
