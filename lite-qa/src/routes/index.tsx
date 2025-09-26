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
const GraphEmbedDocumentsPage = lazy(() => import('../pages/graph/GraphEmbedDocumentsPage'));
const GraphEmbedRetrievalPage = lazy(() => import('../pages/graph/GraphEmbedRetrievalPage'));
const GraphSettingsPage = lazy(() => import('../pages/graph/GraphSettingsPage'));
const LangDBMonitorPage = lazy(() => import('../pages/LangDBMonitorPage'));
const SystemConfigTest = lazy(() => import('../pages/test/SystemConfigTest').then(module => ({ default: module.SystemConfigTest })));

// 新增页面
const ModelManagementPage = lazy(() => import('../pages/intelligent/ModelManagementPage'));
const IntelligentConfigPage = lazy(() => import('../pages/intelligent/ScenarioBasedAgentPage'));
const AgentCreatorPage = lazy(() => import('../pages/intelligent/AgentCreatorPage'));
const HybridStrategyPage = lazy(() => import('../pages/intelligent/HybridStrategyPage'));
const MultimodalInputTest = lazy(() => import('../pages/test/MultimodalInputTest'));
const ExecutionMonitorPage = lazy(() => import('../pages/intelligent/ExecutionMonitorPage'));
const ExecutionConsolePage = lazy(() => import('../pages/intelligent/ExecutionConsolePage'));
const SceneManagementPage = lazy(() => import('../pages/agent/SceneManagementPage'));
const DAGStrategyManagementPage = lazy(() => import('../pages/agent/DAGStrategyManagementPage'));
const UnifiedAgentFactoryPage = lazy(() => import('../pages/agent/UnifiedAgentFactoryPage'));
const MCPToolsPageSimple = lazy(() => import('../pages/tools/MCPUnlaEmbed'));
const AtlasPage = lazy(() => import('../pages/atlas/AtlasPage'));

// Agent管理页面
const AgentManagementPage = lazy(() => import('../pages/agent-management/AgentManagementPage'));
const TemplateManagementPage = lazy(() => import('../pages/agent-management/TemplateManagementPage'));

// 知识库子页面
const KnowledgeDocumentManagementPage = lazy(() => import('../pages/knowledge/DocumentManagementPage'));
const KnowledgeCollectionManagementPage = lazy(() => import('../pages/knowledge/CollectionManagementPage'));
const KnowledgeQADatasetPage = lazy(() => import('../pages/knowledge/QADatasetPage'));
const KnowledgeRetrievalTestPage = lazy(() => import('../pages/knowledge/RetrievalTestPage'));
const KnowledgeChunkingConfigPage = lazy(() => import('../pages/knowledge/ChunkingConfigPage'));

// 新增全局知识库管理页面
const KnowledgeGlobalConfigPage = lazy(() => import('../pages/knowledge/KnowledgeGlobalConfigPage'));

// 新增问答对提取和路由页面
const QAExtractionPage = lazy(() => import('../pages/knowledge/QAExtractionPage'));
const QARoutingPage = lazy(() => import('../pages/knowledge/QARoutingKBPage'));
const CustomQARoutesPage = lazy(() => import('../pages/knowledge/CustomQARoutesPage'));

// 新增爬虫和DeepScrape页面
const DeepScrapePage = lazy(() => import('../pages/crawler/DeepScrapePage'));

// 智能体子页面
const AgentTemplateManagePage = lazy(() => import('../pages/agent/AgentTemplateManagePage'));
const ToolsImportTestPage = lazy(() => import('../pages/agent/ToolsImportTestPage'));
const ToolsRunListPage = lazy(() => import('../pages/agent/ToolsRunListPage'));
const AgentWorkflowTestPage = lazy(() => import('../pages/agent/AgentWorkflowTestPage'));
const AgentStudioPage = lazy(() => import('../pages/agent/AgentStudioPage'));
const TeamAgentStudioPage = lazy(() => import('../pages/agent/team/TeamAgentStudioPage'));
const AgentNavigationPage = lazy(() => import('../pages/agent/AgentNavigationPage'));
const AgentEmbedPage = lazy(() => import('../pages/embed/AgentEmbedPage'));
// 移除团队历史页面
const WorkflowTemplatesPage = lazy(() => import('../pages/agent/WorkflowTemplatesPage'));
const WorkflowExecutionsPage = lazy(() => import('../pages/agent/WorkflowExecutionsPage'));
const TemplateRequirementsEditor = lazy(() => import('../pages/agent/TemplateRequirementsEditor'));

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
  // 独立嵌入页（不包裹系统Layout）
  {
    path: '/embed/agent/:agentId',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <AgentEmbedPage />
        </Suspense>
      </ErrorBoundary>
    )
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
        path: 'knowledge/custom-qa',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <CustomQARoutesPage />
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
        path: 'knowledge/qa-extraction',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <QAExtractionPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'knowledge/qa-routing',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <QARoutingPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'crawler/deepscrape',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <DeepScrapePage />
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
        path: 'graph/documents',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <GraphEmbedDocumentsPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'graph/retrieval',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <GraphEmbedRetrievalPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'graph/settings',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <GraphSettingsPage />
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
        element: <Navigate to="/app/intelligent/creator" replace />
      },
      {
        path: 'intelligent/model',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <ModelManagementPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'intelligent/creator',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentCreatorPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'test/multimodal-input',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <MultimodalInputTest />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'intelligent/strategy',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <HybridStrategyPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
        {
          path: 'intelligent/monitor',
          element: (
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <ExecutionMonitorPage />
              </Suspense>
            </ErrorBoundary>
          )
        },
        {
          path: 'intelligent/console',
          element: (
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <ExecutionConsolePage />
              </Suspense>
            </ErrorBoundary>
          )
        },
      {
        path: 'agent-management',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <UnifiedAgentFactoryPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent-config',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <SceneManagementPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent-templates',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentTemplateManagePage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'dag-strategy',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <DAGStrategyManagementPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent',
        element: <Navigate to="/app/agent/navigation" replace />
      },
      {
        path: 'agent/navigation',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentNavigationPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/tools-test',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <ToolsImportTestPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/tools-runs',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <ToolsRunListPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/studio',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentStudioPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'embed/agent/:agentId',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentEmbedPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/team-studio',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <TeamAgentStudioPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/workflow-test',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <AgentWorkflowTestPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/workflow-templates',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <WorkflowTemplatesPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/workflow-executions',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <WorkflowExecutionsPage />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'agent/template-requirements',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <TemplateRequirementsEditor />
            </Suspense>
          </ErrorBoundary>
        )
      },
      {
        path: 'tools',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <MCPToolsPageSimple />
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
        path: '/app/agent/navigation',
        name: '智能体导航',
        icon: 'AppstoreOutlined',
        description: '卡片式浏览模板与我的智能体'
      },
      // 历史页面已移除：单体智能体、团队智能体、智能体导航
      {
        path: '/app/agent/tools-test',
        name: '工具导入测试',
        icon: 'ToolOutlined',
        description: '验证 MCP/API 工具发现与调用接入'
      },
      {
        path: '/app/agent/tools-runs',
        name: '工具执行记录',
        icon: 'OrderedListOutlined',
        description: '查看与回放 Agent 工具执行的结果与日志'
      },
      {
        path: '/app/agent/workflow-test',
        name: '工作流测试',
        icon: 'PartitionOutlined',
        description: '以工作流方式运行智能体并查看事件流'
      },
      {
        path: '/app/agent/workflow-templates',
        name: '工作流模板',
        icon: 'GatewayOutlined',
        description: 'DAG 模板化编排的管理与运行'
      },
      {
        path: '/app/agent/workflow-executions',
        name: '执行历史',
        icon: 'HistoryOutlined',
        description: '查看 DAG 运行的历史与详情'
      },
      {
        path: '/app/agent/template-requirements',
        name: '资源需求',
        icon: 'AuditOutlined',
        description: '为模板声明所需资源并保存到模板配置'
      },
      {
        path: '/app/agent-templates',
        name: '模板管理',
        icon: 'AppstoreOutlined',
        description: '智能体模板管理和配置'
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
      {
        path: '/app/knowledge/qa-extraction',
        name: '问答对提取',
        icon: 'FileTextOutlined',
        description: '自动从文档中提取高质量的问答对数据'
      },
      {
        path: '/app/knowledge/qa-routing',
        name: '问答路由',
        icon: 'BranchesOutlined',
        description: '智能路由配置，将问题分发到最合适的知识库和智能体'
      },
      {
        path: '/app/knowledge/custom-qa',
        name: '自定义问答',
        icon: 'FormOutlined',
        description: '为知识库添加手工问答对（统一存储，优先检索）'
      },
    ]
  },
  {
    path: '/app/crawler',
    name: '智能爬虫',
    icon: 'GlobalOutlined',
    description: '智能网页抓取与内容提取',
    children: [
      {
        path: '/app/crawler/deepscrape',
        name: '任务监控',
        icon: 'MonitorOutlined',
        description: '智能抓取任务状态监控和管理'
      }
    ]
  },
  {
    path: '/app/graph',
    name: '知识图谱',
    icon: 'NodeIndexOutlined',
    description: '知识图谱管理系统',
    children: [
      {
        path: '/app/graph',
        name: '知识图谱',
        icon: 'NodeIndexOutlined',
        description: '图谱可视化与交互（iframe）'
      },
      {
        path: '/app/graph/documents',
        name: '文档',
        icon: 'FileTextOutlined',
        description: 'DataGraph 文档管理（iframe）'
      },
      {
        path: '/app/graph/retrieval',
        name: '图谱检索',
        icon: 'SearchOutlined',
        description: '基于知识图谱的检索测试与路径查询'
      }
      ,
      {
        path: '/app/graph/settings',
        name: '图谱设置',
        icon: 'SettingOutlined',
        description: '模型注入与图谱服务配置查看'
      }
    ]
  },
      {
        path: '/app/intelligent',
        name: '智能工厂',
        icon: 'ThunderboltOutlined',
        description: '企业级智能体全生命周期管理平台',
        children: [
          {
            path: '/app/intelligent/creator',
            name: '智能体向导',
            icon: 'ExperimentOutlined',
            description: 'Meta-Agent对话式智能体创建向导'
          },
          {
            path: '/app/agent-management',
            name: '管理中心',
            icon: 'SettingOutlined',
            description: '多框架智能体实例管理和运维中心'
          },
          {
            path: '/app/intelligent/console',
            name: '执行控制台',
            icon: 'ControlOutlined',
            description: '实时执行监控和交互式调试界面'
          },
          {
            path: '/app/intelligent/strategy',
            name: '路由策略中心',
            icon: 'BranchesOutlined',
            description: '查询分发和负载均衡管理'
          },
          {
            path: '/app/intelligent/monitor',
            name: '性能监控中心',
            icon: 'DashboardOutlined',
            description: '系统性能和业务指标监控'
          }
        ]
      },
  {
    path: '/app/scene-management',
    name: '场景管理',
    icon: 'SettingOutlined',
    description: '业务场景和执行策略管理',
    children: [
      {
        path: '/app/agent-config',
        name: '场景列表',
        icon: 'UnorderedListOutlined',
        description: '四大基础场景的元数据模板管理'
      },
      {
        path: '/app/dag-strategy',
        name: '执行器管理',
        icon: 'NodeIndexOutlined',
        description: 'DAG执行策略和智能体协作流程管理'
      }
    ]
  },
  {
    path: '/app/tools',
    name: '模型&工具',
    icon: 'ToolOutlined',
    description: '统一工具管理和调用平台'
  },
  {
    path: '/app/atlas',
    name: 'Atlas可视化',
    icon: 'RadarChartOutlined',
    description: '向量空间可视化分析'
  }
] as const; 
