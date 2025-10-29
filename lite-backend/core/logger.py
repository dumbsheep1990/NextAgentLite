"""
NextAgentLite 智能体平台日志配置
"""
import sys
from loguru import logger
from core.config_optimized import optimized_config_manager

# 移除默认处理器
logger.remove()

# 添加自定义格式化处理器
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=getattr(optimized_config_manager.settings, 'log_level', None) or optimized_config_manager.settings.logging_level,
    colorize=True
)

# 添加文件处理器用于持久化日志
logger.add(
    "logs/agent_lite_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)

def setup_logger(name: str = None):
    """
    设置并返回指定名称的日志记录器
    
    Args:
        name: 日志记录器名称，如果为None则返回默认logger
    
    Returns:
        配置好的logger实例
    """
    if name:
        return logger.bind(name=name)
    return logger 