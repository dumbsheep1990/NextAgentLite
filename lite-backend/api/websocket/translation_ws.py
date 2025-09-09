"""
WebSocket 实时翻译服务
提供实时翻译预览功能，支持输入过程中的动态翻译
"""
import asyncio
import json
import time
from typing import Dict, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter

from core.logger import logger
from service.translation_service import translation_service, TranslationDirection
from service.translation_context import TranslationContext

router = APIRouter()

class TranslationWebSocketManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.translation_tasks: Dict[str, asyncio.Task] = {}
        self.debounce_delay = 0.8  # 防抖延迟时间（秒）
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """接受WebSocket连接"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"翻译WebSocket连接建立: {client_id}")
        
        # 发送连接确认
        await self.send_message(client_id, {
            "type": "connection_confirmed",
            "client_id": client_id,
            "timestamp": time.time()
        })
    
    def disconnect(self, client_id: str):
        """断开连接"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        # 取消正在进行的翻译任务
        if client_id in self.translation_tasks:
            self.translation_tasks[client_id].cancel()
            del self.translation_tasks[client_id]
        
        logger.info(f"翻译WebSocket连接断开: {client_id}")
    
    async def send_message(self, client_id: str, message: Dict[str, Any]):
        """发送消息到客户端"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"发送WebSocket消息失败: {client_id}, 错误: {e}")
                self.disconnect(client_id)
    
    async def broadcast_message(self, message: Dict[str, Any]):
        """广播消息到所有客户端"""
        for client_id in list(self.active_connections.keys()):
            await self.send_message(client_id, message)
    
    async def handle_translation_request(self, client_id: str, data: Dict[str, Any]):
        """处理翻译请求"""
        try:
            text = data.get('text', '').strip()
            model = data.get('model')
            enable_translation = data.get('enable_translation', True)
            
            # 检查是否需要翻译
            if not enable_translation or not text:
                await self.send_message(client_id, {
                    "type": "translation_result",
                    "text": text,
                    "translated_text": "",
                    "show_translation": False,
                    "timestamp": time.time()
                })
                return
            
            # 检测语言
            detected_lang = translation_service.detect_language(text)
            
            # 只有中文才翻译
            if detected_lang != 'zh':
                await self.send_message(client_id, {
                    "type": "translation_result",
                    "text": text,
                    "translated_text": "",
                    "show_translation": False,
                    "detected_language": detected_lang,
                    "timestamp": time.time()
                })
                return
            
            # 取消之前的翻译任务
            if client_id in self.translation_tasks:
                self.translation_tasks[client_id].cancel()
            
            # 创建新的翻译任务
            self.translation_tasks[client_id] = asyncio.create_task(
                self._perform_translation(client_id, text, model)
            )
            
            # 发送翻译开始状态
            await self.send_message(client_id, {
                "type": "translation_status",
                "status": "translating",
                "text": text,
                "timestamp": time.time()
            })
            
        except Exception as e:
            logger.error(f"处理翻译请求失败: {e}")
            await self.send_message(client_id, {
                "type": "translation_error",
                "error": str(e),
                "timestamp": time.time()
            })
    
    async def _perform_translation(self, client_id: str, text: str, model: Optional[str] = None):
        """执行翻译"""
        try:
            # 等待防抖延迟
            await asyncio.sleep(self.debounce_delay)
            
            # 检查连接是否还存在
            if client_id not in self.active_connections:
                return
            
            # 执行翻译（不使用WebSocket传入的model参数，让翻译服务使用环境变量配置）
            translation_result = await translation_service.translate(
                text=text,
                direction=TranslationDirection.ZH_TO_EN,
                use_cache=True
            )
            
            # 发送翻译结果
            await self.send_message(client_id, {
                "type": "translation_result",
                "text": text,
                "translated_text": translation_result.translated_text,
                "show_translation": True,
                "source_language": translation_result.source_language,
                "target_language": translation_result.target_language,
                "confidence": translation_result.confidence,
                "processing_time": translation_result.processing_time,
                "model_used": translation_result.model_used,
                "timestamp": time.time()
            })
            
        except asyncio.CancelledError:
            logger.debug(f"翻译任务被取消: {client_id}")
        except Exception as e:
            logger.error(f"翻译执行失败: {e}")
            await self.send_message(client_id, {
                "type": "translation_error",
                "error": str(e),
                "text": text,
                "timestamp": time.time()
            })
        finally:
            # 清理任务
            if client_id in self.translation_tasks:
                del self.translation_tasks[client_id]


# 全局管理器实例
translation_ws_manager = TranslationWebSocketManager()


@router.websocket("/ws/translation/{client_id}")
async def translation_websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket翻译端点"""
    await translation_ws_manager.connect(websocket, client_id)
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 处理不同类型的消息
            message_type = message.get('type')
            
            if message_type == 'translation_request':
                await translation_ws_manager.handle_translation_request(client_id, message)
            elif message_type == 'ping':
                await translation_ws_manager.send_message(client_id, {
                    "type": "pong",
                    "timestamp": time.time()
                })
            else:
                logger.warning(f"未知的WebSocket消息类型: {message_type}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket客户端断开连接: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket处理异常: {e}")
    finally:
        translation_ws_manager.disconnect(client_id)


# 工具函数：获取WebSocket管理器状态
@router.get("/ws/translation/status")
async def get_translation_ws_status():
    """获取WebSocket翻译服务状态"""
    return {
        "active_connections": len(translation_ws_manager.active_connections),
        "active_tasks": len(translation_ws_manager.translation_tasks),
        "debounce_delay": translation_ws_manager.debounce_delay
    }


# 工具函数：广播消息到所有客户端
@router.post("/ws/translation/broadcast")
async def broadcast_translation_message(message: Dict[str, Any]):
    """广播消息到所有翻译WebSocket客户端"""
    await translation_ws_manager.broadcast_message(message)
    return {"success": True, "clients_count": len(translation_ws_manager.active_connections)}