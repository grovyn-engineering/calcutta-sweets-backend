"use client";

import styles from "./ContentSkeleton.module.css";

export type ContentSkeletonVariant =
  | "card-grid"
  | "table"
  | "rows"
  | "detail";

export type ContentSkeletonProps = {
  variant: ContentSkeletonVariant;
  /** `card-grid`: number of placeholder cards */
  gridItems?: number;
  /** `table` / `rows`: number of placeholder rows */
  rowCount?: number;
  className?: string;
  "aria-label"?: string;
};

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Section-scoped shimmer placeholders for data-loading states.
 * Prefer this over full-screen {@link LoadingDots} inside routed app content.
 */
export function ContentSkeleton({
  variant,
  gridItems = 6,
  rowCount = 8,
  className,
  "aria-label": ariaLabel = "Loading content",
}: ContentSkeletonProps) {
  const a = styles.animate;

  if (variant === "card-grid") {
    const n = Math.max(1, Math.min(gridItems, 12));
    return (
      <div
        className={cx(styles.root, className)}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className={styles.cardGrid}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={styles.cardCell}>
              <div className={cx(styles.cardAccent, a)} />
              <div className={cx(styles.cardLine, a)} />
              <div className={cx(styles.cardLineShort, a)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    const n = Math.max(3, Math.min(rowCount, 20));
    return (
      <div
        className={cx(styles.root, className)}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className={styles.table}>
          <div className={styles.tableHeader} />
          <div className={styles.tableBody}>
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className={cx(styles.tableRow, a)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "rows") {
    const n = Math.max(3, Math.min(rowCount, 24));
    return (
      <div
        className={cx(styles.root, className)}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className={styles.rows}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={cx(styles.rowBar, a)} />
          ))}
        </div>
      </div>
    );
  }

  /* detail */
  const n = Math.max(4, Math.min(rowCount, 12));
  return (
    <div
      className={cx(styles.root, styles.detail, className)}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className={cx(styles.detailHeroLine, a)} />
      <div className={cx(styles.detailTitle, a)} />
      <div className={cx(styles.detailMeta, a)} />
      <div className={styles.detailToolbar}>
        <div className={cx(styles.detailToolbarBtn, a)} />
        <div className={cx(styles.detailToolbarBtn, a)} />
      </div>
      <div className={cx(styles.detailPanel, a)} />
      <div className={styles.table}>
        <div className={styles.tableHeader} />
        <div className={styles.tableBody}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={cx(styles.tableRow, a)} />
          ))}
        </div>
      </div>
    </div>
  );
}
