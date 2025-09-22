#!/bin/bash

# DeepScrape服务快速启动脚本
# 自动配置端口和环境变量

set -e

echo "🚀 DeepScrape服务启动脚本"
echo "=============================="

# 配置变量
DEEPSCRAPE_DIR="deepscrape"
DEEPSCRAPE_PORT=3001
DEEPSCRAPE_REPO="https://github.com/stretchcloud/deepscrape.git"

# 检查是否已存在DeepScrape目录
if [ ! -d "$DEEPSCRAPE_DIR" ]; then
    echo "📥 克隆DeepScrape项目..."
    git clone "$DEEPSCRAPE_REPO" "$DEEPSCRAPE_DIR"
    cd "$DEEPSCRAPE_DIR"
else
    echo "📁 DeepScrape目录已存在，进入目录..."
    cd "$DEEPSCRAPE_DIR"
    
    # 检查是否需要更新
    echo "🔄 检查更新..."
    git fetch origin
    BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt 0 ]; then
        echo "💡 发现 $BEHIND 个新提交，是否更新？(y/N)"
        read -r update_choice
        if [[ $update_choice =~ ^[Yy]$ ]]; then
            git pull origin main
        fi
    else
        echo "✅ 代码已是最新版本"
    fi
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js (建议版本18+)"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
else
    echo "📦 依赖已安装，检查更新..."
    npm update
fi

# 配置环境变量
echo "⚙️  配置环境变量..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已复制.env.example到.env"
    else
        echo "📝 创建.env文件..."
        cat > .env << EOF
# Core
API_KEY=test-key
PORT=$DEEPSCRAPE_PORT

# LLM Configuration - 选择一种配置方式
# 选项1: 使用OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-key

# 选项2: 使用本地Ollama (取消注释下面两行)
# LLM_PROVIDER=ollama
# LLM_MODEL=llama3:latest

# 选项3: 使用阿里云 (取消注释下面三行)
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your-alibaba-api-key
# OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Cache
CACHE_ENABLED=true
CACHE_TTL=3600

# Redis (可选，用于任务队列)
# REDIS_HOST=localhost
# REDIS_PORT=6379
EOF
    fi
else
    echo "📄 .env文件已存在"
fi

# 确保端口设置正确
if grep -q "^PORT=" .env; then
    sed -i.bak "s/^PORT=.*/PORT=$DEEPSCRAPE_PORT/" .env
    echo "✅ 端口已设置为 $DEEPSCRAPE_PORT"
else
    echo "PORT=$DEEPSCRAPE_PORT" >> .env
    echo "✅ 添加端口配置 $DEEPSCRAPE_PORT"
fi

# 检查API密钥配置
echo ""
echo "🔑 请配置LLM API密钥:"
echo "   编辑 .env 文件，选择并配置以下选项之一:"
echo ""
echo "   选项1 - OpenAI:"
echo "   LLM_PROVIDER=openai"
echo "   OPENAI_API_KEY=your-openai-key"
echo ""
echo "   选项2 - 阿里云通义千问:"
echo "   LLM_PROVIDER=openai"
echo "   OPENAI_API_KEY=your-alibaba-api-key"
echo "   OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1"
echo ""
echo "   选项3 - 本地Ollama:"
echo "   LLM_PROVIDER=ollama"
echo "   LLM_MODEL=llama3:latest"
echo ""

# 询问是否现在配置
echo "📝 是否现在打开.env文件进行配置？(y/N)"
read -r config_choice
if [[ $config_choice =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "请手动编辑 .env 文件"
    fi
fi

# 检查Redis连接（可选）
echo ""
echo "🔍 检查Redis连接（可选）..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis服务可用"
    else
        echo "⚠️  Redis服务不可用，将使用内存队列"
    fi
else
    echo "ℹ️  Redis未安装，将使用内存队列"
fi

# 启动服务
echo ""
echo "🚀 启动DeepScrape服务..."
echo "   服务地址: http://localhost:$DEEPSCRAPE_PORT"
echo "   API文档: http://localhost:$DEEPSCRAPE_PORT/api-docs"
echo "   健康检查: http://localhost:$DEEPSCRAPE_PORT/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动开发服务器
npm run dev