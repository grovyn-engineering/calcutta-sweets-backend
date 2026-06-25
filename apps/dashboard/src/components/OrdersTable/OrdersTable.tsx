"use client";

import { App, Input } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import { apiFetch, getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { orderIdToInvoiceRef } from "@/lib/printInvoice";
import { useShop } from "@/contexts/ShopContext";
import { Receipt, Search, Trash2 } from "lucide-react";
import styles from "./OrdersTable.module.css";

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

const PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 40];

const baseColumns: AppTableColumn[] = [
  {
    key: "createdAt",
    label: "When",
    field: "createdAt",
    minWidth: 140,
    render: (val) => formatWhen(String(val ?? "")),
  },
  {
    key: "orderSource",
    label: "Source",
    field: "orderSource",
    width: 100,
    render: (val) => {
      const raw = String(val ?? "POS");
      return (
        <span className={`orders-source-pill orders-source-pill--${raw.toLowerCase()}`}>
          {raw === "WEBSITE" ? "💻 Website" : "🏪 POS"}
        </span>
      );
    },
  },
  {
    key: "id",
    label: "Bill ref",
    field: "id",
    width: 120,
    render: (val) => (
      <span className="orders-bill-ref">
        {val ? orderIdToInvoiceRef(String(val)) : "-"}
      </span>
    ),
  },
  {
    key: "paymentMethod",
    label: "Payment",
    field: "paymentMethod",
    minWidth: 120,
    render: (val) => {
      const raw = String(val ?? "");
      if (raw === "CASH")
        return <span className="orders-pay-pill orders-pay-pill--cash">Cash</span>;
      if (raw === "UPI_CARD")
        return <span className="orders-pay-pill orders-pay-pill--upi">UPI / Card</span>;
      return <span className="orders-pay-pill">{raw || "-"}</span>;
    },
  },
  {
    key: "customerName",
    label: "Customer",
    field: "customerName",
    minWidth: 140,
    render: (_, row) => {
      const r = row as OrderRow;
      return (
        <div>
          <div className="orders-cust-name">{r.customerName?.trim() || "Walk-in"}</div>
          {r.customerPhone ? (
            <div className="orders-cust-phone">{r.customerPhone}</div>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "itemCount",
    label: "Items",
    field: "itemCount",
    width: 80,
    align: "right",
  },
  {
    key: "totalAmount",
    label: "Total",
    field: "totalAmount",
    width: 110,
    align: "right",
    render: (val) => inr.format(Number(val) || 0),
  },
  {
    key: "status",
    label: "Status",
    field: "status",
    width: 90,
    render: (val) => (
      <span className="orders-status-pill">{String(val ?? "")}</span>
    ),
  },
];

export default function OrdersTable() {
  const router = useRouter();
  const { modal, message } = App.useApp();
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const [refreshNonce, setRefreshNonce] = useState(0);

  const shopKey = effectiveShopCode || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}|${refreshNonce}`;

  const confirmDelete = useCallback(
    (row: OrderRow) => {
      const ref = row.id ? orderIdToInvoiceRef(row.id) : "this order";
      modal.confirm({
        title: "Delete this order?",
        okText: "Delete order",
        okButtonProps: { danger: true },
        cancelText: "Cancel",
        content: (
          <div>
            <p style={{ margin: 0 }}>
              You are about to permanently delete bill{" "}
              <strong>{ref}</strong>
              {row.customerName?.trim() ? (
                <>
                  {" "}
                  for <strong>{row.customerName.trim()}</strong>
                </>
              ) : null}
              .
            </p>
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              This will remove the order and all of its line items from your
              sales history. This action <strong>cannot be undone</strong>.
            </p>
          </div>
        ),
        onOk: async () => {
          const res = await apiFetch(`/orders/${encodeURIComponent(row.id)}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            const msg =
              typeof payload?.message === "string"
                ? payload.message
                : "Could not delete the order. Please try again.";
            message.error(msg);
            throw new Error(msg);
          }
          message.success("Order deleted");
          setRefreshNonce((n) => n + 1);
        },
      });
    },
    [modal, message],
  );

  const columns = useMemo<AppTableColumn[]>(
    () => [
      ...baseColumns,
      {
        key: "actions",
        label: "",
        width: 60,
        align: "center",
        render: (_, row) => {
          const r = row as OrderRow;
          return (
            <button
              type="button"
              className={styles.deleteBtn}
              aria-label="Delete order"
              title="Delete order"
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(r);
              }}
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden />
            </button>
          );
        },
      },
    ],
    [confirmDelete],
  );

  const fetchFn = useMemo(() => {
    const baseUrl = getApiBaseUrl();
    return ({ page, pageSize }: { page: number; pageSize: number }) => {
      const u = new URL(
        `${baseUrl}/orders`,
        typeof window !== "undefined" ? window.location.origin : "http://localhost",
      );
      u.searchParams.set("page", String(page));
      u.searchParams.set("size", String(pageSize));
      const q = searchRef.current.trim();
      if (q) u.searchParams.set("q", q);
      return fetch(u.toString(), {
        headers: { ...getAuthHeaders(), Accept: "application/json" },
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
          return r.json();
        })
        .then((json) => ({
          data: Array.isArray(json.data) ? json.data : [],
          lastPage: Number(json.last_page ?? 1),
        }));
    };
  }, [shopKey]);

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
          prefix={<Search className="h-4 w-4 text-[var(--bistre-400)]" aria-hidden />}
          aria-label="Search orders"
        />
      </div>
      <div className={styles.tableSlot}>
        <DataTable
          columns={columns}
          fetchFn={fetchFn}
          filterKey={filterKey}
          pageSize={PAGE_SIZE}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          maxBodyHeight="calc(100vh - 360px)"
          onRowClick={(row) => {
            const r = row as OrderRow;
            if (r?.id) router.push(`/orders/${encodeURIComponent(r.id)}`);
          }}
          emptyTitle="No bills found"
          emptyDescription="Orders from your Billing POS will appear here once you complete a sale."
          emptyIcon={<Receipt size={28} strokeWidth={1.35} aria-hidden />}
        />
      </div>
    </div>
  );
}
