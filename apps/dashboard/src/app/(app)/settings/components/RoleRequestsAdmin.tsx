"use client";

import { useEffect, useState } from "react";
import { Table, Button, message, Space, Tag } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { apiFetch } from "../../../../lib/api";

export function RoleRequestsAdmin() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/role-requests");
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (e: any) {
            message.error("Failed to load role requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        setActionLoadingId(id);
        try {
            const res = await apiFetch(`/role-requests/${id}/${action}`, {
                method: "PATCH",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || `Failed to ${action} request`);
            }
            message.success(`Request ${action}d successfully`);
            fetchRequests();
        } catch (e: any) {
            message.error(e.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const columns = [
        {
            title: "User Name",
            dataIndex: ["user", "name"],
            key: "name",
            render: (text: string, record: any) => text || record.user?.email || "Unknown",
        },
        {
            title: "Current Role",
            dataIndex: ["user", "role"],
            key: "currentRole",
            render: (role: string) => <Tag>{role || "STAFF"}</Tag>,
        },
        {
            title: "Requested Role",
            dataIndex: "requestedRole",
            key: "requestedRole",
            render: (role: string) => <Tag color="blue">{role}</Tag>,
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="small"
                        loading={actionLoadingId === record.id}
                        onClick={() => handleAction(record.id, "approve")}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        size="small"
                        loading={actionLoadingId === record.id}
                        onClick={() => handleAction(record.id, "reject")}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(44,24,16,0.05)] border border-[var(--pearl-bush)] overflow-hidden">
            <Table
                dataSource={requests}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: "No pending role requests" }}
                className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fdfbf7] [&_.ant-table-thead_th]:!text-[var(--bistre-800)] [&_.ant-table-thead_th]:!font-semibold"
            />
        </div>
    );
}
