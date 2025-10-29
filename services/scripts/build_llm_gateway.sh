#!/bin/bash
# LLM Config Gateway 构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/wxn/Desktop/NextAgentLite"
SOURCE_DIR="${PROJECT_ROOT}/lite-backend/llm-config-gateway"
OUTPUT_DIR="${PROJECT_ROOT}/services/bin"
CONFIG_DIR="${PROJECT_ROOT}/services/configs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始构建 LLM Config Gateway${NC}"
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
export CGO_ENABLED=0
export GOOS=darwin
export GOARCH=amd64

echo -e "${YELLOW}清理旧的构建文件...${NC}"
rm -f "${OUTPUT_DIR}/llm-config-gateway"

echo -e "${YELLOW}开始编译...${NC}"
go build -o "${OUTPUT_DIR}/llm-config-gateway" \
    -ldflags="-s -w" \
    -trimpath \
    main.go

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 编译成功!${NC}"

    # 添加执行权限
    chmod +x "${OUTPUT_DIR}/llm-config-gateway"

    # 显示文件信息
    echo -e "${YELLOW}二进制文件信息:${NC}"
    ls -lh "${OUTPUT_DIR}/llm-config-gateway"

    # 复制配置文件
    if [ -f "${SOURCE_DIR}/.env.local" ]; then
        echo -e "${YELLOW}复制配置文件...${NC}"
        cp "${SOURCE_DIR}/.env.local" "${CONFIG_DIR}/llm-gateway.env"
        echo -e "${GREEN}✓ 配置文件已复制到: ${CONFIG_DIR}/llm-gateway.env${NC}"
    fi

    # 复制OpenAPI文档
    if [ -f "${SOURCE_DIR}/openapi.yaml" ]; then
        cp "${SOURCE_DIR}/openapi.yaml" "${CONFIG_DIR}/llm-gateway-openapi.yaml"
        echo -e "${GREEN}✓ OpenAPI文档已复制${NC}"
    fi

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}LLM Config Gateway 构建完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}二进制文件: ${OUTPUT_DIR}/llm-config-gateway${NC}"
    echo -e "${YELLOW}配置文件: ${CONFIG_DIR}/llm-gateway.env${NC}"
else
    echo -e "${RED}✗ 编译失败!${NC}"
    exit 1
fi
