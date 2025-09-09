"""
切分配置API端点 - 管理文档切分策略配置
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from core.logger import logger
from service.chunking_config_service import chunking_config_service

router = APIRouter()


class ChunkingConfigCreate(BaseModel):
    """创建切分配置请求"""
    name: str = Field(..., description="配置名称")
    description: Optional[str] = Field(None, description="配置描述")
    strategy: str = Field(..., description="切分策略")
    chunk_token_num: int = Field(..., description="最小token数")
    max_token_num: int = Field(..., description="最大token数")
    chunk_overlap: int = Field(..., description="重叠token数")
    delimiter: str = Field(..., description="分隔符")
    tokenizer_type: str = Field(..., description="分词器类型")
    preserve_structure: bool = Field(True, description="是否保留文档结构")
    semantic_threshold: int = Field(30, description="语义阈值")
    supported_formats: Optional[List[str]] = Field(None, description="支持的文件格式")
    scope: Optional[str] = Field('global', description="配置作用域: global 或 collection_specific")
    collection_id: Optional[str] = Field(None, description="知识库专属配置的归属知识库ID")


class ChunkingConfigUpdate(BaseModel):
    """更新切分配置请求"""
    name: Optional[str] = Field(None, description="配置名称")
    description: Optional[str] = Field(None, description="配置描述")
    strategy: Optional[str] = Field(None, description="切分策略")
    chunk_token_num: Optional[int] = Field(None, description="最小token数")
    max_token_num: Optional[int] = Field(None, description="最大token数")
    chunk_overlap: Optional[int] = Field(None, description="重叠token数")
    delimiter: Optional[str] = Field(None, description="分隔符")
    tokenizer_type: Optional[str] = Field(None, description="分词器类型")
    preserve_structure: Optional[bool] = Field(None, description="是否保留文档结构")
    semantic_threshold: Optional[int] = Field(None, description="语义阈值")
    supported_formats: Optional[List[str]] = Field(None, description="支持的文件格式")


@router.get("", response_model=Dict[str, Any])
async def get_chunking_configs(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    strategy: Optional[str] = Query(None, description="按策略过滤"),
    scope: Optional[str] = Query('global', description="作用域过滤: global 或 collection_specific"),
    collection_id: Optional[str] = Query(None, description="按知识库ID过滤（仅对collection_specific作用域有效）")
):
    """
    获取所有切分配置
    
    Returns:
        包含所有切分配置的响应
    """
    try:
        logger.info("获取切分配置列表")
        
        configs = await chunking_config_service.get_all_configs(
            skip=skip, 
            limit=limit, 
            strategy_filter=strategy,
            scope_filter=scope,
            collection_id_filter=collection_id
        )
        
        # 转换为前端需要的格式
        config_list = []
        for config in configs:
            config_dict = config.to_dict()
            # 添加前端兼容性字段
            config_dict.update({
                "chunkSize": config.chunk_token_num,
                "maxTokenNum": config.max_token_num,
                "chunkOverlap": config.chunk_overlap,
                "tokenizer": config.tokenizer_type,
                "separators": list(config.delimiter) if config.delimiter and config.delimiter.strip() else ["!?", "。", "！", "？"],
                "isDefault": config.is_default,
                "createdAt": config.created_at.isoformat() if config.created_at else None,
                "updatedAt": config.updated_at.isoformat() if config.updated_at else None
            })
            config_list.append(config_dict)
        
        return {
            "configs": config_list,
            "total": len(config_list)
        }
        
    except Exception as e:
        logger.error(f"获取切分配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")


@router.get("/default", response_model=Dict[str, Any])
async def get_default_chunking_config():
    """
    获取默认切分配置
    
    Returns:
        默认切分配置
    """
    try:
        config = await chunking_config_service.get_default_config()
        
        if not config:
            raise HTTPException(status_code=404, detail="未找到默认配置")
        
        logger.info(f"获取默认切分配置: {config.name}")
        
        # 转换为前端需要的格式
        config_dict = config.to_dict()
        config_dict.update({
            "chunkSize": config.chunk_token_num,
            "maxTokenNum": config.max_token_num,
            "chunkOverlap": config.chunk_overlap,
            "tokenizer": config.tokenizer_type,
            "separators": list(config.delimiter) if config.delimiter and config.delimiter.strip() else ["!?", "。", "！", "？"],
            "isDefault": config.is_default,
            "createdAt": config.created_at.isoformat() if config.created_at else None,
            "updatedAt": config.updated_at.isoformat() if config.updated_at else None
        })
        
        return config_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取默认切分配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取默认配置失败: {str(e)}")


@router.post("/initialize", response_model=Dict[str, Any])
async def initialize_default_configs():
    """
    初始化默认切分配置
    
    Returns:
        初始化结果
    """
    try:
        logger.info("初始化默认切分配置")
        
        configs = await chunking_config_service.initialize_default_configs()
        
        return {
            "message": "默认配置初始化成功",
            "configs_count": len(configs),
            "configs": [config.to_dict() for config in configs]
        }
        
    except Exception as e:
        logger.error(f"初始化默认配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"初始化失败: {str(e)}")


@router.post("", response_model=Dict[str, Any])
async def create_chunking_config(config_data: ChunkingConfigCreate):
    """
    创建新的切分配置
    
    Args:
        config_data: 配置数据
        
    Returns:
        创建的配置
    """
    try:
        logger.info(f"创建切分配置: {config_data.name}")
        
        config = await chunking_config_service.create_config(config_data.dict())
        
        return {
            "message": "配置创建成功",
            "config": config.to_dict()
        }
        
    except ValueError as e:
        logger.warning(f"创建配置参数错误: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建切分配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建配置失败: {str(e)}")


@router.put("/{config_id}", response_model=Dict[str, Any])
async def update_chunking_config(config_id: str, config_data: ChunkingConfigUpdate):
    """
    更新切分配置
    
    Args:
        config_id: 配置ID
        config_data: 更新数据
        
    Returns:
        更新的配置
    """
    try:
        logger.info(f"更新切分配置: {config_id}")
        
        # 过滤None值
        update_data = {k: v for k, v in config_data.dict().items() if v is not None}
        
        config = await chunking_config_service.update_config(config_id, update_data)
        
        if not config:
            raise HTTPException(status_code=404, detail="配置不存在")
        
        return {
            "message": "配置更新成功",
            "config": config.to_dict()
        }
        
    except ValueError as e:
        logger.warning(f"更新配置参数错误: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新切分配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新配置失败: {str(e)}")


@router.post("/set-default", response_model=Dict[str, Any])
async def set_default_config(request: Dict[str, str]):
    """
    设置默认配置
    
    Args:
        request: 包含config_id的请求
        
    Returns:
        设置结果
    """
    try:
        config_id = request.get("config_id")
        if not config_id:
            raise HTTPException(status_code=400, detail="缺少config_id参数")
        
        logger.info(f"设置默认切分配置: {config_id}")
        
        success = await chunking_config_service.set_default_config(config_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="配置不存在")
        
        return {
            "message": "默认配置设置成功",
            "config_id": config_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"设置默认配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"设置默认配置失败: {str(e)}")


@router.delete("/{config_id}", response_model=Dict[str, Any])
async def delete_chunking_config(config_id: str):
    """
    删除切分配置
    
    Args:
        config_id: 配置ID
        
    Returns:
        删除结果
    """
    try:
        logger.info(f"删除切分配置: {config_id}")
        
        success = await chunking_config_service.delete_config(config_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="配置不存在")
        
        return {
            "message": "配置删除成功",
            "config_id": config_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除切分配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除配置失败: {str(e)}")


@router.get("/presets", response_model=Dict[str, Any])
async def get_preset_configs():
    """
    获取预设配置模板
    
    Returns:
        预设配置列表
    """
    try:
        logger.info("获取预设配置模板")
        
        presets = await chunking_config_service.get_preset_configs()
        
        return {
            "presets": presets,
            "total": len(presets)
        }
        
    except Exception as e:
        logger.error(f"获取预设配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取预设配置失败: {str(e)}")


@router.get("/stats", response_model=Dict[str, Any])
async def get_config_stats():
    """
    获取配置统计信息
    
    Returns:
        统计信息
    """
    try:
        logger.info("获取配置统计信息")
        
        stats = await chunking_config_service.get_config_stats()
        
        return {
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"获取配置统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.get("/search", response_model=Dict[str, Any])
async def search_configs(keyword: str = Query(..., description="搜索关键词")):
    """
    搜索配置
    
    Args:
        keyword: 搜索关键词
        
    Returns:
        搜索结果
    """
    try:
        logger.info(f"搜索切分配置: {keyword}")
        
        configs = await chunking_config_service.search_configs(keyword)
        
        # 转换为前端需要的格式
        config_list = []
        for config in configs:
            config_dict = config.to_dict()
            config_dict.update({
                "chunkSize": config.chunk_token_num,
                "chunkOverlap": config.chunk_overlap,
                "tokenizer": config.tokenizer_type,
                "separators": list(config.delimiter) if config.delimiter and config.delimiter.strip() else ["!?", "。", "！", "？"],
                "isDefault": config.is_default,
                "createdAt": config.created_at.isoformat() if config.created_at else None,
                "updatedAt": config.updated_at.isoformat() if config.updated_at else None
            })
            config_list.append(config_dict)
        
        return {
            "configs": config_list,
            "total": len(config_list),
            "keyword": keyword
        }
        
    except Exception as e:
        logger.error(f"搜索配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")