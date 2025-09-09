"""
知识库集合切分配置管理服务
专门处理知识库级别的切分规则配置
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select, update, text

from models.knowledge_collection import KnowledgeCollection
from models.chunking_config import ChunkingConfig
from core.logger import logger


class CollectionChunkingService:
    """知识库集合切分配置管理服务"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_collection_chunking_config(
        self, 
        collection_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        获取指定知识库的切分配置
        
        Args:
            collection_id: 知识库ID
            
        Returns:
            Dict: 包含切分配置的详细信息
        """
        try:
            # 使用视图查询Collection及其切分配置信息
            query = text("""
                SELECT 
                    kc.id,
                    kc.name as collection_name,
                    kc.default_chunking_config_id,
                    kc.chunking_config,
                    cc.id as config_id,
                    cc.name as config_name,
                    cc.description as config_description,
                    cc.strategy,
                    cc.chunk_token_num,
                    cc.max_token_num,
                    cc.chunk_overlap,
                    cc.delimiter,
                    cc.tokenizer_type,
                    cc.preserve_structure,
                    cc.semantic_threshold,
                    cc.supported_formats,
                    cc.is_active as config_active
                FROM knowledge_collections kc
                LEFT JOIN chunking_configs cc ON kc.default_chunking_config_id = cc.id
                WHERE kc.id = :collection_id
            """)
            
            result = await self.session.execute(query, {"collection_id": collection_id})
            row = result.fetchone()
            
            if not row:
                logger.warning(f"知识库 {collection_id} 不存在")
                return None
            
            # 构建返回数据
            config_data = {
                "collection_id": row.id,
                "collection_name": row.collection_name,
                "default_chunking_config_id": row.default_chunking_config_id,
                "custom_chunking_config": row.chunking_config,
                "chunking_config": {
                    "id": row.config_id,
                    "name": row.config_name,
                    "description": row.config_description,
                    "strategy": row.strategy,
                    "chunk_token_num": row.chunk_token_num,
                    "max_token_num": row.max_token_num,
                    "chunk_overlap": row.chunk_overlap,
                    "delimiter": row.delimiter,
                    "tokenizer_type": row.tokenizer_type,
                    "preserve_structure": row.preserve_structure,
                    "semantic_threshold": row.semantic_threshold,
                    "supported_formats": row.supported_formats,
                    "is_active": row.config_active
                } if row.config_id else None
            }
            
            logger.debug(f"获取知识库 {collection_id} 的切分配置成功")
            return config_data
            
        except Exception as e:
            logger.error(f"获取知识库切分配置失败: {str(e)}")
            raise
    
    async def set_collection_chunking_config(
        self,
        collection_id: str,
        chunking_config_id: str,
        custom_config: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        设置知识库的切分配置
        
        Args:
            collection_id: 知识库ID
            chunking_config_id: 切分配置ID
            custom_config: 自定义配置（可选）
            
        Returns:
            bool: 是否设置成功
        """
        try:
            # 检查切分配置是否存在且有效
            config_query = select(ChunkingConfig).where(
                ChunkingConfig.id == chunking_config_id,
                ChunkingConfig.is_active == True
            )
            config_result = await self.session.execute(config_query)
            config = config_result.scalar_one_or_none()
            
            if not config:
                logger.error(f"切分配置 {chunking_config_id} 不存在或未激活")
                return False
            
            # 更新知识库的切分配置
            update_query = (
                update(KnowledgeCollection)
                .where(KnowledgeCollection.id == collection_id)
                .values(
                    default_chunking_config_id=chunking_config_id,
                    chunking_config=custom_config or {
                        "inherit_from_global": True,
                        "custom_rules": {},
                        "override_settings": {}
                    },
                    updated_at=datetime.utcnow()
                )
            )
            
            result = await self.session.execute(update_query)
            
            if result.rowcount == 0:
                logger.error(f"知识库 {collection_id} 不存在")
                return False
            
            await self.session.commit()
            logger.info(f"成功设置知识库 {collection_id} 的切分配置为 {chunking_config_id}")
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"设置知识库切分配置失败: {str(e)}")
            raise
    
    async def get_available_chunking_configs(self) -> List[Dict[str, Any]]:
        """
        获取所有可用的切分配置
        
        Returns:
            List[Dict]: 可用的切分配置列表
        """
        try:
            query = (
                select(ChunkingConfig)
                .where(ChunkingConfig.is_active == True)
                .order_by(ChunkingConfig.is_default.desc(), ChunkingConfig.name)
            )
            
            result = await self.session.execute(query)
            configs = result.scalars().all()
            
            config_list = []
            for config in configs:
                config_dict = {
                    "id": config.id,
                    "name": config.name,
                    "description": config.description,
                    "strategy": config.strategy,
                    "chunk_token_num": config.chunk_token_num,
                    "max_token_num": config.max_token_num,
                    "chunk_overlap": config.chunk_overlap,
                    "delimiter": config.delimiter,
                    "tokenizer_type": config.tokenizer_type,
                    "preserve_structure": config.preserve_structure,
                    "semantic_threshold": config.semantic_threshold,
                    "supported_formats": config.supported_formats,
                    "is_default": config.is_default,
                    "is_active": config.is_active,
                    "created_at": config.created_at.isoformat() if config.created_at else None,
                    "updated_at": config.updated_at.isoformat() if config.updated_at else None
                }
                config_list.append(config_dict)
            
            logger.debug(f"获取到 {len(config_list)} 个可用切分配置")
            return config_list
            
        except Exception as e:
            logger.error(f"获取可用切分配置失败: {str(e)}")
            raise
    
    async def reset_collection_to_default_chunking(
        self,
        collection_id: str
    ) -> bool:
        """
        重置知识库到默认切分配置
        
        Args:
            collection_id: 知识库ID
            
        Returns:
            bool: 是否重置成功
        """
        try:
            # 获取默认切分配置
            default_config_query = select(ChunkingConfig).where(
                ChunkingConfig.is_default == True,
                ChunkingConfig.is_active == True
            )
            default_result = await self.session.execute(default_config_query)
            default_config = default_result.scalar_one_or_none()
            
            if not default_config:
                logger.error("未找到默认切分配置")
                return False
            
            # 重置知识库配置
            return await self.set_collection_chunking_config(
                collection_id=collection_id,
                chunking_config_id=default_config.id,
                custom_config={
                    "inherit_from_global": True,
                    "custom_rules": {},
                    "override_settings": {}
                }
            )
            
        except Exception as e:
            logger.error(f"重置知识库切分配置失败: {str(e)}")
            raise
    
    async def update_custom_chunking_config(
        self,
        collection_id: str,
        custom_config: Dict[str, Any]
    ) -> bool:
        """
        更新知识库的自定义切分配置
        
        Args:
            collection_id: 知识库ID
            custom_config: 自定义配置
            
        Returns:
            bool: 是否更新成功
        """
        try:
            update_query = (
                update(KnowledgeCollection)
                .where(KnowledgeCollection.id == collection_id)
                .values(
                    chunking_config=custom_config,
                    updated_at=datetime.utcnow()
                )
            )
            
            result = await self.session.execute(update_query)
            
            if result.rowcount == 0:
                logger.error(f"知识库 {collection_id} 不存在")
                return False
            
            await self.session.commit()
            logger.info(f"成功更新知识库 {collection_id} 的自定义切分配置")
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新自定义切分配置失败: {str(e)}")
            raise