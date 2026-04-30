'use client';

import { App, Button, Checkbox, Modal, InputNumber, Select, Tooltip } from 'antd';
import {
  UserPlus,
  Receipt,
  Printer,
  Bluetooth,
  Banknote,
  CreditCard,
  Pencil,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CustomerFormValues } from '../CustomerDetails';
import { useShop } from '@/contexts/ShopContext';
import { apiFetch } from '@/lib/api';
import {
  makeInvoiceNo,
  openPrintableInvoice,
  orderIdToInvoiceRef,
  type PrintInvoiceInput,
} from '@/lib/printInvoice';
import {
  allowedInstantDisplayUnits,
  billDisplayUnitPrice,
  billLineSubtotal,
} from '@/lib/billingInstantPricing';
import { ProductLineThumb } from '@/components/ProductLineThumb/ProductLineThumb';
import {
  isNativeUsbPrinterAvailable,
  printBillViaNativeAndroid,
  type NativeAndroidBillPayload,
} from '@/lib/usbPrinter';
import type { RawBillFormValues } from '@/components/BillingPosRawSection/BillingPosRawSection';
import {
  buildPlainTextReceiptForRawBt,
  isLikelyAndroidForRawBt,
  launchRawBtPrintFromBill,
  THERMAL_POWERED_BY_LINE,
} from '@/lib/rawBtPrint';

export interface BillItem {
  lineId: string;
  variantId: string;
  productId: string;
  name: string;
  variantLabel: string;
  barcode: string;
  catalogUnitPrice: number;
  stockUnitsToDeduct: number;
  displayQuantity: number;
  displayUnit: string;
  inventoryUnit: string;
  imageUrl?: string | null;
  isInstant?: boolean;
  /** Manual line: not tied to catalog; checkout prints only (no order / stock). */
  isRaw?: boolean;
}

export type ManualSaleCustomer = {
  name: string;
  gstin?: string | null;
};

export type BillingBillPanelLayout = 'sidebar' | 'drawer';

export type PosPaymentMethod = 'CASH' | 'UPI_CARD';

export type BillingCustomerBinding = {
  customer: CustomerFormValues | null;
  setCustomer: (value: CustomerFormValues | null) => void;
  detailsOpen: boolean;
  setDetailsOpen: (open: boolean) => void;
};

/** Exposes the same checkout actions as the sale panel (for Raw tab quick actions). */
export type BillingPosCheckoutApi = {
  printBrowser: () => void;
  printThermal: () => void;
  printRawBt: () => void;
  busy: boolean;
  canPrint: boolean;
  showUsbThermal: boolean;
};

export interface BillingBillPanelProps {
  items: BillItem[];
  onQuantityChange: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
  onInstantLineUpdate?: (
    lineId: string,
    next: { displayQuantity: number; displayUnit: string },
  ) => void;
  onSaleComplete?: () => void;
  orderId?: string;
  layout?: BillingBillPanelLayout;
  className?: string;
  customerBinding?: BillingCustomerBinding;
  hideAddCustomerInPanel?: boolean;
  manualSaleCustomer?: ManualSaleCustomer | null;
  /** Used for raw-tab GSTIN checkbox when building the native thermal payload */
  rawBillForm?: RawBillFormValues | null;
  /** Register checkout handlers (e.g. Raw billing tab duplicate buttons). */
  onCheckoutApi?: (api: BillingPosCheckoutApi | null) => void;
}

export function BillingBillPanel({
  items,
  onQuantityChange,
  onRemove,
  onInstantLineUpdate,
  onSaleComplete,
  orderId = '-',
  layout = 'sidebar',
  className = '',
  customerBinding,
  hideAddCustomerInPanel = false,
  manualSaleCustomer = null,
  rawBillForm = null,
  onCheckoutApi,
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

  const itemsGrossTotal = items.reduce(
    (sum, i) =>
      sum + billLineSubtotal(i.stockUnitsToDeduct, i.catalogUnitPrice),
    0,
  );
  
  const [discount, setDiscount] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(0);
  const [showGstinOnBill, setShowGstinOnBill] = useState(true);

  const total = itemsGrossTotal - discount;

  const gstAmount = total * (totalTaxRate / (1 + totalTaxRate));
  const cgstAmount = total * ((cgstRate / 100) / (1 + totalTaxRate));
  const sgstAmount = total * ((sgstRate / 100) / (1 + totalTaxRate));

  const shopAddressPrint = useMemo(() => {
    if (!currentShop) return null;
    const parts = [
      currentShop.address,
      [currentShop.city, currentShop.state].filter(Boolean).join(', '),
      currentShop.pincode,
    ].filter((x) => x?.trim());
    return parts.length ? parts.join(', ') : null;
  }, [currentShop]);

  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false);
  const [internalCustomer, setInternalCustomer] =
    useState<CustomerFormValues | null>(null);
  const customer = customerBinding?.customer ?? internalCustomer;
  const setCustomer = customerBinding?.setCustomer ?? setInternalCustomer;
  const detailsOpen = customerBinding?.detailsOpen ?? internalDetailsOpen;
  const setDetailsOpen = customerBinding?.setDetailsOpen ?? setInternalDetailsOpen;
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod | null>(
    null,
  );
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const lineCount = items.length;

  const rawManualNameOnBill =
    items.some((i) => i.isRaw) && Boolean(manualSaleCustomer?.name?.trim());

  const buildNativeAndroidBill = (billNo: string): NativeAndroidBillPayload => {
    const hasRaw = items.some((i) => i.isRaw);
    const fallbackAddress = [currentShop?.city, currentShop?.state]
      .filter(Boolean)
      .join(', ');
    const address = shopAddressPrint?.trim() || fallbackAddress || '';

    const customerName = hasRaw
      ? (manualSaleCustomer?.name?.trim() ?? '')
      : (customer?.name?.trim() ?? '');
    const customerPhone = hasRaw ? '' : (customer?.phone?.trim() ?? '');
    const customerGstinVal = hasRaw
      ? rawBillForm?.includeCustomerGstin
        ? (rawBillForm.customerGstin?.trim() ?? '')
        : ''
      : (customer?.gstin?.trim() ?? '');
    const showCustomerGstin = hasRaw
      ? Boolean(rawBillForm?.includeCustomerGstin && customerGstinVal.length > 0)
      : customerGstinVal.length > 0;

    const taxableBase = Math.max(0, total - gstAmount);

    const base: NativeAndroidBillPayload = {
      shopName,
      shopAddress: address,
      shopPhone: currentShop?.phone?.trim() ?? '',
      gstin: currentShop?.gstNumber?.trim() ?? '',
      showShopGstin: showGstinOnBill,
      fssaiNumber: currentShop?.fssaiNumber?.trim() ?? '',
      billNumber: billNo,
      billTitle: 'TAX INVOICE',
      billerName: '',
      customerName,
      customerPhone,
      customerGstin: customerGstinVal,
      showCustomerGstin,
      items: items.map((i) => {
        const rate = billDisplayUnitPrice(
          i.stockUnitsToDeduct,
          i.catalogUnitPrice,
          i.displayQuantity,
        );
        const amount = billLineSubtotal(
          i.stockUnitsToDeduct,
          i.catalogUnitPrice,
        );
        const name =
          i.variantLabel && i.variantLabel !== 'Regular'
            ? `${i.name} (${i.variantLabel})`
            : i.name;
        return { name, qty: i.displayQuantity, rate, amount, discount: 0 };
      }),
      taxableBase,
      subtotal: taxableBase,
      discount,
      tax: gstAmount,
      taxLabel: `GST ${(cgstRate + sgstRate).toFixed(1)}%`,
      cgstPercent: cgstRate,
      sgstPercent: sgstRate,
      cgstAmount,
      sgstAmount,
      total,
      paymentMode: paymentMethod === 'CASH' ? 'Cash' : 'Digital Payment',
      amountPaid: total,
      footerMessage: 'Thank You. Come Again!',
      footerNote: '* Tax not payable on reverse charge basis',
      bankAccountNumber: currentShop?.bankAccountNumber?.trim() ?? '',
      bankIfsc: currentShop?.bankIfsc?.trim() ?? '',
      poweredBy: THERMAL_POWERED_BY_LINE,
      issuedAt: new Date().toISOString(),
    };
    return {
      ...base,
      thermalPlainText: buildPlainTextReceiptForRawBt(base),
    };
  };

  const buildPrintInvoiceInput = (invoiceNo: string): PrintInvoiceInput => {
    const hasRaw = items.some((i) => i.isRaw);
    const printCustomer: CustomerFormValues | null = hasRaw
      ? manualSaleCustomer?.name?.trim()
        ? {
            name: manualSaleCustomer.name.trim(),
            phone: customer?.phone?.trim() ?? '',
            gstin: rawBillForm?.includeCustomerGstin
              ? rawBillForm.customerGstin?.trim() || undefined
              : undefined,
          }
        : null
      : customer;

    const taxableBase = Math.max(0, total - gstAmount);

    return {
      shopName,
      shopCode: effectiveShopCode || '-',
      shopAddress: shopAddressPrint,
      shopPhone: currentShop?.phone ?? null,
      gstNumber: currentShop?.gstNumber ?? null,
      fssaiNumber: currentShop?.fssaiNumber ?? null,
      showGstinOnBill: showGstinOnBill,
      invoiceNo,
      issuedAt: new Date().toISOString(),
      customer: printCustomer,
      lines: items.map((i) => ({
        name: i.name,
        variantLabel: i.variantLabel,
        barcode: i.barcode,
        quantity: i.displayQuantity,
        unit: i.displayUnit,
        unitPrice: billDisplayUnitPrice(
          i.stockUnitsToDeduct,
          i.catalogUnitPrice,
          i.displayQuantity,
        ),
      })),
      subtotal: taxableBase,
      gstRate: totalTaxRate,
      gstAmount,
      cgstPercent: cgstRate,
      sgstPercent: sgstRate,
      cgstAmountSplit: cgstAmount,
      sgstAmountSplit: sgstAmount,
      discount,
      total,
      returnHref:
        typeof window !== 'undefined'
          ? `${window.location.origin}/billing-pos`
          : null,
    };
  };

  type CheckoutPrintMode = 'browser' | 'thermal' | 'rawbt';

  const completeCheckoutRef = useRef<
    (printMode: CheckoutPrintMode) => Promise<void>
  >(async () => {});

  const completeCheckout = async (printMode: CheckoutPrintMode) => {
    if (items.length === 0) {
      message.warning('Add at least one item before generating a bill.');
      return;
    }
    if (!paymentMethod) {
      message.warning('Select a payment mode (Cash or UPI / Card) first.');
      return;
    }
    const hasRaw = items.some((i) => i.isRaw);
    const hasCatalog = items.some((i) => !i.isRaw);
    if (hasRaw && hasCatalog) {
      message.error(
        'This sale mixes catalog lines with raw (manual) lines. Remove one kind before checkout.',
      );
      return;
    }
    const allRaw = hasRaw && items.length > 0;

    if (printMode === 'thermal' && !isNativeUsbPrinterAvailable()) {
      message.error(
        'USB thermal printing is only available inside the Calcutta Sweets Android POS app.',
      );
      return;
    }

    if (printMode === 'rawbt' && !isLikelyAndroidForRawBt()) {
      message.warning(
        'Print via RawBT only works on Android (tablet/phone) with the RawBT app. On Mac or Windows use Generate bill, or open this site on your Android device.',
      );
      return;
    }

    if (allRaw) {
      setCheckoutBusy(true);
      try {
        const invoiceNo = makeInvoiceNo('RAW');
        if (printMode === 'browser') {
          const ok = openPrintableInvoice(
            buildPrintInvoiceInput(invoiceNo),
            'receipt',
          );
          if (!ok) {
            message.error('Pop-up blocked. Allow pop-ups to print this bill.');
            return;
          }
          message.success('Raw bill ready — use your device print dialog.');
        } else if (printMode === 'thermal') {
          await printBillViaNativeAndroid(buildNativeAndroidBill(invoiceNo));
          message.success('Raw bill sent to USB thermal printer.');
        } else {
          const r = launchRawBtPrintFromBill(buildNativeAndroidBill(invoiceNo));
          if (!r.ok) {
            message.error(r.error);
            return;
          }
          message.success('Opening RawBT…');
        }
        setPaymentMethod(null);
        setDiscount(0);
        onSaleComplete?.();
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : 'Could not complete raw bill checkout.',
        );
      } finally {
        setCheckoutBusy(false);
      }
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
            quantity: i.stockUnitsToDeduct,
            unitPrice: i.catalogUnitPrice,
            ...(i.isInstant
              ? {
                  displayQuantity: i.displayQuantity,
                  displayUnit: i.displayUnit,
                }
              : {}),
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
      if (printMode === 'browser') {
        const ok = openPrintableInvoice(
          buildPrintInvoiceInput(invoiceNo),
          'receipt',
        );
        if (!ok) {
          message.error('Pop-up blocked. Allow pop-ups to print this bill.');
          return;
        }
        message.success('Bill saved — use your device print dialog.');
      } else if (printMode === 'thermal') {
        await printBillViaNativeAndroid(buildNativeAndroidBill(invoiceNo));
        message.success('Bill saved and sent to USB thermal printer.');
      } else {
        const r = launchRawBtPrintFromBill(buildNativeAndroidBill(invoiceNo));
        if (!r.ok) {
          message.error(r.error);
          return;
        }
        message.success('Bill saved — opening RawBT…');
      }
      setPaymentMethod(null);
      setDiscount(0);
      onSaleComplete?.();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Network error while saving the sale.',
      );
    } finally {
      setCheckoutBusy(false);
    }
  };

  completeCheckoutRef.current = completeCheckout;

  useEffect(() => {
    if (!onCheckoutApi) return;
    onCheckoutApi({
      printBrowser: () => {
        void completeCheckoutRef.current('browser');
      },
      printThermal: () => {
        void completeCheckoutRef.current('thermal');
      },
      printRawBt: () => {
        void completeCheckoutRef.current('rawbt');
      },
      busy: checkoutBusy,
      canPrint: lineCount > 0 && paymentMethod != null,
      showUsbThermal: isNativeUsbPrinterAvailable(),
    });
    return () => {
      onCheckoutApi(null);
    };
  }, [onCheckoutApi, checkoutBusy, lineCount, paymentMethod]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}
    >
      {layout === 'sidebar' && (
        <header className="shrink-0 border-b border-[var(--pearl-bush)] bg-[var(--linen-95)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Current sale
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {items.length === 0
                  ? 'Scan a barcode or add a line below'
                  : `${lineCount} line${lineCount === 1 ? '' : 's'} · Order #${orderId}`}
              </p>
            </div>
            {!hideAddCustomerInPanel && !customer ? (
              <Tooltip title="Add customer">
                <Button
                  type="default"
                  className="!flex h-9 w-9 shrink-0 items-center justify-center !p-0 text-[var(--ochre-600)] border-[var(--pearl-bush)] hover:border-[var(--ochre-300)] hover:text-[var(--ochre-700)]"
                  icon={<UserPlus className="h-4 w-4" aria-hidden />}
                  onClick={() => setDetailsOpen(true)}
                  aria-label="Add customer"
                />
              </Tooltip>
            ) : null}
          </div>
        </header>
      )}

      {layout === 'drawer' && !hideAddCustomerInPanel && !customer ? (
        <div className="flex shrink-0 justify-end border-b border-[var(--pearl-bush)] bg-[var(--linen-95)] px-4 py-2">
          <Tooltip title="Add customer">
            <Button
              type="default"
              className="!flex h-9 w-9 items-center justify-center !p-0 text-[var(--ochre-600)] border-[var(--pearl-bush)] hover:border-[var(--ochre-300)] hover:text-[var(--ochre-700)]"
              icon={<UserPlus className="h-4 w-4" aria-hidden />}
              onClick={() => setDetailsOpen(true)}
              aria-label="Add customer"
            />
          </Tooltip>
        </div>
      ) : null}

      {rawManualNameOnBill && manualSaleCustomer ? (
        <div className="mx-4 mt-4 shrink-0">
          <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] px-3 py-3">
            <div className="mb-1 flex items-start gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ochre-100)] text-[var(--ochre-600)]">
                <UserRound className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--bistre-400)]">
                  Customer (raw bill)
                </p>
                <p className="truncate font-semibold text-[var(--text-primary)]">
                  {manualSaleCustomer.name.trim()}
                </p>
                {manualSaleCustomer.gstin?.trim() ? (
                  <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                    GSTIN {manualSaleCustomer.gstin.trim()}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] leading-snug text-[var(--text-muted)]">
                  Edit name and GSTIN on the Raw billing tab. Add full contact with the toolbar
                  button to include mobile on the printout.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {customer && !rawManualNameOnBill ? (
        <div className="mx-4 mt-4 shrink-0">
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
                  onClick={() => setDetailsOpen(true)}
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
            {customer.gstin?.trim() ? (
              <p className="pl-11 font-mono text-xs text-[var(--text-secondary)]">
                GSTIN {customer.gstin.trim()}
              </p>
            ) : null}
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
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:py-4">
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">
            No lines yet. Scan a barcode, use Standard or Instant billing, or Raw for
            manual lines.
          </div>
        ) : (
          <ul className="space-y-2 pr-1 sm:space-y-2.5">
            {items.map((item) => (
              <li
                key={item.lineId}
                className="flex items-start gap-2 border-b border-[var(--pearl-bush)] pb-2 last:border-0 last:pb-0 sm:gap-2.5 sm:pb-2.5"
              >
                <div className="h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                  <ProductLineThumb imageUrl={item.imageUrl} alt={item.name} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight text-[var(--text-primary)] sm:text-[0.9375rem]">
                        {item.name}
                        {item.variantLabel &&
                        item.variantLabel !== 'Regular' ? (
                          <span className="font-normal text-[var(--text-muted)]">
                            {' '}
                            · {item.variantLabel}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                        <span className="font-mono text-[var(--bistre-400)]">
                          {item.barcode}
                        </span>
                        <span className="text-[var(--bistre-200)]"> · </span>
                        <span>
                          {item.displayQuantity} {item.displayUnit} × ₹
                          {billDisplayUnitPrice(
                            item.stockUnitsToDeduct,
                            item.catalogUnitPrice,
                            item.displayQuantity,
                          ).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:text-[0.9375rem]">
                      ₹
                      {billLineSubtotal(
                        item.stockUnitsToDeduct,
                        item.catalogUnitPrice,
                      ).toFixed(2)}
                    </p>
                  </div>
                  {item.isInstant ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--bistre-400)]">
                          Qty
                        </span>
                        <InputNumber
                          size="small"
                          className="!min-w-0 w-[4.75rem] sm:w-[5.25rem]"
                          min={
                            item.displayUnit.toUpperCase() === 'PC' ? 1 : 0.001
                          }
                          step={
                            item.displayUnit.toUpperCase() === 'PC' ? 1 : 0.5
                          }
                          value={item.displayQuantity}
                          onChange={(v) => {
                            if (v == null || onInstantLineUpdate == null) return;
                            onInstantLineUpdate(item.lineId, {
                              displayQuantity: v,
                              displayUnit: item.displayUnit,
                            });
                          }}
                        />
                      </div>
                      <div className="flex min-w-0 items-center gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--bistre-400)]">
                          Unit
                        </span>
                        <Select
                          size="small"
                          className="min-w-[4rem] w-[4.75rem] sm:w-[5.25rem]"
                          value={item.displayUnit}
                          options={allowedInstantDisplayUnits(
                            item.variantLabel,
                            item.inventoryUnit,
                          ).map((u) => ({
                            value: u,
                            label: u,
                          }))}
                          onChange={(u) => {
                            if (onInstantLineUpdate == null) return;
                            let q = item.displayQuantity;
                            if (u.toUpperCase() === 'PC') {
                              q = Math.max(1, Math.round(q));
                            }
                            onInstantLineUpdate(item.lineId, {
                              displayQuantity: q,
                              displayUnit: u,
                            });
                          }}
                          getPopupContainer={(n) =>
                            n.parentElement ?? document.body
                          }
                        />
                      </div>
                      <Tooltip title="Total uses the catalog price for the unit you select.">
                        <span className="cursor-help text-[10px] text-[var(--text-muted)] underline decoration-dotted underline-offset-2">
                          Pricing
                        </span>
                      </Tooltip>
                      <button
                        type="button"
                        onClick={() => onRemove(item.lineId)}
                        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
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
                  ) : (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex items-center overflow-hidden rounded-md border border-[var(--pearl-bush)]">
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.lineId, -1)}
                          className="flex h-7 min-w-7 items-center justify-center px-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--linen-95)] active:bg-[var(--bistre-100)] sm:h-8 sm:min-w-8 sm:text-base"
                        >
                          −
                        </button>
                        <span className="min-w-[1.35rem] text-center text-xs font-medium tabular-nums text-[var(--text-primary)] sm:min-w-[1.5rem] sm:text-sm">
                          {item.displayQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.lineId, 1)}
                          className="flex h-7 min-w-7 items-center justify-center px-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--linen-95)] active:bg-[var(--ochre-100)] sm:h-8 sm:min-w-8 sm:text-base"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.lineId)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
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
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 space-y-2 rounded-t-2xl border-t-2 border-[var(--pearl-bush)] bg-[var(--linen-95)] px-3 pb-3 pt-2 sm:space-y-2.5 sm:px-4 sm:pb-3 sm:pt-2.5">
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between gap-2 text-[var(--text-secondary)]">
              <span>Items (incl. tax)</span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--text-primary)]">
                ₹{itemsGrossTotal.toFixed(2)}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex min-w-0 justify-between gap-2 text-[var(--text-secondary)]">
                <span className="min-w-0 truncate">CGST ({cgstRate}%)</span>
                <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-[var(--text-primary)]">
                  ₹{cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex min-w-0 justify-between gap-2 text-[var(--text-secondary)]">
                <span className="min-w-0 truncate">SGST ({sgstRate}%)</span>
                <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-[var(--text-primary)]">
                  ₹{sgstAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="pt-0.5">
              <Checkbox
                checked={showGstinOnBill}
                onChange={(e) => setShowGstinOnBill(e.target.checked)}
                className="text-xs text-[var(--text-secondary)] [&_.ant-checkbox+span]:!ps-1"
              >
                Show Your GSTIN on printed bill
              </Checkbox>
            </div>
            <div className="flex items-center justify-between gap-2 text-[var(--text-secondary)]">
              <span className="flex min-w-0 items-center gap-1">
                Discount
                <button
                  type="button"
                  onClick={() => {
                    setTempDiscount(discount);
                    setIsDiscountModalOpen(true);
                  }}
                  className="rounded-md p-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--ochre-10)] hover:text-[var(--ochre-500)]"
                  aria-label="Edit discount"
                >
                  <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--text-primary)]">
                ₹{discount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 border-y border-[var(--pearl-bush)] py-1.5 sm:py-2">
            <span className="text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
              Payable total
            </span>
            <span className="text-lg font-bold tabular-nums text-[var(--bistre-800)] sm:text-xl">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-xs sm:normal-case sm:tracking-normal">
              Payment <span className="text-red-600">*</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <Button
                type={paymentMethod === 'CASH' ? 'primary' : 'default'}
                className="flex h-9 items-center justify-center gap-1.5 px-2 text-xs font-medium sm:h-10 sm:gap-2 sm:text-sm"
                icon={<Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
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
                className="flex h-9 items-center justify-center gap-1.5 px-2 text-xs font-medium sm:h-10 sm:gap-2 sm:text-sm"
                icon={<CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
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
          </div>
          <div className="flex flex-col gap-2">
            <Tooltip title="Saves the sale (when applicable) and opens a receipt in a new tab that uses your browser’s Print dialog — choose USB, Bluetooth, Wi‑Fi, or Save as PDF.">
              <Button
                type="primary"
                className="flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 sm:h-11 sm:text-base"
                icon={<Receipt className="h-4 w-4 sm:h-5 sm:w-5" />}
                style={{
                  backgroundColor: 'var(--ochre-600)',
                  borderColor: 'var(--ochre-600)',
                }}
                disabled={!paymentMethod || checkoutBusy}
                loading={checkoutBusy}
                onClick={() => void completeCheckout('browser')}
              >
                Generate bill
              </Button>
            </Tooltip>
            {isNativeUsbPrinterAvailable() ? (
              <Tooltip title="Same checkout, but prints silently to the TVS-style USB thermal printer via the POS app (ESC/POS).">
                <Button
                  type="default"
                  className="flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold border-[var(--pearl-bush)] sm:h-11 sm:text-base"
                  icon={<Printer className="h-4 w-4 sm:h-5 sm:w-5" />}
                  disabled={!paymentMethod || checkoutBusy}
                  loading={checkoutBusy}
                  onClick={() => void completeCheckout('thermal')}
                >
                  USB thermal receipt
                </Button>
              </Tooltip>
            ) : null}
            <Tooltip
              title={
                'Android only: sends this bill as text to the RawBT app (set up USB printer once, then enable Auto print + Skip preview in RawBT). On Mac/PC this button will remind you to use Generate bill or switch to Android.'
              }
            >
              <Button
                type="default"
                className="flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold border-[var(--pearl-bush)] sm:h-11 sm:text-base"
                icon={<Bluetooth className="h-4 w-4 sm:h-5 sm:w-5" />}
                disabled={!paymentMethod || checkoutBusy}
                loading={checkoutBusy}
                onClick={() => void completeCheckout('rawbt')}
              >
                Print via RawBT (Android)
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

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
