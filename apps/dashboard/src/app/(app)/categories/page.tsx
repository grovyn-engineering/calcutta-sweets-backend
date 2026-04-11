"use client";

import { App, Button, Form, Input, Modal } from "antd";
import { Layers3, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import useFetch from "@/hooks/useFetch";
import { apiFetch } from "@/lib/api";
import { useShop } from "@/contexts/ShopContext";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { FolderSearch } from "lucide-react";

import styles from "./page.module.css";

type CategoryProductSummary = {
  id: string;
  name: string;
  totalStock: number;
};

type CategorySummary = {
  id: string;
  name: string;
  products: CategoryProductSummary[];
  totalStock: number;
};

function isCategoryList(data: unknown): data is CategorySummary[] {
  return (
    Array.isArray(data) &&
    data.every(
      (row) =>
        row &&
        typeof row === "object" &&
        "id" in row &&
        "name" in row &&
        "products" in row &&
        "totalStock" in row,
    )
  );
}

export default function CategoriesPage() {
  const { message } = App.useApp();
  const { effectiveShopCode } = useShop();
  const shopCode =
    effectiveShopCode ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    "";

  const [listVersion, setListVersion] = useState(0);
  const { data, error, loading } = useFetch(
    shopCode ? "/category" : "",
    { method: "GET" },
    [effectiveShopCode, listVersion],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const onCreate = async (values: { name: string }) => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/category", {
        method: "POST",
        body: JSON.stringify({ name: values.name.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : "Could not create category",
        );
        return;
      }
      message.success("Category created");
      setCreateOpen(false);
      form.resetFields();
      setListVersion((v) => v + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (!shopCode || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
        Could not load categories: {String(error)}
      </div>
    );
  }

  if (!isCategoryList(data)) {
    return (
      <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
        Unexpected response from server.
      </div>
    );
  }

  const categories = data;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroIcon} aria-hidden>
          <Layers3 className={styles.heroIconSvg} strokeWidth={1.75} />
        </div>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Catalog</p>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>
            Browse categories for the shop selected in the header. Stock totals
            count all variants for products in this shop.
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label="Category list">
        <div className={styles.toolbar}>
          <p className={styles.toolbarLabel}>All categories</p>
          <Button
            type="primary"
            icon={<Plus size={18} strokeWidth={2.25} />}
            onClick={() => setCreateOpen(true)}
          >
            New category
          </Button>
        </div>

        {categories.length === 0 ? (
          <EmptyState 
            message="No categories yet" 
            description="Create your first category to start organizing your products into groups."
            icon={<FolderSearch size={48} />}
          />
        ) : (
          <div className={styles.grid}>
            {categories.map((cat) => {
              const productCount = cat.products.length;
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className={styles.card}
                  scroll={false}
                >
                  <h2 className={styles.cardTitle}>{cat.name}</h2>
                  <p className={styles.stockLine}>
                    Total products:{" "}
                    <span className={styles.stockStrong}>
                      {productCount} {productCount === 1 ? "product" : "products"}
                    </span>
                  </p>
                  <p className={styles.stockLine}>
                    Total stock:{" "}
                    <span className={styles.stockStrong}>
                      {cat.totalStock.toLocaleString("en-IN")} units
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        title={<span className={styles.modalTitle}>New category</span>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onCreate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Enter a name" }]}
          >
            <Input placeholder="e.g. Mithai" autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
