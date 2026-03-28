'use client';

import { App, Button, Card, Checkbox, Form, Input } from 'antd';
import styles from './styles.module.css';
import Link from 'next/link';
import { ArrowRightIcon, Candy, LockIcon, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/lib/api';

const LoginPage = () => {
  const { message } = App.useApp();
  const router = useRouter();
  const { setAuth } = useAuth();

  const onFinish = (values: { email: string; password: string }) => {
    fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data?.access_token) {
          setAuth(data.access_token, data.user ?? null);
          router.replace('/dashboard');
        } else {
          message.error(data?.message ?? 'Login failed');
        }
      })
      .catch(() => message.error('Login failed'));
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.brand}>
          <div className={styles.brandMark} aria-hidden>
            <Candy strokeWidth={1.75} size={28} />
          </div>
          <h1 className={styles.title}>CALCUTTA SWEETS</h1>
          <p className={styles.tagline}>Est. 2000 · Kolkata</p>
        </header>

        <Card className={styles.card} variant="borderless">
          <div className={styles.cardHead}>
            <h2>Welcome back</h2>
            <p>Sign in with your staff account to open the dashboard.</p>
          </div>

          <Form layout="vertical" requiredMark={false} onFinish={onFinish}>
            <label className={styles.label} htmlFor="login-email">
              Username or email
            </label>
            <Form.Item
              className={styles.form_item}
              name="email"
              rules={[{ required: true, message: 'Please enter your email or username.' }]}
            >
              <Input
                id="login-email"
                autoComplete="username"
                placeholder="you@example.com"
                className={styles.input}
                prefix={<UserIcon className="text-[var(--bistre-500)]" height={16} width={16} />}
              />
            </Form.Item>

            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <Form.Item
              className={styles.form_item}
              name="password"
              rules={[{ required: true, message: 'Please enter your password.' }]}
            >
              <Input.Password
                id="login-password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={styles.input}
                prefix={<LockIcon className="text-[var(--bistre-500)]" height={16} width={16} />}
              />
            </Form.Item>

            <div className={styles.row}>
              <Checkbox className={styles.checkbox}>Remember me</Checkbox>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button type="primary" htmlType="submit" className={styles.login_button}>
              Sign in
              <ArrowRightIcon className="w-4 h-4" aria-hidden />
            </Button>
          </Form>
        </Card>

        <p className={styles.footer}>Traditional sweets · Trusted since 2000</p>
      </div>
    </div>
  );
};

export default LoginPage;
