'use client';

import type { KeyboardEvent } from 'react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { App, Input, type InputRef } from 'antd';
import { ScanBarcode } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LoadingDots } from '@/components/LoadingDots/LoadingDots';
import {
  BillingBillPanel,
  type BillItem,
} from '@/components/BillingBillPanel/BillingBillPanel';
import { BillingPosManualSection } from '@/components/BillingPosManualSection/BillingPosManualSection';
import type { BillingVariantRow } from '@/hooks/useBillingPosVariants';
import { useShop } from '@/contexts/ShopContext';
import styles from './page.module.css';

type BarcodeLookupResult = {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  barcode: string;
  price: number;
  unit: string;
  stock: number;
};

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

function lookupToBillItem(r: BarcodeLookupResult): BillItem {
  return {
    variantId: r.id,
    productId: r.productId,
    name: r.productName,
    variantLabel: r.variantName,
    barcode: r.barcode,
    unitPrice: r.price,
    quantity: 1,
    unit: r.unit,
    imageUrl: null,
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const barcodeRef = useRef<InputRef>(null);
  const barcodeAutofocusShopRef = useRef<string | null>(null);

  useEffect(() => {
    barcodeAutofocusShopRef.current = null;
  }, [shopCode]);

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

  const resolveBarcode = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code || lookupBusy) return;
      setLookupBusy(true);
      try {
        const res = await apiFetch(
          `/inventory/variants/lookup?barcode=${encodeURIComponent(code)}`,
          { method: 'GET' },
        );
        if (res.status === 404) {
          message.error(`No product found for barcode “${code}”.`);
          return;
        }
        if (!res.ok) {
          message.error('Barcode lookup failed. Try again.');
          return;
        }
        const data = (await res.json()) as BarcodeLookupResult;
        mergeLine(lookupToBillItem(data));
        setBarcodeInput('');
      } catch {
        message.error('Network error during barcode lookup.');
      } finally {
        setLookupBusy(false);
        requestAnimationFrame(() => barcodeRef.current?.focus?.());
      }
    },
    [lookupBusy, mergeLine, message],
  );

  const onBarcodeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void resolveBarcode(barcodeInput);
    }
  };

  useEffect(() => {
    if (!shopCode) return;
    if (barcodeAutofocusShopRef.current === shopCode) return;
    const t = window.setTimeout(() => {
      barcodeRef.current?.focus?.();
      barcodeAutofocusShopRef.current = shopCode;
    }, 100);
    return () => clearTimeout(t);
  }, [shopCode]);

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

  if (!shopCode) return <LoadingDots />;

  return (
    <div className={`${styles.billingLayout} min-h-0 flex-1`}>
      <div className={styles.billingMain}>
        <section className={`shrink-0 p-4 sm:p-5 ${styles.scanSection}`}>
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ochre-100)] text-[var(--ochre-600)]">
              <ScanBarcode className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--bistre-800)]">
                Barcode scan
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                Point your scanner at the label on the product and scan — most
                scanners send Enter automatically. You can also type the code
                and press Enter.
              </p>
            </div>
          </div>
          <Input
            ref={barcodeRef}
            className={styles.scanInput}
            size="large"
            placeholder="Scan or type barcode…"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={onBarcodeKeyDown}
            disabled={lookupBusy}
            autoComplete="off"
            spellCheck={false}
            aria-label="Barcode scan field"
          />
        </section>

        <BillingPosManualSection
          shopCode={shopCode}
          onAddProduct={addRowManual}
          dataRefreshKey={billingStockRefreshKey}
        />
      </div>

      <aside className={styles.sidebar}>
        <BillingBillPanel
          className="h-full min-h-0 min-w-0 w-full flex-1"
          items={billItems}
          onQuantityChange={updateQuantity}
          onRemove={removeFromBill}
          onSaleComplete={() => {
            clearSale();
            setBillingStockRefreshKey((k) => k + 1);
          }}
          orderId="draft"
        />
      </aside>
    </div>
  );
}
