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
    
    async def initialize_default_configs(self) -> List[ChunkingConfig]:
        """初始化默认配置"""
        async with get_async_session() as session:
            repo = ChunkingConfigRepository(session)
            
            # 检查是否已有默认配置
            existing_default = await repo.get_default_config()
            if existing_default:
                logger.info("默认切分配置已存在，跳过初始化")
                return await repo.get_active_configs()
            
            # 创建默认配置
            configs = await repo.create_default_configs()
            logger.info(f"成功创建 {len(configs)} 个默认切分配置")
            
            return configs
    
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
        """获取预设配置模板"""
        return [
            {
                "name": "通用文档",
                "description": "适合大多数文档类型的通用配置",
                "strategy": "semantic",
                "chunk_token_num": 400,
                "max_token_num": 512,
                "chunk_overlap": 50,
                "delimiter": "!?。！？.;",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 30,
                "supported_formats": ["txt", "md", "pdf", "docx"]
            },
            {
                "name": "学术论文",
                "description": "专门针对学术论文的优化配置",
                "strategy": "semantic",
                "chunk_token_num": 300,
                "max_token_num": 600,
                "chunk_overlap": 80,
                "delimiter": "!?。！？.;",
                "tokenizer_type": "advanced",
                "preserve_structure": True,
                "semantic_threshold": 40,
                "supported_formats": ["pdf", "docx"]
            },
            {
                "name": "技术文档",
                "description": "适合技术文档和代码文档",
                "strategy": "fixed",
                "chunk_token_num": 200,
                "max_token_num": 400,
                "chunk_overlap": 50,
                "delimiter": "。！？\\n",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 25,
                "supported_formats": ["md", "txt"]
            },
            {
                "name": "快速处理",
                "description": "大批量文档的快速处理模式",
                "strategy": "fixed",
                "chunk_token_num": 256,
                "max_token_num": 384,
                "chunk_overlap": 20,
                "delimiter": "。！？",
                "tokenizer_type": "simple",
                "preserve_structure": False,
                "semantic_threshold": 20,
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