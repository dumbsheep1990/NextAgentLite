"""
轻量化文件处理队列系统
限制最多同时执行2个文件的切分和向量化，防止系统资源过载
"""
import asyncio
import uuid
import os
from enum import Enum
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TaskType(Enum):
    """任务类型"""
    DOCUMENT_PROCESSING = "document_processing"  # 文档处理
    QA_DATASET_PROCESSING = "qa_dataset_processing"  # QA数据集处理

class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"      # 等待中
    RUNNING = "running"      # 执行中  
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"        # 失败

@dataclass
class ProcessingTask:
    """处理任务"""
    id: str
    task_type: TaskType
    file_name: str
    file_size: int
    handler: Callable
    handler_args: tuple = field(default_factory=tuple)
    handler_kwargs: dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    priority: int = 1  # 优先级，数字越小优先级越高

class FileProcessingQueue:
    """文件处理队列管理器"""
    
    def __init__(self, max_concurrent_tasks: int = None):
        if max_concurrent_tasks is None:
            # 从环境变量读取，默认值为2
            max_concurrent_tasks = int(os.getenv('QUEUE_MAX_CONCURRENT_TASKS', '2'))
        self.max_concurrent_tasks = max_concurrent_tasks
        self.pending_tasks: List[ProcessingTask] = []
        self.running_tasks: Dict[str, ProcessingTask] = {}
        self.completed_tasks: Dict[str, ProcessingTask] = {}
        self._lock = asyncio.Lock()
        self._worker_running = False
        
    async def add_task(
        self, 
        task_type: TaskType,
        file_name: str,
        file_size: int,
        handler: Callable,
        handler_args: tuple = (),
        handler_kwargs: dict = None,
        priority: int = 1
    ) -> str:
        """添加任务到队列"""
        task_id = str(uuid.uuid4())
        task = ProcessingTask(
            id=task_id,
            task_type=task_type,
            file_name=file_name,
            file_size=file_size,
            handler=handler,
            handler_args=handler_args,
            handler_kwargs=handler_kwargs or {},
            priority=priority
        )
        
        async with self._lock:
            self.pending_tasks.append(task)
            # 按优先级排序，优先级数字越小越靠前
            self.pending_tasks.sort(key=lambda t: (t.priority, t.created_at))
            
        logger.info(f"添加任务到队列: {task_id} ({file_name}) - {task_type.value}")
        
        # 启动工作器
        if not self._worker_running:
            asyncio.create_task(self._worker())
            
        return task_id
    
    async def _worker(self):
        """队列工作器"""
        self._worker_running = True
        logger.info("文件处理队列工作器启动")
        
        try:
            while True:
                async with self._lock:
                    # 检查是否有待处理任务且当前运行任务数未达到上限
                    if (not self.pending_tasks or 
                        len(self.running_tasks) >= self.max_concurrent_tasks):
                        # 如果没有待处理任务且没有运行中任务，退出工作器
                        if not self.pending_tasks and not self.running_tasks:
                            break
                        continue
                    
                    # 获取下一个任务
                    task = self.pending_tasks.pop(0)
                    task.status = TaskStatus.RUNNING
                    task.started_at = datetime.utcnow()
                    self.running_tasks[task.id] = task
                    
                logger.info(f"开始执行任务: {task.id} ({task.file_name}) - {task.task_type.value}")
                logger.info(f"当前队列状态: 等待={len(self.pending_tasks)}, 运行={len(self.running_tasks)}")
                
                # 异步执行任务
                asyncio.create_task(self._execute_task(task))
                
                # 短暂延迟避免过于频繁检查
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"队列工作器异常: {e}")
        finally:
            self._worker_running = False
            logger.info("文件处理队列工作器停止")
    
    async def _execute_task(self, task: ProcessingTask):
        """执行单个任务"""
        try:
            logger.info(f"执行任务: {task.id} - {task.file_name}")
            
            # 调用任务处理器
            result = await task.handler(*task.handler_args, **task.handler_kwargs)
            
            # 任务完成
            async with self._lock:
                if task.id in self.running_tasks:
                    del self.running_tasks[task.id]
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.utcnow()
                self.completed_tasks[task.id] = task
                
            duration = (task.completed_at - task.started_at).total_seconds()
            logger.info(f"任务完成: {task.id} - {task.file_name} (用时: {duration:.2f}s)")
            
        except Exception as e:
            # 任务失败
            async with self._lock:
                if task.id in self.running_tasks:
                    del self.running_tasks[task.id]
                task.status = TaskStatus.FAILED
                task.completed_at = datetime.utcnow()
                task.error_message = str(e)
                self.completed_tasks[task.id] = task
                
            logger.error(f"任务失败: {task.id} - {task.file_name}: {e}")
    
    async def get_task_status(self, task_id: str) -> Optional[ProcessingTask]:
        """获取任务状态"""
        async with self._lock:
            # 检查待处理任务
            for task in self.pending_tasks:
                if task.id == task_id:
                    return task
            
            # 检查运行中任务
            if task_id in self.running_tasks:
                return self.running_tasks[task_id]
            
            # 检查已完成任务
            if task_id in self.completed_tasks:
                return self.completed_tasks[task_id]
            
            return None
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        async with self._lock:
            return {
                "pending_count": len(self.pending_tasks),
                "running_count": len(self.running_tasks),
                "completed_count": len(self.completed_tasks),
                "max_concurrent": self.max_concurrent_tasks,
                "pending_tasks": [
                    {
                        "id": task.id,
                        "file_name": task.file_name,
                        "task_type": task.task_type.value,
                        "priority": task.priority,
                        "created_at": task.created_at.isoformat()
                    }
                    for task in self.pending_tasks
                ],
                "running_tasks": [
                    {
                        "id": task.id,
                        "file_name": task.file_name,
                        "task_type": task.task_type.value,
                        "started_at": task.started_at.isoformat() if task.started_at else None
                    }
                    for task in self.running_tasks.values()
                ]
            }
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务（仅对待处理任务有效）"""
        async with self._lock:
            for i, task in enumerate(self.pending_tasks):
                if task.id == task_id:
                    task.status = TaskStatus.FAILED
                    task.error_message = "Task cancelled by user"
                    task.completed_at = datetime.utcnow()
                    self.completed_tasks[task_id] = task
                    del self.pending_tasks[i]
                    logger.info(f"任务已取消: {task_id}")
                    return True
            return False
    
    async def cleanup_completed_tasks(self, max_keep: int = 100):
        """清理已完成的任务，保留最近的指定数量"""
        async with self._lock:
            if len(self.completed_tasks) > max_keep:
                # 按完成时间排序，保留最新的
                sorted_tasks = sorted(
                    self.completed_tasks.values(),
                    key=lambda t: t.completed_at or datetime.min,
                    reverse=True
                )
                
                # 保留最新的max_keep个任务
                tasks_to_keep = {task.id: task for task in sorted_tasks[:max_keep]}
                removed_count = len(self.completed_tasks) - len(tasks_to_keep)
                self.completed_tasks = tasks_to_keep
                
                logger.info(f"清理已完成任务: 移除 {removed_count} 个，保留 {len(tasks_to_keep)} 个")

# 全局队列实例
file_processing_queue = FileProcessingQueue()