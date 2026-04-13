import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./DataTable.module.css";

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
  { ssr: false, loading: () => <TableSkeleton /> }
);

import { LoadingDots } from "@/components/LoadingDots/LoadingDots";

type DataTableProps = {
  columns: ColumnDefinition[];
  options?: ReactTabulatorOptions;
  data?: any[];
  onRef?: (instanceRef: { current?: any }) => void;
  emptyState?: React.ReactNode;
  minHeight?: number | string;
};

export function DataTable({ columns, options, data, onRef, emptyState, minHeight = 400 }: DataTableProps) {
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAjaxInFlight = React.useRef(false);
  const internalRef = React.useRef<any>(null);

  // Convert numeric minHeight to px
  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;

  const internalOptions = useMemo(() => ({
    layout: "fitDataFill",
    dataLoader: false, // We use our own overlay
    ...options,
    ajaxRequesting: () => {
      isAjaxInFlight.current = true;
      setLoading(true);
      setIsEmpty(false);
    },
    dataLoaded: (data: any[]) => {
      setLoading(false);
      setIsEmpty(data.length === 0);
    },
    ajaxResponse: (_url: string, _params: any, response: any) => {
      isAjaxInFlight.current = false;
      // Fallback: hide loader after data arrives, even if events are missed
      setTimeout(() => setLoading(false), 100);
      return response;
    },
    renderComplete: () => {
      setLoading(false);
    },
    ajaxError: () => {
      isAjaxInFlight.current = false;
      setLoading(false);
      setIsEmpty(true);
    },
    // Remove dataChanged listener for isEmpty as it triggers too often
    // causing overlays during internal Tabulator state changes.
  }), [options]);

  const handleRef = (ref: { current: any }) => {
    internalRef.current = ref.current;
    if (onRef) onRef(ref);
  };

  return (
    <div
      className={styles.tableWrapper}
      style={{
        position: 'relative',
        '--table-min-height': minHeightStyle
      } as React.CSSProperties}
    >
      <ReactTabulator
        columns={columns}
        options={internalOptions}
        data={data}
        onRef={handleRef}
      />

      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px'
        }}>
          <LoadingDots />
        </div>
      )}

      {/* Only show empty state if NOT loading and data is empty */}
      {!loading && isEmpty && emptyState && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          background: 'var(--parchment)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          borderRadius: '16px'
        }}>
          {emptyState}
        </div>
      )}
    </div>
  );
}
