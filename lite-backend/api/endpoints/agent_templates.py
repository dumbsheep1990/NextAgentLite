"""
智能体模板API端点
提供智能体模板的查询、管理和配置接口
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from service.agent_template_service import agent_template_service
from core.logger import logger


# Pydantic模型
class AgentTemplateBase(BaseModel):
    """智能体模板基础模型"""
    template_code: str = Field(..., description="模板代码，唯一标识")
    template_name: str = Field(..., description="模板名称")
    template_type: str = Field(..., description="模板类型: single/team")
    category: Optional[str] = Field(None, description="分类")
    description: Optional[str] = Field(None, description="描述")
    icon: str = Field(default="RobotOutlined", description="图标")
    color: str = Field(default="#1890ff", description="颜色")


class AgentTemplateCreate(AgentTemplateBase):
    """创建智能体模板模型"""
    base_config_data: Dict[str, Any] = Field(default_factory=dict, description="基础配置", alias="base_config")
    model_config_data: Dict[str, Any] = Field(default_factory=dict, description="模型配置", alias="model_config")
    tools_config: List[str] = Field(default_factory=list, description="工具配置")
    team_members: Optional[List[Dict[str, Any]]] = Field(None, description="团队成员配置")
    team_mode: Optional[str] = Field(None, description="团队模式")


class AgentTemplateUpdate(BaseModel):
    """更新智能体模板模型"""
    template_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    base_config_data: Optional[Dict[str, Any]] = Field(None, alias="base_config")
    model_config_data: Optional[Dict[str, Any]] = Field(None, alias="model_config")
    tools_config: Optional[List[str]] = None
    team_members: Optional[List[Dict[str, Any]]] = None
    team_mode: Optional[str] = None
    is_active: Optional[bool] = None


class AgentTemplateResponse(BaseModel):
    """智能体模板响应模型"""
    id: str
    template_code: str
    template_name: str
    template_type: str
    category: Optional[str]
    description: Optional[str]
    icon: str
    color: str
    is_system: bool
    is_active: bool
    team_members: Optional[List[Dict[str, Any]]] = None
    team_mode: Optional[str] = None


# 创建路由
router = APIRouter(prefix="/agent-templates", tags=["智能体模板"])


@router.get("/list", response_model=List[AgentTemplateResponse])
async def list_agent_templates(
    template_type: Optional[str] = Query(None, description="模板类型: single/team"),
    category: Optional[str] = Query(None, description="分类"),
    is_active: bool = Query(True, description="是否只获取激活的模板")
):
    """
    获取智能体模板列表
    
    Args:
        template_type: 模板类型过滤
        category: 分类过滤
        is_active: 是否只获取激活的模板
    
    Returns:
        智能体模板列表
    """
    try:
        templates = await agent_template_service.get_all_templates(
            template_type=template_type,
            category=category,
            is_active=is_active
        )
        
        # 简化响应
        result = []
        for template in templates:
            result.append(AgentTemplateResponse(
                id=template['id'],
                template_code=template['template_code'],
                template_name=template['template_name'],
                template_type=template['template_type'],
                category=template.get('category'),
                description=template.get('description'),
                icon=template.get('icon', 'RobotOutlined'),
                color=template.get('color', '#1890ff'),
                is_system=template.get('is_system', False),
                is_active=template.get('is_active', True),
                team_members=template.get('team_members') if template['template_type'] == 'team' else None,
                team_mode=template.get('team_mode') if template['template_type'] == 'team' else None
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"获取智能体模板列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available")
async def get_available_agents():
    """
    获取可用的智能体列表（按类型分组）
    适用于前端选择器展示
    
    Returns:
        按类型分组的智能体列表
    """
    try:
        result = await agent_template_service.get_available_agents()
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"获取可用智能体失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{template_code}")
async def get_template_detail(template_code: str):
    """
    获取智能体模板详情
    
    Args:
        template_code: 模板代码
    
    Returns:
        模板详细信息
    """
    try:
        template = await agent_template_service.get_template_by_code(template_code)
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "data": template
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/{template_code}")
async def get_agent_config(template_code: str):
    """
    获取智能体配置（用于实例化）
    
    Args:
        template_code: 模板代码
    
    Returns:
        智能体完整配置
    """
    try:
        config = await agent_template_service.get_agent_config(template_code)
        if not config:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "data": config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取智能体配置失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_template(template_data: AgentTemplateCreate):
    """
    创建新的智能体模板
    
    Args:
        template_data: 模板数据
    
    Returns:
        创建的模板信息
    """
    try:
        # Convert model to dict with alias handling
        data = template_data.model_dump(by_alias=True)
        template = await agent_template_service.create_template(data)
        
        return {
            "status": "success",
            "message": "模板创建成功",
            "data": template
        }
    except Exception as e:
        logger.error(f"创建模板失败: {e}")
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="模板代码已存在")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update/{template_id}")
async def update_template(template_id: str, update_data: AgentTemplateUpdate):
    """
    更新智能体模板
    
    Args:
        template_id: 模板ID
        update_data: 更新数据
    
    Returns:
        更新后的模板信息
    """
    try:
        # Convert model to dict with alias handling
        data = update_data.model_dump(exclude_unset=True, by_alias=True)
        template = await agent_template_service.update_template(
            template_id, 
            data
        )
        
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "message": "模板更新成功",
            "data": template
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{template_id}")
async def delete_template(template_id: str):
    """
    删除智能体模板（仅非系统模板）
    
    Args:
        template_id: 模板ID
    
    Returns:
        删除结果
    """
    try:
        success = await agent_template_service.delete_template(template_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="无法删除系统模板或模板不存在")
        
        return {
            "status": "success",
            "message": "模板删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories():
    """
    获取所有分类
    
    Returns:
        分类列表
    """
    try:
        # 这里可以从数据库获取，目前返回预定义的分类
        categories = [
            {"code": "通用", "name": "通用", "icon": "🔧"},
            {"code": "分析", "name": "分析", "icon": "📊"},
            {"code": "检索", "name": "检索", "icon": "🔍"},
            {"code": "生成", "name": "生成", "icon": "✍️"},
            {"code": "工具", "name": "工具", "icon": "🛠️"},
            {"code": "专业", "name": "专业", "icon": "🎯"},
            {"code": "团队", "name": "团队", "icon": "👥"}
        ]
        
        return {
            "status": "success",
            "data": categories
        }
    except Exception as e:
        logger.error(f"获取分类失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))