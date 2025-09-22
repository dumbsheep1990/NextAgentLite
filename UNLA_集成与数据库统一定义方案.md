# Unla 集成与数据库统一定义方案（实施说明）

## 目标与范围
- 用 Unla（Go 版轻量 MCP 网关）替换原 MCP 网关，实现统一网关地址与后端统一转发控制。
- 保持现有前端“MCP 工具管理”页面设计与调用不变（/api/mcp/... 语义保持），后端适配到 Unla。
- 在“主业务 PostgreSQL 数据库”中补充 Unla 相关的数据结构，用于统一查询、统计与路由管理。
- 执行 DDL 方式：使用你已配置的“管理当前系统数据库”的 MCP 工具直接提交 SQL（非 UI）。

---

## 前端页面逻辑（现状）
- 页面：`/app/tools`（`lite-qa/src/pages/tools/MCPToolsPageSimple.tsx`）。
- 主要数据：
  - 系统状态卡片：网关状态、服务器数、工具数、调用统计、平均耗时。
  - 列表：服务器（id/name/display_name/server_type/health_status/is_enabled）、工具（id/name/display_name/category/usage_count/is_enabled）。
- 对后端接口的依赖（约定不变）：`/api/mcp/status|/api/mcp/servers|/api/mcp/tools|/api/mcp/tools/call`。

---

## 后端适配（已实现）
- 统一网关与代理
  - 反向代理：`/gateway/*` → `UNLA_GATEWAY_URL`（SSE/JSON-RPC 保留）。
  - 文件：`lite-backend/api/endpoints/unla_gateway_proxy.py`（FastAPI Streaming 透传）。
- Unla 管理与同步
  - `lite-backend/service/unla_integration_service.py`：apiserver 登录、OpenAPI 导入、同步触发、镜像入库。
  - `lite-backend/service/unla_client.py`：initialize/list/call/close 封装（经 `/gateway/{prefix}/mcp`）。
- API 端点（对前端保持 /api/mcp/* 语义）：
  - `POST /api/v1/mcp/initialize` → 触发 Unla 同步并刷新本地镜像。
  - `GET /api/v1/mcp/servers` → 基于路由映射聚合返回服务器列表。
  - `GET /api/v1/mcp/tools[?router_prefix=...]` → 从 Unla 拉取工具（指定前缀更精准）。
  - `POST /api/v1/mcp/tools/call` → 支持字段 `router_prefix`，统一转发到 Unla 执行。
  - `POST /api/v1/mcp/unla/sync`、`GET /api/v1/mcp/unla/routers` → 管理与查询路由映射。
- 移除原依赖：`mcp-contextforge-gateway` 已从 `requirements.txt` 删除，后端逻辑改为走 Unla。

环境变量（示例）：
- `UNLA_APISERVER_URL=http://127.0.0.1:5234`
- `UNLA_GATEWAY_URL=http://127.0.0.1:5235`
- `UNLA_SUPER_ADMIN_USERNAME=admin`、`UNLA_SUPER_ADMIN_PASSWORD=admin`
- `UNLA_TENANT_DEFAULT=default`

---

## 数据库统一定义（主库）
为不破坏既有 `mcp_servers/mcp_tools/mcp_tool_calls` 结构，新增一张轻量映射表，用于统一管理 Unla 的“租户/路由前缀/协议/统一端点”。

### 建表与索引（幂等）
建议用 MCP SQL 工具一次性执行：

```sql
-- 两种 UUID 扩展（二者任一即可）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Unla 路由映射表
CREATE TABLE IF NOT EXISTS unla_router_map (
  id              uuid PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
  tenant          VARCHAR(100)  NOT NULL,
  server_name     VARCHAR(200)  NOT NULL,
  router_prefix   VARCHAR(300)  NOT NULL,
  proto_type      VARCHAR(32)   NOT NULL,
  mcp_endpoint    VARCHAR(512)  NOT NULL,
  sse_endpoint    VARCHAR(512)  NOT NULL,
  is_active       BOOLEAN       DEFAULT TRUE,
  version         VARCHAR(50),
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- 约束与索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_unla_router_unique   ON unla_router_map(tenant, router_prefix);
CREATE INDEX IF NOT EXISTS idx_unla_router_server_name     ON unla_router_map(server_name);
CREATE INDEX IF NOT EXISTS idx_unla_router_proto_type      ON unla_router_map(proto_type);
CREATE INDEX IF NOT EXISTS idx_unla_router_active          ON unla_router_map(is_active);

-- 补充既有表的常用索引（如缺失）
CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_servers_name_unique ON mcp_servers(name);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_server_tool_name     ON mcp_tools(server_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_created_at      ON mcp_tool_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_status          ON mcp_tool_calls(call_status);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool_id_time    ON mcp_tool_calls(tool_id, created_at);
```

说明：
- `unla_router_map` 仅作运行时索引，避免对 `mcp_servers` 强依赖；业务层通过 `server_name` 软链接。
- 统计口径保持一致：调用统计/耗时来自 `mcp_tool_calls`；服务器/工具来自 `mcp_servers/mcp_tools`。

---

## 执行 DDL（通过已配置的 MCP 工具）
不走 UI，直接调用你已配置的“数据库管理 MCP 工具”提交上述 SQL 即可。示例调用体：

```json
{
  "tool_name": "<你的SQL工具名，如 sql_admin.execute>",
  "router_prefix": "<你的路由前缀，如 /default/your-api>",
  "arguments": {
    "sql": "<将上面的 SQL 整段粘贴到这里>"
  }
}
```

后端统一转发 `/api/v1/mcp/tools/call` 到 Unla → MCP 工具执行 SQL → 在主库创建/修复表结构与索引。

---

## 发布与验证
1) 启动 Unla：apiserver（5234）、gateway（5235，本机监听）。
2) 确认后端服务环境变量（见上）。
3) 用 MCP 工具执行 DDL，创建 `unla_router_map` 与索引。
4) `POST /api/v1/mcp/initialize` → 触发 Unla 同步 → `GET /api/v1/mcp/unla/routers` 可见路由映射。
5) 前端“工具管理”页面继续调用 `/api/mcp/*`，后端已适配到 Unla。

---

## 已知注意点
- 如需更细粒度的统计（按路由前缀/协议聚合工具与调用），建议后续在同步时把工具与路由关系镜像到本地表中（不会影响现有页面字段）。
- 如果后续需要**全系统统一权限控制**，推荐仅对后端开放 Unla，前端不直连；所有变更由后端在 `/api/v1/mcp/*` 内部裁决与转发。

---

## 变更清单（代码侧）
- 新增：
  - `lite-backend/api/endpoints/unla_gateway_proxy.py`
  - `lite-backend/service/unla_integration_service.py`
  - `lite-backend/service/unla_client.py`
  - `models.UnlaRouterMap`（`lite-backend/models/mcp_models.py`）
- 修改：
  - `lite-backend/api/endpoints/mcp_integration_api.py`（/api/mcp/* 统一走 Unla）
  - `lite-backend/main.py`（挂载 `/gateway/*` 反代）
  - `lite-backend/requirements.txt`（移除 mcp-contextforge 依赖）

---

## 后续工作（可选）
- 修复/优化 `/api/v1/mcp/unla/routers` 的依赖注入问题（已在本次适配中同步修正）。
- 增加 OpenAPI 导入的前端上传面板（调用 `/api/v1/mcp/openapi/import`）。
- 在同步时把工具清单镜像入本地（便于快速搜索与权限绑定）。

***
本文档用于指导 Unla 集成与数据库统一定义的落地实施，若需我直接用 MCP 工具在你的路由前缀下执行上述 DDL，请告知 `router_prefix` 与 `tool_name`。
***
