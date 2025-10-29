#!/bin/bash
# Unla 服务启动脚本 (API Server + MCP Gateway)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
BIN_DIR="${PROJECT_ROOT}/services/bin"
CONFIG_DIR="${PROJECT_ROOT}/services/configs"
LOG_DIR="${PROJECT_ROOT}/services/logs"

# 二进制文件
APISERVER_BIN="${BIN_DIR}/unla-apiserver"
GATEWAY_BIN="${BIN_DIR}/unla-mcp-gateway"
ENV_FILE="${CONFIG_DIR}/unla.env"

# PID和日志文件
APISERVER_PID="${LOG_DIR}/unla-apiserver.pid"
GATEWAY_PID="${LOG_DIR}/unla-mcp-gateway.pid"
APISERVER_LOG="${LOG_DIR}/unla-apiserver.log"
GATEWAY_LOG="${LOG_DIR}/unla-mcp-gateway.log"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}启动 Unla 服务${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查二进制文件
if [ ! -f "$APISERVER_BIN" ] || [ ! -f "$GATEWAY_BIN" ]; then
    echo -e "${RED}错误: 二进制文件不存在${NC}"
    echo -e "${YELLOW}请先运行构建脚本: ./build_unla.sh${NC}"
    exit 1
fi

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}加载配置文件: $ENV_FILE${NC}"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo -e "${YELLOW}警告: 配置文件不存在,使用默认配置${NC}"
fi

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 启动 API Server
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}1. 启动 Unla API Server (端口5234)${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ -f "$APISERVER_PID" ]; then
    OLD_PID=$(cat "$APISERVER_PID")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}API Server 已经在运行 (PID: $OLD_PID)${NC}"
    else
        rm -f "$APISERVER_PID"
    fi
fi

if [ ! -f "$APISERVER_PID" ]; then
    export APISERVER_PORT=${APISERVER_PORT:-5234}
    export GIN_MODE=${GIN_MODE:-release}

    nohup "$APISERVER_BIN" > "$APISERVER_LOG" 2>&1 &
    APISERVER_NEW_PID=$!
    echo $APISERVER_NEW_PID > "$APISERVER_PID"
    sleep 2

    if ps -p $APISERVER_NEW_PID > /dev/null; then
        echo -e "${GREEN}✓ API Server 启动成功 (PID: $APISERVER_NEW_PID)${NC}"
    else
        echo -e "${RED}✗ API Server 启动失败!${NC}"
        echo -e "${YELLOW}查看日志: cat $APISERVER_LOG${NC}"
        rm -f "$APISERVER_PID"
        exit 1
    fi
fi

# 启动 MCP Gateway
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}2. 启动 Unla MCP Gateway (端口5235)${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ -f "$GATEWAY_PID" ]; then
    OLD_PID=$(cat "$GATEWAY_PID")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}MCP Gateway 已经在运行 (PID: $OLD_PID)${NC}"
    else
        rm -f "$GATEWAY_PID"
    fi
fi

if [ ! -f "$GATEWAY_PID" ]; then
    export MCP_GATEWAY_PORT=${MCP_GATEWAY_PORT:-5235}
    export GIN_MODE=${GIN_MODE:-release}

    nohup "$GATEWAY_BIN" > "$GATEWAY_LOG" 2>&1 &
    GATEWAY_NEW_PID=$!
    echo $GATEWAY_NEW_PID > "$GATEWAY_PID"
    sleep 2

    if ps -p $GATEWAY_NEW_PID > /dev/null; then
        echo -e "${GREEN}✓ MCP Gateway 启动成功 (PID: $GATEWAY_NEW_PID)${NC}"
    else
        echo -e "${RED}✗ MCP Gateway 启动失败!${NC}"
        echo -e "${YELLOW}查看日志: cat $GATEWAY_LOG${NC}"
        rm -f "$GATEWAY_PID"
        exit 1
    fi
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Unla 服务启动完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}API Server:${NC}"
echo -e "  PID: $(cat $APISERVER_PID 2>/dev/null || echo 'N/A')"
echo -e "  端口: ${APISERVER_PORT:-5234}"
echo -e "  日志: tail -f $APISERVER_LOG"
echo -e ""
echo -e "${YELLOW}MCP Gateway:${NC}"
echo -e "  PID: $(cat $GATEWAY_PID 2>/dev/null || echo 'N/A')"
echo -e "  端口: ${MCP_GATEWAY_PORT:-5235}"
echo -e "  日志: tail -f $GATEWAY_LOG"
echo -e ""
echo -e "${YELLOW}停止服务: ./stop_unla.sh${NC}"
echo -e "${YELLOW}健康检查:${NC}"
echo -e "  curl http://localhost:5234/health"
echo -e "  curl http://localhost:5235/health"
