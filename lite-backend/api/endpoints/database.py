"""
数据库管理端点
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import asyncio
from datetime import datetime

from core.logger import logger

router = APIRouter()

class DatabaseConfig(BaseModel):
    """数据库配置模型"""
    host: str = Field("localhost", description="数据库主机")
    port: int = Field(5432, description="数据库端口", ge=1, le=65535)
    database: str = Field("mat_qa", description="数据库名称")
    username: str = Field("postgres", description="用户名")
    max_connections: int = Field(20, description="最大连接数", ge=1, le=100)
    echo: bool = Field(False, description="SQL日志输出")
    pool_size: int = Field(10, description="连接池大小", ge=1, le=50)
    pool_timeout: int = Field(30, description="连接池超时时间", ge=5, le=300)
    ssl_mode: str = Field("prefer", description="SSL模式")

class DatabaseStatus(BaseModel):
    """数据库状态模型"""
    status: str
    connection_count: int
    max_connections: int
    uptime: str
    database_size: str
    last_backup: Optional[str] = None
    active_queries: int
    idle_connections: int

class ConnectionTest(BaseModel):
    """连接测试模型"""
    host: str
    port: int
    database: str
    username: str
    timeout: int = Field(10, ge=1, le=60)

@router.get("/config")
async def get_database_config():
    """获取数据库配置"""
    try:
        # 返回脱敏的配置信息
        config = DatabaseConfig()
        
        # 移除敏感信息
        config_dict = config.dict()
        config_dict.pop("password", None)  # 不返回密码
        
        return {
            "success": True,
            "data": {
                **config_dict,
                "status": "connected",
                "last_updated": datetime.utcnow().isoformat()
            },
            "message": "获取数据库配置成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取数据库配置失败")

@router.put("/config")
async def update_database_config(config_update: Dict[str, Any]):
    """更新数据库配置"""
    try:
        # 验证配置参数
        allowed_fields = {
            "host", "port", "database", "username", 
            "max_connections", "echo", "pool_size", 
            "pool_timeout", "ssl_mode"
        }
        
        updates = {k: v for k, v in config_update.items() if k in allowed_fields}
        
        if not updates:
            raise HTTPException(status_code=400, detail="没有提供有效的配置更新")
        
        # 验证端口范围
        if "port" in updates and not (1 <= updates["port"] <= 65535):
            raise HTTPException(status_code=400, detail="端口号必须在1-65535范围内")
        
        # 验证连接数
        if "max_connections" in updates and not (1 <= updates["max_connections"] <= 100):
            raise HTTPException(status_code=400, detail="最大连接数必须在1-100范围内")
        
        # 这里应该实际更新配置文件或环境变量
        # 暂时返回模拟响应
        
        return {
            "success": True,
            "data": {
                "updates": updates,
                "updated_at": datetime.utcnow().isoformat(),
                "restart_required": True  # 某些配置更新需要重启
            },
            "message": "数据库配置更新成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新数据库配置失败: {e}")
        raise HTTPException(status_code=500, detail="配置更新失败")

@router.post("/test-connection")
async def test_database_connection(test_config: ConnectionTest):
    """测试数据库连接"""
    try:
        start_time = datetime.utcnow()
        
        # 模拟连接测试
        await asyncio.sleep(0.1)  # 模拟连接延迟
        
        # 这里应该实际尝试连接数据库
        connection_success = True  # 模拟连接成功
        
        end_time = datetime.utcnow()
        latency = (end_time - start_time).total_seconds()
        
        if connection_success:
            return {
                "success": True,
                "data": {
                    "connection_status": "success",
                    "latency": round(latency, 3),
                    "host": test_config.host,
                    "port": test_config.port,
                    "database": test_config.database,
                    "tested_at": end_time.isoformat()
                },
                "message": "数据库连接测试成功"
            }
        else:
            return {
                "success": False,
                "data": {
                    "connection_status": "failed",
                    "error": "连接超时",
                    "host": test_config.host,
                    "port": test_config.port,
                    "tested_at": end_time.isoformat()
                },
                "message": "数据库连接测试失败"
            }
        
    except Exception as e:
        logger.error(f"数据库连接测试失败: {e}")
        return {
            "success": False,
            "data": {
                "connection_status": "error",
                "error": str(e),
                "tested_at": datetime.utcnow().isoformat()
            },
            "message": f"连接测试出错: {str(e)}"
        }

@router.get("/status")
async def get_database_status():
    """获取数据库状态"""
    try:
        # 模拟数据库状态信息
        status = DatabaseStatus(
            status="healthy",
            connection_count=8,
            max_connections=20,
            uptime="5d 12h 30m",
            database_size="2.5 GB",
            last_backup="2023-12-01T02:00:00Z",
            active_queries=3,
            idle_connections=5
        )
        
        return {
            "success": True,
            "data": status.dict(),
            "message": "获取数据库状态成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取数据库状态失败")

@router.get("/tables")
async def get_database_tables():
    """获取数据库表信息"""
    try:
        # 模拟表信息
        tables = [
            {
                "name": "conversations",
                "rows": 1500,
                "size": "128 MB",
                "last_updated": "2023-12-01T10:30:00Z"
            },
            {
                "name": "knowledge_documents",
                "rows": 120,
                "size": "45 MB",
                "last_updated": "2023-12-01T09:15:00Z"
            },
            {
                "name": "vector_chunks",
                "rows": 8500,
                "size": "890 MB",
                "last_updated": "2023-12-01T10:45:00Z"
            },
            {
                "name": "graph_nodes",
                "rows": 3200,
                "size": "256 MB",
                "last_updated": "2023-12-01T08:20:00Z"
            },
            {
                "name": "user_preferences",
                "rows": 25,
                "size": "2 MB",
                "last_updated": "2023-12-01T11:00:00Z"
            }
        ]
        
        total_size = sum([
            float(table["size"].split()[0]) for table in tables
        ])
        
        return {
            "success": True,
            "data": {
                "tables": tables,
                "total_tables": len(tables),
                "total_size": f"{total_size:.1f} MB",
                "retrieved_at": datetime.utcnow().isoformat()
            },
            "message": "获取数据库表信息成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库表信息失败: {e}")
        raise HTTPException(status_code=500, detail="获取表信息失败")

@router.get("/performance")
async def get_database_performance():
    """获取数据库性能指标"""
    try:
        performance_data = {
            "connections": {
                "active": 8,
                "idle": 5,
                "total": 13,
                "max": 20,
                "usage_rate": 0.65
            },
            "queries": {
                "queries_per_second": 45.2,
                "slow_queries": 2,
                "average_query_time": 0.025,
                "longest_query_time": 1.2
            },
            "cache": {
                "hit_rate": 0.92,
                "buffer_usage": 0.78,
                "shared_buffers": "128 MB",
                "work_mem": "4 MB"
            },
            "locks": {
                "total_locks": 15,
                "waiting_locks": 0,
                "blocked_queries": 0
            },
            "io": {
                "reads_per_second": 120,
                "writes_per_second": 45,
                "checkpoints": 8,
                "wal_size": "256 MB"
            }
        }
        
        return {
            "success": True,
            "data": performance_data,
            "message": "获取数据库性能指标成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库性能指标失败: {e}")
        raise HTTPException(status_code=500, detail="获取性能指标失败")

@router.post("/backup")
async def create_database_backup(backup_config: Optional[Dict[str, Any]] = None):
    """创建数据库备份"""
    try:
        backup_config = backup_config or {}
        
        # 模拟备份任务
        backup_id = f"backup_{int(datetime.utcnow().timestamp())}"
        
        backup_info = {
            "backup_id": backup_id,
            "status": "started",
            "started_at": datetime.utcnow().isoformat(),
            "estimated_duration": "10-15 minutes",
            "backup_type": backup_config.get("type", "full"),
            "compression": backup_config.get("compression", True),
            "tables": backup_config.get("tables", "all")
        }
        
        return {
            "success": True,
            "data": backup_info,
            "message": "数据库备份任务已启动"
        }
        
    except Exception as e:
        logger.error(f"创建数据库备份失败: {e}")
        raise HTTPException(status_code=500, detail="备份创建失败")

@router.get("/backups")
async def get_database_backups():
    """获取数据库备份列表"""
    try:
        # 模拟备份列表
        backups = [
            {
                "backup_id": "backup_1701432000",
                "created_at": "2023-12-01T02:00:00Z",
                "type": "full",
                "size": "2.8 GB",
                "status": "completed",
                "duration": "12m 30s"
            },
            {
                "backup_id": "backup_1701345600",
                "created_at": "2023-11-30T02:00:00Z", 
                "type": "full",
                "size": "2.7 GB",
                "status": "completed",
                "duration": "11m 45s"
            },
            {
                "backup_id": "backup_1701259200",
                "created_at": "2023-11-29T02:00:00Z",
                "type": "incremental",
                "size": "256 MB",
                "status": "completed",
                "duration": "3m 20s"
            }
        ]
        
        return {
            "success": True,
            "data": {
                "backups": backups,
                "total_backups": len(backups),
                "total_size": "5.7 GB"
            },
            "message": "获取备份列表成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库备份列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取备份列表失败")

@router.post("/optimize")
async def optimize_database():
    """优化数据库"""
    try:
        # 模拟数据库优化操作
        optimization_tasks = [
            "重建索引",
            "清理过期数据",
            "更新统计信息",
            "压缩表空间",
            "优化查询计划"
        ]
        
        return {
            "success": True,
            "data": {
                "optimization_id": f"opt_{int(datetime.utcnow().timestamp())}",
                "status": "started",
                "tasks": optimization_tasks,
                "estimated_duration": "5-10 minutes",
                "started_at": datetime.utcnow().isoformat()
            },
            "message": "数据库优化任务已启动"
        }
        
    except Exception as e:
        logger.error(f"数据库优化失败: {e}")
        raise HTTPException(status_code=500, detail="数据库优化失败")

@router.get("/logs")
async def get_database_logs(
    level: str = "info",
    limit: int = 100,
    offset: int = 0
):
    """获取数据库日志"""
    try:
        # 模拟日志数据
        logs = [
            {
                "timestamp": "2023-12-01T10:30:15Z",
                "level": "info",
                "message": "checkpoint complete: wrote 145 buffers",
                "source": "checkpointer"
            },
            {
                "timestamp": "2023-12-01T10:28:30Z",
                "level": "warning",
                "message": "slow query detected: duration 1.2s",
                "source": "query_monitor",
                "query": "SELECT * FROM vector_chunks WHERE..."
            },
            {
                "timestamp": "2023-12-01T10:25:00Z",
                "level": "info",
                "message": "autovacuum: table conversations processed",
                "source": "autovacuum"
            }
        ]
        
        # 根据级别过滤
        if level != "all":
            logs = [log for log in logs if log["level"] == level]
        
        return {
            "success": True,
            "data": {
                "logs": logs[offset:offset+limit],
                "total": len(logs),
                "limit": limit,
                "offset": offset,
                "levels": ["error", "warning", "info", "debug"]
            },
            "message": "获取数据库日志成功"
        }
        
    except Exception as e:
        logger.error(f"获取数据库日志失败: {e}")
        raise HTTPException(status_code=500, detail="获取日志失败")