# Youtu-Agent 前端智能配置页面使用指南

## 📋 概述

本指南介绍了基于 Youtu-Agent 框架的前端智能配置页面的使用方法。该系统提供了直观的界面来管理和配置智能体，包括元智能体对话生成、Agent 配置管理、混合策略配置等功能。

## 🚀 快速开始

### 1. 启动应用

**前端服务 (端口 5173):**
```bash
cd lite-qa
npm run dev
```

**后端服务 (端口 8000):**
```bash
cd lite-backend
python main.py
```

### 2. 访问智能配置页面

在浏览器中访问: `http://localhost:5173/app/intelligent`

## 🎯 主要功能

### 1. 📊 配置中心主页

**功能概览:**
- 系统状态实时监控
- 集成健康检查
- 统计数据展示 (Agent 配置数、执行次数等)
- 四大功能模块导航

**状态指示器:**
- 🟢 已连接 - Youtu-Agent 集成正常
- 🟡 连接中 - 正在初始化
- 🔴 连接错误 - 需要检查后端服务

### 2. 🤖 元智能体对话

**路径:** 智能配置 → 元智能体对话

**功能特点:**
- 📝 对话式 Agent 配置生成
- 🎯 智能领域识别 (知识问答、网络研究、文档分析)
- 💬 多轮对话优化配置
- 📋 会话历史管理
- ⚡ 一键生成专业配置

**使用流程:**
1. 点击 "开始新对话" 按钮
2. 输入 Agent 需求描述
3. 选择匹配的领域类型
4. 通过多轮对话完善配置
5. 系统自动生成 Agent 配置

**示例对话:**
```
用户: "我需要一个专业的材料科学问答助手"
助手: "您希望这个智能体主要处理什么类型的问题？"
用户: "主要回答地聚物材料相关的技术问题"
助手: "是否需要访问特定的知识库或数据源？"
...
```

### 3. ⚙️ Agent 配置管理

**路径:** 智能配置 → Agent配置管理

**核心功能:**
- 📋 配置列表管理 (创建、编辑、删除、复制)
- 🔍 智能搜索和过滤
- 🧪 配置实时测试
- 👀 详细配置预览
- 📤 批量导出功能

**配置表单字段:**
- **基础信息:** 名称、显示名、Agent类型、描述
- **行为指令:** 多条可编辑指令列表
- **模型配置:** 提供商、模型ID、温度参数、Token限制
- **工具集成:** 知识检索、搜索、翻译、图谱等
- **运行环境:** 知识环境、浏览器环境、终端环境
- **安全等级:** 低、中、高三级安全控制

**Agent 类型:**
- **SimpleAgent:** 单一推理循环，适合简单任务
- **OrchestraAgent:** 多智能体协调，适合复杂任务

**测试功能:**
- 🧪 实时测试 Agent 响应
- 📊 性能指标监控 (响应时间、成功率、Token用量)
- 💬 流式响应测试
- 📋 预设查询快速测试

### 4. ⚡ 混合策略配置

**路径:** 智能配置 → 混合策略配置

**内置策略:**
- **intelligent_routing:** 基于问题类型智能路由
- **performance_balanced:** 平衡性能和准确性
- **domain_specialized:** 领域专业化路由

**功能 (开发中):**
- 🎯 自定义执行策略
- 📈 策略性能分析
- 🔄 动态策略切换
- 📊 执行结果对比

### 5. 📊 执行监控

**路径:** 智能配置 → 执行监控

**监控内容 (开发中):**
- 🔍 实时执行状态监控
- 📈 性能指标统计分析
- 📝 错误日志查看和分析
- 💾 资源使用情况监控
- 📚 执行历史记录管理

## 🎨 界面特点

### 设计理念
- **渐进式配置体验:** 新手对话模式 → 进阶可视化 → 专家高级配置
- **统一设计语言:** Ant Design + Tailwind CSS
- **响应式设计:** 支持各种屏幕尺寸
- **实时反馈:** 流式响应和即时验证

### 交互模式
- 🎯 Tab 切换四大功能模块
- 💬 流式对话实时反馈
- 🔍 智能搜索和过滤
- 👀 预览抽屉详细查看
- 🧪 模态框测试功能

## 🛠️ 技术架构

### 前端技术栈
- **框架:** React 18 + TypeScript + Vite
- **UI库:** Ant Design 5 + Tailwind CSS 4
- **状态管理:** Zustand (简化版，不使用 immer)
- **路由:** React Router v7
- **API调用:** Axios

### 状态管理结构
```typescript
interface IntelligentConfigState {
  metaAgent: MetaAgentState;      // 元智能体状态
  agentConfigs: AgentConfigState; // Agent配置状态
  strategies: HybridStrategyState; // 混合策略状态
  system: SystemState;            // 系统状态
  execution: ExecutionState;      // 执行状态
  ui: UIState;                    // UI状态
}
```

### API 服务层
- **youtuAgentService:** 完整的 API 调用封装
- **类型安全:** 完整的 TypeScript 类型定义
- **错误处理:** 统一的异常处理机制
- **流式响应:** EventSource 支持

## 🔧 配置和自定义

### 环境配置
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_YOUTU_INTEGRATION_ENABLED=true
```

### 自定义工具和环境
在 `youtuAgentService.ts` 中可以扩展:
- `getSupportedTools()` - 添加新工具
- `getSupportedEnvironments()` - 添加新环境
- `getModelOptions()` - 添加新模型

### 样式自定义
- 主色调: `#1890ff` (智能蓝)
- 辅助色: `#fa8c16` (橙色)
- 使用 Tailwind CSS 类进行样式定制

## 📱 使用场景

### 1. 新手用户 - 元智能体对话
```
场景: 快速创建专业 Agent
步骤: 开始对话 → 描述需求 → 多轮优化 → 一键生成
时间: 3-5分钟
```

### 2. 进阶用户 - 可视化配置
```
场景: 精确控制 Agent 行为
步骤: 创建配置 → 详细设置 → 实时测试 → 优化调整
时间: 10-15分钟
```

### 3. 专家用户 - 高级配置
```
场景: 复杂多智能体协作
步骤: OrchestraAgent → 自定义策略 → 性能优化 → 生产部署
时间: 30+分钟
```

## 🚨 故障排除

### 常见问题

**1. 集成状态显示 "连接错误"**
```bash
# 检查后端服务
curl http://localhost:8000/api/youtu/health

# 检查 API 路由注册
grep -r "youtu_agent_router" lite-backend/api/routes.py
```

**2. 元智能体对话无响应**
```bash
# 检查数据库连接
psql $DATABASE_URL -c "SELECT * FROM youtu_agent_configs LIMIT 1;"

# 检查模型服务
curl -X POST http://localhost:8000/api/youtu/agent/quick-query \
  -H "Content-Type: application/json" \
  -d '{"query":"测试查询","stream":false}'
```

**3. 配置保存失败**
- 检查表单验证错误
- 确认必填字段已填写
- 检查模型配置参数范围

### 调试工具
- **浏览器开发者工具:** Network 标签查看 API 调用
- **Redux DevTools:** 查看 Zustand 状态变化
- **Console 日志:** 查看详细错误信息

## 📚 API 参考

### 核心 API 端点
- `POST /api/youtu/agent/config` - 创建 Agent 配置
- `POST /api/youtu/agent/quick-query` - 快速查询
- `POST /api/youtu/meta/session` - 创建元智能体会话
- `POST /api/youtu/hybrid/query` - 混合智能体查询
- `GET /api/youtu/health` - 健康检查

### 流式响应
```javascript
const eventSource = youtuAgentService.createQuickQueryStream({
  query: "测试查询",
  context: { test_mode: true }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到响应:', data);
};
```

## 🎯 最佳实践

### 1. 配置命名规范
```
Agent名称: [domain]_[function]_agent
显示名称: [中文描述]助手
示例: knowledge_qa_agent → 知识问答助手
```

### 2. 指令编写建议
- 明确具体的行为要求
- 包含约束和限制条件
- 提供示例和格式要求
- 考虑错误处理情况

### 3. 模型参数调优
- **Temperature 0.1-0.3:** 事实性回答
- **Temperature 0.5-0.7:** 创意性内容
- **Temperature 0.8-1.0:** 高创意性任务

### 4. 工具选择指南
- **knowledge:** 需要本地知识库检索
- **search:** 需要最新网络信息
- **translation:** 多语言处理需求
- **graph:** 需要关系推理

## 📈 性能优化

### 前端优化
- 使用 React.lazy 懒加载页面
- Zustand 状态选择器优化渲染
- 虚拟滚动处理大量数据
- 防抖处理用户输入

### API 优化
- 并行请求减少等待时间
- 流式响应提升用户体验
- 缓存常用配置数据
- 错误重试机制

## 🔄 更新计划

### 即将推出
- ✅ 混合策略可视化配置器
- ✅ 高级性能监控面板
- ✅ Agent 协作流程设计器
- ✅ 配置模板市场

### 长期规划
- 🔄 可视化 Agent 编排
- 🔄 自动化测试套件
- 🔄 多租户配置隔离
- 🔄 企业级权限管理

---

## 📞 支持与反馈

如果在使用过程中遇到问题或有改进建议，请通过以下方式联系：

- 📧 提交 Issue 到项目仓库
- 💬 在团队讨论区发起讨论
- 📝 查看更多文档: `/docs` 目录

**最后更新:** 2024年12月
**版本:** v1.0.0