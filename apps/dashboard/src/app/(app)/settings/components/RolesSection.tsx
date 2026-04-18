"use client";

import { useMemo, useState } from "react";
import { Checkbox, Form, Select, Button, message, Tag } from "antd";
import { ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { PERMISSION_ROWS } from "../../../../lib/rolePermissions";
import type { RolePermissions } from "../../../../contexts/AuthContext";
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
  const { user, permissions } = useAuth();
  const [roleLoading, setRoleLoading] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [permForm] = Form.useForm<{ keys: string[] }>();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const roleTagClass = useMemo(
    () =>
      `${styles.roleTag} ${isSuperAdmin ? styles.roleTagSuper : styles.roleTagDefault}`,
    [isSuperAdmin],
  );

  const requestablePermissions = useMemo(() => {
    if (!permissions) return [];
    return PERMISSION_ROWS.filter((row) => {
      if (row.key === "canAccessDashboard") return false;
      return !permissions[row.key];
    });
  }, [permissions]);

  const permissionOptions = useMemo(
    () =>
      requestablePermissions.map((row) => ({
        label: row.label,
        value: row.key,
      })),
    [requestablePermissions],
  );

  const onRoleFinish = async (values: { requestedRole: string }) => {
    setRoleLoading(true);
    try {
      const res = await apiFetch("/role-requests", {
        method: "POST",
        body: JSON.stringify({
          kind: "ROLE_CHANGE",
          requestedRole: values.requestedRole,
        }),
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
      setRoleLoading(false);
    }
  };

  const onPermissionFinish = async (values: { keys: string[] }) => {
    const keys = values.keys ?? [];
    if (keys.length === 0) {
      message.warning("Select at least one area to request access to.");
      return;
    }
    const requestedPermissions: Partial<Record<keyof RolePermissions, boolean>> =
      {};
    for (const k of keys) {
      requestedPermissions[k as keyof RolePermissions] = true;
    }
    setPermLoading(true);
    try {
      const res = await apiFetch("/role-requests", {
        method: "POST",
        body: JSON.stringify({
          kind: "PERMISSION_EXTENSION",
          requestedPermissions,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err?.message === "string"
            ? err.message
            : "Failed to submit permission request",
        );
      }
      message.success(
        "Permission request sent. A super admin will review it and you’ll get an update by email.",
      );
      permForm.resetFields();
    } catch (e: unknown) {
      message.error(
        e instanceof Error ? e.message : "Could not submit your request.",
      );
    } finally {
      setPermLoading(false);
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
              Super Admins manage shops, users, and access requests. Use{" "}
              <strong>Role & Permissions Management</strong> below to approve
              others.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Form
            layout="vertical"
            onFinish={onRoleFinish}
            className={styles.form}
          >
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionIcon} aria-hidden>
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className={styles.sectionTitle}>Different role</span>
            </div>
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
              loading={roleLoading}
              size="large"
              className={`${styles.submit} w-full md:w-auto`}
              style={{
                backgroundColor: "var(--ochre-600)",
                borderColor: "var(--ochre-600)",
              }}
            >
              Submit role request
            </Button>
          </Form>

          {permissionOptions.length > 0 ? (
            <div className={styles.permissionBlock}>
              <Form
                form={permForm}
                layout="vertical"
                onFinish={onPermissionFinish}
                className={styles.form}
              >
                <div className={styles.sectionTitleRow}>
                  <span className={styles.sectionIcon} aria-hidden>
                    <KeyRound className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className={styles.sectionTitle}>
                    Extra access (same role)
                  </span>
                </div>
                <p className={styles.permissionIntro}>
                  Turn on areas you need for your work without changing your
                  job title. Only options you don’t have yet are listed.
                </p>
                <Form.Item
                  name="keys"
                  rules={[
                    {
                      validator: async (_, value: string[] | undefined) => {
                        if (value && value.length > 0) return;
                        throw new Error("Choose one or more areas");
                      },
                    },
                  ]}
                  extra="Super admin can approve each request. You can only have one pending request at a time (role or permissions)."
                >
                  <Checkbox.Group
                    className={styles.checkboxGroup}
                    options={permissionOptions}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={permLoading}
                  size="large"
                  className={`${styles.submit} w-full md:w-auto`}
                  style={{
                    backgroundColor: "var(--ochre-600)",
                    borderColor: "var(--ochre-600)",
                  }}
                >
                  Submit permission request
                </Button>
              </Form>
            </div>
          ) : (
            <div className={styles.allAccessNote}>
              <p className={styles.allAccessText}>
                For your current role, you already have every optional area the
                team can grant here. Ask a super admin if you need something
                else.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
