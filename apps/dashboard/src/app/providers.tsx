'use client';

import { App, ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShopProvider } from '@/contexts/ShopContext';

const theme = {
  token: {
    colorPrimary: '#a84f1c',
    colorPrimaryHover: '#c8773a',
    colorPrimaryActive: '#8f4218',
    colorPrimaryBg: '#fdf1e8',
    colorPrimaryBgHover: '#f9e3d3',
    colorSuccess: '#15803d',
    colorWarning: '#a16207',
    colorError: '#b91c1c',
    colorInfo: '#1d4ed8',
    colorText: '#18181b',
    colorTextSecondary: '#52525b',
    colorTextTertiary: '#71717a',
    colorTextQuaternary: '#a1a1aa',
    colorBgLayout: '#f7f7f6',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorFillAlter: '#fbfbfa',
    colorFillSecondary: '#f0f0ee',
    colorFillTertiary: '#f7f7f6',
    colorBorder: '#d4d4d1',
    colorBorderSecondary: '#e6e6e3',
    colorSplit: '#e6e6e3',
    controlOutline: 'rgba(168, 79, 28, 0.14)',
    controlItemBgActive: '#fdf1e8',
    controlItemBgHover: '#fbfbfa',
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 10,
    controlHeight: 36,
    fontSize: 14,
    boxShadow:
      '0 2px 4px rgba(24, 24, 27, 0.04), 0 12px 24px -8px rgba(24, 24, 27, 0.1)',
    boxShadowSecondary:
      '0 2px 4px rgba(24, 24, 27, 0.04), 0 12px 24px -8px rgba(24, 24, 27, 0.1)',
    /* Default Ant link blue → brand burgundy (Typography, Breadcrumb, etc.) */
    colorLink: '#8f4218',
    colorLinkHover: '#a84f1c',
    colorLinkActive: '#74360f',
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      headerFontSize: 15,
    },
    Table: {
      headerBg: '#fbfbfa',
      headerColor: '#71717a',
      rowHoverBg: '#fbfbfa',
      borderColor: '#e6e6e3',
    },
    Tabs: {
      itemColor: '#5f5f69',
      itemSelectedColor: '#8f4218',
      itemHoverColor: '#18181b',
      inkBarColor: '#a84f1c',
    },
    Segmented: {
      itemSelectedBg: '#ffffff',
      trackBg: '#f0f0ee',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: '#52525b',
      itemSelectedBg: '#fdf1e8',
      itemSelectedColor: '#8f4218',
      itemHoverColor: '#18181b',
      itemHoverBg: '#f7f7f6',
      itemBorderRadius: 6,
      itemHeight: 40,
      itemMarginInline: 12,
      iconSize: 17,
    },
    Modal: {
      titleFontSize: 18,
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <App>
        <AuthProvider>
          <ShopProvider>{children}</ShopProvider>
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}
