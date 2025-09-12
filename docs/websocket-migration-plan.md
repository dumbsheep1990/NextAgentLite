# WebSocket 迁移计划

## 背景

当前系统使用 SSE (Server-Sent Events) 进行实时消息推送，存在以下问题：
1. **消息串台风险**：虽然已通过 collection_id 过滤解决，但仍会接收所有消息
2. **服务器负载**：向所有连接广播消息，即使用户不需要
3. **单向通信**：无法实现客户端主动查询或订阅管理

## 迁移目标

将 SSE 机制迁移到 WebSocket，实现：
- 精确的消息路由（基于订阅）
- 双向通信能力
- 更低的服务器负载
- 更好的扩展性

## 技术方案

### 1. 后端架构

```python
# api/websocket/document_ws.py
class DocumentWebSocketManager:
    def __init__(self):
        # 基于 collection 的连接池
        self.collections: Dict[str, Set[WebSocket]] = {}
        # 基于 document 的精确订阅
        self.document_subscribers: Dict[str, Set[WebSocket]] = {}
    
    async def subscribe_collection(self, ws: WebSocket, collection_id: str):
        """订阅知识库的所有更新"""
        pass
    
    async def subscribe_document(self, ws: WebSocket, document_id: str):
        """订阅特定文档的更新"""
        pass
    
    async def broadcast_to_collection(self, collection_id: str, message: dict):
        """只向订阅了该知识库的连接发送"""
        pass
```

### 2. 前端架构

```typescript
// hooks/useDocumentWebSocket.ts
export const useDocumentWebSocket = (collectionId: string) => {
  // WebSocket 连接管理
  // 自动重连机制
  // 心跳保活
  // 消息分发
}
```

### 3. 消息协议

```typescript
// 客户端 -> 服务器
interface ClientMessage {
  type: 'subscribe_collection' | 'subscribe_document' | 'unsubscribe' | 'ping';
  payload: any;
}

// 服务器 -> 客户端
interface ServerMessage {
  type: 'task_progress' | 'task_completed' | 'task_failed' | 'pong';
  collection_id?: string;
  document_id?: string;
  data: any;
}
```

## 迁移步骤

### 第一阶段：并行运行（2天）
1. 实现 WebSocket 管理器
2. 添加 WebSocket 路由端点
3. 同时保持 SSE 和 WebSocket 运行

### 第二阶段：前端适配（2天）
1. 实现 useDocumentWebSocket Hook
2. 添加特性开关控制
3. 逐步迁移各个组件

### 第三阶段：切换验证（1天）
1. 在测试环境完全切换到 WebSocket
2. 性能测试和稳定性验证
3. 监控和日志分析

### 第四阶段：生产部署（1天）
1. 灰度发布
2. 监控关键指标
3. 完全切换

## 关键代码位置

### 需要修改的文件
- `/api/websocket/document_status_sse.py` → 添加 WebSocket 支持
- `/service/enhanced_task_manager.py` → 支持两种推送方式
- `/service/knowledge_service.py` → 支持两种推送方式
- `/lite-qa/src/components/knowledge/DocumentList.tsx` → 切换到 WebSocket
- `/lite-qa/src/services/sseService.ts` → 添加 WebSocket 服务

### 新增文件
- `/api/websocket/document_ws.py` - WebSocket 管理器
- `/lite-qa/src/hooks/useDocumentWebSocket.ts` - 前端 Hook
- `/lite-qa/src/services/websocketService.ts` - WebSocket 服务

## 风险评估

### 技术风险
- **兼容性**：需要确保所有浏览器支持 WebSocket
- **代理配置**：某些反向代理需要特殊配置
- **断线重连**：需要实现可靠的重连机制

### 缓解措施
- 保留 SSE 作为降级方案
- 使用成熟的 WebSocket 库（如 socket.io）
- 充分的测试覆盖

## 性能收益预估

| 指标 | SSE (当前) | WebSocket (预期) | 改善 |
|-----|-----------|-----------------|------|
| 消息延迟 | ~100ms | ~50ms | 50% ↓ |
| 服务器负载 | 高（全量广播） | 低（精确推送） | 70% ↓ |
| 网络流量 | 高 | 低 | 60% ↓ |
| 并发连接数 | 受限 | 更高 | 200% ↑ |

## 实施优先级

**建议**：当前 SSE + collection_id 过滤方案已经能满足基本需求，WebSocket 迁移可作为 **Q2 优化项目**。

### 触发迁移的条件
1. 用户量超过 1000 并发
2. 需要实现实时协作功能
3. 服务器负载成为瓶颈
4. 需要更复杂的订阅管理

## 参考资料

- [FastAPI WebSocket 文档](https://fastapi.tiangolo.com/advanced/websockets/)
- [React useWebSocket Hook](https://github.com/robtaussig/react-use-websocket)
- [Socket.IO 作为备选方案](https://socket.io/)

---

*文档创建日期：2025-01-11*
*预计实施日期：待定*
*负责人：待分配*