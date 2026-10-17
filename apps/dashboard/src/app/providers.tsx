'use client';

import { App, ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShopProvider } from '@/contexts/ShopContext';

const theme = {
  token: {
    colorPrimary: '#7e2a33',
    colorPrimaryHover: '#973843',
    colorPrimaryActive: '#66212a',
    colorPrimaryBg: '#f7ebec',
    colorPrimaryBgHover: '#efd9db',
    colorSuccess: '#2f7d5b',
    colorWarning: '#a8661a',
    colorError: '#b4412f',
    colorInfo: '#7e2a33',
    colorText: '#1c1612',
    colorTextSecondary: '#5e5148',
    colorTextTertiary: '#7f7064',
    colorTextQuaternary: '#a89a8e',
    colorBgLayout: '#f5f1ea',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorFillAlter: '#fbf9f6',
    colorFillSecondary: '#f0ebe4',
    colorFillTertiary: '#f5f1ea',
    colorBorder: '#ddd4c8',
    colorBorderSecondary: '#ece6dd',
    colorSplit: '#ece6dd',
    controlOutline: 'rgba(126, 42, 51, 0.14)',
    controlItemBgActive: '#f7ebec',
    controlItemBgHover: '#fbf9f6',
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 10,
    controlHeight: 36,
    fontSize: 14,
    boxShadow:
      '0 2px 4px rgba(28, 22, 18, 0.04), 0 12px 24px -8px rgba(28, 22, 18, 0.1)',
    boxShadowSecondary:
      '0 2px 4px rgba(28, 22, 18, 0.04), 0 12px 24px -8px rgba(28, 22, 18, 0.1)',
    /* Default Ant link blue → brand burgundy (Typography, Breadcrumb, etc.) */
    colorLink: '#66212a',
    colorLinkHover: '#7e2a33',
    colorLinkActive: '#4f1920',
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
      headerBg: '#fbf9f6',
      headerColor: '#7f7064',
      rowHoverBg: '#fbf9f6',
      borderColor: '#ece6dd',
    },
    Tabs: {
      itemColor: '#6b5d52',
      itemSelectedColor: '#66212a',
      itemHoverColor: '#1c1612',
      inkBarColor: '#c9a35c',
    },
    Segmented: {
      itemSelectedBg: '#ffffff',
      trackBg: '#f0ebe4',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: '#5e5148',
      itemSelectedBg: '#f7ebec',
      itemSelectedColor: '#66212a',
      itemHoverColor: '#1c1612',
      itemHoverBg: '#f5f1ea',
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
