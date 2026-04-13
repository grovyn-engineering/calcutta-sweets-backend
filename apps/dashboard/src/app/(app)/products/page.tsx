"use client";

import { useState } from "react";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { ProductsPageContent } from "@/components/ProductsPage/ProductsPageContent";
import { useShop } from "@/contexts/ShopContext";

/**
 * Product catalog route; bumps `refreshKey` after creates so {@link ProductsPageContent} refetches.
 */
export default function ProductsPage() {
  const { effectiveShopCode } = useShop();
  const shopCode =
    effectiveShopCode ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    "";

  const [listVersion, setListVersion] = useState(0);

  if (!shopCode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <header>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Products</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Select a shop in the header to load the catalog.
          </p>
        </header>
        <ContentSkeleton variant="rows" rowCount={8} />
      </div>
    );
  }

  return (
    <ProductsPageContent
      shopCode={shopCode}
      refreshKey={listVersion}
      onRefresh={() => setListVersion((v) => v + 1)}
    />
  );
}
