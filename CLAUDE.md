# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**NextAgentLite** 是一个通用的智能体开发平台，基于原始的地聚物材料智能问答系统演化而来。该平台采用现代化的前后端分离架构，集成了多智能体协作、知识图谱、向量检索等先进AI技术，现已发展为支持多领域应用的通用Agent开发框架。

### 核心转变
- **从专用到通用**: 从地聚物材料专用系统发展为通用Agent开发平台
- **保持主要逻辑**: 保留原始的核心业务逻辑和页面交互
- **Agent重新设计**: 按照新的功能要求重新设计单Agent和Team模式的定义和模版
- **平台化架构**: 支持多种领域的智能体应用开发

### 核心特性
- 🤖 **多智能体协作**: 基于Agno框架的Team系统，支持灵活的Agent协作模式
- 🔧 **通用Agent平台**: 可配置的单Agent和Team模式定义和模版
- 📊 **知识图谱**: MatGraph集成，支持实体关系可视化和图谱查询
- 🔍 **智能检索**: 双向量检索系统，支持多种检索策略
- 🌐 **多语言支持**: 中英文双语问答，实时翻译
- 📱 **现代UI**: React 18 + TypeScript + Ant Design + Tailwind CSS
- ⚡ **高性能**: 异步处理、连接池、缓存机制、流式响应
- 🎯 **模式切换**: 支持问答专家模式和Team协作模式无缝切换
- 📈 **Atlas可视化**: 集成Embedding Atlas，支持高维向量可视化

## 技术栈

### 后端 (mat-backend)
- **框架**: FastAPI + Python 3.11
- **多智能体**: Agno Framework (Team系统)
- **数据库**: PostgreSQL 17+ (with pgvector)
- **搜索引擎**: Elasticsearch 9+
- **知识图谱**: DataGraph (基于LightRAG)
- **对象存储**: MinIO
- **AI模型**: 
  - LLM: 支持多种模型提供商 (阿里云、Google等)
  - 嵌入: text-embedding-v4、MatBERT (双向量系统)
- **任务队列**: Redis + 自定义队列服务
- **MCP支持**: 数据库MCP服务器集成

### 前端 (mat-qa)
- **框架**: React 18 + TypeScript
- **构建**: Vite 6
- **UI库**: Ant Design 5 + Tailwind CSS 4
- **状态**: Zustand
- **路由**: React Router v7
- **图谱**: vis-network (知识图谱可视化)
- **数学**: KaTeX (数学公式渲染)
- **可视化**: D3.js + WebGL (Atlas向量可视化)
- **交互**: 支持模式切换和响应式设计

## 项目结构

```
NextAgentLite/
├── design/                    # 设计文档和架构
│   ├── TECHNICAL_ARCHITECTURE.md      # 技术架构文档
│   ├── complete_database_schema.sql   # 完整数据库结构
│   └── elasticsearch_index_templates.json  # ES索引模板
├── mat-backend/               # 后端服务 (Python)
│   ├── api/endpoints/         # API接口层
│   │   ├── team_api.py        # Team协作API
│   │   ├── advanced_qa.py     # 高级智能体问答API
│   │   └── atlas_integration.py # Atlas可视化API
│   ├── service/              # 业务逻辑层
│   │   ├── advanced_agent_team_service.py # 多智能体团队服务
│   │   ├── embedding_service.py # 双向量嵌入服务
│   │   └── team_v2/          # Team v2架构
│   ├── config/               # 配置文件
│   │   ├── agent_teams_v2.yaml # Agent团队配置
│   │   └── policy_qa_team_templates.yaml # 策略模板
│   ├── DataGraph/            # 知识图谱服务 (端口9622)
│   └── migrations/           # 数据库迁移 (52个表)
├── mat-qa/                   # 前端应用 (React)
│   ├── src/
│   │   ├── components/qa/    # QA问答组件
│   │   │   ├── MessageItem.tsx # 消息渲染
│   │   │   ├── TeamMessageRenderer.tsx # Team消息渲染
│   │   │   └── InputBox.tsx  # 支持模式切换的输入框
│   │   ├── pages/           # 页面组件
│   │   │   ├── WelcomePage.tsx # 欢迎页 (路由 /)
│   │   │   └── qa/QAPage.tsx # 主问答页 (/app)
│   │   ├── services/        # API服务层
│   │   │   ├── teamService.ts # Team服务API
│   │   │   └── atlasService.ts # Atlas可视化服务
│   │   └── stores/          # Zustand状态管理
│   └── public/              # 静态资源
├── embedding-atlas/          # Atlas向量可视化子项目
├── mcp/db-mcp-server/       # MCP数据库服务器 (Go)
└── logs/                    # 系统日志
```

## 常用开发命令

### 后端开发命令
```bash
# 启动后端服务
cd mat-backend
python main.py

# 运行测试
python -m pytest tests/ -v
python -m pytest tests/test_dual_vector_service.py -v

# 数据库迁移
python run_migration.py

# 启动MatGraph知识图谱服务
bash start_matgraph.sh

# 执行Team功能测试
python scripts/test_team_functionality.py

# 数据库初始化
python scripts/initialize_system.py

# Collection架构迁移管理
bash collection_migration.sh quick-setup      # 快速设置Collection架构
bash collection_migration.sh dry-run          # 模拟迁移（不修改数据）
bash collection_migration.sh full-migration   # 完整数据迁移
bash collection_migration.sh validate         # 验证架构完整性
bash collection_migration.sh status           # 检查系统状态
```

### 前端开发命令
```bash
# 启动前端开发服务器
cd mat-qa
npm run dev

# 构建生产版本
npm run build

# 代码类型检查
npm run type-check

# 代码格式检查
npm run lint

# 预览构建结果
npm run preview
```

### 测试和验证命令
```bash
# API健康检查
curl http://localhost:8000/health

# 测试单Agent查询
curl -X POST http://localhost:8000/api/v1/qa/single \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "question_decomposition_agent", "question": "什么是地聚物？"}'

# 测试Team查询
curl -X POST http://localhost:8000/api/team/query \
  -H "Content-Type: application/json" \
  -d '{"team_name": "geopolymer_qa_team_v2", "query": "地聚物材料的强度特性是什么？"}'

# 获取可用团队列表
curl http://localhost:8000/api/team/teams
```

### 系统管理命令
```bash
# 使用PM2管理服务
pm2 start ecosystem.config.js
pm2 status
pm2 logs
pm2 logs server  # 查看特定服务日志

# 清理和重置
python scripts/complete_system_reset.py
python scripts/complete_data_cleanup.py
```

## 环境配置

### 开发环境要求
- Node.js 18+
- Python 3.11+
- PostgreSQL 17+ (with pgvector扩展)
- Elasticsearch 9+
- Redis 6+
- MinIO (可选，对象存储)
- Go 1.19+ (用于MCP服务器)

### 快速启动

1. **后端服务启动**
```bash
cd mat-backend
pip install -r requirements.txt
cp env.example .env
# 编辑 .env 文件配置数据库、API密钥等
python main.py  # 启动后端服务 (端口 8000)
```

2. **前端服务启动**
```bash
cd mat-qa
npm install
cp .env.example .env.local
# 编辑 .env.local 配置API地址
npm run dev  # 启动前端服务 (端口 5173)
```

3. **MatGraph知识图谱服务**
```bash
cd mat-backend
bash start_matgraph.sh  # 启动知识图谱服务 (端口 9622)
```

4. **Atlas向量可视化服务 (可选)**
```bash
cd embedding-atlas
bash quick_start_atlas.sh  # 启动Atlas服务
```

5. **MCP数据库服务器 (可选)**
```bash
cd mcp/db-mcp-server
make build && make run  # 启动MCP服务器
```

## 系统架构要点

### 前后端分离架构
- **前端**: React 18 + TypeScript + Vite，运行在端口 5173
- **后端**: FastAPI + Python，运行在端口 8000
- **DataGraph**: 知识图谱服务，运行在端口 9622
- **Atlas**: 向量可视化服务 (可选)
- **MCP**: 数据库服务器，Go实现

### 核心数据流
1. **用户交互** → 前端React组件 → API调用
2. **API请求** → FastAPI路由 → 服务层处理
3. **Agent调用** → Agno框架 → LLM模型调用
4. **数据存储** → PostgreSQL (主数据) + Elasticsearch (搜索) + Redis (缓存)
5. **响应返回** → 流式响应 → 前端实时更新

### 模式切换机制
- **前端**: `InputBox.tsx` 左上角Tab切换，`MessageList.tsx` 欢迎区切换
- **状态管理**: Zustand store管理当前模式状态
- **API路由**: 不同模式调用不同的API端点
- **Team选择**: Team模式下显示可用团队列表

### Agent配置架构
- **配置文件**: `config/agent_teams_v2.yaml` - 定义Agent和Team
- **动态配置**: 运行时可通过API更新Agent参数
- **模型支持**: 支持多种LLM提供商 (阿里云、Google等)
- **工具集成**: 支持检索、图谱、翻译等工具

## 核心功能模块

### 1. 智能体协作系统架构

**单Agent模式和Team模式**
- **问答专家模式**: 传统单智能体问答，支持多种专业智能体选择
- **Team协作模式**: 基于Agno框架的多智能体团队协作
- **模式切换**: 前端输入框左上角Tab实现无缝切换

**Team系统核心Agent (可配置)**：
1. **问题分解专家** (`question_decomposition_agent`)
   - 分析问题复杂度和领域归属
   - 制定查询策略

2. **实时翻译专家** (`translation_agent`) 
   - 中英文双向翻译
   - 专业术语处理

3. **多语言知识检索专家** (`knowledge_retrieval_agent`)
   - 混合检索：向量 + 关键词
   - 智能融合检索

4. **知识图谱专家** (`knowledge_graph_agent`)
   - MatGraph图谱查询
   - 实体关系分析

5. **总结回答专家** (`summary_answer_agent`)
   - 信息整合和结构化输出
   - 答案质量控制

6. **多语言问答协调器** (`qa_coordinator_v2`)
   - 流程协调和监控
   - 结果验证和优化

**通用Agent平台特性**：
- 配置化Agent定义 (`config/agent_teams_v2.yaml`)
- 支持自定义Team模板和策略
- 动态Agent配置和运行时参数调整

**Agno框架参考文档**：
- [Teams文档](https://docs.agno.com/teams/)
- [Tools文档](https://docs.agno.com/tools/)
- [MCP集成](https://docs.agno.com/tools/mcp/mcp)
- [Agents文档](https://docs.agno.com/agents/)

### 2. 双向量智能检索系统

#### 向量模型配置
- **通用向量**: text-embedding-v4 (1024维)
- **领域向量**: MatBERT (768维，专业材料领域)
- **融合策略**: 自适应权重 (通用:0.6 + 领域:0.4)
- **检索模式**: 支持QA数据集、论文、全量检索等多种模式

#### 检索策略架构
```python
# 智能检索路由
if is_entity_query(query):
    strategy = GRAPH_ENHANCED
elif is_complex_query(query):
    strategy = HYBRID_WEIGHTED
else:
    strategy = VECTOR_ONLY
```

#### Atlas向量可视化
- **性能表现**: 89.5% 验证成功率，支持10,000+向量点渲染
- **技术栈**: React + D3.js + WebGL，异步数据加载优化
- **集成方式**: 独立子项目 `embedding-atlas/`

### 3. 知识图谱集成

#### MatGraph配置
- **端口**: 9622
- **查询模式**: mix (混合查询)
- **支持**: 实体查询、关系查询、路径查询

#### 图谱可视化
- 基于vis-network的高性能渲染
- 支持10000+节点的大规模图谱
- 动态布局算法和交互式探索

## 数据库设计

### 核心表结构 (52个表)

#### 用户管理
- `users` - 用户信息
- `user_preferences` - 用户偏好

#### 对话系统  
- `conversations` - 对话会话
- `conversation_messages` - 对话消息

#### Agent与Team
- `agent_configs` - Agent配置
- `team_executions` - Team执行记录
- `team_members` - Team成员
- `team_execution_steps` - 执行步骤

#### 知识库
- `knowledge_documents` - 知识文档
- `document_chunks` - 文档分块
- `knowledge_sources` - 知识源

#### 图谱数据
- `graph_nodes` - 图节点
- `graph_edges` - 图边
- `graph_stats` - 图统计

#### 任务管理
- `task_queue` - 任务队列
- `task_workers` - 任务工作者

### 关键索引
```sql
-- 向量检索索引
CREATE INDEX idx_chunks_general_embedding 
ON document_chunks USING ivfflat (general_embedding vector_cosine_ops);

-- 全文搜索索引
CREATE INDEX idx_conversation_messages_content_gin 
ON conversation_messages USING gin (to_tsvector('english', content));
```

## API接口

### 核心API端点

#### 问答系统
- `POST /api/v1/qa/single` - 单Agent查询
- `POST /api/v1/qa/team` - Team协作查询
- `GET /api/v1/qa/stream/{session_id}` - 流式响应

#### 知识管理
- `POST /api/v1/knowledge/upload` - 文档上传
- `GET /api/v1/knowledge/documents` - 文档列表
- `POST /api/v1/knowledge/vectorize` - 向量化

#### 知识图谱
- `POST /api/v1/graph/query` - 图谱查询
- `GET /api/v1/graph/visualization` - 图谱可视化
- `POST /api/v1/graph/extract` - 图谱抽取

#### 配置管理
- `GET /api/v1/config/models` - 模型配置
- `PUT /api/v1/config/chunking` - 分块配置
- `GET /api/v1/config/system` - 系统配置

## 开发指南

### 添加新的Agent

1. **定义Agent配置**
```yaml
# config/agent_teams_v2.yaml
agents:
  - name: "new_expert_agent"
    role: "新领域专家"
    prompt_template: "你是一个..."
    model: "qwen3-30b-a3b-instruct-2507"
```

2. **注册Agent服务**
```python
# service/agent_service.py
async def create_new_expert_agent(config: AgentConfig):
    # Agent创建和注册逻辑
    pass
```

3. **更新前端配置**
```typescript
// src/config/appConfig.ts
export const AVAILABLE_AGENTS = [
  ...existing_agents,
  {
    id: 'new_expert_agent',
    name: '新领域专家',
    description: '专注于...'
  }
];
```

### 添加新的检索策略

1. **实现检索策略类**
```python
# service/retrieval_strategy.py
class NewRetrievalStrategy(BaseRetrievalStrategy):
    async def search(self, query: str, **kwargs) -> List[SearchResult]:
        # 实现新的检索逻辑
        pass
```

2. **注册检索策略**
```python
# service/intelligent_retrieval_service.py
intelligent_retrieval_service.register_strategy(
    "new_strategy", 
    NewRetrievalStrategy()
)
```

### 添加新的前端页面

1. **创建页面组件**
```typescript
// src/pages/NewFeaturePage.tsx
const NewFeaturePage: React.FC = () => {
  return (
    <div className="new-feature-container">
      {/* 页面内容 */}
    </div>
  );
};
```

2. **添加路由**
```typescript
// src/routes/index.tsx
{
  path: 'new-feature',
  element: <NewFeaturePage />
}
```

3. **更新导航**
```typescript
// src/layouts/Layout.tsx
<Menu.Item key="new-feature">
  <Link to="/new-feature">新功能</Link>
</Menu.Item>
```

## 配置管理

### 后端环境变量

```bash
# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/matdemo
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379

# LLM配置
DEFAULT_LLM_MODEL=qwen3-30b-a3b-instruct-2507
ALIBABA_LLM_API_KEY=your-api-key
ALIBABA_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# MatGraph配置
MATGRAPH_SERVICE_URL=http://localhost:9622
```

### 前端环境变量

```bash
# API配置
VITE_API_BASE_URL=http://localhost:8000
VITE_MATGRAPH_BASE_URL=http://localhost:9622

# 功能开关
VITE_ENABLE_GRAPH_VIEW=true
VITE_ENABLE_DUAL_VECTOR=true
VITE_ENABLE_TRANSLATION=true
```

## 部署指南

### 开发环境部署

```bash
# 使用PM2管理服务
pm2 start ecosystem.config.js

# 服务列表
pm2 list
# ┌─────┬──────────┬─────────┬─────┬─────────┐
# │ id  │ name     │ mode    │ ↺   │ status  │
# ├─────┼──────────┼─────────┼─────┼─────────┤
# │ 0   │ server   │ fork    │ 0   │ online  │
# │ 1   │ web      │ fork    │ 0   │ online  │
# │ 2   │ matgraph │ fork    │ 0   │ online  │
# └─────┴──────────┴─────────┴─────┴─────────┘
```

### Docker部署

1. **构建镜像**
```bash
# 后端
cd mat-backend
docker build -t mat-backend:latest .

# 前端
cd mat-qa
docker build -t mat-qa:latest .
```

2. **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  mat-backend:
    image: mat-backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/matdemo
      
  mat-qa:
    image: mat-qa:latest
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://mat-backend:8000
```

## 性能优化

### 后端优化策略
- ✅ 全面异步处理 (async/await)
- ✅ 数据库连接池管理
- ✅ LLM响应缓存 (@lru_cache)
- ✅ 翻译结果TTL缓存
- ✅ 向量检索索引优化

### 前端优化策略
- ✅ 路由级懒加载 (React.lazy)
- ✅ 组件级代码分割
- ✅ 状态选择性持久化
- ✅ 虚拟滚动优化
- ✅ 防抖节流处理

### 数据库优化
```sql
-- 向量检索索引
CREATE INDEX CONCURRENTLY idx_chunks_general_embedding 
ON document_chunks USING ivfflat (general_embedding vector_cosine_ops);

-- 复合查询索引
CREATE INDEX idx_documents_metadata 
ON knowledge_documents USING gin(metadata);
```

## 监控与日志

### 日志位置
```bash
# 后端日志
mat-backend/logs/mat_qa_YYYY-MM-DD.log

# 前端日志
浏览器开发者工具 Console

# PM2日志
pm2 logs
pm2 logs server  # 查看特定服务日志
```

### 监控指标
- API响应时间
- 数据库连接数
- 内存CPU使用率
- 错误率成功率
- Agent执行性能

### 性能监控
```python
# 自定义监控装饰器
@monitor_performance("llm_call")
async def call_llm(prompt: str) -> str:
    start_time = time.time()
    try:
        result = await llm_service.call(prompt)
        logger.info(f"LLM调用成功，耗时: {time.time() - start_time:.2f}s")
        return result
    except Exception as e:
        logger.error(f"LLM调用失败: {str(e)}")
        raise
```

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查后端服务状态: `pm2 status server`
   - 验证API Key配置
   - 查看网络连接和防火墙

2. **向量检索错误**
   - 确认pgvector扩展: `SELECT * FROM pg_extension WHERE extname = 'vector';`
   - 检查嵌入模型配置
   - 验证向量维度匹配

3. **知识图谱无法访问**
   - 确认MatGraph服务: `curl http://localhost:9622/health`
   - 检查端口9622开放状态
   - 验证MATGRAPH_SERVICE_URL配置

4. **Team协作异常**
   - 查看team_executions表执行记录
   - 检查Agent配置是否正确
   - 验证模型API可用性

### 调试命令
```bash
# 检查服务状态
pm2 status
pm2 logs --lines 50

# 数据库连接测试
psql $DATABASE_URL -c "SELECT version();"

# Elasticsearch健康检查
curl -X GET "localhost:9200/_cluster/health"

# Redis连接测试
redis-cli ping
```

## 测试指南

### 后端测试
```bash
cd mat-backend
python -m pytest tests/ -v
python -m pytest tests/test_dual_vector_service.py -v
```

### 前端测试
```bash
cd mat-qa
npm run test
npm run type-check
npm run lint
```

### API测试
```bash
# 健康检查
curl http://localhost:8000/health

# 单Agent查询测试
curl -X POST http://localhost:8000/api/v1/qa/single \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "question_decomposition_agent", "question": "什么是地聚物？"}'
```

## 贡献指南

### 代码规范
- 后端: 遵循PEP 8规范，使用black格式化
- 前端: 使用ESLint + Prettier，遵循TypeScript严格模式
- 提交: 使用Conventional Commits规范

### 开发流程
1. Fork项目并创建功能分支
2. 编写代码和测试用例
3. 确保所有测试通过
4. 提交PR并描述变更内容

## 版本历史

### v1.3.2 (2025-08-12)
- ✅ 完整多智能体协作系统
- ✅ 智能检索系统优化
- ✅ MatGraph知识图谱集成
- ✅ 多模态媒体处理支持
- ✅ 完整的配置管理系统
- ✅ 性能监控和日志系统

### 数据统计
- **代码规模**: 80,000+ 行代码 (后端50K + 前端30K)
- **数据库表**: 52个表，80+索引，4个视图
- **功能模块**: 6个核心模块，200+文件
- **测试覆盖**: 单元测试 + 集成测试 + E2E测试

## 技术文档参考

### 项目文档
- [技术架构文档](design/TECHNICAL_ARCHITECTURE.md)
- [数据库设计](design/complete_database_schema.sql)
- [ES索引模板](design/elasticsearch_index_templates.json)

### Agno框架官方文档
- [Teams文档](https://docs.agno.com/teams/) - 多智能体团队协作
- [Tools文档](https://docs.agno.com/tools/) - 工具和集成
- [MCP集成](https://docs.agno.com/tools/mcp/mcp) - Model Context Protocol
- [Agents文档](https://docs.agno.com/agents/) - 智能体开发

---

**NextAgentLite** - 专业的地聚物材料智能问答系统，助力材料科学研究与应用。

*最后更新: 2025-08-12*
