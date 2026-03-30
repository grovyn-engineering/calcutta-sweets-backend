"use client";

import { Input } from "antd";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useShop } from "@/contexts/ShopContext";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./InventoryTable.module.css";

type TabulatorPageable = { setPage: (page: number) => void };

const ReactTabulator = dynamic(
  () => import("react-tabulator/lib/ReactTabulator"),
  { ssr: false, loading: () => null },
);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25];

const columns: ColumnDefinition[] = [
  { title: "Product", field: "productName", minWidth: 152, widthGrow: 2 },
  { title: "Variant", field: "variantName", width: 102, minWidth: 96 },
  { title: "Category", field: "category", width: 118, minWidth: 104 },
  { title: "SKU", field: "sku", width: 76, minWidth: 72 },
  {
    title: "Barcode",
    field: "barcode",
    width: 118,
    minWidth: 108,
    maxWidth: 136,
  },
  {
    title: "Qty",
    field: "quantity",
    width: 70,
    minWidth: 64,
    hozAlign: "right",
    sorter: "number",
  },
  {
    title: "Min stock",
    field: "minStock",
    width: 92,
    minWidth: 88,
    hozAlign: "right",
    sorter: "number",
    formatter: (cell) => {
      const v = cell.getValue() as number | null;
      return v === null || v === undefined ? "—" : String(v);
    },
  },
  {
    title: "Unit",
    field: "unit",
    width: 78,
    minWidth: 72,
  },
  {
    title: "Price",
    field: "price",
    width: 92,
    minWidth: 84,
    hozAlign: "right",
    sorter: "number",
    formatter: (cell) => inr.format(Number(cell.getValue()) || 0),
  },
  {
    title: "Edit",
    field: "_edit",
    width: 82,
    hozAlign: "center",
    headerSort: false,
    resizable: false,
    formatter: (cell) => {
      const id = cell.getRow().getData().id as string;
      const a = document.createElement("a");
      a.href = `/inventory/${id}`;
      a.className = "inventory-edit-link";
      a.textContent = "Edit";
      return a;
    },
  },
];

export default function InventoryTable() {
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevFilterKeyRef = useRef<string | null>(null);

  const shopKey = effectiveShopCode || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}`;

  useEffect(() => {
    const t = tableRef.current;
    if (!t || !shopKey) return;
    if (prevFilterKeyRef.current === null) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    t.setPage(1);
  }, [filterKey, shopKey]);

  const options = useMemo<ReactTabulatorOptions>(() => {
    const baseUrl = getApiBaseUrl();

    return {
      layout: "fitColumns",
      placeholder: "No rows match your search or this shop has no inventory yet.",
      pagination: true,
      paginationMode: "remote",
      paginationSize: PAGE_SIZE,
      paginationSizeSelector: PAGE_SIZE_OPTIONS,
      ajaxURL: `${baseUrl}/inventory/variants`,
      ajaxRequestFunc: (url, _config, params) => {
        const u = new URL(
          url,
          typeof window !== "undefined" ? window.location.origin : "http://localhost",
        );
        const merged: Record<string, unknown> = {
          ...(params && typeof params === "object" ? params : {}),
        };
        const q = searchRef.current.trim();
        if (q) merged.q = q;
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
          return r.json();
        });
      },
      dataLoader: false,
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Input
          className={styles.searchInput}
          allowClear
          placeholder="Search product, variant, barcode…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={
            <Search className="h-4 w-4 text-[var(--bistre-400)]" aria-hidden />
          }
          aria-label="Search inventory"
        />
      </div>
      <div className={styles.tableSlot}>
        <ReactTabulator
          columns={columns}
          options={options}
          onRef={(instanceRef: { current?: TabulatorPageable }) => {
            tableRef.current = instanceRef.current ?? null;
          }}
        />
      </div>
    </div>
  );
}
