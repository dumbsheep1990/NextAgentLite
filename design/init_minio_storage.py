#!/usr/bin/env python3
"""
MinIO对象存储初始化脚本
用于NextAgent Lite
支持存储桶创建、策略配置、用户管理、生命周期设置
"""

import json
import os
import sys
import time
import argparse
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import hashlib

# MinIO相关导入
try:
    from minio import Minio
    from minio.error import S3Error, InvalidResponseError
    from minio.commonconfig import ENABLED, DISABLED
    from minio.lifecycleconfig import LifecycleConfig, Rule, Expiration
    from minio.notificationconfig import NotificationConfig
    from minio.policy import Policy
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("⚠️  minio包未安装，请运行: pip install minio")

# 其他依赖
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("⚠️  requests包未安装，MinIO管理功能受限")


class MinIOManager:
    """MinIO存储管理器"""
    
    def __init__(self, config: Dict[str, Any], environment: str = "development"):
        if not MINIO_AVAILABLE:
            raise RuntimeError("minio包未安装")
        
        self.config = config
        self.environment = environment
        self.connection_config = config.get('connection_settings', {}).get(environment, {})
        self.bucket_definitions = config.get('bucket_definitions', {})
        self.security_policies = config.get('security_policies', {})
        self.user_definitions = config.get('user_definitions', {})
        
        # 初始化MinIO客户端
        self.client = None
        self._init_client()
        
        # 管理API客户端（用于高级功能）
        self.admin_api_url = None
        self.admin_headers = None
        self._init_admin_api()
    
    def _init_client(self):
        """初始化MinIO客户端"""
        try:
            self.client = Minio(
                endpoint=self.connection_config.get('endpoint'),
                access_key=self.connection_config.get('access_key'),
                secret_key=self.connection_config.get('secret_key'),
                secure=self.connection_config.get('secure', False),
                region=self.connection_config.get('region', 'us-east-1')
            )
            print(f"✓ 连接到MinIO: {self.connection_config.get('endpoint')}")
        except Exception as e:
            print(f"✗ MinIO客户端初始化失败: {e}")
            raise
    
    def _init_admin_api(self):
        """初始化管理API"""
        if not REQUESTS_AVAILABLE:
            print("⚠️  管理API功能不可用（缺少requests包）")
            return
        
        endpoint = self.connection_config.get('endpoint')
        secure = self.connection_config.get('secure', False)
        protocol = 'https' if secure else 'http'
        
        self.admin_api_url = f"{protocol}://{endpoint}"
        self.admin_headers = {
            'Content-Type': 'application/json',
            'X-Minio-Time': str(int(time.time()))
        }
    
    def test_connection(self) -> bool:
        """测试MinIO连接"""
        try:
            # 尝试列出存储桶
            buckets = self.client.list_buckets()
            print(f"✓ 连接测试成功，发现 {len(buckets)} 个存储桶")
            return True
        except Exception as e:
            print(f"✗ 连接测试失败: {e}")
            return False
    
    def create_buckets(self) -> bool:
        """创建所有配置的存储桶"""
        print("\n📝 创建MinIO存储桶...")
        success = True
        
        for bucket_name, bucket_config in self.bucket_definitions.items():
            try:
                if self.client.bucket_exists(bucket_name):
                    print(f"  ✓ 存储桶已存在: {bucket_name}")
                    continue
                
                print(f"  📝 创建存储桶: {bucket_name}")
                
                # 创建存储桶
                self.client.make_bucket(
                    bucket_name=bucket_name,
                    location=self.connection_config.get('region', 'us-east-1')
                )
                
                print(f"  ✓ 创建成功: {bucket_name}")
                
                # 配置版本控制
                if bucket_config.get('versioning', False):
                    self._enable_versioning(bucket_name)
                
                # 配置生命周期策略
                if bucket_config.get('lifecycle_policy', {}).get('enabled', False):
                    self._set_lifecycle_policy(bucket_name, bucket_config['lifecycle_policy'])
                
                # 配置CORS
                if 'cors_config' in bucket_config:
                    self._set_cors_policy(bucket_name, bucket_config['cors_config'])
                
            except S3Error as e:
                print(f"  ✗ 创建存储桶失败 {bucket_name}: {e}")
                success = False
            except Exception as e:
                print(f"  ✗ 未知错误 {bucket_name}: {e}")
                success = False
        
        return success
    
    def _enable_versioning(self, bucket_name: str):
        """启用存储桶版本控制"""
        try:
            from minio.versioningconfig import VersioningConfig, ENABLED
            config = VersioningConfig(ENABLED)
            self.client.set_bucket_versioning(bucket_name, config)
            print(f"    ✓ 启用版本控制: {bucket_name}")
        except Exception as e:
            print(f"    ✗ 启用版本控制失败 {bucket_name}: {e}")
    
    def _set_lifecycle_policy(self, bucket_name: str, lifecycle_config: Dict[str, Any]):
        """设置生命周期策略"""
        try:
            from minio.lifecycleconfig import LifecycleConfig, Rule, Expiration, AbortIncompleteMultipartUpload
            
            rules = []
            for rule_config in lifecycle_config.get('rules', []):
                rule_id = rule_config.get('id', 'rule-' + str(int(time.time())))
                status = ENABLED if rule_config.get('status') == 'Enabled' else DISABLED
                
                # 过期设置
                expiration = None
                if 'expiration' in rule_config:
                    exp_config = rule_config['expiration']
                    expiration = Expiration(days=exp_config.get('days'))
                
                # 未完成多部分上传清理
                abort_incomplete = None
                if 'abort_incomplete_multipart_upload' in rule_config:
                    abort_config = rule_config['abort_incomplete_multipart_upload']
                    abort_incomplete = AbortIncompleteMultipartUpload(
                        days_after_initiation=abort_config.get('days_after_initiation', 7)
                    )
                
                # 创建规则
                rule = Rule(
                    rule_id=rule_id,
                    status=status,
                    expiration=expiration,
                    abort_incomplete_multipart_upload=abort_incomplete
                )
                rules.append(rule)
            
            if rules:
                config = LifecycleConfig(rules)
                self.client.set_bucket_lifecycle(bucket_name, config)
                print(f"    ✓ 设置生命周期策略: {bucket_name} ({len(rules)} 条规则)")
            
        except Exception as e:
            print(f"    ✗ 设置生命周期策略失败 {bucket_name}: {e}")
    
    def _set_cors_policy(self, bucket_name: str, cors_config: Dict[str, Any]):
        """设置CORS策略"""
        try:
            from minio.commonconfig import CORSRule
            from minio.corsconfig import CORSConfig
            
            cors_rule = CORSRule(
                allowed_origins=cors_config.get('allowed_origins', ['*']),
                allowed_methods=cors_config.get('allowed_methods', ['GET']),
                allowed_headers=cors_config.get('allowed_headers', ['*']),
                expose_headers=cors_config.get('expose_headers', []),
                max_age_seconds=cors_config.get('max_age_seconds', 3600)
            )
            
            cors_config_obj = CORSConfig([cors_rule])
            self.client.set_bucket_cors(bucket_name, cors_config_obj)
            print(f"    ✓ 设置CORS策略: {bucket_name}")
            
        except Exception as e:
            print(f"    ✗ 设置CORS策略失败 {bucket_name}: {e}")
    
    def create_sample_objects(self) -> bool:
        """创建示例对象"""
        print("\n📁 创建示例对象...")
        success = True
        
        sample_content = {
            "readme.txt": "NextAgent Lite MinIO存储初始化完成\n创建时间: {}\n".format(datetime.now().isoformat()),
            "test.json": json.dumps({
                "system": "NextAgent Lite",
                "version": "2.0.0",
                "initialized_at": datetime.now().isoformat(),
                "environment": self.environment,
                "description": "NextAgent Lite对象存储"
            }, indent=2),
            ".gitkeep": ""
        }
        
        for bucket_name, bucket_config in self.bucket_definitions.items():
            try:
                if not self.client.bucket_exists(bucket_name):
                    continue
                
                # 创建基础目录结构
                example_objects = bucket_config.get('example_objects', [])
                
                for obj_path in example_objects[:2]:  # 只创建前两个示例
                    try:
                        # 使用示例内容
                        if obj_path.endswith('.txt'):
                            content = sample_content['readme.txt']
                        elif obj_path.endswith('.json'):
                            content = sample_content['test.json']
                        else:
                            content = sample_content['.gitkeep']
                        
                        # 上传对象
                        from io import BytesIO
                        data = BytesIO(content.encode('utf-8'))
                        
                        self.client.put_object(
                            bucket_name=bucket_name,
                            object_name=obj_path,
                            data=data,
                            length=len(content.encode('utf-8')),
                            content_type='text/plain'
                        )
                        
                        print(f"  ✓ 创建示例对象: {bucket_name}/{obj_path}")
                        
                    except Exception as e:
                        print(f"  ✗ 创建示例对象失败 {bucket_name}/{obj_path}: {e}")
                        success = False
                        
            except Exception as e:
                print(f"  ✗ 处理存储桶失败 {bucket_name}: {e}")
                success = False
        
        return success
    
    def setup_monitoring(self) -> bool:
        """设置监控"""
        print("\n📊 设置MinIO监控...")
        
        if not REQUESTS_AVAILABLE:
            print("  ⚠️  跳过监控设置（缺少requests包）")
            return True
        
        try:
            monitoring_config = self.config.get('monitoring_config', {})
            
            if monitoring_config.get('metrics', {}).get('enabled', False):
                # 检查指标端点是否可用
                metrics_url = f"{self.admin_api_url}/minio/v2/metrics/cluster"
                try:
                    response = requests.get(metrics_url, timeout=10)
                    if response.status_code == 200:
                        print(f"  ✓ 指标端点可用: {metrics_url}")
                    else:
                        print(f"  ⚠️  指标端点状态异常: {response.status_code}")
                except requests.RequestException as e:
                    print(f"  ✗ 指标端点不可用: {e}")
            
            print("  ✓ 监控设置完成")
            return True
            
        except Exception as e:
            print(f"  ✗ 监控设置失败: {e}")
            return False
    
    def verify_setup(self) -> bool:
        """验证设置结果"""
        print("\n🔍 验证MinIO设置...")
        success = True
        
        # 验证存储桶
        for bucket_name in self.bucket_definitions.keys():
            try:
                if self.client.bucket_exists(bucket_name):
                    # 获取存储桶信息
                    try:
                        # 尝试列出对象
                        objects = list(self.client.list_objects(bucket_name, recursive=True))
                        print(f"  ✓ 存储桶验证成功: {bucket_name} ({len(objects)} 个对象)")
                    except Exception as e:
                        print(f"  ⚠️  存储桶访问受限: {bucket_name} - {e}")
                else:
                    print(f"  ✗ 存储桶不存在: {bucket_name}")
                    success = False
            except Exception as e:
                print(f"  ✗ 存储桶检查失败 {bucket_name}: {e}")
                success = False
        
        # 验证基本功能
        try:
            test_bucket = list(self.bucket_definitions.keys())[0]
            test_object = "test/connection_test.txt"
            test_content = "NextAgent Lite MinIO连接测试"
            
            # 上传测试对象
            from io import BytesIO
            data = BytesIO(test_content.encode('utf-8'))
            self.client.put_object(
                bucket_name=test_bucket,
                object_name=test_object,
                data=data,
                length=len(test_content),
                content_type='text/plain'
            )
            
            # 下载测试对象
            response = self.client.get_object(test_bucket, test_object)
            downloaded_content = response.read().decode('utf-8')
            
            if downloaded_content == test_content:
                print("  ✓ 读写功能测试成功")
            else:
                print("  ✗ 读写功能测试失败：内容不匹配")
                success = False
            
            # 清理测试对象
            self.client.remove_object(test_bucket, test_object)
            print("  ✓ 清理测试对象完成")
            
        except Exception as e:
            print(f"  ✗ 功能测试失败: {e}")
            success = False
        
        return success
    
    def get_status_report(self) -> Dict[str, Any]:
        """获取状态报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "environment": self.environment,
            "connection": {
                "endpoint": self.connection_config.get('endpoint'),
                "secure": self.connection_config.get('secure', False),
                "region": self.connection_config.get('region')
            },
            "buckets": {},
            "overall_status": "unknown"
        }
        
        try:
            # 获取存储桶信息
            for bucket_name in self.bucket_definitions.keys():
                bucket_info = {
                    "exists": False,
                    "objects_count": 0,
                    "total_size": 0,
                    "last_modified": None
                }
                
                try:
                    if self.client.bucket_exists(bucket_name):
                        bucket_info["exists"] = True
                        
                        # 统计对象
                        objects = list(self.client.list_objects(bucket_name, recursive=True))
                        bucket_info["objects_count"] = len(objects)
                        
                        if objects:
                            bucket_info["total_size"] = sum(obj.size for obj in objects if obj.size)
                            bucket_info["last_modified"] = max(obj.last_modified for obj in objects).isoformat()
                
                except Exception as e:
                    bucket_info["error"] = str(e)
                
                report["buckets"][bucket_name] = bucket_info
            
            # 确定整体状态
            existing_buckets = sum(1 for info in report["buckets"].values() if info.get("exists"))
            total_buckets = len(self.bucket_definitions)
            
            if existing_buckets == total_buckets:
                report["overall_status"] = "healthy"
            elif existing_buckets > 0:
                report["overall_status"] = "partial"
            else:
                report["overall_status"] = "failed"
                
        except Exception as e:
            report["error"] = str(e)
            report["overall_status"] = "error"
        
        return report
    
    def run_initialization(self) -> bool:
        """运行完整初始化流程"""
        print("🚀 开始MinIO存储初始化...")
        print("=" * 60)
        
        try:
            # 测试连接
            if not self.test_connection():
                return False
            
            # 创建存储桶
            if not self.create_buckets():
                print("⚠️  部分存储桶创建失败，但继续执行...")
            
            # 创建示例对象
            if not self.create_sample_objects():
                print("⚠️  部分示例对象创建失败，但继续执行...")
            
            # 设置监控
            if not self.setup_monitoring():
                print("⚠️  监控设置失败，但继续执行...")
            
            # 验证设置
            if not self.verify_setup():
                print("⚠️  验证过程发现问题...")
                return False
            
            print("=" * 60)
            print("🎉 MinIO存储初始化完成！")
            
            # 显示状态报告
            report = self.get_status_report()
            self._print_status_report(report)
            
            return True
            
        except Exception as e:
            print(f"✗ 初始化失败: {e}")
            return False
    
    def _print_status_report(self, report: Dict[str, Any]):
        """打印状态报告"""
        print(f"\n📋 MinIO状态报告")
        print(f"时间: {report['timestamp']}")
        print(f"环境: {report['environment']}")
        print(f"连接: {report['connection']['endpoint']}")
        print(f"整体状态: {report['overall_status'].upper()}")
        
        print(f"\n存储桶状态:")
        for bucket_name, bucket_info in report["buckets"].items():
            status = "✓" if bucket_info.get("exists") else "✗"
            count = bucket_info.get("objects_count", 0)
            size = bucket_info.get("total_size", 0)
            size_str = self._format_size(size) if size > 0 else "0 B"
            
            print(f"  {status} {bucket_name}: {count} 个对象, {size_str}")
    
    def _format_size(self, size_bytes: int) -> str:
        """格式化文件大小"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"


def load_config_file(filepath: str) -> Dict[str, Any]:
    """加载配置文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"✗ 配置文件不存在: {filepath}")
        return {}
    except json.JSONDecodeError as e:
        print(f"✗ 配置文件JSON格式错误: {e}")
        return {}
    except Exception as e:
        print(f"✗ 加载配置文件失败: {e}")
        return {}


def create_env_file(environment: str, config: Dict[str, Any]):
    """根据配置创建环境变量文件"""
    connection_config = config.get('minio_storage_design', {}).get('connection_settings', {}).get(environment, {})
    bucket_definitions = config.get('minio_storage_design', {}).get('bucket_definitions', {})
    
    env_vars = [
        f'# NextAgent Lite MinIO配置 ({environment})',
        f'# 生成时间: {datetime.now().isoformat()}',
        f'# 系统版本: 2.0.0',
        f'',
        f'MINIO_ENABLED="true"',
        f'MINIO_ENDPOINT="{connection_config.get("endpoint", "localhost:9000")}"',
        f'MINIO_ACCESS_KEY="{connection_config.get("access_key", "minioadmin")}"',
        f'MINIO_SECRET_KEY="{connection_config.get("secret_key", "minioadmin")}"',
        f'MINIO_SECURE="{str(connection_config.get("secure", False)).lower()}"',
        f'MINIO_REGION="{connection_config.get("region", "us-east-1")}"',
        f'MINIO_PUBLIC_ENDPOINT="{connection_config.get("public_endpoint", "http://localhost:9000")}"',
        f'',
        f'# 存储桶配置'
    ]
    
    # 添加存储桶配置
    for bucket_name, bucket_config in bucket_definitions.items():
        env_var_name = f'MINIO_{bucket_name.replace("-", "_").upper()}_BUCKET'
        env_vars.append(f'{env_var_name}="{bucket_name}"')
    
    env_vars.extend([
        f'',
        f'# 其他配置',
        f'MINIO_PRESIGNED_URL_EXPIRES="3600"',
        f'MINIO_AUTO_CREATE_BUCKETS="false"',
        f'MINIO_SKIP_BUCKET_VALIDATION="false"'
    ])
    
    # 写入文件
    filename = f'.env.minio.{environment}'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(env_vars))
    
    print(f"✓ 创建环境变量文件: {filename}")


def main():
    parser = argparse.ArgumentParser(description='NextAgent Lite MinIO对象存储初始化工具')
    parser.add_argument('--config', default='minio_init_config.json',
                       help='MinIO配置文件路径')
    parser.add_argument('--environment', choices=['development', 'production', 'docker'],
                       default='development', help='目标环境')
    parser.add_argument('--test-only', action='store_true', help='仅执行连接测试')
    parser.add_argument('--create-env', action='store_true', help='创建环境变量文件')
    parser.add_argument('--status-report', action='store_true', help='显示状态报告')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    print("🗂️  NextAgent Lite MinIO存储初始化工具")
    print("=" * 60)
    
    # 检查依赖
    if not MINIO_AVAILABLE:
        print("❌ minio包未安装，请运行: pip install minio")
        sys.exit(1)
    
    # 加载配置
    config = load_config_file(args.config)
    if not config:
        print("❌ 无法加载配置文件")
        sys.exit(1)
    
    # 创建环境变量文件
    if args.create_env:
        create_env_file(args.environment, config)
        if not args.status_report and not args.test_only:
            return
    
    try:
        # 初始化管理器
        manager = MinIOManager(config['minio_storage_design'], args.environment)
        
        if args.test_only:
            # 仅测试连接
            success = manager.test_connection()
            sys.exit(0 if success else 1)
        
        elif args.status_report:
            # 显示状态报告
            report = manager.get_status_report()
            manager._print_status_report(report)
            
            # 保存详细报告
            report_file = f'minio_status_report_{args.environment}.json'
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n详细报告已保存: {report_file}")
            
        else:
            # 完整初始化
            success = manager.run_initialization()
            sys.exit(0 if success else 1)
    
    except Exception as e:
        print(f"❌ 程序执行失败: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()