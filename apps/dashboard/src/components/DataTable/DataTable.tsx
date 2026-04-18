"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import "tabulator-tables/dist/css/tabulator.min.css";
import {
  attachTabulatorOverflowTooltips,
  detachTabulatorOverflowTooltips,
} from "@/lib/tabulatorOverflowTooltips";
import styles from "./DataTable.module.css";
import { TableEmptyState, TableLoadingOverlay } from "./TableDataOverlay";

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

export type DataTableProps = {
  columns: ColumnDefinition[];
  options?: ReactTabulatorOptions;
  events?: Record<string, (...args: any[]) => void>;
  data?: unknown[];
  loading?: boolean;
  onRemoteBusyChange?: (busy: boolean) => void;
  onRef?: (instanceRef: { current?: unknown }) => void;
  emptyState?: React.ReactNode | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  minHeight?: number | string;
};

export function DataTable({
  columns,
  options,
  events,
  data,
  loading: loadingProp,
  onRemoteBusyChange,
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
  const [remoteAjaxInFlight, setRemoteAjaxInFlight] = useState(
    () => typeof options?.ajaxRequestFunc === "function",
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const detachTableListenersRef = useRef<(() => void) | null>(null);
  const chromeObserverRef = useRef<ResizeObserver | null>(null);
  const loadingPropRef = useRef(loadingProp);
  loadingPropRef.current = loadingProp;
  const onRemoteBusyChangeRef = useRef(onRemoteBusyChange);
  onRemoteBusyChangeRef.current = onRemoteBusyChange;
  const sawRemoteDataLoadingRef = useRef(false);
  const remoteInFlightRef = useRef(0);
  const overflowTipsRafRef = useRef<number | null>(null);

  const scheduleOverflowTips = useCallback(() => {
    if (overflowTipsRafRef.current != null) {
      cancelAnimationFrame(overflowTipsRafRef.current);
    }
    overflowTipsRafRef.current = requestAnimationFrame(() => {
      overflowTipsRafRef.current = null;
      attachTabulatorOverflowTooltips(wrapperRef.current);
    });
  }, []);

  const controlledLoading = typeof loadingProp === "boolean";
  const usesRemoteData = useMemo(
    () =>
      Boolean(
        options?.ajaxURL ||
          options?.ajaxURLGenerator ||
          typeof options?.ajaxRequestFunc === "function",
      ),
    [options?.ajaxURL, options?.ajaxURLGenerator, options?.ajaxRequestFunc],
  );

  const displayLoading =
    (usesRemoteData && remoteAjaxInFlight) ||
    (controlledLoading ? loadingProp : internalLoading);

  const minHeightStyle =
    typeof minHeight === "number"
      ? minHeight === 0
        ? "0"
        : `${minHeight}px`
      : minHeight;

  const internalOptions = useMemo(() => {
    const base: ReactTabulatorOptions = {
      layout: "fitDataFill",
      dataLoader: false,
      ...options,
    };
    const orig = base.ajaxRequestFunc;
    const remote = Boolean(
      base.ajaxURL ||
        base.ajaxURLGenerator ||
        typeof orig === "function",
    );
    if (remote && typeof orig === "function") {
      base.ajaxRequestFunc = (async (
        url: string,
        config: unknown,
        params: unknown,
      ) => {
        remoteInFlightRef.current += 1;
        sawRemoteDataLoadingRef.current = true;
        setRemoteAjaxInFlight(true);
        setIsEmpty(false);
        onRemoteBusyChangeRef.current?.(true);
        try {
          return await orig(url, config, params);
        } finally {
          remoteInFlightRef.current = Math.max(0, remoteInFlightRef.current - 1);
          queueMicrotask(() => {
            if (remoteInFlightRef.current === 0) {
              setRemoteAjaxInFlight(false);
              onRemoteBusyChangeRef.current?.(false);
            }
          });
        }
      }) as typeof orig;
    }
    return base;
  }, [options]);

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

  const syncFromTable = useCallback(
    (table: TabulatorLike) => {
      let n = 0;
      try {
        n =
          typeof table.getDataCount === "function" ? table.getDataCount() : 0;
      } catch {
        n = 0;
      }

      const controlled = typeof loadingPropRef.current === "boolean";
      if (
        !controlled &&
        usesRemoteData &&
        !sawRemoteDataLoadingRef.current &&
        n === 0
      ) {
        return;
      }

      setIsEmpty(n === 0);
      if (!controlled) {
        setInternalLoading(false);
      }
    },
    [usesRemoteData],
  );

  const handleRef = useCallback(
    (instanceRef: { current?: unknown }) => {
      const table = instanceRef.current as TabulatorLike | null;

      detachTableListenersRef.current?.();
      detachTableListenersRef.current = null;
      chromeObserverRef.current?.disconnect();
      chromeObserverRef.current = null;
      sawRemoteDataLoadingRef.current = false;
      remoteInFlightRef.current = 0;
      if (usesRemoteData && typeof options?.ajaxRequestFunc === "function") {
        setRemoteAjaxInFlight(true);
      }

      onRef?.(instanceRef);

      if (!table || typeof table.on !== "function") {
        detachTabulatorOverflowTooltips(wrapperRef.current);
        return;
      }

      const onDataLoading = () => {
        sawRemoteDataLoadingRef.current = true;
        onRemoteBusyChangeRef.current?.(true);
        if (typeof loadingPropRef.current !== "boolean") {
          setInternalLoading(true);
        }
        setIsEmpty(false);
      };
      const onProcessed = () => {
        syncFromTable(table);
        if (!usesRemoteData) {
          setRemoteAjaxInFlight(false);
          onRemoteBusyChangeRef.current?.(false);
        }
        requestAnimationFrame(() => {
          measureChrome();
          scheduleOverflowTips();
        });
      };
      const onErr = () => {
        sawRemoteDataLoadingRef.current = true;
        remoteInFlightRef.current = 0;
        setRemoteAjaxInFlight(false);
        onRemoteBusyChangeRef.current?.(false);
        if (typeof loadingPropRef.current !== "boolean") {
          setInternalLoading(false);
        }
        setIsEmpty(true);
        requestAnimationFrame(() => {
          measureChrome();
          scheduleOverflowTips();
        });
      };

      const onRenderComplete = () => {
        scheduleOverflowTips();
      };

      const onColumnResized = () => {
        scheduleOverflowTips();
      };

      table.on("dataLoading", onDataLoading);
      table.on("dataProcessed", onProcessed);
      table.on("dataLoadError", onErr);
      table.on("renderComplete", onRenderComplete);
      table.on("columnResized", onColumnResized);

      const safetyId = window.setTimeout(() => {
        sawRemoteDataLoadingRef.current = true;
        syncFromTable(table);
        requestAnimationFrame(() => {
          measureChrome();
          scheduleOverflowTips();
        });
      }, 4500);

      detachTableListenersRef.current = () => {
        window.clearTimeout(safetyId);
        table.off?.("dataLoading", onDataLoading);
        table.off?.("dataProcessed", onProcessed);
        table.off?.("dataLoadError", onErr);
        table.off?.("renderComplete", onRenderComplete);
        table.off?.("columnResized", onColumnResized);
        detachTabulatorOverflowTooltips(wrapperRef.current);
      };

      if (usesRemoteData) {
        const catchUpIfRowsAlreadyPresent = () => {
          try {
            const n =
              typeof table.getDataCount === "function"
                ? table.getDataCount()
                : 0;
            if (n > 0 && !sawRemoteDataLoadingRef.current) {
              sawRemoteDataLoadingRef.current = true;
              syncFromTable(table);
              requestAnimationFrame(() => {
                measureChrome();
                scheduleOverflowTips();
              });
            }
          } catch {
            /* ignore */
          }
        };
        queueMicrotask(catchUpIfRowsAlreadyPresent);
        requestAnimationFrame(catchUpIfRowsAlreadyPresent);
      }

      requestAnimationFrame(() => {
        measureChrome();
        scheduleOverflowTips();
        const root = wrapperRef.current;
        if (!root || typeof ResizeObserver === "undefined") return;
        const obs = new ResizeObserver(() => {
          measureChrome();
          scheduleOverflowTips();
        });
        chromeObserverRef.current = obs;
        const tab = root.querySelector(".tabulator");
        if (tab) obs.observe(tab);
      });
    },
    [onRef, syncFromTable, measureChrome, usesRemoteData, options?.ajaxRequestFunc, scheduleOverflowTips],
  );

  useEffect(() => {
    if (!Array.isArray(data)) return;
    const controlled = typeof loadingProp === "boolean";
    if (!controlled) {
      setInternalLoading(false);
    } else if (loadingProp === true) {
      return;
    }
    setIsEmpty(data.length === 0);
  }, [data, loadingProp]);

  useEffect(
    () => () => {
      if (overflowTipsRafRef.current != null) {
        cancelAnimationFrame(overflowTipsRafRef.current);
        overflowTipsRafRef.current = null;
      }
      detachTabulatorOverflowTooltips(wrapperRef.current);
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
    displayLoading ? styles.bodyOverlay_loading : "",
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
        events={events}
        onRef={handleRef}
      />

      {displayLoading ? (
        <div className={overlayClasses} aria-busy="true">
          <TableLoadingOverlay />
        </div>
      ) : null}

      {!displayLoading && isEmpty && resolvedEmpty ? (
        <div className={overlayClasses}>{resolvedEmpty}</div>
      ) : null}
    </div>
  );
}
