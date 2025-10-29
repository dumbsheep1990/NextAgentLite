"""
环境变量加载器 - 支持从父目录继承.env配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv


def load_matgraph_env():
    """
    加载DataGraph环境配置，支持从父目录继承
    优先级：当前目录 > 父目录 > 祖父目录 > 系统环境变量
    """
    current_dir = Path.cwd()
    
    # 尝试多种路径查找.env文件
    env_paths = [
        current_dir / ".env",  # 当前目录
        current_dir.parent / ".env",  # 父目录 (mat-backend)
        current_dir.parent.parent / ".env",  # 祖父目录 (项目根目录)
    ]
    
    env_loaded = False
    for env_path in env_paths:
        if env_path.exists():
            # 加载.env文件，不覆盖已存在的环境变量
            load_dotenv(dotenv_path=str(env_path), override=False)
            env_loaded = True
            
            # 如果不是当前目录的.env，则提示正在使用父目录的配置
            if env_path != current_dir / ".env":
                relative_path = os.path.relpath(str(env_path), str(current_dir))
                print(f"ℹ️  使用上级目录的环境配置: {relative_path}")
            break
    
    if not env_loaded:
        print("ℹ️  未找到.env配置文件，将使用系统环境变量")
    
    return env_loaded


def get_matgraph_config_from_env():
    """
    从环境变量中提取DataGraph相关配置
    将主项目的配置映射到DataGraph所需的环境变量格式
    """
    # 确保加载了环境变量
    load_matgraph_env()
    
    # DataGraph配置映射
    config_mapping = {
        # 基本服务配置
        'HOST': os.getenv('MATGRAPH_HOST', '0.0.0.0'),
        'PORT': os.getenv('MATGRAPH_PORT', '9622'),
        'WEBUI_TITLE': os.getenv('MATGRAPH_WEBUI_TITLE', 'DataGraph 知识图谱系统'),
        'WEBUI_DESCRIPTION': os.getenv('MATGRAPH_WEBUI_DESCRIPTION', '基于 LightRAG 的知识图谱系统'),
        
        # 目录配置
        'WORKING_DIR': os.getenv('MATGRAPH_WORKING_DIR', './rag_storage'),
        'INPUT_DIR': os.getenv('MATGRAPH_INPUT_DIR', './inputs'),
        'WORKSPACE': os.getenv('MATGRAPH_WORKSPACE', ''),
        
        # LLM配置
        'LLM_BINDING': os.getenv('MATGRAPH_LLM_BINDING', 'openai'),
        'LLM_MODEL': os.getenv('MATGRAPH_LLM_MODEL', os.getenv('DEFAULT_LLM_MODEL', 'Qwen/Qwen3-30B-A3B-Instruct-2507')),
        'LLM_BINDING_HOST': os.getenv('MATGRAPH_LLM_BINDING_HOST', os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')),
        'LLM_BINDING_API_KEY': os.getenv('MATGRAPH_LLM_BINDING_API_KEY', os.getenv('OPENAI_API_KEY', '')),
        'TEMPERATURE': os.getenv('MATGRAPH_TEMPERATURE', '0.1'),
        'TIMEOUT': os.getenv('MATGRAPH_TIMEOUT', '240'),

        # 嵌入模型配置
        'EMBEDDING_BINDING': os.getenv('MATGRAPH_EMBEDDING_BINDING', 'openai'),
        'EMBEDDING_BINDING_HOST': os.getenv('MATGRAPH_EMBEDDING_BINDING_HOST', os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')),
        'EMBEDDING_BINDING_API_KEY': os.getenv('MATGRAPH_EMBEDDING_BINDING_API_KEY', os.getenv('OPENAI_API_KEY', '')),
        'EMBEDDING_MODEL': os.getenv('MATGRAPH_EMBEDDING_MODEL', os.getenv('DEFAULT_EMBEDDING_MODEL', 'text-embedding-v4')),
        'EMBEDDING_DIM': os.getenv('MATGRAPH_EMBEDDING_DIM', '1024'),
        
        # 存储配置
        'LIGHTRAG_KV_STORAGE': os.getenv('MATGRAPH_KV_STORAGE', 'JsonKVStorage'),
        'LIGHTRAG_DOC_STATUS_STORAGE': os.getenv('MATGRAPH_DOC_STATUS_STORAGE', 'JsonDocStatusStorage'),
        'LIGHTRAG_GRAPH_STORAGE': os.getenv('MATGRAPH_GRAPH_STORAGE', 'NetworkXStorage'),
        'LIGHTRAG_VECTOR_STORAGE': os.getenv('MATGRAPH_VECTOR_STORAGE', 'NanoVectorDBStorage'),
        
        # 处理配置
        'SUMMARY_LANGUAGE': os.getenv('MATGRAPH_SUMMARY_LANGUAGE', 'Chinese'),
        'ENABLE_LLM_CACHE': os.getenv('MATGRAPH_ENABLE_LLM_CACHE', 'True'),
        'CHUNK_SIZE': os.getenv('MATGRAPH_CHUNK_SIZE', '1200'),
        'CHUNK_OVERLAP_SIZE': os.getenv('MATGRAPH_CHUNK_OVERLAP_SIZE', '100'),
        'MAX_ASYNC': os.getenv('MATGRAPH_MAX_ASYNC', '4'),
        'TOP_K': os.getenv('MATGRAPH_TOP_K', '40'),
        'CHUNK_TOP_K': os.getenv('MATGRAPH_CHUNK_TOP_K', '10'),
        
        # 通用配置
        'LOG_LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
        'CORS_ORIGINS': os.getenv('CORS_ORIGINS', '*'),
    }
    
    # 将配置应用到环境变量
    for key, value in config_mapping.items():
        if value and not os.getenv(key):  # 只有当环境变量不存在时才设置
            os.environ[key] = str(value)
    
    return config_mapping


# 模块导入时自动加载配置
get_matgraph_config_from_env()
