import InventoryTable from "@/components/InventoryTable/InventoryTable";

import styles from "./InventoryPage.module.css";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const { filter } = await searchParams;
  return (
    <div className={styles.page}>
      <InventoryTable initialLowStock={filter === "low-stock"} />
    </div>
  );
}
