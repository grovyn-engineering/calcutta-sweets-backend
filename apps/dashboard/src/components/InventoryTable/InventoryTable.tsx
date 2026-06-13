"use client";

import { App, Button, Input, Modal } from "antd";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import {
  BarcodePrintModal,
  type BarcodePrintItem,
} from "@/components/BarcodePrintModal/BarcodePrintModal";
import { RefillRequestModal } from "@/components/RefillRequestModal/RefillRequestModal";
import { VariantThumb } from "@/components/VariantThumb/VariantThumb";
import {
  apiFetch,
  apiFetchLong,
  getApiBaseUrl,
  getAuthHeaders,
  getEffectiveShopCodeForHeader,
} from "@/lib/api";
import { openPrintableBarcodes } from "@/lib/printBarcodes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useShop } from "@/contexts/ShopContext";
import {
  Copy,
  Pencil,
  Printer,
  PackagePlus,
  PackageSearch,
  Trash2,
} from "lucide-react";
import styles from "./InventoryTable.module.css";

type InventoryRow = {
  id: string;
  productName: string;
  variantName?: string;
  category?: string;
  sku?: string;
  barcode: string;
  quantity: number;
  minStock?: number | null;
  unit?: string;
  price: number;
  imageUrl?: string | null;
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 40;
const PAGE_SIZE_OPTIONS = [10, 25, 40, 50];

export default function InventoryTable({ shopCodeOverride }: { shopCodeOverride?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const { effectiveShopCode, shops, shopsLoading } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  const isFactory = useMemo(() => {
    if (shopsLoading && shops.length === 0) return false;
    const s = shops.find((x) => x.shopCode === effectiveShopCode);
    return !!s?.isFactory;
  }, [shops, effectiveShopCode, shopsLoading]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const searchRef = useRef(debouncedSearch);
  searchRef.current = debouncedSearch;

  const [printItems, setPrintItems] = useState<BarcodePrintItem[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [cloneCatalogBusy, setCloneCatalogBusy] = useState(false);
  const [purgeCatalogBusy, setPurgeCatalogBusy] = useState(false);
  const [deleteSelectedBusy, setDeleteSelectedBusy] = useState(false);

  const selectionRef = useRef<Set<string>>(new Set());
  const [, bumpSelection] = useReducer((n: number) => n + 1, 0);
  const pageRowsRef = useRef<InventoryRow[]>([]);

  const shopKey = shopCodeOverride || effectiveShopCode || getEffectiveShopCodeForHeader() || defaultShop;
  const filterKey = `${shopKey}|${debouncedSearch}`;

  const handlePrintSingle = useCallback((item: BarcodePrintItem) => {
    setPrintItems([item]);
    setPrintModalOpen(true);
  }, []);

  const columns: AppTableColumn[] = useMemo(
    () => [
      {
        key: "_select",
        label: (
          <input
            type="checkbox"
            title="Select all on page"
            aria-label="Select all on page"
            className={styles.selectCheckbox}
            onChange={(e) => {
              const rows = pageRowsRef.current;
              rows.forEach((r) => {
                if (e.target.checked) selectionRef.current.add(r.id);
                else selectionRef.current.delete(r.id);
              });
              bumpSelection();
            }}
          />
        ),
        width: 48,
        align: "center",
        render: (_, row) => {
          const r = row as InventoryRow;
          return (
            <input
              type="checkbox"
              title="Select row"
              aria-label="Select row"
              className={styles.selectCheckbox}
              checked={selectionRef.current.has(r.id)}
              onChange={(e) => {
                if (e.target.checked) selectionRef.current.add(r.id);
                else selectionRef.current.delete(r.id);
                bumpSelection();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
      },
      {
        key: "imageUrl",
        label: "Image",
        field: "imageUrl",
        width: 60,
        align: "center",
        render: (val, row) => {
          const r = row as InventoryRow;
          const label = [r.productName, r.variantName].filter(Boolean).join(" · ") || "Product";
          return <VariantThumb imageUrl={val as string | null} label={label} />;
        },
      },
      {
        key: "productName",
        label: "Product",
        field: "productName",
        minWidth: 180,
      },
      {
        key: "variantName",
        label: "Variant",
        field: "variantName",
        minWidth: 110,
      },
      {
        key: "category",
        label: "Category",
        field: "category",
        minWidth: 120,
        render: (val) => (
          <span className="inventory-category-pill">
            {String(val ?? "").trim() || "-"}
          </span>
        ),
      },
      {
        key: "sku",
        label: "SKU",
        field: "sku",
        minWidth: 92,
        render: (val) => {
          const raw = String(val ?? "").trim();
          return (
            <span className={`inventory-sku-cell${raw ? "" : " inventory-sku-empty"}`}>
              {raw || "-"}
            </span>
          );
        },
      },
      {
        key: "barcode",
        label: "Barcode",
        field: "barcode",
        minWidth: 160,
        render: (val) => {
          const v = String(val ?? "").trim();
          return (
            <span
              className={`inventory-barcode${v ? "" : " inventory-barcode-empty"}`}
              title={v || undefined}
            >
              {v || "-"}
            </span>
          );
        },
      },
      {
        key: "quantity",
        label: "Qty",
        field: "quantity",
        width: 90,
        align: "right",
        render: (_, row) => {
          const r = row as InventoryRow;
          const q = Number(r.quantity) || 0;
          const low = r.minStock != null && r.minStock > 0 && q <= r.minStock;
          return (
            <span
              className={`inventory-qty${low ? " inventory-qty-low" : ""}`}
              title={low ? `At or below minimum (${r.minStock})` : undefined}
            >
              {q}
            </span>
          );
        },
      },
      {
        key: "minStock",
        label: "Min stock",
        field: "minStock",
        width: 92,
        align: "right",
        render: (val) => {
          if (val == null) return <span className="inventory-min-stock inventory-min-stock-empty">-</span>;
          return <span className="inventory-min-stock">{String(val)}</span>;
        },
      },
      {
        key: "unit",
        label: "Unit",
        field: "unit",
        width: 72,
      },
      {
        key: "price",
        label: "Price",
        field: "price",
        width: 104,
        align: "right",
        render: (val) => inr.format(Number(val) || 0),
      },
      {
        key: "_edit",
        label: "",
        width: 72,
        align: "center",
        render: (_, row) => {
          const r = row as InventoryRow;
          const label = [r.productName, r.variantName].filter(Boolean).join(" · ");
          return (
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              <button
                type="button"
                className="inventory-edit-link"
                aria-label={label ? `Edit ${label}` : "Edit variant"}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/inventory/${r.id}`, { scroll: false } as Parameters<typeof router.push>[1]);
                }}
              >
                <Pencil size={16} strokeWidth={2} />
              </button>
              {r.barcode && (
                <button
                  type="button"
                  className="inventory-edit-link"
                  aria-label={`Print barcode for ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintSingle({
                      id: r.id,
                      productName: r.productName,
                      variantName: r.variantName,
                      barcode: r.barcode,
                      price: r.price,
                    });
                  }}
                >
                  <Printer size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [router, handlePrintSingle],
  );

  const fetchFn = useMemo(() => {
    const baseUrl = getApiBaseUrl();
    return ({ page, pageSize }: { page: number; pageSize: number }) => {
      const u = new URL(
        `${baseUrl}/inventory/variants`,
        typeof window !== "undefined" ? window.location.origin : "http://localhost",
      );
      u.searchParams.set("page", String(page));
      u.searchParams.set("size", String(pageSize));
      const q = searchRef.current.trim();
      if (q) u.searchParams.set("q", q);
      if (shopKey) u.searchParams.set("shopCode", shopKey);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopKey]);

  const handleCloneCatalogFromFactory = useCallback(() => {
    if (!shopKey || isFactory) return;
    Modal.confirm({
      title: "Copy full catalog from Factory?",
      content:
        "This shop will get the same products, categories, prices, and barcodes (CS…) as the factory. You can run it again safely. Large catalogs may take several minutes — keep this tab open.",
      okText: "Start copy",
      width: 480,
      onOk: async () => {
        setCloneCatalogBusy(true);
        const BATCH = 6;
        let skip = 0;
        const acc = { productsCreated: 0, productsUpdated: 0, variantsCreated: 0, variantsUpdated: 0 };
        const MSG_KEY = "clone-catalog-progress";
        try {
          let finished = false;
          while (!finished) {
            message.loading({ key: MSG_KEY, content: `Copying catalog… (${skip} products started)`, duration: 0 });
            const res = await apiFetchLong("/inventory/clone-catalog-from-factory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skip, take: BATCH }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              message.destroy(MSG_KEY);
              message.error(typeof data?.message === "string" ? data.message : "Could not copy catalog.");
              return;
            }
            acc.productsCreated += Number(data?.productsCreated ?? 0);
            acc.productsUpdated += Number(data?.productsUpdated ?? 0);
            acc.variantsCreated += Number(data?.variantsCreated ?? 0);
            acc.variantsUpdated += Number(data?.variantsUpdated ?? 0);
            const total = Number(data?.totalFactoryProducts ?? 0);
            const next = Number(data?.nextSkip ?? skip);
            message.loading({ key: MSG_KEY, content: `Copying catalog… ${Math.min(next, total)} / ${total} factory products`, duration: 0 });
            if (data?.completed) { finished = true; } else { skip = next; }
          }
          message.destroy(MSG_KEY);
          message.success(`Catalog synced. New variants: ${acc.variantsCreated}. Updated: ${acc.variantsUpdated}. Reloading…`);
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
          const res = await apiFetch("/inventory/purge-shop-catalog", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            message.error(typeof data?.message === "string" ? data.message : "Could not delete catalog.");
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
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const allRows: { id: string; productName?: string; variantName?: string; barcode?: string; price?: number }[] = [];
      const pageSize = 100;
      for (let page = 1; page <= 500; page++) {
        const u = new URL(`${baseUrl}/inventory/variants`, origin);
        u.searchParams.set("page", String(page));
        u.searchParams.set("size", String(pageSize));
        const res = await fetch(u.toString(), { headers: { ...getAuthHeaders(), Accept: "application/json" } });
        if (!res.ok) throw new Error("Failed to fetch products for printing");
        const json = await res.json() as { data?: typeof allRows; last_page?: number };
        const chunk = Array.isArray(json.data) ? json.data : [];
        if (chunk.length === 0 && page === 1) { message.warning("No products found to print."); return; }
        allRows.push(...chunk);
        if (page >= Math.max(1, json.last_page ?? page)) break;
      }
      const items = allRows.filter((r) => !!r.barcode).map((r) => ({
        productName: r.productName ?? "",
        variantName: r.variantName,
        barcode: r.barcode as string,
        price: Number(r.price) || 0,
      }));
      if (items.length === 0) { message.warning("No variants in this shop have barcodes to print."); return; }
      const ok = openPrintableBarcodes(items);
      if (!ok) message.error("The print window was blocked. Allow pop-ups to print.");
    } catch (e) {
      message.error(String(e));
    } finally {
      setIsPrintingAll(false);
    }
  }, [shopKey, message]);

  const handleDeleteSelected = useCallback(() => {
    if (!shopKey || isFactory) return;
    const ids = [...selectionRef.current];
    if (ids.length === 0) { message.warning("Select at least one row using the checkboxes."); return; }
    Modal.confirm({
      title: `Delete ${ids.length} selected variant(s)?`,
      content: "POS order lines for these variants are removed. Products with no variants left are deleted; empty categories may be removed. This cannot be undone.",
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
          message.success(`Removed ${vr} variant(s)${pr ? ` and ${pr} empty product(s)` : ""}.`);
        } catch {
          message.error("Network error while deleting variants.");
        } finally {
          setDeleteSelectedBusy(false);
        }
      },
    });
  }, [shopKey, isFactory, message]);

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
            prefix={<Search className="h-4 w-4 text-[var(--bistre-400)]" aria-hidden />}
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
              {selectionRef.current.size > 0 ? ` (${selectionRef.current.size})` : ""}
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

      <div className={styles.tableSlot}>
        <DataTable
          columns={columns}
          fetchFn={fetchFn}
          filterKey={filterKey}
          pageSize={PAGE_SIZE}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          maxBodyHeight={520}
          onRowClick={(row) => {
            const r = row as InventoryRow;
            if (r?.id) router.push(`/inventory/${r.id}`);
          }}
          onVisibleRowsChange={(rows) => {
            pageRowsRef.current = rows as InventoryRow[];
          }}
          emptyTitle="No stock found"
          emptyDescription="Inventory from the Factory will appear here once products are added or transferred."
          emptyIcon={<PackageSearch size={28} strokeWidth={1.35} aria-hidden />}
        />
      </div>

      <BarcodePrintModal
        open={printModalOpen}
        items={printItems}
        onCancel={() => setPrintModalOpen(false)}
      />
      <RefillRequestModal
        open={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
      />
    </div>
  );
}
