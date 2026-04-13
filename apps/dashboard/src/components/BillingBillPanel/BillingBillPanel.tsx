'use client';

import { App, Button, Modal, InputNumber } from 'antd';
import Image from 'next/image';
import {
  UserPlus,
  Receipt,
  Banknote,
  CreditCard,
  Pencil,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import CustomerDetails, {
  type CustomerFormValues,
} from '../CustomerDetails';
import { useShop } from '@/contexts/ShopContext';
import { apiFetch } from '@/lib/api';
import {
  openPrintableInvoice,
  orderIdToInvoiceRef,
} from '@/lib/printInvoice';

export interface BillItem {
  variantId: string;
  productId: string;
  name: string;
  variantLabel: string;
  barcode: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  imageUrl?: string | null;
}

const placeholderImage =
  'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=100&h=100&fit=crop';
const DEFAULT_DISCOUNT = 0;

export type BillingBillPanelLayout = 'sidebar' | 'drawer';

export type PosPaymentMethod = 'CASH' | 'UPI_CARD';

export interface BillingBillPanelProps {
  items: BillItem[];
  onQuantityChange: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
  /** Called after the order is saved and the invoice print flow runs. */
  onSaleComplete?: () => void;
  orderId?: string;
  layout?: BillingBillPanelLayout;
  className?: string;
}

export function BillingBillPanel({
  items,
  onQuantityChange,
  onRemove,
  onSaleComplete,
  orderId = '-',
  layout = 'sidebar',
  className = '',
}: BillingBillPanelProps) {
  const { message } = App.useApp();
  const { shops, effectiveShopCode } = useShop();
  const currentShop = useMemo(
    () => shops.find((s) => s.shopCode === effectiveShopCode),
    [shops, effectiveShopCode],
  );

  const shopName = currentShop?.name ?? 'Calcutta Sweets';
  const cgstRate = currentShop?.cgstRate ?? 2.5;
  const sgstRate = currentShop?.sgstRate ?? 2.5;
  const totalTaxRate = (cgstRate + sgstRate) / 100;

  // With inclusive tax, "subtotal" here is the items gross total (sum of inclusive prices)
  const itemsGrossTotal = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );
  
  const [discount, setDiscount] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(0);
  
  // Total payable matches the gross minus discount
  const total = itemsGrossTotal - discount;

  // Calculate taxes backward from the total
  const gstAmount = total * (totalTaxRate / (1 + totalTaxRate));
  const cgstAmount = total * ((cgstRate / 100) / (1 + totalTaxRate));
  const sgstAmount = total * ((sgstRate / 100) / (1 + totalTaxRate));
  
  // The base amount (pre-tax) for reporting
  const baseAmount = total - gstAmount;

  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [customer, setCustomer] = useState<CustomerFormValues | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod | null>(
    null,
  );
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const lineCount = items.reduce((s, i) => s + i.quantity, 0);

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      message.warning('Add at least one item before generating a bill.');
      return;
    }
    if (!paymentMethod) {
      message.warning('Select a payment mode (Cash or UPI / Card) first.');
      return;
    }
    setCheckoutBusy(true);
    try {
      const res = await apiFetch('/orders/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          discount,
          customerName: customer?.name,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === 'string'
            ? payload.message
            : Array.isArray(payload?.message)
              ? payload.message.join(', ')
              : 'Could not save this sale. Check stock and try again.',
        );
        return;
      }
      const saved = payload as { id: string };
      const invoiceNo = orderIdToInvoiceRef(saved.id);
      const ok = openPrintableInvoice({
        shopName,
        shopCode: effectiveShopCode || '-',
        invoiceNo,
        customer,
        lines: items.map((i) => ({
          name: i.name,
          variantLabel: i.variantLabel,
          barcode: i.barcode,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
        })),
        subtotal: baseAmount, // Base amount for invoice
        gstRate: totalTaxRate,
        gstAmount: gstAmount,
        discount,
        total,
      });
      if (!ok) {
        message.error(
          'Sale saved, but the print window was blocked. Allow pop-ups to print the invoice.',
        );
      } else {
        message.success('Bill saved and sent to print.');
      }
      setPaymentMethod(null);
      setDiscount(0);
      onSaleComplete?.();
    } catch {
      message.error('Network error while saving the sale.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}
    >
      {layout === 'sidebar' && (
        <header className="shrink-0 border-b border-[var(--pearl-bush)] bg-[var(--linen-95)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Current sale
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {items.length === 0
              ? 'Scan a barcode or add a line below'
              : `${lineCount} item${lineCount === 1 ? '' : 's'} · Order #${orderId}`}
          </p>
        </header>
      )}

      <div className="mx-4 mt-4 shrink-0">
        {customer ? (
          <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] px-3 py-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ochre-100)] text-[var(--ochre-600)]">
                  <UserRound className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--bistre-400)]">
                    Customer
                  </p>
                  <p className="truncate font-semibold text-[var(--text-primary)]">
                    {customer.name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setShowCustomerDetails(true)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--ochre-10)] hover:text-[var(--ochre-600)]"
                  aria-label="Edit customer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCustomer(null)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove customer from sale"
                >
                  <span className="sr-only">Remove customer</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="pl-11 text-sm text-[var(--text-secondary)]">
              {customer.phone}
            </p>
            {customer.email ? (
              <p className="mt-0.5 pl-11 text-xs text-[var(--text-muted)]">
                {customer.email}
              </p>
            ) : null}
            {customer.address ? (
              <p className="mt-1 pl-11 text-xs leading-snug text-[var(--text-muted)] line-clamp-2">
                {customer.address}
              </p>
            ) : null}
          </div>
        ) : (
          <Button
            type="default"
            className="flex h-11 w-full items-center justify-center gap-2 font-medium text-[var(--text-primary)] border-[var(--pearl-bush)] hover:border-[var(--bistre-200)] hover:text-[var(--bistre-700)]"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowCustomerDetails(true)}
          >
            Add customer
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">
            No lines yet. Use the scanner field or pick a product from the list.
          </div>
        ) : (
          <ul className="space-y-4 pr-1">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex gap-3 border-b border-[var(--pearl-bush)] pb-4 last:border-0 last:pb-0"
              >
                <div className="relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 self-center rounded-lg bg-[var(--linen-95)]">
                  <Image
                    src={item.imageUrl || placeholderImage}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 48px, 64px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">
                        {item.name}
                      </p>
                      {item.variantLabel && item.variantLabel !== 'Regular' && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.variantLabel}
                        </p>
                      )}
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--bistre-400)]">
                        {item.barcode}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-[var(--text-primary)]">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {item.quantity} {item.unit} × ₹{item.unitPrice.toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-lg border border-[var(--pearl-bush)]">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.variantId, -1)}
                        className="min-h-8 min-w-8 sm:min-h-10 sm:min-w-10 px-1 sm:px-2 text-base sm:text-lg font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--linen-95)] active:bg-[var(--bistre-100)]"
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] sm:min-w-[2rem] text-center text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.variantId, 1)}
                        className="min-h-8 min-w-8 sm:min-h-10 sm:min-w-10 px-1 sm:px-2 text-base sm:text-lg font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--linen-95)] active:bg-[var(--ochre-100)]"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.variantId)}
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
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
        <div className="shrink-0 space-y-4 rounded-t-2xl border-t-2 border-[var(--pearl-bush)] bg-[var(--linen-95)] p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Items Total (Incl. Tax)</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{itemsGrossTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>CGST ({cgstRate}%)</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{cgstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>SGST ({sgstRate}%)</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{sgstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                Discount
                <button
                  type="button"
                  onClick={() => {
                    setTempDiscount(discount);
                    setIsDiscountModalOpen(true);
                  }}
                  className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--ochre-10)] hover:text-[var(--ochre-500)]"
                  aria-label="Edit discount"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{discount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-y border-[var(--pearl-bush)] py-2 sm:py-3">
            <span className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Payable total
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[var(--bistre-800)]">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <p className="text-xs font-medium text-[var(--text-muted)]">
            Payment mode <span className="text-red-600">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type={paymentMethod === 'CASH' ? 'primary' : 'default'}
              className="flex h-11 items-center justify-center gap-2 font-medium"
              icon={<Banknote className="h-4 w-4" />}
              onClick={() => setPaymentMethod('CASH')}
              style={
                paymentMethod === 'CASH'
                  ? {
                    backgroundColor: 'var(--ochre-600)',
                    borderColor: 'var(--ochre-600)',
                  }
                  : undefined
              }
            >
              Cash
            </Button>
            <Button
              type={paymentMethod === 'UPI_CARD' ? 'primary' : 'default'}
              className="flex h-11 items-center justify-center gap-2 font-medium"
              icon={<CreditCard className="h-4 w-4" />}
              onClick={() => setPaymentMethod('UPI_CARD')}
              style={
                paymentMethod === 'UPI_CARD'
                  ? {
                    backgroundColor: 'var(--ochre-600)',
                    borderColor: 'var(--ochre-600)',
                  }
                  : undefined
              }
            >
              UPI / Card
            </Button>
          </div>
          <Button
            type="primary"
            className="flex h-14 w-full items-center justify-center gap-2 text-base font-semibold disabled:opacity-50"
            icon={<Receipt className="h-5 w-5" />}
            style={{
              backgroundColor: 'var(--ochre-600)',
              borderColor: 'var(--ochre-600)',
            }}
            disabled={!paymentMethod || checkoutBusy}
            loading={checkoutBusy}
            onClick={() => void handleGenerateBill()}
          >
            Generate bill
          </Button>
        </div>
      )}

      <CustomerDetails
        open={showCustomerDetails}
        onCancel={() => setShowCustomerDetails(false)}
        initialValues={customer ?? undefined}
        onSave={(values) => setCustomer(values)}
      />

      <Modal
        title="Adjust Discount"
        open={isDiscountModalOpen}
        onOk={() => {
          setDiscount(tempDiscount);
          setIsDiscountModalOpen(false);
        }}
        onCancel={() => setIsDiscountModalOpen(false)}
        okText="Apply Discount"
        cancelText="Keep Current"
        okButtonProps={{ 
          style: { backgroundColor: 'var(--ochre-600)', borderColor: 'var(--ochre-600)' }
        }}
      >
        <div className="py-4">
          <p className="mb-2 text-sm text-[var(--text-secondary)]">Enter a fixed discount amount (₹) to apply to this sale.</p>
          <InputNumber
            className="w-full"
            size="large"
            min={0}
            max={itemsGrossTotal}
            value={tempDiscount}
            onChange={(val) => setTempDiscount(val ?? 0)}
            prefix="₹"
            placeholder="0.00"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
