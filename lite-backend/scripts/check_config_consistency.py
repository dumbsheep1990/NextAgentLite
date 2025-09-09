#!/usr/bin/env python3
"""
配置一致性检查脚本
检查前端和后端配置的一致性
"""
import os
import sys
import yaml
import json
from pathlib import Path
from typing import Dict, Any, List


def load_backend_config() -> Dict[str, Any]:
    """加载后端配置"""
    config_file = Path(__file__).parent.parent / "config" / "config.yaml"
    
    if not config_file.exists():
        raise FileNotFoundError(f"后端配置文件不存在: {config_file}")
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def load_frontend_env() -> Dict[str, str]:
    """加载前端环境变量"""
    frontend_dir = Path(__file__).parent.parent.parent / "mat-qa"
    env_files = [".env.local", ".env", ".env.example"]
    
    env_vars = {}
    
    for env_file in env_files:
        env_path = frontend_dir / env_file
        if env_path.exists():
            print(f"读取前端环境文件: {env_path}")
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
            break
    
    return env_vars


def check_api_consistency(backend_config: Dict[str, Any], frontend_env: Dict[str, str]) -> List[str]:
    """检查API配置一致性"""
    issues = []
    
    # 检查API端口
    backend_port = backend_config.get('app', {}).get('port', 8000)
    frontend_api_url = frontend_env.get('VITE_API_BASE_URL', 'http://localhost:8000/api/v1')
    
    if f":{backend_port}" not in frontend_api_url:
        issues.append(f"API端口不一致: 后端端口={backend_port}, 前端API地址={frontend_api_url}")
    
    return issues


def check_database_config(backend_config: Dict[str, Any]) -> List[str]:
    """检查数据库配置"""
    issues = []
    
    # 检查必需的数据库配置
    required_dbs = ['postgresql', 'elasticsearch', 'arangodb']
    database_config = backend_config.get('database', {})
    
    for db in required_dbs:
        if db not in database_config:
            issues.append(f"缺少数据库配置: {db}")
        else:
            db_config = database_config[db]
            if db == 'postgresql':
                required_fields = ['host', 'port', 'database', 'username', 'password']
            elif db == 'elasticsearch':
                required_fields = ['hosts']
            elif db == 'arangodb':
                required_fields = ['url', 'database', 'username', 'password', 'graph_name']
            
            for field in required_fields:
                if field not in db_config:
                    issues.append(f"{db} 缺少必需字段: {field}")
    
    return issues


def check_env_variables() -> List[str]:
    """检查环境变量"""
    issues = []
    
    # 检查后端环境变量文件
    backend_env_path = Path(__file__).parent.parent / ".env"
    if not backend_env_path.exists():
        issues.append("后端 .env 文件不存在，请根据 env.example 创建")
    
    # 检查前端环境变量文件
    frontend_dir = Path(__file__).parent.parent.parent / "mat-qa"
    frontend_env_files = [".env.local", ".env"]
    
    if not any((frontend_dir / env_file).exists() for env_file in frontend_env_files):
        issues.append("前端环境变量文件不存在，请创建 .env.local")
    
    # 检查关键环境变量
    critical_env_vars = [
        'QWEN_API_KEY',
        'GEMINI_API_KEY', 
        'ALI_EMBEDDING_API_KEY'
    ]
    
    for env_var in critical_env_vars:
        if env_var not in os.environ:
            issues.append(f"关键环境变量未设置: {env_var}")
    
    return issues


def check_arangodb_init_script() -> List[str]:
    """检查ArangoDB初始化脚本"""
    issues = []
    
    script_path = Path(__file__).parent.parent / "migrations" / "init_arangodb.py"
    
    if not script_path.exists():
        issues.append("ArangoDB初始化脚本不存在")
        return issues
    
    # 检查脚本内容
    with open(script_path, 'r', encoding='utf-8') as f:
        script_content = f.read()
    
    required_functions = ['init_arangodb', 'create_indexes', 'cleanup_arangodb']
    for func in required_functions:
        if f"def {func}" not in script_content:
            issues.append(f"ArangoDB初始化脚本缺少函数: {func}")
    
    # 检查集合定义
    required_collections = ['entities', 'concepts', 'materials', 'papers']
    for collection in required_collections:
        if f"'{collection}'" not in script_content:
            issues.append(f"ArangoDB初始化脚本缺少集合定义: {collection}")
    
    return issues


def main():
    """主函数"""
    print("=== 配置一致性检查 ===\n")
    
    all_issues = []
    
    try:
        # 加载配置
        backend_config = load_backend_config()
        frontend_env = load_frontend_env()
        
        print("✅ 配置文件加载成功")
        
        # 检查各项配置
        print("\n1. 检查API配置一致性...")
        api_issues = check_api_consistency(backend_config, frontend_env)
        all_issues.extend(api_issues)
        
        print("2. 检查数据库配置...")
        db_issues = check_database_config(backend_config)
        all_issues.extend(db_issues)
        
        print("3. 检查环境变量...")
        env_issues = check_env_variables()
        all_issues.extend(env_issues)
        
        print("4. 检查ArangoDB初始化脚本...")
        arangodb_issues = check_arangodb_init_script()
        all_issues.extend(arangodb_issues)
        
        # 输出结果
        print(f"\n=== 检查结果 ===")
        
        if not all_issues:
            print("✅ 所有配置检查通过！")
            return 0
        else:
            print(f"❌ 发现 {len(all_issues)} 个配置问题：\n")
            for i, issue in enumerate(all_issues, 1):
                print(f"{i}. {issue}")
            
            print(f"\n💡 建议:")
            print("- 根据 env.example 创建 .env 文件")
            print("- 创建前端 .env.local 文件")
            print("- 设置必需的API密钥环境变量")
            print("- 确保数据库服务正在运行")
            
            return 1
    
    except Exception as e:
        print(f"❌ 检查过程中出错: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 