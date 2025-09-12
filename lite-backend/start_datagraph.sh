#!/bin/bash

# DataGraph 服务启动脚本
# 启动 DataGraph 服务在 9622 端口

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 启动 DataGraph 知识图谱服务${NC}"
echo "========================================"

# 设置工作目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/DataGraph/rag_storage_test"

# 检查数据目录是否存在
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${YELLOW}⚠️  数据目录不存在，正在创建: $DATA_DIR${NC}"
    mkdir -p "$DATA_DIR"
fi

# 检查端口是否被占用
if lsof -i :9622 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 9622 已被占用，正在停止现有服务...${NC}"
    pkill -f "matgraph_server\|lightrag_server" || true
    sleep 2
fi

# 切换到DataGraph目录
cd "$SCRIPT_DIR/DataGraph"

# 加载环境配置
echo -e "\n${BLUE}1. 加载环境配置...${NC}"
if [ -f "load_env_from_parent.py" ]; then
    /opt/anaconda3/envs/zzdsj-lite/bin/python load_env_from_parent.py
else
    echo -e "${YELLOW}⚠️  环境加载器不存在，使用默认配置${NC}"
fi

# 从父项目继承API密钥和配置
if [ -f "$SCRIPT_DIR/.env" ]; then
    # 先加载所有相关的环境变量
    export $(grep -E "(ONE_API_KEY|ONE_API_BASE_URL|DATAGRAPH_.*)" "$SCRIPT_DIR/.env" | sed 's/"//g' | xargs) 2>/dev/null || true
fi

# 设置关键环境变量（在加载.env之后）
export WORKING_DIR="$DATA_DIR"
export PORT=9622
export LLM_BINDING=openai
export EMBEDDING_BINDING=openai
# 使用.env文件中的DATAGRAPH配置
export LLM_MODEL="${DATAGRAPH_LLM_MODEL:-Qwen/Qwen3-30B-A3B-Instruct-2507}"
export EMBEDDING_MODEL="${DATAGRAPH_EMBEDDING_MODEL:-text-embedding-v3}"
export EMBEDDING_DIM="${DATAGRAPH_EMBEDDING_DIM:-1536}"

# 使用ONE_API配置
if [ ! -z "$ONE_API_KEY" ] && [ ! -z "$ONE_API_BASE_URL" ]; then
    API_KEY="$ONE_API_KEY"
    API_BASE_URL="$ONE_API_BASE_URL"
    echo -e "${GREEN}✅ 使用ONE API服务${NC}"
    
    # DataGraph需要OpenAI兼容的环境变量
    export OPENAI_API_KEY="$API_KEY"
    export OPENAI_BASE_URL="$API_BASE_URL"
    export LLM_BINDING_API_KEY="$API_KEY"
    export EMBEDDING_BINDING_API_KEY="$API_KEY"
    export LLM_BINDING_HOST="$API_BASE_URL"
    export EMBEDDING_BINDING_HOST="$API_BASE_URL"
    
    echo -e "${GREEN}✅ API配置完成:${NC}"
    echo "   - API密钥: ${API_KEY:0:10}..."
    echo "   - API地址: $API_BASE_URL"
else
    echo -e "${RED}❌ 未找到ONE_API_KEY或ONE_API_BASE_URL，请检查.env配置${NC}"
fi

echo -e "\n${BLUE}2. 服务配置信息${NC}"
echo "数据目录: $DATA_DIR"
echo "服务端口: 9622"
echo "LLM模型: ${LLM_MODEL}"
echo "Embedding模型: ${EMBEDDING_MODEL}"
echo "Embedding维度: ${EMBEDDING_DIM}"
echo "访问地址: http://localhost:9622"
echo ""

echo -e "${BLUE}3. 启动DataGraph服务...${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
echo ""

# 启动服务 - 使用zzdsj-lite conda环境
/opt/anaconda3/envs/zzdsj-lite/bin/python -m matgraph_core.api.lightrag_server --port 9622 --host 0.0.0.0 --working-dir "$DATA_DIR"
