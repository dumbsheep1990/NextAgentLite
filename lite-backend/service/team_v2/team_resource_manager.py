"""
Team资源管理器
负责Team实例的资源管理、监控和清理
"""
import asyncio
import time
import psutil
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

from core.logger import logger


@dataclass
class TeamResourceInfo:
    """Team资源信息"""
    team_name: str
    session_id: str
    instance_id: str
    created_at: float
    last_active: float
    memory_usage: int  # MB
    cpu_usage: float  # %
    active_executions: int
    total_executions: int
    status: str  # active, idle, cleaning, terminated


class TeamResourceManager:
    """Team资源管理器"""
    
    def __init__(self):
        self._resources: Dict[str, TeamResourceInfo] = {}
        self._cleanup_interval = 300  # 5分钟清理一次
        self._idle_timeout = 1800  # 30分钟不活动则清理
        self._memory_threshold = 1024  # 1GB内存阈值
        self._cleanup_task: Optional[asyncio.Task] = None
        self._monitoring_enabled = True
    
    async def register_team_instance(
        self, 
        team_name: str, 
        session_id: str, 
        instance_id: str
    ) -> TeamResourceInfo:
        """注册Team实例"""
        instance_key = f"{team_name}_{session_id}"
        
        resource_info = TeamResourceInfo(
            team_name=team_name,
            session_id=session_id,
            instance_id=instance_id,
            created_at=time.time(),
            last_active=time.time(),
            memory_usage=0,
            cpu_usage=0.0,
            active_executions=0,
            total_executions=0,
            status="active"
        )
        
        self._resources[instance_key] = resource_info
        await self._update_resource_metrics(instance_key)
        
        logger.info(f"[RESOURCE_MANAGER] Team实例已注册: {instance_key}")
        return resource_info
    
    async def update_activity(self, team_name: str, session_id: str):
        """更新Team活动时间"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._resources:
            self._resources[instance_key].last_active = time.time()
            await self._update_resource_metrics(instance_key)
    
    async def start_execution(self, team_name: str, session_id: str):
        """开始执行，增加活动计数"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._resources:
            resource = self._resources[instance_key]
            resource.active_executions += 1
            resource.total_executions += 1
            resource.last_active = time.time()
            await self._update_resource_metrics(instance_key)
    
    async def end_execution(self, team_name: str, session_id: str):
        """结束执行，减少活动计数"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._resources:
            resource = self._resources[instance_key]
            resource.active_executions = max(0, resource.active_executions - 1)
            resource.last_active = time.time()
            await self._update_resource_metrics(instance_key)
    
    async def release_team_instance(self, team_name: str, session_id: str) -> bool:
        """释放Team实例"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._resources:
            self._resources[instance_key].status = "terminated"
            del self._resources[instance_key]
            logger.info(f"[RESOURCE_MANAGER] Team实例已释放: {instance_key}")
            return True
        
        return False
    
    async def get_resource_info(self, team_name: str, session_id: str) -> Optional[TeamResourceInfo]:
        """获取Team资源信息"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._resources:
            await self._update_resource_metrics(instance_key)
            return self._resources[instance_key]
        
        return None
    
    async def get_all_resources(self) -> Dict[str, TeamResourceInfo]:
        """获取所有Team资源信息"""
        # 更新所有资源指标
        for instance_key in list(self._resources.keys()):
            await self._update_resource_metrics(instance_key)
        
        return self._resources.copy()
    
    async def cleanup_idle_instances(self) -> List[str]:
        """清理空闲的Team实例"""
        current_time = time.time()
        cleaned_instances = []
        
        for instance_key, resource in list(self._resources.items()):
            # 检查是否空闲且超时
            is_idle = (
                resource.active_executions == 0 and
                current_time - resource.last_active > self._idle_timeout
            )
            
            # 检查内存使用是否过高
            is_memory_high = resource.memory_usage > self._memory_threshold
            
            if is_idle or is_memory_high:
                reason = "idle_timeout" if is_idle else "memory_threshold"
                logger.info(f"[RESOURCE_MANAGER] 清理Team实例: {instance_key}, 原因: {reason}")
                
                resource.status = "terminated"
                del self._resources[instance_key]
                cleaned_instances.append(instance_key)
        
        return cleaned_instances
    
    async def get_system_resource_summary(self) -> Dict[str, Any]:
        """获取系统资源汇总"""
        total_instances = len(self._resources)
        active_instances = sum(1 for r in self._resources.values() if r.status == "active")
        total_executions = sum(r.active_executions for r in self._resources.values())
        
        # 获取系统资源信息
        system_memory = psutil.virtual_memory()
        system_cpu = psutil.cpu_percent(interval=1)
        
        return {
            "team_instances": {
                "total_instances": total_instances,
                "active_instances": active_instances,
                "idle_instances": total_instances - active_instances,
                "total_active_executions": total_executions
            },
            "system_resources": {
                "memory_usage_percent": system_memory.percent,
                "memory_available_gb": system_memory.available / (1024**3),
                "cpu_usage_percent": system_cpu,
                "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
            },
            "resource_manager": {
                "cleanup_interval": self._cleanup_interval,
                "idle_timeout": self._idle_timeout,
                "memory_threshold_mb": self._memory_threshold,
                "monitoring_enabled": self._monitoring_enabled
            }
        }
    
    async def _update_resource_metrics(self, instance_key: str):
        """更新资源指标"""
        if not self._monitoring_enabled:
            return
        
        try:
            # 获取当前进程的资源使用情况
            process = psutil.Process()
            memory_info = process.memory_info()
            cpu_usage = process.cpu_percent()
            
            # 估算此实例的资源使用（简化版）
            if instance_key in self._resources:
                resource = self._resources[instance_key]
                resource.memory_usage = int(memory_info.rss / (1024 * 1024))  # MB
                resource.cpu_usage = cpu_usage
        
        except Exception as e:
            logger.warning(f"[RESOURCE_MANAGER] 资源指标更新失败: {e}")
    
    async def start_monitoring(self):
        """启动资源监控"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._monitoring_loop())
            logger.info("[RESOURCE_MANAGER] 资源监控已启动")
    
    async def stop_monitoring(self):
        """停止资源监控"""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        logger.info("[RESOURCE_MANAGER] 资源监控已停止")
    
    async def _monitoring_loop(self):
        """监控循环"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                
                # 执行清理
                cleaned = await self.cleanup_idle_instances()
                if cleaned:
                    logger.info(f"[RESOURCE_MANAGER] 已清理 {len(cleaned)} 个空闲实例")
                
                # 记录资源状态
                summary = await self.get_system_resource_summary()
                logger.debug(f"[RESOURCE_MANAGER] 资源状态: {summary}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[RESOURCE_MANAGER] 监控循环异常: {e}")


# 全局资源管理器实例
team_resource_manager = TeamResourceManager()