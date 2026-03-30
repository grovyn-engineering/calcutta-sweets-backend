'use client';

import type { Shop } from "@prisma/client";
import useFetch from "@/hooks/useFetch";
import ShopCard from "@/components/ShopCard/ShopCard";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";

export default function ShopsPage() {
  const { data, error, loading } = useFetch('/shops', { method: 'GET' });

  if (loading) return <LoadingDots />;
  // if (error) return <div>Error: {error as string}</div>;
  if (!data) return <div>No data</div>;
  if (!Array.isArray(data)) {
    return <div>Unexpected response from server.</div>;
  }

  const shops = data as Shop[];

  return (
    <div>
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  );
}
