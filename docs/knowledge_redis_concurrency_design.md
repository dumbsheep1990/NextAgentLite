# 知识库处理链路的 Redis 并发控制与中间态设计

本文梳理当前知识库的上传→解析→切分→向量化处理链路，给出可落地的 Redis 并发控制与中间态维持方案，优先保障“去重/独占、任务进度可恢复、跨进程/SSE可达”。

## 现状概览（简要）
- 前端：上传→后端建库→入队（simple_queue + EnhancedTaskManager）→解析/切分/向量化→ES写入。
- 实时推送：统一 SSE（unified_sse_manager），依赖 session_id；错误时可能出现“会话不存在”。
- 状态持久化：任务主状态在数据库；SSE为实时通道，连接丢失后恢复能力有限。

## Redis 能发挥价值的关键点
1) 并发控制/去重
   - 上传去重：同一内容（content_hash）在窗口期内只处理一次。
   - 文档处理独占：每个 document_id 同时仅允许一个处理任务。
   - 集合级节流：同一 collection 的重向量化操作限频。
2) 任务中间态快照（用于前端断线恢复、快速查询）
   - 任务进度、阶段、状态、最近更新时间。
   - 会话→任务集合映射，便于“我的任务”快速恢复。
   - 任务取消/暂停标志，执行中周期检查。
3) 实时推送桥接（多实例/多进程）
   - 用 Redis Pub/Sub 或 Streams 做 SSE 消息中转：生产者只负责 publish，SSE 网关实例负责订阅并下发到 EventSource。
4) 上游/模型清单缓存（小优化）
   - 9050 /v1/models/enabled 的清单/默认缓存短 TTL，降低上游压力。

## 推荐 Key 结构（示例）
- 锁/去重/节流
  - `knowledge:lock:upload:{content_hash}` → string/SET（TTL=10m）
  - `knowledge:lock:doc:{document_id}` → string/SET（TTL=10m，可续期）
  - `knowledge:throttle:revectorize:{collection_id}` → string/SET（TTL=300s）
- 任务快照与会话映射
  - `knowledge:task:{task_id}` → HASH
    - fields：`status`, `progress`, `stage`, `detail`, `document_id`, `collection_id`, `updated_at`
  - `knowledge:session:{session_id}:tasks` → SET（session 下的 task_id 集合）
  - `knowledge:task:cancelled` → SET（或 `knowledge:task:{task_id}:cancel` 标志）
- Pub/Sub 通道（建议）
  - `knowledge:sse:session:{session_id}` → 单会话通道
  - `knowledge:sse:all` → 广播通道（回退）
  - 消息体统一：`{ type, task_id, document_id, collection_id, data{ status, progress, stage, ... } }`
- 去重与幂等
  - `knowledge:dedupe:content:{hash}` → document_id（TTL=24h）
  - `knowledge:idempotency:{id}` → 状态（TTL=24h）
- 结果缓存（可选）
  - `knowledge:doc:vector:status:{document_id}` → pending/vectorized/failed（TTL=1h）

## 与现有代码的对接点
- EnhancedTaskManager
  - 在 `_push_sse_progress` / `send_sse_update`：
    - 写入 `knowledge:task:{task_id}` 快照；
    - 发布 Pub/Sub 消息；
    - 检查 `knowledge:task:cancelled`，决定提前终止；
    - 现已加“会话缺失→广播 all”的兜底逻辑，建议补 Pub/Sub 实现跨进程。
- simple_queue（任务入队）
  - 新建任务：把 task_id 加到 `knowledge:session:{session_id}:tasks`。
  - 状态变更：更新任务 HASH 并发布状态消息。
- 上传/切分/向量化入口
  - 上传前先 `SETNX knowledge:lock:upload:{content_hash}`，失败即返回“任务进行中”。
  - 处理前先 `SETNX knowledge:lock:doc:{document_id}`，失败直接退出（或排队重试）。
  - 重向量化入口检查 `throttle:revectorize:{collection_id}`，超频则提示稍后再试。
- SSE 网关（unified_sse_manager）
  - 新增 Redis 订阅协程：订阅 `knowledge:sse:*` 并路由到对应会话连接。
  - 保留本地 `connections` 作为消费端。

## 并发控制策略细化
- 上传去重：content_hash 优先；无 hash 时降级 filename+filesize；用 10 分钟窗口锁定。
- 文档独占：`lock:doc:{document_id}` 带 TTL + 续期，保障长任务不被中断。
- 可取消性：任务线程/协程定期检查 `task:cancelled` 标志，及时退出。
- 幂等：前端可提供 `idempotency_key`，后端查询 `knowledge:idempotency:{key}`，已处理则返回快照。

## 迭代落地顺序（低风险）
1) 快照 + 锁（必须）：任务 HASH、上传/处理锁、重向量化节流，先不改队列。
2) Pub/Sub（增强）：任务生产者 publish，SSE 订阅转发，支持多实例/跨进程。
3) 队列升级（择机）：考虑 Redis Streams（消费者组/ack/重放/死信），或 DB + Redis 混合。
4) 缓存与降级：9050 模型清单/默认短缓存；网关异常时快速失败 + 明确日志。

## 风险与注意
- Redis 稳定性：生产推荐 Cluster 或主从 + Sentinel，开启持久化（AOF/RDB）与监控。
- 锁TTL：过短导致锁丢失，过长影响吞吐。对长任务需做心跳续期或使用 Redlock。
- 一致性：以 Postgres 为“真相”，Redis 用于协调与加速；前端断线通过“任务快照 + 重连订阅”恢复视图。
- 权限：SSE 的 session 与任务需权限校验，避免跨用户订阅。

## 下一步（建议）
- 在 EnhancedTaskManager 接入 Redis 客户端（配置/连接池），实现任务快照写入与 Pub/Sub 发布；
- 在 SSE 管理器增加订阅线程，路由 `knowledge:sse:session:{id}` 与 `knowledge:sse:all`；
- 在上传/重向量化入口补充分布式锁与节流；
- 增加“任务列表”拉取端点：优先读 Redis 快照，缺失时回 DB；
- 撰写简易的“故障/降级”说明（例如：Redis不可用时的回退策略）。

—— 本文为落地级设计草案，可按上述“迭代落地顺序”逐步推进，过程中保持与现有 DB 队列与 SSE 机制兼容，降低引入风险。
