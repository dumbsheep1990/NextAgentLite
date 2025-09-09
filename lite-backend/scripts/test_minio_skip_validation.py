#!/usr/bin/env python3
"""
MinIO跳过验证功能测试脚本

使用方法:
python scripts/test_minio_skip_validation.py
"""

import os
import sys
import asyncio
from pathlib import Path

# 添加项目根目录到Python路径
current_dir = Path(__file__).parent
project_root = current_dir.parent
sys.path.insert(0, str(project_root))

from service.storage_service import get_storage_service
from core.config_optimized import optimized_config_manager
from core.logger import logger


async def test_minio_skip_validation():
    """测试MinIO跳过验证功能"""
    print("🔧 MinIO跳过验证功能测试")
    print("=" * 50)
    
    # 获取存储服务配置
    config = optimized_config_manager.settings.storage_minio
    
    print(f"📋 当前配置:")
    print(f"   - MinIO启用: {config.enabled}")
    print(f"   - 端点: {config.endpoint}")
    print(f"   - 自动创建存储桶: {config.auto_create_buckets}")
    print(f"   - 跳过存储桶验证: {config.skip_bucket_validation}")
    print()
    
    # 获取存储服务实例
    storage_service = get_storage_service()
    
    if not storage_service:
        print("❌ 存储服务初始化失败")
        return False
    
    if not config.enabled:
        print("ℹ️  MinIO已禁用，使用本地存储模式")
        return True
        
    if not storage_service.minio_client:
        print("❌ MinIO客户端未初始化")
        return False
    
    print("✅ 存储服务初始化成功")
    
    # 测试存储桶列表
    print("\n📁 测试存储桶连接...")
    try:
        buckets = storage_service.list_buckets()
        if buckets:
            print(f"✅ 成功连接MinIO，发现存储桶: {buckets}")
        else:
            print("⚠️  无法获取存储桶列表")
    except Exception as e:
        print(f"❌ 连接MinIO失败: {e}")
        return False
    
    # 测试文件上传（使用小的测试文件）
    print("\n📤 测试文件上传...")
    try:
        test_data = b"MinIO skip validation test content"
        test_filename = "test_skip_validation.txt"
        
        object_name, file_url, file_size = await storage_service.upload_document(
            test_data, test_filename, "text/plain"
        )
        
        print(f"✅ 文件上传成功:")
        print(f"   - 对象名: {object_name}")
        print(f"   - 文件URL: {file_url}")
        print(f"   - 文件大小: {file_size} 字节")
        
        # 测试文件下载
        print("\n📥 测试文件下载...")
        downloaded_data = await storage_service.get_file(
            config.documents_bucket, object_name
        )
        
        if downloaded_data and downloaded_data == test_data:
            print("✅ 文件下载成功，内容匹配")
        else:
            print("❌ 文件下载失败或内容不匹配")
            return False
        
        # 清理测试文件
        print("\n🗑️  清理测试文件...")
        deleted = await storage_service.delete_file(
            config.documents_bucket, object_name
        )
        
        if deleted:
            print("✅ 测试文件删除成功")
        else:
            print("⚠️  测试文件删除失败（可能需要手动清理）")
            
    except Exception as e:
        print(f"❌ 文件操作测试失败: {e}")
        return False
    
    print("\n🎉 所有测试通过！MinIO跳过验证功能工作正常")
    return True


def check_environment():
    """检查环境配置"""
    print("🔍 检查环境配置...")
    
    required_env_vars = [
        'MINIO_ENDPOINT',
        'MINIO_ACCESS_KEY', 
        'MINIO_SECRET_KEY'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  缺少环境变量: {', '.join(missing_vars)}")
        print("   请确保已正确配置MinIO连接参数")
    else:
        print("✅ 环境变量配置完整")
    
    # 检查跳过验证相关配置
    skip_validation = os.getenv('MINIO_SKIP_BUCKET_VALIDATION', 'false').lower()
    auto_create = os.getenv('MINIO_AUTO_CREATE_BUCKETS', 'true').lower()
    
    print(f"📋 跳过验证配置:")
    print(f"   - MINIO_SKIP_BUCKET_VALIDATION: {skip_validation}")
    print(f"   - MINIO_AUTO_CREATE_BUCKETS: {auto_create}")
    
    if skip_validation == 'true':
        print("✅ 跳过验证功能已启用")
    else:
        print("ℹ️  跳过验证功能未启用")
    
    print()


def print_usage_instructions():
    """打印使用说明"""
    print("\n📖 使用说明:")
    print("1. 确保已在线上MinIO中创建所需存储桶:")
    print("   - mat-qa-documents")
    print("   - mat-qa-media") 
    print("   - mat-qa-thumbnails")
    print("   - mat-qa-knowledge-graph")
    print()
    print("2. 设置环境变量启用跳过验证:")
    print("   export MINIO_SKIP_BUCKET_VALIDATION=true")
    print("   export MINIO_AUTO_CREATE_BUCKETS=false")
    print()
    print("3. 或者在配置文件中设置:")
    print("   storage:")
    print("     minio:")
    print("       skip_bucket_validation: true")
    print("       auto_create_buckets: false")


if __name__ == "__main__":
    print("🚀 MinIO跳过验证功能测试脚本")
    print("=" * 50)
    
    # 检查环境配置
    check_environment()
    
    # 运行异步测试
    try:
        success = asyncio.run(test_minio_skip_validation())
        
        if success:
            print("\n🎊 测试完成！系统可以正常使用MinIO存储服务")
        else:
            print("\n💥 测试失败！请检查配置和网络连接")
            print_usage_instructions()
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  测试被用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n💥 测试过程中发生未预期错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 