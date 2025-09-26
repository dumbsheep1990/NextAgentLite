"""
知识库工具端点 - 从knowledge.py安全拆分出来的工具类功能
包含文档检查、统计等独立工具功能，无复杂依赖
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime

from db.database import get_db, get_async_session
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel, DocumentChunk as DocumentChunkModel
from core.logger import logger

# 创建独立的路由器
utils_router = APIRouter()

@utils_router.post("/documents/check-duplicate")
async def check_duplicate_filename(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """检查文件名是否重复"""
    try:
        filenames = request.get('filenames', [])
        if not filenames:
            raise HTTPException(status_code=400, detail="文件名列表不能为空")
        
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        duplicate_files = []
        
        for filename in filenames:
            # 检查所有文件类型的重复
            existing_doc = await repo.find_by_filename(filename)
            if existing_doc:
                duplicate_files.append({
                    'filename': filename,
                    'existingDocId': existing_doc.id,
                    'existingDocTitle': existing_doc.title
                })
        
        return {
            'hasDuplicates': len(duplicate_files) > 0,
            'duplicateFiles': duplicate_files
        }
        
    except Exception as e:
        logger.error(f"检查文件名重复失败: {e}")
        raise HTTPException(status_code=500, detail=f"检查文件名重复失败: {str(e)}")


@utils_router.get("/documents/status-statistics")
async def get_document_status_statistics(db: AsyncSession = Depends(get_db)):
    """获取文档状态统计信息"""
    try:
        logger.info("获取文档状态统计...")
        
        # 查询各状态文档数量 - 排除知识图谱文档
        result = await db.execute(
            select(
                KnowledgeDocumentModel.status,
                func.count(KnowledgeDocumentModel.id).label('count')
            ).where(
                # 排除知识图谱文档，只统计论文知识库文档
                ~KnowledgeDocumentModel.tags.op('@>')(text("'[\"knowledge_graph\"]'::jsonb"))
            ).group_by(KnowledgeDocumentModel.status)
        )
        
        status_counts = {row.status: row.count for row in result.fetchall()}
        
        # 计算问题文档统计
        failed_count = status_counts.get('failed', 0)
        pending_count = status_counts.get('pending', 0)
        problematic_count = failed_count + pending_count
        
        # 查询任务队列统计（可选，用于调试）
        try:
            async with get_async_session() as task_session:
                task_query = text("""
                    SELECT status, COUNT(*) as count 
                    FROM task_queue 
                    WHERE task_type = 'document_processing'
                    GROUP BY status
                """)
                task_result = await task_session.execute(task_query)
                task_counts = {row.status: row.count for row in task_result.fetchall()}
        except Exception as e:
            logger.warning(f"获取任务队列统计失败: {e}")
            task_counts = {}
        
        statistics = {
            "documentStats": {
                "total": sum(status_counts.values()),
                "uploaded": status_counts.get('uploaded', 0),
                "processing": status_counts.get('processing', 0),
                "completed": status_counts.get('completed', 0),
                "failed": failed_count,
                "pending": pending_count,
                "problematic": problematic_count
            },
            "taskQueueStats": task_counts,
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        logger.info(f"文档状态统计: {statistics['documentStats']}")
        return statistics
        
    except Exception as e:
        logger.error(f"获取文档状态统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文档状态统计失败: {str(e)}")


@utils_router.get("/documents/health-check")
async def document_health_check():
    """文档系统健康检查"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "database": "ok",
                "storage": "ok", 
                "services": "ok"
            }
        }
        
        # 简单的数据库连接测试
        try:
            async with get_async_session() as session:
                result = await session.execute(text("SELECT 1"))
                result.fetchone()
            health_status["components"]["database"] = "ok"
        except Exception as e:
            logger.error(f"数据库健康检查失败: {e}")
            health_status["components"]["database"] = "error"
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@utils_router.get("/documents/{document_id}/vectors")
async def get_document_vectors(document_id: str, limit: int = 10, include: str = "preview", db: AsyncSession = Depends(get_db)):
    """返回指定文档的向量化数据（前N条）。
    - include=preview 仅返回向量前8个元素
    - include=full    返回完整向量（谨慎使用）
    """
    try:
        # 验证文档存在
        doc = await db.execute(
            select(KnowledgeDocumentModel).where(KnowledgeDocumentModel.id == document_id)
        )
        if not doc.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="文档不存在")

        # 统计
        total_chunks = await db.scalar(
            select(func.count(DocumentChunkModel.id)).where(DocumentChunkModel.document_id == document_id)
        )
        vectorized_count = await db.scalar(
            select(func.count(DocumentChunkModel.id)).where(
                DocumentChunkModel.document_id == document_id,
                DocumentChunkModel.general_embedding.is_not(None)
            )
        )

        # 获取前N条已向量化分块
        result = await db.execute(
            select(
                DocumentChunkModel.id,
                DocumentChunkModel.chunk_index,
                DocumentChunkModel.content,
                DocumentChunkModel.general_model,
                DocumentChunkModel.general_embedding,
            )
            .where(
                DocumentChunkModel.document_id == document_id,
                DocumentChunkModel.general_embedding.is_not(None)
            )
            .order_by(DocumentChunkModel.chunk_index)
            .limit(max(1, min(int(limit or 10), 50)))
        )
        rows = result.fetchall()

        items = []
        for row in rows:
            vec = row.general_embedding or []
            dim = len(vec) if isinstance(vec, list) else 0
            item = {
                "chunk_id": row.id,
                "chunk_index": row.chunk_index,
                "content_preview": (row.content or "")[:160],
                "general_model": row.general_model,
                "vector_dim": dim,
            }
            if include == "full":
                item["vector"] = vec
            else:
                # 仅返回前8个元素用于预览
                try:
                    item["vector_preview"] = vec[:8] if isinstance(vec, list) else []
                except Exception:
                    item["vector_preview"] = []
            items.append(item)

        return {
            "document_id": document_id,
            "total_chunks": int(total_chunks or 0),
            "vectorized_count": int(vectorized_count or 0),
            "items": items,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取向量数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取向量数据失败: {str(e)}")
