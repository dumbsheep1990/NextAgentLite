"""
向量索引管理服务 - 支持pgvector原生索引的创建、重建和优化

功能包括:
1. Collection级别的向量索引管理
2. 支持IVFFlat和HNSW索引类型
3. 索引性能监控和优化建议
4. 索引重建任务管理
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import psycopg2
from sqlalchemy import text, select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import logger
from db.database import get_async_session
from models.knowledge import KnowledgeDocument, DocumentChunk
from models.knowledge_collection import KnowledgeCollection


class IndexType(Enum):
    """向量索引类型"""
    IVFFLAT = "ivfflat"
    HNSW = "hnsw"


class DistanceMetric(Enum):
    """距离度量类型"""
    COSINE = "vector_cosine_ops"      # 余弦相似度
    L2 = "vector_l2_ops"              # 欧几里得距离
    INNER_PRODUCT = "vector_ip_ops"   # 内积


@dataclass
class IndexConfig:
    """索引配置"""
    index_type: IndexType
    distance_metric: DistanceMetric
    
    # IVFFlat参数
    lists: Optional[int] = None          # 聚类数量，推荐 rows/1000
    
    # HNSW参数  
    m: Optional[int] = None              # 连接数，默认16
    ef_construction: Optional[int] = None # 构建时的搜索深度，默认64


@dataclass
class IndexStatus:
    """索引状态信息"""
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


class VectorIndexService:
    """向量索引管理服务"""
    
    def __init__(self, db_session: AsyncSession = None):
        self.db_session = db_session
        
        # 默认索引配置 - 统一使用HNSW
        self.default_config = IndexConfig(
            index_type=IndexType.HNSW,
            distance_metric=DistanceMetric.COSINE,
            m=16,
            ef_construction=64
        )
    
    async def analyze_collection_vectors(self, collection_id: str) -> Dict[str, Any]:
        """分析Collection的向量数据状况"""
        
        session = self.db_session or await get_async_session().__anext__()
        
        try:
            # 统计向量数据
            result = await session.execute(
                text("""
                SELECT 
                    COUNT(*) as total_chunks,
                    COUNT(embedding) as has_embedding,
                    COUNT(general_embedding) as has_general,
                    COUNT(domain_embedding) as has_domain,
                    
                    -- 计算向量维度分布
                    MODE() WITHIN GROUP (ORDER BY jsonb_array_length(embedding)) as common_embedding_dim,
                    MODE() WITHIN GROUP (ORDER BY jsonb_array_length(general_embedding)) as common_general_dim,
                    MODE() WITHIN GROUP (ORDER BY jsonb_array_length(domain_embedding)) as common_domain_dim,
                    
                    -- 数据分布统计
                    MIN(created_at) as earliest_chunk,
                    MAX(updated_at) as latest_update
                FROM document_chunks dc
                JOIN knowledge_documents kd ON dc.document_id = kd.id
                WHERE kd.collection_id = :collection_id
                """),
                {"collection_id": collection_id}
            )
            
            stats = result.fetchone()
            
            return {
                "collection_id": collection_id,
                "total_chunks": stats.total_chunks,
                "vector_statistics": {
                    "embedding": {
                        "count": stats.has_embedding,
                        "dimension": stats.common_embedding_dim
                    },
                    "general_embedding": {
                        "count": stats.has_general,
                        "dimension": stats.common_general_dim
                    },
                    "domain_embedding": {
                        "count": stats.has_domain,
                        "dimension": stats.common_domain_dim
                    }
                },
                "data_range": {
                    "earliest": stats.earliest_chunk,
                    "latest": stats.latest_update
                },
                "default_config": self.default_config
            }
            
        except Exception as e:
            logger.error(f"分析Collection向量数据失败: {e}")
            raise
        finally:
            if not self.db_session:
                await session.close()
    
    async def get_collection_index_status(self, collection_id: str) -> List[IndexStatus]:
        """获取Collection的索引状态"""
        
        session = self.db_session or await get_async_session().__anext__()
        
        try:
            # 查询现有索引
            result = await session.execute(
                text("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef,
                    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
                FROM pg_indexes 
                WHERE tablename = 'document_chunks'
                    AND indexdef LIKE '%vector%'
                    AND indexdef LIKE '%ivfflat%' OR indexdef LIKE '%hnsw%'
                """)
            )
            
            indexes = result.fetchall()
            
            # 获取Collection信息
            collection_result = await session.execute(
                select(KnowledgeCollection).where(
                    KnowledgeCollection.id == collection_id
                )
            )
            collection = collection_result.scalar_one_or_none()
            
            if not collection:
                raise ValueError(f"Collection {collection_id} 不存在")
            
            # 分析每个向量字段的索引状态
            vector_fields = ["embedding", "general_embedding", "domain_embedding"]
            index_statuses = []
            
            for field in vector_fields:
                # 检查该字段是否有向量索引
                field_indexes = [idx for idx in indexes if field in idx.indexdef]
                
                if field_indexes:
                    for idx in field_indexes:
                        # 解析索引类型
                        if "ivfflat" in idx.indexdef.lower():
                            index_type = "ivfflat"
                        elif "hnsw" in idx.indexdef.lower():
                            index_type = "hnsw"
                        else:
                            index_type = "unknown"
                        
                        status = IndexStatus(
                            collection_id=collection_id,
                            collection_name=collection.name,
                            index_name=idx.indexname,
                            index_type=index_type,
                            vector_field=field,
                            vector_dimension=self._get_field_dimension(field),
                            exists=True,
                            is_valid=True,  # 可以通过查询测试来验证
                            size_mb=self._parse_size_to_mb(idx.size),
                            last_rebuild=None,  # 需要从元数据表查询
                            avg_query_time=None,
                            index_scan_ratio=None,
                            total_vectors=collection.document_count or 0,
                            null_vectors=0,
                            data_distribution={}
                        )
                        index_statuses.append(status)
                else:
                    # 该字段没有向量索引
                    status = IndexStatus(
                        collection_id=collection_id,
                        collection_name=collection.name,
                        index_name=f"idx_{field}_missing",
                        index_type="none",
                        vector_field=field,
                        vector_dimension=self._get_field_dimension(field),
                        exists=False,
                        is_valid=False,
                        size_mb=0,
                        last_rebuild=None,
                        avg_query_time=None,
                        index_scan_ratio=None,
                        total_vectors=collection.document_count or 0,
                        null_vectors=0,
                        data_distribution={}
                    )
                    index_statuses.append(status)
            
            return index_statuses
            
        except Exception as e:
            logger.error(f"获取索引状态失败: {e}")
            raise
        finally:
            if not self.db_session:
                await session.close()
    
    async def create_collection_index(
        self, 
        collection_id: str,
        vector_field: str,
        config: IndexConfig,
        force_recreate: bool = False
    ) -> Dict[str, Any]:
        """为指定Collection创建向量索引"""
        
        session = self.db_session or await get_async_session().__anext__()
        
        try:
            # 验证Collection存在
            collection_result = await session.execute(
                select(KnowledgeCollection).where(
                    KnowledgeCollection.id == collection_id
                )
            )
            collection = collection_result.scalar_one_or_none()
            
            if not collection:
                raise ValueError(f"Collection {collection_id} 不存在")
            
            # 生成索引名称
            index_name = f"idx_{collection_id[:8]}_{vector_field}_{config.index_type.value}"
            
            # 检查索引是否已存在
            if not force_recreate:
                existing_check = await session.execute(
                    text("SELECT 1 FROM pg_indexes WHERE indexname = :index_name"),
                    {"index_name": index_name}
                )
                if existing_check.fetchone():
                    raise ValueError(f"索引 {index_name} 已存在，使用 force_recreate=True 强制重建")
            
            # 删除现有索引（如果强制重建）
            if force_recreate:
                await session.execute(
                    text(f"DROP INDEX IF EXISTS {index_name}")
                )
                await session.commit()
            
            # 构建索引创建SQL
            create_sql = self._build_index_sql(
                index_name=index_name,
                vector_field=vector_field,
                config=config,
                collection_id=collection_id
            )
            
            # 记录开始时间
            start_time = time.time()
            logger.info(f"开始为Collection {collection.name} 创建 {config.index_type.value} 索引")
            
            # 创建索引（这可能需要很长时间）
            await session.execute(text(create_sql))
            await session.commit()
            
            # 计算构建时间
            build_time = time.time() - start_time
            
            # 记录索引元数据
            await self._record_index_metadata(
                session=session,
                collection_id=collection_id,
                index_name=index_name,
                vector_field=vector_field,
                config=config,
                build_time=build_time
            )
            
            logger.info(f"索引 {index_name} 创建完成，耗时 {build_time:.2f} 秒")
            
            return {
                "success": True,
                "index_name": index_name,
                "build_time": build_time,
                "vector_field": vector_field,
                "index_type": config.index_type.value,
                "collection_id": collection_id
            }
            
        except Exception as e:
            logger.error(f"创建向量索引失败: {e}")
            await session.rollback()
            raise
        finally:
            if not self.db_session:
                await session.close()
    
    def _build_index_sql(
        self, 
        index_name: str,
        vector_field: str,
        config: IndexConfig,
        collection_id: str
    ) -> str:
        """构建索引创建SQL"""
        
        # 基础SQL模板
        if config.index_type == IndexType.IVFFLAT:
            # IVFFlat索引
            lists = config.lists or 100
            sql = f"""
            CREATE INDEX {index_name} ON document_chunks 
            USING ivfflat ({vector_field} {config.distance_metric.value})
            WITH (lists = {lists})
            WHERE document_id IN (
                SELECT id FROM knowledge_documents 
                WHERE collection_id = '{collection_id}'
                AND {vector_field} IS NOT NULL
            )
            """
        
        elif config.index_type == IndexType.HNSW:
            # HNSW索引
            m = config.m or 16
            ef_construction = config.ef_construction or 64
            sql = f"""
            CREATE INDEX {index_name} ON document_chunks 
            USING hnsw ({vector_field} {config.distance_metric.value})
            WITH (m = {m}, ef_construction = {ef_construction})
            WHERE document_id IN (
                SELECT id FROM knowledge_documents 
                WHERE collection_id = '{collection_id}'
                AND {vector_field} IS NOT NULL
            )
            """
        
        else:
            raise ValueError(f"不支持的索引类型: {config.index_type}")
        
        return sql
    
    async def rebuild_collection_indexes(
        self, 
        collection_id: str,
        vector_fields: Optional[List[str]] = None,
        config: Optional[IndexConfig] = None
    ) -> Dict[str, Any]:
        """重建Collection的所有向量索引"""
        
        # 分析当前状况
        analysis = await self.analyze_collection_vectors(collection_id)
        
        # 确定要重建的向量字段
        if vector_fields is None:
            vector_fields = []
            stats = analysis["vector_statistics"]
            if stats["general_embedding"]["count"] > 0:
                vector_fields.append("general_embedding")
            if stats["domain_embedding"]["count"] > 0:
                vector_fields.append("domain_embedding")
            if stats["embedding"]["count"] > 0:
                vector_fields.append("embedding")
        
        # 使用指定配置或默认配置
        index_config = config or self.default_config
        
        results = {
            "collection_id": collection_id,
            "analysis": analysis,
            "rebuilt_indexes": [],
            "total_build_time": 0,
            "errors": []
        }
        
        # 逐个重建索引
        for field in vector_fields:
            try:
                result = await self.create_collection_index(
                    collection_id=collection_id,
                    vector_field=field,
                    config=index_config,
                    force_recreate=True
                )
                results["rebuilt_indexes"].append(result)
                results["total_build_time"] += result["build_time"]
                
            except Exception as e:
                error_info = {
                    "vector_field": field,
                    "error": str(e)
                }
                results["errors"].append(error_info)
                logger.error(f"重建 {field} 索引失败: {e}")
        
        return results
    
    async def _record_index_metadata(
        self,
        session: AsyncSession,
        collection_id: str,
        index_name: str,
        vector_field: str,
        config: IndexConfig,
        build_time: float
    ):
        """记录索引元数据到系统表"""
        
        # 这里可以创建一个专门的索引元数据表来记录索引信息
        # 为简化起见，暂时记录到Collection的配置中
        
        try:
            collection_result = await session.execute(
                select(KnowledgeCollection).where(
                    KnowledgeCollection.id == collection_id
                )
            )
            collection = collection_result.scalar_one()
            
            # 更新配置信息
            if not collection.config:
                collection.config = {}
            
            if "vector_indexes" not in collection.config:
                collection.config["vector_indexes"] = {}
            
            collection.config["vector_indexes"][vector_field] = {
                "index_name": index_name,
                "index_type": config.index_type.value,
                "distance_metric": config.distance_metric.value,
                "created_at": datetime.now().isoformat(),
                "build_time": build_time,
                "config": {
                    "lists": config.lists,
                    "m": config.m,
                    "ef_construction": config.ef_construction
                }
            }
            
            # 标记配置已更新
            await session.execute(
                update(KnowledgeCollection)
                .where(KnowledgeCollection.id == collection_id)
                .values(
                    config=collection.config,
                    updated_at=datetime.now()
                )
            )
            
            await session.commit()
            
        except Exception as e:
            logger.error(f"记录索引元数据失败: {e}")
            # 不抛出异常，因为索引创建已成功
    
    def _get_field_dimension(self, field: str) -> int:
        """获取向量字段的维度"""
        dimension_map = {
            "embedding": 1536,           # text-embedding-v4
            "general_embedding": 1536,   # text-embedding-v4 
            "domain_embedding": 768      # MatBERT
        }
        return dimension_map.get(field, 0)
    
    def _parse_size_to_mb(self, size_str: str) -> float:
        """解析PostgreSQL的大小字符串为MB"""
        if not size_str:
            return 0.0
        
        # 解析如 "123 MB", "1.5 GB" 等格式
        parts = size_str.strip().split()
        if len(parts) != 2:
            return 0.0
        
        value, unit = float(parts[0]), parts[1].upper()
        
        if unit == "B" or unit == "BYTES":
            return value / (1024 * 1024)
        elif unit == "KB":
            return value / 1024
        elif unit == "MB":
            return value
        elif unit == "GB":
            return value * 1024
        elif unit == "TB":
            return value * 1024 * 1024
        else:
            return 0.0


# 创建全局实例
vector_index_service = VectorIndexService()

# 导出
__all__ = [
    'VectorIndexService', 
    'IndexType', 
    'DistanceMetric', 
    'IndexConfig', 
    'IndexStatus',
    'vector_index_service'
]