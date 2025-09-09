"""
MatGraph 配置文件 - 从 .env 文件读取配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 基础配置
MATGRAPH_BASE_DIR = Path(__file__).parent
MATGRAPH_WORKING_DIR = MATGRAPH_BASE_DIR / "MatGraph" / "rag_storage_test"
MATGRAPH_INPUT_DIR = MATGRAPH_BASE_DIR / "MatGraph" / "inputs_test"

# 确保目录存在
MATGRAPH_WORKING_DIR.mkdir(exist_ok=True)
MATGRAPH_INPUT_DIR.mkdir(exist_ok=True)

# MatGraph 服务配置 - 从 .env 文件读取
MATGRAPH_CONFIG = {
    # 服务器配置
    "HOST": os.getenv("MATGRAPH_HOST", "0.0.0.0"),
    "PORT": int(os.getenv("MATGRAPH_PORT", "9622")),
    "WEBUI_TITLE": os.getenv("MATGRAPH_WEBUI_TITLE", "MatGraph 知识图谱系统"),
    "WEBUI_DESCRIPTION": os.getenv("MATGRAPH_WEBUI_DESCRIPTION", "基于 LightRAG 的材料科学知识图谱系统"),
    
    # 语言配置
    "SUMMARY_LANGUAGE": os.getenv("MATGRAPH_SUMMARY_LANGUAGE", "Chinese"),
    
    # 查询配置
    "ENABLE_LLM_CACHE": os.getenv("MATGRAPH_ENABLE_LLM_CACHE", "True").lower() == "true",
    "TOP_K": int(os.getenv("MATGRAPH_TOP_K", "40")),
    "CHUNK_TOP_K": int(os.getenv("MATGRAPH_CHUNK_TOP_K", "10")),
    "MAX_ENTITY_TOKENS": 10000,
    "MAX_RELATION_TOKENS": 10000,
    "MAX_TOTAL_TOKENS": 30000,
    
    # 文档处理配置
    "ENABLE_LLM_CACHE_FOR_EXTRACT": True,
    "CHUNK_SIZE": int(os.getenv("MATGRAPH_CHUNK_SIZE", "1200")),
    "CHUNK_OVERLAP_SIZE": int(os.getenv("MATGRAPH_CHUNK_OVERLAP_SIZE", "100")),
    "MAX_GLEANING": 1,
    
    # 并发配置
    "MAX_ASYNC": int(os.getenv("MATGRAPH_MAX_ASYNC", "4")),
    "MAX_PARALLEL_INSERT": 2,
    
    # LLM 配置 - 从 .env 文件读取
    "LLM_BINDING": os.getenv("MATGRAPH_LLM_BINDING", "openai"),
    "LLM_MODEL": os.getenv("MATGRAPH_LLM_MODEL", "qwen3-30b-a3b-instruct-2507"),
    "LLM_BINDING_HOST": os.getenv("MATGRAPH_LLM_BINDING_HOST", "http://101.132.149.115:30504/v1"),
    "LLM_BINDING_API_KEY": os.getenv("MATGRAPH_LLM_BINDING_API_KEY", "sk-wboEKdPyTgltngVIDCaVU6mHuEvmGik7keR03Fws1yE3HR9m"),
    "TEMPERATURE": float(os.getenv("MATGRAPH_TEMPERATURE", "0.1")),
    "TIMEOUT": int(os.getenv("MATGRAPH_TIMEOUT", "240")),
    
    # 嵌入模型配置
    "EMBEDDING_BINDING": os.getenv("MATGRAPH_EMBEDDING_BINDING", "openai"),
    "EMBEDDING_BINDING_HOST": os.getenv("MATGRAPH_EMBEDDING_BINDING_HOST", "http://101.132.149.115:30504/v1"),
    "EMBEDDING_BINDING_API_KEY": os.getenv("MATGRAPH_EMBEDDING_BINDING_API_KEY", "sk-wboEKdPyTgltngVIDCaVU6mHuEvmGik7keR03Fws1yE3HR9m"),
    "EMBEDDING_MODEL": os.getenv("MATGRAPH_EMBEDDING_MODEL", "text-embedding-v4"),
    "EMBEDDING_DIM": int(os.getenv("MATGRAPH_EMBEDDING_DIM", "1024")),
    
    # 存储配置 - 从 .env 文件读取
    "LIGHTRAG_KV_STORAGE": os.getenv("MATGRAPH_KV_STORAGE", "JsonKVStorage"),
    "LIGHTRAG_DOC_STATUS_STORAGE": os.getenv("MATGRAPH_DOC_STATUS_STORAGE", "JsonDocStatusStorage"), 
    "LIGHTRAG_GRAPH_STORAGE": os.getenv("MATGRAPH_GRAPH_STORAGE", "NetworkXStorage"),
    "LIGHTRAG_VECTOR_STORAGE": os.getenv("MATGRAPH_VECTOR_STORAGE", "NanoVectorDBStorage"),
    
    # 工作目录
    "WORKING_DIR": str(MATGRAPH_WORKING_DIR),
    "INPUT_DIR": str(MATGRAPH_INPUT_DIR),
    "WORKSPACE": os.getenv("MATGRAPH_WORKSPACE", "default"),
}

def get_matgraph_config():
    """获取 MatGraph 配置"""
    return MATGRAPH_CONFIG.copy()

def setup_matgraph_env():
    """设置 MatGraph 环境变量"""
    for key, value in MATGRAPH_CONFIG.items():
        os.environ[key] = str(value)
    
    print(f"✅ MatGraph 配置已设置")
    print(f"📁 工作目录: {MATGRAPH_WORKING_DIR}")
    print(f"📁 输入目录: {MATGRAPH_INPUT_DIR}")
    print(f"🚀 服务端口: {MATGRAPH_CONFIG['PORT']}")
    
    return MATGRAPH_CONFIG

# 兼容性函数
def get_lightrag_config():
    """获取配置 - 兼容旧接口"""
    return get_matgraph_config()

def setup_lightrag_env():
    """设置环境变量 - 兼容旧接口"""
    return setup_matgraph_env()