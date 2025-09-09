"""
向量索引管理API - 支持pgvector原生索引的REST接口

提供Collection级别的向量索引创建、重建、状态查询等功能
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import logger
from db.database import get_async_session
from service.vector_index_service import (
    VectorIndexService, 
    IndexType, 
    DistanceMetric, 
    IndexConfig,
    IndexStatus
)

router = APIRouter(prefix="/api/v1/vector-index", tags=["Vector Index Management"])


# Pydantic模型定义

class IndexConfigRequest(BaseModel):
    """索引配置请求模型"""
    index_type: str = Field(..., description="索引类型: ivfflat|hnsw")
    distance_metric: str = Field(default="vector_cosine_ops", description="距离度量")
    
    # IVFFlat参数
    lists: Optional[int] = Field(None, description="IVFFlat聚类数量")
    
    # HNSW参数
    m: Optional[int] = Field(None, description="HNSW连接数")
    ef_construction: Optional[int] = Field(None, description="HNSW构建搜索深度")

    def to_index_config(self) -> IndexConfig:
        """转换为服务层IndexConfig对象"""
        try:
            index_type = IndexType(self.index_type)
            distance_metric = DistanceMetric(self.distance_metric)
        except ValueError as e:
            raise ValueError(f"无效的索引配置: {str(e)}")
        
        return IndexConfig(
            index_type=index_type,
            distance_metric=distance_metric,
            lists=self.lists,
            m=self.m,
            ef_construction=self.ef_construction
        )


class CreateIndexRequest(BaseModel):
    """创建索引请求模型"""
    collection_id: str = Field(..., description="Collection ID")
    vector_field: str = Field(..., description="向量字段: embedding|general_embedding|domain_embedding")
    config: IndexConfigRequest = Field(..., description="索引配置")
    force_recreate: bool = Field(default=False, description="是否强制重建")


class RebuildIndexRequest(BaseModel):
    """重建索引请求模型"""
    collection_id: str = Field(..., description="Collection ID")
    vector_fields: Optional[List[str]] = Field(None, description="指定重建的向量字段列表")
    config: Optional[IndexConfigRequest] = Field(None, description="索引配置，不指定则使用默认HNSW配置")


class IndexStatusResponse(BaseModel):
    """索引状态响应模型"""
    collection_id: str
    collection_name: str
    index_name: str
    index_type: str
    vector_field: str
    vector_dimension: int
    
    # 状态信息
    exists: bool
    is_valid: bool
    size_mb: float
    last_rebuild: Optional[datetime]
    
    # 性能指标
    avg_query_time: Optional[float]
    index_scan_ratio: Optional[float]
    
    # 数据统计
    total_vectors: int
    null_vectors: int
    data_distribution: Dict[str, Any]


class VectorAnalysisResponse(BaseModel):
    """向量分析响应模型"""
    collection_id: str
    total_chunks: int
    vector_statistics: Dict[str, Any]
    data_range: Dict[str, Any]
    default_config: Dict[str, Any]


# API端点实现

@router.get("/collections/{collection_id}/analysis", response_model=VectorAnalysisResponse)
async def analyze_collection_vectors(
    collection_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    """
    分析Collection的向量数据状况
    
    返回向量统计信息、数据分布和推荐的索引配置
    """
    try:
        service = VectorIndexService(session)
        analysis = await service.analyze_collection_vectors(collection_id)
        
        return VectorAnalysisResponse(**analysis)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"分析Collection向量数据失败: {e}")
        raise HTTPException(status_code=500, detail="分析向量数据失败")


@router.get("/collections/{collection_id}/status", response_model=List[IndexStatusResponse])
async def get_collection_index_status(
    collection_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    """
    获取Collection的所有向量索引状态
    
    返回每个向量字段的索引详细信息
    """
    try:
        service = VectorIndexService(session)
        statuses = await service.get_collection_index_status(collection_id)
        
        return [
            IndexStatusResponse(
                collection_id=status.collection_id,
                collection_name=status.collection_name,
                index_name=status.index_name,
                index_type=status.index_type,
                vector_field=status.vector_field,
                vector_dimension=status.vector_dimension,
                exists=status.exists,
                is_valid=status.is_valid,
                size_mb=status.size_mb,
                last_rebuild=status.last_rebuild,
                avg_query_time=status.avg_query_time,
                index_scan_ratio=status.index_scan_ratio,
                total_vectors=status.total_vectors,
                null_vectors=status.null_vectors,
                data_distribution=status.data_distribution
            )
            for status in statuses
        ]
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"获取索引状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取索引状态失败")


@router.post("/create")
async def create_vector_index(
    request: CreateIndexRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """
    为指定Collection的向量字段创建索引
    
    支持IVFFlat和HNSW索引类型，可配置各种参数
    """
    try:
        # 验证向量字段
        valid_fields = ["embedding", "general_embedding", "domain_embedding"]
        if request.vector_field not in valid_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的向量字段: {request.vector_field}，支持的字段: {valid_fields}"
            )
        
        service = VectorIndexService(session)
        config = request.config.to_index_config()
        
        result = await service.create_collection_index(
            collection_id=request.collection_id,
            vector_field=request.vector_field,
            config=config,
            force_recreate=request.force_recreate
        )
        
        return {
            "success": True,
            "message": f"索引 {result['index_name']} 创建成功",
            "data": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建向量索引失败: {e}")
        raise HTTPException(status_code=500, detail="创建向量索引失败")


@router.post("/rebuild")
async def rebuild_collection_indexes(
    request: RebuildIndexRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_async_session)
):
    """
    重建Collection的向量索引
    
    可以指定特定字段或重建所有向量字段的索引。
    大型数据集的重建将在后台进行。
    """
    try:
        service = VectorIndexService(session)
        
        # 先分析数据量，判断是否需要后台处理
        analysis = await service.analyze_collection_vectors(request.collection_id)
        total_vectors = sum([
            stats.get("count", 0) 
            for stats in analysis["vector_statistics"].values()
        ])
        
        # 如果向量数量较大，使用后台任务
        if total_vectors > 10000:
            background_tasks.add_task(
                _rebuild_indexes_background,
                request,
                session
            )
            
            return {
                "success": True,
                "message": f"已启动后台重建任务，共需处理 {total_vectors} 个向量",
                "async_mode": True,
                "estimated_time_minutes": total_vectors // 1000,  # 粗略估计
                "data": {
                    "collection_id": request.collection_id,
                    "total_vectors": total_vectors,
                    "analysis": analysis
                }
            }
        else:
            # 小数据集直接同步处理
            config = None
            if request.config:
                config = request.config.to_index_config()
            
            result = await service.rebuild_collection_indexes(
                collection_id=request.collection_id,
                vector_fields=request.vector_fields,
                config=config
            )
            
            return {
                "success": True,
                "message": f"索引重建完成，耗时 {result['total_build_time']:.2f} 秒",
                "async_mode": False,
                "data": result
            }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"重建索引失败: {e}")
        raise HTTPException(status_code=500, detail="重建索引失败")


@router.get("/supported-configs")
async def get_supported_configurations():
    """
    获取支持的索引配置选项
    
    返回可用的索引类型和距离度量
    """
    try:
        return {
            "index_types": [
                {
                    "value": "hnsw",
                    "name": "HNSW",
                    "description": "高性能图结构索引，默认推荐使用",
                    "is_default": True,
                    "parameters": {
                        "m": {
                            "description": "每个节点的连接数",
                            "default": 16,
                            "range": [1, 100]
                        },
                        "ef_construction": {
                            "description": "构建时搜索深度",
                            "default": 64,
                            "range": [1, 1000]
                        }
                    }
                },
                {
                    "value": "ivfflat",
                    "name": "IVFFlat",
                    "description": "适合大规模数据，基于聚类的近似搜索",
                    "is_default": False,
                    "parameters": {
                        "lists": {
                            "description": "聚类数量，推荐 rows/1000",
                            "default": 100,
                            "range": [1, 32768]
                        }
                    }
                }
            ],
            "distance_metrics": [
                {
                    "value": "vector_cosine_ops",
                    "name": "Cosine Similarity",
                    "description": "余弦相似度，适合文本向量",
                    "is_default": True
                },
                {
                    "value": "vector_l2_ops", 
                    "name": "Euclidean Distance",
                    "description": "欧几里得距离",
                    "is_default": False
                },
                {
                    "value": "vector_ip_ops",
                    "name": "Inner Product", 
                    "description": "内积距离",
                    "is_default": False
                }
            ],
            "default_config": {
                "index_type": "hnsw",
                "distance_metric": "vector_cosine_ops",
                "parameters": {"m": 16, "ef_construction": 64}
            }
        }
        
    except Exception as e:
        logger.error(f"获取配置信息失败: {e}")
        raise HTTPException(status_code=500, detail="获取配置信息失败")


# 后台任务函数

async def _rebuild_indexes_background(
    request: RebuildIndexRequest,
    session: AsyncSession
):
    """后台重建索引任务"""
    try:
        logger.info(f"开始后台重建Collection {request.collection_id} 的索引")
        
        service = VectorIndexService(session)
        
        config = None
        if request.config:
            config = request.config.to_index_config()
        
        result = await service.rebuild_collection_indexes(
            collection_id=request.collection_id,
            vector_fields=request.vector_fields,
            config=config
        )
        
        logger.info(
            f"Collection {request.collection_id} 索引重建完成，"
            f"重建 {len(result['rebuilt_indexes'])} 个索引，"
            f"总耗时 {result['total_build_time']:.2f} 秒"
        )
        
        # 这里可以发送通知给用户，或者更新任务状态表
        
    except Exception as e:
        logger.error(f"后台索引重建失败: {e}")
        # 这里可以记录失败状态，发送错误通知


# 健康检查

@router.get("/health")
async def health_check():
    """索引服务健康检查"""
    return {
        "status": "healthy",
        "service": "Vector Index Management API",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }