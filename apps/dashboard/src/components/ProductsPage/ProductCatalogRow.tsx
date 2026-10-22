"use client";

import { App, Popconfirm } from "antd";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { ProductWithRelations } from "@/components/ProductCard/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { isAtLeastManager } from "@/lib/rolePermissions";

import styles from "./ProductCatalogRow.module.css";

function formatInr(amount: number) {
  const n = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

type Props = {
  product: ProductWithRelations;
  onProductDeleted?: () => void;
};

export function ProductCatalogRow({ product, onProductDeleted }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const variants = product.variants ?? [];
  const totalStock = variants.reduce((s, v) => s + v.quantity, 0);
  const prices = variants.map((v) => v.price).filter(Number.isFinite);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const priceLabel =
    prices.length === 0
      ? "-"
      : minP === maxP
        ? formatInr(minP)
        : `${formatInr(minP)}–${formatInr(maxP)}`;

  const firstVariant = variants[0];

  const onDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/products/${product.id}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : "Could not delete product",
        );
        return;
      }
      message.success("Product deleted");
      onProductDeleted?.();
    } catch {
      message.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const categoryName = product.category?.name?.replace(/_/g, " ");

  return (
    <div className={`${styles.row} ${product.isActive ? "" : styles.rowInactive}`.trim()}>
      <span className={styles.monogram} aria-hidden>
        {product.name.trim().charAt(0).toUpperCase()}
      </span>

      <div className={styles.main}>
        <div className={styles.nameLine}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.isActive ? null : <span className={styles.statusOff}>Inactive</span>}
        </div>
        <p className={styles.meta}>
          {categoryName ? <span className={styles.metaCategory}>{categoryName}</span> : "Uncategorised"}
          <span aria-hidden> · </span>
          {variants.length} {variants.length === 1 ? "variant" : "variants"}
        </p>
        {variants.length > 0 ? (
          <ul className={styles.variantChips} aria-label="Variants">
            {variants.slice(0, 4).map((v) => (
              <li key={v.id} className={styles.chip}>
                <span className={styles.chipName}>{v.name}</span>
                <span className={styles.chipPrice}>{formatInr(v.price)}</span>
                <span className={styles.chipStock}>
                  {v.quantity} {v.unit ?? "PC"}
                </span>
              </li>
            ))}
            {variants.length > 4 ? (
              <li className={styles.chipMore}>+{variants.length - 4} more</li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <dl className={styles.stats}>
        <div className={styles.statBlock}>
          <dt className={styles.statLabel}>Stock</dt>
          <dd className={`${styles.statValue} ${totalStock <= 0 ? styles.statWarn : ""}`.trim()}>
            {totalStock.toLocaleString("en-IN")}
          </dd>
        </div>
        <div className={styles.statBlock}>
          <dt className={styles.statLabel}>Price</dt>
          <dd className={styles.statValue}>{priceLabel}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {firstVariant ? (
          <Link href={`/inventory/${firstVariant.id}`} className={styles.manageLink} scroll={false}>
            Inventory
          </Link>
        ) : (
          <span className={styles.manageDisabled}>No variants</span>
        )}
        {isAtLeastManager(user?.role) && (
        <Popconfirm
          title="Delete this product?"
          description="This removes the product and its variants. If it appears on past orders, deletion may be blocked."
          onConfirm={() => void onDelete()}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: deleting }}
        >
          <button
            type="button"
            className={styles.removeBtn}
            aria-label={`Delete ${product.name}`}
            title="Delete product"
            disabled={deleting}
          >
            <Trash2 size={15} strokeWidth={1.9} aria-hidden />
          </button>
        </Popconfirm>
        )}
      </div>
    </div>
  );
}
