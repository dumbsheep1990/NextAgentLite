#!/bin/bash

# NextAgentLite 服务状态检查脚本 - 使用PM2管理

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║       NextAgentLite - 服务状态（PM2）                     ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}错误: PM2未安装${NC}"
    echo -e "${YELLOW}请先安装PM2: npm install -g pm2${NC}"
    exit 1
fi

# PM2状态
pm2 status

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}服务访问地址:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}前端应用:${NC}        http://localhost:3000"
echo -e "${CYAN}后端API:${NC}         http://localhost:8000"
echo -e "${CYAN}API文档:${NC}         http://localhost:8000/docs"
echo -e "${CYAN}健康检查:${NC}        http://localhost:8000/health"
echo -e "${CYAN}API网关:${NC}         http://localhost:8000/api-gateway/health"
echo -e "${CYAN}知识图谱:${NC}        http://localhost:9622"
echo -e "${CYAN}DeepScrape:${NC}      http://localhost:3001"
echo -e "${CYAN}LLM Gateway:${NC}     http://localhost:9050"
echo -e "${CYAN}Unla Web:${NC}        http://localhost:5173"
echo -e "${CYAN}Unla API:${NC}        http://localhost:5234"
echo -e "${CYAN}Unla MCP:${NC}        http://localhost:5235"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}常用PM2命令:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}查看日志:${NC}           pm2 logs"
echo -e "${CYAN}查看特定服务日志:${NC}   pm2 logs backend"
echo -e "${CYAN}重启服务:${NC}           pm2 restart all"
echo -e "${CYAN}停止服务:${NC}           pm2 stop all"
echo -e "${CYAN}删除进程:${NC}           pm2 delete all"
echo -e "${CYAN}监控面板:${NC}           pm2 monit"
echo ""
