"""
简单的文件处理队列服务
使用asyncio实现的轻量级任务队列，避免Redis依赖问题
"""
import json
import uuid
import asyncio
import os
from enum import Enum
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import logging

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
    handler: Optional[Callable] = None
    handler_args: Optional[List] = None
    
    def to_dict(self):
        data = asdict(self)
        # 移除不能序列化的handler
        data.pop('handler', None)
        return data

class SimpleQueueService:
    """简单的队列服务"""
    
    def __init__(self, max_concurrent: int = None):
        # 从环境变量读取配置，使用合理的默认值
        if max_concurrent is None:
            max_concurrent = int(os.getenv('QUEUE_MAX_CONCURRENT_TASKS', '2'))
        
        self.max_concurrent = max_concurrent
        # 大文件队列配置
        self.max_concurrent_large_files = int(os.getenv('LARGE_FILE_MAX_CONCURRENT_TASKS', '1'))
        self.large_file_threshold = int(os.getenv('LARGE_FILE_THRESHOLD', '2097152'))  # 2MB
        self.workers_running = False
        self.worker_tasks = []  # 保持工作器任务的强引用
        
        # 任务存储
        self.pending_tasks: List[QueueTask] = []
        self.running_tasks: Dict[str, QueueTask] = {}
        self.completed_tasks: Dict[str, QueueTask] = {}
        self.failed_tasks: Dict[str, QueueTask] = {}
        
        # 异步锁
        self._lock = asyncio.Lock()
    
    async def add_task(
        self,
        task_type: TaskType,
        file_name: str,
        file_size: int,
        handler: Callable,
        handler_args: tuple = (),
        priority: int = None
    ) -> str:
        """添加任务到队列"""
        task_id = str(uuid.uuid4())
        
        # 根据文件大小自动分配优先级
        if priority is None:
            if file_size < 100 * 1024:  # 小于100KB
                priority = 1  # 高优先级
            elif file_size < self.large_file_threshold:  # 小于2MB
                priority = 2  # 中等优先级
            else:
                priority = 3  # 低优先级（大文件）
        
        task = QueueTask(
            id=task_id,
            task_type=task_type.value,
            file_name=file_name,
            file_size=file_size,
            status=TaskStatus.PENDING.value,
            priority=priority,
            created_at=datetime.now(timezone.utc).isoformat(),
            handler=handler,
            handler_args=list(handler_args)
        )
        
        async with self._lock:
            # 按优先级插入（优先级越小越优先）
            inserted = False
            for i, existing_task in enumerate(self.pending_tasks):
                if priority < existing_task.priority:
                    self.pending_tasks.insert(i, task)
                    inserted = True
                    break
            
            if not inserted:
                self.pending_tasks.append(task)
        
        logger.info(f"✅ 任务已添加到队列: {task_id} - {file_name}")
        
        # 启动工作器（如果还没有启动）
        if not self.workers_running:
            await self._start_workers()
        
        return task_id
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        async with self._lock:
            # 获取待处理任务列表
            pending_tasks = []
            for task in self.pending_tasks:
                pending_tasks.append({
                    "id": task.id,
                    "file_name": task.file_name,
                    "task_type": task.task_type,
                    "priority": task.priority,
                    "created_at": task.created_at
                })
            
            # 获取运行中任务列表
            running_tasks = []
            for task in self.running_tasks.values():
                running_tasks.append({
                    "id": task.id,
                    "file_name": task.file_name,
                    "task_type": task.task_type,
                    "started_at": task.started_at
                })
            
            return {
                "pending_count": len(self.pending_tasks),
                "running_count": len(self.running_tasks),
                "completed_count": len(self.completed_tasks),
                "max_concurrent": self.max_concurrent,
                "max_concurrent_large_files": self.max_concurrent_large_files,
                "large_file_threshold": self.large_file_threshold,
                "pending_tasks": pending_tasks,
                "running_tasks": running_tasks
            }
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        async with self._lock:
            # 检查各个状态的任务
            for task in self.pending_tasks:
                if task.id == task_id:
                    return task.to_dict()
            
            if task_id in self.running_tasks:
                return self.running_tasks[task_id].to_dict()
            
            if task_id in self.completed_tasks:
                return self.completed_tasks[task_id].to_dict()
            
            if task_id in self.failed_tasks:
                return self.failed_tasks[task_id].to_dict()
        
        return None
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        async with self._lock:
            # 只能取消待处理的任务
            for i, task in enumerate(self.pending_tasks):
                if task.id == task_id:
                    # 移除任务并标记为失败
                    removed_task = self.pending_tasks.pop(i)
                    removed_task.status = TaskStatus.FAILED.value
                    removed_task.error_message = "任务被取消"
                    removed_task.completed_at = datetime.now(timezone.utc).isoformat()
                    self.failed_tasks[task_id] = removed_task
                    logger.info(f"任务已取消: {task_id}")
                    return True
        
        return False
    
    async def cleanup_completed_tasks(self, max_keep: int = 100):
        """清理已完成的任务"""
        async with self._lock:
            # 合并已完成和失败的任务
            all_finished = list(self.completed_tasks.values()) + list(self.failed_tasks.values())
            
            if len(all_finished) <= max_keep:
                return
            
            # 按时间排序，保留最新的
            all_finished.sort(key=lambda x: x.created_at, reverse=True)
            tasks_to_keep = all_finished[:max_keep]
            
            # 重建字典
            new_completed = {}
            new_failed = {}
            
            for task in tasks_to_keep:
                if task.status == TaskStatus.COMPLETED.value:
                    new_completed[task.id] = task
                elif task.status == TaskStatus.FAILED.value:
                    new_failed[task.id] = task
            
            removed_count = len(all_finished) - len(tasks_to_keep)
            self.completed_tasks = new_completed
            self.failed_tasks = new_failed
            
            logger.info(f"清理了 {removed_count} 个旧任务")
    
    async def _start_workers(self):
        """启动工作器"""
        if self.workers_running:
            return
        
        self.workers_running = True
        logger.info(f"启动 {self.max_concurrent} 个队列工作器")
        
        # 启动足够的工作器来处理任务
        worker_count = max(self.max_concurrent, 4)  # 至少启动4个工作器
        self.worker_tasks = []  # 保持工作器任务的强引用
        for i in range(worker_count):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.worker_tasks.append(worker)
        
        # 不等待工作器完成，让它们在后台持续运行
        logger.info(f"工作器已启动，工作器数量: {len(self.worker_tasks)}")
    
    async def stop_workers(self):
        """停止所有工作器"""
        if not self.workers_running:
            return
        
        logger.info("正在停止队列工作器...")
        self.workers_running = False
        
        # 取消所有工作器任务
        for task in self.worker_tasks:
            if not task.done():
                task.cancel()
        
        # 等待所有工作器取消
        if self.worker_tasks:
            await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        
        self.worker_tasks.clear()
        logger.info("队列工作器已停止")
    
    async def _worker(self, worker_name: str):
        """工作器主循环"""
        logger.info(f"工作器 {worker_name} 启动")
        
        try:
            while self.workers_running:
                try:
                    # 检查是否有待处理任务
                    task = None
                    async with self._lock:
                        # 检查当前运行的大文件数量
                        large_files_running = sum(1 for t in self.running_tasks.values() 
                                                if t.file_size > self.large_file_threshold)
                        
                        if len(self.running_tasks) >= self.max_concurrent:
                            # 已达到最大并发数
                            pass
                        elif self.pending_tasks:
                            # 获取下一个任务，考虑大文件限制
                            task_to_run = None
                            for i, pending_task in enumerate(self.pending_tasks):
                                if pending_task.file_size > self.large_file_threshold:
                                    # 大文件：检查大文件并发限制
                                    if large_files_running < self.max_concurrent_large_files:
                                        task_to_run = self.pending_tasks.pop(i)
                                        break
                                else:
                                    # 小文件：直接运行
                                    task_to_run = self.pending_tasks.pop(i)
                                    break
                            
                            if task_to_run:
                                task = task_to_run
                                task.status = TaskStatus.RUNNING.value
                                task.started_at = datetime.now(timezone.utc).isoformat()
                                self.running_tasks[task.id] = task
                    
                    if not task:
                        await asyncio.sleep(1)
                        continue
                    
                    file_size_mb = task.file_size / (1024 * 1024)
                    is_large_file = task.file_size > self.large_file_threshold
                    logger.info(f"工作器 {worker_name} 开始处理任务: {task.id} - {task.file_name} "
                              f"({file_size_mb:.1f}MB, {'大文件' if is_large_file else '小文件'})")
                    
                    # 执行任务
                    try:
                        await self._execute_task(task)
                        
                        # 任务成功
                        async with self._lock:
                            task.status = TaskStatus.COMPLETED.value
                            task.completed_at = datetime.now(timezone.utc).isoformat()
                            self.completed_tasks[task.id] = task
                            del self.running_tasks[task.id]
                        
                        logger.info(f"✅ 任务完成: {task.id} - {task.file_name}")
                        
                    except Exception as e:
                        # 任务失败
                        async with self._lock:
                            task.status = TaskStatus.FAILED.value
                            task.error_message = str(e)
                            task.completed_at = datetime.now(timezone.utc).isoformat()
                            self.failed_tasks[task.id] = task
                            del self.running_tasks[task.id]
                        
                        logger.error(f"❌ 任务失败: {task.id} - {task.file_name}: {e}")
                    
                except Exception as e:
                    logger.error(f"工作器 {worker_name} 异常: {e}")
                    await asyncio.sleep(5)  # 异常后等待5秒再继续
        
        except asyncio.CancelledError:
            logger.info(f"工作器 {worker_name} 被取消")
        except Exception as e:
            logger.error(f"工作器 {worker_name} 发生严重异常: {e}")
        finally:
            logger.info(f"工作器 {worker_name} 退出")
    
    async def _execute_task(self, task: QueueTask):
        """执行任务"""
        if not task.handler:
            raise ValueError("任务处理函数不存在")
        
        handler = task.handler
        args = task.handler_args or []
        
        # 执行处理函数
        if asyncio.iscoroutinefunction(handler):
            await handler(*args)
        else:
            # 在线程池中执行同步函数
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, handler, *args)

# 全局简单队列实例
simple_queue = SimpleQueueService()