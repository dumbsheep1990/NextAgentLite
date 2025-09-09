#!/usr/bin/env python3
"""
生成完整的requirements.txt文件，包含版本号但不包含本地路径
只排除明确的开发工具，保留所有可能需要的依赖

使用方法:
    python generate_requirements.py              # 生成 requirements_new.txt
    python generate_requirements.py --replace    # 直接替换 requirements.txt
    python generate_requirements.py --help       # 显示帮助信息
"""

import subprocess
import sys
import re
import argparse
from pathlib import Path

def get_installed_packages():
    """获取当前环境中安装的包列表"""
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', 'freeze'], 
                               capture_output=True, text=True, check=True)
        return result.stdout.strip().split('\n')
    except subprocess.CalledProcessError as e:
        print(f"错误：无法获取包列表: {e}")
        return []

def clean_package_line(line):
    """清理包行，移除路径信息但保留版本号"""
    # 移除 @ file:// 之后的所有内容
    if ' @ file://' in line:
        package_name = line.split(' @ file://')[0]
        return package_name
    
    # 移除 @ git+ 之后的内容
    if ' @ git+' in line:
        package_name = line.split(' @ git+')[0]
        return package_name
    
    # 保持原有格式
    return line

def filter_packages(packages):
    """过滤包，只排除明确的开发工具，保留所有其他依赖"""
    
    # 需要排除的开发工具和IDE相关包（更保守的过滤）
    exclude_packages = {
        # IDE和开发环境
        'anaconda-navigator', 'navigator-updater', 'spyder', 'spyder-kernels',
        'jupyter', 'jupyter-console', 'jupyter-events', 'jupyter-lsp', 
        'jupyter_client', 'jupyter_core', 'jupyter_server', 'jupyter_server_terminals',
        'jupyterlab', 'jupyterlab-pygments', 'jupyterlab-widgets', 'jupyterlab_server',
        'notebook', 'notebook_shim', 'nbclient', 'nbconvert', 'nbformat',
        'ipython', 'ipython-genutils', 'ipywidgets', 'ipykernel',
        
        # Qt相关（GUI开发工具）
        'qtconsole', 'qtpy', 'pyqt5', 'pyqt5-sip', 'pyqtwebengine',
        'qtawesome', 'qdarkstyle', 'qstylizer',
        
        # macOS特定的IDE工具
        'pyobjc-core', 'pyobjc-framework-cocoa', 'pyobjc-framework-coreservices', 
        'pyobjc-framework-fsevents', 'appscript', 'applaunchservices',
        
        # conda构建工具和系统包
        'conda', 'conda-build', 'conda-content-trust', 'conda-libmamba-solver',
        'conda-pack', 'conda-package-handling', 'conda-repo-cli', 'conda-token',
        'conda_index', 'conda_package_streaming', 'libmambapy', 'menuinst',
        'ruamel-yaml-conda',
        
        # 系统级通信包（这些通常由系统管理）
        'comm',
        
        # 文档生成工具（非必需）
        'sphinx', 'sphinxcontrib-applehelp', 'sphinxcontrib-devhelp', 
        'sphinxcontrib-htmlhelp', 'sphinxcontrib-jsmath', 'sphinxcontrib-qthelp',
        'sphinxcontrib-serializinghtml', 'numpydoc', 'alabaster',
        
        # 高级可视化工具（如果项目不需要可以排除）
        'bokeh', 'holoviews', 'panel', 'datashader', 'hvplot', 'pyviz_comms',
        
        # 特殊用途包
        'lckr_jupyterlab_variableinspector',
        
        # 系统工具
        'anaconda-anon-usage', 'anaconda-catalogs', 'anaconda-client', 
        'anaconda-cloud-auth', 'anaconda-project'
    }
    
    # 需要排除的包名模式
    exclude_patterns = [
        'anaconda', 'navigator'
    ]
    
    filtered_packages = []
    excluded_packages = []
    
    for package in packages:
        package_line = clean_package_line(package)
        if not package_line:
            continue
            
        # 提取包名（去掉版本号）
        package_name = re.split(r'[=<>!]', package_line)[0].strip()
        package_name_lower = package_name.lower()
        
        # 检查是否在排除列表中
        if package_name_lower in exclude_packages:
            excluded_packages.append(package_name)
            continue
            
        # 检查是否匹配排除模式
        should_exclude = False
        for pattern in exclude_patterns:
            if pattern in package_name_lower:
                should_exclude = True
                break
        
        if should_exclude:
            excluded_packages.append(package_name)
            continue
            
        # 保留所有其他包
        filtered_packages.append(package_line)
    
    return filtered_packages, excluded_packages

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='生成干净的requirements.txt文件')
    parser.add_argument('--replace', action='store_true', 
                        help='直接替换requirements.txt文件')
    parser.add_argument('--check', nargs='+', 
                        help='检查指定的包是否包含在生成的文件中')
    parser.add_argument('--output', '-o', default='requirements_new.txt',
                        help='输出文件名 (默认: requirements_new.txt)')
    
    args = parser.parse_args()
    
    print("正在生成完整的requirements.txt...")
    
    # 获取安装的包
    packages = get_installed_packages()
    if not packages:
        print("无法获取包列表")
        return
    
    print(f"找到 {len(packages)} 个已安装的包")
    
    # 过滤包（只排除明确的开发工具）
    filtered_packages, excluded_packages = filter_packages(packages)
    print(f"过滤后保留 {len(filtered_packages)} 个包")
    print(f"排除了 {len(excluded_packages)} 个开发工具包")
    
    # 确定输出文件
    if args.replace:
        output_file = Path(__file__).parent / "requirements.txt"
    else:
        output_file = Path(__file__).parent / args.output
    
    # 生成requirements.txt
    with open(output_file, 'w', encoding='utf-8') as f:
        # 添加头部注释
        f.write("# 项目完整依赖包\n")
        f.write("# 自动生成，包含版本号\n")
        f.write("# 包含所有必要依赖，只排除明确的开发工具\n")
        f.write("# 生成时间: " + subprocess.run(['date'], capture_output=True, text=True).stdout.strip() + "\n\n")
        
        # 写入包
        for package in sorted(filtered_packages):
            f.write(package + '\n')
    
    print(f"生成完成: {output_file}")
    
    # 检查指定的依赖是否包含
    if args.check:
        print(f"\n检查指定依赖:")
        for dep in args.check:
            found = False
            for package in filtered_packages:
                package_name = re.split(r'[=<>!]', package)[0].strip().lower()
                if package_name == dep.lower():
                    print(f"  ✅ {dep} - 已包含: {package}")
                    found = True
                    break
            if not found:
                print(f"  ❌ {dep} - 未找到")
    
    # 显示统计信息
    print(f"\n统计信息:")
    print(f"  总包数: {len(packages)}")
    print(f"  保留包数: {len(filtered_packages)}")
    print(f"  排除包数: {len(excluded_packages)}")
    
    print(f"\n前10个保留的包:")
    for package in sorted(filtered_packages)[:10]:
        print(f"  {package}")
    
    if len(filtered_packages) > 10:
        print(f"  ... 还有 {len(filtered_packages) - 10} 个包")
    
    # 如果有需要，显示排除的包
    if len(excluded_packages) > 0:
        print(f"\n排除的开发工具包 (前10个):")
        for package in sorted(excluded_packages)[:10]:
            print(f"  {package}")
        if len(excluded_packages) > 10:
            print(f"  ... 还有 {len(excluded_packages) - 10} 个包")

if __name__ == "__main__":
    main() 