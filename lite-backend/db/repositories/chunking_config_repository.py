"""
切分配置数据访问层
"""

import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.chunking_config import ChunkingConfig


class ChunkingConfigRepository:
    """切分配置仓储"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, config_id: str) -> Optional[ChunkingConfig]:
        """根据ID获取配置"""
        stmt = select(ChunkingConfig).where(ChunkingConfig.id == config_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_default_configs(self) -> List[ChunkingConfig]:
        """创建默认切分配置"""
        default_configs = [
            {
                "id": str(uuid.uuid4()),
                "name": "通用文档切分",
                "description": "适合大多数文档的通用切分配置，平衡切分质量和处理效率",
                "strategy": "semantic",
                "chunk_token_num": 400,
                "max_token_num": 512,
                "chunk_overlap": 50,
                "delimiter": "!?。！？.;",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 30,
                "supported_formats": ["txt", "md", "pdf", "docx"],
                "is_default": True,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "学术论文切分",
                "description": "专门针对学术论文的切分配置，保留更多结构信息",
                "strategy": "semantic",
                "chunk_token_num": 300,
                "max_token_num": 600,
                "chunk_overlap": 80,
                "delimiter": "!?。！？.;",
                "tokenizer_type": "advanced",
                "preserve_structure": True,
                "semantic_threshold": 40,
                "supported_formats": ["pdf", "docx", "txt"],
                "is_default": False,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "快速处理切分",
                "description": "快速处理模式，适合大批量文档的快速切分",
                "strategy": "fixed",
                "chunk_token_num": 256,
                "max_token_num": 400,
                "chunk_overlap": 20,
                "delimiter": "。！？",
                "tokenizer_type": "simple",
                "preserve_structure": False,
                "semantic_threshold": 20,
                "supported_formats": ["txt", "md"],
                "is_default": False,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "精细切分",
                "description": "高质量精细切分，适合重要文档的详细分析",
                "strategy": "semantic",
                "chunk_token_num": 200,
                "max_token_num": 400,
                "chunk_overlap": 100,
                "delimiter": "!?。！？.;,:：，",
                "tokenizer_type": "advanced",
                "preserve_structure": True,
                "semantic_threshold": 50,
                "supported_formats": ["pdf", "docx", "md", "txt"],
                "is_default": False,
                "is_active": True
            }
        ]
        
        created_configs = []
        for config_data in default_configs:
            config = ChunkingConfig(**config_data)
            self.session.add(config)
            created_configs.append(config)
        
        await self.session.commit()
        return created_configs
    
    async def get_default_config(self) -> Optional[ChunkingConfig]:
        """获取默认配置"""
        stmt = select(ChunkingConfig).where(
            and_(
                ChunkingConfig.is_default == True,
                ChunkingConfig.is_active == True
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def set_default_config(self, config_id: str) -> bool:
        """设置默认配置"""
        # 先取消所有默认配置
        stmt = select(ChunkingConfig).where(ChunkingConfig.is_default == True)
        result = await self.session.execute(stmt)
        current_defaults = result.scalars().all()
        
        for config in current_defaults:
            config.is_default = False
        
        # 设置新的默认配置
        config = await self.get_by_id(config_id)
        if config:
            config.is_default = True
            await self.session.commit()
            return True
        
        return False
    
    async def get_active_configs(self, skip: int = 0, limit: int = 100) -> List[ChunkingConfig]:
        """获取启用的配置列表"""
        stmt = select(ChunkingConfig).where(
            ChunkingConfig.is_active == True
        ).order_by(
            desc(ChunkingConfig.is_default),
            asc(ChunkingConfig.name)
        ).offset(skip).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_strategy(self, strategy: str) -> List[ChunkingConfig]:
        """根据切分策略获取配置"""
        stmt = select(ChunkingConfig).where(
            and_(
                ChunkingConfig.strategy == strategy,
                ChunkingConfig.is_active == True
            )
        ).order_by(asc(ChunkingConfig.name))
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def search_configs(self, keyword: str) -> List[ChunkingConfig]:
        """搜索配置"""
        stmt = select(ChunkingConfig).where(
            and_(
                ChunkingConfig.name.ilike(f"%{keyword}%"),
                ChunkingConfig.is_active == True
            )
        ).order_by(
            desc(ChunkingConfig.is_default),
            asc(ChunkingConfig.name)
        )
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def create_config(self, config_data: Dict[str, Any]) -> ChunkingConfig:
        """创建新配置"""
        config_data["id"] = str(uuid.uuid4())
        config = ChunkingConfig(**config_data)
        
        self.session.add(config)
        await self.session.commit()
        await self.session.refresh(config)
        
        return config
    
    async def update_config(self, config_id: str, update_data: Dict[str, Any]) -> Optional[ChunkingConfig]:
        """更新配置"""
        config = await self.get_by_id(config_id)
        if not config:
            return None
        
        for key, value in update_data.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        await self.session.commit()
        await self.session.refresh(config)
        
        return config
    
    async def delete_config(self, config_id: str) -> bool:
        """删除配置（软删除，设置为非活跃状态）"""
        config = await self.get_by_id(config_id)
        if not config:
            return False
        
        # 如果是默认配置，需要先设置其他配置为默认
        if config.is_default:
            other_configs = await self.get_active_configs()
            for other_config in other_configs:
                if other_config.id != config_id:
                    other_config.is_default = True
                    break
        
        config.is_active = False
        await self.session.commit()
        
        return True
    
    async def get_config_stats(self) -> Dict[str, Any]:
        """获取配置统计信息"""
        stmt = select(ChunkingConfig).where(ChunkingConfig.is_active == True)
        result = await self.session.execute(stmt)
        all_configs = list(result.scalars().all())
        
        strategies = {}
        for config in all_configs:
            if config.strategy not in strategies:
                strategies[config.strategy] = 0
            strategies[config.strategy] += 1
        
        return {
            "total_configs": len(all_configs),
            "strategies": strategies,
            "has_default": any(config.is_default for config in all_configs)
        }
    
    async def get_configs_with_filters(
        self,
        skip: int = 0,
        limit: int = 100,
        strategy_filter: Optional[str] = None,
        scope_filter: Optional[str] = None,
        collection_id_filter: Optional[str] = None
    ) -> List[ChunkingConfig]:
        """根据过滤条件获取配置列表"""
        stmt = select(ChunkingConfig).where(ChunkingConfig.is_active == True)
        
        # 作用域过滤
        if scope_filter:
            stmt = stmt.where(ChunkingConfig.scope == scope_filter)
        
        # 知识库ID过滤（仅对collection_specific作用域有效）
        if collection_id_filter and scope_filter == 'collection_specific':
            stmt = stmt.where(ChunkingConfig.collection_id == collection_id_filter)
        
        # 策略过滤
        if strategy_filter and strategy_filter.strip():
            stmt = stmt.where(ChunkingConfig.strategy == strategy_filter)
        
        # 排序和分页
        stmt = stmt.order_by(ChunkingConfig.is_default.desc(), ChunkingConfig.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())