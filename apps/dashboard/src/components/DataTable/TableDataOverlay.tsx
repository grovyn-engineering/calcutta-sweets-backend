"use client";

import { Inbox } from "lucide-react";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import styles from "./TableDataOverlay.module.css";

export type TableEmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  embedded?: boolean;
};

export function TableEmptyState({
  title,
  description,
  icon,
  action,
  embedded = false,
}: TableEmptyStateProps) {
  return (
    <div
      className={`${styles.emptyRoot} ${embedded ? styles.emptyRoot_embedded : ""}`.trim()}
      role="status"
    >
      <div
        className={`${styles.emptyCard} ${embedded ? styles.emptyCard_embedded : ""}`.trim()}
      >
        <div className={styles.emptyIcon} aria-hidden>
          {icon ?? <Inbox strokeWidth={1.35} />}
        </div>
        <h3 className={styles.emptyTitle}>{title}</h3>
        {description ? (
          <p className={styles.emptyDesc}>{description}</p>
        ) : null}
        {action ? <div className={styles.emptyAction}>{action}</div> : null}
      </div>
    </div>
  );
}

export function TableLoadingOverlay() {
  return (
    <div
      className={styles.loadingRoot}
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
    >
      <div className={styles.loadingCard}>
        <LoadingDots />
        <p className={styles.loadingLabel}>Loading</p>
      </div>
    </div>
  );
}
