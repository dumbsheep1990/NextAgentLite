#!/bin/bash

# MatGraph 服务启动脚本
# 启动 LightRAG 服务在 9622 端口

echo "🚀 启动 MatGraph 知识图谱服务..."

# 设置工作目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/MatGraph/rag_storage_test"

# 检查数据目录是否存在
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ 错误: 数据目录不存在: $DATA_DIR"
    exit 1
fi

# 检查端口是否被占用
if lsof -i :9622 > /dev/null 2>&1; then
    echo "⚠️  端口 9622 已被占用，正在停止现有服务..."
    pkill -f "matgraph_server\|lightrag_server" || true
    sleep 2
fi

# 设置环境变量并启动服务
export WORKING_DIR="$DATA_DIR"
export PORT=9622

echo "📂 数据目录: $DATA_DIR"
echo "🌐 服务端口: 9622"
echo "🔗 访问地址: http://localhost:9622"
echo ""

# 启动服务 - 使用MatGraph的Web UI服务器
cd "$SCRIPT_DIR/MatGraph"
python -m matgraph_core.api.lightrag_server --port 9622 --host 0.0.0.0 --working-dir "$DATA_DIR"