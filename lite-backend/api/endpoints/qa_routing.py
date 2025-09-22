"""
QA路由管理API
实现知识库的问答路由功能
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from fastapi.responses import JSONResponse

from models.qa_routing import (
    QARoute, QARouteCreate, QARouteUpdate,
    RetrievalPathConfig, RetrievalPathConfigCreate, RetrievalPathConfigUpdate,
    QARouteCategory, QARouteCategoryCreate, QARouteCategoryUpdate,
    QARouteQuery, QARoutingResponse,
    QARouteBatchImport, QARouteStatistics,
    QARouteImportHistory
)
from service.qa_routing_service import qa_routing_service
from service.qa_generation_service_simplified import QAGenerationServiceSimplified

router = APIRouter(prefix="/qa-routing", tags=["QA路由"])

# 初始化服务
qa_gen_service = QAGenerationServiceSimplified()


# ===================== 知识库状态检测 =====================

@router.get("/knowledge-base/{kb_id}/status")
async def get_knowledge_base_status(kb_id: str):
    """
    获取知识库状态信息
    包括：文档数、向量化状态、QA路由配置等
    """
    try:
        # 简化版本：暂时不查询知识库详细信息
        kb_info = {
            "name": "知识库",
            "description": "知识库描述",
            "created_at": None
        }
        
        # 简化文档统计
        doc_stats = {
            "total_documents": 0,
            "vectorized_documents": 0,
            "total_chunks": 0,
            "avg_chunk_size": 0
        }
        
        # 获取QA路由统计
        route_stats = await qa_routing_service.get_route_statistics(kb_id)
        
        # 获取检索路径配置
        retrieval_paths = await qa_routing_service.get_retrieval_paths(kb_id)
        
        # 获取QA数据集统计
        qa_dataset_stats = await qa_gen_service.get_dataset_statistics(str(kb_id))
        
        return {
            "knowledge_base": {
                "id": str(kb_id),
                "name": kb_info.get("name"),
                "description": kb_info.get("description"),
                "created_at": kb_info.get("created_at")
            },
            "documents": {
                "total": doc_stats.get("total_documents", 0),
                "vectorized": doc_stats.get("vectorized_documents", 0),
                "total_chunks": doc_stats.get("total_chunks", 0),
                "avg_chunk_size": doc_stats.get("avg_chunk_size", 0)
            },
            "qa_routes": {
                "total": route_stats.total_routes,
                "active": route_stats.active_routes,
                "categories": route_stats.categories_count,
                "avg_match_score": route_stats.avg_match_score,
                "total_matches": route_stats.total_matches,
                "helpful_rate": route_stats.helpful_rate
            },
            "qa_datasets": {
                "total_pairs": qa_dataset_stats.get("total_pairs", 0),
                "datasets_count": qa_dataset_stats.get("datasets_count", 0)
            },
            "retrieval_paths": [
                {
                    "name": path.path_name,
                    "order": path.path_order,
                    "source": path.source_type,
                    "enabled": path.is_enabled
                }
                for path in retrieval_paths
            ],
            "status": {
                "is_configured": len(retrieval_paths) > 0,
                "has_content": doc_stats.get("total_documents", 0) > 0 or route_stats.total_routes > 0,
                "is_ready": doc_stats.get("vectorized_documents", 0) > 0 or route_stats.active_routes > 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识库状态失败: {str(e)}")


@router.get("/knowledge-bases/overview")
async def get_knowledge_bases_overview():
    """
    获取所有知识库的概览信息
    """
    try:
        # 简化版本：返回一个示例知识库
        knowledge_bases = [
            {
                "id": "d8fc64d5-22d5-46d3-8843-e0e7aeb6b2b3",
                "name": "NextAgentLite知识库",
                "description": "系统默认知识库"
            }
        ]
        
        overview = []
        for kb in knowledge_bases:
            kb_id = kb.get("id")
            
            # 简化文档统计
            doc_stats = {"total_documents": 0}
            route_stats = await qa_routing_service.get_route_statistics(kb_id)
            
            overview.append({
                "id": str(kb_id),
                "name": kb.get("name"),
                "description": kb.get("description"),
                "stats": {
                    "documents": doc_stats.get("total_documents", 0),
                    "qa_routes": route_stats.total_routes,
                    "is_ready": doc_stats.get("vectorized_documents", 0) > 0 or route_stats.active_routes > 0
                }
            })
        
        return {
            "total": len(overview),
            "knowledge_bases": overview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识库概览失败: {str(e)}")


# ===================== QA路由管理 =====================

@router.post("/routes")
async def create_qa_route(
    route_data: QARouteCreate
):
    """创建QA路由"""
    try:
        route = await qa_routing_service.create_qa_route(
            route_data,
            user_id=None
        )
        return route
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建QA路由失败: {str(e)}")


@router.get("/routes/{route_id}")
async def get_qa_route(route_id: UUID):
    """获取单个QA路由"""
    route = await qa_routing_service.get_qa_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="QA路由不存在")
    return route


@router.put("/routes/{route_id}")
async def update_qa_route(
    route_id: UUID,
    update_data: QARouteUpdate
):
    """更新QA路由"""
    try:
        route = await qa_routing_service.update_qa_route(
            route_id,
            update_data,
            user_id=None
        )
        return route
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新QA路由失败: {str(e)}")


@router.delete("/routes/{route_id}")
async def delete_qa_route(route_id: UUID):
    """删除QA路由"""
    success = await qa_routing_service.delete_qa_route(route_id)
    if not success:
        raise HTTPException(status_code=404, detail="QA路由不存在")
    return {"message": "QA路由已删除"}


@router.get("/knowledge-base/{kb_id}/routes")
async def list_qa_routes(
    kb_id: UUID,
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """列出知识库的QA路由"""
    try:
        offset = (page - 1) * page_size
        routes, total = await qa_routing_service.list_qa_routes(
            kb_id,
            category=category,
            is_active=is_active,
            limit=page_size,
            offset=offset
        )
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "routes": routes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取QA路由列表失败: {str(e)}")


# ===================== 检索路径配置 =====================

@router.post("/retrieval-paths")
async def create_retrieval_path(config_data: RetrievalPathConfigCreate):
    """创建检索路径配置"""
    try:
        config = await qa_routing_service.create_retrieval_path_config(config_data)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建检索路径失败: {str(e)}")


@router.get("/knowledge-base/{kb_id}/retrieval-paths")
async def get_retrieval_paths(kb_id: UUID):
    """获取知识库的检索路径配置"""
    try:
        paths = await qa_routing_service.get_retrieval_paths(kb_id)
        return {
            "knowledge_base_id": str(kb_id),
            "paths": paths
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取检索路径失败: {str(e)}")


@router.put("/retrieval-paths/{path_id}")
async def update_retrieval_path(
    path_id: UUID,
    update_data: RetrievalPathConfigUpdate
):
    """更新检索路径配置"""
    try:
        # TODO: 实现更新逻辑
        return {"message": "功能开发中"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新检索路径失败: {str(e)}")


# ===================== QA路由搜索 =====================

@router.post("/search")
async def search_qa_routes(query_data: QARouteQuery):
    """
    搜索QA路由并执行多层检索
    """
    try:
        response = await qa_routing_service.search_qa_routes(query_data)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")


# ===================== 批量导入 =====================

@router.post("/import/qa-dataset")
async def import_from_qa_dataset(
    kb_id: UUID,
    dataset_id: UUID,
    category: Optional[str] = Body(None),
    auto_categorize: bool = Body(False),
    merge_strategy: str = Body("skip")
):
    """
    从QA数据集导入路由
    """
    try:
        # 获取QA数据集内容
        qa_pairs = await qa_gen_service.get_qa_pairs_by_dataset(str(dataset_id))
        
        if not qa_pairs:
            raise HTTPException(status_code=404, detail="QA数据集为空或不存在")
        
        # 转换为路由格式
        routes = []
        for pair in qa_pairs:
            routes.append(QARouteCreate(
                knowledge_base_id=kb_id,
                category=category or "导入的问答",
                question=pair.get("question"),
                answer=pair.get("answer"),
                keywords=pair.get("keywords", []),
                priority=0,
                is_active=True,
                source_type="imported",
                source_ref=str(dataset_id),
                metadata={"original_id": pair.get("id")}
            ))
        
        # 执行批量导入
        import_data = QARouteBatchImport(
            knowledge_base_id=kb_id,
            qa_dataset_id=dataset_id,
            routes=routes,
            category=category,
            auto_categorize=auto_categorize,
            merge_strategy=merge_strategy
        )
        
        history = await qa_routing_service.import_from_qa_dataset(
            import_data,
            user_id=None
        )
        
        return history
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")


@router.post("/import/batch")
async def batch_import_routes(
    import_data: QARouteBatchImport
):
    """
    批量导入QA路由
    """
    try:
        history = await qa_routing_service.import_from_qa_dataset(
            import_data,
            user_id=None
        )
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量导入失败: {str(e)}")


# ===================== 分类管理 =====================

@router.get("/knowledge-base/{kb_id}/categories")
async def get_route_categories(kb_id: UUID):
    """
    获取知识库的所有QA路由分类
    """
    try:
        # 获取所有路由并提取分类
        routes, _ = await qa_routing_service.list_qa_routes(kb_id, limit=1000)
        
        # 统计每个分类的数量
        category_stats = {}
        for route in routes:
            cat = route.category
            if cat not in category_stats:
                category_stats[cat] = {
                    "name": cat,
                    "count": 0,
                    "active_count": 0
                }
            category_stats[cat]["count"] += 1
            if route.is_active:
                category_stats[cat]["active_count"] += 1
        
        return {
            "total": len(category_stats),
            "categories": list(category_stats.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分类失败: {str(e)}")


# ===================== 统计信息 =====================

@router.get("/knowledge-base/{kb_id}/statistics")
async def get_route_statistics(kb_id: UUID):
    """
    获取知识库的QA路由统计信息
    """
    try:
        stats = await qa_routing_service.get_route_statistics(kb_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


# ===================== 健康检查 =====================

@router.get("/health")
async def health_check():
    """QA路由服务健康检查"""
    try:
        # 检查服务是否已初始化
        if not qa_routing_service.pool:
            await qa_routing_service.initialize()
        
        # 测试数据库连接
        async with qa_routing_service.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        return {
            "status": "healthy",
            "service": "qa_routing",
            "database": "connected"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "qa_routing",
                "error": str(e)
            }
        )