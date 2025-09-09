# MAT-DEMO 项目技术架构说明文档

## 项目概述

MAT-DEMO是一个基于人工智能的地聚物材料智能问答系统，采用前后端分离架构，集成了多智能体协作、知识图谱、向量检索等先进技术。项目采用Monorepo结构管理前端React应用和后端Python服务。

## 整体架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
├─────────────────────────────────────────────────────────────┤
│  Pages    │  Components  │  Services  │  Stores  │  Config  │
├─────────────────────────────────────────────────────────────┤
│                   HTTP/SSE/WebSocket                        │
├─────────────────────────────────────────────────────────────┤
│                      Backend (FastAPI)                      │
├─────────────────────────────────────────────────────────────┤
│   API     │   Service   │    Core    │    DB    │  Config   │
├─────────────────────────────────────────────────────────────┤
│              External Services & Storage                    │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL │ Elasticsearch │ MatGraph │ LLM APIs │ MinIO   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

#### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI库**: Ant Design + Tailwind CSS  
- **状态管理**: Zustand
- **路由**: React Router v7
- **图谱可视化**: vis-network
- **数学渲染**: KaTeX + react-katex

#### 后端技术栈
- **框架**: FastAPI + Python 3.11
- **多智能体框架**: Agno Framework
- **数据库**: PostgreSQL + Elasticsearch
- **知识图谱**: MatGraph (基于LightRAG)
- **对象存储**: MinIO
- **AI模型**: 
  - LLM: qwen3-30b、Gemini-2.5-Flash
  - 嵌入模型: text-embedding-v4、MatBERT
- **任务队列**: Redis + 自定义队列服务

## 后端架构详解

### 1. 服务层架构 (Service Layer)

#### 1.1 Agent和Team相关服务

##### AgentService (`agent_service.py`)
**职责**: 单一智能体对话处理、流式响应管理、会话管理

**核心API**:
```python
async def single_agent_query(
    agent_name: str, 
    question: str, 
    stream: bool = False, 
    model_name: str = None, 
    search_knowledge: bool = True, 
    session_id: str = None
) -> AgentResponse

async def team_query_stream(
    team_name: str, 
    question: str, 
    session_id: str = None
) -> AsyncGenerator[Dict[str, Any], None]
```

**设计特点**:
- 支持流式和非流式两种响应模式
- 集成知识检索和上下文管理
- 会话状态持久化

##### AdvancedAgentTeamService (`advanced_agent_team_service.py`)
**职责**: 基于Agno框架的多智能体协作系统

**架构设计**:
```python
class AdvancedAgentTeamService:
    def __init__(self):
        self.tools = {
            'translation': TranslationTools(),
            'retrieval': MultilingualRetrievalTools(), 
            'lightrag': LightRAGTools()
        }
        self.agent_factory = AgentFactory()
```

**工具化抽象**:
- **TranslationTools**: 中英文双向翻译
- **MultilingualRetrievalTools**: 多语言知识检索
- **LightRAGTools**: 知识图谱查询

##### Team v2 架构 (`team_v2/`)
**新一代Team执行架构**，采用单例模式和流式处理：

- **NewTeamExecutionService**: 基于单实例管理的执行服务
- **SingletonTeamManager**: 单例Team管理器，避免重复创建
- **ExecutionTracker**: 执行过程追踪和监控
- **SSEDataAdapter**: Server-Sent Events数据适配器

#### 1.2 检索相关服务

##### HybridSearchService (`hybrid_search_service.py`)
**职责**: 向量检索和关键词检索融合

**检索策略**:
```python
async def hybrid_search(
    query: str, 
    top_k: int = 20, 
    weights: Optional[Dict[str, float]] = None, 
    include_highlights: bool = True
) -> List[SearchResult]
```

**算法设计**:
- 向量相似度计算 (权重: 0.6)
- BM25关键词匹配 (权重: 0.4)  
- 结果重排序和去重
- 多语言查询优化

##### DualVectorService (`dual_vector_service.py`)
**职责**: 通用向量和领域向量协同检索

**数据结构**:
```python
@dataclass
class DualVectorResult:
    general_vector: List[float]    # 通用向量 (text-embedding-v4)
    domain_vector: List[float]     # 领域向量 (MatBERT)  
    general_model: str
    domain_model: str
    fusion_score: float
```

**融合算法**:
- 双向量相似度计算
- 自适应权重调整  
- 结果融合和排序

##### IntelligentRetrievalService (`intelligent_retrieval_service.py`)
**职责**: 智能检索策略选择和查询路由

**决策逻辑**:
```python
def select_retrieval_strategy(self, query: str) -> RetrievalStrategy:
    if self.is_entity_query(query):
        return RetrievalStrategy.GRAPH_ENHANCED
    elif self.is_complex_query(query):
        return RetrievalStrategy.HYBRID_WEIGHTED  
    else:
        return RetrievalStrategy.VECTOR_ONLY
```

#### 1.3 LLM和嵌入服务

##### LLMService (`llm_service.py`)
**职责**: 多LLM提供商统一抽象层

**提供商架构**:
```python
class ModelProvider(Enum):
    ALIBABA = "alibaba"    # 阿里云通义系列
    GOOGLE = "google"      # Google Gemini系列
    OPENAI = "openai"      # OpenAI GPT系列
    CUSTOM = "custom"      # 自定义模型
```

**负载均衡和容错**:
- 自动模型选择
- API调用重试机制
- 降级和fallback策略

##### EmbeddingService (`embedding_service.py`) 
**职责**: 多种嵌入模型统一管理

**模型支持**:
```python
class EmbeddingProvider(Enum):
    ALIBABA_EMBEDDING = "alibaba"     # text-embedding-v4
    MATBERT_EMBEDDING = "matbert"     # 材料领域专用模型  
    OPENAI_EMBEDDING = "openai"       # text-embedding-ada-002
```

**批处理优化**:
- 支持批量文本嵌入
- 智能批大小调整
- 并发处理优化

#### 1.4 知识图谱服务

##### LightRAGClientService (`lightrag_client_service.py`)
**职责**: MatGraph知识图谱查询客户端

**查询接口**:
```python
async def query_knowledge_graph(
    query: str, 
    mode: str = "mix", 
    top_k: int = 10
) -> MatGraphQueryResult

async def query_entities(
    query: str, 
    top_k: int = 20
) -> MatGraphQueryResult
```

**流式查询支持**:
```python  
async def query_knowledge_graph_stream(
    query: str, 
    mode: str = "mix"
) -> AsyncGenerator[Dict[str, Any], None]
```

##### MatGraphClientService (`matgraph_client_service.py`)
**职责**: MatGraph服务的HTTP客户端封装

**配置管理**:
```python
self.base_url = os.getenv("MATGRAPH_SERVICE_URL", "http://localhost:9622")
self.timeout = int(os.getenv("MATGRAPH_REQUEST_TIMEOUT", "30"))
```

### 2. 数据访问层 (Repository Layer)

#### 2.1 知识库访问
- **KnowledgeRepository**: 文档和分块数据访问
- **GraphRepository**: 图谱数据访问  
- **ConversationRepository**: 对话历史访问

#### 2.2 配置管理
- **ChunkingConfigRepository**: 分块配置管理
- **QADatasetRepository**: 问答数据集管理

### 3. 核心模块 (Core Layer)

#### 3.1 配置管理 (`config_optimized.py`)
**职责**: 统一配置管理和验证

**特点**:
- 环境变量注入
- 配置验证和类型转换
- 动态配置更新
- 多环境支持

#### 3.2 任务管理 (`team_task_manager.py`)
**职责**: Team任务的生命周期管理

**功能**:
- 任务创建和调度
- 执行状态监控
- 资源管理和清理

### 4. API层 (API Layer)

#### 4.1 路由组织
```python
api/
├── endpoints/
│   ├── qa.py              # 问答API
│   ├── team_v2_api.py     # Team v2 API  
│   ├── knowledge.py       # 知识管理API
│   ├── graph.py           # 图谱API
│   ├── auth.py            # 认证API
│   └── config.py          # 配置API
└── routes.py              # 路由汇总
```

#### 4.2 API设计特点
- RESTful接口设计
- SSE流式响应支持
- 统一错误处理
- 请求验证和限流

### 5. 数据流向分析

#### 5.1 用户查询处理流程

```
用户查询
    ↓
API接口 (qa.py, team_v2_api.py)
    ↓
服务层路由 (AgentService / EnhancedTeamService)
    ↓
多智能体协作 (AdvancedAgentTeamService)
    ↓
┌─────────────┬─────────────────┬──────────────────┐
│ 翻译服务    │ 知识检索服务    │ 图谱查询服务     │
│TransService │IntelligentRetr.│LightRAGClient    │
└─────────────┴─────────────────┴──────────────────┘
    ↓            ↓                    ↓
LLMService   HybridSearch        MatGraph服务
    ↓            ↓                    ↓  
响应生成 ←── 结果融合 ────────────── 图谱结果
    ↓
SSE流式返回给前端
```

#### 5.2 知识检索数据流

```
查询文本
    ↓
语言检测 → 翻译服务(如需要)
    ↓
智能检索路由 (IntelligentRetrievalService)
    ↓
┌──────────────┬───────────────┬──────────────────┐
│   向量检索   │  关键词检索   │    图谱检索      │
│DualVectorSvc │ElasticSearch  │LightRAGClient    │
└──────────────┴───────────────┴──────────────────┘
    ↓              ↓                 ↓
Embedding     PostgreSQL         MatGraph
Service           ↓                 ↓
    ↓         检索结果              图谱结果
通用向量          ↓                 ↓
领域向量          ↓                 ↓
    ↓         ┌─────────────────────────┐
    └────────→│    结果融合和重排序      │
              └─────────────────────────┘
                        ↓
                   最终检索结果
```

## 前端架构详解

### 1. 组件架构

#### 1.1 组件层次结构
```
src/
├── components/           # 组件层  
│   ├── auth/            # 认证组件
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── common/          # 通用组件
│   │   ├── ErrorBoundary.tsx
│   │   ├── SystemSettings.tsx
│   │   └── TaskStateRecovery.tsx
│   ├── qa/              # 问答系统组件
│   │   ├── MessageList.tsx         # 消息列表
│   │   ├── MessageItem.tsx         # 消息项
│   │   ├── InputBox.tsx           # 输入框
│   │   ├── TeamExecutionFlow.tsx   # Team执行流程
│   │   ├── ThinkingRenderer.tsx    # 思考过程渲染
│   │   └── SourcePanel.tsx         # 知识源面板
│   ├── graph/           # 知识图谱组件
│   │   ├── GraphVisualization.tsx  # 图谱可视化
│   │   ├── NodeDetailPanel.tsx     # 节点详情
│   │   └── GraphTaskMonitor.tsx    # 任务监控
│   └── knowledge/       # 知识管理组件
│       ├── DocumentList.tsx        # 文档列表
│       ├── UploadModal.tsx        # 上传模态框
│       └── RetrievalTest.tsx      # 检索测试
├── pages/               # 页面层
│   ├── qa/
│   │   ├── QAPage.tsx             # 问答页面
│   │   └── TeamPage.tsx           # Team协作页面  
│   ├── knowledge/
│   │   └── KnowledgePage.tsx      # 知识管理页面
│   └── graph/
│       └── MatGraphPage.tsx       # 知识图谱页面
├── layouts/             # 布局层
│   └── Layout.tsx                 # 主布局
└── routes/              # 路由配置
    └── index.tsx
```

#### 1.2 设计模式应用

**复合组件模式**:
```typescript
// QA系统的复合组件设计
<QAPage>
  <MessageList>
    <MessageItem />
    <MessageItem />
  </MessageList>
  <InputBox />
  <SourcePanel />
</QAPage>
```

**自定义Hook模式**:
```typescript
// hooks/useConfig.ts - 业务逻辑封装
export const useConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const validateConfig = useCallback(async () => {
    // 配置验证逻辑
  }, []);
  
  return { config, loading, validateConfig };
};
```

### 2. 状态管理

#### 2.1 Zustand Store架构
```typescript
stores/
├── appStore.ts           # 全局应用状态
├── authStore.ts          # 认证状态  
├── qaStore.ts           # 问答系统状态 (1000+行)
├── knowledgeStore.ts    # 知识库状态
├── graphStore.ts        # 知识图谱状态
└── teamExecutionStore.ts # Team执行状态
```

#### 2.2 QAStore核心功能
```typescript
interface QAState {
  // 会话管理
  currentSessionId: string | null;
  sessions: Record<string, QASession>;
  
  // 消息管理
  messages: Message[];
  isLoading: boolean;
  
  // 智能体配置
  agents: AgentConfig[];
  selectedAgent: string | null;
  
  // Team配置
  teamConfig: TeamConfig | null;
  teamExecutionState: TeamExecutionState;
}
```

**核心功能**:
- 会话生命周期管理
- 消息流式处理
- 智能体和Team配置
- 实时状态同步

#### 2.3 持久化策略
```typescript
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({...}),
      {
        name: 'app-store',
        partialize: (state) => ({
          preferences: state.preferences,
          config: state.config,
        }),
      }
    )
  )
);
```

### 3. 服务层设计

#### 3.1 服务架构
```typescript
services/
├── api.ts              # 基础API封装
├── qaService.ts        # 问答服务 (1200+行)
├── teamService.ts      # Team协作服务
├── knowledgeService.ts # 知识库服务
├── graphService.ts     # 图谱服务
├── configAdapter.ts    # 配置适配器
└── bffService.ts       # BFF层服务
```

#### 3.2 QAService核心功能
```typescript
class QAService {
  // 单一Agent查询
  async singleAgentQuery(
    agentName: string,
    question: string,
    options: QueryOptions
  ): Promise<QAResponse>
  
  // Team协作查询
  async teamQuery(
    teamName: string, 
    question: string,
    options: TeamQueryOptions
  ): Promise<TeamResponse>
  
  // 流式查询处理
  async teamQueryStream(
    teamName: string,
    question: string, 
    onData: (data: StreamData) => void
  ): Promise<void>
}
```

**流式数据处理**:
```typescript
// SSE事件类型处理
switch (data.type) {
  case 'thinking':          // AI思考过程
  case 'knowledge_sources': // 知识源检索
  case 'agent_call':        // 智能体调用
  case 'team_analysis':     // Team协作分析
  case 'final_response':    // 最终回答
}
```

#### 3.3 配置适配器
```typescript
// configAdapter.ts - 前后端配置格式转换
export const configAdapter = {
  backendToFrontend: (config: BackendConfig): FrontendConfig => {
    return {
      models: config.llm_models.map(model => ({
        name: model.name,
        provider: model.provider,
        isDefault: model.is_default
      })),
      // 其他字段转换...
    };
  }
};
```

### 4. 页面和路由架构

#### 4.1 路由配置
```typescript
// React Router v7 + 懒加载
const QAPage = lazy(() => import('../pages/qa/QAPage'));
const TeamPage = lazy(() => import('../pages/qa/TeamPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: 'qa',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <QAPage />
            </Suspense>
          </ErrorBoundary>
        )
      }
    ]
  }
]);
```

#### 4.2 页面组合模式
**QAPage架构**:
```typescript
const QAPage: React.FC = () => {
  return (
    <div className="qa-container">
      <MessageList messages={messages} />
      <InputBox onSend={handleSend} />
      <HistoryPanel />
      <SourcePanel />
      <TeamExecutionDrawer />
    </div>
  );
};
```

### 5. 关键功能组件

#### 5.1 实时通信组件
**SSEConnectionManager**:
```typescript
interface SSEManagerProps {
  endpoint: string;
  onMessage: (data: SSEData) => void;
  autoReconnect: boolean;
  maxRetries: number;
}
```

**功能特点**:
- 自动重连机制
- 连接状态管理
- 错误处理和恢复
- 多会话支持

#### 5.2 Team执行可视化
**TeamExecutionFlow组件**:
```typescript
const TeamExecutionFlow: React.FC = () => {
  return (
    <div className="execution-flow">
      <TeamMemberCard agent={currentAgent} />
      <ExecutionStepIndicator steps={executionSteps} />
      <DecisionVisualization decisions={decisions} />
      <PerformanceMetrics metrics={metrics} />
    </div>
  );
};
```

#### 5.3 知识图谱可视化
**GraphVisualization组件**:
```typescript
interface GraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: GraphLayout;
  onNodeSelect: (node: GraphNode) => void;
}
```

**技术特点**:
- 基于vis-network的高性能渲染
- 支持10000+节点的大规模图谱
- 动态布局算法
- 交互式节点探索

### 6. 配置管理系统

#### 6.1 配置架构
```typescript
// appConfig.ts - 统一配置管理
export const APP_CONFIG = {
  // API配置
  api: {
    baseURL: getEnvValue('VITE_API_BASE_URL', 'http://localhost:8000'),
    version: getEnvValue('VITE_API_VERSION', 'v1'),
  },
  
  // MatGraph配置  
  matgraph: {
    host: getEnvValue('VITE_MATGRAPH_HOST', '127.0.0.1'),
    port: getEnvNumber('VITE_MATGRAPH_PORT', 9622),
    baseUrl: getEnvValue('VITE_MATGRAPH_BASE_URL', 'http://127.0.0.1:9622'),
  },
  
  // 功能开关
  features: {
    enableGraphView: getEnvBoolean('VITE_ENABLE_GRAPH_VIEW', true),
    enableDualVector: getEnvBoolean('VITE_ENABLE_DUAL_VECTOR', true),
  }
};
```

#### 6.2 环境变量管理
```typescript
// 类型安全的环境变量读取
const getEnvValue = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvValue(key, String(defaultValue));
  return value.toLowerCase() === 'true';
};
```

## 数据库设计

### 1. PostgreSQL数据表

#### 1.1 核心业务表
```sql
-- 知识文档表
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    metadata JSONB,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文档分块表  
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES knowledge_documents(id),
    content TEXT NOT NULL,
    chunk_index INTEGER,
    general_embedding vector(1024),    -- 通用向量
    domain_embedding vector(768),      -- 领域向量  
    metadata JSONB
);

-- 对话会话表
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id VARCHAR(100),
    title VARCHAR(200),
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.2 Agent配置表
```sql
-- Team配置表
CREATE TABLE agent_teams (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    team_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Agent配置表
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY,
    agent_name VARCHAR(100) UNIQUE NOT NULL, 
    config JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Elasticsearch索引设计

#### 2.1 文档索引
```json
{
  "mappings": {
    "properties": {
      "title": {"type": "text", "analyzer": "ik_max_word"},
      "content": {"type": "text", "analyzer": "ik_max_word"},
      "dense_vector": {"type": "dense_vector", "dims": 1024},
      "metadata": {
        "properties": {
          "source": {"type": "keyword"},
          "doc_type": {"type": "keyword"},
          "language": {"type": "keyword"}
        }
      }
    }
  }
}
```

## 部署架构

### 1. 开发环境

#### 1.1 服务启动
```bash
# 后端服务启动
cd mat-backend
python main.py                    # FastAPI服务 (端口8000)
bash start_matgraph.sh            # MatGraph服务 (端口9622)

# 前端服务启动
cd mat-qa  
npm run dev                       # Vite开发服务器 (端口3000)
```

#### 1.2 PM2部署
```bash
# 使用PM2管理服务
pm2 start web.js --name web       # 前端服务
pm2 start server.js --name server # 后端服务
pm2 start matgraph.js --name matgraph # MatGraph服务
```

### 2. 生产环境

#### 2.1 容器化部署
```dockerfile
# 后端Dockerfile
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]

# 前端Dockerfile  
FROM node:18-alpine
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

#### 2.2 Docker Compose
```yaml
version: '3.8'
services:
  mat-backend:
    build: ./mat-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/matdb
      
  mat-qa:
    build: ./mat-qa  
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://mat-backend:8000
      
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=matdb
```

## 性能优化

### 1. 后端优化

#### 1.1 异步处理
- 全面采用async/await模式
- HTTP客户端使用连接池
- 数据库连接池管理
- 并发任务调度

#### 1.2 缓存策略
```python
# LLM响应缓存
@lru_cache(maxsize=1000)
async def cached_llm_call(prompt: str, model: str) -> str:
    return await llm_service.call(prompt, model)

# 翻译结果缓存
translation_cache = TTLCache(maxsize=5000, ttl=3600)
```

#### 1.3 数据库优化  
```sql
-- 向量检索索引
CREATE INDEX CONCURRENTLY idx_chunks_general_embedding 
ON document_chunks USING ivfflat (general_embedding vector_cosine_ops);

-- 复合查询索引
CREATE INDEX idx_documents_metadata ON knowledge_documents 
USING gin(metadata);
```

### 2. 前端优化

#### 2.1 代码分割
```typescript
// 路由级懒加载
const QAPage = lazy(() => import('../pages/qa/QAPage'));

// 组件级懒加载
const HeavyComponent = lazy(() => 
  import('../components/HeavyComponent')
);
```

#### 2.2 状态优化
```typescript
// 选择性状态持久化
const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({...}),
    {
      name: 'app-store',
      partialize: (state) => ({
        preferences: state.preferences, // 只持久化必要状态
      }),
    }
  )
);
```

#### 2.3 渲染优化
- 虚拟滚动处理大量数据
- React.memo优化组件重渲染
- useCallback缓存函数引用
- 防抖和节流处理用户输入

## 安全设计

### 1. 认证与授权
```python
# JWT认证中间件
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    # Token验证逻辑
    return user
```

### 2. 数据安全
- SQL注入防护
- XSS攻击防护  
- CORS策略配置
- API调用频率限制

### 3. 配置安全
```python
# 敏感配置加密存储
from cryptography.fernet import Fernet

class SecureConfig:
    def __init__(self):
        self.cipher = Fernet(os.environ['SECRET_KEY'])
        
    def decrypt_config(self, encrypted_value: str) -> str:
        return self.cipher.decrypt(encrypted_value.encode()).decode()
```

## 监控和日志

### 1. 应用监控
```python
# 自定义监控装饰器
def monitor_performance(func_name: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                logger.info(f"{func_name} 执行成功，耗时: {time.time() - start_time:.2f}s")
                return result
            except Exception as e:
                logger.error(f"{func_name} 执行失败: {str(e)}")
                raise
        return wrapper
    return decorator
```

### 2. 日志管理
```python
# 结构化日志配置
LOGGING_CONFIG = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/mat_qa.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
        }
    }
}
```

## 项目规模

### 1. 代码统计
- **后端**: 200+ Python文件，约50,000行代码
- **前端**: 200+ TypeScript文件，约30,000行代码
- **配置文件**: 50+ 配置和脚本文件
- **文档**: 20+ 技术文档和说明文件

### 2. 功能模块
- **智能问答**: 单Agent + 多Agent协作
- **知识管理**: 文档上传、向量化、检索
- **知识图谱**: 实体关系构建、图谱可视化
- **用户管理**: 认证、会话、偏好设置
- **系统配置**: 模型配置、参数调优、监控

### 3. 技术复杂度
- **高复杂度模块**: QAService (1200+行)、QAStore (1000+行)
- **中复杂度模块**: Team协作、知识检索、图谱可视化
- **基础模块**: 认证、配置、存储服务

## 二次开发指南

### 1. 开发环境设置

#### 1.1 环境要求
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (带pgvector扩展)
- Redis 6+
- Elasticsearch 8+

#### 1.2 快速启动
```bash
# 克隆项目
git clone <repository-url>
cd mat-demo

# 安装依赖
npm run setup

# 配置环境变量
cp mat-backend/env.example mat-backend/.env
cp mat-qa/.env.example mat-qa/.env.local

# 启动开发环境
npm run dev
```

### 2. 新功能开发

#### 2.1 添加新的Agent
```python
# 1. 在配置文件中定义Agent
# config/agent_teams_v2.yaml
agents:
  - name: "new_agent"
    role: "专业领域专家"
    prompt_template: "你是一个..."
    model: "qwen3-30b-a3b-instruct-2507"

# 2. 在服务层注册Agent
# service/agent_service.py
async def create_agent(agent_config: AgentConfig):
    # Agent创建逻辑
```

#### 2.2 添加新的检索策略
```python  
# 1. 继承基础检索类
class NewRetrievalStrategy(BaseRetrievalStrategy):
    async def search(self, query: str, **kwargs) -> List[SearchResult]:
        # 实现新的检索逻辑
        
# 2. 在路由中注册
intelligent_retrieval_service.register_strategy(
    "new_strategy", 
    NewRetrievalStrategy()
)
```

#### 2.3 添加新的前端页面
```typescript
// 1. 创建页面组件
const NewPage: React.FC = () => {
  return <div>新页面内容</div>;
};

// 2. 添加路由配置
{
  path: 'new-page',
  element: <NewPage />
}

// 3. 添加导航入口
<Menu.Item key="new-page">
  <Link to="/new-page">新功能</Link>
</Menu.Item>
```

### 3. 配置定制

#### 3.1 模型配置
```bash
# 后端 .env 文件
DEFAULT_LLM_MODEL="qwen3-30b-a3b-instruct-2507"
ALIBABA_LLM_API_KEY="your-api-key"
ALIBABA_LLM_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# 前端 .env.local 文件  
VITE_API_BASE_URL="http://your-backend:8000"
VITE_MATGRAPH_BASE_URL="http://your-matgraph:9622"
```

#### 3.2 功能开关
```bash
# 前端功能开关
VITE_ENABLE_GRAPH_VIEW=true      # 知识图谱功能
VITE_ENABLE_DUAL_VECTOR=true     # 双向量检索
VITE_ENABLE_TRANSLATION=true     # 翻译功能
```

### 4. 测试和部署

#### 4.1 本地测试
```bash
# 后端测试
cd mat-backend
python -m pytest tests/

# 前端测试  
cd mat-qa
npm run test
npm run type-check
```

#### 4.2 生产部署
```bash
# 构建前端
cd mat-qa
npm run build

# 启动生产服务
pm2 start ecosystem.config.js
```

## 故障排除

### 1. 常见问题

#### 1.1 API调用失败
- 检查后端服务是否正常运行
- 验证API Key配置是否正确
- 查看网络连接和防火墙设置

#### 1.2 向量检索错误
- 确认PostgreSQL pgvector扩展已安装
- 检查嵌入模型配置
- 验证向量维度匹配

#### 1.3 知识图谱无法访问
- 确认MatGraph服务运行状态  
- 检查端口9622是否开放
- 验证MATGRAPH_SERVICE_URL配置

### 2. 性能问题

#### 2.1 查询响应慢  
- 检查数据库索引
- 优化检索参数
- 调整并发配置

#### 2.2 内存使用过高
- 调整批处理大小
- 配置连接池参数
- 监控缓存使用情况

### 3. 日志和监控

#### 3.1 日志位置
```bash
# 后端日志
mat-backend/logs/mat_qa_YYYY-MM-DD.log

# 前端日志 
浏览器开发者工具 Console

# PM2日志
pm2 logs
```

#### 3.2 监控指标
- API响应时间
- 数据库连接数
- 内存和CPU使用率
- 错误率和成功率

这个项目展现了现代AI应用的完整架构，集成了最新的人工智能技术，具有良好的扩展性和维护性。通过本文档的指导，开发者可以快速理解项目架构，并进行有效的二次开发。