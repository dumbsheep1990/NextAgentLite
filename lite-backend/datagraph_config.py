"""
DataGraph 配置文件 - 从 .env 文件读取配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 基础配置
DATAGRAPH_BASE_DIR = Path(__file__).parent
DATAGRAPH_WORKING_DIR = DATAGRAPH_BASE_DIR / "DataGraph" / "rag_storage_test"
DATAGRAPH_INPUT_DIR = DATAGRAPH_BASE_DIR / "DataGraph" / "inputs_test"

# 确保目录存在
DATAGRAPH_WORKING_DIR.mkdir(exist_ok=True)
DATAGRAPH_INPUT_DIR.mkdir(exist_ok=True)

# DataGraph 服务配置 - 从 .env 文件读取
DATAGRAPH_CONFIG = {
    # 服务器配置
    "HOST": os.getenv("DATAGRAPH_HOST", "0.0.0.0"),
    "PORT": int(os.getenv("DATAGRAPH_PORT", "9622")),
    "WEBUI_TITLE": os.getenv("DATAGRAPH_WEBUI_TITLE", "DataGraph 知识图谱系统"),
    "WEBUI_DESCRIPTION": os.getenv("DATAGRAPH_WEBUI_DESCRIPTION", "基于 LightRAG 的数据科学知识图谱系统"),
    
    # 语言配置
    "SUMMARY_LANGUAGE": os.getenv("DATAGRAPH_SUMMARY_LANGUAGE", "Chinese"),
    
    # 查询配置
    "ENABLE_LLM_CACHE": os.getenv("DATAGRAPH_ENABLE_LLM_CACHE", "True").lower() == "true",
    "TOP_K": int(os.getenv("DATAGRAPH_TOP_K", "40")),
    "CHUNK_TOP_K": int(os.getenv("DATAGRAPH_CHUNK_TOP_K", "10")),
    "MAX_ENTITY_TOKENS": 10000,
    "MAX_RELATION_TOKENS": 10000,
    "MAX_TOTAL_TOKENS": 30000,
    
    # 文档处理配置
    "ENABLE_LLM_CACHE_FOR_EXTRACT": True,
    "CHUNK_SIZE": int(os.getenv("DATAGRAPH_CHUNK_SIZE", "1200")),
    "CHUNK_OVERLAP_SIZE": int(os.getenv("DATAGRAPH_CHUNK_OVERLAP_SIZE", "100")),
    "MAX_GLEANING": 1,
    
    # 并发配置
    "MAX_ASYNC": int(os.getenv("DATAGRAPH_MAX_ASYNC", "4")),
    "MAX_PARALLEL_INSERT": 2,
    
    # LLM 配置 - 从 .env 文件读取，默认使用统一网关
    "LLM_BINDING": os.getenv("DATAGRAPH_LLM_BINDING", "openai"),
    "LLM_MODEL": os.getenv("DATAGRAPH_LLM_MODEL", "qwen3-30b-a3b-instruct-2507"),
    "LLM_BINDING_HOST": os.getenv("DATAGRAPH_LLM_BINDING_HOST") or os.getenv("LLM_GATEWAY_URL", "http://localhost:9050"),
    "LLM_BINDING_API_KEY": os.getenv("DATAGRAPH_LLM_BINDING_API_KEY") or os.getenv("OPENAI_API_KEY", "sk-default"),
    "TEMPERATURE": float(os.getenv("DATAGRAPH_TEMPERATURE", "0.1")),
    "TIMEOUT": int(os.getenv("DATAGRAPH_TIMEOUT", "240")),

    # 嵌入模型配置
    "EMBEDDING_BINDING": os.getenv("DATAGRAPH_EMBEDDING_BINDING", "openai"),
    "EMBEDDING_BINDING_HOST": os.getenv("DATAGRAPH_EMBEDDING_BINDING_HOST") or os.getenv("LLM_GATEWAY_URL", "http://localhost:9050"),
    "EMBEDDING_BINDING_API_KEY": os.getenv("DATAGRAPH_EMBEDDING_BINDING_API_KEY") or os.getenv("OPENAI_API_KEY", "sk-default"),
    "EMBEDDING_MODEL": os.getenv("DATAGRAPH_EMBEDDING_MODEL") or os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4"),
    "EMBEDDING_DIM": int(os.getenv("DATAGRAPH_EMBEDDING_DIM", "1024")),
    
    # 存储配置 - 从 .env 文件读取
    "LIGHTRAG_KV_STORAGE": os.getenv("DATAGRAPH_KV_STORAGE", "JsonKVStorage"),
    "LIGHTRAG_DOC_STATUS_STORAGE": os.getenv("DATAGRAPH_DOC_STATUS_STORAGE", "JsonDocStatusStorage"), 
    "LIGHTRAG_GRAPH_STORAGE": os.getenv("DATAGRAPH_GRAPH_STORAGE", "NetworkXStorage"),
    "LIGHTRAG_VECTOR_STORAGE": os.getenv("DATAGRAPH_VECTOR_STORAGE", "NanoVectorDBStorage"),
    
    # 工作目录
    "WORKING_DIR": str(DATAGRAPH_WORKING_DIR),
    "INPUT_DIR": str(DATAGRAPH_INPUT_DIR),
    "WORKSPACE": os.getenv("DATAGRAPH_WORKSPACE", "default"),
}

def get_datagraph_config():
    """获取 DataGraph 配置"""
    return DATAGRAPH_CONFIG.copy()

def setup_datagraph_env():
    """设置 DataGraph 环境变量"""
    for key, value in DATAGRAPH_CONFIG.items():
        os.environ[key] = str(value)
    
    print(f"✅ DataGraph 配置已设置")
    print(f"📁 工作目录: {DATAGRAPH_WORKING_DIR}")
    print(f"📁 输入目录: {DATAGRAPH_INPUT_DIR}")
    print(f"🚀 服务端口: {DATAGRAPH_CONFIG['PORT']}")
    
    return DATAGRAPH_CONFIG

# 兼容性函数 - 保持向后兼容
def get_matgraph_config():
    """获取配置 - 兼容旧接口"""
    return get_datagraph_config()

def setup_matgraph_env():
    """设置环境变量 - 兼容旧接口"""
    return setup_datagraph_env()

def get_lightrag_config():
    """获取配置 - 兼容旧接口"""
    return get_datagraph_config()

def setup_lightrag_env():
    """设置环境变量 - 兼容旧接口"""
    return setup_datagraph_env()