"""
Team V2 API端点
提供新的Team执行系统的API接口
"""
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import time

from core.logger import logger
from service.team_v2.new_team_execution_service import new_team_execution_service
from service.team_v2.singleton_team_manager import get_singleton_team_manager
from service.team_v2.team_execution_template import template_repository
from service.team_v2.execution_tracker import execution_tracker

router = APIRouter(prefix="/team-v2", tags=["Team V2"])


class TeamQueryRequest(BaseModel):
    """Team查询请求"""
    team_name: str
    query: str
    session_id: str
    stream: bool = True
    knowledge_retrieval_mode: str = 'all'  # 'all', 'papers_only', 'qa_only'
    knowledge_retrieval_enabled: bool = True  # 知识库检索开关
    knowledge_graph_enabled: bool = True  # 知识图谱开关
    user_id: Optional[int] = None  # 🔥 添加用户ID字段


class TeamQueryResponse(BaseModel):
    """Team查询响应"""
    execution_id: str
    status: str
    message: str


class TeamStatusResponse(BaseModel):
    """Team状态响应"""
    team_instances: Dict
    execution_statistics: Dict
    system_status: str


@router.post("/query", response_model=TeamQueryResponse)
async def team_query(request: TeamQueryRequest):
    """
    执行Team查询 - 新系统
    支持流式和非流式响应
    """
    try:
        # 🔥 调试：检查用户ID是否正确接收
        logger.info(f"[TEAM_V2_API] 🔍 收到Team查询请求: {request.team_name}, session: {request.session_id}, user_id: {request.user_id}")
        logger.info(f"[TEAM_V2_API] 🔍 完整请求数据: {request.dict()}")
        
        if request.stream:
            # 流式响应
            return StreamingResponse(
                _stream_team_query(
                    team_name=request.team_name,
                    query=request.query,
                    session_id=request.session_id,
                    knowledge_retrieval_mode=request.knowledge_retrieval_mode,
                    knowledge_retrieval_enabled=request.knowledge_retrieval_enabled,
                    knowledge_graph_enabled=request.knowledge_graph_enabled,
                    user_id=request.user_id  # 🔥 传递用户ID
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                }
            )
        else:
            # 非流式响应
            return await _non_stream_team_query(
                team_name=request.team_name,
                query=request.query,
                session_id=request.session_id,
                knowledge_retrieval_mode=request.knowledge_retrieval_mode,
                knowledge_retrieval_enabled=request.knowledge_retrieval_enabled,
                knowledge_graph_enabled=request.knowledge_graph_enabled,
                user_id=request.user_id  # 🔥 传递用户ID
            )
    
    except Exception as e:
        logger.error(f"[TEAM_V2_API] Team查询失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _stream_team_query(
    team_name: str,
    query: str, 
    session_id: str,
    knowledge_retrieval_mode: str,
    knowledge_retrieval_enabled: bool,
    knowledge_graph_enabled: bool,
    user_id: Optional[int] = None  # 🔥 添加用户ID参数
):
    """流式Team查询"""
    try:
        async for chunk in new_team_execution_service.execute_team_query(
            team_name=team_name,
            query=query,
            session_id=session_id,
            stream=True,
            knowledge_retrieval_mode=knowledge_retrieval_mode,
            knowledge_retrieval_enabled=knowledge_retrieval_enabled,
            knowledge_graph_enabled=knowledge_graph_enabled,
            user_id=user_id  # 🔥 传递用户ID
        ):
            # 格式化为SSE格式
            sse_data = f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            yield sse_data.encode('utf-8')
            
            # 添加小延迟以避免过快发送
            await asyncio.sleep(0.01)
            
    except Exception as e:
        error_chunk = {
            "type": "error",
            "data": {
                "error": str(e),
                "timestamp": time.time()
            }
        }
        error_sse = f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
        yield error_sse.encode('utf-8')


async def _non_stream_team_query(
    team_name: str,
    query: str,
    session_id: str,
    knowledge_retrieval_mode: str,
    knowledge_retrieval_enabled: bool,
    knowledge_graph_enabled: bool,
    user_id: Optional[int] = None  # 🔥 添加用户ID参数
) -> TeamQueryResponse:
    """非流式Team查询"""
    try:
        execution_id = f"exec_{int(time.time() * 1000)}"
        results = []
        
        async for chunk in new_team_execution_service.execute_team_query(
            team_name=team_name,
            query=query,
            session_id=session_id,
            stream=False,  # 虽然内部仍使用流式，但我们收集所有结果
            knowledge_retrieval_mode=knowledge_retrieval_mode,
            knowledge_retrieval_enabled=knowledge_retrieval_enabled,
            knowledge_graph_enabled=knowledge_graph_enabled,
            user_id=user_id  # 🔥 传递用户ID
        ):
            results.append(chunk)
            if chunk.get("type") == "complete":
                execution_id = chunk.get("data", {}).get("execution_id", execution_id)
                break
        
        return TeamQueryResponse(
            execution_id=execution_id,
            status="completed",
            message=f"Team查询完成，共收到 {len(results)} 个事件"
        )
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 非流式查询失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=TeamStatusResponse)
async def get_team_status():
    """获取Team系统状态"""
    try:
        # 获取Team管理器状态
        team_manager = await get_singleton_team_manager()
        team_stats = await team_manager.get_team_statistics()
        
        # 获取执行统计信息
        execution_stats = await new_team_execution_service.get_execution_statistics()
        
        return TeamStatusResponse(
            team_instances=team_stats,
            execution_statistics=execution_stats,
            system_status="healthy"
        )
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 获取状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def get_team_templates():
    """获取所有Team模板"""
    try:
        templates = await template_repository.list_templates(active_only=True)
        
        return {
            "templates": [template.to_dict() for template in templates],
            "count": len(templates)
        }
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 获取模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{team_name}")
async def get_team_template(team_name: str):
    """获取指定Team的模板"""
    try:
        template = await template_repository.load_template(team_name)
        
        if not template:
            raise HTTPException(status_code=404, detail=f"未找到Team模板: {team_name}")
        
        return template.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 获取模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions/{execution_id}")
async def get_execution_trace(execution_id: str):
    """获取执行追踪信息"""
    try:
        trace = execution_tracker.get_trace(execution_id)
        
        if not trace:
            raise HTTPException(status_code=404, detail=f"未找到执行追踪: {execution_id}")
        
        return {
            "execution_id": trace.execution_id,
            "session_id": trace.session_id,
            "team_name": trace.team_name,
            "template_id": trace.template_id,
            "query_text": trace.query_text,
            "status": trace.status,
            "start_time": trace.start_time,
            "end_time": trace.end_time,
            "total_duration_ms": trace.total_duration_ms,
            "agent_steps": [
                {
                    "agent_name": step.agent_name,
                    "action": step.action,
                    "status": step.status,
                    "duration_ms": step.duration_ms,
                    "confidence": step.confidence,
                    "error_message": step.error_message
                } for step in trace.agent_steps
            ],
            "performance_metrics": trace.performance_metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 获取执行追踪失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_system_statistics():
    """获取系统统计信息"""
    try:
        # 执行统计
        execution_stats = execution_tracker.get_execution_statistics()
        
        # Agent性能统计
        agent_stats = execution_tracker.get_agent_performance_stats()
        
        # Team实例统计
        team_manager = await get_singleton_team_manager()
        team_stats = await team_manager.get_team_statistics()
        
        return {
            "execution_statistics": execution_stats,
            "agent_performance": agent_stats,
            "team_instances": team_stats,
            "system_info": {
                "version": "team_v2",
                "timestamp": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 获取统计信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_team_instances(background_tasks: BackgroundTasks):
    """清理Team实例（管理接口）"""
    try:
        async def cleanup_task():
            team_manager = await get_singleton_team_manager()
            await team_manager.cleanup_all_teams()
            logger.info("[TEAM_V2_API] 手动清理所有Team实例完成")
        
        background_tasks.add_task(cleanup_task)
        
        return {
            "status": "cleanup_started",
            "message": "Team实例清理任务已启动"
        }
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 启动清理任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/teams/{team_name}/release/{session_id}")
async def release_team_instance(team_name: str, session_id: str):
    """释放指定的Team实例"""
    try:
        team_manager = await get_singleton_team_manager()
        await team_manager.release_team(team_name, session_id, force=True)
        
        return {
            "status": "released",
            "message": f"Team实例已释放: {team_name}_{session_id}"
        }
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 释放Team实例失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查各个组件状态
        team_manager = await get_singleton_team_manager()
        team_stats = await team_manager.get_team_statistics()
        
        execution_stats = execution_tracker.get_execution_statistics()
        
        return {
            "status": "healthy",
            "version": "team_v2",
            "timestamp": time.time(),
            "components": {
                "team_manager": {
                    "status": "healthy",
                    "active_instances": team_stats["total_instances"]
                },
                "execution_tracker": {
                    "status": "healthy", 
                    "active_executions": execution_stats["active_executions"]
                },
                "template_repository": {
                    "status": "healthy"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"[TEAM_V2_API] 健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }