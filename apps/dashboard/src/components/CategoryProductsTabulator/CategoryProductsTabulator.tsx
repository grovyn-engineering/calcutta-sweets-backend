"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useRemoteTabulatorLoading } from "@/hooks/useRemoteTabulatorLoading";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { LayoutGrid } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";

import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import styles from "./CategoryProductsTabulator.module.css";

type TabulatorPageable = { setPage: (page: number) => void };

type ApiVariant = {
  id: string;
  quantity: number;
  price: number;
};

type ApiProduct = {
  id: string;
  name: string;
  variants: ApiVariant[];
};

type PageBody = {
  data: ApiProduct[];
  last_page: number;
  page?: number;
  size?: number;
  total?: number;
};

type TabRow = {
  productId: string;
  name: string;
  stock: number;
  fromPrice: number;
  firstVariantId: string | null;
};

const PAGE_SIZE = 25;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function mapProductToRow(p: ApiProduct): TabRow {
  const stock = p.variants.reduce((s, v) => s + v.quantity, 0);
  const minPrice =
    p.variants.length > 0
      ? Math.min(...p.variants.map((v) => v.price))
      : 0;
  const firstVariant = p.variants[0];
  return {
    productId: p.id,
    name: p.name,
    stock,
    fromPrice: minPrice,
    firstVariantId: firstVariant?.id ?? null,
  };
}

export type CategoryProductsTabulatorProps = {
  categoryId: string;
  /** Bump after add product / rename to reload grid from page 1. */
  refreshKey: number;
  onOpenVariant: (variantId: string) => void;
};

function CategoryProductsTabulatorInner({
  categoryId,
  refreshKey,
  onOpenVariant,
}: CategoryProductsTabulatorProps) {
  const categoryIdRef = useRef(categoryId);
  categoryIdRef.current = categoryId;

  const openRef = useRef(onOpenVariant);
  useEffect(() => {
    openRef.current = onOpenVariant;
  }, [onOpenVariant]);

  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevFilterKeyRef = useRef<string | null>(null);
  const filterKey = `${categoryId}|${refreshKey}`;

  const { loading: tableLoading, onRemoteBusyChange } = useRemoteTabulatorLoading(
    categoryId,
    refreshKey,
  );

  useEffect(() => {
    const t = tableRef.current;
    if (!t) return;
    if (prevFilterKeyRef.current === null) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    t.setPage(1);
  }, [filterKey]);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "Product",
        field: "name",
        minWidth: 200,
        headerSort: false,
      },
      {
        title: "Stock",
        field: "stock",
        width: 100,
        hozAlign: "right",
        headerSort: false,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = "category-products-num";
          const n = Number(cell.getValue()) || 0;
          span.textContent = n.toLocaleString("en-IN");
          return span;
        },
      },
      {
        title: "From price",
        field: "fromPrice",
        width: 120,
        hozAlign: "right",
        headerSort: false,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = "category-products-num";
          span.textContent = inr.format(Number(cell.getValue()) || 0);
          return span;
        },
      },
      {
        title: "Inventory",
        field: "firstVariantId",
        minWidth: 120,
        headerSort: false,
        formatter: (cell) => {
          const id = cell.getValue() as string | null;
          if (!id) {
            const em = document.createElement("span");
            em.className = "category-products-dash";
            em.textContent = "-";
            return em;
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "category-products-link";
          btn.textContent = "Open variant";
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            openRef.current(id);
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
      layout: "fitColumns",
      height: "100%",
      placeholder:
        "No products in this category for the current shop.",
      pagination: false,
      paginationMode: "remote",
      paginationSize: PAGE_SIZE,
      progressiveLoad: "scroll",
      progressiveLoadScrollMargin: 100,
      ajaxURL: `${baseUrl}/category/00000000-0000-0000-0000-000000000000/products`,
      ajaxRequestFunc: (_url, _config, params) => {
        const id = categoryIdRef.current;
        const u = new URL(
          `${baseUrl}/category/${id}/products`,
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost",
        );
        const merged: Record<string, unknown> = {
          ...(params && typeof params === "object" ? params : {}),
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            u.searchParams.set(k, String(v));
          }
        });
        return fetch(u.toString(), {
          headers: {
            ...getAuthHeaders(),
            Accept: "application/json",
          },
        }).then(async (r) => {
          if (!r.ok) {
            const t = await r.text();
            throw new Error(t || r.statusText);
          }
          const body = (await r.json()) as PageBody;
          const rows = (body.data ?? []).map(mapProductToRow);
          return {
            last_page: body.last_page,
            data: rows,
          };
        });
      },
      dataLoader: true,
    };
  }, [baseUrl]);

  const onTableRef = useCallback(
    (instanceRef: { current?: TabulatorPageable }) => {
      tableRef.current = instanceRef.current ?? null;
    },
    [],
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.tabulatorInner}>
        <DataTable
          columns={columns}
          options={options}
          onRef={onTableRef}
          minHeight={300}
          loading={tableLoading}
          onRemoteBusyChange={onRemoteBusyChange}
          emptyTitle="No products here"
          emptyIcon={<LayoutGrid size={28} strokeWidth={1.35} aria-hidden />}
        />
      </div>
    </div>
  );
}

export const CategoryProductsTabulator = memo(CategoryProductsTabulatorInner);
