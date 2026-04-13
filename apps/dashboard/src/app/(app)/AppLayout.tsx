'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { Drawer, Button, Dropdown, Layout, Menu, Select, Space, Tag } from 'antd';
import Image from 'next/image';
import Link from 'next/link';

import logo from '@/assets/logo.svg';
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
  { key: '/stock-transfers', label: <Link href="/stock-transfers" className={styles.menuLink} scroll={false}>Stock Transfers</Link>, permissionKey: 'canAccessInventory' },
  { key: '/categories', label: <Link href="/categories" className={styles.menuLink} scroll={false}>Categories</Link>, permissionKey: 'canAccessCategories' },
  { key: '/reports', label: <Link href="/reports" className={styles.menuLink} scroll={false}>Reports</Link>, permissionKey: 'canAccessReports' },
  { key: '/users', label: <Link href="/users" className={styles.menuLink} scroll={false}>Users</Link>, superAdminOnly: true },
  { key: '/shops', label: <Link href="/shops" className={styles.menuLink} scroll={false}>Shops</Link>, superAdminOnly: true },
  { key: '/settings', label: <Link href="/settings" className={styles.menuLink} scroll={false}>Settings</Link>, permissionKey: 'canAccessSettings' },
];

/** Bases that map nested routes to a single sidebar item (e.g. /shops/SH000001 → /shops). */
const SIDEBAR_ROUTE_PREFIXES = [
  '/dashboard',
  '/billing-pos',
  '/orders',
  '/products',
  '/inventory',
  '/stock-transfers',
  '/categories',
  '/reports',
  '/users',
  '/shops',
  '/settings',
] as const;

function sidebarSelectedKey(pathname: string): string {
  const hit = SIDEBAR_ROUTE_PREFIXES.find(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
  return hit ?? pathname;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/billing-pos': 'Billing POS',
  '/orders': 'Orders',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/stock-transfers': 'Stock Transfers',
  '/categories': 'Categories',
  '/reports': 'Reports',
  '/users': 'Users',
  '/settings': 'Settings',
  '/logout': 'Logout',
  '/shops': 'Management Shops',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, permissions } = useAuth();
  const { effectiveShopCode, setEffectiveShopCode, shops, shopsLoading } =
    useShop();

  const isFactory = useMemo(() => {
    const s = shops.find(x => x.shopCode === effectiveShopCode);
    return !!s?.isFactory;
  }, [shops, effectiveShopCode]);

  const sidebarItems = useMemo(() => {
    const isSuper = user?.role === 'SUPER_ADMIN';
    return sidebarItemsDef
      .filter((item) => {
        if (item.superAdminOnly && !isSuper) return false;
        if (item.permissionKey && permissions && !permissions[item.permissionKey]) return false;

        const factoryOnlyKeys = ["/stock-transfers", "/shops"];
        if (!isFactory && factoryOnlyKeys.includes(item.key)) return false;

        return true;
      })
      .map(({ key, label }) => ({ key, label }));
  }, [user?.role, permissions, isFactory]);

  const pageTitle =
    pageTitles[pathname] ??
    (pathname.startsWith('/inventory/')
      ? 'Inventory'
      : pathname.startsWith('/categories/')
        ? 'Categories'
        : pathname.startsWith('/orders/')
          ? 'Bill detail'
          : pathname.startsWith('/shops/')
            ? 'Shop details'
            : 'Dashboard');

  const showShopSwitcher = user?.role === 'SUPER_ADMIN' && shops.length > 0;

  const isInventoryListPage = pathname === "/inventory";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const selectedSidebarKey = useMemo(
    () => sidebarSelectedKey(pathname),
    [pathname],
  );

  const MainMenu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedSidebarKey]}
      items={sidebarItems}
      className={`${styles.menu}`}
    />
  );

  const SidebarContent = (
    <>
      <Link
        href="/dashboard"
        className={`flex h-16 shrink-0 items-center justify-center px-4 ${styles.logoLink}`}
        scroll={false}
      >
        <Image
          src={logo}
          alt="Calcutta Sweets"
          width={200}
          height={80}
          className={`h-[52px] w-auto max-w-[200px] object-contain object-center ${styles.logoImage}`}
          priority
        />
      </Link>
      {MainMenu}
    </>
  );

  return (
    <Layout className={`min-h-screen flex ${styles.layout}`}>
      <Sider
        width={240}
        theme="light"
        className={`flex min-h-screen flex-col sticky top-0 h-screen z-10 ${styles.sider}`}
      >
        {SidebarContent}
      </Sider>

      <Drawer
        placement="left"
        onClose={() => setIsMobileMenuOpen(false)}
        open={isMobileMenuOpen}
        styles={{
          body: { padding: 0 },
          wrapper: { width: 240 }
        }}
        closable={false}
        className={styles.mobileDrawer}
      >
        <div className={styles.mobileDrawerInner}>
          <div className={styles.mobileDrawerHeader}>
            <Button
              className={styles.closeButton}
              onClick={() => setIsMobileMenuOpen(false)}
              icon={<X className="size-5" />}
            />
            <Link href="/dashboard" className={styles.drawerLogo} scroll={false}>
              <Image
                src={logo}
                alt="Calcutta Sweets"
                width={80}
                height={60}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>
          
          {MainMenu}

          {showShopSwitcher && (
            <div className={styles.mobileDrawerShopSwitcher}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--bistre-400)] mb-2 px-1">Active Shop</p>
              <Select
                size="middle"
                className="w-full"
                value={effectiveShopCode}
                disabled={shopsLoading && shops.length === 0}
                options={shops.map((s) => ({
                  value: s.shopCode,
                  label: `${s.name} (${s.shopCode})`,
                }))}
                onChange={(code) => setEffectiveShopCode(code)}
                aria-label="Active shop"
              />
            </div>
          )}
        </div>
      </Drawer>

      <Layout className={`min-h-screen flex-1 ${styles.mainLayout}`}>
        <Header
          className={`flex items-center justify-between gap-4 ${styles.header}`}
        >
          <div className={`flex min-w-0 flex-1 items-center gap-3 ${styles.headerTitleCluster}`}>
            <Button
              className={`${styles.mobileMenuButton} flex shrink-0 items-center justify-center size-9 p-0 border-[rgba(44,24,16,0.1)] shadow-sm bg-[var(--linen-100)]`}
              onClick={() => setIsMobileMenuOpen(true)}
              icon={<MenuIcon className="size-5 text-[var(--bistre-800)]" />}
            />
            <span className={`truncate text-base font-semibold leading-tight ${styles.pageTitle}`}>
              {pageTitle}
            </span>
          </div>
          <div className={`flex shrink-0 items-center ${styles.headerToolbar}`}>
            {showShopSwitcher && (
              <div className={styles.headerShopSwitcher}>
                <Select
                  size="middle"
                  className={`${styles.shopSelect} ${styles.headerShopSelect}`}
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
              </div>
            )}

            <ActivityNotificationsBell />

            <div className={styles.headerToolbarDivider} aria-hidden="true" />

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'settings',
                    label: <Link href="/settings" scroll={false}>Account Settings</Link>,
                    icon: <span className="text-[10px]">⚙️</span>,
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'logout',
                    danger: true,
                    label: <Link href="/logout" scroll={false}>Logout</Link>,
                    icon: <span className="text-[10px]">🚪</span>,
                  },
                ],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className={`flex items-center gap-3 cursor-pointer ${styles.profileSection}`} style={{ lineHeight: 'normal' }}>
                <div className="flex flex-col items-end justify-center">
                  <span className="text-[13.5px] font-semibold text-[var(--bistre-950)] leading-tight hidden sm:block">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--bistre-400)] tracking-widest uppercase mt-0.5 hidden sm:block">
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={styles.avatarWrapper}>
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full object-cover border border-[rgba(44,24,16,0.12)] shadow-sm"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[var(--ochre-100)] flex items-center justify-center text-[var(--ochre-600)] font-bold text-sm">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
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
