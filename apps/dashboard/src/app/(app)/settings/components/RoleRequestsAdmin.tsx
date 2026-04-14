"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Table, Button, message, Space, Tag } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Crown } from "lucide-react";
import { apiFetch } from "../../../../lib/api";
import { TableEmptyState } from "@/components/DataTable/TableDataOverlay";
import styles from "./RoleRequestsAdmin.module.css";

type RoleRequestRow = {
  id: string;
  requestedRole: string;
  createdAt: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

export function RoleRequestsAdmin() {
  const [requests, setRequests] = useState<RoleRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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
    setActionLoadingId(id);
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
      setActionLoadingId(null);
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
        <Tag className="m-0 rounded-md border-[var(--pearl-bush)] bg-[var(--linen-95)] text-[var(--bistre-800)]">
          {role || "STAFF"}
        </Tag>
      ),
    },
    {
      title: "Requested",
      dataIndex: "requestedRole",
      key: "requestedRole",
      width: 130,
      render: (role: string) => (
        <Tag color="geekblue" className="m-0 rounded-md">
          {role}
        </Tag>
      ),
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
            loading={actionLoadingId === record.id}
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
            loading={actionLoadingId === record.id}
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
        dataSource={requests}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={
          hasRows ? { pageSize: 8, showSizeChanger: false } : false
        }
        scroll={hasRows ? { x: 720 } : undefined}
        locale={{
          emptyText: (
            <TableEmptyState
              embedded
              title="No pending role requests"
              description="When team members request a role change, they will show up here for you to approve or reject."
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
