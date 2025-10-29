"""
数据库连接池管理 - 为API endpoints提供asyncpg连接池
"""

import asyncpg
import logging
from typing import Optional

from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)

# 全局连接池
_db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """获取数据库连接池（用于FastAPI Depends）

    Returns:
        asyncpg.Pool实例
    """
    global _db_pool

    if _db_pool is None:
        db_config = optimized_config_manager.settings.database_postgresql

        _db_pool = await asyncpg.create_pool(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database,
            min_size=2,
            max_size=20,
            command_timeout=60
        )
        logger.info("✅ 全局数据库连接池已创建")

    return _db_pool


async def close_db_pool():
    """关闭数据库连接池"""
    global _db_pool

    if _db_pool:
        await _db_pool.close()
        _db_pool = None
        logger.info("数据库连接池已关闭")
