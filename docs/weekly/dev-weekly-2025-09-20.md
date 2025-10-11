# 开发周报（2025-09-14 ~ 2025-09-20）

> 项目：NextAgentLite（Agno 智能体开发平台）
> 作者：NextAgent 协作代理（本周集成/重构为主）

## 一、概览

本周围绕「Unla 网关 + 统一模型网关（9050）+ MCP 工具运行时 + 前后端集成」展开集中改造，目标为：

- 前端（lite-qa）在“模型与工具”与“工具管理”中直接嵌入/使用 Unla Web；
- 后端引入独立的 llm-config-gateway（端口 9050），统一模型配置/默认模型/启用模型清单，并提供 OpenAI 兼容代理；
- 在 9050 内置 MCP 共享运行时（基于 mcp-go），支持 stdio 类 MCP 工具启动、列工具、调用；
- Unla 侧新增 Embedding 与 Rerank 模型配置（DB + API + Web），并去除顶部栏，适配内嵌场景；
- 主后端适配 Agno 2.0.2，支持通过 9050 统一调用模型，并将 MCP/API 工具动态注册为 Agno 工具；
- 增强调试可观测性：工具页面快速测试、Agent 工具导入测试的日志与诊断、Swagger/OpenAPI 等。

## 二、主要成果

### 1) 统一模型网关（9050）

- 路由与能力
  - OpenAI 兼容：`POST /v1/chat/completions`、`POST /v1/embeddings`
  - 默认与启用：`GET /v1/defaults`、`GET /v1/defaults/simple`、`GET /v1/models/enabled`
  - 配置导入：`POST /admin/import-chat-config`（批量导入 provider+models+默认）
  - OpenAPI/Swagger：`/openapi.yaml`、`/openapi.json`、`/docs`

- MCP 共享运行时（基于 mcp-go）
  - 启动：`POST /mcp/servers/:name/start`
  - 列工具：`GET /mcp/servers/:name/tools`
  - 调用：`POST /mcp/servers/:name/tools/:tool/call`
  - 注册表：`GET /mcp/registry`（GORM 表：`mcp_instances` 自动迁移）

- API-Tools（HTTP API 统一发现与调用）
  - 同步：`POST /admin/sync-api-from-unla-db`
  - 清单：`GET /api-tools/configs`、`GET /api-tools/configs/:name/tools`
  - 调用：`POST /api-tools/configs/:name/tools/:tool/call`

### 2) Unla 集成与扩展

- Unla Apiserver：
  - 新增 Embedding 与 Rerank 数据表、仓储与 HTTP 端点（公共、免登录模式用于内嵌配置）
  - 增加 Internal 端点与本地信任头（`X-Internal-Request: 1`）以供 9050/嵌入式同步
  - 去除对 embedded 用户的强依赖，避免 401/空指针

- Unla Web：
  - 嵌入适配：移除顶部栏、侧栏顶部标题；保证在 iframe 下完整展示
  - 向量（Embedding）与重排（Rerank）配置页面：
    - 与对话模型配置保持一致的样式与交互
    - 支持“获取模型→批量入库（默认未启用）→切换启用/默认”
    - 新增“自定义”模型 Modal（含 API Base/Key、维度/Context、测试按钮）
  - 工具导航：新增“工具组”（MCP 工具 / API 工具）并美化

### 3) 主后端（lite-backend）与 Agno 适配

- 统一模型接入：
  - 强制走 9050：将模型基址固定为 `LLM_GATEWAY_URL`（默认 `http://127.0.0.1:9050`），不再读取误设的 `ONE_API_BASE_URL`
  - Agent 启动时覆盖默认模型（从 9050 的 `/v1/defaults`）

- 工具注册中心（service/tools_registry.py）：
  - 从 9050 动态发现 MCP 工具与 API 工具并封装为 Agno 工具函数
  - 支持“组级选择”：`mcp:{server}` / `api:{config}`；运行时 Agent 自行选择子工具
  - 当仅选择了单个 MCP 服务器时，自动注册“简名别名”（如 `browser_navigate`）以便模型按 Action 名称调用

- Agent 工具导入测试接口（/api/v1/agents/tools-test）：
  - 捕获执行日志返回给前端（`debug_logs`）
  - 失败时提供诊断（`gateway_probe`、`tools_debug`、`tool_call_probe`）
  - 新增手写回退执行（`manual_run`）：最小 ReAct 循环 → 解析 `Action/Input` → 直接调用 9050 MCP → 注入 `Observation`，最多 3 轮

- 工具执行策略调整（关键）：
  - 禁用模型的原生结构化输出/工具调用（适配 Qwen3 等不支持 OpenAI tools 的上游）
  - 指令模板增加“本地工具调用规范”（Action / Action Input / Observation / Final Answer）

### 4) 前端（lite-qa）增强

- “工具导入测试”页面（/app/agent/tools-test）：
  - 左侧：MCP 服务器与 API 配置勾选（组级选择）
  - 右侧（MCP）：新增“快速测试 + 自定义参数测试”面板
    - 识别常用动作按钮（open/goto、screenshot、click、type）
    - 自定义 JSON 参数，直接调用 9050 MCP 工具
  - 底部：Agno 创建并执行 + 输出 + “Agno 执行预览”（显示模型ID与日志）
  - 失败时：展示“调试详情” JSON（包含 gateway_probe/tools_debug/tool_call_probe/manual_run）

## 三、问题复盘与修复

- 401/登录：
  - Unla 嵌入模式增加本地放行与内部端点，避免工具页面频繁 401
- 5235 PID 写权限：
  - 网关 PID/日志路径迁移到项目目录，规避 /var/run 权限问题
- Go 1.24 依赖：
  - 设置 `GOTOOLCHAIN=auto`，首次运行自动下载 toolchain
- PG 连接与表前缀：
  - 9050 与 Unla 统一走本地 5434，表前缀 `unla_`；修正多处表名/前缀获取
- 模型“Pro/”前缀：
  - 9050 标准化模型名，消除 `Pro/xxx` 导致的匹配问题
- SiliconFlow 403：
  - 改为后端强制走 9050（由 9050 注入上游 API Key），避免前端/Agent 直连上游产生 401/403

## 四、开发中遇到的设计取舍

- MCP 执行入口：
  - 保留 Unla 5235 作为对外 JSON-RPC/SSE 兼容入口；9050 提供开发态 REST 调用与共享运行时
- 工具调用策略：
  - 统一偏向“本地工具执行”，降低对上游 tools 协议的依赖；保留对 tools 协议的探针用于定位
- 安全：
  - 9050 的管理写接口与 Unla 内部放行仅适合开发态，生产需加白名单/鉴权开关

## 五、如何运行（快速）

- 启动 9050（统一模型网关）
  - `bash lite-backend/scripts/start_llm_gateway.sh -f`
  - 打开 `http://127.0.0.1:9050/docs`

- 启动 Unla（仅 apiserver 必需，Web 可按需）
  - `bash lite-backend/scripts/unla_env.sh && bash lite-backend/scripts/run_unla_apiserver.sh`
  - （可选）Web：`cd lite-backend/Unla/web && pnpm i && pnpm dev`

- 启动主后端
  - `cd lite-backend && python main.py`
  - 确保 `.env.local` 中的 PG/LLM_GATEWAY_URL 配置正确（PG 端口 5434）

- 前端 lite-qa
  - `cd lite-qa && npm i && npm run dev`
  - 打开“智能体 → 工具导入测试”，进行 MCP/API 工具与 Agent 的端到端验证

## 六、待办与建议

- 9050 安全与治理
  - 管理端点鉴权/签名、域名白名单、Header 白名单、超时/重试策略配置化
  - API Key 加密存储

- Unla 鉴权开关化
  - 增加环境变量（如 `APISERVER_AUTH_DISABLE=false`）控制嵌入放行

- 工具封装与别名
  - 多服务器下的工具“简名冲突”策略（优先级/命名空间）
  - MCP 工具参数“扁平透传 vs arguments 包裹”的自适应

- UI 细节
  - Embedding/Rerank 列表密度、滚动区域高度一致性进一步打磨
  - i18n 文案统一（“工具”→“API”等）

- 测试
  - 9050 流式代理（SSE）健壮性（断连/重试）
  - 回退执行（manual_run）与 Agno 调用路径的差异化测试

## 七、风险与已知限制

- 当前回退执行（manual_run）仅作为调试/兜底方案，未对齐全部复杂工具协议
- Unla 的免鉴权与 9050 的管理端点仅适用于本地/开发；生产需收紧
- MCP stdio 依赖宿主 Node/npm/npx 环境，需保证 PATH 正确

## 八、下周计划（建议）

- 将回退执行（manual_run）产品化为可选执行模式（前端勾选）
- 工具封装参数透传策略自适应（自动识别扁平/包裹）
- 9050 安全加固与配置项完善
- 将模型“启用/默认”与前端模型选择联动到 Agent 模板
- 增加 E2E 用例（MCP 浏览器：打开→等待→输入→回车→截图）

---

如需更详细的变更清单（包含具体文件与行号），可在仓库中按以下关键词检索：`llm-config-gateway`、`tools_registry.py`、`agent_tools_test.py`、`llm-embeddings.tsx`、`llm-rerank.tsx`、`MCPToolsPage.tsx`、`APIToolsPage.tsx`。

