'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { App, Drawer, Tabs } from 'antd';
import { Receipt, ScanBarcode } from 'lucide-react';
import { ContentSkeleton } from '@/components/ContentSkeleton/ContentSkeleton';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput/BarcodeScannerInput';
import {
  BillingBillPanel,
  type BillItem,
  type BillingCustomerBinding,
  type ManualSaleCustomer,
} from '@/components/BillingBillPanel/BillingBillPanel';
import {
  BillingPosRawSection,
  RAW_BILL_FORM_INITIAL,
  type RawBillFormValues,
} from '@/components/BillingPosRawSection/BillingPosRawSection';
import CustomerDetails, {
  type CustomerFormValues,
} from '@/components/CustomerDetails';
import { BillingPosManualSection } from '@/components/BillingPosManualSection/BillingPosManualSection';
import type { BillingVariantRow } from '@/hooks/useBillingPosVariants';
import {
  billLineSubtotal,
  computeInstantStockDeduction,
  defaultInstantDisplay,
} from '@/lib/billingInstantPricing';
import { useShop } from '@/contexts/ShopContext';
import styles from './page.module.css';

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function variantRowToBillItem(row: BillingVariantRow): BillItem {
  const inv = row.unit ?? 'PC';
  return {
    lineId: row.variantId,
    variantId: row.variantId,
    productId: row.productId,
    name: row.productName,
    variantLabel: row.variantName,
    barcode: row.barcode,
    catalogUnitPrice: row.price,
    stockUnitsToDeduct: 1,
    displayQuantity: 1,
    displayUnit: inv,
    inventoryUnit: inv,
    imageUrl: row.imageUrl ?? row.images?.[0]?.url ?? null,
    isInstant: false,
  };
}


export default function BillingPOSPage() {
  const { message } = App.useApp();
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
  const [billingTab, setBillingTab] = useState<'standard' | 'instant' | 'raw'>(
    'standard',
  );
  const [rawBillForm, setRawBillForm] =
    useState<RawBillFormValues>(RAW_BILL_FORM_INITIAL);

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

  const mergeLine = useCallback(
    (line: BillItem) => {
      let blockMessage: string | null = null;
      setBillItems((prev) => {
        const prevHasRaw = prev.some((i) => i.isRaw);
        const prevHasCatalog = prev.some((i) => !i.isRaw);
        if (line.isRaw && prevHasCatalog) {
          blockMessage =
            'Remove catalog lines before adding raw (manual) lines.';
          return prev;
        }
        if (!line.isRaw && prevHasRaw) {
          blockMessage = 'Remove raw lines before adding catalog products.';
          return prev;
        }
        if (line.isRaw) {
          return [...prev, { ...line }];
        }
        if (!line.isInstant) {
          const existing = prev.find(
            (i) =>
              !i.isInstant &&
              !i.isRaw &&
              i.variantId === line.variantId,
          );
          if (existing) {
            return prev.map((i) =>
              i.lineId === existing.lineId
                ? {
                    ...i,
                    stockUnitsToDeduct:
                      i.stockUnitsToDeduct + line.stockUnitsToDeduct,
                    displayQuantity: i.displayQuantity + line.displayQuantity,
                  }
                : i,
            );
          }
        }
        return [...prev, { ...line }];
      });
      if (blockMessage) message.error(blockMessage);
    },
    [message],
  );

  const addRowManual = useCallback(
    (row: BillingVariantRow) => {
      mergeLine(variantRowToBillItem(row));
    },
    [mergeLine],
  );

  const addRawBillLine = useCallback(
    (pick: Pick<RawBillFormValues, 'itemName' | 'unitPrice' | 'quantity'>) => {
      const lineId = crypto.randomUUID();
      mergeLine({
        lineId,
        variantId: `raw:${lineId}`,
        productId: 'raw-line',
        name: pick.itemName,
        variantLabel: 'Regular',
        barcode: '—',
        catalogUnitPrice: pick.unitPrice,
        stockUnitsToDeduct: pick.quantity,
        displayQuantity: pick.quantity,
        displayUnit: 'PC',
        inventoryUnit: 'PC',
        imageUrl: null,
        isRaw: true,
      });
    },
    [mergeLine],
  );

  const addInstantLine = useCallback(
    (row: BillingVariantRow) => {
      const inv = row.unit ?? 'PC';
      const { displayQuantity, displayUnit } = defaultInstantDisplay(
        row.variantName,
        inv,
      );
      const stock = computeInstantStockDeduction(
        row.variantName,
        inv,
        displayQuantity,
        displayUnit,
      );
      mergeLine({
        lineId: crypto.randomUUID(),
        variantId: row.variantId,
        productId: row.productId,
        name: row.productName,
        variantLabel: row.variantName,
        barcode: row.barcode,
        catalogUnitPrice: row.price,
        stockUnitsToDeduct: stock,
        displayQuantity,
        displayUnit,
        inventoryUnit: inv,
        imageUrl: row.imageUrl ?? row.images?.[0]?.url ?? null,
        isInstant: true,
      });
    },
    [mergeLine],
  );

  const updateInstantLine = useCallback(
    (lineId: string, next: { displayQuantity: number; displayUnit: string }) => {
      let q = next.displayQuantity;
      const u = next.displayUnit;
      if (u.toUpperCase() === 'PC') {
        q = Math.max(1, Math.round(q));
      } else {
        q = Math.max(1e-6, q);
      }
      setBillItems((prev) =>
        prev.map((i) => {
          if (i.lineId !== lineId || !i.isInstant) return i;
          const stock = computeInstantStockDeduction(
            i.variantLabel,
            i.inventoryUnit,
            q,
            u,
          );
          return {
            ...i,
            displayQuantity: q,
            displayUnit: u,
            stockUnitsToDeduct: stock,
          };
        }),
      );
    },
    [],
  );

  const updateQuantity = useCallback((lineId: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((i) => {
          if (i.lineId !== lineId || i.isInstant) return i;
          const nextQty = Math.max(0, i.displayQuantity + delta);
          const nextStock = Math.max(0, i.stockUnitsToDeduct + delta);
          return {
            ...i,
            displayQuantity: nextQty,
            stockUnitsToDeduct: nextStock,
          };
        })
        .filter((i) => i.stockUnitsToDeduct > 1e-9),
    );
  }, []);

  const removeFromBill = useCallback((lineId: string) => {
    setBillItems((prev) => prev.filter((i) => i.lineId !== lineId));
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

  const saleLineCount = billItems.length;

  const itemsGrossTotal = useMemo(
    () =>
      billItems.reduce(
        (s, i) => s + billLineSubtotal(i.stockUnitsToDeduct, i.catalogUnitPrice),
        0,
      ),
    [billItems],
  );

  const manualSaleCustomer = useMemo((): ManualSaleCustomer | null => {
    if (!billItems.some((i) => i.isRaw)) return null;
    const n = rawBillForm.customerName.trim();
    if (!n) return null;
    return {
      name: n,
      gstin: rawBillForm.includeCustomerGstin
        ? rawBillForm.customerGstin.trim() || null
        : null,
    };
  }, [billItems, rawBillForm]);

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
    onInstantLineUpdate: updateInstantLine,
    onSaleComplete: () => {
      clearSale();
      setRawBillForm(RAW_BILL_FORM_INITIAL);
      setBillingStockRefreshKey((k) => k + 1);
      setBillDrawerOpen(false);
    },
    orderId: 'draft' as const,
    customerBinding,
    hideAddCustomerInPanel: stackedBillingLayout,
    manualSaleCustomer,
  };

  return (
    <div
      ref={billingShellRef}
      className={`${styles.billingPageShell} min-h-0 flex-1 ${stackedBillingLayout ? styles.shellStackedPad : ''}`}
    >
      <div className={`${styles.billingLayout} min-h-0`}>
        <div className={styles.billingMain}>
          {billingTab === 'standard' ? (
            <section className={`shrink-0 p-3 sm:p-5 ${styles.scanSection}`}>
              <div className="mb-3 flex items-start gap-2.5 sm:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ochre-100)] text-[var(--ochre-600)] sm:h-11 sm:w-11">
                  <ScanBarcode className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--bistre-800)]">
                    Barcode billing
                  </h2>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs sm:leading-relaxed">
                    <span className="block sm:inline">
                      Scan the product label-most scanners send Enter automatically.
                    </span>{' '}
                    <span className="hidden sm:inline">Or type the code and press Enter.</span>
                  </p>
                </div>
              </div>
              <BarcodeScannerInput onAddProduct={addRowManual} />
            </section>
          ) : null}

          <Tabs
            className={`${styles.billingModeTabs} min-h-0 flex-1`}
            activeKey={billingTab}
            onChange={(k) => setBillingTab(k as 'standard' | 'instant' | 'raw')}
            items={[
              {
                key: 'standard',
                label: 'Standard',
                children: (
                  <BillingPosManualSection
                    shopCode={shopCode}
                    onAddProduct={addRowManual}
                    dataRefreshKey={billingStockRefreshKey}
                    showToolbarAddCustomer={stackedBillingLayout}
                    onToolbarAddCustomer={openCustomerDetails}
                    showSaleCheckoutHint={stackedBillingLayout}
                    sectionTitle="Standard billing"
                    sectionHint="Fixed packs and SKUs. Lines merge when you add the same variant again."
                  />
                ),
              },
              {
                key: 'instant',
                label: 'Instant',
                children: (
                  <BillingPosManualSection
                    shopCode={shopCode}
                    onAddProduct={addInstantLine}
                    dataRefreshKey={billingStockRefreshKey}
                    showToolbarAddCustomer={stackedBillingLayout}
                    onToolbarAddCustomer={openCustomerDetails}
                    showSaleCheckoutHint={stackedBillingLayout}
                    sectionTitle="Instant billing"
                    sectionHint="Custom weights or pours (e.g. 400 g of a kg-priced sweet). After Add, set quantity and unit in the sale panel - the total follows the variant’s list price proportionally."
                    hideBarcodeColumn
                  />
                ),
              },
              {
                key: 'raw',
                label: 'Raw',
                children: (
                  <BillingPosRawSection
                    formValues={rawBillForm}
                    onFormChange={setRawBillForm}
                    onAddLine={addRawBillLine}
                    showToolbarAddCustomer={stackedBillingLayout}
                    onToolbarAddCustomer={openCustomerDetails}
                    showSaleCheckoutHint={stackedBillingLayout}
                  />
                ),
              },
            ]}
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
                    ? 'No lines yet - tap to add customer & pay'
                    : `${saleLineCount} ${saleLineCount === 1 ? 'line' : 'lines'} · ${inrCompact.format(itemsGrossTotal)} (incl. tax)`}
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
          size="90%"
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

      <CustomerDetails
        open={customerDetailsOpen}
        onCancel={() => setCustomerDetailsOpen(false)}
        initialValues={customer ?? undefined}
        onSave={(values) => setCustomer(values)}
      />
    </div>
  );
}
