#!/bin/bash
# Unla服务构建脚本 (API Server + MCP Gateway)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SOURCE_DIR="${PROJECT_ROOT}/lite-backend/Unla"
OUTPUT_DIR="${PROJECT_ROOT}/services/bin"
CONFIG_DIR="${PROJECT_ROOT}/services/configs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始构建 Unla 服务${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查源码目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}错误: 源码目录不存在: $SOURCE_DIR${NC}"
    exit 1
fi

# 检查Go是否安装
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: Go未安装或不在PATH中${NC}"
    exit 1
fi

echo -e "${YELLOW}Go版本:${NC}"
go version

# 进入源码目录
cd "$SOURCE_DIR"

# 设置Go环境变量
export CGO_ENABLED=1  # Unla可能需要CGO (SQLite)
export GOOS=darwin
export GOARCH=amd64

# 构建API Server
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}1. 构建 Unla API Server (端口5234)${NC}"
echo -e "${YELLOW}========================================${NC}"

rm -f "${OUTPUT_DIR}/unla-apiserver"

go build -o "${OUTPUT_DIR}/unla-apiserver" \
    -ldflags="-s -w" \
    -trimpath \
    ./cmd/apiserver

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API Server 编译成功!${NC}"
    chmod +x "${OUTPUT_DIR}/unla-apiserver"
    ls -lh "${OUTPUT_DIR}/unla-apiserver"
else
    echo -e "${RED}✗ API Server 编译失败!${NC}"
    exit 1
fi

# 构建MCP Gateway
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}2. 构建 Unla MCP Gateway (端口5235)${NC}"
echo -e "${YELLOW}========================================${NC}"

rm -f "${OUTPUT_DIR}/unla-mcp-gateway"

go build -o "${OUTPUT_DIR}/unla-mcp-gateway" \
    -ldflags="-s -w" \
    -trimpath \
    ./cmd/mcp-gateway

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MCP Gateway 编译成功!${NC}"
    chmod +x "${OUTPUT_DIR}/unla-mcp-gateway"
    ls -lh "${OUTPUT_DIR}/unla-mcp-gateway"
else
    echo -e "${RED}✗ MCP Gateway 编译失败!${NC}"
    exit 1
fi

# 复制配置文件
echo -e "${YELLOW}复制配置文件...${NC}"
if [ -f "${SOURCE_DIR}/.env" ]; then
    cp "${SOURCE_DIR}/.env" "${CONFIG_DIR}/unla.env"
    echo -e "${GREEN}✓ 配置文件已复制到: ${CONFIG_DIR}/unla.env${NC}"
elif [ -f "${SOURCE_DIR}/.env.example" ]; then
    cp "${SOURCE_DIR}/.env.example" "${CONFIG_DIR}/unla.env.example"
    echo -e "${YELLOW}! 请基于 unla.env.example 创建 unla.env${NC}"
fi

# 复制必要的资源文件
if [ -d "${SOURCE_DIR}/configs" ]; then
    echo -e "${YELLOW}复制配置目录...${NC}"
    cp -r "${SOURCE_DIR}/configs" "${CONFIG_DIR}/unla-configs"
    echo -e "${GREEN}✓ 配置目录已复制${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Unla 服务构建完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}API Server 二进制: ${OUTPUT_DIR}/unla-apiserver${NC}"
echo -e "${YELLOW}MCP Gateway 二进制: ${OUTPUT_DIR}/unla-mcp-gateway${NC}"
echo -e "${YELLOW}配置文件: ${CONFIG_DIR}/unla.env${NC}"
