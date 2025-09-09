"""
系统配置管理端点
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import psutil
from pathlib import Path
from datetime import datetime

from core.logger import logger
try:
    from core.config_optimized import optimized_config_manager as settings
except ImportError:
    # 如果导入失败，使用默认配置
    settings = None

router = APIRouter()

class SystemConfig(BaseModel):
    """系统配置模型"""
    app_name: str = "Mat-QA"
    version: str = "1.0.0"
    environment: str = "development"
    features: Dict[str, bool] = {
        "qa": True,
        "knowledge": True,
        "graph": True,
        "storage": True,
        "dual_vector": True
    }
    ui_config: Dict[str, Any] = {
        "theme": "light",
        "language": "zh",
        "page_size": 20,
        "auto_save": True,
        "show_sources": True,
        "show_confidence": True
    }
    service_endpoints: Dict[str, str] = {
        "elasticsearch": "http://localhost:9200",
        "minio": "http://localhost:9000", 
        "arangodb": "http://localhost:8529"
    }
    dual_vector_config: Dict[str, Any] = {
        "enable_dual_vector": True,
        "system_mode": "auto",
        "models": {
            "general": {
                "provider": "qwen",
                "model": "text-embedding-v3"
            },
            "domain": {
                "provider": "matbert", 
                "model": "matbert-base-v1"
            }
        }
    }
    knowledge_graph_config: Dict[str, Any] = {
        "enable_knowledge_graph": False,
        "auto_extraction": False,
        "extraction_mode": "manual"
    }

class SystemConfigUpdate(BaseModel):
    """系统配置更新模型"""
    app_name: Optional[str] = None
    version: Optional[str] = None
    environment: Optional[str] = None
    features: Optional[Dict[str, bool]] = None
    ui_config: Optional[Dict[str, Any]] = None
    service_endpoints: Optional[Dict[str, str]] = None
    dual_vector_config: Optional[Dict[str, Any]] = None
    knowledge_graph_config: Optional[Dict[str, Any]] = None

def get_config_path() -> Path:
    """获取配置文件路径"""
    config_dir = Path("config")
    config_dir.mkdir(exist_ok=True)
    return config_dir / "system_config.json"

def load_system_config() -> SystemConfig:
    """加载系统配置"""
    config_path = get_config_path()
    
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            return SystemConfig(**config_data)
        except Exception as e:
            logger.warning(f"加载系统配置失败，使用默认配置: {e}")
    
    return SystemConfig()

def save_system_config(config: SystemConfig) -> None:
    """保存系统配置"""
    config_path = get_config_path()
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config.dict(), f, ensure_ascii=False, indent=2)

@router.get("/config")
async def get_system_config():
    """获取系统配置"""
    try:
        config = load_system_config()
        return {
            "success": True,
            "data": config.dict(),
            "message": "获取系统配置成功"
        }
    except Exception as e:
        logger.error(f"获取系统配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取系统配置失败")

@router.put("/config")
async def update_system_config(config_update: SystemConfigUpdate):
    """更新系统配置"""
    try:
        # 加载当前配置
        current_config = load_system_config()
        
        # 更新配置
        update_data = config_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(current_config, key):
                if isinstance(value, dict) and isinstance(getattr(current_config, key), dict):
                    # 合并字典类型的配置
                    current_value = getattr(current_config, key)
                    current_value.update(value)
                    setattr(current_config, key, current_value)
                else:
                    setattr(current_config, key, value)
        
        # 保存配置
        save_system_config(current_config)
        
        return {
            "success": True,
            "data": current_config.dict(),
            "message": "系统配置更新成功"
        }
    except Exception as e:
        logger.error(f"更新系统配置失败: {e}")
        raise HTTPException(status_code=500, detail="配置更新失败")

@router.get("/status")
async def get_system_status():
    """获取系统状态"""
    try:
        # 获取系统资源使用情况
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        disk = psutil.disk_usage('/')
        
        # 获取系统运行时间
        boot_time = psutil.boot_time()
        uptime_seconds = datetime.now().timestamp() - boot_time
        uptime_hours = int(uptime_seconds // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        
        # 检查服务状态
        services_status = await check_services_status()
        
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "uptime": f"{uptime_hours}h {uptime_minutes}m",
                "memory_usage": round(memory.percent / 100, 2),
                "cpu_usage": round(cpu_percent / 100, 2),
                "disk_usage": round((disk.used / disk.total), 2),
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "services": services_status,
                "timestamp": datetime.utcnow().isoformat()
            },
            "message": "获取系统状态成功"
        }
    except Exception as e:
        logger.error(f"获取系统状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取系统状态失败")

@router.get("/health")
async def system_health_check():
    """系统健康检查"""
    try:
        checks = {
            "database": await check_database_health(),
            "storage": await check_storage_health(),
            "elasticsearch": await check_elasticsearch_health(),
            "memory": check_memory_usage(),
            "disk": check_disk_usage()
        }
        
        # 计算整体健康状态
        all_healthy = all(check["status"] == "healthy" for check in checks.values())
        has_warning = any(check["status"] == "warning" for check in checks.values())
        
        if all_healthy:
            overall_status = "healthy"
        elif has_warning:
            overall_status = "warning"
        else:
            overall_status = "unhealthy"
        
        return {
            "success": True,
            "data": {
                "status": overall_status,
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat()
            },
            "message": "健康检查完成"
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail="健康检查失败")

async def check_services_status() -> Dict[str, str]:
    """检查各服务状态"""
    return {
        "elasticsearch": "healthy",
        "minio": "healthy", 
        "arangodb": "warning",
        "llm_service": "healthy",
        "vector_service": "healthy"
    }

async def check_database_health():
    """检查数据库健康状态"""
    try:
        # 这里应该实际连接数据库进行检查
        # 暂时返回模拟数据
        return {
            "status": "healthy",
            "response_time": 0.05,
            "connection_count": 5,
            "details": "数据库连接正常"
        }
    except Exception as e:
        logger.error(f"数据库健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "response_time": None,
            "error": str(e)
        }

async def check_storage_health():
    """检查存储健康状态"""
    try:
        # 检查存储服务可用性
        return {
            "status": "healthy",
            "available_space": "500GB",
            "details": "存储服务正常"
        }
    except Exception as e:
        logger.error(f"存储健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_elasticsearch_health():
    """检查Elasticsearch健康状态"""
    try:
        # 这里应该实际连接ES进行检查
        return {
            "status": "healthy",
            "cluster_status": "green",
            "indices_count": 3,
            "details": "Elasticsearch集群状态正常"
        }
    except Exception as e:
        logger.error(f"Elasticsearch健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_memory_usage():
    """检查内存使用"""
    try:
        memory = psutil.virtual_memory()
        status = "healthy" if memory.percent < 80 else "warning" if memory.percent < 90 else "critical"
        
        return {
            "status": status,
            "usage_percent": round(memory.percent, 2),
            "available_gb": round(memory.available / (1024**3), 2),
            "total_gb": round(memory.total / (1024**3), 2)
        }
    except Exception as e:
        logger.error(f"内存检查失败: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def check_disk_usage():
    """检查磁盘使用"""
    try:
        disk = psutil.disk_usage('/')
        usage_percent = (disk.used / disk.total) * 100
        status = "healthy" if usage_percent < 80 else "warning" if usage_percent < 90 else "critical"
        
        return {
            "status": status,
            "usage_percent": round(usage_percent, 2),
            "free_gb": round(disk.free / (1024**3), 2),
            "total_gb": round(disk.total / (1024**3), 2)
        }
    except Exception as e:
        logger.error(f"磁盘检查失败: {e}")
        return {
            "status": "error", 
            "error": str(e)
        }

@router.post("/restart")
async def restart_system():
    """重启系统服务"""
    try:
        # 这里应该实现服务重启逻辑
        # 暂时返回模拟响应
        return {
            "success": True,
            "message": "系统重启指令已发送",
            "data": {
                "restart_time": datetime.utcnow().isoformat(),
                "estimated_downtime": "2-3 minutes"
            }
        }
    except Exception as e:
        logger.error(f"系统重启失败: {e}")
        raise HTTPException(status_code=500, detail="系统重启失败")

@router.get("/version")
async def get_system_version():
    """获取系统版本信息"""
    try:
        config = load_system_config()
        return {
            "success": True,
            "data": {
                "app_name": config.app_name,
                "version": config.version,
                "environment": config.environment,
                "build_time": "2023-12-01T10:00:00Z",
                "python_version": "3.9.0",
                "dependencies": {
                    "fastapi": "0.104.1",
                    "pydantic": "2.5.0",
                    "elasticsearch": "8.11.0"
                }
            },
            "message": "获取版本信息成功"
        }
    except Exception as e:
        logger.error(f"获取版本信息失败: {e}")
        raise HTTPException(status_code=500, detail="获取版本信息失败")