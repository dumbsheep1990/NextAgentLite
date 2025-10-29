#!/bin/bash
# Unla Web前端构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SOURCE_DIR="${PROJECT_ROOT}/lite-backend/Unla/web"
OUTPUT_DIR="${PROJECT_ROOT}/services/web"
CONFIG_DIR="${PROJECT_ROOT}/services/configs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始构建 Unla Web 前端${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查源码目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误: 源码目录不存在: $SOURCE_DIR${NC}"
    exit 1
fi

# 检查Node.js和pnpm
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js未安装${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}警告: pnpm未安装,尝试使用npm...${NC}"
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: npm也未安装${NC}"
        exit 1
    fi
    USE_NPM=true
else
    USE_NPM=false
fi

echo -e "${YELLOW}Node版本:${NC}"
node --version

if [ "$USE_NPM" = false ]; then
    echo -e "${YELLOW}pnpm版本:${NC}"
    pnpm --version
fi

# 进入源码目录
cd "$SOURCE_DIR"

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖...${NC}"
    if [ "$USE_NPM" = false ]; then
        pnpm install
    else
        npm install
    fi
fi

# 创建生产环境配置
echo -e "${YELLOW}创建生产环境配置...${NC}"
cat > .env.production <<EOF
# API和WebSocket URLs (生产环境使用相对路径)
VITE_API_BASE_URL=/api
VITE_WS_BASE_URL=/api/ws
VITE_MCP_GATEWAY_BASE_URL=/mcp
VITE_DIRECT_MCP_GATEWAY_MODIFIER=:5235
VITE_BASE_URL=/
EOF

echo -e "${YELLOW}开始构建...${NC}"
if [ "$USE_NPM" = false ]; then
    pnpm run build
else
    npm run build
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 构建成功!${NC}"

    # 清理旧的输出目录
    echo -e "${YELLOW}清理旧的输出目录...${NC}"
    rm -rf "${OUTPUT_DIR}/dist"

    # 复制构建产物
    echo -e "${YELLOW}复制构建产物...${NC}"
    mkdir -p "${OUTPUT_DIR}"
    cp -r dist "${OUTPUT_DIR}/"

    # 复制配置文件示例
    if [ -f ".env.example" ]; then
        cp .env.example "${CONFIG_DIR}/unla-web.env.example"
    fi

    # 创建生产环境配置到configs目录
    cp .env.production "${CONFIG_DIR}/unla-web.env.production"

    # 显示构建信息
    echo -e "${YELLOW}构建产物信息:${NC}"
    du -sh "${OUTPUT_DIR}/dist"
    ls -lh "${OUTPUT_DIR}/dist/"

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Unla Web 构建完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}构建产物: ${OUTPUT_DIR}/dist${NC}"
    echo -e "${YELLOW}配置文件: ${CONFIG_DIR}/unla-web.env.production${NC}"
    echo -e "${YELLOW}启动命令: ./start_unla_web.sh${NC}"
else
    echo -e "${RED}✗ 构建失败!${NC}"
    exit 1
fi
