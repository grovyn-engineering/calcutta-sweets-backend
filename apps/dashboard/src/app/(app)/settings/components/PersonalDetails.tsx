"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message, Upload, type UploadProps } from "antd";
import { Camera, Link2, Loader2, Mail, Smartphone, Upload as UploadIcon, User } from "lucide-react";
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

    type UploadRequestOptions = Parameters<NonNullable<UploadProps["customRequest"]>>[0];

    const customRequest = async (options: UploadRequestOptions) => {
        const { file, onSuccess, onError } = options;
        setUploadingAvatar(true);
        try {
            const secureUrl = await uploadImageToCloudinary(file as File);
            form.setFieldValue("avatarUrl", secureUrl);
            onSuccess?.({ secure_url: secureUrl });
            message.success("Photo uploaded. Save changes to apply it.");
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Avatar upload failed";
            message.error(msg);
            onError?.(err instanceof Error ? err : new Error(msg));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const onFinish = async (values: { name: string; phone?: string; avatarUrl?: string }) => {
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
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Dirty = differs from the saved profile (editing a field back to its saved value is not a change).
    const watchedName = Form.useWatch("name", form);
    const watchedPhone = Form.useWatch("phone", form);
    const norm = (v: unknown) => (v == null ? "" : String(v).trim());
    const dirty =
        norm(watchedName) !== norm(user?.name) ||
        norm(watchedPhone) !== norm(user?.phone) ||
        norm(avatarUrl) !== norm(user?.avatarUrl);

    const resetToSaved = () => {
        form.setFieldsValue({
            name: user?.name,
            phone: user?.phone,
            avatarUrl: user?.avatarUrl,
        });
    };

    const initials = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} className={styles.form} requiredMark={false}>
            {/* Photo first: it is what people recognise their account by */}
            <div className={styles.photoRow}>
                <Upload
                    name="avatar"
                    showUploadList={false}
                    customRequest={customRequest}
                    accept="image/*"
                    className={styles.avatarUpload}
                >
                    <button type="button" className={styles.avatar} aria-label="Upload profile photo">
                        {avatarUrl && !uploadingAvatar ? (
                            <img src={avatarUrl} alt="" className={styles.avatarImg} />
                        ) : uploadingAvatar ? (
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        ) : (
                            <span className={styles.avatarInitial}>{initials}</span>
                        )}
                        <span className={styles.avatarOverlay} aria-hidden>
                            <Camera className="h-4 w-4" />
                        </span>
                    </button>
                </Upload>
                <div className={styles.photoMeta}>
                    <p className={styles.photoTitle}>Profile photo</p>
                    <p className={styles.photoHint}>Square JPG or PNG works best.</p>
                    <div className={styles.photoActions}>
                        <Upload
                            name="avatar"
                            showUploadList={false}
                            customRequest={customRequest}
                            accept="image/*"
                        >
                            <Button icon={<UploadIcon className="h-4 w-4" aria-hidden />} loading={uploadingAvatar}>
                                Upload photo
                            </Button>
                        </Upload>
                        {avatarUrl ? (
                            <Button
                                type="text"
                                onClick={() => form.setFieldValue("avatarUrl", "")}
                            >
                                Remove
                            </Button>
                        ) : null}
                    </div>
                    <Form.Item name="avatarUrl" className={styles.photoUrl}>
                        <Input
                            prefix={<Link2 className="h-4 w-4 text-[var(--bistre-400)]" strokeWidth={1.8} aria-hidden />}
                            placeholder="Or paste an image link (https://…)"
                            autoComplete="off"
                        />
                    </Form.Item>
                </div>
            </div>

            <div className={styles.grid}>
                <Form.Item label="Full name" name="name" rules={[{ required: true, message: "Enter your name" }]}>
                    <Input
                        prefix={<User className="h-4 w-4 text-[var(--bistre-400)]" strokeWidth={1.8} aria-hidden />}
                        placeholder="Your full name"
                        autoComplete="name"
                    />
                </Form.Item>

                <Form.Item
                    label="Mobile number"
                    name="phone"
                    rules={indianMobileOptionalRules}
                    normalize={normalizeMobileFormValue}
                    extra="Used for bills and account recovery."
                >
                    <Input
                        prefix={<Smartphone className="h-4 w-4 text-[var(--bistre-400)]" strokeWidth={1.8} aria-hidden />}
                        placeholder="10 digits, e.g. 9876543210"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                    />
                </Form.Item>

                <Form.Item label="Email" extra="Your sign-in email. Ask an admin to change it.">
                    <Input
                        prefix={<Mail className="h-4 w-4 text-[var(--bistre-400)]" strokeWidth={1.8} aria-hidden />}
                        value={user?.email ?? ""}
                        disabled
                    />
                </Form.Item>
            </div>

            {/* Save bar: only active once something has actually changed */}
            <div className={styles.footer}>
                <span className={`${styles.footerNote} ${dirty ? styles.footerNoteDirty : ""}`.trim()}>
                    {dirty ? "You have unsaved changes" : "All changes saved"}
                </span>
                <div className={styles.footerActions}>
                    <Button onClick={resetToSaved} disabled={!dirty || loading}>
                        Discard
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading} disabled={!dirty}>
                        Save changes
                    </Button>
                </div>
            </div>
        </Form>
    );
}
