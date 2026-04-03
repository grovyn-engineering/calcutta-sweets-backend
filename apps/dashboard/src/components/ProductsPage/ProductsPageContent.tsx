"use client";

import { Button, Collapse, Input, Segmented } from "antd";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import type { ProductWithRelations } from "@/components/ProductCard/ProductCard";
import { ProductCatalogRow } from "./ProductCatalogRow";
import styles from "./ProductsPageContent.module.css";

type Props = {
  products: ProductWithRelations[];
};

type StatusFilter = "all" | "active" | "inactive";

function filterProducts(
  products: ProductWithRelations[],
  q: string,
  status: StatusFilter,
): ProductWithRelations[] {
  let out = products;
  if (status === "active") {
    out = out.filter((p) => p.isActive);
  } else if (status === "inactive") {
    out = out.filter((p) => !p.isActive);
  }
  const s = q.trim().toLowerCase();
  if (!s) return out;
  return out.filter((p) => {
    if (p.name.toLowerCase().includes(s)) return true;
    if (p.category?.name.toLowerCase().includes(s)) return true;
    return (
      p.variants?.some(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.barcode.toLowerCase().includes(s) ||
          (v.sku && v.sku.toLowerCase().includes(s)),
      ) ?? false
    );
  });
}

function groupByCategory(
  products: ProductWithRelations[],
): { key: string; label: string; items: ProductWithRelations[] }[] {
  const map = new Map<
    string,
    { label: string; items: ProductWithRelations[] }
  >();
  for (const p of products) {
    const key = p.category?.id ?? "__uncategorized";
    const label = p.category?.name ?? "Uncategorized";
    if (!map.has(key)) {
      map.set(key, { label, items: [] });
    }
    map.get(key)!.items.push(p);
  }
  const entries = [...map.entries()].map(([key, v]) => ({
    key,
    label: v.label,
    items: v.items.sort((a, b) => a.name.localeCompare(b.name)),
  }));
  entries.sort((a, b) => {
    if (a.key === "__uncategorized") return 1;
    if (b.key === "__uncategorized") return -1;
    return a.label.localeCompare(b.label);
  });
  return entries;
}

export function ProductsPageContent({ products }: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () => filterProducts(products, debouncedSearch, status),
    [products, debouncedSearch, status],
  );

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  const allKeys = useMemo(() => groups.map((g) => g.key), [groups]);

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setOpenKeys(allKeys);
  }, [debouncedSearch, status, allKeys.join("|")]);

  const expandAll = () => setOpenKeys(allKeys);
  const collapseAll = () => setOpenKeys([]);

  const collapseItems = useMemo(
    () =>
      groups.map((g) => ({
        key: g.key,
        label: (
          <span className={styles.panelLabel}>
            <span className={styles.panelTitle}>{g.label}</span>
            <span className={styles.panelBadge}>{g.items.length}</span>
          </span>
        ),
        children: (
          <div className={styles.rowStack}>
            {g.items.map((p) => (
              <ProductCatalogRow key={p.id} product={p} />
            ))}
          </div>
        ),
      })),
    [groups],
  );

  return (
    <div className={styles.root}>
      <header className={styles.intro}>
        <div className={styles.introTop}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Product catalog</p>
            <h1 className={styles.title}>Products</h1>
            <p className={styles.lede}>
              Browse by category, search by name, variant, barcode, or SKU. Open
              inventory from any row to edit stock and pricing.
            </p>
          </div>
          <div className={styles.countPill} aria-live="polite">
            <span className={styles.countNum}>{filtered.length}</span>
            <span className={styles.countLabel}>In current view</span>
            <span className={styles.countTotal}>
              of {products.length} in this shop
            </span>
            {filtered.length !== products.length ? (
              <span className={styles.countHint}>Filters applied</span>
            ) : null}
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchFrame}>
            <Input
              allowClear
              size="large"
              placeholder="Search products, categories, variants, barcodes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.search}
              prefix={
                <Search
                  className={styles.searchIcon}
                  size={18}
                  strokeWidth={2}
                  aria-hidden
                />
              }
            />
          </div>
          <div className={styles.toolbarRow}>
            <div className={styles.segmentedWrap}>
              <Segmented<StatusFilter>
                options={[
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                value={status}
                onChange={setStatus}
              />
            </div>
            <div className={styles.expandBtns}>
              <Button
                type="default"
                size="small"
                icon={<ChevronDown size={16} aria-hidden />}
                onClick={expandAll}
              >
                Expand all
              </Button>
              <Button
                type="default"
                size="small"
                icon={<ChevronUp size={16} aria-hidden />}
                onClick={collapseAll}
              >
                Collapse all
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.scroll}>
        {products.length === 0 ? (
          <p className={styles.empty}>No products for this shop.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            No products match your filters. Try another search or status.
          </p>
        ) : (
          <Collapse
            bordered={false}
            className={styles.collapse}
            activeKey={openKeys}
            onChange={(keys) =>
              setOpenKeys(Array.isArray(keys) ? keys : [keys])
            }
            items={collapseItems}
          />
        )}
      </div>
    </div>
  );
}
