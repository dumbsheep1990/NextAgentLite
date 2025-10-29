#!/bin/bash
# NextAgentLite 快捷停止入口 - 使用PM2管理

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}停止 NextAgentLite 服务${NC}"
echo ""

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
