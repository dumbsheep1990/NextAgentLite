"""
知识库配置端点 - 从knowledge.py安全拆分出来的配置管理功能
包含向量配置、模型配置、双向量配置等独立配置功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from datetime import datetime
from pydantic import BaseModel

from core.logger import logger

# 本地定义模型类（避免循环导入）
class VectorConfig(BaseModel):
    """向量化配置模型"""
    id: str
    name: str
    model: str
    dimension: int
    chunkSize: int
    chunkOverlap: int
    strategy: str
    isDefault: bool

class ModelConfig(BaseModel):
    """模型配置模型"""
    id: str
    name: str
    type: str
    provider: str
    model: str
    apiKey: Optional[str] = None
    baseUrl: Optional[str] = None
    parameters: Dict[str, Any]
    isActive: bool

# 创建独立的路由器
config_router = APIRouter()

@config_router.get("/config/vector", response_model=VectorConfig)
async def get_vector_config():
    """获取向量化配置"""
    try:
        # 返回默认配置
        return VectorConfig(
            id="default",
            name="默认向量配置",
            model="text-embedding-v4",
            dimension=1024,
            chunkSize=512,
            chunkOverlap=50,
            strategy="sentence",
            isDefault=True
        )
        
    except Exception as e:
        logger.error(f"获取向量配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取向量配置失败: {str(e)}")


@config_router.put("/config/vector", response_model=VectorConfig)
async def update_vector_config(config: Dict[str, Any]):
    """更新向量化配置"""
    try:
        # 这里应该保存配置到数据库或配置文件
        logger.info(f"更新向量配置: {config}")
        
        return VectorConfig(
            id="default",
            name=config.get("name", "默认向量配置"),
            model=config.get("model", "text-embedding-v4"),
            dimension=config.get("dimension", 1024),
            chunkSize=config.get("chunkSize", 512),
            chunkOverlap=config.get("chunkOverlap", 50),
            strategy=config.get("strategy", "sentence"),
            isDefault=True
        )
        
    except Exception as e:
        logger.error(f"更新向量配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新向量配置失败: {str(e)}")


@config_router.get("/config/models", response_model=List[ModelConfig])
async def get_model_configs():
    """获取模型配置列表"""
    try:
        # 返回预设的模型配置
        configs = [
            ModelConfig(
                id="embedding_ali",
                name="阿里云文本嵌入模型",
                type="embedding",
                provider="alibaba",
                model="text-embedding-v4",
                parameters={"dimension": 1024, "batch_size": 16},
                isActive=True
            ),
            ModelConfig(
                id="chat_qwen",
                name="通义千问聊天模型",
                type="chat",
                provider="alibaba",
                model="qwen2.5-72b-instruct",
                parameters={"max_tokens": 4096, "temperature": 0.7},
                isActive=True
            ),
            ModelConfig(
                id="reasoning_gemini",
                name="Gemini推理模型",
                type="reasoning",
                provider="google",
                model="gemini-2.0-flash-thinking-exp",
                parameters={"max_tokens": 8192, "temperature": 0.3},
                isActive=False
            ),
            ModelConfig(
                id="embedding_domain",
                name="领域专用嵌入模型",
                type="embedding",
                provider="custom",
                model="matbert-base",
                parameters={"dimension": 768, "domain": "materials"},
                isActive=True
            )
        ]
        
        logger.info(f"返回 {len(configs)} 个模型配置")
        return configs
        
    except Exception as e:
        logger.error(f"获取模型配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型配置失败: {str(e)}")


@config_router.post("/config/models", response_model=ModelConfig)
async def create_model_config(config: Dict[str, Any]):
    """创建新的模型配置"""
    try:
        logger.info(f"创建模型配置: {config}")
        
        # 生成新的配置ID
        config_id = f"custom_{int(datetime.utcnow().timestamp())}"
        
        new_config = ModelConfig(
            id=config_id,
            name=config.get("name", "自定义模型"),
            type=config.get("type", "embedding"),
            provider=config.get("provider", "custom"),
            model=config.get("model", ""),
            parameters=config.get("parameters", {}),
            isActive=config.get("isActive", False)
        )
        
        # 这里应该保存到数据库
        logger.info(f"模型配置创建成功: {config_id}")
        return new_config
        
    except Exception as e:
        logger.error(f"创建模型配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建模型配置失败: {str(e)}")


@config_router.get("/config/vectorization")
async def get_vectorization_config():
    """获取向量化配置"""
    try:
        config = {
            "mode": "auto",  # auto, manual, disabled
            "batchSize": 10,
            "concurrency": 3,
            "retryAttempts": 3,
            "embedding": {
                "model": "text-embedding-v4",
                "dimension": 1024,
                "enabled": True
            },
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        logger.info("返回向量化配置")
        return config
        
    except Exception as e:
        logger.error(f"获取向量化配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取向量化配置失败: {str(e)}")


@config_router.put("/config/vectorization/mode")
async def update_vectorization_mode(request: Dict[str, Any]):
    """更新向量化模式"""
    try:
        mode = request.get("mode", "auto")
        if mode not in ["auto", "manual", "disabled"]:
            raise HTTPException(status_code=400, detail="无效的向量化模式")
        
        logger.info(f"更新向量化模式: {mode}")
        
        return {
            "mode": mode,
            "updated": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"更新向量化模式失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新向量化模式失败: {str(e)}")


