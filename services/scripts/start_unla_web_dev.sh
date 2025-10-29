#!/bin/bash
# Unla Web前端开发模式启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SOURCE_DIR="${PROJECT_ROOT}/lite-backend/Unla/web"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}启动 Unla Web 开发模式${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查源码目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误: 源码目录不存在: $SOURCE_DIR${NC}"
    exit 1
fi

cd "$SOURCE_DIR"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖...${NC}"
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${RED}错误: npm/pnpm未安装${NC}"
        exit 1
    fi
fi

# 创建或检查.env文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建.env配置文件...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        cat > .env <<EOF
# API和WebSocket URLs (开发环境)
VITE_API_BASE_URL=/api
VITE_WS_BASE_URL=/api/ws
VITE_MCP_GATEWAY_BASE_URL=/mcp
VITE_DIRECT_MCP_GATEWAY_MODIFIER=:5235
VITE_BASE_URL=/
VITE_DEV_API_BASE_URL=http://localhost:5234
EOF
    fi
fi

echo -e "${YELLOW}配置信息:${NC}"
echo -e "  开发服务器端口: 5173"
echo -e "  API代理目标: http://localhost:5234"
echo -e "  访问地址: http://localhost:5173"
echo ""
echo -e "${GREEN}启动开发服务器...${NC}"
echo -e "${YELLOW}提示: 按 Ctrl+C 停止服务${NC}"
echo ""

# 启动开发服务器
if command -v pnpm &> /dev/null; then
    pnpm run dev
else
    npm run dev
fi
