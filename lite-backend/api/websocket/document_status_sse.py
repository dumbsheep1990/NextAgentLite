"""
统一实时推送服务 (Server-Sent Events)
支持文档状态和任务进度的实时推送，替代所有轮询机制
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import Request
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

class UnifiedSSEService:
    """统一SSE推送管理器 - 支持文档状态和任务消息"""
    
    def __init__(self):
        # 存储活跃的SSE连接：{session_id: set(connection_queues)}
        self.connections: Dict[str, Set[asyncio.Queue]] = {}
        
    async def add_connection(self, session_id: str, queue: asyncio.Queue):
        """添加新的SSE连接"""
        if session_id not in self.connections:
            self.connections[session_id] = set()
        self.connections[session_id].add(queue)
        logger.info(f"📡 新增SSE连接，会话ID: {session_id}, 当前连接数: {len(self.connections[session_id])}")
        
    async def remove_connection(self, session_id: str, queue: asyncio.Queue):
        """移除SSE连接"""
        if session_id in self.connections:
            self.connections[session_id].discard(queue)
            if not self.connections[session_id]:
                del self.connections[session_id]
        logger.info(f"📡 移除SSE连接，会话ID: {session_id}")

    async def broadcast_document_status(self, session_id: str, document_id: str, status_data: dict):
        """向指定会话推送文档状态更新"""
        message = {
            "type": "document_status_update",
            "document_id": document_id,
            "data": status_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
        
    async def broadcast_task_progress(self, session_id: str, task_id: str, progress_data: dict):
        """向指定会话推送任务进度更新"""
        message = {
            "type": "task_progress_update",
            "task_id": task_id,
            "data": {
                "task_id": task_id,
                "progress": progress_data.get("progress", 0),
                "stage": progress_data.get("stage", ""),
                "detail": progress_data.get("detail", ""),
                "status": progress_data.get("status", "running")
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
        
    async def broadcast_task_completed(self, session_id: str, task_id: str, result_data: dict):
        """向指定会话推送任务完成消息"""
        message = {
            "type": "task_completed",
            "task_id": task_id,
            "data": {
                "task_id": task_id,
                "progress": 100,
                "stage": "完成",
                "detail": result_data.get("detail", "任务执行完成"),
                "status": "completed",
                "result": result_data
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
        
    async def broadcast_task_failed(self, session_id: str, task_id: str, error_data: dict):
        """向指定会话推送任务失败消息"""
        message = {
            "type": "task_failed",
            "task_id": task_id,
            "data": {
                "task_id": task_id,
                "progress": error_data.get("progress", 0),
                "stage": "失败",
                "detail": error_data.get("detail", "任务执行失败"),
                "status": "failed",
                "error_message": error_data.get("error_message", "未知错误")
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
        
    async def broadcast_task_cancelled(self, session_id: str, task_id: str):
        """向指定会话推送任务取消消息"""
        message = {
            "type": "task_cancelled",
            "task_id": task_id,
            "data": {
                "task_id": task_id,
                "progress": 0,
                "stage": "已取消",
                "detail": "任务已被取消",
                "status": "cancelled"
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)

    async def _send_to_session(self, session_id: str, message: dict):
        """向指定会话发送消息"""
        if session_id not in self.connections:
            logger.debug(f"📡 会话 {session_id} 没有活跃连接，跳过推送")
            return
            
        # 向该会话的所有连接发送消息
        disconnected_queues = set()
        for queue in self.connections[session_id].copy():
            try:
                await queue.put(json.dumps(message))
                logger.debug(f"📡 推送消息成功: {message['type']} -> 会话 {session_id}")
            except Exception as e:
                logger.warning(f"📡 推送消息失败，标记连接为断开: {e}")
                disconnected_queues.add(queue)
        
        # 清理断开的连接
        for queue in disconnected_queues:
            await self.remove_connection(session_id, queue)
            
    async def broadcast_to_all_sessions(self, message_type: str, data: dict):
        """向所有会话广播消息（用于系统级通知）"""
        message = {
            "type": message_type,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        for session_id in list(self.connections.keys()):
            await self._send_to_session(session_id, message)
            
    async def broadcast_task_progress_to_all(self, task_id: str, document_id: str, progress_data: dict, collection_id: str = None):
        """向所有会话推送任务进度更新（用于文档处理等全局任务）"""
        message = {
            "type": "task_progress_update",
            "task_id": task_id,
            "document_id": document_id,
            "collection_id": collection_id,  # 添加知识库ID用于前端过滤
            "data": progress_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        for session_id in list(self.connections.keys()):
            await self._send_to_session(session_id, message)
            
    async def broadcast_task_completed_to_all(self, task_id: str, document_id: str, result_data: dict, collection_id: str = None):
        """向所有会话推送任务完成消息（用于文档处理等全局任务）"""
        message = {
            "type": "task_completed",
            "task_id": task_id,
            "document_id": document_id,
            "collection_id": collection_id,  # 添加知识库ID用于前端过滤
            "data": result_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        for session_id in list(self.connections.keys()):
            await self._send_to_session(session_id, message)
            
    async def broadcast_task_failed_to_all(self, task_id: str, document_id: str, error_data: dict, collection_id: str = None):
        """向所有会话推送任务失败消息（用于文档处理等全局任务）"""
        message = {
            "type": "task_failed", 
            "task_id": task_id,
            "document_id": document_id,
            "collection_id": collection_id,  # 添加知识库ID用于前端过滤
            "data": error_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        for session_id in list(self.connections.keys()):
            await self._send_to_session(session_id, message)

# 全局统一SSE管理器实例
unified_sse = UnifiedSSEService()

# 保持原有接口兼容性
document_sse = unified_sse

async def create_sse_stream(request: Request, session_id: str):
    """创建SSE数据流 - 支持所有类型的实时消息"""
    print(f"🔥🔥🔥 DEBUG: create_sse_stream被调用，session_id: {session_id}")
    logger.info(f"🔥🔥🔥 DEBUG: create_sse_stream被调用，session_id: {session_id}")
    
    queue = asyncio.Queue()
    
    try:
        # 添加连接
        await unified_sse.add_connection(session_id, queue)
        
        # 发送初始连接确认
        init_message = json.dumps({
            'type': 'connection_established', 
            'session_id': session_id,
            'capabilities': ['document_status', 'task_progress', 'task_notifications'],
            'test_field': 'THIS_IS_A_TEST_12345',  # 测试字段
            'timestamp': asyncio.get_event_loop().time()
        })
        
        # 调试日志
        logger.info(f"📡 发送初始连接确认消息: {init_message}")
        
        yield f"data: {init_message}\n\n"
        
        logger.info(f"📡 统一SSE连接已建立: {session_id}")
        
        # 持续监听队列中的消息
        while True:
            try:
                # 等待消息，设置较长的超时来减少心跳频率
                message = await asyncio.wait_for(queue.get(), timeout=90.0)
                yield f"data: {message}\n\n"
            except asyncio.TimeoutError:
                # 发送心跳包
                heartbeat = json.dumps({
                    "type": "heartbeat",
                    "timestamp": asyncio.get_event_loop().time()
                })
                yield f"data: {heartbeat}\n\n"
            except Exception as e:
                logger.info(f"📡 SSE连接异常: {session_id}, 错误: {e}")
                break
                
    except Exception as e:
        logger.error(f"📡 SSE流异常: {e}")
    finally:
        # 清理连接
        await unified_sse.remove_connection(session_id, queue)
        logger.info(f"📡 统一SSE连接已关闭: {session_id}")

def get_document_status_sse_endpoint():
    """获取统一SSE端点"""
    async def unified_sse_endpoint(request: Request, session_id: str):
        """统一SSE端点 - 支持文档状态和任务进度"""
        logger.info(f"📡 接收统一SSE连接请求: {session_id}")
        
        return StreamingResponse(
            create_sse_stream(request, session_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
                "X-Accel-Buffering": "no"  # 禁用Nginx缓冲
            }
        )
    
    return unified_sse_endpoint 