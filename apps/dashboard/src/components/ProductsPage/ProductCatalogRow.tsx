"use client";

import Link from "next/link";

import type { ProductWithRelations } from "@/components/ProductCard/ProductCard";

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
};

export function ProductCatalogRow({ product }: Props) {
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

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.nameLine}>
          <h3 className={styles.name}>{product.name}</h3>
          <span
            className={
              product.isActive ? styles.statusOn : styles.statusOff
            }
          >
            {product.isActive ? "Active" : "Inactive"}
          </span>
        </div>
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
              <li className={styles.chipMore}>
                +{variants.length - 4} more
              </li>
            ) : null}
          </ul>
        ) : (
          <p className={styles.noVariants}>No variants</p>
        )}
      </div>
      <div className={styles.stats}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Stock</span>
          <span className={styles.statValue}>
            {totalStock.toLocaleString("en-IN")}
          </span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Price</span>
          <span className={styles.statValue}>{priceLabel}</span>
        </div>
        {firstVariant ? (
          <Link
            href={`/inventory/${firstVariant.id}`}
            className={styles.manageLink}
            scroll={false}
          >
            Inventory
          </Link>
        ) : (
          <span className={styles.manageDisabled}>-</span>
        )}
      </div>
    </div>
  );
}
