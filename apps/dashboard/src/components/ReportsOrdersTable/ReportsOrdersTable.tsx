"use client";

import { paymentLabel } from "@/lib/payments";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { formatInrFull } from "@/lib/chartFormat";
import { billRefOf } from "@/lib/printInvoice";

type OrderRow = {
  id: string;
  billNo?: string | null;
  legacyBillRef?: string | null;
  createdAt: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  itemCount: number;
};

const PAGE_SIZE = 20;

const CANCELLED_STYLE = { textDecoration: "line-through", opacity: 0.6 } as const;

const columns: AppTableColumn[] = [
  {
    key: "createdAt",
    label: "Date",
    field: "createdAt",
    minWidth: 120,
    render: (val) => {
      const iso = String(val ?? "");
      try {
        return new Date(iso).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return iso;
      }
    },
  },
  {
    key: "id",
    label: "Bill ref",
    field: "id",
    width: 108,
    render: (val, row: any) => {
      // Same marking as the Orders list, so a cancelled bill isn't read as a sale.
      const cancelled = row.status === "CANCELLED";
      return (
        <span
          className="orders-bill-ref"
          style={cancelled ? CANCELLED_STYLE : undefined}
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
    minWidth: 100,
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
    minWidth: 120,
    render: (_, row) => {
      const r = row as OrderRow;
      return (
        <div>
          {/* `orders-cust-name` is styled only inside OrdersTable, so truncate here too. */}
          <div
            className="orders-cust-name max-w-[200px] truncate"
            title={r.customerName?.trim() || undefined}
          >
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
    width: 56,
    align: "right",
  },
  {
    key: "totalAmount",
    label: "Total",
    field: "totalAmount",
    width: 100,
    align: "right",
    render: (val, row) => (
      <span style={(row as OrderRow).status === "CANCELLED" ? CANCELLED_STYLE : undefined}>
        {formatInrFull(Number(val) || 0)}
      </span>
    ),
  },
];

export default function ReportsOrdersTable() {
  const router = useRouter();

  const fetchFn = useMemo(() => {
    const baseUrl = getApiBaseUrl();
    return ({ page, pageSize }: { page: number; pageSize: number }) => {
      const u = new URL(
        `${baseUrl}/orders`,
        typeof window !== "undefined" ? window.location.origin : "http://localhost",
      );
      u.searchParams.set("page", String(page));
      u.searchParams.set("size", String(pageSize));
      return fetch(u.toString(), {
        headers: {
          ...getAuthHeaders(),
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
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
  }, []);

  return (
    <DataTable
      columns={columns}
      fetchFn={fetchFn}
      pageSize={PAGE_SIZE}
      maxBodyHeight={480}
      onRowClick={(row) => {
        const r = row as OrderRow;
        if (r?.id) router.push(`/orders/${encodeURIComponent(r.id)}`);
      }}
      emptyTitle="No orders in this report"
      emptyDescription="Try widening the date range or check another shop."
      emptyIcon={<Receipt size={28} strokeWidth={1.35} aria-hidden />}
    />
  );
}
