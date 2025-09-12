"""
NextAgentLite - Youtu-Agent 真实集成
基于腾讯开源的 youtu-agent 框架的完整集成实现
"""

from .core import YoutuAgentCore
from .services import YoutuAgentService, MetaAgentService, HybridAgentService
from .api import youtu_agent_router

__all__ = [
    "YoutuAgentCore",
    "YoutuAgentService", 
    "MetaAgentService",
    "HybridAgentService",
    "youtu_agent_router"
]

__version__ = "1.0.0"
__title__ = "NextAgentLite Youtu-Agent Integration"
__description__ = "真实的youtu-agent框架集成，支持SimpleAgent、OrchestraAgent和Meta-Agent"