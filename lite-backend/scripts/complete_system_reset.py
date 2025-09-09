#!/usr/bin/env python3
"""
完整系统重置脚本

解决前端异常轮询问题的综合解决方案：
1. 彻底清理后端数据
2. 提供前端清理指令
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

class SystemResetManager:
    """系统重置管理器"""
    
    def __init__(self):
        # 生产环境配置
        self.postgres_config = {
            "host": "8.153.90.125",
            "port": "5432",
            "database": "mat_demo", 
            "username": "mat_demo",
            "password": "NfWNH0mypEtjKETrsVqQg=="
        }
        
        self.es_config = {
            "host": "8.153.90.125",
            "port": "9200",
            "scheme": "https",
            "username": "elastic",
            "password": "bS3dGKNNmCbECE1yIDhiTNqv"
        }
        
        self.minio_config = {
            "endpoint": "8.153.90.125:9000",
            "access_key": "admin",
            "secret_key": "matscience2025",
            "secure": False
        }
        
        # 连接对象
        self.postgres_engine = None
        self.es_client = None
        self.minio_client = None
    
    async def initialize_connections(self):
        """初始化所有连接"""
        success = True
        
        # PostgreSQL
        if POSTGRES_AVAILABLE:
            try:
                postgres_url = f"postgresql+asyncpg://{self.postgres_config['username']}:{self.postgres_config['password']}@{self.postgres_config['host']}:{self.postgres_config['port']}/{self.postgres_config['database']}"
                self.postgres_engine = create_async_engine(postgres_url)
                
                # 测试连接
                async with self.postgres_engine.begin() as conn:
                    await conn.execute(text("SELECT 1"))
                print("✅ PostgreSQL 连接成功")
            except Exception as e:
                print(f"❌ PostgreSQL 连接失败: {e}")
                success = False
        
        # Elasticsearch
        if ES_AVAILABLE:
            try:
                self.es_client = AsyncElasticsearch(
                    [{"host": self.es_config["host"], "port": self.es_config["port"], "scheme": self.es_config["scheme"]}],
                    basic_auth=(self.es_config["username"], self.es_config["password"]),
                    verify_certs=False,
                    ssl_show_warn=False,
                    request_timeout=10,
                    max_retries=1
                )
                
                # 测试连接（忽略版本检查错误）
                try:
                    info = await self.es_client.info()
                    print("✅ Elasticsearch 连接成功")
                except:
                    # 尝试简单的健康检查
                    await self.es_client.cluster.health()
                    print("✅ Elasticsearch 连接成功（简化检查）")
            except Exception as e:
                print(f"❌ Elasticsearch 连接失败: {e}")
                # 不设置为失败，继续执行其他清理
                print("⚠️ 跳过Elasticsearch，继续其他清理操作")
        
        # MinIO
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
                print("✅ MinIO 连接成功")
            except Exception as e:
                print(f"❌ MinIO 连接失败: {e}")
                success = False
        
        return success

    async def get_current_data_status(self):
        """获取当前数据状态"""
        status = {
            "postgres": {"tables": {}, "total_rows": 0},
            "elasticsearch": {"indices": {}, "total_docs": 0},
            "minio": {"buckets": {}, "total_files": 0}
        }
        
        # PostgreSQL 状态
        if self.postgres_engine:
            try:
                async with self.postgres_engine.begin() as conn:
                    tables_to_check = [
                        'knowledge_documents', 'document_chunks', 'conversations', 
                        'qa_datasets', 'qa_pairs', 'qa_categories', 'task_queue'
                    ]
                    
                    for table in tables_to_check:
                        try:
                            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                            count = result.scalar()
                            status["postgres"]["tables"][table] = count
                            status["postgres"]["total_rows"] += count
                        except Exception:
                            status["postgres"]["tables"][table] = "不存在"
            except Exception as e:
                print(f"❌ 获取PostgreSQL状态失败: {e}")
        
        # Elasticsearch 状态
        if self.es_client:
            try:
                indices = await self.es_client.cat.indices(format="json")
                for index in indices:
                    if not index["index"].startswith('.'):
                        docs_count = int(index.get("docs.count", 0) or 0)
                        status["elasticsearch"]["indices"][index["index"]] = docs_count
                        status["elasticsearch"]["total_docs"] += docs_count
            except Exception as e:
                print(f"❌ 获取Elasticsearch状态失败: {e}")
        
        # MinIO 状态
        if self.minio_client:
            try:
                buckets = self.minio_client.list_buckets()
                for bucket in buckets:
                    objects = list(self.minio_client.list_objects(bucket.name, recursive=True))
                    status["minio"]["buckets"][bucket.name] = len(objects)
                    status["minio"]["total_files"] += len(objects)
            except Exception as e:
                print(f"❌ 获取MinIO状态失败: {e}")
        
        return status

    async def clean_all_data(self):
        """彻底清理所有数据"""
        print("🧹 开始彻底清理所有数据...")
        
        results = {
            "postgres": {"success": False, "details": {}},
            "elasticsearch": {"success": False, "details": {}},
            "minio": {"success": False, "details": {}}
        }
        
        # 1. 清理 PostgreSQL
        if self.postgres_engine:
            try:
                print("🗑️ 清理 PostgreSQL 数据...")
                async with self.postgres_engine.begin() as conn:
                    # 需要清理的表，按依赖关系排序
                    tables_to_clear = [
                        'task_queue',
                        'document_chunks', 
                        'knowledge_documents',
                        'qa_pairs',
                        'qa_categories', 
                        'qa_datasets',
                        'conversations'
                    ]
                    
                    total_deleted = 0
                    for table in tables_to_clear:
                        try:
                            # 获取行数
                            count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                            row_count = count_result.scalar()
                            
                            if row_count > 0:
                                # 删除所有数据
                                await conn.execute(text(f"DELETE FROM {table}"))
                                total_deleted += row_count
                                print(f"  ✅ {table}: 删除 {row_count} 行")
                            else:
                                print(f"  ✅ {table}: 已为空")
                            
                            results["postgres"]["details"][table] = row_count
                        except Exception as e:
                            print(f"  ⚠️ {table}: 清理失败 - {e}")
                            results["postgres"]["details"][table] = f"错误: {e}"
                    
                    results["postgres"]["success"] = True
                    results["postgres"]["total_deleted"] = total_deleted
                    print(f"✅ PostgreSQL 清理完成，总计删除 {total_deleted} 行")
            except Exception as e:
                print(f"❌ PostgreSQL 清理失败: {e}")
                results["postgres"]["error"] = str(e)
        
        # 2. 清理 Elasticsearch
        if self.es_client:
            try:
                print("🗑️ 清理 Elasticsearch 数据...")
                
                # 获取所有非系统索引
                indices = await self.es_client.cat.indices(format="json")
                total_deleted = 0
                
                for index in indices:
                    index_name = index["index"]
                    if not index_name.startswith('.'):
                        try:
                            docs_count = int(index.get("docs.count", 0) or 0)
                            
                            if docs_count > 0:
                                # 删除索引中的所有文档
                                await self.es_client.delete_by_query(
                                    index=index_name,
                                    body={"query": {"match_all": {}}}
                                )
                                total_deleted += docs_count
                                print(f"  ✅ {index_name}: 删除 {docs_count} 个文档")
                            else:
                                print(f"  ✅ {index_name}: 已为空")
                            
                            results["elasticsearch"]["details"][index_name] = docs_count
                        except Exception as e:
                            print(f"  ⚠️ {index_name}: 清理失败 - {e}")
                            results["elasticsearch"]["details"][index_name] = f"错误: {e}"
                
                results["elasticsearch"]["success"] = True
                results["elasticsearch"]["total_deleted"] = total_deleted
                print(f"✅ Elasticsearch 清理完成，总计删除 {total_deleted} 个文档")
            except Exception as e:
                print(f"❌ Elasticsearch 清理失败: {e}")
                results["elasticsearch"]["error"] = str(e)
        
        # 3. 清理 MinIO
        if self.minio_client:
            try:
                print("🗑️ 清理 MinIO 文件...")
                
                buckets = self.minio_client.list_buckets()
                total_deleted = 0
                
                for bucket in buckets:
                    bucket_name = bucket.name
                    try:
                        # 获取所有对象
                        objects = list(self.minio_client.list_objects(bucket_name, recursive=True))
                        
                        if objects:
                            # 批量删除对象
                            delete_objects = [DeleteObject(obj.object_name) for obj in objects]
                            delete_errors = self.minio_client.remove_objects(bucket_name, delete_objects)
                            
                            # 检查删除错误
                            error_count = len(list(delete_errors))
                            success_count = len(objects) - error_count
                            
                            total_deleted += success_count
                            print(f"  ✅ {bucket_name}: 删除 {success_count} 个文件")
                            
                            if error_count > 0:
                                print(f"  ⚠️ {bucket_name}: {error_count} 个文件删除失败")
                        else:
                            print(f"  ✅ {bucket_name}: 已为空")
                        
                        results["minio"]["details"][bucket_name] = len(objects)
                    except Exception as e:
                        print(f"  ⚠️ {bucket_name}: 清理失败 - {e}")
                        results["minio"]["details"][bucket_name] = f"错误: {e}"
                
                results["minio"]["success"] = True
                results["minio"]["total_deleted"] = total_deleted
                print(f"✅ MinIO 清理完成，总计删除 {total_deleted} 个文件")
            except Exception as e:
                print(f"❌ MinIO 清理失败: {e}")
                results["minio"]["error"] = str(e)
        
        return results

    def generate_frontend_cleanup_instructions(self):
        """生成前端清理指令"""
        instructions = """
🌐 前端清理指令

请在浏览器中执行以下任一方法：

方法1: 使用开发者工具页面
1. 在浏览器地址栏访问: /dev-tools
2. 点击 "清理所有缓存" 按钮
3. 等待清理完成后点击 "重新加载页面"

方法2: 使用浏览器控制台
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 复制粘贴并执行以下代码：

```javascript
// 清理所有缓存和状态
if (window.clearAllCaches) {
    window.clearAllCaches(true); // true = 清理后自动重载页面
} else {
    // 手动清理
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
}
```

方法3: 手动清理 (万无一失)
1. 打开浏览器设置
2. 找到 "隐私和安全" → "清除浏览数据"
3. 选择 "所有时间" 和 "Cookies及其他网站数据"、"缓存的图像和文件"
4. 点击 "清除数据"
5. 重新访问网站

⚠️ 重要提醒:
- 清理缓存会停止所有异常轮询
- 这些操作会清除登录状态，需要重新登录
- 建议先保存重要的工作进度
        """
        return instructions

async def main():
    """主函数"""
    print("🔄 完整系统重置脚本")
    print("=" * 50)
    
    reset_manager = SystemResetManager()
    
    # 1. 初始化连接
    print("🔗 初始化连接...")
    if not await reset_manager.initialize_connections():
        print("❌ 连接初始化失败，请检查网络和配置")
        return
    
    # 2. 检查当前状态
    print("\n📊 检查当前数据状态...")
    before_status = await reset_manager.get_current_data_status()
    
    print(f"PostgreSQL: {before_status['postgres']['total_rows']} 行数据")
    print(f"Elasticsearch: {before_status['elasticsearch']['total_docs']} 个文档")
    print(f"MinIO: {before_status['minio']['total_files']} 个文件")
    
    # 如果没有数据，跳过清理
    total_data = (before_status['postgres']['total_rows'] + 
                  before_status['elasticsearch']['total_docs'] + 
                  before_status['minio']['total_files'])
    
    if total_data == 0:
        print("✅ 后端数据已经是干净状态，无需清理")
    else:
        # 3. 确认清理
        print(f"\n⚠️ 发现 {total_data} 项数据需要清理")
        confirmation = input("确认要清理所有后端数据吗? (输入 'YES' 确认): ")
        
        if confirmation != "YES":
            print("❌ 操作已取消")
            return
        
        # 4. 执行清理
        print("\n🧹 开始清理后端数据...")
        clean_results = await reset_manager.clean_all_data()
        
        # 5. 验证清理结果
        print("\n🔍 验证清理结果...")
        after_status = await reset_manager.get_current_data_status()
        
        remaining_data = (after_status['postgres']['total_rows'] + 
                         after_status['elasticsearch']['total_docs'] + 
                         after_status['minio']['total_files'])
        
        if remaining_data == 0:
            print("✅ 后端数据清理完全成功！")
        else:
            print(f"⚠️ 仍有 {remaining_data} 项数据未清理完成")
    
    # 6. 显示前端清理指令
    print("\n" + "=" * 50)
    print(reset_manager.generate_frontend_cleanup_instructions())
    
    print("\n🎉 系统重置脚本执行完成！")
    print("请按照上述前端清理指令操作，彻底解决轮询问题。")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n❌ 操作被用户中断")
    except Exception as e:
        print(f"\n❌ 脚本执行失败: {e}")
        import traceback
        traceback.print_exc() 