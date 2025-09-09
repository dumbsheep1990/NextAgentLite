#!/usr/bin/env python3
"""
MinIO清理功能测试脚本

这个脚本用于测试新增的MinIO清理功能，包括：
1. 连接测试
2. 统计信息获取
3. 文件列表功能
4. 清理功能（安全模式，不实际删除）

使用方法:
cd mat-backend
python scripts/test_minio_cleanup.py
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from scripts.es_data_cleanup import ESDataCleanup, MINIO_AVAILABLE
from core.logger import logger


async def test_minio_functionality():
    """测试MinIO功能"""
    
    print("=" * 60)
    print("MinIO清理功能测试")
    print("=" * 60)
    
    # 检查MinIO SDK
    if not MINIO_AVAILABLE:
        print("❌ MinIO SDK未安装，请安装: pip install minio")
        return False
    
    cleanup = ESDataCleanup()
    
    try:
        # 初始化连接
        print("🔄 正在初始化连接...")
        await cleanup.initialize()
        
        if not cleanup.minio_client:
            print("❌ MinIO客户端初始化失败，请检查配置")
            return False
        
        print("✅ MinIO连接成功")
        
        # 测试1: 获取存储统计
        print("\n📊 测试1: 获取存储统计")
        print("-" * 40)
        stats = cleanup.get_minio_stats()
        
        if "error" in stats:
            print(f"❌ 获取统计失败: {stats['error']}")
        else:
            print(f"✅ 总对象数: {stats['total_objects']}")
            print(f"✅ 总大小: {stats['total_size_bytes'] / (1024*1024):.2f} MB")
            print(f"✅ Bucket数量: {len(stats['buckets'])}")
            
            for bucket_name, bucket_stats in stats['buckets'].items():
                print(f"   📁 {bucket_name}: {bucket_stats['object_count']} 个对象")
        
        # 测试2: 列出文件（限制10个）
        print("\n📁 测试2: 列出文件（限制10个）")
        print("-" * 40)
        files = cleanup.list_minio_files(limit=10)
        
        if not files:
            print("✅ 没有找到文件或MinIO为空")
        else:
            print(f"✅ 找到 {len(files)} 个文件")
            for i, file_info in enumerate(files[:5], 1):  # 只显示前5个
                print(f"   {i}. {file_info['bucket']}/{file_info['object_name']}")
                print(f"      大小: {file_info['size'] / 1024:.2f} KB")
            
            if len(files) > 5:
                print(f"   ... 还有 {len(files) - 5} 个文件")
        
        # 测试3: 测试清理功能（安全模式）
        print("\n🧹 测试3: 清理功能（安全模式 - 不实际删除）")
        print("-" * 40)
        
        # 不使用confirm参数，只测试参数验证
        result = cleanup.clear_minio_files(confirm=False)
        if "error" in result and "需要确认参数" in result["error"]:
            print("✅ 安全检查正常 - 需要确认参数才能执行")
        else:
            print("❌ 安全检查失败")
        
        # 测试bucket级清理（安全模式）
        if stats.get('buckets'):
            first_bucket = list(stats['buckets'].keys())[0]
            result = cleanup.delete_minio_bucket_files(first_bucket, confirm=False)
            if "error" in result and "需要确认参数" in result["error"]:
                print(f"✅ Bucket级清理安全检查正常 - bucket: {first_bucket}")
            else:
                print("❌ Bucket级清理安全检查失败")
        
        # 测试4: 配置验证
        print("\n⚙️  测试4: 配置验证")
        print("-" * 40)
        storage_config = cleanup.storage_config
        print(f"✅ 存储启用: {storage_config.enabled}")
        print(f"✅ 端点: {storage_config.endpoint}")
        print(f"✅ 安全连接: {storage_config.secure}")
        print(f"✅ Access Key: {storage_config.access_key[:10]}..." if storage_config.access_key else "❌ 未配置Access Key")
        
        print("\n🎉 所有测试完成!")
        return True
        
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        logger.error(f"MinIO测试失败: {e}")
        return False
    
    finally:
        await cleanup.close()


async def interactive_test():
    """交互式测试"""
    
    print("\n" + "=" * 60)
    print("交互式测试模式")
    print("=" * 60)
    
    print("""
可用的测试选项：
1. 查看MinIO统计信息
2. 列出文件（可指定bucket和数量）
3. 显示帮助信息
4. 退出

注意: 本测试不会执行任何删除操作，仅用于验证功能。
""")
    
    cleanup = ESDataCleanup()
    await cleanup.initialize()
    
    if not cleanup.minio_client:
        print("❌ MinIO连接失败，无法进行交互式测试")
        return
    
    try:
        while True:
            choice = input("\n请选择测试选项 (1-4): ").strip()
            
            if choice == "1":
                print("\n📊 获取MinIO统计信息...")
                stats = cleanup.get_minio_stats()
                if "error" in stats:
                    print(f"错误: {stats['error']}")
                else:
                    print(f"总对象数: {stats['total_objects']}")
                    print(f"总大小: {stats['total_size_bytes'] / (1024*1024):.2f} MB")
                    print("\nBucket详情:")
                    for bucket_name, bucket_stats in stats['buckets'].items():
                        print(f"  📁 {bucket_name}:")
                        print(f"     对象数: {bucket_stats['object_count']}")
                        print(f"     大小: {bucket_stats['total_size'] / (1024*1024):.2f} MB")
            
            elif choice == "2":
                bucket = input("输入bucket名称（回车表示所有bucket）: ").strip()
                bucket = bucket if bucket else None
                
                try:
                    limit = int(input("输入文件数量限制（默认10）: ").strip() or "10")
                except ValueError:
                    limit = 10
                
                print(f"\n📁 列出文件 (bucket: {bucket or '所有'}, 限制: {limit})...")
                files = cleanup.list_minio_files(bucket, limit)
                
                if not files:
                    print("没有找到文件")
                else:
                    print(f"找到 {len(files)} 个文件:")
                    for i, file_info in enumerate(files, 1):
                        print(f"  {i}. {file_info['bucket']}/{file_info['object_name']}")
                        print(f"     大小: {file_info['size'] / 1024:.2f} KB")
                        print(f"     修改时间: {file_info['last_modified']}")
            
            elif choice == "3":
                print("""
使用说明：
- 选项1: 显示所有bucket的统计信息，包括文件数和大小
- 选项2: 列出文件，可以指定特定bucket或查看所有文件
- 选项3: 显示本帮助信息
- 选项4: 退出测试

实际清理命令：
# 查看所有MinIO文件
python scripts/es_data_cleanup.py --action minio-list

# 查看存储统计
python scripts/es_data_cleanup.py --action minio-stats

# 清空所有文件（危险操作）
python scripts/es_data_cleanup.py --action minio-clear --confirm

# 清空指定bucket
python scripts/es_data_cleanup.py --action minio-clear-bucket --bucket <bucket名> --confirm
""")
            
            elif choice == "4":
                print("退出测试")
                break
            
            else:
                print("无效选择，请输入1-4")
    
    finally:
        await cleanup.close()


async def main():
    """主函数"""
    
    # 基础功能测试
    success = await test_minio_functionality()
    
    if success:
        # 询问是否进行交互式测试
        while True:
            choice = input("\n是否进行交互式测试? (y/n): ").lower().strip()
            if choice in ['y', 'yes']:
                await interactive_test()
                break
            elif choice in ['n', 'no']:
                break
            else:
                print("请输入 y 或 n")
    
    print("\n测试完成!")


if __name__ == "__main__":
    asyncio.run(main()) 