"""
任务管理器API端点 - 提供任务状态查询、取消等操作
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

from core.task_manager import get_task_manager, TaskStatus, TaskInfo
from core.logger import logger

router = APIRouter(prefix="/api/tasks", tags=["TaskManager"])


class TaskStatusResponse(BaseModel):
    """任务状态响应模型"""
    task_id: str
    name: str
    status: str
    start_time: Optional[float]
    end_time: Optional[float]
    duration: Optional[float]
    result: Any = None
    error: Optional[str]
    timeout: float
    progress: float
    metadata: Dict[str, Any]


class TaskStatsResponse(BaseModel):
    """任务统计响应模型"""
    total_tasks: int
    running_tasks: int
    max_concurrent: int
    available_slots: int
    status_distribution: Dict[str, int]
    default_timeout: float


class TaskListResponse(BaseModel):
    """任务列表响应模型"""
    tasks: List[TaskStatusResponse]
    total: int
    filtered: int


@router.get("/stats", response_model=TaskStatsResponse)
async def get_task_stats():
    """获取任务管理器统计信息"""
    try:
        manager = get_task_manager()
        stats = manager.get_stats()
        
        return TaskStatsResponse(
            total_tasks=stats["total_tasks"],
            running_tasks=stats["running_tasks"],
            max_concurrent=stats["max_concurrent"],
            available_slots=stats["available_slots"],
            status_distribution=stats["status_distribution"],
            default_timeout=stats["default_timeout"]
        )
        
    except Exception as e:
        logger.error(f"获取任务统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务统计失败: {str(e)}")


@router.get("/list", response_model=TaskListResponse)
async def list_tasks(
    status: Optional[str] = Query(None, description="按状态筛选任务"),
    limit: int = Query(50, ge=1, le=200, description="返回任务数量限制")
):
    """获取任务列表"""
    try:
        manager = get_task_manager()
        
        # 按状态筛选
        status_filter = None
        if status:
            try:
                status_filter = TaskStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的任务状态: {status}")
        
        tasks_dict = manager.list_tasks(status_filter)
        
        # 按开始时间倒序排列
        sorted_tasks = sorted(
            tasks_dict.values(),
            key=lambda t: t.start_time or 0,
            reverse=True
        )
        
        # 应用限制
        limited_tasks = sorted_tasks[:limit]
        
        # 转换为响应模型
        task_responses = []
        for task_info in limited_tasks:
            task_responses.append(TaskStatusResponse(
                task_id=task_info.task_id,
                name=task_info.name,
                status=task_info.status.value,
                start_time=task_info.start_time,
                end_time=task_info.end_time,
                duration=task_info.duration,
                result=task_info.result,
                error=task_info.error,
                timeout=task_info.timeout,
                progress=task_info.progress,
                metadata=task_info.metadata
            ))
        
        return TaskListResponse(
            tasks=task_responses,
            total=len(tasks_dict),
            filtered=len(limited_tasks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")


@router.get("/running", response_model=TaskListResponse)
async def get_running_tasks():
    """获取运行中的任务"""
    try:
        manager = get_task_manager()
        running_tasks_dict = manager.get_running_tasks()
        
        # 转换为响应模型
        task_responses = []
        for task_info in running_tasks_dict.values():
            task_responses.append(TaskStatusResponse(
                task_id=task_info.task_id,
                name=task_info.name,
                status=task_info.status.value,
                start_time=task_info.start_time,
                end_time=task_info.end_time,
                duration=task_info.duration,
                result=None,  # 运行中的任务不返回结果
                error=task_info.error,
                timeout=task_info.timeout,
                progress=task_info.progress,
                metadata=task_info.metadata
            ))
        
        return TaskListResponse(
            tasks=task_responses,
            total=len(task_responses),
            filtered=len(task_responses)
        )
        
    except Exception as e:
        logger.error(f"获取运行任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取运行任务失败: {str(e)}")


@router.get("/session/{session_id}", response_model=TaskListResponse)
async def get_tasks_by_session(session_id: str):
    """根据session_id获取任务列表"""
    try:
        manager = get_task_manager()
        session_tasks_dict = manager.get_tasks_by_session(session_id)
        
        # 按开始时间倒序排列
        sorted_tasks = sorted(
            session_tasks_dict.values(),
            key=lambda t: t.start_time or 0,
            reverse=True
        )
        
        # 转换为响应模型
        task_responses = []
        for task_info in sorted_tasks:
            task_responses.append(TaskStatusResponse(
                task_id=task_info.task_id,
                name=task_info.name,
                status=task_info.status.value,
                start_time=task_info.start_time,
                end_time=task_info.end_time,
                duration=task_info.duration,
                result=task_info.result if task_info.status == TaskStatus.COMPLETED else None,
                error=task_info.error,
                timeout=task_info.timeout,
                progress=task_info.progress,
                metadata=task_info.metadata
            ))
        
        return TaskListResponse(
            tasks=task_responses,
            total=len(task_responses),
            filtered=len(task_responses)
        )
        
    except Exception as e:
        logger.error(f"获取会话任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取会话任务失败: {str(e)}")


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """获取指定任务的状态"""
    try:
        manager = get_task_manager()
        task_info = manager.get_task_status(task_id)
        
        if not task_info:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        return TaskStatusResponse(
            task_id=task_info.task_id,
            name=task_info.name,
            status=task_info.status.value,
            start_time=task_info.start_time,
            end_time=task_info.end_time,
            duration=task_info.duration,
            result=task_info.result,
            error=task_info.error,
            timeout=task_info.timeout,
            progress=task_info.progress,
            metadata=task_info.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")


@router.post("/{task_id}/cancel")
async def cancel_task(task_id: str):
    """取消指定任务"""
    try:
        manager = get_task_manager()
        
        # 检查任务是否存在
        task_info = manager.get_task_status(task_id)
        if not task_info:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        # 尝试取消任务
        success = await manager.cancel_task(task_id)
        
        if success:
            return {
                "success": True,
                "message": f"任务 {task_id} 已取消",
                "task_id": task_id
            }
        else:
            return {
                "success": False,
                "message": f"无法取消任务 {task_id}，任务可能已经完成",
                "task_id": task_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"取消任务失败: {str(e)}")


@router.post("/cancel-all-running")
async def cancel_all_running_tasks():
    """取消所有运行中的任务"""
    try:
        manager = get_task_manager()
        running_tasks = manager.get_running_tasks()
        
        cancelled_tasks = []
        failed_tasks = []
        
        for task_id in running_tasks.keys():
            success = await manager.cancel_task(task_id)
            if success:
                cancelled_tasks.append(task_id)
            else:
                failed_tasks.append(task_id)
        
        return {
            "success": True,
            "message": f"已取消 {len(cancelled_tasks)} 个运行中的任务",
            "cancelled_tasks": cancelled_tasks,
            "failed_tasks": failed_tasks,
            "total_attempted": len(running_tasks)
        }
        
    except Exception as e:
        logger.error(f"批量取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量取消任务失败: {str(e)}")


@router.get("/{task_id}/result")
async def get_task_result(task_id: str):
    """获取任务结果"""
    try:
        manager = get_task_manager()
        task_info = manager.get_task_status(task_id)
        
        if not task_info:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        if task_info.status != TaskStatus.COMPLETED:
            raise HTTPException(
                status_code=400, 
                detail=f"任务未完成，当前状态: {task_info.status.value}"
            )
        
        return {
            "task_id": task_id,
            "status": task_info.status.value,
            "result": task_info.result,
            "duration": task_info.duration,
            "completed_at": task_info.end_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务结果失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务结果失败: {str(e)}")


@router.delete("/cleanup")
async def cleanup_completed_tasks(
    max_age_hours: int = Query(1, ge=1, le=24, description="清理多少小时前完成的任务")
):
    """清理已完成的任务"""
    try:
        manager = get_task_manager()
        
        import time
        max_age_seconds = max_age_hours * 3600
        current_time = time.time()
        
        tasks_to_remove = []
        completed_statuses = [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.TIMEOUT]
        
        for task_id, task_info in manager.tasks.items():
            if (task_info.status in completed_statuses and 
                task_info.end_time and 
                current_time - task_info.end_time > max_age_seconds):
                tasks_to_remove.append(task_id)
        
        # 删除过期任务
        for task_id in tasks_to_remove:
            del manager.tasks[task_id]
        
        return {
            "success": True,
            "message": f"清理了 {len(tasks_to_remove)} 个过期任务",
            "cleaned_tasks": len(tasks_to_remove),
            "max_age_hours": max_age_hours
        }
        
    except Exception as e:
        logger.error(f"清理任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理任务失败: {str(e)}")


@router.post("/test")
async def create_test_task(
    task_name: str = Query("test_task", description="测试任务名称"),
    duration: int = Query(10, ge=1, le=60, description="任务持续时间(秒)"),
    should_fail: bool = Query(False, description="是否模拟失败")
):
    """创建测试任务"""
    try:
        async def test_task_func(duration: int, should_fail: bool):
            """测试任务函数"""
            import asyncio
            
            # 模拟任务执行
            for i in range(duration):
                await asyncio.sleep(1)
                
                # 模拟失败
                if should_fail and i == duration // 2:
                    raise Exception(f"模拟任务失败 (在第{i}秒)")
            
            return {
                "message": f"测试任务完成",
                "duration": duration,
                "timestamp": datetime.now().isoformat()
            }
        
        manager = get_task_manager()
        task_id = await manager.submit_async_task(
            test_task_func,
            duration,
            should_fail,
            task_name=task_name,
            timeout=duration + 10,  # 给额外10秒缓冲
            metadata={
                "test_task": True,
                "created_by": "api_test",
                "expected_duration": duration
            }
        )
        
        return {
            "success": True,
            "message": "测试任务已创建",
            "task_id": task_id,
            "task_name": task_name,
            "expected_duration": duration
        }
        
    except Exception as e:
        logger.error(f"创建测试任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建测试任务失败: {str(e)}")