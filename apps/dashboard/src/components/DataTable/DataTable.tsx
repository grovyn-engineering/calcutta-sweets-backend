"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TableEmptyState, TableLoadingOverlay } from "./TableDataOverlay";
import styles from "./DataTable.module.css";

export type AppTableColumn = {
  key: string;
  label: React.ReactNode;
  field?: string;
  render?: (value: unknown, row: unknown, index: number) => React.ReactNode;
  width?: number | string;
  minWidth?: number | string;
  align?: "left" | "right" | "center";
  className?: string;
};

export type DataTableProps = {
  columns: AppTableColumn[];
  // Local data
  data?: unknown[];
  // Remote data — component manages page state, calls this when page/filterKey changes
  fetchFn?: (params: {
    page: number;
    pageSize: number;
  }) => Promise<{ data: unknown[]; lastPage: number }>;
  tableType?: "pagination" | "infiniteScroll";
  pageSize?: number;
  pageSizeOptions?: number[];
  // Changing filterKey resets to page 1 and re-fetches
  filterKey?: string | number;
  // External loading override (e.g. for local data)
  loading?: boolean;
  maxBodyHeight?: number | string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: unknown) => void;
  rowKey?: string;
  // Called whenever the displayed rows change (useful for select-all logic)
  onVisibleRowsChange?: (rows: unknown[]) => void;
  className?: string;
};

type FetchSpec = { page: number; pageSize: number; nonce: number };

function getRowKey(row: unknown, rowKey: string, index: number): string {
  const v = (row as Record<string, unknown>)[rowKey];
  return v != null ? String(v) : String(index);
}

function getValue(row: unknown, field?: string): unknown {
  if (!field) return undefined;
  return (row as Record<string, unknown>)[field];
}

function buildPageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (
    let p = Math.max(2, page - 1);
    p <= Math.min(totalPages - 1, page + 1);
    p++
  ) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function DataTable({
  columns,
  data: localData,
  fetchFn,
  tableType = "pagination",
  pageSize: pageSizeProp = 20,
  pageSizeOptions,
  filterKey,
  loading: externalLoading,
  maxBodyHeight = 480,
  emptyTitle = "No results",
  emptyDescription = "Nothing to show yet.",
  emptyIcon,
  emptyAction,
  onRowClick,
  rowKey = "id",
  onVisibleRowsChange,
  className,
}: DataTableProps) {
  const isRemote = Boolean(fetchFn);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const [fetchSpec, setFetchSpec] = useState<FetchSpec>({
    page: 1,
    pageSize: pageSizeProp,
    nonce: 0,
  });
  const [remoteData, setRemoteData] = useState<unknown[]>([]);
  const [accData, setAccData] = useState<unknown[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const fetchGenRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevFilterKeyRef = useRef<string | number | undefined>(filterKey);

  // Reset to page 1 when filterKey changes
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    if (tableType === "infiniteScroll") setAccData([]);
    setFetchSpec((s) => ({ ...s, page: 1, nonce: s.nonce + 1 }));
  }, [filterKey, tableType]);

  // Remote fetch
  useEffect(() => {
    if (!fetchFnRef.current) return;
    const gen = ++fetchGenRef.current;
    setFetching(true);
    void fetchFnRef
      .current({ page: fetchSpec.page, pageSize: fetchSpec.pageSize })
      .then(({ data, lastPage: lp }) => {
        if (gen !== fetchGenRef.current) return;
        if (tableType === "infiniteScroll") {
          setAccData((prev) =>
            fetchSpec.page === 1 ? data : [...prev, ...data]
          );
        } else {
          setRemoteData(data);
        }
        setLastPage(lp);
      })
      .catch(() => {
        /* errors handled by caller */
      })
      .finally(() => {
        if (gen === fetchGenRef.current) setFetching(false);
      });
  }, [fetchSpec, tableType]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (tableType !== "infiniteScroll" || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !fetching &&
          fetchSpec.page < lastPage
        ) {
          setFetchSpec((s) => ({ ...s, page: s.page + 1 }));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tableType, fetching, fetchSpec.page, lastPage]);

  const displayedRows = useMemo(() => {
    if (isRemote) {
      return tableType === "infiniteScroll" ? accData : remoteData;
    }
    if (!localData) return [];
    if (tableType === "pagination") {
      const start = (fetchSpec.page - 1) * fetchSpec.pageSize;
      return localData.slice(start, start + fetchSpec.pageSize);
    }
    return localData;
  }, [
    isRemote,
    tableType,
    accData,
    remoteData,
    localData,
    fetchSpec.page,
    fetchSpec.pageSize,
  ]);

  // Notify parent of visible rows (for select-all etc.)
  const onVisibleRowsChangeRef = useRef(onVisibleRowsChange);
  onVisibleRowsChangeRef.current = onVisibleRowsChange;
  useEffect(() => {
    onVisibleRowsChangeRef.current?.(displayedRows);
  }, [displayedRows]);

  const totalPages = useMemo(() => {
    if (isRemote) return lastPage;
    if (!localData || tableType !== "pagination") return 1;
    return Math.max(1, Math.ceil(localData.length / fetchSpec.pageSize));
  }, [isRemote, lastPage, localData, tableType, fetchSpec.pageSize]);

  const isLoading = externalLoading !== undefined ? externalLoading : fetching;
  const isEmpty = !isLoading && displayedRows.length === 0;

  const maxHeightStyle =
    typeof maxBodyHeight === "number" ? `${maxBodyHeight}px` : maxBodyHeight;

  const goToPage = useCallback(
    (p: number) => {
      setFetchSpec((s) => ({
        ...s,
        page: Math.max(1, Math.min(p, totalPages)),
      }));
    },
    [totalPages]
  );

  const pageNumbers = useMemo(
    () => buildPageNumbers(fetchSpec.page, totalPages),
    [fetchSpec.page, totalPages]
  );

  const showPagination =
    tableType === "pagination" &&
    (isRemote ? totalPages > 0 : (localData?.length ?? 0) > 0 || isLoading);

  return (
    <div className={`${styles.root} ${className ?? ""}`.trim()}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                style={{
                  width: col.width,
                  minWidth: col.minWidth,
                  textAlign:
                    (col.align as React.CSSProperties["textAlign"]) ?? "left",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div
        className={styles.scrollArea}
        style={{
          maxHeight: maxHeightStyle,
          minHeight: (isLoading && displayedRows.length === 0) ? 300 : undefined,
        }}
      >
        <table className={styles.table}>
          <tbody className={styles.tbody}>
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <TableEmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon}
                    action={emptyAction}
                    embedded
                  />
                </td>
              </tr>
            ) : (
              displayedRows.map((row, idx) => {
                const key = getRowKey(row, rowKey, idx);
                return (
                  <tr
                    key={key}
                    className={`${styles.tr} ${onRowClick ? styles.trClickable : ""}`.trim()}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => {
                      const val = getValue(row, col.field);
                      const content = col.render
                        ? col.render(val, row, idx)
                        : val != null
                          ? String(val)
                          : "-";
                      return (
                        <td
                          key={col.key}
                          className={`${styles.td} ${col.className ?? ""}`.trim()}
                          style={{
                            width: col.width,
                            minWidth: col.minWidth,
                            textAlign:
                              (col.align as React.CSSProperties["textAlign"]) ??
                              "left",
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
            {tableType === "infiniteScroll" && !isEmpty && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ padding: 0, border: 0 }}>
                  <div ref={sentinelRef} style={{ height: 1 }} />
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <TableLoadingOverlay />
          </div>
        )}

        {tableType === "infiniteScroll" && fetching && !isEmpty && (
          <div className={styles.infiniteLoader}>
            <TableLoadingOverlay />
          </div>
        )}
      </div>

      {showPagination && (
        <div className={styles.pagination}>
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <select
              className={styles.pageSizeSelect}
              value={fetchSpec.pageSize}
              onChange={(e) => {
                setFetchSpec((s) => ({
                  ...s,
                  page: 1,
                  pageSize: Number(e.target.value),
                  nonce: s.nonce + 1,
                }));
              }}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          )}
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(fetchSpec.page - 1)}
              disabled={fetchSpec.page <= 1 || isLoading}
              aria-label="Previous page"
            >
              ‹ Prev
            </button>
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${
                    p === fetchSpec.page ? styles.pageBtnActive : ""
                  }`.trim()}
                  onClick={() => goToPage(p)}
                  disabled={isLoading}
                  aria-current={p === fetchSpec.page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(fetchSpec.page + 1)}
              disabled={fetchSpec.page >= totalPages || isLoading}
              aria-label="Next page"
            >
              Next ›
            </button>
          </div>
          {totalPages > 0 && (
            <span className={styles.pageInfo}>
              {fetchSpec.page} / {totalPages}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
