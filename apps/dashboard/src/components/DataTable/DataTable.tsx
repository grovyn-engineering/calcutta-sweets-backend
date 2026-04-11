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

import { EmptyState } from "@/components/EmptyState/EmptyState";

import { LoadingDots } from "@/components/LoadingDots/LoadingDots";

type DataTableProps = {
  columns: ColumnDefinition[];
  options?: ReactTabulatorOptions;
  data?: any[];
  onRef?: (instanceRef: { current?: any }) => void;
  emptyState?: React.ReactNode;
};

export function DataTable({ columns, options, data, onRef, emptyState }: DataTableProps) {
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const internalRef = React.useRef<any>(null);

  const internalOptions = useMemo(() => ({
    layout: "fitDataFill",
    dataLoader: false, // We use our own overlay
    ...options,
    ajaxRequesting: () => {
      setLoading(true);
      setIsEmpty(false);
    },
    dataLoaded: () => {
      setLoading(false);
      if (internalRef.current) {
        setIsEmpty(internalRef.current.getDataCount() === 0);
      }
    },
    ajaxResponse: (_url: string, _params: any, response: any) => {
      // Still set loading false here in case dataLoaded doesn't catch everything
      setLoading(false);
      return response;
    },
    ajaxError: () => {
      setLoading(false);
      setIsEmpty(true);
    },
    dataChanged: (data: any[]) => {
      setIsEmpty(data.length === 0);
    }
  }), [options]);

  const handleRef = (ref: { current: any }) => {
    internalRef.current = ref.current;
    if (onRef) onRef(ref);
  };

  return (
    <div className={styles.tableWrapper} style={{ position: 'relative' }}>
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
          background: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LoadingDots />
        </div>
      )}
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
          padding: '20px'
        }}>
          {emptyState}
        </div>
      )}
    </div>
  );
}
