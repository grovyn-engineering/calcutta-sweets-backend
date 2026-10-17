"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Crown,
  IdCard,
  Percent,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { PersonalDetails } from "./components/PersonalDetails";
import { SecuritySection } from "./components/SecuritySection";
import { RolesSection } from "./components/RolesSection";
import { TaxSettings } from "./components/TaxSettings";
import { ShopProfileSettings } from "./components/ShopProfileSettings";
import { RoleRequestsAdmin } from "./components/RoleRequestsAdmin";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./SettingsPage.module.css";

type SectionGroup = "Account" | "Shop" | "Administration";

type Section = {
  /** Also the URL hash, so a section can be linked to and survives reload. */
  id: string;
  group: SectionGroup;
  label: string;
  description: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
};

const GROUP_ORDER: SectionGroup[] = ["Account", "Shop", "Administration"];

function readHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAtLeastManager =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "MANAGER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Same sections, in the same order, as the previous tab strip.
  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [
      {
        id: "profile",
        group: "Account",
        label: "Personal details",
        description: "Your name, mobile number and photo as they appear across the app.",
        icon: User,
        render: () => <PersonalDetails />,
      },
      {
        id: "security",
        group: "Account",
        label: "Security",
        description: "Change your password and keep your account protected.",
        icon: Shield,
        render: () => <SecuritySection />,
      },
      {
        id: "roles",
        group: "Account",
        label: "Your roles & permissions",
        description: "What your role can do, and requests for a different role or extra access.",
        icon: IdCard,
        render: () => <RolesSection />,
      },
    ];
    if (isAtLeastManager) {
      list.push({
        id: "tax",
        group: "Shop",
        label: "Tax configuration",
        description: "GST rates applied to bills for the active shop.",
        icon: Percent,
        render: () => <TaxSettings />,
      });
    }
    if (isSuperAdmin) {
      list.push(
        {
          id: "shop",
          group: "Shop",
          label: "Shop profile",
          description: "Business details for the active shop, including what prints on bills.",
          icon: Building2,
          render: () => <ShopProfileSettings />,
        },
        {
          id: "access-requests",
          group: "Administration",
          label: "Role & permissions management",
          description: "Review staff requests for role changes and extra permissions.",
          icon: Crown,
          render: () => <RoleRequestsAdmin />,
        },
      );
    }
    return list;
  }, [isAtLeastManager, isSuperAdmin]);

  const [activeId, setActiveId] = useState("profile");

  // Restore the section from the URL on mount and on back/forward.
  useEffect(() => {
    const sync = () => {
      const fromHash = readHash();
      if (fromHash) setActiveId(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  const select = (id: string) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: sections.filter((s) => s.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1>Settings</h1>
        <p className={styles.pageLead}>Manage your account and, where you have access, this shop.</p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Settings sections">
          {grouped.map(({ group, items }) => (
            <div key={group} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group}</p>
              <ul className={styles.navList}>
                {items.map((s) => {
                  const Icon = s.icon;
                  const isActive = s.id === active.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`.trim()}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => select(s.id)}
                      >
                        <Icon className={styles.navIcon} strokeWidth={1.8} aria-hidden />
                        <span>{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <section className={styles.panel} aria-labelledby="settings-section-title">
          <header className={styles.panelHeader}>
            <h2 id="settings-section-title" className={styles.panelTitle}>
              {active.label}
            </h2>
            <p className={styles.panelDescription}>{active.description}</p>
          </header>
          {/* key remounts the section when switching, so unsaved edits never leak across */}
          <div key={active.id} className={styles.panelBody}>
            {active.render()}
          </div>
        </section>
      </div>
    </div>
  );
}
