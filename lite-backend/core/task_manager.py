"""
异步任务管理器 - 防止长时间运行任务卡死后端
支持超时控制、任务取消、状态监控
"""
import asyncio
import time
import uuid
from typing import Dict, Any, Optional, Callable, Awaitable
from enum import Enum
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
import threading
import weakref
from contextlib import asynccontextmanager

from core.logger import logger


class TaskStatus(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


@dataclass
class TaskInfo:
    """任务信息"""
    task_id: str
    name: str
    status: TaskStatus = TaskStatus.PENDING
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    result: Any = None
    error: Optional[str] = None
    timeout: float = 30.0  # 默认30秒超时
    metadata: Dict[str, Any] = field(default_factory=dict)
    progress: float = 0.0
    
    @property
    def duration(self) -> Optional[float]:
        """获取任务执行时间"""
        if self.start_time is None:
            return None
        end = self.end_time or time.time()
        return end - self.start_time


class AsyncTaskManager:
    """
    异步任务管理器
    
    功能:
    1. 超时控制 - 防止任务无限期运行
    2. 任务取消 - 允许主动中断任务
    3. 并发控制 - 限制同时运行的任务数量
    4. 状态监控 - 实时跟踪任务状态
    5. 错误恢复 - 自动重试和错误处理
    """
    
    def __init__(self, max_concurrent_tasks: int = 10, default_timeout: float = 30.0):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.default_timeout = default_timeout
        
        # 任务存储
        self.tasks: Dict[str, TaskInfo] = {}
        self.running_tasks: Dict[str, asyncio.Task] = {}
        
        # 并发控制
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.thread_executor = ThreadPoolExecutor(max_workers=max_concurrent_tasks)
        
        # 清理任务
        self._cleanup_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()
        
        logger.info(f"AsyncTaskManager initialized: max_concurrent={max_concurrent_tasks}, default_timeout={default_timeout}s")
    
    async def start(self):
        """启动任务管理器"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("AsyncTaskManager started")
    
    async def stop(self):
        """停止任务管理器"""
        self._shutdown_event.set()
        
        # 取消所有运行中的任务
        for task_id, task in list(self.running_tasks.items()):
            await self.cancel_task(task_id)
        
        # 停止清理任务
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # 关闭线程池
        self.thread_executor.shutdown(wait=True)
        
        logger.info("AsyncTaskManager stopped")
    
    def generate_task_id(self, prefix: str = "task") -> str:
        """生成唯一任务ID"""
        return f"{prefix}_{uuid.uuid4().hex[:8]}"
    
    async def submit_async_task(
        self,
        coro_func: Callable[..., Awaitable[Any]], 
        *args,
        task_name: str = "async_task",
        timeout: Optional[float] = None,
        task_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        提交异步任务
        
        Args:
            coro_func: 协程函数
            args: 位置参数
            task_name: 任务名称
            timeout: 超时时间(秒)
            task_id: 自定义任务ID
            metadata: 任务元数据
            kwargs: 关键字参数
            
        Returns:
            str: 任务ID
        """
        if task_id is None:
            task_id = self.generate_task_id("async")
        
        task_timeout = timeout or self.default_timeout
        task_metadata = metadata or {}
        
        # 如果提供了session_id，添加到metadata中
        if session_id:
            task_metadata["session_id"] = session_id
        
        # 创建任务信息
        task_info = TaskInfo(
            task_id=task_id,
            name=task_name,
            timeout=task_timeout,
            metadata=task_metadata
        )
        
        self.tasks[task_id] = task_info
        
        # 异步执行任务
        asyncio.create_task(self._execute_async_task(task_info, coro_func, args, kwargs))
        
        logger.info(f"Submitted async task: {task_id} ({task_name}), timeout: {task_timeout}s")
        return task_id
    
    async def submit_sync_task(
        self,
        sync_func: Callable[..., Any],
        *args,
        task_name: str = "sync_task", 
        timeout: Optional[float] = None,
        task_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        提交同步任务（在线程池中执行）
        
        Args:
            sync_func: 同步函数
            args: 位置参数
            task_name: 任务名称
            timeout: 超时时间(秒)
            task_id: 自定义任务ID
            metadata: 任务元数据
            kwargs: 关键字参数
            
        Returns:
            str: 任务ID
        """
        if task_id is None:
            task_id = self.generate_task_id("sync")
        
        task_timeout = timeout or self.default_timeout
        task_metadata = metadata or {}
        
        # 创建任务信息
        task_info = TaskInfo(
            task_id=task_id,
            name=task_name,
            timeout=task_timeout,
            metadata=task_metadata
        )
        
        self.tasks[task_id] = task_info
        
        # 异步执行同步任务
        asyncio.create_task(self._execute_sync_task(task_info, sync_func, args, kwargs))
        
        logger.info(f"Submitted sync task: {task_id} ({task_name}), timeout: {task_timeout}s")
        return task_id
    
    async def _execute_async_task(
        self,
        task_info: TaskInfo, 
        coro_func: Callable[..., Awaitable[Any]],
        args: tuple,
        kwargs: dict
    ):
        """执行异步任务的内部方法"""
        async with self.semaphore:  # 控制并发数量
            task_info.status = TaskStatus.RUNNING
            task_info.start_time = time.time()
            
            try:
                # 创建任务
                coro = coro_func(*args, **kwargs)
                task = asyncio.create_task(coro)
                self.running_tasks[task_info.task_id] = task
                
                # 等待任务完成或超时
                try:
                    result = await asyncio.wait_for(task, timeout=task_info.timeout)
                    
                    task_info.status = TaskStatus.COMPLETED
                    task_info.result = result
                    task_info.end_time = time.time()
                    
                    logger.info(f"Task completed: {task_info.task_id} ({task_info.name}), duration: {task_info.duration:.2f}s")
                    
                except asyncio.TimeoutError:
                    task_info.status = TaskStatus.TIMEOUT
                    task_info.error = f"Task timeout after {task_info.timeout}s"
                    task_info.end_time = time.time()
                    
                    # 尝试取消任务
                    task.cancel()
                    
                    logger.warning(f"Task timeout: {task_info.task_id} ({task_info.name}), timeout: {task_info.timeout}s")
                    
                except asyncio.CancelledError:
                    task_info.status = TaskStatus.CANCELLED
                    task_info.error = "Task was cancelled"
                    task_info.end_time = time.time()
                    
                    logger.info(f"Task cancelled: {task_info.task_id} ({task_info.name})")
                    
            except Exception as e:
                task_info.status = TaskStatus.FAILED
                task_info.error = str(e)
                task_info.end_time = time.time()
                
                logger.error(f"Task failed: {task_info.task_id} ({task_info.name}), error: {e}")
                
            finally:
                # 清理运行任务
                self.running_tasks.pop(task_info.task_id, None)
    
    async def _execute_sync_task(
        self,
        task_info: TaskInfo,
        sync_func: Callable[..., Any], 
        args: tuple,
        kwargs: dict
    ):
        """执行同步任务的内部方法"""
        async with self.semaphore:  # 控制并发数量
            task_info.status = TaskStatus.RUNNING
            task_info.start_time = time.time()
            
            try:
                # 在线程池中执行同步函数
                loop = asyncio.get_event_loop()
                
                try:
                    result = await asyncio.wait_for(
                        loop.run_in_executor(self.thread_executor, sync_func, *args, **kwargs),
                        timeout=task_info.timeout
                    )
                    
                    task_info.status = TaskStatus.COMPLETED
                    task_info.result = result
                    task_info.end_time = time.time()
                    
                    logger.info(f"Sync task completed: {task_info.task_id} ({task_info.name}), duration: {task_info.duration:.2f}s")
                    
                except asyncio.TimeoutError:
                    task_info.status = TaskStatus.TIMEOUT
                    task_info.error = f"Sync task timeout after {task_info.timeout}s"
                    task_info.end_time = time.time()
                    
                    logger.warning(f"Sync task timeout: {task_info.task_id} ({task_info.name}), timeout: {task_info.timeout}s")
                    
            except Exception as e:
                task_info.status = TaskStatus.FAILED
                task_info.error = str(e)
                task_info.end_time = time.time()
                
                logger.error(f"Sync task failed: {task_info.task_id} ({task_info.name}), error: {e}")
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        if task_id not in self.tasks:
            logger.warning(f"Task not found for cancellation: {task_id}")
            return False
        
        task_info = self.tasks[task_id]
        
        # 如果任务还在运行中，取消它
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            task.cancel()
            
            task_info.status = TaskStatus.CANCELLED
            task_info.end_time = time.time()
            
            logger.info(f"Task cancelled: {task_id} ({task_info.name})")
            return True
        
        # 如果任务还未开始，标记为取消
        if task_info.status == TaskStatus.PENDING:
            task_info.status = TaskStatus.CANCELLED
            task_info.end_time = time.time()
            logger.info(f"Pending task cancelled: {task_id} ({task_info.name})")
            return True
        
        return False
    
    def get_task_status(self, task_id: str) -> Optional[TaskInfo]:
        """获取任务状态"""
        return self.tasks.get(task_id)
    
    def get_task_result(self, task_id: str) -> Any:
        """获取任务结果"""
        task_info = self.tasks.get(task_id)
        if task_info and task_info.status == TaskStatus.COMPLETED:
            return task_info.result
        return None
    
    def list_tasks(self, status_filter: Optional[TaskStatus] = None) -> Dict[str, TaskInfo]:
        """列出任务"""
        if status_filter:
            return {tid: info for tid, info in self.tasks.items() if info.status == status_filter}
        return self.tasks.copy()
    
    def get_running_tasks(self) -> Dict[str, TaskInfo]:
        """获取运行中的任务"""
        return self.list_tasks(TaskStatus.RUNNING)
    
    def get_tasks_by_session(self, session_id: str) -> Dict[str, TaskInfo]:
        """根据session_id获取任务列表"""
        return {
            task_id: task_info
            for task_id, task_info in self.tasks.items()
            if task_info.metadata.get("session_id") == session_id
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """获取任务管理器统计信息"""
        status_counts = {}
        for status in TaskStatus:
            status_counts[status.value] = len([t for t in self.tasks.values() if t.status == status])
        
        return {
            "total_tasks": len(self.tasks),
            "running_tasks": len(self.running_tasks),
            "max_concurrent": self.max_concurrent_tasks,
            "available_slots": self.max_concurrent_tasks - len(self.running_tasks),
            "status_distribution": status_counts,
            "thread_pool_active": self.thread_executor._threads,
            "default_timeout": self.default_timeout
        }
    
    async def _cleanup_loop(self):
        """清理过期任务的后台循环"""
        cleanup_interval = 300  # 5分钟清理一次
        max_task_age = 3600    # 1小时后删除完成的任务
        
        while not self._shutdown_event.is_set():
            try:
                await asyncio.wait_for(
                    self._shutdown_event.wait(),
                    timeout=cleanup_interval
                )
                break  # 收到关闭信号
                
            except asyncio.TimeoutError:
                # 执行清理操作
                current_time = time.time()
                tasks_to_remove = []
                
                for task_id, task_info in self.tasks.items():
                    # 删除过期的已完成任务
                    if (task_info.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.TIMEOUT] and
                        task_info.end_time and 
                        current_time - task_info.end_time > max_task_age):
                        tasks_to_remove.append(task_id)
                
                # 删除过期任务
                for task_id in tasks_to_remove:
                    del self.tasks[task_id]
                    logger.debug(f"Cleaned up expired task: {task_id}")
                
                if tasks_to_remove:
                    logger.info(f"Cleaned up {len(tasks_to_remove)} expired tasks")


# 全局任务管理器实例
_task_manager: Optional[AsyncTaskManager] = None


def get_task_manager() -> AsyncTaskManager:
    """获取全局任务管理器实例"""
    global _task_manager
    if _task_manager is None:
        _task_manager = AsyncTaskManager(
            max_concurrent_tasks=20,
            default_timeout=60.0  # 默认60秒超时
        )
    return _task_manager


async def init_task_manager():
    """初始化任务管理器"""
    manager = get_task_manager()
    await manager.start()
    return manager


async def shutdown_task_manager():
    """关闭任务管理器"""
    global _task_manager
    if _task_manager:
        await _task_manager.stop()
        _task_manager = None


@asynccontextmanager
async def managed_task(
    task_name: str = "managed_task",
    timeout: float = 30.0,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    上下文管理器，用于管理任务
    
    使用方式:
    async with managed_task("my_task", timeout=60) as task_id:
        # 执行任务代码
        result = await some_async_function()
        return result
    """
    manager = get_task_manager()
    task_id = manager.generate_task_id("managed")
    
    task_info = TaskInfo(
        task_id=task_id,
        name=task_name,
        timeout=timeout,
        metadata=metadata or {}
    )
    
    manager.tasks[task_id] = task_info
    task_info.status = TaskStatus.RUNNING
    task_info.start_time = time.time()
    
    try:
        yield task_id
        
        task_info.status = TaskStatus.COMPLETED
        task_info.end_time = time.time()
        
    except Exception as e:
        task_info.status = TaskStatus.FAILED
        task_info.error = str(e)
        task_info.end_time = time.time()
        raise
    
    finally:
        if task_info.end_time is None:
            task_info.end_time = time.time()


# 便捷函数
async def run_with_timeout(
    coro_func: Callable[..., Awaitable[Any]],
    *args,
    timeout: float = 30.0,
    task_name: str = "timeout_task", 
    **kwargs
) -> Any:
    """
    使用超时控制运行协程函数
    
    Args:
        coro_func: 协程函数
        args: 位置参数
        timeout: 超时时间
        task_name: 任务名称
        kwargs: 关键字参数
        
    Returns:
        任务结果
        
    Raises:
        asyncio.TimeoutError: 任务超时
        Exception: 任务执行异常
    """
    manager = get_task_manager()
    task_id = await manager.submit_async_task(
        coro_func, *args, 
        task_name=task_name,
        timeout=timeout,
        **kwargs
    )
    
    # 等待任务完成
    while True:
        task_info = manager.get_task_status(task_id)
        if not task_info:
            raise RuntimeError("Task not found")
        
        if task_info.status == TaskStatus.COMPLETED:
            return task_info.result
        elif task_info.status == TaskStatus.FAILED:
            raise RuntimeError(f"Task failed: {task_info.error}")
        elif task_info.status == TaskStatus.TIMEOUT:
            raise asyncio.TimeoutError(f"Task timeout: {task_info.error}")
        elif task_info.status == TaskStatus.CANCELLED:
            raise asyncio.CancelledError(f"Task cancelled: {task_info.error}")
        
        # 等待一小段时间后再检查
        await asyncio.sleep(0.1)