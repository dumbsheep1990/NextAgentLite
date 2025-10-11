# 前端URL配置修改清单

## 概述

为了使用API网关统一代理，需要修改前端所有直接访问外部服务的URL配置。本文档列出所有需要修改的位置。

## 已修改的配置文件

### 1. `.env.local` 环境变量文件 ✅

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local`

#### MatGraph知识图谱服务
```bash
# 修改前
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:9622
VITE_MATGRAPH_PORT=9622

# 修改后
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:8000/gateway/matgraph
VITE_MATGRAPH_PORT=8000
```

#### Unla模型管理服务
```bash
# 修改前
VITE_UNLA_WEB_URL=http://8.136.49.11:5173

# 修改后
VITE_UNLA_WEB_URL=http://8.136.49.11:8000/gateway/unla
```

## 需要添加的环境变量

### 2. LLM Gateway 配置（需要添加）

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local`

```bash
# 添加到 .env.local 文件中
# LLM统一网关配置
VITE_LLM_GATEWAY_URL=http://8.136.49.11:8000/gateway/llm-gateway
```

### 3. DeepScrape 配置（如果使用）

```bash
# 添加到 .env.local 文件中（如果需要）
# DeepScrape爬虫服务配置
VITE_DEEPSCRAPE_URL=http://8.136.49.11:8000/gateway/deepscrape
```

## 需要修改的源代码文件

### 4. appConfig.ts - 知识图谱配置

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/src/config/appConfig.ts`

**第135行** - MatGraph baseUrl 默认值:
```typescript
// 修改前
baseUrl: getEnvValue('VITE_MATGRAPH_BASE_URL',
  import.meta.env?.MODE === 'development' ? '/matgraph' : 'http://127.0.0.1:9622'
),

// 修改后
baseUrl: getEnvValue('VITE_MATGRAPH_BASE_URL',
  import.meta.env?.MODE === 'development' ? '/matgraph' : 'http://127.0.0.1:8000/gateway/matgraph'
),
```

**建议添加** - LLM Gateway 配置:
```typescript
// 在 matgraph 配置后添加
// LLM Gateway配置
llmGateway: {
  baseUrl: getEnvValue('VITE_LLM_GATEWAY_URL',
    import.meta.env?.MODE === 'development' ? '/gateway/llm-gateway' : 'http://127.0.0.1:8000/gateway/llm-gateway'
  ),
},

// Unla服务配置
unla: {
  baseUrl: getEnvValue('VITE_UNLA_WEB_URL',
    import.meta.env?.MODE === 'development' ? '/gateway/unla' : 'http://127.0.0.1:8000/gateway/unla'
  ),
},
```

### 5. MCPUnlaEmbed.tsx - Unla嵌入页面

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/src/pages/tools/MCPUnlaEmbed.tsx`

**第4行** - Unla URL 默认值:
```typescript
// 修改前
const base = import.meta.env.VITE_UNLA_WEB_URL || 'http://localhost:5173';

// 修改后
const base = import.meta.env.VITE_UNLA_WEB_URL || 'http://localhost:8000/gateway/unla';
```

### 6. ToolsImportTestPage.tsx - 工具导入测试页面

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/src/pages/agent/ToolsImportTestPage.tsx`

**第13行** - LLM Gateway URL 默认值:
```typescript
// 修改前
return (fromRC || fromEnv || 'http://127.0.0.1:9050').replace(/\/$/, '');

// 修改后
return (fromRC || fromEnv || 'http://127.0.0.1:8000/gateway/llm-gateway').replace(/\/$/, '');
```

### 7. AgentStudioPage.tsx - Agent工作室页面

**文件位置**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/src/pages/agent/AgentStudioPage.tsx`

**第93行** - LLM Gateway URL (获取模型列表):
```typescript
// 修改前
const base = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:9050';

// 修改后
const base = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:8000/gateway/llm-gateway';
```

**第479行** - LLM Gateway URL (工具发现):
```typescript
// 修改前
const GATEWAY_BASE = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:9050';

// 修改后
const GATEWAY_BASE = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:8000/gateway/llm-gateway';
```

## 其他可能需要检查的文件

根据grep搜索结果，以下文件中也包含端口号，但可能是注释或文档：

### 8. 可能需要检查的文件列表

1. ✅ `/lite-qa/src/pages/agent/studio/ModelSettingsSection.tsx` - 检查是否有硬编码URL
2. ✅ `/lite-qa/src/pages/agent/AgentCreationWizard.tsx` - 检查是否有硬编码URL
3. ✅ `/lite-qa/src/components/common/SystemStatusModal.tsx` - 检查系统状态显示
4. ✅ `/lite-qa/src/services/collectionService.ts` - 检查集合服务调用
5. ✅ `/lite-qa/src/pages/graph/*.tsx` - 检查知识图谱相关页面
6. ✅ `/lite-qa/src/pages/knowledge/components/TemplateWizard.tsx` - 检查知识库组件

## 快速修改脚本

创建环境变量修改脚本：

```bash
#!/bin/bash
# 文件: update_frontend_urls.sh

ENV_FILE="/Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local"

# 备份原文件
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# 添加 LLM Gateway 配置（如果不存在）
if ! grep -q "VITE_LLM_GATEWAY_URL" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# LLM统一网关配置（通过网关代理）" >> "$ENV_FILE"
    echo "VITE_LLM_GATEWAY_URL=http://8.136.49.11:8000/gateway/llm-gateway" >> "$ENV_FILE"
fi

echo "✅ 环境变量配置已更新"
```

## 修改顺序建议

### 阶段1: 环境变量配置（必须）
1. ✅ 修改 `.env.local` - MatGraph URL
2. ✅ 修改 `.env.local` - Unla URL
3. ⏳ 添加 `.env.local` - LLM Gateway URL

### 阶段2: 配置文件修改（推荐）
4. ⏳ 修改 `appConfig.ts` - MatGraph 默认值
5. ⏳ 添加 `appConfig.ts` - LLM Gateway 配置
6. ⏳ 添加 `appConfig.ts` - Unla 配置

### 阶段3: 源代码修改（必须）
7. ⏳ 修改 `MCPUnlaEmbed.tsx` - Unla iframe地址
8. ⏳ 修改 `ToolsImportTestPage.tsx` - LLM Gateway默认值
9. ⏳ 修改 `AgentStudioPage.tsx` - 两处LLM Gateway默认值

### 阶段4: 验证测试
10. ⏳ 构建前端: `npm run build`
11. ⏳ 测试 MatGraph 页面加载
12. ⏳ 测试 Unla 嵌入页面
13. ⏳ 测试 Agent 工作室功能

## 验证检查清单

### 功能验证
- [ ] MatGraph知识图谱页面iframe正常加载
- [ ] Unla模型管理页面iframe正常加载
- [ ] Agent工作室模型列表正常获取
- [ ] 工具导入测试页面正常工作
- [ ] 浏览器控制台无CORS错误
- [ ] 浏览器控制台无404错误

### URL验证
- [ ] 检查Network面板，确认请求发往 `/gateway/*`
- [ ] 验证iframe src属性使用网关URL
- [ ] 验证API调用使用网关URL

### 回退方案
如果出现问题，快速回滚：
```bash
# 回滚环境变量
cp /path/to/.env.local.backup.YYYYMMDD_HHMMSS /path/to/.env.local

# 重新构建
npm run build
pm2 restart web
```

## 注意事项

1. **开发环境 vs 生产环境**
   - 开发环境可以使用相对路径（Vite代理）
   - 生产环境必须使用完整URL（通过网关）

2. **CORS配置**
   - 确保后端CORS配置允许前端域名
   - 网关需要正确转发CORS头

3. **iframe嵌入**
   - 检查 `X-Frame-Options` 响应头
   - 确保网关不会阻止iframe加载

4. **URL路径处理**
   - 网关会移除 `/gateway/xxx` 前缀
   - 确保后端服务使用正确的路由路径

## 总结

### 必须修改的文件（共7个）
1. ✅ `.env.local` - MatGraph URL (已修改)
2. ✅ `.env.local` - Unla URL (已修改)
3. ⏳ `.env.local` - LLM Gateway URL (需添加)
4. ⏳ `appConfig.ts` - MatGraph 默认值
5. ⏳ `MCPUnlaEmbed.tsx` - Unla 默认值
6. ⏳ `ToolsImportTestPage.tsx` - LLM Gateway 默认值
7. ⏳ `AgentStudioPage.tsx` - LLM Gateway 默认值（2处）

### 推荐添加的配置
- `appConfig.ts` 中统一管理所有外部服务URL配置

---

**文档更新时间**: 2025-10-11
**状态**: 部分完成（阶段1已完成，阶段2-4待执行）
