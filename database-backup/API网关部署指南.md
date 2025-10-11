# API网关统一代理部署指南

## 部署概述

本次部署将实现统一的API网关层，通过8000端口代理转发所有服务请求，替代原有的多端口直接访问模式。

### 架构变更
**部署前**：所有服务独立暴露公网端口
- lite-backend: 8000
- DataGraph: 9622 ❌
- Unla: 5173 ❌
- LLM Gateway: 9050 ❌
- DeepScrape: 3001 ❌

**部署后**：仅8000端口暴露，其他服务通过网关代理
- lite-backend: 8000 (网关入口)
- DataGraph: 127.0.0.1:9622 (仅localhost)
- Unla: 127.0.0.1:5173 (仅localhost)
- LLM Gateway: 127.0.0.1:9050 (仅localhost)
- DeepScrape: 127.0.0.1:3001 (仅localhost)

## 已完成的代码修改

### 1. 后端网关路由器实现

**新增文件**: `lite-backend/api/gateway/proxy_router.py`
- ✅ 实现通用代理请求处理器
- ✅ 支持流式响应（SSE）
- ✅ 4个服务路由: MatGraph、Unla、LLM Gateway、DeepScrape
- ✅ 健康检查端点: `/gateway/health`
- ✅ 服务列表端点: `/gateway/services`

**路由映射**:
```
/gateway/matgraph/*   → http://127.0.0.1:9622/*
/gateway/unla/*       → http://127.0.0.1:5173/*
/gateway/llm-gateway/* → http://127.0.0.1:9050/*
/gateway/deepscrape/*  → http://127.0.0.1:3001/*
```

### 2. 后端主应用配置

**修改文件**: `lite-backend/main.py`
- ✅ 注册网关路由器（第604-616行）
- ✅ 添加网关HTTP客户端生命周期管理
- ✅ 启动日志输出网关挂载信息

### 3. 前端环境配置

**修改文件**: `lite-qa/.env.local`
- ✅ MatGraph访问地址: `http://8.136.49.11:9622` → `http://8.136.49.11:8000/gateway/matgraph`
- ✅ Unla访问地址: `http://8.136.49.11:5173` → `http://8.136.49.11:8000/gateway/unla`

## 部署步骤（测试环境）

### 第一阶段：后端部署（可独立执行）

#### 1. 备份和上传后端文件

```bash
# 在测试服务器上备份
cd /path/to/lite-backend
cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S)

# 从本地复制文件到测试服务器
scp -r /Users/wxn/Desktop/NextAgentLite/lite-backend/api/gateway/ \
    user@8.136.49.11:/path/to/lite-backend/api/

scp /Users/wxn/Desktop/NextAgentLite/lite-backend/main.py \
    user@8.136.49.11:/path/to/lite-backend/
```

#### 2. 重启后端服务

```bash
# 如果使用 PM2
pm2 restart server

# 如果使用 systemd
sudo systemctl restart mat-backend

# 如果直接运行
conda activate zzdsj-lite
python main.py
```

#### 3. 验证网关可用性

```bash
# 验证网关健康检查
curl http://8.136.49.11:8000/gateway/health

# 预期响应（示例）:
# {
#   "gateway": "healthy",
#   "services": {
#     "matgraph": {"name": "MatGraph知识图谱服务", "status": "healthy", ...},
#     "unla": {"name": "Unla模型管理服务", "status": "unavailable", ...},
#     ...
#   },
#   "overall": "degraded"
# }

# 测试MatGraph代理
curl http://8.136.49.11:8000/gateway/matgraph/health
```

**重要**: 此阶段完成后，网关已就绪，但前端仍使用旧地址。两者可以并存不影响。

### 第二阶段：前端部署（需要后端网关就绪）

#### 1. 备份和上传前端配置

```bash
# 在测试服务器上备份
cd /path/to/lite-qa
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# 从本地复制文件到测试服务器
scp /Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local \
    user@8.136.49.11:/path/to/lite-qa/
```

#### 2. 重新构建前端（如果需要）

```bash
cd /path/to/lite-qa

# 安装依赖（如果是首次部署）
npm install

# 构建生产版本
npm run build

# 如果使用 PM2
pm2 restart web

# 如果使用 nginx
sudo systemctl reload nginx
```

#### 3. 验证前端访问

```bash
# 访问测试页面
curl http://8.136.49.11:8000

# 检查浏览器控制台
# - MatGraph iframe应加载: http://8.136.49.11:8000/gateway/matgraph
# - Unla iframe应加载: http://8.136.49.11:8000/gateway/unla
```

### 第三阶段：服务localhost绑定（可选，增强安全性）

⚠️ **注意**: 此阶段会将服务绑定到localhost，必须确保网关正常工作后再执行。

#### 1. 修改各服务监听地址

**DataGraph (端口9622)**:
```bash
# 编辑 DataGraph 配置文件，修改监听地址
# 示例（具体路径和配置文件名需确认）:
# server.host: "127.0.0.1"
# 或启动参数: --host 127.0.0.1
```

**Unla (端口5173)**:
```bash
# 编辑 vite.config.js 或 .env
# server: {
#   host: '127.0.0.1',
#   port: 5173
# }
```

**LLM Gateway (端口9050)**:
```bash
# 编辑配置文件，修改监听地址
# host: "127.0.0.1"
```

**DeepScrape (端口3001)**:
```bash
# 编辑配置文件或启动脚本
# HOST=127.0.0.1
```

#### 2. 验证服务无法公网访问

```bash
# 从外部网络测试（应该超时或拒绝连接）
curl http://8.136.49.11:9622  # 应失败
curl http://8.136.49.11:5173  # 应失败

# 从服务器本地测试（应成功）
ssh user@8.136.49.11
curl http://127.0.0.1:9622/health  # 应成功
curl http://127.0.0.1:5173         # 应成功

# 通过网关访问（应成功）
curl http://8.136.49.11:8000/gateway/matgraph/health  # 应成功
curl http://8.136.49.11:8000/gateway/unla/            # 应成功
```

## 测试检查清单

### 功能测试
- [ ] 后端健康检查: `curl http://8.136.49.11:8000/health`
- [ ] 网关健康检查: `curl http://8.136.49.11:8000/gateway/health`
- [ ] 网关服务列表: `curl http://8.136.49.11:8000/gateway/services`
- [ ] MatGraph代理: 访问知识图谱页面，检查iframe加载
- [ ] Unla代理: 访问模型管理页面，检查iframe加载
- [ ] 前端API调用: 测试问答、文档上传等核心功能

### 性能测试
- [ ] 代理延迟: 对比直连和网关代理的响应时间
- [ ] 并发处理: 多用户同时访问
- [ ] 流式响应: SSE/WebSocket正常工作

### 安全测试（第三阶段后）
- [ ] 服务端口隔离: 9622、5173、9050、3001无法从公网访问
- [ ] 网关访问正常: 通过8000端口可访问所有服务
- [ ] CORS配置: 跨域请求正常工作

## 监控和日志

### 查看网关日志

```bash
# 启动日志（应看到网关挂载信息）
tail -f logs/mat_qa_$(date +%Y-%m-%d).log | grep "API网关"

# 预期日志:
# [OK] API网关代理已挂载: /gateway/* → 多服务反向代理

# 运行时日志（查看代理请求）
tail -f logs/mat_qa_$(date +%Y-%m-%d).log | grep "\[GATEWAY\]"

# 预期日志示例:
# [GATEWAY] 代理请求: MatGraph知识图谱服务 | GET /gateway/matgraph/health -> http://127.0.0.1:9622/health
```

### 监控指标

关注以下指标：
- 网关响应时间
- 代理请求成功率
- HTTP客户端连接池状态
- 各服务健康状态

## 回滚方案

### 快速回滚（保持服务可用）

```bash
# 回滚后端
cd /path/to/lite-backend
cp main.py.backup.YYYYMMDD_HHMMSS main.py
rm -rf api/gateway/
pm2 restart server

# 回滚前端
cd /path/to/lite-qa
cp .env.local.backup.YYYYMMDD_HHMMSS .env.local
npm run build
pm2 restart web

# 恢复服务公网监听（如果已修改）
# 编辑各服务配置，改回 0.0.0.0
```

### 分阶段回滚

**如果只完成了第一阶段（后端）**:
- 回滚 `main.py` 和删除 `api/gateway/`
- 前端未修改，无需回滚

**如果完成了第二阶段（前端）**:
- 回滚前端 `.env.local`
- 重新构建前端
- 后端网关保留不影响

**如果完成了第三阶段（localhost绑定）**:
- 必须先恢复服务公网监听
- 然后再回滚前后端配置

## 故障排查

### 问题1: 网关路由404

**症状**: 访问 `/gateway/*` 返回404

**排查**:
```bash
# 检查路由是否注册
curl http://8.136.49.11:8000/gateway/services

# 查看启动日志
grep "API网关" logs/mat_qa_*.log
```

**解决**: 确认 `main.py` 中网关路由注册代码正确执行

### 问题2: 代理请求502

**症状**: 网关返回502 Bad Gateway

**排查**:
```bash
# 检查目标服务是否运行
ssh user@8.136.49.11
curl http://127.0.0.1:9622/health
curl http://127.0.0.1:5173

# 查看网关日志
grep "代理请求失败" logs/mat_qa_*.log
```

**解决**: 启动对应的后端服务

### 问题3: iframe无法加载

**症状**: 前端iframe显示空白或错误

**排查**:
```bash
# 检查浏览器控制台CORS错误
# 检查iframe src属性
# 验证网关代理响应头

# 测试网关代理
curl -I http://8.136.49.11:8000/gateway/matgraph/
curl -I http://8.136.49.11:8000/gateway/unla/
```

**解决**:
- 检查CORS配置
- 验证响应头中的 `X-Frame-Options`
- 确认网关正确转发所有响应头

### 问题4: 性能下降

**症状**: 通过网关访问比直连慢

**排查**:
```bash
# 对比直连和代理延迟
time curl http://127.0.0.1:9622/health
time curl http://8.136.49.11:8000/gateway/matgraph/health

# 检查HTTP客户端连接池
# 查看日志中的代理耗时
```

**解决**:
- 调整 `httpx.AsyncClient` 的 `timeout` 和 `limits` 配置
- 优化网关代理逻辑
- 考虑添加响应缓存

## 配置参考

### 网关服务配置

当前 `proxy_router.py` 中的服务配置:

```python
SERVICES = {
    "matgraph": {
        "base_url": "http://127.0.0.1:9622",
        "prefix": "/matgraph",
        "name": "MatGraph知识图谱服务"
    },
    "unla": {
        "base_url": "http://127.0.0.1:5173",
        "prefix": "/unla",
        "name": "Unla模型管理服务"
    },
    "llm_gateway": {
        "base_url": "http://127.0.0.1:9050",
        "prefix": "/llm-gateway",
        "name": "LLM统一网关"
    },
    "deepscrape": {
        "base_url": "http://127.0.0.1:3001",
        "prefix": "/deepscrape",
        "name": "DeepScrape爬虫服务"
    }
}
```

### HTTP客户端配置

```python
httpx.AsyncClient(
    timeout=httpx.Timeout(300.0),  # 5分钟超时
    limits=httpx.Limits(
        max_keepalive_connections=50,  # 保持连接数
        max_connections=100            # 最大连接数
    ),
    follow_redirects=True
)
```

## 后续优化建议

1. **添加缓存层**: 对不常变化的响应添加缓存
2. **请求限流**: 防止单服务被过度请求
3. **监控告警**: 集成Prometheus监控各服务健康度
4. **负载均衡**: 如果服务有多实例，实现负载均衡
5. **访问日志**: 记录所有代理请求用于审计

---

**部署时间**: 2025-10-11
**测试环境**: 8.136.49.11
**网关版本**: v1.0.0
**影响范围**: 所有需要跨服务访问的功能（MatGraph、Unla嵌入页面等）
