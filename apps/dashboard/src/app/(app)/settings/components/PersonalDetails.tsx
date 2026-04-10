"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message, Upload } from "antd";
import { UserOutlined, PhoneOutlined, LinkOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";

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
        <div className="flex flex-col items-center justify-center text-[var(--bistre-500)]">
            {uploadingAvatar ? <LoadingOutlined /> : <PlusOutlined />}
            <div className="mt-2 text-xs">Upload</div>
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
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                    <Input prefix={<UserOutlined />} placeholder="Your full name" size="large" className="!bg-white" />
                </Form.Item>

                <Form.Item label="Mobile Number" name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Your mobile number" size="large" className="!bg-white" />
                </Form.Item>
            </div>

            <Form.Item label="Avatar" extra="Upload a picture or provide a direct link">
                <div className="flex items-center gap-6">
                    <Upload
                        name="avatar"
                        listType="picture-circle"
                        className="flex-shrink-0"
                        showUploadList={false}
                        customRequest={customRequest}
                        accept="image/*"
                    >
                        {avatarUrl && !uploadingAvatar ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-[100px] object-cover rounded-full select-none pointer-events-none" />
                        ) : (
                            uploadButton
                        )}
                    </Upload>
                    <div className="flex-1 max-w-sm">
                        <Form.Item name="avatarUrl" noStyle>
                            <Input prefix={<LinkOutlined />} placeholder="https://example.com/avatar.png" size="large" className="!bg-white" />
                        </Form.Item>
                    </div>
                </div>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} size="large" className="mt-2 w-full md:w-auto px-8">
                Save Changes
            </Button>
        </Form>
    );
}
