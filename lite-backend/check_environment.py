#!/usr/bin/env python
"""
环境检查脚本 - 检查依赖包是否正确安装
"""
import sys
import importlib
import subprocess

def check_python_info():
    """检查Python信息"""
    print(f"🐍 Python 解释器: {sys.executable}")
    print(f"🐍 Python 版本: {sys.version}")
    print("-" * 60)

def check_package(package_name, import_name=None):
    """检查单个包是否安装"""
    if import_name is None:
        import_name = package_name
    
    try:
        module = importlib.import_module(import_name)
        version = getattr(module, '__version__', 'unknown')
        print(f"✅ {package_name}: {version}")
        return True
    except ImportError as e:
        print(f"❌ {package_name}: 未安装 - {str(e)}")
        return False

def main():
    """主函数"""
    print("🔍 NextAgent Lite 环境检查")
    print("=" * 60)
    
    check_python_info()
    
    # 检查关键包
    critical_packages = [
        ('crawl4ai', 'crawl4ai'),
        ('readability', 'readability'),  # 可能是readability-lxml
        ('fastapi', 'fastapi'),
        ('uvicorn', 'uvicorn'),
        ('sqlalchemy', 'sqlalchemy'),
        ('elasticsearch', 'elasticsearch'),
        ('agno', 'agno'),
        ('pydantic', 'pydantic'),
        ('httpx', 'httpx'),
        ('aiohttp', 'aiohttp'),
    ]
    
    print("\n📦 关键依赖包检查:")
    print("-" * 40)
    
    success_count = 0
    total_count = len(critical_packages)
    
    for package_name, import_name in critical_packages:
        if check_package(package_name, import_name):
            success_count += 1
    
    # 特殊检查 readability-lxml
    if not check_package('readability-lxml', 'readability'):
        # 尝试其他可能的导入名称
        alternate_names = ['readability_lxml', 'lxml_readability']
        for alt_name in alternate_names:
            if check_package(f'readability (as {alt_name})', alt_name):
                success_count += 1
                break
    
    print("\n" + "=" * 60)
    print(f"📊 检查结果: {success_count}/{total_count} 包可用")
    
    if success_count == total_count:
        print("🎉 所有关键依赖都已正确安装！")
        return True
    else:
        print("⚠️  部分依赖缺失，可能影响系统功能")
        print("\n💡 建议:")
        print("1. 确保使用正确的conda环境: conda activate zzdsj-lite")
        print("2. 使用conda环境的Python启动应用")
        print("3. 或运行: ./start_with_conda.sh")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)