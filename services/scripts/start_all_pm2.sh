#!/bin/bash

# PM2一键启动所有服务
# 使用方法: bash scripts/start_all_pm2.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 切换到项目根目录
cd "$PROJECT_ROOT"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  PM2 一键启动所有服务${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查PM2是否安装
echo -e "${YELLOW}[1/5] 检查PM2环境...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}错误: PM2未安装${NC}"
    echo -e "${YELLOW}请运行以下命令安装PM2:${NC}"
    echo -e "  ${BLUE}npm install -g pm2${NC}"
    exit 1
fi

PM2_VERSION=$(pm2 --version)
echo -e "  ${GREEN}✓ PM2已安装: v${PM2_VERSION}${NC}"
echo ""

# 检查必要的二进制文件
echo -e "${YELLOW}[2/5] 检查服务文件...${NC}"

MISSING_FILES=()

if [ ! -f "./bin/llm-config-gateway" ]; then
    MISSING_FILES+=("bin/llm-config-gateway")
fi

if [ ! -f "./bin/unla-apiserver" ]; then
    MISSING_FILES+=("bin/unla-apiserver")
fi

if [ ! -f "./bin/unla-mcp-gateway" ]; then
    MISSING_FILES+=("bin/unla-mcp-gateway")
fi

if [ ! -d "./web/dist" ]; then
    MISSING_FILES+=("web/dist (前端构建产物)")
fi

if [ ! -f "./node/deepscrape/dist/index.js" ]; then
    MISSING_FILES+=("node/deepscrape/dist/index.js")
fi

if [ ! -f "./datagraph/start.sh" ]; then
    MISSING_FILES+=("datagraph/start.sh (运行: bash scripts/prepare_datagraph.sh)")
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}错误: 以下服务文件缺失:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "  ${RED}✗ $file${NC}"
    done
    echo ""
    echo -e "${YELLOW}请先运行构建脚本:${NC}"
    echo -e "  ${BLUE}bash scripts/build_llm_gateway.sh${NC}"
    echo -e "  ${BLUE}bash scripts/build_unla_services.sh${NC}"
    echo -e "  ${BLUE}bash scripts/build_unla_web.sh${NC}"
    echo -e "  ${BLUE}bash scripts/build_deepscrape.sh${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓ 所有服务文件完整${NC}"
echo ""

# 检查serve命令（用于unla-web）
echo -e "${YELLOW}[3/5] 检查依赖...${NC}"
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}警告: serve命令未找到，正在安装...${NC}"
    npm install -g serve
fi
echo -e "  ${GREEN}✓ 依赖检查完成${NC}"
echo ""

# 检查配置文件
echo -e "${YELLOW}[4/5] 检查配置文件...${NC}"
if [ ! -f "./ecosystem.config.js" ]; then
    echo -e "${RED}错误: ecosystem.config.js不存在${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ PM2配置文件存在${NC}"

# 检查DeepScrape的.env文件
if [ ! -f "./node/deepscrape/.env" ]; then
    echo -e "${YELLOW}警告: DeepScrape .env文件不存在${NC}"
    if [ -f "./node/deepscrape/.env.example" ]; then
        echo -e "${YELLOW}请复制并配置 .env 文件:${NC}"
        echo -e "  ${BLUE}cp node/deepscrape/.env.example node/deepscrape/.env${NC}"
    fi
fi
echo ""

# 检查是否已有PM2进程运行
echo -e "${YELLOW}[5/5] 检查现有进程...${NC}"
EXISTING_PROCESSES=$(pm2 list | grep -E "(llm-gateway|unla-apiserver|unla-mcp-gateway|unla-web|deepscrape)" | wc -l | tr -d ' ')
if [ "$EXISTING_PROCESSES" -gt 0 ]; then
    echo -e "${YELLOW}检测到已运行的服务进程${NC}"
    echo ""
    pm2 list
    echo ""
    read -p "是否先停止现有进程? (y/n): " STOP_EXISTING
    if [ "$STOP_EXISTING" = "y" ] || [ "$STOP_EXISTING" = "Y" ]; then
        echo -e "${YELLOW}正在停止现有进程...${NC}"
        pm2 delete all 2>/dev/null || true
        echo -e "${GREEN}✓ 现有进程已停止${NC}"
    else
        echo -e "${YELLOW}跳过停止现有进程${NC}"
    fi
fi
echo ""

# 启动所有服务
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  启动服务${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

echo -e "${YELLOW}正在通过PM2启动所有服务...${NC}"
pm2 start ecosystem.config.js

# 等待服务启动
echo ""
echo -e "${YELLOW}等待服务启动中...${NC}"
sleep 3

# 保存PM2配置（用于开机自启）
echo ""
echo -e "${YELLOW}保存PM2配置...${NC}"
pm2 save

# 显示服务状态
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  服务状态${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
pm2 list

# 显示服务访问地址
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  服务访问地址${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}✓ LLM Config Gateway:${NC}  ${BLUE}http://localhost:9050${NC}"
echo -e "${GREEN}✓ Unla API Server:${NC}     ${BLUE}http://localhost:5234${NC}"
echo -e "${GREEN}✓ Unla MCP Gateway:${NC}    ${BLUE}http://localhost:5235${NC}"
echo -e "${GREEN}✓ Unla Web:${NC}            ${BLUE}http://localhost:5173${NC}"
echo -e "${GREEN}✓ DeepScrape:${NC}          ${BLUE}http://localhost:3001${NC}"
echo -e "${GREEN}✓ DataGraph:${NC}           ${BLUE}http://localhost:9622${NC}"

# 显示常用PM2命令
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  常用管理命令${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}查看服务状态:${NC}       ${BLUE}pm2 list${NC}"
echo -e "${YELLOW}查看实时日志:${NC}       ${BLUE}pm2 logs${NC}"
echo -e "${YELLOW}查看特定服务日志:${NC}   ${BLUE}pm2 logs [服务名]${NC}"
echo -e "${YELLOW}重启所有服务:${NC}       ${BLUE}pm2 restart all${NC}"
echo -e "${YELLOW}重启特定服务:${NC}       ${BLUE}pm2 restart [服务名]${NC}"
echo -e "${YELLOW}停止所有服务:${NC}       ${BLUE}pm2 stop all${NC}"
echo -e "${YELLOW}停止特定服务:${NC}       ${BLUE}pm2 stop [服务名]${NC}"
echo -e "${YELLOW}删除所有服务:${NC}       ${BLUE}pm2 delete all${NC}"
echo -e "${YELLOW}查看服务详情:${NC}       ${BLUE}pm2 show [服务名]${NC}"
echo -e "${YELLOW}监控面板:${NC}           ${BLUE}pm2 monit${NC}"
echo ""

# 提示开机自启设置
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  开机自启设置 (可选)${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}如需设置开机自启动，请运行:${NC}"
echo -e "  ${BLUE}pm2 startup${NC}"
echo -e "${YELLOW}然后按照提示运行生成的命令${NC}"
echo ""

echo -e "${GREEN}✓ 所有服务启动完成!${NC}"
echo ""
