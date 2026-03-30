'use client';

import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { Input, Select } from 'antd';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ColumnDefinition, ReactTabulatorOptions } from 'react-tabulator';

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

import 'tabulator-tables/dist/css/tabulator.min.css';

type CategorySummary = { id: string; name: string };

type TabulatorPageable = { setPage: (page: number) => void };

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
};

const ReactTabulator = dynamic(
  () => import('react-tabulator/lib/ReactTabulator'),
  { ssr: false, loading: () => null },
);

const TABULATOR_LOADING_HTML =
  '<div class="billing-pos-tabulator-dots" aria-hidden="true"><span></span><span></span><span></span></div>';

const PAGE_SIZE = 40;

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

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
    category: cat && cat !== '—' ? cat : null,
  };
}

export type BillingPosManualSectionProps = {
  shopCode: string;
  onAddProduct: (row: BillingVariantRow) => void;
  /** Increment after a successful POS sale to reload stock from the server. */
  dataRefreshKey?: number;
};

/**
 * Search, category filter, and Tabulator grid with remote pagination
 * (native Tabulator).
 */
function BillingPosManualSectionInner({
  shopCode,
  onAddProduct,
  dataRefreshKey = 0,
}: BillingPosManualSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  const filtersRef = useRef({
    q: debouncedSearch,
    category: activeCategory,
  });
  filtersRef.current = { q: debouncedSearch, category: activeCategory };

  const addProductRef = useRef(onAddProduct);
  useEffect(() => {
    addProductRef.current = onAddProduct;
  }, [onAddProduct]);

  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevFilterKeyRef = useRef<string | null>(null);

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

  const categorySelectOptions = [
    { value: 'all', label: 'All categories' },
    ...categories.map((c) => ({
      value: c.name,
      label: c.name.replace(/_/g, ' '),
    })),
  ];

  const filterKey = `${shopCode}|${debouncedSearch}|${activeCategory}`;

  /**
   * Reload from page 1 when shop, debounced search, or category changes.
   * Skip the first run — Tabulator performs the initial remote load on mount.
   */
  useEffect(() => {
    const t = tableRef.current;
    if (!t || !shopCode) return;
    if (prevFilterKeyRef.current === null) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    t.setPage(1);
  }, [filterKey, shopCode]);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: 'Product',
        field: 'productName',
        minWidth: 168,
        headerSort: false,
        formatter: (cell) => {
          const row = cell.getRow().getData() as ApiVariantRow;
          const wrap = document.createElement('div');
          const titleEl = document.createElement('div');
          titleEl.className = 'billing-pos-product-title';
          titleEl.textContent = row.productName ?? '';
          const sub = document.createElement('div');
          sub.className = 'billing-pos-product-sub';
          const cat = (row.category ?? '').trim();
          const parts = [
            row.variantName,
            cat && cat !== '—' ? cat.replace(/_/g, ' ') : null,
          ].filter(Boolean);
          sub.textContent = parts.join(' · ');
          wrap.appendChild(titleEl);
          wrap.appendChild(sub);
          return wrap;
        },
      },
      {
        title: 'Barcode',
        field: 'barcode',
        minWidth: 120,
        headerSort: false,
        formatter: (cell) => {
          const span = document.createElement('span');
          span.className = 'billing-pos-mono';
          span.textContent = String(cell.getValue() ?? '');
          return span;
        },
      },
      {
        title: 'Stock',
        field: 'quantity',
        width: 88,
        hozAlign: 'left',
        headerSort: false,
        formatter: (cell) => {
          const row = cell.getRow().getData() as ApiVariantRow;
          return `${row.quantity ?? 0} ${row.unit ?? 'PC'}`;
        },
      },
      {
        title: 'Price',
        field: 'price',
        width: 88,
        hozAlign: 'left',
        headerSort: false,
        formatter: (cell) =>
          inr.format(Number(cell.getValue()) || 0),
      },
      {
        title: '',
        field: '_add',
        width: 76,
        hozAlign: 'right',
        headerSort: false,
        resizable: false,
        formatter: (cell) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'billing-pos-add-btn';
          btn.textContent = 'Add';
          btn.setAttribute('aria-label', 'Add to sale');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const d = cell.getRow().getData() as ApiVariantRow;
            addProductRef.current(apiRowToBilling(d));
          });
          return btn;
        },
      },
    ],
    [],
  );

  const baseUrl = getApiBaseUrl();

  const options = useMemo<ReactTabulatorOptions>(() => {
    return {
      layout: 'fitColumns',
      height: '100%',
      placeholder:
        'No products match your search or category for this shop.',
      /**
       * Remote pagination only (no `progressiveLoad: 'scroll'`). Tabulator’s
       * progressive-scroll mode auto-fetches the next page while it thinks the
       * viewport is not “full” (scrollHeight vs clientHeight), which can chain
       * many requests without the user scrolling.
       */
      pagination: true,
      paginationMode: 'remote',
      paginationSize: PAGE_SIZE,
      paginationSizeSelector: [40],
      ajaxURL: `${baseUrl}/inventory/variants`,
      ajaxRequestFunc: (url, _config, params) => {
        const u = new URL(
          url,
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        );
        const merged: Record<string, unknown> = {
          ...(params && typeof params === 'object' ? params : {}),
        };
        merged.activeOnly = '1';
        const { q, category } = filtersRef.current;
        const qt = q.trim();
        if (qt) merged.q = qt;
        if (category && category !== 'all') merged.category = category;
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            u.searchParams.set(k, String(v));
          }
        });
        const page = Math.max(1, parseInt(String(merged.page ?? '1'), 10) || 1);
        const dedupeKey = `GET:/inventory/variants:${shopCode}:p${page}:q${qt}:c${category}`;
        return dedupeInFlight(dedupeKey, async () => {
          const r = await fetch(u.toString(), {
            headers: {
              ...getAuthHeaders(),
              Accept: 'application/json',
            },
          });
          if (!r.ok) {
            const t = await r.text();
            throw new Error(t || r.statusText);
          }
          return r.json();
        });
      },
      dataLoader: true,
      dataLoaderLoading: TABULATOR_LOADING_HTML,
    };
  }, [baseUrl, shopCode]);

  const onTableRef = useCallback(
    (instanceRef: { current?: TabulatorPageable }) => {
      tableRef.current = instanceRef.current ?? null;
    },
    [],
  );

  if (!shopCode) return null;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="min-w-0 shrink-0 min-[900px]:max-w-[46%]">
        <h2 className="mb-1 text-sm font-semibold text-[var(--bistre-800)]">
          Manual billing
        </h2>
      </div>
      <div className="flex min-w-0 flex-col gap-3 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
        <div className={pageStyles.filtersRow}>
          <Input
            className={`${pageStyles.searchInput} ${pageStyles.searchInputGrow}`}
            allowClear
            placeholder="Search products, variants, barcodes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Search className="h-4 w-4 text-[var(--bistre-400)]" />}
            aria-label="Search products"
          />
          <Select
            className={pageStyles.categorySelect}
            classNames={{
              popup: { root: pageStyles.categorySelectDropdown },
            }}
            value={activeCategory}
            onChange={(v) => setActiveCategory(v)}
            options={categorySelectOptions}
            aria-label="Filter by category"
          />
        </div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.tabulatorInner}>
          <ReactTabulator
            key={`${shopCode}-${dataRefreshKey}`}
            columns={columns}
            options={options}
            onRef={onTableRef}
          />
        </div>
      </div>
    </section>
  );
}

export const BillingPosManualSection = memo(BillingPosManualSectionInner);
