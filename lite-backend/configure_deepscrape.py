#!/usr/bin/env python3
"""
DeepScrape配置脚本
将NextAgentLite后端的模型配置注入到DeepScrape服务中
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def load_backend_config():
    """加载后端配置"""
    # 加载后端.env文件
    backend_env_path = Path(__file__).parent / '.env'
    if not backend_env_path.exists():
        print("❌ 后端.env文件不存在，请先配置后端环境变量")
        return None
    
    load_dotenv(backend_env_path)
    
    config = {
        # LLM配置
        'llm_model': os.getenv('DEFAULT_LLM_MODEL', 'Qwen/Qwen3-30B-A3B-Instruct-2507'),
        'llm_provider': os.getenv('DEFAULT_LLM_PROVIDER', 'alibaba'),
        
        # API密钥配置
        'alibaba_api_key': os.getenv('DATAGRAPH_LLM_BINDING_API_KEY', ''),
        'alibaba_base_url': os.getenv('DATAGRAPH_LLM_BINDING_HOST', 'https://api.siliconflow.cn/v1'),
        
        # UTU配置（备用）
        'utu_api_key': os.getenv('UTU_LLM_API_KEY', ''),
        'utu_base_url': os.getenv('UTU_LLM_BASE_URL', 'https://api.siliconflow.cn/v1'),
        'utu_model': os.getenv('UTU_LLM_MODEL', 'Qwen/Qwen3-30B-A3B-Thinking-2507'),
    }
    
    return config

def generate_deepscrape_env(config):
    """生成DeepScrape的.env配置内容"""
    
    # 根据后端配置选择API密钥和Base URL
    api_key = config['alibaba_api_key'] or config['utu_api_key']
    base_url = config['alibaba_base_url'] or config['utu_base_url']
    model = config['llm_model'] or config['utu_model']
    
    if not api_key:
        print("⚠️  警告：未找到有效的API密钥，请检查后端配置")
    
    env_content = f"""# DeepScrape Configuration - Auto Generated
# Generated from NextAgentLite backend configuration

# =============================================================================
# Core Configuration
# =============================================================================
PORT=3001
NODE_ENV=development
API_KEY=deepscrape-test-key

# =============================================================================
# LLM Configuration (From NextAgentLite Backend)
# =============================================================================
# 使用OpenAI兼容接口连接阿里云/硅流服务
LLM_PROVIDER=openai
OPENAI_API_KEY={api_key}
OPENAI_BASE_URL={base_url}
OPENAI_MODEL={model}

# LLM Request Configuration
LLM_TIMEOUT=120000              # Request timeout in milliseconds
LLM_MAX_RETRIES=3              # Maximum retry attempts
LLM_TEMPERATURE=0.2            # Temperature for LLM responses
LLM_MAX_TOKENS=4000           # Maximum tokens for completion

# =============================================================================
# Extraction Settings
# =============================================================================
MAX_EXTRACTION_TOKENS=15000

# =============================================================================
# Scraper Configuration
# =============================================================================
MAX_TIMEOUT=60000
BLOCK_RESOURCES=true
BLOCK_ADS=true
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36

# =============================================================================
# Redis Configuration (Optional)
# =============================================================================
# 注释掉Redis配置，使用内存队列
# REDIS_HOST=localhost
# REDIS_PORT=6379

# =============================================================================
# Caching Settings
# =============================================================================
CACHE_ENABLED=true
CACHE_TTL=3600          # Default cache TTL in seconds (1 hour)
CACHE_DIRECTORY=./cache # Directory to store cache files

# =============================================================================
# File Export Configuration
# =============================================================================
CRAWL_OUTPUT_DIR=./crawl-output # Directory to store crawled markdown files

# =============================================================================
# Logging Configuration
# =============================================================================
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIRECTORY=./logs

# =============================================================================
# Batch Processing Configuration
# =============================================================================
BATCH_PROCESSING_ENABLED=true
BATCH_OUTPUT_DIR=./batch-output    # Directory to store batch processing results
BATCH_CLEANUP_DAYS=7               # Days to keep batch data before cleanup
BATCH_MAX_CONCURRENT_JOBS=5        # Maximum concurrent batch operations

# =============================================================================
# Configuration Summary
# =============================================================================
# Provider: {config['llm_provider']} (mapped to OpenAI-compatible)
# Model: {model}
# Base URL: {base_url}
# API Key: {'***' + api_key[-6:] if len(api_key) > 6 else 'Not Set'}
# Port: 3001 (避免与NextAgentLite前端3000端口冲突)
"""
    
    return env_content

def backup_existing_env(deepscrape_dir):
    """备份现有的.env文件"""
    env_file = deepscrape_dir / '.env'
    if env_file.exists():
        backup_file = deepscrape_dir / f'.env.backup.{int(os.time())}'
        env_file.rename(backup_file)
        print(f"✅ 已备份现有.env文件到: {backup_file.name}")
        return backup_file
    return None

def write_deepscrape_env(deepscrape_dir, env_content):
    """写入DeepScrape的.env文件"""
    env_file = deepscrape_dir / '.env'
    
    try:
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print(f"✅ 已生成DeepScrape配置文件: {env_file}")
        return True
    except Exception as e:
        print(f"❌ 写入配置文件失败: {e}")
        return False

def validate_deepscrape_directory():
    """验证DeepScrape目录"""
    deepscrape_dir = Path(__file__).parent / 'deepscrape'
    
    if not deepscrape_dir.exists():
        print(f"❌ DeepScrape目录不存在: {deepscrape_dir}")
        print("请先克隆DeepScrape项目:")
        print("git clone https://github.com/stretchcloud/deepscrape.git")
        return None
    
    # 检查关键文件
    package_json = deepscrape_dir / 'package.json'
    if not package_json.exists():
        print(f"❌ {package_json} 不存在，确认这是DeepScrape项目目录吗？")
        return None
    
    node_modules = deepscrape_dir / 'node_modules'
    if not node_modules.exists():
        print(f"⚠️  {node_modules} 不存在，请先安装依赖:")
        print(f"cd {deepscrape_dir} && npm install")
        return None
    
    print(f"✅ DeepScrape目录验证通过: {deepscrape_dir}")
    return deepscrape_dir

def print_configuration_summary(config):
    """打印配置摘要"""
    print("\n" + "=" * 60)
    print("📋 配置摘要")
    print("=" * 60)
    print(f"后端LLM提供商: {config['llm_provider']}")
    print(f"后端LLM模型: {config['llm_model']}")
    print(f"API Base URL: {config['alibaba_base_url'] or config['utu_base_url']}")
    
    api_key = config['alibaba_api_key'] or config['utu_api_key']
    if api_key:
        masked_key = '***' + api_key[-6:] if len(api_key) > 6 else 'Invalid'
        print(f"API密钥: {masked_key}")
    else:
        print("API密钥: ❌ 未配置")
    
    print(f"DeepScrape端口: 3001")
    print("=" * 60)

def print_next_steps():
    """打印后续步骤"""
    print("\n" + "=" * 60)
    print("🚀 后续步骤")
    print("=" * 60)
    print("1. 启动DeepScrape服务:")
    print("   cd deepscrape")
    print("   npm run dev")
    print()
    print("2. 验证服务运行:")
    print("   curl http://localhost:3001/health")
    print()
    print("3. 查看API文档:")
    print("   open http://localhost:3001/api-docs")
    print()
    print("4. 运行集成测试:")
    print("   python test_deepscrape_integration.py")
    print("=" * 60)

def main():
    """主函数"""
    print("🔧 DeepScrape配置脚本")
    print("=" * 60)
    
    # 验证DeepScrape目录
    deepscrape_dir = validate_deepscrape_directory()
    if not deepscrape_dir:
        sys.exit(1)
    
    # 加载后端配置
    print("📖 加载后端配置...")
    config = load_backend_config()
    if not config:
        sys.exit(1)
    
    # 打印配置摘要
    print_configuration_summary(config)
    
    # 确认是否继续
    print("\n❓ 是否使用以上配置生成DeepScrape的.env文件？(y/N)")
    confirm = input().strip().lower()
    if confirm not in ['y', 'yes']:
        print("❌ 操作已取消")
        sys.exit(0)
    
    # 备份现有配置
    print("\n📦 处理配置文件...")
    backup_existing_env(deepscrape_dir)
    
    # 生成新配置
    print("🔨 生成新配置...")
    env_content = generate_deepscrape_env(config)
    
    # 写入配置文件
    if write_deepscrape_env(deepscrape_dir, env_content):
        print("✅ DeepScrape配置完成！")
        print_next_steps()
    else:
        print("❌ 配置失败！")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ 操作被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 脚本执行失败: {e}")
        sys.exit(1)