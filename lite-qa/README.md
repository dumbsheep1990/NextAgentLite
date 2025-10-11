# 地聚物材料智能问答系统 - 前端

基于React + TypeScript + Ant Design + Tailwind CSS的地聚物材料智能问答系统前端应用。采用现代化的组件设计和状态管理，提供完整的QA问答、知识库管理和知识图谱功能。

## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x
- **样式框架**: Tailwind CSS 4.x
- **构建工具**: Vite 6.x
- **路由管理**: React Router v7
- **状态管理**: Zustand 5.x
- **HTTP客户端**: Axios
- **图表可视化**: ECharts + vis.js
- **代码规范**: ESLint + TypeScript ESLint

## ✨ 功能特性

### 🤖 智能问答模块
- **多智能体协作**: 支持单智能体和团队协作模式
- **实时对话界面**: 流畅的问答交互体验
- **消息历史管理**: 持久化对话记录和检索
- **智能体配置**: 可切换不同专业领域的AI助手
- **置信度显示**: 回答质量评估和可信度指标

### 📚 文献溯源系统
- **来源追踪**: 详细的文献引用和出处信息
- **高亮引用**: 精确定位引用内容在原文中的位置
- **置信度评估**: 引用质量和相关性评分
- **文献推荐**: 基于内容的相关文献推荐

### 📊 响应式设计
- **三端适配**: 桌面端/平板端/移动端完美适配
- **三栏布局**: 历史面板 + 主对话区 + 溯源面板
- **抽屉式导航**: 移动端优化的交互体验
- **自适应组件**: 智能响应屏幕尺寸变化

### 🎨 现代化UI/UX
- **组件模块化**: 高度可复用的组件设计
- **主题系统**: 支持明暗主题切换
- **多语言支持**: 中英文界面切换
- **无障碍设计**: 遵循WCAG标准的可访问性

## 📁 项目结构

```
mat-qa/
├── src/
│   ├── components/          # 可复用组件库
│   │   ├── common/         # 通用组件
│   │   ├── qa/             # QA问答相关组件
│   │   │   ├── MessageItem.tsx      # 消息项组件
│   │   │   ├── MessageList.tsx      # 消息列表容器
│   │   │   ├── HistoryPanel.tsx     # 历史对话面板
│   │   │   ├── SourcePanel.tsx      # 溯源信息面板
│   │   │   └── InputBox.tsx         # 智能输入框
│   │   ├── knowledge/      # 知识库相关组件
│   │   └── graph/          # 知识图谱相关组件
│   ├── pages/              # 页面组件
│   │   ├── qa/             # QA问答页面
│   │   ├── knowledge/      # 知识库管理页面
│   │   └── graph/          # 知识图谱页面
│   ├── layouts/            # 布局组件
│   │   └── Layout.tsx      # 主布局组件
│   ├── services/           # API服务层
│   │   ├── api.ts          # 基础HTTP客户端
│   │   └── qaService.ts    # QA问答服务
│   ├── stores/             # 状态管理
│   │   ├── appStore.ts     # 应用全局状态
│   │   └── qaStore.ts      # QA问答状态
│   ├── hooks/              # 自定义Hooks
│   ├── types/              # TypeScript类型定义
│   │   └── index.ts        # 全局类型定义
│   ├── utils/              # 工具函数
│   ├── routes/             # 路由配置
│   │   └── index.tsx       # 路由定义
│   ├── App.tsx             # 根应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── index.html             # HTML模板
├── package.json           # 依赖配置
├── tailwind.config.js     # Tailwind配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
└── README.md              # 项目文档
```

## 🛠️ 开发指南

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
cd mat-qa
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 预览构建结果

```bash
npm run preview
```

## 🔧 开发规范

### 组件开发
- **函数式组件**: 统一使用函数组件 + Hooks
- **TypeScript**: 严格的类型检查和接口定义
- **组件分离**: UI组件与业务逻辑分离
- **Props接口**: 明确的Props类型定义

### 状态管理
- **Zustand**: 轻量级状态管理方案
- **模块化**: 按功能模块划分store
- **持久化**: 关键状态的本地存储
- **响应式**: 自动响应状态变化

### 样式规范
- **Tailwind**: 优先使用Tailwind CSS类名
- **Ant Design**: 组件样式以Ant Design为基础
- **响应式**: 移动优先的响应式设计
- **主题**: 支持主题定制和切换

### 代码风格
- **ESLint**: 自动代码检查和格式化
- **命名规范**: PascalCase组件，camelCase变量
- **文件组织**: 按功能模块组织文件结构
- **注释**: 充分的TypeDoc和行内注释

## 🔌 API集成

### 后端接口配置
```typescript
// 环境变量配置
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=地聚物智能问答系统
```

### 主要API端点
- **QA问答**: `POST /qa/ask` - 发送问题获取AI回答
- **智能体**: `GET /qa/agents` - 获取可用智能体列表
- **对话历史**: `GET /conversations` - 获取历史对话
- **文件上传**: `POST /upload/papers` - 上传论文文档
- **溯源信息**: `GET /qa/sources/{id}` - 获取回答溯源

### 服务层设计
```typescript
// 示例：QA服务调用
import { qaService } from '../services/qaService';

const response = await qaService.askQuestion({
  question: '地聚物的抗压强度受哪些因素影响？',
  agentType: 'team',
  agentName: 'geopolymer_qa_team'
});
```

## 🎯 核心功能实现

### QA问答流程
1. **用户输入**: 智能输入框，支持多行文本和快捷操作
2. **智能体选择**: 可选择单智能体或团队协作模式
3. **实时对话**: WebSocket或HTTP轮询实现实时响应
4. **结果展示**: 结构化展示回答内容，包含置信度和来源
5. **溯源分析**: 详细的文献引用和高亮定位

### 响应式布局
- **桌面端**: 三栏布局 (320px + flex + 384px)
- **平板端**: 两栏布局 + 可折叠侧边栏
- **移动端**: 单栏布局 + 抽屉式导航

### 状态管理架构
```typescript
// QA状态管理示例
const {
  messages,           // 当前对话消息
  conversations,      // 历史对话列表
  isLoading,         // 加载状态
  selectedAgent,     // 当前智能体
  sendMessage,       // 发送消息
  createNewConversation  // 创建新对话
} = useQAStore();
```

## 📈 性能优化

### 代码分割
- **路由懒加载**: 页面级别的代码分割
- **组件懒加载**: 大型组件的动态导入
- **第三方库**: 按需导入和Tree Shaking

### 缓存策略
- **状态持久化**: 关键状态的本地存储
- **API缓存**: 请求结果的智能缓存
- **图片优化**: 图片懒加载和格式优化

### 用户体验
- **骨架屏**: 加载过程的视觉反馈
- **虚拟滚动**: 大量数据的性能优化
- **错误边界**: 优雅的错误处理机制

## 🔮 未来规划

### 功能扩展
- [ ] 语音输入/输出功能
- [ ] 多模态对话支持（图片、文档）
- [ ] 协作编辑和分享功能
- [ ] 高级搜索和过滤
- [ ] 个性化推荐系统

### 技术升级
- [ ] PWA支持
- [ ] 国际化完善
- [ ] 无障碍增强
- [ ] 性能监控
- [ ] 自动化测试

## 👥 贡献指南

1. **Fork项目** - 创建个人分支
2. **创建特性分支** - `git checkout -b feature/new-feature`
3. **提交更改** - `git commit -m 'Add new feature'`
4. **推送分支** - `git push origin feature/new-feature`
5. **创建PR** - 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🆘 技术支持

如有问题或建议，请提交 [Issue](https://github.com/your-repo/issues) 或联系开发团队。