# NextAgentLite - 地聚物材料智能问答系统功能说明文档

## 项目概述

NextAgentLite 是一个专业的地聚物材料智能问答系统，采用现代化的前后端分离架构，集成了多智能体协作、知识图谱、向量检索等先进AI技术。该系统专注于材料科学领域，特别是地聚物材料的智能问答和知识管理。

### 版本信息
- **版本**: v1.3.2 (2025-08-12)
- **代码规模**: 80,000+ 行代码 (后端334个Python文件 + 前端134个TS/TSX文件)
- **数据库表**: 52个表，80+索引，4个视图
- **功能模块**: 6个核心模块，200+文件

## 核心特性

### 1. 多智能体协作系统
- **框架**: 基于Agno框架的Team系统
- **智能体数量**: 6个专业Agent协作
- **协作模式**: 支持问题分解、实时翻译、知识检索、图谱查询、答案总结等
- **流程管控**: 智能路由和任务分配

### 2. 双向量检索系统
- **通用向量**: text-embedding-v4 (1024维)
- **领域向量**: MatBERT (768维，专业材料领域)
- **融合策略**: 自适应权重 (通用:0.6 + 领域:0.4)
- **检索模式**: 支持QA数据集、论文、全量检索等多种模式

### 3. 知识图谱集成
- **图谱系统**: MatGraph (基于LightRAG)
- **服务端口**: 9622
- **查询模式**: 混合查询（实体、关系、路径）
- **可视化**: 基于vis-network，支持10000+节点大规模图谱

### 4. 多语言支持
- **语言**: 中英文双语问答
- **翻译**: 实时翻译功能
- **本地化**: 完整的国际化支持

### 5. 现代化用户界面
- **响应式设计**: 支持桌面端、平板、移动端
- **组件库**: Ant Design + Tailwind CSS
- **交互体验**: 流式响应、实时状态更新
- **主题**: 支持明暗主题切换

## 技术架构

### 后端技术栈 (mat-backend)
- **核心框架**: FastAPI + Python 3.11
- **多智能体**: Agno Framework
- **数据存储**:
  - PostgreSQL 14+ (with pgvector扩展)
  - Elasticsearch 8+ (全文检索)
  - Redis 6+ (缓存和队列)
  - MinIO (对象存储，可选)
- **AI模型集成**:
  - LLM: qwen3-30b、Gemini-2.5-Flash
  - 嵌入模型: text-embedding-v4、MatBERT
- **任务处理**: Redis队列 + 自定义任务管理

### 前端技术栈 (mat-qa)
- **核心框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router v7
- **图谱可视化**: vis-network
- **数学公式**: KaTeX

## 主要功能模块

### 1. 智能问答系统
**位置**: `/qa` 路由
**功能描述**:
- 支持单智能体和多智能体团队协作两种模式
- 实时流式响应，支持长文本生成
- 智能上下文记忆，支持多轮对话
- 知识库和知识图谱双重检索增强
- 支持消息操作：复制、点赞、溯源查看等

**核心特性**:
- 模式切换：专家模式 vs Team协作模式
- 智能体选择：材料专家、问答专家等多种角色
- 检索配置：可配置知识库检索、图谱检索、检索模式等
- 翻译功能：支持中英文实时翻译
- 对话管理：历史对话保存、删除、清空等

### 2. 知识库管理系统
**位置**: `/knowledge` 路由
**功能描述**:
- 支持PDF、Word、Text等多格式文档上传
- 自动文档解析和分块处理
- 双向量化：通用向量 + 领域专用向量
- 向量化任务队列管理
- 文档状态实时监控

**核心特性**:
- 批量文档上传和处理
- 智能分块策略配置
- 向量化进度实时跟踪
- 文档元数据管理
- 向量检索效果验证

### 3. MatGraph知识图谱系统
**位置**: `/graph` 路由
**功能描述**:
- 基于LightRAG的知识图谱构建
- 实体和关系的可视化展示
- 图谱查询和推理
- 大规模图谱渲染优化

**核心特性**:
- 交互式图谱浏览
- 实体关系查询
- 图谱统计分析
- 动态布局算法
- 全屏沉浸式体验

### 4. 用户认证与权限
- 基于JWT的用户认证
- 角色权限管理 (管理员、研究员、学生)
- 用户偏好设置
- 会话状态管理

### 5. 系统配置与监控
- 模型配置管理
- 数据库连接监控
- 资源状态指示
- 缓存清理工具
- 错误日志追踪

## 数据库设计

### 核心表结构 (52个表)

#### 用户管理
- `users` - 用户基本信息
- `user_preferences` - 用户偏好配置

#### 对话系统
- `conversations` - 对话会话记录
- `conversation_messages` - 对话消息详情

#### Agent与Team管理
- `agent_configs` - 智能体配置
- `team_executions` - 团队执行记录
- `team_members` - 团队成员关系
- `team_execution_steps` - 执行步骤追踪

#### 知识库管理
- `knowledge_documents` - 知识文档
- `document_chunks` - 文档分块
- `knowledge_sources` - 知识源管理

#### 图谱数据
- `graph_nodes` - 图节点
- `graph_edges` - 图边关系
- `graph_stats` - 图谱统计信息

#### 任务管理
- `task_queue` - 任务队列
- `task_workers` - 任务工作者

### 关键索引优化
```sql
-- 向量检索索引
CREATE INDEX idx_chunks_general_embedding 
ON document_chunks USING ivfflat (general_embedding vector_cosine_ops);

-- 全文搜索索引
CREATE INDEX idx_conversation_messages_content_gin 
ON conversation_messages USING gin (to_tsvector('english', content));
```

## API接口体系

### 核心API端点

#### 问答系统API
- `POST /api/v1/qa/single` - 单Agent查询
- `POST /api/v1/qa/team` - Team协作查询
- `GET /api/v1/qa/stream/{session_id}` - 流式响应获取

#### 知识管理API
- `POST /api/v1/knowledge/upload` - 文档上传
- `GET /api/v1/knowledge/documents` - 文档列表获取
- `POST /api/v1/knowledge/vectorize` - 向量化任务创建

#### 知识图谱API
- `POST /api/v1/graph/query` - 图谱查询
- `GET /api/v1/graph/visualization` - 图谱可视化数据
- `POST /api/v1/graph/extract` - 图谱抽取

#### 配置管理API
- `GET /api/v1/config/models` - 模型配置获取
- `PUT /api/v1/config/chunking` - 分块配置更新
- `GET /api/v1/config/system` - 系统配置获取

#### 用户认证API
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/profile` - 用户信息获取

## 部署与运维

### 开发环境要求
- **Node.js**: 18+
- **Python**: 3.11+
- **PostgreSQL**: 14+ (with pgvector扩展)
- **Elasticsearch**: 8+
- **Redis**: 6+
- **MinIO**: 可选，用于对象存储

### 快速启动命令
```bash
# 后端启动
cd mat-backend
pip install -r requirements.txt
python main.py

# 前端启动  
cd mat-qa
npm install
npm run dev

# MatGraph服务启动
cd mat-backend
bash start_matgraph.sh
```

### 性能优化特性
- **后端优化**:
  - 全面异步处理 (async/await)
  - 数据库连接池管理
  - LLM响应缓存机制
  - 向量检索索引优化
- **前端优化**:
  - 路由级懒加载
  - 组件级代码分割
  - 虚拟滚动优化
  - 状态选择性持久化

### 监控与日志
- **日志位置**:
  - 后端: `mat-backend/logs/mat_qa_YYYY-MM-DD.log`
  - 前端: 浏览器开发者工具Console
- **监控指标**:
  - API响应时间
  - 数据库连接状态
  - 内存CPU使用率
  - Agent执行性能

## 主要用例场景

### 1. 材料科学研究支持
- 地聚物材料专业问答
- 文献资料智能检索
- 实验数据分析支持
- 材料性能对比分析

### 2. 学术研究辅助
- 论文知识库管理
- 智能文献综述
- 研究方向推荐
- 学术概念解释

### 3. 教学应用
- 材料科学知识问答
- 课程内容智能推荐
- 学习路径规划
- 作业辅导支持

## 系统特色优势

### 1. 专业化程度高
- 专注地聚物材料领域
- 集成专业领域模型MatBERT
- 材料科学知识图谱
- 专业术语精准理解

### 2. 技术先进性
- 多智能体协作架构
- 双向量融合检索
- 流式响应体验
- 现代化技术栈

### 3. 可扩展性强
- 模块化架构设计
- 配置化模型管理
- 插件化功能扩展
- API标准化接口

### 4. 用户体验优秀
- 响应式界面设计
- 实时状态反馈
- 多设备适配
- 个性化配置

## 技术文档参考

- [技术架构文档](design/TECHNICAL_ARCHITECTURE.md)
- [数据库设计](design/complete_database_schema.sql)  
- [ES索引模板](design/elasticsearch_index_templates.json)
- [Agno框架文档](https://docs.agno.com/)

---

**NextAgentLite** - 专业的地聚物材料智能问答系统，助力材料科学研究与应用。

*文档生成时间: 2025-08-13*
*系统版本: v1.3.2*