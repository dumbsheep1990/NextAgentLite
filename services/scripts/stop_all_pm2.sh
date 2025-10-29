#!/bin/bash

# PM2一键停止所有服务
# 使用方法: bash scripts/stop_all_pm2.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 切换到项目根目录
cd "$PROJECT_ROOT"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  PM2 一键停止所有服务${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}错误: PM2未安装${NC}"
    exit 1
fi

# 检查是否有运行的进程
RUNNING_COUNT=$(pm2 jlist 2>/dev/null | grep -c '"pm2_env"' || echo "0")

if [ "$RUNNING_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}没有检测到运行中的PM2进程${NC}"
    echo ""
    exit 0
fi

# 显示当前运行的服务
echo -e "${YELLOW}当前运行的服务:${NC}"
echo ""
pm2 list
echo ""

# 确认停止
read -p "是否停止所有服务? (y/n): " CONFIRM_STOP

if [ "$CONFIRM_STOP" != "y" ] && [ "$CONFIRM_STOP" != "Y" ]; then
    echo -e "${YELLOW}操作已取消${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}正在停止所有服务...${NC}"

# 停止所有服务
pm2 stop all

echo -e "${GREEN}✓ 所有服务已停止${NC}"
echo ""

# 询问是否删除进程
read -p "是否删除所有进程配置? (y/n): " CONFIRM_DELETE

if [ "$CONFIRM_DELETE" = "y" ] || [ "$CONFIRM_DELETE" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}正在删除所有进程配置...${NC}"
    pm2 delete all
    echo -e "${GREEN}✓ 所有进程配置已删除${NC}"

    # 询问是否清空PM2日志
    echo ""
    read -p "是否清空PM2日志? (y/n): " CONFIRM_FLUSH

    if [ "$CONFIRM_FLUSH" = "y" ] || [ "$CONFIRM_FLUSH" = "Y" ]; then
        echo -e "${YELLOW}正在清空PM2日志...${NC}"
        pm2 flush
        echo -e "${GREEN}✓ PM2日志已清空${NC}"
    fi
else
    echo -e "${YELLOW}保留进程配置，可使用 'pm2 restart all' 重启服务${NC}"
fi

echo ""
echo -e "${YELLOW}当前PM2状态:${NC}"
pm2 list

echo ""
echo -e "${GREEN}✓ 停止操作完成!${NC}"
echo ""

# 显示重启命令提示
if [ "$CONFIRM_DELETE" != "y" ] && [ "$CONFIRM_DELETE" != "Y" ]; then
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  快速重启命令${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "${YELLOW}重启所有服务:${NC}       ${BLUE}pm2 restart all${NC}"
    echo -e "${YELLOW}启动所有服务:${NC}       ${BLUE}pm2 start all${NC}"
    echo -e "${YELLOW}查看服务状态:${NC}       ${BLUE}pm2 list${NC}"
    echo ""
fi
