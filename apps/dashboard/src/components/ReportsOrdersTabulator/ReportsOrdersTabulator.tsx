"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { DataTable } from "@/components/DataTable/DataTable";

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

const PAGE_SIZE = 12;

function paymentPill(raw: string) {
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
}

export default function ReportsOrdersTabulator() {
  const router = useRouter();

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "Date",
        field: "createdAt",
        minWidth: 120,
        headerSort: false,
        formatter: (cell) => {
          const iso = String(cell.getValue() ?? "");
          try {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, {
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
        title: "Bill ref",
        field: "id",
        width: 108,
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
        width: 100,
        headerSort: false,
        formatter: (cell) => paymentPill(String(cell.getValue() ?? "")),
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
        width: 56,
        hozAlign: "right",
        headerSort: false,
      },
      {
        title: "Total",
        field: "totalAmount",
        width: 100,
        hozAlign: "right",
        headerSort: false,
        formatter: (cell) =>
          formatInrFull(Number(cell.getValue()) || 0),
      },
    ],
    [],
  );

  const options = useMemo<ReactTabulatorOptions>(() => {
    const baseUrl = getApiBaseUrl();
    return {
      layout: "fitColumns",
      placeholder: "No orders in this shop yet.",
      pagination: true,
      paginationMode: "remote",
      paginationSize: PAGE_SIZE,
      ajaxURL: `${baseUrl}/orders`,
      ajaxRequestFunc: (_url, _config, params) => {
        const u = new URL(
          `${baseUrl}/orders`,
          typeof window !== "undefined" ? window.location.origin : "http://localhost",
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
            "X-Requested-With": "XMLHttpRequest",
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

  const events = useMemo(
    () => ({
      rowClick: (_e: unknown, row: { getData: () => OrderRow }) => {
        const data = row.getData();
        if (data?.id) router.push(`/orders/${encodeURIComponent(data.id)}`);
      },
    }),
    [router],
  );

  return (
    <div>
      <DataTable
        columns={columns}
        options={useMemo(() => ({
          ...options,
          rowClick: events.rowClick
        }), [options, events.rowClick])}
        minHeight={400}
      />
    </div>
  );
}
