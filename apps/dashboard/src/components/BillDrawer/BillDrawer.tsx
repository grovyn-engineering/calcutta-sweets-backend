'use client';

import { Drawer, Button } from 'antd';
import Image from 'next/image';
import { UserPlus, MoreHorizontal, Receipt, Banknote, CreditCard, Pencil } from 'lucide-react';
import type { ProductCardProduct } from '../ProductCard/ProductCard';

export interface BillItem {
  product: ProductCardProduct;
  quantity: number;
  unitPrice: number;
  unit?: string | null;
}

interface BillDrawerProps {
  open: boolean;
  onClose: () => void;
  items: BillItem[];
  onQuantityChange: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  orderId?: string;
}

const placeholderImage = 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=100&h=100&fit=crop';
const GST_RATE = 0.05;
const DEFAULT_DISCOUNT = 0;

export function BillDrawer({
  open,
  onClose,
  items,
  onQuantityChange,
  onRemove,
  orderId = '—',
}: BillDrawerProps) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const gst = subtotal * GST_RATE;
  const discount = DEFAULT_DISCOUNT;
  const total = subtotal + gst - discount;

  return (
    <Drawer
      title={
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            Current Bill
          </span>
          <span className="text-xs text-[var(--text-muted)] font-normal">
            ORDER #{orderId}
          </span>
        </div>
      }
      placement="right"
      width={400}
      onClose={onClose}
      open={open}
      styles={{
        body: { padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' },
        header: { borderBottom: '1px solid var(--pearl-bush)' },
      }}
      extra={
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-[var(--linen-95)] text-[var(--text-secondary)]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      }
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <Button
          type="default"
          className="w-full mb-4 flex items-center justify-center gap-2 h-11 font-medium text-[var(--text-primary)] border-[var(--pearl-bush)] hover:border-[var(--bistre-200)] hover:text-[var(--bistre-700)]"
          icon={<UserPlus className="h-4 w-4" />}
        >
          Add Customer
        </Button>

        <div className="flex-1 overflow-y-auto min-h-0">
          {items.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">
              Add products to start billing
            </div>
          ) : (
            <ul className="space-y-4 pr-2">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex gap-4 pb-4 border-b border-[var(--pearl-bush)] last:border-0 last:pb-0"
                >
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-[var(--linen-95)] self-center">
                    <Image
                      src={item.product.imageUrl || placeholderImage}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between gap-2 items-start">
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {item.product.name}
                      </p>
                      <p className="font-semibold text-[var(--text-primary)] shrink-0">
                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {item.quantity} {item.unit || 'unit'} × ₹{item.unitPrice.toFixed(2)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-[var(--pearl-bush)] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.product.id, -1)}
                          className="min-w-[44px] min-h-[44px] px-3 py-2.5 text-lg font-medium text-[var(--text-primary)] hover:bg-[var(--linen-95)] active:bg-[var(--bistre-100)] transition-colors"
                        >
                          −
                        </button>
                        <span className="min-w-[2.5rem] text-center font-medium text-[var(--text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.product.id, 1)}
                          className="min-w-[44px] min-h-[44px] px-3 py-2.5 text-lg font-medium text-[var(--text-primary)] hover:bg-[var(--linen-95)] active:bg-[var(--ochre-100)] transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.product.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 pt-4 pb-6 border-t-2 border-[var(--pearl-bush)] space-y-4 shrink-0 bg-[var(--linen-95)] p-4 -mx-6 px-6 rounded-t-2xl">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--text-primary)]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>GST (5%)</span>
                <span className="font-medium text-[var(--text-primary)]">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)] items-center">
                <span className="flex items-center gap-1.5">
                  Discount
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--ochre-500)] hover:bg-[var(--ochre-10)] transition-colors"
                    aria-label="Edit discount"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </span>
                <span className="font-medium text-[var(--text-primary)]">₹{discount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline py-3 border-y border-[var(--pearl-bush)]">
              <span className="font-semibold text-[var(--text-primary)]">
                Payable Total
              </span>
              <span className="text-2xl font-bold text-[var(--bistre-800)]">
                ₹{total.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="default"
                className="flex items-center justify-center gap-2 h-11 font-medium border-[var(--pearl-bush)] text-[var(--text-primary)] hover:border-[var(--bistre-200)]"
                icon={<Banknote className="h-4 w-4" />}
              >
                Cash
              </Button>
              <Button
                type="default"
                className="flex items-center justify-center gap-2 h-11 font-medium border-[var(--pearl-bush)] text-[var(--text-primary)] hover:border-[var(--bistre-200)]"
                icon={<CreditCard className="h-4 w-4" />}
              >
                UPI / Card
              </Button>
            </div>
            <Button
              type="primary"
              className="w-full flex items-center justify-center gap-2 h-14 text-base font-semibold"
              icon={<Receipt className="h-5 w-5" />}
              style={{
                backgroundColor: 'var(--ochre-600)',
                borderColor: 'var(--ochre-600)',
              }}
            >
              GENERATE BILL
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
