#!/bin/bash
# Unla完整服务构建和启动脚本 (Go后端 + Web前端)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Unla 完整服务构建和启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 构建Go后端服务
echo -e "${GREEN}[1/4] 构建 Unla Go 后端服务...${NC}"
bash "${SCRIPT_DIR}/build_unla.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}Unla Go后端构建失败!${NC}"
    exit 1
fi

echo ""

# 2. 构建Web前端
echo -e "${GREEN}[2/4] 构建 Unla Web 前端...${NC}"
bash "${SCRIPT_DIR}/build_unla_web.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}Unla Web前端构建失败!${NC}"
    exit 1
fi

echo ""

# 3. 启动Go后端服务
echo -e "${GREEN}[3/4] 启动 Unla Go 后端服务...${NC}"
bash "${SCRIPT_DIR}/start_unla.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}Unla Go后端启动失败!${NC}"
    exit 1
fi

echo ""

# 4. 启动Web前端
echo -e "${GREEN}[4/4] 启动 Unla Web 前端...${NC}"
bash "${SCRIPT_DIR}/start_unla_web.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}Unla Web前端启动失败!${NC}"
    echo -e "${YELLOW}尝试停止Go后端...${NC}"
    bash "${SCRIPT_DIR}/stop_unla.sh"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Unla 完整服务启动完成!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}服务列表:${NC}"
echo -e "  ${GREEN}✓${NC} API Server  - http://localhost:5234"
echo -e "  ${GREEN}✓${NC} MCP Gateway - http://localhost:5235"
echo -e "  ${GREEN}✓${NC} Web前端     - http://localhost:5173"
echo ""
echo -e "${YELLOW}停止所有服务:${NC}"
echo -e "  ./stop_unla.sh && ./stop_unla_web.sh"
echo ""
echo -e "${YELLOW}查看状态:${NC}"
echo -e "  ./status.sh"
