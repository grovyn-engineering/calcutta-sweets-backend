"use client";

import { paymentLabel } from "@/lib/payments";
import { App, Button, Input } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import { apiFetch, getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { billRefOf } from "@/lib/printInvoice";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { isAtLeastManager } from "@/lib/rolePermissions";
import { Download, Globe, Receipt, Search, Store, Trash2 } from "lucide-react";
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
  billNo?: string | null;
  legacyBillRef?: string | null;
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
          {raw === "WEBSITE" ? (
            <Globe className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Store className="h-3.5 w-3.5" aria-hidden />
          )}
          {raw === "WEBSITE" ? "Website" : "POS"}
        </span>
      );
    },
  },
  {
    key: "id",
    label: "Bill ref",
    field: "id",
    width: 120,
    render: (val, row: any) => {
      const cancelled = row.status === "CANCELLED";
      return (
        <span
          className="orders-bill-ref"
          style={cancelled ? { textDecoration: "line-through", opacity: 0.6 } : undefined}
          title={cancelled ? "Cancelled" : undefined}
        >
          {val ? billRefOf({ ...row, id: String(val) }) : "-"}
          {cancelled ? " (cancelled)" : ""}
        </span>
      );
    },
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
      if (raw)
        return (
          <span className="orders-pay-pill orders-pay-pill--upi">
            {paymentLabel(raw)}
          </span>
        );
      return <span className="orders-pay-pill">-</span>;
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
          <div className="orders-cust-name" title={r.customerName?.trim() || undefined}>
            {r.customerName?.trim() || "Walk-in"}
          </div>
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
      <span
        className={`orders-status-pill orders-status-pill--${String(val ?? "").toLowerCase()}`}
      >
        {String(val ?? "").charAt(0) + String(val ?? "").slice(1).toLowerCase()}
      </span>
    ),
  },
];

export default function OrdersTable({
  initialSearch = "",
}: {
  /** Pre-filled search, e.g. a customer's phone from the Customers screen. */
  initialSearch?: string;
}) {
  const router = useRouter();
  const { modal, message } = App.useApp();
  const { user } = useAuth();
  // The API only lets a manager or above cancel a bill.
  const canCancel = isAtLeastManager(user?.role);
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const [refreshNonce, setRefreshNonce] = useState(0);

  const shopKey = effectiveShopCode || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}|${refreshNonce}`;

  const [exporting, setExporting] = useState(false);
  /** Exports every order matching the current search (not just the visible page). */
  const exportOrders = useCallback(async () => {
    if (!shopKey) return;
    setExporting(true);
    try {
      const { fetchAllPages, downloadOrdersExcel } = await import("@/lib/listExports");
      const q = searchRef.current.trim();
      const { rows, capped } = await fetchAllPages<OrderRow>("/orders", { q });
      if (rows.length === 0) {
        message.info("No orders to export.");
        return;
      }
      await downloadOrdersExcel(rows, shopKey, q);
      if (capped) message.warning(`Export limited to the first ${rows.length} orders.`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Could not export orders.");
    } finally {
      setExporting(false);
    }
  }, [shopKey, message]);

  const confirmDelete = useCallback(
    (row: OrderRow) => {
      const ref = row.id ? billRefOf(row) : "this order";
      modal.confirm({
        title: "Cancel this bill?",
        okText: "Cancel bill",
        okButtonProps: { danger: true },
        cancelText: "Keep bill",
        content: (
          <div>
            <p style={{ margin: 0 }}>
              You are about to cancel bill{" "}
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
              The items go back into stock and the bill is excluded from sales
              reports. The bill number stays in your invoice series, marked as
              cancelled. This <strong>cannot be undone</strong>.
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
                : res.status === 403
                  ? "Only a manager or admin can cancel bills."
                  : "Could not cancel the bill. Please try again.";
            message.error(msg);
            throw new Error(msg);
          }
          message.success("Bill cancelled");
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
          if (r.status === "CANCELLED" || !canCancel) return null;
          return (
            <button
              type="button"
              className={styles.deleteBtn}
              aria-label="Cancel bill"
              title="Cancel bill"
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
    [confirmDelete, canCancel],
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
          placeholder="Search customer name, phone, or bill no…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<Search className="h-4 w-4 text-[var(--bistre-400)]" aria-hidden />}
          aria-label="Search orders"
        />
        <Button
          icon={<Download className="h-4 w-4" aria-hidden />}
          loading={exporting}
          onClick={() => void exportOrders()}
          className="shrink-0"
        >
          Export
        </Button>
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
