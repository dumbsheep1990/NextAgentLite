#!/usr/bin/env python3
"""
完整数据清理脚本

彻底清理所有业务相关数据，包括PostgreSQL、Elasticsearch和MinIO
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

try:
    from minio import Minio
    from minio.deleteobjects import DeleteObject
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("❌ MinIO SDK未安装")

try:
    from elasticsearch import AsyncElasticsearch
    ES_AVAILABLE = True
except ImportError:
    ES_AVAILABLE = False
    print("❌ Elasticsearch SDK未安装")

async def complete_postgres_cleanup():
    """完整清理PostgreSQL中的所有业务数据"""
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
        
        # 需要清理的所有业务表（按依赖关系排序）
        business_tables = [
            # 消息和对话相关
            'conversation_messages',
            'conversations', 
            
            # 任务相关
            'task_locks',
            'task_queue',
            
            # QA数据相关
            'qa_pairs',
            'qa_categories', 
            'qa_datasets',
            
            # 文档和块相关  
            'document_chunks',
            'retrieval_results',
            'knowledge_documents',
            
            # 媒体文件
            'media_files',
            'message_media_files',
            
            # 处理任务
            'file_processing_tasks',
            'multimodal_tasks',
            'ocr_results',
            'video_analysis',
            
            # 配置相关
            'vector_configs',
            'chunking_configs',
            'model_configs',
            
            # 图相关
            'graph_edges',
            'graph_nodes', 
            'graph_snapshots',
            'graph_layouts',
            'graph_filters',
            'graph_stats',
            'graph_algorithm_executions',
            
            # 其他
            'papers',
            'system_logs',
        ]
        
        print("🗑️  开始清理PostgreSQL业务数据...")
        print("=" * 60)
        
        total_deleted = 0
        cleared_tables = []
        
        # 为每个表使用独立的事务
        for table in business_tables:
            try:
                async with engine.begin() as conn:
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
                        print(f"   ⚠️  {table:<25} : 表不存在，跳过")
                        continue
                    
                    # 获取行数
                    count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = count_result.scalar()
                    
                    if row_count > 0:
                        # 删除所有数据
                        print(f"   🗑️  {table:<25} : 删除 {row_count} 行...")
                        await conn.execute(text(f"DELETE FROM {table}"))
                        total_deleted += row_count
                        cleared_tables.append((table, row_count))
                        print(f"   ✅  {table:<25} : 成功删除 {row_count} 行")
                    else:
                        print(f"   ✅  {table:<25} : 已为空")
                        
            except Exception as e:
                print(f"   ❌  {table:<25} : 清理失败 - {e}")
        
        print("\n" + "=" * 60)
        print(f"🎉 PostgreSQL清理完成！总共删除 {total_deleted} 行数据")
        
        if cleared_tables:
            print("📋 已清理的表:")
            for table, count in cleared_tables:
                print(f"   - {table}: {count} 行")
        
        # 关闭引擎
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL清理失败: {e}")
        return False

async def complete_es_cleanup():
    """完整清理Elasticsearch数据"""
    if not ES_AVAILABLE:
        return False
    
    try:
        # ES配置
        es_config = {
            "url": "https://8.153.90.125:9200",
            "username": "elastic",
            "password": "MQxFuWBuooxLY2c2a8YE"
        }
        
        client = AsyncElasticsearch(
            [es_config["url"]],
            basic_auth=(es_config["username"], es_config["password"]),
            verify_certs=False,
            ssl_show_warn=False
        )
        
        print("✅ Elasticsearch连接成功")
        
        # 获取所有索引
        indices_response = await client.cat.indices(format="json")
        
        total_deleted = 0
        cleared_indices = []
        
        print("🗑️  开始清理Elasticsearch数据...")
        print("=" * 60)
        
        for index_info in indices_response:
            index_name = index_info['index']
            
            # 跳过系统索引
            if index_name.startswith('.'):
                continue
            
            doc_count = int(index_info.get('docs.count', 0))
            
            if doc_count > 0:
                print(f"   🗑️  {index_name:<30} : 删除 {doc_count} 个文档...")
                
                try:
                    # 删除索引中的所有文档
                    delete_response = await client.delete_by_query(
                        index=index_name,
                        body={"query": {"match_all": {}}}
                    )
                    
                    deleted_count = delete_response.get('deleted', 0)
                    total_deleted += deleted_count
                    cleared_indices.append((index_name, deleted_count))
                    
                    print(f"   ✅  {index_name:<30} : 成功删除 {deleted_count} 个文档")
                    
                except Exception as e:
                    print(f"   ❌  {index_name:<30} : 清理失败 - {e}")
            else:
                print(f"   ✅  {index_name:<30} : 已为空")
        
        await client.close()
        
        print("\n" + "=" * 60)
        print(f"🎉 Elasticsearch清理完成！总共删除 {total_deleted} 个文档")
        
        return True
        
    except Exception as e:
        print(f"❌ Elasticsearch清理失败: {e}")
        return False

async def complete_minio_cleanup():
    """完整清理MinIO数据"""
    if not MINIO_AVAILABLE:
        return False
    
    try:
        # MinIO配置
        minio_config = {
            "endpoint": "8.153.90.125:9000",
            "access_key": "admin", 
            "secret_key": "matscience2025",
            "secure": False
        }
        
        client = Minio(
            minio_config["endpoint"],
            access_key=minio_config["access_key"],
            secret_key=minio_config["secret_key"],
            secure=minio_config["secure"]
        )
        
        print("✅ MinIO连接成功")
        
        total_deleted = 0
        buckets = client.list_buckets()
        
        print("🗑️  开始清理MinIO文件...")
        print("=" * 60)
        
        for bucket in buckets:
            bucket_name = bucket.name
            print(f"   🗑️  {bucket_name:<30} : 检查文件...")
            
            try:
                # 获取所有对象
                objects = client.list_objects(bucket_name, recursive=True)
                object_list = list(objects)
                
                if object_list:
                    print(f"   🗑️  {bucket_name:<30} : 发现 {len(object_list)} 个文件，开始删除...")
                    
                    # 创建DeleteObject列表
                    delete_objects = [DeleteObject(obj.object_name) for obj in object_list]
                    
                    # 批量删除
                    delete_errors = client.remove_objects(bucket_name, delete_objects)
                    
                    # 检查删除结果
                    error_count = 0
                    for error in delete_errors:
                        error_count += 1
                        print(f"   ❌  删除失败: {error.object_name} - {error}")
                    
                    success_count = len(object_list) - error_count
                    total_deleted += success_count
                    
                    print(f"   ✅  {bucket_name:<30} : 成功删除 {success_count} 个文件")
                else:
                    print(f"   ✅  {bucket_name:<30} : 已为空")
                    
            except Exception as e:
                print(f"   ❌  {bucket_name:<30} : 清理失败 - {e}")
        
        print("\n" + "=" * 60)
        print(f"🎉 MinIO清理完成！总共删除 {total_deleted} 个文件")
        
        return True
        
    except Exception as e:
        print(f"❌ MinIO清理失败: {e}")
        return False

def main():
    print("💣 完整数据清理脚本")
    print("=" * 60)
    print("⚠️  这将彻底清理所有业务数据：")
    print("   - PostgreSQL: 所有业务表数据")
    print("   - Elasticsearch: 所有业务索引数据") 
    print("   - MinIO: 所有文件")
    print("\n此操作不可撤销！")
    
    # 最终确认
    user_input = input("\n请输入 'CLEAR_ALL_DATA' 来确认执行完整清理: ")
    if user_input != 'CLEAR_ALL_DATA':
        print("❌ 清理已取消")
        return
    
    print("\n🚀 开始完整数据清理...")
    
    # 1. 清理PostgreSQL
    print("\n1️⃣ 清理PostgreSQL...")
    postgres_success = asyncio.run(complete_postgres_cleanup())
    
    # 2. 清理Elasticsearch
    print("\n2️⃣ 清理Elasticsearch...")  
    es_success = asyncio.run(complete_es_cleanup())
    
    # 3. 清理MinIO
    print("\n3️⃣ 清理MinIO...")
    minio_success = asyncio.run(complete_minio_cleanup())
    
    # 总结
    print("\n" + "=" * 60)
    print("🏁 完整清理结果:")
    print(f"   PostgreSQL: {'✅ 成功' if postgres_success else '❌ 失败'}")
    print(f"   Elasticsearch: {'✅ 成功' if es_success else '❌ 失败'}")
    print(f"   MinIO: {'✅ 成功' if minio_success else '❌ 失败'}")
    
    if postgres_success and es_success and minio_success:
        print("\n🎉 生产环境已完全清理！")
        print("💡 建议：")
        print("   1. 重启后端服务以清理内存缓存")
        print("   2. 刷新前端页面以清理浏览器缓存")
        print("   3. 检查前端是否还有轮询任务运行")
    else:
        print("\n⚠️  部分清理失败，请检查错误信息")

if __name__ == "__main__":
    main() 