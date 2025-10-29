#!/bin/bash
# LLM Config Gateway 停止脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
LOG_DIR="${PROJECT_ROOT}/services/logs"
PID_FILE="${LOG_DIR}/llm-gateway.pid"

echo -e "${YELLOW}停止 LLM Config Gateway...${NC}"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}PID文件不存在,服务可能未运行${NC}"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo -e "${YELLOW}停止进程 (PID: $PID)...${NC}"
    kill $PID

    # 等待进程结束
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # 如果还在运行,强制kill
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}强制停止进程...${NC}"
        kill -9 $PID
        sleep 1
    fi

    echo -e "${GREEN}✓ LLM Config Gateway 已停止${NC}"
else
    echo -e "${YELLOW}进程不存在,清理PID文件${NC}"
fi

rm -f "$PID_FILE"
