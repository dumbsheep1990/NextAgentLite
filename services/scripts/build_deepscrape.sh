#!/bin/bash
# DeepScrape服务构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SOURCE_DIR="${PROJECT_ROOT}/lite-backend/DeepScrape"
OUTPUT_DIR="${PROJECT_ROOT}/services/node/deepscrape"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}构建 DeepScrape 服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查源码目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误: 源码目录不存在: $SOURCE_DIR${NC}"
    exit 1
fi

cd "$SOURCE_DIR"

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm未安装${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖...${NC}"
    npm install
else
    echo -e "${GREEN}依赖已存在${NC}"
fi

echo ""
echo -e "${GREEN}[2/5] 清理旧构建...${NC}"
rm -rf dist
npm run clean 2>/dev/null || true

echo ""
echo -e "${GREEN}[3/5] TypeScript 编译...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript 编译失败!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[4/5] 创建输出目录...${NC}"
mkdir -p "$OUTPUT_DIR"

# 复制构建产物和必要文件
echo -e "${YELLOW}复制文件到输出目录...${NC}"
cp -r dist "$OUTPUT_DIR/"
cp package.json "$OUTPUT_DIR/"
cp package-lock.json "$OUTPUT_DIR/" 2>/dev/null || true

# 复制配置文件
if [ -f ".env.example" ]; then
    cp .env.example "$OUTPUT_DIR/"
fi

# 复制依赖 (生产环境)
echo ""
echo -e "${GREEN}[5/5] 安装生产依赖...${NC}"
cd "$OUTPUT_DIR"
npm install --production

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}DeepScrape 构建完成!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}构建信息:${NC}"
echo -e "  源码目录: ${SOURCE_DIR}"
echo -e "  输出目录: ${OUTPUT_DIR}"
echo -e "  主入口: ${OUTPUT_DIR}/dist/index.js"
echo ""
echo -e "${YELLOW}启动命令:${NC}"
echo -e "  cd ${OUTPUT_DIR}"
echo -e "  node dist/index.js"
