"use client";

import { Collapse } from "antd";
import {
  Building2,
  ChevronDown,
  Crown,
  IdCard,
  Percent,
  Shield,
  User,
} from "lucide-react";
import { PersonalDetails } from "./components/PersonalDetails";
import { SecuritySection } from "./components/SecuritySection";
import { RolesSection } from "./components/RolesSection";
import { TaxSettings } from "./components/TaxSettings";
import { ShopProfileSettings } from "./components/ShopProfileSettings";
import { RoleRequestsAdmin } from "./components/RoleRequestsAdmin";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./SettingsPage.module.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAtLeastManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "MANAGER";

  const items: any[] = [
    {
      key: '1',
      label: (
        <span className={styles.panelLabel}>
          <User className={`h-[1.125rem] w-[1.125rem] ${styles.panelIcon}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Personal Details</span>
        </span>
      ),
      children: <PersonalDetails />
    },
    {
      key: '2',
      label: (
        <span className={styles.panelLabel}>
          <Shield className={`h-[1.125rem] w-[1.125rem] ${styles.panelIcon}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Security</span>
        </span>
      ),
      children: <SecuritySection />
    },
    {
      key: '3',
      label: (
        <span className={styles.panelLabel}>
          <IdCard className={`h-[1.125rem] w-[1.125rem] ${styles.panelIcon}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Your Roles & Permissions</span>
        </span>
      ),
      children: <RolesSection />
    }
  ];

  if (isAtLeastManager) {
    items.push({
      key: '5',
      label: (
        <span className={styles.panelLabel}>
          <Percent className={`h-[1.125rem] w-[1.125rem] ${styles.panelIconTax}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Tax Configuration</span>
        </span>
      ),
      children: <TaxSettings />
    });
  }

  if (user?.role === "SUPER_ADMIN") {
    items.push({
      key: '6',
      label: (
        <span className={styles.panelLabel}>
          <Building2 className={`h-[1.125rem] w-[1.125rem] ${styles.panelIcon}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Shop profile</span>
        </span>
      ),
      children: <ShopProfileSettings />
    });
  }

  if (user?.role === "SUPER_ADMIN") {
    items.push({
      key: '4',
      label: (
        <span className={styles.panelLabel}>
          <Crown className={`h-[1.125rem] w-[1.125rem] ${styles.panelIconAdmin}`} strokeWidth={1.75} aria-hidden />
          <span className={styles.panelTitle}>Role & Permissions Management</span>
        </span>
      ),
      children: <RoleRequestsAdmin />
    });
  }

  return (
    <div className={styles.root}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Account & Profile</p>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.lede}>
          Manage your personal details, security preferences, and system roles.
        </p>
      </header>

      <div className={styles.scroll}>
        <Collapse
          accordion={false}
          defaultActiveKey={['1']}
          items={items}
          className={styles.collapse}
          bordered={false}
          expandIconPlacement="end"
          expandIcon={({ isActive }) => (
            <ChevronDown
              className={styles.collapseChevron}
              size={18}
              strokeWidth={2}
              aria-hidden
              style={{
                transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          )}
        />
      </div>
    </div>
  );
}
