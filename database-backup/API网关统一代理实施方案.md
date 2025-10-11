# API网关统一代理实施方案

## 1. 现状分析

### 1.1 当前服务架构问题

**现状**: 前端直接调用多个独立服务的公网地址
- ❌ **性能问题**: 所有请求经过公网，增加延迟
- ❌ **安全风险**: 多个服务端口暴露在公网
- ❌ **管理复杂**: 需要为每个服务配置公网访问和CORS
- ❌ **网络开销**: 跨公网请求增加带宽消耗

### 1.2 涉及的服务和端口

| 服务名称 | 当前端口 | 前端调用方式 | 用途 |
|---------|---------|------------|------|
| **lite-backend** | 8000 | 直接HTTP调用 | 主后端API服务 |
| **deepscrape** | 3001 | 直接HTTP调用 | 深度爬虫服务 |
| **DataGraph** | 9622 | iframe嵌入 + API调用 | 知识图谱可视化和查询 |
| **llm-gateway** | 9050 | 直接HTTP调用 | LLM统一网关 |
| **Unla-web** | 5173 | iframe嵌入 | MCP工具管理界面 |

### 1.3 前端调用分析

#### 环境变量配置 (.env.local)
```bash
# 主API服务
VITE_API_BASE_URL=http://8.136.49.11:8000
VITE_WS_URL=ws://8.136.49.11:8000
VITE_SSE_URL=http://8.136.49.11:8000

# 知识图谱服务
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:9622

# Unla工具管理
VITE_UNLA_WEB_URL=http://8.136.49.11:5173

# Embedding API
VITE_EMBEDDING_API_ENDPOINT=http://8.136.49.11:8000/v1
```

#### 前端调用场景

**1. iframe嵌入场景** (需要特殊处理)
- **MatGraph知识图谱**: `src/pages/graph/MatGraphPage.tsx`
  ```typescript
  <iframe src="http://8.136.49.11:9622/webui" />
  ```

- **Unla工具管理**: `src/pages/tools/MCPUnlaEmbed.tsx`
  ```typescript
  <iframe src="http://8.136.49.11:5173?token=xxx" />
  ```

**2. API调用场景**
- 所有通过 `VITE_API_BASE_URL` 的请求
- 知识图谱API: `/api/graph/*`
- LLM网关: 通过后端代理

**3. WebSocket/SSE连接**
- 实时问答: `ws://8.136.49.11:8000/ws`
- 流式响应: `http://8.136.49.11:8000/stream`

## 2. 目标架构设计

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│  前端 (lite-qa:3000)                                         │
│  - 所有请求统一指向: http://8.136.49.11:8000                 │
│  - iframe嵌入通过网关代理路径                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  API网关 (lite-backend:8000) - 唯一公网入口                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  路由规则:                                            │   │
│  │  • /api/v1/*           → 127.0.0.1:8000 (本地API)    │   │
│  │  • /matgraph/*         → 127.0.0.1:9622 (知识图谱)    │   │
│  │  • /unla/*             → 127.0.0.1:5173 (Unla Web)   │   │
│  │  • /llm-gateway/*      → 127.0.0.1:9050 (LLM网关)    │   │
│  │  • /deepscrape/*       → 127.0.0.1:3001 (爬虫服务)    │   │
│  │  • /ws/*               → WebSocket代理               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌──────────────────┼──────────────────┬──────────────┐
        ↓                  ↓                  ↓              ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  DataGraph   │  │  Unla Web    │  │  LLM Gateway │  │  DeepScrape  │
│  127.0.0.1   │  │  127.0.0.1   │  │  127.0.0.1   │  │  127.0.0.1   │
│  :9622       │  │  :5173       │  │  :9050       │  │  :3001       │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### 2.2 网关路由规则

| 前端请求路径 | 代理目标 | 说明 |
|------------|---------|------|
| `/api/v1/*` | `http://127.0.0.1:8000/api/v1/*` | 主API服务 |
| `/matgraph/*` | `http://127.0.0.1:9622/*` | 知识图谱服务 |
| `/unla/*` | `http://127.0.0.1:5173/*` | Unla工具管理 |
| `/llm-gateway/*` | `http://127.0.0.1:9050/*` | LLM网关 |
| `/deepscrape/*` | `http://127.0.0.1:3001/*` | 爬虫服务 |
| `/ws/*` | WebSocket代理 | 实时通信 |
| `/stream/*` | SSE代理 | 流式响应 |

## 3. 实施步骤

### 3.1 后端网关层实现

#### 步骤1: 创建网关代理模块

**文件**: `lite-backend/api/gateway/proxy_router.py`

```python
"""
API网关代理路由
统一代理转发所有服务请求
"""
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
import httpx
import os
from typing import Optional
from core.logger import logger

router = APIRouter()

# 服务配置
SERVICES = {
    "matgraph": {
        "base_url": os.getenv("MATGRAPH_SERVICE_URL", "http://127.0.0.1:9622"),
        "prefix": "/matgraph"
    },
    "unla": {
        "base_url": os.getenv("UNLA_WEB_URL", "http://127.0.0.1:5173"),
        "prefix": "/unla"
    },
    "llm_gateway": {
        "base_url": os.getenv("LLM_CONFIG_GATEWAY_URL", "http://127.0.0.1:9050"),
        "prefix": "/llm-gateway"
    },
    "deepscrape": {
        "base_url": os.getenv("DEEPSCRAPE_URL", "http://127.0.0.1:3001"),
        "prefix": "/deepscrape"
    }
}

# HTTP客户端配置
http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(60.0, connect=5.0),
    follow_redirects=True,
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
)


async def proxy_request(
    request: Request,
    target_url: str,
    remove_prefix: Optional[str] = None
) -> Response:
    """
    通用代理请求函数

    Args:
        request: FastAPI请求对象
        target_url: 目标服务基础URL
        remove_prefix: 需要从路径中移除的前缀
    """
    # 构建目标URL
    path = request.url.path
    if remove_prefix and path.startswith(remove_prefix):
        path = path[len(remove_prefix):]

    target = f"{target_url}{path}"
    if request.url.query:
        target = f"{target}?{request.url.query}"

    # 准备请求头（移除不需要的头）
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("connection", None)

    # 读取请求体
    body = await request.body()

    try:
        # 发送代理请求
        response = await http_client.request(
            method=request.method,
            url=target,
            headers=headers,
            content=body,
            cookies=request.cookies
        )

        # 构建响应头
        response_headers = dict(response.headers)
        # 移除可能导致问题的响应头
        response_headers.pop("transfer-encoding", None)
        response_headers.pop("content-encoding", None)

        # 返回响应
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )

    except httpx.RequestError as e:
        logger.error(f"  [ERROR] 代理请求失败: {target} - {str(e)}")
        return Response(
            content={"error": f"Service unavailable: {str(e)}"},
            status_code=503
        )


# MatGraph代理
@router.api_route("/matgraph/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def matgraph_proxy(request: Request, path: str):
    """代理MatGraph知识图谱服务"""
    config = SERVICES["matgraph"]
    return await proxy_request(request, config["base_url"], config["prefix"])


# Unla代理
@router.api_route("/unla/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def unla_proxy(request: Request, path: str):
    """代理Unla工具管理服务"""
    config = SERVICES["unla"]
    return await proxy_request(request, config["base_url"], config["prefix"])


# LLM Gateway代理
@router.api_route("/llm-gateway/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def llm_gateway_proxy(request: Request, path: str):
    """代理LLM统一网关服务"""
    config = SERVICES["llm_gateway"]
    return await proxy_request(request, config["base_url"], config["prefix"])


# DeepScrape代理
@router.api_route("/deepscrape/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def deepscrape_proxy(request: Request, path: str):
    """代理DeepScrape爬虫服务"""
    config = SERVICES["deepscrape"]
    return await proxy_request(request, config["base_url"], config["prefix"])


# WebSocket代理 (如需要)
@router.websocket("/ws/{path:path}")
async def websocket_proxy(websocket: WebSocket, path: str):
    """WebSocket代理"""
    # TODO: 实现WebSocket代理逻辑
    pass


# 清理资源
async def cleanup():
    """关闭HTTP客户端"""
    await http_client.aclose()
```

#### 步骤2: 注册网关路由

**文件**: `lite-backend/main.py`

```python
# 在main.py中添加网关路由
from api.gateway.proxy_router import router as gateway_router, cleanup as gateway_cleanup

def create_app() -> FastAPI:
    app = FastAPI(...)

    # 注册网关路由（优先级要高，放在其他路由之前）
    app.include_router(gateway_router, tags=["Gateway"])

    # 其他路由
    app.include_router(api_router, prefix="/api/v1")

    return app

# 在关闭时清理
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # 清理网关HTTP客户端
    await gateway_cleanup()
```

### 3.2 前端配置修改

#### 步骤1: 更新环境变量

**文件**: `lite-qa/.env.local`

```bash
# 修改前 - 直接访问各服务
VITE_API_BASE_URL=http://8.136.49.11:8000
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:9622
VITE_UNLA_WEB_URL=http://8.136.49.11:5173

# 修改后 - 统一通过网关
VITE_API_BASE_URL=http://8.136.49.11:8000
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:8000/matgraph
VITE_UNLA_WEB_URL=http://8.136.49.11:8000/unla
VITE_LLM_GATEWAY_URL=http://8.136.49.11:8000/llm-gateway
VITE_DEEPSCRAPE_URL=http://8.136.49.11:8000/deepscrape
```

#### 步骤2: 更新iframe嵌入路径

**文件**: `lite-qa/src/pages/graph/MatGraphPage.tsx`

```typescript
// 修改前
const iframeUrl = 'http://8.136.49.11:9622/webui';

// 修改后
const iframeUrl = `${import.meta.env.VITE_API_BASE_URL}/matgraph/webui`;
```

**文件**: `lite-qa/src/pages/tools/MCPUnlaEmbed.tsx`

```typescript
// 修改前
const base = import.meta.env.VITE_UNLA_WEB_URL || 'http://localhost:5173';

// 修改后
const base = `${import.meta.env.VITE_API_BASE_URL}/unla`;
```

#### 步骤3: 更新配置文件

**文件**: `lite-qa/src/config/appConfig.ts`

```typescript
// 知识图谱配置
matgraph: {
  host: getEnvValue('VITE_MATGRAPH_HOST', '127.0.0.1'),
  port: getEnvNumber('VITE_MATGRAPH_PORT', 9622),
  baseUrl: getEnvValue('VITE_MATGRAPH_BASE_URL',
    // 统一使用网关路径
    `${APP_CONFIG.api.baseURL}/matgraph`
  ),
},

// Unla工具管理配置
unla: {
  baseUrl: getEnvValue('VITE_UNLA_WEB_URL',
    `${APP_CONFIG.api.baseURL}/unla`
  ),
},
```

### 3.3 各服务监听配置修改

#### DataGraph服务 (9622 → 127.0.0.1:9622)

**文件**: `lite-backend/DataGraph/.env` 或启动脚本

```bash
# 修改前
DATAGRAPH_HOST=0.0.0.0
DATAGRAPH_PORT=9622

# 修改后
DATAGRAPH_HOST=127.0.0.1
DATAGRAPH_PORT=9622
```

#### Unla Web服务 (5173 → 127.0.0.1:5173)

**文件**: `lite-backend/Unla/web/vite.config.ts`

```typescript
// 修改前
server: {
  host: '0.0.0.0',
  port: 5173,
  ...
}

// 修改后
server: {
  host: '127.0.0.1',  // 只监听本地
  port: 5173,
  ...
}
```

**文件**: `lite-backend/Unla/web/package.json`

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "preview": "vite preview --host 127.0.0.1"
  }
}
```

#### LLM Gateway (9050 → 127.0.0.1:9050)

**配置文件**: 修改LLM Gateway的监听地址为127.0.0.1

#### DeepScrape (3001 → 127.0.0.1:3001)

**配置文件**: 修改DeepScrape的监听地址为127.0.0.1

### 3.4 CORS配置简化

#### 后端CORS配置

**文件**: `lite-backend/.env`

```bash
# 修改前 - 需要允许多个服务端口
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://8.136.49.11:3000,http://8.136.49.11:5173,http://8.136.49.11:9622"

# 修改后 - 只需要允许前端
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://8.136.49.11:3000"
```

## 4. 部署检查清单

### 4.1 后端部署

- [ ] 创建网关代理模块 `api/gateway/proxy_router.py`
- [ ] 在main.py中注册网关路由
- [ ] 配置服务URL环境变量
- [ ] 测试代理路由是否正常工作

### 4.2 前端部署

- [ ] 更新 `.env.local` 环境变量
- [ ] 修改iframe嵌入路径
- [ ] 更新appConfig.ts配置
- [ ] 重新构建前端

### 4.3 各服务配置

- [ ] DataGraph改为监听127.0.0.1
- [ ] Unla Web改为监听127.0.0.1
- [ ] LLM Gateway改为监听127.0.0.1
- [ ] DeepScrape改为监听127.0.0.1
- [ ] 重启所有服务

### 4.4 防火墙配置

- [ ] 关闭3001端口公网访问
- [ ] 关闭5173端口公网访问
- [ ] 关闭9050端口公网访问
- [ ] 关闭9622端口公网访问
- [ ] 保持8000端口公网访问

### 4.5 验证测试

- [ ] 测试主API调用: `curl http://8.136.49.11:8000/api/v1/health`
- [ ] 测试MatGraph代理: `curl http://8.136.49.11:8000/matgraph/health`
- [ ] 测试Unla代理: `curl http://8.136.49.11:8000/unla/`
- [ ] 测试iframe嵌入是否正常显示
- [ ] 测试WebSocket连接
- [ ] 检查浏览器控制台无CORS错误

## 5. 优势分析

### 5.1 性能提升

| 项目 | 修改前 | 修改后 | 提升 |
|-----|-------|--------|-----|
| 网络跳转 | 前端→公网→服务 | 前端→公网→网关→本地服务 | 减少公网延迟 |
| 并发连接 | 5个服务独立连接 | 1个网关统一连接 | 连接复用 |
| 带宽消耗 | 全部公网流量 | 内网流量为主 | 节省带宽 |

### 5.2 安全加固

- ✅ 减少攻击面：只暴露一个端口
- ✅ 统一认证：在网关层统一处理token验证
- ✅ 流量控制：网关层实现限流和熔断
- ✅ 日志审计：统一记录所有服务访问日志

### 5.3 运维简化

- ✅ 配置集中：所有路由规则在一处管理
- ✅ 服务发现：新增服务只需添加路由规则
- ✅ 监控统一：在网关层统一监控所有流量
- ✅ 故障隔离：单个服务故障不影响网关

## 6. 回滚方案

如果网关部署出现问题，可以快速回滚：

### 6.1 前端回滚

```bash
# 恢复环境变量
cp .env.local.backup .env.local

# 重新构建
npm run build
```

### 6.2 后端回滚

```bash
# 移除网关路由
# 在main.py中注释掉gateway_router

# 重启服务
pm2 restart server
```

### 6.3 各服务回滚

```bash
# 恢复公网监听
# DataGraph
DATAGRAPH_HOST=0.0.0.0

# Unla
修改vite.config.ts中的host为0.0.0.0

# 重启服务
```

## 7. 监控和日志

### 7.1 网关监控指标

```python
# 在proxy_router.py中添加监控
from prometheus_client import Counter, Histogram

proxy_requests = Counter('proxy_requests_total', 'Total proxy requests', ['service', 'method', 'status'])
proxy_duration = Histogram('proxy_request_duration_seconds', 'Proxy request duration', ['service'])

@router.api_route("/matgraph/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def matgraph_proxy(request: Request, path: str):
    start_time = time.time()
    try:
        response = await proxy_request(request, SERVICES["matgraph"]["base_url"], "/matgraph")
        proxy_requests.labels(service='matgraph', method=request.method, status=response.status_code).inc()
        return response
    finally:
        proxy_duration.labels(service='matgraph').observe(time.time() - start_time)
```

### 7.2 日志记录

```python
# 每个代理请求都记录日志
logger.info(f"  [GATEWAY] {request.method} {request.url.path} → {target_url}")
logger.info(f"  [GATEWAY] Response: {response.status_code} in {duration:.2f}s")
```

---

**文档版本**: 1.0
**创建时间**: 2025-10-11
**适用环境**: 测试环境、生产环境
**预计工作量**: 4-6小时
