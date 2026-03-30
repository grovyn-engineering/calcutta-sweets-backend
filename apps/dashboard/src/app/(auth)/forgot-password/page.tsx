'use client';
import { Button, Card, Form, Input } from 'antd'
import { ArrowLeft, ArrowRight, ArrowRightIcon, CheckCircle, Loader2, RotateCcwKey, UserIcon } from 'lucide-react'
import Link from 'next/link';
import { useRef, useState } from 'react';
import styles from './styles.module.css'
import { useForm } from 'antd/es/form/Form';

const OtpInput = ({ value = '', onChange }: { value?: string; onChange?: (v: string) => void }) => {
    const [digits, setDigits] = useState<string[]>(() =>
        [...(value || '').split(''), ...Array(6).fill('')].slice(0, 6)
    );
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const handleChange = (index: number, val: string) => {
        if (val && !/^\d$/.test(val)) return;
        const next = [...digits];
        next[index] = val;
        setDigits(next);
        onChange?.(next.join(''));
        if (val && index < 5) otpRefs.current[index + 1]?.focus();
    };
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
        const next = [...digits];
        pasted.forEach((char, i) => { next[i] = char; });
        setDigits(next);
        onChange?.(next.join(''));
        const focusIdx = Math.min(pasted.length, 5);
        otpRefs.current[focusIdx]?.focus();
    };
    return (
        <div className='flex items-center gap-2 justify-center'>
            {Array.from({ length: 6 }).map((_, i) => (
                <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el?.input ?? null; }}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    className={styles.otp_input}
                    autoFocus={i === 0}
                    value={digits[i]}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                />
            ))}
        </div>
    );
};

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [otpError, setOtpError] = useState('');
    const [loading, setLoading] = useState(false);

    const onFinish = (values: any) => {
        console.log(values);
        setStep(step + 1);
    }
    const form = useForm();
    return (
        <div className='flex flex-col h-screen w-full'>
            <div className='flex flex-col justify-center h-[80px]'>
                <h1 className='text-xl font-bold text-[var(--bistre-500)] p-4'>CALCUTTA SWEETS</h1>
            </div>
            <div className='flex justify-center items-center h-full'>
                {step === 1 && <Card className={styles.card} >
                    <div className='flex justify-center items-center rounded-full p-2'>
                        <RotateCcwKey className='w-10 h-10 text-[var(--bistre-500)] bg-[var(--linen-95)] rounded-[10px] p-1' />
                    </div>
                    <p className='font-bold text-lg text-[var(--bistre-500)] text-center mt-2'>FORGOT PASSWORD ?</p>
                    <Form onFinish={onFinish} className={styles.form_container}>
                        <p className='font-bold text-xs text-[var(--bistre-500)]'>USERNAME OR EMAIL</p>
                        <Form.Item className={styles.form_item} name='email' rules={[{ required: true, message: 'Please input your email!' }]}>
                            <Input placeholder='Email' className={styles.input} prefix={<UserIcon className='text-[var(--bistre-500)]' height={16} width={16} />} />
                        </Form.Item>
                        <Button type='primary' htmlType='submit' className={styles.login_button}>Reset Password <ArrowRightIcon className='w-4 h-4' /></Button>
                        <Link href='/login' className='flex items-center gap-2m h-[40px] mt-5'>
                            <ArrowLeft className='w-4 h-4 text-[var(--bistre-500)]' /> <p className='text-sm text-[var(--bistre-500)]'>Back to Login</p>
                        </Link>
                    </Form>
                </Card>}
                {step === 2 && <Card className={styles.card} >
                    <div className='flex justify-center items-center rounded-full p-2'>
                        <CheckCircle className='w-10 h-10 text-[var(--bistre-500)]' />
                    </div>
                    <p className='font-bold text-lg text-[var(--bistre-500)] text-center mt-2'>OTP SENT TO YOUR EMAIL</p>
                    <p className='text-sm text-[var(--bistre-500)] text-center mt-2'>Please check your email for the OTP</p>
                    <Form onFinish={onFinish} className={styles.form_container}>
                        <Form.Item className={styles.form_item} name='otp' rules={[{ required: true, message: 'Please input your OTP!' }]}>
                            <OtpInput />
                        </Form.Item>
                        <Button type='primary' htmlType='submit' className={styles.login_button} icon={loading ? <Loader2 className='w-4 h-4' /> : <ArrowRightIcon className='w-4 h-4' />}>Verify OTP</Button>
                        <Link href='/login' className='flex items-center gap-2m h-[40px] mt-5'>
                            <ArrowLeft className='w-4 h-4 text-[var(--bistre-500)]' /> <p className='text-sm text-[var(--bistre-500)]'>Back to Login</p>
                        </Link>
                    </Form>
                </Card>}
                {step === 3 && <Card className={`${styles.card}`} >
                    <div className='flex justify-center items-center rounded-full p-2'>
                        <CheckCircle className='w-10 h-10 text-[var(--bistre-500)]' />
                    </div>
                    <p className='font-bold text-lg text-[var(--bistre-500)] text-center mt-2'>PASSWORD RESET SUCCESSFULLY</p>
                    <Button type='primary' htmlType='submit' className={`${styles.login_button} mt-8`} icon={<ArrowRightIcon className='w-4 h-4' />} onClick={() => setStep(3)}>
                        <Link href='/login' className='flex items-center'>Proceed to Login</Link>
                    </Button>
                </Card>}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;