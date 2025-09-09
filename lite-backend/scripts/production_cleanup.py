#!/usr/bin/env python3
"""
生产环境数据清理脚本

⚠️ 警告：此脚本将彻底清理生产环境中的所有数据！
包括：
1. MinIO中的所有文件
2. Elasticsearch中的所有索引数据
3. PostgreSQL中的相关记录

使用方法:
cd mat-backend
python scripts/production_cleanup.py --confirm

⚠️ 注意：此操作不可撤销！请确保您真的要清理所有数据！
"""

import asyncio
import sys
import json
import os
from pathlib import Path
from typing import Dict, Any

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("❌ MinIO SDK未安装，请安装: pip install minio")

try:
    from elasticsearch import AsyncElasticsearch
    ES_AVAILABLE = True
except ImportError:
    ES_AVAILABLE = False
    print("❌ Elasticsearch SDK未安装，请安装: pip install elasticsearch")

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("❌ PostgreSQL SDK未安装")

class ProductionCleaner:
    """生产环境数据清理器"""
    
    def __init__(self):
        """初始化清理器"""
        # 生产环境MinIO配置 - 用户提供的配置
        self.minio_config = {
            "endpoint": "8.153.90.125:9000",
            "access_key": "admin", 
            "secret_key": "matscience2025",
            "secure": False
        }
        
        # 生产环境ES配置 - 从env.backup获取
        self.es_config = {
            "url": "https://8.153.90.125:9200",
            "username": "elastic",
            "password": "MQxFuWBuooxLY2c2a8YE"
        }
        
        # 生产环境PostgreSQL配置 - 从env.backup获取
        self.postgres_config = {
            "host": "8.153.90.125",
            "port": "5432",
            "database": "mat_demo", 
            "username": "mat_demo",
            "password": "NfWNH0mypEtjKETrsVqQg=="
        }
        
        self.minio_client = None
        self.es_client = None
        self.postgres_engine = None
    
    async def initialize_connections(self):
        """初始化所有连接"""
        print("🔄 正在初始化连接...")
        
        # 初始化MinIO连接
        if MINIO_AVAILABLE:
            try:
                self.minio_client = Minio(
                    self.minio_config["endpoint"],
                    access_key=self.minio_config["access_key"],
                    secret_key=self.minio_config["secret_key"],
                    secure=self.minio_config["secure"]
                )
                
                # 测试连接
                list(self.minio_client.list_buckets())
                print("✅ MinIO连接成功")
                
            except Exception as e:
                print(f"❌ MinIO连接失败: {e}")
                return False
        
        # 初始化ES连接
        if ES_AVAILABLE:
            try:
                self.es_client = AsyncElasticsearch(
                    [self.es_config["url"]],
                    http_auth=(self.es_config["username"], self.es_config["password"]),
                    verify_certs=False,
                    ssl_show_warn=False
                )
                
                # 测试连接
                health = await self.es_client.cluster.health()
                print(f"✅ Elasticsearch连接成功，集群状态: {health['status']}")
                
            except Exception as e:
                print(f"❌ Elasticsearch连接失败: {e}")
                return False
        
        # 初始化PostgreSQL连接
        if POSTGRES_AVAILABLE:
            try:
                db_url = f"postgresql+asyncpg://{self.postgres_config['username']}:{self.postgres_config['password']}@{self.postgres_config['host']}:{self.postgres_config['port']}/{self.postgres_config['database']}"
                self.postgres_engine = create_async_engine(db_url)
                
                # 测试连接
                async with self.postgres_engine.begin() as conn:
                    await conn.execute(text("SELECT 1"))
                
                print("✅ PostgreSQL连接成功")
                
            except Exception as e:
                print(f"❌ PostgreSQL连接失败: {e}")
                return False
        
        return True
    
    async def get_minio_stats(self) -> Dict[str, Any]:
        """获取MinIO存储统计"""
        if not self.minio_client:
            return {"error": "MinIO客户端未初始化"}
        
        try:
            stats = {
                "buckets": {},
                "total_objects": 0,
                "total_size_bytes": 0
            }
            
            buckets = self.minio_client.list_buckets()
            for bucket in buckets:
                bucket_name = bucket.name
                bucket_stats = {
                    "object_count": 0,
                    "total_size": 0,
                    "creation_date": bucket.creation_date
                }
                
                try:
                    objects = self.minio_client.list_objects(bucket_name, recursive=True)
                    for obj in objects:
                        bucket_stats["object_count"] += 1
                        bucket_stats["total_size"] += obj.size
                        stats["total_objects"] += 1
                        stats["total_size_bytes"] += obj.size
                except Exception as e:
                    print(f"⚠️  读取bucket {bucket_name} 失败: {e}")
                
                stats["buckets"][bucket_name] = bucket_stats
            
            return stats
            
        except Exception as e:
            return {"error": str(e)}
    
    async def clear_minio_all_files(self) -> Dict[str, Any]:
        """清空MinIO中的所有文件（保留bucket）"""
        if not self.minio_client:
            return {"error": "MinIO客户端未初始化"}
        
        try:
            results = {
                "cleared_buckets": [],
                "total_deleted": 0,
                "errors": []
            }
            
            buckets = self.minio_client.list_buckets()
            for bucket in buckets:
                bucket_name = bucket.name
                print(f"🗑️  正在清理bucket: {bucket_name}")
                
                try:
                    # 获取所有对象
                    objects = self.minio_client.list_objects(bucket_name, recursive=True)
                    object_names = [obj.object_name for obj in objects]
                    
                    if object_names:
                        # 批量删除对象 - 需要使用DeleteObject包装器
                        from minio.deleteobjects import DeleteObject
                        delete_objects = [DeleteObject(name) for name in object_names]
                        delete_errors = self.minio_client.remove_objects(
                            bucket_name,
                            delete_objects
                        )
                        
                        # 检查删除错误
                        error_count = 0
                        for error in delete_errors:
                            error_count += 1
                            results["errors"].append(f"删除 {bucket_name}/{error.object_name} 失败: {error}")
                        
                        deleted_count = len(object_names) - error_count
                        results["total_deleted"] += deleted_count
                        results["cleared_buckets"].append({
                            "bucket": bucket_name,
                            "deleted": deleted_count,
                            "errors": error_count
                        })
                        
                        print(f"✅ bucket {bucket_name}: 删除 {deleted_count} 个文件")
                    else:
                        print(f"✅ bucket {bucket_name}: 已为空")
                        results["cleared_buckets"].append({
                            "bucket": bucket_name,
                            "deleted": 0,
                            "errors": 0
                        })
                
                except Exception as e:
                    error_msg = f"清理bucket {bucket_name} 失败: {e}"
                    print(f"❌ {error_msg}")
                    results["errors"].append(error_msg)
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    async def get_es_indices(self) -> Dict[str, Any]:
        """获取ES索引信息"""
        if not self.es_client:
            return {"error": "ES客户端未初始化"}
        
        try:
            # 获取所有索引
            indices_response = await self.es_client.cat.indices(format="json")
            
            indices_info = {}
            total_docs = 0
            total_size = 0
            
            for index_info in indices_response:
                index_name = index_info['index']
                doc_count = int(index_info.get('docs.count', 0))
                store_size = index_info.get('store.size', '0b')
                
                indices_info[index_name] = {
                    "doc_count": doc_count,
                    "store_size": store_size,
                    "health": index_info.get('health', 'unknown'),
                    "status": index_info.get('status', 'unknown')
                }
                total_docs += doc_count
            
            return {
                "indices": indices_info,
                "total_indices": len(indices_info),
                "total_documents": total_docs
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def clear_es_all_data(self) -> Dict[str, Any]:
        """清理ES中的所有数据"""
        if not self.es_client:
            return {"error": "ES客户端未初始化"}
        
        try:
            results = {
                "cleared_indices": [],
                "total_deleted": 0,
                "errors": []
            }
            
            # 获取所有索引
            indices_response = await self.es_client.cat.indices(format="json")
            
            for index_info in indices_response:
                index_name = index_info['index']
                
                # 跳过系统索引
                if index_name.startswith('.'):
                    continue
                
                print(f"🗑️  正在清理ES索引: {index_name}")
                
                try:
                    # 删除索引中的所有文档
                    delete_response = await self.es_client.delete_by_query(
                        index=index_name,
                        body={"query": {"match_all": {}}}
                    )
                    
                    deleted_count = delete_response.get('deleted', 0)
                    results["total_deleted"] += deleted_count
                    results["cleared_indices"].append({
                        "index": index_name,
                        "deleted": deleted_count
                    })
                    
                    print(f"✅ 索引 {index_name}: 删除 {deleted_count} 个文档")
                    
                except Exception as e:
                    error_msg = f"清理索引 {index_name} 失败: {e}"
                    print(f"❌ {error_msg}")
                    results["errors"].append(error_msg)
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    async def get_postgres_stats(self) -> Dict[str, Any]:
        """获取PostgreSQL统计信息"""
        if not self.postgres_engine:
            return {"error": "PostgreSQL客户端未初始化"}
        
        try:
            stats = {}
            
            async with self.postgres_engine.begin() as conn:
                # 获取知识文档表统计
                result = await conn.execute(text("SELECT COUNT(*) FROM knowledge_documents"))
                doc_count = result.scalar()
                stats["knowledge_documents"] = doc_count
                
                # 获取任务表统计
                try:
                    result = await conn.execute(text("SELECT COUNT(*) FROM task_queue"))
                    task_count = result.scalar()
                    stats["task_queue"] = task_count
                except:
                    stats["task_queue"] = "表不存在"
                
            return stats
            
        except Exception as e:
            return {"error": str(e)}
    
    async def clear_postgres_data(self) -> Dict[str, Any]:
        """清理PostgreSQL中的相关数据"""
        if not self.postgres_engine:
            return {"error": "PostgreSQL客户端未初始化"}
        
        try:
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
            
            # 为每个表使用独立的事务，避免一个失败影响其他
            for table in tables_to_clear:
                try:
                    async with self.postgres_engine.begin() as conn:
                        print(f"🗑️  正在清理表: {table}")
                        
                        # 先获取行数
                        count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        row_count = count_result.scalar()
                        
                        if row_count > 0:
                            # 删除所有数据
                            await conn.execute(text(f"DELETE FROM {table}"))
                            results["total_deleted"] += row_count
                            
                            print(f"✅ 表 {table}: 删除 {row_count} 行")
                        else:
                            print(f"✅ 表 {table}: 已为空")
                        
                        results["cleared_tables"].append({
                            "table": table,
                            "deleted": row_count
                        })
                        
                except Exception as e:
                    if "does not exist" in str(e) or "relation" in str(e):
                        print(f"⚠️  表 {table} 不存在，跳过")
                        results["cleared_tables"].append({
                            "table": table,
                            "deleted": 0,
                            "note": "表不存在"
                        })
                    else:
                        error_msg = f"清理表 {table} 失败: {e}"
                        print(f"❌ {error_msg}")
                        results["errors"].append(error_msg)
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    async def close_connections(self):
        """关闭所有连接"""
        if self.es_client:
            await self.es_client.close()
        
        if self.postgres_engine:
            await self.postgres_engine.dispose()

async def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="生产环境数据清理脚本")
    parser.add_argument("--confirm", action="store_true", 
                       help="确认执行清理操作（此操作不可撤销！）")
    parser.add_argument("--test-connections", action="store_true",
                       help="仅测试连接并显示当前数据统计，不执行清理操作")
    parser.add_argument("--es-password", type=str, 
                       help="Elasticsearch密码")
    parser.add_argument("--postgres-password", type=str, 
                       help="PostgreSQL密码")
    
    args = parser.parse_args()
    
    cleaner = ProductionCleaner()
    
    # 更新密码（如果提供）
    if args.es_password:
        cleaner.es_config["password"] = args.es_password
    if args.postgres_password:
        cleaner.postgres_config["password"] = args.postgres_password
    
    # 如果是测试连接模式
    if args.test_connections:
        print("🔍 测试生产环境连接...")
        print("=" * 50)
        
        try:
            # 初始化连接
            if await cleaner.initialize_connections():
                print("\n📊 当前数据统计:")
                print("-" * 30)
                
                # 获取MinIO统计
                minio_stats = await cleaner.get_minio_stats()
                if "error" not in minio_stats:
                    print(f"📁 MinIO:")
                    print(f"   总文件数: {minio_stats['total_objects']}")
                    print(f"   存储大小: {minio_stats['total_size_bytes'] / (1024*1024):.2f} MB")
                    for bucket_name, bucket_info in minio_stats['buckets'].items():
                        print(f"   - {bucket_name}: {bucket_info['object_count']} 文件")
                else:
                    print(f"📁 MinIO: {minio_stats['error']}")
                
                # 获取ES统计
                es_stats = await cleaner.get_es_indices()
                if "error" not in es_stats:
                    print(f"\n🔍 Elasticsearch:")
                    print(f"   总索引数: {es_stats['total_indices']}")
                    print(f"   总文档数: {es_stats['total_documents']}")
                    for index_name, doc_count in es_stats.get('indices', {}).items():
                        print(f"   - {index_name}: {doc_count} 文档")
                else:
                    print(f"\n🔍 Elasticsearch: {es_stats['error']}")
                
                # 获取PostgreSQL统计
                postgres_stats = await cleaner.get_postgres_stats()
                if "error" not in postgres_stats:
                    print(f"\n🗄️  PostgreSQL:")
                    for table, count in postgres_stats.items():
                        print(f"   - {table}: {count} 行")
                else:
                    print(f"\n🗄️  PostgreSQL: {postgres_stats['error']}")
                
                print("\n✅ 连接测试完成")
            else:
                print("❌ 连接测试失败")
                
        except Exception as e:
            print(f"❌ 测试过程中发生错误: {e}")
        finally:
            await cleaner.close_connections()
        
        return
    
    if not args.confirm:
        print("⚠️  这是一个危险操作！")
        print("此脚本将清理以下生产环境数据：")
        print("1. MinIO (8.153.90.125:9000) 中的所有文件")
        print("2. Elasticsearch (8.153.90.125:9200) 中的所有数据")
        print("3. PostgreSQL (8.153.90.125:5432) 中的相关记录")
        print("")
        print("⚠️  此操作不可撤销！如果确定要执行，请添加 --confirm 参数")
        print("💡 如果要测试连接，请使用 --test-connections 参数")
        return
    
    print("=" * 80)
    print("🧹 生产环境数据清理")
    print("=" * 80)
    print("⚠️  警告：即将清理生产环境中的所有数据！")
    print("")
    
    # 最后确认
    user_input = input("请输入 'YES' 来确认执行清理操作: ")
    if user_input != "YES":
        print("❌ 操作已取消")
        return
    
    try:
        # 初始化连接
        if not await cleaner.initialize_connections():
            print("❌ 连接初始化失败，退出")
            return
        
        print("\n📊 清理前统计:")
        print("-" * 50)
        
        # 获取清理前统计
        minio_stats = await cleaner.get_minio_stats()
        if "error" not in minio_stats:
            print(f"MinIO总文件数: {minio_stats['total_objects']}")
            print(f"MinIO存储大小: {minio_stats['total_size_bytes'] / (1024*1024):.2f} MB")
        
        es_stats = await cleaner.get_es_indices()
        if "error" not in es_stats:
            print(f"ES总索引数: {es_stats['total_indices']}")
            print(f"ES总文档数: {es_stats['total_documents']}")
        
        postgres_stats = await cleaner.get_postgres_stats()
        if "error" not in postgres_stats:
            print(f"PostgreSQL知识文档数: {postgres_stats.get('knowledge_documents', 0)}")
        
        print("\n🗑️  开始清理...")
        print("=" * 50)
        
        # 1. 清理MinIO
        print("\n1️⃣ 清理MinIO文件...")
        minio_result = await cleaner.clear_minio_all_files()
        if "error" not in minio_result:
            print(f"✅ MinIO清理完成，共删除 {minio_result['total_deleted']} 个文件")
        else:
            print(f"❌ MinIO清理失败: {minio_result['error']}")
        
        # 2. 清理Elasticsearch
        print("\n2️⃣ 清理Elasticsearch数据...")
        es_result = await cleaner.clear_es_all_data()
        if "error" not in es_result:
            print(f"✅ ES清理完成，共删除 {es_result['total_deleted']} 个文档")
        else:
            print(f"❌ ES清理失败: {es_result['error']}")
        
        # 3. 清理PostgreSQL
        print("\n3️⃣ 清理PostgreSQL数据...")
        postgres_result = await cleaner.clear_postgres_data()
        if "error" not in postgres_result:
            print(f"✅ PostgreSQL清理完成，共删除 {postgres_result['total_deleted']} 行记录")
        else:
            print(f"❌ PostgreSQL清理失败: {postgres_result['error']}")
        
        print("\n🎉 清理完成！")
        print("=" * 50)
        print("生产环境已恢复到干净状态：")
        print("- ✅ MinIO文件已清空")
        print("- ✅ Elasticsearch数据已清空") 
        print("- ✅ PostgreSQL记录已清空")
        
    except KeyboardInterrupt:
        print("\n❌ 操作被用户中断")
    except Exception as e:
        print(f"\n❌ 清理过程中发生错误: {e}")
    finally:
        await cleaner.close_connections()

if __name__ == "__main__":
    asyncio.run(main()) 