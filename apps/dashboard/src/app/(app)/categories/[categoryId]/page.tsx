"use client";

import {
  App,
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
} from "antd";
import Link from "next/link";
import { Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CategoryProductsTabulator } from "@/components/CategoryProductsTabulator/CategoryProductsTabulator";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import useFetch from "@/hooks/useFetch";
import { apiFetch, getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { openPrintableBarcodes } from "@/lib/printBarcodes";
import { useShop } from "@/contexts/ShopContext";

import styles from "./page.module.css";

type CategoryDetail = {
  id: string;
  name: string;
  createdAt: string;
  totalStock: number;
};

function isCategoryDetail(data: unknown): data is CategoryDetail {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.totalStock === "number"
  );
}

export default function CategoryDetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const router = useRouter();
  const { effectiveShopCode } = useShop();
  const shopCode =
    effectiveShopCode ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    "";

  const [detailVersion, setDetailVersion] = useState(0);
  const { data, error, loading } = useFetch(
    shopCode && categoryId ? `/category/${categoryId}` : "",
    { method: "GET" },
    [effectiveShopCode, categoryId, detailVersion],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [categoryPrintLoading, setCategoryPrintLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [addForm] = Form.useForm();
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const refresh = () => setDetailVersion((v) => v + 1);

  useEffect(() => {
    if (!shopCode) return;
    void apiFetch("/category")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setCategoryOptions(
            data.map((c: { id: string; name: string }) => ({
              label: c.name,
              value: c.id,
            })),
          );
        }
      })
      .catch(() => {});
  }, [shopCode]);

  const onOpenVariant = useCallback(
    (variantId: string) => {
      router.push(`/inventory/${variantId}`, { scroll: false });
    },
    [router],
  );

  const openEdit = () => {
    if (isCategoryDetail(data)) {
      editForm.setFieldsValue({ name: data.name });
    }
    setEditOpen(true);
  };

  const onEditSave = async (values: { name: string }) => {
    if (!categoryId) return;
    setEditSubmitting(true);
    try {
      const res = await apiFetch(`/category/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: values.name.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : "Could not update category",
        );
        return;
      }
      message.success("Category updated");
      setEditOpen(false);
      refresh();
    } finally {
      setEditSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!categoryId) return;
    setDeleteSubmitting(true);
    try {
      const res = await apiFetch(`/category/${categoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : "Could not delete category",
        );
        return;
      }
      message.success("Category removed");
      router.replace("/categories");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const onAddProduct = async (values: {
    name: string;
    price: number;
    categoryId?: string;
    variantName?: string;
    quantity?: number;
    costPrice?: number;
    sku?: string;
    unit?: string;
    hsnCode?: string;
    minStock?: number;
    barcode?: string;
    description?: string;
    isListedOnWebsite?: boolean;
  }) => {
    if (!categoryId) return;
    setAddSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: values.name.trim(),
        price: values.price,
        isListedOnWebsite: !!values.isListedOnWebsite,
      };
      const chosenCat = values.categoryId?.trim();
      if (chosenCat) body.categoryId = chosenCat;
      if (values.variantName?.trim()) body.variantName = values.variantName.trim();
      if (values.quantity !== undefined && values.quantity !== null) body.quantity = values.quantity;
      if (values.costPrice !== undefined && values.costPrice !== null) body.costPrice = values.costPrice;
      if (values.sku?.trim()) body.sku = values.sku.trim();
      if (values.unit) body.unit = values.unit;
      if (values.hsnCode?.trim()) body.hsnCode = values.hsnCode.trim();
      if (values.minStock !== undefined && values.minStock !== null) body.minStock = values.minStock;
      if (values.barcode?.trim()) body.barcode = values.barcode.trim();
      if (values.description?.trim()) body.description = values.description.trim();

      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : Array.isArray(payload?.message)
              ? payload.message.join(", ")
              : "Could not create product",
        );
        return;
      }
      message.success("Product added");
      addForm.resetFields();
      addForm.setFieldValue("categoryId", categoryId);
      refresh();
    } finally {
      setAddSubmitting(false);
    }
  };

  const cat = isCategoryDetail(data) ? data : null;

  useEffect(() => {
    if (categoryId && cat) {
      addForm.setFieldValue("categoryId", categoryId);
    }
  }, [categoryId, cat, addForm]);

  const onPrintCategoryBarcodes = useCallback(async () => {
    if (!shopCode || !cat) return;
    setCategoryPrintLoading(true);
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
        u.searchParams.set("category", cat.name);

        const res = await fetch(u.toString(), {
          headers: { ...getAuthHeaders(), Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load variants for printing");
        const json = (await res.json()) as {
          data?: typeof allRows;
          last_page?: number;
        };
        const chunk = Array.isArray(json.data) ? json.data : [];
        if (chunk.length === 0 && page === 1) {
          message.warning("No variants in this category to print.");
          return;
        }
        allRows.push(...chunk);
        const lastPage = Math.max(1, json.last_page ?? page);
        if (page >= lastPage) break;
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
        message.warning(
          "No barcodes in this category - add barcodes on each variant in Inventory.",
        );
        return;
      }

      const ok = openPrintableBarcodes(items);
      if (!ok) {
        message.error("The print window was blocked. Allow pop-ups to print.");
      }
    } catch (e) {
      message.error(String(e));
    } finally {
      setCategoryPrintLoading(false);
    }
  }, [shopCode, cat, message]);

  return (
    <div className={styles.page}>
      <Link href="/categories" className={styles.back} scroll={false}>
        ← Back to categories
      </Link>

      {!shopCode || !categoryId ? (
        <p className="mt-4 text-[var(--text-secondary)]">
          Select a shop in the header and open a category from the list.
        </p>
      ) : loading ? (
        <ContentSkeleton variant="detail" rowCount={8} className="mt-4" />
      ) : error ? (
        <div className="mt-4 rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
          {String(error)}
        </div>
      ) : !cat ? (
        <div className="mt-4 rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
          Category not found.
        </div>
      ) : (
        <>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Category</p>
          <h1 className={styles.title}>{cat.name}</h1>
          <p className={styles.meta}>
            Total stock in this shop:{" "}
            <span className={styles.metaStrong}>
              {cat.totalStock.toLocaleString("en-IN")} units
            </span>
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            type="default"
            icon={<Printer className="h-4 w-4" aria-hidden />}
            loading={categoryPrintLoading}
            onClick={() => void onPrintCategoryBarcodes()}
          >
            Print barcodes
          </Button>
          <Button onClick={openEdit}>Rename</Button>
          <Popconfirm
            title="Delete this category?"
            description="Products will be uncategorized; they are not deleted."
            onConfirm={onDelete}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ loading: deleteSubmitting }}
          >
            <Button danger loading={deleteSubmitting}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      </header>

      <section className={styles.panel} aria-label="Add product">
        <p className={styles.sectionLabel}>Add product</p>
        <Form
          form={addForm}
          layout="vertical"
          onFinish={onAddProduct}
          className={styles.addForm}
        >
          <div className={styles.addFormGrid}>
            <Form.Item
              name="name"
              label="Product name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Kaju Katli" autoComplete="off" />
            </Form.Item>
            <Form.Item name="categoryId" label="Category">
              <Select
                placeholder="Uncategorized"
                options={categoryOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item name="variantName" label="Variant label">
              <Input
                placeholder="e.g. Regular, 500g (optional)"
                autoComplete="off"
              />
            </Form.Item>
            <Form.Item
              name="price"
              label="Price (INR)"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
            </Form.Item>
            <div className="flex items-end pb-6">
              <Form.Item name="isListedOnWebsite" valuePropName="checked" label="Public on website" className="!mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <Form.Item
              name="quantity"
              label="Initial stock qty"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Collapse
            ghost
            size="small"
            items={[{
              key: "more",
              label: <span className={styles.moreLabel}>More details (optional)</span>,
              children: (
                <div className={styles.addFormGrid}>
                  <Form.Item name="description" label="Website description" className={styles.span2}>
                    <Input.TextArea rows={2} placeholder="Add a tempting description for the website..." />
                  </Form.Item>
                  <Form.Item name="costPrice" label="Cost price (INR)">
                    <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="minStock" label="Min stock alert">
                    <InputNumber min={0} placeholder="e.g. 10" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="unit" label="Unit">
                    <Select placeholder="PC" options={[
                      { value: "PC", label: "PC - Piece" },
                      { value: "KG", label: "KG - Kilogram" },
                      { value: "GM", label: "GM - Gram" },
                      { value: "LTR", label: "LTR - Litre" },
                      { value: "ML", label: "ML - Millilitre" },
                    ]} allowClear />
                  </Form.Item>
                  <Form.Item name="sku" label="SKU">
                    <Input placeholder="Custom SKU" autoComplete="off" />
                  </Form.Item>
                  <Form.Item name="hsnCode" label="HSN Code">
                    <Input placeholder="e.g. 1704" autoComplete="off" />
                  </Form.Item>
                  <Form.Item name="barcode" label="Custom barcode">
                    <Input placeholder="Auto-generated if blank" autoComplete="off" />
                  </Form.Item>
                </div>
              ),
            }]}
          />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={addSubmitting}>
              Add product
            </Button>
          </Form.Item>
        </Form>
      </section>

      <section
        className={`${styles.panel} ${styles.panelProducts}`}
        aria-label="Products in category"
      >
        <p className={styles.sectionLabel}>Products in this shop</p>
        <CategoryProductsTabulator
          categoryId={categoryId}
          refreshKey={detailVersion}
          onOpenVariant={onOpenVariant}
        />
      </section>

      <Modal
        title={<span className={styles.modalTitle}>Rename category</span>}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={onEditSave}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Enter a name" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={editSubmitting} block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
        </>
      )}
    </div>
  );
}
