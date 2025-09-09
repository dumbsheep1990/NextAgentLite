/**
 * 主应用组件 - 使用React Router进行路由管理
 */
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './routes';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import './App.css';

// Ant Design 主题配置
const antdTheme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#fff',
      siderBg: '#fff',
    },
    Button: {
      borderRadius: 6,
    },
    Input: {
      borderRadius: 6,
    },
  },
};

const App: React.FC = () => {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={antdTheme}
    >
      <BreadcrumbProvider>
        <RouterProvider router={router} />
      </BreadcrumbProvider>
    </ConfigProvider>
  );
};

export default App;
