"""
向量化任务管理器 - 管理向量化任务的生命周期
"""
import asyncio
import threading
from typing import Dict, Set, Optional, Callable, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from core.logger import logger


class TaskStatus(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class VectorizationTask:
    """向量化任务信息"""
    task_id: str
    document_id: str
    config: Dict[str, Any]
    status: TaskStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: int = 0
    message: str = ""
    error_message: Optional[str] = None
    cancellation_token: Optional[asyncio.Event] = None
    task_future: Optional[asyncio.Task] = None


class VectorizationTaskManager:
    """向量化任务管理器"""
    
    def __init__(self):
        self._tasks: Dict[str, VectorizationTask] = {}
        self._document_tasks: Dict[str, str] = {}  # document_id -> task_id
        self._lock = threading.Lock()
    
    def create_task(
        self, 
        document_id: str, 
        config: Dict[str, Any],
        task_id: Optional[str] = None
    ) -> str:
        """创建新的向量化任务"""
        import uuid
        
        task_id = task_id or str(uuid.uuid4())
        
        with self._lock:
            # 如果该文档已有任务在运行，先取消
            if document_id in self._document_tasks:
                old_task_id = self._document_tasks[document_id]
                self._cancel_task_internal(old_task_id)
            
            # 创建取消令牌
            cancellation_token = asyncio.Event()
            
            task = VectorizationTask(
                task_id=task_id,
                document_id=document_id,
                config=config,
                status=TaskStatus.PENDING,
                created_at=datetime.now(),
                cancellation_token=cancellation_token
            )
            
            self._tasks[task_id] = task
            self._document_tasks[document_id] = task_id
            
            logger.info(f"创建向量化任务: {task_id} for document {document_id}")
            return task_id
    
    def start_task(self, task_id: str, task_future: asyncio.Task):
        """启动任务"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                task.status = TaskStatus.RUNNING
                task.started_at = datetime.now()
                task.task_future = task_future
                logger.info(f"启动向量化任务: {task_id}")
    
    def update_progress(self, task_id: str, progress: int, message: str = ""):
        """更新任务进度"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                if task.status == TaskStatus.RUNNING:
                    task.progress = progress
                    task.message = message
                    logger.debug(f"任务进度更新: {task_id} - {progress}% - {message}")
    
    def complete_task(self, task_id: str, message: str = ""):
        """完成任务"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now()
                task.progress = 100
                task.message = message
                
                # 清理映射
                if task.document_id in self._document_tasks:
                    del self._document_tasks[task.document_id]
                
                logger.info(f"任务完成: {task_id} - {message}")
    
    def fail_task(self, task_id: str, error_message: str):
        """任务失败"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                task.status = TaskStatus.FAILED
                task.completed_at = datetime.now()
                task.error_message = error_message
                
                # 清理映射
                if task.document_id in self._document_tasks:
                    del self._document_tasks[task.document_id]
                
                logger.error(f"任务失败: {task_id} - {error_message}")
    
    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        with self._lock:
            return self._cancel_task_internal(task_id)
    
    def cancel_document_tasks(self, document_id: str) -> bool:
        """取消特定文档的所有任务"""
        with self._lock:
            if document_id in self._document_tasks:
                task_id = self._document_tasks[document_id]
                return self._cancel_task_internal(task_id)
            return False
    
    def _cancel_task_internal(self, task_id: str) -> bool:
        """内部取消任务方法（需要持有锁）"""
        if task_id in self._tasks:
            task = self._tasks[task_id]
            
            if task.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
                # 设置取消令牌
                if task.cancellation_token:
                    task.cancellation_token.set()
                
                # 取消异步任务
                if task.task_future and not task.task_future.done():
                    task.task_future.cancel()
                
                task.status = TaskStatus.CANCELLED
                task.completed_at = datetime.now()
                
                # 清理映射
                if task.document_id in self._document_tasks:
                    del self._document_tasks[task.document_id]
                
                logger.info(f"任务已取消: {task_id}")
                return True
        
        return False
    
    def get_task(self, task_id: str) -> Optional[VectorizationTask]:
        """获取任务信息"""
        with self._lock:
            return self._tasks.get(task_id)
    
    def get_document_task(self, document_id: str) -> Optional[VectorizationTask]:
        """获取文档的当前任务"""
        with self._lock:
            if document_id in self._document_tasks:
                task_id = self._document_tasks[document_id]
                return self._tasks.get(task_id)
            return None
    
    def is_cancelled(self, task_id: str) -> bool:
        """检查任务是否被取消"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                return (task.status == TaskStatus.CANCELLED or 
                       (task.cancellation_token and task.cancellation_token.is_set()))
            return False
    
    def get_all_tasks(self) -> Dict[str, VectorizationTask]:
        """获取所有任务"""
        with self._lock:
            return self._tasks.copy()
    
    def get_running_tasks(self) -> Dict[str, VectorizationTask]:
        """获取所有运行中的任务"""
        with self._lock:
            return {
                task_id: task for task_id, task in self._tasks.items()
                if task.status == TaskStatus.RUNNING
            }
    
    def cleanup_completed_tasks(self, max_age_hours: int = 24):
        """清理已完成的旧任务"""
        import datetime as dt
        
        cutoff_time = datetime.now() - dt.timedelta(hours=max_age_hours)
        tasks_to_remove = []
        
        with self._lock:
            for task_id, task in self._tasks.items():
                if (task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] and
                    task.completed_at and task.completed_at < cutoff_time):
                    tasks_to_remove.append(task_id)
            
            for task_id in tasks_to_remove:
                del self._tasks[task_id]
            
            if tasks_to_remove:
                logger.info(f"清理了 {len(tasks_to_remove)} 个过期任务")


# 全局任务管理器实例
vectorization_task_manager = VectorizationTaskManager() 