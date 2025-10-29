#!/bin/bash

# NextAgentLite 统一启动脚本 - 使用PM2管理
# 启动所有服务：前端、后端、DataGraph等

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 项目根目录 (从services/scripts向上两级)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/lite-backend"
FRONTEND_DIR="$PROJECT_ROOT/lite-qa"
LOGS_DIR="$PROJECT_ROOT/logs"

# Conda环境配置
CONDA_ENV="zzdsj-lite"
CONDA_PYTHON="/opt/anaconda3/envs/${CONDA_ENV}/bin/python"

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║       NextAgentLite 智能体开发平台 - 统一启动脚本        ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 创建日志目录
mkdir -p "$LOGS_DIR"

# ============================================================
# 1. 环境检查
# ============================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. 环境检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查PM2
echo -e "\n${CYAN}检查PM2${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}警告: PM2未安装，正在安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2安装完成${NC}"
else
    echo -e "${GREEN}✓ PM2已安装: $(pm2 --version)${NC}"
fi

# 检查conda环境
echo -e "\n${CYAN}检查conda环境: ${CONDA_ENV}${NC}"
if [ ! -f "$CONDA_PYTHON" ]; then
    echo -e "${RED}错误: conda环境 ${CONDA_ENV} 不存在${NC}"
    echo -e "${YELLOW}请先创建conda环境:${NC}"
    echo -e "  conda create -n ${CONDA_ENV} python=3.12"
    echo -e "  conda activate ${CONDA_ENV}"
    echo -e "  pip install -r lite-backend/requirements.txt"
    exit 1
fi
echo -e "${GREEN}✓ conda环境已找到: $CONDA_PYTHON${NC}"
PYTHON_VERSION=$($CONDA_PYTHON --version)
echo -e "  Python版本: $PYTHON_VERSION"

# 检查Node.js
echo -e "\n${CYAN}检查Node.js环境${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js已安装: $(node --version)${NC}"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm已安装: $(npm --version)${NC}"

# 检查前端依赖
echo -e "\n${CYAN}检查前端依赖${NC}"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}警告: 前端依赖未安装，正在安装...${NC}"
    cd "$FRONTEND_DIR" && npm install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
else
    echo -e "${GREEN}✓ 前端依赖已安装${NC}"
fi

# 检查后端依赖
echo -e "\n${CYAN}检查后端Python包${NC}"
REQUIRED_PACKAGES=("fastapi" "uvicorn" "sqlalchemy" "elasticsearch" "agno" "crawl4ai")
MISSING_PACKAGES=()
for package in "${REQUIRED_PACKAGES[@]}"; do
    if $CONDA_PYTHON -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}✓ $package${NC}"
    else
        echo -e "${RED}✗ $package${NC}"
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo -e "${YELLOW}警告: 缺少以下Python包: ${MISSING_PACKAGES[*]}${NC}"
    echo -e "${YELLOW}请先安装:${NC}"
    echo -e "  conda activate ${CONDA_ENV}"
    echo -e "  pip install -r lite-backend/requirements.txt"
    read -p "是否继续启动？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================================
# 2. 使用PM2启动所有服务
# ============================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. 启动所有服务（使用PM2）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

# 检查是否已有运行的进程
if pm2 list | grep -q "online"; then
    echo -e "${YELLOW}检测到已运行的PM2进程${NC}"
    pm2 list
    read -p "是否重启所有服务？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}重启服务中...${NC}"
        pm2 restart all
    else
        echo -e "${YELLOW}保持现有服务运行${NC}"
        exit 0
    fi
else
    echo -e "${CYAN}启动服务中...${NC}"
    pm2 start ecosystem.config.js
fi

echo ""

# ============================================================
# 3. 等待服务启动
# ============================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. 等待服务启动${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 等待后端启动
echo -e "\n${CYAN}等待后端服务启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}警告: 后端服务启动超时${NC}"
        echo -e "${YELLOW}查看日志: pm2 logs backend${NC}"
    fi
    sleep 1
done

# 等待前端启动
echo -e "\n${CYAN}等待前端服务启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 前端服务已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}警告: 前端服务可能需要更多时间${NC}"
        echo -e "${YELLOW}查看日志: pm2 logs frontend${NC}"
    fi
    sleep 1
done

# 检查DataGraph
echo -e "\n${CYAN}检查DataGraph服务...${NC}"
sleep 3
if curl -s http://localhost:9622/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ DataGraph服务已就绪${NC}"
else
    echo -e "${YELLOW}警告: DataGraph服务可能需要更多时间启动${NC}"
    echo -e "${YELLOW}查看日志: pm2 logs datagraph${NC}"
fi

# ============================================================
# 4. 服务状态总结
# ============================================================

echo -e "\n${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                    所有服务已启动                         ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 显示PM2状态
pm2 status

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}服务访问地址:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}前端应用:${NC}        http://localhost:3000"
echo -e "${CYAN}后端API:${NC}         http://localhost:8000"
echo -e "${CYAN}API文档:${NC}         http://localhost:8000/docs"
echo -e "${CYAN}健康检查:${NC}        http://localhost:8000/health"
echo -e "${CYAN}API网关:${NC}         http://localhost:8000/api-gateway/health"
echo -e "${CYAN}知识图谱:${NC}        http://localhost:9622"
echo -e "${CYAN}DeepScrape:${NC}      http://localhost:3001"
echo -e "${CYAN}LLM Gateway:${NC}     http://localhost:9050"
echo -e "${CYAN}Unla Web:${NC}        http://localhost:5173"
echo -e "${CYAN}Unla API:${NC}        http://localhost:5234"
echo -e "${CYAN}Unla MCP:${NC}        http://localhost:5235"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}常用PM2命令:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}查看日志:${NC}           pm2 logs"
echo -e "${CYAN}查看特定服务日志:${NC}   pm2 logs backend"
echo -e "${CYAN}重启服务:${NC}           pm2 restart all"
echo -e "${CYAN}停止服务:${NC}           pm2 stop all"
echo -e "${CYAN}删除进程:${NC}           pm2 delete all"
echo -e "${CYAN}监控面板:${NC}           pm2 monit"
echo ""

echo -e "${YELLOW}提示: 首次访问前端可能需要等待编译完成（30秒-1分钟）${NC}"
echo ""
