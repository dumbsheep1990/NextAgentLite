"""
Hook注册中心

管理所有可用的Hooks，支持动态注册和查找
"""

from typing import Dict, List, Type, Optional
import logging
from .base import BaseHook, PreHook, PostHook, HookType

logger = logging.getLogger(__name__)


class HookRegistry:
    """Hook注册中心

    单例模式，全局管理所有Hook类
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(HookRegistry, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._pre_hooks: Dict[str, Type[PreHook]] = {}
            self._post_hooks: Dict[str, Type[PostHook]] = {}
            self._hook_metadata: Dict[str, Dict] = {}
            self._initialized = True
            logger.info("HookRegistry initialized")

    def register_pre_hook(
        self,
        hook_id: str,
        hook_class: Type[PreHook],
        metadata: Optional[Dict] = None
    ) -> None:
        """注册Pre-hook

        Args:
            hook_id: Hook唯一标识
            hook_class: Hook类
            metadata: Hook元数据（描述、分类等）
        """
        if not issubclass(hook_class, PreHook):
            raise ValueError(f"{hook_class} 不是PreHook的子类")

        if hook_id in self._pre_hooks:
            logger.warning(f"Pre-hook {hook_id} 已存在，将被覆盖")

        self._pre_hooks[hook_id] = hook_class
        self._hook_metadata[hook_id] = metadata or {}
        logger.info(f"注册Pre-hook: {hook_id}")

    def register_post_hook(
        self,
        hook_id: str,
        hook_class: Type[PostHook],
        metadata: Optional[Dict] = None
    ) -> None:
        """注册Post-hook

        Args:
            hook_id: Hook唯一标识
            hook_class: Hook类
            metadata: Hook元数据
        """
        if not issubclass(hook_class, PostHook):
            raise ValueError(f"{hook_class} 不是PostHook的子类")

        if hook_id in self._post_hooks:
            logger.warning(f"Post-hook {hook_id} 已存在，将被覆盖")

        self._post_hooks[hook_id] = hook_class
        self._hook_metadata[hook_id] = metadata or {}
        logger.info(f"注册Post-hook: {hook_id}")

    def get_pre_hook(self, hook_id: str) -> Optional[Type[PreHook]]:
        """获取Pre-hook类

        Args:
            hook_id: Hook标识

        Returns:
            Hook类，如果不存在返回None
        """
        return self._pre_hooks.get(hook_id)

    def get_post_hook(self, hook_id: str) -> Optional[Type[PostHook]]:
        """获取Post-hook类

        Args:
            hook_id: Hook标识

        Returns:
            Hook类，如果不存在返回None
        """
        return self._post_hooks.get(hook_id)

    def list_pre_hooks(self) -> List[str]:
        """列出所有已注册的Pre-hooks

        Returns:
            Pre-hook ID列表
        """
        return list(self._pre_hooks.keys())

    def list_post_hooks(self) -> List[str]:
        """列出所有已注册的Post-hooks

        Returns:
            Post-hook ID列表
        """
        return list(self._post_hooks.keys())

    def get_hook_metadata(self, hook_id: str) -> Dict:
        """获取Hook元数据

        Args:
            hook_id: Hook标识

        Returns:
            元数据字典
        """
        return self._hook_metadata.get(hook_id, {})

    def unregister_hook(self, hook_id: str) -> bool:
        """注销Hook

        Args:
            hook_id: Hook标识

        Returns:
            是否成功注销
        """
        removed = False

        if hook_id in self._pre_hooks:
            del self._pre_hooks[hook_id]
            removed = True

        if hook_id in self._post_hooks:
            del self._post_hooks[hook_id]
            removed = True

        if hook_id in self._hook_metadata:
            del self._hook_metadata[hook_id]

        if removed:
            logger.info(f"注销Hook: {hook_id}")

        return removed

    def clear(self) -> None:
        """清空所有注册的Hooks"""
        self._pre_hooks.clear()
        self._post_hooks.clear()
        self._hook_metadata.clear()
        logger.info("清空Hook注册表")


# 全局单例
hook_registry = HookRegistry()


def register_pre_hook(
    hook_id: Optional[str] = None,
    metadata: Optional[Dict] = None
):
    """Pre-hook装饰器

    用法:
        @register_pre_hook('my_hook')
        class MyHook(PreHook):
            ...
    """
    def decorator(hook_class: Type[PreHook]):
        _hook_id = hook_id or hook_class.__name__
        hook_registry.register_pre_hook(_hook_id, hook_class, metadata)
        return hook_class
    return decorator


def register_post_hook(
    hook_id: Optional[str] = None,
    metadata: Optional[Dict] = None
):
    """Post-hook装饰器

    用法:
        @register_post_hook('my_hook')
        class MyHook(PostHook):
            ...
    """
    def decorator(hook_class: Type[PostHook]):
        _hook_id = hook_id or hook_class.__name__
        hook_registry.register_post_hook(_hook_id, hook_class, metadata)
        return hook_class
    return decorator
