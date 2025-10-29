"""
基于Redis的文件处理队列服务
使用Redis实现可靠的任务队列，支持任务优先级、状态管理和监控
"""
import json
import uuid
import asyncio
from enum import Enum
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import logging

# 尝试导入aioredis，如果失败则使用redis + asyncio
try:
    import aioredis
    REDIS_AVAILABLE = True
except ImportError:
    try:
        import redis
        REDIS_AVAILABLE = True
    except ImportError:
        REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class TaskType(Enum):
    """任务类型"""
    DOCUMENT_PROCESSING = "document_processing"
    QA_DATASET_PROCESSING = "qa_dataset_processing"

class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class QueueTask:
    """队列任务数据结构"""
    id: str
    task_type: str
    file_name: str
    file_size: int
    status: str
    priority: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    handler_name: Optional[str] = None
    handler_args: Optional[List] = None
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

class RedisQueueService:
    """基于Redis的队列服务"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", max_concurrent: int = 2):
        self.redis_url = redis_url
        self.max_concurrent = max_concurrent
        self.redis = None
        self.workers_running = False
        
        # Redis键名
        self.pending_queue_key = "mat:queue:pending"
        self.running_set_key = "mat:queue:running"
        self.completed_set_key = "mat:queue:completed"
        self.failed_set_key = "mat:queue:failed"
        self.task_data_key = "mat:queue:tasks"
        self.worker_status_key = "mat:queue:workers"
        
        # 注册的处理函数
        self.handlers = {}
    
    async def connect(self):
        """连接Redis"""
        try:
            self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
            await self.redis.ping()
            logger.info(f"✅ Redis队列服务连接成功: {self.redis_url}")
            return True
        except Exception as e:
            logger.error(f"❌ Redis连接失败: {e}")
            return False
    
    async def disconnect(self):
        """断开Redis连接"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis连接已关闭")
    
    def register_handler(self, name: str, handler: Callable):
        """注册任务处理函数"""
        self.handlers[name] = handler
        logger.info(f"注册处理函数: {name}")
    
    async def add_task(
        self,
        task_type: TaskType,
        file_name: str,
        file_size: int,
        handler: Callable,
        handler_args: tuple = (),
        priority: int = 1
    ) -> str:
        """添加任务到队列"""
        if not self.redis:
            await self.connect()
        
        task_id = str(uuid.uuid4())
        handler_name = f"{handler.__module__}.{handler.__name__}"
        
        # 注册处理函数
        self.register_handler(handler_name, handler)
        
        task = QueueTask(
            id=task_id,
            task_type=task_type.value,
            file_name=file_name,
            file_size=file_size,
            status=TaskStatus.PENDING.value,
            priority=priority,
            created_at=datetime.now(timezone.utc).isoformat(),
            handler_name=handler_name,
            handler_args=list(handler_args)
        )
        
        # 保存任务数据
        await self.redis.hset(self.task_data_key, task_id, json.dumps(task.to_dict()))
        
        # 添加到待处理队列（按优先级排序，优先级越小越优先）
        await self.redis.zadd(self.pending_queue_key, {task_id: priority})
        
        logger.info(f"✅ 任务已添加到Redis队列: {task_id} - {file_name}")
        
        # 启动工作器（如果还没有启动）
        if not self.workers_running:
            asyncio.create_task(self._start_workers())
        
        return task_id
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        if not self.redis:
            await self.connect()
        
        pending_count = await self.redis.zcard(self.pending_queue_key)
        running_count = await self.redis.scard(self.running_set_key)
        completed_count = await self.redis.scard(self.completed_set_key)
        
        # 获取待处理任务列表
        pending_task_ids = await self.redis.zrange(self.pending_queue_key, 0, -1)
        pending_tasks = []
        for task_id in pending_task_ids:
            task_data = await self.redis.hget(self.task_data_key, task_id)
            if task_data:
                task = QueueTask.from_dict(json.loads(task_data))
                pending_tasks.append({
                    "id": task.id,
                    "file_name": task.file_name,
                    "task_type": task.task_type,
                    "priority": task.priority,
                    "created_at": task.created_at
                })
        
        # 获取运行中任务列表
        running_task_ids = await self.redis.smembers(self.running_set_key)
        running_tasks = []
        for task_id in running_task_ids:
            task_data = await self.redis.hget(self.task_data_key, task_id)
            if task_data:
                task = QueueTask.from_dict(json.loads(task_data))
                running_tasks.append({
                    "id": task.id,
                    "file_name": task.file_name,
                    "task_type": task.task_type,
                    "started_at": task.started_at
                })
        
        return {
            "pending_count": pending_count,
            "running_count": running_count,
            "completed_count": completed_count,
            "max_concurrent": self.max_concurrent,
            "pending_tasks": pending_tasks,
            "running_tasks": running_tasks
        }
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        if not self.redis:
            await self.connect()
        
        task_data = await self.redis.hget(self.task_data_key, task_id)
        if not task_data:
            return None
        
        task = QueueTask.from_dict(json.loads(task_data))
        return task.to_dict()
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        if not self.redis:
            await self.connect()
        
        # 只能取消待处理的任务
        removed = await self.redis.zrem(self.pending_queue_key, task_id)
        if removed:
            # 更新任务状态
            task_data = await self.redis.hget(self.task_data_key, task_id)
            if task_data:
                task = QueueTask.from_dict(json.loads(task_data))
                task.status = TaskStatus.FAILED.value
                task.error_message = "任务被取消"
                task.completed_at = datetime.now(timezone.utc).isoformat()
                await self.redis.hset(self.task_data_key, task_id, json.dumps(task.to_dict()))
                await self.redis.sadd(self.failed_set_key, task_id)
            logger.info(f"任务已取消: {task_id}")
            return True
        
        return False
    
    async def cleanup_completed_tasks(self, max_keep: int = 100):
        """清理已完成的任务"""
        if not self.redis:
            await self.connect()
        
        # 获取所有已完成和失败的任务
        completed_tasks = await self.redis.smembers(self.completed_set_key)
        failed_tasks = await self.redis.smembers(self.failed_set_key)
        all_finished_tasks = list(completed_tasks) + list(failed_tasks)
        
        if len(all_finished_tasks) <= max_keep:
            return
        
        # 获取任务创建时间并排序
        tasks_with_time = []
        for task_id in all_finished_tasks:
            task_data = await self.redis.hget(self.task_data_key, task_id)
            if task_data:
                task = QueueTask.from_dict(json.loads(task_data))
                tasks_with_time.append((task_id, task.created_at))
        
        # 按时间排序，保留最新的max_keep个
        tasks_with_time.sort(key=lambda x: x[1], reverse=True)
        tasks_to_remove = [task_id for task_id, _ in tasks_with_time[max_keep:]]
        
        # 清理旧任务
        for task_id in tasks_to_remove:
            await self.redis.hdel(self.task_data_key, task_id)
            await self.redis.srem(self.completed_set_key, task_id)
            await self.redis.srem(self.failed_set_key, task_id)
        
        logger.info(f"清理了 {len(tasks_to_remove)} 个旧任务")
    
    async def _start_workers(self):
        """启动工作器"""
        if self.workers_running:
            return
        
        self.workers_running = True
        logger.info(f"启动 {self.max_concurrent} 个Redis队列工作器")
        
        # 启动多个工作器
        workers = []
        for i in range(self.max_concurrent):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            workers.append(worker)
        
        # 等待所有工作器完成（正常情况下不会退出）
        try:
            await asyncio.gather(*workers)
        except Exception as e:
            logger.error(f"工作器异常: {e}")
        finally:
            self.workers_running = False
    
    async def _worker(self, worker_name: str):
        """工作器主循环"""
        logger.info(f"工作器 {worker_name} 启动")
        
        while True:
            try:
                # 检查当前运行任务数
                running_count = await self.redis.scard(self.running_set_key)
                if running_count >= self.max_concurrent:
                    await asyncio.sleep(1)
                    continue
                
                # 获取优先级最高的任务
                result = await self.redis.zpopmin(self.pending_queue_key, 1)
                if not result:
                    await asyncio.sleep(1)
                    continue
                
                task_id, priority = result[0]
                
                # 获取任务数据
                task_data = await self.redis.hget(self.task_data_key, task_id)
                if not task_data:
                    continue
                
                task = QueueTask.from_dict(json.loads(task_data))
                
                # 标记为运行中
                task.status = TaskStatus.RUNNING.value
                task.started_at = datetime.now(timezone.utc).isoformat()
                await self.redis.hset(self.task_data_key, task_id, json.dumps(task.to_dict()))
                await self.redis.sadd(self.running_set_key, task_id)
                
                logger.info(f"工作器 {worker_name} 开始处理任务: {task_id} - {task.file_name}")
                
                # 执行任务
                try:
                    await self._execute_task(task)
                    
                    # 任务成功
                    task.status = TaskStatus.COMPLETED.value
                    task.completed_at = datetime.now(timezone.utc).isoformat()
                    await self.redis.sadd(self.completed_set_key, task_id)
                    logger.info(f"✅ 任务完成: {task_id} - {task.file_name}")
                    
                except Exception as e:
                    # 任务失败
                    task.status = TaskStatus.FAILED.value
                    task.error_message = str(e)
                    task.completed_at = datetime.now(timezone.utc).isoformat()
                    await self.redis.sadd(self.failed_set_key, task_id)
                    logger.error(f"❌ 任务失败: {task_id} - {task.file_name}: {e}")
                
                finally:
                    # 从运行中移除
                    await self.redis.srem(self.running_set_key, task_id)
                    await self.redis.hset(self.task_data_key, task_id, json.dumps(task.to_dict()))
                
            except Exception as e:
                logger.error(f"工作器 {worker_name} 异常: {e}")
                await asyncio.sleep(5)  # 异常后等待5秒再继续
    
    async def _execute_task(self, task: QueueTask):
        """执行任务"""
        handler_name = task.handler_name
        if not handler_name or handler_name not in self.handlers:
            raise ValueError(f"未找到处理函数: {handler_name}")
        
        handler = self.handlers[handler_name]
        args = task.handler_args or []
        
        # 执行处理函数
        if asyncio.iscoroutinefunction(handler):
            await handler(*args)
        else:
            handler(*args)

# 全局Redis队列实例
redis_queue = RedisQueueService()