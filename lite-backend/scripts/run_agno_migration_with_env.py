#!/usr/bin/env python3
"""
设置环境变量并运行Agno Team迁移脚本
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.logger import logger

def load_env_file():
    """加载.env文件并设置环境变量"""
    
    logger.info("加载环境变量...")
    
    env_file = project_root / ".env"
    if not env_file.exists():
        logger.error(f".env文件不存在: {env_file}")
        return False
    
    # 读取.env文件
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value
                logger.debug(f"设置环境变量: {key}")
    
    # 构建DATABASE_URL
    postgresql_host = os.getenv('POSTGRESQL_HOST', 'localhost')
    postgresql_port = os.getenv('POSTGRESQL_PORT', '5432')
    postgresql_database = os.getenv('POSTGRESQL_DATABASE', 'mat_demo')
    postgresql_username = os.getenv('POSTGRESQL_USERNAME', 'mat_demo')
    postgresql_password = os.getenv('POSTGRESQL_PASSWORD', '')
    
    if postgresql_password:
        database_url = f"postgresql://{postgresql_username}:{postgresql_password}@{postgresql_host}:{postgresql_port}/{postgresql_database}"
        os.environ['DATABASE_URL'] = database_url
        logger.info(f"设置DATABASE_URL: postgresql://{postgresql_username}:***@{postgresql_host}:{postgresql_port}/{postgresql_database}")
    
    return True

async def run_agno_migration():
    """运行Agno Team迁移"""
    
    logger.info("运行Agno Team迁移...")
    
    try:
        # 导入迁移模块
        from scripts.apply_agno_team_migration import apply_agno_team_migration
        
        # 执行迁移
        success = await apply_agno_team_migration()
        
        if success:
            logger.info("✅ Agno Team迁移执行成功")
            return True
        else:
            logger.error("❌ Agno Team迁移执行失败")
            return False
            
    except Exception as e:
        logger.error(f"迁移执行出错: {e}")
        return False

async def main():
    """主函数"""
    
    logger.info("=" * 60)
    logger.info("Agno Team迁移工具（带环境变量设置）")
    logger.info("=" * 60)
    
    # 1. 加载环境变量
    if not load_env_file():
        logger.error("环境变量加载失败")
        return False
    
    # 2. 验证必要的环境变量
    required_vars = [
        'DATABASE_URL',
        'POSTGRESQL_HOST',
        'POSTGRESQL_PORT',
        'POSTGRESQL_DATABASE',
        'POSTGRESQL_USERNAME',
        'POSTGRESQL_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"缺少必要的环境变量: {missing_vars}")
        return False
    
    logger.info("✅ 所有必要的环境变量已设置")
    
    # 3. 运行迁移
    success = await run_agno_migration()
    
    if success:
        logger.info("=" * 60)
        logger.info("🎉 Agno Team迁移完成！")
        logger.info("=" * 60)
        return True
    else:
        logger.error("=" * 60)
        logger.error("💥 Agno Team迁移失败！")
        logger.error("=" * 60)
        return False

if __name__ == "__main__":
    # 设置日志级别
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 运行迁移
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 