"""
对话配置API端点 - 支持前端对话设置参数
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import json
from pathlib import Path

from core.logger import logger

router = APIRouter()


class ModelParameters(BaseModel):
    """模型参数配置"""
    temperature: float = Field(0.7, description="创造性温度", ge=0.0, le=2.0)
    max_tokens: int = Field(2000, description="最大回复长度", ge=100, le=8192)
    top_p: Optional[float] = Field(0.95, description="Top-p采样", ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, description="Top-k采样", ge=1, le=100)
    presence_penalty: Optional[float] = Field(0.0, description="存在惩罚", ge=-2.0, le=2.0)
    frequency_penalty: Optional[float] = Field(0.0, description="频率惩罚", ge=-2.0, le=2.0)


class ConversationManagement(BaseModel):
    """对话管理配置"""
    max_conversation_turns: int = Field(20, description="最大对话轮次", ge=1, le=100)
    enable_streaming: bool = Field(True, description="启用流式输出")
    enable_context_memory: bool = Field(True, description="启用上下文记忆")
    context_window_size: int = Field(10, description="上下文窗口大小", ge=1, le=50)
    auto_save_conversation: bool = Field(True, description="自动保存对话")


class QuickPreset(BaseModel):
    """快速预设配置"""
    name: str = Field(..., description="预设名称")
    display_name: str = Field(..., description="显示名称")
    description: str = Field(..., description="预设描述")
    model_params: ModelParameters = Field(..., description="模型参数")
    conversation_params: ConversationManagement = Field(..., description="对话管理参数")
    agent_settings: Dict[str, Any] = Field(default_factory=dict, description="智能体设置")


class ConversationConfig(BaseModel):
    """完整对话配置"""
    model_params: ModelParameters = Field(default_factory=ModelParameters, description="模型参数")
    conversation_management: ConversationManagement = Field(default_factory=ConversationManagement, description="对话管理")
    quick_presets: List[QuickPreset] = Field(default_factory=list, description="快速预设")
    current_preset: Optional[str] = Field("balanced", description="当前预设")
    custom_system_prompt: Optional[str] = Field(None, description="自定义系统提示")


class ConversationConfigUpdate(BaseModel):
    """对话配置更新模型"""
    model_params: Optional[ModelParameters] = None
    conversation_management: Optional[ConversationManagement] = None
    current_preset: Optional[str] = None
    custom_system_prompt: Optional[str] = None


def get_default_presets() -> List[QuickPreset]:
    """获取默认快速预设"""
    return [
        QuickPreset(
            name="professional",
            display_name="专业模式", 
            description="精确回答",
            model_params=ModelParameters(
                temperature=0.3,
                max_tokens=2000,
                top_p=0.9
            ),
            conversation_params=ConversationManagement(
                max_conversation_turns=15,
                enable_streaming=True,
                enable_context_memory=True,
                context_window_size=8
            ),
            agent_settings={
                "preferred_agents": ["geopolymer_expert", "material_scientist"],
                "use_domain_vector": True,
                "enable_detailed_sources": True
            }
        ),
        QuickPreset(
            name="balanced",
            display_name="平衡模式",
            description="均衡回答", 
            model_params=ModelParameters(
                temperature=0.7,
                max_tokens=2000,
                top_p=0.95
            ),
            conversation_params=ConversationManagement(
                max_conversation_turns=20,
                enable_streaming=True,
                enable_context_memory=True,
                context_window_size=10
            ),
            agent_settings={
                "preferred_agents": ["qa_team", "geopolymer_qa_team"],
                "use_dual_vector": True,
                "balance_creativity_accuracy": True
            }
        ),
        QuickPreset(
            name="creative",
            display_name="创造模式",
            description="创意回答",
            model_params=ModelParameters(
                temperature=1.0,
                max_tokens=2500,
                top_p=0.98
            ),
            conversation_params=ConversationManagement(
                max_conversation_turns=25,
                enable_streaming=True,
                enable_context_memory=True,
                context_window_size=12
            ),
            agent_settings={
                "preferred_agents": ["creative_assistant", "brainstorm_team"],
                "use_general_vector": True,
                "encourage_exploration": True,
                "enable_analogies": True
            }
        )
    ]


def get_config_path(user_id: str = "default") -> Path:
    """获取对话配置文件路径"""
    config_dir = Path("config/conversation_configs")
    config_dir.mkdir(parents=True, exist_ok=True)
    return config_dir / f"{user_id}_conversation.json"


def load_conversation_config(user_id: str = "default") -> ConversationConfig:
    """加载对话配置"""
    config_path = get_config_path(user_id)
    
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            # 确保包含默认预设
            config = ConversationConfig(**config_data)
            if not config.quick_presets:
                config.quick_presets = get_default_presets()
            
            return config
        except Exception as e:
            logger.warning(f"加载对话配置失败，使用默认设置: {e}")
    
    # 返回带有默认预设的配置
    config = ConversationConfig()
    config.quick_presets = get_default_presets()
    return config


def save_conversation_config(config: ConversationConfig, user_id: str = "default") -> None:
    """保存对话配置"""
    config_path = get_config_path(user_id)
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config.dict(), f, ensure_ascii=False, indent=2)


@router.get("/config")
async def get_conversation_config(user_id: str = "default"):
    """获取对话配置"""
    try:
        config = load_conversation_config(user_id)
        
        return {
            "success": True,
            "data": config.dict(),
            "message": "获取对话配置成功"
        }
        
    except Exception as e:
        logger.error(f"获取对话配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取对话配置失败")


@router.put("/config")
async def update_conversation_config(
    config_update: ConversationConfigUpdate,
    user_id: str = "default"
):
    """更新对话配置"""
    try:
        # 加载当前配置
        current_config = load_conversation_config(user_id)
        
        # 更新配置
        update_data = config_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(current_config, key):
                setattr(current_config, key, value)
        
        # 保存配置
        save_conversation_config(current_config, user_id)
        
        return {
            "success": True,
            "data": current_config.dict(),
            "message": "对话配置更新成功"
        }
        
    except Exception as e:
        logger.error(f"更新对话配置失败: {e}")
        raise HTTPException(status_code=500, detail="对话配置更新失败")


@router.post("/config/apply-preset")
async def apply_preset(
    preset_name: str,
    user_id: str = "default"
):
    """应用快速预设"""
    try:
        # 加载当前配置
        config = load_conversation_config(user_id)
        
        # 查找预设
        preset = None
        for p in config.quick_presets:
            if p.name == preset_name:
                preset = p
                break
        
        if not preset:
            raise HTTPException(status_code=404, detail=f"预设 '{preset_name}' 不存在")
        
        # 应用预设
        config.model_params = preset.model_params
        config.conversation_management = preset.conversation_params
        config.current_preset = preset_name
        
        # 保存配置
        save_conversation_config(config, user_id)
        
        return {
            "success": True,
            "data": {
                "applied_preset": preset.dict(),
                "current_config": config.dict()
            },
            "message": f"已应用预设: {preset.display_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"应用预设失败: {e}")
        raise HTTPException(status_code=500, detail="应用预设失败")


@router.get("/presets")
async def get_available_presets(user_id: str = "default"):
    """获取可用的快速预设"""
    try:
        config = load_conversation_config(user_id)
        
        return {
            "success": True,
            "data": {
                "presets": [p.dict() for p in config.quick_presets],
                "current_preset": config.current_preset
            },
            "message": "获取预设列表成功"
        }
        
    except Exception as e:
        logger.error(f"获取预设列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取预设列表失败")


@router.post("/presets")
async def create_custom_preset(
    preset: QuickPreset,
    user_id: str = "default"
):
    """创建自定义预设"""
    try:
        # 加载当前配置
        config = load_conversation_config(user_id)
        
        # 检查是否存在同名预设
        for existing_preset in config.quick_presets:
            if existing_preset.name == preset.name:
                raise HTTPException(status_code=400, detail="预设名称已存在")
        
        # 添加新预设
        config.quick_presets.append(preset)
        
        # 保存配置
        save_conversation_config(config, user_id)
        
        return {
            "success": True,
            "data": preset.dict(),
            "message": f"自定义预设 '{preset.display_name}' 创建成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建自定义预设失败: {e}")
        raise HTTPException(status_code=500, detail="创建预设失败")


@router.delete("/presets/{preset_name}")
async def delete_preset(
    preset_name: str,
    user_id: str = "default"
):
    """删除预设（仅自定义预设）"""
    try:
        # 加载当前配置
        config = load_conversation_config(user_id)
        
        # 不允许删除默认预设
        default_preset_names = {"professional", "balanced", "creative"}
        if preset_name in default_preset_names:
            raise HTTPException(status_code=400, detail="不能删除默认预设")
        
        # 查找并删除预设
        original_count = len(config.quick_presets)
        config.quick_presets = [p for p in config.quick_presets if p.name != preset_name]
        
        if len(config.quick_presets) == original_count:
            raise HTTPException(status_code=404, detail="预设不存在")
        
        # 如果删除的是当前预设，重置为默认
        if config.current_preset == preset_name:
            config.current_preset = "balanced"
        
        # 保存配置
        save_conversation_config(config, user_id)
        
        return {
            "success": True,
            "message": f"预设 '{preset_name}' 删除成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除预设失败: {e}")
        raise HTTPException(status_code=500, detail="删除预设失败")


@router.post("/config/reset")
async def reset_conversation_config(user_id: str = "default"):
    """重置对话配置为默认值"""
    try:
        default_config = ConversationConfig()
        default_config.quick_presets = get_default_presets()
        save_conversation_config(default_config, user_id)
        
        return {
            "success": True,
            "data": default_config.dict(),
            "message": "对话配置已重置为默认值"
        }
        
    except Exception as e:
        logger.error(f"重置对话配置失败: {e}")
        raise HTTPException(status_code=500, detail="配置重置失败")


@router.get("/config/validate")
async def validate_config(user_id: str = "default"):
    """验证对话配置有效性"""
    try:
        config = load_conversation_config(user_id)
        
        # 验证模型参数
        issues = []
        model_params = config.model_params
        
        if model_params.temperature < 0 or model_params.temperature > 2:
            issues.append("温度参数超出有效范围 (0-2)")
        
        if model_params.max_tokens < 100 or model_params.max_tokens > 8192:
            issues.append("最大tokens超出有效范围 (100-8192)")
        
        # 验证对话管理参数
        conv_params = config.conversation_management
        if conv_params.max_conversation_turns < 1 or conv_params.max_conversation_turns > 100:
            issues.append("最大对话轮次超出有效范围 (1-100)")
        
        if conv_params.context_window_size < 1 or conv_params.context_window_size > 50:
            issues.append("上下文窗口大小超出有效范围 (1-50)")
        
        # 验证当前预设是否存在
        if config.current_preset:
            preset_names = [p.name for p in config.quick_presets]
            if config.current_preset not in preset_names:
                issues.append(f"当前预设 '{config.current_preset}' 不存在")
        
        return {
            "success": True,
            "data": {
                "is_valid": len(issues) == 0,
                "issues": issues,
                "config": config.dict()
            },
            "message": "配置验证完成"
        }
        
    except Exception as e:
        logger.error(f"验证配置失败: {e}")
        raise HTTPException(status_code=500, detail="配置验证失败")