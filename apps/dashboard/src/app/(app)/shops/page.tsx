'use client';

import type { Shop } from "@prisma/client";
import useFetch from "@/hooks/useFetch";
import ShopCard from "@/components/ShopCard/ShopCard";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { Button } from "antd";
import { PlusCircle, Store } from "lucide-react";
import CreateShopWizard from "./CreateShopWizard";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState/EmptyState";

export default function ShopsPage() {
  const { data, loading, fetchApi } = useFetch('/shops', { method: 'GET' });
  const [wizardOpen, setWizardOpen] = useState(false);

  if (loading && !data) return <LoadingDots />;
  
  const shops = ((data as Shop[]) || []).filter(s => !s.isFactory);

  return (
    <div className="p-2">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--bistre-950)' }}>Shops</h1>
          <p style={{ color: 'var(--bistre-500)', fontSize: '14px' }}>Manage retail locations and inventory templates.</p>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusCircle size={18} />}
          onClick={() => setWizardOpen(true)}
          style={{ height: 48, borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          Add New Shop
        </Button>
      </div>

      {shops.length === 0 ? (
        <EmptyState 
          message="No shops found" 
          description="Click the button above to create your first retail location."
          icon={<Store size={48} />}
        />
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 24 
        }}>
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}

      <CreateShopWizard 
        open={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        onSuccess={() => {
          setWizardOpen(false);
          fetchApi(); // Refresh the list
        }}
      />
    </div>
  );
}
