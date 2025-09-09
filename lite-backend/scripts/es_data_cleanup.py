#!/usr/bin/env python3
"""
Elasticsearch数据清理脚本
支持以下功能：
1. 清空指定索引的所有数据
2. 删除失效的文档和向量数据
3. 清理孤立的chunk数据
4. 清理失败的任务相关数据
5. 重建索引结构
"""
import asyncio
import argparse
import sys
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from elasticsearch import AsyncElasticsearch
from sqlalchemy import text
from db.database import get_async_session
from core.logger import logger
from core.config_optimized import optimized_settings as config
from utils.timezone_utils import get_china_now

# MinIO相关导入
try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    logger.warning("MinIO SDK未安装，MinIO清理功能不可用。请安装: pip install minio")


class ESDataCleanup:
    """ES数据清理工具"""
    
    def __init__(self):
        """初始化ES清理工具"""
        self.es_client: Optional[AsyncElasticsearch] = None
        self.es_config = config.database_elasticsearch
        self.minio_client: Optional[Minio] = None
        self.storage_config = config.storage_minio
        
    async def initialize(self):
        """初始化ES和MinIO连接"""
        try:
            # 初始化ES连接
            es_client_params = {
                "hosts": self.es_config.hosts,
                "verify_certs": False,
                "ssl_show_warn": False,
                "request_timeout": self.es_config.timeout,
                "retry_on_timeout": True,
                "max_retries": self.es_config.max_retries
            }
            
            # 认证配置（互斥）
            if self.es_config.api_key:
                es_client_params["api_key"] = self.es_config.api_key
            elif self.es_config.username and self.es_config.password:
                es_client_params["basic_auth"] = (self.es_config.username, self.es_config.password)
            
            self.es_client = AsyncElasticsearch(**es_client_params)
            
            # 测试ES连接
            health = await self.es_client.cluster.health()
            logger.info(f"ES集群状态: {health['status']}")
            
            # 初始化MinIO连接
            if MINIO_AVAILABLE and self.storage_config.enabled:
                try:
                    # 解析endpoint获取host和port
                    endpoint = self.storage_config.endpoint.replace('http://', '').replace('https://', '')
                    
                    self.minio_client = Minio(
                        endpoint,
                        access_key=self.storage_config.access_key,
                        secret_key=self.storage_config.secret_key,
                        secure=self.storage_config.secure
                    )
                    
                    # 测试MinIO连接
                    buckets = list(self.minio_client.list_buckets())
                    logger.info(f"MinIO连接成功，发现 {len(buckets)} 个bucket")
                    
                except Exception as minio_error:
                    logger.warning(f"MinIO连接失败: {minio_error}")
                    self.minio_client = None
            
        except Exception as e:
            logger.error(f"ES连接失败: {e}")
            raise

    async def close(self):
        """关闭ES和MinIO连接"""
        if self.es_client:
            await self.es_client.close()
        # MinIO客户端不需要显式关闭

    async def list_indices(self) -> List[str]:
        """列出所有索引"""
        try:
            indices = await self.es_client.cat.indices(format="json")
            return [idx['index'] for idx in indices if not idx['index'].startswith('.')]
        except Exception as e:
            logger.error(f"获取索引列表失败: {e}")
            return []

    async def get_index_stats(self, index_name: str) -> Dict[str, Any]:
        """获取索引统计信息"""
        try:
            stats = await self.es_client.indices.stats(index=index_name)
            index_stats = stats['indices'][index_name]
            
            return {
                "document_count": index_stats['total']['docs']['count'],
                "size_in_bytes": index_stats['total']['store']['size_in_bytes'],
                "size_mb": round(index_stats['total']['store']['size_in_bytes'] / 1024 / 1024, 2)
            }
        except Exception as e:
            logger.error(f"获取索引统计失败: {e}")
            return {}

    async def clear_index(self, index_name: str, confirm: bool = False) -> bool:
        """清空指定索引的所有数据"""
        if not confirm:
            logger.warning(f"需要确认才能清空索引 {index_name}")
            return False
        
        try:
            # 获取清理前的统计信息
            stats_before = await self.get_index_stats(index_name)
            logger.info(f"清理前索引 {index_name} 统计: {stats_before}")
            
            # 删除所有文档
            response = await self.es_client.delete_by_query(
                index=index_name,
                body={"query": {"match_all": {}}},
                wait_for_completion=True,
                refresh=True
            )
            
            deleted_count = response.get('deleted', 0)
            logger.info(f"已从索引 {index_name} 删除 {deleted_count} 个文档")
            
            # 强制刷新索引
            await self.es_client.indices.refresh(index=index_name)
            
            # 获取清理后的统计信息
            stats_after = await self.get_index_stats(index_name)
            logger.info(f"清理后索引 {index_name} 统计: {stats_after}")
            
            return True
            
        except Exception as e:
            logger.error(f"清空索引 {index_name} 失败: {e}")
            return False

    async def delete_index(self, index_name: str, confirm: bool = False) -> bool:
        """删除指定索引"""
        if not confirm:
            logger.warning(f"需要确认才能删除索引 {index_name}")
            return False
        
        try:
            exists = await self.es_client.indices.exists(index=index_name)
            if not exists:
                logger.warning(f"索引 {index_name} 不存在")
                return False
            
            await self.es_client.indices.delete(index=index_name)
            logger.info(f"已删除索引 {index_name}")
            return True
            
        except Exception as e:
            logger.error(f"删除索引 {index_name} 失败: {e}")
            return False

    async def cleanup_failed_tasks_data(self, days: int = 7) -> Dict[str, int]:
        """清理失败任务相关的数据"""
        cleanup_stats = {
            "failed_chunks": 0,
            "orphaned_chunks": 0,
            "failed_documents": 0,
            "cleaned_tasks": 0
        }
        
        try:
            async with get_async_session() as session:
                # 1. 获取失败的任务
                cutoff_date = get_china_now() - timedelta(days=days)
                
                failed_tasks_query = text("""
                    SELECT DISTINCT task_data->>'document_id' as document_id
                    FROM task_queue 
                    WHERE status = 'failed' 
                    AND completed_at < :cutoff_date
                    AND task_data->>'document_id' IS NOT NULL
                """)
                
                result = await session.execute(failed_tasks_query, {"cutoff_date": cutoff_date})
                failed_document_ids = [row.document_id for row in result.fetchall()]
                
                if failed_document_ids:
                    logger.info(f"发现 {len(failed_document_ids)} 个失败任务的文档ID")
                    
                    # 2. 清理相关的ES数据
                    for doc_id in failed_document_ids:
                        # 从各个索引中删除相关数据
                        indices = await self.list_indices()
                        for index in indices:
                            if 'chunks' in index or 'vectors' in index:
                                try:
                                    response = await self.es_client.delete_by_query(
                                        index=index,
                                        body={
                                            "query": {
                                                "term": {"document_id": doc_id}
                                            }
                                        }
                                    )
                                    deleted = response.get('deleted', 0)
                                    if deleted > 0:
                                        cleanup_stats["failed_chunks"] += deleted
                                        logger.info(f"从索引 {index} 删除了 {deleted} 个相关文档")
                                except Exception as e:
                                    logger.warning(f"清理索引 {index} 中文档 {doc_id} 的数据失败: {e}")
                    
                    # 3. 清理数据库中的相关数据
                    cleanup_chunks_query = text("""
                        DELETE FROM document_chunks 
                        WHERE document_id = ANY(:document_ids)
                    """)
                    
                    cleanup_docs_query = text("""
                        UPDATE knowledge_documents 
                        SET status = 'cleanup_required',
                            vector_status = '{}'::jsonb
                        WHERE id = ANY(:document_ids)
                        AND status = 'failed'
                    """)
                    
                    # 执行清理
                    chunks_result = await session.execute(cleanup_chunks_query, {"document_ids": failed_document_ids})
                    docs_result = await session.execute(cleanup_docs_query, {"document_ids": failed_document_ids})
                    
                    cleanup_stats["failed_chunks"] += chunks_result.rowcount
                    cleanup_stats["failed_documents"] = docs_result.rowcount
                    
                    # 4. 删除失败的任务记录
                    cleanup_tasks_query = text("""
                        DELETE FROM task_queue 
                        WHERE status = 'failed' 
                        AND completed_at < :cutoff_date
                    """)
                    
                    tasks_result = await session.execute(cleanup_tasks_query, {"cutoff_date": cutoff_date})
                    cleanup_stats["cleaned_tasks"] = tasks_result.rowcount
                    
                    await session.commit()
                    logger.info(f"清理了 {cleanup_stats['cleaned_tasks']} 个失败任务记录")
                
        except Exception as e:
            logger.error(f"清理失败任务数据时出错: {e}")
        
        return cleanup_stats

    async def cleanup_orphaned_chunks(self) -> int:
        """清理孤立的chunk数据（数据库中不存在对应文档的chunk）"""
        orphaned_count = 0
        
        try:
            async with get_async_session() as session:
                # 查找孤立的chunks
                orphaned_query = text("""
                    SELECT dc.id, dc.document_id
                    FROM document_chunks dc
                    LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
                    WHERE kd.id IS NULL
                """)
                
                result = await session.execute(orphaned_query)
                orphaned_chunks = result.fetchall()
                
                if orphaned_chunks:
                    logger.info(f"发现 {len(orphaned_chunks)} 个孤立的chunk记录")
                    
                    # 从ES中删除孤立的chunks
                    chunk_ids = [chunk.id for chunk in orphaned_chunks]
                    document_ids = list(set([chunk.document_id for chunk in orphaned_chunks]))
                    
                    indices = await self.list_indices()
                    for index in indices:
                        if 'chunks' in index or 'vectors' in index:
                            try:
                                # 按document_id删除
                                for doc_id in document_ids:
                                    response = await self.es_client.delete_by_query(
                                        index=index,
                                        body={
                                            "query": {
                                                "term": {"document_id": doc_id}
                                            }
                                        }
                                    )
                                    deleted = response.get('deleted', 0)
                                    if deleted > 0:
                                        orphaned_count += deleted
                                        logger.info(f"从索引 {index} 删除了 {deleted} 个孤立chunk")
                            except Exception as e:
                                logger.warning(f"清理索引 {index} 中孤立chunks失败: {e}")
                    
                    # 从数据库中删除孤立的chunks
                    delete_query = text("""
                        DELETE FROM document_chunks 
                        WHERE id = ANY(:chunk_ids)
                    """)
                    
                    result = await session.execute(delete_query, {"chunk_ids": chunk_ids})
                    await session.commit()
                    
                    logger.info(f"从数据库删除了 {result.rowcount} 个孤立chunk记录")
                
        except Exception as e:
            logger.error(f"清理孤立chunks失败: {e}")
        
        return orphaned_count

    async def cleanup_expired_tasks(self) -> int:
        """清理过期的任务"""
        try:
            async with get_async_session() as session:
                query = text("""
                    DELETE FROM task_queue 
                    WHERE expires_at < CURRENT_TIMESTAMP
                    AND status NOT IN ('running')
                """)
                
                result = await session.execute(query)
                await session.commit()
                
                deleted_count = result.rowcount
                logger.info(f"清理了 {deleted_count} 个过期任务")
                return deleted_count
                
        except Exception as e:
            logger.error(f"清理过期任务失败: {e}")
            return 0

    async def rebuild_index_mappings(self, index_name: str) -> bool:
        """重建索引映射"""
        try:
            # 检查索引是否存在
            exists = await self.es_client.indices.exists(index=index_name)
            if not exists:
                logger.warning(f"索引 {index_name} 不存在，无法重建")
                return False
            
            # 获取当前映射
            mappings = await self.es_client.indices.get_mapping(index=index_name)
            current_mapping = mappings[index_name]['mappings']
            
            # 创建新的索引名
            new_index_name = f"{index_name}_temp_{int(datetime.now().timestamp())}"
            
            # 创建新索引
            await self.es_client.indices.create(
                index=new_index_name,
                body={"mappings": current_mapping}
            )
            
            # 重建数据
            await self.es_client.reindex(
                body={
                    "source": {"index": index_name},
                    "dest": {"index": new_index_name}
                },
                wait_for_completion=True
            )
            
            # 删除旧索引
            await self.es_client.indices.delete(index=index_name)
            
            # 重命名新索引
            await self.es_client.indices.put_alias(
                index=new_index_name,
                name=index_name
            )
            
            logger.info(f"索引 {index_name} 重建完成")
            return True
            
        except Exception as e:
            logger.error(f"重建索引 {index_name} 失败: {e}")
            return False

    async def get_cleanup_summary(self) -> Dict[str, Any]:
        """获取清理摘要信息"""
        summary = {
            "indices": {},
            "database_stats": {},
            "tasks_stats": {}
        }
        
        try:
            # ES索引信息
            indices = await self.list_indices()
            for index in indices:
                summary["indices"][index] = await self.get_index_stats(index)
            
            # 数据库统计
            async with get_async_session() as session:
                # 文档统计
                doc_stats_query = text("""
                    SELECT status, COUNT(*) as count
                    FROM knowledge_documents
                    GROUP BY status
                """)
                result = await session.execute(doc_stats_query)
                summary["database_stats"]["documents"] = {row.status: row.count for row in result.fetchall()}
                
                # Chunk统计
                chunk_stats_query = text("""
                    SELECT COUNT(*) as total_chunks,
                           COUNT(DISTINCT document_id) as unique_documents
                    FROM document_chunks
                """)
                result = await session.execute(chunk_stats_query)
                row = result.fetchone()
                summary["database_stats"]["chunks"] = {
                    "total": row.total_chunks,
                    "unique_documents": row.unique_documents
                }
                
                # 任务统计
                task_stats_query = text("""
                    SELECT status, COUNT(*) as count
                    FROM task_queue
                    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
                    GROUP BY status
                """)
                result = await session.execute(task_stats_query)
                summary["tasks_stats"] = {row.status: row.count for row in result.fetchall()}
            
        except Exception as e:
            logger.error(f"获取清理摘要失败: {e}")
        
        return summary

    # MinIO相关方法
    def get_minio_stats(self) -> Dict[str, Any]:
        """获取MinIO存储统计信息"""
        if not self.minio_client or not MINIO_AVAILABLE:
            return {"error": "MinIO客户端不可用"}
        
        try:
            stats = {
                "buckets": {},
                "total_objects": 0,
                "total_size_bytes": 0
            }
            
            # 获取所有bucket
            buckets = self.minio_client.list_buckets()
            
            for bucket in buckets:
                bucket_name = bucket.name
                bucket_stats = {
                    "object_count": 0,
                    "total_size": 0,
                    "creation_date": bucket.creation_date
                }
                
                # 统计bucket中的对象
                objects = self.minio_client.list_objects(bucket_name, recursive=True)
                for obj in objects:
                    bucket_stats["object_count"] += 1
                    bucket_stats["total_size"] += obj.size
                    stats["total_objects"] += 1
                    stats["total_size_bytes"] += obj.size
                
                stats["buckets"][bucket_name] = bucket_stats
            
            return stats
            
        except Exception as e:
            logger.error(f"获取MinIO统计信息失败: {e}")
            return {"error": str(e)}
    
    def list_minio_files(self, bucket_name: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """列出MinIO中的文件"""
        if not self.minio_client or not MINIO_AVAILABLE:
            return []
        
        try:
            files = []
            
            buckets_to_check = []
            if bucket_name:
                buckets_to_check = [bucket_name]
            else:
                buckets_to_check = [bucket.name for bucket in self.minio_client.list_buckets()]
            
            for bucket in buckets_to_check:
                try:
                    objects = self.minio_client.list_objects(bucket, recursive=True)
                    for obj in objects:
                        files.append({
                            "bucket": bucket,
                            "object_name": obj.object_name,
                            "size": obj.size,
                            "last_modified": obj.last_modified,
                            "etag": obj.etag
                        })
                        
                        if len(files) >= limit:
                            break
                    
                    if len(files) >= limit:
                        break
                        
                except Exception as bucket_error:
                    logger.warning(f"无法访问bucket {bucket}: {bucket_error}")
                    continue
            
            return files
            
        except Exception as e:
            logger.error(f"列出MinIO文件失败: {e}")
            return []
    
    def clear_minio_files(self, confirm: bool = False, bucket_name: str = None) -> Dict[str, Any]:
        """清空MinIO中的所有文件（保留bucket）"""
        if not self.minio_client or not MINIO_AVAILABLE:
            return {"error": "MinIO客户端不可用"}
        
        if not confirm:
            return {"error": "需要确认参数才能执行清空操作"}
        
        try:
            result = {
                "deleted_files": 0,
                "deleted_buckets": [],
                "errors": []
            }
            
            buckets_to_clear = []
            if bucket_name:
                # 检查bucket是否存在
                if self.minio_client.bucket_exists(bucket_name):
                    buckets_to_clear = [bucket_name]
                else:
                    return {"error": f"Bucket {bucket_name} 不存在"}
            else:
                buckets_to_clear = [bucket.name for bucket in self.minio_client.list_buckets()]
            
            for bucket in buckets_to_clear:
                try:
                    # 获取bucket中的所有对象
                    objects = self.minio_client.list_objects(bucket, recursive=True)
                    
                    # 批量删除对象
                    objects_to_delete = []
                    for obj in objects:
                        objects_to_delete.append(obj.object_name)
                    
                    if objects_to_delete:
                        # MinIO支持批量删除
                        errors = self.minio_client.remove_objects(
                            bucket, 
                            objects_to_delete
                        )
                        
                        # 检查删除错误
                        error_count = 0
                        for error in errors:
                            error_count += 1
                            result["errors"].append(f"删除 {bucket}/{error.object_name} 失败: {error}")
                        
                        deleted_count = len(objects_to_delete) - error_count
                        result["deleted_files"] += deleted_count
                        result["deleted_buckets"].append(bucket)
                        
                        logger.info(f"Bucket {bucket}: 删除了 {deleted_count} 个文件")
                    else:
                        logger.info(f"Bucket {bucket} 已经为空")
                        result["deleted_buckets"].append(bucket)
                
                except Exception as bucket_error:
                    error_msg = f"清空bucket {bucket} 失败: {bucket_error}"
                    logger.error(error_msg)
                    result["errors"].append(error_msg)
            
            logger.info(f"MinIO清理完成: 删除了 {result['deleted_files']} 个文件")
            return result
            
        except Exception as e:
            logger.error(f"清空MinIO文件失败: {e}")
            return {"error": str(e)}
    
    def delete_minio_bucket_files(self, bucket_name: str, prefix: str = "", confirm: bool = False) -> Dict[str, Any]:
        """删除指定bucket中的文件（可选前缀过滤）"""
        if not self.minio_client or not MINIO_AVAILABLE:
            return {"error": "MinIO客户端不可用"}
        
        if not confirm:
            return {"error": "需要确认参数才能执行删除操作"}
        
        try:
            # 检查bucket是否存在
            if not self.minio_client.bucket_exists(bucket_name):
                return {"error": f"Bucket {bucket_name} 不存在"}
            
            result = {
                "bucket": bucket_name,
                "prefix": prefix,
                "deleted_files": 0,
                "errors": []
            }
            
            # 获取匹配的对象
            objects = self.minio_client.list_objects(bucket_name, prefix=prefix, recursive=True)
            
            objects_to_delete = []
            for obj in objects:
                objects_to_delete.append(obj.object_name)
            
            if objects_to_delete:
                # 批量删除
                errors = self.minio_client.remove_objects(bucket_name, objects_to_delete)
                
                error_count = 0
                for error in errors:
                    error_count += 1
                    result["errors"].append(f"删除 {error.object_name} 失败: {error}")
                
                result["deleted_files"] = len(objects_to_delete) - error_count
                logger.info(f"删除了 {result['deleted_files']} 个文件从 bucket {bucket_name}")
            else:
                logger.info(f"Bucket {bucket_name} 中没有匹配的文件")
            
            return result
            
        except Exception as e:
            logger.error(f"删除bucket文件失败: {e}")
            return {"error": str(e)}


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="ES数据清理脚本（包含MinIO支持）")
    parser.add_argument("--action", choices=[
        "list", "clear", "delete", "cleanup-failed", "cleanup-orphaned", 
        "cleanup-expired", "rebuild", "summary",
        "minio-stats", "minio-list", "minio-clear", "minio-clear-bucket"
    ], required=True, help="执行的操作")
    parser.add_argument("--index", help="索引名称")
    parser.add_argument("--bucket", help="MinIO bucket名称")
    parser.add_argument("--prefix", help="MinIO对象前缀")
    parser.add_argument("--limit", type=int, default=100, help="列出文件的数量限制")
    parser.add_argument("--confirm", action="store_true", help="确认执行危险操作")
    parser.add_argument("--days", type=int, default=7, help="清理多少天前的数据")
    
    args = parser.parse_args()
    
    cleanup = ESDataCleanup()
    
    try:
        await cleanup.initialize()
        
        if args.action == "list":
            indices = await cleanup.list_indices()
            print("ES索引列表:")
            for idx in indices:
                stats = await cleanup.get_index_stats(idx)
                print(f"  {idx}: {stats.get('document_count', 0)} docs, {stats.get('size_mb', 0)} MB")
        
        elif args.action == "clear":
            if not args.index:
                print("错误: 需要指定索引名称")
                return
            success = await cleanup.clear_index(args.index, args.confirm)
            if success:
                print(f"索引 {args.index} 清空完成")
            else:
                print(f"索引 {args.index} 清空失败")
        
        elif args.action == "delete":
            if not args.index:
                print("错误: 需要指定索引名称")
                return
            success = await cleanup.delete_index(args.index, args.confirm)
            if success:
                print(f"索引 {args.index} 删除完成")
            else:
                print(f"索引 {args.index} 删除失败")
        
        elif args.action == "cleanup-failed":
            stats = await cleanup.cleanup_failed_tasks_data(args.days)
            print(f"失败任务清理完成:")
            print(f"  清理的chunks: {stats['failed_chunks']}")
            print(f"  清理的文档: {stats['failed_documents']}")
            print(f"  清理的任务: {stats['cleaned_tasks']}")
        
        elif args.action == "cleanup-orphaned":
            count = await cleanup.cleanup_orphaned_chunks()
            print(f"孤立数据清理完成: {count} 个chunks")
        
        elif args.action == "cleanup-expired":
            count = await cleanup.cleanup_expired_tasks()
            print(f"过期任务清理完成: {count} 个任务")
        
        elif args.action == "rebuild":
            if not args.index:
                print("错误: 需要指定索引名称")
                return
            success = await cleanup.rebuild_index_mappings(args.index)
            if success:
                print(f"索引 {args.index} 重建完成")
            else:
                print(f"索引 {args.index} 重建失败")
        
        elif args.action == "summary":
            summary = await cleanup.get_cleanup_summary()
            print("系统数据摘要:")
            print(json.dumps(summary, indent=2, ensure_ascii=False, default=str))
        
        # MinIO相关操作
        elif args.action == "minio-stats":
            if not MINIO_AVAILABLE:
                print("错误: MinIO SDK未安装，请安装: pip install minio")
                return
            
            stats = cleanup.get_minio_stats()
            if "error" in stats:
                print(f"错误: {stats['error']}")
            else:
                print("MinIO存储统计:")
                print(f"总对象数: {stats['total_objects']}")
                print(f"总大小: {stats['total_size_bytes'] / (1024*1024):.2f} MB")
                print("\nBucket详情:")
                for bucket_name, bucket_stats in stats['buckets'].items():
                    print(f"  {bucket_name}:")
                    print(f"    对象数: {bucket_stats['object_count']}")
                    print(f"    大小: {bucket_stats['total_size'] / (1024*1024):.2f} MB")
                    print(f"    创建时间: {bucket_stats['creation_date']}")
        
        elif args.action == "minio-list":
            if not MINIO_AVAILABLE:
                print("错误: MinIO SDK未安装，请安装: pip install minio")
                return
                
            files = cleanup.list_minio_files(args.bucket, args.limit)
            if not files:
                print("没有找到文件或MinIO不可用")
            else:
                print(f"MinIO文件列表 (限制: {args.limit}):")
                for file_info in files:
                    print(f"  {file_info['bucket']}/{file_info['object_name']}")
                    print(f"    大小: {file_info['size'] / 1024:.2f} KB")
                    print(f"    修改时间: {file_info['last_modified']}")
                    print()
        
        elif args.action == "minio-clear":
            if not MINIO_AVAILABLE:
                print("错误: MinIO SDK未安装，请安装: pip install minio")
                return
            
            if not args.confirm:
                print("警告: 这将删除所有MinIO文件（保留bucket）！")
                print("使用 --confirm 参数确认执行")
                return
            
            print("正在清空MinIO文件...")
            result = cleanup.clear_minio_files(args.confirm, args.bucket)
            
            if "error" in result:
                print(f"错误: {result['error']}")
            else:
                print("MinIO文件清理完成:")
                print(f"  删除的文件: {result['deleted_files']}")
                print(f"  处理的bucket: {', '.join(result['deleted_buckets'])}")
                if result['errors']:
                    print("  错误:")
                    for error in result['errors']:
                        print(f"    {error}")
        
        elif args.action == "minio-clear-bucket":
            if not MINIO_AVAILABLE:
                print("错误: MinIO SDK未安装，请安装: pip install minio")
                return
            
            if not args.bucket:
                print("错误: 需要指定bucket名称")
                return
            
            if not args.confirm:
                print(f"警告: 这将删除bucket {args.bucket} 中的所有文件！")
                if args.prefix:
                    print(f"前缀过滤: {args.prefix}")
                print("使用 --confirm 参数确认执行")
                return
            
            print(f"正在清空bucket {args.bucket}...")
            result = cleanup.delete_minio_bucket_files(args.bucket, args.prefix or "", args.confirm)
            
            if "error" in result:
                print(f"错误: {result['error']}")
            else:
                print("Bucket文件清理完成:")
                print(f"  Bucket: {result['bucket']}")
                print(f"  前缀: {result['prefix'] or '无'}")
                print(f"  删除的文件: {result['deleted_files']}")
                if result['errors']:
                    print("  错误:")
                    for error in result['errors']:
                        print(f"    {error}")
    
    except Exception as e:
        logger.error(f"执行失败: {e}")
        print(f"错误: {e}")
    
    finally:
        await cleanup.close()


if __name__ == "__main__":
    asyncio.run(main()) 