"use client";

import { useState } from "react";
import { Form, Input, Button, message, Alert } from "antd";
import { LockOutlined, KeyOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { apiFetch } from "../../../../lib/api";

export function SecuritySection() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    const requestOtp = async () => {
        try {
            await form.validateFields(['oldPassword', 'newPassword', 'confirmPassword']);
            const values = form.getFieldsValue();

            setLoading(true);
            const res = await apiFetch("/auth/send-change-password-otp", { method: "POST" });
            if (!res.ok) throw new Error("Failed to send OTP");

            message.success("OTP sent to your registered email");
            setStep(2);
        } catch (e: any) {
            if (e.name !== 'ValidationError') {
                message.error(e.message || "Could not send OTP");
            }
        } finally {
            setLoading(false);
        }
    };

    const submitPasswordChange = async () => {
        try {
            const values = await form.validateFields();

            setLoading(true);
            const res = await apiFetch("/auth/change-password", {
                method: "POST",
                body: JSON.stringify({
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                    otp: values.otp,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to change password");
            }
            message.success("Password changed successfully!");
            form.resetFields();
            setStep(1);
        } catch (e: any) {
            if (e.name !== 'ValidationError') {
                message.error(e.message || "An error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <Form form={form} layout="vertical">
                {step === 1 ? (
                    <>
                        <div className="mb-6 text-sm text-[var(--bistre-600)] max-w-2xl">
                            Create a new secure password. You will need to verify this change with an OTP sent to your email.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                            <Form.Item className="md:col-span-2" label="Old Password" name="oldPassword" rules={[{ required: true, message: 'Required' }]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="Current password" size="large" className="!bg-white md:max-w-md" />
                            </Form.Item>

                            <Form.Item
                                label="New Password"
                                name="newPassword"
                                rules={[
                                    { required: true, message: 'Please input your new password!' },
                                    { min: 8, message: 'Password must be at least 8 characters long' }
                                ]}
                            >
                                <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="New password" size="large" className="!bg-white" />
                            </Form.Item>

                            <Form.Item
                                label="Confirm New Password"
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Please confirm your password!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="Confirm new password" size="large" className="!bg-white" />
                            </Form.Item>
                        </div>

                        <Button type="primary" onClick={requestOtp} loading={loading} size="large" className="mt-2 w-full md:w-auto px-8">
                            Send OTP & Continue
                        </Button>
                    </>
                ) : (
                    <div className="max-w-md">
                        <Alert
                            message="OTP Sent"
                            description="Please enter the 6-digit code sent to your email to confirm the password change."
                            type="info"
                            showIcon
                            className="mb-6 bg-blue-50/50 border-blue-100"
                        />
                        <Form.Item label="OTP Code" name="otp" rules={[{ required: true, message: 'Please input the OTP' }]}>
                            <Input prefix={<KeyOutlined />} placeholder="6-digit code" size="large" className="!bg-white" />
                        </Form.Item>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(1)} size="large" className="flex-1">
                                Back
                            </Button>
                            <Button type="primary" onClick={submitPasswordChange} loading={loading} size="large" className="flex-1">
                                Verify & Update
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </div>
    );
}
