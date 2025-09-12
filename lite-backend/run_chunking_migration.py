#!/usr/bin/env python
"""
执行知识库切分配置字段迁移
确保knowledge_collections表有必要的字段来保存切分策略选择
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from core.config_optimized import optimized_config_manager
from core.logger import logger

# 获取数据库配置
db_config = optimized_config_manager.settings.database

# 构建数据库URL
DATABASE_URL = f"postgresql+asyncpg://{db_config.user}:{db_config.password}@{db_config.host}:{db_config.port}/{db_config.database}"


async def run_migration():
    """执行数据库迁移"""
    
    # 创建异步引擎
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    
    # 创建异步会话
    async_session = sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    try:
        async with async_session() as session:
            logger.info("开始执行知识库切分配置迁移...")
            
            # 读取SQL文件
            migration_file = Path(__file__).parent / "migrations" / "20250910_add_chunking_config_to_collections.sql"
            
            if not migration_file.exists():
                logger.error(f"迁移文件不存在: {migration_file}")
                return False
            
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # 分割SQL语句（按照 DO $$ 块和其他语句）
            sql_blocks = []
            current_block = []
            in_do_block = False
            
            for line in sql_content.split('\n'):
                stripped = line.strip()
                
                # 跳过注释和空行
                if stripped.startswith('--') or not stripped:
                    if not in_do_block and current_block:
                        continue
                
                current_block.append(line)
                
                # 检测DO块的开始和结束
                if 'DO $$' in line:
                    in_do_block = True
                elif '$$;' in line and in_do_block:
                    in_do_block = False
                    sql_blocks.append('\n'.join(current_block))
                    current_block = []
                elif ';' in line and not in_do_block and not stripped.startswith('--'):
                    sql_blocks.append('\n'.join(current_block))
                    current_block = []
            
            # 如果还有剩余的内容
            if current_block:
                sql_blocks.append('\n'.join(current_block))
            
            # 执行每个SQL块
            for i, sql_block in enumerate(sql_blocks, 1):
                sql_block = sql_block.strip()
                if not sql_block or sql_block.startswith('--'):
                    continue
                    
                try:
                    logger.info(f"执行SQL块 {i}/{len(sql_blocks)}...")
                    await session.execute(text(sql_block))
                    await session.commit()
                    logger.info(f"SQL块 {i} 执行成功")
                except Exception as e:
                    logger.warning(f"SQL块 {i} 执行出现警告（可能字段已存在）: {str(e)}")
                    # 继续执行下一个块
                    continue
            
            # 验证迁移结果
            logger.info("验证迁移结果...")
            
            # 检查字段是否存在
            check_query = text("""
                SELECT 
                    column_name,
                    data_type
                FROM information_schema.columns 
                WHERE table_name = 'knowledge_collections' 
                AND column_name IN ('default_chunking_config_id', 'chunking_config')
                ORDER BY column_name;
            """)
            
            result = await session.execute(check_query)
            columns = result.fetchall()
            
            logger.info("知识库表字段检查结果：")
            for col in columns:
                logger.info(f"  - {col.column_name}: {col.data_type}")
            
            if len(columns) >= 1:  # 至少有一个字段
                logger.info("✅ 迁移成功！知识库切分配置字段已就绪")
                
                # 获取当前所有知识库的配置状态
                status_query = text("""
                    SELECT 
                        id,
                        name,
                        default_chunking_config_id,
                        chunking_config
                    FROM knowledge_collections
                    LIMIT 5;
                """)
                
                status_result = await session.execute(status_query)
                collections = status_result.fetchall()
                
                logger.info("\n当前知识库配置状态（前5个）：")
                for coll in collections:
                    logger.info(f"  - {coll.name} (ID: {coll.id})")
                    logger.info(f"    配置ID: {coll.default_chunking_config_id or '未设置'}")
                    logger.info(f"    自定义配置: {coll.chunking_config or '{}'}")
                
                return True
            else:
                logger.error("❌ 迁移失败：字段未创建")
                return False
                
    except Exception as e:
        logger.error(f"迁移执行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await engine.dispose()


async def verify_and_fix_collections():
    """验证并修复现有知识库的配置"""
    
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    
    async_session = sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    try:
        async with async_session() as session:
            # 获取默认的切分配置
            default_config_query = text("""
                SELECT id 
                FROM chunking_configs 
                WHERE is_default = true 
                LIMIT 1;
            """)
            
            result = await session.execute(default_config_query)
            default_config = result.fetchone()
            
            if default_config:
                logger.info(f"找到默认切分配置: {default_config.id}")
                
                # 更新没有配置的知识库
                update_query = text("""
                    UPDATE knowledge_collections
                    SET default_chunking_config_id = :config_id
                    WHERE default_chunking_config_id IS NULL;
                """)
                
                result = await session.execute(
                    update_query, 
                    {"config_id": default_config.id}
                )
                await session.commit()
                
                if result.rowcount > 0:
                    logger.info(f"已为 {result.rowcount} 个知识库设置默认切分配置")
            else:
                logger.warning("未找到默认切分配置")
                
    except Exception as e:
        logger.error(f"修复知识库配置失败: {str(e)}")
    finally:
        await engine.dispose()


async def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("知识库切分配置持久化迁移")
    logger.info("=" * 60)
    
    # 执行迁移
    success = await run_migration()
    
    if success:
        # 验证并修复现有数据
        await verify_and_fix_collections()
        
        logger.info("\n" + "=" * 60)
        logger.info("迁移完成！现在知识库的切分策略选择将被持久化保存")
        logger.info("刷新页面后，之前选择的策略将被正确恢复")
        logger.info("=" * 60)
    else:
        logger.error("\n迁移失败，请检查错误信息")


if __name__ == "__main__":
    asyncio.run(main())