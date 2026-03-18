'use client';

import { Layout, Menu } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import logo from '@/assets/logo.png';
import styles from './AppLayout.module.css';

const { Header, Sider, Content } = Layout;

const sidebarItems = [
  { key: '/', label: <Link href="/">Dashboard</Link> },
  { key: '/shops', label: <Link href="/shops">Shops</Link> },
  { key: '/products', label: <Link href="/products">Products</Link> },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/shops': 'Shops',
  '/products': 'Products',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? 'Dashboard';

  return (
    <Layout className={`min-h-screen flex ${styles.layout}`}>
      <Sider
        width={240}
        theme="light"
        className={`min-h-screen fixed left-0 top-0 bottom-0 z-10 ${styles.sider}`}
      >
        <Link href="/" className={`flex h-16 items-center gap-3 px-6 ${styles.logoLink}`}>
          <Image
            src={logo}
            alt="Calcutta Sweets"
            width={150}
            height={100}
            className="object-contain"
          />
        </Link>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={sidebarItems}
          className={`pt-4 text-base ${styles.menu}`}
        />
      </Sider>
      <Layout className={`min-h-screen flex-1 ${styles.mainLayout}`}>
        <Header className={`h-16 flex items-center px-6 ${styles.header}`}>
          <span className={`text-sm font-medium ${styles.pageTitle}`}>
            {pageTitle}
          </span>
        </Header>
        <Content className={`flex-1 p-6 overflow-auto min-h-[calc(100vh-64px)] ${styles.content}`}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
