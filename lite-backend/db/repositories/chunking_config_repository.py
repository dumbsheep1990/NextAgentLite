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
                "name": "语义切分",
                "description": "依据语义相似度自适应聚合，兼顾上下文连贯",
                "strategy": "semantic",
                "chunk_token_num": 400,
                "max_token_num": 512,
                "chunk_overlap": 50,
                "delimiter": "!?。！？",
                "tokenizer_type": "simple",
                "preserve_structure": True,
                "semantic_threshold": 30,
                "supported_formats": ["txt", "md", "pdf", "docx"],
                "is_default": True,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
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
                "supported_formats": ["txt", "md"],
                "is_default": False,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
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
                "supported_formats": ["txt", "md"],
                "is_default": False,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
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
                "supported_formats": ["txt", "md"],
                "is_default": False,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
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
                "supported_formats": ["txt", "md", "pdf", "docx"],
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

    async def normalize_names_to_generic_types(self) -> List[ChunkingConfig]:
        """将现有配置名称/描述规范化为通用切分类型命名（不改变策略与参数）。"""
        # 读取全部激活配置
        stmt = select(ChunkingConfig).where(ChunkingConfig.is_active == True)
        result = await self.session.execute(stmt)
        configs = list(result.scalars().all())

        # 目标命名与描述按策略映射
        def target_for(cfg: ChunkingConfig):
            name = (cfg.name or '').lower()
            desc = (cfg.description or '').lower()
            text = name + ' ' + desc
            # 先按关键词识别具体类型（会同时调整策略）
            if any(k in text for k in ['句子', 'sentence']):
                cfg.strategy = 'sentence'
                return '句子切分', '按句子边界切分，尽量保持语义完整'
            if any(k in text for k in ['段落', 'paragraph']):
                cfg.strategy = 'paragraph'
                return '段落切分', '按自然段落分割，结构清晰，便于回溯'
            if any(k in text for k in ['滑动', 'window', '窗口']):
                cfg.strategy = 'sliding_window'
                return '滑动窗口', '固定窗口大小滑动，稳定覆盖长文本'
            if any(k in text for k in ['固定', 'fixed']):
                return '固定长度', '按固定token长度切分，行为可预期'
            # 其次按当前策略识别
            if cfg.strategy == 'fixed':
                return '固定长度', '按固定token长度切分，行为可预期'
            if cfg.strategy == 'sentence':
                return '句子切分', '按句子边界切分，尽量保持语义完整'
            if cfg.strategy == 'paragraph':
                return '段落切分', '按自然段落分割，结构清晰，便于回溯'
            if cfg.strategy == 'sliding_window':
                return '滑动窗口', '固定窗口大小滑动，稳定覆盖长文本'
            # 默认 semantic/naive → 语义切分 或 朴素切分
            if cfg.strategy == 'naive':
                return '朴素切分', '基础分割策略，最小化处理与改写'
            return '语义切分', '依据语义相似度自适应聚合，兼顾上下文连贯'

        # 避免名称冲突：记录已占用名称
        used_names = set()
        for cfg in configs:
            used_names.add(cfg.name)

        changed = []
        for cfg in configs:
            tgt_name, tgt_desc = target_for(cfg)
            # 仅当存在领域化/旧命名时才改名
            if any(k in (cfg.name or '') for k in ['学术', '论文', '文档', '处理', '精细']) or cfg.name in [
                '通用文档切分', '学术论文切分', '快速处理切分', '精细切分'
            ]:
                new_name = tgt_name
                # 若冲突，则添加序号避免唯一名冲突
                suffix = 2
                while new_name in used_names and new_name != cfg.name:
                    new_name = f"{tgt_name}（{suffix}）"
                    suffix += 1
                if new_name != cfg.name:
                    used_names.discard(cfg.name)
                    cfg.name = new_name
                    used_names.add(new_name)
                # 同步更新描述为通用描述
                cfg.description = tgt_desc
                changed.append(cfg)

        if changed:
            await self.session.commit()
            for c in changed:
                await self.session.refresh(c)
        return configs

    async def dedupe_active_configs(self) -> Dict[str, int]:
        """按通用类型去重：每种类型只保留一条启用配置，其余标记为未启用。

        保留优先级：
        1) is_default=True 的优先保留；
        2) 其余按 created_at 新→旧 保留最新。
        并确保系统最终存在且仅存在一个默认配置。
        """
        # 读取全部激活配置
        stmt = select(ChunkingConfig).where(ChunkingConfig.is_active == True)
        result = await self.session.execute(stmt)
        configs = list(result.scalars().all())

        # 分类函数（与 normalize 的目标名称一致）
        def category_of(cfg: ChunkingConfig) -> str:
            name = (cfg.name or '').lower()
            desc = (cfg.description or '').lower()
            text = name + ' ' + desc
            if any(k in text for k in ['句子', 'sentence']):
                return '句子切分'
            if any(k in text for k in ['段落', 'paragraph']):
                return '段落切分'
            if any(k in text for k in ['滑动', 'window', '窗口']):
                return '滑动窗口'
            if any(k in text for k in ['固定', 'fixed']):
                return '固定长度'
            if cfg.strategy == 'sentence':
                return '句子切分'
            if cfg.strategy == 'paragraph':
                return '段落切分'
            if cfg.strategy == 'sliding_window':
                return '滑动窗口'
            if cfg.strategy == 'fixed':
                return '固定长度'
            if cfg.strategy == 'naive':
                return '朴素切分'
            return '语义切分'

        # 分组
        groups: Dict[str, list[ChunkingConfig]] = {}
        for cfg in configs:
            groups.setdefault(category_of(cfg), []).append(cfg)

        to_keep = set()
        to_disable = []
        # 决定每组保留项
        for _, lst in groups.items():
            if not lst:
                continue
            # 先找默认
            defaults = [c for c in lst if getattr(c, 'is_default', False)]
            if defaults:
                keep = defaults[0]
            else:
                # created_at 可能为 None，统一转为排序键
                lst_sorted = sorted(lst, key=lambda c: (getattr(c, 'created_at', None) or 0), reverse=True)
                keep = lst_sorted[0]
            to_keep.add(keep.id)
            for c in lst:
                if c.id != keep.id:
                    c.is_active = False
                    c.is_default = False
                    to_disable.append(c)

        # 确保仅一个默认配置
        stmt_all = select(ChunkingConfig)
        result_all = await self.session.execute(stmt_all)
        all_cfgs = list(result_all.scalars().all())
        active_defaults = [c for c in all_cfgs if c.is_active and c.is_default]
        if len(active_defaults) == 0:
            # 选择优先级：保留集合中的语义切分>句子>段落>固定>滑动>朴素
            preference = ['语义切分', '句子切分', '段落切分', '固定长度', '滑动窗口', '朴素切分']
            chosen = None
            for cat in preference:
                for c in all_cfgs:
                    if c.is_active and category_of(c) == cat:
                        chosen = c
                        break
                if chosen:
                    break
            chosen = chosen or next((c for c in all_cfgs if c.is_active), None)
            if chosen:
                chosen.is_default = True
        elif len(active_defaults) > 1:
            # 只保留第一个默认，其余取消默认
            for c in active_defaults[1:]:
                c.is_default = False

        await self.session.commit()
        return {"disabled": len(to_disable), "kept": len(to_keep)}
    
    async def get_default_config(self) -> Optional[ChunkingConfig]:
        """获取默认配置（容忍多默认，取最近创建的一条）"""
        stmt = (
            select(ChunkingConfig)
            .where(
                and_(
                    ChunkingConfig.is_default == True,
                    ChunkingConfig.is_active == True,
                )
            )
            .order_by(ChunkingConfig.created_at.desc())
        )
        result = await self.session.execute(stmt)
        # 使用 first() 避免 MultipleResultsFound
        return result.scalars().first()
    
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
