#!/bin/bash
# Go 服务 Linux 编译脚本
# 用于为 CentOS 测试服务器编译 Go 二进制文件

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/lite-backend"
SERVICES_BIN_DIR="${PROJECT_ROOT}/services/bin"

echo -e "${GREEN}=== Go 服务 Linux 编译脚本 ===${NC}"
echo "项目根目录: ${PROJECT_ROOT}"
echo "输出目录: ${SERVICES_BIN_DIR}"
echo ""

# 确保输出目录存在
mkdir -p "${SERVICES_BIN_DIR}"

# 编译配置
export GOOS=linux
export GOARCH=amd64
export CGO_ENABLED=0

echo -e "${YELLOW}编译目标: ${GOOS}/${GOARCH}${NC}"
echo ""

# 1. 编译 LLM Config Gateway
echo -e "${GREEN}[1/3] 编译 llm-config-gateway...${NC}"
LLM_GATEWAY_DIR="${BACKEND_DIR}/llm-config-gateway"
if [ -d "${LLM_GATEWAY_DIR}" ]; then
    cd "${LLM_GATEWAY_DIR}"

    # 检查是否有 go.mod
    if [ -f "go.mod" ]; then
        echo "  源代码目录: ${LLM_GATEWAY_DIR}"

        # 查找 main.go（排除缓存目录）
        MAIN_FILE=$(find . -name "main.go" -type f ! -path "*/.gomodcache/*" ! -path "*/vendor/*" ! -path "*/.git/*" | head -1)
        if [ -z "${MAIN_FILE}" ]; then
            echo -e "${RED}  错误: 找不到 main.go${NC}"
            exit 1
        fi

        MAIN_DIR=$(dirname "${MAIN_FILE}")
        echo "  入口文件: ${MAIN_FILE}"

        # 编译
        go build -o "${SERVICES_BIN_DIR}/llm-config-gateway" "${MAIN_DIR}"

        echo -e "${GREEN}  ✓ llm-config-gateway 编译完成${NC}"
    else
        echo -e "${RED}  错误: 找不到 go.mod${NC}"
        exit 1
    fi
else
    echo -e "${RED}  错误: 目录不存在 ${LLM_GATEWAY_DIR}${NC}"
    exit 1
fi
echo ""

# 2. 编译 Unla API Server
echo -e "${GREEN}[2/3] 编译 unla-apiserver...${NC}"
UNLA_DIR="${BACKEND_DIR}/Unla"
if [ -d "${UNLA_DIR}" ]; then
    cd "${UNLA_DIR}"

    if [ -f "go.mod" ]; then
        echo "  源代码目录: ${UNLA_DIR}"

        # 查找 apiserver 的 main.go（排除缓存目录）
        APISERVER_MAIN=$(find ./cmd/apiserver -name "main.go" -type f ! -path "*/.gomodcache/*" ! -path "*/vendor/*" 2>/dev/null | head -1)
        if [ -z "${APISERVER_MAIN}" ]; then
            echo -e "${YELLOW}  尝试查找其他位置...${NC}"
            APISERVER_MAIN=$(find . -path "*/apiserver/main.go" -type f ! -path "*/.gomodcache/*" ! -path "*/vendor/*" | head -1)
        fi

        if [ -z "${APISERVER_MAIN}" ]; then
            echo -e "${RED}  错误: 找不到 apiserver main.go${NC}"
            exit 1
        fi

        APISERVER_DIR=$(dirname "${APISERVER_MAIN}")
        echo "  入口文件: ${APISERVER_MAIN}"

        # 编译
        go build -o "${SERVICES_BIN_DIR}/unla-apiserver" "${APISERVER_DIR}"

        echo -e "${GREEN}  ✓ unla-apiserver 编译完成${NC}"
    else
        echo -e "${RED}  错误: 找不到 go.mod${NC}"
        exit 1
    fi
else
    echo -e "${RED}  错误: 目录不存在 ${UNLA_DIR}${NC}"
    exit 1
fi
echo ""

# 3. 编译 Unla MCP Gateway
echo -e "${GREEN}[3/3] 编译 unla-mcp-gateway...${NC}"
cd "${UNLA_DIR}"

# 查找 mcp-gateway 的 main.go（排除缓存目录）
MCP_GATEWAY_MAIN=$(find ./cmd/mcp-gateway -name "main.go" -type f ! -path "*/.gomodcache/*" ! -path "*/vendor/*" 2>/dev/null | head -1)
if [ -z "${MCP_GATEWAY_MAIN}" ]; then
    echo -e "${YELLOW}  尝试查找其他位置...${NC}"
    MCP_GATEWAY_MAIN=$(find . -path "*/mcp-gateway/main.go" -type f ! -path "*/.gomodcache/*" ! -path "*/vendor/*" | head -1)
fi

if [ -z "${MCP_GATEWAY_MAIN}" ]; then
    echo -e "${RED}  错误: 找不到 mcp-gateway main.go${NC}"
    exit 1
fi

MCP_GATEWAY_DIR=$(dirname "${MCP_GATEWAY_MAIN}")
echo "  入口文件: ${MCP_GATEWAY_MAIN}"

# 编译
go build -o "${SERVICES_BIN_DIR}/unla-mcp-gateway" "${MCP_GATEWAY_DIR}"

echo -e "${GREEN}  ✓ unla-mcp-gateway 编译完成${NC}"
echo ""

# 显示编译结果
echo -e "${GREEN}=== 编译完成 ===${NC}"
echo "输出目录: ${SERVICES_BIN_DIR}"
echo ""
echo "编译的二进制文件:"
ls -lh "${SERVICES_BIN_DIR}" | grep -E "(llm-config-gateway|unla-apiserver|unla-mcp-gateway)"
echo ""

# 验证文件类型
echo -e "${GREEN}验证二进制文件类型:${NC}"
file "${SERVICES_BIN_DIR}/llm-config-gateway"
file "${SERVICES_BIN_DIR}/unla-apiserver"
file "${SERVICES_BIN_DIR}/unla-mcp-gateway"
echo ""

echo -e "${GREEN}所有 Go 服务编译完成！${NC}"
echo ""
echo "下一步："
echo "1. 上传这些文件到测试服务器:"
echo "   scp services/bin/* root@8.136.49.11:/home/NextAgentLite/services/bin/"
echo ""
echo "2. 在测试服务器上设置执行权限:"
echo "   chmod +x /home/NextAgentLite/services/bin/*"
echo ""
echo "3. 重启 PM2 服务:"
echo "   pm2 restart all"
