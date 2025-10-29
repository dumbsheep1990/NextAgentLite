#!/bin/bash
# 查看所有服务状态的脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
LOG_DIR="${PROJECT_ROOT}/services/logs"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}服务状态检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查LLM Gateway
echo -e "${YELLOW}[1] LLM Config Gateway (端口9050)${NC}"
PID_FILE="${LOG_DIR}/llm-gateway.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  PID: $PID"
        # 检查端口
        if lsof -Pi :9050 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  端口: ${GREEN}9050 已监听${NC}"
        else
            echo -e "  端口: ${YELLOW}9050 未监听${NC}"
        fi
    else
        echo -e "  状态: ${RED}已停止${NC} (PID文件过期)"
    fi
else
    echo -e "  状态: ${RED}未运行${NC}"
fi
echo ""

# 检查Unla API Server
echo -e "${YELLOW}[2] Unla API Server (端口5234)${NC}"
PID_FILE="${LOG_DIR}/unla-apiserver.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  PID: $PID"
        if lsof -Pi :5234 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  端口: ${GREEN}5234 已监听${NC}"
        else
            echo -e "  端口: ${YELLOW}5234 未监听${NC}"
        fi
    else
        echo -e "  状态: ${RED}已停止${NC} (PID文件过期)"
    fi
else
    echo -e "  状态: ${RED}未运行${NC}"
fi
echo ""

# 检查Unla MCP Gateway
echo -e "${YELLOW}[3] Unla MCP Gateway (端口5235)${NC}"
PID_FILE="${LOG_DIR}/unla-mcp-gateway.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  PID: $PID"
        if lsof -Pi :5235 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  端口: ${GREEN}5235 已监听${NC}"
        else
            echo -e "  端口: ${YELLOW}5235 未监听${NC}"
        fi
    else
        echo -e "  状态: ${RED}已停止${NC} (PID文件过期)"
    fi
else
    echo -e "  状态: ${RED}未运行${NC}"
fi
echo ""

# 检查Unla Web前端
echo -e "${YELLOW}[4] Unla Web 前端 (端口5173)${NC}"
PID_FILE="${LOG_DIR}/unla-web.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  PID: $PID"
        if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  端口: ${GREEN}5173 已监听${NC}"
            echo -e "  访问: ${BLUE}http://localhost:5173${NC}"
        else
            echo -e "  端口: ${YELLOW}5173 未监听${NC}"
        fi
    else
        echo -e "  状态: ${RED}已停止${NC} (PID文件过期)"
    fi
else
    echo -e "  状态: ${RED}未运行${NC}"
fi
echo ""

# 检查DeepScrape服务
echo -e "${YELLOW}[5] DeepScrape 爬虫服务 (端口3001)${NC}"
PID_FILE="${LOG_DIR}/deepscrape.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  PID: $PID"
        if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  端口: ${GREEN}3001 已监听${NC}"
            echo -e "  访问: ${BLUE}http://localhost:3001${NC}"
        else
            echo -e "  端口: ${YELLOW}3001 未监听${NC}"
        fi
    else
        echo -e "  状态: ${RED}已停止${NC} (PID文件过期)"
    fi
else
    echo -e "  状态: ${RED}未运行${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}快速操作:${NC}"
echo -e "  Go服务:"
echo -e "    启动: ./start_llm_gateway.sh  ./start_unla.sh"
echo -e "    停止: ./stop_llm_gateway.sh   ./stop_unla.sh"
echo -e "  Web前端:"
echo -e "    启动: ./start_unla_web.sh"
echo -e "    停止: ./stop_unla_web.sh"
echo -e "    开发: ./start_unla_web_dev.sh"
echo -e "  DeepScrape:"
echo -e "    启动: ./start_deepscrape.sh"
echo -e "    停止: ./stop_deepscrape.sh"
echo -e "  一键Unla: ./build_and_start_unla_all.sh"
echo -e "  日志: tail -f ../logs/*.log"
