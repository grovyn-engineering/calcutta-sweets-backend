"use client";

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

type DataTableProps = {
  columns: ColumnDefinition[];
  options?: ReactTabulatorOptions;
  data?: any[];
  onRef?: (instanceRef: { current?: any }) => void;
};

const LOADING_DOTS_HTML = `
  <div class="tabulator-loading-dots">
    <span class="tabulator-loading-dot"></span>
    <span class="tabulator-loading-dot"></span>
    <span class="tabulator-loading-dot"></span>
  </div>
`;

export function DataTable({ columns, options, data, onRef }: DataTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <ReactTabulator
        columns={columns}
        options={{
          layout: "fitColumns", // Standard premium default
          dataLoader: true,
          dataLoaderLoading: LOADING_DOTS_HTML,
          ...options,
        }}
        data={data}
        onRef={onRef}
      />
    </div>
  );
}
