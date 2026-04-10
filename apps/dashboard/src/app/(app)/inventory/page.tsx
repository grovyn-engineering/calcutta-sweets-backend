import InventoryTable from "@/components/InventoryTable/InventoryTable";

import styles from "./InventoryPage.module.css";

export default function InventoryPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Stock &amp; variants</p>
      </header>
      <div className={styles.surface}>
        <InventoryTable />
      </div>
    </div>
  );
}
