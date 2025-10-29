#!/bin/bash

# NextAgentLite 测试服务器启动脚本
# 使用 ecosystem.config.test.js 配置
# 适配测试服务器的conda环境路径

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/lite-backend"
FRONTEND_DIR="$PROJECT_ROOT/lite-qa"
LOGS_DIR="$PROJECT_ROOT/logs"

# 测试服务器Conda环境配置
CONDA_BASE="/root/anaconda3"
BACKEND_CONDA_ENV="zzdsj-lite"
FRONTEND_CONDA_ENV="zzdsj-qa"
CONDA_PYTHON="${CONDA_BASE}/envs/${BACKEND_CONDA_ENV}/bin/python"
CONDA_NPM="${CONDA_BASE}/envs/${FRONTEND_CONDA_ENV}/bin/npm"

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║    NextAgentLite 测试服务器启动脚本 - PM2管理模式       ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 创建日志目录
mkdir -p "$LOGS_DIR"

# ============================================================
# 1. 环境检查
# ============================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. 测试服务器环境检查${NC}"
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

# 检查后端conda环境
echo -e "\n${CYAN}检查后端conda环境: ${BACKEND_CONDA_ENV}${NC}"
if [ ! -f "$CONDA_PYTHON" ]; then
    echo -e "${RED}错误: conda环境 ${BACKEND_CONDA_ENV} 不存在${NC}"
    echo -e "${YELLOW}路径: $CONDA_PYTHON${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 后端conda环境已找到: $CONDA_PYTHON${NC}"
PYTHON_VERSION=$($CONDA_PYTHON --version)
echo -e "  Python版本: $PYTHON_VERSION"

# 检查前端conda环境
echo -e "\n${CYAN}检查前端conda环境: ${FRONTEND_CONDA_ENV}${NC}"
if [ ! -f "$CONDA_NPM" ]; then
    echo -e "${RED}错误: conda环境 ${FRONTEND_CONDA_ENV} 不存在${NC}"
    echo -e "${YELLOW}路径: $CONDA_NPM${NC}"
    echo -e "${YELLOW}请先创建前端conda环境:${NC}"
    echo -e "  conda create -n ${FRONTEND_CONDA_ENV} nodejs npm"
    exit 1
fi
echo -e "${GREEN}✓ 前端conda环境已找到: $CONDA_NPM${NC}"
NODE_VERSION=$($CONDA_NPM --version)
echo -e "  npm版本: $NODE_VERSION"

# 检查前端依赖
echo -e "\n${CYAN}检查前端依赖${NC}"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}警告: 前端依赖未安装，正在安装...${NC}"
    cd "$FRONTEND_DIR" && $CONDA_NPM install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
else
    echo -e "${GREEN}✓ 前端依赖已安装${NC}"
fi

# 检查后端依赖
echo -e "\n${CYAN}检查后端Python包${NC}"
REQUIRED_PACKAGES=("fastapi" "uvicorn" "sqlalchemy" "elasticsearch" "agno")
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
    echo -e "  conda activate ${BACKEND_CONDA_ENV}"
    echo -e "  pip install -r lite-backend/requirements.txt"
    read -p "是否继续启动？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查测试配置文件
echo -e "\n${CYAN}检查测试配置文件${NC}"
if [ ! -f "$PROJECT_ROOT/ecosystem.config.test.js" ]; then
    echo -e "${RED}错误: 测试配置文件不存在: ecosystem.config.test.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 测试配置文件已找到${NC}"

# ============================================================
# 1.5 自动配置服务地址
# ============================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1.5 配置测试服务器地址${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 测试服务器IP地址
TEST_SERVER_IP="8.136.49.11"

echo -e "\n${CYAN}配置前端环境变量${NC}"
# 创建前端生产环境配置
cat > "$FRONTEND_DIR/.env.production" << EOF
# 测试服务器环境配置
# 自动生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# API配置
VITE_API_BASE_URL=http://${TEST_SERVER_IP}:8000
VITE_WS_URL=ws://${TEST_SERVER_IP}:8000
VITE_SSE_URL=http://${TEST_SERVER_IP}:8000

# 通过网关代理的服务
VITE_MATGRAPH_BASE_URL=http://${TEST_SERVER_IP}:8000/api-gateway/matgraph
VITE_UNLA_WEB_URL=http://${TEST_SERVER_IP}:8000/api-gateway/model
VITE_LLM_GATEWAY_URL=http://${TEST_SERVER_IP}:8000/api-gateway/llm-gateway

# 功能开关
VITE_ENABLE_GRAPH_VIEW=true
VITE_ENABLE_DUAL_VECTOR=true
VITE_ENABLE_TRANSLATION=true
EOF

echo -e "${GREEN}✓ 前端环境配置已生成: $FRONTEND_DIR/.env.production${NC}"
cat "$FRONTEND_DIR/.env.production"

echo -e "\n${CYAN}配置后端CORS${NC}"
# 备份原始.env文件
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}已备份原始配置: $BACKEND_DIR/.env.backup.*${NC}"
fi

# 更新后端CORS配置
if [ -f "$BACKEND_DIR/.env" ]; then
    # 检查是否已有CORS_ORIGINS配置
    if grep -q "^CORS_ORIGINS=" "$BACKEND_DIR/.env"; then
        # 更新现有配置
        sed -i.bak "s|^CORS_ORIGINS=.*|CORS_ORIGINS=\"http://localhost:3000,http://${TEST_SERVER_IP}:3000,http://${TEST_SERVER_IP}:5173\"|" "$BACKEND_DIR/.env"
        rm -f "$BACKEND_DIR/.env.bak"
        echo -e "${GREEN}✓ 已更新CORS_ORIGINS配置${NC}"
    else
        # 添加新配置
        echo "" >> "$BACKEND_DIR/.env"
        echo "# CORS配置 (自动生成于 $(date '+%Y-%m-%d %H:%M:%S'))" >> "$BACKEND_DIR/.env"
        echo "CORS_ORIGINS=\"http://localhost:3000,http://${TEST_SERVER_IP}:3000,http://${TEST_SERVER_IP}:5173\"" >> "$BACKEND_DIR/.env"
        echo -e "${GREEN}✓ 已添加CORS_ORIGINS配置${NC}"
    fi

    # 显示CORS配置
    echo -e "${CYAN}当前CORS配置:${NC}"
    grep "CORS_ORIGINS" "$BACKEND_DIR/.env"
else
    echo -e "${YELLOW}警告: 后端.env文件不存在，请手动配置CORS${NC}"
fi

# ============================================================
# 2. 使用PM2启动所有服务（测试配置）
# ============================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. 启动所有服务（使用测试配置）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

# 检查是否已有运行的进程
if pm2 list | grep -q "online"; then
    echo -e "${YELLOW}检测到已运行的PM2进程${NC}"
    pm2 list
    read -p "是否重启所有服务？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}停止现有服务...${NC}"
        pm2 delete all
        echo -e "${CYAN}启动测试服务...${NC}"
        pm2 start "$PROJECT_ROOT/ecosystem.config.test.js" --update-env
    else
        echo -e "${YELLOW}保持现有服务运行${NC}"
        exit 0
    fi
else
    echo -e "${CYAN}启动测试服务中...${NC}"
    pm2 start "$PROJECT_ROOT/ecosystem.config.test.js" --update-env
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
echo -e "${PURPLE}║              测试服务器所有服务已启动                     ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 显示PM2状态
pm2 status

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}服务访问地址:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}本地访问:${NC}"
echo -e "  前端应用:        http://localhost:3000"
echo -e "  后端API:         http://localhost:8000"
echo -e "  API文档:         http://localhost:8000/docs"
echo -e "  健康检查:        http://localhost:8000/health"
echo -e ""
echo -e "${GREEN}外网访问 (测试服务器 ${TEST_SERVER_IP}):${NC}"
echo -e "  ${GREEN}前端应用:        http://${TEST_SERVER_IP}:3000${NC}"
echo -e "  ${GREEN}后端API:         http://${TEST_SERVER_IP}:8000${NC}"
echo -e "  ${GREEN}API文档:         http://${TEST_SERVER_IP}:8000/docs${NC}"
echo -e "  ${GREEN}健康检查:        http://${TEST_SERVER_IP}:8000/health${NC}"
echo -e ""
echo -e "${CYAN}内部服务:${NC}"
echo -e "  API网关:         http://localhost:8000/api-gateway/health"
echo -e "  知识图谱:        http://localhost:9622"
echo -e "  DeepScrape:      http://localhost:3001"
echo -e "  LLM Gateway:     http://localhost:9050"
echo -e "  Unla Web:        http://localhost:5173"
echo -e "  Unla API:        http://localhost:5234"
echo -e "  Unla MCP:        http://localhost:5235"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}环境信息:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Conda基础路径:${NC}   ${CONDA_BASE}"
echo -e "${CYAN}后端Python环境:${NC}   ${BACKEND_CONDA_ENV}"
echo -e "${CYAN}前端Node环境:${NC}     ${FRONTEND_CONDA_ENV}"
echo -e "${CYAN}配置文件:${NC}         ecosystem.config.test.js"

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
echo -e "${CYAN}保存配置:${NC}           pm2 save"
echo ""

echo -e "${YELLOW}提示: 首次访问前端可能需要等待编译完成（30秒-1分钟）${NC}"
echo ""
