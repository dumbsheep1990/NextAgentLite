#!/bin/bash

# DataGraph服务准备脚本
# 将DataGraph从lite-backend复制到services目录并配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LITE_BACKEND_DIR="$(dirname "$PROJECT_ROOT")/lite-backend"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  DataGraph 服务准备${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查源目录是否存在
SOURCE_DIR="$LITE_BACKEND_DIR/DataGraph"
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误: 源目录不存在: $SOURCE_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/5] 检查源目录...${NC}"
echo -e "  源目录: ${BLUE}$SOURCE_DIR${NC}"
SOURCE_SIZE=$(du -sh "$SOURCE_DIR" | cut -f1)
echo -e "  目录大小: ${GREEN}$SOURCE_SIZE${NC}"
echo ""

# 创建目标目录
TARGET_DIR="$PROJECT_ROOT/datagraph"
echo -e "${YELLOW}[2/5] 创建目标目录...${NC}"
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}目标目录已存在，是否覆盖? (y/n): ${NC}"
    read -p "" CONFIRM_OVERWRITE
    if [ "$CONFIRM_OVERWRITE" != "y" ] && [ "$CONFIRM_OVERWRITE" != "Y" ]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    echo -e "${YELLOW}正在删除旧目录...${NC}"
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"
echo -e "  ${GREEN}✓ 目标目录创建完成: $TARGET_DIR${NC}"
echo ""

# 复制DataGraph核心文件
echo -e "${YELLOW}[3/5] 复制DataGraph文件...${NC}"
echo -e "  ${BLUE}正在复制，请稍候...${NC}"

# 复制必要的目录和文件
cp -r "$SOURCE_DIR/datagraph_core" "$TARGET_DIR/"
cp -r "$SOURCE_DIR/lightrag" "$TARGET_DIR/"
cp -r "$SOURCE_DIR/matgraph_webui" "$TARGET_DIR/" 2>/dev/null || echo "  (matgraph_webui不存在，跳过)"

# 复制配置文件
cp "$SOURCE_DIR/.env" "$TARGET_DIR/.env.example" 2>/dev/null || true
cp "$SOURCE_DIR/Dockerfile" "$TARGET_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/load_env_from_parent.py" "$TARGET_DIR/" 2>/dev/null || true

# 复制必要的数据目录结构（但不复制数据）
mkdir -p "$TARGET_DIR/inputs"
mkdir -p "$TARGET_DIR/rag_storage_test"
mkdir -p "$TARGET_DIR/logs"

# 清理Python缓存
echo -e "  ${YELLOW}正在清理Python缓存...${NC}"
find "$TARGET_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$TARGET_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
find "$TARGET_DIR" -type f -name "*.pyo" -delete 2>/dev/null || true

# 清理日志文件
find "$TARGET_DIR" -type f -name "*.log" -delete 2>/dev/null || true

TARGET_SIZE=$(du -sh "$TARGET_DIR" | cut -f1)
echo -e "  ${GREEN}✓ 文件复制完成，大小: $TARGET_SIZE${NC}"
echo ""

# 创建环境配置文件
echo -e "${YELLOW}[4/5] 创建环境配置...${NC}"

cat > "$TARGET_DIR/.env" << 'EOF'
# DataGraph 环境配置
# 知识图谱服务配置

# ===== 服务器配置 =====
HOST=0.0.0.0
PORT=9622
LOG_LEVEL=INFO
WORKSPACE=

# ===== API密钥配置 =====
# 从环境变量继承API密钥
OPENAI_API_KEY=${ONE_API_KEY}
OPENAI_BASE_URL=${ONE_API_BASE_URL}
LLM_BINDING_API_KEY=${ONE_API_KEY}
EMBEDDING_BINDING_API_KEY=${ONE_API_KEY}

# ===== 目录配置 =====
WORKING_DIR=./rag_storage_test
INPUT_DIR=./inputs

# ===== LLM 配置 =====
LLM_BINDING=openai
LLM_BINDING_HOST=${ONE_API_BASE_URL}
LLM_MODEL=Qwen/Qwen3-30B-A3B-Instruct-2507
TEMPERATURE=0.1

# ===== Embedding 配置 =====
EMBEDDING_BINDING=openai
EMBEDDING_BINDING_HOST=${ONE_API_BASE_URL}
EMBEDDING_MODEL=text-embedding-v3
EMBEDDING_DIM=1536

# ===== 分块配置 =====
CHUNK_SIZE=1200
CHUNK_OVERLAP_SIZE=100

# ===== 缓存配置 =====
ENABLE_LLM_CACHE=true
ENABLE_LLM_CACHE_FOR_EXTRACT=true

# ===== 并发配置 =====
MAX_ASYNC=4
MAX_PARALLEL_INSERT=2
EMBEDDING_FUNC_MAX_ASYNC=4
EMBEDDING_BATCH_NUM=10

# ===== 查询配置 =====
TOP_K=20
CHUNK_TOP_K=10
HISTORY_TURNS=3
COSINE_THRESHOLD=0.7
RELATED_CHUNK_NUMBER=20
MIN_RERANK_SCORE=0.5

# ===== CORS 配置 =====
CORS_ORIGINS=*

# ===== 认证配置 =====
LIGHTRAG_API_KEY=
AUTH_ACCOUNTS=
TOKEN_SECRET=datagraph-jwt-secret
TOKEN_EXPIRE_HOURS=48

# ===== 存储配置 =====
LIGHTRAG_KV_STORAGE=JsonKVStorage
LIGHTRAG_VECTOR_STORAGE=NanoVectorDBStorage
LIGHTRAG_GRAPH_STORAGE=NetworkXStorage
LIGHTRAG_DOC_STATUS_STORAGE=JsonDocStatusStorage

# ===== 其他配置 =====
SUMMARY_LANGUAGE=Chinese
WHITELIST_PATHS=/health,/api/*
MAX_GRAPH_NODES=1000
EOF

echo -e "  ${GREEN}✓ 环境配置文件创建完成${NC}"
echo ""

# 创建启动包装脚本
echo -e "${YELLOW}[5/5] 创建启动包装脚本...${NC}"

cat > "$TARGET_DIR/start.sh" << 'EOF'
#!/bin/bash

# DataGraph启动包装脚本
# 用于PM2调用

set -e

# 获取脚本所在目录
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# 加载环境变量（从父级.env继承ONE_API配置）
PARENT_ENV="../.env"
if [ -f "$PARENT_ENV" ]; then
    export $(grep -E "ONE_API_" "$PARENT_ENV" | sed 's/"//g' | xargs) 2>/dev/null || true
fi

# 加载本地.env
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# 确保必要的目录存在
mkdir -p ./inputs
mkdir -p ./rag_storage_test
mkdir -p ./logs

# 设置Python环境变量
export PYTHONUNBUFFERED=1
export PYTHONFAULTHANDLER=1
export NPY_DISABLE_MACOS_ACCELERATE=1
export VECLIB_MAXIMUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# 设置PYTHONPATH
export PYTHONPATH="$DIR:$PYTHONPATH"

# 启动DataGraph服务
exec /opt/anaconda3/envs/zzdsj-lite/bin/python -X faulthandler -m datagraph_core.api.lightrag_server \
  --port ${PORT:-9622} \
  --host ${HOST:-0.0.0.0} \
  --working-dir "${WORKING_DIR:-./rag_storage_test}"
EOF

chmod +x "$TARGET_DIR/start.sh"
echo -e "  ${GREEN}✓ 启动脚本创建完成${NC}"
echo ""

# 显示文件结构
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  准备完成${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}DataGraph服务已准备完成！${NC}"
echo ""
echo -e "目录结构:"
echo -e "  ${BLUE}$TARGET_DIR/${NC}"
echo -e "    ├── datagraph_core/        # 核心代码"
echo -e "    ├── lightrag/              # LightRAG框架"
echo -e "    ├── matgraph_webui/        # WebUI资源"
echo -e "    ├── inputs/                # 输入目录"
echo -e "    ├── rag_storage_test/      # 数据存储"
echo -e "    ├── logs/                  # 日志目录"
echo -e "    ├── .env                   # 环境配置"
echo -e "    └── start.sh               # 启动脚本"
echo ""
echo -e "下一步:"
echo -e "  1. 检查配置: ${BLUE}cat $TARGET_DIR/.env${NC}"
echo -e "  2. 测试启动: ${BLUE}bash $TARGET_DIR/start.sh${NC}"
echo -e "  3. 添加到PM2: ${BLUE}更新ecosystem.config.js${NC}"
echo ""
