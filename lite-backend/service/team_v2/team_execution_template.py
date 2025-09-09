"""
Team执行模板系统
提供固定的DAG执行模板，从数据库加载和管理
"""
import json
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

from core.logger import logger


@dataclass
class AgentExecutionConfig:
    """Agent执行配置"""
    agent: str
    timeout: int
    retry: int
    priority: int
    parallel_group: Optional[str] = None
    dependencies: List[str] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


@dataclass
class TeamExecutionTemplate:
    """Team执行模板 - 预定义的DAG执行流程"""
    template_id: str
    team_name: str
    execution_mode: str  # "sequential", "parallel", "hybrid"
    agent_sequence: List[AgentExecutionConfig]
    dependencies: Dict[str, List[str]]
    timeout_config: Dict[str, int]
    retry_config: Dict[str, Any]
    version: int = 1
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TeamExecutionTemplate':
        """从字典创建模板"""
        # 处理agent_sequence
        agent_sequence = []
        if isinstance(data.get('agent_sequence'), list):
            for agent_data in data['agent_sequence']:
                if isinstance(agent_data, dict):
                    agent_sequence.append(AgentExecutionConfig(**agent_data))
                else:
                    logger.warning(f"[TEMPLATE] 无效的agent配置: {agent_data}")
        
        return cls(
            template_id=data.get('template_id', ''),
            team_name=data.get('team_name', ''),
            execution_mode=data.get('execution_mode', 'sequential'),
            agent_sequence=agent_sequence,
            dependencies=data.get('dependencies', {}),
            timeout_config=data.get('timeout_config', {}),
            retry_config=data.get('retry_config', {}),
            version=data.get('version', 1),
            is_active=data.get('is_active', True),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'template_id': self.template_id,
            'team_name': self.team_name,
            'execution_mode': self.execution_mode,
            'agent_sequence': [asdict(agent) for agent in self.agent_sequence],
            'dependencies': self.dependencies,
            'timeout_config': self.timeout_config,
            'retry_config': self.retry_config,
            'version': self.version,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_agent_by_name(self, agent_name: str) -> Optional[AgentExecutionConfig]:
        """根据名称获取Agent配置"""
        for agent in self.agent_sequence:
            if agent.agent == agent_name:
                return agent
        return None
    
    def get_execution_order(self) -> List[str]:
        """获取执行顺序"""
        if self.execution_mode == "sequential":
            return [agent.agent for agent in sorted(self.agent_sequence, key=lambda x: x.priority)]
        elif self.execution_mode == "parallel":
            # 按照parallel_group分组
            groups = {}
            for agent in self.agent_sequence:
                group = agent.parallel_group or "default"
                if group not in groups:
                    groups[group] = []
                groups[group].append(agent.agent)
            return groups
        else:  # hybrid
            # 根据dependencies计算执行顺序
            return self._calculate_topological_order()
    
    def _calculate_topological_order(self) -> List[str]:
        """计算拓扑排序的执行顺序"""
        # 简单的拓扑排序实现
        in_degree = {}
        graph = {}
        
        # 初始化
        for agent in self.agent_sequence:
            agent_name = agent.agent
            in_degree[agent_name] = 0
            graph[agent_name] = []
        
        # 构建图和入度
        for agent_name, deps in self.dependencies.items():
            for dep in deps:
                if dep in graph:
                    graph[dep].append(agent_name)
                    in_degree[agent_name] += 1
        
        # 拓扑排序
        queue = [agent for agent in in_degree if in_degree[agent] == 0]
        result = []
        
        while queue:
            current = queue.pop(0)
            result.append(current)
            
            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result


class TeamTemplateRepository:
    """Team模板数据库仓库"""
    
    def __init__(self):
        self._cache: Dict[str, TeamExecutionTemplate] = {}
        self._cache_ttl = 3600  # 缓存1小时
        self._last_cache_time = 0
    
    async def save_template(self, template: TeamExecutionTemplate) -> bool:
        """保存模板到数据库"""
        try:
            from core.database import get_database_connection
            
            async with get_database_connection() as conn:
                # 准备数据
                agent_sequence_json = json.dumps([asdict(agent) for agent in template.agent_sequence])
                dependencies_json = json.dumps(template.dependencies)
                timeout_config_json = json.dumps(template.timeout_config)
                retry_config_json = json.dumps(template.retry_config)
                
                # 插入或更新
                query = """
                INSERT INTO team_execution_templates (
                    template_id, team_name, execution_mode, agent_sequence, 
                    dependencies, timeout_config, retry_config, version, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (template_id) DO UPDATE SET
                    team_name = EXCLUDED.team_name,
                    execution_mode = EXCLUDED.execution_mode,
                    agent_sequence = EXCLUDED.agent_sequence,
                    dependencies = EXCLUDED.dependencies,
                    timeout_config = EXCLUDED.timeout_config,
                    retry_config = EXCLUDED.retry_config,
                    version = EXCLUDED.version + 1,
                    is_active = EXCLUDED.is_active,
                    updated_at = NOW()
                """
                
                await conn.execute(
                    query,
                    template.template_id,
                    template.team_name,
                    template.execution_mode,
                    agent_sequence_json,
                    dependencies_json,
                    timeout_config_json,
                    retry_config_json,
                    template.version,
                    template.is_active
                )
                
                # 清除缓存
                if template.team_name in self._cache:
                    del self._cache[template.team_name]
                
                logger.info(f"[TEMPLATE_REPO] 模板保存成功: {template.template_id}")
                return True
                
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] 保存模板失败: {e}")
            return False
    
    async def load_template(self, team_name: str) -> Optional[TeamExecutionTemplate]:
        """从数据库加载模板"""
        try:
            # 检查缓存
            if team_name in self._cache:
                cached_time = getattr(self._cache[team_name], '_cached_time', 0)
                if cached_time + self._cache_ttl > asyncio.get_event_loop().time():
                    logger.debug(f"[TEMPLATE_REPO] 使用缓存模板: {team_name}")
                    return self._cache[team_name]
            
            # 使用MCP查询数据库
            try:
                # 导入MCP工具
                import sys
                import os
                sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
                
                # 这里我们使用简单的方法，直接调用MCP查询
                query_result = await self._query_template_from_mcp(team_name)
                
                if query_result:
                    template = self._parse_query_result(query_result)
                    if template:
                        # 缓存结果
                        setattr(template, '_cached_time', asyncio.get_event_loop().time())
                        self._cache[team_name] = template
                        logger.info(f"[TEMPLATE_REPO] 模板加载成功: {team_name}")
                        return template
                
            except Exception as db_error:
                logger.error(f"[TEMPLATE_REPO] 数据库查询失败: {db_error}")
            
            # 如果数据库查询失败，返回默认模板
            logger.warning(f"[TEMPLATE_REPO] 使用默认模板: {team_name}")
            return await self.get_default_template(team_name)
            
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] 加载模板失败: {e}")
            return None
    
    async def _query_template_from_mcp(self, team_name: str) -> Optional[Dict]:
        """使用MCP工具查询模板"""
        try:
            # 这里需要实现MCP查询逻辑
            # 暂时使用占位符，实际使用时需要集成MCP
            logger.warning(f"[TEMPLATE_REPO] MCP查询暂未实现，返回None: {team_name}")
            return None
            
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] MCP查询异常: {e}")
            return None
    
    def _parse_query_result(self, result: Dict) -> Optional[TeamExecutionTemplate]:
        """解析查询结果"""
        try:
            # 解析JSON字段
            agent_sequence_data = json.loads(result.get('agent_sequence', '[]'))
            dependencies_data = json.loads(result.get('dependencies', '{}'))
            timeout_config_data = json.loads(result.get('timeout_config', '{}'))
            retry_config_data = json.loads(result.get('retry_config', '{}'))
            
            template_data = {
                'template_id': result.get('template_id'),
                'team_name': result.get('team_name'),
                'execution_mode': result.get('execution_mode', 'sequential'),
                'agent_sequence': agent_sequence_data,
                'dependencies': dependencies_data,
                'timeout_config': timeout_config_data,
                'retry_config': retry_config_data,
                'version': result.get('version', 1),
                'is_active': result.get('is_active', True),
                'created_at': result.get('created_at'),
                'updated_at': result.get('updated_at')
            }
            
            return TeamExecutionTemplate.from_dict(template_data)
            
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] 解析查询结果失败: {e}")
            return None
    
    async def get_default_template(self, team_name: str) -> TeamExecutionTemplate:
        """获取默认模板"""
        if team_name == "geopolymer_qa_team_v2":
            return TeamExecutionTemplate(
                template_id="geopolymer_qa_template_v1",
                team_name="geopolymer_qa_team_v2",
                execution_mode="sequential",
                agent_sequence=[
                    # 决策三元组 - 优先级最高
                    AgentExecutionConfig(agent="question_decomposition_agent", timeout=15, retry=1, priority=1),
                    AgentExecutionConfig(agent="intelligent_routing_agent", timeout=10, retry=1, priority=2),
                    AgentExecutionConfig(agent="dag_reconstruction_agent", timeout=10, retry=1, priority=3),
                    # 功能Agent - 根据决策动态调用
                    AgentExecutionConfig(agent="translation_agent", timeout=10, retry=2, priority=4),
                    AgentExecutionConfig(agent="knowledge_retrieval_agent", timeout=15, retry=1, priority=5),
                    AgentExecutionConfig(agent="knowledge_graph_agent", timeout=30, retry=1, priority=6),
                    AgentExecutionConfig(agent="summary_answer_agent", timeout=25, retry=2, priority=7)
                ],
                dependencies={
                    # 决策链依赖
                    "intelligent_routing_agent": ["question_decomposition_agent"],
                    "dag_reconstruction_agent": ["intelligent_routing_agent"],
                    # 功能Agent依赖（动态调用，不严格依赖）
                    "knowledge_retrieval_agent": ["translation_agent"],
                    "knowledge_graph_agent": ["translation_agent"],
                    "summary_answer_agent": []  # 可独立执行（快速模式）
                },
                timeout_config={
                    "total": 300,
                    "agent": 30,
                    "step": 15,
                    "translation": 10,
                    "retrieval": 15,
                    "graph_query": 30,
                    "summary": 25
                },
                retry_config={
                    "max_retries": 2,
                    "backoff_factor": 1.5,
                    "agent_specific": {
                        "translation_agent": {"max_retries": 2},
                        "knowledge_retrieval_agent": {"max_retries": 1},
                        "knowledge_graph_agent": {"max_retries": 1},
                        "summary_answer_agent": {"max_retries": 2}
                    }
                }
            )
        else:
            # 其他团队的默认模板
            return TeamExecutionTemplate(
                template_id=f"{team_name}_default_v1",
                team_name=team_name,
                execution_mode="sequential",
                agent_sequence=[
                    AgentExecutionConfig(agent="default_agent", timeout=30, retry=1, priority=1)
                ],
                dependencies={},
                timeout_config={"total": 120, "agent": 30},
                retry_config={"max_retries": 1, "backoff_factor": 1.0}
            )
    
    async def list_templates(self, active_only: bool = True) -> List[TeamExecutionTemplate]:
        """列出所有模板"""
        try:
            # 这里应该查询数据库获取所有模板
            # 暂时返回默认模板列表
            templates = [
                await self.get_default_template("geopolymer_qa_team_v2")
            ]
            
            if active_only:
                templates = [t for t in templates if t.is_active]
            
            return templates
            
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] 列出模板失败: {e}")
            return []
    
    async def delete_template(self, template_id: str) -> bool:
        """删除模板（软删除，设置is_active=false）"""
        try:
            # 这里应该更新数据库
            # 暂时只清除缓存
            to_remove = []
            for team_name, template in self._cache.items():
                if template.template_id == template_id:
                    to_remove.append(team_name)
            
            for team_name in to_remove:
                del self._cache[team_name]
            
            logger.info(f"[TEMPLATE_REPO] 模板删除成功: {template_id}")
            return True
            
        except Exception as e:
            logger.error(f"[TEMPLATE_REPO] 删除模板失败: {e}")
            return False


# 全局模板仓库实例
template_repository = TeamTemplateRepository()