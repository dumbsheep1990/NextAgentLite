"""
持久化任务队列服务 - 基于数据库的任务管理系统
替代内存任务管理器，支持：
- 任务状态持久化
- 并发控制和资源锁定
- 任务依赖管理
- 进度跟踪和状态恢复
- 自动重试机制
"""
import asyncio
import uuid
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from contextlib import asynccontextmanager

from db.database import get_async_session
from core.logger import logger
from utils.timezone_utils import get_china_now
from core.task_config import task_config


class TaskStatus(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(Enum):
    """任务类型枚举"""
    DOCUMENT_PROCESSING = "document_processing"
    VECTORIZATION = "vectorization"
    QA_DATASET = "qa_dataset"
    GRAPH_EXTRACTION = "graph_extraction"


@dataclass
class Task:
    """任务数据结构"""
    id: str
    task_type: str
    status: str
    task_data: Dict[str, Any]
    session_id: Optional[str] = None
    priority: int = 0
    progress: int = 0
    current_stage: Optional[str] = None
    stage_detail: Optional[str] = None
    worker_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    depends_on: Optional[List[str]] = None
    retry_count: int = 0
    max_retries: int = 3
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    processing_time: Optional[float] = None


@dataclass
class WorkerStatus:
    """工作进程状态"""
    worker_id: str
    worker_type: str
    max_concurrent_tasks: int
    current_task_count: int
    status: str
    last_heartbeat: datetime
    capabilities: Dict[str, Any]


class PersistentTaskQueue:
    """持久化任务队列服务"""
    
    def __init__(self):
        self.worker_id = f"worker-{uuid.uuid4()}"
        self.worker_type = "general"
        self.max_concurrent_tasks = task_config.max_concurrent_tasks
        self.current_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False
        self.heartbeat_interval = task_config.task_heartbeat_interval  # 心跳间隔（秒）
        self.lock_timeout = task_config.task_lock_timeout  # 锁超时时间（秒）
        
    async def initialize(self, worker_type: str = "general", max_concurrent: int = 3):
        """初始化任务队列服务"""
        self.worker_type = worker_type
        self.max_concurrent_tasks = max_concurrent
        
        # 注册工作进程
        await self._register_worker()
        
        # 启动心跳任务
        self.is_running = True
        asyncio.create_task(self._heartbeat_loop())
        
        logger.info(f"任务队列服务已初始化: {self.worker_id}, 类型: {worker_type}, 最大并发: {max_concurrent}")

    async def shutdown(self):
        """关闭任务队列服务"""
        self.is_running = False
        
        # 取消所有运行中的任务
        for task_id, task in self.current_tasks.items():
            if not task.done():
                task.cancel()
                await self._update_task_status(task_id, TaskStatus.CANCELLED, error_message="服务关闭")
        
        # 清理工作进程注册
        await self._cleanup_worker()
        
        logger.info(f"任务队列服务已关闭: {self.worker_id}")

    async def submit_task(
        self,
        task_type: str,
        task_data: Dict[str, Any],
        session_id: Optional[str] = None,
        priority: int = 0,
        depends_on: Optional[List[str]] = None,
        max_retries: int = None,
        expires_in_hours: int = None
    ) -> str:
        """提交新任务"""
        # 使用配置的默认值
        if max_retries is None:
            max_retries = task_config.max_task_retries
        if expires_in_hours is None:
            expires_in_hours = task_config.task_expires_hours
            
        task_id = str(uuid.uuid4())
        expires_at = get_china_now() + timedelta(hours=expires_in_hours)
        
        async with get_async_session() as session:
            query = """
                INSERT INTO task_queue (
                    id, task_type, task_data, session_id, priority, 
                    depends_on, max_retries, expires_at, status
                ) VALUES (
                    :task_id, :task_type, :task_data, :session_id, :priority,
                    :depends_on, :max_retries, :expires_at, :status
                )
            """
            
            await session.execute(text(query), {
                "task_id": task_id,
                "task_type": task_type,
                "task_data": json.dumps(task_data),
                "session_id": session_id,
                "priority": priority,
                "depends_on": json.dumps(depends_on) if depends_on else None,
                "max_retries": max_retries,
                "expires_at": expires_at,
                "status": TaskStatus.PENDING.value
            })
            await session.commit()
        
        logger.info(f"任务已提交: {task_id}, 类型: {task_type}, 会话: {session_id}")
        return task_id

    async def get_task_status(self, task_id: str) -> Optional[Task]:
        """获取任务状态"""
        async with get_async_session() as session:
            query = text("""
                SELECT id, task_type, status, task_data, session_id, priority,
                       progress, current_stage, stage_detail, worker_id,
                       result, error_message, error_details, depends_on,
                       retry_count, max_retries, created_at, started_at,
                       completed_at, updated_at, expires_at, processing_time
                FROM task_queue WHERE id = :task_id
            """)
            
            result = await session.execute(query, {"task_id": task_id})
            row = result.fetchone()
            
            if not row:
                return None
            
            return Task(
                id=row.id,
                task_type=row.task_type,
                status=row.status,
                task_data=json.loads(row.task_data) if row.task_data else {},
                session_id=row.session_id,
                priority=row.priority,
                progress=row.progress,
                current_stage=row.current_stage,
                stage_detail=row.stage_detail,
                worker_id=row.worker_id,
                result=json.loads(row.result) if row.result else None,
                error_message=row.error_message,
                error_details=json.loads(row.error_details) if row.error_details else None,
                depends_on=json.loads(row.depends_on) if row.depends_on else None,
                retry_count=row.retry_count,
                max_retries=row.max_retries,
                created_at=row.created_at,
                started_at=row.started_at,
                completed_at=row.completed_at,
                updated_at=row.updated_at,
                expires_at=row.expires_at,
                processing_time=row.processing_time
            )

    async def get_session_tasks(self, session_id: str) -> List[Task]:
        """获取指定会话的所有任务"""
        async with get_async_session() as session:
            query = text("""
                SELECT id, task_type, status, task_data, session_id, priority,
                       progress, current_stage, stage_detail, worker_id,
                       result, error_message, error_details, depends_on,
                       retry_count, max_retries, created_at, started_at,
                       completed_at, updated_at, expires_at, processing_time
                FROM task_queue 
                WHERE session_id = :session_id
                ORDER BY created_at DESC
            """)
            
            result = await session.execute(query, {"session_id": session_id})
            rows = result.fetchall()
            
            tasks = []
            for row in rows:
                tasks.append(Task(
                    id=row.id,
                    task_type=row.task_type,
                    status=row.status,
                    task_data=json.loads(row.task_data) if row.task_data else {},
                    session_id=row.session_id,
                    priority=row.priority,
                    progress=row.progress,
                    current_stage=row.current_stage,
                    stage_detail=row.stage_detail,
                    worker_id=row.worker_id,
                    result=json.loads(row.result) if row.result else None,
                    error_message=row.error_message,
                    error_details=json.loads(row.error_details) if row.error_details else None,
                    depends_on=json.loads(row.depends_on) if row.depends_on else None,
                    retry_count=row.retry_count,
                    max_retries=row.max_retries,
                    created_at=row.created_at,
                    started_at=row.started_at,
                    completed_at=row.completed_at,
                    updated_at=row.updated_at,
                    expires_at=row.expires_at,
                    processing_time=row.processing_time
                ))
            
            return tasks

    async def update_task_progress(
        self,
        task_id: str,
        progress: int,
        stage: Optional[str] = None,
        detail: Optional[str] = None
    ) -> bool:
        """更新任务进度"""
        async with get_async_session() as session:
            query = text("SELECT update_task_progress(:task_id, :progress, :stage, :detail)")
            result = await session.execute(query, {
                "task_id": task_id,
                "progress": progress,
                "stage": stage,
                "detail": detail
            })
            await session.commit()
            return result.scalar()

    async def complete_task(
        self,
        task_id: str,
        result: Optional[Dict[str, Any]] = None,
        processing_time: Optional[float] = None
    ) -> bool:
        """完成任务"""
        async with get_async_session() as session:
            query = text("SELECT complete_task(:task_id, :result, :processing_time)")
            result = await session.execute(query, {
                "task_id": task_id,
                "result": json.dumps(result) if result else None,
                "processing_time": processing_time
            })
            await session.commit()
            
            # 从当前任务列表中移除
            if task_id in self.current_tasks:
                del self.current_tasks[task_id]
            
            return result.scalar()

    async def fail_task(
        self,
        task_id: str,
        error_message: str,
        error_details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """任务失败处理"""
        async with get_async_session() as session:
            query = text("SELECT fail_task(:task_id, :error_message, :error_details)")
            result = await session.execute(query, {
                "task_id": task_id,
                "error_message": error_message,
                "error_details": json.dumps(error_details) if error_details else None
            })
            await session.commit()
            
            # 从当前任务列表中移除
            if task_id in self.current_tasks:
                del self.current_tasks[task_id]
            
            return result.scalar()

    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        # 如果任务正在运行，先取消异步任务
        if task_id in self.current_tasks:
            task = self.current_tasks[task_id]
            if not task.done():
                task.cancel()
            del self.current_tasks[task_id]
        
        return await self._update_task_status(task_id, TaskStatus.CANCELLED)

    async def cancel_session_tasks(self, session_id: str) -> int:
        """取消指定会话的所有未完成任务"""
        async with get_async_session() as session:
            # 获取未完成的任务
            query = text("""
                SELECT id FROM task_queue 
                WHERE session_id = :session_id 
                AND status IN ('pending', 'running')
            """)
            result = await session.execute(query, {"session_id": session_id})
            task_ids = [row.id for row in result.fetchall()]
            
            # 取消每个任务
            cancelled_count = 0
            for task_id in task_ids:
                if await self.cancel_task(task_id):
                    cancelled_count += 1
            
            return cancelled_count

    @asynccontextmanager
    async def acquire_resource_lock(self, resource_id: str, resource_type: str):
        """获取资源锁"""
        lock_acquired = False
        try:
            async with get_async_session() as session:
                # 清理过期锁
                await session.execute(text("SELECT cleanup_expired_locks()"))
                
                # 尝试获取锁
                query = text("""
                    INSERT INTO task_locks (resource_id, resource_type, locked_by, expires_at)
                    VALUES (:resource_id, :resource_type, :worker_id, :expires_at)
                    ON CONFLICT (resource_id) DO NOTHING
                    RETURNING resource_id
                """)
                
                expires_at = get_china_now() + timedelta(seconds=self.lock_timeout)
                result = await session.execute(query, {
                    "resource_id": resource_id,
                    "resource_type": resource_type,
                    "worker_id": self.worker_id,
                    "expires_at": expires_at
                })
                
                if result.fetchone():
                    lock_acquired = True
                    await session.commit()
                    logger.debug(f"获取资源锁成功: {resource_type}:{resource_id}")
                else:
                    await session.rollback()
                    raise RuntimeError(f"无法获取资源锁: {resource_type}:{resource_id}")
            
            yield
            
        finally:
            if lock_acquired:
                # 释放锁
                async with get_async_session() as session:
                    query = text("""
                        DELETE FROM task_locks 
                        WHERE resource_id = :resource_id AND locked_by = :worker_id
                    """)
                    await session.execute(query, {
                        "resource_id": resource_id,
                        "worker_id": self.worker_id
                    })
                    await session.commit()
                    logger.debug(f"释放资源锁: {resource_type}:{resource_id}")

    async def get_queue_statistics(self) -> Dict[str, Any]:
        """获取队列统计信息"""
        async with get_async_session() as session:
            query = text("""
                SELECT 
                    task_type,
                    status,
                    COUNT(*) as count,
                    AVG(processing_time) as avg_processing_time
                FROM task_queue
                WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                GROUP BY task_type, status
                ORDER BY task_type, status
            """)
            
            result = await session.execute(query)
            rows = result.fetchall()
            
            stats = {
                "queue_status": {},
                "total_tasks": 0,
                "avg_processing_time": {}
            }
            
            for row in rows:
                task_type = row.task_type
                status = row.status
                count = row.count
                avg_time = row.avg_processing_time
                
                if task_type not in stats["queue_status"]:
                    stats["queue_status"][task_type] = {}
                
                stats["queue_status"][task_type][status] = count
                stats["total_tasks"] += count
                
                if avg_time and status == "completed":
                    stats["avg_processing_time"][task_type] = float(avg_time)
            
            return stats

    async def cleanup_old_tasks(self, hours: int = 168):  # 默认7天
        """清理旧任务"""
        async with get_async_session() as session:
            cutoff_time = get_china_now() - timedelta(hours=hours)
            
            query = text("""
                DELETE FROM task_queue 
                WHERE (completed_at < :cutoff_time OR expires_at < CURRENT_TIMESTAMP)
                AND status IN ('completed', 'failed', 'cancelled')
            """)
            
            result = await session.execute(query, {"cutoff_time": cutoff_time})
            await session.commit()
            
            deleted_count = result.rowcount
            logger.info(f"清理了 {deleted_count} 个旧任务记录")
            return deleted_count

    # 私有方法
    async def _register_worker(self):
        """注册工作进程"""
        async with get_async_session() as session:
            query = text("""
                INSERT INTO task_workers (
                    worker_id, worker_type, max_concurrent_tasks, 
                    current_task_count, status, last_heartbeat, capabilities
                ) VALUES (
                    :worker_id, :worker_type, :max_concurrent_tasks,
                    0, 'active', CURRENT_TIMESTAMP, :capabilities
                )
                ON CONFLICT (worker_id) DO UPDATE SET
                    worker_type = EXCLUDED.worker_type,
                    max_concurrent_tasks = EXCLUDED.max_concurrent_tasks,
                    status = 'active',
                    last_heartbeat = CURRENT_TIMESTAMP
            """)
            
            capabilities = {
                "task_types": [self.worker_type],
                "max_file_size": 52428800,  # 50MB
                "supported_formats": ["pdf", "docx", "txt", "md", "xlsx", "xls"]
            }
            
            await session.execute(query, {
                "worker_id": self.worker_id,
                "worker_type": self.worker_type,
                "max_concurrent_tasks": self.max_concurrent_tasks,
                "capabilities": json.dumps(capabilities)
            })
            await session.commit()

    async def _cleanup_worker(self):
        """清理工作进程注册"""
        async with get_async_session() as session:
            query = text("""
                UPDATE task_workers 
                SET status = 'stopped', current_task_count = 0
                WHERE worker_id = :worker_id
            """)
            await session.execute(query, {"worker_id": self.worker_id})
            await session.commit()

    async def _heartbeat_loop(self):
        """心跳循环"""
        while self.is_running:
            try:
                await self._update_heartbeat()
                await asyncio.sleep(self.heartbeat_interval)
            except Exception as e:
                logger.error(f"心跳更新失败: {e}")
                await asyncio.sleep(5)

    async def _update_heartbeat(self):
        """更新心跳"""
        async with get_async_session() as session:
            query = text("""
                UPDATE task_workers 
                SET last_heartbeat = CURRENT_TIMESTAMP,
                    current_task_count = :task_count
                WHERE worker_id = :worker_id
            """)
            await session.execute(query, {
                "worker_id": self.worker_id,
                "task_count": len(self.current_tasks)
            })
            await session.commit()

    async def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        error_message: Optional[str] = None
    ) -> bool:
        """更新任务状态"""
        async with get_async_session() as session:
            update_fields = ["status = :status", "updated_at = CURRENT_TIMESTAMP"]
            params = {"task_id": task_id, "status": status.value}
            
            if status == TaskStatus.COMPLETED:
                update_fields.append("progress = 100")
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
            elif status in [TaskStatus.FAILED, TaskStatus.CANCELLED]:
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
                if error_message:
                    update_fields.append("error_message = :error_message")
                    params["error_message"] = error_message
            
            query = text(f"""
                UPDATE task_queue SET {', '.join(update_fields)}
                WHERE id = :task_id
            """)
            
            result = await session.execute(query, params)
            await session.commit()
            
            return result.rowcount > 0


# 全局任务队列实例
persistent_task_queue = PersistentTaskQueue() 