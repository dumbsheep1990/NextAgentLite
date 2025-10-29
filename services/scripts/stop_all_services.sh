#!/bin/bash

# NextAgentLite 统一停止脚本 - 使用PM2管理
# 停止所有服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║       NextAgentLite - 停止所有服务（PM2）                ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}错误: PM2未安装${NC}"
    echo -e "${YELLOW}请先安装PM2: npm install -g pm2${NC}"
    exit 1
fi

# 检查PM2是否有运行的进程
if pm2 list | grep -q "online"; then
    echo -e "${YELLOW}停止所有PM2进程...${NC}"
    pm2 stop all
    echo ""
    echo -e "${GREEN}所有服务已停止${NC}"
else
    echo -e "${YELLOW}没有运行中的PM2进程${NC}"
fi

echo ""
echo -e "${BLUE}提示:${NC}"
echo -e "  删除进程: pm2 delete all"
echo -e "  查看状态: pm2 status"
echo ""
