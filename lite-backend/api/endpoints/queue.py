"""
文件处理队列API端点
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from service.file_processing_queue import file_processing_queue
from core.logger import logger

router = APIRouter()

@router.get("/status", response_model=Dict[str, Any])
async def get_queue_status():
    """
    获取队列状态
    
    Returns:
        队列状态信息，包括待处理、运行中、已完成任务数量等
    """
    try:
        status = await file_processing_queue.get_queue_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"获取队列状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取队列状态失败: {str(e)}")

@router.get("/task/{task_id}", response_model=Dict[str, Any])
async def get_task_status(task_id: str):
    """
    获取特定任务状态
    
    Args:
        task_id: 任务ID
    
    Returns:
        任务详细状态信息
    """
    try:
        task = await file_processing_queue.get_task_status(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        return {
            "success": True,
            "data": {
                "id": task.id,
                "task_type": task.task_type.value,
                "file_name": task.file_name,
                "file_size": task.file_size,
                "status": task.status.value,
                "priority": task.priority,
                "created_at": task.created_at.isoformat(),
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "error_message": task.error_message
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")

@router.post("/task/{task_id}/cancel", response_model=Dict[str, Any])
async def cancel_task(task_id: str):
    """
    取消任务（仅对待处理任务有效）
    
    Args:
        task_id: 任务ID
    
    Returns:
        取消结果
    """
    try:
        success = await file_processing_queue.cancel_task(task_id)
        if not success:
            raise HTTPException(status_code=400, detail="任务无法取消（可能已在运行或不存在）")
        
        return {
            "success": True,
            "message": "任务已取消"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消任务失败: {str(e)}")

@router.post("/cleanup", response_model=Dict[str, Any])
async def cleanup_completed_tasks(max_keep: int = 100):
    """
    清理已完成的任务
    
    Args:
        max_keep: 保留的最大任务数量
    
    Returns:
        清理结果
    """
    try:
        await file_processing_queue.cleanup_completed_tasks(max_keep)
        return {
            "success": True,
            "message": f"已清理完成任务，保留最近 {max_keep} 个"
        }
    except Exception as e:
        logger.error(f"清理任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理任务失败: {str(e)}")