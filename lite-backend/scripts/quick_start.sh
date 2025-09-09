#!/bin/bash
# 地聚物材料QA系统快速启动脚本
# 适用于开发环境的一键启动

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 地聚物材料QA系统 - 快速启动${NC}"
echo "========================================"

# 检查必要的服务
echo -e "\n${BLUE}1. 检查系统环境...${NC}"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3 已安装${NC}"

# 检查PostgreSQL
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL 服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL 服务未运行，请先启动${NC}"
        echo "   sudo systemctl start postgresql"
        echo "   或使用 brew services start postgresql (macOS)"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL 客户端工具未安装${NC}"
fi

# 检查ElasticSearch
if curl -s -f http://localhost:9200/_cluster/health &> /dev/null; then
    echo -e "${GREEN}✓ ElasticSearch 服务正常${NC}"
else
    echo -e "${YELLOW}⚠️  ElasticSearch 服务未运行，请先启动${NC}"
    echo "   sudo systemctl start elasticsearch"
    echo "   或使用 brew services start elasticsearch (macOS)"
    exit 1
fi

# 安装依赖
echo -e "\n${BLUE}2. 安装Python依赖...${NC}"
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 检查配置文件
echo -e "\n${BLUE}3. 检查配置文件...${NC}"
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️  已从 env.example 创建 .env 文件，请检查配置${NC}"
    else
        echo -e "${RED}❌ 未找到配置文件${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ 配置文件检查完成${NC}"

# 系统初始化
echo -e "\n${BLUE}4. 执行系统初始化...${NC}"
./scripts/setup.sh init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 系统初始化完成${NC}"
else
    echo -e "${RED}❌ 系统初始化失败${NC}"
    echo "请查看错误日志并手动解决问题"
    exit 1
fi

# 启动应用
echo -e "\n${BLUE}5. 启动应用服务...${NC}"
echo "正在启动 FastAPI 应用..."
echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
echo ""

# 显示启动信息
echo "🌐 API文档: http://localhost:8000/docs"
echo "📊 系统信息: http://localhost:8000/info"
echo "🔍 健康检查: http://localhost:8000/health"
echo ""

# 启动应用
python main.py 