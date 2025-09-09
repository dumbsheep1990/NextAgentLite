"""
增强任务管理API端点
支持任务状态查询、取消、批量操作等功能
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from service.enhanced_task_manager import enhanced_task_manager, TaskProgress
from service.persistent_task_queue import persistent_task_queue
from core.logger import logger


router = APIRouter()


class TaskSubmissionRequest(BaseModel):
    """任务提交请求"""
    task_type: str
    task_data: Dict[str, Any]
    session_id: Optional[str] = None
    priority: int = 0
    depends_on: Optional[List[str]] = None
    max_retries: int = 3


class BatchTaskSubmissionRequest(BaseModel):
    """批量任务提交请求"""
    documents: List[Dict[str, Any]]
    session_id: Optional[str] = None
    enable_vectorization: bool = True


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    task_id: str
    progress: int
    stage: str
    detail: str
    status: str
    error_message: Optional[str] = None


class SessionTasksResponse(BaseModel):
    """会话任务状态响应"""
    session_id: str
    tasks: List[TaskStatusResponse]
    statistics: Dict[str, int]


@router.post("/tasks/submit", response_model=Dict[str, str])
async def submit_task(request: TaskSubmissionRequest):
    """提交单个任务"""
    try:
        task_id = await persistent_task_queue.submit_task(
            task_type=request.task_type,
            task_data=request.task_data,
            session_id=request.session_id,
            priority=request.priority,
            depends_on=request.depends_on,
            max_retries=request.max_retries
        )
        
        logger.info(f"任务提交成功: {task_id}")
        return {"task_id": task_id, "status": "submitted"}
        
    except Exception as e:
        logger.error(f"任务提交失败: {e}")
        raise HTTPException(status_code=500, detail=f"任务提交失败: {str(e)}")


@router.post("/tasks/batch/documents", response_model=Dict[str, Any])
async def submit_batch_document_tasks(request: BatchTaskSubmissionRequest):
    """批量提交文档处理任务"""
    try:
        task_ids = await enhanced_task_manager.submit_batch_document_tasks(
            documents=request.documents,
            session_id=request.session_id,
            enable_vectorization=request.enable_vectorization
        )
        
        logger.info(f"批量任务提交成功: {len(request.documents)} 个文档")
        return {
            "status": "submitted",
            "document_count": len(request.documents),
            "task_ids": task_ids
        }
        
    except Exception as e:
        logger.error(f"批量任务提交失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量任务提交失败: {str(e)}")


@router.get("/tasks/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """获取单个任务状态"""
    try:
        task_progress = await enhanced_task_manager.get_task_status(task_id)
        
        if not task_progress:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        return TaskStatusResponse(
            task_id=task_progress.task_id,
            progress=task_progress.progress,
            stage=task_progress.stage,
            detail=task_progress.detail,
            status=task_progress.status,
            error_message=task_progress.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")


@router.get("/tasks/session/{session_id}/status", response_model=SessionTasksResponse)
async def get_session_tasks_status(session_id: str):
    """获取会话的所有任务状态"""
    try:
        task_progresses = await enhanced_task_manager.get_session_tasks_status(session_id)
        
        # 计算统计信息
        statistics = {
            "total": len(task_progresses),
            "pending": 0,
            "running": 0,
            "completed": 0,
            "failed": 0,
            "cancelled": 0
        }
        
        for task in task_progresses:
            if task.status in statistics:
                statistics[task.status] += 1
        
        tasks = [
            TaskStatusResponse(
                task_id=task.task_id,
                progress=task.progress,
                stage=task.stage,
                detail=task.detail,
                status=task.status,
                error_message=task.error_message
            )
            for task in task_progresses
        ]
        
        return SessionTasksResponse(
            session_id=session_id,
            tasks=tasks,
            statistics=statistics
        )
        
    except Exception as e:
        logger.error(f"获取会话任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取会话任务状态失败: {str(e)}")


@router.post("/tasks/{task_id}/cancel", response_model=Dict[str, str])
async def cancel_task(task_id: str):
    """取消单个任务"""
    try:
        success = await enhanced_task_manager.cancel_task(task_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="任务不存在或无法取消")
        
        logger.info(f"任务取消成功: {task_id}")
        return {"task_id": task_id, "status": "cancelled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消任务失败: {str(e)}")


@router.post("/tasks/session/{session_id}/cancel", response_model=Dict[str, Any])
async def cancel_session_tasks(session_id: str):
    """取消会话的所有任务"""
    try:
        cancelled_count = await enhanced_task_manager.cancel_session_tasks(session_id)
        
        logger.info(f"批量取消任务成功: {cancelled_count} 个任务")
        return {
            "session_id": session_id,
            "cancelled_count": cancelled_count,
            "status": "cancelled"
        }
        
    except Exception as e:
        logger.error(f"批量取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量取消任务失败: {str(e)}")


@router.get("/tasks/queue/statistics", response_model=Dict[str, Any])
async def get_queue_statistics():
    """获取任务队列统计信息"""
    try:
        stats = await enhanced_task_manager.get_queue_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"获取队列统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取队列统计失败: {str(e)}")


@router.post("/tasks/cleanup", response_model=Dict[str, Any])
async def cleanup_old_tasks(hours: int = Query(168, description="清理多少小时前的任务")):
    """清理旧任务记录"""
    try:
        if hours < 24:
            raise HTTPException(status_code=400, detail="清理时间不能少于24小时")
        
        deleted_count = await persistent_task_queue.cleanup_old_tasks(hours)
        
        logger.info(f"清理旧任务完成: {deleted_count} 个任务")
        return {
            "deleted_count": deleted_count,
            "hours": hours,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"清理旧任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理旧任务失败: {str(e)}")


@router.get("/tasks/session/{session_id}/active", response_model=Dict[str, Any])
async def get_active_session_tasks(session_id: str):
    """获取会话中的活跃任务（用于状态恢复）"""
    try:
        task_progresses = await enhanced_task_manager.get_session_tasks_status(session_id)
        
        # 只返回活跃的任务（pending 或 running）
        active_tasks = [
            task for task in task_progresses 
            if task.status in ['pending', 'running']
        ]
        
        return {
            "session_id": session_id,
            "active_task_count": len(active_tasks),
            "tasks": [
                {
                    "task_id": task.task_id,
                    "progress": task.progress,
                    "stage": task.stage,
                    "detail": task.detail,
                    "status": task.status
                }
                for task in active_tasks
            ]
        }
        
    except Exception as e:
        logger.error(f"获取活跃任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取活跃任务失败: {str(e)}")


@router.post("/tasks/retry/{task_id}", response_model=Dict[str, str])
async def retry_failed_task(task_id: str):
    """重试失败的任务"""
    try:
        # 获取原始任务信息
        task = await persistent_task_queue.get_task_status(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        if task.status != 'failed':
            raise HTTPException(status_code=400, detail="只能重试失败的任务")
        
        # 重新提交任务
        new_task_id = await persistent_task_queue.submit_task(
            task_type=task.task_type,
            task_data=task.task_data,
            session_id=task.session_id,
            priority=task.priority,
            depends_on=task.depends_on,
            max_retries=task.max_retries
        )
        
        logger.info(f"任务重试成功: {task_id} -> {new_task_id}")
        return {
            "original_task_id": task_id,
            "new_task_id": new_task_id,
            "status": "retried"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重试任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"重试任务失败: {str(e)}")


@router.get("/tasks/health", response_model=Dict[str, Any])
async def get_task_system_health():
    """获取任务系统健康状态"""
    try:
        stats = await persistent_task_queue.get_queue_statistics()
        
        # 简单的健康检查逻辑
        health_status = "healthy"
        issues = []
        
        # 检查是否有过多失败任务
        total_tasks = stats.get("total_tasks", 0)
        failed_tasks = 0
        
        for task_type, statuses in stats.get("queue_status", {}).items():
            failed_tasks += statuses.get("failed", 0)
        
        if total_tasks > 0 and failed_tasks / total_tasks > 0.3:
            health_status = "warning"
            issues.append("失败任务比例过高")
        
        # 检查平均处理时间
        avg_times = stats.get("avg_processing_time", {})
        for task_type, avg_time in avg_times.items():
            if avg_time > 300:  # 5分钟
                health_status = "warning"
                issues.append(f"{task_type}任务处理时间过长")
        
        return {
            "status": health_status,
            "total_tasks": total_tasks,
            "failed_tasks": failed_tasks,
            "issues": issues,
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"获取系统健康状态失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        } 