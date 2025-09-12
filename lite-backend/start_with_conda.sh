#!/bin/bash
# NextAgent Lite - 使用conda环境启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 NextAgent Lite - 使用conda环境启动${NC}"
echo "========================================"

# 设置conda环境
CONDA_ENV="zzdsj-lite"
PYTHON_PATH="/opt/anaconda3/envs/${CONDA_ENV}/bin/python"

echo -e "\n${BLUE}1. 检查conda环境...${NC}"

# 检查conda环境是否存在
if [ ! -f "$PYTHON_PATH" ]; then
    echo -e "${RED}❌ conda环境 ${CONDA_ENV} 不存在${NC}"
    echo "请先创建conda环境: conda create -n ${CONDA_ENV} python=3.11"
    exit 1
fi

echo -e "${GREEN}✓ conda环境 ${CONDA_ENV} 已找到${NC}"

# 测试必要的包
echo -e "\n${BLUE}2. 检查Python包...${NC}"

if ! $PYTHON_PATH -c "import crawl4ai" 2>/dev/null; then
    echo -e "${RED}❌ crawl4ai 包未安装${NC}"
    echo "请在conda环境中安装: conda activate ${CONDA_ENV} && pip install crawl4ai"
    exit 1
fi
echo -e "${GREEN}✓ crawl4ai 包已安装${NC}"

if ! $PYTHON_PATH -c "import readability" 2>/dev/null; then
    echo -e "${RED}❌ readability 包未安装${NC}"
    echo "请在conda环境中安装: conda activate ${CONDA_ENV} && pip install readability-lxml"
    exit 1
fi
echo -e "${GREEN}✓ readability 包已安装${NC}"

# 检查其他关键包
echo -e "\n${BLUE}3. 检查其他关键依赖...${NC}"

REQUIRED_PACKAGES=("fastapi" "uvicorn" "sqlalchemy" "elasticsearch" "agno")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if $PYTHON_PATH -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}✓ $package 已安装${NC}"
    else
        echo -e "${YELLOW}⚠️  $package 包可能未安装或版本不兼容${NC}"
    fi
done

# 启动应用
echo -e "\n${BLUE}4. 启动应用服务...${NC}"
echo "使用Python解释器: $PYTHON_PATH"
echo "正在启动 NextAgent Lite 应用..."
echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
echo ""

# 显示启动信息
echo "🌐 API文档: http://localhost:8000/docs"
echo "📊 系统信息: http://localhost:8000/info"
echo "🔍 健康检查: http://localhost:8000/health"
echo ""

# 使用指定的Python环境启动应用
exec $PYTHON_PATH main.py