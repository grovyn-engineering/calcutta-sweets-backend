"use client";

import { useState } from "react";
import { Form, Select, Button, message, Tag } from "antd";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";

export function RolesSection() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await apiFetch("/role-requests", {
                method: "POST",
                body: JSON.stringify({ requestedRole: values.requestedRole }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to submit role request");
            }
            message.success("Role request submitted successfully. You will be notified via email once reviewed.");
        } catch (e: any) {
            message.error(e.message || "An error occurred processing your request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="mb-6 flex items-center gap-2">
                <span className="text-gray-600 font-medium">Current Assigned Role:</span>
                <Tag color="blue" className="text-sm px-3 py-1 m-0">
                    {user?.role || "NOT SET"}
                </Tag>
            </div>

            {user?.role !== "SUPER_ADMIN" ? (
                <Form layout="vertical" onFinish={onFinish}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Form.Item label="Select Role" name="requestedRole" rules={[{ required: true, message: 'Please select a role' }]} extra="Your request will be sent to the Super Admin for approval.">
                            <Select placeholder="Choose the role you want to request" size="large" className="[&_.ant-select-selector]:!bg-white">
                                <Select.Option value="MANAGER">Manager</Select.Option>
                                <Select.Option value="CASHIER">Cashier</Select.Option>
                                <Select.Option value="ADMIN">Admin</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <Button type="primary" htmlType="submit" loading={loading} size="large" className="mt-2 w-full md:w-auto px-8">
                        Submit Role Request
                    </Button>
                </Form>
            ) : (
                <div className="text-[var(--bistre-500)] italic pl-1">
                    You are a Super Admin. You have maximum system clearance.
                </div>
            )}
        </div>
    );
}
