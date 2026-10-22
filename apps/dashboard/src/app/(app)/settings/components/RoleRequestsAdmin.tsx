"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, message, Tag } from "antd";
import { Check, Crown, X } from "lucide-react";
import { apiFetch } from "../../../../lib/api";
import { DataTable, type AppTableColumn } from "@/components/DataTable/DataTable";
import { PERMISSION_ROWS } from "../../../../lib/rolePermissions";
import type { RolePermissions } from "../../../../contexts/AuthContext";
import styles from "./RoleRequestsAdmin.module.css";

const PERM_LABEL: Partial<Record<keyof RolePermissions, string>> =
  PERMISSION_ROWS.reduce(
    (acc, row) => {
      acc[row.key] = row.label;
      return acc;
    },
    {} as Partial<Record<keyof RolePermissions, string>>,
  );

type RoleRequestRow = {
  id: string;
  kind?: string;
  requestedRole: string | null;
  requestedPermissions?: Record<string, boolean> | null;
  createdAt: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

function formatRole(role?: string | null): string {
  if (!role) return "Staff";
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function renderRequested(record: RoleRequestRow) {
  if (record.kind === "PERMISSION_EXTENSION" && record.requestedPermissions) {
    const keys = Object.entries(record.requestedPermissions).filter(
      ([, v]) => v === true,
    );
    if (keys.length === 0) {
      return <span className={styles.muted}>Extra permissions</span>;
    }
    return (
      <div className={styles.permList}>
        {keys.map(([k]) => (
          <Tag key={k} className="m-0">
            {PERM_LABEL[k as keyof RolePermissions] ?? k}
          </Tag>
        ))}
      </div>
    );
  }
  return (
    <span className={styles.roleChange}>
      <span className={styles.roleTarget}>{formatRole(record.requestedRole)}</span>
    </span>
  );
}

export function RoleRequestsAdmin() {
  const [requests, setRequests] = useState<RoleRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const fetchGenRef = useRef(0);

  const fetchRequests = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    setLoading(true);
    try {
      const res = await apiFetch("/role-requests");
      if (gen !== fetchGenRef.current) return;
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setRequests([]);
        message.error("Could not load role requests");
      }
    } catch {
      if (gen === fetchGenRef.current) {
        message.error("Failed to load role requests");
        setRequests([]);
      }
    } finally {
      if (gen === fetchGenRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setPendingAction({ id, action });
    try {
      const res = await apiFetch(`/role-requests/${id}/${action}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err?.message === "string"
            ? err.message
            : `Failed to ${action} request`,
        );
      }
      message.success(
        action === "approve" ? "Request approved" : "Request rejected",
      );
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPendingAction(null);
      // Reload either way: a request can be saved even when the response errors
      // (e.g. the notification email fails), so show the server's real state.
      await fetchRequests();
    }
  };

  const columns: AppTableColumn[] = [
    {
      key: "user",
      label: "Team member",
      minWidth: 200,
      render: (_, row) => {
        const record = row as RoleRequestRow;
        const name =
          record.user?.name?.trim() || record.user?.email?.trim() || "Unknown";
        const email = record.user?.email?.trim();
        return (
          <div className={styles.person}>
            <span className={styles.personAvatar} aria-hidden>
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className={styles.userCell}>{name}</span>
              {email && email !== name ? (
                <span className={styles.secondaryLine}>{email}</span>
              ) : null}
            </span>
          </div>
        );
      },
    },
    {
      key: "change",
      label: "Request",
      minWidth: 240,
      render: (_, row) => {
        const record = row as RoleRequestRow;
        const isPermissions = record.kind === "PERMISSION_EXTENSION";
        return (
          <div>
            <span className={styles.requestKind}>
              {isPermissions ? "Extra permissions" : "Role change"} · from{" "}
              {formatRole(record.user?.role)}
            </span>
            <div className={styles.requestValue}>{renderRequested(record)}</div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Requested",
      width: 130,
      render: (_, row) =>
        new Date((row as RoleRequestRow).createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      label: "",
      width: 200,
      align: "right",
      render: (_, row) => {
        const record = row as RoleRequestRow;
        const busy = pendingAction?.id === record.id;
        return (
          <div className={styles.actions}>
            <Button
              size="small"
              icon={<X className="h-3.5 w-3.5" aria-hidden />}
              disabled={busy && pendingAction?.action !== "reject"}
              loading={busy && pendingAction?.action === "reject"}
              onClick={() => handleAction(record.id, "reject")}
            >
              Reject
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<Check className="h-3.5 w-3.5" aria-hidden />}
              disabled={busy && pendingAction?.action !== "approve"}
              loading={busy && pendingAction?.action === "approve"}
              onClick={() => handleAction(record.id, "approve")}
            >
              Approve
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.root}>
      {requests.length > 0 ? (
        <p className={styles.summary}>
          {requests.length} pending request{requests.length === 1 ? "" : "s"}
        </p>
      ) : null}
      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        pageSize={8}
        maxBodyHeight="none"
        emptyTitle="No pending access requests"
        emptyDescription="When team members ask for a different role or extra permissions, the requests show up here for you to approve or reject."
        emptyIcon={<Crown strokeWidth={1.6} aria-hidden />}
      />
    </div>
  );
}
