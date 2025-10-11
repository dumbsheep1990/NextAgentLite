"""
切分配置管理服务
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_async_session
from db.repositories.chunking_config_repository import ChunkingConfigRepository
from models.chunking_config import ChunkingConfig
from core.logger import logger


class ChunkingConfigService:
    """切分配置管理服务"""
    
    def __init__(self):
        pass
    
    async def initialize_default_configs(self, force: bool = False, normalize: bool = True, dedupe: bool = True) -> List[ChunkingConfig]:
        """初始化默认配置
        Args:
            force: 为True时，无论是否已有默认配置，仍尝试创建一批通用模板（保留已有）
            normalize: 为True时，对现有名称做通用化规范（去除领域/场景词）
        """
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            # 若未设置force且已存在默认配置，直接走规范化或返回
            existing_default = await repo.get_default_config()
            if existing_default and not force:
                logger.info("默认切分配置已存在，执行规范化/返回现有配置")
                if normalize:
                    await repo.normalize_names_to_generic_types()
                if dedupe:
                    await repo.dedupe_active_configs()
                return await repo.get_active_configs()
            
            # 创建默认配置（不会删除旧配置）
            created = await repo.create_default_configs()
            logger.info(f"成功创建 {len(created)} 个默认切分配置")
            
            if normalize:
                await repo.normalize_names_to_generic_types()
            if dedupe:
                await repo.dedupe_active_configs()
            
            return await repo.get_active_configs()
    
    async def get_all_configs(
        self, 
        skip: int = 0, 
        limit: int = 100,
        strategy_filter: Optional[str] = None,
        scope_filter: Optional[str] = None,
        collection_id_filter: Optional[str] = None
    ) -> List[ChunkingConfig]:
        """获取所有配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            return await repo.get_configs_with_filters(
                skip=skip,
                limit=limit,
                strategy_filter=strategy_filter,
                scope_filter=scope_filter or 'global',  # 默认只返回全局配置
                collection_id_filter=collection_id_filter
            )
    
    async def get_config_by_id(self, config_id: str) -> Optional[ChunkingConfig]:
        """根据ID获取配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            return await repo.get_by_id(config_id)
    
    async def get_default_config(self) -> Optional[ChunkingConfig]:
        """获取默认配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            return await repo.get_default_config()
    
    async def create_config(self, config_data: Dict[str, Any]) -> ChunkingConfig:
        """创建新配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            # 验证数据
            self._validate_config_data(config_data)
            
            config = await repo.create_config(config_data)
            logger.info(f"创建切分配置成功: {config.name} ({config.id})")
            
            return config
    
    async def update_config(self, config_id: str, update_data: Dict[str, Any]) -> Optional[ChunkingConfig]:
        """更新配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            # 验证数据
            self._validate_config_data(update_data, is_update=True)
            
            config = await repo.update_config(config_id, update_data)
            if config:
                logger.info(f"更新切分配置成功: {config.name} ({config.id})")
            
            return config
    
    async def set_default_config(self, config_id: str) -> bool:
        """设置默认配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            success = await repo.set_default_config(config_id)
            if success:
                logger.info(f"设置默认切分配置成功: {config_id}")
            
            return success
    
    async def delete_config(self, config_id: str) -> bool:
        """删除配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            success = await repo.delete_config(config_id)
            if success:
                logger.info(f"删除切分配置成功: {config_id}")
            
            return success
    
    async def search_configs(self, keyword: str) -> List[ChunkingConfig]:
        """搜索配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            return await repo.search_configs(keyword)
    
    async def get_config_stats(self) -> Dict[str, Any]:
        """获取配置统计"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            return await repo.get_config_stats()
    
    async def get_preset_configs(self) -> List[Dict[str, Any]]:
        """获取预设配置模板（按切分类型归类，去除领域/文档类型描述）"""
        return [
            {
                "name": "语义切分",
                "description": "依据语义相似度自适应聚合，兼顾上下文连贯",
                "strategy": "semantic",
                "chunk_token_num": 400,
                "max_token_num": 512,
                "chunk_overlap": 50,
                "delimiter": "。！？!?;\n\n",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 30,
                "supported_formats": ["txt", "md", "pdf", "docx"]
            },
            {
                "name": "滑动窗口",
                "description": "固定窗口大小滑动，稳定覆盖长文本",
                "strategy": "sliding_window",
                "chunk_token_num": 512,
                "max_token_num": 640,
                "chunk_overlap": 80,
                "delimiter": "\n\n",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 25,
                "supported_formats": ["txt", "md", "pdf", "docx"]
            },
            {
                "name": "句子切分",
                "description": "按句子边界切分，尽量保持语义完整",
                "strategy": "sentence",
                "chunk_token_num": 300,
                "max_token_num": 400,
                "chunk_overlap": 30,
                "delimiter": "。！？!?;",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 20,
                "supported_formats": ["txt", "md"]
            },
            {
                "name": "段落切分",
                "description": "按自然段落分割，结构清晰，便于回溯",
                "strategy": "paragraph",
                "chunk_token_num": 380,
                "max_token_num": 512,
                "chunk_overlap": 40,
                "delimiter": "\n\n",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 25,
                "supported_formats": ["txt", "md"]
            },
            {
                "name": "固定长度",
                "description": "按固定token长度切分，行为可预期",
                "strategy": "fixed",
                "chunk_token_num": 500,
                "max_token_num": 600,
                "chunk_overlap": 50,
                "delimiter": "",
                "tokenizer_type": "simple",
                "preserve_structure": False,
                "semantic_threshold": 20,
                "supported_formats": ["txt", "md"]
            },
            {
                "name": "朴素切分",
                "description": "基础分割策略，最小化处理与改写",
                "strategy": "naive",
                "chunk_token_num": 0,
                "max_token_num": 0,
                "chunk_overlap": 0,
                "delimiter": "\n\n",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 0,
                "supported_formats": ["txt", "md"]
            }
        ]
    
    def _validate_config_data(self, data: Dict[str, Any], is_update: bool = False) -> None:
        """验证配置数据"""
        required_fields = ["name", "strategy"] if not is_update else []
        
        for field in required_fields:
            if field not in data:
                raise ValueError(f"缺少必需字段: {field}")
        
        # 验证策略
        if "strategy" in data:
            valid_strategies = ["semantic", "sliding_window", "sentence", "paragraph", "recursive", "fixed", "naive"]
            if data["strategy"] not in valid_strategies:
                raise ValueError(f"无效的切分策略: {data['strategy']}")
        
        # 验证token数量
        if "chunk_token_num" in data and data["chunk_token_num"] <= 0:
            raise ValueError("chunk_token_num 必须大于0")
        
        if "max_token_num" in data and data["max_token_num"] <= 0:
            raise ValueError("max_token_num 必须大于0")
        
        # 验证token数量关系
        if ("chunk_token_num" in data and "max_token_num" in data and 
            data["chunk_token_num"] > data["max_token_num"]):
            raise ValueError("chunk_token_num 不能大于 max_token_num")
        
        # 验证分词器类型
        if "tokenizer_type" in data:
            valid_tokenizers = ["simple", "advanced"]
            if data["tokenizer_type"] not in valid_tokenizers:
                raise ValueError(f"无效的分词器类型: {data['tokenizer_type']}")
        
        # 验证语义阈值
        if "semantic_threshold" in data:
            threshold = data["semantic_threshold"]
            if not isinstance(threshold, int) or threshold < 0 or threshold > 100:
                raise ValueError("semantic_threshold 必须是0-100之间的整数")


# 创建全局服务实例
chunking_config_service = ChunkingConfigService()
