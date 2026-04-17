'use client';

import { App, Button, Checkbox, Form, Input } from 'antd';
import styles from './styles.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { LockIcon, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import logo from '@/assets/logo.svg';

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
      <div className={styles.layout}>
        <header className={styles.topBar}>
          <Link href="/" className={styles.topLogoWrap} aria-label="Calcutta Sweets home">
            <Image
              src={logo}
              alt="Calcutta Sweets"
              width={209}
              height={90}
              className={styles.topLogo}
              priority
              unoptimized
            />
          </Link>
          <p className={styles.topTagline}>Return to Heritage</p>
        </header>

        <div className={styles.splitCard}>
          <div className={styles.visualPane}>
            <Image
              src="/login-heritage-hero.png"
              alt=""
              fill
              className={styles.heroImage}
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
            />
            <div className={styles.visualGradient} aria-hidden />
            <div className={styles.visualCopy}>
              <p className={styles.visualQuote}>
                The sweetness of a thousand years, crafted for today.
              </p>
              <p className={styles.visualKicker}>Heritage collection since 1924</p>
            </div>
          </div>

          <div className={styles.formPane}>
            <div className={styles.formInner}>
              <h1 className={styles.formTitle}>Welcome Back</h1>
              <p className={styles.formSub}>Sign in to your heritage account</p>

              <Form layout="vertical" requiredMark={false} onFinish={onFinish} className={styles.form}>
                <label className={styles.label} htmlFor="login-email">
                  Username or Email
                </label>
                <Form.Item
                  className={styles.formItem}
                  name="email"
                  rules={[{ required: true, message: 'Please enter your email or username.' }]}
                >
                  <Input
                    id="login-email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    className={styles.input}
                    suffix={<UserIcon className={styles.inputIcon} height={18} width={18} aria-hidden />}
                  />
                </Form.Item>

                <label className={styles.label} htmlFor="login-password">
                  Password
                </label>
                <Form.Item
                  className={styles.formItem}
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password.' }]}
                >
                  <Input.Password
                    id="login-password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={styles.input}
                    visibilityToggle={false}
                    suffix={<LockIcon className={styles.inputIcon} height={18} width={18} aria-hidden />}
                  />
                </Form.Item>

                <div className={styles.row}>
                  <Checkbox className={styles.checkbox}>Remember me</Checkbox>
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Forgot password?
                  </Link>
                </div>

                <Button type="primary" htmlType="submit" className={styles.loginButton}>
                  Sign In
                </Button>

                <p className={styles.joinRow}>
                  Don&apos;t have an account?{' '}
                  <Link href="#" className={styles.joinLink} prefetch={false}>
                    Join the Heritage
                  </Link>
                </p>
              </Form>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <nav className={styles.footerNav} aria-label="Legal">
            <a href="#" className={styles.footerLink}>
              Privacy Policy
            </a>
            <a href="#" className={styles.footerLink}>
              Terms of Service
            </a>
            <a href="#" className={styles.footerLink}>
              Contact Us
            </a>
          </nav>
          <p className={styles.copyright}>
            © 2026 Calcutta Sweets Heritage Editorial. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
