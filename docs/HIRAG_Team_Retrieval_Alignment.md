# 多智能体检索与单体检索对齐分析（HiRAG 相关）

本文档梳理当前项目中单体与多智能体（Team）检索实现的差异、调度模式、HiRAG 接线情况，并给出对齐建议与落地重点。

## 结论概览

- 单体与多智能体的“检索链路”未完全统一：
  - 单体存在两条路径（工作流/工具与智能检索），部分场景使用了统一“检索路由器（Hybrid/HiRAG 自动）”。
  - 多智能体主要走“智能检索（weighted/intelligent）”路径，未通过统一路由器，默认不触发 HiRAG。
- 多智能体的“资源挂载”（知识库、路由模板）未被运行期消费，检索调用未注入 `collection_id`、`retrieval_template_id` 等关键配置。
- 执行/调度模型并存：
  - 单体工作流使用 `WorkflowEngine`（SSE/检查点）。
  - 多智能体使用 `TeamTaskManager + Enhanced/AdvancedTeamService` 独立调度（亦有 SSE/监控）。
  - 两套调度功能不冲突，但检索层参数传递未打通。
- HiRAG 已与“统一路由器”接线，但未进入多智能体主路径。要让 Team 也按集合选择 Hybrid/HiRAG，需走统一路由器或在工具层追加接线。

---

## 单体检索实现（后端）

1) 统一检索路由器（支持 Hybrid/HiRAG 自动/强制）
- 代码：`lite-backend/service/retrieval_router_service.py`
- API：`lite-backend/api/endpoints/retrieval_router.py`
- 行为：读取集合配置 `knowledge_collections.config.retrieval.mode ∈ {hybrid, hirag}`；HiRAG 就绪不足时可回退 Hybrid（可配置）。

2) 多层检索服务（固定QA → QA数据集 → 知识库 → Agent）
- 代码：`lite-backend/service/multilayer_retrieval_service.py`
- 在“知识库层”调用 `routed_retrieval(...)`，因此该层会按集合配置在 Hybrid/HiRAG 之间自动路由。

3) 工作流取检索（“工作室/工作流”）
- 代码：`lite-backend/service/workflows/tool_orchestration.py`
- `step_retrieve` 直接调用 `hybrid_search_service.hybrid_search`（未走统一路由器 → 不会触发 HiRAG）。

4) 智能检索与权重检索（兼容 QA 与文档）
- 智能检索：`lite-backend/service/intelligent_retrieval_service.py`
- 权重检索：`lite-backend/service/weighted_retrieval_service.py`（直接联 ES，内部关键词+通用向量+领域向量加权）
- 注：此路径不使用 `retrieval_router_service` → 不会按集合配置自动切换 Hybrid/HiRAG。

---

## 多智能体（Team）检索实现

1) 高级 Team 服务（Agno Team）
- 代码：`lite-backend/service/advanced_agent_team_service.py`
- 多语言检索工具 `MultilingualRetrievalTools` 调用 `intelligent_retrieval_service → weighted_retrieval_service`。
- 未使用 `retrieval_router_service`；未读取前端“每成员资源挂载”的 `collection_id`/`retrieval_template_id`。

2) 增强 Team 服务（包装流式与监控）
- 代码：`lite-backend/service/enhanced_team_service.py`
- 调用 `advanced_agent_team_service.advanced_team_query(...)` 执行，不经 Workflow 引擎。

3) Team 调度与监控
- 代码：`lite-backend/core/team_task_manager.py`
- 独立的任务管理（取消/超时/进度）；未复用 `service/workflows` 内 `WorkflowEngine`。

4) 资源挂载接线缺口
- 前端已在创建时保存 `custom_config.team.members[].resources = { knowledge_collection: { collection_id, retrieval_template_id }, retrieval_mode }`（Team Studio）。
- 后端当前未见对这些字段的读取与应用：
  - 未将 `collection_id` 注入检索工具（类变量或上下文）。
  - 未按 `retrieval_template_id` 应用路由模板（单体 BasicSettingsSection 会触发模板应用/编辑）。

---

## HiRAG 集成现状

- HiRAG 工具：`lite-backend/service/hirag_agno_integration.py`（使用全局模型网关，延迟解析默认模型）。
- 统一路由器在 `mode=hirag` 且集合就绪时，调用 `HiRAGTools` 执行层次检索：`lite-backend/service/retrieval_router_service.py`。
- 多智能体路径未使用该路由器，因此默认不走 HiRAG。

---

## 执行/调度模型对比

- 单体工作流：`WorkflowEngine`（SSE 事件、检查点、可取消），步骤：`prepare → plan → retrieve → execute`。
- 多智能体：`TeamTaskManager + Enhanced/AdvancedTeamService`（SSE/监控、可取消），不复用 `WorkflowEngine`。
- 两套调度并存且健壮，但“检索参数模型/资源透传”的一致性需要加强。

---

## 主要差距/问题

1) 多智能体检索未“按集合检索模式（Hybrid/HiRAG）自动路由” → 未与单体的“统一检索路由器”对齐。
2) 多智能体未消费“资源挂载”的 `collection_id` 与 `retrieval_template_id`（路由模板）：
   - 未设置到检索工具/调用上下文；`intelligent/weighted` 虽接受 `filters`，但未注入集合限定。
   - 模板（Template）应用逻辑缺失（单体侧可 `getKBTemplates/applyTemplateById`）。
3) 工作流与 Team 的检索参数语义不统一：
   - Workflow 的 `metadata_filters/cross_collections` 能透传；Team 端未统一承接。
4) HiRAG 未纳入 Team 主路径（Team 切换 HiRAG 不生效）。

---

## 对齐建议（实现方向）

1) 统一检索入口（优先级 P0）
- 在 Team 检索工具中优先调用 `service/retrieval_router_service.routed_retrieval`：
  - 传入 `collection_id`、`mode=auto`，由集合配置与就绪态决定 Hybrid/HiRAG。
  - 需要时追加 `filters`（承接前端 metadata 过滤、跨库列表）。

2) 资源挂载落地（P0）
- 在创建团队实例或执行前，解析 `custom_config.team.members[].resources`：
  - 对 `knowledge_retrieval_agent` 注入 `collection_id`（类变量或上下文）。
  - 若选择了 `retrieval_template_id`，在执行前“应用模板”或将模板 ID 透传到路由器侧由其消费（需后端扩展）。

3) HiRAG 接线（P0）
- 通过统一路由器（auto）即可继承 Hybrid/HiRAG 切换，不需在 Team 内直接依赖 HiRAGTools。

4) 参数语义统一（P1）
- 将 Workflow 的 `metadata_filters`、`cross_collections`、`sim_threshold` 等语义映射到 Team 的执行参数，并由检索入口统一承接。

5) 结果结构统一（P1）
- 让 Team 的检索分支返回与 `routed_retrieval.items` 同构的结果结构，以复用前端展示与评估逻辑。

6) 路由模板（P1）
- 单体 BasicSettingsSection 的模板选择/应用逻辑可复用到 Team：
  - 选择模板（仅选择模板，不在 Team Studio 中直接改路径明细）。
  - 执行前应用模板（或后端在 `routed_retrieval` 内根据 `retrieval_template_id` 路由）。

---

## 参考代码定位

- 统一检索路由器：`lite-backend/service/retrieval_router_service.py`
- 多层检索（知识库层走路由器）：`lite-backend/service/multilayer_retrieval_service.py`
- 工作流检索步（直连 Hybrid）：`lite-backend/service/workflows/tool_orchestration.py`
- 智能/权重检索：
  - `lite-backend/service/intelligent_retrieval_service.py`
  - `lite-backend/service/weighted_retrieval_service.py`
- Team 服务与工具：
  - `lite-backend/service/advanced_agent_team_service.py`
  - `lite-backend/service/enhanced_team_service.py`
  - `lite-backend/core/team_task_manager.py`
- HiRAG 集成：`lite-backend/service/hirag_agno_integration.py`

---

## 后续最小变更面（供实现时参考）

- 在 Team 检索工具中添加经由 `routed_retrieval` 的分支（优先级最高，不影响现有智能/权重检索路径）。
- 在 Team 实例创建/执行入口读取 `custom_config.team.members[].resources`：
  - 注入 `collection_id` 到检索上下文；
  - 有 `retrieval_template_id` 则在执行前触发模板应用（或透传给路由器）。
- 将 Workflow 的过滤/跨库参数语义对齐到 Team 调用（选做）。

> 注：本文件仅为分析与建议，不包含代码改动。

