'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Drawer } from 'antd';
import { Receipt, ScanBarcode } from 'lucide-react';
import { ContentSkeleton } from '@/components/ContentSkeleton/ContentSkeleton';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput/BarcodeScannerInput';
import {
  BillingBillPanel,
  type BillItem,
  type BillingCustomerBinding,
} from '@/components/BillingBillPanel/BillingBillPanel';
import type { CustomerFormValues } from '@/components/CustomerDetails';
import { BillingPosManualSection } from '@/components/BillingPosManualSection/BillingPosManualSection';
import type { BillingVariantRow } from '@/hooks/useBillingPosVariants';
import { useShop } from '@/contexts/ShopContext';
import styles from './page.module.css';

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function variantRowToBillItem(row: BillingVariantRow): BillItem {
  return {
    variantId: row.variantId,
    productId: row.productId,
    name: row.productName,
    variantLabel: row.variantName,
    barcode: row.barcode,
    unitPrice: row.price,
    quantity: 1,
    unit: row.unit,
    imageUrl: null,
  };
}


export default function BillingPOSPage() {
  const { effectiveShopCode } = useShop();
  const shopCode =
    effectiveShopCode ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    '';

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billingStockRefreshKey, setBillingStockRefreshKey] = useState(0);
  const [customer, setCustomer] = useState<CustomerFormValues | null>(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const billingShellRef = useRef<HTMLDivElement>(null);
  const [stackedBillingLayout, setStackedBillingLayout] = useState(true);
  const [billDrawerOpen, setBillDrawerOpen] = useState(false);
  const prevBillLenRef = useRef(0);

  useLayoutEffect(() => {
    const el = billingShellRef.current;
    if (!el) return;
    const sync = () => {
      setStackedBillingLayout(el.getBoundingClientRect().width < 1024);
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => sync());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const customerBinding: BillingCustomerBinding = {
    customer,
    setCustomer,
    detailsOpen: customerDetailsOpen,
    setDetailsOpen: setCustomerDetailsOpen,
  };

  const openCustomerDetails = useCallback(() => {
    setCustomerDetailsOpen(true);
  }, []);

  const mergeLine = useCallback((line: BillItem) => {
    setBillItems((prev) => {
      const existing = prev.find((i) => i.variantId === line.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === line.variantId
            ? { ...i, quantity: i.quantity + line.quantity }
            : i,
        );
      }
      return [...prev, { ...line }];
    });
  }, []);

  const addRowManual = useCallback(
    (row: BillingVariantRow) => {
      mergeLine(variantRowToBillItem(row));
    },
    [mergeLine],
  );


  const updateQuantity = useCallback((variantId: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeFromBill = useCallback((variantId: string) => {
    setBillItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearSale = useCallback(() => {
    setBillItems([]);
  }, []);

  useEffect(() => {
    if (!stackedBillingLayout) {
      setBillDrawerOpen(false);
      prevBillLenRef.current = billItems.length;
      return;
    }
    if (prevBillLenRef.current === 0 && billItems.length > 0) {
      setBillDrawerOpen(true);
    }
    prevBillLenRef.current = billItems.length;
  }, [stackedBillingLayout, billItems.length]);

  const saleLineCount = useMemo(
    () => billItems.reduce((s, i) => s + i.quantity, 0),
    [billItems],
  );

  const itemsGrossTotal = useMemo(
    () => billItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    [billItems],
  );

  if (!shopCode) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-[var(--bistre-600)]">
          Select a shop in the header to use Billing POS.
        </p>
        <ContentSkeleton variant="rows" rowCount={12} className="min-h-[320px]" />
      </div>
    );
  }

  const billPanelProps = {
    items: billItems,
    onQuantityChange: updateQuantity,
    onRemove: removeFromBill,
    onSaleComplete: () => {
      clearSale();
      setBillingStockRefreshKey((k) => k + 1);
      setBillDrawerOpen(false);
    },
    orderId: 'draft' as const,
    customerBinding,
    hideAddCustomerInPanel: stackedBillingLayout,
  };

  return (
    <div
      ref={billingShellRef}
      className={`${styles.billingPageShell} min-h-0 flex-1 ${stackedBillingLayout ? styles.shellStackedPad : ''}`}
    >
      <div className={`${styles.billingLayout} min-h-0`}>
        <div className={styles.billingMain}>
          <section className={`shrink-0 p-3 sm:p-5 ${styles.scanSection}`}>
            <div className="mb-3 flex items-start gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ochre-100)] text-[var(--ochre-600)] sm:h-11 sm:w-11">
                <ScanBarcode className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--bistre-800)]">
                  Barcode scan
                </h2>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs sm:leading-relaxed">
                  <span className="block sm:inline">
                    Scan the product label—most scanners send Enter automatically.
                  </span>{' '}
                  <span className="hidden sm:inline">Or type the code and press Enter.</span>
                </p>
              </div>
            </div>
            <BarcodeScannerInput onAddProduct={addRowManual} />
          </section>

          <BillingPosManualSection
            shopCode={shopCode}
            onAddProduct={addRowManual}
            dataRefreshKey={billingStockRefreshKey}
            showToolbarAddCustomer={stackedBillingLayout}
            onToolbarAddCustomer={openCustomerDetails}
            showSaleCheckoutHint={stackedBillingLayout}
          />
        </div>

        {stackedBillingLayout ? (
          <button
            type="button"
            className={styles.mobileBillBar}
            onClick={() => setBillDrawerOpen(true)}
            aria-label="Open current sale and checkout"
          >
            <div className={styles.mobileBillBarInner}>
              <Receipt
                className="h-5 w-5 shrink-0 text-[var(--ochre-600)]"
                aria-hidden
              />
              <div className={styles.mobileBillBarText}>
                <span className={styles.mobileBillBarKicker}>Current sale</span>
                <span className={styles.mobileBillBarSummary}>
                  {billItems.length === 0
                    ? 'No lines yet — tap to add customer & pay'
                    : `${saleLineCount} ${saleLineCount === 1 ? 'item' : 'items'} · ${inrCompact.format(itemsGrossTotal)} (incl. tax)`}
                </span>
              </div>
              <span className={styles.mobileBillBarCta}>Review & pay</span>
            </div>
          </button>
        ) : (
          <aside className={styles.sidebar}>
            <BillingBillPanel
              {...billPanelProps}
              layout="sidebar"
              className="h-full min-h-0 min-w-0 w-full flex-1"
            />
          </aside>
        )}
      </div>

      {stackedBillingLayout ? (
        <Drawer
          rootClassName={styles.billDrawer}
          title="Current sale"
          placement="bottom"
          height="90%"
          open={billDrawerOpen}
          onClose={() => setBillDrawerOpen(false)}
          destroyOnClose={false}
          styles={{
            body: {
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: 'calc(100dvh - 120px)',
            },
          }}
        >
          <BillingBillPanel
            {...billPanelProps}
            layout="drawer"
            className="h-full min-h-0 min-w-0 w-full flex-1 overflow-hidden"
          />
        </Drawer>
      ) : null}
    </div>
  );
}
