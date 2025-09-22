"""
主API路由器 - 包含所有路由模块
"""
from fastapi import APIRouter, Request
from api.endpoints import (
    qa, papers, conversations, upload, knowledge, storage,
    database, models, config, chunking_config, qa_dataset, enhanced_tasks, queue, redis_queue, auth,
    team_template_api, atlas_integration, knowledge_collection, metadata_template, folder_api, url_crawl_api,
    user_agent_management
)
from api.endpoints.agent_workflows import router as agent_workflows_router
from api.endpoints.agent_tools_run import router as agent_tools_router
from api.endpoints.model_gateway import router as model_gateway_router
# 临时禁用graph端点以避免ArangoDB连接问题
# from api.endpoints import graph

# 统一SSE推送管理器
import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

class UnifiedSSEManager:
    """统一SSE推送管理器 - 替代所有轮询机制"""
    
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
        """推送文档状态更新"""
        message = {
            "type": "document_status_update",
            "document_id": document_id,
            "data": status_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_task_progress(self, session_id: str, task_id: str, progress_data: dict):
        """推送任务进度更新"""
        # 从progress_data中提取document_id和collection_id（如果存在）
        document_id = progress_data.get("document_id")
        collection_id = progress_data.get("collection_id")
        
        message = {
            "type": "task_progress_update",
            "task_id": task_id,
            "document_id": document_id,  # 添加document_id到顶层
            "collection_id": collection_id,  # 添加collection_id到顶层
            "data": progress_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_task_completed(self, session_id: str, task_id: str, result_data: dict = None):
        """推送任务完成消息"""
        # 从result_data中提取document_id和collection_id（如果存在）
        document_id = (result_data or {}).get("document_id")
        collection_id = (result_data or {}).get("collection_id")
        
        message = {
            "type": "task_completed",
            "task_id": task_id,
            "document_id": document_id,  # 添加document_id到顶层
            "collection_id": collection_id,  # 添加collection_id到顶层
            "data": result_data or {},
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_task_failed(self, session_id: str, task_id: str, error_data: dict):
        """推送任务失败消息"""
        # 从error_data中提取document_id和collection_id（如果存在）
        document_id = error_data.get("document_id")
        collection_id = error_data.get("collection_id")
        
        message = {
            "type": "task_failed",
            "task_id": task_id,
            "document_id": document_id,  # 添加document_id到顶层
            "collection_id": collection_id,  # 添加collection_id到顶层
            "data": error_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_task_cancelled(self, session_id: str, task_id: str):
        """推送任务取消消息"""
        message = {
            "type": "task_cancelled",
            "task_id": task_id,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_graph_extraction_progress(self, session_id: str, document_id: str, progress_data: dict):
        """推送知识图谱提取进度"""
        message = {
            "type": "task_progress_update",
            "task_id": document_id,
            "document_id": document_id,
            "data": {
                **progress_data,
                "task_type": "graph_extraction"
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def broadcast_graph_extraction_completed(self, session_id: str, document_id: str, result_data: dict = None):
        """推送知识图谱提取完成"""
        message = {
            "type": "task_completed",
            "task_id": document_id,
            "document_id": document_id,
            "data": {
                **(result_data or {}),
                "task_type": "graph_extraction",
                "document_status": result_data.get("document_status", "graph_extracted") if result_data else "graph_extracted"
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
        
        # 同时发送文档状态更新通知
        await self.broadcast_document_status(session_id, document_id, {
            "status": result_data.get("document_status", "graph_extracted") if result_data else "graph_extracted",
            "updated_at": asyncio.get_event_loop().time(),
            "task_type": "graph_extraction",
            "completed": True
        })
    
    async def broadcast_graph_extraction_failed(self, session_id: str, document_id: str, error_data: dict):
        """推送知识图谱提取失败"""
        message = {
            "type": "task_failed",
            "task_id": document_id,
            "document_id": document_id,
            "data": {
                **error_data,
                "task_type": "graph_extraction"
            },
            "timestamp": asyncio.get_event_loop().time()
        }
        await self._send_to_session(session_id, message)
    
    async def _send_to_session(self, session_id: str, message: dict):
        """向特定会话的所有连接发送消息"""
        message_str = json.dumps(message)
        disconnected_queues = set()
        
        # 如果session_id是"all"，则广播到所有活跃会话
        if session_id == "all":
            logger.info(f"📡 广播SSE消息到所有会话，当前活跃会话数: {len(self.connections)}")
            for active_session_id, queues in self.connections.items():
                logger.info(f"📡 发送到会话: {active_session_id}, 连接数: {len(queues)}")
                for queue in queues.copy():
                    try:
                        await queue.put(message_str)
                    except Exception as e:
                        logger.warning(f"📡 SSE连接发送失败，移除连接: {e}")
                        disconnected_queues.add((active_session_id, queue))
        else:
            # 发送到特定会话
            if session_id not in self.connections:
                logger.warning(f"📡 会话不存在: {session_id}")
                return
            
            for queue in self.connections[session_id].copy():
                try:
                    await queue.put(message_str)
                except Exception as e:
                    logger.warning(f"📡 SSE连接发送失败，移除连接: {e}")
                    disconnected_queues.add((session_id, queue))
        
        # 清理断开的连接
        for session_queue_pair in disconnected_queues:
            if len(session_queue_pair) == 2:
                session, queue = session_queue_pair
                await self.remove_connection(session, queue)
            else:
                # 兼容旧格式
                await self.remove_connection(session_id, session_queue_pair)

# 创建全局SSE管理器实例
unified_sse_manager = UnifiedSSEManager()

# SSE服务导入 - 保持兼容性
from api.websocket.document_status_sse import get_document_status_sse_endpoint

# 尝试导入可能有依赖问题的模块
try:
    from api.endpoints import system
except ImportError as e:
    print(f"Warning: system模块导入失败: {e}")
    system = None

try:
    from api.endpoints import user
except ImportError as e:
    print(f"Warning: user模块导入失败: {e}")
    user = None

try:
    from api.endpoints import stats
except ImportError as e:
    print(f"Warning: stats模块导入失败: {e}")
    stats = None

try:
    from api.endpoints import conversation_config
except ImportError as e:
    print(f"Warning: conversation_config模块导入失败: {e}")
    conversation_config = None

try:
    from api.endpoints import latency_optimization
except ImportError as e:
    print(f"Warning: latency_optimization模块导入失败: {e}")
    latency_optimization = None

api_router = APIRouter()

# SSE端点注册 - 统一实时推送系统
@api_router.get("/sse/document-status/{session_id}", tags=["实时推送"])
async def document_status_sse_endpoint(request: Request, session_id: str):
    """统一SSE端点 - 支持文档状态和任务进度的实时推送"""
    
    async def sse_generator():
        queue = asyncio.Queue()
        
        try:
            # 添加连接到管理器
            await unified_sse_manager.add_connection(session_id, queue)
            
            # 发送初始连接确认
            init_message = json.dumps({
                'type': 'connection_established', 
                'session_id': session_id,
                'capabilities': ['document_status', 'task_progress', 'task_notifications'],
                'unified_sse': True,  # 标识这是统一SSE系统
                'timestamp': asyncio.get_event_loop().time()
            })
            yield f"data: {init_message}\n\n"
            
            # 处理实时消息推送
            heartbeat_task = None
            try:
                # 创建心跳任务
                async def send_heartbeat():
                    while True:
                        await asyncio.sleep(30)
                        heartbeat = json.dumps({
                            "type": "heartbeat",
                            "timestamp": asyncio.get_event_loop().time()
                        })
                        await queue.put(heartbeat)
                
                heartbeat_task = asyncio.create_task(send_heartbeat())
                
                # 处理消息队列
                while True:
                    try:
                        # 等待消息或检查连接状态
                        message = await asyncio.wait_for(queue.get(), timeout=1.0)
                        yield f"data: {message}\n\n"
                    except asyncio.TimeoutError:
                        # 检查客户端是否断开连接
                        if await request.is_disconnected():
                            break
                        continue
                        
            except Exception as e:
                logger.warning(f"📡 SSE连接处理异常: {e}")
            finally:
                if heartbeat_task:
                    heartbeat_task.cancel()
                
        except Exception as e:
            logger.error(f"📡 SSE连接建立失败: {e}")
        finally:
            # 清理连接
            await unified_sse_manager.remove_connection(session_id, queue)
    
    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
            "X-Accel-Buffering": "no"
        }
    )

# 包含所有端点路由器
api_router.include_router(qa.router, prefix="/qa", tags=["问答"])
api_router.include_router(papers.router, prefix="/papers", tags=["论文"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["对话"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上传"])

# 原始知识库路由 - 注释掉以使用拆分版本 (2708行原始代码保留备用)
# api_router.include_router(knowledge.router, prefix="/knowledge", tags=["知识库"])

# 知识库拆分模块集成 - 完整替换原始knowledge.py (97.5%拆分完成，已移除双向量逻辑)
from api.endpoints.knowledge_temp import temp_router
from api.endpoints.knowledge_utils import utils_router
from api.endpoints.knowledge_config import config_router
from api.endpoints.knowledge_documents import documents_router
from api.endpoints.knowledge_search import search_router
from api.endpoints.knowledge_vectorization import vectorization_router
from api.endpoints.knowledge_analytics import analytics_router

# 集成到knowledge路由下，保持API路径一致性
api_router.include_router(temp_router, prefix="/knowledge", tags=["知识库-临时端点"])
api_router.include_router(utils_router, prefix="/knowledge", tags=["知识库-工具功能"])
api_router.include_router(config_router, prefix="/knowledge", tags=["知识库-配置管理"])
api_router.include_router(documents_router, prefix="/knowledge", tags=["知识库-文档管理"])
api_router.include_router(search_router, prefix="/knowledge", tags=["知识库-搜索功能"])
api_router.include_router(vectorization_router, prefix="/knowledge", tags=["知识库-向量化"])
api_router.include_router(analytics_router, prefix="/knowledge", tags=["知识库-统计分析"])

print("✅ 知识库拆分模块完整集成成功 - 已替换原始knowledge.py")
print("📊 拆分统计: 39/40端点 (97.5%)")
print("🧹 双向量逻辑已清理")
print("📁 原始文件保留备用 - 如需回滚请手动操作")
print("⚠️  任何导入错误将直接暴露，便于问题调试")
api_router.include_router(url_crawl_api.router, prefix="", tags=["URL爬取"])
api_router.include_router(agent_tools_router, prefix="", tags=["Agent工具"])
api_router.include_router(model_gateway_router, prefix="/models", tags=["统一模型网关"])
# 临时禁用graph路由以避免ArangoDB连接问题
# api_router.include_router(graph.router, prefix="/graph", tags=["知识图谱"])
api_router.include_router(storage.router, prefix="/storage", tags=["存储服务"])

# 新增的端点路由器
if system:
    api_router.include_router(system.router, prefix="/system", tags=["系统配置"])
if user:
    api_router.include_router(user.router, prefix="/user", tags=["用户管理"])
if stats:
    api_router.include_router(stats.router, prefix="/stats", tags=["统计监控"])
if conversation_config:
    api_router.include_router(conversation_config.router, prefix="/conversation", tags=["对话配置"])
if latency_optimization:
    api_router.include_router(latency_optimization.router, prefix="/latency", tags=["延迟优化"])
api_router.include_router(database.router, prefix="/database", tags=["数据库管理"])
api_router.include_router(models.router, prefix="/models", tags=["模型服务"])
api_router.include_router(config.router, prefix="/config", tags=["配置管理"])
api_router.include_router(config.task_router, prefix="/config", tags=["任务配置"])
api_router.include_router(chunking_config.router, prefix="/knowledge/chunking-configs", tags=["切分配置"])
api_router.include_router(qa_dataset.router, prefix="/qa-dataset", tags=["QA数据集"])
api_router.include_router(enhanced_tasks.router, prefix="", tags=["增强任务管理"])
api_router.include_router(redis_queue.router, prefix="/queue", tags=["文件处理队列"]) 
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(team_template_api.router, prefix="", tags=["团队模板管理"])
api_router.include_router(atlas_integration.router, prefix="", tags=["Atlas集成"])

# 知识库Collection管理API
api_router.include_router(knowledge_collection.router, prefix="/collections", tags=["知识库管理"])
api_router.include_router(metadata_template.router, prefix="/metadata-templates", tags=["元数据模版"])

# 文件夹管理API
api_router.include_router(folder_api.router, prefix="", tags=["文件夹管理"])

# 向量索引管理API
from api.endpoints.vector_index_api import router as vector_index_router
api_router.include_router(vector_index_router, prefix="", tags=["向量索引管理"])

# 导入新的高级Team API路由
from api.endpoints.advanced_qa import router as advanced_qa_router
from api.endpoints.team_api import router as team_api_router

# 导入任务管理器API路由
from api.endpoints.task_manager import router as task_manager_router

# 导入新的Team V2 API路由
try:
    from api.endpoints.team_v2_api import router as team_v2_router
except ImportError as e:
    print(f"Warning: team_v2_api模块导入失败: {e}")
    team_v2_router = None

# 添加新的高级Team API路由
api_router.include_router(advanced_qa_router, prefix="")
api_router.include_router(team_api_router, prefix="", tags=["Team"])
api_router.include_router(task_manager_router, prefix="", tags=["任务管理"])

# 添加Team V2 API路由
if team_v2_router:
    api_router.include_router(team_v2_router, prefix="", tags=["Team V2"])

# 导入真实的Youtu-Agent集成API路由
try:
    from youtu_agent_integration.api import youtu_agent_router
    api_router.include_router(youtu_agent_router, tags=["Youtu-Agent"])
except ImportError as e:
    print(f"Warning: youtu_agent_integration模块导入失败: {e}")
    youtu_agent_router = None

# 导入MCP集成API路由
try:
    from api.endpoints.mcp_integration_api import router as mcp_integration_router
    api_router.include_router(mcp_integration_router, tags=["MCP Integration"])
except ImportError as e:
    print(f"Warning: mcp_integration_api模块导入失败: {e}")
    mcp_integration_router = None

# 导入统一智能体管理API路由
try:
    from api.endpoints.unified_agents import router as unified_agents_router
    api_router.include_router(unified_agents_router, tags=["统一智能体管理"])
except ImportError as e:
    print(f"Warning: unified_agents模块导入失败: {e}")
    unified_agents_router = None

# 导入QA生成API路由（简化版）
try:
    from api.endpoints.qa_generation_simplified import router as qa_generation_router
    api_router.include_router(qa_generation_router, tags=["问答对生成"])
    print("✅ QA生成简化API集成成功")
except ImportError as e:
    print(f"Warning: qa_generation_simplified模块导入失败: {e}")
    qa_generation_router = None

# 导入增强的文档上传API（支持自动QA提取）
try:
    from api.endpoints.enhanced_document_upload import router as enhanced_upload_router
    api_router.include_router(enhanced_upload_router, prefix="/knowledge", tags=["增强文档上传"])
    print("✅ 增强文档上传API集成成功")
except ImportError as e:
    print(f"Warning: enhanced_document_upload模块导入失败: {e}")
    enhanced_upload_router = None

# 导入QA路由管理API
try:
    from api.endpoints.qa_routing import router as qa_routing_router
    api_router.include_router(qa_routing_router, tags=["QA路由"])
    print("✅ QA路由管理API集成成功")
except ImportError as e:
    print(f"Warning: qa_routing模块导入失败: {e}")
    qa_routing_router = None

# 导入QA路由高级管理API（包含四层路由和固定问答对）
try:
    from api.endpoints.qa_routing_advanced import router as qa_routing_advanced_router
    api_router.include_router(qa_routing_advanced_router, tags=["QA路由高级"])
    print("✅ QA路由高级管理API集成成功（四层路由架构）")
except ImportError as e:
    print(f"Warning: qa_routing_advanced模块导入失败: {e}")
    qa_routing_advanced_router = None

# 导入智能体模板API
try:
    from api.endpoints.agent_templates import router as agent_templates_router
    api_router.include_router(agent_templates_router, tags=["智能体模板"])
    print("✅ 智能体模板API集成成功")
except ImportError as e:
    print(f"Warning: agent_templates模块导入失败: {e}")
    agent_templates_router = None

# 导入用户智能体管理API
try:
    api_router.include_router(user_agent_management.router, prefix="/user-agents", tags=["用户智能体管理"])
    print("✅ 用户智能体管理API集成成功")
except Exception as e:
    print(f"Warning: user_agent_management模块导入失败: {e}")

# 导入统一模型网关代理API
try:
    api_router.include_router(model_gateway_router, tags=["统一模型网关"])
    print("✅ 统一模型网关代理API集成成功")
except Exception as e:
    print(f"Warning: model_gateway模块导入失败: {e}")

# 导入工作流API
try:
    api_router.include_router(agent_workflows_router, tags=["工作流"])
    print("✅ 工作流API集成成功")
except Exception as e:
    print(f"Warning: agent_workflows模块导入失败: {e}")

# 导入状态修复API（临时）
try:
    from api.endpoints.fix_status import router as fix_status_router
    api_router.include_router(fix_status_router, prefix="/fix", tags=["状态修复"])
    print("✅ 状态修复API集成成功")
except ImportError as e:
    print(f"Warning: fix_status模块导入失败: {e}")
    fix_status_router = None 
