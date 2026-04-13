"use client";

import { App, Select } from "antd";
import { Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { DataTable } from "@/components/DataTable/DataTable";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import pageStyles from "./StockTransfersPage.module.css";

type TransferItem = {
  id: string;
  barcode: string;
  productName: string;
  variantName: string;
  quantity: number;
};

type TransferRequest = {
  id: string;
  fromShopCode: string;
  toShopCode: string;
  fromShop: { name: string; shopCode: string };
  toShop: { name: string; shopCode: string };
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  note: string | null;
  createdById: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferItem[];
};

type TransferTableRow = TransferRequest & {
  fromShopName: string;
  toShopName: string;
  itemsCount: number;
};

const statusMeta = {
  PENDING: {
    label: "Pending",
    pillClass: "st-status-pending",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  },
  APPROVED: {
    label: "Approved",
    pillClass: "st-status-approved",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  REJECTED: {
    label: "Rejected",
    pillClass: "st-status-rejected",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  },
  FULFILLED: {
    label: "Fulfilled",
    pillClass: "st-status-fulfilled",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  },
} as const;

const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

function buildItemsTitle(items: TransferItem[]): string {
  return items
    .map((i) => `${i.productName} (${i.variantName}) × ${i.quantity}`)
    .join("\n");
}

function makeColumns(
  actionBusy: string | null,
  onAction: (id: string, action: "approve" | "reject" | "fulfill") => void
): ColumnDefinition[] {
  return [
    {
      title: "Date",
      field: "createdAt",
      minWidth: 112,
      widthGrow: 0,
      sorter: (a, b) =>
        new Date(String(a)).getTime() - new Date(String(b)).getTime(),
      formatter: (cell) => {
        const v = String(cell.getValue() ?? "");
        const span = document.createElement("span");
        span.textContent = new Date(v).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return span;
      },
    },
    {
      title: "From",
      field: "fromShopName",
      minWidth: 140,
      widthGrow: 1,
      sorter: "string",
      formatter: (cell) => {
        const span = document.createElement("span");
        span.className = "st-from-name";
        span.textContent = String(cell.getValue() ?? "");
        return span;
      },
    },
    {
      title: "To",
      field: "toShopName",
      minWidth: 140,
      widthGrow: 1,
      sorter: "string",
      formatter: (cell) => {
        const span = document.createElement("span");
        span.className = "st-to-name";
        span.textContent = String(cell.getValue() ?? "");
        return span;
      },
    },
    {
      title: "Items",
      field: "itemsCount",
      hozAlign: "right",
      headerHozAlign: "right",
      minWidth: 88,
      widthGrow: 0,
      sorter: "number",
      formatter: (cell) => {
        const row = cell.getRow().getData() as TransferTableRow;
        const n = Number(cell.getValue()) || 0;
        const span = document.createElement("span");
        span.className = "st-items-count";
        span.textContent = `${n} item${n === 1 ? "" : "s"}`;
        span.title = buildItemsTitle(row.items ?? []);
        return span;
      },
    },
    {
      title: "Status",
      field: "status",
      hozAlign: "center",
      headerHozAlign: "center",
      minWidth: 128,
      widthGrow: 0,
      sorter: "string",
      formatter: (cell) => {
        const status = cell.getValue() as TransferRequest["status"];
        const meta = statusMeta[status];
        const wrap = document.createElement("span");
        wrap.className = `st-status-pill ${meta.pillClass}`;
        wrap.innerHTML = `${meta.icon}<span>${meta.label}</span>`;
        return wrap;
      },
    },
    {
      title: "Note",
      field: "note",
      minWidth: 100,
      widthGrow: 1,
      sorter: "string",
      formatter: (cell) => {
        const raw = cell.getValue() as string | null;
        const span = document.createElement("span");
        const t = String(raw ?? "").trim();
        if (!t) {
          span.className = "st-note st-note-empty";
          span.textContent = "—";
        } else {
          span.className = "st-note";
          span.textContent = t;
          span.title = t;
        }
        return span;
      },
    },
    {
      title: "Actions",
      field: "id",
      minWidth: 200,
      widthGrow: 0,
      headerSort: false,
      hozAlign: "left",
      formatter: (cell) => {
        const row = cell.getRow().getData() as TransferTableRow;
        const busy = actionBusy === row.id;
        const wrap = document.createElement("div");
        wrap.className = "st-btn-row";

        if (row.status === "PENDING") {
          const approve = document.createElement("button");
          approve.type = "button";
          approve.className = "st-btn st-btn-primary";
          approve.textContent = busy ? "…" : "Approve";
          approve.disabled = busy;
          approve.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!busy) onAction(row.id, "approve");
          });

          const reject = document.createElement("button");
          reject.type = "button";
          reject.className = "st-btn st-btn-danger";
          reject.textContent = busy ? "…" : "Reject";
          reject.disabled = busy;
          reject.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!busy) onAction(row.id, "reject");
          });

          wrap.appendChild(approve);
          wrap.appendChild(reject);
          return wrap;
        }

        if (row.status === "APPROVED") {
          const fulfill = document.createElement("button");
          fulfill.type = "button";
          fulfill.className = "st-btn st-btn-primary";
          fulfill.innerHTML = `${TRUCK_SVG}<span>${busy ? "…" : "Fulfill & Ship"}</span>`;
          fulfill.disabled = busy;
          fulfill.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!busy) onAction(row.id, "fulfill");
          });
          wrap.appendChild(fulfill);
          return wrap;
        }

        const muted = document.createElement("span");
        muted.className = "st-actions-muted";
        muted.textContent = "—";
        wrap.appendChild(muted);
        return wrap;
      },
    },
  ];
}

export default function StockTransfersPage() {
  const { message } = App.useApp();
  const { effectiveShopCode, shops } = useShop();

  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const currentShop = shops.find((s) => s.shopCode === effectiveShopCode);

  const fetchRequests = useCallback(async () => {
    if (!effectiveShopCode) return;
    setLoading(true);
    try {
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await apiFetch(`/stock-transfers${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      message.error("Failed to load transfer requests");
      setRequests([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [effectiveShopCode, statusFilter, message]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = useCallback(
    async (id: string, action: "approve" | "reject" | "fulfill") => {
      setActionBusy(id);
      try {
        const res = await apiFetch(`/stock-transfers/${id}/${action}`, {
          method: "PATCH",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body?.message === "string"
              ? body.message
              : `Failed to ${action}`
          );
        }
        message.success(
          action === "approve"
            ? "Request approved!"
            : action === "reject"
              ? "Request rejected."
              : "Transfer fulfilled! Stock has been updated."
        );
        fetchRequests();
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : `Failed to ${action}`
        );
      } finally {
        setActionBusy(null);
      }
    },
    [fetchRequests, message]
  );

  const tableData: TransferTableRow[] = useMemo(
    () =>
      requests.map((r) => ({
        ...r,
        fromShopName: r.fromShop.name,
        toShopName: r.toShop.name,
        itemsCount: r.items.length,
      })),
    [requests]
  );

  const columns = useMemo(
    () => makeColumns(actionBusy, handleAction),
    [actionBusy, handleAction]
  );

  const tabulatorOptions: ReactTabulatorOptions = useMemo(
    () => ({
      layout: "fitColumns",
      height: 480,
      placeholder: "No transfer requests in this view.",
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 15, 25],
      dataLoader: false,
    }),
    []
  );

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.surface}>
        <header className={pageStyles.surfaceHeader}>
          <div className={pageStyles.surfaceHeaderLead}>
            <p className={pageStyles.kicker}>Stock transfers</p>
            <h1 className={pageStyles.title}>Stock Transfers</h1>
            <p className={pageStyles.subtitle}>
              {currentShop
                ? `Viewing transfers for ${currentShop.name}.`
                : "Manage stock transfer requests between shops and factory."}
            </p>
          </div>
          <div className={pageStyles.surfaceHeaderFilter}>
            <div className={pageStyles.filterGroup}>
              <span className={pageStyles.filterLabel}>Status</span>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className={pageStyles.statusSelect}
                popupMatchSelectWidth={false}
                options={[
                  { value: "all", label: "All statuses" },
                  ...(
                    Object.keys(statusMeta) as (keyof typeof statusMeta)[]
                  ).map((value) => ({
                    value,
                    label: statusMeta[value].label,
                  })),
                ]}
              />
            </div>
          </div>
        </header>

        {requests.length === 0 && !loading ? (
          <EmptyState
            message="No transfer requests found"
            description="Stock transfer requests between shops and factory will appear here once created."
            icon={<Truck size={48} />}
          />
        ) : (
          <div className={pageStyles.tableSlot}>
            <DataTable
              columns={columns}
              data={loading ? [] : tableData}
              loading={loading}
              options={tabulatorOptions}
              minHeight={0}
              emptyTitle="No transfer requests"
              emptyDescription="Try changing the status filter or check back later."
              emptyIcon={<Truck size={28} strokeWidth={1.35} aria-hidden />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
