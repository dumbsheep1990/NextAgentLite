"""
NextAgent Lite 团队模板管理服务
处理团队模板的数据库操作、实例管理和执行路径规划
"""

import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncio
from functools import lru_cache

from db.database import get_db_session
from core.logger import setup_logger
from sqlalchemy import text

logger = setup_logger(__name__)

@dataclass
class TeamTemplate:
    """团队模板数据类"""
    template_id: str
    team_name: str
    execution_mode: str  # sequential, parallel, mixed
    agent_sequence: List[str]
    dependencies: Dict[str, List[str]]
    timeout_config: Dict[str, Any]
    retry_config: Dict[str, Any]
    is_active: bool
    version: str
    created_at: datetime
    updated_at: datetime

@dataclass 
class AgentConfig:
    """智能体配置数据类"""
    agent_id: str
    name: str
    description: str
    model_provider: str
    model_id: str
    temperature: float
    max_tokens: int
    system_prompt: str
    is_active: bool

@dataclass
class TeamInstance:
    """团队实例数据类"""
    instance_id: str
    template_id: str
    team_name: str
    execution_mode: str
    status: str  # created, running, completed, failed
    created_at: datetime
    agents: Dict[str, AgentConfig]

class TeamTemplateService:
    """团队模板管理服务"""
    
    def __init__(self):
        self._instances_cache: Dict[str, TeamInstance] = {}
        self._templates_cache: Dict[str, TeamTemplate] = {}
        self._cache_expiry = timedelta(minutes=30)
        self._last_cache_update = None
        
    async def get_all_templates(self) -> List[TeamTemplate]:
        """获取所有活跃的团队模板"""
        try:
            # 检查缓存
            if await self._is_cache_valid():
                return list(self._templates_cache.values())
            
            async with get_db_session() as session:
                query = text("""
                SELECT template_id, team_name, execution_mode, agent_sequence,
                       dependencies, timeout_config, retry_config, is_active,
                       version, created_at, updated_at
                FROM team_execution_templates 
                WHERE is_active = true
                ORDER BY created_at DESC
                """)
                
                result = await session.execute(query)
                rows = result.fetchall()
                templates = []
                
                for row in rows:
                    template = TeamTemplate(
                        template_id=row.template_id,
                        team_name=row.team_name,
                        execution_mode=row.execution_mode,
                        agent_sequence=json.loads(row.agent_sequence) if isinstance(row.agent_sequence, str) else row.agent_sequence,
                        dependencies=json.loads(row.dependencies) if isinstance(row.dependencies, str) else row.dependencies,
                        timeout_config=json.loads(row.timeout_config) if isinstance(row.timeout_config, str) else row.timeout_config,
                        retry_config=json.loads(row.retry_config) if isinstance(row.retry_config, str) else row.retry_config,
                        is_active=row.is_active,
                        version=row.version,
                        created_at=row.created_at,
                        updated_at=row.updated_at
                    )
                    templates.append(template)
                    self._templates_cache[template.template_id] = template
                
                self._last_cache_update = datetime.now()
                logger.info(f"加载了 {len(templates)} 个团队模板")
                return templates
                
        except Exception as e:
            logger.error(f"获取团队模板失败: {e}")
            return []
    
    async def get_template_by_id(self, template_id: str) -> Optional[TeamTemplate]:
        """根据模板ID获取特定模板"""
        try:
            if template_id in self._templates_cache:
                return self._templates_cache[template_id]
            
            async with get_db_session() as session:
                query = """
                SELECT template_id, team_name, execution_mode, agent_sequence,
                       dependencies, timeout_config, retry_config, is_active,
                       version, created_at, updated_at
                FROM team_execution_templates 
                WHERE template_id = :template_id AND is_active = true
                """
                
                result = await session.execute(text(query), {"template_id": template_id})
                row = result.fetchone()
                if not row:
                    return None
                
                template = TeamTemplate(
                    template_id=row.template_id,
                    team_name=row.team_name,
                    execution_mode=row.execution_mode,
                    agent_sequence=json.loads(row.agent_sequence) if isinstance(row.agent_sequence, str) else row.agent_sequence,
                    dependencies=json.loads(row.dependencies) if isinstance(row.dependencies, str) else row.dependencies,
                    timeout_config=json.loads(row.timeout_config) if isinstance(row.timeout_config, str) else row.timeout_config,
                    retry_config=json.loads(row.retry_config) if isinstance(row.retry_config, str) else row.retry_config,
                    is_active=row.is_active,
                    version=row.version,
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                
                self._templates_cache[template_id] = template
                return template
                
        except Exception as e:
            logger.error(f"获取模板 {template_id} 失败: {e}")
            return None
    
    async def get_agent_configs(self, agent_ids: List[str]) -> Dict[str, AgentConfig]:
        """获取智能体配置"""
        try:
            async with get_db_session() as session:
                query = """
                SELECT agent_id, name, description, model_provider, model_id,
                       temperature, max_tokens, system_prompt, is_active
                FROM agent_configs 
                WHERE agent_id = ANY(:agent_ids) AND is_active = true
                """
                
                rows = await conn.fetch(query, agent_ids)
                configs = {}
                
                for row in rows:
                    config = AgentConfig(
                        agent_id=row['agent_id'],
                        name=row['name'],
                        description=row['description'],
                        model_provider=row['model_provider'],
                        model_id=row['model_id'],
                        temperature=row['temperature'],
                        max_tokens=row['max_tokens'],
                        system_prompt=row['system_prompt'],
                        is_active=row['is_active']
                    )
                    configs[config.agent_id] = config
                
                logger.info(f"加载了 {len(configs)} 个智能体配置")
                return configs
                
        except Exception as e:
            logger.error(f"获取智能体配置失败: {e}")
            return {}
    
    async def create_team_instance(self, template_id: str, execution_mode: Optional[str] = None) -> Optional[TeamInstance]:
        """创建团队实例（全局唯一）"""
        try:
            # 检查是否已存在实例
            instance_key = f"{template_id}_{execution_mode or 'default'}"
            if instance_key in self._instances_cache:
                existing_instance = self._instances_cache[instance_key]
                if existing_instance.status in ['created', 'running']:
                    logger.info(f"返回现有团队实例: {existing_instance.instance_id}")
                    return existing_instance
            
            # 获取模板
            template = await self.get_template_by_id(template_id)
            if not template:
                logger.error(f"模板 {template_id} 不存在")
                return None
            
            # 确定执行模式
            if execution_mode:
                # 根据执行模式选择对应的模板
                mode_template_map = {
                    'direct_answer': 'nextAgent_direct_answer_template',
                    'knowledge_retrieval': 'nextAgent_knowledge_retrieval_template', 
                    'graph_enhanced': 'nextAgent_graph_enhanced_template'
                }
                
                if execution_mode in mode_template_map:
                    template_id = mode_template_map[execution_mode]
                    template = await self.get_template_by_id(template_id)
            
            if not template:
                logger.error(f"无法找到执行模式 {execution_mode} 对应的模板")
                return None
            
            # 获取智能体配置
            agent_ids = self._extract_agent_ids(template.agent_sequence)
            agent_configs = await self.get_agent_configs(agent_ids)
            
            # 创建实例
            instance_id = f"{template.team_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            instance = TeamInstance(
                instance_id=instance_id,
                template_id=template.template_id,
                team_name=template.team_name,
                execution_mode=template.execution_mode,
                status='created',
                created_at=datetime.now(),
                agents=agent_configs
            )
            
            # 缓存实例
            self._instances_cache[instance_key] = instance
            
            logger.info(f"创建团队实例: {instance_id}, 模板: {template_id}, 模式: {execution_mode}")
            return instance
            
        except Exception as e:
            logger.error(f"创建团队实例失败: {e}")
            return None
    
    async def get_team_instance(self, instance_key: str) -> Optional[TeamInstance]:
        """获取团队实例"""
        return self._instances_cache.get(instance_key)
    
    async def update_instance_status(self, instance_key: str, status: str):
        """更新实例状态"""
        if instance_key in self._instances_cache:
            self._instances_cache[instance_key].status = status
            logger.info(f"更新实例状态: {instance_key} -> {status}")
    
    async def cleanup_completed_instances(self):
        """清理已完成的实例"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=1)  # 1小时后清理
            keys_to_remove = []
            
            for key, instance in self._instances_cache.items():
                if instance.status in ['completed', 'failed'] and instance.created_at < cutoff_time:
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._instances_cache[key]
                
            if keys_to_remove:
                logger.info(f"清理了 {len(keys_to_remove)} 个已完成的团队实例")
                
        except Exception as e:
            logger.error(f"清理实例失败: {e}")
    
    async def get_available_execution_modes(self) -> List[str]:
        """获取可用的执行模式"""
        try:
            async with get_db_session() as session:
                query = """
                SELECT value FROM system_configs 
                WHERE category = 'team_templates' AND key = 'available_modes'
                """
                
                row = await conn.fetchrow(query)
                if row:
                    return json.loads(row['value'])
                
                # 默认模式
                return ['direct_answer', 'knowledge_retrieval', 'graph_enhanced']
                
        except Exception as e:
            logger.error(f"获取执行模式失败: {e}")
            return ['knowledge_retrieval']  # 默认模式
    
    async def get_default_execution_mode(self) -> str:
        """获取默认执行模式"""
        try:
            async with get_db_session() as session:
                query = """
                SELECT value FROM system_configs 
                WHERE category = 'team_templates' AND key = 'default_execution_mode'
                """
                
                row = await conn.fetchrow(query)
                if row:
                    return row['value']
                
                return 'knowledge_retrieval'  # 默认模式
                
        except Exception as e:
            logger.error(f"获取默认执行模式失败: {e}")
            return 'knowledge_retrieval'
    
    def _extract_agent_ids(self, agent_sequence: List[Any]) -> List[str]:
        """从代理序列中提取代理ID"""
        agent_ids = []
        
        def extract_recursive(items):
            for item in items:
                if isinstance(item, str):
                    agent_ids.append(item)
                elif isinstance(item, list):
                    extract_recursive(item)
        
        extract_recursive(agent_sequence)
        return agent_ids
    
    async def _is_cache_valid(self) -> bool:
        """检查缓存是否有效"""
        if not self._last_cache_update:
            return False
        
        return datetime.now() - self._last_cache_update < self._cache_expiry

# 全局服务实例
team_template_service = TeamTemplateService()