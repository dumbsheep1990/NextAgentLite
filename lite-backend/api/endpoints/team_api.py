"""
Team API端点 - 提供Agno Team的查询、监控和管理功能
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
import json
import asyncio
import time
import os
import uuid
import asyncio
from typing import Any

from core.logger import logger
from core.team_task_manager import get_team_task_manager, managed_team_execution, TeamExecutionStatus
from service.enhanced_team_service import enhanced_team_service
from service.langdb_service import LangDBService
from db.repositories.conversation_repository import ConversationRepository
from db.database import get_db
# 临时移除用户认证，改用可选参数
# from api.endpoints.auth import get_current_user  
# from models.user import User

router = APIRouter(prefix="/api/team", tags=["Team"])

# 全局LangDB服务实例
langdb_service = LangDBService()


def safe_json_serializer(obj: Any) -> Any:
    """安全的JSON序列化器，处理复杂对象"""
    try:
        # 处理ReasoningStep和其他agno对象
        obj_type_name = type(obj).__name__
        
        # 特别处理ReasoningStep对象
        if obj_type_name == 'ReasoningStep' or 'ReasoningStep' in obj_type_name:
            if hasattr(obj, 'content'):
                return str(obj.content)
            elif hasattr(obj, 'text'):
                return str(obj.text)
            elif hasattr(obj, 'message'):
                return str(obj.message)
            else:
                return f"[ReasoningStep: {str(obj)}]"
        
        # 处理其他有__dict__属性的对象
        if hasattr(obj, '__dict__'):
            # 如果对象有__dict__属性，尝试将其转换为字典
            if hasattr(obj, 'content'):
                return str(obj.content) if obj.content else str(obj)
            elif hasattr(obj, 'to_dict'):
                return obj.to_dict()
            else:
                # 对于其他复杂对象，只返回其字符串表示
                obj_str = str(obj)
                # 避免返回默认的对象表示（如<class_name object at 0x...>）
                if obj_str.startswith('<') and 'object at' in obj_str:
                    return {"type": obj_type_name, "str": obj_str}
                return obj_str
        else:
            return str(obj)
    except Exception as e:
        logger.warning(f"JSON序列化失败: {e}, object type: {type(obj)}")
        return {"error": f"serialization_failed_{type(obj).__name__}"}


@router.post("/query")
async def team_query(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db_session = Depends(get_db)
):
    """执行Team查询"""
    try:
        team_name = request.get("team_name", os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2'))
        query = request.get("query")
        session_id = request.get("session_id")
        stream = request.get("stream", False)
        enable_monitoring = request.get("enable_monitoring", True)
        knowledge_retrieval_mode = request.get("knowledge_retrieval_mode", "all")  # 添加知识库检索模式参数
        user_id = request.get("user_id")  # 🔥 从请求中获取用户ID
        
        if not query:
            raise HTTPException(status_code=400, detail="查询内容不能为空")
        
        # 🔥 调试：检查用户ID是否正确传递
        logger.info(f"[TEAM API] 🔍 调试用户ID传递: user_id={user_id}, type={type(user_id)}")
        logger.info(f"[TEAM API] 🔍 完整请求数据: {request}")
        logger.info(f"[TEAM API] 收到Team查询请求: {team_name}, 查询: {query[:50]}..., 知识检索模式: {knowledge_retrieval_mode}, user_id: {user_id}")
        
        if stream:
            # 流式响应 - 不在服务端保存消息，由前端负责保存
            return StreamingResponse(
                _stream_team_response(team_name, query, session_id, enable_monitoring, knowledge_retrieval_mode, user_id),
                media_type="text/plain",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream"
                }
            )
        else:
            # 同步响应 - 使用任务管理器执行，防止卡死
            team_task_manager = get_team_task_manager()
            
            try:
                # 使用任务管理器执行Team查询
                execution_id = await team_task_manager.start_team_execution(
                    session_id=session_id or f"session_{uuid.uuid4().hex[:8]}",
                    query=query,
                    team_name=team_name,
                    team_service=enhanced_team_service,
                    execution_params={
                        "enable_monitoring": enable_monitoring,
                        "knowledge_retrieval_mode": knowledge_retrieval_mode
                    },
                    timeout=300.0  # 5分钟超时
                )
                
                # 等待任务完成
                max_wait_time = 300  # 最多等待5分钟
                wait_interval = 0.5   # 每0.5秒检查一次
                waited_time = 0
                
                while waited_time < max_wait_time:
                    execution_info = team_task_manager.get_execution_status(execution_id)
                    
                    if not execution_info:
                        raise HTTPException(status_code=500, detail="任务执行信息丢失")
                    
                    # 检查任务是否完成
                    if execution_info.status == TeamExecutionStatus.COMPLETED:
                        # 从基础任务管理器获取结果
                        base_task_result = team_task_manager.base_task_manager.get_task_result(execution_id)
                        if base_task_result:
                            response = base_task_result
                            break
                        else:
                            # 如果没有结果，创建一个模拟响应
                            class MockResponse:
                                def __init__(self, execution_info):
                                    self.content = execution_info.final_answer or "任务已完成但无返回内容"
                                    self.execution_id = execution_info.execution_id
                                    self.team_name = execution_info.team_name
                                    self.processing_time = execution_info.duration or 0
                                    self.member_calls = execution_info.member_calls
                                    self.structured_output = {}
                                    self.coordination_info = {}
                                    self.monitoring_data = {
                                        'knowledge_sources': execution_info.knowledge_sources
                                    }
                                    self.metadata = execution_info.metadata
                            
                            response = MockResponse(execution_info)
                            break
                    
                    elif execution_info.status in [TeamExecutionStatus.FAILED, TeamExecutionStatus.TIMEOUT, TeamExecutionStatus.CANCELLED]:
                        error_msg = execution_info.error_message or f"任务执行失败，状态: {execution_info.status.value}"
                        raise HTTPException(status_code=500, detail=error_msg)
                    
                    # 继续等待
                    await asyncio.sleep(wait_interval)
                    waited_time += wait_interval
                
                else:
                    # 超时，取消任务
                    await team_task_manager.cancel_team_execution(execution_id)
                    raise HTTPException(status_code=408, detail=f"Team查询超时（超过{max_wait_time}秒）")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Team任务管理器执行失败: {e}")
                # 如果任务管理器失败，回退到原始方法
                logger.info("回退到原始Team执行方法")
                response = await enhanced_team_service.execute_team_query(
                    team_name=team_name,
                    query=query,
                    session_id=session_id,
                    stream=False,
                    enable_monitoring=enable_monitoring,
                    knowledge_retrieval_mode=knowledge_retrieval_mode
                )
            
            # 保存team对话到数据库（仅同步模式）
            try:
                conversation_repo = ConversationRepository(db_session)
                
                # 🔥 去重knowledge_sources避免重复数据
                original_knowledge_sources = response.monitoring_data.get('knowledge_sources', []) if response.monitoring_data else []
                deduplicated_knowledge_sources = []
                seen_ids = set()
                for source in original_knowledge_sources:
                    source_id = source.get('id')
                    if source_id and source_id not in seen_ids:
                        seen_ids.add(source_id)
                        deduplicated_knowledge_sources.append(source)
                    elif not source_id:  # 没有ID的情况下，基于content去重
                        content_hash = hash(source.get('content', ''))
                        if content_hash not in seen_ids:
                            seen_ids.add(content_hash)
                            deduplicated_knowledge_sources.append(source)
                
                if len(original_knowledge_sources) != len(deduplicated_knowledge_sources):
                    logger.warning(f"[TEAM_DEDUP] 检测到重复的knowledge_sources: 原始{len(original_knowledge_sources)}个 -> 去重后{len(deduplicated_knowledge_sources)}个")
                
                await conversation_repo.save_team_conversation(
                    session_id=session_id or f"session_{uuid.uuid4().hex[:8]}",
                    question=query,
                    answer=response.content,
                    team_name=team_name,
                    team_mode='coordinate',
                    team_info={
                        'executionId': response.execution_id,
                        'teamName': team_name,
                        'teamMode': 'coordinate',
                        'memberCalls': [
                            {
                                'memberId': call.get('member_id', ''),
                                'memberName': call.get('member_name', ''),
                                'role': call.get('role', ''),
                                'action': call.get('action', ''),
                                'input': call.get('input', {}),
                                'output': call.get('output', {}),
                                'status': call.get('status', 'completed'),
                                'durationMs': call.get('duration_ms', 0),
                                'confidence': call.get('confidence', 0.0)
                            } for call in response.member_calls
                        ],
                        'structuredOutput': response.structured_output,
                        'coordinationInfo': response.coordination_info
                    },
                    model_used=response.metadata.get('model', 'team'),
                    processing_time=response.processing_time,
                    confidence_score=None,
                    sources=None,
                    knowledge_sources=deduplicated_knowledge_sources,  # 🔥 使用去重后的数据
                    thinking=None,
                    metadata=response.metadata,
                    user_id=int(user_id) if user_id is not None else None  # 🔥 确保用户ID为整数类型
                )
                logger.info(f"Team同步对话已保存到数据库: session_id={session_id}")
            except Exception as save_error:
                logger.error(f"保存Team同步对话失败: {save_error}")
                # 不中断正常响应，只记录错误
            
            # 为同步响应生成Team分析数据
            from service.enhanced_team_service import enhanced_team_service
            team_analysis = enhanced_team_service._generate_team_analysis(
                team_name, query, response.execution_id, response.processing_time
            )
            
            return {
                "success": True,
                "data": {
                    "content": response.content,
                    "team_name": response.team_name,
                    "execution_id": response.execution_id,
                    "processing_time": response.processing_time,
                    "member_calls": team_analysis.get('member_calls', response.member_calls),
                    "team_decisions": team_analysis.get('team_decisions', []),  # 添加团队决策数据
                    "structured_output": response.structured_output,
                    "coordination_info": team_analysis.get('coordination_info', response.coordination_info),
                    "monitoring_data": response.monitoring_data,
                    "metadata": response.metadata
                }
            }
            
    except Exception as e:
        logger.error(f"[TEAM API] Team查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"Team查询失败: {str(e)}")


async def _stream_team_response(team_name: str, query: str, session_id: str, enable_monitoring: bool, knowledge_retrieval_mode: str = "all", user_id: Optional[int] = None):
    """流式Team响应生成器 - 使用任务管理器，支持超时和取消"""
    
    # 🔥 关键修复：立即创建团队对话记录，避免前端加载历史时找不到对话
    try:
        from db.database import get_async_session
        from db.repositories.conversation_repository import ConversationRepository
        
        # 🔥 修复：不立即创建占位记录，避免显示"[团队处理中...]"
        # 等待流式响应完成后再保存完整内容
        logger.info(f"[TEAM STREAM] 等待流式响应完成后保存，session_id={session_id}")
    except Exception as create_error:
        logger.error(f"[TEAM STREAM] 初始化失败: {create_error}")
    
    # 初始化内容收集变量
    collected_content = ""
    collected_metadata = {}
    team_decisions = []  # 收集团队决策数据
    knowledge_sources = []
    team_info = {}
    execution_id = None
    task_cancelled = False
    
    # 🔥 添加连接检查和心跳机制
    last_heartbeat = time.time()
    heartbeat_interval = 30  # 30秒心跳间隔
    connection_check_count = 0
    
    # 使用任务管理器执行流式任务
    team_task_manager = get_team_task_manager()
    
    try:
        # 创建一个流式执行任务
        execution_id = await team_task_manager.start_team_execution(
            session_id=session_id or f"stream_{uuid.uuid4().hex[:8]}",
            query=query,
            team_name=team_name,
            team_service=enhanced_team_service,
            execution_params={
                "enable_monitoring": enable_monitoring,
                "knowledge_retrieval_mode": knowledge_retrieval_mode,
                "stream_mode": True
            },
            timeout=600.0  # 流式模式给10分钟超时
        )
        
        # 发送开始事件
        start_event = {
            "type": "stream_start",
            "data": {
                "execution_id": execution_id,
                "session_id": session_id,
                "team_name": team_name,
                "query": query,
                "timestamp": time.time()
            }
        }
        yield f"data: {json.dumps(start_event, ensure_ascii=False, default=safe_json_serializer)}\n\n"
        
        # 🔥 添加连接检测：发送初始心跳
        try:
            heartbeat_event = {
                "type": "heartbeat",
                "data": {
                    "message": "Connection established",
                    "timestamp": time.time()
                }
            }
            yield f"data: {json.dumps(heartbeat_event, ensure_ascii=False)}\n\n"
            logger.info(f"[TEAM STREAM] 发送初始心跳，连接建立: {session_id}")
        except Exception as heartbeat_error:
            logger.error(f"[TEAM STREAM] 初始心跳发送失败，可能连接已断开: {heartbeat_error}")
            return  # 连接已断开，直接退出
        
        # 使用原有的流式查询方法，但增加超时检查
        stream_start_time = time.time()
        max_stream_time = 600  # 10分钟最大流式时间
        
        event_count = 0
        async for event in enhanced_team_service.execute_team_query_stream(
            team_name=team_name,
            query=query,
            session_id=session_id,
            enable_monitoring=enable_monitoring,
            knowledge_retrieval_mode=knowledge_retrieval_mode
        ):
            event_count += 1
            current_time = time.time()
            
            # 🔥 定期心跳检测连接状态
            if current_time - last_heartbeat > heartbeat_interval:
                try:
                    heartbeat_event = {
                        "type": "heartbeat",
                        "data": {
                            "message": "Connection alive",
                            "event_count": event_count,
                            "timestamp": current_time
                        }
                    }
                    yield f"data: {json.dumps(heartbeat_event, ensure_ascii=False)}\n\n"
                    last_heartbeat = current_time
                    connection_check_count += 1
                    logger.debug(f"[TEAM STREAM] 心跳 #{connection_check_count}: {session_id}")
                except Exception as heartbeat_error:
                    logger.error(f"[TEAM STREAM] 心跳发送失败，连接可能已断开: {heartbeat_error}")
                    # 连接断开，清理任务并退出
                    await team_task_manager.cancel_team_execution(execution_id)
                    return
            
            # 每处理1个事件就检查一次取消状态，提高响应速度
            execution_info = team_task_manager.get_execution_status(execution_id)
            if execution_info and execution_info.status == TeamExecutionStatus.CANCELLED:
                logger.info(f"[TEAM STREAM] 流式任务被取消: {execution_id}")
                task_cancelled = True
                cancel_event = {
                    "type": "stream_cancelled",
                    "data": {
                        "execution_id": execution_id,
                        "message": "任务已被取消",
                        "timestamp": time.time()
                    }
                }
                yield f"data: {json.dumps(cancel_event, ensure_ascii=False, default=safe_json_serializer)}\n\n"
                break
            
            # 检查超时
            if time.time() - stream_start_time > max_stream_time:
                logger.warning(f"[TEAM STREAM] 流式任务超时: {execution_id}")
                await team_task_manager.cancel_team_execution(execution_id)
                timeout_event = {
                    "type": "stream_timeout",
                    "data": {
                        "execution_id": execution_id,
                        "message": f"流式任务超时（超过{max_stream_time}秒）",
                        "timestamp": time.time()
                    }
                }
                yield f"data: {json.dumps(timeout_event, ensure_ascii=False, default=safe_json_serializer)}\n\n"
                break
            # 跳过已取消的任务
            if task_cancelled:
                break
                
            event_type = event.get("type")
            
            # 收集内容和数据用于保存
            if isinstance(event, dict):
                if event_type == "content":
                    content_data = event.get("data", {})
                    content = content_data.get("content", "")
                    if content:
                        # 安全处理内容，确保是字符串
                        if isinstance(content, str):
                            collected_content += content
                        else:
                            # 使用安全序列化器处理复杂对象
                            content_str = safe_json_serializer(content)
                            if isinstance(content_str, str):
                                collected_content += content_str
                            else:
                                collected_content += str(content_str)
                        logger.debug(f"[TEAM STREAM] 累积内容，当前长度: {len(collected_content)}")
                
                elif event_type == "chunk":
                    chunk_data = event.get("data", {})
                    content = chunk_data.get("content", "")
                    if content:
                        # 安全处理内容，确保是字符串
                        if isinstance(content, str):
                            collected_content += content
                        else:
                            # 使用安全序列化器处理复杂对象
                            content_str = safe_json_serializer(content)
                            if isinstance(content_str, str):
                                collected_content += content_str
                            else:
                                collected_content += str(content_str)
                
                elif event_type == "team_analysis":
                    # 收集team分析数据 - 这是最重要的完整执行数据
                    analysis_data = event.get("data", {})
                    if analysis_data:
                        logger.info(f"[TEAM STREAM] 收集到完整team分析数据: {list(analysis_data.keys())}")
                        
                        # 🔥 重要：保存完整的SSE格式数据，确保与前端渲染一致
                        team_info.update(analysis_data)
                        
                        # 🔥 关键修复：保存完整的member_calls数据（包含执行时间等完整信息）
                        member_calls_in_analysis = analysis_data.get("member_calls", [])
                        if member_calls_in_analysis:
                            logger.info(f"[TEAM STREAM] 保存完整member_calls数据: {len(member_calls_in_analysis)}个")
                            # 使用SSE中的完整memberCalls结构，包含startTime、endTime、durationMs等
                            team_info["memberCalls"] = member_calls_in_analysis  # 前端期望的字段名
                            team_info["member_calls"] = member_calls_in_analysis  # 保持兼容性
                            logger.debug(f"[TEAM STREAM] member_calls示例数据: {member_calls_in_analysis[0] if member_calls_in_analysis else 'None'}")
                        else:
                            logger.warning(f"[TEAM STREAM] team_analysis事件中没有member_calls数据")
                        
                        # 🔥 关键修复：保存完整的team_decisions数据
                        team_decisions_in_analysis = analysis_data.get("team_decisions", [])
                        if team_decisions_in_analysis:
                            logger.info(f"[TEAM STREAM] 保存完整team_decisions数据: {len(team_decisions_in_analysis)}个")
                            # 使用SSE中的完整teamDecisions结构
                            team_info["teamDecisions"] = team_decisions_in_analysis  # 前端期望的字段名  
                            team_info["team_decisions"] = team_decisions_in_analysis  # 保持兼容性
                            # 同时更新全局收集器
                            team_decisions.extend(team_decisions_in_analysis)
                            logger.debug(f"[TEAM STREAM] team_decisions示例数据: {team_decisions_in_analysis[0] if team_decisions_in_analysis else 'None'}")
                        else:
                            logger.warning(f"[TEAM STREAM] team_analysis事件中没有team_decisions数据")
                        
                        # 🔥 保存其他重要的执行信息
                        coordination_info = analysis_data.get("coordination_info", {})
                        if coordination_info:
                            team_info["coordinationInfo"] = coordination_info
                            logger.info(f"[TEAM STREAM] 保存协调信息: {coordination_info}")
                        
                        metadata = analysis_data.get("metadata", {})
                        if metadata:
                            team_info["executionMetadata"] = metadata
                            logger.info(f"[TEAM STREAM] 保存执行元数据: {metadata}")
                
                elif event_type == "knowledge_sources":
                    # 收集知识源数据
                    knowledge_data = event.get("data", {})
                    if "knowledge_sources" in knowledge_data:
                        knowledge_sources.extend(knowledge_data["knowledge_sources"])
                        logger.info(f"[TEAM STREAM] 收集到 {len(knowledge_data['knowledge_sources'])} 个知识源")
                
                elif event_type == "agent_start":
                    # Agent开始事件
                    agent_data = event.get("data", {})
                    logger.info(f"[TEAM STREAM] 收到Agent开始事件: {agent_data.get('agent_name', 'Unknown')}")
                
                elif event_type == "agent_complete":
                    # Agent完成事件
                    agent_data = event.get("data", {})
                    logger.info(f"[TEAM STREAM] 收到Agent完成事件: {agent_data.get('agent_name', 'Unknown')}")
                
                elif event_type == "done":
                    # 收集最终元数据
                    done_data = event.get("data", {})
                    collected_metadata.update(done_data)
            
            # 转发事件给前端
            logger.info(f"[TEAM STREAM] 转发事件到前端: {event_type}")
                
            # 格式化SSE事件，使用安全的JSON序列化
            try:
                event_data = json.dumps(event, ensure_ascii=False, default=safe_json_serializer)
            except Exception as json_error:
                logger.error(f"[TEAM API] JSON序列化失败: {json_error}, event: {event}")
                # 创建错误事件
                error_event = {
                    "type": "error",
                    "data": {
                        "error": f"JSON序列化失败: {str(json_error)}",
                        "original_event_type": event.get("type", "unknown"),
                        "timestamp": time.time()
                    }
                }
                event_data = json.dumps(error_event, ensure_ascii=False)
            
            # 🔥 添加连接检查：如果yield失败说明连接已断开
            try:
                yield f"data: {event_data}\n\n"
            except Exception as yield_error:
                logger.error(f"[TEAM STREAM] 事件发送失败，连接可能已断开: {yield_error}")
                # 连接断开，清理任务并退出
                await team_task_manager.cancel_team_execution(execution_id)
                return
        
        # 流式响应完成后，更新team对话内容
        if session_id:
            try:
                logger.info(f"[TEAM STREAM] 开始更新team对话，内容长度: {len(collected_content)}")
                
                # 导入数据库依赖
                from db.database import get_async_session
                from db.repositories.conversation_repository import ConversationRepository
                
                # 获取数据库会话
                async with get_async_session() as db_session:
                    conversation_repo = ConversationRepository(db_session)
                    
                    # 如果有实际内容，更新完整内容；否则标记为失败
                    final_answer = collected_content.strip() if collected_content.strip() else "[团队处理失败或被中断]"
                    
                    # 🔥 重构：构建完整的final_team_info确保历史对话渲染一致
                    final_team_info = {
                        # 基础信息
                        "executionId": execution_id,
                        "teamName": team_name,
                        "teamMode": "coordinate",
                        "status": "completed",
                        "final_update": True,
                        "isTeamMessage": True,
                        
                        # 执行统计 - 从collected_metadata中获取或使用team_info
                        "total_steps": team_info.get("total_steps", collected_metadata.get("total_steps", 0)),
                        "completed_steps": team_info.get("completed_steps", collected_metadata.get("completed_steps", 0)),
                        "failed_steps": team_info.get("failed_steps", collected_metadata.get("failed_steps", 0)),
                        "execution_mode": team_info.get("execution_mode", "sequential"),
                        "system_version": team_info.get("system_version", "team_v2"),
                        
                        # 核心渲染数据
                        "memberCalls": [],
                        "teamDecisions": [],
                        "knowledge_sources": knowledge_sources or [],
                        
                        # 处理时间和模型信息
                        "processing_time": collected_metadata.get("processing_time", 0.0),
                        "model_used": collected_metadata.get("model_used", "team"),
                        
                        # 保留原有的team_info数据
                        **{k: v for k, v in team_info.items() if k not in [
                            'executionId', 'teamName', 'teamMode', 'status', 'final_update', 
                            'memberCalls', 'teamDecisions', 'processing_time', 'model_used'
                        ]}
                    }
                    
                    # 🔥 修复：确保收集到的team_decisions数据被包含在final_team_info中
                    if team_decisions:
                        logger.info(f"[TEAM STREAM] 将 {len(team_decisions)} 个team_decisions添加到final_team_info")
                        final_team_info["teamDecisions"] = team_decisions
                    else:
                        # 如果没有收集到team_decisions，尝试从team_info中获取
                        team_decisions_from_info = team_info.get("team_decisions") or team_info.get("teamDecisions", [])
                        if team_decisions_from_info:
                            logger.info(f"[TEAM STREAM] 从team_info中获取到 {len(team_decisions_from_info)} 个teamDecisions")
                            final_team_info["teamDecisions"] = team_decisions_from_info
                    
                    # 🔥 修复：确保memberCalls数据也被正确保存（支持多种字段名）
                    member_calls_data = team_info.get("member_calls") or team_info.get("memberCalls", [])
                    if member_calls_data:
                        logger.info(f"[TEAM STREAM] 将 {len(member_calls_data)} 个memberCalls添加到final_team_info")
                        final_team_info["memberCalls"] = member_calls_data
                    else:
                        logger.warning(f"[TEAM STREAM] 没有找到memberCalls数据，检查数据收集逻辑")
                        logger.debug(f"[TEAM STREAM] team_info keys: {list(team_info.keys())}")
                        logger.debug(f"[TEAM STREAM] team_info 内容预览: {str(team_info)[:500]}...")
                    
                    # 记录最终的team_info结构用于调试
                    logger.info(f"[TEAM STREAM] 最终team_info结构: memberCalls={len(final_team_info['memberCalls'])}, teamDecisions={len(final_team_info['teamDecisions'])}, knowledge_sources={len(final_team_info['knowledge_sources'])}")
                    logger.debug(f"[TEAM STREAM] final_team_info完整结构: {final_team_info}")
                
                    
                    await conversation_repo.save_team_conversation(
                        session_id=session_id,
                        question=query,
                        answer=final_answer,
                        team_name=team_name,
                        team_mode="coordinate",  # 添加必需参数
                        team_info=final_team_info,
                        model_used=collected_metadata.get("model_used", "team"),
                        processing_time=collected_metadata.get("processing_time", 0.0),
                        knowledge_sources=knowledge_sources,
                        metadata={**collected_metadata, "final_update": True},
                        user_id=int(user_id) if user_id is not None else None  # 🔥 确保用户ID为整数类型
                    )
                    
                logger.info(f"[TEAM STREAM] Team对话更新成功: session_id={session_id}, 最终内容长度: {len(final_answer)}")
                
            except Exception as save_error:
                logger.error(f"[TEAM STREAM] Team对话更新失败: {save_error}")
        else:
            logger.warning(f"[TEAM STREAM] 无session_id，跳过更新")
        
        logger.info(f"[TEAM STREAM] 流式响应完成: session_id={session_id}")
            
    except Exception as e:
        logger.error(f"[TEAM API] 流式响应失败: {e}")
        error_event = {
            "type": "error",
            "data": {
                "error": str(e),
                "timestamp": time.time()
            }
        }
        yield f"data: {json.dumps(error_event, ensure_ascii=False, default=safe_json_serializer)}\n\n"


@router.get("/status/{execution_id}")
async def get_execution_status(execution_id: str):
    """获取执行状态"""
    try:
        status = await enhanced_team_service.get_execution_status(execution_id)
        if not status:
            raise HTTPException(status_code=404, detail="执行记录不存在")
        
        return {
            "success": True,
            "data": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 获取执行状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行状态失败: {str(e)}")


@router.get("/metrics/{execution_id}")
async def get_execution_metrics(execution_id: str):
    """获取执行指标"""
    try:
        metrics = await enhanced_team_service.get_execution_metrics(execution_id)
        if not metrics:
            raise HTTPException(status_code=404, detail="执行指标不存在")
        
        return {
            "success": True,
            "data": metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 获取执行指标失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行指标失败: {str(e)}")


@router.get("/performance/{execution_id}")
async def get_execution_performance(execution_id: str):
    """获取团队执行性能分析数据"""
    try:
        # 从数据库查询执行数据
        from sqlalchemy import text
        from db.database import get_db
        
        async for db in get_db():
            # 查询主执行记录
            execution_query = text("""
                SELECT execution_id, team_name, status, total_duration_ms, 
                       coordination_info, created_at, updated_at
                FROM team_executions 
                WHERE execution_id = :execution_id
            """)
            execution_result = await db.execute(execution_query, {"execution_id": execution_id})
            execution_data = execution_result.fetchone()
            
            if not execution_data:
                raise HTTPException(status_code=404, detail="执行记录不存在")
            
            # 查询成员调用数据
            member_calls_query = text("""
                SELECT member_id, member_name, status, duration_ms, confidence, 
                       start_time, end_time, error_message
                FROM team_member_calls 
                WHERE execution_id = :execution_id
                ORDER BY created_at
            """)
            member_calls_result = await db.execute(member_calls_query, {"execution_id": execution_id})
            member_calls_data = member_calls_result.fetchall()
            
            # 计算性能指标
            total_steps = len(member_calls_data)
            completed_steps = len([call for call in member_calls_data if call.status == 'completed'])
            failed_steps = len([call for call in member_calls_data if call.status == 'failed'])
            
            success_rate = (completed_steps / total_steps * 100) if total_steps > 0 else 0
            efficiency_rate = success_rate  # 简化版效率计算
            
            # 提取协调器信息
            coordination_info = execution_data.coordination_info if execution_data.coordination_info else {}
            coordinator_id = "Auto"  # 默认为Auto
            
            # 计算平均步骤时间
            valid_durations = [call.duration_ms for call in member_calls_data if call.duration_ms]
            avg_step_duration = sum(valid_durations) / len(valid_durations) if valid_durations else 0
            
            performance_data = {
                "execution_id": execution_data.execution_id,
                "team_name": execution_data.team_name,
                "status": execution_data.status,
                "total_steps": total_steps,
                "completed_steps": completed_steps,
                "failed_steps": failed_steps,
                "success_rate": round(success_rate, 1),
                "efficiency_rate": round(efficiency_rate, 1),
                "total_duration_ms": execution_data.total_duration_ms or 0,
                "avg_step_duration_ms": round(avg_step_duration),
                "coordinator_id": coordinator_id,
                "coordination_mode": coordination_info.get("coordination_mode", "Auto"),
                "member_calls": [
                    {
                        "member_id": call.member_id,
                        "member_name": call.member_name,
                        "status": call.status,
                        "duration_ms": call.duration_ms,
                        "confidence": call.confidence,
                        "error_message": call.error_message
                    }
                    for call in member_calls_data
                ]
            }
            
            return {
                "success": True,
                "data": performance_data
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 获取团队执行性能数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取性能数据失败: {str(e)}")


@router.post("/cancel/{execution_id}")
async def cancel_execution(execution_id: str):
    """取消执行"""
    try:
        success = await enhanced_team_service.cancel_execution(execution_id)
        
        return {
            "success": success,
            "message": "执行已取消" if success else "取消执行失败"
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 取消执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消执行失败: {str(e)}")


@router.get("/langdb/metrics/{session_id}")
async def get_langdb_metrics(session_id: str):
    """获取LangDB监控指标"""
    try:
        metrics = await langdb_service.get_session_metrics(session_id)
        if not metrics:
            return {
                "success": True,
                "data": {
                    "metrics": [],
                    "execution_history": [],
                    "member_performance": {}
                }
            }
        
        return {
            "success": True,
            "data": metrics
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取LangDB指标失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取LangDB指标失败: {str(e)}")


@router.get("/langdb/history/{session_id}")
async def get_langdb_history(session_id: str, limit: int = 50):
    """获取LangDB执行历史"""
    try:
        history = await langdb_service.get_execution_history(session_id, limit)
        
        return {
            "success": True,
            "data": history
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取LangDB历史失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取LangDB历史失败: {str(e)}")


@router.get("/langdb/performance/{session_id}")
async def get_langdb_performance(session_id: str):
    """获取LangDB性能数据"""
    try:
        performance = await langdb_service.get_member_performance(session_id)
        
        return {
            "success": True,
            "data": performance
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取LangDB性能失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取LangDB性能失败: {str(e)}")


@router.post("/langdb/start")
async def start_langdb_monitoring(request: Dict[str, Any]):
    """启动LangDB监控"""
    try:
        session_id = request.get("session_id")
        team_config = request.get("team_config")
        
        if not session_id or not team_config:
            raise HTTPException(status_code=400, detail="缺少必要参数")
        
        success = await langdb_service.start_monitoring(session_id, team_config)
        
        return {
            "success": success,
            "message": "监控已启动" if success else "启动监控失败"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 启动LangDB监控失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动LangDB监控失败: {str(e)}")


@router.post("/langdb/stop")
async def stop_langdb_monitoring(request: Dict[str, Any]):
    """停止LangDB监控"""
    try:
        session_id = request.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="缺少session_id参数")
        
        success = await langdb_service.stop_monitoring(session_id)
        
        return {
            "success": success,
            "message": "监控已停止" if success else "停止监控失败"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 停止LangDB监控失败: {e}")
        raise HTTPException(status_code=500, detail=f"停止LangDB监控失败: {str(e)}")


@router.get("/teams")
async def get_available_teams():
    """获取可用的Team列表"""
    try:
        # 从配置文件获取可用的Team
        teams = [
            {
                "name": os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2'),
                "display_name": "地聚物问答团队",
                "description": "多语言地聚物材料问答专业团队",
                "mode": "coordinate",
                "members": [
                    "question_decomposition_agent",
                    "translation_agent", 
                    "knowledge_retrieval_agent",
                    "knowledge_graph_agent",
                    "summary_answer_agent",
                    "qa_coordinator_v2"
                ]
            }
        ]
        
        return {
            "success": True,
            "data": teams
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取Team列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Team列表失败: {str(e)}")


@router.get("/stats")
async def get_team_stats():
    """获取Team统计信息"""
    try:
        # 获取总体统计
        overall_stats = await langdb_service.get_overall_stats()
        
        # 获取团队统计
        team_stats = await langdb_service.get_team_stats()
        
        # 获取成员性能
        member_performance = await langdb_service.get_member_performance()
        
        return {
            "success": True,
            "data": {
                "overall_stats": overall_stats,
                "team_stats": team_stats,
                "member_performance": member_performance
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取Team统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Team统计失败: {str(e)}")


# ============ Team任务管理端点 ============

@router.get("/executions/stats")
async def get_team_execution_stats():
    """获取Team执行统计信息"""
    try:
        team_task_manager = get_team_task_manager()
        stats = team_task_manager.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取Team执行统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行统计失败: {str(e)}")


@router.get("/executions/running")
async def get_running_team_executions():
    """获取运行中的Team执行"""
    try:
        team_task_manager = get_team_task_manager()
        running_executions = team_task_manager.get_running_executions()
        
        # 转换为响应格式
        execution_data = []
        for execution in running_executions:
            execution_data.append({
                "execution_id": execution.execution_id,
                "session_id": execution.session_id,
                "team_name": execution.team_name,
                "query": execution.query[:100] + "..." if len(execution.query) > 100 else execution.query,
                "status": execution.status.value,
                "progress_percentage": execution.progress_percentage,
                "current_agent": execution.current_agent,
                "completed_agents": len(execution.completed_agents),
                "total_agents": len(execution.agents_progress),
                "duration": execution.duration,
                "start_time": execution.start_time
            })
        
        return {
            "success": True,
            "data": {
                "running_executions": execution_data,
                "total_running": len(execution_data)
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取运行中Team执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取运行执行失败: {str(e)}")


@router.get("/executions/{execution_id}")
async def get_team_execution_status(execution_id: str):
    """获取指定Team执行的状态"""
    try:
        team_task_manager = get_team_task_manager()
        execution_info = team_task_manager.get_execution_status(execution_id)
        
        if not execution_info:
            raise HTTPException(status_code=404, detail="执行记录不存在")
        
        # 转换Agent进度信息
        agents_progress = {}
        for agent_id, progress in execution_info.agents_progress.items():
            agents_progress[agent_id] = {
                "agent_id": progress.agent_id,
                "agent_name": progress.agent_name,
                "status": progress.status,
                "progress_percentage": progress.progress_percentage,
                "current_step": progress.current_step,
                "start_time": progress.start_time,
                "end_time": progress.end_time,
                "error_message": progress.error_message
            }
        
        return {
            "success": True,
            "data": {
                "execution_id": execution_info.execution_id,
                "session_id": execution_info.session_id,
                "team_name": execution_info.team_name,
                "query": execution_info.query,
                "status": execution_info.status.value,
                "progress_percentage": execution_info.progress_percentage,
                "current_agent": execution_info.current_agent,
                "completed_agents": execution_info.completed_agents,
                "failed_agents": execution_info.failed_agents,
                "agents_progress": agents_progress,
                "final_answer": execution_info.final_answer,
                "error_message": execution_info.error_message,
                "duration": execution_info.duration,
                "start_time": execution_info.start_time,
                "end_time": execution_info.end_time,
                "timeout": execution_info.timeout
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 获取Team执行状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行状态失败: {str(e)}")


@router.post("/executions/{execution_id}/cancel")
async def cancel_team_execution(execution_id: str):
    """取消指定Team执行"""
    try:
        team_task_manager = get_team_task_manager()
        
        # 检查执行是否存在
        execution_info = team_task_manager.get_execution_status(execution_id)
        if not execution_info:
            raise HTTPException(status_code=404, detail="执行记录不存在")
        
        # 取消执行
        success = await team_task_manager.cancel_team_execution(execution_id)
        
        return {
            "success": success,
            "message": f"Team执行 {execution_id} 已取消" if success else f"无法取消Team执行 {execution_id}",
            "execution_id": execution_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM API] 取消Team执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消执行失败: {str(e)}")


@router.post("/sessions/{session_id}/cancel")
async def cancel_session_team_executions(session_id: str):
    """取消指定会话的所有Team执行"""
    try:
        team_task_manager = get_team_task_manager()
        cancelled_count = await team_task_manager.cancel_session_executions(session_id)
        
        return {
            "success": True,
            "message": f"已取消会话 {session_id} 的 {cancelled_count} 个执行任务",
            "session_id": session_id,
            "cancelled_count": cancelled_count
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 取消会话Team执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消会话执行失败: {str(e)}")


@router.get("/sessions/{session_id}/executions")
async def get_session_team_executions(session_id: str):
    """获取指定会话的所有Team执行"""
    try:
        team_task_manager = get_team_task_manager()
        session_executions = team_task_manager.get_session_executions(session_id)
        
        # 转换为响应格式
        execution_data = []
        for execution in session_executions:
            execution_data.append({
                "execution_id": execution.execution_id,
                "team_name": execution.team_name,
                "query": execution.query[:100] + "..." if len(execution.query) > 100 else execution.query,
                "status": execution.status.value,
                "progress_percentage": execution.progress_percentage,
                "completed_agents": len(execution.completed_agents),
                "total_agents": len(execution.agents_progress),
                "duration": execution.duration,
                "start_time": execution.start_time,
                "end_time": execution.end_time,
                "error_message": execution.error_message
            })
        
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "executions": execution_data,
                "total_executions": len(execution_data)
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取会话Team执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取会话执行失败: {str(e)}")


@router.delete("/executions/cleanup")
async def cleanup_old_team_executions(
    max_age_hours: int = Query(2, ge=1, le=24, description="清理多少小时前完成的执行")
):
    """清理旧的Team执行记录"""
    try:
        team_task_manager = get_team_task_manager()
        cleaned_count = team_task_manager.cleanup_old_executions(max_age_hours)
        
        return {
            "success": True,
            "message": f"清理了 {cleaned_count} 个过期的Team执行记录",
            "cleaned_count": cleaned_count,
            "max_age_hours": max_age_hours
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 清理Team执行记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理执行记录失败: {str(e)}")


@router.get("/executions/stats")
async def get_team_execution_stats():
    """获取Team执行统计信息"""
    try:
        team_task_manager = get_team_task_manager()
        stats = team_task_manager.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取Team执行统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.get("/executions/running")  
async def get_running_team_executions():
    """获取运行中的Team执行"""
    try:
        team_task_manager = get_team_task_manager()
        running_executions = team_task_manager.get_running_executions()
        
        execution_data = []
        for execution in running_executions:
            execution_data.append({
                "execution_id": execution.execution_id,
                "session_id": execution.session_id,
                "query": execution.query[:100] + "..." if len(execution.query) > 100 else execution.query,
                "team_name": execution.team_name,
                "status": execution.status.value,
                "start_time": execution.start_time,
                "duration": execution.duration,
                "progress_percentage": execution.progress_percentage,
                "current_agent": execution.current_agent,
                "completed_agents": len(execution.completed_agents),
                "failed_agents": len(execution.failed_agents),
                "total_agents": len(execution.agents_progress)
            })
        
        return {
            "success": True,
            "data": {
                "running_count": len(running_executions),
                "executions": execution_data
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] 获取运行中执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取运行中执行失败: {str(e)}")


@router.post("/test")
async def test_team_functionality():
    """测试Team功能"""
    try:
        test_query = "地聚物材料的强度特性是什么？"
        test_team = os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2')
        test_session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        
        logger.info(f"[TEAM API] 开始测试Team功能: {test_team}")
        
        # 使用任务管理器执行测试
        team_task_manager = get_team_task_manager()
        
        execution_id = await team_task_manager.start_team_execution(
            session_id=test_session_id,
            query=test_query,
            team_name=test_team,
            team_service=enhanced_team_service,
            execution_params={"enable_monitoring": True},
            timeout=60.0  # 1分钟测试超时
        )
        
        return {
            "success": True,
            "data": {
                "test_query": test_query,
                "test_team": test_team,
                "test_session_id": test_session_id,
                "execution_id": execution_id,
                "message": "测试任务已启动，请使用 /api/team/executions/{execution_id} 查看进度"
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM API] Team功能测试失败: {e}")
        raise HTTPException(status_code=500, detail=f"Team功能测试失败: {str(e)}") 