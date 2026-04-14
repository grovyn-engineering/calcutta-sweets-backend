"use client";

import { useMemo, useState } from "react";
import { Form, Select, Button, message, Tag } from "antd";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import styles from "./RolesSection.module.css";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  CASHIER: "Cashier",
  STAFF: "Staff",
};

function formatRole(role: string | undefined): string {
  if (!role) return "Not set";
  return ROLE_LABEL[role] ?? role.replace(/_/g, " ");
}

export function RolesSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const roleTagClass = useMemo(
    () =>
      `${styles.roleTag} ${isSuperAdmin ? styles.roleTagSuper : styles.roleTagDefault}`,
    [isSuperAdmin],
  );

  const onFinish = async (values: { requestedRole: string }) => {
    setLoading(true);
    try {
      const res = await apiFetch("/role-requests", {
        method: "POST",
        body: JSON.stringify({ requestedRole: values.requestedRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err?.message === "string"
            ? err.message
            : "Failed to submit role request",
        );
      }
      message.success(
        "Request sent. A super admin will review it and you’ll get an update by email.",
      );
    } catch (e: unknown) {
      message.error(
        e instanceof Error ? e.message : "Could not submit your request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.currentCard}>
        <p className={styles.currentLabel}>Your role today</p>
        <div className={styles.currentRow}>
          <Tag className={roleTagClass}>{formatRole(user?.role)}</Tag>
        </div>
      </div>

      {isSuperAdmin ? (
        <div className={styles.callout}>
          <div className={styles.calloutIcon} aria-hidden>
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className={styles.calloutBody}>
            <p className={styles.calloutTitle}>Full access</p>
            <p className={styles.calloutDesc}>
              Super Admins manage shops, users, and role requests. You don’t
              need to request a different role-use{" "}
              <strong>Role Requests Management</strong> below to approve
              others.
            </p>
          </div>
        </div>
      ) : (
        <Form layout="vertical" onFinish={onFinish} className={styles.form}>
          <div className={styles.grid}>
            <Form.Item
              label="Request a different role"
              name="requestedRole"
              rules={[{ required: true, message: "Choose a role" }]}
              extra="Your super admin will approve or decline this request."
            >
              <Select
                placeholder="Select role"
                size="large"
                className={`w-full ${styles.select}`}
                options={[
                  { value: "MANAGER", label: "Manager" },
                  { value: "CASHIER", label: "Cashier" },
                  { value: "ADMIN", label: "Admin" },
                ]}
              />
            </Form.Item>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className={`${styles.submit} w-full md:w-auto`}
            style={{
              backgroundColor: "var(--ochre-600)",
              borderColor: "var(--ochre-600)",
            }}
          >
            Submit request
          </Button>
        </Form>
      )}
    </div>
  );
}
