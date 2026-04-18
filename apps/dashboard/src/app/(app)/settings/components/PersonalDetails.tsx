"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link2, Loader2, Smartphone, User } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import {
    indianMobileOptionalRules,
    normalizeMobileFormValue,
} from "../../../../lib/mobileNumber";
import { uploadImageToCloudinary } from "../../../../lib/cloudinaryUpload";
import styles from "./PersonalDetails.module.css";

export function PersonalDetails() {
    const { user, setAuth, token } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
            });
        }
    }, [user, form]);

    const avatarUrl = Form.useWatch('avatarUrl', form);

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        setUploadingAvatar(true);
        try {
            const secureUrl = await uploadImageToCloudinary(file as File);
            form.setFieldValue("avatarUrl", secureUrl);
            onSuccess({ secure_url: secureUrl }, file);
            message.success("Avatar uploaded successfully!");
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Avatar upload failed";
            message.error(msg);
            onError(err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const uploadButton = (
        <div className={styles.uploadTrigger}>
            {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin text-[var(--ochre-600)]" aria-hidden />
            ) : (
                <PlusOutlined className="text-lg text-[var(--ochre-600)]" />
            )}
            <span className={styles.uploadLabel}>Upload</span>
        </div>
    );

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await apiFetch("/users/profile/me", {
                method: "PATCH",
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            const data = await res.json();
            message.success("Profile updated successfully");
            if (token) {
                setAuth(token, data);
            }
        } catch (e: any) {
            message.error(e.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} className={styles.form}>
            <div className={styles.grid}>
                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                    <Input
                        prefix={
                            <span className={styles.inputIcon} aria-hidden>
                                <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                            </span>
                        }
                        placeholder="Your full name"
                        size="large"
                        className="!bg-white"
                        autoComplete="name"
                    />
                </Form.Item>

                <Form.Item
                    label="Mobile number"
                    name="phone"
                    rules={indianMobileOptionalRules}
                    normalize={normalizeMobileFormValue}
                >
                    <Input
                        prefix={
                            <span className={styles.inputIcon} aria-hidden>
                                <Smartphone className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                            </span>
                        }
                        placeholder="10 digits, e.g. 9876543210"
                        size="large"
                        className="!bg-white"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                    />
                </Form.Item>
            </div>

            <Form.Item
                label="Profile photo"
                className={styles.avatarBlock}
            >
                <div className={styles.avatarRow}>
                    <Upload
                        name="avatar"
                        listType="picture-circle"
                        className={styles.avatarUpload}
                        showUploadList={false}
                        customRequest={customRequest}
                        accept="image/*"
                    >
                        {avatarUrl && !uploadingAvatar ? (
                            <img src={avatarUrl} alt="" className={styles.avatarPreview} />
                        ) : (
                            uploadButton
                        )}
                    </Upload>
                    <div className={styles.avatarUrlField}>
                        <Form.Item name="avatarUrl" noStyle>
                            <Input
                                prefix={
                                    <span className={styles.inputIcon} aria-hidden>
                                        <Link2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                                    </span>
                                }
                                placeholder="https://example.com/avatar.png"
                                size="large"
                                className="!bg-white"
                                autoComplete="off"
                            />
                        </Form.Item>
                        <p className={styles.avatarHint}>
                            Upload an image or paste a direct HTTPS link to a square photo (JPG or PNG).
                        </p>
                    </div>
                </div>
            </Form.Item>

            <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className={`${styles.submit} w-full md:w-auto`}
            >
                Save changes
            </Button>
        </Form>
    );
}
