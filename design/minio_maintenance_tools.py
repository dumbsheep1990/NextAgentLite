#!/usr/bin/env python3
"""
NextAgent Lite MinIO存储维护工具集
包括文档备份、缓存清理、监控分析、数据迁移等功能
"""

import json
import os
import sys
import time
import argparse
import hashlib
import shutil
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# MinIO相关导入
try:
    from minio import Minio
    from minio.error import S3Error, InvalidResponseError
    from minio.helpers import ObjectWriteResult
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("⚠️  minio包未安装")

# 其他依赖
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


class MinIOMaintenanceTools:
    """MinIO维护工具集"""
    
    def __init__(self, config: Dict[str, Any], environment: str = "development"):
        if not MINIO_AVAILABLE:
            raise RuntimeError("minio包未安装")
        
        self.config = config
        self.environment = environment
        self.connection_config = config.get('connection_settings', {}).get(environment, {})
        
        # 初始化客户端
        self.client = Minio(
            endpoint=self.connection_config.get('endpoint'),
            access_key=self.connection_config.get('access_key'),
            secret_key=self.connection_config.get('secret_key'),
            secure=self.connection_config.get('secure', False),
            region=self.connection_config.get('region', 'us-east-1')
        )
        
        # 工作目录
        self.work_dir = Path('./minio_maintenance')
        self.work_dir.mkdir(exist_ok=True)
        
        # 备份目录
        self.backup_dir = self.work_dir / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
        
        # 日志目录
        self.log_dir = self.work_dir / 'logs'
        self.log_dir.mkdir(exist_ok=True)
    
    def backup_bucket(self, bucket_name: str, backup_path: Optional[str] = None) -> bool:
        """备份存储桶"""
        if backup_path is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = self.backup_dir / f"{bucket_name}_backup_{timestamp}"
        
        backup_path = Path(backup_path)
        backup_path.mkdir(parents=True, exist_ok=True)
        
        print(f"📦 开始备份存储桶: {bucket_name}")
        print(f"备份路径: {backup_path}")
        
        try:
            # 检查存储桶是否存在
            if not self.client.bucket_exists(bucket_name):
                print(f"❌ 存储桶不存在: {bucket_name}")
                return False
            
            # 获取所有对象
            objects = list(self.client.list_objects(bucket_name, recursive=True))
            total_objects = len(objects)
            
            if total_objects == 0:
                print(f"⚠️  存储桶为空: {bucket_name}")
                return True
            
            print(f"发现 {total_objects} 个对象")
            
            # 创建元数据文件
            metadata = {
                "bucket_name": bucket_name,
                "backup_time": datetime.now().isoformat(),
                "environment": self.environment,
                "total_objects": total_objects,
                "objects": []
            }
            
            # 下载对象
            downloaded_count = 0
            failed_count = 0
            
            for i, obj in enumerate(objects, 1):
                try:
                    # 创建本地目录结构
                    local_path = backup_path / obj.object_name
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # 下载对象
                    self.client.fget_object(bucket_name, obj.object_name, str(local_path))
                    
                    # 记录元数据
                    obj_metadata = {
                        "object_name": obj.object_name,
                        "size": obj.size,
                        "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                        "etag": obj.etag,
                        "content_type": obj.content_type,
                        "local_path": str(local_path.relative_to(backup_path))
                    }
                    metadata["objects"].append(obj_metadata)
                    
                    downloaded_count += 1
                    if i % 10 == 0 or i == total_objects:
                        print(f"  进度: {i}/{total_objects} ({i/total_objects*100:.1f}%)")
                    
                except Exception as e:
                    print(f"  ❌ 下载失败 {obj.object_name}: {e}")
                    failed_count += 1
                    continue
            
            # 保存元数据
            metadata_file = backup_path / "backup_metadata.json"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            # 创建校验和文件
            self._create_checksum_file(backup_path)
            
            print(f"✅ 备份完成: {downloaded_count} 成功, {failed_count} 失败")
            return failed_count == 0
            
        except Exception as e:
            print(f"❌ 备份失败: {e}")
            return False
    
    def restore_bucket(self, backup_path: str, target_bucket: str) -> bool:
        """从备份恢复存储桶"""
        backup_path = Path(backup_path)
        
        print(f"📥 开始恢复存储桶到: {target_bucket}")
        print(f"备份路径: {backup_path}")
        
        try:
            # 检查备份路径
            if not backup_path.exists():
                print(f"❌ 备份路径不存在: {backup_path}")
                return False
            
            # 加载元数据
            metadata_file = backup_path / "backup_metadata.json"
            if not metadata_file.exists():
                print(f"❌ 元数据文件不存在: {metadata_file}")
                return False
            
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # 确保目标存储桶存在
            if not self.client.bucket_exists(target_bucket):
                self.client.make_bucket(target_bucket)
                print(f"✅ 创建目标存储桶: {target_bucket}")
            
            # 恢复对象
            total_objects = len(metadata["objects"])
            restored_count = 0
            failed_count = 0
            
            for i, obj_metadata in enumerate(metadata["objects"], 1):
                try:
                    local_path = backup_path / obj_metadata["local_path"]
                    
                    if not local_path.exists():
                        print(f"  ⚠️  本地文件不存在: {local_path}")
                        failed_count += 1
                        continue
                    
                    # 上传对象
                    self.client.fput_object(
                        bucket_name=target_bucket,
                        object_name=obj_metadata["object_name"],
                        file_path=str(local_path),
                        content_type=obj_metadata.get("content_type")
                    )
                    
                    restored_count += 1
                    if i % 10 == 0 or i == total_objects:
                        print(f"  进度: {i}/{total_objects} ({i/total_objects*100:.1f}%)")
                    
                except Exception as e:
                    print(f"  ❌ 恢复失败 {obj_metadata['object_name']}: {e}")
                    failed_count += 1
                    continue
            
            print(f"✅ 恢复完成: {restored_count} 成功, {failed_count} 失败")
            return failed_count == 0
            
        except Exception as e:
            print(f"❌ 恢复失败: {e}")
            return False
    
    def cleanup_old_objects(self, bucket_name: str, days_old: int = 30, 
                           prefix: str = "", dry_run: bool = True) -> Tuple[int, int]:
        """清理过期对象"""
        print(f"🧹 清理过期对象: {bucket_name} (>{days_old} 天)")
        if prefix:
            print(f"前缀过滤: {prefix}")
        if dry_run:
            print("📋 模拟运行模式 (不会实际删除)")
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            # 获取对象列表
            objects = list(self.client.list_objects(bucket_name, prefix=prefix, recursive=True))
            
            old_objects = []
            for obj in objects:
                if obj.last_modified and obj.last_modified < cutoff_date:
                    old_objects.append(obj)
            
            print(f"发现 {len(old_objects)} 个过期对象 (共 {len(objects)} 个)")
            
            if not old_objects:
                return 0, 0
            
            # 显示将要删除的对象
            if dry_run and old_objects:
                print("\n将要删除的对象:")
                for obj in old_objects[:10]:  # 只显示前10个
                    print(f"  - {obj.object_name} ({obj.last_modified})")
                if len(old_objects) > 10:
                    print(f"  ... 还有 {len(old_objects) - 10} 个对象")
                print()
            
            deleted_count = 0
            failed_count = 0
            
            if not dry_run:
                # 批量删除
                for i in range(0, len(old_objects), 1000):  # 每批1000个
                    batch = old_objects[i:i + 1000]
                    object_names = [obj.object_name for obj in batch]
                    
                    try:
                        # MinIO的批量删除
                        from minio.deleteobjects import DeleteObject
                        delete_objects = [DeleteObject(name) for name in object_names]
                        
                        errors = self.client.remove_objects(bucket_name, delete_objects)
                        
                        batch_deleted = len(batch)
                        batch_failed = 0
                        
                        for error in errors:
                            print(f"  ❌ 删除失败: {error.object_name} - {error.message}")
                            batch_failed += 1
                            batch_deleted -= 1
                        
                        deleted_count += batch_deleted
                        failed_count += batch_failed
                        
                        if (i // 1000 + 1) % 10 == 0:
                            print(f"  进度: {min(i + 1000, len(old_objects))}/{len(old_objects)}")
                        
                    except Exception as e:
                        print(f"  ❌ 批量删除失败: {e}")
                        failed_count += len(batch)
            
            if dry_run:
                print(f"📋 模拟结果: 将删除 {len(old_objects)} 个对象")
                return len(old_objects), 0
            else:
                print(f"✅ 清理完成: {deleted_count} 删除, {failed_count} 失败")
                return deleted_count, failed_count
            
        except Exception as e:
            print(f"❌ 清理失败: {e}")
            return 0, len(old_objects) if 'old_objects' in locals() else 0
    
    def analyze_storage_usage(self, bucket_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """分析存储使用情况"""
        print("📊 分析存储使用情况...")
        
        if bucket_names is None:
            bucket_names = [bucket.name for bucket in self.client.list_buckets()]
        
        analysis = {
            "timestamp": datetime.now().isoformat(),
            "total_buckets": len(bucket_names),
            "buckets": {},
            "summary": {
                "total_objects": 0,
                "total_size": 0,
                "largest_object": None,
                "oldest_object": None,
                "newest_object": None
            }
        }
        
        all_objects = []
        
        for bucket_name in bucket_names:
            print(f"  分析存储桶: {bucket_name}")
            
            try:
                if not self.client.bucket_exists(bucket_name):
                    print(f"    ⚠️  存储桶不存在: {bucket_name}")
                    continue
                
                objects = list(self.client.list_objects(bucket_name, recursive=True))
                
                bucket_analysis = {
                    "objects_count": len(objects),
                    "total_size": 0,
                    "file_types": {},
                    "size_distribution": {
                        "<1KB": 0, "1KB-1MB": 0, "1MB-10MB": 0, 
                        "10MB-100MB": 0, "100MB-1GB": 0, ">1GB": 0
                    },
                    "largest_object": None,
                    "oldest_object": None,
                    "newest_object": None
                }
                
                for obj in objects:
                    # 基本统计
                    bucket_analysis["total_size"] += obj.size or 0
                    
                    # 文件类型统计
                    if obj.object_name:
                        ext = Path(obj.object_name).suffix.lower()
                        if not ext:
                            ext = "无扩展名"
                        bucket_analysis["file_types"][ext] = bucket_analysis["file_types"].get(ext, 0) + 1
                    
                    # 大小分布
                    size = obj.size or 0
                    if size < 1024:
                        bucket_analysis["size_distribution"]["<1KB"] += 1
                    elif size < 1024 * 1024:
                        bucket_analysis["size_distribution"]["1KB-1MB"] += 1
                    elif size < 10 * 1024 * 1024:
                        bucket_analysis["size_distribution"]["1MB-10MB"] += 1
                    elif size < 100 * 1024 * 1024:
                        bucket_analysis["size_distribution"]["10MB-100MB"] += 1
                    elif size < 1024 * 1024 * 1024:
                        bucket_analysis["size_distribution"]["100MB-1GB"] += 1
                    else:
                        bucket_analysis["size_distribution"][">1GB"] += 1
                    
                    # 记录极值
                    if not bucket_analysis["largest_object"] or (obj.size or 0) > (bucket_analysis["largest_object"]["size"] or 0):
                        bucket_analysis["largest_object"] = {
                            "name": obj.object_name,
                            "size": obj.size,
                            "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
                        }
                    
                    if not bucket_analysis["oldest_object"] or (obj.last_modified and obj.last_modified < bucket_analysis["oldest_object"]["last_modified"]):
                        bucket_analysis["oldest_object"] = {
                            "name": obj.object_name,
                            "size": obj.size,
                            "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
                        }
                    
                    if not bucket_analysis["newest_object"] or (obj.last_modified and obj.last_modified > bucket_analysis["newest_object"]["last_modified"]):
                        bucket_analysis["newest_object"] = {
                            "name": obj.object_name,
                            "size": obj.size,
                            "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
                        }
                    
                    all_objects.append(obj)
                
                analysis["buckets"][bucket_name] = bucket_analysis
                analysis["summary"]["total_objects"] += bucket_analysis["objects_count"]
                analysis["summary"]["total_size"] += bucket_analysis["total_size"]
                
            except Exception as e:
                print(f"    ❌ 分析失败: {e}")
                analysis["buckets"][bucket_name] = {"error": str(e)}
        
        # 全局统计
        if all_objects:
            largest_obj = max(all_objects, key=lambda x: x.size or 0)
            analysis["summary"]["largest_object"] = {
                "name": largest_obj.object_name,
                "size": largest_obj.size,
                "bucket": next(bucket for bucket, info in analysis["buckets"].items() 
                              if info.get("largest_object", {}).get("name") == largest_obj.object_name)
            }
            
            oldest_obj = min(all_objects, key=lambda x: x.last_modified or datetime.max)
            if oldest_obj.last_modified:
                analysis["summary"]["oldest_object"] = {
                    "name": oldest_obj.object_name,
                    "last_modified": oldest_obj.last_modified.isoformat()
                }
            
            newest_obj = max(all_objects, key=lambda x: x.last_modified or datetime.min)
            if newest_obj.last_modified:
                analysis["summary"]["newest_object"] = {
                    "name": newest_obj.object_name,
                    "last_modified": newest_obj.last_modified.isoformat()
                }
        
        return analysis
    
    def sync_buckets(self, source_bucket: str, target_bucket: str, 
                     prefix: str = "", dry_run: bool = True) -> Tuple[int, int, int]:
        """同步存储桶"""
        print(f"🔄 同步存储桶: {source_bucket} -> {target_bucket}")
        if prefix:
            print(f"前缀过滤: {prefix}")
        if dry_run:
            print("📋 模拟运行模式")
        
        try:
            # 检查源存储桶
            if not self.client.bucket_exists(source_bucket):
                print(f"❌ 源存储桶不存在: {source_bucket}")
                return 0, 0, 0
            
            # 确保目标存储桶存在
            if not self.client.bucket_exists(target_bucket):
                if not dry_run:
                    self.client.make_bucket(target_bucket)
                    print(f"✅ 创建目标存储桶: {target_bucket}")
                else:
                    print(f"📋 将创建目标存储桶: {target_bucket}")
            
            # 获取源对象
            source_objects = {}
            for obj in self.client.list_objects(source_bucket, prefix=prefix, recursive=True):
                source_objects[obj.object_name] = {
                    "size": obj.size,
                    "etag": obj.etag,
                    "last_modified": obj.last_modified
                }
            
            # 获取目标对象
            target_objects = {}
            if self.client.bucket_exists(target_bucket):
                for obj in self.client.list_objects(target_bucket, prefix=prefix, recursive=True):
                    target_objects[obj.object_name] = {
                        "size": obj.size,
                        "etag": obj.etag,
                        "last_modified": obj.last_modified
                    }
            
            # 分析差异
            to_copy = []
            to_update = []
            to_delete = []
            
            for obj_name, obj_info in source_objects.items():
                if obj_name not in target_objects:
                    to_copy.append(obj_name)
                elif (target_objects[obj_name]["etag"] != obj_info["etag"] or 
                      target_objects[obj_name]["size"] != obj_info["size"]):
                    to_update.append(obj_name)
            
            # 查找目标中多余的对象（可选）
            for obj_name in target_objects:
                if obj_name not in source_objects:
                    to_delete.append(obj_name)
            
            print(f"同步计划:")
            print(f"  新增: {len(to_copy)} 个对象")
            print(f"  更新: {len(to_update)} 个对象")
            print(f"  删除: {len(to_delete)} 个对象")
            
            if dry_run:
                return len(to_copy), len(to_update), len(to_delete)
            
            # 执行同步
            copied_count = 0
            updated_count = 0
            deleted_count = 0
            
            # 复制新对象
            for obj_name in to_copy:
                try:
                    self.client.copy_object(
                        bucket_name=target_bucket,
                        object_name=obj_name,
                        source=f"{source_bucket}/{obj_name}"
                    )
                    copied_count += 1
                except Exception as e:
                    print(f"  ❌ 复制失败 {obj_name}: {e}")
            
            # 更新对象
            for obj_name in to_update:
                try:
                    self.client.copy_object(
                        bucket_name=target_bucket,
                        object_name=obj_name,
                        source=f"{source_bucket}/{obj_name}"
                    )
                    updated_count += 1
                except Exception as e:
                    print(f"  ❌ 更新失败 {obj_name}: {e}")
            
            # 删除多余对象（谨慎操作）
            if to_delete:
                print(f"⚠️  发现 {len(to_delete)} 个多余对象，需手动确认删除")
            
            print(f"✅ 同步完成: {copied_count} 新增, {updated_count} 更新")
            return copied_count, updated_count, deleted_count
            
        except Exception as e:
            print(f"❌ 同步失败: {e}")
            return 0, 0, 0
    
    def _create_checksum_file(self, backup_path: Path):
        """创建校验和文件"""
        checksum_file = backup_path / "checksums.md5"
        
        with open(checksum_file, 'w', encoding='utf-8') as f:
            for file_path in backup_path.rglob('*'):
                if file_path.is_file() and file_path.name not in ['backup_metadata.json', 'checksums.md5']:
                    md5_hash = hashlib.md5()
                    with open(file_path, 'rb') as file:
                        for chunk in iter(lambda: file.read(4096), b""):
                            md5_hash.update(chunk)
                    
                    relative_path = file_path.relative_to(backup_path)
                    f.write(f"{md5_hash.hexdigest()}  {relative_path}\n")
    
    def verify_backup_integrity(self, backup_path: str) -> bool:
        """验证备份完整性"""
        backup_path = Path(backup_path)
        checksum_file = backup_path / "checksums.md5"
        
        if not checksum_file.exists():
            print("⚠️  未找到校验和文件")
            return False
        
        print(f"🔍 验证备份完整性: {backup_path}")
        
        failed_files = []
        verified_count = 0
        
        with open(checksum_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                
                expected_hash, file_path = line.strip().split('  ', 1)
                full_path = backup_path / file_path
                
                if not full_path.exists():
                    print(f"  ❌ 文件缺失: {file_path}")
                    failed_files.append(file_path)
                    continue
                
                # 计算实际校验和
                md5_hash = hashlib.md5()
                with open(full_path, 'rb') as file:
                    for chunk in iter(lambda: file.read(4096), b""):
                        md5_hash.update(chunk)
                
                actual_hash = md5_hash.hexdigest()
                
                if actual_hash != expected_hash:
                    print(f"  ❌ 校验和不匹配: {file_path}")
                    failed_files.append(file_path)
                else:
                    verified_count += 1
        
        if failed_files:
            print(f"❌ 验证失败: {len(failed_files)} 个文件有问题")
            return False
        else:
            print(f"✅ 验证成功: {verified_count} 个文件完整")
            return True
    
    def generate_maintenance_report(self) -> Dict[str, Any]:
        """生成维护报告"""
        print("📋 生成维护报告...")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "environment": self.environment,
            "connection": {
                "endpoint": self.connection_config.get('endpoint'),
                "secure": self.connection_config.get('secure', False)
            },
            "storage_analysis": self.analyze_storage_usage(),
            "recommendations": []
        }
        
        # 分析并生成建议
        storage = report["storage_analysis"]
        
        # 检查存储使用
        total_size_gb = storage["summary"]["total_size"] / (1024**3)
        if total_size_gb > 100:
            report["recommendations"].append({
                "type": "storage",
                "level": "warning",
                "message": f"存储使用量较大 ({total_size_gb:.1f}GB)，建议定期清理"
            })
        
        # 检查对象数量
        total_objects = storage["summary"]["total_objects"]
        if total_objects > 100000:
            report["recommendations"].append({
                "type": "performance",
                "level": "info",
                "message": f"对象数量较多 ({total_objects})，可能影响列表性能"
            })
        
        # 检查最旧的对象
        if storage["summary"].get("oldest_object"):
            oldest_date = datetime.fromisoformat(storage["summary"]["oldest_object"]["last_modified"])
            days_old = (datetime.now() - oldest_date).days
            if days_old > 365:
                report["recommendations"].append({
                    "type": "cleanup",
                    "level": "info",
                    "message": f"发现超过一年的旧对象 ({days_old} 天)，考虑归档"
                })
        
        return report


def main():
    parser = argparse.ArgumentParser(description='NextAgent Lite MinIO维护工具')
    parser.add_argument('--config', default='minio_init_config.json', help='配置文件路径')
    parser.add_argument('--environment', choices=['development', 'production', 'docker'],
                       default='development', help='环境')
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 备份命令
    backup_parser = subparsers.add_parser('backup', help='备份存储桶')
    backup_parser.add_argument('bucket', help='存储桶名称')
    backup_parser.add_argument('--path', help='备份路径')
    
    # 恢复命令
    restore_parser = subparsers.add_parser('restore', help='恢复存储桶')
    restore_parser.add_argument('backup_path', help='备份路径')
    restore_parser.add_argument('bucket', help='目标存储桶')
    
    # 清理命令
    cleanup_parser = subparsers.add_parser('cleanup', help='清理过期对象')
    cleanup_parser.add_argument('bucket', help='存储桶名称')
    cleanup_parser.add_argument('--days', type=int, default=30, help='保留天数')
    cleanup_parser.add_argument('--prefix', default='', help='对象前缀')
    cleanup_parser.add_argument('--execute', action='store_true', help='执行删除')
    
    # 分析命令
    analyze_parser = subparsers.add_parser('analyze', help='分析存储使用')
    analyze_parser.add_argument('--buckets', nargs='*', help='指定存储桶')
    analyze_parser.add_argument('--output', help='输出文件')
    
    # 同步命令
    sync_parser = subparsers.add_parser('sync', help='同步存储桶')
    sync_parser.add_argument('source', help='源存储桶')
    sync_parser.add_argument('target', help='目标存储桶')
    sync_parser.add_argument('--prefix', default='', help='对象前缀')
    sync_parser.add_argument('--execute', action='store_true', help='执行同步')
    
    # 报告命令
    report_parser = subparsers.add_parser('report', help='生成维护报告')
    report_parser.add_argument('--output', help='输出文件')
    
    # 验证命令
    verify_parser = subparsers.add_parser('verify', help='验证备份')
    verify_parser.add_argument('backup_path', help='备份路径')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # 检查依赖
    if not MINIO_AVAILABLE:
        print("❌ minio包未安装")
        sys.exit(1)
    
    # 加载配置
    try:
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        config = config['minio_storage_design']
    except Exception as e:
        print(f"❌ 加载配置失败: {e}")
        sys.exit(1)
    
    try:
        tools = MinIOMaintenanceTools(config, args.environment)
        
        if args.command == 'backup':
            success = tools.backup_bucket(args.bucket, args.path)
            sys.exit(0 if success else 1)
            
        elif args.command == 'restore':
            success = tools.restore_bucket(args.backup_path, args.bucket)
            sys.exit(0 if success else 1)
            
        elif args.command == 'cleanup':
            deleted, failed = tools.cleanup_old_objects(
                args.bucket, args.days, args.prefix, not args.execute
            )
            if failed > 0:
                sys.exit(1)
                
        elif args.command == 'analyze':
            analysis = tools.analyze_storage_usage(args.buckets)
            
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(analysis, f, indent=2, ensure_ascii=False)
                print(f"✅ 分析结果保存到: {args.output}")
            else:
                print(json.dumps(analysis, indent=2, ensure_ascii=False))
                
        elif args.command == 'sync':
            copied, updated, deleted = tools.sync_buckets(
                args.source, args.target, args.prefix, not args.execute
            )
            print(f"同步结果: {copied} 新增, {updated} 更新, {deleted} 删除")
            
        elif args.command == 'report':
            report = tools.generate_maintenance_report()
            
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(report, f, indent=2, ensure_ascii=False)
                print(f"✅ 报告保存到: {args.output}")
            else:
                print(json.dumps(report, indent=2, ensure_ascii=False))
                
        elif args.command == 'verify':
            success = tools.verify_backup_integrity(args.backup_path)
            sys.exit(0 if success else 1)
    
    except Exception as e:
        print(f"❌ 命令执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()