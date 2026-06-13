'use client';

import { Search, UserPlus } from 'lucide-react';
import { App, Button, Input, Select, Tooltip } from 'antd';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DataTable, type AppTableColumn } from '@/components/DataTable/DataTable';
import { VariantThumb } from '@/components/VariantThumb/VariantThumb';
import {
  apiFetch,
  dedupeInFlight,
  getApiBaseUrl,
  getAuthHeaders,
} from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { BillingVariantRow } from '@/hooks/useBillingPosVariants';
import pageStyles from '@/app/(app)/billing-pos/page.module.css';
import styles from './BillingPosManualSection.module.css';

type CategorySummary = { id: string; name: string };

type ApiVariantRow = {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  barcode: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  imageUrl?: string | null;
};

const PAGE_SIZE = 40;
const PAGE_SIZE_OPTIONS = [10, 20, 40, 60, 100];

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function coalesceStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function normalizeInventoryVariantRow(raw: unknown): ApiVariantRow {
  const r = raw as Record<string, unknown>;
  const productObj = r.product;
  const fromNestedProduct =
    typeof productObj === 'object' && productObj !== null
      ? coalesceStr((productObj as Record<string, unknown>).name)
      : '';
  const productName =
    coalesceStr(r.productName ?? r.product_name) || fromNestedProduct;
  const variantName = coalesceStr(r.variantName ?? r.variant_name ?? r.name);
  return {
    id: coalesceStr(r.id),
    productId: coalesceStr(r.productId ?? r.product_id),
    productName,
    variantName,
    barcode: coalesceStr(r.barcode),
    category: coalesceStr(r.category) || '-',
    quantity: Number(r.quantity ?? 0),
    unit: coalesceStr(r.unit) || 'PC',
    price: Number(r.price ?? 0),
    imageUrl: (r.imageUrl ?? r.image_url ?? null) as string | null | undefined,
  };
}

function apiRowToBilling(d: ApiVariantRow): BillingVariantRow {
  const cat = d.category?.trim();
  return {
    variantId: d.id,
    productId: d.productId,
    productName: d.productName,
    variantName: d.variantName,
    barcode: d.barcode,
    price: d.price,
    unit: d.unit ?? 'PC',
    stock: d.quantity,
    category: cat && cat !== '-' ? cat : null,
    imageUrl: d.imageUrl ?? null,
  };
}

export type BillingPosManualSectionProps = {
  shopCode: string;
  onAddProduct: (row: BillingVariantRow) => void;
  dataRefreshKey?: number;
  showToolbarAddCustomer?: boolean;
  onToolbarAddCustomer?: () => void;
  showSaleCheckoutHint?: boolean;
  sectionTitle?: string;
  sectionHint?: ReactNode;
  hideBarcodeColumn?: boolean;
};

function BillingPosManualSectionInner({
  shopCode,
  onAddProduct,
  dataRefreshKey = 0,
  showToolbarAddCustomer = false,
  onToolbarAddCustomer,
  showSaleCheckoutHint = false,
  sectionTitle = 'Standard billing',
  sectionHint,
  hideBarcodeColumn = false,
}: BillingPosManualSectionProps) {
  const { message: messageApi } = App.useApp();
  const messageApiRef = useRef(messageApi);
  messageApiRef.current = messageApi;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  const filtersRef = useRef({ q: debouncedSearch, category: activeCategory });
  filtersRef.current = { q: debouncedSearch, category: activeCategory };

  const addProductRef = useRef(onAddProduct);
  useEffect(() => {
    addProductRef.current = onAddProduct;
  }, [onAddProduct]);

  const filterKey = `${shopCode}|${debouncedSearch}|${activeCategory}|${dataRefreshKey}`;

  useEffect(() => {
    if (!shopCode) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    dedupeInFlight(`GET:/category:${shopCode}`, async () => {
      const res = await apiFetch('/category', { method: 'GET' });
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<CategorySummary[]>;
    })
      .then((list) => {
        if (cancelled) return;
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [shopCode]);

  const categorySelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categories.map((c) => ({
        value: c.name,
        label: c.name.replace(/_/g, ' '),
      })),
    ],
    [categories],
  );

  const handleCopyBarcode = useCallback(
    async (barcode: string) => {
      try {
        await navigator.clipboard.writeText(barcode);
        messageApiRef.current.success('Barcode copied');
      } catch {
        messageApiRef.current.error('Could not copy');
      }
    },
    [],
  );

  const columns: AppTableColumn[] = useMemo(() => {
    const base: AppTableColumn[] = [
      {
        key: 'imageUrl',
        label: '',
        field: 'imageUrl',
        width: 56,
        align: 'center',
        render: (val, row) => {
          const r = row as ApiVariantRow;
          const label =
            [r.productName, r.variantName].filter(Boolean).join(' · ') || 'Product';
          return <VariantThumb imageUrl={val as string | null} label={label} />;
        },
      },
      {
        key: 'product',
        label: 'Product',
        field: 'productName',
        minWidth: 140,
        render: (_, row) => {
          const r = row as ApiVariantRow;
          const product = (r.productName ?? '').trim();
          const variant = (r.variantName ?? '').trim();
          const cat = (r.category ?? '').trim();
          const catLabel = cat && cat !== '-' ? cat.replace(/_/g, ' ') : '';
          let titleText = product || variant;
          if (!titleText) titleText = catLabel || '-';
          const subParts: string[] = [];
          if (product && variant && variant !== product) subParts.push(variant);
          if (catLabel && titleText !== catLabel) subParts.push(catLabel);
          const subText = subParts.join(' · ');
          return (
            <div className="billing-pos-product-stack">
              <div className="billing-pos-product-title">{titleText}</div>
              {subText && <div className="billing-pos-product-sub">{subText}</div>}
            </div>
          );
        },
      },
    ];

    if (!hideBarcodeColumn) {
      base.push({
        key: 'barcode',
        label: 'Barcode',
        field: 'barcode',
        minWidth: 120,
        render: (val) => {
          const raw = String(val ?? '');
          return (
            <div className="billing-pos-barcode-wrap">
              <button
                type="button"
                className="billing-pos-copy-btn"
                aria-label="Copy barcode"
                disabled={!raw}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (raw) await handleCopyBarcode(raw);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/></svg>
              </button>
              <span className="billing-pos-mono" title={raw || undefined}>{raw || '-'}</span>
            </div>
          );
        },
      });
    }

    base.push(
      {
        key: 'quantity',
        label: 'Stock',
        field: 'quantity',
        width: 100,
        render: (_, row) => {
          const r = row as ApiVariantRow;
          return `${r.quantity ?? 0} ${r.unit ?? 'PC'}`;
        },
      },
      {
        key: 'price',
        label: 'Price',
        field: 'price',
        width: 90,
        render: (val) => inr.format(Number(val) || 0),
      },
      {
        key: '_add',
        label: '',
        width: 88,
        align: 'right',
        render: (_, row) => {
          const r = row as ApiVariantRow;
          return (
            <button
              type="button"
              className="billing-pos-add-btn"
              aria-label="Add to sale"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addProductRef.current(apiRowToBilling(r));
              }}
            >
              Add
            </button>
          );
        },
      },
    );

    return base;
  }, [hideBarcodeColumn, handleCopyBarcode]);

  const fetchFn = useMemo(() => {
    if (!shopCode) return undefined;
    const baseUrl = getApiBaseUrl();
    return ({ page, pageSize }: { page: number; pageSize: number }) => {
      const u = new URL(
        `${baseUrl}/inventory/variants`,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      );
      u.searchParams.set('page', String(page));
      u.searchParams.set('size', String(pageSize));
      u.searchParams.set('activeOnly', '1');
      const { q, category } = filtersRef.current;
      const qt = q.trim();
      if (qt) u.searchParams.set('q', qt);
      if (category && category !== 'all') u.searchParams.set('category', category);
      return fetch(u.toString(), {
        headers: { ...getAuthHeaders(), Accept: 'application/json' },
      })
        .then(async (r) => {
          if (!r.ok) {
            messageApiRef.current.error('Could not load products for billing.');
            throw new Error(await r.text().catch(() => r.statusText));
          }
          return r.json() as Promise<{ data?: unknown[]; last_page?: number }>;
        })
        .then((json) => ({
          data: (Array.isArray(json.data) ? json.data : []).map(normalizeInventoryVariantRow),
          lastPage: Number(json.last_page ?? 1),
        }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopCode]);

  if (!shopCode) return null;

  return (
    <section className={styles.section}>
      <header className={styles.manualHeaderStrip}>
        <div className={styles.manualHeaderInner}>
          <div className={styles.manualTitleCluster}>
            <h2 className={styles.manualSectionTitle}>{sectionTitle}</h2>
            {showToolbarAddCustomer && onToolbarAddCustomer ? (
              <Tooltip title="Add customer">
                <Button
                  type="default"
                  className={styles.customerIconBtn}
                  icon={<UserPlus className="h-4 w-4" aria-hidden />}
                  onClick={onToolbarAddCustomer}
                  aria-label="Add customer"
                />
              </Tooltip>
            ) : null}
          </div>
          <div className={styles.manualFilters}>
            <Input
              className={`${pageStyles.searchInput} ${styles.manualSearch}`}
              allowClear
              placeholder={
                hideBarcodeColumn
                  ? 'Search products, variants…'
                  : 'Search products, variants, barcodes…'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search className="h-4 w-4 text-[var(--bistre-400)]" />}
              aria-label="Search products"
            />
            <div className={styles.manualCategoryWrap}>
              <Select
                className={`${pageStyles.categorySelect} w-full min-w-0`}
                classNames={{
                  popup: { root: pageStyles.categorySelectDropdown },
                }}
                value={activeCategory}
                onChange={(v) => setActiveCategory(v)}
                options={categorySelectOptions}
                aria-label="Filter by category"
                getPopupContainer={() => document.body}
                listHeight={280}
              />
            </div>
          </div>
        </div>
      </header>

      {sectionHint ? (
        <p className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] px-3 py-2.5 text-xs leading-relaxed text-[var(--bistre-700)]">
          {sectionHint}
        </p>
      ) : null}

      {showSaleCheckoutHint ? (
        <p className="rounded-xl border border-dashed border-[var(--ochre-200)] bg-[var(--ochre-2)] px-3 py-2 text-xs leading-snug text-[var(--bistre-700)]">
          <span className="font-semibold text-[var(--bistre-900)]">
            Current sale &amp; checkout:
          </span>{' '}
          tap <strong>Review &amp; pay</strong> (bottom bar), add a customer if needed, choose{' '}
          <strong>Cash</strong> or <strong>UPI / Card</strong>, then either{' '}
          <strong>Generate bill</strong> (opens a printable page) or{' '}
          <strong>USB thermal</strong> in the same panel for direct thermal printing.
        </p>
      ) : null}

      <div className={styles.wrap}>
        <div className={styles.tabulatorInner}>
          <DataTable
            key={`${shopCode}-${hideBarcodeColumn ? 'i' : 's'}`}
            columns={columns}
            fetchFn={fetchFn}
            filterKey={filterKey}
            pageSize={PAGE_SIZE}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            maxBodyHeight="clamp(240px, 32vh, 360px)"
            emptyTitle="No matching products"
            emptyDescription="No products match your search or category for this shop."
          />
        </div>
      </div>
    </section>
  );
}

export const BillingPosManualSection = memo(BillingPosManualSectionInner);
