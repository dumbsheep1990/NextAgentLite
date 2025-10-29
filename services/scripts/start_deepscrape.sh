#!/bin/bash
# DeepScrape服务启动脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SERVICE_DIR="${PROJECT_ROOT}/services/node/deepscrape"
LOG_DIR="${PROJECT_ROOT}/services/logs"
PID_FILE="${LOG_DIR}/deepscrape.pid"
LOG_FILE="${LOG_DIR}/deepscrape.log"
ENV_FILE="${SERVICE_DIR}/.env"

echo -e "${YELLOW}启动 DeepScrape 服务...${NC}"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查服务目录
if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}错误: 服务目录不存在: $SERVICE_DIR${NC}"
    echo -e "${YELLOW}请先运行构建脚本: ./build_deepscrape.sh${NC}"
    exit 1
fi

# 检查二进制文件
if [ ! -f "${SERVICE_DIR}/dist/index.js" ]; then
    echo -e "${RED}错误: 服务文件不存在: ${SERVICE_DIR}/dist/index.js${NC}"
    exit 1
fi

# 检查是否已经运行
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}DeepScrape 已经在运行 (PID: $PID)${NC}"
        exit 0
    else
        echo -e "${YELLOW}清理过期的PID文件${NC}"
        rm -f "$PID_FILE"
    fi
fi

cd "$SERVICE_DIR"

# 检查环境配置
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}警告: .env 文件不存在,使用默认配置${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}复制 .env.example 到 .env${NC}"
        cp .env.example .env
        echo -e "${YELLOW}请编辑 $SERVICE_DIR/.env 配置必要参数${NC}"
    fi
fi

# 启动服务
echo -e "${GREEN}启动 DeepScrape...${NC}"
nohup node dist/index.js > "$LOG_FILE" 2>&1 &
PID=$!

# 保存PID
echo $PID > "$PID_FILE"

# 等待服务启动
sleep 3

# 验证服务是否运行
if ps -p $PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ DeepScrape 启动成功!${NC}"
    echo -e "  PID: $PID"
    echo -e "  日志: $LOG_FILE"

    # 检查端口 (默认3001)
    PORT=$(grep "^PORT=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    PORT=${PORT:-3001}

    sleep 2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "  ${GREEN}端口 $PORT 已监听${NC}"
        echo -e "  ${BLUE}访问: http://localhost:$PORT${NC}"
    else
        echo -e "  ${YELLOW}端口 $PORT 未监听,检查日志: tail -f $LOG_FILE${NC}"
    fi
else
    echo -e "${RED}✗ DeepScrape 启动失败!${NC}"
    echo -e "${YELLOW}查看日志: tail -f $LOG_FILE${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
