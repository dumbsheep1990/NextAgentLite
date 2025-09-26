"""
增强任务管理器 - 替代现有内存任务管理器
主要特性：
1. 基于数据库的任务队列持久化
2. 并发控制和资源锁定
3. 任务依赖管理
4. 状态恢复和session跟踪
5. 自动重试和错误处理
"""
import asyncio
import uuid
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from contextlib import asynccontextmanager

from service.persistent_task_queue import (
    PersistentTaskQueue, Task, TaskStatus, TaskType,
    persistent_task_queue
)
from service.embedding_service import embedding_service
from service.llm_config_gateway_client import get_llm_config_gateway_client
from service.qa_dataset_service import QADatasetService
from service.knowledge_service import KnowledgeService
from core.logger import logger
from utils.timezone_utils import get_china_now
try:
    # 非侵入式：Redis 可选
    from service.redis_support import save_task_snapshot, add_session_task
except Exception:  # pragma: no cover
    save_task_snapshot = None  # type: ignore
    add_session_task = None  # type: ignore
from core.task_config import task_config


@dataclass
class TaskProgress:
    """任务进度信息"""
    task_id: str
    progress: int
    stage: str
    detail: str
    status: str
    error_message: Optional[str] = None


class TaskHandler:
    """任务处理器基类"""
    
    def __init__(self, task_type: str):
        self.task_type = task_type
        
    async def process(self, task: Task, progress_callback: Callable) -> Dict[str, Any]:
        """处理任务 - 子类需要实现"""
        raise NotImplementedError
        
    async def validate_task_data(self, task_data: Dict[str, Any]) -> bool:
        """验证任务数据 - 子类可以重写"""
        return True


class DocumentProcessingHandler(TaskHandler):
    """文档处理任务处理器"""
    
    def __init__(self):
        super().__init__(TaskType.DOCUMENT_PROCESSING.value)
        self.knowledge_service = KnowledgeService()
        
    async def process(self, task: Task, progress_callback: Callable) -> Dict[str, Any]:
        """处理文档解析和分块任务"""
        try:
            document_id = task.task_data.get("document_id")
            config = task.task_data.get("config", {})
            
            if not document_id:
                raise ValueError("缺少document_id参数")
            
            await progress_callback(10, "开始文档处理", "正在读取文档信息")
            
            # 获取文档信息
            document = await self.knowledge_service.get_document(document_id)
            if not document:
                raise ValueError(f"文档不存在: {document_id}")
            
            # 并发控制：文档处理独占锁（10分钟，长任务可在后续扩展续期）
            doc_lock_key = f"knowledge:lock:doc:{document_id}"
            lock_acquired = True
            try:
                from service.redis_support import acquire_lock, release_lock
                lock_acquired = await acquire_lock(doc_lock_key, 600)
                if not lock_acquired:
                    raise ValueError("文档正在处理中，请稍后重试")
            except Exception:
                # 忽略锁异常，继续执行（非侵入）
                lock_acquired = True

            await progress_callback(20, "解析文档", "正在解析文档内容")
            
            # 解析文档
            chunks = await self.knowledge_service.parse_document(
                document_id, 
                config
            )
            
            await progress_callback(80, "保存分块", "正在保存文档分块")
            
            # 保存分块到数据库
            saved_chunks = await self.knowledge_service.save_chunks(
                document_id, 
                chunks
            )
            
            await progress_callback(100, "完成", "文档处理完成")
            
            result = {
                "document_id": document_id,
                "chunks_count": len(saved_chunks),
                "chunks": [chunk.id for chunk in saved_chunks]
            }
            return result
            
        except Exception as e:
            logger.error(f"文档处理失败: {e}")
            raise
        finally:
            # 释放文档处理锁
            try:
                from service.redis_support import release_lock
                await release_lock(f"knowledge:lock:doc:{task.task_data.get('document_id')}")
            except Exception:
                pass
    
    async def validate_task_data(self, task_data: Dict[str, Any]) -> bool:
        """验证任务数据"""
        return "document_id" in task_data


class VectorizationHandler(TaskHandler):
    """向量化任务处理器"""
    
    def __init__(self):
        super().__init__(TaskType.VECTORIZATION.value)
        self.knowledge_service = KnowledgeService()
        self.embedding_service = embedding_service
        
    async def process(self, task: Task, progress_callback: Callable) -> Dict[str, Any]:
        """处理向量化任务"""
        try:
            document_id = task.task_data.get("document_id")
            vector_config = task.task_data.get("vector_config", {})
            
            if not document_id:
                raise ValueError("缺少document_id参数")
            
            await progress_callback(10, "准备向量化", "正在准备向量化配置")
            
            # 使用知识服务进行文档向量化
            await progress_callback(20, "开始向量化", "正在对文档进行向量化处理")
            
            # 从配置获取embedding模型
            from core.config_optimized import optimized_config_manager
            embedding_config = optimized_config_manager.get_embedding_models_config()
            default_model = embedding_config.get('default_model')
            if not default_model:
                raise ValueError("未配置embedding模型")
            
            # 调用知识服务的向量化方法
            vectorization_result = await self.knowledge_service.vectorize_document(
                document_id=document_id,
                embedding_model=(await (await get_llm_config_gateway_client()).get_default_embedding_model())[0] if True else None,
                progress_callback=lambda p, msg: progress_callback(20 + int(p * 0.75), "向量化处理中", msg)
            )
            
            await progress_callback(95, "保存完成", "向量化处理完成")
            
            await progress_callback(100, "完成", "向量化处理完成")
            
            return {
                "document_id": document_id,
                "chunks_count": vectorization_result.get("chunks_processed", 0),
                "vectorized_count": vectorization_result.get("vectors_created", 0),
                "strategy": "general"
            }
            
        except Exception as e:
            logger.error(f"向量化处理失败: {e}")
            raise
    
    async def validate_task_data(self, task_data: Dict[str, Any]) -> bool:
        """验证任务数据"""
        return "document_id" in task_data


class QADatasetHandler(TaskHandler):
    """QA数据集处理器"""
    
    def __init__(self):
        super().__init__(TaskType.QA_DATASET.value)
        self.qa_service = QADatasetService()
        
    async def process(self, task: Task, progress_callback: Callable) -> Dict[str, Any]:
        """处理QA数据集任务"""
        try:
            file_path = task.task_data.get("file_path")
            config = task.task_data.get("config", {})
            
            if not file_path:
                raise ValueError("缺少file_path参数")
            
            await progress_callback(10, "读取文件", "正在读取QA数据集文件")
            
            # 读取QA数据
            qa_data = await self.qa_service.read_qa_file(file_path)
            total_items = len(qa_data)
            
            await progress_callback(30, "验证数据", f"共 {total_items} 条QA数据")
            
            # 验证数据格式
            valid_data = await self.qa_service.validate_qa_data(qa_data)
            valid_count = len(valid_data)
            
            await progress_callback(50, "保存数据", f"正在保存 {valid_count} 条有效数据")
            
            # 保存到数据库
            saved_items = await self.qa_service.save_qa_dataset(
                valid_data, 
                config
            )
            
            await progress_callback(90, "索引数据", "正在创建搜索索引")
            
            # 创建ES索引
            await self.qa_service.index_qa_data(saved_items)
            
            await progress_callback(100, "完成", "QA数据集处理完成")
            
            return {
                "file_path": file_path,
                "total_items": total_items,
                "valid_items": valid_count,
                "saved_items": len(saved_items)
            }
            
        except Exception as e:
            logger.error(f"QA数据集处理失败: {e}")
            raise
    
    async def validate_task_data(self, task_data: Dict[str, Any]) -> bool:
        """验证任务数据"""
        return "file_path" in task_data


class EnhancedTaskManager:
    """增强任务管理器"""
    
    def __init__(self):
        self.task_queue = persistent_task_queue
        self.handlers: Dict[str, TaskHandler] = {}
        self.worker_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False
        self.max_concurrent_tasks = task_config.max_concurrent_tasks
        
        # 注册任务处理器
        self._register_handlers()
    
    def _register_handlers(self):
        """注册任务处理器"""
        self.handlers[TaskType.DOCUMENT_PROCESSING.value] = DocumentProcessingHandler()
        self.handlers[TaskType.VECTORIZATION.value] = VectorizationHandler()
        self.handlers[TaskType.QA_DATASET.value] = QADatasetHandler()
    
    async def initialize(self):
        """初始化任务管理器"""
        config = task_config.get_task_manager_config()
        await self.task_queue.initialize("enhanced-manager", config["max_concurrent_tasks"])
        self.is_running = True
        
        # 启动工作任务
        asyncio.create_task(self._worker_loop())
        
        logger.info("增强任务管理器已初始化")
    
    async def shutdown(self):
        """关闭任务管理器"""
        self.is_running = False
        
        # 取消所有工作任务
        for task_id, worker_task in self.worker_tasks.items():
            if not worker_task.done():
                worker_task.cancel()
        
        await self.task_queue.shutdown()
        logger.info("增强任务管理器已关闭")
    
    async def submit_document_processing_task(
        self,
        document_id: str,
        config: Dict[str, Any],
        session_id: Optional[str] = None,
        priority: int = 0
    ) -> str:
        """提交文档处理任务"""
        task_data = {
            "document_id": document_id,
            "config": config
        }
        
        return await self.task_queue.submit_task(
            task_type=TaskType.DOCUMENT_PROCESSING.value,
            task_data=task_data,
            session_id=session_id,
            priority=priority
        )
    
    async def submit_vectorization_task(
        self,
        document_id: str,
        vector_config: Dict[str, Any],
        session_id: Optional[str] = None,
        priority: int = 0,
        depends_on: Optional[List[str]] = None
    ) -> str:
        """提交向量化任务"""
        task_data = {
            "document_id": document_id,
            "vector_config": vector_config
        }
        
        return await self.task_queue.submit_task(
            task_type=TaskType.VECTORIZATION.value,
            task_data=task_data,
            session_id=session_id,
            priority=priority,
            depends_on=depends_on
        )
    
    async def submit_qa_dataset_task(
        self,
        file_path: str,
        config: Dict[str, Any],
        session_id: Optional[str] = None,
        priority: int = 0
    ) -> str:
        """提交QA数据集任务"""
        task_data = {
            "file_path": file_path,
            "config": config
        }
        
        return await self.task_queue.submit_task(
            task_type=TaskType.QA_DATASET.value,
            task_data=task_data,
            session_id=session_id,
            priority=priority
        )
    
    async def submit_batch_document_tasks(
        self,
        documents: List[Dict[str, Any]],
        session_id: Optional[str] = None,
        enable_vectorization: bool = True
    ) -> Dict[str, List[str]]:
        """批量提交文档处理任务（带并发控制）"""
        task_ids = {
            "processing_tasks": [],
            "vectorization_tasks": []
        }
        
        # 限制并发数量，防止系统过载
        max_batch_size = task_config.max_batch_document_size
        if len(documents) > max_batch_size:
            logger.warning(f"批量任务数量超过限制，将分批处理: {len(documents)} -> {max_batch_size}")
        
        for i, doc_info in enumerate(documents[:max_batch_size]):
            document_id = doc_info["document_id"]
            config = doc_info.get("config", {})
            vector_config = doc_info.get("vector_config", {})
            
            # 提交文档处理任务
            processing_task_id = await self.submit_document_processing_task(
                document_id=document_id,
                config=config,
                session_id=session_id,
                priority=len(documents) - i  # 先提交的优先级更高
            )
            task_ids["processing_tasks"].append(processing_task_id)
            
            # 如果启用向量化，提交向量化任务（依赖于处理任务）
            if enable_vectorization:
                vectorization_task_id = await self.submit_vectorization_task(
                    document_id=document_id,
                    vector_config=vector_config,
                    session_id=session_id,
                    priority=len(documents) - i,
                    depends_on=[processing_task_id]
                )
                task_ids["vectorization_tasks"].append(vectorization_task_id)
        
        logger.info(f"已提交批量任务: 处理任务 {len(task_ids['processing_tasks'])} 个, 向量化任务 {len(task_ids['vectorization_tasks'])} 个")
        return task_ids
    
    async def get_task_status(self, task_id: str) -> Optional[TaskProgress]:
        """获取任务状态"""
        task = await self.task_queue.get_task_status(task_id)
        if not task:
            return None
        
        return TaskProgress(
            task_id=task.id,
            progress=task.progress,
            stage=task.current_stage or "未知",
            detail=task.stage_detail or "",
            status=task.status,
            error_message=task.error_message
        )
    
    async def get_session_tasks_status(self, session_id: str) -> List[TaskProgress]:
        """获取会话的所有任务状态"""
        tasks = await self.task_queue.get_session_tasks(session_id)
        
        task_progresses = []
        for task in tasks:
            task_progresses.append(TaskProgress(
                task_id=task.id,
                progress=task.progress,
                stage=task.current_stage or "未知",
                detail=task.stage_detail or "",
                status=task.status,
                error_message=task.error_message
            ))
        
        return task_progresses
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        # 先获取任务信息以便推送SSE消息
        task = await self.task_queue.get_task_status(task_id)
        
        success = await self.task_queue.cancel_task(task_id)
        # Redis: 记录取消标记（跨实例感知）
        try:
            if success:
                from service.redis_support import mark_task_cancelled
                await mark_task_cancelled(task_id)
        except Exception:
            pass
        
        # 通过统一SSE推送任务取消消息
        if success and task and task.session_id:
            from api.routes import unified_sse_manager
            try:
                await unified_sse_manager.broadcast_task_cancelled(
                    session_id=task.session_id,
                    task_id=task_id
                )
                logger.debug(f"📡 统一SSE推送任务取消: {task_id}")
            except Exception as sse_error:
                logger.warning(f"📡 统一SSE推送任务取消失败: {sse_error}")
        
        return success

    async def _push_sse_progress(self, session_id: str, document_id: str, progress: int, stage: str, detail: str, collection_id: str = None):
        """推送SSE进度更新"""
        try:
            logger.info(f"开始推送SSE进度: session_id={session_id}, document_id={document_id}, progress={progress}%")
            
            # 使用动态导入避免循环导入
            try:
                import sys
                if 'api.routes' in sys.modules:
                    unified_sse_manager = sys.modules['api.routes'].unified_sse_manager
                else:
                    # 延迟导入
                    from api.routes import unified_sse_manager
            except ImportError as import_error:
                logger.error(f"无法导入unified_sse_manager: {import_error}")
                return
            
            progress_data = {
                "progress": progress,
                "stage": stage,
                "detail": detail,
                "status": "processing" if progress < 100 else "completed",
                "document_id": document_id,
                "collection_id": collection_id,  # 添加collection_id
                "task_type": "document_processing",
                "created_at": get_china_now().isoformat(),
                "chunk_current": None,
                "chunk_total": None
            }
            
            logger.info(f"推送数据: {progress_data}")
            # Redis: 任务快照（best-effort）
            try:
                if save_task_snapshot:
                    await save_task_snapshot(
                        f"doc_{document_id}",
                        status=progress_data["status"],
                        progress=int(progress),
                        stage=stage or "",
                        detail=detail or "",
                        document_id=document_id,
                        collection_id=collection_id,
                    )
                if add_session_task and session_id:
                    await add_session_task(session_id, f"doc_{document_id}")
            except Exception:
                pass
            
            # 优先按指定会话推送；如会话不存在则回退广播到所有会话
            target_session = session_id or "all"
            await unified_sse_manager.broadcast_task_progress(
                session_id=target_session,
                task_id=f"doc_{document_id}",
                progress_data=progress_data
            )
            # 回退逻辑：如果指定了会话但不存在，则再广播一次到所有会话
            try:
                if session_id and getattr(unified_sse_manager, 'connections', None) is not None:
                    if session_id not in unified_sse_manager.connections:
                        await unified_sse_manager.broadcast_task_progress(
                            session_id="all",
                            task_id=f"doc_{document_id}",
                            progress_data=progress_data
                        )
            except Exception:
                pass
            logger.info(f"SSE推送文档进度成功: {document_id} -> {progress}% ({stage}) → session={target_session}")
        except Exception as e:
            logger.error(f"SSE推送文档进度失败: {e}", exc_info=True)
    
    async def cancel_session_tasks(self, session_id: str) -> int:
        """取消会话的所有任务"""
        return await self.task_queue.cancel_session_tasks(session_id)
    
    async def get_queue_statistics(self) -> Dict[str, Any]:
        """获取队列统计信息"""
        return await self.task_queue.get_queue_statistics()
    
    # 私有方法
    async def _worker_loop(self):
        """工作循环 - 处理任务队列"""
        while self.is_running:
            try:
                # 检查是否可以处理更多任务
                if len(self.worker_tasks) >= self.max_concurrent_tasks:
                    # 清理已完成的任务
                    completed_tasks = [
                        task_id for task_id, worker_task in self.worker_tasks.items()
                        if worker_task.done()
                    ]
                    for task_id in completed_tasks:
                        del self.worker_tasks[task_id]
                    
                    if len(self.worker_tasks) >= self.max_concurrent_tasks:
                        await asyncio.sleep(1)
                        continue
                
                # 获取下一个任务 (这里需要实现从数据库获取待处理任务的逻辑)
                # 暂时休眠，避免空转
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"工作循环异常: {e}")
                await asyncio.sleep(5)
    
    async def _process_task(self, task: Task):
        """处理单个任务"""
        try:
            # 获取对应的处理器
            handler = self.handlers.get(task.task_type)
            if not handler:
                raise ValueError(f"未知的任务类型: {task.task_type}")
            
            # 验证任务数据
            if not await handler.validate_task_data(task.task_data):
                raise ValueError("任务数据验证失败")
            
            # 创建进度回调函数（带Redis取消检查）
            async def progress_callback(progress: int, stage: str, detail: str):
                # Redis: 若存在取消标记则中断（非侵入失败忽略）
                try:
                    from service.redis_support import is_task_cancelled as _redis_task_cancelled
                    if await _redis_task_cancelled(task.id):
                        await self.task_queue.update_task_status(task.id, TaskStatus.CANCELLED.value, error_message="cancelled by user")
                        raise asyncio.CancelledError("Task cancelled via Redis")
                except Exception:
                    pass
                # 更新数据库中的任务进度
                await self.task_queue.update_task_progress(
                    task.id, progress, stage, detail
                )
                
                # 通过统一SSE推送任务进度更新
                if task.session_id:
                    from api.routes import unified_sse_manager
                    try:
                        await unified_sse_manager.broadcast_task_progress(
                            session_id=task.session_id,
                            task_id=task.id,
                            progress_data={
                                "progress": progress,
                                "stage": stage,
                                "detail": detail,
                                "status": "running",
                                "document_id": task.document_id,
                                "task_type": task.task_type,
                                "created_at": task.created_at.isoformat() if task.created_at else None
                            }
                        )
                        logger.debug(f"📡 统一SSE推送任务进度: {task.id} -> {progress}% ({stage})")
                    except Exception as sse_error:
                        logger.warning(f"📡 统一SSE推送任务进度失败: {sse_error}")
                # Redis: 也通过 Pub/Sub 推送一份（跨进程/多实例桥接），附带 sender
                try:
                    from service.redis_support import publish_sse
                    await publish_sse(task.session_id or "all", {
                        "type": "task_progress_update",
                        "task_id": task.id,
                        "document_id": task.document_id,
                        "data": {
                            "progress": progress,
                            "stage": stage,
                            "detail": detail,
                            "status": "running",
                            "task_type": task.task_type,
                            "created_at": task.created_at.isoformat() if task.created_at else None
                        }
                    }, sender=getattr(unified_sse_manager, 'instance_id', ''))
                except Exception:
                    pass
                # Redis: 对知识库文档任务保存快照
                try:
                    if task.document_id and save_task_snapshot:
                        await save_task_snapshot(
                            task.id,
                            status="running",
                            progress=int(progress),
                            stage=stage or "",
                            detail=detail or "",
                            document_id=task.document_id,
                            collection_id=task.task_data.get("collection_id") if isinstance(task.task_data, dict) else None,
                        )
                    if add_session_task and task.session_id:
                        await add_session_task(task.session_id, task.id)
                except Exception:
                    pass
            
            # 处理任务
            start_time = get_china_now()
            result = await handler.process(task, progress_callback)
            processing_time = (get_china_now() - start_time).total_seconds()
            
            # 完成任务
            await self.task_queue.complete_task(
                task.id, result, processing_time
            )
            
            # 通过统一SSE推送任务完成消息
            if task.session_id:
                from api.routes import unified_sse_manager
                try:
                    await unified_sse_manager.broadcast_task_completed(
                        session_id=task.session_id,
                        task_id=task.id,
                        result_data={
                            "detail": f"任务完成，耗时 {processing_time:.1f}秒",
                            "processing_time": processing_time,
                            "result": result,
                            "document_id": task.document_id,
                            "task_type": task.task_type
                        }
                    )
                    logger.debug(f"📡 统一SSE推送任务完成: {task.id}")
                except Exception as sse_error:
                    logger.warning(f"📡 统一SSE推送任务完成失败: {sse_error}")
            # Redis: Pub/Sub 完成
            try:
                from service.redis_support import publish_sse
                await publish_sse(task.session_id or "all", {
                    "type": "task_completed",
                    "task_id": task.id,
                    "document_id": task.document_id,
                    "data": {
                        "detail": f"任务完成，耗时 {processing_time:.1f}秒",
                        "processing_time": processing_time,
                        "result": result,
                        "task_type": task.task_type
                    }
                }, sender=getattr(unified_sse_manager, 'instance_id', ''))
            except Exception:
                pass
            
            logger.info(f"任务处理完成: {task.id}, 耗时: {processing_time:.2f}秒")
            
        except asyncio.CancelledError as e:
            # 任务被取消
            await self.task_queue.update_task_status(task.id, TaskStatus.CANCELLED.value, error_message=str(e))
            if task.session_id:
                from api.routes import unified_sse_manager
                try:
                    await unified_sse_manager.broadcast_task_failed(
                        session_id=task.session_id,
                        task_id=task.id,
                        error_data={
                            "detail": "任务已取消",
                            "error_message": str(e),
                            "error_type": "CancelledError",
                            "document_id": task.document_id,
                            "task_type": task.task_type
                        }
                    )
                except Exception:
                    pass
            try:
                from service.redis_support import publish_sse
                await publish_sse(task.session_id or "all", {
                    "type": "task_failed",
                    "task_id": task.id,
                    "document_id": task.document_id,
                    "data": {
                        "detail": "任务已取消",
                        "error_message": str(e),
                        "error_type": "CancelledError",
                        "task_type": task.task_type
                    }
                }, sender=getattr(unified_sse_manager, 'instance_id', ''))
            except Exception:
                pass
            logger.warning(f"任务取消: {task.id}")
        except Exception as e:
            # 任务失败
            await self.task_queue.fail_task(
                task.id,
                str(e),
                {"error_type": type(e).__name__}
            )
            
            # 通过统一SSE推送任务失败消息
            if task.session_id:
                from api.routes import unified_sse_manager
                try:
                    await unified_sse_manager.broadcast_task_failed(
                        session_id=task.session_id,
                        task_id=task.id,
                        error_data={
                            "detail": f"任务失败: {str(e)}",
                            "error_message": str(e),
                            "error_type": type(e).__name__,
                            "document_id": task.document_id,
                            "task_type": task.task_type
                        }
                    )
                    logger.debug(f"📡 统一SSE推送任务失败: {task.id}")
                except Exception as sse_error:
                    logger.warning(f"📡 统一SSE推送任务失败失败: {sse_error}")
            # Redis: Pub/Sub 失败
            try:
                from service.redis_support import publish_sse
                await publish_sse(task.session_id or "all", {
                    "type": "task_failed",
                    "task_id": task.id,
                    "document_id": task.document_id,
                    "data": {
                        "detail": f"任务失败: {str(e)}",
                        "error_message": str(e),
                        "error_type": type(e).__name__,
                        "task_type": task.task_type
                    }
                }, sender=getattr(unified_sse_manager, 'instance_id', ''))
            except Exception:
                pass
            
            logger.error(f"任务处理失败: {task.id}, 错误: {e}")

    async def send_sse_update(self, session_id: str, status: str, progress: int, 
                             message: str, document_id: str, document_status: str, collection_id: str = None, **kwargs):
        """发送SSE更新通知 - 用于文档完成状态同步"""
        try:
            logger.info(f"📡 发送SSE更新通知: session_id={session_id}, document_id={document_id}, status={status}")
            
            # 使用动态导入避免循环导入
            try:
                import sys
                if 'api.routes' in sys.modules:
                    unified_sse_manager = sys.modules['api.routes'].unified_sse_manager
                else:
                    # 延迟导入
                    from api.routes import unified_sse_manager
            except ImportError as import_error:
                logger.error(f"📡 无法导入unified_sse_manager: {import_error}")
                return
            
            if status == "completed":
                # 发送任务完成通知，如果没有session_id则广播到所有会话
                target_session = session_id or "all"
                await unified_sse_manager.broadcast_task_completed(
                    session_id=target_session,
                    task_id=f"doc_{document_id}",
                    result_data={
                        "detail": message,
                        "document_id": document_id,
                        "collection_id": collection_id,  # 添加collection_id
                        "document_status": document_status,
                        "task_type": "document_processing",
                        "progress": progress,
                        "status": status,
                        **kwargs
                    }
                )
                # Redis: 完成快照
                try:
                    if save_task_snapshot:
                        await save_task_snapshot(
                            f"doc_{document_id}",
                            status="completed",
                            progress=int(progress),
                            stage="已完成",
                            detail=message or "",
                            document_id=document_id,
                            collection_id=collection_id,
                        )
                    if add_session_task and session_id:
                        await add_session_task(session_id, f"doc_{document_id}")
                except Exception:
                    pass
                # 回退：若指定会话未建立，则广播给所有会话
                try:
                    if session_id and getattr(unified_sse_manager, 'connections', None) is not None:
                        if session_id not in unified_sse_manager.connections:
                            await unified_sse_manager.broadcast_task_completed(
                                session_id="all",
                                task_id=f"doc_{document_id}",
                                result_data={
                                    "detail": message,
                                    "document_id": document_id,
                                    "collection_id": collection_id,
                                    "document_status": document_status,
                                    "task_type": "document_processing",
                                    "progress": progress,
                                    "status": status,
                                    **kwargs
                                }
                            )
                except Exception:
                    pass
                logger.info(f"📡 ✅ SSE完成通知发送成功（会话: {target_session}）: {document_id} -> {document_status}")
            else:
                # 发送进度更新通知，如果没有session_id则广播到所有会话
                target_session = session_id or "all"
                await unified_sse_manager.broadcast_task_progress(
                    session_id=target_session,
                    task_id=f"doc_{document_id}",
                    progress_data={
                        "progress": progress,
                        "stage": message,
                        "detail": message,
                        "status": status,
                        "document_id": document_id,
                        "collection_id": collection_id,  # 添加collection_id
                        "document_status": document_status,
                        "task_type": "document_processing",
                        "created_at": get_china_now().isoformat(),
                        **kwargs
                    }
                )
                # Redis: 中间态快照
                try:
                    if save_task_snapshot:
                        await save_task_snapshot(
                            f"doc_{document_id}",
                            status=status or "processing",
                            progress=int(progress),
                            stage=message or "",
                            detail=message or "",
                            document_id=document_id,
                            collection_id=collection_id,
                        )
                    if add_session_task and session_id:
                        await add_session_task(session_id, f"doc_{document_id}")
                except Exception:
                    pass
                # 回退：若指定会话未建立，则广播给所有会话
                try:
                    if session_id and getattr(unified_sse_manager, 'connections', None) is not None:
                        if session_id not in unified_sse_manager.connections:
                            await unified_sse_manager.broadcast_task_progress(
                                session_id="all",
                                task_id=f"doc_{document_id}",
                                progress_data={
                                    "progress": progress,
                                    "stage": message,
                                    "detail": message,
                                    "status": status,
                                    "document_id": document_id,
                                    "collection_id": collection_id,
                                    "document_status": document_status,
                                    "task_type": "document_processing",
                                    "created_at": get_china_now().isoformat(),
                                    **kwargs
                                }
                            )
                except Exception:
                    pass
                logger.info(f"📡 ✅ SSE进度通知发送成功（会话: {target_session}）: {document_id} -> {progress}% ({status})")
                
        except Exception as e:
            logger.error(f"📡 ❌ SSE更新通知发送失败: {e}", exc_info=True)


# 全局任务管理器实例
enhanced_task_manager = EnhancedTaskManager() 
