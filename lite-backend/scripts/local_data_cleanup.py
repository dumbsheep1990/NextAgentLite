#!/usr/bin/env python3
"""
本地测试环境数据清理脚本

清理本地PostgreSQL、Elasticsearch和MinIO中的测试数据
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

async def cleanup_local_postgres():
    """清理本地PostgreSQL中的测试数据"""
    if not POSTGRES_AVAILABLE:
        return False
    
    # 本地PostgreSQL配置
    postgres_config = {
        "host": "localhost",
        "port": "5434",
        "database": "zzdsj_demo", 
        "username": "zzdsj_demo",
        "password": ""
    }
    
    try:
        # 创建数据库引擎
        if postgres_config['password']:
            db_url = f"postgresql+asyncpg://{postgres_config['username']}:{postgres_config['password']}@{postgres_config['host']}:{postgres_config['port']}/{postgres_config['database']}"
        else:
            db_url = f"postgresql+asyncpg://{postgres_config['username']}@{postgres_config['host']}:{postgres_config['port']}/{postgres_config['database']}"
        engine = create_async_engine(db_url)
        
        print("✅ 本地PostgreSQL连接成功")
        
        # 需要清理的业务表
        business_tables = [
            # 核心文档相关
            'document_chunks',
            'knowledge_documents',
            'knowledge_collections',
            'knowledge_folders',
            
            # 消息和对话相关
            'conversation_messages',
            'conversations', 
            
            # 任务相关
            'task_locks',
            'task_queue',
            'task_workers',
            'task_executions',
            
            # QA数据集
            'qa_pairs',
            'qa_datasets',
            
            # 团队执行相关
            'team_execution_steps',
            'team_executions',
            'team_members',
            
            # Agent相关
            'agent_configs',
            'agent_tools',
            
            # 模型配置
            'model_configs',
            'chunking_configs',
            
            # 用户相关
            'user_preferences',
            'users',
            
            # 图相关
            'graph_nodes',
            'graph_edges',
            'graph_layouts',
            'graph_filters',
            'graph_stats',
            'graph_algorithm_executions',
            
            # 其他
            'papers',
            'system_logs',
        ]
        
        print("🗑️  开始清理本地PostgreSQL测试数据...")
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
        
        await engine.dispose()
        
        print("=" * 60)
        print(f"🎉 本地PostgreSQL清理完成")
        print(f"   📊 总共删除: {total_deleted} 行数据")
        print(f"   📋 清理表数: {len(cleared_tables)} 个")
        if cleared_tables:
            print("   📝 清理详情:")
            for table, count in cleared_tables:
                print(f"      - {table}: {count} 行")
        
        return True
        
    except Exception as e:
        print(f"❌ 本地PostgreSQL清理失败: {e}")
        return False

async def cleanup_local_elasticsearch():
    """清理本地Elasticsearch数据"""
    if not ES_AVAILABLE:
        return False
        
    # 本地ES配置
    es_config = {
        "url": "http://localhost:9200",
        "username": None,  # 本地通常不需要认证
        "password": None
    }
    
    try:
        if es_config["username"] and es_config["password"]:
            client = AsyncElasticsearch(
                [es_config["url"]],
                basic_auth=(es_config["username"], es_config["password"]),
                verify_certs=False,
                ssl_show_warn=False
            )
        else:
            client = AsyncElasticsearch([es_config["url"]])
        
        print("✅ 本地Elasticsearch连接成功")
        
        # 获取所有索引
        indices_response = await client.cat.indices(format="json")
        
        total_deleted = 0
        cleared_indices = []
        
        print("🗑️  开始清理本地Elasticsearch数据...")
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
        
        print("=" * 60)
        print(f"🎉 本地Elasticsearch清理完成")
        print(f"   📊 总共删除: {total_deleted} 个文档")
        print(f"   📋 清理索引: {len(cleared_indices)} 个")
        if cleared_indices:
            print("   📝 清理详情:")
            for index, count in cleared_indices:
                print(f"      - {index}: {count} 个文档")
        
        return True
        
    except Exception as e:
        print(f"❌ 本地Elasticsearch清理失败: {e}")
        return False

def cleanup_local_minio():
    """清理本地MinIO数据"""
    if not MINIO_AVAILABLE:
        return False
        
    # 本地MinIO配置
    minio_config = {
        "endpoint": "localhost:9000",
        "access_key": "minioadmin",
        "secret_key": "minioadmin",
        "secure": False
    }
    
    try:
        client = Minio(
            minio_config["endpoint"],
            access_key=minio_config["access_key"],
            secret_key=minio_config["secret_key"],
            secure=minio_config["secure"]
        )
        
        print("✅ 本地MinIO连接成功")
        
        total_deleted = 0
        buckets = client.list_buckets()
        
        print("🗑️  开始清理本地MinIO文件...")
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
        
        print("=" * 60)
        print(f"🎉 本地MinIO清理完成")
        print(f"   📊 总共删除: {total_deleted} 个文件")
        
        return True
        
    except Exception as e:
        print(f"❌ 本地MinIO清理失败: {e}")
        return False

async def main():
    """主函数"""
    import sys
    
    print("🧹 开始清理本地测试环境数据")
    print("=" * 80)
    print("⚠️  警告: 此操作将删除所有本地测试数据，请确认无重要数据!")
    print("=" * 80)
    
    # 检查命令行参数
    force_cleanup = "--force" in sys.argv or "-f" in sys.argv
    
    if not force_cleanup:
        # 获取用户确认
        try:
            confirm = input("请输入 'YES' 确认清理本地测试数据: ")
            if confirm != 'YES':
                print("❌ 用户取消操作")
                return
        except EOFError:
            print("❌ 无法获取用户输入，请使用 --force 参数强制执行")
            return
    
    results = []
    
    # 清理PostgreSQL
    print("\n1️⃣ 清理本地PostgreSQL...")
    postgres_result = await cleanup_local_postgres()
    results.append(("PostgreSQL", postgres_result))
    
    # 清理Elasticsearch
    print("\n2️⃣ 清理本地Elasticsearch...")
    es_result = await cleanup_local_elasticsearch()
    results.append(("Elasticsearch", es_result))
    
    # 清理MinIO
    print("\n3️⃣ 清理本地MinIO...")
    minio_result = cleanup_local_minio()
    results.append(("MinIO", minio_result))
    
    # 汇总结果
    print("\n" + "=" * 80)
    print("🎯 本地数据清理完成汇总")
    print("=" * 80)
    
    success_count = 0
    for service, success in results:
        status = "✅ 成功" if success else "❌ 失败"
        print(f"   {service:<15} : {status}")
        if success:
            success_count += 1
    
    print("=" * 80)
    if success_count == len(results):
        print("🎉 所有服务数据清理完成!")
    else:
        print(f"⚠️  部分服务清理失败 ({success_count}/{len(results)} 成功)")
    
    print("💡 建议: 清理后重启相关服务以确保状态一致性")

if __name__ == "__main__":
    asyncio.run(main())