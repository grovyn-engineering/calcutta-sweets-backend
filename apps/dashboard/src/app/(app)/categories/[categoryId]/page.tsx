"use client";

import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
} from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { CategoryProductsTabulator } from "@/components/CategoryProductsTabulator/CategoryProductsTabulator";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import useFetch from "@/hooks/useFetch";
import { apiFetch } from "@/lib/api";
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
  const [editForm] = Form.useForm();
  const [addForm] = Form.useForm();

  const refresh = () => setDetailVersion((v) => v + 1);

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

  const onAddProduct = async (values: { name: string; price: number }) => {
    if (!categoryId) return;
    setAddSubmitting(true);
    try {
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name: values.name.trim(),
          price: values.price,
          categoryId,
        }),
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
      refresh();
    } finally {
      setAddSubmitting(false);
    }
  };

  if (!shopCode || !categoryId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
        {String(error)}
      </div>
    );
  }

  if (!isCategoryDetail(data)) {
    return (
      <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
        Category not found.
      </div>
    );
  }

  const cat = data;

  return (
    <div className={styles.page}>
      <Link href="/categories" className={styles.back} scroll={false}>
        ← Back to categories
      </Link>

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
        <p className={styles.sectionLabel}>Add product to this category</p>
        <Form
          form={addForm}
          layout="inline"
          onFinish={onAddProduct}
          className={styles.addForm}
        >
          <Form.Item
            name="name"
            label="Product name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Name" autoComplete="off" style={{ minWidth: 200 }} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (INR)"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} placeholder="0" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
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
    </div>
  );
}
