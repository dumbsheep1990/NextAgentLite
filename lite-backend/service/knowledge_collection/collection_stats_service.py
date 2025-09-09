"""
知识库集合统计服务
按照组件拆分原则，控制文件大小 < 300行
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_

from models.knowledge_collection import KnowledgeCollection, MetadataTemplate
from models.knowledge import KnowledgeDocument
from core.logger import logger


class CollectionStatsService:
    """知识库集合统计服务"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_collection_statistics(self, collection_id: str) -> Dict[str, Any]:
        """
        获取指定集合的详细统计信息
        
        Args:
            collection_id: 集合ID
            
        Returns:
            Dict: 统计信息
        """
        try:
            # 基础信息查询
            collection_query = select(KnowledgeCollection).where(
                KnowledgeCollection.id == collection_id
            )
            collection_result = await self.session.execute(collection_query)
            collection = collection_result.scalar_one_or_none()
            
            if not collection:
                return {"error": "集合不存在"}
            
            # 文档统计
            doc_stats = await self._get_document_statistics(collection_id)
            
            # 文件类型统计
            file_type_stats = await self._get_file_type_statistics(collection_id)
            
            # 最近活动统计
            recent_activity = await self._get_recent_activity(collection_id)
            
            # 元数据提取统计
            metadata_stats = await self._get_metadata_statistics(collection_id)
            
            return {
                "collection_info": {
                    "id": collection.id,
                    "name": collection.name,
                    "description": collection.description,
                    "metadata_template": collection.metadata_template,
                    "created_at": collection.created_at.isoformat() if collection.created_at else None,
                    "last_updated": collection.last_updated.isoformat() if collection.last_updated else None
                },
                "document_statistics": doc_stats,
                "file_type_statistics": file_type_stats,
                "recent_activity": recent_activity,
                "metadata_statistics": metadata_stats
            }
            
        except Exception as e:
            logger.error(f"获取集合统计信息失败: {str(e)}")
            raise
    
    async def _get_document_statistics(self, collection_id: str) -> Dict[str, Any]:
        """获取文档统计信息"""
        try:
            # 基础统计查询
            stats_query = select(
                func.count(KnowledgeDocument.id).label('total_count'),
                func.sum(KnowledgeDocument.file_size).label('total_size'),
                func.avg(KnowledgeDocument.file_size).label('avg_size'),
                func.max(KnowledgeDocument.file_size).label('max_size'),
                func.min(KnowledgeDocument.file_size).label('min_size')
            ).where(KnowledgeDocument.collection_id == collection_id)
            
            result = await self.session.execute(stats_query)
            stats = result.first()
            
            # 状态分布统计
            status_query = select(
                KnowledgeDocument.status,
                func.count(KnowledgeDocument.id).label('count')
            ).where(
                KnowledgeDocument.collection_id == collection_id
            ).group_by(KnowledgeDocument.status)
            
            status_result = await self.session.execute(status_query)
            status_distribution = {row.status: row.count for row in status_result}
            
            return {
                "total_documents": stats.total_count or 0,
                "total_size_bytes": int(stats.total_size or 0),
                "average_size_bytes": int(stats.avg_size or 0),
                "largest_file_bytes": int(stats.max_size or 0),
                "smallest_file_bytes": int(stats.min_size or 0),
                "status_distribution": status_distribution
            }
            
        except Exception as e:
            logger.error(f"获取文档统计失败: {str(e)}")
            return {}
    
    async def _get_file_type_statistics(self, collection_id: str) -> Dict[str, int]:
        """获取文件类型统计"""
        try:
            query = select(
                KnowledgeDocument.file_type,
                func.count(KnowledgeDocument.id).label('count')
            ).where(
                KnowledgeDocument.collection_id == collection_id
            ).group_by(KnowledgeDocument.file_type)
            
            result = await self.session.execute(query)
            return {row.file_type: row.count for row in result}
            
        except Exception as e:
            logger.error(f"获取文件类型统计失败: {str(e)}")
            return {}
    
    async def _get_recent_activity(self, collection_id: str, days: int = 30) -> Dict[str, Any]:
        """获取最近活动统计"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # 最近添加的文档数量
            recent_docs_query = select(func.count(KnowledgeDocument.id)).where(
                and_(
                    KnowledgeDocument.collection_id == collection_id,
                    KnowledgeDocument.created_at >= cutoff_date
                )
            )
            
            result = await self.session.execute(recent_docs_query)
            recent_docs_count = result.scalar() or 0
            
            # 最近更新的文档数量
            recent_updates_query = select(func.count(KnowledgeDocument.id)).where(
                and_(
                    KnowledgeDocument.collection_id == collection_id,
                    KnowledgeDocument.updated_at >= cutoff_date,
                    KnowledgeDocument.updated_at != KnowledgeDocument.created_at
                )
            )
            
            result = await self.session.execute(recent_updates_query)
            recent_updates_count = result.scalar() or 0
            
            # 最新的5个文档
            latest_docs_query = select(
                KnowledgeDocument.id,
                KnowledgeDocument.title,
                KnowledgeDocument.created_at,
                KnowledgeDocument.file_type
            ).where(
                KnowledgeDocument.collection_id == collection_id
            ).order_by(desc(KnowledgeDocument.created_at)).limit(5)
            
            result = await self.session.execute(latest_docs_query)
            latest_docs = [
                {
                    "id": row.id,
                    "title": row.title,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "file_type": row.file_type
                }
                for row in result
            ]
            
            return {
                f"recent_{days}_days": {
                    "new_documents": recent_docs_count,
                    "updated_documents": recent_updates_count
                },
                "latest_documents": latest_docs
            }
            
        except Exception as e:
            logger.error(f"获取最近活动统计失败: {str(e)}")
            return {}
    
    async def _get_metadata_statistics(self, collection_id: str) -> Dict[str, Any]:
        """获取元数据统计信息"""
        try:
            # 元数据提取状态分布
            extraction_status_query = select(
                KnowledgeDocument.metadata_extraction_status,
                func.count(KnowledgeDocument.id).label('count')
            ).where(
                KnowledgeDocument.collection_id == collection_id
            ).group_by(KnowledgeDocument.metadata_extraction_status)
            
            result = await self.session.execute(extraction_status_query)
            extraction_status_distribution = {
                (row.metadata_extraction_status or 'pending'): row.count 
                for row in result
            }
            
            # 有结构化元数据的文档数量
            structured_metadata_query = select(func.count(KnowledgeDocument.id)).where(
                and_(
                    KnowledgeDocument.collection_id == collection_id,
                    KnowledgeDocument.structured_metadata.isnot(None)
                )
            )
            
            result = await self.session.execute(structured_metadata_query)
            structured_count = result.scalar() or 0
            
            return {
                "extraction_status_distribution": extraction_status_distribution,
                "documents_with_structured_metadata": structured_count
            }
            
        except Exception as e:
            logger.error(f"获取元数据统计失败: {str(e)}")
            return {}
    
    async def get_global_statistics(self) -> Dict[str, Any]:
        """
        获取全局统计信息
        
        Returns:
            Dict: 全局统计信息
        """
        try:
            # 集合统计
            collection_stats_query = select(
                func.count(KnowledgeCollection.id).label('total_collections'),
                func.count(
                    func.nullif(KnowledgeCollection.is_active, False)
                ).label('active_collections'),
                func.count(
                    func.nullif(KnowledgeCollection.is_public, False)
                ).label('public_collections')
            )
            
            result = await self.session.execute(collection_stats_query)
            collection_stats = result.first()
            
            # 文档总体统计
            doc_stats_query = select(
                func.count(KnowledgeDocument.id).label('total_documents'),
                func.sum(KnowledgeDocument.file_size).label('total_size')
            )
            
            result = await self.session.execute(doc_stats_query)
            doc_stats = result.first()
            
            # 模版类型分布
            template_distribution_query = select(
                KnowledgeCollection.metadata_template,
                func.count(KnowledgeCollection.id).label('count')
            ).where(
                KnowledgeCollection.is_active == True
            ).group_by(KnowledgeCollection.metadata_template)
            
            result = await self.session.execute(template_distribution_query)
            template_distribution = {row.metadata_template: row.count for row in result}
            
            return {
                "collections": {
                    "total": collection_stats.total_collections or 0,
                    "active": collection_stats.active_collections or 0,
                    "public": collection_stats.public_collections or 0
                },
                "documents": {
                    "total": doc_stats.total_documents or 0,
                    "total_size_bytes": int(doc_stats.total_size or 0)
                },
                "template_distribution": template_distribution
            }
            
        except Exception as e:
            logger.error(f"获取全局统计信息失败: {str(e)}")
            raise
    
    async def get_popular_collections(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        获取热门集合（按文档数量排序）
        
        Args:
            limit: 限制数量
            
        Returns:
            List[Dict]: 热门集合列表
        """
        try:
            query = select(
                KnowledgeCollection.id,
                KnowledgeCollection.name,
                KnowledgeCollection.description,
                KnowledgeCollection.document_count,
                KnowledgeCollection.metadata_template,
                KnowledgeCollection.created_at
            ).where(
                KnowledgeCollection.is_active == True
            ).order_by(
                desc(KnowledgeCollection.document_count)
            ).limit(limit)
            
            result = await self.session.execute(query)
            
            return [
                {
                    "id": row.id,
                    "name": row.name,
                    "description": row.description,
                    "document_count": row.document_count,
                    "metadata_template": row.metadata_template,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                }
                for row in result
            ]
            
        except Exception as e:
            logger.error(f"获取热门集合失败: {str(e)}")
            raise