#!/usr/bin/env python3
"""
PostgreSQL数据清理修复脚本

修复生产环境清理过程中PostgreSQL清理失败的问题
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("❌ PostgreSQL SDK未安装")

async def clear_postgres_data():
    """清理PostgreSQL中的相关数据"""
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
        
        results = {
            "cleared_tables": [],
            "total_deleted": 0,
            "errors": []
        }
        
        # 需要清理的表列表
        tables_to_clear = [
            "knowledge_documents",
            "task_queue", 
            "task_dependencies",
            "task_locks"
        ]
        
        # 为每个表使用独立的事务
        for table in tables_to_clear:
            try:
                async with engine.begin() as conn:
                    print(f"\n🗑️  正在清理表: {table}")
                    
                    # 先检查表是否存在
                    table_exists_query = text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = :table_name
                        );
                    """)
                    
                    table_exists_result = await conn.execute(table_exists_query, {"table_name": table})
                    table_exists = table_exists_result.scalar()
                    
                    if not table_exists:
                        print(f"   ⚠️  表 {table} 不存在，跳过")
                        results["cleared_tables"].append({
                            "table": table,
                            "deleted": 0,
                            "note": "表不存在"
                        })
                        continue
                    
                    # 获取行数
                    count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = count_result.scalar()
                    
                    if row_count > 0:
                        # 删除所有数据
                        await conn.execute(text(f"DELETE FROM {table}"))
                        results["total_deleted"] += row_count
                        
                        print(f"   ✅ 表 {table}: 删除 {row_count} 行")
                    else:
                        print(f"   ✅ 表 {table}: 已为空")
                    
                    results["cleared_tables"].append({
                        "table": table,
                        "deleted": row_count
                    })
                    
            except Exception as e:
                error_msg = f"清理表 {table} 失败: {e}"
                print(f"   ❌ {error_msg}")
                results["errors"].append(error_msg)
        
        # 关闭引擎
        await engine.dispose()
        
        print(f"\n🎉 PostgreSQL清理完成！")
        print(f"   总共删除 {results['total_deleted']} 行记录")
        
        if results["errors"]:
            print(f"   ⚠️  共有 {len(results['errors'])} 个错误")
            for error in results["errors"]:
                print(f"     - {error}")
        
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL连接或操作失败: {e}")
        return False

def main():
    print("🔧 PostgreSQL清理修复脚本")
    print("=" * 40)
    
    # 确认操作
    user_input = input("是否要清理PostgreSQL中的所有相关数据？(输入 'yes' 确认): ")
    if user_input.lower() != 'yes':
        print("❌ 操作已取消")
        return
    
    # 执行清理
    success = asyncio.run(clear_postgres_data())
    
    if success:
        print("\n✅ PostgreSQL修复清理完成！")
    else:
        print("\n❌ PostgreSQL修复清理失败！")

if __name__ == "__main__":
    main() 