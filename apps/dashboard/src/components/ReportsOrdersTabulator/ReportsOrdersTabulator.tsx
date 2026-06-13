"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { formatInrFull } from "@/lib/chartFormat";
import { orderIdToInvoiceRef } from "@/lib/printInvoice";

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

const PAGE_SIZE = 20;

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
    minWidth: 100,
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
    minWidth: 120,
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
    width: 56,
    align: "right",
  },
  {
    key: "totalAmount",
    label: "Total",
    field: "totalAmount",
    width: 100,
    align: "right",
    render: (val) => formatInrFull(Number(val) || 0),
  },
];

export default function ReportsOrdersTabulator() {
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
