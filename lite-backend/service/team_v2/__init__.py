"""
新Team执行系统 v2
基于单实例管理和固定DAG模板的Team执行架构
解决多重实例创建导致的SSE流中断问题
"""

from .singleton_team_manager import SingletonTeamManager
from .team_execution_template import TeamExecutionTemplate, TeamTemplateRepository
from .new_team_execution_service import NewTeamExecutionService
from .execution_tracker import ExecutionTracker
from .team_resource_manager import TeamResourceManager
from .sse_data_adapter import SSEDataAdapter

__all__ = [
    'SingletonTeamManager',
    'TeamExecutionTemplate', 
    'TeamTemplateRepository',
    'NewTeamExecutionService',
    'ExecutionTracker',
    'TeamResourceManager',
    'SSEDataAdapter'
]

__version__ = '2.0.0'