"""
知识库集合管理服务 - 核心CRUD功能
按照组件拆分原则，控制文件大小 < 400行
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete, func, desc, asc

from models.knowledge_collection import KnowledgeCollection, MetadataTemplate, DEFAULT_COLLECTION_CONFIG
from models.knowledge import KnowledgeDocument
from core.logger import logger


class KnowledgeCollectionService:
    """知识库集合管理服务"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_collection(
        self, 
        name: str,
        description: str = None,
        metadata_template: str = "general",
        icon: str = None,
        color: str = None,
        is_public: bool = True,
        config: Dict[str, Any] = None,
        template_config: Dict[str, Any] = None
    ) -> KnowledgeCollection:
        """
        创建新的知识库集合
        
        Args:
            name: 集合名称
            description: 描述
            metadata_template: 元数据模版类型
            icon: 图标
            color: 颜色
            is_public: 是否公开
            config: 配置信息
            template_config: 模版配置
            
        Returns:
            KnowledgeCollection: 创建的集合对象
        """
        try:
            # 生成唯一ID
            collection_id = str(uuid.uuid4())
            
            # 合并默认配置
            final_config = DEFAULT_COLLECTION_CONFIG.copy()
            if config:
                final_config.update(config)

            # 初始化 HiRAG 工作目录到集合配置（per-collection working_dir）
            import os
            hirag_base_dir = os.getenv('HIRAG_BASE_DIR', './hirag_workspace')
            # 先生成ID以便拼接路径
            collection_id = str(uuid.uuid4())
            working_dir = os.path.join(hirag_base_dir, collection_id)
            try:
                os.makedirs(working_dir, exist_ok=True)
            except Exception as e:
                logger.warning(f"[HiRAG] 创建工作目录失败: {working_dir} - {e}")

            # 将hirag配置写入config JSON
            final_config.setdefault('hirag', {})
            final_config['hirag']['working_dir'] = working_dir
            final_config['hirag']['status'] = 'not_ready'
            
            # 创建集合对象
            collection = KnowledgeCollection(
                id=collection_id,
                name=name,
                description=description,
                metadata_template=metadata_template,
                icon=icon,
                color=color,
                is_public=is_public,
                config=final_config,
                template_config=template_config or {}
            )
            
            self.session.add(collection)
            await self.session.commit()
            await self.session.refresh(collection)
            
            logger.info(f"创建知识库集合成功: {name} (ID: {collection_id})")
            return collection
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"创建知识库集合失败: {str(e)}")
            raise
    
    async def get_collection(
        self, 
        collection_id: str,
        include_documents: bool = False
    ) -> Optional[KnowledgeCollection]:
        """
        获取指定集合
        
        Args:
            collection_id: 集合ID
            include_documents: 是否包含文档信息
            
        Returns:
            Optional[KnowledgeCollection]: 集合对象或None
        """
        try:
            query = select(KnowledgeCollection).where(
                KnowledgeCollection.id == collection_id
            )
            
            if include_documents:
                query = query.options(selectinload(KnowledgeCollection.documents))
            
            result = await self.session.execute(query)
            collection = result.scalar_one_or_none()
            
            if collection:
                logger.debug(f"获取知识库集合: {collection.name}")
            
            return collection
            
        except Exception as e:
            logger.error(f"获取知识库集合失败: {str(e)}")
            raise
    
    async def list_collections(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        is_public: Optional[bool] = None,
        metadata_template: Optional[str] = None,
        order_by: str = "created_at",
        order_desc: bool = True
    ) -> List[KnowledgeCollection]:
        """
        获取集合列表
        
        Args:
            skip: 跳过数量
            limit: 限制数量
            is_active: 是否激活
            is_public: 是否公开
            metadata_template: 模版类型过滤
            order_by: 排序字段
            order_desc: 是否降序
            
        Returns:
            List[KnowledgeCollection]: 集合列表
        """
        try:
            query = select(KnowledgeCollection)
            if is_active is not None:
                query = query.where(KnowledgeCollection.is_active == is_active)
            
            # 添加过滤条件
            if is_public is not None:
                query = query.where(KnowledgeCollection.is_public == is_public)
            
            if metadata_template:
                query = query.where(KnowledgeCollection.metadata_template == metadata_template)
            
            # 添加排序
            if hasattr(KnowledgeCollection, order_by):
                order_field = getattr(KnowledgeCollection, order_by)
                if order_desc:
                    query = query.order_by(desc(order_field))
                else:
                    query = query.order_by(asc(order_field))
            
            # 添加分页
            query = query.offset(skip).limit(limit)
            
            result = await self.session.execute(query)
            collections = result.scalars().all()
            
            logger.debug(f"获取知识库集合列表: {len(collections)} 个")
            return list(collections)
            
        except Exception as e:
            logger.error(f"获取知识库集合列表失败: {str(e)}")
            raise
    
    async def update_collection(
        self,
        collection_id: str,
        name: str = None,
        description: str = None,
        metadata_template: str = None,
        icon: str = None,
        color: str = None,
        is_public: bool = None,
        is_active: bool = None,
        config: Dict[str, Any] = None,
        template_config: Dict[str, Any] = None
    ) -> Optional[KnowledgeCollection]:
        """
        更新知识库集合
        
        Args:
            collection_id: 集合ID
            **kwargs: 更新字段
            
        Returns:
            Optional[KnowledgeCollection]: 更新后的集合对象
        """
        try:
            # 构建更新字段
            update_fields = {}
            if name is not None:
                update_fields['name'] = name
            if description is not None:
                update_fields['description'] = description
            if metadata_template is not None:
                update_fields['metadata_template'] = metadata_template
            if icon is not None:
                update_fields['icon'] = icon
            if color is not None:
                update_fields['color'] = color
            if is_public is not None:
                update_fields['is_public'] = is_public
            if is_active is not None:
                update_fields['is_active'] = is_active
            if config is not None:
                update_fields['config'] = config
            if template_config is not None:
                update_fields['template_config'] = template_config
            
            if not update_fields:
                # 没有更新字段，直接返回原对象
                return await self.get_collection(collection_id)
            
            # 添加更新时间
            update_fields['updated_at'] = func.now()
            
            # 执行更新
            stmt = update(KnowledgeCollection).where(
                KnowledgeCollection.id == collection_id
            ).values(**update_fields)
            
            result = await self.session.execute(stmt)
            
            if result.rowcount == 0:
                logger.warning(f"知识库集合不存在: {collection_id}")
                return None
            
            await self.session.commit()
            
            # 获取更新后的对象
            updated_collection = await self.get_collection(collection_id)
            logger.info(f"更新知识库集合成功: {collection_id}")
            
            return updated_collection
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新知识库集合失败: {str(e)}")
            raise
    
    async def delete_collection(
        self,
        collection_id: str,
        force: bool = False
    ) -> bool:
        """
        删除知识库集合
        
        Args:
            collection_id: 集合ID
            force: 是否强制删除（即使有关联文档）
            
        Returns:
            bool: 是否删除成功
        """
        try:
            # 检查是否为默认集合
            collection = await self.get_collection(collection_id)
            if not collection:
                logger.warning(f"知识库集合不存在: {collection_id}")
                return False
            
            if collection.is_default:
                logger.error(f"无法删除默认知识库集合: {collection_id}")
                raise ValueError("无法删除默认知识库集合")
            
            # 检查是否有关联文档
            if not force:
                doc_count_query = select(func.count(KnowledgeDocument.id)).where(
                    KnowledgeDocument.collection_id == collection_id
                )
                result = await self.session.execute(doc_count_query)
                doc_count = result.scalar()
                
                if doc_count > 0:
                    logger.error(f"知识库集合 {collection_id} 还有 {doc_count} 个关联文档，无法删除")
                    raise ValueError(f"集合中还有 {doc_count} 个文档，无法删除")
            else:
                # 强制删除：将关联文档移动到默认集合
                await self._move_documents_to_default(collection_id)
            
            # 执行删除
            stmt = delete(KnowledgeCollection).where(
                KnowledgeCollection.id == collection_id
            )
            
            result = await self.session.execute(stmt)
            await self.session.commit()
            
            if result.rowcount > 0:
                logger.info(f"删除知识库集合成功: {collection_id}")
                return True
            else:
                logger.warning(f"知识库集合不存在: {collection_id}")
                return False
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"删除知识库集合失败: {str(e)}")
            raise
    
    async def _move_documents_to_default(self, collection_id: str):
        """将文档移动到默认集合"""
        try:
            # 获取默认集合
            default_collection_query = select(KnowledgeCollection.id).where(
                KnowledgeCollection.is_default == True
            )
            result = await self.session.execute(default_collection_query)
            default_collection_id = result.scalar_one_or_none()
            
            if not default_collection_id:
                raise ValueError("未找到默认知识库集合")
            
            # 移动文档
            stmt = update(KnowledgeDocument).where(
                KnowledgeDocument.collection_id == collection_id
            ).values(collection_id=default_collection_id)
            
            await self.session.execute(stmt)
            logger.info(f"已将集合 {collection_id} 的文档移动到默认集合")
            
        except Exception as e:
            logger.error(f"移动文档到默认集合失败: {str(e)}")
            raise
    
    async def get_collection_count(
        self,
        is_active: bool = True,
        is_public: Optional[bool] = None
    ) -> int:
        """
        获取集合数量
        
        Args:
            is_active: 是否激活
            is_public: 是否公开
            
        Returns:
            int: 集合数量
        """
        try:
            query = select(func.count(KnowledgeCollection.id)).where(
                KnowledgeCollection.is_active == is_active
            )
            
            if is_public is not None:
                query = query.where(KnowledgeCollection.is_public == is_public)
            
            result = await self.session.execute(query)
            count = result.scalar()
            
            return count or 0
            
        except Exception as e:
            logger.error(f"获取集合数量失败: {str(e)}")
            raise
    
    async def search_collections(
        self,
        search_term: str,
        limit: int = 20
    ) -> List[KnowledgeCollection]:
        """
        搜索知识库集合
        
        Args:
            search_term: 搜索词
            limit: 限制数量
            
        Returns:
            List[KnowledgeCollection]: 搜索结果
        """
        try:
            query = select(KnowledgeCollection).where(
                KnowledgeCollection.is_active == True
            ).where(
                KnowledgeCollection.name.ilike(f"%{search_term}%") | 
                KnowledgeCollection.description.ilike(f"%{search_term}%")
            ).order_by(
                desc(KnowledgeCollection.document_count)
            ).limit(limit)
            
            result = await self.session.execute(query)
            collections = result.scalars().all()
            
            logger.debug(f"搜索知识库集合: '{search_term}' 找到 {len(collections)} 个结果")
            return list(collections)
            
        except Exception as e:
            logger.error(f"搜索知识库集合失败: {str(e)}")
            raise
