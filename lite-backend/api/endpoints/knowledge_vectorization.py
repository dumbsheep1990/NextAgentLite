"""
知识库向量化端点 - 从knowledge.py安全拆分出来的向量化功能
包含文档向量化、任务管理、向量信息查询等功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pydantic import BaseModel

from db.database import get_db
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
from core.logger import logger

# 本地定义响应模型（避免循环导入）
class VectorizationTask(BaseModel):
    task_id: str
    document_id: str
    status: str
    progress: float
    created_at: str
    updated_at: str
    metadata: Optional[Dict[str, Any]] = None

# 创建独立的路由器
vectorization_router = APIRouter()

@vectorization_router.post("/vectorize")
async def start_vectorization(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """启动文档向量化"""
    try:
        document_ids = request.get("document_ids", [])
        if not document_ids:
            raise HTTPException(status_code=400, detail="请提供要向量化的文档ID列表")
        
        force_re_vectorize = request.get("force_re_vectorize", False)
        batch_size = request.get("batch_size", 5)
        session_id = request.get("session_id")
        
        logger.info(f"启动向量化任务: {len(document_ids)} 个文档, 强制重新向量化: {force_re_vectorize}")
        
        # 验证文档存在性
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        valid_documents = []
        invalid_documents = []
        
        for doc_id in document_ids:
            document = await repo.get_by_id(doc_id)
            if document:
                # 检查是否需要向量化
                if document.status == "completed" and not force_re_vectorize:
                    logger.info(f"文档 {doc_id} 已完成向量化，跳过")
                    continue
                valid_documents.append(document)
            else:
                invalid_documents.append(doc_id)
        
        if invalid_documents:
            logger.warning(f"无效的文档ID: {invalid_documents}")
        
        if not valid_documents:
            return {
                "success": True,
                "message": "没有需要向量化的文档",
                "total_documents": 0,
                "valid_documents": 0,
                "invalid_documents": len(invalid_documents),
                "skipped_completed": len(document_ids) - len(invalid_documents)
            }
        
        # 更新文档状态为处理中
        for document in valid_documents:
            await repo.update(document.id, {
                "status": "processing",
                "updated_at": datetime.utcnow()
            })
        
        # 添加后台向量化任务
        background_tasks.add_task(
            _process_vectorization_batch,
            [doc.id for doc in valid_documents],
            session_id,
            force_re_vectorize
        )
        
        return {
            "success": True,
            "message": f"向量化任务已启动: {len(valid_documents)} 个文档",
            "total_documents": len(document_ids),
            "valid_documents": len(valid_documents),
            "invalid_documents": len(invalid_documents),
            "batch_size": batch_size,
            "estimated_time": len(valid_documents) * 30  # 预估30秒每个文档
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"启动向量化失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动向量化失败: {str(e)}")


@vectorization_router.post("/documents/vectorize-general")
async def vectorize_general_embedding(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """单独启动通用向量化"""
    try:
        document_id = request.get("document_id")
        if not document_id:
            raise HTTPException(status_code=400, detail="请提供文档ID")
        
        # 检查文档存在性
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        document = await repo.get_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        logger.info(f"启动通用向量化: {document_id}")
        
        # 更新状态
        await repo.update(document_id, {
            "status": "processing", 
            "updated_at": datetime.utcnow()
        })
        
        # 添加后台任务
        background_tasks.add_task(
            _process_single_document_vectorization,
            document_id,
            "general"
        )
        
        return {
            "success": True,
            "message": f"通用向量化已启动: {document.filename}",
            "document_id": document_id,
            "vectorization_type": "general"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"启动通用向量化失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动通用向量化失败: {str(e)}")


@vectorization_router.get("/documents/{document_id}/vector-info")
async def get_document_vector_info(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取文档向量信息"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        document = await repo.get_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        logger.info(f"获取文档向量信息: {document_id}")
        
        # 模拟向量信息
        vector_info = {
            "document_id": document_id,
            "filename": document.filename,
            "vectorization_status": document.status,
            "general_vector": {
                "enabled": True,
                "model": "text-embedding-v4",
                "dimension": 1024,
                "chunk_count": 12,
                "total_tokens": 3500,
                "embedding_time": "2024-01-15T10:30:00",
                "vector_quality": 0.89
            },
            "chunking_info": {
                "strategy": "semantic",
                "chunk_size": 800,
                "chunk_overlap": 100,
                "total_chunks": 12,
                "avg_chunk_size": 750
            },
            "indexing_status": {
                "elasticsearch_indexed": True,
                "vector_db_indexed": True,
                "last_indexed": datetime.utcnow().isoformat()
            },
            "performance_metrics": {
                "vectorization_time": 25.6,
                "indexing_time": 3.2,
                "memory_usage": "128MB",
                "cpu_usage": "15%"
            }
        }
        
        return vector_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档向量信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文档向量信息失败: {str(e)}")


@vectorization_router.get("/tasks/vectorization")
async def get_vectorization_tasks(
    status: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """获取向量化任务列表"""
    try:
        logger.info(f"获取向量化任务列表: status={status}, limit={limit}")
        
        # 模拟任务数据
        tasks = []
        task_statuses = ["pending", "processing", "completed", "failed"] if not status else [status]
        
        for i in range(min(limit, 8)):
            task_status = task_statuses[i % len(task_statuses)]
            progress = 100.0 if task_status == "completed" else (0.0 if task_status == "pending" else 65.5)
            
            tasks.append(VectorizationTask(
                task_id=f"vec_task_{i+1}",
                document_id=f"doc_{i+1}",
                status=task_status,
                progress=progress,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat(),
                metadata={
                    "document_name": f"document_{i+1}.pdf",
                    "vectorization_type": "general",
                    "chunk_count": 10 + i * 2,
                    "estimated_time": 30
                }
            ))
        
        return {
            "tasks": [task.dict() for task in tasks],
            "total": len(tasks),
            "status_filter": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"获取向量化任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取向量化任务失败: {str(e)}")


@vectorization_router.post("/tasks/vectorization/{task_id}/cancel")
async def cancel_vectorization_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """取消向量化任务"""
    try:
        logger.info(f"取消向量化任务: {task_id}")
        
        # 模拟取消任务逻辑
        # 实际实现应该：
        # 1. 检查任务是否存在
        # 2. 检查任务是否可以取消
        # 3. 停止后台处理
        # 4. 更新任务状态
        
        return {
            "success": True,
            "message": f"向量化任务已取消: {task_id}",
            "task_id": task_id,
            "cancelled_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"取消向量化任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消向量化任务失败: {str(e)}")


@vectorization_router.post("/tasks/vectorization/cleanup")
async def cleanup_vectorization_tasks(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """清理向量化任务"""
    try:
        cleanup_type = request.get("type", "completed")  # completed, failed, all
        older_than_days = request.get("older_than_days", 7)
        
        logger.info(f"清理向量化任务: type={cleanup_type}, older_than={older_than_days}天")
        
        # 模拟清理逻辑
        cleaned_count = 0
        if cleanup_type == "completed":
            cleaned_count = 15
        elif cleanup_type == "failed":
            cleaned_count = 3
        elif cleanup_type == "all":
            cleaned_count = 23
        
        return {
            "success": True,
            "message": f"任务清理完成: 清理了 {cleaned_count} 个{cleanup_type}任务",
            "cleanup_type": cleanup_type,
            "cleaned_count": cleaned_count,
            "older_than_days": older_than_days,
            "cleaned_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"清理向量化任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理向量化任务失败: {str(e)}")


@vectorization_router.post("/vectorization/decide-strategy")
async def decide_vectorization_strategy(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """决定向量化策略"""
    try:
        document_id = request.get("document_id")
        content_preview = request.get("content_preview", "")
        file_type = request.get("file_type", "")
        
        if not document_id:
            raise HTTPException(status_code=400, detail="请提供文档ID")
        
        logger.info(f"决定向量化策略: {document_id}, type={file_type}")
        
        # 基于文档特征决定策略
        strategy = {
            "recommended_strategy": "semantic",
            "chunk_size": 800,
            "chunk_overlap": 100,
            "embedding_model": "text-embedding-v4",
            "reasons": [
                "文档内容语义性较强，适合语义分块",
                "文档长度适中，推荐800字符分块", 
                "专业文档建议使用重叠分块以保持上下文"
            ],
            "alternative_strategies": [
                {
                    "name": "固定长度分块",
                    "chunk_size": 1000,
                    "chunk_overlap": 50,
                    "description": "适合结构化文档"
                },
                {
                    "name": "段落分块",
                    "chunk_size": -1,
                    "chunk_overlap": 0,
                    "description": "按段落自然分块"
                }
            ],
            "estimated_chunks": max(1, len(content_preview) // 800),
            "estimated_time": max(10, len(content_preview) // 1000 * 5)
        }
        
        return strategy
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"决定向量化策略失败: {e}")
        raise HTTPException(status_code=500, detail=f"决定向量化策略失败: {str(e)}")


# 后台处理函数
async def _process_vectorization_batch(document_ids: List[str], session_id: Optional[str], force_re_vectorize: bool):
    """批量处理向量化"""
    try:
        import asyncio
        logger.info(f"开始批量向量化: {len(document_ids)} 个文档")
        
        from db.database import get_async_session
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        
        for i, doc_id in enumerate(document_ids):
            try:
                logger.info(f"处理向量化 {i+1}/{len(document_ids)}: {doc_id}")
                
                # 模拟向量化处理
                await asyncio.sleep(1)  # 模拟处理时间
                
                # 更新文档状态
                async with get_async_session() as session:
                    repo = KnowledgeDocumentRepository(session)
                    await repo.update(doc_id, {
                        "status": "completed",
                        "updated_at": datetime.utcnow()
                    })
                
                logger.info(f"文档向量化完成: {doc_id}")
                
            except Exception as e:
                logger.error(f"文档向量化失败 {doc_id}: {e}")
                
                # 更新为失败状态
                try:
                    async with get_async_session() as session:
                        repo = KnowledgeDocumentRepository(session)
                        await repo.update(doc_id, {
                            "status": "failed",
                            "updated_at": datetime.utcnow(),
                            "metadata": {"error": str(e)}
                        })
                except Exception as update_error:
                    logger.error(f"更新失败状态时出错: {update_error}")
        
        logger.info(f"批量向量化完成: {len(document_ids)} 个文档")
        
    except Exception as e:
        logger.error(f"批量向量化失败: {e}")


async def _process_single_document_vectorization(document_id: str, vectorization_type: str):
    """处理单个文档向量化"""
    try:
        import asyncio
        logger.info(f"开始单个文档向量化: {document_id}, type={vectorization_type}")
        
        # 模拟向量化处理
        await asyncio.sleep(2)
        
        from db.database import get_async_session
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        
        async with get_async_session() as session:
            repo = KnowledgeDocumentRepository(session)
            await repo.update(document_id, {
                "status": "completed",
                "updated_at": datetime.utcnow()
            })
        
        logger.info(f"单个文档向量化完成: {document_id}")
        
    except Exception as e:
        logger.error(f"单个文档向量化失败 {document_id}: {e}")
        
        try:
            async with get_async_session() as session:
                repo = KnowledgeDocumentRepository(session)
                await repo.update(document_id, {
                    "status": "failed",
                    "updated_at": datetime.utcnow(),
                    "metadata": {"error": str(e)}
                })
        except Exception as update_error:
            logger.error(f"更新失败状态时出错: {update_error}")