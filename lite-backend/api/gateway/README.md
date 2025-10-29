# API网关统一代理配置说明

## 概述

API网关统一代理架构提供了对多个后端服务的统一入口和管理，所有外部服务请求通过网关进行转发，实现类似nginx反向代理的功能。

**网关路由前缀**: `/api-gateway`（避免与Unla专用网关 `/gateway` 冲突）

## 架构设计

```
客户端请求
    ↓
lite-backend:8000 (主后端)
    ↓
/api-gateway/* (API网关路由)
    ↓
统一代理转发 (proxy_router.py)
    ↓
├─ /api-gateway/matgraph/*     → DataGraph服务 (9622端口)
├─ /api-gateway/model/*        → LLM模型管理Web (5173端口)
├─ /api-gateway/llm-gateway/*  → LLM统一配置网关 (9050端口)
└─ /api-gateway/deepscrape/*   → DeepScrape爬虫服务 (3001端口)
```

## 配置文件

### 1. 服务配置文件

**位置**: `/lite-backend/config/gateway_services.yaml`

**结构**:
```yaml
services:
  # 服务key: 服务配置
  matgraph:
    base_url: "${MATGRAPH_BASE_URL:http://127.0.0.1:9622}"  # 支持环境变量
    prefix: "/datagraph"                                     # 网关路由前缀
    name: "DataGraph知识图谱服务"                           # 服务名称
    description: "服务描述"                                  # 服务说明
    enabled: true                                            # 是否启用
    timeout: 300                                             # 超时时间(秒)
    health_check: "/health"                                  # 健康检查端点
```

**环境变量替换**:
- 格式: `${VAR_NAME:default_value}`
- 示例: `${MATGRAPH_BASE_URL:http://127.0.0.1:9622}`
- 说明: 优先使用环境变量，如果未设置则使用默认值

### 2. HTTP客户端配置

```yaml
http_client:
  connect_timeout: 30        # 连接超时(秒)
  read_timeout: 300          # 读取超时(秒)
  write_timeout: 300         # 写入超时(秒)
  pool:
    max_keepalive_connections: 50  # 最大保持连接数
    max_connections: 100            # 最大连接数
  follow_redirects: true     # 是否跟随重定向
  retry:
    max_retries: 3           # 最大重试次数
    retry_on_timeout: true   # 超时时重试
    retry_status_codes: [502, 503, 504]  # 重试的状态码
```

### 3. 网关全局配置

```yaml
gateway:
  enable_health_check: true          # 启用健康检查
  health_check_interval: 60          # 健康检查间隔(秒)
  enable_request_logging: true       # 启用请求日志
  enable_cors: true                  # 启用CORS
  cors_origins: ["*"]                # 允许的来源
  cors_methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  cors_headers: ["*"]                # 允许的请求头
```

## 代理服务列表

| 服务名 | 配置Key | 网关路由 | 目标地址 | 端口 | 健康检查 |
|--------|---------|----------|----------|------|----------|
| DataGraph知识图谱 | `matgraph` | `/api-gateway/matgraph/*` | http://127.0.0.1:9622 | 9622 | `/health` |
| LLM模型管理Web | `unla` | `/api-gateway/model/*` | http://127.0.0.1:5173 | 5173 | - |
| LLM统一配置网关 | `llm_gateway` | `/api-gateway/llm-gateway/*` | http://127.0.0.1:9050 | 9050 | `/health` |
| DeepScrape爬虫 | `deepscrape` | `/api-gateway/deepscrape/*` | http://127.0.0.1:3001 | 3001 | `/health` |

## API端点

### 网关管理端点

#### 1. 健康检查
```http
GET /api-gateway/health
```

**响应示例**:
```json
{
  "gateway": "healthy",
  "services": {
    "matgraph": {
      "name": "DataGraph知识图谱服务",
      "status": "healthy",
      "status_code": 200
    },
    "llm_gateway": {
      "name": "LLM统一配置网关",
      "status": "healthy",
      "status_code": 200
    },
    "deepscrape": {
      "name": "DeepScrape爬虫服务",
      "status": "unavailable",
      "error": "Connection refused"
    },
    "unla": {
      "name": "LLM模型管理服务",
      "status": "no_health_check",
      "message": "服务未配置健康检查端点"
    }
  },
  "overall": "degraded"
}
```

#### 2. 获取服务列表
```http
GET /api-gateway/services
```

**响应示例**:
```json
{
  "services": [
    {
      "key": "matgraph",
      "name": "DataGraph知识图谱服务",
      "prefix": "/datagraph",
      "base_url": "http://127.0.0.1:9622",
      "description": "基于LightRAG的知识图谱服务",
      "timeout": 300
    }
  ]
}
```

#### 3. 重新加载配置
```http
POST /api-gateway/reload
```

**说明**: 热重载配置文件，无需重启服务

**响应示例**:
```json
{
  "status": "success",
  "message": "配置已重新加载"
}
```

### 代理端点

#### DataGraph服务
```http
GET/POST /api-gateway/matgraph/{path}
```

示例:
```bash
# 健康检查
curl http://localhost:8000/api-gateway/matgraph/health

# 查询图谱
curl -X POST http://localhost:8000/api-gateway/matgraph/query \
  -H "Content-Type: application/json" \
  -d '{"query": "地聚物"}'
```

#### LLM Gateway服务
```http
GET/POST /api-gateway/llm-gateway/{path}
```

示例:
```bash
# 获取模型列表
curl http://localhost:8000/api-gateway/llm-gateway/v1/models/enabled

# LLM推理
curl -X POST http://localhost:8000/api-gateway/llm-gateway/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-plus", "messages": [{"role": "user", "content": "Hello"}]}'
```

#### DeepScrape服务
```http
GET/POST /api-gateway/deepscrape/{path}
```

示例:
```bash
# 提交爬取任务
curl -X POST http://localhost:8000/api-gateway/deepscrape/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

#### Unla模型管理Web
```http
GET /api-gateway/model/{path}
```

说明: 代理前端静态资源，通常用于iframe嵌入

## 前端配置

### 环境变量配置

**位置**: `/lite-qa/.env.local`

```bash
# 主API基础地址
VITE_API_BASE_URL=http://8.136.49.11:8000

# DataGraph知识图谱服务（通过网关代理）
VITE_MATGRAPH_BASE_URL=http://8.136.49.11:8000/api-gateway/matgraph

# LLM模型管理Web服务（通过网关代理）
VITE_UNLA_WEB_URL=http://8.136.49.11:8000/api-gateway/model

# LLM统一配置网关（通过网关代理）
VITE_LLM_GATEWAY_URL=http://8.136.49.11:8000/api-gateway/llm-gateway
```

**注意事项**:
1. **DeepScrape服务不需要配置**: 前端通过主API的 `/api/v1/url-crawl/*` 端点访问
2. **开发环境**: 可以使用 `http://localhost:8000`
3. **生产环境**: 使用实际的服务器地址和端口

## 使用方式

### 添加新服务

1. **编辑配置文件** (`config/gateway_services.yaml`):
```yaml
services:
  new_service:
    base_url: "${NEW_SERVICE_URL:http://127.0.0.1:8080}"
    prefix: "/new-service"
    name: "新服务"
    description: "新服务描述"
    enabled: true
    timeout: 60
    health_check: "/health"
```

2. **添加路由** (`api/gateway/proxy_router.py`):
```python
@router.api_route("/new-service/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def new_service_proxy(request: Request, path: str):
    """代理新服务"""
    config_loader = get_config_loader()
    service_config = config_loader.get_service("new_service")
    if not service_config or not service_config.enabled:
        raise HTTPException(status_code=503, detail="新服务未启用")
    return await proxy_request(request, service_config.base_url, service_config.prefix, service_config.name)
```

3. **前端配置** (如需要):
```bash
# .env.local
VITE_NEW_SERVICE_URL=http://localhost:8000/api-gateway/new-service
```

4. **重新加载配置**:
```bash
curl -X POST http://localhost:8000/api-gateway/reload
```

### 禁用服务

1. **修改配置文件**:
```yaml
services:
  service_name:
    enabled: false  # 设置为false
```

2. **重新加载配置**:
```bash
curl -X POST http://localhost:8000/api-gateway/reload
```

### 修改服务配置

1. **编辑配置文件** (修改timeout、base_url等)
2. **重新加载配置** (无需重启服务)

### 使用环境变量

**优先级**: 环境变量 > 配置文件默认值

**示例**:
```bash
# 设置环境变量
export MATGRAPH_BASE_URL=http://192.168.1.100:9622
export LLM_GATEWAY_BASE_URL=http://192.168.1.100:9050

# 启动服务
python main.py
```

## 监控与调试

### 查看日志

```bash
# 后端日志
tail -f logs/mat_qa_$(date +%Y-%m-%d).log | grep GATEWAY
```

**日志格式**:
```
[GATEWAY] 代理请求: DataGraph知识图谱服务 | GET /api-gateway/matgraph/health -> http://127.0.0.1:9622/health
[GATEWAY] 代理请求失败: DeepScrape爬虫服务 | Connection refused
```

### 健康检查

```bash
# 检查网关整体状态
curl http://localhost:8000/api-gateway/health | jq

# 检查特定服务
curl http://localhost:8000/api-gateway/matgraph/health
curl http://localhost:8000/api-gateway/llm-gateway/health
curl http://localhost:8000/api-gateway/deepscrape/health
```

### 调试技巧

1. **验证配置加载**:
```bash
curl http://localhost:8000/api-gateway/services | jq
```

2. **测试代理转发**:
```bash
# 添加详细输出
curl -v http://localhost:8000/api-gateway/matgraph/health
```

3. **检查连接池状态**: 查看日志中的 "HTTP客户端已初始化" 信息

## 常见问题

### Q1: 503 Service Unavailable
**原因**: 目标服务未启动或配置的 `enabled: false`
**解决**:
1. 检查目标服务是否运行
2. 检查配置文件中 `enabled` 字段
3. 使用健康检查端点确认服务状态

### Q2: 502 Bad Gateway
**原因**: 目标服务地址错误或无法访问
**解决**:
1. 检查 `base_url` 配置是否正确
2. 确认目标服务端口是否正确
3. 检查网络连接和防火墙

### Q3: 前端请求404
**原因**: 路由路径不匹配
**解决**:
1. 确认前端配置路径包含 `/api-gateway` 前缀
2. 检查后端路由定义
3. 查看浏览器Network面板确认实际请求路径

### Q4: 配置修改未生效
**原因**: 未重新加载配置
**解决**: 调用 `/api-gateway/reload` 端点或重启服务

### Q5: 超时错误
**原因**: 服务响应时间超过配置的timeout
**解决**:
1. 增加服务的 `timeout` 配置
2. 优化目标服务性能
3. 检查网络延迟

## 性能优化

### 连接池配置

```yaml
http_client:
  pool:
    max_keepalive_connections: 50  # 根据并发量调整
    max_connections: 100            # 根据服务器资源调整
```

**建议**:
- 低并发: `max_connections: 50`
- 中并发: `max_connections: 100`
- 高并发: `max_connections: 200+`

### 超时配置

```yaml
services:
  service_name:
    timeout: 60  # 根据服务特性调整
```

**建议**:
- 快速API: `30-60秒`
- 计算密集: `120-300秒`
- 爬虫服务: `300-600秒`

### 重试策略

```yaml
http_client:
  retry:
    max_retries: 3
    retry_on_timeout: true
    retry_status_codes: [502, 503, 504]
```

## 安全建议

1. **生产环境**: 配置具体的 `cors_origins`，避免使用 `*`
2. **敏感信息**: 使用环境变量管理敏感配置（API密钥等）
3. **认证鉴权**: 在代理层添加统一的认证中间件
4. **限流**: 为每个服务配置请求频率限制
5. **日志脱敏**: 避免在日志中输出敏感信息

## 版本历史

### v1.0 (2025-10-15)
- 初始版本
- 支持4个服务代理（DataGraph、Unla、LLM Gateway、DeepScrape）
- 实现配置热重载
- 支持健康检查和服务状态监控

---

**维护**: GAC Team
**最后更新**: 2025-10-15
