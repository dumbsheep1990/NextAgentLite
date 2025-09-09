"""
NextAgent Lite 团队模板API端点
提供团队模板管理的REST API接口
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import logging
from datetime import datetime

from service.team_template_service import team_template_service, TeamTemplate, TeamInstance
from core.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/v1/team-templates", tags=["团队模板管理"])

# Pydantic 模型定义
class TeamTemplateResponse(BaseModel):
    """团队模板响应模型"""
    template_id: str
    team_name: str
    execution_mode: str
    agent_sequence: List[Any]
    dependencies: Dict[str, List[str]]
    timeout_config: Dict[str, Any]
    retry_config: Dict[str, Any]
    is_active: bool
    version: str
    created_at: datetime
    updated_at: datetime

class AgentConfigResponse(BaseModel):
    """智能体配置响应模型"""
    agent_id: str
    name: str
    description: str
    model_provider: str
    model_id: str
    temperature: float
    max_tokens: int
    system_prompt: str
    is_active: bool

class TeamInstanceResponse(BaseModel):
    """团队实例响应模型"""
    instance_id: str
    template_id: str
    team_name: str
    execution_mode: str
    status: str
    created_at: datetime
    agents: Dict[str, AgentConfigResponse]

class CreateTeamInstanceRequest(BaseModel):
    """创建团队实例请求模型"""
    template_id: str = Field(..., description="团队模板ID")
    execution_mode: Optional[str] = Field(None, description="执行模式: direct_answer, knowledge_retrieval, graph_enhanced")

class ExecutionModeResponse(BaseModel):
    """执行模式响应模型"""
    available_modes: List[str]
    default_mode: str
    mode_descriptions: Dict[str, str]

@router.get("/", response_model=List[TeamTemplateResponse])
async def get_all_templates():
    """获取所有活跃的团队模板"""
    try:
        templates = await team_template_service.get_all_templates()
        
        response = []
        for template in templates:
            response.append(TeamTemplateResponse(
                template_id=template.template_id,
                team_name=template.team_name,
                execution_mode=template.execution_mode,
                agent_sequence=template.agent_sequence,
                dependencies=template.dependencies,
                timeout_config=template.timeout_config,
                retry_config=template.retry_config,
                is_active=template.is_active,
                version=template.version,
                created_at=template.created_at,
                updated_at=template.updated_at
            ))
        
        logger.info(f"返回 {len(response)} 个团队模板")
        return response
        
    except Exception as e:
        logger.error(f"获取团队模板列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取团队模板失败")

@router.get("/{template_id}", response_model=TeamTemplateResponse)
async def get_template(template_id: str):
    """获取特定的团队模板"""
    try:
        template = await team_template_service.get_template_by_id(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail=f"模板 {template_id} 不存在")
        
        return TeamTemplateResponse(
            template_id=template.template_id,
            team_name=template.team_name,
            execution_mode=template.execution_mode,
            agent_sequence=template.agent_sequence,
            dependencies=template.dependencies,
            timeout_config=template.timeout_config,
            retry_config=template.retry_config,
            is_active=template.is_active,
            version=template.version,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板 {template_id} 失败: {e}")
        raise HTTPException(status_code=500, detail="获取团队模板失败")

@router.get("/{template_id}/agents", response_model=Dict[str, AgentConfigResponse])
async def get_template_agents(template_id: str):
    """获取模板中的智能体配置"""
    try:
        template = await team_template_service.get_template_by_id(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail=f"模板 {template_id} 不存在")
        
        # 提取智能体ID
        agent_ids = team_template_service._extract_agent_ids(template.agent_sequence)
        
        # 获取智能体配置
        agent_configs = await team_template_service.get_agent_configs(agent_ids)
        
        response = {}
        for agent_id, config in agent_configs.items():
            response[agent_id] = AgentConfigResponse(
                agent_id=config.agent_id,
                name=config.name,
                description=config.description,
                model_provider=config.model_provider,
                model_id=config.model_id,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                system_prompt=config.system_prompt,
                is_active=config.is_active
            )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板智能体配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取智能体配置失败")

@router.post("/instances", response_model=TeamInstanceResponse)
async def create_team_instance(request: CreateTeamInstanceRequest):
    """创建团队实例"""
    try:
        instance = await team_template_service.create_team_instance(
            template_id=request.template_id,
            execution_mode=request.execution_mode
        )
        
        if not instance:
            raise HTTPException(status_code=400, detail="创建团队实例失败")
        
        # 转换智能体配置
        agents_response = {}
        for agent_id, config in instance.agents.items():
            agents_response[agent_id] = AgentConfigResponse(
                agent_id=config.agent_id,
                name=config.name,
                description=config.description,
                model_provider=config.model_provider,
                model_id=config.model_id,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                system_prompt=config.system_prompt,
                is_active=config.is_active
            )
        
        return TeamInstanceResponse(
            instance_id=instance.instance_id,
            template_id=instance.template_id,
            team_name=instance.team_name,
            execution_mode=instance.execution_mode,
            status=instance.status,
            created_at=instance.created_at,
            agents=agents_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建团队实例失败: {e}")
        raise HTTPException(status_code=500, detail="创建团队实例失败")

@router.get("/instances/{instance_key}", response_model=TeamInstanceResponse)
async def get_team_instance(instance_key: str):
    """获取团队实例"""
    try:
        instance = await team_template_service.get_team_instance(instance_key)
        
        if not instance:
            raise HTTPException(status_code=404, detail=f"实例 {instance_key} 不存在")
        
        # 转换智能体配置
        agents_response = {}
        for agent_id, config in instance.agents.items():
            agents_response[agent_id] = AgentConfigResponse(
                agent_id=config.agent_id,
                name=config.name,
                description=config.description,
                model_provider=config.model_provider,
                model_id=config.model_id,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                system_prompt=config.system_prompt,
                is_active=config.is_active
            )
        
        return TeamInstanceResponse(
            instance_id=instance.instance_id,
            template_id=instance.template_id,
            team_name=instance.team_name,
            execution_mode=instance.execution_mode,
            status=instance.status,
            created_at=instance.created_at,
            agents=agents_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取团队实例失败: {e}")
        raise HTTPException(status_code=500, detail="获取团队实例失败")

@router.get("/execution-modes", response_model=ExecutionModeResponse)
async def get_execution_modes():
    """获取可用的执行模式"""
    try:
        available_modes = await team_template_service.get_available_execution_modes()
        default_mode = await team_template_service.get_default_execution_mode()
        
        mode_descriptions = {
            "direct_answer": "直接回答模式 - 适用于简单问候、常识性问题，无需调用检索服务",
            "knowledge_retrieval": "知识库检索模式 - 适用于具体政策条款查询，调用知识库检索",
            "graph_enhanced": "图谱增强模式 - 适用于复杂政策关系分析，同时调用知识库和知识图谱检索"
        }
        
        return ExecutionModeResponse(
            available_modes=available_modes,
            default_mode=default_mode,
            mode_descriptions=mode_descriptions
        )
        
    except Exception as e:
        logger.error(f"获取执行模式失败: {e}")
        raise HTTPException(status_code=500, detail="获取执行模式失败")

@router.post("/cleanup")
async def cleanup_instances():
    """清理已完成的团队实例"""
    try:
        await team_template_service.cleanup_completed_instances()
        return {"message": "实例清理完成"}
        
    except Exception as e:
        logger.error(f"清理实例失败: {e}")
        raise HTTPException(status_code=500, detail="清理实例失败")

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        templates = await team_template_service.get_all_templates()
        instance_count = len(team_template_service._instances_cache)
        
        return {
            "status": "healthy",
            "templates_count": len(templates),
            "active_instances": instance_count,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }