"use client";

import { Input } from "antd";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { orderIdToInvoiceRef } from "@/lib/printInvoice";
import { useShop } from "@/contexts/ShopContext";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./OrdersTable.module.css";

type TabulatorPageable = { setPage: (page: number) => void };

const ReactTabulator = dynamic(
  () => import("react-tabulator/lib/ReactTabulator"),
  { ssr: false, loading: () => null },
);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type OrderRow = {
  id: string;
  createdAt: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  itemCount: number;
};

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 20];

export default function OrdersTable() {
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

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "When",
        field: "createdAt",
        minWidth: 148,
        headerSort: false,
        formatter: (cell) => formatWhen(String(cell.getValue() ?? "")),
      },
      {
        title: "Bill ref",
        field: "id",
        width: 112,
        headerSort: false,
        formatter: (cell) => {
          const id = String(cell.getValue() ?? "");
          const span = document.createElement("span");
          span.className = "orders-bill-ref";
          span.textContent = id ? orderIdToInvoiceRef(id) : "—";
          return span;
        },
      },
      {
        title: "Payment",
        field: "paymentMethod",
        width: 108,
        headerSort: false,
        formatter: (cell) => {
          const raw = String(cell.getValue() ?? "");
          const span = document.createElement("span");
          if (raw === "CASH") {
            span.className = "orders-pay-pill orders-pay-pill--cash";
            span.textContent = "Cash";
          } else if (raw === "UPI_CARD") {
            span.className = "orders-pay-pill orders-pay-pill--upi";
            span.textContent = "UPI / Card";
          } else {
            span.className = "orders-pay-pill";
            span.textContent = raw || "—";
          }
          return span;
        },
      },
      {
        title: "Customer",
        field: "customerName",
        minWidth: 120,
        headerSort: false,
        formatter: (cell) => {
          const row = cell.getRow().getData() as OrderRow;
          const wrap = document.createElement("div");
          const name = document.createElement("div");
          name.className = "orders-cust-name";
          name.textContent = row.customerName?.trim() || "Walk-in";
          wrap.appendChild(name);
          if (row.customerPhone) {
            const phone = document.createElement("div");
            phone.className = "orders-cust-phone";
            phone.textContent = row.customerPhone;
            wrap.appendChild(phone);
          }
          return wrap;
        },
      },
      {
        title: "Lines",
        field: "itemCount",
        width: 64,
        hozAlign: "right",
        headerSort: false,
      },
      {
        title: "Total",
        field: "totalAmount",
        width: 104,
        hozAlign: "right",
        headerSort: false,
        formatter: (cell) =>
          inr.format(Number(cell.getValue()) || 0),
      },
      {
        title: "Status",
        field: "status",
        width: 88,
        headerSort: false,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = "orders-status-pill";
          span.textContent = String(cell.getValue() ?? "");
          return span;
        },
      },
    ],
    [],
  );

  const options = useMemo<ReactTabulatorOptions>(() => {
    const baseUrl = getApiBaseUrl();
    return {
      layout: "fitColumns",
      placeholder: "No orders yet. Complete a sale on Billing POS to see it here.",
      pagination: true,
      paginationMode: "remote",
      paginationSize: PAGE_SIZE,
      paginationSizeSelector: PAGE_SIZE_OPTIONS,
      ajaxURL: `${baseUrl}/orders`,
      ajaxRequestFunc: (_url, _config, params) => {
        const u = new URL(
          `${baseUrl}/orders`,
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

  if (!shopKey) return null;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Input
          className={styles.searchInput}
          allowClear
          placeholder="Search customer name, phone, or order id…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={
            <Search className="h-4 w-4 text-[var(--bistre-400)]" aria-hidden />
          }
          aria-label="Search orders"
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
