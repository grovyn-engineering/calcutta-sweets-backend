"use client";

import { Input } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { DataTable } from "@/components/DataTable/DataTable";

import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRemoteTabulatorLoading } from "@/hooks/useRemoteTabulatorLoading";
import { orderIdToInvoiceRef } from "@/lib/printInvoice";
import { useShop } from "@/contexts/ShopContext";
import { Receipt, Search } from "lucide-react";
import styles from "./OrdersTable.module.css";

type TabulatorPageable = { setPage: (page: number) => void };

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
  orderSource: string;
  pickupTime: string | null;
  customerName: string | null;
  customerPhone: string | null;
  itemCount: number;
};

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 20];

export default function OrdersTable() {
  const router = useRouter();
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevFilterKeyRef = useRef<string | null>(null);

  const shopKey = effectiveShopCode || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}`;

  const { loading: tableLoading, onRemoteBusyChange } =
    useRemoteTabulatorLoading(shopKey);

  useEffect(() => {
    const prev = prevFilterKeyRef.current;
    prevFilterKeyRef.current = filterKey;

    const t = tableRef.current;
    if (!t || !shopKey) return;
    if (prev === null || prev === filterKey) return;
    t.setPage(1);
  }, [filterKey, shopKey]);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "When",
        field: "createdAt",
        minWidth: 100,
        headerSort: false,
        formatter: (cell) => formatWhen(String(cell.getValue() ?? "")),
      },
      {
        title: "Source",
        field: "orderSource",
        width: 100,
        headerSort: false,
        formatter: (cell) => {
          const raw = String(cell.getValue() ?? "POS");
          const span = document.createElement("span");
          span.className = `orders-source-pill orders-source-pill--${raw.toLowerCase()}`;
          span.textContent = raw === "WEBSITE" ? "💻 Website" : "🏪 POS";
          return span;
        },
      },
      {
        title: "Pickup",
        field: "pickupTime",
        minWidth: 140,
        headerSort: false,
        formatter: (cell) => {
          const val = cell.getValue();
          if (!val) return "-";
          return formatWhen(String(val));
        },
      },
      {
        title: "Bill ref",
        field: "id",
        width: 125,
        headerSort: false,
        formatter: (cell) => {
          const id = String(cell.getValue() ?? "");
          const span = document.createElement("span");
          span.className = "orders-bill-ref";
          span.textContent = id ? orderIdToInvoiceRef(id) : "-";
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
            span.textContent = raw || "-";
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
        width: 80,
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

  /** Row clicks: use `events` - this wrapper doesn’t pick up `rowClick` from `options`. */
  const events = useMemo(
    () => ({
      rowClick: (_e: unknown, row: { getData: () => OrderRow }) => {
        const data = row.getData();
        if (data?.id) router.push(`/orders/${encodeURIComponent(data.id)}`);
      },
    }),
    [router],
  );

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
        <DataTable
          columns={columns}
          options={useMemo(() => ({
            ...options,
            rowClick: events.rowClick
          }), [options, events.rowClick])}
          onRef={(instanceRef: { current?: TabulatorPageable }) => {
            tableRef.current = instanceRef.current ?? null;
          }}
          loading={tableLoading}
          onRemoteBusyChange={onRemoteBusyChange}
          minHeight={450}
          emptyTitle="No bills found"
          emptyDescription="Orders from your Billing POS will appear here once you complete a sale."
          emptyIcon={<Receipt size={28} strokeWidth={1.35} aria-hidden />}
        />
      </div>
    </div>
  );
}
