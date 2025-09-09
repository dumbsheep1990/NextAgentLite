#!/usr/bin/env python3
"""
手动执行数据库迁移 - 添加graph_sources字段
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def run_migration():
    """执行数据库迁移"""
    try:
        print("🔧 开始执行数据库迁移：添加graph_sources字段...")
        
        # 导入数据库配置
        from core.database import get_database_pool, DATABASE_URL
        
        print(f"📍 数据库连接: {DATABASE_URL}")
        
        # 获取数据库连接池
        pool = await get_database_pool()
        
        async with pool.acquire() as connection:
            print("✅ 数据库连接成功")
            
            # 1. 检查字段是否已存在
            print("1️⃣ 检查graph_sources字段是否存在...")
            check_query = """
                SELECT COUNT(*) as count
                FROM information_schema.columns 
                WHERE table_name = 'conversation_messages' 
                AND column_name = 'graph_sources'
            """
            
            result = await connection.fetchrow(check_query)
            field_exists = result['count'] > 0
            
            if field_exists:
                print("⚠️ graph_sources字段已存在，跳过添加")
            else:
                print("2️⃣ 添加graph_sources字段...")
                add_field_query = """
                    ALTER TABLE conversation_messages 
                    ADD COLUMN graph_sources JSONB
                """
                await connection.execute(add_field_query)
                print("✅ 成功添加graph_sources字段")
            
            # 3. 添加索引（如果不存在）
            print("3️⃣ 检查并添加graph_sources索引...")
            check_index_query = """
                SELECT COUNT(*) as count
                FROM pg_indexes 
                WHERE tablename = 'conversation_messages' 
                AND indexname = 'idx_conversation_messages_graph_sources'
            """
            
            result = await connection.fetchrow(check_index_query)
            index_exists = result['count'] > 0
            
            if index_exists:
                print("⚠️ graph_sources索引已存在，跳过添加")
            else:
                add_index_query = """
                    CREATE INDEX idx_conversation_messages_graph_sources 
                    ON conversation_messages USING gin(graph_sources)
                """
                await connection.execute(add_index_query)
                print("✅ 成功添加graph_sources索引")
            
            # 4. 添加注释
            print("4️⃣ 添加字段注释...")
            comment_query = """
                COMMENT ON COLUMN conversation_messages.graph_sources 
                IS '知识图谱检索结果，包含entities、relationships、sources等信息'
            """
            await connection.execute(comment_query)
            print("✅ 成功添加字段注释")
            
        await pool.close()
        print("🎉 数据库迁移完成！")
        
        # 5. 验证迁移结果
        print("5️⃣ 验证迁移结果...")
        pool = await get_database_pool()
        async with pool.acquire() as connection:
            verify_query = """
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'conversation_messages' 
                AND column_name = 'graph_sources'
            """
            result = await connection.fetchrow(verify_query)
            
            if result:
                print(f"✅ 迁移验证成功:")
                print(f"   - 字段名: {result['column_name']}")
                print(f"   - 数据类型: {result['data_type']}")  
                print(f"   - 允许NULL: {result['is_nullable']}")
            else:
                print("❌ 迁移验证失败：未找到graph_sources字段")
                return False
                
        await pool.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(run_migration())
    if success:
        print("\n🚀 数据库迁移成功完成！conversation_messages表现在支持graph_sources字段。")
    else:
        print("\n⚠️ 数据库迁移失败，请检查错误信息。")