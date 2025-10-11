# Unla Web服务监听配置完成

## 修改内容

### ✅ Unla Web服务 (lite-backend/Unla/web)

**文件1**: `/Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web/package.json`
- **npm启动脚本**: 已添加 `--host 0.0.0.0` 参数
  ```json
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "preview": "vite preview --host 0.0.0.0"
  }
  ```

**文件2**: `/Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web/vite.config.ts`
- **服务器配置**: 已添加host和port配置
  ```typescript
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: env.VITE_DEV_API_BASE_URL || 'http://localhost:5234',
        changeOrigin: true,
      }
    },
  }
  ```

## 服务配置说明

### Unla服务端口映射

| 服务 | 端口 | 监听地址 | 外部访问 |
|-----|------|---------|---------|
| Unla Web | 5173 | 0.0.0.0:5173 | http://8.136.49.11:5173 |
| Unla API | 5234 | localhost:5234 | 仅内部访问 |

### 服务架构

```
┌─────────────────────────────────────┐
│  NextAgentLite 前端 (3000端口)       │
│  └─ /tools/mcp-unla-embed           │
│     └─ iframe嵌入 ↓                  │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  Unla Web (5173端口)                │
│  监听: 0.0.0.0:5173                  │
│  └─ /api 代理 → localhost:5234      │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  Unla API Server (5234端口)         │
│  监听: localhost:5234               │
└─────────────────────────────────────┘
```

## 启动说明

### 启动Unla Web服务

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web

# 安装依赖（首次运行）
pnpm install

# 启动开发服务器
pnpm run dev
```

启动后应该看到：
```
VITE v7.0.4  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
  ➜  Network: http://8.136.49.11:5173/
```

### 启动Unla API服务

Unla API服务需要单独启动（Go服务）：
```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend/Unla

# 启动API服务器
go run cmd/apiserver/main.go -c configs/apiserver.yaml
```

## 验证配置

### 1. 检查Unla Web服务监听

```bash
# 查看5173端口监听
netstat -tuln | grep 5173

# 或使用lsof
lsof -i :5173
```

应该看到监听在 `0.0.0.0:5173`

### 2. 测试外部访问

```bash
# 从外部访问Unla Web
curl http://8.136.49.11:5173/

# 应该返回HTML内容
```

### 3. 测试嵌入访问

访问: http://8.136.49.11:3000/tools/mcp-unla-embed

应该能看到嵌入的Unla工具界面，iframe地址：
```
http://8.136.49.11:5173/?token=<your-token>
```

## 环境变量配置

### Unla Web环境变量 (.env)

```bash
# API基础地址（代理目标）
VITE_DEV_API_BASE_URL=http://localhost:5234

# Base URL
VITE_BASE_URL=/
```

### 前端引用配置 (lite-qa/.env.local)

```bash
# Unla工具嵌入地址
VITE_UNLA_WEB_URL=http://8.136.49.11:5173
```

## 完整启动流程

### 1. 启动Unla API服务（后端）

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend/Unla
go run cmd/apiserver/main.go -c configs/apiserver.yaml
```

### 2. 启动Unla Web服务（前端）

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web
pnpm run dev
```

### 3. 启动NextAgentLite后端

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend
python main.py
```

### 4. 启动NextAgentLite前端

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-qa
npm run dev
```

## 服务访问地址汇总

| 服务 | 地址 | 说明 |
|-----|------|-----|
| NextAgentLite前端 | http://8.136.49.11:3000 | 主应用 |
| NextAgentLite后端 | http://8.136.49.11:8000 | API服务 |
| Unla Web | http://8.136.49.11:5173 | Unla工具界面 |
| Unla API | http://localhost:5234 | Unla后端（仅内部） |
| MatGraph | http://8.136.49.11:9622 | 知识图谱 |

## 常见问题

### Q: Unla Web启动后还是监听在127.0.0.1
**A**:
1. 确认package.json中的dev脚本包含 `--host 0.0.0.0`
2. 确认vite.config.ts中server.host设置为 `'0.0.0.0'`
3. 重启服务

### Q: iframe无法加载Unla工具
**A**: 检查：
1. Unla Web服务是否正常运行在5173端口
2. 前端.env.local中VITE_UNLA_WEB_URL是否正确
3. CORS配置是否包含8.136.49.11
4. 浏览器控制台是否有错误

### Q: API代理失败
**A**:
1. 确认Unla API服务运行在5234端口
2. 检查vite.config.ts中proxy配置
3. 查看Unla Web控制台的代理日志

## 防火墙配置

如果需要外部访问，确保开放端口：
```bash
# 使用ufw
sudo ufw allow 5173/tcp

# 或使用firewalld
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --reload
```

---

**配置时间**: 2025-10-10
**修改文件**:
1. `/Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web/package.json`
2. `/Users/wxn/Desktop/NextAgentLite/lite-backend/Unla/web/vite.config.ts`

**下一步**: 重启Unla Web服务以应用新配置
