# Team 检索参数契约（多智能体）

本文定义团队（多智能体）检索在运行期所需的关键参数与推荐调用方式，确保与知识库检索模式（Hybrid/HiRAG）对齐。

## 1. 请求中携带的资源（resources）

- 字段：`resources.knowledge_collection`
- 结构：
{
  "resources": {
    "knowledge_collection": {
      "collection_id": "<KB UUID>",
      "retrieval_template_id": "<Template UUID>" // 可选
    }
  }
}
- 含义：
  - `collection_id`：绑定当前检索的知识库；若提供，Team 检索走“统一检索路由”，按集合配置自动 Hybrid/HiRAG。
  - `retrieval_template_id`：可选；若提供，检索前先“应用该模板”（幂等），以便按模板定义的有序路径集执行。

## 2. 支持的 API 入口

- Team（旧版）
  - POST `/api/v1/team/query`（同步/流式）
  - body 支持 `resources` 字段；服务端透传并在执行前绑定至检索工具。

- Team V2（新系统）
  - POST `/api/v1/team-v2/query`（同步/流式）
  - body 支持 `resources` 字段；同样透传并绑定。

示例：
{
  "team_name": "general_qa_team_v2",
  "query": "什么是地聚物？",
  "session_id": "session_abc",
  "stream": true,
  "resources": {
    "knowledge_collection": {
      "collection_id": "d8fc64d5-22d5-46d3-8843-e0e7aeb6b2b3",
      "retrieval_template_id": "2b7c4a1e-..."
    }
  }
}

## 3. 统一检索路由行为说明

- 服务端逻辑（Multi-Agent）：
  1. 若绑定了 `collection_id`：
     - 尝试 `apply_template(template_id)`（幂等，失败不阻断）。
     - 调用 `routed_retrieval(query, collection_id, mode='auto')`，按集合配置与就绪态自动选择 Hybrid/HiRAG。
  2. 若未绑定 `collection_id`：
     - 回退到多语言智能/权重检索（保持可用）。

- 单体检索不受影响（保留原有实现）。

## 4. 查询活跃模板与路径

- 获取知识库当前“活跃模板”推测与当前路径：
  - GET `/api/v1/qa-routing/knowledge-base/{kb_id}/active-template`
  - 返回：
    - `template`：与现有 `retrieval_path_configs` 最匹配的模板（按路径序列比对），否则返回默认模板
    - `current_paths`：当前生效的路径配置摘要

## 5. 备注

- 模板应用是幂等操作，适合在每次会话或执行前调用，以确保路径一致。
- 若需要“只读验证”而不想改变路径，可仅调用 `active-template` 接口查看当前状态。
