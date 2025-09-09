#!/usr/bin/env python3
"""
应用任务队列系统迁移脚本

此脚本将创建任务队列系统所需的数据库表
"""

import asyncio
import sys
import re
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy import text
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("❌ PostgreSQL SDK未安装")

def split_sql_statements(sql_content: str) -> list:
    """智能分割SQL语句"""
    statements = []
    current_statement = ""
    in_function = False
    in_do_block = False
    
    lines = sql_content.split('\n')
    for line in lines:
        stripped = line.strip()
        
        # 跳过注释行和空行
        if stripped.startswith('--') or not stripped:
            continue
        
        # 检测函数开始
        if any(keyword in line.upper() for keyword in ['CREATE OR REPLACE FUNCTION', 'CREATE FUNCTION']):
            in_function = True
        
        # 检测DO块开始
        if stripped.upper().startswith('DO $$'):
            in_do_block = True
        
        current_statement += line + '\n'
        
        # 检测函数结束
        if in_function and ('$$ language' in line.lower() or '$$ LANGUAGE' in line):
            in_function = False
            if current_statement.strip():
                statements.append(current_statement.strip())
            current_statement = ""
            continue
        
        # 检测DO块结束
        if in_do_block and stripped == '$$;':
            in_do_block = False
            if current_statement.strip():
                statements.append(current_statement.strip())
            current_statement = ""
            continue
        
        # 普通语句以分号结尾且不在函数或DO块中
        if not in_function and not in_do_block and stripped.endswith(';'):
            if current_statement.strip():
                statements.append(current_statement.strip())
            current_statement = ""
    
    # 添加剩余内容
    if current_statement.strip():
        statements.append(current_statement.strip())
    
    # 过滤掉空语句
    return [stmt for stmt in statements if stmt.strip()]

async def create_update_function():
    """创建更新时间戳的函数（如果不存在）"""
    return """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE 'plpgsql';
    """

async def apply_task_queue_migration():
    """应用任务队列系统迁移"""
    if not POSTGRES_AVAILABLE:
        return False
    
    # 生产环境PostgreSQL配置
    postgres_config = {
        "host": "8.153.90.125",
        "port": "5432",
        "database": "mat_demo", 
        "username": "mat_demo",
        "password": "NfWNH0mypEtjKETrsVqQg=="
    }
    
    try:
        # 创建数据库引擎
        db_url = f"postgresql+asyncpg://{postgres_config['username']}:{postgres_config['password']}@{postgres_config['host']}:{postgres_config['port']}/{postgres_config['database']}"
        engine = create_async_engine(db_url)
        
        print("✅ PostgreSQL连接成功")
        
        # 读取迁移文件
        migration_file = project_root / "migrations" / "20250120_add_task_queue_system.sql"
        
        if not migration_file.exists():
            print(f"❌ 迁移文件不存在: {migration_file}")
            return False
        
        print(f"📄 读取迁移文件: {migration_file}")
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("🔄 开始应用迁移...")
        
        # 首先创建更新时间戳函数
        async with engine.begin() as conn:
            update_function_sql = await create_update_function()
            print("🔧 创建更新时间戳函数...")
            await conn.execute(text(update_function_sql))
        
        # 分割SQL语句
        print("🔧 分析SQL语句...")
        statements = split_sql_statements(migration_sql)
        print(f"   发现 {len(statements)} 个SQL语句")
        
        # 逐一执行语句
        success_count = 0
        for i, statement in enumerate(statements, 1):
            try:
                async with engine.begin() as conn:
                    print(f"   执行语句 {i}/{len(statements)}: {statement[:50]}...")
                    await conn.execute(text(statement))
                    success_count += 1
            except Exception as e:
                print(f"   ❌ 语句 {i} 执行失败: {e}")
                print(f"   语句内容: {statement[:200]}...")
                # 继续执行其他语句
        
        print(f"✅ 成功执行 {success_count}/{len(statements)} 个语句")
        
        # 验证表是否创建成功
        print("\n📊 验证迁移结果...")
        async with engine.begin() as conn:
            # 检查各个表是否存在
            tables_to_check = [
                'task_queue',
                'task_locks', 
                'task_workers',
                'task_statistics'
            ]
            
            created_tables = []
            for table in tables_to_check:
                result = await conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{table}'
                    );
                """))
                exists = result.scalar()
                
                if exists:
                    print(f"   ✅ 表 {table} 创建成功")
                    created_tables.append(table)
                else:
                    print(f"   ❌ 表 {table} 创建失败")
        
        # 关闭引擎
        await engine.dispose()
        
        if len(created_tables) == len(tables_to_check):
            print("\n🎉 任务队列系统迁移完成！")
            return True
        else:
            print(f"\n⚠️  部分表创建失败，成功: {len(created_tables)}/{len(tables_to_check)}")
            return False
        
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        return False

async def check_current_tables():
    """检查当前数据库中的表"""
    postgres_config = {
        "host": "8.153.90.125",
        "port": "5432",
        "database": "mat_demo", 
        "username": "mat_demo",
        "password": "NfWNH0mypEtjKETrsVqQg=="
    }
    
    try:
        db_url = f"postgresql+asyncpg://{postgres_config['username']}:{postgres_config['password']}@{postgres_config['host']}:{postgres_config['port']}/{postgres_config['database']}"
        engine = create_async_engine(db_url)
        
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
            print("📋 当前数据库中的表:")
            for table in tables:
                print(f"   - {table}")
            
            print(f"\n总计: {len(tables)} 个表")
        
        await engine.dispose()
        return tables
        
    except Exception as e:
        print(f"❌ 检查表失败: {e}")
        return []

def main():
    print("🔧 任务队列系统迁移脚本")
    print("=" * 50)
    
    # 检查当前表
    print("1️⃣ 检查当前数据库表...")
    current_tables = asyncio.run(check_current_tables())
    
    # 检查是否需要迁移
    task_queue_tables = ['task_queue', 'task_locks', 'task_workers', 'task_statistics']
    missing_tables = [table for table in task_queue_tables if table not in current_tables]
    
    if not missing_tables:
        print("\n✅ 任务队列系统表已存在，无需迁移")
        return
    
    print(f"\n⚠️  缺失的表: {', '.join(missing_tables)}")
    
    # 确认执行迁移
    user_input = input("\n是否要应用任务队列系统迁移？(输入 'yes' 确认): ")
    if user_input.lower() != 'yes':
        print("❌ 迁移已取消")
        return
    
    # 执行迁移
    print("\n2️⃣ 应用迁移...")
    success = asyncio.run(apply_task_queue_migration())
    
    if success:
        print("\n✅ 任务队列系统迁移成功！")
        
        # 再次检查表状态
        print("\n3️⃣ 最终验证...")
        final_tables = asyncio.run(check_current_tables())
        final_missing = [table for table in task_queue_tables if table not in final_tables]
        
        if not final_missing:
            print("🎯 所有必需的表都已创建！")
        else:
            print(f"⚠️  仍有表缺失: {', '.join(final_missing)}")
    else:
        print("\n❌ 任务队列系统迁移失败！")

if __name__ == "__main__":
    main() 