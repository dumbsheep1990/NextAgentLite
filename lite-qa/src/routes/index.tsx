/**
 * 路由配置 - 基于React Router
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import Layout from '../layouts/Layout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../components/auth/LoginPage';

// 页面懒加载
const WelcomePage = lazy(() => import('../pages/WelcomePage'));
const QAPage = lazy(() => import('../pages/qa/QAPage'));
const TestSimplePage = lazy(() => import('../pages/TestSimplePage'));
const KnowledgePageClean = lazy(() => import('../pages/knowledge/KnowledgePageClean'));
const MatGraphPage = lazy(() => import('../pages/graph/MatGraphPage'));
const LangDBMonitorPage = lazy(() => import('../pages/LangDBMonitorPage'));
const SystemConfigTest = lazy(() => import('../pages/test/SystemConfigTest').then(module => ({ default: module.SystemConfigTest })));

// 新增页面
const ModelManagementPage = lazy(() => import('../pages/intelligent/ModelManagementPage'));
const AgentConfigPage = lazy(() => import('../pages/agent/AgentConfigPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const SystemToolsPage = lazy(() => import('../pages/tools/SystemToolsPage'));
const AtlasPage = lazy(() => import('../pages/atlas/AtlasPage'));

// 知识库子页面
const KnowledgeDocumentManagementPage = lazy(() => import('../pages/knowledge/DocumentManagementPage'));
const KnowledgeCollectionManagementPage = lazy(() => import('../pages/knowledge/CollectionManagementPage'));
const KnowledgeQADatasetPage = lazy(() => import('../pages/knowledge/QADatasetPage'));
const KnowledgeRetrievalTestPage = lazy(() => import('../pages/knowledge/RetrievalTestPage'));
const KnowledgeChunkingConfigPage = lazy(() => import('../pages/knowledge/ChunkingConfigPage'));

// 新增全局知识库管理页面
const KnowledgeGlobalConfigPage = lazy(() => import('../pages/knowledge/KnowledgeGlobalConfigPage'));

// 智能体子页面
const SingleAgentPage = lazy(() => import('../pages/agent/SingleAgentPage'));
const TeamAgentPage = lazy(() => import('../pages/agent/TeamAgentPage'));

// 加载组件
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <Spin size="large" tip="页面加载中...">
      <div style={{ minHeight: 200, minWidth: 200 }} />
    </Spin>
  </div>
);

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <Navigate to="/app" replace />
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <WelcomePage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'qa',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <QAPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'team',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <QAPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'test-simple',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <TestSimplePage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'langdb-monitor',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <LangDBMonitorPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'knowledge',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <KnowledgePageClean />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'knowledge/global-config',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <KnowledgeGlobalConfigPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'graph',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <MatGraphPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'test/config',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <SystemConfigTest />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'langdb-monitor',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <LangDBMonitorPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'intelligent',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <ModelManagementPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent-config',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentConfigPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent',
        element: <Navigate to="/app/agent/single" replace />
      },
      {
        path: 'agent/single',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <SingleAgentPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/single/:conversationId',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <SingleAgentPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/team',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <TeamAgentPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/team/:conversationId',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <TeamAgentPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'dashboard',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'tools',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <SystemToolsPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'atlas',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AtlasPage />
            </Suspense>
          </ErrorBoundary>
        )
      }
    ]
  },
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-4">页面不存在</p>
          <a href="/" className="text-blue-500 hover:text-blue-700">
            返回首页
          </a>
        </div>
      </div>
    )
  }
]);

// 路由信息配置 - 完整的导航菜单
export const routes = [
  {
    path: '/app',
    name: '首页',
    icon: 'HomeOutlined',
    description: '欢迎页面和模式选择'
  },
  {
    path: '/app/agent',
    name: '智能体',
    icon: 'BulbOutlined',
    description: '智能体对话和协作系统',
    children: [
      {
        path: '/app/agent/single',
        name: '单体智能体',
        icon: 'UserOutlined',
        description: '单个智能体专家对话'
      },
      {
        path: '/app/agent/team',
        name: '团队智能体',
        icon: 'TeamOutlined',
        description: '多智能体团队协作'
      }
    ]
  },
  {
    path: '/app/knowledge',
    name: '知识库',
    icon: 'BookOutlined',
    description: 'Collection中心化的知识库管理系统',
    children: [
      {
        path: '/app/knowledge',
        name: '知识库管理',
        icon: 'DatabaseOutlined',
        description: 'Collection工作区 - 文档、QA、检索、配置统一管理'
      },
      {
        path: '/app/knowledge/global-config',
        name: '全局配置',
        icon: 'SettingOutlined',
        description: '系统级配置和策略管理（包含维护管理）'
      },
    ]
  },
  {
    path: '/app/graph',
    name: '知识图谱',
    icon: 'NodeIndexOutlined',
    description: '知识图谱管理系统'
  },
  {
    path: '/app/intelligent',
    name: '智能配置',
    icon: 'ThunderboltOutlined',
    description: '模型管理和性能监控'
  },
  {
    path: '/app/agent-config',
    name: 'Agent配置',
    icon: 'SettingOutlined',
    description: 'Agent和Team配置管理'
  },
  {
    path: '/app/dashboard',
    name: '系统看板',
    icon: 'DashboardOutlined',
    description: '系统状态和统计信息'
  },
  {
    path: '/app/tools',
    name: '系统工具',
    icon: 'ToolOutlined',
    description: '系统维护和开发工具'
  },
  {
    path: '/app/atlas',
    name: 'Atlas可视化',
    icon: 'RadarChartOutlined',
    description: '向量空间可视化分析'
  }
] as const; 