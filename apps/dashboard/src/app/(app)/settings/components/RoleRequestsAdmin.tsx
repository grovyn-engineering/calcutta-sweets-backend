"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Table, Button, message, Space, Tag } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Crown } from "lucide-react";
import { apiFetch } from "../../../../lib/api";
import { TableEmptyState } from "@/components/DataTable/TableDataOverlay";
import { antTableOverflowComponents } from "@/components/AntTableOverflowCell/AntTableOverflowCell";
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

function renderRequested(record: RoleRequestRow) {
  if (record.kind === "PERMISSION_EXTENSION" && record.requestedPermissions) {
    const keys = Object.entries(record.requestedPermissions).filter(
      ([, v]) => v === true,
    );
    if (keys.length === 0) {
      return (
        <Tag className="m-0 rounded-md border-neutral-200 bg-neutral-50 text-neutral-700">
          Permissions
        </Tag>
      );
    }
    return (
      <Space size={[4, 4]} wrap className="max-w-[280px]">
        {keys.map(([k]) => (
          <Tag
            key={k}
            color="purple"
            className="m-0 rounded-md text-xs font-semibold"
          >
            {PERM_LABEL[k as keyof RolePermissions] ?? k}
          </Tag>
        ))}
      </Space>
    );
  }
  const role = record.requestedRole ?? "—";
  return (
    <Tag color="geekblue" className="m-0 rounded-md">
      {role}
    </Tag>
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
      await fetchRequests();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPendingAction(null);
    }
  };

  const columns = [
    {
      title: "User",
      dataIndex: ["user", "name"],
      key: "name",
      ellipsis: true,
      render: (_: unknown, record: RoleRequestRow) => {
        const name =
          record.user?.name?.trim() ||
          record.user?.email?.trim() ||
          "Unknown";
        const email = record.user?.email?.trim();
        const showEmail = email && name !== email;
        return (
          <div>
            <span className={styles.userCell}>{name}</span>
            {showEmail ? (
              <span className={styles.secondaryLine}>{email}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Current role",
      dataIndex: ["user", "role"],
      key: "currentRole",
      width: 130,
      render: (role: string) => (
        <Tag className="m-0 rounded-md border-neutral-200 bg-neutral-50 text-neutral-800">
          {role || "STAFF"}
        </Tag>
      ),
    },
    {
      title: "Type",
      key: "kind",
      width: 112,
      render: (_: unknown, record: RoleRequestRow) => (
        <Tag
          className={`m-0 rounded-md ${
            record.kind === "PERMISSION_EXTENSION"
              ? "border-violet-200 bg-violet-50 text-violet-900"
              : "border-neutral-200 bg-neutral-50 text-neutral-800"
          }`}
        >
          {record.kind === "PERMISSION_EXTENSION" ? "Permissions" : "Role"}
        </Tag>
      ),
    },
    {
      title: "Requested",
      key: "requested",
      width: 220,
      render: (_: unknown, record: RoleRequestRow) => renderRequested(record),
    },
    {
      title: "Requested on",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 128,
      render: (date: string) => (
        <span className="tabular-nums text-[var(--bistre-700)]">
          {new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: unknown, record: RoleRequestRow) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            className={styles.actionBtnApprove}
            loading={
              pendingAction?.id === record.id &&
              pendingAction.action === "approve"
            }
            onClick={() => handleAction(record.id, "approve")}
            style={{
              backgroundColor: "var(--ochre-600)",
              borderColor: "var(--ochre-600)",
            }}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            className={styles.actionBtnReject}
            loading={
              pendingAction?.id === record.id &&
              pendingAction.action === "reject"
            }
            onClick={() => handleAction(record.id, "reject")}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const hasRows = requests.length > 0;

  return (
    <div className={styles.root}>
      <Table<RoleRequestRow>
        className={`${styles.table} ${hasRows ? "" : styles.tableNoScroll}`.trim()}
        components={antTableOverflowComponents}
        dataSource={requests}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={
          hasRows ? { pageSize: 8, showSizeChanger: false } : false
        }
        scroll={hasRows ? { x: 900 } : undefined}
        locale={{
          emptyText: (
            <TableEmptyState
              embedded
              title="No pending access requests"
              description="When team members request a different role or extra permissions, they appear here for you to approve or reject."
              icon={
                <Crown
                  className="text-[var(--ochre-600)]"
                  strokeWidth={1.35}
                  aria-hidden
                />
              }
            />
          ),
        }}
      />
    </div>
  );
}
