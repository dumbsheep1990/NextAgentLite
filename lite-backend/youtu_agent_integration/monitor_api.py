"""
执行监控API - Youtu Agent性能监控和执行日志分析
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import time
import json
from datetime import datetime, timedelta
import uuid
import psutil
import random

from core.logger import logger

router = APIRouter(prefix="/monitor", tags=["Execution Monitor"])

# 数据模型
class ExecutionTask(BaseModel):
    id: str = Field(..., description="任务ID")
    query: str = Field(..., description="查询内容")
    strategy: str = Field(..., description="执行策略")
    route: str = Field(..., description="路由方式: agno, youtu, hybrid")
    status: str = Field(..., description="状态: running, completed, failed, timeout")
    start_time: str = Field(..., description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    duration: Optional[int] = Field(None, description="执行时长(ms)")
    response_time: int = Field(..., description="响应时间(ms)")
    error_message: Optional[str] = Field(None, description="错误信息")
    user_id: str = Field(..., description="用户ID")
    session_id: str = Field(..., description="会话ID")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")

class SystemMetrics(BaseModel):
    cpu_usage: float = Field(..., description="CPU使用率")
    memory_usage: float = Field(..., description="内存使用率")
    active_connections: int = Field(..., description="活跃连接数")
    api_calls_per_minute: int = Field(..., description="每分钟API调用数")
    queue_size: int = Field(..., description="队列大小")
    cache_hit_rate: float = Field(..., description="缓存命中率")
    disk_usage: float = Field(0.0, description="磁盘使用率")
    network_io: Dict[str, float] = Field(default_factory=dict, description="网络IO")

class PerformanceStats(BaseModel):
    total_executions: int = Field(..., description="总执行次数")
    success_rate: float = Field(..., description="成功率")
    avg_response_time: float = Field(..., description="平均响应时间")
    error_count: int = Field(..., description="错误数量")
    timeout_count: int = Field(..., description="超时数量")
    peak_qps: float = Field(..., description="峰值QPS")
    current_qps: float = Field(0.0, description="当前QPS")

class ErrorLog(BaseModel):
    id: str = Field(..., description="错误ID")
    timestamp: str = Field(..., description="时间戳")
    level: str = Field(..., description="错误级别: error, warning, critical")
    message: str = Field(..., description="错误信息")
    task_id: Optional[str] = Field(None, description="关联任务ID")
    stack_trace: Optional[str] = Field(None, description="堆栈跟踪")
    context: Dict[str, Any] = Field(default_factory=dict, description="错误上下文")

class MonitorQuery(BaseModel):
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    status: Optional[str] = Field(None, description="状态过滤")
    route: Optional[str] = Field(None, description="路由过滤")
    limit: int = Field(100, description="返回数量限制")
    offset: int = Field(0, description="偏移量")

# 内存存储（生产环境应使用数据库）
tasks_store: List[ExecutionTask] = []
error_logs_store: List[ErrorLog] = []
connected_websockets: List[WebSocket] = []

# 性能统计缓存
performance_cache = {
    "last_update": 0,
    "stats": None
}

async def generate_mock_task() -> ExecutionTask:
    """生成模拟任务数据"""
    task_id = str(uuid.uuid4())
    queries = [
        "什么是地聚物材料的主要特性？",
        "搜索最新的人工智能研究论文",
        "分析这段Python代码的性能瓶颈",
        "翻译这篇英文技术文档",
        "生成材料科学实验报告",
        "查询碳纤维复合材料的应用领域",
        "网络爬虫如何处理JavaScript渲染页面？",
        "机器学习模型的超参数优化方法"
    ]
    
    strategies = ["intelligent_routing", "performance_balanced", "domain_specialized"]
    routes = ["agno", "youtu", "hybrid"]
    statuses = ["running", "completed", "failed", "timeout"]
    
    # 90%成功率
    status = random.choices(statuses, weights=[5, 85, 7, 3])[0]
    
    task = ExecutionTask(
        id=task_id,
        query=random.choice(queries),
        strategy=random.choice(strategies),
        route=random.choice(routes),
        status=status,
        start_time=datetime.now().isoformat(),
        response_time=random.randint(500, 5000),
        user_id=f"user_{random.randint(1, 100)}",
        session_id=f"session_{random.randint(1, 50)}",
        metadata={
            "model": "Qwen/Qwen3-30B-A3B-Thinking-2507",
            "tokens_used": random.randint(100, 2000),
            "cache_hit": random.choice([True, False])
        }
    )
    
    if status != "running":
        task.end_time = (datetime.now() + timedelta(seconds=random.randint(1, 30))).isoformat()
        task.duration = random.randint(1000, 10000)
    
    if status == "failed":
        task.error_message = random.choice([
            "模型调用超时",
            "网络连接错误",
            "参数验证失败",
            "内存不足",
            "API限流"
        ])
    
    return task

async def get_system_metrics() -> SystemMetrics:
    """获取系统指标"""
    try:
        # 获取真实系统指标
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # 模拟其他指标
        metrics = SystemMetrics(
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            active_connections=random.randint(50, 200),
            api_calls_per_minute=random.randint(100, 500),
            queue_size=random.randint(0, 50),
            cache_hit_rate=random.uniform(75, 95),
            disk_usage=disk.percent,
            network_io={
                "bytes_sent": random.uniform(1000, 10000),
                "bytes_recv": random.uniform(5000, 50000)
            }
        )
        
        return metrics
    except Exception as e:
        logger.error(f"获取系统指标失败: {e}")
        # 返回模拟数据
        return SystemMetrics(
            cpu_usage=random.uniform(20, 80),
            memory_usage=random.uniform(40, 85),
            active_connections=random.randint(50, 200),
            api_calls_per_minute=random.randint(100, 500),
            queue_size=random.randint(0, 50),
            cache_hit_rate=random.uniform(75, 95),
            disk_usage=random.uniform(30, 70),
            network_io={
                "bytes_sent": random.uniform(1000, 10000),
                "bytes_recv": random.uniform(5000, 50000)
            }
        )

async def calculate_performance_stats() -> PerformanceStats:
    """计算性能统计"""
    current_time = time.time()
    
    # 缓存1分钟
    if (current_time - performance_cache["last_update"]) < 60 and performance_cache["stats"]:
        return performance_cache["stats"]
    
    total_tasks = len(tasks_store)
    if total_tasks == 0:
        stats = PerformanceStats(
            total_executions=0,
            success_rate=0.0,
            avg_response_time=0.0,
            error_count=0,
            timeout_count=0,
            peak_qps=0.0,
            current_qps=0.0
        )
    else:
        completed_tasks = [t for t in tasks_store if t.status == "completed"]
        failed_tasks = [t for t in tasks_store if t.status == "failed"]
        timeout_tasks = [t for t in tasks_store if t.status == "timeout"]
        
        success_rate = (len(completed_tasks) / total_tasks) * 100
        avg_response_time = sum(t.response_time for t in completed_tasks) / len(completed_tasks) if completed_tasks else 0
        
        # 计算当前QPS（最近1分钟）
        recent_time = datetime.now() - timedelta(minutes=1)
        recent_tasks = [
            t for t in tasks_store 
            if datetime.fromisoformat(t.start_time.replace('Z', '+00:00')) > recent_time
        ]
        current_qps = len(recent_tasks) / 60.0
        
        stats = PerformanceStats(
            total_executions=total_tasks,
            success_rate=success_rate,
            avg_response_time=avg_response_time,
            error_count=len(failed_tasks),
            timeout_count=len(timeout_tasks),
            peak_qps=random.uniform(20, 100),  # 模拟峰值QPS
            current_qps=current_qps
        )
    
    # 更新缓存
    performance_cache["last_update"] = current_time
    performance_cache["stats"] = stats
    
    return stats

async def broadcast_to_websockets(data: dict):
    """向所有WebSocket连接广播数据"""
    if not connected_websockets:
        return
    
    message = json.dumps(data, ensure_ascii=False)
    disconnected = []
    
    for ws in connected_websockets:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)
    
    # 移除断开的连接
    for ws in disconnected:
        connected_websockets.remove(ws)

# 后台任务：生成实时数据
async def generate_realtime_data():
    """生成实时监控数据"""
    while True:
        try:
            # 生成新任务
            if random.random() < 0.3:  # 30%概率生成新任务
                task = await generate_mock_task()
                tasks_store.append(task)
                
                # 限制存储数量
                if len(tasks_store) > 1000:
                    tasks_store.pop(0)
                
                # 广播新任务
                await broadcast_to_websockets({
                    "type": "new_task",
                    "data": task.dict()
                })
            
            # 更新运行中的任务
            running_tasks = [t for t in tasks_store if t.status == "running"]
            for task in running_tasks[:3]:  # 最多更新3个任务
                if random.random() < 0.5:  # 50%概率完成任务
                    task.status = "completed" if random.random() > 0.1 else "failed"
                    task.end_time = datetime.now().isoformat()
                    task.duration = random.randint(1000, 10000)
                    
                    if task.status == "failed":
                        task.error_message = "模拟执行错误"
                    
                    # 广播任务更新
                    await broadcast_to_websockets({
                        "type": "task_update",
                        "data": task.dict()
                    })
            
            # 广播系统指标
            metrics = await get_system_metrics()
            await broadcast_to_websockets({
                "type": "system_metrics",
                "data": metrics.dict()
            })
            
            await asyncio.sleep(5)  # 5秒间隔
            
        except Exception as e:
            logger.error(f"生成实时数据失败: {e}")
            await asyncio.sleep(10)

# 启动后台任务
@router.on_event("startup")
async def startup_event():
    # 初始化一些模拟数据
    for _ in range(50):
        task = await generate_mock_task()
        task.status = random.choice(["completed", "failed", "timeout"])
        if task.status != "running":
            task.end_time = datetime.now().isoformat()
            task.duration = random.randint(1000, 10000)
        tasks_store.append(task)
    
    # 启动实时数据生成
    asyncio.create_task(generate_realtime_data())

@router.get("/tasks", response_model=List[ExecutionTask])
async def get_tasks(query: MonitorQuery = MonitorQuery()):
    """获取执行任务列表"""
    try:
        filtered_tasks = tasks_store.copy()
        
        # 状态过滤
        if query.status:
            filtered_tasks = [t for t in filtered_tasks if t.status == query.status]
        
        # 路由过滤
        if query.route:
            filtered_tasks = [t for t in filtered_tasks if t.route == query.route]
        
        # 时间过滤
        if query.start_time:
            start_dt = datetime.fromisoformat(query.start_time.replace('Z', '+00:00'))
            filtered_tasks = [
                t for t in filtered_tasks 
                if datetime.fromisoformat(t.start_time.replace('Z', '+00:00')) >= start_dt
            ]
        
        if query.end_time:
            end_dt = datetime.fromisoformat(query.end_time.replace('Z', '+00:00'))
            filtered_tasks = [
                t for t in filtered_tasks 
                if datetime.fromisoformat(t.start_time.replace('Z', '+00:00')) <= end_dt
            ]
        
        # 排序和分页
        filtered_tasks.sort(key=lambda x: x.start_time, reverse=True)
        
        start_idx = query.offset
        end_idx = start_idx + query.limit
        
        return filtered_tasks[start_idx:end_idx]
        
    except Exception as e:
        logger.error(f"获取任务列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}", response_model=ExecutionTask)
async def get_task(task_id: str):
    """获取特定任务详情"""
    try:
        task = next((t for t in tasks_store if t.id == task_id), None)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/system", response_model=SystemMetrics)
async def get_system_metrics_api():
    """获取系统指标"""
    try:
        return await get_system_metrics()
    except Exception as e:
        logger.error(f"获取系统指标失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/performance", response_model=PerformanceStats)
async def get_performance_metrics():
    """获取性能指标"""
    try:
        return await calculate_performance_stats()
    except Exception as e:
        logger.error(f"获取性能指标失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/errors", response_model=List[ErrorLog])
async def get_error_logs(limit: int = 100, offset: int = 0):
    """获取错误日志"""
    try:
        # 从失败任务生成错误日志
        error_logs = []
        failed_tasks = [t for t in tasks_store if t.status in ["failed", "timeout"]]
        
        for task in failed_tasks[offset:offset+limit]:
            error_log = ErrorLog(
                id=f"error_{task.id}",
                timestamp=task.start_time,
                level="error" if task.status == "failed" else "warning",
                message=task.error_message or f"任务{task.status}",
                task_id=task.id,
                context={
                    "query": task.query,
                    "route": task.route,
                    "strategy": task.strategy,
                    "response_time": task.response_time
                }
            )
            error_logs.append(error_log)
        
        return error_logs
    except Exception as e:
        logger.error(f"获取错误日志失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/trends")
async def get_analytics_trends():
    """获取分析趋势数据"""
    try:
        # 生成24小时趋势数据
        trends = []
        for i in range(24, 0, -1):
            timestamp = datetime.now() - timedelta(hours=i)
            trends.append({
                "timestamp": timestamp.isoformat(),
                "success_rate": random.uniform(80, 95),
                "response_time": random.uniform(1000, 3000),
                "qps": random.uniform(10, 50),
                "error_rate": random.uniform(1, 10)
            })
        
        return {
            "trends": trends,
            "route_distribution": [
                {"route": "agno", "count": random.randint(100, 500), "percentage": random.uniform(40, 50)},
                {"route": "youtu", "count": random.randint(80, 400), "percentage": random.uniform(30, 40)},
                {"route": "hybrid", "count": random.randint(50, 200), "percentage": random.uniform(15, 25)}
            ],
            "strategy_performance": [
                {
                    "strategy": "intelligent_routing",
                    "success_rate": random.uniform(85, 95),
                    "avg_response_time": random.uniform(1500, 2500),
                    "usage_count": random.randint(200, 800)
                },
                {
                    "strategy": "performance_balanced",
                    "success_rate": random.uniform(80, 90),
                    "avg_response_time": random.uniform(1000, 2000),
                    "usage_count": random.randint(150, 600)
                },
                {
                    "strategy": "domain_specialized",
                    "success_rate": random.uniform(90, 98),
                    "avg_response_time": random.uniform(1800, 3000),
                    "usage_count": random.randint(100, 400)
                }
            ]
        }
    except Exception as e:
        logger.error(f"获取分析趋势失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket实时监控端点"""
    await websocket.accept()
    connected_websockets.append(websocket)
    
    try:
        # 发送初始数据
        initial_data = {
            "type": "initial",
            "data": {
                "tasks": [t.dict() for t in tasks_store[-10:]],  # 最近10个任务
                "metrics": (await get_system_metrics()).dict(),
                "performance": (await calculate_performance_stats()).dict()
            }
        }
        await websocket.send_text(json.dumps(initial_data, ensure_ascii=False))
        
        # 保持连接
        while True:
            try:
                # 接收心跳消息
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # 发送心跳
                await websocket.send_text(json.dumps({"type": "ping"}, ensure_ascii=False))
            
    except WebSocketDisconnect:
        logger.info("WebSocket连接断开")
    except Exception as e:
        logger.error(f"WebSocket错误: {e}")
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        metrics = await get_system_metrics()
        stats = await calculate_performance_stats()
        
        return {
            "status": "healthy",
            "tasks_count": len(tasks_store),
            "active_tasks": len([t for t in tasks_store if t.status == "running"]),
            "websocket_connections": len(connected_websockets),
            "system_health": {
                "cpu_usage": metrics.cpu_usage,
                "memory_usage": metrics.memory_usage,
                "disk_usage": metrics.disk_usage
            },
            "performance": {
                "success_rate": stats.success_rate,
                "current_qps": stats.current_qps
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
