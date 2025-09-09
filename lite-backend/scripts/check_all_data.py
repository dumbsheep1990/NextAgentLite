#!/usr/bin/env python3
"""
检查所有数据表状态脚本

详细检查PostgreSQL中所有业务相关表的数据状态
"""

import asyncio
import sys
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

async def check_all_data():
    """检查所有相关数据表的状态"""
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
        
        # 需要检查的业务相关表
        business_tables = [
            'knowledge_documents',
            'qa_datasets', 
            'qa_pairs',
            'qa_categories',
            'document_chunks',
            'papers',
            'task_queue',
            'task_locks',
            'task_workers',
            'file_processing_tasks',
            'multimodal_tasks',
            'conversations',
            'conversation_messages',
            'media_files',
            'system_logs',
            'retrieval_results',
            'vector_configs',
            'chunking_configs'
        ]
        
        print("📊 业务数据表检查:")
        print("=" * 60)
        
        total_data_count = 0
        non_empty_tables = []
        
        async with engine.begin() as conn:
            for table in business_tables:
                try:
                    # 检查表是否存在
                    table_exists_result = await conn.execute(text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = :table_name
                        );
                    """), {"table_name": table})
                    table_exists = table_exists_result.scalar()
                    
                    if not table_exists:
                        print(f"   ⚠️  {table:<25} : 表不存在")
                        continue
                    
                    # 获取行数
                    count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = count_result.scalar()
                    
                    if row_count > 0:
                        print(f"   🔴 {table:<25} : {row_count} 行 ⚠️")
                        non_empty_tables.append((table, row_count))
                        total_data_count += row_count
                        
                        # 如果是关键表，显示一些详细信息
                        if table in ['knowledge_documents', 'qa_datasets', 'qa_pairs'] and row_count <= 10:
                            try:
                                detail_result = await conn.execute(text(f"SELECT * FROM {table} LIMIT 3"))
                                rows = detail_result.fetchall()
                                for i, row in enumerate(rows):
                                    print(f"       行{i+1}: {dict(row)}")
                            except:
                                pass
                    else:
                        print(f"   ✅ {table:<25} : 0 行")
                        
                except Exception as e:
                    print(f"   ❌ {table:<25} : 检查失败 - {e}")
        
        print("\n" + "=" * 60)
        print(f"📈 总计: {total_data_count} 行数据")
        
        if non_empty_tables:
            print(f"⚠️  {len(non_empty_tables)} 个表仍有数据:")
            for table, count in non_empty_tables:
                print(f"   - {table}: {count} 行")
        else:
            print("✅ 所有业务表都已清空")
        
        # 关闭引擎
        await engine.dispose()
        return non_empty_tables
        
    except Exception as e:
        print(f"❌ 检查失败: {e}")
        return []

def main():
    print("🔍 数据表状态详细检查")
    print("=" * 50)
    
    # 执行检查
    non_empty_tables = asyncio.run(check_all_data())
    
    if non_empty_tables:
        print(f"\n⚠️  发现 {len(non_empty_tables)} 个表仍有数据，需要清理！")
    else:
        print("\n✅ 所有数据表检查完成，数据已清空")

if __name__ == "__main__":
    main() 