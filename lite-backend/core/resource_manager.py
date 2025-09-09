"""
全局资源管理器 - 解决aiohttp连接泄漏和资源清理问题
"""
import asyncio
import gc
import weakref
from typing import Set, Any, List
import aiohttp
from core.logger import logger


class ResourceManager:
    """全局资源管理器"""
    
    def __init__(self):
        self._registered_resources: Set[Any] = set()
        self._session_refs: List[weakref.ref] = []
        self._connector_refs: List[weakref.ref] = []
        self._cleanup_callbacks: List[callable] = []
        
    def register_session(self, session: aiohttp.ClientSession):
        """注册aiohttp ClientSession"""
        if session and not session.closed:
            self._session_refs.append(weakref.ref(session))
            logger.debug(f"注册HTTP会话: {id(session)}")
    
    def register_connector(self, connector: aiohttp.TCPConnector):
        """注册aiohttp TCPConnector"""
        if connector and not connector.closed:
            self._connector_refs.append(weakref.ref(connector))
            logger.debug(f"注册TCP连接器: {id(connector)}")
    
    def register_resource(self, resource: Any):
        """注册需要清理的资源"""
        self._registered_resources.add(resource)
        logger.debug(f"注册资源: {type(resource).__name__}")
    
    def register_cleanup_callback(self, callback: callable):
        """注册清理回调函数"""
        self._cleanup_callbacks.append(callback)
        logger.debug(f"注册清理回调: {callback.__name__}")
    
    async def cleanup_all(self):
        """清理所有注册的资源"""
        logger.info("🧹 开始全局资源清理")
        
        cleanup_tasks = []
        
        # 1. 执行注册的清理回调
        for callback in self._cleanup_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    cleanup_tasks.append(callback())
                else:
                    callback()
                logger.debug(f"执行清理回调: {callback.__name__}")
            except Exception as e:
                logger.warning(f"清理回调失败 {callback.__name__}: {e}")
        
        # 2. 清理aiohttp会话
        session_count = 0
        for session_ref in self._session_refs:
            session = session_ref()
            if session and not session.closed:
                try:
                    cleanup_tasks.append(session.close())
                    session_count += 1
                    logger.debug(f"关闭HTTP会话: {id(session)}")
                except Exception as e:
                    logger.warning(f"关闭HTTP会话失败: {e}")
        
        # 3. 清理aiohttp连接器
        connector_count = 0
        for connector_ref in self._connector_refs:
            connector = connector_ref()
            if connector and not connector.closed:
                try:
                    cleanup_tasks.append(connector.close())
                    connector_count += 1
                    logger.debug(f"关闭TCP连接器: {id(connector)}")
                except Exception as e:
                    logger.warning(f"关闭TCP连接器失败: {e}")
        
        # 4. 清理注册的资源
        resource_count = 0
        for resource in self._registered_resources:
            try:
                if hasattr(resource, 'close') and callable(getattr(resource, 'close')):
                    close_method = getattr(resource, 'close')
                    if asyncio.iscoroutinefunction(close_method):
                        cleanup_tasks.append(close_method())
                    else:
                        close_method()
                    resource_count += 1
                    logger.debug(f"关闭资源: {type(resource).__name__}")
            except Exception as e:
                logger.warning(f"关闭资源失败 {type(resource).__name__}: {e}")
        
        # 5. 等待所有清理任务完成
        if cleanup_tasks:
            try:
                await asyncio.gather(*cleanup_tasks, return_exceptions=True)
                logger.info(f"   ✅ 异步清理任务完成: {len(cleanup_tasks)}个")
            except Exception as e:
                logger.warning(f"   ⚠️ 部分异步清理任务失败: {e}")
        
        # 6. 等待连接完全关闭
        await asyncio.sleep(0.1)  # 给连接一些时间完全关闭
        
        # 7. 强制垃圾回收
        gc.collect()
        
        logger.info(f"   ✅ 资源清理完成 - 会话:{session_count}, 连接器:{connector_count}, 资源:{resource_count}")
        
        # 8. 清空注册表
        self._session_refs.clear()
        self._connector_refs.clear()
        self._registered_resources.clear()
        self._cleanup_callbacks.clear()
    
    def get_status(self) -> dict:
        """获取资源管理器状态"""
        active_sessions = sum(1 for ref in self._session_refs if ref() and not ref().closed)
        active_connectors = sum(1 for ref in self._connector_refs if ref() and not ref().closed)
        
        return {
            "active_sessions": active_sessions,
            "active_connectors": active_connectors,
            "registered_resources": len(self._registered_resources),
            "cleanup_callbacks": len(self._cleanup_callbacks)
        }


# 全局资源管理器实例
resource_manager = ResourceManager()


def register_aiohttp_session(session: aiohttp.ClientSession):
    """便捷函数：注册aiohttp会话"""
    resource_manager.register_session(session)
    return session


def register_aiohttp_connector(connector: aiohttp.TCPConnector):
    """便捷函数：注册aiohttp连接器"""
    resource_manager.register_connector(connector)
    return connector


def register_cleanup_callback(callback: callable):
    """便捷函数：注册清理回调"""
    resource_manager.register_cleanup_callback(callback)


async def cleanup_all_resources():
    """便捷函数：清理所有资源"""
    await resource_manager.cleanup_all()


# 装饰器：自动注册aiohttp会话
def auto_register_session(func):
    """装饰器：自动注册返回的aiohttp会话"""
    async def wrapper(*args, **kwargs):
        result = await func(*args, **kwargs)
        if isinstance(result, aiohttp.ClientSession):
            register_aiohttp_session(result)
        return result
    return wrapper


# 上下文管理器：确保会话被清理
class ManagedClientSession:
    """受管理的aiohttp ClientSession"""
    
    def __init__(self, *args, **kwargs):
        self.session = None
        self.args = args
        self.kwargs = kwargs
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(*self.args, **self.kwargs)
        register_aiohttp_session(self.session)
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session and not self.session.closed:
            await self.session.close()


# 上下文管理器：确保连接器被清理
class ManagedTCPConnector:
    """受管理的aiohttp TCPConnector"""
    
    def __init__(self, *args, **kwargs):
        self.connector = None
        self.args = args
        self.kwargs = kwargs
    
    async def __aenter__(self):
        self.connector = aiohttp.TCPConnector(*self.args, **self.kwargs)
        register_aiohttp_connector(self.connector)
        return self.connector
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.connector and not self.connector.closed:
            await self.connector.close() 