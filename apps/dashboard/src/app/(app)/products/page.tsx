"use client";

import { useState } from "react";
import useFetch from "@/hooks/useFetch";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { ProductsPageContent } from "@/components/ProductsPage/ProductsPageContent";
import type { ProductWithRelations } from "@/components/ProductCard/ProductCard";
import { useShop } from "@/contexts/ShopContext";

function isProductArray(data: unknown): data is ProductWithRelations[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        "name" in item,
    )
  );
}

export default function ProductsPage() {
  const { effectiveShopCode } = useShop();
  const shopCode =
    effectiveShopCode ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    "";
    
  const [listVersion, setListVersion] = useState(0);

  const { data, error, loading } = useFetch(
    shopCode ? `/products` : "",
    { method: "GET" },
    [effectiveShopCode, listVersion],
  );

  if (!shopCode || loading) return <LoadingDots fullScreen />;
  if (error) return <div>Error: {String(error)}</div>;
  if (!data) return <div>No data</div>;

  if (!isProductArray(data)) {
    return (
      <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 shadow-sm text-[var(--text-secondary)]">
        Unexpected response from server.
      </div>
    );
  }

  return <ProductsPageContent products={data} onRefresh={() => setListVersion(v => v + 1)} />;
}
