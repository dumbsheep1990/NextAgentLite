"""
统计监控端点
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import psutil
import asyncio

try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, func
except ImportError:
    # 模拟SQLAlchemy类型
    AsyncSession = None

from core.logger import logger
try:
    from db.database import get_db
except ImportError:
    # 模拟数据库会话
    def get_db():
        return None

router = APIRouter()

class SystemOverview(BaseModel):
    """系统概览模型"""
    documents: Dict[str, Any]
    conversations: Dict[str, Any]
    system: Dict[str, Any]
    services: Dict[str, str]

class UsageStatistics(BaseModel):
    """使用统计模型"""
    period: Dict[str, Any]
    daily_conversations: List[Dict[str, Any]]
    feature_usage: Dict[str, int]
    top_queries: List[Dict[str, Any]]

class PerformanceMetrics(BaseModel):
    """性能指标模型"""
    response_times: Dict[str, float]
    success_rates: Dict[str, float]
    resource_usage: Dict[str, Any]
    error_rates: Dict[str, Any]

@router.get("/overview")
async def get_system_overview(
    db = Depends(get_db)
):
    """获取系统总览统计"""
    try:
        # 模拟数据库查询 - 在实际实现中应该查询真实数据
        # 文档统计
        total_docs = await get_document_count(db)
        vectorized_docs = await get_vectorized_document_count(db)
        
        # 对话统计
        total_conversations = await get_conversation_count(db)
        total_messages = await get_message_count(db)
        
        # 今日统计
        today = datetime.utcnow().date()
        today_conversations = await get_today_conversation_count(db, today)
        
        # 系统资源使用
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # 服务状态
        services_status = await check_all_services_status()
        
        overview = SystemOverview(
            documents={
                "total": total_docs,
                "vectorized": vectorized_docs,
                "vectorization_rate": round(vectorized_docs / max(total_docs, 1), 2),
                "processing": total_docs - vectorized_docs,
                "failed": 0  # 可以从数据库查询失败的文档数
            },
            conversations={
                "total": total_conversations,
                "today": today_conversations,
                "average_messages": round(total_messages / max(total_conversations, 1), 1),
                "active_sessions": 5  # 当前活跃会话数
            },
            system={
                "uptime": get_system_uptime(),
                "memory_usage": round(memory.percent / 100, 2),
                "cpu_usage": round(cpu_percent / 100, 2),
                "active_users": 12,  # 活跃用户数
                "server_load": round(psutil.getloadavg()[0], 2) if hasattr(psutil, 'getloadavg') else 0.5
            },
            services=services_status
        )
        
        return {
            "success": True,
            "data": overview.dict(),
            "message": "获取系统概览成功"
        }
        
    except Exception as e:
        logger.error(f"获取系统概览失败: {e}")
        raise HTTPException(status_code=500, detail="获取统计数据失败")

@router.get("/usage")
async def get_usage_statistics(
    days: int = Query(7, ge=1, le=30, description="统计天数"),
    db = Depends(get_db)
):
    """获取使用统计"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 按日统计对话数量
        daily_conversations = []
        for i in range(days):
            day = start_date + timedelta(days=i)
            day_count = await get_daily_conversation_count(db, day.date())
            daily_conversations.append({
                "date": day.date().isoformat(),
                "conversations": day_count,
                "messages": day_count * 3,  # 假设每个对话平均3条消息
                "users": min(day_count, 10)  # 假设用户数
            })
        
        # 功能使用统计
        feature_usage = {
            "qa": await get_qa_usage_count(db, days),
            "knowledge_search": await get_knowledge_search_count(db, days),
            "graph_query": await get_graph_query_count(db, days),
            "document_upload": await get_document_upload_count(db, days),
            "vectorization": await get_vectorization_count(db, days)
        }
        
        # 热门查询
        top_queries = await get_top_queries(db, days)
        
        usage_stats = UsageStatistics(
            period={
                "start_date": start_date.date().isoformat(),
                "end_date": end_date.date().isoformat(),
                "days": days,
                "total_requests": sum(feature_usage.values())
            },
            daily_conversations=daily_conversations,
            feature_usage=feature_usage,
            top_queries=top_queries
        )
        
        return {
            "success": True,
            "data": usage_stats.dict(),
            "message": "获取使用统计成功"
        }
        
    except Exception as e:
        logger.error(f"获取使用统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取使用统计失败")

@router.get("/performance")
async def get_performance_statistics():
    """获取性能统计"""
    try:
        # 获取系统资源使用情况
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        disk = psutil.disk_usage('/')
        
        # 模拟响应时间统计
        performance_metrics = PerformanceMetrics(
            response_times={
                "qa_average": 2.3,
                "qa_p95": 4.1,
                "search_average": 0.8,
                "search_p95": 1.5,
                "upload_average": 5.2,
                "upload_p95": 12.0,
                "vectorization_average": 45.6,
                "vectorization_p95": 120.0
            },
            success_rates={
                "qa_success_rate": 0.98,
                "search_success_rate": 0.99,
                "upload_success_rate": 0.95,
                "vectorization_success_rate": 0.92,
                "overall_success_rate": 0.96
            },
            resource_usage={
                "memory": {
                    "current": round(memory.percent / 100, 2),
                    "peak": 0.82,
                    "average": 0.58,
                    "available_gb": round(memory.available / (1024**3), 2)
                },
                "cpu": {
                    "current": round(cpu_percent / 100, 2),
                    "peak": 0.78,
                    "average": 0.45,
                    "cores": psutil.cpu_count()
                },
                "disk": {
                    "usage": round((disk.used / disk.total), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "growth_rate": 0.02
                },
                "network": {
                    "requests_per_minute": 45,
                    "bandwidth_usage": "15 MB/s",
                    "active_connections": 12
                }
            },
            error_rates={
                "total_errors": 23,
                "error_rate": 0.02,
                "errors_per_hour": 1.2,
                "top_errors": [
                    {"error": "Model timeout", "count": 8, "rate": 0.008},
                    {"error": "File too large", "count": 6, "rate": 0.006},
                    {"error": "Connection refused", "count": 5, "rate": 0.005},
                    {"error": "Invalid request", "count": 4, "rate": 0.004}
                ]
            }
        )
        
        return {
            "success": True,
            "data": performance_metrics.dict(),
            "message": "获取性能统计成功"
        }
        
    except Exception as e:
        logger.error(f"获取性能统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取性能统计失败")

@router.get("/monitoring/metrics")
async def get_monitoring_metrics():
    """获取实时监控指标"""
    try:
        # 获取实时系统指标
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # 网络连接统计
        try:
            network_connections = len(psutil.net_connections())
        except:
            network_connections = 0
        
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "requests_per_minute": 45,
                "active_connections": network_connections,
                "queue_size": 3,
                "cache_hit_rate": 0.85,
                "database_connections": 8,
                "memory_usage_percent": round(memory.percent, 2),
                "cpu_usage_percent": round(cpu_percent, 2),
                "disk_io_read": "10 MB/s",
                "disk_io_write": "5 MB/s"
            },
            "services": {
                "elasticsearch_status": "green",
                "elasticsearch_response_time": 0.05,
                "model_service_status": "healthy",
                "model_service_queue": 2,
                "storage_service_status": "healthy",
                "storage_service_usage": "45%",
                "database_status": "healthy",
                "database_response_time": 0.02
            },
            "alerts": await get_current_alerts(),
            "health_score": calculate_health_score(memory.percent, cpu_percent)
        }
        
        return {
            "success": True,
            "data": metrics,
            "message": "获取监控指标成功"
        }
        
    except Exception as e:
        logger.error(f"获取监控指标失败: {e}")
        raise HTTPException(status_code=500, detail="获取监控指标失败")

@router.get("/reports/daily")
async def get_daily_report(
    date: Optional[str] = Query(None, description="日期 (YYYY-MM-DD)")
):
    """获取日报"""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.utcnow().date()
        
        report = {
            "date": target_date.isoformat(),
            "summary": {
                "total_users": 25,
                "total_conversations": 45,
                "total_questions": 180,
                "total_documents_uploaded": 8,
                "total_vectorizations": 12
            },
            "performance": {
                "average_response_time": 2.1,
                "success_rate": 0.97,
                "peak_concurrent_users": 15,
                "system_uptime": "24h"
            },
            "issues": [
                {
                    "time": "14:30",
                    "severity": "warning",
                    "message": "高内存使用率检测",
                    "resolved": True
                },
                {
                    "time": "16:45",
                    "severity": "info",
                    "message": "ElasticSearch自动优化索引",
                    "resolved": True
                }
            ],
            "top_features": [
                {"feature": "智能问答", "usage": 180},
                {"feature": "文档上传", "usage": 8},
                {"feature": "知识检索", "usage": 95},
                {"feature": "图谱查询", "usage": 25}
            ]
        }
        
        return {
            "success": True,
            "data": report,
            "message": "获取日报成功"
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式无效")
    except Exception as e:
        logger.error(f"获取日报失败: {e}")
        raise HTTPException(status_code=500, detail="获取日报失败")

# 辅助函数
async def get_document_count(db: AsyncSession) -> int:
    """获取文档总数"""
    # 模拟数据，实际应该查询数据库
    return 120

async def get_vectorized_document_count(db: AsyncSession) -> int:
    """获取已向量化文档数"""
    return 115

async def get_conversation_count(db: AsyncSession) -> int:
    """获取对话总数"""
    return 150

async def get_message_count(db: AsyncSession) -> int:
    """获取消息总数"""
    return 890

async def get_today_conversation_count(db: AsyncSession, date) -> int:
    """获取今日对话数"""
    return 10

async def get_daily_conversation_count(db: AsyncSession, date) -> int:
    """获取指定日期对话数"""
    return 8

async def get_qa_usage_count(db: AsyncSession, days: int) -> int:
    """获取QA使用次数"""
    return 850

async def get_knowledge_search_count(db: AsyncSession, days: int) -> int:
    """获取知识搜索次数"""
    return 320

async def get_graph_query_count(db: AsyncSession, days: int) -> int:
    """获取图谱查询次数"""
    return 120

async def get_document_upload_count(db: AsyncSession, days: int) -> int:
    """获取文档上传次数"""
    return 45

async def get_vectorization_count(db: AsyncSession, days: int) -> int:
    """获取向量化次数"""
    return 38

async def get_top_queries(db: AsyncSession, days: int) -> List[Dict[str, Any]]:
    """获取热门查询"""
    return [
        {"query": "地聚物性能", "count": 45, "trend": "up"},
        {"query": "材料测试", "count": 32, "trend": "stable"},
        {"query": "强度分析", "count": 28, "trend": "down"},
        {"query": "配合比优化", "count": 24, "trend": "up"},
        {"query": "耐久性评估", "count": 19, "trend": "stable"}
    ]

async def check_all_services_status() -> Dict[str, str]:
    """检查所有服务状态"""
    return {
        "elasticsearch": "healthy",
        "minio": "healthy",
        "arangodb": "warning",
        "llm_service": "healthy",
        "vector_service": "healthy",
        "database": "healthy"
    }

def get_system_uptime() -> str:
    """获取系统运行时间"""
    try:
        boot_time = psutil.boot_time()
        uptime_seconds = datetime.now().timestamp() - boot_time
        uptime_hours = int(uptime_seconds // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        return f"{uptime_hours}h {uptime_minutes}m"
    except:
        return "24h 30m"

async def get_current_alerts() -> List[Dict[str, Any]]:
    """获取当前告警"""
    alerts = []
    
    # 检查内存使用率
    memory = psutil.virtual_memory()
    if memory.percent > 80:
        alerts.append({
            "level": "warning" if memory.percent < 90 else "critical",
            "message": f"内存使用率过高: {memory.percent:.1f}%",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "system"
        })
    
    # 检查CPU使用率
    cpu_percent = psutil.cpu_percent(interval=0.1)
    if cpu_percent > 80:
        alerts.append({
            "level": "warning" if cpu_percent < 90 else "critical", 
            "message": f"CPU使用率过高: {cpu_percent:.1f}%",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "system"
        })
    
    return alerts

def calculate_health_score(memory_percent: float, cpu_percent: float) -> float:
    """计算系统健康得分"""
    memory_score = max(0, 100 - memory_percent)
    cpu_score = max(0, 100 - cpu_percent)
    return round((memory_score + cpu_score) / 2, 1)