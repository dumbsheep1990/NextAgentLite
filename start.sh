#!/bin/bash
# NextAgentLite 快捷启动入口 - 使用PM2管理

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}启动 NextAgentLite 服务（使用PM2）${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}警告: PM2未安装，正在安装...${NC}"
    npm install -g pm2
fi

# 启动所有服务
echo -e "${GREEN}启动服务...${NC}"
cd "$SCRIPT_DIR"
pm2 start ecosystem.config.js

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}服务已启动${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}查看服务状态:${NC}   ./status.sh  或  pm2 status"
echo -e "${BLUE}查看日志:${NC}       pm2 logs"
echo -e "${BLUE}停止服务:${NC}       ./stop.sh  或  pm2 stop all"
echo ""
