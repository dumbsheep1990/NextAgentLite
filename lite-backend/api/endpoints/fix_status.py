"""
临时修复端点 - 统一文档状态
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select, func
from db.database import get_db
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/fix-document-status")
async def fix_document_status(db: AsyncSession = Depends(get_db)):
    """
    修复文档状态：将所有 completed 改为 vectorized
    """
    try:
        # 1. 统计当前状态
        status_query = select(
            KnowledgeDocumentModel.status,
            func.count(KnowledgeDocumentModel.id).label('count')
        ).group_by(KnowledgeDocumentModel.status)
        
        result = await db.execute(status_query)
        before_stats = {status: count for status, count in result.all()}
        
        logger.info(f"修复前状态分布: {before_stats}")
        
        # 2. 更新 status 字段
        update_query = update(KnowledgeDocumentModel).where(
            KnowledgeDocumentModel.status == 'completed'
        ).values(
            status='vectorized',
            updated_at=func.now()
        )
        
        result = await db.execute(update_query)
        status_updated_count = result.rowcount
        
        # 3. 处理 vector_status JSON 字段
        docs_query = select(KnowledgeDocumentModel).where(
            KnowledgeDocumentModel.vector_status.isnot(None)
        )
        docs_result = await db.execute(docs_query)
        documents = docs_result.scalars().all()
        
        json_updated_count = 0
        for doc in documents:
            if doc.vector_status:
                try:
                    vector_status = doc.vector_status if isinstance(doc.vector_status, dict) else json.loads(doc.vector_status)
                    if vector_status.get('status') == 'completed':
                        vector_status['status'] = 'vectorized'
                        doc.vector_status = vector_status
                        json_updated_count += 1
                except Exception as e:
                    logger.warning(f"处理文档 {doc.id} 的 vector_status 时出错: {e}")
        
        await db.commit()
        
        # 4. 获取修复后的统计
        result = await db.execute(status_query)
        after_stats = {status: count for status, count in result.all()}
        
        logger.info(f"修复后状态分布: {after_stats}")
        
        return {
            "success": True,
            "message": "状态修复完成",
            "before": before_stats,
            "after": after_stats,
            "updated": {
                "status_field": status_updated_count,
                "vector_status_field": json_updated_count
            }
        }
        
    except Exception as e:
        logger.error(f"修复状态时出错: {e}")
        await db.rollback()
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/check-document-status")
async def check_document_status(db: AsyncSession = Depends(get_db)):
    """
    检查当前文档状态分布
    """
    try:
        # 统计各种状态的文档数量
        status_query = select(
            KnowledgeDocumentModel.status,
            func.count(KnowledgeDocumentModel.id).label('count')
        ).group_by(KnowledgeDocumentModel.status)
        
        result = await db.execute(status_query)
        status_stats = {status: count for status, count in result.all()}
        
        # 获取一些示例文档
        completed_docs = await db.execute(
            select(KnowledgeDocumentModel.id, KnowledgeDocumentModel.title, KnowledgeDocumentModel.filename, KnowledgeDocumentModel.status)
            .where(KnowledgeDocumentModel.status == 'completed')
            .limit(5)
        )
        
        completed_examples = [
            {
                "id": doc.id,
                "title": doc.title,
                "filename": doc.filename,
                "status": doc.status
            }
            for doc in completed_docs
        ]
        
        vectorized_docs = await db.execute(
            select(KnowledgeDocumentModel.id, KnowledgeDocumentModel.title, KnowledgeDocumentModel.filename, KnowledgeDocumentModel.status)
            .where(KnowledgeDocumentModel.status == 'vectorized')
            .limit(5)
        )
        
        vectorized_examples = [
            {
                "id": doc.id,
                "title": doc.title,
                "filename": doc.filename,
                "status": doc.status
            }
            for doc in vectorized_docs
        ]
        
        return {
            "status_distribution": status_stats,
            "total_documents": sum(status_stats.values()),
            "has_completed_status": status_stats.get('completed', 0) > 0,
            "examples": {
                "completed": completed_examples,
                "vectorized": vectorized_examples
            }
        }
        
    except Exception as e:
        logger.error(f"检查状态时出错: {e}")
        return {
            "error": str(e)
        }