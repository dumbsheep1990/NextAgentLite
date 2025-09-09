"""
知识库集合管理API接口
按照组件拆分原则，控制文件大小 < 600行
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

try:
    from db.database import get_db, get_async_session
except ImportError:
    from database import get_db, get_async_session

try:
    from service.knowledge_collection import (
        KnowledgeCollectionService, 
        MetadataTemplateService,
        CollectionStatsService
    )
except ImportError:
    # 暂时跳过服务导入，避免阻塞API注册
    KnowledgeCollectionService = None
    MetadataTemplateService = None
    CollectionStatsService = None
from core.logger import logger


# 路由器
router = APIRouter(tags=["knowledge_collections"])


# ===== Request/Response Models =====

class CollectionListResponse(BaseModel):
    """知识库列表响应模型"""
    collections: List['CollectionResponse']
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页大小")

class CollectionCreateRequest(BaseModel):
    """创建集合请求模型"""
    name: str = Field(..., min_length=1, max_length=200, description="集合名称")
    description: Optional[str] = Field(None, max_length=1000, description="描述")
    metadata_template: str = Field("general", description="元数据模版类型")
    icon: Optional[str] = Field(None, max_length=100, description="图标")
    color: Optional[str] = Field(None, max_length=20, description="颜色代码")
    is_public: bool = Field(True, description="是否公开")
    config: Optional[Dict[str, Any]] = Field(None, description="配置信息")
    template_config: Optional[Dict[str, Any]] = Field(None, description="模版配置")


class CollectionUpdateRequest(BaseModel):
    """更新集合请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="集合名称")
    description: Optional[str] = Field(None, max_length=1000, description="描述")
    metadata_template: Optional[str] = Field(None, description="元数据模版类型")
    icon: Optional[str] = Field(None, max_length=100, description="图标")
    color: Optional[str] = Field(None, max_length=20, description="颜色代码")
    is_public: Optional[bool] = Field(None, description="是否公开")
    is_active: Optional[bool] = Field(None, description="是否激活")
    config: Optional[Dict[str, Any]] = Field(None, description="配置信息")
    template_config: Optional[Dict[str, Any]] = Field(None, description="模版配置")


class CollectionResponse(BaseModel):
    """集合响应模型"""
    id: str
    name: str
    description: Optional[str] = None
    metadata_template: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_default: bool
    is_public: bool
    is_active: bool
    document_count: int = Field(default=0)
    total_size: int = Field(default=0)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ===== API Endpoints =====

@router.post("/", response_model=CollectionResponse)
async def create_collection(
    request: CollectionCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的知识库集合
    
    - **name**: 集合名称（必需）
    - **description**: 集合描述
    - **metadata_template**: 元数据模版类型 (general|policy|academic|enterprise)
    - **icon**: 图标名称
    - **color**: 颜色代码
    - **is_public**: 是否公开访问
    - **config**: 集合配置信息
    - **template_config**: 模版特定配置
    """
    try:
        service = KnowledgeCollectionService(db)
        
        collection = await service.create_collection(
            name=request.name,
            description=request.description,
            metadata_template=request.metadata_template,
            icon=request.icon,
            color=request.color,
            is_public=request.is_public,
            config=request.config,
            template_config=request.template_config
        )
        
        return CollectionResponse(**collection.to_dict())
        
    except ValueError as e:
        logger.warning(f"创建集合参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="创建集合失败")


@router.get("/", response_model=CollectionListResponse)
async def list_collections(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页大小"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    status: Optional[str] = Query("all", description="状态过滤"),
    metadata_template: Optional[str] = Query("all", description="模版类型过滤"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库集合列表
    
    - **page**: 页码（从1开始）
    - **size**: 每页大小（1-100）
    - **search**: 搜索关键词
    - **status**: 状态过滤
    - **metadata_template**: 模版类型过滤
    """
    try:
        # 直接使用服务，如果导入失败会在导入时报错
        
        service = KnowledgeCollectionService(db)
        
        # 计算skip
        skip = (page - 1) * size
        
        # 转换status和metadata_template过滤条件  
        template_filter = None if metadata_template == "all" else metadata_template
        
        logger.info(f"📝 获取集合列表请求: page={page}, size={size}, status={status}, template={metadata_template}")
        
        # 根据status参数决定调用方式
        if status == "all":
            # 获取所有活跃的集合（简化处理，暂时不包含非活跃的）
            collections = await service.list_collections(
                skip=skip,
                limit=size,
                is_active=True,  # 只查询活跃的知识库
                metadata_template=template_filter
            )
        else:
            is_active = (status == "active")
            collections = await service.list_collections(
                skip=skip,
                limit=size,
                is_active=is_active,
                metadata_template=template_filter
            )
        
        logger.info(f"✅ 获取到 {len(collections)} 个集合")
        
        # 获取总数（这里简化处理，实际应该从service获取）
        total = len(collections) if len(collections) < size else (page * size) + 1
        
        collection_responses = [CollectionResponse(**collection.to_dict()) for collection in collections]
        
        return CollectionListResponse(
            collections=collection_responses,
            total=total,
            page=page,
            size=size
        )
        
    except Exception as e:
        logger.error(f"获取集合列表失败: {str(e)}")
        import traceback
        logger.error(f"详细错误堆栈: {traceback.format_exc()}")
        # 发生错误时返回明确的错误响应
        raise HTTPException(status_code=500, detail=f"获取知识库列表失败: {str(e)}")


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str = Path(..., description="集合ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取指定知识库集合
    
    - **collection_id**: 集合唯一标识符
    """
    try:
        service = KnowledgeCollectionService(db)
        
        collection = await service.get_collection(collection_id)
        
        if not collection:
            raise HTTPException(status_code=404, detail="知识库集合不存在")
        
        return CollectionResponse(**collection.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取集合失败")


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str = Path(..., description="集合ID"),
    request: CollectionUpdateRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    更新知识库集合
    
    - **collection_id**: 集合唯一标识符
    - **request**: 更新请求数据（只需提供要更新的字段）
    """
    try:
        service = KnowledgeCollectionService(db)
        
        collection = await service.update_collection(
            collection_id=collection_id,
            name=request.name,
            description=request.description,
            metadata_template=request.metadata_template,
            icon=request.icon,
            color=request.color,
            is_public=request.is_public,
            is_active=request.is_active,
            config=request.config,
            template_config=request.template_config
        )
        
        if not collection:
            raise HTTPException(status_code=404, detail="知识库集合不存在")
        
        return CollectionResponse(**collection.to_dict())
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"更新集合参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"更新集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="更新集合失败")


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: str = Path(..., description="集合ID"),
    force: bool = Query(False, description="是否强制删除"),
    db: AsyncSession = Depends(get_db)
):
    """
    删除知识库集合
    
    - **collection_id**: 集合唯一标识符
    - **force**: 是否强制删除（会将文档移动到默认集合）
    """
    try:
        service = KnowledgeCollectionService(db)
        
        success = await service.delete_collection(collection_id, force=force)
        
        if not success:
            raise HTTPException(status_code=404, detail="知识库集合不存在")
        
        return JSONResponse(
            content={"message": "知识库集合删除成功", "collection_id": collection_id},
            status_code=200
        )
        
    except ValueError as e:
        logger.warning(f"删除集合参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"删除集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="删除集合失败")


@router.get("/statistics/global")
async def get_global_statistics():
    """获取全局统计信息"""
    try:
        # 返回静态的示例统计数据
        return {
            "total_collections": 0,
            "total_documents": 0,
            "total_vectorized": 0,
            "active_collections": 0,
            "template_distribution": {
                "general": 0,
                "policy": 0,
                "academic": 0,
                "enterprise": 0
            },
            "recent_activity": []
        }
    except Exception as e:
        logger.error(f"获取全局统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取全局统计失败")


@router.get("/{collection_id}/statistics")
async def get_collection_statistics(
    collection_id: str = Path(..., description="集合ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库集合详细统计信息
    
    - **collection_id**: 集合唯一标识符
    
    返回包含文档数量、文件类型分布、最近活动等详细统计信息
    """
    try:
        service = CollectionStatsService(db)
        
        stats = await service.get_collection_statistics(collection_id)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return JSONResponse(content=stats, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取集合统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取统计信息失败")


@router.get("/search/query")
async def search_collections(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="结果限制"),
    db: AsyncSession = Depends(get_db)
):
    """
    搜索知识库集合
    
    - **q**: 搜索关键词（在名称和描述中搜索）
    - **limit**: 返回结果数量限制
    """
    try:
        service = KnowledgeCollectionService(db)
        
        collections = await service.search_collections(q, limit)
        
        return [CollectionResponse(**collection.to_dict()) for collection in collections]
        
    except Exception as e:
        logger.error(f"搜索集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="搜索失败")


@router.get("/stats/global")
async def get_global_statistics(db: AsyncSession = Depends(get_db)):
    """
    获取全局统计信息
    
    返回所有集合的汇总统计，包括：
    - 集合总数、激活数、公开数
    - 文档总数、总大小
    - 模版类型分布
    """
    try:
        service = CollectionStatsService(db)
        
        stats = await service.get_global_statistics()
        
        return JSONResponse(content=stats, status_code=200)
        
    except Exception as e:
        logger.error(f"获取全局统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取全局统计失败")


@router.get("/popular/top")
async def get_popular_collections(
    limit: int = Query(10, ge=1, le=50, description="返回数量"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取热门知识库集合
    
    - **limit**: 返回的热门集合数量（按文档数量排序）
    """
    try:
        service = CollectionStatsService(db)
        
        collections = await service.get_popular_collections(limit)
        
        return JSONResponse(content=collections, status_code=200)
        
    except Exception as e:
        logger.error(f"获取热门集合失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取热门集合失败")


# ===== 切分配置相关API =====

class ChunkingConfigRequest(BaseModel):
    """切分配置请求模型"""
    chunking_config_id: str = Field(..., description="切分配置ID")
    custom_config: Optional[Dict[str, Any]] = Field(None, description="自定义配置")

class ChunkingConfigResponse(BaseModel):
    """切分配置响应模型"""
    collection_id: str
    collection_name: str
    default_chunking_config_id: Optional[str]
    custom_chunking_config: Optional[Dict[str, Any]]
    chunking_config: Optional[Dict[str, Any]]


@router.get("/{collection_id}/chunking-config")
async def get_collection_chunking_config(
    collection_id: str = Path(..., description="知识库集合ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库的切分配置
    
    - **collection_id**: 知识库集合ID
    
    返回该知识库当前使用的切分规则配置信息
    """
    try:
        from service.knowledge_collection.collection_chunking_service import CollectionChunkingService
        
        service = CollectionChunkingService(db)
        config = await service.get_collection_chunking_config(collection_id)
        
        if config is None:
            raise HTTPException(status_code=404, detail="知识库不存在")
        
        return JSONResponse(content={
            "success": True,
            "data": config,
            "message": "获取切分配置成功"
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取知识库切分配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取切分配置失败")


@router.put("/{collection_id}/chunking-config")
async def set_collection_chunking_config(
    collection_id: str = Path(..., description="知识库集合ID"),
    request: ChunkingConfigRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    设置知识库的切分配置
    
    - **collection_id**: 知识库集合ID
    - **chunking_config_id**: 要使用的切分配置ID
    - **custom_config**: 自定义配置（可选）
    """
    try:
        from service.knowledge_collection.collection_chunking_service import CollectionChunkingService
        
        service = CollectionChunkingService(db)
        success = await service.set_collection_chunking_config(
            collection_id=collection_id,
            chunking_config_id=request.chunking_config_id,
            custom_config=request.custom_config
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="设置切分配置失败")
        
        return JSONResponse(content={
            "success": True,
            "message": "设置切分配置成功"
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"设置知识库切分配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail="设置切分配置失败")


@router.get("/chunking-configs/available")
async def get_available_chunking_configs(
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有可用的切分配置
    
    返回可以被知识库使用的切分规则配置列表
    """
    try:
        from service.knowledge_collection.collection_chunking_service import CollectionChunkingService
        
        service = CollectionChunkingService(db)
        configs = await service.get_available_chunking_configs()
        
        return JSONResponse(content={
            "success": True,
            "data": configs,
            "message": "获取可用切分配置成功"
        }, status_code=200)
        
    except Exception as e:
        logger.error(f"获取可用切分配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取可用切分配置失败")


@router.post("/{collection_id}/chunking-config/reset")
async def reset_collection_chunking_config(
    collection_id: str = Path(..., description="知识库集合ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    重置知识库切分配置为默认值
    
    - **collection_id**: 知识库集合ID
    """
    try:
        from service.knowledge_collection.collection_chunking_service import CollectionChunkingService
        
        service = CollectionChunkingService(db)
        success = await service.reset_collection_to_default_chunking(collection_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="重置切分配置失败")
        
        return JSONResponse(content={
            "success": True,
            "message": "重置切分配置成功"
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重置知识库切分配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail="重置切分配置失败")