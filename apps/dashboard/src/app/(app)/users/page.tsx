import { Users } from "lucide-react";

import UsersManagement from "@/components/UsersManagement/UsersManagement";

import styles from "./page.module.css";

export default function UsersPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroIcon} aria-hidden>
          <Users className={styles.heroIconSvg} strokeWidth={1.75} />
        </div>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>User management</p>
          <h1 className={styles.title}>Team &amp; access</h1>
          <p className={styles.subtitle}>
            Invite staff, assign roles, and control which shop each account belongs
            to. The table below reflects the{" "}
            <strong className={styles.subtitleStrong}>shop selected in the header</strong>
            - switch shops anytime to manage another location.
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label="User directory">
        <UsersManagement />
      </section>
    </div>
  );
}
