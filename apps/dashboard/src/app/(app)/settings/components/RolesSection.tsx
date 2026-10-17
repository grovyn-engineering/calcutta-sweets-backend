"use client";

import { useMemo, useState } from "react";
import { Checkbox, Form, Select, Button, message, Tag } from "antd";
import { Check, KeyRound, Lock, ShieldCheck } from "lucide-react";
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
      {/* Who you are */}
      <div className={styles.roleRow}>
        <div>
          <p className={styles.eyebrow}>Current role</p>
          <Tag className={roleTagClass}>{formatRole(user?.role)}</Tag>
        </div>
        {isSuperAdmin ? (
          <p className={styles.roleNote}>
            Super Admins manage shops, users and access.{" "}
            <a href="#access-requests" className={styles.inlineLink}>
              Review access requests
            </a>
          </p>
        ) : null}
      </div>

      {/* What you can do */}
      <div>
        <h3 className={styles.blockTitle}>What you can access</h3>
        <ul className={styles.accessList}>
          {PERMISSION_ROWS.map((row) => {
            const allowed = isSuperAdmin || Boolean(permissions?.[row.key]);
            return (
              <li
                key={row.key}
                className={`${styles.accessItem} ${allowed ? "" : styles.accessItemOff}`.trim()}
              >
                {allowed ? (
                  <Check className={styles.accessIconOn} aria-hidden />
                ) : (
                  <Lock className={styles.accessIconOff} aria-hidden />
                )}
                <span>{row.label}</span>
                <span className="sr-only">{allowed ? "allowed" : "not included"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {isSuperAdmin ? null : (
        <div>
          <h3 className={styles.blockTitle}>Need more access?</h3>
          <p className={styles.blockHint}>
            Requests go to a super admin, and you&apos;ll get an email when they decide. You can
            have one pending request at a time.
          </p>
          <div className={styles.requestGrid}>
            <Form layout="vertical" onFinish={onRoleFinish} className={styles.requestCard} requiredMark={false}>
              <div className={styles.requestHead}>
                <ShieldCheck className={styles.requestIcon} strokeWidth={1.8} aria-hidden />
                <div>
                  <p className={styles.requestTitle}>Change your role</p>
                  <p className={styles.requestDesc}>For a new job title, e.g. Cashier to Manager.</p>
                </div>
              </div>
              <Form.Item
                label="New role"
                name="requestedRole"
                rules={[{ required: true, message: "Choose a role" }]}
              >
                <Select
                  placeholder="Select role"
                  className="w-full"
                  options={[
                    { value: "MANAGER", label: "Manager" },
                    { value: "CASHIER", label: "Cashier" },
                    { value: "ADMIN", label: "Admin" },
                  ].filter((o) => o.value !== user?.role)}
                />
              </Form.Item>
              <div className={styles.requestFooter}>
                <Button type="primary" htmlType="submit" loading={roleLoading}>
                  Send role request
                </Button>
              </div>
            </Form>

            <Form
              form={permForm}
              layout="vertical"
              onFinish={onPermissionFinish}
              className={styles.requestCard}
              requiredMark={false}
            >
              <div className={styles.requestHead}>
                <KeyRound className={styles.requestIcon} strokeWidth={1.8} aria-hidden />
                <div>
                  <p className={styles.requestTitle}>Add areas to your role</p>
                  <p className={styles.requestDesc}>Keep your role and unlock specific screens.</p>
                </div>
              </div>
              {permissionOptions.length > 0 ? (
                <>
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
                  >
                    <Checkbox.Group className={styles.checkboxGroup} options={permissionOptions} />
                  </Form.Item>
                  <div className={styles.requestFooter}>
                    <Button type="primary" htmlType="submit" loading={permLoading}>
                      Send access request
                    </Button>
                  </div>
                </>
              ) : (
                <p className={styles.allAccessText}>
                  Your role already includes every area that can be added here. Ask a super admin if
                  you need something else.
                </p>
              )}
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
