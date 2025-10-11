# Redis 增强与接入说明（知识库与SSE）

本说明记录了针对知识库文档处理与统一SSE推送所做的Redis无侵入式增强改造。

## 改造要点

- 任务快照：在分块/向量化等阶段周期写入 `knowledge:task:{task_id}`，TTL默认24h（可配 `REDIS_KNOWLEDGE_TTL`）。
- 会话映射：`knowledge:session:{session_id}:tasks` 记录该会话关联的任务ID，便于会话恢复/查询。
- 任务取消：写入集合 `knowledge:task:cancelled` 与 `knowledge:task:{task_id}:cancel`，被处理方在进度回调/长步骤处检测并中断。
- SSE桥接：所有广播通过 `UnifiedSSEManager` 推送到本地连接的同时，发布到Redis频道（`knowledge:sse:all` 或 `knowledge:sse:session:*`）。
  另一实例通过订阅桥接任务（后端自动启动）将消息分发到本机连接，实现跨实例SSE。

## 环境变量

- `REDIS_URL` 或 `REDIS_KNOWLEDGE_URL`：配置任一即可启用Redis增强能力。
- `REDIS_KNOWLEDGE_TTL`：任务快照与会话映射TTL（秒），默认86400。

示例：

```
REDIS_URL=redis://127.0.0.1:6379/0
REDIS_KNOWLEDGE_TTL=86400
```

## 相关端点（只读快照）

- `GET /api/v1/sse/session/{session_id}/tasks`：返回会话下任务ID及其快照（Redis启用时有效）。
- `GET /api/v1/sse/task/{task_id}/snapshot`：返回单任务快照（Redis启用时有效）。

## 代码关键信息

- `service/redis_support.py`：封装Redis可选能力（快照/取消/锁/节流/发布/查询）。
- `service/enhanced_task_manager.py`：
  - 进度回调在写快照的同时，检查 `is_task_cancelled`，命中则抛出 `CancelledError` 并将任务状态置为 `cancelled`。
  - 取消任务时调用 `mark_task_cancelled`，实现跨实例感知。
- `api/routes.py (UnifiedSSEManager)`：广播时同步调用 `publish_sse`，并在后台启动Redis订阅桥接；SSE连接建立后会尝试推送一遍会话的任务快照，便于前端快速恢复。
- `service/knowledge_service.py`：长步骤调用 `await check_cancellation()`，额外兼容Redis取消标记。

## 行为说明

- 未配置Redis时，上述调用自动降级为 no-op，不影响主流程。
- 启用Redis后：
  - 前端可在断线重连后立即收到会话任务快照，快速恢复进度展示；
  - 取消指令跨进程即时生效；
  - 多实例下SSE推送自动桥接，无需额外运维配置。

## 后续可选优化

- 为任务快照增加分页与筛选端点；
- 在知识库细分阶段（如分块写入、ES索引）增加更细粒度的快照；
- 支持“任务取消”的更多细粒度（仅取消向量化、仅取消ES写入等）。

