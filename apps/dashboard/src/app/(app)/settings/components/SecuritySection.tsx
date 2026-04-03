"use client";

import { useEffect, useRef, useState } from "react";
import { Form, Input, Button, App } from "antd";
import {
    LockOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { CheckCircle, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "../../../../lib/api";

// ── Digit-by-digit OTP input (reusable, no React tree in Tabulator) ─────────
const OtpInput = ({
    value = "",
    onChange,
    disabled,
}: {
    value?: string;
    onChange?: (v: string) => void;
    disabled?: boolean;
}) => {
    const [digits, setDigits] = useState<string[]>(() =>
        [...(value || "").split(""), ...Array(6).fill("")].slice(0, 6),
    );
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const update = (i: number, val: string) => {
        if (val && !/^\d$/.test(val)) return;
        const next = [...digits];
        next[i] = val;
        setDigits(next);
        onChange?.(next.join(""));
        if (val && i < 5) refs.current[i + 1]?.focus();
    };

    const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[i] && i > 0)
            refs.current[i - 1]?.focus();
    };

    const onPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6)
            .split("");
        const next = [...digits];
        pasted.forEach((c, i) => { next[i] = c; });
        setDigits(next);
        onChange?.(next.join(""));
        refs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex items-center gap-3 justify-center my-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    disabled={disabled}
                    autoFocus={i === 0}
                    value={digits[i]}
                    onChange={(e) => update(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={onPaste}
                    className={[
                        "w-11 h-12 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all",
                        "text-[var(--bistre-700)] bg-white",
                        digits[i]
                            ? "border-[var(--ochre-500)] shadow-[0_0_0_3px_rgba(201,147,45,0.15)]"
                            : "border-[var(--bistre-200)]",
                        "focus:border-[var(--ochre-500)] focus:shadow-[0_0_0_3px_rgba(201,147,45,0.15)]",
                        disabled ? "opacity-50 cursor-not-allowed" : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                />
            ))}
        </div>
    );
};

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(initial = 0) {
    const [remaining, setRemaining] = useState(initial);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = (s: number) => {
        setRemaining(s);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
                return r - 1;
            });
        }, 1000);
    };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
    return { remaining, start };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SecuritySection() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [otp, setOtp] = useState("");
    const { remaining, start: startTimer } = useCountdown(0);
    const [passwords, setPasswords] = useState({ old: "", new: "" });

    // ── Step 1 → send OTP (validates old password on server) ─────────────────
    const requestOtp = async () => {
        try {
            await form.validateFields(["oldPassword", "newPassword", "confirmPassword"]);
        } catch {
            return; // antd form validation errors shown inline
        }
        const values = form.getFieldsValue();

        setLoading(true);
        try {
            const res = await apiFetch("/auth/send-change-password-otp", {
                method: "POST",
                body: JSON.stringify({ oldPassword: values.oldPassword }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Surface the exact server reason (e.g. "Incorrect current password")
                message.error(data.message || "Could not send OTP. Please try again.");
                return;
            }

            // Capture for step 2
            setPasswords({ old: values.oldPassword, new: values.newPassword });
            message.success("OTP sent to your registered email");
            startTimer(60);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ─────────────────────────────────────────────────────────────
    const resendOtp = async () => {
        if (remaining > 0) return;
        setLoading(true);
        try {
            const res = await apiFetch("/auth/send-change-password-otp", {
                method: "POST",
                body: JSON.stringify({ oldPassword: passwords.old }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { message.error(data.message || "Could not resend"); return; }
            message.success("OTP resent!");
            startTimer(60);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2 → verify OTP + change password ─────────────────────────────────
    const submitPasswordChange = async () => {
        if (otp.length < 6) { message.error("Enter the complete 6-digit OTP"); return; }
        setLoading(true);
        try {
            const res = await apiFetch("/auth/change-password", {
                method: "POST",
                body: JSON.stringify({
                    oldPassword: passwords.old,
                    newPassword: passwords.new,
                    otp,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                message.error(data.message || "Failed to change password");
                return;
            }
            setStep(3);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        form.resetFields();
        setOtp("");
        setStep(1);
    };

    return (
        <div className="mt-4 flex justify-center ">
            <Form form={form} layout="vertical" preserve={true}>
                {step === 1 && (
                    <>
                        <div className="mb-6 text-sm text-[var(--bistre-600)] max-w-2xl">
                            Create a new secure password. We'll send a one-time code to your email to confirm the change.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                            <Form.Item
                                className="md:col-span-2"
                                label="Current Password"
                                name="oldPassword"
                                rules={[{ required: true, message: "Required" }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Your current password"
                                    size="large"
                                    className="!bg-white md:max-w-md"
                                />
                            </Form.Item>
                            <Form.Item
                                label="New Password"
                                name="newPassword"
                                rules={[
                                    { required: true, message: "Please enter a new password" },
                                    { min: 8, message: "At least 8 characters" },
                                ]}
                            >
                                <Input.Password
                                    prefix={<SafetyCertificateOutlined />}
                                    placeholder="New password"
                                    size="large"
                                    className="!bg-white"
                                />
                            </Form.Item>
                            <Form.Item
                                label="Confirm New Password"
                                name="confirmPassword"
                                dependencies={["newPassword"]}
                                rules={[
                                    { required: true, message: "Please confirm your password" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("newPassword") === value)
                                                return Promise.resolve();
                                            return Promise.reject(new Error("Passwords do not match"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<SafetyCertificateOutlined />}
                                    placeholder="Confirm new password"
                                    size="large"
                                    className="!bg-white"
                                />
                            </Form.Item>
                        </div>
                        <Button
                            type="primary"
                            onClick={requestOtp}
                            loading={loading}
                            size="large"
                            className="mt-2 w-full md:w-auto px-8"
                        >
                            Send OTP &amp; Continue
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <div className="max-w-sm">
                        <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-gradient-to-b from-[var(--linen-95)] to-white border border-[var(--bistre-100)] shadow-sm mb-6">
                            <div className="w-12 h-12 rounded-full bg-[var(--ochre-50)] flex items-center justify-center text-[var(--ochre-600)]">
                                <Mail className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-[var(--bistre-700)] text-base">Check your email</p>
                            <p className="text-sm text-[var(--bistre-500)] text-center leading-relaxed">
                                We sent a 6-digit code to your registered email address.
                                Enter it below to confirm the password change.
                            </p>
                        </div>

                        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                        <div className="flex items-center justify-center mt-3 mb-5 text-sm">
                            {remaining > 0 ? (
                                <span className="text-[var(--bistre-400)]">
                                    Resend in{" "}
                                    <span className="font-semibold tabular-nums text-[var(--ochre-600)]">
                                        {remaining}s
                                    </span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resendOtp}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-[var(--ochre-600)] font-semibold hover:underline disabled:opacity-40 bg-transparent border-none cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Resend OTP
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={() => setStep(1)} size="large" className="flex-1">
                                Back
                            </Button>
                            <Button
                                type="primary"
                                onClick={submitPasswordChange}
                                loading={loading}
                                size="large"
                                className="flex-1"
                            >
                                Verify &amp; Update
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-sm flex flex-col items-center gap-4 py-6">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="font-bold text-[var(--bistre-700)] text-lg">Password Updated!</p>
                        <p className="text-sm text-[var(--bistre-500)] text-center">
                            Your password has been changed successfully.
                        </p>
                        <Button type="primary" onClick={reset} size="large" className="mt-2 px-8">
                            Done
                        </Button>
                    </div>
                )}

            </Form>
        </div>
    );
}
