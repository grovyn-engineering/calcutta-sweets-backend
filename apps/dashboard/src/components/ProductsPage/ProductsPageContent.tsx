"use client";

import { App, Button, Drawer, Form, Input, InputNumber, Segmented, Select } from "antd";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import type { ProductWithRelations } from "@/components/ProductCard/ProductCard";
import { ProductCatalogRow } from "./ProductCatalogRow";
import styles from "./ProductsPageContent.module.css";

type Props = {
  products: ProductWithRelations[];
  onRefresh?: () => void;
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



export function ProductsPageContent({ products, onRefresh }: Props) {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const [status, setStatus] = useState<StatusFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [categoryOptions, setCategoryOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    if (createOpen && categoryOptions.length === 0) {
      apiFetch('/category')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCategoryOptions(data.map(c => ({ label: c.name, value: c.id })));
          }
        })
        .catch(console.error);
    }
  }, [createOpen]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(values),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(typeof payload?.message === "string" ? payload.message : "Could not create product");
        return;
      }
      message.success("Product created!");
      setCreateOpen(false);
      form.resetFields();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(
    () => filterProducts(products, debouncedSearch, status),
    [products, debouncedSearch, status],
  );



  return (
    <div className={styles.root}>
      <header className={styles.intro}>
        <div className={styles.introTop}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Product catalog</p>
            <h1 className={styles.title}>Products</h1>
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
      </header>

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
            <Button type="primary" icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
              New product
            </Button>
          </div>
        </div>

      <div className={styles.scroll}>
        {products.length === 0 ? (
          <p className={styles.empty}>No products for this shop.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            No products match your filters. Try another search or status.
          </p>
        ) : (
          <div className={styles.rowStack}>
            {filtered.map((p) => (
              <ProductCatalogRow key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <Drawer
        title="New Product"
        placement="right"
        size="default"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        destroyOnClose
        extra={
          <Button type="primary" onClick={() => form.submit()} loading={submitting}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Kaju Katli" />
          </Form.Item>
          
          <Form.Item name="price" label="Price (₹)" rules={[{ required: true }]}>
             <InputNumber className="w-full" style={{ width: '100%' }} min={0} placeholder="e.g., 200" />
          </Form.Item>
          
          <Form.Item name="categoryId" label="Category">
             <Select placeholder="Select a category" options={categoryOptions} allowClear />
          </Form.Item>
          
          <Form.Item name="quantity" label="Initial Stock">
             <InputNumber className="w-full" style={{ width: '100%' }} min={0} placeholder="e.g., 100" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
