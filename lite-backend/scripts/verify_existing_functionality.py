#!/usr/bin/env python3
"""
验证现有功能脚本
确保数据库变更不会影响现有功能
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db_session
from sqlalchemy import text
from core.logger import logger

async def verify_existing_tables():
    """验证现有表是否正常"""
    
    logger.info("验证现有表...")
    
    async with get_db_session() as session:
        # 检查现有表
        existing_tables = [
            'conversations',
            'conversation_messages'
        ]
        
        for table_name in existing_tables:
            try:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                logger.info(f"✅ 表 {table_name} 正常，记录数: {count}")
            except Exception as e:
                logger.error(f"❌ 表 {table_name} 异常: {e}")
                return False
        
        return True

async def verify_existing_queries():
    """验证现有查询是否正常"""
    
    logger.info("验证现有查询...")
    
    async with get_db_session() as session:
        # 测试基本查询
        test_queries = [
            "SELECT COUNT(*) FROM conversations",
            "SELECT COUNT(*) FROM conversation_messages",
            "SELECT * FROM conversations LIMIT 1",
            "SELECT * FROM conversation_messages LIMIT 1"
        ]
        
        for i, query in enumerate(test_queries, 1):
            try:
                result = await session.execute(text(query))
                if query.startswith("SELECT COUNT"):
                    count = result.scalar()
                    logger.info(f"✅ 查询 {i}: {query} - 结果: {count}")
                else:
                    rows = result.fetchall()
                    logger.info(f"✅ 查询 {i}: {query} - 返回 {len(rows)} 行")
            except Exception as e:
                logger.error(f"❌ 查询 {i} 失败: {query} - 错误: {e}")
                return False
        
        return True

async def verify_table_structure():
    """验证表结构"""
    
    logger.info("验证表结构...")
    
    async with get_db_session() as session:
        # 检查conversation_messages表的字段
        try:
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'conversation_messages' 
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()
            
            logger.info("conversation_messages表字段:")
            for col in columns:
                logger.info(f"  - {col[0]}: {col[1]} (NULL: {col[2]})")
            
            # 检查是否有新字段
            new_fields = ['team_id', 'team_name', 'team_mode', 'execution_id', 'member_calls', 'structured_output', 'coordination_info']
            existing_fields = [col[0] for col in columns]
            
            for field in new_fields:
                if field in existing_fields:
                    logger.info(f"✅ 新字段 {field} 已存在")
                else:
                    logger.info(f"ℹ️  新字段 {field} 尚未添加")
            
        except Exception as e:
            logger.error(f"❌ 表结构验证失败: {e}")
            return False
        
        return True

async def verify_data_integrity():
    """验证数据完整性"""
    
    logger.info("验证数据完整性...")
    
    async with get_db_session() as session:
        # 检查外键关系
        try:
            # 检查conversation_messages的conversation_id外键
            result = await session.execute(text("""
                SELECT COUNT(*) 
                FROM conversation_messages cm
                LEFT JOIN conversations c ON cm.conversation_id = c.id
                WHERE c.id IS NULL AND cm.conversation_id IS NOT NULL
            """))
            orphan_count = result.scalar()
            
            if orphan_count == 0:
                logger.info("✅ 外键关系完整，无孤立记录")
            else:
                logger.warning(f"⚠️  发现 {orphan_count} 条孤立记录")
            
        except Exception as e:
            logger.error(f"❌ 数据完整性验证失败: {e}")
            return False
        
        return True

async def verify_performance():
    """验证查询性能"""
    
    logger.info("验证查询性能...")
    
    async with get_db_session() as session:
        # 测试关键查询的性能
        performance_queries = [
            "SELECT * FROM conversation_messages WHERE conversation_id = 1",
            "SELECT * FROM conversations WHERE session_id LIKE '%test%'",
            "SELECT COUNT(*) FROM conversation_messages WHERE message_type = 'ai'"
        ]
        
        for i, query in enumerate(performance_queries, 1):
            try:
                start_time = datetime.now()
                result = await session.execute(text(query))
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                if duration < 1.0:  # 1秒内完成
                    logger.info(f"✅ 查询 {i} 性能正常: {duration:.3f}s")
                else:
                    logger.warning(f"⚠️  查询 {i} 性能较慢: {duration:.3f}s")
                
            except Exception as e:
                logger.error(f"❌ 性能测试查询 {i} 失败: {e}")
                return False
        
        return True

async def verify_new_tables():
    """验证新表是否创建成功"""
    
    logger.info("验证新表...")
    
    async with get_db_session() as session:
        # 检查新表
        new_tables = [
            'team_sessions',
            'team_executions',
            'team_execution_steps',
            'team_members',
            'langdb_metrics'
        ]
        
        for table_name in new_tables:
            try:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                logger.info(f"✅ 新表 {table_name} 创建成功，记录数: {count}")
            except Exception as e:
                logger.info(f"ℹ️  新表 {table_name} 尚未创建: {e}")
        
        return True

async def main():
    """主验证函数"""
    
    logger.info("=" * 60)
    logger.info("现有功能验证工具")
    logger.info("=" * 60)
    
    # 执行各项验证
    verifications = [
        ("现有表验证", verify_existing_tables),
        ("现有查询验证", verify_existing_queries),
        ("表结构验证", verify_table_structure),
        ("数据完整性验证", verify_data_integrity),
        ("性能验证", verify_performance),
        ("新表验证", verify_new_tables)
    ]
    
    results = []
    
    for name, verification_func in verifications:
        logger.info(f"\n--- {name} ---")
        try:
            result = await verification_func()
            results.append((name, result))
            if result:
                logger.info(f"✅ {name} 通过")
            else:
                logger.error(f"❌ {name} 失败")
        except Exception as e:
            logger.error(f"❌ {name} 异常: {e}")
            results.append((name, False))
    
    # 总结
    logger.info("\n" + "=" * 60)
    logger.info("验证结果总结")
    logger.info("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        logger.info(f"{name}: {status}")
    
    logger.info(f"\n总体结果: {passed}/{total} 项验证通过")
    
    if passed == total:
        logger.info("🎉 所有验证通过！现有功能未受影响。")
        return True
    else:
        logger.error("⚠️  部分验证失败，请检查相关问题。")
        return False

if __name__ == "__main__":
    # 设置日志级别
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 运行验证
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 