"""
高级智能体团队问答API端点
基于Agno框架的完整Team功能
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import json
import uuid
import time
import os

from service.advanced_agent_team_service import advanced_agent_team_service, AdvancedAgentResponse
from core.logger import logger

router = APIRouter(prefix="/advanced-qa", tags=["高级智能体团队问答"])


class AdvancedQARequest(BaseModel):
    """高级Team问答请求"""
    query: str
    team_name: str = Field(default_factory=lambda: os.getenv('TEAM_DEFAULT_NAME', 'general_qa_team_v2'))
    session_id: Optional[str] = None
    stream: bool = False
    collection_id: Optional[str] = Field(None, description="知识库Collection ID（用于限制检索范围）")
    agent_configs: Optional[Dict[str, Dict[str, Any]]] = None  # 新增：智能体配置


class AdvancedQAResponse(BaseModel):
    """高级Team问答响应"""
    content: str
    agent_name: str
    model_used: str
    processing_time: float
    sources: Optional[List[Dict]] = None
    knowledge_sources: Optional[List[Dict]] = None
    knowledge_stats: Optional[Dict] = None
    translation_info: Optional[Dict] = None
    graph_info: Optional[Dict] = None
    decomposition_info: Optional[Dict] = None
    metadata: Optional[Dict] = None


class TeamStatusResponse(BaseModel):
    """Team状态响应"""
    session_id: str
    status: str
    start_time: float
    processing_time: Optional[float] = None
    progress: Optional[Dict] = None


class AgentConfigRequest(BaseModel):
    """智能体配置请求"""
    model_provider: Optional[str] = None
    model_id: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None


class AgentConfigResponse(BaseModel):
    """智能体配置响应"""
    agent_name: str
    current_config: Dict[str, Any]
    available_models: List[Dict[str, str]]
    instructions: str
    tools: List[str]


class TeamConfigResponse(BaseModel):
    """Team配置响应"""
    team_name: str
    agents: List[AgentConfigResponse]
    mode: str
    coordinator: str


@router.post("/query", response_model=AdvancedQAResponse)
async def advanced_qa_query(request: AdvancedQARequest):
    """
    高级Team问答查询 - 非流式
    
    Args:
        request: 查询请求
        
    Returns:
        高级Team问答响应
    """
    try:
        # 生成session_id（如果没有提供）
        session_id = request.session_id or str(uuid.uuid4())
        
        # 注册会话
        await advanced_agent_team_service.register_session(session_id)
        
        # 执行查询
        response = await advanced_agent_team_service.advanced_team_query(
            team_name=request.team_name,
            query=request.query,
            session_id=session_id,
            stream=False,
            agent_configs=request.agent_configs  # 传递智能体配置
        )
        
        if not response:
            raise HTTPException(status_code=500, detail="Team查询失败")
        
        # 清理会话
        await advanced_agent_team_service.cleanup_session(session_id)
        
        return AdvancedQAResponse(
            content=response.content,
            agent_name=response.agent_name,
            model_used=response.model_used,
            processing_time=response.processing_time,
            sources=response.sources,
            knowledge_sources=response.knowledge_sources,
            knowledge_stats=response.knowledge_stats,
            translation_info=response.translation_info,
            graph_info=response.graph_info,
            decomposition_info=response.decomposition_info,
            metadata=response.metadata
        )
        
    except Exception as e:
        logger.error(f"[API] 高级Team查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


@router.post("/query/stream")
async def advanced_qa_query_stream(request: AdvancedQARequest):
    """
    高级Team问答查询 - 流式
    
    Args:
        request: 查询请求
        
    Returns:
        流式响应
    """
    try:
        # 生成session_id（如果没有提供）
        session_id = request.session_id or str(uuid.uuid4())
        
        # 注册会话
        await advanced_agent_team_service.register_session(session_id)
        
        async def generate_stream():
            try:
                # 执行流式查询
                async for chunk in advanced_agent_team_service.advanced_team_query(
                    team_name=request.team_name,
                    query=request.query,
                    session_id=session_id,
                    stream=True,
                    agent_configs=request.agent_configs  # 传递智能体配置
                ):
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                
                # 发送结束信号
                yield f"data: {json.dumps({'type': 'end'}, ensure_ascii=False)}\n\n"
                
            except Exception as e:
                logger.error(f"[STREAM] 流式查询失败: {e}")
                error_chunk = {
                    "type": "error",
                    "data": {"error": str(e)}
                }
                yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
            finally:
                # 清理会话
                await advanced_agent_team_service.cleanup_session(session_id)
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"[API] 高级Team流式查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"流式查询失败: {str(e)}")


@router.get("/teams", response_model=List[str])
async def get_available_teams():
    """
    获取可用的高级Team列表
    
    Returns:
        可用的Team列表
    """
    try:
        teams = advanced_agent_team_service.get_available_teams()
        return teams
    except Exception as e:
        logger.error(f"[API] 获取Team列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Team列表失败: {str(e)}")


@router.get("/team/{team_name}/config", response_model=TeamConfigResponse)
async def get_team_config(team_name: str):
    """
    获取Team配置信息
    
    Args:
        team_name: Team名称
        
    Returns:
        Team配置信息
    """
    try:
        config = await advanced_agent_team_service.get_team_config(team_name)
        if config is None:
            raise HTTPException(status_code=404, detail="Team不存在")
        return config
    except Exception as e:
        logger.error(f"[API] 获取Team配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Team配置失败: {str(e)}")


@router.get("/agent/{agent_name}/config", response_model=AgentConfigResponse)
async def get_agent_config(agent_name: str):
    """
    获取智能体配置信息
    
    Args:
        agent_name: 智能体名称
        
    Returns:
        智能体配置信息
    """
    try:
        config = await advanced_agent_team_service.get_agent_config(agent_name)
        if config is None:
            raise HTTPException(status_code=404, detail="智能体不存在")
        return config
    except Exception as e:
        logger.error(f"[API] 获取智能体配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体配置失败: {str(e)}")


@router.put("/agent/{agent_name}/config")
async def update_agent_config(agent_name: str, config: AgentConfigRequest):
    """
    更新智能体配置
    
    Args:
        agent_name: 智能体名称
        config: 配置参数
        
    Returns:
        更新结果
    """
    try:
        result = await advanced_agent_team_service.update_agent_config(
            agent_name=agent_name,
            config=config.dict(exclude_unset=True)
        )
        if not result:
            raise HTTPException(status_code=404, detail="智能体不存在或配置更新失败")
        return {"message": "配置更新成功", "agent_name": agent_name}
    except Exception as e:
        logger.error(f"[API] 更新智能体配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新智能体配置失败: {str(e)}")


@router.get("/available-models")
async def get_available_models():
    """
    获取可用的模型列表
    
    Returns:
        可用模型列表
    """
    try:
        models = await advanced_agent_team_service.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"[API] 获取模型列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")


@router.get("/status/{session_id}", response_model=TeamStatusResponse)
async def get_team_status(session_id: str):
    """
    获取Team执行状态
    
    Args:
        session_id: 会话ID
        
    Returns:
        Team状态信息
    """
    try:
        # 检查会话是否存在
        if session_id not in advanced_agent_team_service.active_teams:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        session_info = advanced_agent_team_service.active_teams[session_id]
        
        return TeamStatusResponse(
            session_id=session_id,
            status=session_info["status"],
            start_time=session_info["start_time"],
            processing_time=time.time() - session_info["start_time"] if session_info["status"] == "active" else None,
            progress=session_info.get("progress")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] 获取Team状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Team状态失败: {str(e)}")


@router.post("/cancel/{session_id}")
async def cancel_team_execution(session_id: str):
    """
    取消Team执行
    
    Args:
        session_id: 会话ID
        
    Returns:
        取消结果
    """
    try:
        success = await advanced_agent_team_service.cancel_session(session_id)
        if success:
            return {"message": "Team执行已取消", "session_id": session_id}
        else:
            raise HTTPException(status_code=404, detail="会话不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] 取消Team执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消Team执行失败: {str(e)}")


@router.post("/cleanup/{session_id}")
async def cleanup_team_session(session_id: str):
    """
    清理Team会话
    
    Args:
        session_id: 会话ID
        
    Returns:
        清理结果
    """
    try:
        await advanced_agent_team_service.cleanup_session(session_id)
        return {"message": "Team会话已清理", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"[API] 清理Team会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理Team会话失败: {str(e)}")


@router.get("/health")
async def health_check():
    """
    健康检查
    
    Returns:
        服务状态
    """
    try:
        # 检查配置是否加载
        teams = advanced_agent_team_service.get_available_teams()
        
        return {
            "status": "healthy",
            "available_teams": len(teams),
            "active_sessions": len(advanced_agent_team_service.active_teams),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"[API] 健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=f"服务异常: {str(e)}") 