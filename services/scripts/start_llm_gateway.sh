#!/bin/bash
# LLM Config Gateway 启动脚本

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
PID_FILE="${LOG_DIR}/llm-gateway.pid"
LOG_FILE="${LOG_DIR}/llm-gateway.log"

# 二进制文件
BINARY="${BIN_DIR}/llm-config-gateway"
ENV_FILE="${CONFIG_DIR}/llm-gateway.env"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}启动 LLM Config Gateway${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查二进制文件
if [ ! -f "$BINARY" ]; then
    echo -e "${RED}错误: 二进制文件不存在: $BINARY${NC}"
    echo -e "${YELLOW}请先运行构建脚本: ./build_llm_gateway.sh${NC}"
    exit 1
fi

# 检查是否已经运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}警告: LLM Gateway 已经在运行 (PID: $OLD_PID)${NC}"
        echo -e "${YELLOW}如需重启,请先运行: ./stop_llm_gateway.sh${NC}"
        exit 1
    else
        echo -e "${YELLOW}清理过期的PID文件${NC}"
        rm -f "$PID_FILE"
    fi
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

# 设置默认环境变量
export PORT=${PORT:-9050}
export GIN_MODE=${GIN_MODE:-release}

# 确保日志目录存在
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}服务配置:${NC}"
echo -e "  端口: ${PORT}"
echo -e "  日志文件: ${LOG_FILE}"
echo -e "  PID文件: ${PID_FILE}"

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
nohup "$BINARY" > "$LOG_FILE" 2>&1 &
PID=$!

# 保存PID
echo $PID > "$PID_FILE"

# 等待服务启动
sleep 2

# 检查进程是否还在运行
if ps -p $PID > /dev/null; then
    echo -e "${GREEN}✓ LLM Config Gateway 启动成功!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}PID: $PID${NC}"
    echo -e "${YELLOW}端口: $PORT${NC}"
    echo -e "${YELLOW}日志: tail -f $LOG_FILE${NC}"
    echo -e "${YELLOW}停止: ./stop_llm_gateway.sh${NC}"
    echo -e "${YELLOW}健康检查: curl http://localhost:$PORT/health${NC}"
else
    echo -e "${RED}✗ 服务启动失败!${NC}"
    echo -e "${YELLOW}查看日志: cat $LOG_FILE${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
