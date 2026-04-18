'use client';

import { Drawer } from 'antd';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import CustomerDetails, {
  type CustomerFormValues,
} from '@/components/CustomerDetails';
import {
  BillingBillPanel,
  type BillItem,
} from '@/components/BillingBillPanel/BillingBillPanel';

export type { BillItem };

interface BillDrawerProps {
  open: boolean;
  onClose: () => void;
  items: BillItem[];
  onQuantityChange: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
  onSaleComplete?: () => void;
  orderId?: string;
}

export function BillDrawer({
  open,
  onClose,
  items,
  onQuantityChange,
  onRemove,
  onSaleComplete,
  orderId = '-',
}: BillDrawerProps) {
  const [customer, setCustomer] = useState<CustomerFormValues | null>(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

  return (
    <>
    <Drawer
      title={
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            Current bill
          </span>
          <span className="text-xs font-normal text-[var(--text-muted)]">
            Order #{orderId}
          </span>
        </div>
      }
      placement="right"
      size={400}
      onClose={onClose}
      open={open}
      styles={{
        body: {
          padding: '16px 0 24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
        header: { borderBottom: '1px solid var(--pearl-bush)' },
      }}
      extra={
        <button
          type="button"
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--linen-95)]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      }
    >
      <BillingBillPanel
        layout="drawer"
        className="px-4"
        items={items}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onSaleComplete={onSaleComplete}
        orderId={orderId}
        customerBinding={{
          customer,
          setCustomer,
          detailsOpen: customerDetailsOpen,
          setDetailsOpen: setCustomerDetailsOpen,
        }}
      />
    </Drawer>
    <CustomerDetails
      open={customerDetailsOpen}
      onCancel={() => setCustomerDetailsOpen(false)}
      initialValues={customer ?? undefined}
      onSave={(values) => setCustomer(values)}
    />
    </>
  );
}
