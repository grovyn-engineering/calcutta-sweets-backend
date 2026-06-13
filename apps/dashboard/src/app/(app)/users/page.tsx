import { Users } from "lucide-react";

import UsersManagement from "@/components/UsersManagement/UsersManagement";

import styles from "./page.module.css";

export default function UsersPage() {
  return (
    <div className={styles.page}>
      <UsersManagement />
    </div>
  );
}
