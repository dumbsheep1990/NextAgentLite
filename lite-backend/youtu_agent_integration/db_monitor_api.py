"""
基于数据库的执行监控API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import json
import psutil

from core.logger import logger
from db.database import get_db_connection

router = APIRouter(prefix="/monitor", tags=["Execution Monitor"])

# 数据模型
class ExecutionTask(BaseModel):
    id: str = Field(..., description="任务ID")
    session_id: Optional[str] = Field(None, description="会话ID")
    agent_config_id: Optional[str] = Field(None, description="Agent配置ID")
    query: str = Field(..., description="查询内容")
    execution_mode: str = Field(..., description="执行模式")
    status: str = Field(..., description="状态")
    start_time: str = Field(..., description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    duration: Optional[int] = Field(None, description="执行时长(ms)")
    error_message: Optional[str] = Field(None, description="错误信息")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    created_at: str = Field(..., description="创建时间")

class SystemMetrics(BaseModel):
    timestamp: str = Field(..., description="时间戳")
    cpu_usage: float = Field(..., description="CPU使用率")
    memory_usage: float = Field(..., description="内存使用率")
    disk_usage: float = Field(..., description="磁盘使用率")
    active_connections: int = Field(..., description="活跃连接数")
    api_calls_per_minute: int = Field(..., description="每分钟API调用数")
    queue_size: int = Field(..., description="队列大小")
    cache_hit_rate: float = Field(..., description="缓存命中率")

class PerformanceStats(BaseModel):
    total_executions: int = Field(..., description="总执行次数")
    success_rate: float = Field(..., description="成功率")
    avg_response_time: float = Field(..., description="平均响应时间")
    error_count: int = Field(..., description="错误数量")
    timeout_count: int = Field(..., description="超时数量")
    current_qps: float = Field(0.0, description="当前QPS")

class ErrorLog(BaseModel):
    id: str = Field(..., description="错误ID")
    timestamp: str = Field(..., description="时间戳")
    level: str = Field(..., description="错误级别")
    message: str = Field(..., description="错误信息")
    task_id: Optional[str] = Field(None, description="关联任务ID")
    stack_trace: Optional[str] = Field(None, description="堆栈跟踪")
    context: Dict[str, Any] = Field(default_factory=dict, description="错误上下文")
    resolved: bool = Field(False, description="是否已解决")

class MonitorQuery(BaseModel):
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    status: Optional[str] = Field(None, description="状态过滤")
    execution_mode: Optional[str] = Field(None, description="执行模式过滤")
    limit: int = Field(100, description="返回数量限制")
    offset: int = Field(0, description="偏移量")

@router.get("/tasks", response_model=List[ExecutionTask])
async def get_tasks(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    status: Optional[str] = None,
    execution_mode: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """获取执行任务列表"""
    try:
        async with get_db_connection() as conn:
            # 构建查询条件
            conditions = ["1=1"]
            params = []
            param_count = 0
            
            if start_time:
                param_count += 1
                conditions.append(f"created_at >= ${param_count}")
                params.append(datetime.fromisoformat(start_time.replace('Z', '+00:00')))
            
            if end_time:
                param_count += 1
                conditions.append(f"created_at <= ${param_count}")
                params.append(datetime.fromisoformat(end_time.replace('Z', '+00:00')))
            
            if status:
                param_count += 1
                conditions.append(f"execution_status = ${param_count}")
                params.append(status)
            
            if execution_mode:
                param_count += 1
                conditions.append(f"execution_mode = ${param_count}")
                params.append(execution_mode)
            
            # 添加分页参数
            param_count += 1
            limit_param = f"${param_count}"
            params.append(limit)
            
            param_count += 1
            offset_param = f"${param_count}"
            params.append(offset)
            
            query = f"""
            SELECT 
                id, session_id, agent_config_id, query_text, execution_mode,
                execution_status, start_time, end_time, duration_seconds,
                error_message, execution_metadata, created_at
            FROM youtu_agent_executions 
            WHERE {' AND '.join(conditions)}
            ORDER BY created_at DESC
            LIMIT {limit_param} OFFSET {offset_param}
            """
            
            result = await conn.fetch(query, *params)
            
            tasks = []
            for row in result:
                duration_ms = None
                if row['duration_seconds']:
                    duration_ms = int(row['duration_seconds'] * 1000)
                
                task = ExecutionTask(
                    id=str(row['id']),
                    session_id=row['session_id'],
                    agent_config_id=str(row['agent_config_id']) if row['agent_config_id'] else None,
                    query=row['query_text'],
                    execution_mode=row['execution_mode'],
                    status=row['execution_status'],
                    start_time=row['start_time'].isoformat() if row['start_time'] else "",
                    end_time=row['end_time'].isoformat() if row['end_time'] else None,
                    duration=duration_ms,
                    error_message=row['error_message'],
                    metadata=row['execution_metadata'] or {},
                    created_at=row['created_at'].isoformat()
                )
                tasks.append(task)
            
            return tasks
            
    except Exception as e:
        logger.error(f"获取任务列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}", response_model=ExecutionTask)
async def get_task(task_id: str):
    """获取特定任务详情"""
    try:
        async with get_db_connection() as conn:
            query = """
            SELECT 
                id, session_id, agent_config_id, query_text, execution_mode,
                execution_status, start_time, end_time, duration_seconds,
                error_message, execution_metadata, created_at
            FROM youtu_agent_executions 
            WHERE id = $1
            """
            
            result = await conn.fetchrow(query, uuid.UUID(task_id))
            
            if not result:
                raise HTTPException(status_code=404, detail="任务不存在")
            
            duration_ms = None
            if result['duration_seconds']:
                duration_ms = int(result['duration_seconds'] * 1000)
            
            task = ExecutionTask(
                id=str(result['id']),
                session_id=result['session_id'],
                agent_config_id=str(result['agent_config_id']) if result['agent_config_id'] else None,
                query=result['query_text'],
                execution_mode=result['execution_mode'],
                status=result['execution_status'],
                start_time=result['start_time'].isoformat() if result['start_time'] else "",
                end_time=result['end_time'].isoformat() if result['end_time'] else None,
                duration=duration_ms,
                error_message=result['error_message'],
                metadata=result['execution_metadata'] or {},
                created_at=result['created_at'].isoformat()
            )
            
            return task
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/system", response_model=SystemMetrics)
async def get_system_metrics():
    """获取系统指标"""
    try:
        # 获取真实系统指标
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # 从数据库获取应用层指标
        async with get_db_connection() as conn:
            # 获取最近1分钟的API调用数
            api_calls = await conn.fetchval("""
                SELECT COUNT(*) FROM youtu_agent_executions 
                WHERE created_at >= NOW() - INTERVAL '1 minute'
            """)
            
            # 获取当前运行中的任务数（队列大小）
            queue_size = await conn.fetchval("""
                SELECT COUNT(*) FROM youtu_agent_executions 
                WHERE execution_status = 'running'
            """)
            
            # 模拟缓存命中率和活跃连接数
            cache_hit_rate = 85.5  # 可以从Redis或其他缓存系统获取
            active_connections = 150  # 可以从连接池获取
        
        # 记录系统指标到数据库
        await record_system_metrics(
            cpu_percent, memory.percent, disk.percent,
            active_connections, api_calls or 0, queue_size or 0, cache_hit_rate
        )
        
        metrics = SystemMetrics(
            timestamp=datetime.now().isoformat(),
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            active_connections=active_connections,
            api_calls_per_minute=api_calls or 0,
            queue_size=queue_size or 0,
            cache_hit_rate=cache_hit_rate
        )
        
        return metrics
        
    except Exception as e:
        logger.error(f"获取系统指标失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/performance", response_model=PerformanceStats)
async def get_performance_metrics():
    """获取性能指标"""
    try:
        async with get_db_connection() as conn:
            # 获取总体统计
            stats_query = """
            SELECT 
                COUNT(*) as total_executions,
                COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as success_count,
                COUNT(CASE WHEN execution_status = 'failed' THEN 1 END) as error_count,
                COUNT(CASE WHEN execution_status = 'timeout' THEN 1 END) as timeout_count,
                AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds * 1000 END) as avg_response_time
            FROM youtu_agent_executions
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            """
            
            result = await conn.fetchrow(stats_query)
            
            total = result['total_executions'] or 0
            success = result['success_count'] or 0
            errors = result['error_count'] or 0
            timeouts = result['timeout_count'] or 0
            avg_time = result['avg_response_time'] or 0.0
            
            success_rate = (success / total * 100) if total > 0 else 0.0
            
            # 计算当前QPS（最近1分钟）
            current_qps_result = await conn.fetchval("""
                SELECT COUNT(*) FROM youtu_agent_executions 
                WHERE created_at >= NOW() - INTERVAL '1 minute'
            """)
            
            current_qps = (current_qps_result or 0) / 60.0
            
            stats = PerformanceStats(
                total_executions=total,
                success_rate=success_rate,
                avg_response_time=avg_time,
                error_count=errors,
                timeout_count=timeouts,
                current_qps=current_qps
            )
            
            return stats
            
    except Exception as e:
        logger.error(f"获取性能指标失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/errors", response_model=List[ErrorLog])
async def get_error_logs(limit: int = 100, offset: int = 0):
    """获取错误日志"""
    try:
        async with get_db_connection() as conn:
            query = """
            SELECT 
                id, timestamp, level, message, task_id, stack_trace, 
                context, resolved, resolved_at, resolved_by
            FROM error_logs 
            ORDER BY timestamp DESC
            LIMIT $1 OFFSET $2
            """
            
            result = await conn.fetch(query, limit, offset)
            
            error_logs = []
            for row in result:
                error_log = ErrorLog(
                    id=str(row['id']),
                    timestamp=row['timestamp'].isoformat(),
                    level=row['level'],
                    message=row['message'],
                    task_id=str(row['task_id']) if row['task_id'] else None,
                    stack_trace=row['stack_trace'],
                    context=row['context'] or {},
                    resolved=row['resolved']
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
        async with get_db_connection() as conn:
            # 获取24小时趋势数据
            trends_query = """
            SELECT 
                DATE_TRUNC('hour', created_at) as hour,
                COUNT(*) as total_count,
                COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as success_count,
                COUNT(CASE WHEN execution_status = 'failed' THEN 1 END) as error_count,
                AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds * 1000 END) as avg_response_time
            FROM youtu_agent_executions 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY DATE_TRUNC('hour', created_at)
            ORDER BY hour
            """
            
            trends_result = await conn.fetch(trends_query)
            
            trends = []
            for row in trends_result:
                total = row['total_count'] or 0
                success = row['success_count'] or 0
                errors = row['error_count'] or 0
                
                success_rate = (success / total * 100) if total > 0 else 0
                error_rate = (errors / total * 100) if total > 0 else 0
                qps = total / 3600  # 每小时转换为每秒
                
                trends.append({
                    "timestamp": row['hour'].isoformat(),
                    "success_rate": success_rate,
                    "response_time": row['avg_response_time'] or 0,
                    "qps": qps,
                    "error_rate": error_rate
                })
            
            # 获取路由分布
            route_query = """
            SELECT 
                execution_metadata->>'route' as route,
                COUNT(*) as count
            FROM youtu_agent_executions 
            WHERE execution_metadata->>'route' IS NOT NULL
                AND created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY execution_metadata->>'route'
            """
            
            routes_result = await conn.fetch(route_query)
            total_routes = sum(r['count'] for r in routes_result)
            
            route_distribution = []
            for row in routes_result:
                percentage = (row['count'] / total_routes * 100) if total_routes > 0 else 0
                route_distribution.append({
                    "route": row['route'] or 'unknown',
                    "count": row['count'],
                    "percentage": percentage
                })
            
            # 获取策略性能
            strategy_query = """
            SELECT 
                execution_metadata->>'strategy_id' as strategy_id,
                COUNT(*) as usage_count,
                COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as success_count,
                AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds * 1000 END) as avg_response_time
            FROM youtu_agent_executions 
            WHERE execution_metadata->>'strategy_id' IS NOT NULL
                AND created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY execution_metadata->>'strategy_id'
            """
            
            strategy_result = await conn.fetch(strategy_query)
            
            strategy_performance = []
            for row in strategy_result:
                total = row['usage_count'] or 0
                success = row['success_count'] or 0
                success_rate = (success / total * 100) if total > 0 else 0
                
                strategy_performance.append({
                    "strategy": row['strategy_id'] or 'unknown',
                    "success_rate": success_rate,
                    "avg_response_time": row['avg_response_time'] or 0,
                    "usage_count": total
                })
            
            return {
                "trends": trends,
                "route_distribution": route_distribution,
                "strategy_performance": strategy_performance
            }
            
    except Exception as e:
        logger.error(f"获取分析趋势失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def record_system_metrics(cpu_usage: float, memory_usage: float, disk_usage: float,
                               active_connections: int, api_calls: int, queue_size: int, 
                               cache_hit_rate: float):
    """记录系统指标到数据库"""
    try:
        async with get_db_connection() as conn:
            await conn.execute("""
                INSERT INTO system_metrics 
                (cpu_usage, memory_usage, disk_usage, active_connections, 
                 api_calls_per_minute, queue_size, cache_hit_rate)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, cpu_usage, memory_usage, disk_usage, active_connections, 
                api_calls, queue_size, cache_hit_rate)
            
            # 清理旧数据（保留最近24小时）
            await conn.execute("""
                DELETE FROM system_metrics 
                WHERE timestamp < NOW() - INTERVAL '24 hours'
            """)
            
    except Exception as e:
        logger.error(f"记录系统指标失败: {e}")

@router.post("/errors/{error_id}/resolve")
async def resolve_error(error_id: str):
    """标记错误为已解决"""
    try:
        async with get_db_connection() as conn:
            result = await conn.execute("""
                UPDATE error_logs 
                SET resolved = true, resolved_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, uuid.UUID(error_id))
            
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail="错误日志不存在")
            
            return {"message": "错误已标记为解决"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"解决错误失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        async with get_db_connection() as conn:
            # 检查数据库连接
            await conn.fetchval("SELECT 1")
            
            # 获取基本统计
            tasks_count = await conn.fetchval("SELECT COUNT(*) FROM youtu_agent_executions")
            active_tasks = await conn.fetchval(
                "SELECT COUNT(*) FROM youtu_agent_executions WHERE execution_status = 'running'"
            )
            
            # 获取系统指标
            try:
                cpu_usage = psutil.cpu_percent()
                memory_usage = psutil.virtual_memory().percent
                disk_usage = psutil.disk_usage('/').percent
            except:
                cpu_usage = memory_usage = disk_usage = 0
            
            return {
                "status": "healthy",
                "database": "connected",
                "tasks_count": tasks_count,
                "active_tasks": active_tasks,
                "system_health": {
                    "cpu_usage": cpu_usage,
                    "memory_usage": memory_usage,
                    "disk_usage": disk_usage
                },
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
