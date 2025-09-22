"""
QA提取队列管理服务
独立的QA提取队列系统，支持并发控制、状态管理和自动重试
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor

from core.config_optimized import optimized_config_manager
from service.qa_generation_service_simplified import QAGenerationServiceSimplified

logger = logging.getLogger(__name__)


class QAExtractionStatus(Enum):
    """QA提取任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkerStatus(Enum):
    """工作进程状态"""
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"


@dataclass
class QAExtractionTask:
    """QA提取任务"""
    id: str
    document_id: str
    document_title: str
    collection_id: Optional[str] = None
    priority: int = 5
    status: QAExtractionStatus = QAExtractionStatus.PENDING
    extraction_config: Dict[str, Any] = None
    auto_create_dataset: bool = True
    dataset_naming_pattern: Optional[str] = None
    worker_id: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    qa_generation_task_id: Optional[int] = None
    target_dataset_id: Optional[str] = None
    qa_pairs_generated: int = 0
    processing_duration: Optional[int] = None
    error_message: Optional[str] = None
    result_summary: Dict[str, Any] = None
    created_at: datetime = None
    scheduled_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class QAWorker:
    """QA提取工作进程"""
    id: str
    worker_id: str
    worker_name: str
    status: WorkerStatus = WorkerStatus.IDLE
    max_concurrent_tasks: int = 1
    current_task_count: int = 0
    supported_document_types: List[str] = None
    current_task_id: Optional[str] = None
    current_task_started_at: Optional[datetime] = None
    total_tasks_processed: int = 0
    successful_tasks: int = 0
    failed_tasks: int = 0
    avg_processing_time: Optional[float] = None
    last_heartbeat: datetime = None
    last_error_message: Optional[str] = None
    error_count: int = 0


class QAExtractionQueueService:
    """QA提取队列管理服务"""
    
    def __init__(self):
        self.qa_generation_service = QAGenerationServiceSimplified()
        self._running_workers = {}  # 运行中的工作进程
        self._worker_tasks = {}  # 工作进程的任务映射
        
    def _get_connection(self):
        """获取数据库连接"""
        db_config = optimized_config_manager.settings.database_postgresql
        return psycopg2.connect(
            host=db_config.host,
            port=db_config.port,
            database=db_config.database,
            user=db_config.username,
            password=db_config.password,
            cursor_factory=RealDictCursor
        )
    
    async def submit_extraction_task(
        self,
        document_id: str,
        document_title: str,
        collection_id: Optional[str] = None,
        priority: int = 5,
        extraction_config: Optional[Dict[str, Any]] = None,
        auto_create_dataset: bool = True,
        dataset_naming_pattern: Optional[str] = None
    ) -> str:
        """
        提交QA提取任务到队列
        
        Args:
            document_id: 文档ID
            document_title: 文档标题
            collection_id: 知识库集合ID
            priority: 优先级(1-10, 10最高)
            extraction_config: 提取配置
            auto_create_dataset: 是否自动创建数据集
            dataset_naming_pattern: 数据集命名模式
            
        Returns:
            任务ID
        """
        try:
            task_id = str(uuid.uuid4())
            
            # 生成数据集命名模式
            if not dataset_naming_pattern:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                dataset_naming_pattern = f"{document_title}_{timestamp}_qa"
            
            # 默认提取配置
            if not extraction_config:
                extraction_config = {
                    "chunk_size": 1200,
                    "chunk_overlap": 100,
                    "qa_count_per_chunk": 3,
                    "language": "zh",
                    "quality_threshold": 0.7
                }
            
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qa_extraction_queue (
                        id, document_id, document_title, collection_id, priority,
                        extraction_config, auto_create_dataset, dataset_naming_pattern,
                        created_at, scheduled_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    task_id, document_id, document_title, collection_id, priority,
                    json.dumps(extraction_config), auto_create_dataset, dataset_naming_pattern,
                    datetime.now(), datetime.now()
                ))
                
                result = cursor.fetchone()
                task_id = result['id']
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ QA提取任务已提交: {task_id}, 文档: {document_title}")
            
            # 触发任务调度
            asyncio.create_task(self._schedule_tasks())
            
            return task_id
            
        except Exception as e:
            logger.error(f"❌ 提交QA提取任务失败: {e}")
            raise
    
    async def get_task_status(self, task_id: str) -> Optional[QAExtractionTask]:
        """获取任务状态"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM qa_extraction_queue WHERE id = %s
                """, (task_id,))
                
                row = cursor.fetchone()
                
            conn.close()
            
            if not row:
                return None
                
            return QAExtractionTask(
                id=row['id'],
                document_id=row['document_id'],
                document_title=row['document_title'],
                collection_id=row['collection_id'],
                priority=row['priority'],
                status=QAExtractionStatus(row['status']),
                extraction_config=row['extraction_config'],
                auto_create_dataset=row['auto_create_dataset'],
                dataset_naming_pattern=row['dataset_naming_pattern'],
                worker_id=row['worker_id'],
                retry_count=row['retry_count'],
                max_retries=row['max_retries'],
                qa_generation_task_id=row['qa_generation_task_id'],
                target_dataset_id=row['target_dataset_id'],
                qa_pairs_generated=row['qa_pairs_generated'],
                processing_duration=row['processing_duration'],
                error_message=row['error_message'],
                result_summary=row['result_summary'],
                created_at=row['created_at'],
                scheduled_at=row['scheduled_at'],
                started_at=row['started_at'],
                completed_at=row['completed_at']
            )
            
        except Exception as e:
            logger.error(f"❌ 获取任务状态失败: {e}")
            return None
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态概览"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 任务统计
                cursor.execute("""
                    SELECT 
                        status,
                        COUNT(*) as count,
                        AVG(processing_duration) as avg_duration
                    FROM qa_extraction_queue 
                    GROUP BY status
                """)
                task_stats = {row['status']: {
                    'count': row['count'],
                    'avg_duration': row['avg_duration']
                } for row in cursor.fetchall()}
                
                # 工作进程统计
                cursor.execute("""
                    SELECT 
                        status,
                        COUNT(*) as count,
                        AVG(current_task_count) as avg_load
                    FROM qa_extraction_workers
                    GROUP BY status
                """)
                worker_stats = {row['status']: {
                    'count': row['count'],
                    'avg_load': row['avg_load']
                } for row in cursor.fetchall()}
                
                # 队列长度
                cursor.execute("""
                    SELECT COUNT(*) as pending_count 
                    FROM qa_extraction_queue 
                    WHERE status = 'pending'
                """)
                pending_count = cursor.fetchone()['pending_count']
                
            conn.close()
            
            return {
                'queue_length': pending_count,
                'task_statistics': task_stats,
                'worker_statistics': worker_stats,
                'total_workers': sum(stats['count'] for stats in worker_stats.values()),
                'active_workers': worker_stats.get('busy', {}).get('count', 0),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ 获取队列状态失败: {e}")
            return {}
    
    async def _schedule_tasks(self):
        """任务调度器 - 分配待处理任务给可用工作进程"""
        try:
            # 获取可用的工作进程
            available_workers = await self._get_available_workers()
            if not available_workers:
                logger.debug("暂无可用工作进程")
                return
            
            # 获取待处理任务（按优先级排序）
            pending_tasks = await self._get_pending_tasks()
            if not pending_tasks:
                logger.debug("暂无待处理任务")
                return
            
            # 分配任务
            for worker in available_workers:
                if not pending_tasks:
                    break
                    
                if worker.current_task_count >= worker.max_concurrent_tasks:
                    continue
                
                task = pending_tasks.pop(0)
                await self._assign_task_to_worker(task['id'], worker.worker_id)
                
                # 启动任务处理
                asyncio.create_task(self._process_task(task['id'], worker.worker_id))
                
        except Exception as e:
            logger.error(f"❌ 任务调度失败: {e}")
    
    async def _get_available_workers(self) -> List[QAWorker]:
        """获取可用的工作进程"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM qa_extraction_workers
                    WHERE status IN ('idle', 'busy') 
                    AND current_task_count < max_concurrent_tasks
                    AND last_heartbeat > %s
                    ORDER BY current_task_count ASC, last_heartbeat DESC
                """, (datetime.now() - timedelta(minutes=5),))
                
                workers = []
                for row in cursor.fetchall():
                    workers.append(QAWorker(
                        id=row['id'],
                        worker_id=row['worker_id'],
                        worker_name=row['worker_name'],
                        status=WorkerStatus(row['status']),
                        max_concurrent_tasks=row['max_concurrent_tasks'],
                        current_task_count=row['current_task_count'],
                        supported_document_types=row['supported_document_types'] or [],
                        current_task_id=row['current_task_id'],
                        current_task_started_at=row['current_task_started_at'],
                        total_tasks_processed=row['total_tasks_processed'],
                        successful_tasks=row['successful_tasks'],
                        failed_tasks=row['failed_tasks'],
                        avg_processing_time=row['avg_processing_time'],
                        last_heartbeat=row['last_heartbeat'],
                        last_error_message=row['last_error_message'],
                        error_count=row['error_count']
                    ))
                
            conn.close()
            return workers
            
        except Exception as e:
            logger.error(f"❌ 获取可用工作进程失败: {e}")
            return []
    
    async def _get_pending_tasks(self) -> List[Dict[str, Any]]:
        """获取待处理任务"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM qa_extraction_queue
                    WHERE status = 'pending'
                    ORDER BY priority DESC, created_at ASC
                    LIMIT 10
                """)
                
                tasks = [dict(row) for row in cursor.fetchall()]
                
            conn.close()
            return tasks
            
        except Exception as e:
            logger.error(f"❌ 获取待处理任务失败: {e}")
            return []
    
    async def _assign_task_to_worker(self, task_id: str, worker_id: str):
        """分配任务给工作进程"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 更新任务状态
                cursor.execute("""
                    UPDATE qa_extraction_queue 
                    SET status = 'processing', worker_id = %s, started_at = %s
                    WHERE id = %s
                """, ('processing', worker_id, datetime.now(), task_id))
                
                # 更新工作进程状态
                cursor.execute("""
                    UPDATE qa_extraction_workers
                    SET status = 'busy', current_task_count = current_task_count + 1,
                        current_task_id = %s, current_task_started_at = %s,
                        last_heartbeat = %s
                    WHERE worker_id = %s
                """, (task_id, datetime.now(), datetime.now(), worker_id))
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 任务已分配: {task_id} -> 工作进程: {worker_id}")
            
        except Exception as e:
            logger.error(f"❌ 分配任务失败: {e}")
            raise
    
    async def _process_task(self, task_id: str, worker_id: str):
        """处理QA提取任务"""
        start_time = datetime.now()
        
        try:
            logger.info(f"🔄 开始处理QA提取任务: {task_id}")
            
            # 获取任务详情
            task = await self.get_task_status(task_id)
            if not task:
                raise Exception(f"任务不存在: {task_id}")
            
            # 创建QA生成任务
            qa_task_id = await self.qa_generation_service.create_qa_task(
                task.document_id,
                task.document_title
            )
            
            # 更新关联的QA生成任务ID
            await self._update_task_qa_generation_id(task_id, qa_task_id)
            
            # 处理QA生成
            result = await self.qa_generation_service.process_qa_task(qa_task_id)
            
            if result.get('success'):
                # 如果需要自动创建数据集
                dataset_id = None
                if task.auto_create_dataset:
                    dataset_id = await self._create_qa_dataset(task, result)
                
                # 完成任务
                processing_duration = int((datetime.now() - start_time).total_seconds())
                await self._complete_task(
                    task_id, 
                    worker_id,
                    result.get('qa_pairs_count', 0),
                    processing_duration,
                    result,
                    dataset_id
                )
                
                logger.info(f"✅ QA提取任务完成: {task_id}, 生成QA对: {result.get('qa_pairs_count', 0)}")
                
            else:
                # 任务失败
                await self._fail_task(task_id, worker_id, result.get('error', '处理失败'))
                
        except Exception as e:
            logger.error(f"❌ QA提取任务处理失败: {task_id}, 错误: {e}")
            await self._fail_task(task_id, worker_id, str(e))
    
    async def _update_task_qa_generation_id(self, task_id: str, qa_task_id: int):
        """更新任务的QA生成ID"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE qa_extraction_queue 
                    SET qa_generation_task_id = %s
                    WHERE id = %s
                """, (qa_task_id, task_id))
                
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 更新任务QA生成ID失败: {e}")
    
    async def _create_qa_dataset(self, task: QAExtractionTask, result: Dict[str, Any]) -> Optional[str]:
        """创建QA数据集"""
        try:
            # 生成数据集名称
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            dataset_title = f"{task.document_title}_{timestamp}_qa"
            
            dataset_id = str(uuid.uuid4())
            
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qa_datasets (
                        id, title, description, category, file_name, status,
                        total_qa_pairs, auto_generated, source_document_id,
                        source_document_title, generation_task_id, collection_id,
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    dataset_id,
                    dataset_title,
                    f"从文档'{task.document_title}'自动生成的QA数据集",
                    "auto_generated",
                    f"{dataset_title}.json",
                    "completed",
                    result.get('qa_pairs_count', 0),
                    True,  # auto_generated
                    task.document_id,
                    task.document_title,
                    task.qa_generation_task_id,
                    task.collection_id,
                    datetime.now(),
                    datetime.now()
                ))
                
                created_id = cursor.fetchone()['id']
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 自动创建QA数据集: {dataset_title}")
            
            # 同步QA对数据
            await self._sync_qa_pairs_to_dataset(task.qa_generation_task_id, dataset_id)
            
            return created_id
            
        except Exception as e:
            logger.error(f"❌ 创建QA数据集失败: {e}")
            return None
    
    async def _sync_qa_pairs_to_dataset(self, qa_task_id: int, dataset_id: str):
        """同步QA对到数据集"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 获取生成的QA对
                cursor.execute("""
                    SELECT id, question, answer, summary, source_chunk, metadata
                    FROM generated_qa_pairs
                    WHERE task_id = %s
                """, (qa_task_id,))
                
                qa_pairs = cursor.fetchall()
                
                # 批量插入到qa_pairs表
                for qa_pair in qa_pairs:
                    pair_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO qa_pairs (
                            id, dataset_id, question, answer, metadata,
                            qa_type, language, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        pair_id,
                        dataset_id,
                        qa_pair['question'],
                        qa_pair['answer'],
                        qa_pair['metadata'],
                        'auto_generated',
                        'zh',
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    # 更新同步状态
                    cursor.execute("""
                        UPDATE generated_qa_pairs
                        SET synced_to_dataset = TRUE, target_dataset_id = %s,
                            target_qa_pair_id = %s, sync_status = 'completed',
                            sync_timestamp = %s
                        WHERE id = %s
                    """, (dataset_id, pair_id, datetime.now(), qa_pair['id']))
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 同步{len(qa_pairs)}个QA对到数据集: {dataset_id}")
            
        except Exception as e:
            logger.error(f"❌ 同步QA对到数据集失败: {e}")
    
    async def _complete_task(
        self, 
        task_id: str, 
        worker_id: str, 
        qa_pairs_count: int,
        processing_duration: int,
        result: Dict[str, Any],
        dataset_id: Optional[str] = None
    ):
        """完成任务"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 更新任务状态
                cursor.execute("""
                    UPDATE qa_extraction_queue
                    SET status = 'completed', completed_at = %s,
                        qa_pairs_generated = %s, processing_duration = %s,
                        result_summary = %s, target_dataset_id = %s
                    WHERE id = %s
                """, (
                    datetime.now(), qa_pairs_count, processing_duration,
                    json.dumps(result), dataset_id, task_id
                ))
                
                # 更新工作进程状态
                cursor.execute("""
                    UPDATE qa_extraction_workers
                    SET status = CASE 
                        WHEN current_task_count <= 1 THEN 'idle' 
                        ELSE 'busy' 
                    END,
                    current_task_count = current_task_count - 1,
                    current_task_id = NULL,
                    current_task_started_at = NULL,
                    total_tasks_processed = total_tasks_processed + 1,
                    successful_tasks = successful_tasks + 1,
                    avg_processing_time = COALESCE(
                        (avg_processing_time * (total_tasks_processed - 1) + %s) / total_tasks_processed,
                        %s
                    ),
                    last_heartbeat = %s
                    WHERE worker_id = %s
                """, (processing_duration, processing_duration, datetime.now(), worker_id))
                
                # 更新文档的QA提取状态
                cursor.execute("""
                    UPDATE knowledge_documents
                    SET qa_extraction_status = 'completed',
                        qa_extraction_completed_at = %s,
                        qa_dataset_id = %s
                    WHERE id = (
                        SELECT document_id FROM qa_extraction_queue WHERE id = %s
                    )
                """, (datetime.now(), dataset_id, task_id))
                
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 完成任务失败: {e}")
    
    async def _fail_task(self, task_id: str, worker_id: str, error_message: str):
        """标记任务失败"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                # 获取当前任务信息
                cursor.execute("""
                    SELECT retry_count, max_retries FROM qa_extraction_queue WHERE id = %s
                """, (task_id,))
                
                task_info = cursor.fetchone()
                if not task_info:
                    return
                
                retry_count = task_info['retry_count']
                max_retries = task_info['max_retries']
                
                if retry_count < max_retries:
                    # 增加重试次数，重新调度
                    cursor.execute("""
                        UPDATE qa_extraction_queue
                        SET status = 'pending', worker_id = NULL,
                            retry_count = retry_count + 1,
                            error_message = %s, started_at = NULL
                        WHERE id = %s
                    """, (error_message, task_id))
                    
                    logger.info(f"🔄 任务重试: {task_id}, 重试次数: {retry_count + 1}/{max_retries}")
                    
                else:
                    # 最终失败
                    cursor.execute("""
                        UPDATE qa_extraction_queue
                        SET status = 'failed', completed_at = %s,
                            error_message = %s
                        WHERE id = %s
                    """, (datetime.now(), error_message, task_id))
                    
                    # 更新文档状态
                    cursor.execute("""
                        UPDATE knowledge_documents
                        SET qa_extraction_status = 'failed',
                            qa_extraction_error_message = %s
                        WHERE id = (
                            SELECT document_id FROM qa_extraction_queue WHERE id = %s
                        )
                    """, (error_message, task_id))
                
                # 更新工作进程状态
                cursor.execute("""
                    UPDATE qa_extraction_workers
                    SET status = CASE 
                        WHEN current_task_count <= 1 THEN 'idle' 
                        ELSE 'busy' 
                    END,
                    current_task_count = current_task_count - 1,
                    current_task_id = NULL,
                    current_task_started_at = NULL,
                    total_tasks_processed = total_tasks_processed + 1,
                    failed_tasks = failed_tasks + 1,
                    error_count = error_count + 1,
                    last_error_message = %s,
                    last_heartbeat = %s
                    WHERE worker_id = %s
                """, (error_message, datetime.now(), worker_id))
                
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 标记任务失败时出错: {e}")
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        try:
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE qa_extraction_queue
                    SET status = 'cancelled', completed_at = %s,
                        error_message = 'Task cancelled by user'
                    WHERE id = %s AND status IN ('pending', 'processing')
                    RETURNING worker_id
                """, (datetime.now(), task_id))
                
                result = cursor.fetchone()
                if result and result['worker_id']:
                    # 更新工作进程状态
                    cursor.execute("""
                        UPDATE qa_extraction_workers
                        SET current_task_count = current_task_count - 1,
                            current_task_id = NULL,
                            current_task_started_at = NULL
                        WHERE worker_id = %s
                    """, (result['worker_id'],))
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 任务已取消: {task_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 取消任务失败: {e}")
            return False
    
    async def cleanup_old_tasks(self, days: int = 30):
        """清理旧任务记录"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            conn = self._get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM qa_extraction_queue
                    WHERE status IN ('completed', 'failed', 'cancelled')
                    AND completed_at < %s
                """, (cutoff_date,))
                
                deleted_count = cursor.rowcount
                
            conn.commit()
            conn.close()
            
            logger.info(f"✅ 清理了{deleted_count}个{days}天前的任务记录")
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ 清理旧任务记录失败: {e}")
            return 0


# 单例实例
qa_extraction_queue_service = QAExtractionQueueService()