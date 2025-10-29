"""
知识库集合管理API接口
按照组件拆分原则，控制文件大小 < 600行
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func, and_
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
from models.knowledge_collection import KnowledgeCollection, MetadataTemplate
from sqlalchemy import select


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
    vectorized_count: int = Field(default=0)
    total_size: int = Field(default=0)
    # QA提取相关字段
    auto_qa_extraction_enabled: bool = Field(default=False, description="是否启用自动QA提取")
    qa_extraction_config: Optional[Dict[str, Any]] = Field(None, description="QA提取配置")
    qa_extraction_last_run: Optional[str] = Field(None, description="最后执行QA提取的时间")
    qa_extraction_total_pairs: int = Field(default=0, description="总QA对数量")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MetadataExtractionRunRequest(BaseModel):
    """批量元数据提取请求"""
    only_pending: bool = Field(True, description="仅处理待处理/失败的文档")
    limit: Optional[int] = Field(None, description="最大处理数量")

class MetadataExtractionRunResponse(BaseModel):
    collection_id: str
    total: int
    processed: int
    success: int
    failed: int
    details: Optional[list] = None


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
    size: int = Query(10, ge=1, le=10000, description="每页大小"),
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
            # 获取所有集合（包含活跃与非活跃）
            collections = await service.list_collections(
                skip=skip,
                limit=size,
                is_active=None,
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
        
        # 为确保统计准确，这里再次将动态聚合结果覆盖到响应字典后再序列化
        collection_responses: List[CollectionResponse] = []
        try:
            # 动态统计（与服务层一致），避免使用未刷新持久化字段
            from models.knowledge import KnowledgeDocument as _KD
            ids = [c.id for c in collections]
            doc_map = {}
            vec_map = {}
            if ids:
                doc_counts_res = await db.execute(
                    select(_KD.collection_id, func.count())
                    .where(_KD.collection_id.in_(ids))
                    .group_by(_KD.collection_id)
                )
                doc_map = {row[0]: int(row[1]) for row in doc_counts_res.fetchall()}

                vec_counts_res = await db.execute(
                    select(_KD.collection_id, func.count())
                    .where(and_(_KD.collection_id.in_(ids), _KD.status.in_(['vectorized', 'completed'])))
                    .group_by(_KD.collection_id)
                )
                vec_map = {row[0]: int(row[1]) for row in vec_counts_res.fetchall()}

            for c in collections:
                d = c.to_dict()
                # 覆盖统计字段
                if ids:
                    d['document_count'] = doc_map.get(c.id, 0)
                    d['vectorized_count'] = vec_map.get(c.id, 0)
                # 兜底状态字段
                if 'status' not in d or not d['status']:
                    d['status'] = 'active' if getattr(c, 'is_active', True) else 'inactive'
                collection_responses.append(CollectionResponse(**d))
        except Exception:
            # 回退：直接序列化
            collection_responses = [CollectionResponse(**c.to_dict()) for c in collections]
        
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


@router.post("/{collection_id}/metadata-extraction/run", response_model=MetadataExtractionRunResponse)
async def run_metadata_extraction(
    collection_id: str = Path(..., description="知识库ID"),
    request: MetadataExtractionRunRequest = MetadataExtractionRunRequest(),
    db: AsyncSession = Depends(get_db)
):
    """
    对指定知识库内的文档批量执行“场景化元数据提取”。
    - only_pending=True：仅处理 pending/failed 的文档
    - limit：限制最大处理数量
    """
    try:
        # 检查集合是否存在
        service = KnowledgeCollectionService(db)
        collection = await service.get_collection(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="知识库不存在")

        from service.knowledge_service import knowledge_service
        result = await knowledge_service.bulk_extract_metadata_for_collection(
            collection_id=collection_id,
            only_pending=request.only_pending,
            limit=request.limit
        )

        if result.get('error'):
            logger.error(f"批量元数据提取失败: {result['error']}")
            raise HTTPException(status_code=500, detail=f"批量元数据提取失败: {result['error']}")

        return MetadataExtractionRunResponse(
            collection_id=collection_id,
            total=result.get('total', 0),
            processed=result.get('processed', 0),
            success=result.get('success', 0),
            failed=result.get('failed', 0),
            details=result.get('details', [])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量元数据提取异常: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量元数据提取异常: {str(e)}")


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


@router.get("/{collection_id}/scenario-filters")
async def get_scenario_filters(
    collection_id: str = Path(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    返回知识库所属场景（metadata_template）对应的专属元数据过滤字段定义，
    以及通用过滤器说明。用于前端“高级配置”渲染场景专属过滤UI。
    """
    try:
        result = await db.execute(select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id))
        collection = result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="知识库不存在")

        template = (collection.metadata_template or 'general').lower()
        # 兼容：此前模板类型为 enterprise（企业），按需求作为“教育”场景处理
        alias_template = 'education' if template in ('education', 'enterprise') else template

        # 优先从元数据模板（MetadataTemplate.search_config）读取定义
        try:
            result_tpl = await db.execute(
                select(MetadataTemplate)
                .where(MetadataTemplate.template_type == alias_template)
                .where(MetadataTemplate.is_active == True)  # noqa: E712
            )
            mt: MetadataTemplate | None = result_tpl.scalars().first()
            if mt and mt.search_config:
                sc = mt.search_config or {}
                fields = sc.get('fields') or []
                generic = sc.get('generic') or []
                # 规范化：确保每项包含 key/label/type/ops
                def _norm(items):
                    out = []
                    for it in items:
                        if not isinstance(it, dict):
                            continue
                        k = it.get('key')
                        if not k:
                            continue
                        out.append({
                            'key': k,
                            'label': it.get('label') or k,
                            'type': it.get('type') or 'string',
                            'ops': it.get('ops') or ['=']
                        })
                    return out
                fields = _norm(fields)
                generic = _norm(generic)
                return {
                    'collection_id': collection_id,
                    'template': alias_template,
                    'fields': fields,
                    'generic': generic,
                    'source': 'metadata_template.search_config'
                }
        except Exception as _:
            # 忽略模板读取错误，回退到内置映射
            pass

        # 回退：内置场景映射
        scenario_map = {
            'policy': [
                { 'key': 'policy_level', 'label': '政策级别', 'type': 'string', 'ops': ['=','!=','in'] },
                { 'key': 'domain_type', 'label': '领域类型', 'type': 'string', 'ops': ['=','!=','in','contains'] },
                { 'key': 'effective_date', 'label': '生效日期', 'type': 'date', 'ops': ['>','>=','<','<='] },
                { 'key': 'expiry_date', 'label': '失效日期', 'type': 'date', 'ops': ['>','>=','<','<='] },
            ],
            'academic': [
                { 'key': 'journal', 'label': '期刊', 'type': 'string', 'ops': ['=','!=','in','contains'] },
                { 'key': 'year', 'label': '年份', 'type': 'number', 'ops': ['=','>','>=','<','<='] },
                { 'key': 'authors', 'label': '作者', 'type': 'string', 'ops': ['in','contains'] },
                { 'key': 'keywords', 'label': '关键词', 'type': 'string', 'ops': ['in','contains'] },
            ],
            'education': [
                { 'key': 'subject', 'label': '学科', 'type': 'string', 'ops': ['=','!=','in','contains'] },
                { 'key': 'grade', 'label': '年级/层次', 'type': 'string', 'ops': ['=','!=','in'] },
                { 'key': 'course', 'label': '课程', 'type': 'string', 'ops': ['=','!=','in','contains'] },
                { 'key': 'institution', 'label': '机构/院校', 'type': 'string', 'ops': ['=','!=','in','contains'] },
            ],
            'general': [
                { 'key': 'tags', 'label': '标签', 'type': 'string', 'ops': ['in','contains'] },
                { 'key': 'created_at', 'label': '创建时间', 'type': 'date', 'ops': ['>','>=','<','<='] },
                { 'key': 'source', 'label': '来源', 'type': 'string', 'ops': ['=','!=','in'] },
            ]
        }

        fields = scenario_map.get(alias_template, scenario_map['general'])
        return {
            'collection_id': collection_id,
            'template': alias_template,
            'fields': fields,
            'generic': [
                { 'key': 'keywords', 'label': '关键词', 'type': 'string', 'ops': ['in','contains'] },
                { 'key': 'title', 'label': '标题', 'type': 'string', 'ops': ['contains'] }
            ],
            'source': 'built_in'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取场景过滤字段失败: {e}")
        raise HTTPException(status_code=500, detail="获取场景过滤字段失败")


@router.get("/{collection_id}/metadata-tags")
async def get_collection_metadata_tags(
    collection_id: str = Path(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库中文档的元数据标签列表

    从文档的structured_metadata中提取所有出现过的字段和值，
    用于前端"标签过滤"功能的动态加载。

    返回格式:
    {
        "keywords": ["关键词1", "关键词2", ...],
        "tags": ["标签1", "标签2", ...],
        "policy_category": ["税收", "社保", ...],
        ...
    }
    """
    try:
        from models.knowledge import KnowledgeDocument

        # 检查集合是否存在
        result = await db.execute(select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id))
        collection = result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="知识库不存在")

        # 查询集合中所有有structured_metadata的文档
        docs_result = await db.execute(
            select(KnowledgeDocument.structured_metadata)
            .where(KnowledgeDocument.collection_id == collection_id)
            .where(KnowledgeDocument.structured_metadata.isnot(None))
        )

        # 聚合所有元数据字段的值
        metadata_tags = {}
        for (metadata,) in docs_result:
            if not metadata or not isinstance(metadata, dict):
                continue

            for key, value in metadata.items():
                if key not in metadata_tags:
                    metadata_tags[key] = set()

                # 处理不同类型的值
                if isinstance(value, list):
                    # 列表类型(如keywords, tags)
                    for item in value:
                        if isinstance(item, str) and item.strip():
                            metadata_tags[key].add(item.strip())
                elif isinstance(value, str):
                    # 字符串类型
                    if value.strip():
                        metadata_tags[key].add(value.strip())
                # 其他类型(数字、日期等)不添加到标签列表

        # 转换set为sorted list
        result_tags = {}
        for key, values in metadata_tags.items():
            if values:  # 只包含有值的字段
                result_tags[key] = sorted(list(values))

        return {
            "collection_id": collection_id,
            "metadata_tags": result_tags,
            "total_fields": len(result_tags),
            "template": collection.metadata_template
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取元数据标签失败: {str(e)}")
        import traceback
        logger.error(f"错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="获取元数据标签失败")


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


# ===== QA提取功能相关接口 =====

class QAExtractionToggleRequest(BaseModel):
    """QA提取开关请求模型"""
    enabled: bool = Field(..., description="是否启用QA提取")
    config: Optional[Dict[str, Any]] = Field(None, description="QA提取配置")

@router.put("/{collection_id}/qa-extraction")
async def toggle_collection_qa_extraction(
    collection_id: str = Path(..., description="知识库集合ID"),
    request: QAExtractionToggleRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    启用或禁用知识库的QA提取功能
    
    - **collection_id**: 知识库集合ID
    - **enabled**: 是否启用QA提取（仅控制文档上传时是否自动提取）
    """
    try:
        from sqlalchemy import text
        
        # 直接更新knowledge_collections表的auto_qa_extraction_enabled字段
        query = text("""
            UPDATE knowledge_collections 
            SET auto_qa_extraction_enabled = :enabled,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :collection_id
        """)
        
        result = await db.execute(query, {
            "enabled": request.enabled,
            "collection_id": collection_id
        })
        await db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="知识库未找到")
        
        return JSONResponse(content={
            "success": True,
            "message": "QA自动提取设置已更新"
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换QA提取状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"切换QA提取状态失败: {str(e)}")


@router.get("/{collection_id}/qa-extraction/status")
async def get_collection_qa_extraction_status(
    collection_id: str = Path(..., description="知识库集合ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库的QA提取状态（简化版）

    返回结构:
    {
      enabled: bool,
      total_pairs: int,
      extraction_progress: int  // 0-100，基于队列完成度估算
    }
    """
    try:
        # 1) 读取集合开关
        enabled_sql = text(
            """
            SELECT COALESCE(auto_qa_extraction_enabled, FALSE) AS enabled
            FROM knowledge_collections
            WHERE id = :cid
            """
        )
        enabled_res = await db.execute(enabled_sql, {"cid": collection_id})
        row = enabled_res.mappings().first()
        enabled = bool(row["enabled"]) if row else False

        # 2) 汇总该集合下文档对应的数据集的已处理QA对数量
        #    以 qa_datasets.processed_qa_pairs 的总和为准
        pairs_sql = text(
            """
            SELECT COALESCE(SUM(processed_qa_pairs), 0) AS total_pairs
            FROM qa_datasets
            WHERE source_document_id IN (
              SELECT id FROM knowledge_documents WHERE collection_id = :cid
            )
            """
        )
        pairs_res = await db.execute(pairs_sql, {"cid": collection_id})
        total_pairs = int(pairs_res.scalar() or 0)

        # 3) 估算提取进度（队列表完成度）
        #    total = 集合内文档的队列任务数；completed = 状态 completed
        progress_sql = text(
            """
            SELECT 
              COALESCE(COUNT(*) FILTER (WHERE status IS NOT NULL), 0) AS total,
              COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0) AS completed
            FROM qa_extraction_queue q
            WHERE q.document_id IN (
              SELECT id FROM knowledge_documents WHERE collection_id = :cid
            )
            """
        )
        prog_res = await db.execute(progress_sql, {"cid": collection_id})
        total, completed = prog_res.first() or (0, 0)
        extraction_progress = int(round((completed / total) * 100)) if total and total > 0 else 0

        return JSONResponse(
            content={
                "enabled": enabled,
                "total_pairs": total_pairs,
                "extraction_progress": extraction_progress,
            },
            status_code=200,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取QA提取状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取QA提取状态失败")
