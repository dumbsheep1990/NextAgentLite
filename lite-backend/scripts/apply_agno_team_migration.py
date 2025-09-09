#!/usr/bin/env python3
"""
Agno Team数据库迁移执行脚本
执行Agno Team集成所需的数据库表结构变更
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db_session
from sqlalchemy import text
from core.logger import logger

async def apply_agno_team_migration():
    """执行Agno Team数据库迁移"""
    
    logger.info("开始执行Agno Team数据库迁移...")
    
    try:
        # 读取迁移SQL文件
        migration_file = project_root / "migrations" / "20250730_add_agno_team_tables_safe.sql"
        
        if not migration_file.exists():
            logger.error(f"迁移文件不存在: {migration_file}")
            return False
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        logger.info(f"读取迁移文件: {migration_file}")
        
        # 连接数据库
        async with get_db_session() as session:
            logger.info("数据库连接成功")
            
            # 分割SQL语句并逐个执行
            sql_statements = split_sql_statements(migration_sql)
            
            try:
                for i, statement in enumerate(sql_statements, 1):
                    if statement.strip() and not statement.strip().startswith('--'):
                        logger.info(f"执行SQL语句 {i}: {statement.strip()[:50]}...")
                        await session.execute(text(statement))
                
                await session.commit()
                logger.info("Agno Team数据库迁移执行成功")
                
                # 验证迁移结果
                await verify_migration(session)
                
                return True
                
            except Exception as e:
                await session.rollback()
                logger.error(f"迁移执行失败: {e}")
                return False
                
    except Exception as e:
        logger.error(f"迁移过程出错: {e}")
        return False

def split_sql_statements(sql_content):
    """分割SQL语句"""
    statements = []
    current_statement = ""
    
    for line in sql_content.split('\n'):
        line = line.strip()
        
        # 跳过注释和空行
        if line.startswith('--') or not line:
            continue
        
        current_statement += line + " "
        
        # 如果语句以分号结尾，则完成一个语句
        if line.endswith(';'):
            statements.append(current_statement.strip())
            current_statement = ""
    
    # 添加最后一个语句（如果没有分号结尾）
    if current_statement.strip():
        statements.append(current_statement.strip())
    
    return statements

async def verify_migration(session):
    """验证迁移结果"""
    
    logger.info("验证迁移结果...")
    
    # 检查新表是否创建成功
    tables_to_check = [
        'team_sessions',
        'team_executions', 
        'team_execution_steps',
        'team_members',
        'langdb_metrics'
    ]
    
    for table_name in tables_to_check:
        try:
            result = await session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar()
            logger.info(f"表 {table_name} 创建成功，记录数: {count}")
        except Exception as e:
            logger.error(f"表 {table_name} 验证失败: {e}")
    
    # 检查conversation_messages表的新字段
    try:
        result = await session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'conversation_messages' 
            AND column_name IN ('team_id', 'team_name', 'team_mode', 'execution_id', 'member_calls', 'structured_output', 'coordination_info')
        """))
        columns = [row[0] for row in result.fetchall()]
        logger.info(f"conversation_messages表新增字段: {columns}")
    except Exception as e:
        logger.error(f"conversation_messages表字段验证失败: {e}")
    
    # 检查视图是否创建成功
    views_to_check = [
        'team_execution_stats',
        'team_member_performance'
    ]
    
    for view_name in views_to_check:
        try:
            result = await session.execute(text(f"SELECT COUNT(*) FROM {view_name}"))
            count = result.scalar()
            logger.info(f"视图 {view_name} 创建成功，记录数: {count}")
        except Exception as e:
            logger.error(f"视图 {view_name} 验证失败: {e}")

async def main():
    """主函数"""
    
    logger.info("=" * 50)
    logger.info("Agno Team数据库迁移工具")
    logger.info("=" * 50)
    
    # 检查环境变量
    required_env_vars = [
        'DATABASE_URL',
        'POSTGRESQL_HOST',
        'POSTGRESQL_PORT',
        'POSTGRESQL_DATABASE',
        'POSTGRESQL_USERNAME',
        'POSTGRESQL_PASSWORD'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"缺少必要的环境变量: {missing_vars}")
        logger.error("请确保设置了正确的数据库连接环境变量")
        return False
    
    # 执行迁移
    success = await apply_agno_team_migration()
    
    if success:
        logger.info("=" * 50)
        logger.info("Agno Team数据库迁移完成！")
        logger.info("=" * 50)
        return True
    else:
        logger.error("=" * 50)
        logger.error("Agno Team数据库迁移失败！")
        logger.error("=" * 50)
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