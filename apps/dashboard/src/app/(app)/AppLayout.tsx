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

        // Hide management items in Retail scope
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const MainMenu = (
    <Menu
      mode="inline"
      selectedKeys={[
        ['/orders', '/products', '/inventory', '/stock-transfers', '/categories', '/users', '/settings']
          .find((base) => pathname.startsWith(base + '/') || pathname === base) ?? pathname,
      ]}
      items={sidebarItems}
      className={`${styles.menu}`}
    />
  );

  const SidebarContent = (
    <>
      <Link href="/dashboard" className={`flex h-14 items-center gap-3 px-6 ${styles.logoLink}`} scroll={false}>
        <Image
          src={logo}
          alt="Calcutta Sweets"
          width={90}
          height={70}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
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
        className={`min-h-screen sticky top-0 h-screen z-10 ${styles.sider}`}
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
          className={`h-16 flex items-center justify-between gap-4 px-4 sm:px-6 ${styles.header}`}
        >
          <div className="flex items-center gap-3">
            <Button
              className={`${styles.mobileMenuButton} flex items-center justify-center size-9 p-0 border-[rgba(44,24,16,0.1)] shadow-sm bg-white`}
              onClick={() => setIsMobileMenuOpen(true)}
              icon={<MenuIcon className="size-5 text-[var(--bistre-800)]" />}
            />
            <span className={`text-base font-semibold truncate ${styles.pageTitle} pl-1`}>
              {pageTitle}
            </span>
          </div>
          <div className={`flex items-center gap-2 sm:gap-4 ${styles.headerActions}`}>
            {showShopSwitcher && (
              <div className={styles.headerShopSwitcher}>
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
              </div>
            )}

            <ActivityNotificationsBell />

            <div className="h-6 w-[1px] bg-[rgba(44,24,16,0.08)] mx-2" aria-hidden="true" />

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
