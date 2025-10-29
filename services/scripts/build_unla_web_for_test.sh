#!/bin/bash
# Unla Web 测试服务器构建脚本
# 用于为测试服务器构建 Unla Web 前端

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UNLA_WEB_SOURCE_DIR="${PROJECT_ROOT}/lite-backend/Unla/web"
UNLA_WEB_DIST_DIR="${PROJECT_ROOT}/services/web/dist"
SERVICES_WEB_DIR="${PROJECT_ROOT}/services/web"

# 测试服务器配置
TEST_SERVER_IP="8.136.49.11"
TEST_SERVER_PORT="8000"

echo -e "${GREEN}=== Unla Web 测试服务器构建脚本 ===${NC}"
echo "源代码目录: ${UNLA_WEB_SOURCE_DIR}"
echo "输出目录: ${UNLA_WEB_DIST_DIR}"
echo "测试服务器: ${TEST_SERVER_IP}:${TEST_SERVER_PORT}"
echo ""

# ============================================================
# 1. 检查源码目录
# ============================================================

echo -e "${CYAN}[1/5] 检查源码目录...${NC}"
if [ ! -d "${UNLA_WEB_SOURCE_DIR}" ]; then
    echo -e "${RED}错误: Unla Web 源码目录不存在: ${UNLA_WEB_SOURCE_DIR}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 源码目录已找到${NC}"
echo ""

# ============================================================
# 2. 备份原始 .env.production
# ============================================================

echo -e "${CYAN}[2/5] 备份原始 .env.production...${NC}"
cd "${UNLA_WEB_SOURCE_DIR}"

if [ -f ".env.production" ]; then
    BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    cp ".env.production" "${BACKUP_FILE}"
    echo -e "${YELLOW}已备份原始配置: ${BACKUP_FILE}${NC}"
fi
echo ""

# ============================================================
# 3. 生成测试服务器环境配置
# ============================================================

echo -e "${CYAN}[3/5] 生成测试服务器环境配置...${NC}"
cat > ".env.production" << EOF
# Unla Web 测试服务器环境配置
# 自动生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# API和WebSocket URLs
# 使用相对路径，通过后端代理访问
VITE_API_BASE_URL=/api
VITE_WS_BASE_URL=/api/ws
VITE_MCP_GATEWAY_BASE_URL=/mcp
VITE_DIRECT_MCP_GATEWAY_MODIFIER=:5235
VITE_BASE_URL=/

# LLM Gateway URL - 通过后端代理访问
# 对于测试服务器，使用完整URL确保可访问性
VITE_LLM_GATEWAY_URL=http://${TEST_SERVER_IP}:${TEST_SERVER_PORT}/api-gateway/llm-gateway
EOF

echo -e "${GREEN}✓ 测试服务器环境配置已生成${NC}"
echo ""
cat ".env.production"
echo ""

# ============================================================
# 4. 执行构建
# ============================================================

echo -e "${CYAN}[4/5] 执行 pnpm build...${NC}"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}警告: node_modules 不存在，正在安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
fi

# 执行构建
echo "开始构建..."
echo -e "${YELLOW}注意: 跳过TypeScript类型检查，直接构建${NC}"
# 直接使用 vite build 跳过 TypeScript 类型检查
pnpm exec vite build

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# ============================================================
# 5. 复制构建文件到服务目录
# ============================================================

echo -e "${CYAN}[5/5] 复制构建文件到服务目录...${NC}"

# 确保目标目录存在
mkdir -p "${SERVICES_WEB_DIR}"

# 如果目标目录已存在，先备份
if [ -d "${UNLA_WEB_DIST_DIR}" ]; then
    BACKUP_DIST_DIR="${UNLA_WEB_DIST_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}备份旧的构建文件到: ${BACKUP_DIST_DIR}${NC}"
    mv "${UNLA_WEB_DIST_DIR}" "${BACKUP_DIST_DIR}"
fi

# 复制新构建的文件
echo "复制构建文件..."
cp -r "${UNLA_WEB_SOURCE_DIR}/dist" "${UNLA_WEB_DIST_DIR}"

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 复制文件失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建文件已复制到: ${UNLA_WEB_DIST_DIR}${NC}"
echo ""

# ============================================================
# 完成
# ============================================================

echo -e "${GREEN}=== 构建完成 ===${NC}"
echo ""
echo "构建输出目录: ${UNLA_WEB_DIST_DIR}"
echo "文件大小统计:"
du -sh "${UNLA_WEB_DIST_DIR}"
echo ""
echo "文件数量:"
find "${UNLA_WEB_DIST_DIR}" -type f | wc -l
echo ""
echo -e "${CYAN}下一步：${NC}"
echo "1. 将构建文件上传到测试服务器:"
echo "   scp -r services/web/dist/* root@${TEST_SERVER_IP}:/home/NextAgentLite/services/web/dist/"
echo ""
echo "2. 在测试服务器上重启 PM2:"
echo "   pm2 restart unla-web"
echo ""
echo -e "${YELLOW}注意: .env.production 已被修改为测试服务器配置${NC}"
echo -e "${YELLOW}本地开发请使用备份文件恢复或重新生成${NC}"
