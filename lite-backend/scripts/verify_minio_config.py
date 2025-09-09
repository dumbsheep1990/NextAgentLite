#!/usr/bin/env python3
"""
MinIO配置验证脚本

用于验证MinIO环境变量是否正确设置并生效
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
current_dir = Path(__file__).parent
project_root = current_dir.parent
sys.path.insert(0, str(project_root))

from core.config_optimized import optimized_config_manager
from core.logger import logger


def check_env_variables():
    """检查环境变量设置"""
    print("🔍 检查MinIO相关环境变量")
    print("=" * 50)
    
    env_vars = {
        'MINIO_ENDPOINT': os.getenv('MINIO_ENDPOINT'),
        'MINIO_ACCESS_KEY': os.getenv('MINIO_ACCESS_KEY'),
        'MINIO_SECRET_KEY': os.getenv('MINIO_SECRET_KEY'),
        'MINIO_SECURE': os.getenv('MINIO_SECURE'),
        'MINIO_AUTO_CREATE_BUCKETS': os.getenv('MINIO_AUTO_CREATE_BUCKETS'),
        'MINIO_SKIP_BUCKET_VALIDATION': os.getenv('MINIO_SKIP_BUCKET_VALIDATION')
    }
    
    for var_name, var_value in env_vars.items():
        if var_value is not None:
            if 'SECRET' in var_name:
                print(f"✅ {var_name} = ****")
            else:
                print(f"✅ {var_name} = {var_value}")
        else:
            print(f"❌ {var_name} = 未设置")
    
    print()
    return env_vars


def check_config_loading():
    """检查配置加载"""
    print("🔧 检查配置管理器加载情况")
    print("=" * 50)
    
    try:
        config = optimized_config_manager.settings.storage_minio
        
        print(f"📋 当前MinIO配置:")
        print(f"   - 启用状态: {config.enabled}")
        print(f"   - 端点: {config.endpoint}")
        print(f"   - 访问密钥: {config.access_key}")
        print(f"   - 安全连接: {config.secure}")
        print(f"   - 自动创建存储桶: {config.auto_create_buckets}")
        print(f"   - 跳过存储桶验证: {config.skip_bucket_validation}")
        print()
        
        return config
        
    except Exception as e:
        print(f"❌ 配置加载失败: {e}")
        import traceback
        traceback.print_exc()
        return None


def check_dot_env_file():
    """检查.env文件"""
    print("📄 检查.env文件内容")
    print("=" * 50)
    
    env_file_path = Path(project_root) / '.env'
    
    if not env_file_path.exists():
        print("❌ .env文件不存在")
        return False
    
    print(f"✅ .env文件存在: {env_file_path}")
    
    try:
        with open(env_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找MinIO相关配置
        minio_lines = []
        for line_num, line in enumerate(content.split('\n'), 1):
            line = line.strip()
            if line and not line.startswith('#') and 'MINIO' in line:
                minio_lines.append(f"  {line_num}: {line}")
        
        if minio_lines:
            print("📋 .env文件中的MinIO配置:")
            for line in minio_lines:
                print(line)
        else:
            print("⚠️  .env文件中未找到MinIO配置")
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ 读取.env文件失败: {e}")
        return False


def provide_fix_instructions():
    """提供修复说明"""
    print("🛠️ 修复建议")
    print("=" * 50)
    
    print("1. 确保在.env文件中添加以下配置:")
    print("   MINIO_SKIP_BUCKET_VALIDATION=true")
    print("   MINIO_AUTO_CREATE_BUCKETS=false")
    print()
    
    print("2. 或者直接设置环境变量:")
    print("   export MINIO_SKIP_BUCKET_VALIDATION=true")
    print("   export MINIO_AUTO_CREATE_BUCKETS=false")
    print()
    
    print("3. 如果MinIO凭据有问题，也请一并更新:")
    print("   MINIO_ENDPOINT=your-minio-endpoint")
    print("   MINIO_ACCESS_KEY=your-access-key")
    print("   MINIO_SECRET_KEY=your-secret-key")
    print()
    
    print("4. 重启服务让配置生效:")
    print("   python main.py")


def main():
    """主函数"""
    print("🚀 MinIO配置验证脚本")
    print("=" * 50)
    
    # 检查环境变量
    env_vars = check_env_variables()
    
    # 检查.env文件
    check_dot_env_file()
    
    # 检查配置加载
    config = check_config_loading()
    
    # 验证关键配置
    if config:
        print("🎯 关键配置验证")
        print("=" * 50)
        
        if config.skip_bucket_validation:
            print("✅ 跳过存储桶验证已启用")
        else:
            print("❌ 跳过存储桶验证未启用")
        
        if not config.auto_create_buckets:
            print("✅ 自动创建存储桶已禁用")
        else:
            print("⚠️  自动创建存储桶仍然启用")
        
        print()
        
        # 检查是否需要修复
        if not config.skip_bucket_validation or config.auto_create_buckets:
            print("💡 发现配置问题，需要修复")
            provide_fix_instructions()
            return False
        else:
            print("🎉 MinIO配置正确！可以跳过存储桶验证")
            return True
    else:
        print("💥 配置加载失败")
        provide_fix_instructions()
        return False


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  验证被用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n💥 验证过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 