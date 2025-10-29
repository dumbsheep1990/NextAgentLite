"""
知识库数据仓库 - 处理知识库相关的数据访问逻辑
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
import uuid
import hashlib
from datetime import datetime, timedelta

from models.knowledge import (
    KnowledgeDocument, 
    DocumentChunk, 
    VectorConfig, 
    ModelConfig, 
    RetrievalResult
)
from models.knowledge_collection import KnowledgeCollection
from utils.timezone_utils import get_china_now
from core.logger import logger


class KnowledgeDocumentRepository:
    """知识库文档仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, document_data: Dict[str, Any]) -> KnowledgeDocument:
        """创建新文档"""
        # 如果document_data中没有id，则生成一个新的UUID
        if 'id' not in document_data:
            document_data['id'] = str(uuid.uuid4())
        
        # 设置当前中国时间
        china_now = get_china_now()
        document_data_with_time = {
            **document_data,
            'upload_time': china_now,
            'created_at': china_now,
            'updated_at': china_now
        }
        
        document = KnowledgeDocument(
            **document_data_with_time
        )
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document
    
    async def get_by_id(self, document_id: str) -> Optional[KnowledgeDocument]:
        """根据ID获取文档"""
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def find_by_filename(self, filename: str) -> Optional[KnowledgeDocument]:
        """根据文件名查找文档（用于重复检查）"""
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.filename == filename)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[str] = None,
        tag_filter: Optional[List[str]] = None,
        collection_id: Optional[str] = None
    ) -> List[KnowledgeDocument]:
        """获取所有文档（支持分页和过滤）"""
        stmt = select(KnowledgeDocument)
        
        if status_filter:
            stmt = stmt.where(KnowledgeDocument.status == status_filter)
        
        if tag_filter:
            # 使用JSON操作查询包含指定标签的文档
            for tag in tag_filter:
                stmt = stmt.where(func.json_contains(KnowledgeDocument.tags, f'"{tag}"'))
        
        if collection_id:
            stmt = stmt.where(KnowledgeDocument.collection_id == collection_id)
        
        stmt = stmt.offset(skip).limit(limit).order_by(KnowledgeDocument.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, document_id: str, update_data: Dict[str, Any]) -> Optional[KnowledgeDocument]:
        """更新文档"""
        # 自动设置更新时间
        update_data_with_time = {
            **update_data,
            'updated_at': get_china_now()
        }
        
        stmt = (
            update(KnowledgeDocument)
            .where(KnowledgeDocument.id == document_id)
            .values(**update_data_with_time)
            .returning(KnowledgeDocument)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def update_fields(self, document_id: str, fields: Dict[str, Any]) -> Optional[KnowledgeDocument]:
        """更新文档字段（别名方法，保持兼容性）"""
        return await self.update(document_id, fields)
    
    async def update_document_status(self, document_id: str, status: str) -> bool:
        """更新文档状态"""
        stmt = (
            update(KnowledgeDocument)
            .where(KnowledgeDocument.id == document_id)
            .values(status=status, updated_at=get_china_now())
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def delete(self, document_id: str) -> bool:
        """删除文档"""
        # 先删除文档chunks（解决外键约束问题）
        try:
            chunk_stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            await self.session.execute(chunk_stmt)
            logger.info(f"已删除文档 {document_id} 的所有chunks")
        except Exception as e:
            logger.error(f"删除文档chunks失败 {document_id}: {e}")
            return False
        
        # 删除文档记录
        stmt = delete(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def search_by_title(self, query: str, limit: int = 50) -> List[KnowledgeDocument]:
        """根据标题搜索文档"""
        stmt = (
            select(KnowledgeDocument)
            .where(KnowledgeDocument.title.ilike(f"%{query}%"))
            .limit(limit)
            .order_by(KnowledgeDocument.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_documents_by_status(self, status: str) -> List[KnowledgeDocument]:
        """根据状态获取文档"""
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.status == status)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取文档统计信息"""
        # 总文档数
        total_count = await self.session.scalar(select(func.count(KnowledgeDocument.id)))
        
        # 按状态分组统计
        status_stats = await self.session.execute(
            select(KnowledgeDocument.status, func.count(KnowledgeDocument.id))
            .group_by(KnowledgeDocument.status)
        )
        
        # 总文件大小
        total_size = await self.session.scalar(
            select(func.coalesce(func.sum(KnowledgeDocument.file_size), 0))
        )
        
        # 活跃标签数量 - PostgreSQL JSONB操作
        from sqlalchemy import text
        active_tags = await self.session.scalar(
            text("SELECT COUNT(DISTINCT tag_element) FROM knowledge_documents, jsonb_array_elements_text(tags) AS tag_element WHERE tags IS NOT NULL")
        )
        
        return {
            "total_documents": total_count or 0,
            "status_distribution": dict(status_stats.all()),
            "total_size": total_size or 0,
            "active_tags": active_tags or 0
        }


class DocumentChunkRepository:
    """文档分块仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_chunks(self, chunks_data: List[Dict[str, Any]]) -> List[DocumentChunk]:
        """批量创建文档分块"""
        from core.logger import logger
        
        chunks = []
        for i, chunk_data in enumerate(chunks_data):
            try:
                # 调试日志
                logger.debug(f"创建分块 {i}: 数据键 = {list(chunk_data.keys())}")
                
                # 提取所需的字段，避免参数冲突
                chunk_id = chunk_data.get('id') or str(uuid.uuid4())
                
                chunk = DocumentChunk(
                    id=chunk_id,
                    document_id=chunk_data['document_id'],
                    content=chunk_data['content'],
                    chunk_index=chunk_data['chunk_index'],
                    chunk_metadata=chunk_data.get('chunk_metadata', {}),
                    
                    # 向量嵌入支持
                    embedding=chunk_data.get('embedding'),
                    embedding_model=chunk_data.get('embedding_model'),
                    general_embedding=chunk_data.get('general_embedding'),
                    domain_embedding=chunk_data.get('domain_embedding'),
                    general_model=chunk_data.get('general_model'),
                    domain_model=chunk_data.get('domain_model'),
                    vectorization_strategy=chunk_data.get('vectorization_strategy'),
                    
                    # 时间戳
                    created_at=chunk_data.get('created_at', datetime.utcnow()),
                    updated_at=chunk_data.get('updated_at', datetime.utcnow())
                )
                chunks.append(chunk)
                logger.debug(f"分块 {i} 创建成功: {chunk.id}")
                
            except Exception as e:
                logger.error(f"创建分块 {i} 失败: {e}")
                logger.error(f"失败的分块数据: {chunk_data}")
                raise
        
        self.session.add_all(chunks)
        await self.session.commit()
        return chunks
    
    async def create_chunks_batch(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """批量创建文档分块对象"""
        self.session.add_all(chunks)
        await self.session.commit()
        return chunks
    
    async def get_chunks_by_document(self, document_id: str) -> List[DocumentChunk]:
        """获取文档的所有分块"""
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update_chunk_embedding(
        self, 
        chunk_id: str, 
        embedding: List[float], 
        model: str
    ) -> bool:
        """更新分块的向量嵌入"""
        stmt = (
            update(DocumentChunk)
            .where(DocumentChunk.id == chunk_id)
            .values(embedding=embedding, embedding_model=model)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def update_chunk_dual_embeddings(
        self,
        chunk_id: str,
        general_embedding: List[float],
        domain_embedding: List[float],
        general_model: str,
        domain_model: str,
        vectorization_strategy: str = "dual"
    ) -> bool:
        """更新分块的双向量嵌入"""
        stmt = (
            update(DocumentChunk)
            .where(DocumentChunk.id == chunk_id)
            .values(
                general_embedding=general_embedding,
                domain_embedding=domain_embedding,
                general_model=general_model,
                domain_model=domain_model,
                vectorization_strategy=vectorization_strategy
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def update_chunk_embeddings(
        self,
        chunk_id: str,
        general_embedding: List[float],
        general_model: str,
        vectorization_strategy: str = "general"
    ) -> bool:
        """更新分块的通用向量嵌入"""
        stmt = (
            update(DocumentChunk)
            .where(DocumentChunk.id == chunk_id)
            .values(
                general_embedding=general_embedding,
                general_model=general_model,
                vectorization_strategy=vectorization_strategy
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def search_by_content(self, query: str, limit: int = 50) -> List[DocumentChunk]:
        """根据内容搜索分块"""
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.content.ilike(f"%{query}%"))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_chunks_with_embeddings(self, model: str = None) -> List[DocumentChunk]:
        """获取有向量嵌入的分块"""
        stmt = select(DocumentChunk).where(DocumentChunk.embedding.isnot(None))
        
        if model:
            stmt = stmt.where(DocumentChunk.embedding_model == model)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()


class VectorConfigRepository:
    """向量配置仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, config_data: Dict[str, Any]) -> VectorConfig:
        """创建向量配置"""
        config_id = str(uuid.uuid4())
        config = VectorConfig(id=config_id, **config_data)
        
        # 如果设置为默认配置，先取消其他默认配置
        if config_data.get("is_default"):
            await self._unset_other_defaults()
        
        self.session.add(config)
        await self.session.commit()
        await self.session.refresh(config)
        return config
    
    async def get_by_id(self, config_id: str) -> Optional[VectorConfig]:
        """根据ID获取配置"""
        stmt = select(VectorConfig).where(VectorConfig.id == config_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_default(self) -> Optional[VectorConfig]:
        """获取默认配置"""
        stmt = select(VectorConfig).where(VectorConfig.is_default == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(self) -> List[VectorConfig]:
        """获取所有配置"""
        stmt = select(VectorConfig).order_by(VectorConfig.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, config_id: str, update_data: Dict[str, Any]) -> Optional[VectorConfig]:
        """更新配置"""
        # 如果要设置为默认配置，先取消其他默认配置
        if update_data.get("is_default"):
            await self._unset_other_defaults()
        
        stmt = (
            update(VectorConfig)
            .where(VectorConfig.id == config_id)
            .values(**update_data)
            .returning(VectorConfig)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, config_id: str) -> bool:
        """删除配置"""
        stmt = delete(VectorConfig).where(VectorConfig.id == config_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def _unset_other_defaults(self):
        """取消其他默认配置"""
        stmt = update(VectorConfig).where(VectorConfig.is_default == True).values(is_default=False)
        await self.session.execute(stmt)


class ModelConfigRepository:
    """模型配置仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, config_data: Dict[str, Any]) -> ModelConfig:
        """创建模型配置"""
        config_id = str(uuid.uuid4())
        config = ModelConfig(id=config_id, **config_data)
        self.session.add(config)
        await self.session.commit()
        await self.session.refresh(config)
        return config
    
    async def get_by_id(self, config_id: str) -> Optional[ModelConfig]:
        """根据ID获取配置"""
        stmt = select(ModelConfig).where(ModelConfig.id == config_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_type(self, model_type: str) -> List[ModelConfig]:
        """根据类型获取配置"""
        stmt = (
            select(ModelConfig)
            .where(ModelConfig.type == model_type)
            .where(ModelConfig.is_active == True)
            .order_by(ModelConfig.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_all(self, active_only: bool = True) -> List[ModelConfig]:
        """获取所有配置"""
        stmt = select(ModelConfig)
        
        if active_only:
            stmt = stmt.where(ModelConfig.is_active == True)
        
        stmt = stmt.order_by(ModelConfig.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, config_id: str, update_data: Dict[str, Any]) -> Optional[ModelConfig]:
        """更新配置"""
        stmt = (
            update(ModelConfig)
            .where(ModelConfig.id == config_id)
            .values(**update_data)
            .returning(ModelConfig)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, config_id: str) -> bool:
        """删除配置"""
        stmt = delete(ModelConfig).where(ModelConfig.id == config_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0


class RetrievalResultRepository:
    """检索结果缓存仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def cache_result(
        self, 
        query: str, 
        results: List[Dict[str, Any]], 
        parameters: Dict[str, Any],
        ttl_hours: int = 24
    ) -> RetrievalResult:
        """缓存检索结果"""
        query_hash = hashlib.md5(
            f"{query}_{parameters.get('top_k')}_{parameters.get('threshold')}_{parameters.get('model')}".encode()
        ).hexdigest()
        
        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
        
        result_id = str(uuid.uuid4())
        cached_result = RetrievalResult(
            id=result_id,
            query=query,
            query_hash=query_hash,
            results=results,
            top_k=parameters.get('top_k', 10),
            threshold=parameters.get('threshold'),
            rerank=parameters.get('rerank', False),
            model_used=parameters.get('model'),
            retrieval_time=parameters.get('retrieval_time'),
            total_matches=len(results),
            expires_at=expires_at
        )
        
        self.session.add(cached_result)
        await self.session.commit()
        return cached_result
    
    async def get_cached_result(self, query: str, parameters: Dict[str, Any]) -> Optional[RetrievalResult]:
        """获取缓存的检索结果"""
        query_hash = hashlib.md5(
            f"{query}_{parameters.get('top_k')}_{parameters.get('threshold')}_{parameters.get('model')}".encode()
        ).hexdigest()
        
        stmt = (
            select(RetrievalResult)
            .where(RetrievalResult.query_hash == query_hash)
            .where(or_(
                RetrievalResult.expires_at.is_(None),
                RetrievalResult.expires_at > datetime.utcnow()
            ))
            .order_by(RetrievalResult.created_at.desc())
        )
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def cleanup_expired(self) -> int:
        """清理过期的缓存结果"""
        stmt = delete(RetrievalResult).where(
            and_(
                RetrievalResult.expires_at.isnot(None),
                RetrievalResult.expires_at < datetime.utcnow()
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount


# 为向后兼容，创建统一的 KnowledgeRepository 类
class KnowledgeRepository:
    """统一知识库仓库（向后兼容）"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.documents = KnowledgeDocumentRepository(session)
        self.chunks = DocumentChunkRepository(session)
        self.vectors = VectorConfigRepository(session)
        self.models = ModelConfigRepository(session)
        self.retrieval = RetrievalResultRepository(session)
    
    # 便捷方法，委托给子仓库
    async def get_document_by_id(self, document_id: str) -> Optional[KnowledgeDocument]:
        """根据ID获取文档（便捷方法）"""
        return await self.documents.get_by_id(document_id)
    
    async def get_document(self, document_id: str) -> Optional[KnowledgeDocument]:
        """根据ID获取文档（别名方法）"""
        return await self.documents.get_by_id(document_id)
    
    async def create_document(self, document: KnowledgeDocument) -> KnowledgeDocument:
        """创建文档对象（便捷方法）"""
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document
    
    async def update_document(self, document_id: str, update_data: Dict[str, Any]) -> bool:
        """更新文档（便捷方法）"""
        return await self.documents.update(document_id, update_data)
    
    async def delete(self, document_id: str) -> bool:
        """删除文档（便捷方法）"""
        return await self.documents.delete(document_id)
    
    async def delete_document_chunks(self, document_id: str) -> bool:
        """删除文档所有分块（便捷方法）"""
        try:
            stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            result = await self.session.execute(stmt)
            await self.session.commit()
            return result.rowcount > 0
        except Exception as e:
            logger.error(f"删除文档分块失败: {str(e)}")
            return False
    
    async def create_chunks_batch(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """批量创建文档分块对象（便捷方法）"""
        return await self.chunks.create_chunks_batch(chunks)

    async def get_chunks_by_document(self, document_id: str) -> List[DocumentChunk]:
        """获取文档的所有分块（便捷方法）"""
        return await self.chunks.get_chunks_by_document(document_id)

    async def update_document_status(self, document_id: str, status: str) -> bool:
        """更新文档状态（便捷方法）"""
        return await self.documents.update_document_status(document_id, status)
    
    async def get_collection_by_id(self, collection_id: str) -> Optional[KnowledgeCollection]:
        """根据ID获取知识库集合"""
        try:
            result = await self.session.execute(
                select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"获取知识库集合失败: {str(e)}")
            return None