"use client";

import { App, Button, Input, Modal } from "antd";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { DataTable } from "@/components/DataTable/DataTable";
import {
  BarcodePrintModal,
  type BarcodePrintItem,
} from "@/components/BarcodePrintModal/BarcodePrintModal";
import { RefillRequestModal } from "@/components/RefillRequestModal/RefillRequestModal";
import {
  apiFetch,
  apiFetchLong,
  getApiBaseUrl,
  getAuthHeaders,
  getEffectiveShopCodeForHeader,
} from "@/lib/api";
import { openPrintableBarcodes } from "@/lib/printBarcodes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRemoteTabulatorLoading } from "@/hooks/useRemoteTabulatorLoading";
import { useShop } from "@/contexts/ShopContext";
import { createTabulatorVariantThumb } from "@/lib/tabulatorVariantThumb";
import {
  Copy,
  Printer,
  PackagePlus,
  PackageSearch,
  Trash2,
} from "lucide-react";
import styles from "./InventoryTable.module.css";

type TabulatorPageable = {
  setPage: (page: number) => void;
  setHeight: (height: number) => void;
  replaceData?: () => Promise<void>;
  redraw?: (force?: boolean) => void;
  getPage?: () => number;
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
  onPrint: (item: BarcodePrintItem) => void,
  selectionRef: React.MutableRefObject<Set<string>>,
  bumpSelection: () => void,
): ColumnDefinition[] => [
    {
      title: "",
      field: "_select",
      width: 44,
      minWidth: 40,
      maxWidth: 52,
      hozAlign: "center",
      headerHozAlign: "center",
      headerSort: false,
      resizable: false,
      responsive: 0,
      cssClass: "inventory-col-select",
      titleFormatter: (col) => {
        const wrap = document.createElement("div");
        wrap.className = styles.selectCell;
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.title = "Select all on this page";
        chk.setAttribute("aria-label", "Select all on this page");
        chk.addEventListener("click", (e) => e.stopPropagation());
        chk.addEventListener("change", () => {
          const table = (col as { getTable: () => any }).getTable();
          if (!table) return;
          const rows = table.getRows();
          if (chk.checked) {
            rows.forEach((r: { getData: () => { id?: string } }) => {
              const id = r.getData()?.id;
              if (id) selectionRef.current.add(id);
            });
          } else {
            rows.forEach((r: { getData: () => { id?: string } }) => {
              const id = r.getData()?.id;
              if (id) selectionRef.current.delete(id);
            });
          }
          table.redraw(true);
          bumpSelection();
        });
        wrap.appendChild(chk);
        return wrap;
      },
      formatter: (cell) => {
        const row = cell.getRow();
        const data = row.getData() as { id?: string };
        const id = data.id;
        const wrap = document.createElement("div");
        wrap.className = styles.selectCell;
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.title = "Select row";
        chk.setAttribute("aria-label", "Select row");
        if (id) {
          chk.checked = selectionRef.current.has(id);
          chk.addEventListener("click", (e) => e.stopPropagation());
          chk.addEventListener("change", () => {
            if (!id) return;
            if (chk.checked) selectionRef.current.add(id);
            else selectionRef.current.delete(id);
            bumpSelection();
          });
        } else {
          chk.disabled = true;
        }
        wrap.appendChild(chk);
        return wrap;
      },
    },
    {
      title: "Image",
      field: "imageUrl",
      width: 56,
      minWidth: 52,
      hozAlign: "center",
      headerHozAlign: "center",
      responsive: 0,
      headerSort: false,
      resizable: false,
      cssClass: "inventory-thumb-cell",
      formatter: (cell) => {
        const row = cell.getRow().getData() as {
          imageUrl?: string | null;
          productName?: string;
          variantName?: string;
        };
        const label =
          [row.productName, row.variantName].filter(Boolean).join(" · ") ||
          "Product";
        return createTabulatorVariantThumb(row.imageUrl, label);
      },
    },
    {
      title: "Product",
      field: "productName",
      minWidth: 200,
      widthGrow: 1,
      responsive: 0,
      sorter: "string",
      headerTooltip: "Product",
    },
    {
      title: "Variant",
      field: "variantName",
      width: 132,
      minWidth: 124,
      widthGrow: 1,
      responsive: 2,
      headerTooltip: "Variant",
    },
    {
      title: "Category",
      field: "category",
      width: 148,
      minWidth: 132,
      widthGrow: 1,
      responsive: 4,
      headerTooltip: "Category",
      formatter: (cell) => {
        const raw = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-category-pill";
        span.textContent = raw || "-";
        return span;
      },
    },
    {
      title: "SKU",
      field: "sku",
      width: 104,
      minWidth: 92,
      widthGrow: 1,
      responsive: 3,
      headerTooltip: "SKU",
      formatter: (cell) => {
        const raw = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-sku-cell";
        span.textContent = raw || "-";
        if (!raw) span.classList.add("inventory-sku-empty");
        return span;
      },
    },
    {
      title: "Barcode",
      field: "barcode",
      minWidth: 180,
      widthGrow: 1,
      responsive: 5,
      headerTooltip: "Barcode",
      formatter: (cell) => {
        const v = String(cell.getValue() ?? "").trim();
        const span = document.createElement("span");
        span.className = "inventory-barcode";
        span.textContent = v || "-";
        if (v) span.title = v;
        if (!v) span.classList.add("inventory-barcode-empty");
        return span;
      },
    },
    {
      title: "Qty",
      field: "quantity",
      width: 92,
      minWidth: 96,
      responsive: 0,
      hozAlign: "right",
      headerTooltip: "Quantity",
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
      width: 100,
      minWidth: 92,
      responsive: 6,
      hozAlign: "right",
      headerTooltip: "Minimum stock",
      sorter: "number",
      formatter: (cell) => {
        const v = cell.getValue() as number | null;
        const span = document.createElement("span");
        span.className = "inventory-min-stock";
        if (v === null || v === undefined) {
          span.textContent = "-";
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
      width: 80,
      minWidth: 72,
      responsive: 7,
      headerTooltip: "Unit",
    },
    {
      title: "Price",
      field: "price",
      width: 108,
      minWidth: 108,
      responsive: 0,
      hozAlign: "right",
      headerTooltip: "Price",
      sorter: "number",
      formatter: (cell) => inr.format(Number(cell.getValue()) || 0),
    },
    {
      title: "",
      field: "_edit",
      headerTooltip: "Actions",
      width: 68,
      minWidth: 64,
      responsive: 0,
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

export default function InventoryTable({ shopCodeOverride }: { shopCodeOverride?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const routerRef = useRef<ReturnType<typeof useRouter> | null>(null);
  routerRef.current = router;
  const { effectiveShopCode, shops, shopsLoading } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const isFactory = useMemo(() => {
    if (shopsLoading && shops.length === 0) return false;
    const s = shops.find(x => x.shopCode === effectiveShopCode);
    return !!s?.isFactory;
  }, [shops, effectiveShopCode, shopsLoading]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const tableRef = useRef<TabulatorPageable | null>(null);
  const tableSlotRef = useRef<HTMLDivElement | null>(null);
  const [tableHeightPx, setTableHeightPx] = useState<number | null>(null);
  const prevFilterKeyRef = useRef<string | null>(null);

  const [printItems, setPrintItems] = useState<BarcodePrintItem[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [cloneCatalogBusy, setCloneCatalogBusy] = useState(false);
  const [purgeCatalogBusy, setPurgeCatalogBusy] = useState(false);
  const [deleteSelectedBusy, setDeleteSelectedBusy] = useState(false);

  const selectionRef = useRef<Set<string>>(new Set());
  const [, bumpSelection] = useReducer((n: number) => n + 1, 0);

  const shopKey = shopCodeOverride || effectiveShopCode || getEffectiveShopCodeForHeader() || defaultShop;
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

  useEffect(() => {
    selectionRef.current.clear();
    bumpSelection();
    queueMicrotask(() => {
      tableRef.current?.redraw?.(true);
    });
  }, [filterKey]);

  const handlePrintSingle = useCallback((item: BarcodePrintItem) => {
    setPrintItems([item]);
    setPrintModalOpen(true);
  }, []);

  const handleCloneCatalogFromFactory = useCallback(() => {
    if (!shopKey || isFactory) return;
    Modal.confirm({
      title: "Copy full catalog from Factory?",
      content:
        "This shop will get the same products, categories, prices, and barcodes (CS…) as the factory. You can run it again safely. Large catalogs may take several minutes-keep this tab open.",
      okText: "Start copy",
      width: 480,
      onOk: async () => {
        setCloneCatalogBusy(true);
        const BATCH = 6;
        let skip = 0;
        const acc = {
          productsCreated: 0,
          productsUpdated: 0,
          variantsCreated: 0,
          variantsUpdated: 0,
        };
        const MSG_KEY = "clone-catalog-progress";
        try {
          let finished = false;
          while (!finished) {
            message.loading({
              key: MSG_KEY,
              content: `Copying catalog… (${skip} products started)`,
              duration: 0,
            });
            const res = await apiFetchLong(
              "/inventory/clone-catalog-from-factory",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skip, take: BATCH }),
              },
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              message.destroy(MSG_KEY);
              message.error(
                typeof data?.message === "string"
                  ? data.message
                  : "Could not copy catalog.",
              );
              return;
            }
            acc.productsCreated += Number(data?.productsCreated ?? 0);
            acc.productsUpdated += Number(data?.productsUpdated ?? 0);
            acc.variantsCreated += Number(data?.variantsCreated ?? 0);
            acc.variantsUpdated += Number(data?.variantsUpdated ?? 0);
            const total = Number(data?.totalFactoryProducts ?? 0);
            const next = Number(data?.nextSkip ?? skip);
            message.loading({
              key: MSG_KEY,
              content: `Copying catalog… ${Math.min(next, total)} / ${total} factory products`,
              duration: 0,
            });
            if (data?.completed) {
              finished = true;
            } else {
              skip = next;
            }
          }
          message.destroy(MSG_KEY);
          message.success(
            `Catalog synced. New variants: ${acc.variantsCreated}. Updated: ${acc.variantsUpdated}. Reloading…`,
          );
          window.setTimeout(() => window.location.reload(), 800);
        } catch {
          message.destroy(MSG_KEY);
          message.error("Network error while copying catalog.");
        } finally {
          setCloneCatalogBusy(false);
        }
      },
    });
  }, [shopKey, isFactory, message]);

  const handlePurgeShopCatalog = useCallback(() => {
    if (!shopKey || isFactory) return;
    Modal.confirm({
      title: "Delete all products for this shop?",
      content:
        "This permanently removes every product, variant, and stock record for the shop you have selected in the header, and deletes all POS orders for that location. Shared categories used by other shops stay; categories that become empty are removed. This cannot be undone.",
      okText: "Delete everything",
      okType: "danger",
      cancelText: "Cancel",
      width: 520,
      onOk: async () => {
        setPurgeCatalogBusy(true);
        try {
          const res = await apiFetch("/inventory/purge-shop-catalog", {
            method: "POST",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            message.error(
              typeof data?.message === "string"
                ? data.message
                : "Could not delete catalog.",
            );
            return;
          }
          message.success("Shop catalog cleared. Reloading…");
          window.setTimeout(() => window.location.reload(), 600);
        } catch {
          message.error("Network error while deleting catalog.");
        } finally {
          setPurgeCatalogBusy(false);
        }
      },
    });
  }, [shopKey, isFactory, message]);

  const handlePrintAllFiltered = useCallback(async () => {
    if (!shopKey) return;
    setIsPrintingAll(true);
    try {
      const baseUrl = getApiBaseUrl();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost";
      const pageSize = 100;
      const maxPages = 500;
      const allRows: {
        id: string;
        productName?: string;
        variantName?: string;
        barcode?: string;
        price?: number;
      }[] = [];

      for (let page = 1; page <= maxPages; page += 1) {
        const u = new URL(`${baseUrl}/inventory/variants`, origin);
        u.searchParams.set("page", String(page));
        u.searchParams.set("size", String(pageSize));

        const res = await fetch(u.toString(), {
          headers: { ...getAuthHeaders(), Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch products for printing");
        const json = (await res.json()) as {
          data?: typeof allRows;
          last_page?: number;
        };
        const chunk = Array.isArray(json.data) ? json.data : [];
        if (chunk.length === 0 && page === 1) {
          message.warning("No products found to print.");
          return;
        }
        allRows.push(...chunk);

        const lastPage = Math.max(1, json.last_page ?? page);
        if (page >= lastPage) break;
      }

      if (allRows.length === 0) {
        message.warning("No products found to print.");
        return;
      }

      const items = allRows
        .filter((r) => !!r.barcode)
        .map((r) => ({
          productName: r.productName ?? "",
          variantName: r.variantName,
          barcode: r.barcode as string,
          price: Number(r.price) || 0,
        }));

      if (items.length === 0) {
        message.warning("No variants in this shop have barcodes to print.");
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
  }, [shopKey, message]);

  const handleDeleteSelected = useCallback(() => {
    if (!shopKey || isFactory) return;
    const ids = [...selectionRef.current];
    if (ids.length === 0) {
      message.warning("Select at least one row using the checkboxes.");
      return;
    }
    Modal.confirm({
      title: `Delete ${ids.length} selected variant(s)?`,
      content:
        "POS order lines for these variants are removed. Products with no variants left are deleted; empty categories may be removed. This cannot be undone.",
      okText: "Delete selected",
      okType: "danger",
      cancelText: "Cancel",
      width: 480,
      onOk: async () => {
        setDeleteSelectedBusy(true);
        try {
          const res = await apiFetch("/inventory/variants/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantIds: ids }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            message.error(
              typeof data?.message === "string"
                ? data.message
                : Array.isArray(data?.message)
                  ? data.message.join(", ")
                  : "Could not delete selected variants.",
            );
            return;
          }
          selectionRef.current.clear();
          bumpSelection();
          const vr = data?.variantsRemoved ?? ids.length;
          const pr = data?.productsRemoved;
          message.success(
            `Removed ${vr} variant(s)${pr ? ` and ${pr} empty product(s)` : ""}.`,
          );
          const t = tableRef.current as TabulatorPageable | null;
          const p =
            typeof t?.getPage === "function" ? t.getPage() : 1;
          if (typeof t?.setPage === "function") {
            t.setPage(p);
          }
        } catch {
          message.error("Network error while deleting variants.");
        } finally {
          setDeleteSelectedBusy(false);
        }
      },
    });
  }, [shopKey, isFactory, message]);

  const memoizedColumns = useMemo(
    () => columns(routerRef, handlePrintSingle, selectionRef, bumpSelection),
    [handlePrintSingle],
  );

  const options: ReactTabulatorOptions = useMemo(() => {
    const baseUrl = getApiBaseUrl();

    return {
      layout: "fitColumns",
      height: 500,
      responsiveLayout: "collapse",
      responsiveLayoutCollapseStartOpen: false,
      placeholder:
        "No rows match your search or this shop has no inventory yet.",

      rowDblClick: (e: any, row: any) => {
        if ((e.target as HTMLElement).closest("button, input")) return;
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

      ajaxParams: { shopCode: shopKey },
      dataLoader: false,
    };
  }, [shopKey]);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.searchField}>
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
        </div>
        <div className={styles.toolbarActions}>
          {!shopsLoading && !isFactory && (
            <Button
              type="default"
              className={styles.toolbarBtn}
              icon={<PackagePlus className="h-4 w-4" />}
              onClick={() => setRefillModalOpen(true)}
            >
              Request Refill
            </Button>
          )}

          {!shopsLoading && !isFactory && (
            <Button
              type="default"
              className={styles.toolbarBtn}
              icon={<Copy className="h-4 w-4" aria-hidden />}
              loading={cloneCatalogBusy}
              onClick={() => handleCloneCatalogFromFactory()}
            >
              Copy catalog from Factory
            </Button>
          )}

          {!shopsLoading && !isFactory && (
            <Button
              danger
              type="default"
              className={styles.toolbarBtn}
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              loading={purgeCatalogBusy}
              onClick={() => handlePurgeShopCatalog()}
            >
              Delete all products
            </Button>
          )}

          {!shopsLoading && !isFactory && (
            <Button
              danger
              type="default"
              className={styles.toolbarBtn}
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              loading={deleteSelectedBusy}
              disabled={selectionRef.current.size === 0}
              onClick={() => void handleDeleteSelected()}
            >
              Delete selected
              {selectionRef.current.size > 0
                ? ` (${selectionRef.current.size})`
                : ""}
            </Button>
          )}

          <Button
            type="default"
            className={styles.toolbarBtn}
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrintAllFiltered}
            loading={isPrintingAll}
          >
            Print all shop barcodes
          </Button>
        </div>
      </div>

      <div className={styles.tableSlot} ref={tableSlotRef}>
        <DataTable
          columns={memoizedColumns}
          options={options}
          onRef={(instanceRef: { current?: any }) => {
            tableRef.current = instanceRef.current ?? null;
          }}
          loading={tableLoading}
          onRemoteBusyChange={onRemoteBusyChange}
          emptyTitle="No stock found"
          emptyDescription="Inventory from the Factory will appear here once products are added or transferred."
          emptyIcon={<PackageSearch size={28} strokeWidth={1.35} aria-hidden />}
        />
      </div>

      <RefillRequestModal
        open={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
      />
    </div>
  );
}
