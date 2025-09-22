"""
QA Generation API endpoints - Simplified
问答对生成API接口 - 简化版
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field

from service.qa_generation_service_simplified import qa_generation_service_simplified
from core.config_optimized import optimized_config_manager
import psycopg2

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/qa-generation", tags=["QA Generation"])


class QATaskRequest(BaseModel):
    """QA生成任务请求"""
    document_id: str = Field(..., description="文档ID")
    

class QATaskResponse(BaseModel):
    """QA生成任务响应"""
    task_id: int = Field(..., description="任务ID")
    status: str = Field(..., description="任务状态")
    message: str = Field(default="", description="响应消息")


class QASearchRequest(BaseModel):
    """QA搜索请求"""
    query: str = Field(..., description="搜索查询", max_length=500)
    vector_field: str = Field(default="question", description="向量字段", pattern="^(question|answer)$")
    limit: int = Field(default=10, description="结果数量限制", ge=1, le=50)


def get_db_connection():
    """获取数据库连接"""
    db_config = optimized_config_manager.settings.database_postgresql
    return psycopg2.connect(
        host=db_config.host,
        port=db_config.port,
        database=db_config.database,
        user=db_config.username,
        password=db_config.password
    )


@router.post("/tasks")
async def create_qa_task(
    request: QATaskRequest,
    background_tasks: BackgroundTasks
):
    """
    创建QA生成任务
    
    Args:
        request: 任务创建请求
        background_tasks: 后台任务管理器
        
    Returns:
        任务创建响应
    """
    try:
        # 创建任务
        task_id = await qa_generation_service_simplified.create_qa_task(request.document_id)
        
        # 添加后台处理任务
        background_tasks.add_task(
            qa_generation_service_simplified.process_qa_task,
            task_id
        )
        
        logger.info(f"Created QA generation task {task_id} for document {request.document_id}")
        
        return {
            "success": True,
            "data": {
                "task_id": task_id,
                "status": "processing",
                "message": "QA generation task created and started"
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating QA task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create QA task: {str(e)}")


@router.get("/tasks/{task_id}")
async def get_qa_task_status(task_id: int):
    """
    获取QA生成任务状态
    
    Args:
        task_id: 任务ID
        
    Returns:
        任务状态信息
    """
    try:
        task_status = await qa_generation_service_simplified.get_qa_task_status(task_id)
        
        if not task_status:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return {
            "success": True,
            "data": task_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")


@router.get("/tasks/{task_id}/qa-pairs")
async def get_qa_pairs_by_task(
    task_id: int,
    limit: int = Query(default=50, ge=1, le=200, description="结果数量限制")
):
    """
    获取任务生成的QA对
    
    Args:
        task_id: 任务ID
        limit: 返回数量限制
        
    Returns:
        QA对列表
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, question, answer, summary, source_chunk, metadata, created_at
                FROM generated_qa_pairs
                WHERE task_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (task_id, limit))
            
            rows = cursor.fetchall()
        
        conn.close()
        
        qa_pairs = []
        for row in rows:
            qa_pairs.append({
                "id": row[0],
                "question": row[1],
                "answer": row[2],
                "summary": row[3],
                "source_chunk": row[4][:200] + "..." if row[4] and len(row[4]) > 200 else row[4],
                "metadata": row[5],
                "created_at": row[6].isoformat() if row[6] else None
            })
        
        return {
            "success": True,
            "data": {
                "task_id": task_id,
                "qa_pairs": qa_pairs,
                "count": len(qa_pairs)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting QA pairs for task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get QA pairs: {str(e)}")


@router.post("/search")
async def search_qa_pairs(request: QASearchRequest):
    """
    搜索QA对
    
    Args:
        request: 搜索请求
        
    Returns:
        搜索结果
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            if request.vector_field == "question":
                cursor.execute("""
                    SELECT id, question, answer, summary, source_chunk, metadata, created_at
                    FROM generated_qa_pairs
                    WHERE question ILIKE %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (f"%{request.query}%", request.limit))
            else:
                cursor.execute("""
                    SELECT id, question, answer, summary, source_chunk, metadata, created_at
                    FROM generated_qa_pairs
                    WHERE answer ILIKE %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (f"%{request.query}%", request.limit))
            
            rows = cursor.fetchall()
        
        conn.close()
        
        search_results = []
        for row in rows:
            search_results.append({
                "id": row[0],
                "question": row[1],
                "answer": row[2],
                "summary": row[3],
                "source_chunk": row[4][:200] + "..." if row[4] and len(row[4]) > 200 else row[4],
                "metadata": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "similarity": 0.8  # 模拟相似度
            })
        
        return {
            "success": True,
            "data": {
                "query": request.query,
                "vector_field": request.vector_field,
                "results": search_results,
                "count": len(search_results)
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching QA pairs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search QA pairs: {str(e)}")


@router.get("/statistics")
async def get_qa_statistics():
    """
    获取QA生成统计信息
    
    Returns:
        统计信息
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
                    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_tasks,
                    SUM(qa_pairs_count) as total_qa_pairs,
                    AVG(qa_pairs_count) as avg_qa_pairs_per_task
                FROM qa_generation_tasks
            """)
            
            result = cursor.fetchone()
        
        conn.close()
        
        if result:
            stats = {
                "total_tasks": int(result[0] or 0),
                "completed_tasks": int(result[1] or 0),
                "failed_tasks": int(result[2] or 0),
                "processing_tasks": int(result[3] or 0),
                "total_qa_pairs": int(result[4] or 0),
                "avg_qa_pairs_per_task": float(result[5] or 0)
            }
        else:
            stats = {
                "total_tasks": 0,
                "completed_tasks": 0,
                "failed_tasks": 0,
                "processing_tasks": 0,
                "total_qa_pairs": 0,
                "avg_qa_pairs_per_task": 0.0
            }
            
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting QA statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/tasks")
async def list_qa_tasks(
    page: int = Query(default=1, ge=1, description="页码"),
    limit: int = Query(default=20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(default=None, description="任务状态过滤")
):
    """
    获取QA生成任务列表
    
    Args:
        page: 页码
        limit: 每页数量
        status: 状态过滤
        
    Returns:
        任务列表
    """
    try:
        offset = (page - 1) * limit
        
        # 构建查询条件
        where_clause = ""
        params = []
        
        if status:
            where_clause = "WHERE qgt.status = %s"
            params.append(status)
            
        # 查询任务列表
        list_query = f"""
        SELECT qgt.id, qgt.document_id, qgt.status, qgt.qa_pairs_count, 
               qgt.created_at, qgt.completed_at, qgt.error_message,
               kd.title as document_title
        FROM qa_generation_tasks qgt
        LEFT JOIN knowledge_documents kd ON qgt.document_id = kd.id
        {where_clause}
        ORDER BY qgt.created_at DESC
        LIMIT %s OFFSET %s
        """
        
        params.extend([limit, offset])
        
        # 查询总数
        count_query = f"""
        SELECT COUNT(*) FROM qa_generation_tasks qgt
        {where_clause}
        """
        
        count_params = params[:-2] if status else []
        
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            cursor.execute(list_query, params)
            result = cursor.fetchall()
            
            cursor.execute(count_query, count_params)
            count_result = cursor.fetchone()
        
        conn.close()
        
        total_count = count_result[0] if count_result else 0
        
        tasks = []
        for row in result:
            tasks.append({
                "id": row[0],
                "document_id": row[1],
                "status": row[2],
                "qa_pairs_count": row[3] or 0,
                "created_at": row[4].isoformat() if row[4] else None,
                "completed_at": row[5].isoformat() if row[5] else None,
                "error_message": row[6],
                "document_title": row[7]
            })
            
        return {
            "success": True,
            "data": {
                "tasks": tasks,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_count,
                    "pages": (total_count + limit - 1) // limit
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing QA tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")


@router.delete("/tasks/{task_id}")
async def delete_qa_task(task_id: int):
    """
    删除QA生成任务及其相关QA对
    
    Args:
        task_id: 任务ID
        
    Returns:
        删除结果
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            # 删除任务 (CASCADE会自动删除QA对)
            cursor.execute("DELETE FROM qa_generation_tasks WHERE id = %s", (task_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Deleted QA task {task_id} and its QA pairs")
        
        return {
            "success": True,
            "data": {"message": f"Task {task_id} deleted successfully"}
        }
        
    except Exception as e:
        logger.error(f"Error deleting QA task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")


@router.get("/documents")
async def list_documents(
    limit: int = Query(default=50, ge=1, le=200, description="结果数量限制")
):
    """
    获取可用的文档列表（用于创建QA任务）
    
    Args:
        limit: 返回数量限制
        
    Returns:
        文档列表
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, filename, file_type, file_size, status, created_at
                FROM knowledge_documents
                WHERE status = 'processed'
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
            
            rows = cursor.fetchall()
        
        conn.close()
        
        documents = []
        for row in rows:
            documents.append({
                "id": row[0],
                "title": row[1],
                "filename": row[2],
                "file_type": row[3],
                "file_size": row[4],
                "status": row[5],
                "created_at": row[6].isoformat() if row[6] else None
            })
        
        return {
            "success": True,
            "data": {
                "documents": documents,
                "count": len(documents)
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")