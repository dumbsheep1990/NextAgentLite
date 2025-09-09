#!/bin/bash

# Apple Embedding Atlas Quick Start Script
# 快速启动Atlas可视化服务器

echo "🚀 启动Apple Embedding Atlas可视化服务器..."

# 检查当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ATLAS_DIR="$SCRIPT_DIR"
VIEWER_DIST_DIR="$ATLAS_DIR/packages/viewer/dist"

echo "📁 项目目录: $ATLAS_DIR"

# 检查dist目录是否存在
if [ ! -d "$VIEWER_DIST_DIR" ]; then
    echo "❌ 未找到构建文件目录: $VIEWER_DIST_DIR"
    echo "📦 正在构建Atlas项目..."
    
    cd "$ATLAS_DIR"
    
    # 使用Node.js 22环境
    NODE_BIN="/opt/anaconda3/envs/nodejs22/bin/node"
    NPM_BIN="/opt/anaconda3/envs/nodejs22/bin/npm"
    
    if [ ! -f "$NODE_BIN" ]; then
        echo "⚠️  未找到Node.js 22环境，使用系统默认node"
        NODE_BIN="node"
        NPM_BIN="npm"
    fi
    
    echo "🔨 安装依赖..."
    $NPM_BIN install
    
    echo "🔨 构建viewer包..."
    cd packages/viewer
    $NPM_BIN run build
    
    if [ $? -ne 0 ]; then
        echo "❌ 构建失败"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
fi

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用"
    
    # 尝试找到占用进程
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        echo "📍 进程PID: $PID"
        echo "🔍 进程信息:"
        ps -p $PID -o pid,ppid,cmd
        
        read -p "是否终止占用进程并重新启动? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "💀 终止进程 $PID..."
            kill $PID
            sleep 2
        else
            echo "🔄 将尝试使用其他端口..."
            PORT=8081
        fi
    fi
fi

# 进入viewer dist目录
cd "$VIEWER_DIST_DIR"

echo "📂 当前目录: $(pwd)"
echo "📋 目录内容:"
ls -la

# 启动HTTP服务器
echo ""
echo "🌟 启动Atlas可视化服务器..."
echo "🔗 访问地址: http://localhost:$PORT"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

# 尝试使用Python启动
if command -v python3 &> /dev/null; then
    echo "🐍 使用Python3启动HTTP服务器..."
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "🐍 使用Python启动HTTP服务器..."
    python -m http.server $PORT
elif command -v npx &> /dev/null; then
    echo "📦 使用npx serve启动服务器..."
    npx serve -s . -l $PORT
else
    echo "❌ 未找到Python或npx，无法启动HTTP服务器"
    echo "请手动安装Python或Node.js"
    exit 1
fi