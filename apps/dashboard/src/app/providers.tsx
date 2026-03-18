'use client';

import { ConfigProvider } from 'antd';

const theme = {
  token: {
    colorPrimary: '#c9932d',
    colorPrimaryHover: '#d4a84b',
    colorPrimaryActive: '#a67c23',
    colorText: '#1a110c',
    colorTextSecondary: '#6b4a30',
    colorTextTertiary: '#8a6b4a',
    colorBgContainer: '#f1e9d9',
    colorBorder: '#e8e2d9',
    colorBorderSecondary: '#e8e2d9',
    borderRadius: 8,
  },
  components: {
    Menu: {
      itemColor: '#1a110c',
      itemSelectedBg: 'rgba(201, 147, 45, 0.2)',
      itemSelectedColor: '#a67c23',
      itemHoverColor: '#c9932d',
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
