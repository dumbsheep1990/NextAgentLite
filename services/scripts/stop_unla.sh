#!/bin/bash
# Unla 服务停止脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
LOG_DIR="${PROJECT_ROOT}/services/logs"

APISERVER_PID="${LOG_DIR}/unla-apiserver.pid"
GATEWAY_PID="${LOG_DIR}/unla-mcp-gateway.pid"

echo -e "${YELLOW}停止 Unla 服务...${NC}"

# 停止 MCP Gateway
if [ -f "$GATEWAY_PID" ]; then
    PID=$(cat "$GATEWAY_PID")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止 MCP Gateway (PID: $PID)...${NC}"
        kill $PID
        sleep 2
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID
        fi
        echo -e "${GREEN}✓ MCP Gateway 已停止${NC}"
    fi
    rm -f "$GATEWAY_PID"
fi

# 停止 API Server
if [ -f "$APISERVER_PID" ]; then
    PID=$(cat "$APISERVER_PID")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止 API Server (PID: $PID)...${NC}"
        kill $PID
        sleep 2
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID
        fi
        echo -e "${GREEN}✓ API Server 已停止${NC}"
    fi
    rm -f "$APISERVER_PID"
fi

echo -e "${GREEN}Unla 服务已全部停止${NC}"
