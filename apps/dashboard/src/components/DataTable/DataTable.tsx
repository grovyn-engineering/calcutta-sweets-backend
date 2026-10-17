"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableEmptyState } from "./TableDataOverlay";
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
  // Remote data: the component manages page state, calls this when page/filterKey changes
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

/** Clicks on these inside a row act on the control, not the row. */
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [role="checkbox"], [data-row-click="ignore"]';

const SKELETON_ROWS = 8;

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

function alignClass(align: AppTableColumn["align"]): string {
  if (align === "right") return styles.alignRight;
  if (align === "center") return styles.alignCenter;
  return "";
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
  // Declared before the fetch effect so it always sees the latest fetchFn.
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  const [fetchSpec, setFetchSpec] = useState<FetchSpec>({
    page: 1,
    pageSize: pageSizeProp,
    nonce: 0,
  });
  const [remoteData, setRemoteData] = useState<unknown[]>([]);
  const [accData, setAccData] = useState<unknown[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  // False until the first remote response lands: drives the skeleton rows.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!isRemote);
  const fetchGenRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevFilterKeyRef = useRef<string | number | undefined>(filterKey);

  // Reset to page 1 when filterKey changes
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    if (tableType === "infiniteScroll") setAccData([]);
    setFetchSpec((s) => ({ ...s, page: 1, nonce: s.nonce + 1 }));
  }, [filterKey, tableType]);

  // Remote fetch. Previous rows stay on screen (dimmed) until the next page arrives.
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
        if (gen === fetchGenRef.current) {
          setFetching(false);
          setHasLoadedOnce(true);
        }
      });
  }, [fetchSpec, tableType]);

  // A new page (not an infinite-scroll append) starts at the top of the list.
  useEffect(() => {
    if (tableType !== "pagination") return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [fetchSpec.page, fetchSpec.pageSize, tableType]);

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
      { root: scrollRef.current, threshold: 0.1 }
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
  useEffect(() => {
    onVisibleRowsChangeRef.current = onVisibleRowsChange;
  });
  useEffect(() => {
    onVisibleRowsChangeRef.current?.(displayedRows);
  }, [displayedRows]);

  const totalPages = useMemo(() => {
    if (isRemote) return lastPage;
    if (!localData || tableType !== "pagination") return 1;
    return Math.max(1, Math.ceil(localData.length / fetchSpec.pageSize));
  }, [isRemote, lastPage, localData, tableType, fetchSpec.pageSize]);

  const isLoading = externalLoading !== undefined ? externalLoading : fetching;
  const showSkeleton =
    displayedRows.length === 0 && (isLoading || (isRemote && !hasLoadedOnce));
  const isEmpty = !showSkeleton && displayedRows.length === 0;
  // Refreshing over existing rows: keep them, dim them, show a thin progress bar.
  const isRefreshing = isLoading && displayedRows.length > 0;

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

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, row: unknown) => {
      if (!onRowClick) return;
      if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
      onRowClick(row);
    },
    [onRowClick]
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, row: unknown) => {
      if (!onRowClick || e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick(row);
      }
    },
    [onRowClick]
  );

  const rowsFrom = (fetchSpec.page - 1) * fetchSpec.pageSize + 1;
  const rowsTo = rowsFrom + displayedRows.length - 1;

  return (
    <div className={`${styles.root} ${className ?? ""}`.trim()}>
      <div
        ref={scrollRef}
        className={styles.scrollArea}
        style={{ maxHeight: maxHeightStyle }}
        aria-busy={isLoading || undefined}
      >
        {/* One table so the header and body share column widths */}
        <table className={styles.table}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{ width: col.width, minWidth: col.minWidth }}
              />
            ))}
          </colgroup>
          <thead className={styles.thead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${styles.th} ${alignClass(col.align)}`.trim()}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`${styles.tbody} ${isRefreshing ? styles.tbodyRefreshing : ""}`.trim()}
          >
            {showSkeleton ? (
              Array.from(
                { length: Math.min(fetchSpec.pageSize, SKELETON_ROWS) },
                (_, i) => (
                  <tr key={`skeleton-${i}`} className={styles.tr} aria-hidden>
                    {columns.map((col, c) => (
                      <td
                        key={col.key}
                        className={`${styles.td} ${alignClass(col.align)}`.trim()}
                      >
                        <span
                          className={styles.skeletonBar}
                          style={{ width: `${40 + ((i * 17 + c * 29) % 50)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                )
              )
            ) : isEmpty ? (
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
                    onClick={onRowClick ? (e) => handleRowClick(e, row) : undefined}
                    onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
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
                          className={`${styles.td} ${alignClass(col.align)} ${col.className ?? ""}`.trim()}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
            {tableType === "infiniteScroll" && !isEmpty && !showSkeleton && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ padding: 0, border: 0 }}>
                  <div ref={sentinelRef} style={{ height: 1 }} />
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {tableType === "infiniteScroll" && fetching && displayedRows.length > 0 && (
          <div className={styles.infiniteLoader}>Loading more…</div>
        )}
      </div>

      {/* Thin bar instead of a blurred overlay: rows stay readable while a page loads */}
      {isRefreshing && <span className={styles.progressBar} aria-hidden />}

      {showPagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationMeta}>
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <label className={styles.pageSizeLabel}>
                <span>Rows</span>
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
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {displayedRows.length > 0 && (
              <span className={styles.pageInfo}>
                {rowsFrom}–{rowsTo}
                {!isRemote && localData ? ` of ${localData.length}` : ""}
              </span>
            )}
          </div>
          <nav className={styles.pageButtons} aria-label="Pagination">
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(fetchSpec.page - 1)}
              disabled={fetchSpec.page <= 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className={styles.pageBtnIcon} aria-hidden />
              <span className={styles.pageBtnText}>Prev</span>
            </button>
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  className={`${styles.pageBtn} ${
                    p === fetchSpec.page ? styles.pageBtnActive : ""
                  }`.trim()}
                  onClick={() => goToPage(p)}
                  disabled={isLoading && p !== fetchSpec.page}
                  aria-current={p === fetchSpec.page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(fetchSpec.page + 1)}
              disabled={fetchSpec.page >= totalPages || isLoading}
              aria-label="Next page"
            >
              <span className={styles.pageBtnText}>Next</span>
              <ChevronRight className={styles.pageBtnIcon} aria-hidden />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
