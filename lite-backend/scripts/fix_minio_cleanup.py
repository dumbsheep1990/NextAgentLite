#!/usr/bin/env python3
"""
MinIO文件清理修复脚本

修复生产环境清理过程中MinIO删除失败的问题
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from minio import Minio
    from minio.deleteobjects import DeleteObject
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("❌ MinIO SDK未安装，请安装: pip install minio")

def clear_minio_files():
    """清理MinIO中的所有文件"""
    if not MINIO_AVAILABLE:
        return False
    
    # 生产环境MinIO配置
    minio_config = {
        "endpoint": "8.153.90.125:9000",
        "access_key": "admin", 
        "secret_key": "matscience2025",
        "secure": False
    }
    
    try:
        # 初始化MinIO客户端
        client = Minio(
            minio_config["endpoint"],
            access_key=minio_config["access_key"],
            secret_key=minio_config["secret_key"],
            secure=minio_config["secure"]
        )
        
        print("✅ MinIO连接成功")
        
        total_deleted = 0
        buckets = client.list_buckets()
        
        for bucket in buckets:
            bucket_name = bucket.name
            print(f"\n🗑️  正在清理bucket: {bucket_name}")
            
            try:
                # 获取所有对象
                objects = client.list_objects(bucket_name, recursive=True)
                object_list = list(objects)  # 转换为列表以便计数
                
                if object_list:
                    print(f"   发现 {len(object_list)} 个文件")
                    
                    # 创建DeleteObject列表
                    delete_objects = [DeleteObject(obj.object_name) for obj in object_list]
                    
                    # 批量删除
                    delete_errors = client.remove_objects(bucket_name, delete_objects)
                    
                    # 检查删除结果
                    error_count = 0
                    for error in delete_errors:
                        error_count += 1
                        print(f"   ❌ 删除失败: {error.object_name} - {error}")
                    
                    success_count = len(object_list) - error_count
                    total_deleted += success_count
                    
                    print(f"   ✅ 成功删除 {success_count} 个文件")
                    if error_count > 0:
                        print(f"   ❌ 失败 {error_count} 个文件")
                else:
                    print(f"   ✅ bucket {bucket_name} 已为空")
                    
            except Exception as e:
                print(f"   ❌ 清理失败: {e}")
        
        print(f"\n🎉 MinIO清理完成！")
        print(f"   总共删除 {total_deleted} 个文件")
        return True
        
    except Exception as e:
        print(f"❌ MinIO连接或操作失败: {e}")
        return False

def main():
    print("🔧 MinIO清理修复脚本")
    print("=" * 40)
    
    # 确认操作
    user_input = input("是否要清理MinIO中的所有文件？(输入 'yes' 确认): ")
    if user_input.lower() != 'yes':
        print("❌ 操作已取消")
        return
    
    # 执行清理
    success = clear_minio_files()
    
    if success:
        print("\n✅ MinIO修复清理完成！")
    else:
        print("\n❌ MinIO修复清理失败！")

if __name__ == "__main__":
    main() 