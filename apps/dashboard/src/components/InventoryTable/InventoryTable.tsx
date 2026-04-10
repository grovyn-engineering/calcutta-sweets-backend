"use client";

import { App, Button, Input } from "antd";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  BarcodePrintModal,
  type BarcodePrintItem,
} from "@/components/BarcodePrintModal/BarcodePrintModal";
import { Printer } from "lucide-react";

import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { openPrintableBarcodes } from "@/lib/printBarcodes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useShop } from "@/contexts/ShopContext";
import styles from "./InventoryTable.module.css";

type TabulatorPageable = {
  setPage: (page: number) => void;
  setHeight: (height: number) => void;
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25];

const EDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
const PRINT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`;

const columns = (
  routerRef: React.RefObject<ReturnType<typeof useRouter> | null>,
  onPrint: (item: BarcodePrintItem) => void
): ColumnDefinition[] => [
    // ── Checkbox column ──────────────────────────────────────────────────────
    {
      title: '',
      formatter: "rowSelection",
      titleFormatter: "rowSelection",
      hozAlign: "center",
      headerHozAlign: "center",
      width: 44,
      headerSort: false,
      resizable: false,
      minWidth: 60,
      cellClick: (_e: unknown, cell: any) => {
        cell.getRow().toggleSelect();
      },
    },
    // ── Data columns ─────────────────────────────────────────────────────────
    { title: "Product", field: "productName", minWidth: 176, widthGrow: 3 },
    { title: "Variant", field: "variantName", width: 112, minWidth: 104 },
    {
      title: "Category",
      field: "category",
      width: 128,
      minWidth: 112,
      formatter: (cell) => {
        const raw = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-category-pill";
        span.textContent = raw || "—";
        return span;
      },
    },
    {
      title: "SKU",
      field: "sku",
      width: 96,
      minWidth: 88,
      formatter: (cell) => {
        const raw = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-sku-cell";
        span.textContent = raw || "—";
        if (!raw) span.classList.add("inventory-sku-empty");
        return span;
      },
    },
    {
      title: "Barcode",
      field: "barcode",
      minWidth: 200,
      widthGrow: 2,
      formatter: (cell) => {
        const v = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-barcode";
        span.textContent = v || "—";
        if (v) span.title = v;
        if (!v) span.classList.add("inventory-barcode-empty");
        return span;
      },
    },
    {
      title: "Qty",
      field: "quantity",
      width: 76,
      minWidth: 72,
      hozAlign: "right",
      sorter: "number",
      formatter: (cell) => {
        const row = cell.getRow().getData() as {
          quantity?: number;
          minStock?: number | null;
        };
        const q = Number(row.quantity) || 0;
        const min = row.minStock;
        const wrap = document.createElement("span");
        wrap.className = "inventory-qty";
        wrap.textContent = String(q);
        if (min != null && min > 0 && q <= min) {
          wrap.classList.add("inventory-qty-low");
          wrap.title = `At or below minimum (${min})`;
        }
        return wrap;
      },
    },
    {
      title: "Min stock",
      field: "minStock",
      width: 96,
      minWidth: 88,
      hozAlign: "right",
      sorter: "number",
      formatter: (cell) => {
        const v = cell.getValue() as number | null;
        const span = document.createElement("span");
        span.className = "inventory-min-stock";
        if (v === null || v === undefined) {
          span.textContent = "—";
          span.classList.add("inventory-min-stock-empty");
        } else {
          span.textContent = String(v);
        }
        return span;
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
      title: "",
      field: "_edit",
      headerTooltip: "Actions",
      width: 68,
      minWidth: 64,
      hozAlign: "center",
      headerSort: false,
      resizable: false,
      cssClass: "inventory-col-actions",
      formatter: (cell) => {
        const row = cell.getRow().getData() as {
          id: string;
          productName: string;
          variantName?: string;
          barcode: string;
          price: number;
        };

        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.gap = "4px";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "inventory-edit-link";
        editBtn.type = "button";
        editBtn.innerHTML = EDIT_ICON_SVG;
        const label = [row.productName, row.variantName]
          .filter(Boolean)
          .join(" · ");
        editBtn.setAttribute(
          "aria-label",
          label ? `Edit ${label}` : "Edit variant"
        );
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          routerRef.current?.push(`/inventory/${row.id}`, {
            scroll: false,
          } as any);
        });
        container.appendChild(editBtn);

        // Print button (only when row has a barcode)
        if (row.barcode) {
          const printBtn = document.createElement("button");
          printBtn.className = "inventory-edit-link";
          printBtn.type = "button";
          printBtn.innerHTML = PRINT_ICON_SVG;
          printBtn.setAttribute("aria-label", `Print barcode for ${label}`);
          printBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onPrint({
              id: row.id,
              productName: row.productName,
              variantName: row.variantName,
              barcode: row.barcode,
              price: row.price,
            });
          });
          container.appendChild(printBtn);
        }

        return container;
      },
    },
  ];

export default function InventoryTable() {
  const { message } = App.useApp();
  const router = useRouter();
  const routerRef = useRef<ReturnType<typeof useRouter> | null>(null);
  routerRef.current = router;
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const tableRef = useRef<TabulatorPageable | null>(null);
  const tableSlotRef = useRef<HTMLDivElement | null>(null);
  const [tableHeightPx, setTableHeightPx] = useState<number | null>(null);
  const tableHeightPxRef = useRef<number | null>(null);
  tableHeightPxRef.current = tableHeightPx;
  const prevFilterKeyRef = useRef<string | null>(null);

  const [printItems, setPrintItems] = useState<BarcodePrintItem[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  // Single ref for the raw Tabulator instance
  const tabulatorRef = useRef<any>(null);

  const syncTabulatorHeight = useCallback(() => {
    const apply = () => {
      const t = tableRef.current;
      const height = tableHeightPxRef.current;
      if (!t || height == null || height < 120) return;
      try {
        t.setHeight(height);
      } catch {
        // ignore
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }, []);

  const shopKey = effectiveShopCode || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}`;

  // Reset to page 1 when search or shop changes
  useEffect(() => {
    const prev = prevFilterKeyRef.current;
    prevFilterKeyRef.current = filterKey;

    const t = tableRef.current;
    if (!t || !shopKey) return;
    if (prev === null || prev === filterKey) return;
    t.setPage(1);
  }, [filterKey, shopKey]);

  useLayoutEffect(() => {
    const el = tableSlotRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const h = Math.floor(entries[0]?.contentRect.height ?? 0);
      if (h > 0) setTableHeightPx(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    syncTabulatorHeight();
  }, [tableHeightPx, syncTabulatorHeight]);

  const handlePrintSingle = useCallback((item: BarcodePrintItem) => {
    setPrintItems([item]);
    setPrintModalOpen(true);
  }, []);

  const handlePrintBulk = useCallback(() => {
    const t = tabulatorRef.current;
    if (!t) return;

    const selectedRows: any[] =
      typeof t.getSelectedData === "function" ? t.getSelectedData() : [];

    if (selectedRows.length === 0) return;

    const items = selectedRows
      .filter((r) => !!r.barcode)
      .map((r) => ({
        id: r.id,
        productName: r.productName,
        variantName: r.variantName,
        barcode: r.barcode,
        price: r.price,
      }));

    if (items.length === 0) {
      message.warning("None of the selected rows have barcodes.");
      return;
    }

    setPrintItems(items);
    setPrintModalOpen(true);
  }, [message]);

  const handlePrintAllFiltered = useCallback(async () => {
    if (!shopKey) return;
    setIsPrintingAll(true);
    try {
      const baseUrl = getApiBaseUrl();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const u = new URL(`${baseUrl}/inventory/variants`, origin);
      u.searchParams.set("shopCode", shopKey);
      u.searchParams.set("page", "1");
      u.searchParams.set("size", "500");
      if (debouncedSearch.trim()) {
        u.searchParams.set("q", debouncedSearch.trim());
      }

      const res = await fetch(u.toString(), {
        headers: { ...getAuthHeaders(), Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch products for printing");
      const { data } = (await res.json()) as { data: any[] };

      if (data.length === 0) {
        message.warning("No products found to print.");
        return;
      }

      const items = data
        .filter((r) => !!r.barcode)
        .map((r) => ({
          id: r.id,
          productName: r.productName,
          variantName: r.variantName,
          barcode: r.barcode,
          price: r.price,
        }));

      if (items.length === 0) {
        message.warning("None of the filtered products have barcodes.");
        return;
      }

      const ok = openPrintableBarcodes(items);
      if (!ok) {
        message.error(
          "The print window was blocked. Allow pop-ups to print."
        );
      }
    } catch (e) {
      message.error(String(e));
    } finally {
      setIsPrintingAll(false);
    }
  }, [shopKey, debouncedSearch, message]);

  const options: any = useMemo(() => {
    const baseUrl = getApiBaseUrl();

    return {
      layout: "fitColumns",
      height: 360,
      placeholder:
        "No rows match your search or this shop has no inventory yet.",

      selectable: true,

      rowDblClick: (e: MouseEvent, row: any) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const id = row.getData().id as string | undefined;
        if (id) routerRef.current?.push(`/inventory/${id}`);
      },

      pagination: true,
      paginationMode: "remote",
      paginationSize: PAGE_SIZE,
      paginationSizeSelector: PAGE_SIZE_OPTIONS,

      ajaxURL: `${baseUrl}/inventory/variants`,
      ajaxRequestFunc: (url: string, _config: unknown, params: unknown) => {
        const u = new URL(
          url,
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost"
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
          headers: { ...getAuthHeaders(), Accept: "application/json" },
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
        <label className={styles.searchLabel} htmlFor="inventory-search">
          Find in list
        </label>
        <Input
          id="inventory-search"
          className={styles.searchInput}
          allowClear
          placeholder="Product, variant, barcode, or SKU…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={
            <Search
              className="h-4 w-4 text-[var(--bistre-400)]"
              aria-hidden
            />
          }
          aria-label="Search inventory"
        />

        {selectedCount > 0 && (
          <Button
            type="primary"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrintBulk}
            style={{
              height: "48px",
              borderRadius: "12px",
              padding: "0 20px",
              backgroundColor: "var(--ochre-600)",
              borderColor: "var(--ochre-600)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Print {selectedCount} barcodes
          </Button>
        )}

        <Button
          type="default"
          icon={<Printer className="h-4 w-4" />}
          onClick={handlePrintAllFiltered}
          loading={isPrintingAll}
          style={{
            height: "48px",
            borderRadius: "12px",
            padding: "0 20px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Print all results
        </Button>
      </div>

      <div className={styles.tableSlot} ref={tableSlotRef}>
        <DataTable
          key={shopKey}
          columns={columns(routerRef, handlePrintSingle)}
          options={{
            ...options,
            rowSelectionChanged: (_data: unknown[], rows: unknown[]) => {
              setSelectedCount(rows.length);
            },
          }}
          onRef={(instanceRef: { current?: any }) => {
            const instance = instanceRef.current ?? null;
            tableRef.current = instance;
            tabulatorRef.current = instance;
            syncTabulatorHeight();
          }}
        />
      </div>

      <BarcodePrintModal
        open={printModalOpen}
        onCancel={() => setPrintModalOpen(false)}
        items={printItems}
      />
    </div>
  );
}