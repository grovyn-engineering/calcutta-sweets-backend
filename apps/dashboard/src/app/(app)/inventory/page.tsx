import InventoryTable from "@/components/InventoryTable/InventoryTable";

import styles from "./InventoryPage.module.css";

export default function InventoryPage() {
  return (
    <div className={styles.page}>
      <InventoryTable />
    </div>
  );
}
