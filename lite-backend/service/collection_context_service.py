"""
Collection上下文管理服务

为智能体提供Collection级别的上下文管理：
1. Collection ID传递和管理
2. Collection信息缓存
3. 智能体间的Collection上下文共享
"""

import json
import asyncio
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

from core.logger import logger


@dataclass
class CollectionContext:
    """Collection上下文数据"""
    collection_ids: Optional[List[str]] = None
    metadata_template: Optional[str] = None
    time_filters: Optional[Dict[str, Any]] = None
    collection_info: Dict[str, Any] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return asdict(self)
    
    def to_json(self) -> str:
        """转换为JSON格式，供智能体工具使用"""
        data = self.to_dict()
        # 处理datetime序列化
        if data.get('created_at'):
            data['created_at'] = data['created_at'].isoformat()
        if data.get('updated_at'):
            data['updated_at'] = data['updated_at'].isoformat()
        return json.dumps(data, ensure_ascii=False)


class CollectionContextService:
    """Collection上下文管理服务"""
    
    def __init__(self):
        # 会话级别的Collection上下文
        self._session_contexts: Dict[str, CollectionContext] = {}
        # 全局Collection信息缓存
        self._collection_cache: Dict[str, Dict[str, Any]] = {}
        # 缓存TTL
        self._cache_ttl = timedelta(minutes=30)
        # 锁
        self._context_lock = asyncio.Lock()
        
        logger.info("[COLLECTION_CONTEXT] Collection上下文服务已初始化")
    
    async def set_session_context(
        self,
        session_id: str,
        collection_ids: Optional[List[str]] = None,
        metadata_template: Optional[str] = None,
        time_filters: Optional[Dict[str, Any]] = None,
        collection_info: Optional[Dict[str, Any]] = None
    ) -> CollectionContext:
        """
        设置会话级别的Collection上下文
        
        Args:
            session_id: 会话ID
            collection_ids: Collection ID列表
            metadata_template: 元数据模板类型
            time_filters: 时间过滤器
            collection_info: Collection详细信息
            
        Returns:
            CollectionContext: 设置的上下文对象
        """
        async with self._context_lock:
            context = CollectionContext(
                collection_ids=collection_ids,
                metadata_template=metadata_template,
                time_filters=time_filters,
                collection_info=collection_info or {},
                updated_at=datetime.now()
            )
            
            self._session_contexts[session_id] = context
            
            logger.info(f"[COLLECTION_CONTEXT] 会话 {session_id} 上下文已设置: collections={collection_ids}")
            
            return context
    
    async def get_session_context(
        self,
        session_id: str
    ) -> Optional[CollectionContext]:
        """
        获取会话级别的Collection上下文
        
        Args:
            session_id: 会话ID
            
        Returns:
            Optional[CollectionContext]: Collection上下文，如果不存在返回None
        """
        context = self._session_contexts.get(session_id)
        
        if context:
            logger.debug(f"[COLLECTION_CONTEXT] 获取会话 {session_id} 上下文: {context.collection_ids}")
        
        return context
    
    async def update_session_context(
        self,
        session_id: str,
        **kwargs
    ) -> Optional[CollectionContext]:
        """
        更新会话级别的Collection上下文
        
        Args:
            session_id: 会话ID
            **kwargs: 要更新的字段
            
        Returns:
            Optional[CollectionContext]: 更新后的上下文
        """
        async with self._context_lock:
            context = self._session_contexts.get(session_id)
            
            if not context:
                logger.warning(f"[COLLECTION_CONTEXT] 会话 {session_id} 上下文不存在，无法更新")
                return None
            
            # 更新字段
            for key, value in kwargs.items():
                if hasattr(context, key):
                    setattr(context, key, value)
            
            context.updated_at = datetime.now()
            
            logger.info(f"[COLLECTION_CONTEXT] 会话 {session_id} 上下文已更新")
            
            return context
    
    async def clear_session_context(self, session_id: str) -> bool:
        """
        清除会话级别的Collection上下文
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否成功清除
        """
        async with self._context_lock:
            if session_id in self._session_contexts:
                del self._session_contexts[session_id]
                logger.info(f"[COLLECTION_CONTEXT] 会话 {session_id} 上下文已清除")
                return True
            
            return False
    
    def get_context_for_agent(
        self,
        session_id: str,
        include_json: bool = True
    ) -> Dict[str, Any]:
        """
        获取供智能体使用的上下文信息
        
        Args:
            session_id: 会话ID
            include_json: 是否包含JSON格式的上下文
            
        Returns:
            Dict[str, Any]: 智能体可用的上下文信息
        """
        context = self._session_contexts.get(session_id)
        
        if not context:
            return {
                "has_collection_context": False,
                "message": "当前会话未设置Collection上下文，将使用全局检索"
            }
        
        agent_context = {
            "has_collection_context": True,
            "collection_ids": context.collection_ids,
            "metadata_template": context.metadata_template,
            "time_filters": context.time_filters,
            "collection_count": len(context.collection_ids) if context.collection_ids else 0,
            "context_age_minutes": (datetime.now() - context.updated_at).total_seconds() / 60
        }
        
        if include_json:
            agent_context["context_json"] = context.to_json()
        
        if context.collection_info:
            agent_context["collection_info"] = context.collection_info
        
        return agent_context
    
    async def cache_collection_info(
        self,
        collection_id: str,
        collection_info: Dict[str, Any]
    ):
        """
        缓存Collection信息
        
        Args:
            collection_id: Collection ID
            collection_info: Collection详细信息
        """
        collection_info['cached_at'] = datetime.now()
        self._collection_cache[collection_id] = collection_info
        
        logger.debug(f"[COLLECTION_CONTEXT] Collection {collection_id} 信息已缓存")
    
    async def get_cached_collection_info(
        self,
        collection_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        获取缓存的Collection信息
        
        Args:
            collection_id: Collection ID
            
        Returns:
            Optional[Dict[str, Any]]: 缓存的Collection信息
        """
        info = self._collection_cache.get(collection_id)
        
        if not info:
            return None
        
        # 检查缓存是否过期
        cached_at = info.get('cached_at')
        if cached_at and datetime.now() - cached_at > self._cache_ttl:
            del self._collection_cache[collection_id]
            logger.debug(f"[COLLECTION_CONTEXT] Collection {collection_id} 缓存已过期")
            return None
        
        return info
    
    def get_active_sessions(self) -> List[str]:
        """
        获取有活跃Collection上下文的会话列表
        
        Returns:
            List[str]: 活跃会话ID列表
        """
        return list(self._session_contexts.keys())
    
    def get_context_statistics(self) -> Dict[str, Any]:
        """
        获取上下文服务统计信息
        
        Returns:
            Dict[str, Any]: 统计信息
        """
        now = datetime.now()
        
        stats = {
            "active_sessions": len(self._session_contexts),
            "cached_collections": len(self._collection_cache),
            "contexts_by_template": {},
            "recent_activity": 0
        }
        
        # 按模板类型统计
        for context in self._session_contexts.values():
            template = context.metadata_template or "未指定"
            stats["contexts_by_template"][template] = stats["contexts_by_template"].get(template, 0) + 1
        
        # 统计最近活跃的上下文
        for context in self._session_contexts.values():
            if context.updated_at and (now - context.updated_at).total_seconds() < 3600:  # 1小时内
                stats["recent_activity"] += 1
        
        return stats
    
    async def cleanup_expired_contexts(self):
        """清理过期的上下文"""
        async with self._context_lock:
            now = datetime.now()
            expired_sessions = []
            
            for session_id, context in self._session_contexts.items():
                # 清理24小时未更新的上下文
                if context.updated_at and (now - context.updated_at).total_seconds() > 86400:
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                del self._session_contexts[session_id]
                logger.info(f"[COLLECTION_CONTEXT] 已清理过期会话上下文: {session_id}")
            
            # 清理过期的Collection缓存
            expired_collections = []
            for collection_id, info in self._collection_cache.items():
                cached_at = info.get('cached_at')
                if cached_at and (now - cached_at) > self._cache_ttl:
                    expired_collections.append(collection_id)
            
            for collection_id in expired_collections:
                del self._collection_cache[collection_id]
                logger.debug(f"[COLLECTION_CONTEXT] 已清理过期Collection缓存: {collection_id}")
            
            if expired_sessions or expired_collections:
                logger.info(f"[COLLECTION_CONTEXT] 清理完成: {len(expired_sessions)} 会话, {len(expired_collections)} Collection缓存")


# 全局实例
collection_context_service = CollectionContextService()


def get_collection_context_service() -> CollectionContextService:
    """获取Collection上下文服务实例"""
    return collection_context_service