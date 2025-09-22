"""
单实例Team管理器
确保每个session只有一个Team实例，解决多重实例创建问题
"""
import asyncio
import time
from typing import Dict, Optional, Set
from dataclasses import dataclass
from agno.team.team import Team

from core.logger import logger
from service.advanced_agent_team_service import AdvancedAgentTeamService


@dataclass
class TeamInstanceInfo:
    """Team实例信息"""
    team: Team
    session_id: str
    team_name: str
    created_at: float
    last_used_at: float
    usage_count: int
    status: str  # 'active', 'idle', 'releasing'


class SingletonTeamManager:
    """单例Team管理器 - 确保每个session只有一个Team实例"""
    
    _instance: Optional['SingletonTeamManager'] = None
    _lock = asyncio.Lock()
    
    def __init__(self):
        if SingletonTeamManager._instance is not None:
            raise Exception("SingletonTeamManager is a singleton class. Use get_instance() method.")
        
        self._team_instances: Dict[str, TeamInstanceInfo] = {}
        self._session_locks: Dict[str, asyncio.Lock] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_interval = 300  # 5分钟清理一次空闲实例
        self._max_idle_time = 1800    # 30分钟空闲后清理
        self._advanced_service = None
        
        # 启动清理任务
        self._start_cleanup_task()
    
    @classmethod
    async def get_instance(cls) -> 'SingletonTeamManager':
        """获取单例实例"""
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    async def get_or_create_team(self, team_name: str, session_id: str) -> Team:
        """获取或创建唯一的Team实例"""
        instance_key = f"{team_name}_{session_id}"
        
        # 确保线程安全
        if instance_key not in self._session_locks:
            self._session_locks[instance_key] = asyncio.Lock()
        
        async with self._session_locks[instance_key]:
            # 检查是否已存在实例
            if instance_key in self._team_instances:
                team_info = self._team_instances[instance_key]
                team_info.last_used_at = time.time()
                team_info.usage_count += 1
                team_info.status = 'active'
                
                logger.info(f"[SINGLETON_TEAM] 复用现有Team实例: {instance_key}, 使用次数: {team_info.usage_count}")
                return team_info.team
            
            # 创建新实例
            logger.info(f"[SINGLETON_TEAM] 创建新的Team实例: {instance_key}")
            team = await self._create_team_instance(team_name, session_id)
            
            if team:
                current_time = time.time()
                self._team_instances[instance_key] = TeamInstanceInfo(
                    team=team,
                    session_id=session_id,
                    team_name=team_name,
                    created_at=current_time,
                    last_used_at=current_time,
                    usage_count=1,
                    status='active'
                )
                logger.info(f"[SINGLETON_TEAM] Team实例创建成功: {instance_key}")
                return team
            else:
                logger.error(f"[SINGLETON_TEAM] Team实例创建失败: {instance_key}")
                raise Exception(f"无法创建Team实例: {team_name}")
    
    async def _create_team_instance(self, team_name: str, session_id: str) -> Optional[Team]:
        """创建Team实例"""
        try:
            if self._advanced_service is None:
                self._advanced_service = AdvancedAgentTeamService()
            
            team = self._advanced_service.agent_factory.create_team(team_name, session_id)
            if team:
                logger.info(f"[SINGLETON_TEAM] Team实例创建成功: {team_name}")
                return team
            else:
                logger.error(f"[SINGLETON_TEAM] AdvancedAgentTeamService无法创建Team: {team_name}")
                return None
                
        except Exception as e:
            logger.error(f"[SINGLETON_TEAM] 创建Team实例失败: {e}")
            import traceback
            logger.error(f"[SINGLETON_TEAM] 详细错误信息: {traceback.format_exc()}")
            return None
    
    async def release_team(self, team_name: str, session_id: str, force: bool = False):
        """释放Team实例"""
        instance_key = f"{team_name}_{session_id}"
        
        if instance_key in self._session_locks:
            async with self._session_locks[instance_key]:
                if instance_key in self._team_instances:
                    team_info = self._team_instances[instance_key]
                    
                    if force or team_info.usage_count <= 1:
                        # 清理资源
                        await self._cleanup_team_resources(team_info.team)
                        del self._team_instances[instance_key]
                        
                        # 清理锁
                        if instance_key in self._session_locks:
                            del self._session_locks[instance_key]
                        
                        logger.info(f"[SINGLETON_TEAM] Team实例已释放: {instance_key}")
                    else:
                        # 标记为空闲状态
                        team_info.status = 'idle'
                        team_info.last_used_at = time.time()
                        logger.info(f"[SINGLETON_TEAM] Team实例标记为空闲: {instance_key}")
    
    async def _cleanup_team_resources(self, team: Team):
        """清理Team资源"""
        try:
            # 清理Team相关资源
            if hasattr(team, 'clear_memory'):
                team.clear_memory()
            
            # 清理Agent资源
            if hasattr(team, 'members'):
                for agent in team.members:
                    if hasattr(agent, 'clear_memory'):
                        agent.clear_memory()
            
            logger.debug("[SINGLETON_TEAM] Team资源清理完成")
            
        except Exception as e:
            logger.error(f"[SINGLETON_TEAM] 清理Team资源失败: {e}")
    
    def _start_cleanup_task(self):
        """启动清理任务"""
        async def cleanup_loop():
            while True:
                try:
                    await asyncio.sleep(self._cleanup_interval)
                    await self._cleanup_idle_teams()
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"[SINGLETON_TEAM] 清理任务异常: {e}")
        
        self._cleanup_task = asyncio.create_task(cleanup_loop())
        logger.info("[SINGLETON_TEAM] 清理任务已启动")
    
    async def _cleanup_idle_teams(self):
        """清理空闲的Team实例"""
        current_time = time.time()
        to_cleanup = []
        
        for instance_key, team_info in self._team_instances.items():
            if (team_info.status == 'idle' and 
                current_time - team_info.last_used_at > self._max_idle_time):
                to_cleanup.append(instance_key)
        
        for instance_key in to_cleanup:
            team_name, session_id = instance_key.rsplit('_', 1)
            await self.release_team(team_name, session_id, force=True)
            logger.info(f"[SINGLETON_TEAM] 清理空闲Team实例: {instance_key}")
        
        if to_cleanup:
            logger.info(f"[SINGLETON_TEAM] 本次清理了 {len(to_cleanup)} 个空闲实例")
    
    async def get_team_statistics(self) -> Dict:
        """获取Team实例统计信息"""
        current_time = time.time()
        stats = {
            'total_instances': len(self._team_instances),
            'active_instances': 0,
            'idle_instances': 0,
            'instances_detail': []
        }
        
        for instance_key, team_info in self._team_instances.items():
            if team_info.status == 'active':
                stats['active_instances'] += 1
            elif team_info.status == 'idle':
                stats['idle_instances'] += 1
            
            stats['instances_detail'].append({
                'instance_key': instance_key,
                'team_name': team_info.team_name,
                'session_id': team_info.session_id,
                'status': team_info.status,
                'created_at': team_info.created_at,
                'last_used_at': team_info.last_used_at,
                'usage_count': team_info.usage_count,
                'idle_time': current_time - team_info.last_used_at
            })
        
        return stats
    
    async def cleanup_all_teams(self):
        """清理所有Team实例（用于系统关闭）"""
        logger.info("[SINGLETON_TEAM] 开始清理所有Team实例")
        
        # 取消清理任务
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # 清理所有实例
        for instance_key in list(self._team_instances.keys()):
            team_name, session_id = instance_key.rsplit('_', 1)
            await self.release_team(team_name, session_id, force=True)
        
        logger.info("[SINGLETON_TEAM] 所有Team实例已清理完成")


# 全局单例实例
_singleton_team_manager: Optional[SingletonTeamManager] = None

async def get_singleton_team_manager() -> SingletonTeamManager:
    """获取全局单例Team管理器"""
    global _singleton_team_manager
    if _singleton_team_manager is None:
        _singleton_team_manager = await SingletonTeamManager.get_instance()
    return _singleton_team_manager