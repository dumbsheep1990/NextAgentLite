"""
简单队列的文件处理队列API端点
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from service.simple_queue_service import simple_queue
from core.logger import logger

router = APIRouter()

@router.get("/status", response_model=Dict[str, Any])
async def get_queue_status():
    """
    获取简单队列状态
    
    Returns:
        队列状态信息，包括待处理、运行中、已完成任务数量等
    """
    try:
        status = await simple_queue.get_queue_status()
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
        任务状态信息
    """
    try:
        task_status = await simple_queue.get_task_status(task_id)
        if not task_status:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        return {
            "success": True,
            "data": task_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")

@router.post("/task/{task_id}/cancel", response_model=Dict[str, Any])
async def cancel_task(task_id: str):
    """
    取消任务
    
    Args:
        task_id: 任务ID
        
    Returns:
        操作结果
    """
    try:
        success = await simple_queue.cancel_task(task_id)
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
        操作结果
    """
    try:
        await simple_queue.cleanup_completed_tasks(max_keep)
        return {
            "success": True,
            "message": f"清理完成，保留最近 {max_keep} 个任务"
        }
    except Exception as e:
        logger.error(f"清理任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理任务失败: {str(e)}")

@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """
    简单队列健康检查
    
    Returns:
        健康状态
    """
    try:
        # 获取基本状态
        status = await simple_queue.get_queue_status()
        return {
            "success": True,
            "data": {
                "queue_connected": True,
                "queue_status": "healthy",
                "pending_count": status["pending_count"],
                "running_count": status["running_count"],
                "max_concurrent": status["max_concurrent"]
            }
        }
    except Exception as e:
        logger.error(f"队列健康检查失败: {e}")
        return {
            "success": False,
            "data": {
                "queue_connected": False,
                "queue_status": "error",
                "error": str(e)
            }
        }