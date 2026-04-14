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
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            message.error("Cloudinary configuration missing! Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env");
            onError("Missing config");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        setUploadingAvatar(true);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Upload failed");

            form.setFieldValue("avatarUrl", data.secure_url);
            onSuccess(data, file);
            message.success("Avatar uploaded successfully!");
        } catch (err: any) {
            message.error(err.message || "Avatar upload failed");
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
