#!/usr/bin/env python3
"""
DataGraph环境变量加载器
从父级项目继承环境变量，特别是API密钥
"""
import os
from pathlib import Path
from dotenv import load_dotenv

def load_parent_env():
    """从父级目录加载环境变量"""
    
    # 当前DataGraph目录
    current_dir = Path(__file__).parent
    
    # 父级项目目录 (lite-backend)
    parent_dir = current_dir.parent
    
    # 要加载的环境文件（按优先级）
    env_files = [
        parent_dir / '.env.local',
        parent_dir / '.env',
        parent_dir / '.env.development',
        current_dir / '.env'  # 最后加载DataGraph自己的配置
    ]
    
    loaded_files = []
    
    for env_file in env_files:
        if env_file.exists():
            load_dotenv(env_file, override=False)  # 不覆盖已有变量
            loaded_files.append(str(env_file))
            print(f"✅ 已加载环境文件: {env_file}")
    
    # 确保关键的API密钥可用
    api_key = os.getenv('ALIBABA_LLM_API_KEY')
    if api_key:
        print(f"✅ 已找到API密钥: {'*' * 10}...{api_key[-4:]}")
        
        # 为DataGraph设置对应的环境变量
        os.environ['LLM_BINDING_API_KEY'] = api_key
        os.environ['EMBEDDING_BINDING_API_KEY'] = api_key
    else:
        print("⚠️  未找到ALIBABA_LLM_API_KEY，DataGraph可能无法正常工作")
    
    return loaded_files

if __name__ == "__main__":
    print("🔧 DataGraph环境配置加载器")
    print("=" * 50)
    
    loaded = load_parent_env()
    
    print(f"\n📁 已加载 {len(loaded)} 个环境文件:")
    for f in loaded:
        print(f"   - {f}")
    
    # 显示关键配置
    print(f"\n🎯 关键配置:")
    print(f"   - LLM_MODEL: {os.getenv('LLM_MODEL', 'qwen3-30b-a3b-instruct-2507')}")
    print(f"   - EMBEDDING_MODEL: {os.getenv('EMBEDDING_MODEL', 'text-embedding-v3')}")
    print(f"   - EMBEDDING_DIM: {os.getenv('EMBEDDING_DIM', '1536')}")
    print(f"   - WORKING_DIR: {os.getenv('WORKING_DIR', './rag_storage_test')}")
    print(f"   - PORT: {os.getenv('PORT', '9622')}")