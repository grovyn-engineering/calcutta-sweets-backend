"use client";

import { App, Button, Form, Input, Modal } from "antd";
import { FolderSearch, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import useFetch from "@/hooks/useFetch";
import { apiFetch } from "@/lib/api";
import { useShop } from "@/contexts/ShopContext";

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

  const categories = isCategoryList(data) ? data : null;

  return (
    <div className={styles.page}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--pearl-bush)] pb-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--bistre-950)] m-0 leading-none">Categories</h1>
        <Button
          type="primary"
          size="large"
          className="rounded-lg shadow-sm font-semibold shrink-0"
          style={{ backgroundColor: 'var(--ochre-600)', borderColor: 'var(--ochre-600)' }}
          icon={<Plus size={16} strokeWidth={2.25} />}
          onClick={() => setCreateOpen(true)}
        >
          New category
        </Button>
      </div>

      <section className={styles.panel} aria-label="Category list">

        {!shopCode ? (
          <p className={styles.emptyState}>
            Select a shop in the header to load categories.
          </p>
        ) : loading ? (
          <ContentSkeleton variant="card-grid" gridItems={6} />
        ) : error ? (
          <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
            Could not load categories: {String(error)}
          </div>
        ) : !categories ? (
          <div className="rounded-xl border border-[var(--pearl-bush)] bg-[var(--parchment)] p-8 text-[var(--text-secondary)]">
            Unexpected response from server.
          </div>
        ) : categories.length === 0 ? (
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
