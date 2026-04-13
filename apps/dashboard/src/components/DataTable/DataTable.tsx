import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./DataTable.module.css";
import { TableEmptyState, TableLoadingOverlay } from "./TableDataOverlay";

/**
 * Minimal Tabulator instance surface used for row counts and event wiring.
 */
type TabulatorLike = {
  getDataCount?: () => number;
  on?: (ev: string, fn: (...args: unknown[]) => void) => void;
  off?: (ev: string, fn: (...args: unknown[]) => void) => void;
};

function TableSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonRowsWrapper}>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    </div>
  );
}

const ReactTabulator = dynamic(
  () => import("react-tabulator/lib/ReactTabulator"),
  { ssr: false, loading: () => <TableSkeleton /> },
);

/**
 * Props for {@link DataTable}.
 */
export type DataTableProps = {
  /** Tabulator column definitions. */
  columns: ColumnDefinition[];
  /** Spread after internal defaults (`layout`, `dataLoader`). */
  options?: ReactTabulatorOptions;
  /** When set, syncs loading/empty state from this array instead of only remote events. */
  data?: unknown[];
  /**
   * When boolean, controls the table-body loading overlay (e.g. client-side fetch).
   * Omit to use Tabulator ajax / internal loading only.
   */
  loading?: boolean;
  /** Invoked with Tabulator’s ref object when the instance is ready. */
  onRef?: (instanceRef: { current?: any }) => void;
  /** Overrides built-in empty UI; `null` disables the empty overlay. */
  emptyState?: React.ReactNode | null;
  /** Default empty title when `emptyState` is omitted. */
  emptyTitle?: string;
  /** Default empty description when `emptyState` is omitted. */
  emptyDescription?: string;
  /** Icon node for the default empty state. */
  emptyIcon?: React.ReactNode;
  /** Optional action area below the default empty copy. */
  emptyAction?: React.ReactNode;
  /**
   * Shell `min-height` (px or CSS length). Use `0` with flex layouts so the grid can shrink.
   * @default 400
   */
  minHeight?: number | string;
};

/**
 * Tabulator wrapper with shared loading/empty overlays.
 * Subscribes to Tabulator events in the `onRef` callback so the first `dataProcessed` is not
 * missed. Sets `--dt-header-reserve` / `--dt-footer-reserve` for overlay insets when pagination is enabled.
 */
export function DataTable({
  columns,
  options,
  data,
  loading: loadingProp,
  onRef,
  emptyState,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  minHeight = 400,
}: DataTableProps) {
  const [internalLoading, setInternalLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const detachTableListenersRef = useRef<(() => void) | null>(null);
  const chromeObserverRef = useRef<ResizeObserver | null>(null);
  const loadingPropRef = useRef(loadingProp);
  loadingPropRef.current = loadingProp;

  const controlledLoading = typeof loadingProp === "boolean";
  const showLoadingOverlay = controlledLoading
    ? loadingProp
    : internalLoading;

  const minHeightStyle =
    typeof minHeight === "number"
      ? minHeight === 0
        ? "0"
        : `${minHeight}px`
      : minHeight;

  const internalOptions = useMemo(
    () => ({
      layout: "fitDataFill",
      dataLoader: false,
      ...options,
    }),
    [options],
  );

  const reserveFooterSpace = options?.pagination === true;

  const defaultEmptyCopy = useMemo(() => {
    const ph = options?.placeholder;
    const fromPlaceholder =
      typeof ph === "string" && ph.trim().length > 0 ? ph.trim() : undefined;
    return {
      title: emptyTitle ?? "No results",
      description:
        emptyDescription ??
        fromPlaceholder ??
        "Nothing to show yet. Try changing filters or refreshing.",
    };
  }, [emptyTitle, emptyDescription, options?.placeholder]);

  const resolvedEmpty = useMemo(() => {
    if (emptyState === null) return null;
    if (emptyState !== undefined) return emptyState;
    return (
      <TableEmptyState
        title={defaultEmptyCopy.title}
        description={defaultEmptyCopy.description}
        icon={emptyIcon}
        action={emptyAction}
      />
    );
  }, [
    emptyState,
    defaultEmptyCopy.title,
    defaultEmptyCopy.description,
    emptyIcon,
    emptyAction,
  ]);

  const syncFromTable = useCallback((table: TabulatorLike) => {
    let n = 0;
    try {
      n =
        typeof table.getDataCount === "function" ? table.getDataCount() : 0;
    } catch {
      n = 0;
    }
    setIsEmpty(n === 0);
    if (typeof loadingPropRef.current !== "boolean") {
      setInternalLoading(false);
    }
  }, []);

  const measureChrome = useCallback(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const header = root.querySelector(
      ".tabulator .tabulator-header",
    ) as HTMLElement | null;
    const footer = root.querySelector(
      ".tabulator .tabulator-footer",
    ) as HTMLElement | null;

    const top = header
      ? Math.min(120, Math.max(44, Math.ceil(header.offsetHeight)))
      : 52;
    root.style.setProperty("--dt-header-reserve", `${top}px`);

    if (reserveFooterSpace && footer) {
      const fh = Math.ceil(footer.offsetHeight + 12);
      root.style.setProperty("--dt-footer-reserve", `${Math.max(72, fh)}px`);
    } else {
      root.style.removeProperty("--dt-footer-reserve");
    }
  }, [reserveFooterSpace]);

  const handleRef = useCallback(
    (instanceRef: { current?: any }) => {
      const table = instanceRef.current as TabulatorLike | null;

      detachTableListenersRef.current?.();
      detachTableListenersRef.current = null;
      chromeObserverRef.current?.disconnect();
      chromeObserverRef.current = null;

      onRef?.(instanceRef);

      if (!table || typeof table.on !== "function") return;

      const onRequest = () => {
        if (typeof loadingPropRef.current !== "boolean") {
          setInternalLoading(true);
        }
        setIsEmpty(false);
      };
      const onProcessed = () => {
        syncFromTable(table);
        requestAnimationFrame(measureChrome);
      };
      const onErr = () => {
        if (typeof loadingPropRef.current !== "boolean") {
          setInternalLoading(false);
        }
        setIsEmpty(true);
        requestAnimationFrame(measureChrome);
      };

      table.on("ajaxRequesting", onRequest);
      table.on("dataProcessed", onProcessed);
      table.on("dataLoaded", onProcessed);
      table.on("ajaxError", onErr);

      const safetyId = window.setTimeout(() => {
        syncFromTable(table);
        measureChrome();
      }, 4500);

      detachTableListenersRef.current = () => {
        window.clearTimeout(safetyId);
        table.off?.("ajaxRequesting", onRequest);
        table.off?.("dataProcessed", onProcessed);
        table.off?.("dataLoaded", onProcessed);
        table.off?.("ajaxError", onErr);
      };

      requestAnimationFrame(() => {
        measureChrome();
        const root = wrapperRef.current;
        if (!root || typeof ResizeObserver === "undefined") return;
        const obs = new ResizeObserver(() => measureChrome());
        chromeObserverRef.current = obs;
        const tab = root.querySelector(".tabulator");
        if (tab) obs.observe(tab);
      });
    },
    [onRef, syncFromTable, measureChrome],
  );

  useEffect(() => {
    if (Array.isArray(data)) {
      if (typeof loadingProp !== "boolean") {
        setInternalLoading(false);
      }
      setIsEmpty(data.length === 0);
    }
  }, [data, loadingProp]);

  useEffect(
    () => () => {
      detachTableListenersRef.current?.();
      detachTableListenersRef.current = null;
      chromeObserverRef.current?.disconnect();
      chromeObserverRef.current = null;
    },
    [],
  );

  const overlayClasses = [
    styles.bodyOverlay,
    reserveFooterSpace ? styles.bodyOverlay_footerPad : "",
    showLoadingOverlay ? styles.bodyOverlay_loading : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapperRef}
      className={styles.tableWrapper}
      style={
        {
          position: "relative",
          "--table-min-height": minHeightStyle,
        } as React.CSSProperties
      }
    >
      <ReactTabulator
        className={styles.tabulatorHost}
        columns={columns}
        options={internalOptions}
        data={data}
        onRef={handleRef}
      />

      {showLoadingOverlay ? (
        <div className={overlayClasses} aria-busy="true">
          <TableLoadingOverlay />
        </div>
      ) : null}

      {!showLoadingOverlay && isEmpty && resolvedEmpty ? (
        <div className={overlayClasses}>{resolvedEmpty}</div>
      ) : null}
    </div>
  );
}
