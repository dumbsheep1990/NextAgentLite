"""
知识库集合服务层 - Collection管理和元数据模版系统
"""
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload

from models.knowledge_collection import (
    KnowledgeCollection, 
    MetadataTemplate,
    DEFAULT_COLLECTION_CONFIG,
    DEFAULT_TEMPLATE_CONFIG
)
from core.logger import logger


class KnowledgeCollectionService:
    """知识库集合服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_collection(
        self,
        name: str,
        description: Optional[str] = None,
        metadata_template: str = "general",
        icon: Optional[str] = None,
        color: Optional[str] = None,
        is_public: bool = True,
        config: Optional[Dict[str, Any]] = None,
        template_config: Optional[Dict[str, Any]] = None
    ) -> KnowledgeCollection:
        """创建新的知识库集合"""
        try:
            collection_id = str(uuid.uuid4())
            
            collection = KnowledgeCollection(
                id=collection_id,
                name=name,
                description=description,
                metadata_template=metadata_template,
                icon=icon,
                color=color,
                is_public=is_public,
                config=config or DEFAULT_COLLECTION_CONFIG.copy(),
                template_config=template_config or DEFAULT_TEMPLATE_CONFIG.copy()
            )
            
            self.db.add(collection)
            await self.db.commit()
            await self.db.refresh(collection)
            
            logger.info(f"创建知识库集合成功: {collection_id}")
            return collection
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"创建知识库集合失败: {str(e)}")
            raise
    
    async def get_collection(self, collection_id: str) -> Optional[KnowledgeCollection]:
        """获取指定知识库集合"""
        try:
            result = await self.db.execute(
                select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"获取知识库集合失败: {str(e)}")
            raise
    
    async def list_collections(
        self,
        skip: int = 0,
        limit: int = 10,
        is_active: Optional[bool] = None,
        metadata_template: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[KnowledgeCollection]:
        """获取知识库集合列表"""
        try:
            query = select(KnowledgeCollection)
            
            # 添加过滤条件
            conditions = []
            if is_active is not None:
                conditions.append(KnowledgeCollection.is_active == is_active)
            if metadata_template:
                conditions.append(KnowledgeCollection.metadata_template == metadata_template)
            if search:
                search_condition = or_(
                    KnowledgeCollection.name.ilike(f"%{search}%"),
                    KnowledgeCollection.description.ilike(f"%{search}%")
                )
                conditions.append(search_condition)
            
            if conditions:
                query = query.where(and_(*conditions))
            
            # 排序和分页
            query = query.order_by(KnowledgeCollection.created_at.desc())
            query = query.offset(skip).limit(limit)
            
            result = await self.db.execute(query)
            collections = result.scalars().all()
            
            logger.info(f"获取知识库集合列表成功，返回 {len(collections)} 个集合")
            return list(collections)
            
        except Exception as e:
            logger.error(f"获取知识库集合列表失败: {str(e)}")
            raise
    
    async def update_collection(
        self,
        collection_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        metadata_template: Optional[str] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_active: Optional[bool] = None,
        config: Optional[Dict[str, Any]] = None,
        template_config: Optional[Dict[str, Any]] = None
    ) -> Optional[KnowledgeCollection]:
        """更新知识库集合"""
        try:
            collection = await self.get_collection(collection_id)
            if not collection:
                return None
            
            # 更新字段
            if name is not None:
                collection.name = name
            if description is not None:
                collection.description = description
            if metadata_template is not None:
                collection.metadata_template = metadata_template
            if icon is not None:
                collection.icon = icon
            if color is not None:
                collection.color = color
            if is_public is not None:
                collection.is_public = is_public
            if is_active is not None:
                collection.is_active = is_active
            if config is not None:
                collection.config = config
            if template_config is not None:
                collection.template_config = template_config
            
            await self.db.commit()
            await self.db.refresh(collection)
            
            logger.info(f"更新知识库集合成功: {collection_id}")
            return collection
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"更新知识库集合失败: {str(e)}")
            raise
    
    async def delete_collection(self, collection_id: str, force: bool = False) -> bool:
        """删除知识库集合"""
        try:
            collection = await self.get_collection(collection_id)
            if not collection:
                return False
            
            # 检查是否为默认集合
            if collection.is_default and not force:
                raise ValueError("不能删除默认集合")
            
            # TODO: 检查是否有关联文档，如果有需要处理
            
            await self.db.delete(collection)
            await self.db.commit()
            
            logger.info(f"删除知识库集合成功: {collection_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"删除知识库集合失败: {str(e)}")
            raise
    
    async def search_collections(self, query: str, limit: int = 20) -> List[KnowledgeCollection]:
        """搜索知识库集合"""
        try:
            search_query = select(KnowledgeCollection).where(
                and_(
                    KnowledgeCollection.is_active == True,
                    or_(
                        KnowledgeCollection.name.ilike(f"%{query}%"),
                        KnowledgeCollection.description.ilike(f"%{query}%")
                    )
                )
            ).order_by(KnowledgeCollection.name).limit(limit)
            
            result = await self.db.execute(search_query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"搜索知识库集合失败: {str(e)}")
            raise


class MetadataTemplateService:
    """元数据模版服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_template(self, template_id: str) -> Optional[MetadataTemplate]:
        """获取元数据模版"""
        try:
            result = await self.db.execute(
                select(MetadataTemplate).where(MetadataTemplate.id == template_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"获取元数据模版失败: {str(e)}")
            raise
    
    async def list_templates(
        self,
        template_type: Optional[str] = None,
        is_active: bool = True
    ) -> List[MetadataTemplate]:
        """获取元数据模版列表"""
        try:
            query = select(MetadataTemplate)
            
            conditions = [MetadataTemplate.is_active == is_active]
            if template_type:
                conditions.append(MetadataTemplate.template_type == template_type)
            
            query = query.where(and_(*conditions))
            query = query.order_by(MetadataTemplate.name)
            
            result = await self.db.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"获取元数据模版列表失败: {str(e)}")
            raise


class CollectionStatsService:
    """知识库集合统计服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_global_statistics(self) -> Dict[str, Any]:
        """获取全局统计信息"""
        try:
            # 获取集合统计
            collection_stats = await self.db.execute(
                select(
                    func.count(KnowledgeCollection.id).label('total_collections'),
                    func.sum(func.case((KnowledgeCollection.is_active == True, 1), else_=0)).label('active_collections'),
                    func.sum(func.case((KnowledgeCollection.is_public == True, 1), else_=0)).label('public_collections'),
                    func.sum(KnowledgeCollection.document_count).label('total_documents'),
                    func.sum(KnowledgeCollection.total_size).label('total_size')
                )
            )
            stats = collection_stats.first()
            
            # 获取模版分布
            template_stats = await self.db.execute(
                select(
                    KnowledgeCollection.metadata_template,
                    func.count(KnowledgeCollection.id).label('count')
                ).group_by(KnowledgeCollection.metadata_template)
            )
            
            template_distribution = {row.metadata_template: row.count for row in template_stats}
            
            return {
                'total_collections': stats.total_collections or 0,
                'active_collections': stats.active_collections or 0,
                'public_collections': stats.public_collections or 0,
                'total_documents': stats.total_documents or 0,
                'total_size': stats.total_size or 0,
                'template_distribution': template_distribution
            }
            
        except Exception as e:
            logger.error(f"获取全局统计失败: {str(e)}")
            raise
    
    async def get_collection_statistics(self, collection_id: str) -> Dict[str, Any]:
        """获取知识库集合详细统计"""
        try:
            collection = await self.db.execute(
                select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
            )
            collection = collection.scalar_one_or_none()
            
            if not collection:
                return {"error": "知识库集合不存在"}
            
            # TODO: 添加更详细的统计信息，如文档类型分布、最近活动等
            
            return {
                'collection_id': collection_id,
                'document_count': collection.document_count,
                'total_size': collection.total_size,
                'last_updated': collection.last_updated.isoformat() if collection.last_updated else None,
                'created_at': collection.created_at.isoformat() if collection.created_at else None
            }
            
        except Exception as e:
            logger.error(f"获取集合统计失败: {str(e)}")
            raise
    
    async def get_popular_collections(self, limit: int = 10) -> List[Dict[str, Any]]:
        """获取热门知识库集合"""
        try:
            result = await self.db.execute(
                select(KnowledgeCollection)
                .where(KnowledgeCollection.is_active == True)
                .order_by(KnowledgeCollection.document_count.desc())
                .limit(limit)
            )
            
            collections = result.scalars().all()
            return [collection.to_dict() for collection in collections]
            
        except Exception as e:
            logger.error(f"获取热门集合失败: {str(e)}")
            raise