"use client";

import { Collapse } from "antd";
import { UserOutlined, SafetyCertificateOutlined, IdcardOutlined, CrownOutlined } from "@ant-design/icons";
import { PersonalDetails } from "./components/PersonalDetails";
import { SecuritySection } from "./components/SecuritySection";
import { RolesSection } from "./components/RolesSection";
import { RoleRequestsAdmin } from "./components/RoleRequestsAdmin";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./SettingsPage.module.css";

export default function SettingsPage() {
  const { user } = useAuth();

  const items: any[] = [
    {
      key: '1',
      label: (
        <span className={styles.panelLabel}>
          <UserOutlined className="text-gray-400" />
          <span className={styles.panelTitle}>Personal Details</span>
        </span>
      ),
      children: <PersonalDetails />
    },
    {
      key: '2',
      label: (
        <span className={styles.panelLabel}>
          <SafetyCertificateOutlined className="text-gray-400" />
          <span className={styles.panelTitle}>Security</span>
        </span>
      ),
      children: <SecuritySection />
    },
    {
      key: '3',
      label: (
        <span className={styles.panelLabel}>
          <IdcardOutlined className="text-gray-400" />
          <span className={styles.panelTitle}>Roles & Scopes</span>
        </span>
      ),
      children: <RolesSection />
    }
  ];

  if (user?.role === "SUPER_ADMIN") {
    items.push({
      key: '4',
      label: (
        <span className={styles.panelLabel}>
          <CrownOutlined className="text-indigo-400" />
          <span className={styles.panelTitle}>Role Requests Management</span>
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
        />
      </div>
    </div>
  );
}
