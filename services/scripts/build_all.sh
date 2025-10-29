#!/bin/bash
# 统一构建所有Go服务的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}开始构建所有Go服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 构建 LLM Config Gateway
echo -e "${GREEN}[1/2] 构建 LLM Config Gateway...${NC}"
bash "${SCRIPT_DIR}/build_llm_gateway.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}LLM Config Gateway 构建失败!${NC}"
    exit 1
fi

echo ""

# 构建 Unla 服务
echo -e "${GREEN}[2/2] 构建 Unla 服务...${NC}"
bash "${SCRIPT_DIR}/build_unla.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}Unla 服务构建失败!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}所有服务构建完成!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}已构建的服务:${NC}"
echo -e "  1. LLM Config Gateway (端口9050)"
echo -e "  2. Unla API Server (端口5234)"
echo -e "  3. Unla MCP Gateway (端口5235)"
echo ""
echo -e "${YELLOW}启动服务:${NC}"
echo -e "  ./start_llm_gateway.sh"
echo -e "  ./start_unla.sh"
echo ""
echo -e "${YELLOW}查看二进制文件:${NC}"
echo -e "  ls -lh ../bin/"
