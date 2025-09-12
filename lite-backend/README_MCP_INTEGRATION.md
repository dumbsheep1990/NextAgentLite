# MCP Context Forge 集成文档

本文档描述了如何将MCP Context Forge项目集成到NextAgent Lite系统中，实现统一的工具导航和管理。

## 概述

MCP Context Forge是一个功能丰富的Model Context Protocol网关和代理，支持：
- 多MCP和REST服务的联合
- 统一发现、认证、速率限制
- 可观测性、虚拟服务器、多传输协议
- 可选的管理UI

## 集成架构

```
┌─────────────────────────────────────────────────────────┐
│                NextAgent Lite 系统                      │
├─────────────────────────────────────────────────────────┤
│  Frontend (React/Vue)                                   │
│  ├── MCP工具管理界面                                     │
│  ├── 工具调用界面                                       │
│  └── 系统监控界面                                       │
├─────────────────────────────────────────────────────────┤
│  Backend API (FastAPI)                                 │
│  ├── MCP Integration API (/api/mcp/*)                  │
│  ├── 现有API端点                                       │
│  └── 统一路由管理                                       │
├─────────────────────────────────────────────────────────┤
│  MCP Integration Service                                │
│  ├── MCP Gateway 连接管理                              │
│  ├── 工具注册和发现                                     │
│  ├── 工具调用代理                                       │
│  └── 性能监控                                          │
├─────────────────────────────────────────────────────────┤
│  Database Layer (PostgreSQL)                           │
│  ├── MCP服务器注册表                                   │
│  ├── MCP工具注册表                                     │
│  ├── 工具调用日志                                       │
│  └── 配置管理                                          │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│            MCP Context Forge Gateway                    │
│            (开源项目)                                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Youtu-Agent  │ │System Tools │ │Database MCP │      │
│  │   Tools     │ │             │ │   Server    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 安装和配置

### 1. 依赖安装

MCP Context Forge依赖已添加到 `requirements.txt`:

```bash
# 安装依赖
cd lite-backend
pip install -r requirements.txt
```

### 2. 数据库迁移

运行数据库迁移脚本创建MCP相关表：

```bash
# 执行迁移
psql -d your_database -f migrations/20250912_add_mcp_integration_tables.sql
```

### 3. MCP Gateway部署

```bash
# 克隆MCP Context Forge项目
git clone https://github.com/ibm/mcp-context-forge.git
cd mcp-context-forge

# 安装依赖
uv venv
source .venv/bin/activate
uv add "mcp[cli]" httpx

# 启动Gateway
make run
```

### 4. 配置文件

编辑 `config/mcp_config.yaml` 配置MCP集成参数：

```yaml
mcp_gateway:
  host: "localhost"
  port: 8000
  base_url: "http://localhost:8000"
  
  auth:
    enabled: true
    type: "basic"
    username: "admin"
    password: "admin123"
```

## 使用方式

### 1. 初始化MCP服务

```bash
# 启动后端服务
python main.py

# 初始化MCP集成
curl -X POST http://localhost:8080/api/mcp/initialize
```

### 2. 注册MCP服务器

```bash
# 注册Youtu-Agent工具服务器
curl -X POST http://localhost:8080/api/mcp/servers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "youtu-agent-tools",
    "display_name": "Youtu-Agent 工具集",
    "description": "Youtu-Agent智能体工具集合",
    "server_type": "internal",
    "transport_type": "http",
    "connection_config": {
      "url": "http://localhost:8080/youtu/tools",
      "auth_type": "none"
    }
  }'
```

### 3. 工具迁移

运行工具迁移脚本：

```bash
# 迁移现有工具到MCP
python scripts/migrate_tools_to_mcp.py
```

### 4. 调用MCP工具

```bash
# 调用工具
curl -X POST http://localhost:8080/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "search",
    "arguments": {
      "query": "人工智能",
      "limit": 10
    },
    "session_id": "test_session"
  }'
```

## API端点

### 服务器管理
- `POST /api/mcp/initialize` - 初始化MCP服务
- `POST /api/mcp/servers/register` - 注册MCP服务器
- `GET /api/mcp/servers` - 获取服务器列表
- `GET /api/mcp/servers/{server_id}` - 获取服务器详情
- `DELETE /api/mcp/servers/{server_id}` - 删除服务器

### 工具管理
- `GET /api/mcp/tools` - 获取工具列表
- `GET /api/mcp/tools/{tool_id}` - 获取工具详情
- `POST /api/mcp/tools/call` - 调用工具
- `GET /api/mcp/tools/{tool_id}/calls` - 获取调用历史

### 资源管理
- `GET /api/mcp/resources` - 获取资源列表

### 系统状态
- `GET /api/mcp/status` - 获取系统状态
- `GET /api/mcp/health` - 健康检查
- `POST /api/mcp/sync` - 同步工具和资源

## 数据库表结构

### mcp_servers - MCP服务器注册表
- `id` - 服务器ID (UUID)
- `name` - 服务器名称
- `display_name` - 显示名称
- `server_type` - 服务器类型 (external/internal/virtual)
- `connection_config` - 连接配置 (JSON)
- `transport_type` - 传输类型 (stdio/http/sse/websocket)
- `health_status` - 健康状态

### mcp_tools - MCP工具注册表
- `id` - 工具ID (UUID)
- `server_id` - 所属服务器ID
- `tool_name` - 工具名称
- `tool_schema` - 工具Schema (JSON)
- `category` - 工具分类
- `usage_count` - 使用次数

### mcp_tool_calls - 工具调用日志
- `id` - 调用ID (UUID)
- `tool_id` - 工具ID
- `call_request` - 调用请求 (JSON)
- `call_response` - 调用响应 (JSON)
- `call_status` - 调用状态
- `duration_ms` - 执行时长

## 监控和日志

### 性能监控
- 工具调用次数统计
- 平均响应时间
- 成功率监控
- 服务器健康状态

### 日志记录
- 所有工具调用都会记录到数据库
- 详细的错误信息和堆栈跟踪
- 性能指标收集

## 故障排除

### 常见问题

1. **MCP Gateway连接失败**
   - 检查Gateway是否正在运行：`curl http://localhost:8000/health`
   - 验证配置文件中的连接信息

2. **工具注册失败**
   - 检查服务器配置是否正确
   - 验证连接配置中的URL和认证信息

3. **工具调用超时**
   - 增加超时时间配置
   - 检查目标服务器的响应速度

### 调试模式

启用调试日志：

```python
# 在配置文件中设置
logging:
  level: "DEBUG"
  loggers:
    "mcp_integration": "DEBUG"
```

## 扩展开发

### 添加新的MCP服务器

1. 实现MCP服务器接口
2. 注册到MCP Gateway
3. 在系统中注册服务器配置
4. 同步工具和资源

### 自定义工具包装器

```python
from service.mcp_integration_service import mcp_integration_service

# 自定义工具调用包装器
async def custom_tool_wrapper(tool_name: str, arguments: dict):
    # 预处理
    processed_args = preprocess_arguments(arguments)
    
    # 调用MCP工具
    response = await mcp_integration_service.call_tool({
        "tool_name": tool_name,
        "arguments": processed_args
    })
    
    # 后处理
    return postprocess_response(response)
```

## 安全考虑

1. **认证和授权**
   - 配置MCP Gateway的认证机制
   - 实现基于角色的访问控制

2. **输入验证**
   - 验证工具调用参数
   - 防止注入攻击

3. **速率限制**
   - 配置工具调用频率限制
   - 防止滥用和DoS攻击

## 性能优化

1. **缓存策略**
   - 缓存工具Schema和元数据
   - 缓存频繁调用的工具结果

2. **连接池管理**
   - 复用HTTP连接
   - 优化数据库连接

3. **异步处理**
   - 使用异步I/O处理工具调用
   - 并发处理多个请求

## 版本兼容性

- NextAgent Lite: >= v1.0.0
- MCP Context Forge: >= v0.6.0
- Python: >= 3.11
- PostgreSQL: >= 13
- FastAPI: >= 0.104.1

## 许可证

本集成遵循以下许可证：
- NextAgent Lite: MIT License
- MCP Context Forge: Apache License 2.0

## 支持和反馈

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目文档
- 技术支持邮箱
