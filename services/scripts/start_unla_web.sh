#!/bin/bash
# Unla Web前端启动脚本 (使用serve静态服务器)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
WEB_DIR="${PROJECT_ROOT}/services/web"
LOG_DIR="${PROJECT_ROOT}/services/logs"
PID_FILE="${LOG_DIR}/unla-web.pid"
LOG_FILE="${LOG_DIR}/unla-web.log"

# 配置
PORT=${UNLA_WEB_PORT:-5173}
DIST_DIR="${WEB_DIR}/dist"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}启动 Unla Web 前端${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查构建产物
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}错误: 构建产物不存在: $DIST_DIR${NC}"
    echo -e "${YELLOW}请先运行构建脚本: ./build_unla_web.sh${NC}"
    exit 1
fi

# 检查是否已经运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}警告: Unla Web 已经在运行 (PID: $OLD_PID)${NC}"
        echo -e "${YELLOW}如需重启,请先运行: ./stop_unla_web.sh${NC}"
        exit 1
    else
        echo -e "${YELLOW}清理过期的PID文件${NC}"
        rm -f "$PID_FILE"
    fi
fi

# 检查serve是否安装
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}serve未安装,正在全局安装...${NC}"
    if command -v npm &> /dev/null; then
        npm install -g serve
    else
        echo -e "${RED}错误: npm未安装,无法安装serve${NC}"
        echo -e "${YELLOW}请手动安装: npm install -g serve${NC}"
        exit 1
    fi
fi

# 确保日志目录存在
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}服务配置:${NC}"
echo -e "  端口: ${PORT}"
echo -e "  目录: ${DIST_DIR}"
echo -e "  日志文件: ${LOG_FILE}"
echo -e "  PID文件: ${PID_FILE}"

# 启动serve
echo -e "${YELLOW}启动Web服务...${NC}"
cd "$DIST_DIR"
nohup serve -l $PORT -s . > "$LOG_FILE" 2>&1 &
PID=$!

# 保存PID
echo $PID > "$PID_FILE"

# 等待服务启动
sleep 2

# 检查进程是否还在运行
if ps -p $PID > /dev/null; then
    echo -e "${GREEN}✓ Unla Web 启动成功!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}PID: $PID${NC}"
    echo -e "${YELLOW}端口: $PORT${NC}"
    echo -e "${YELLOW}访问: http://localhost:$PORT${NC}"
    echo -e "${YELLOW}日志: tail -f $LOG_FILE${NC}"
    echo -e "${YELLOW}停止: ./stop_unla_web.sh${NC}"
else
    echo -e "${RED}✗ 服务启动失败!${NC}"
    echo -e "${YELLOW}查看日志: cat $LOG_FILE${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
