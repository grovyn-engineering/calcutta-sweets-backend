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
} from 'react';
import { DataTable } from '@/components/DataTable/DataTable';
import type { ColumnDefinition, ReactTabulatorOptions } from 'react-tabulator';

import {
  apiFetch,
  dedupeInFlight,
  getApiBaseUrl,
  getAuthHeaders,
} from '@/lib/api';
import { createTabulatorVariantThumb } from '@/lib/tabulatorVariantThumb';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRemoteTabulatorLoading } from '@/hooks/useRemoteTabulatorLoading';
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
  imageUrl?: string | null;
};

const PAGE_SIZE = 40;

const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/></svg>`;

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
};

function BillingPosManualSectionInner({
  shopCode,
  onAddProduct,
  dataRefreshKey = 0,
  showToolbarAddCustomer = false,
  onToolbarAddCustomer,
  showSaleCheckoutHint = false,
}: BillingPosManualSectionProps) {
  const { message: messageApi } = App.useApp();
  const messageApiRef = useRef(messageApi);
  messageApiRef.current = messageApi;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
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

  const { loading: tableLoading, onRemoteBusyChange } = useRemoteTabulatorLoading(
    shopCode,
    dataRefreshKey,
    activeCategory,
  );

  useEffect(() => {
    const prev = prevFilterKeyRef.current;
    prevFilterKeyRef.current = filterKey;

    const t = tableRef.current;
    if (!t || !shopCode) return;
    if (prev === null || prev === filterKey) return;
    t.setPage(1);
  }, [filterKey, shopCode]);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: 'S.No.',
        formatter: 'responsiveCollapse',
        width: 30,
        minWidth: 30,
        hozAlign: 'center',
        resizable: false,
        headerSort: false,
      },
      {
        title: 'Image',
        field: 'imageUrl',
        width: 56,
        minWidth: 52,
        hozAlign: 'center',
        headerHozAlign: 'center',
        headerSort: false,
        resizable: false,
        responsive: 0,
        cssClass: 'billing-pos-thumb-cell',
        formatter: (cell) => {
          const row = cell.getRow().getData() as ApiVariantRow;
          const label =
            [row.productName, row.variantName].filter(Boolean).join(' · ') ||
            'Product';
          return createTabulatorVariantThumb(row.imageUrl, label);
        },
      },
      {
        title: 'Product',
        field: 'productName',
        minWidth: 140,
        headerSort: false,
        responsive: 0,
        formatter: (cell) => {
          const row = cell.getRow().getData() as ApiVariantRow;
          const wrap = document.createElement('div');
          wrap.className = 'billing-pos-product-stack';
          wrap.setAttribute('data-skip-overflow-tooltip', '1');

          const product = (row.productName ?? '').trim();
          const variant = (row.variantName ?? '').trim();
          const titleText =
            product || variant || '—';

          const titleEl = document.createElement('div');
          titleEl.className = 'billing-pos-product-title';
          titleEl.textContent = titleText;

          const sub = document.createElement('div');
          sub.className = 'billing-pos-product-sub';
          const cat = (row.category ?? '').trim();
          const subParts: string[] = [];
          if (product && variant && variant !== product) {
            subParts.push(variant);
          }
          if (cat && cat !== '-') {
            subParts.push(cat.replace(/_/g, ' '));
          }
          const subText = subParts.join(' · ');
          sub.textContent = subText;

          const tipParts = [titleText];
          if (subText) tipParts.push(subText);
          const fullTip = tipParts.join(' — ');
          wrap.dataset.fullTip = fullTip;

          const inner = document.createElement('div');
          inner.className = 'billing-pos-product-stack-content';
          inner.appendChild(titleEl);
          inner.appendChild(sub);
          wrap.appendChild(inner);
          return wrap;
        },
      },
      {
        title: 'Barcode',
        field: 'barcode',
        minWidth: 120,
        cssClass: 'billing-pos-col-barcode',
        headerSort: false,
        responsive: 2,
        formatter: (cell) => {
          const raw = String(cell.getValue() ?? '');
          const wrap = document.createElement('div');
          wrap.className = 'billing-pos-barcode-wrap';
          const span = document.createElement('span');
          span.className = 'billing-pos-mono';
          span.textContent = raw;
          if (raw) span.title = raw;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'billing-pos-copy-btn';
          btn.innerHTML = COPY_ICON_SVG;
          btn.setAttribute('aria-label', 'Copy barcode');
          btn.disabled = !raw;
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!raw) return;
            try {
              await navigator.clipboard.writeText(raw);
              messageApiRef.current.success('Barcode copied');
            } catch {
              messageApiRef.current.error('Could not copy');
            }
          });
          wrap.appendChild(btn);
          wrap.appendChild(span);
          return wrap;
        },
      },
      {
        title: 'Stock',
        field: 'quantity',
        width: 100,
        minWidth: 90,
        hozAlign: 'left',
        headerSort: false,
        responsive: 1,
        formatter: (cell) => {
          const row = cell.getRow().getData() as ApiVariantRow;
          return `${row.quantity ?? 0} ${row.unit ?? 'PC'}`;
        },
      },
      {
        title: 'Price',
        field: 'price',
        width: 90,
        minWidth: 80,
        hozAlign: 'left',
        headerSort: false,
        responsive: 0,
        formatter: (cell) =>
          inr.format(Number(cell.getValue()) || 0),
      },
      {
        title: 'Actions',
        field: '_add',
        width: 96,
        minWidth: 96,
        hozAlign: 'right',
        headerSort: false,
        resizable: false,
        responsive: 0,
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
      responsiveLayout: 'collapse',
      responsiveLayoutCollapseStartOpen: false,
      height: '100%',
      placeholder:
        'No products match your search or category for this shop.',
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
    };
  }, [baseUrl, shopCode]);

  const onTableRef = useCallback(
    (instanceRef: { current?: unknown }) => {
      tableRef.current = (instanceRef.current as TabulatorPageable | undefined) ?? null;
    },
    [],
  );

  if (!shopCode) return null;

  return (
    <section className={styles.section}>
      <header className={styles.manualHeader}>
        <div className={styles.manualTitleRow}>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--bistre-800)]">
            Manual billing
          </h2>
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
            placeholder="Search products, variants, barcodes…"
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
              getPopupContainer={(n) => n.parentElement ?? document.body}
              listHeight={280}
            />
          </div>
        </div>
      </header>

      {showSaleCheckoutHint ? (
        <p className="rounded-xl border border-dashed border-[var(--ochre-200)] bg-[var(--ochre-2)] px-3 py-2 text-xs leading-snug text-[var(--bistre-700)]">
          <span className="font-semibold text-[var(--bistre-900)]">
            Current sale &amp; checkout:
          </span>{' '}
          use the <strong>bar fixed at the bottom</strong> of the screen to see
          added lines, set payment mode, and tap <strong>Generate bill</strong>.
        </p>
      ) : null}

      <div className={styles.wrap}>
        <div className={styles.tabulatorInner}>
          <DataTable
            key={`${shopCode}-${dataRefreshKey}`}
            columns={columns}
            options={options}
            onRef={onTableRef}
            minHeight={0}
            loading={tableLoading}
            onRemoteBusyChange={onRemoteBusyChange}
            emptyTitle="No matching products"
          />
        </div>
      </div>
    </section>
  );
}

export const BillingPosManualSection = memo(BillingPosManualSectionInner);
