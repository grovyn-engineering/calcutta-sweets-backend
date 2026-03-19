'use client';

import useFetch from "@/hooks/useFetch";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";

export default function ProductsPage() {
  const { data, error, loading } = useFetch(`/products?shopCode=${process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE}`, { method: 'GET' });

  if (loading) return <LoadingDots />;
  if (error) return <div>Error: {String(error)}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Products</h1>
      <p className="mt-3 text-[var(--text-secondary)] leading-relaxed">
        Manage your products here.
      </p>
    </div>
  );
}
