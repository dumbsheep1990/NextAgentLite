# 前端IP地址配置完成

## 修改内容

**文件**: `/Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local`

### ✅ 已修改为测试环境IP (8.136.49.11)

#### 1. API基础配置
```bash
VITE_API_BASE_URL=http://8.136.49.11:8000
VITE_WS_URL=ws://8.136.49.11:8000
VITE_SSE_URL=http://8.136.49.11:8000
```

#### 2. 知识图谱配置
```bash
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:9622
VITE_MATGRAPH_HOST=8.136.49.11
VITE_MATGRAPH_PORT=9622
```

#### 3. 向量模型API配置
```bash
VITE_EMBEDDING_API_ENDPOINT=http://8.136.49.11:8000/v1
```

#### 4. Unla模型工具嵌入地址 (新增)
```bash
VITE_UNLA_WEB_URL=http://8.136.49.11:5173
```

## 配置说明

### 服务地址映射

| 服务名称 | 端口 | 测试环境地址 | 说明 |
|---------|------|------------|------|
| 后端API | 8000 | http://8.136.49.11:8000 | FastAPI主服务 |
| WebSocket | 8000 | ws://8.136.49.11:8000 | 实时通信 |
| SSE | 8000 | http://8.136.49.11:8000 | 服务端推送 |
| 知识图谱 | 9622 | http://8.136.49.11:9622 | MatGraph服务 |
| Unla工具 | 5173 | http://8.136.49.11:5173 | 模型工具界面 |

### 页面访问地址

1. **主前端应用**: http://8.136.49.11:3000
2. **Unla工具页面**: http://8.136.49.11:3000/tools/mcp-unla-embed
   - 内嵌iframe指向: http://8.136.49.11:5173

## 重启说明

⚠️ **修改.env.local后需要重启前端服务才能生效！**

### 重启前端服务

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-qa

# 停止当前服务 (Ctrl+C)

# 重新启动
npm run dev
```

启动后，服务应该监听在：
```
➜  Local:   http://localhost:3000/
➜  Network: http://0.0.0.0:3000/
➜  Network: http://8.136.49.11:3000/
```

## 验证方法

### 1. 检查API连接

打开浏览器控制台，检查Network面板：
- API请求应该指向 `http://8.136.49.11:8000/api/v1/...`
- WebSocket连接应该指向 `ws://8.136.49.11:8000/...`

### 2. 检查Unla工具嵌入

访问: http://8.136.49.11:3000/tools/mcp-unla-embed

应该能看到嵌入的Unla工具界面，iframe地址为:
```
http://8.136.49.11:5173/?token=<your-token>
```

### 3. 检查知识图谱

访问知识图谱相关页面，iframe应该指向:
```
http://8.136.49.11:9622/...
```

## 环境切换

### 切换回本地开发环境

```bash
# 修改 .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_SSE_URL=http://localhost:8000
VITE_MATGRAPH_BASE_URL=http://localhost:9622
VITE_MATGRAPH_HOST=localhost
VITE_UNLA_WEB_URL=http://localhost:5173
VITE_EMBEDDING_API_ENDPOINT=http://localhost:8000/v1

# 重启前端
npm run dev
```

### 使用环境变量覆盖（推荐）

也可以在启动时通过环境变量覆盖：
```bash
VITE_API_BASE_URL=http://8.136.49.11:8000 \
VITE_UNLA_WEB_URL=http://8.136.49.11:5173 \
npm run dev
```

## 相关文件

### 使用这些环境变量的组件

1. **MCPUnlaEmbed.tsx** (第4行)
   ```typescript
   const base = import.meta.env.VITE_UNLA_WEB_URL || 'http://localhost:5173';
   ```

2. **vite.config.ts** (第17行)
   ```typescript
   unlaWebUrl: env.VITE_UNLA_WEB_URL || 'http://localhost:5173',
   ```

3. **其他页面**:
   - AtlasPage.tsx - 使用VITE_API_BASE_URL
   - MatGraphPage.tsx - 使用VITE_MATGRAPH_BASE_URL
   - GraphEmbedRetrievalPage.tsx - 使用VITE_MATGRAPH_BASE_URL

## 常见问题

### Q: 修改后页面还是请求localhost
**A**: 需要重启前端服务，环境变量只在启动时加载

### Q: Unla工具页面显示空白
**A**: 检查：
1. 5173端口的Unla服务是否运行
2. CORS配置是否包含8.136.49.11
3. 浏览器控制台是否有错误

### Q: iframe无法加载
**A**: 检查：
1. 目标服务是否监听在0.0.0.0
2. 防火墙是否开放对应端口
3. 浏览器是否阻止混合内容（HTTP/HTTPS）

---

**配置时间**: 2025-10-10
**环境**: 测试环境 (8.136.49.11)
**下一步**: 重启前端服务以应用新配置
