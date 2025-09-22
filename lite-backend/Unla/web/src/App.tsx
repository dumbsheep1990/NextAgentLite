import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/login';
import { LLMChatInterface } from './pages/chat/llm-chat-interface';
import { ConfigVersionsPage } from './pages/gateway/config-versions';
import { GatewayManager } from './pages/gateway/gateway-manager';
import LLMSettings from './pages/llm/llm-settings';
import LLMEmbeddingsPage from './pages/llm/llm-embeddings';
import LLMRerankPage from './pages/llm/llm-rerank';
import MCPToolsPage from './pages/tools/MCPToolsPage';
import APIToolsPage from './pages/tools/APIToolsPage';
// Embedded 模式下移除用户/租户管理页面

// Initialize theme on app startup
function ThemeInitializer() {
  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}

// 当通过 IFrame 嵌入并在 URL 中携带 token 时，写入 localStorage 以免登录
function TokenInitializer() {
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      if (token) {
        window.localStorage.setItem('token', token);
        url.searchParams.delete('token');
        window.history.replaceState(null, document.title, url.toString());
      }
    } catch {}
  }, []);
  return null;
}

// Route guard component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // 全局放行：当前系统作为内嵌/受信环境使用，去除登录拦截
  return <>{children}</>;
}

// Main layout component
function MainLayout() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GatewayManager />} />
        <Route path="/chat" element={<LLMChatInterface />} />
        <Route path="/chat/:sessionId" element={<LLMChatInterface />} />
        <Route path="/gateway/*" element={<GatewayManager />} />
        <Route path="/gateway" element={<PrivateRoute><GatewayManager /></PrivateRoute>} />
        <Route path="/gateway/mcp-tools" element={<PrivateRoute><GatewayManager /></PrivateRoute>} />
        <Route path="/gateway/api-tools" element={<PrivateRoute><GatewayManager /></PrivateRoute>} />
        <Route path="/tools/mcp" element={<PrivateRoute><MCPToolsPage /></PrivateRoute>} />
        <Route path="/tools/api" element={<PrivateRoute><APIToolsPage /></PrivateRoute>} />
        <Route path="/gateway/configs/:name/versions" element={<PrivateRoute><ConfigVersionsPage /></PrivateRoute>} />
        <Route path="/config-versions" element={<PrivateRoute><ConfigVersionsPage /></PrivateRoute>} />
        <Route path="/llm" element={<PrivateRoute><LLMSettings /></PrivateRoute>} />
        <Route path="/llm-embeddings" element={<PrivateRoute><LLMEmbeddingsPage /></PrivateRoute>} />
        <Route path="/llm-rerank" element={<PrivateRoute><LLMRerankPage /></PrivateRoute>} />
        {/* 用户/租户管理路由已移除（统一由外部系统管理） */}
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router
      basename={(window.RUNTIME_CONFIG?.VITE_BASE_URL as string) || '/'}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <ThemeInitializer />
      <TokenInitializer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
