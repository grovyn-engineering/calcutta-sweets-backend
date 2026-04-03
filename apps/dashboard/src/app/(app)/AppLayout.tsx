'use client';

import { Layout, Menu, Select, Space, Tag } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import logo from '@/assets/logo.png';
import { ActivityNotificationsBell } from '@/components/ActivityNotificationsBell/ActivityNotificationsBell';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import styles from './AppLayout.module.css';

const { Header, Sider, Content } = Layout;

type SidebarItem = {
  key: string;
  label: React.ReactNode;
  permissionKey?: keyof import('@/contexts/AuthContext').RolePermissions;
  superAdminOnly?: boolean;
};

const sidebarItemsDef: SidebarItem[] = [
  { key: '/dashboard', label: <Link href="/dashboard" className={styles.menuLink} scroll={false}>Dashboard</Link>, permissionKey: 'canAccessDashboard' },
  { key: '/billing-pos', label: <Link href="/billing-pos" className={styles.menuLink} scroll={false}>Billing POS</Link>, permissionKey: 'canAccessBilling' },
  { key: '/orders', label: <Link href="/orders" className={styles.menuLink} scroll={false}>Orders</Link>, permissionKey: 'canAccessOrders' },
  { key: '/products', label: <Link href="/products" className={styles.menuLink} scroll={false}>Products</Link>, permissionKey: 'canAccessProducts' },
  { key: '/inventory', label: <Link href="/inventory" className={styles.menuLink} scroll={false}>Inventory</Link>, permissionKey: 'canAccessInventory' },
  { key: '/categories', label: <Link href="/categories" className={styles.menuLink} scroll={false}>Categories</Link>, permissionKey: 'canAccessCategories' },
  { key: '/reports', label: <Link href="/reports" className={styles.menuLink} scroll={false}>Reports</Link>, permissionKey: 'canAccessReports' },
  { key: '/users', label: <Link href="/users" className={styles.menuLink} scroll={false}>Users</Link>, superAdminOnly: true },
  { key: '/settings', label: <Link href="/settings" className={styles.menuLink} scroll={false}>Settings</Link>, permissionKey: 'canAccessSettings' },
  { key: '/logout', label: <Link href="/logout" className={styles.menuLink} scroll={false}>Logout</Link> },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/billing-pos': 'Billing POS',
  '/orders': 'Orders',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/categories': 'Categories',
  '/reports': 'Reports',
  '/users': 'Users',
  '/settings': 'Settings',
  '/logout': 'Logout',
  '/shops': 'Shops',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, permissions } = useAuth();
  const { effectiveShopCode, setEffectiveShopCode, shops, shopsLoading } =
    useShop();

  const sidebarItems = useMemo(() => {
    const isSuper = user?.role === 'SUPER_ADMIN';
    return sidebarItemsDef
      .filter((item) => {
        if (item.superAdminOnly && !isSuper) return false;
        if (item.permissionKey && permissions && !permissions[item.permissionKey]) return false;
        return true;
      })
      .map(({ key, label }) => ({ key, label }));
  }, [user?.role, permissions]);

  const pageTitle =
    pageTitles[pathname] ??
    (pathname.startsWith('/inventory/')
      ? 'Inventory'
      : pathname.startsWith('/categories/')
        ? 'Categories'
        : pathname.startsWith('/orders/')
          ? 'Bill detail'
          : 'Dashboard');

  const showShopSwitcher = user?.role === 'SUPER_ADMIN' && shops.length > 0;

  const isInventoryListPage = pathname === "/inventory";

  return (
    <Layout className={`min-h-screen flex ${styles.layout}`}>
      <Sider
        width={240}
        theme="light"
        className={`min-h-screen fixed left-0 top-0 bottom-0 z-10 ${styles.sider}`}
      >
        <Link href="/dashboard" className={`flex h-16 items-center gap-3 px-6 ${styles.logoLink}`} scroll={false}>
          <Image
            src={logo}
            alt="Calcutta Sweets"
            width={120}
            height={100}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
          />
        </Link>
        <Menu
          mode="inline"
          selectedKeys={[
            ['/orders', '/products', '/inventory', '/categories', '/users', '/settings']
              .find((base) => pathname.startsWith(base + '/') || pathname === base) ?? pathname,
          ]}
          items={sidebarItems}
          className={`${styles.menu}`}
        />
      </Sider>
      <Layout className={`min-h-screen flex-1 ${styles.mainLayout}`}>
        <Header
          className={`h-16 flex items-center justify-between gap-4 px-6 ${styles.header}`}
        >
          <span className={`text-sm font-medium ${styles.pageTitle}`}>
            {pageTitle}
          </span>
          <Space size="middle" wrap align="center" className={styles.headerActions}>
            <ActivityNotificationsBell />
            {user?.role === 'SUPER_ADMIN' && (
              <Tag color="gold" className="m-0">
                Super Admin
              </Tag>
            )}
            {showShopSwitcher && (
              <Select
                size="middle"
                className={styles.shopSelect}
                value={effectiveShopCode}
                disabled={shopsLoading && shops.length === 0}
                options={shops.map((s) => ({
                  value: s.shopCode,
                  label: `${s.name} (${s.shopCode})`,
                }))}
                onChange={(code) => setEffectiveShopCode(code)}
                aria-label="Active shop"
                popupMatchSelectWidth={false}
              />
            )}
          </Space>
        </Header>
        <Content
          className={`flex min-h-0 flex-1 flex-col p-6 ${styles.content} ${isInventoryListPage ? styles.contentInventoryList : ""}`}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
