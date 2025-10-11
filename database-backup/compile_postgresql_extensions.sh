#!/bin/bash
#################################################
# PostgreSQL 17 扩展源码编译安装脚本
#
# 编译: uuid-ossp, btree_gin, pg_trgm
# 使用方法: bash compile_postgresql_extensions.sh
#################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PG_VERSION="17.0"
PG_MAJOR_VERSION="17"
DOWNLOAD_URL="https://ftp.postgresql.org/pub/source/v${PG_VERSION}/postgresql-${PG_VERSION}.tar.gz"
WORK_DIR="/tmp/pg_compile_$(date +%s)"

echo "======================================"
echo "PostgreSQL 扩展编译安装"
echo "======================================"
echo "版本: PostgreSQL $PG_VERSION"
echo "工作目录: $WORK_DIR"
echo ""

# 步骤1: 检查依赖
echo -e "${BLUE}步骤1: 检查编译依赖${NC}"
echo "----------------------------------------"

MISSING_DEPS=()

# 检查必需的工具
for cmd in gcc make wget tar; do
    if ! command -v $cmd &> /dev/null; then
        MISSING_DEPS+=($cmd)
    fi
done

# 检查开发库
if ! rpm -q readline-devel &> /dev/null && ! dpkg -l libreadline-dev &> /dev/null; then
    MISSING_DEPS+=(readline-devel)
fi

if ! rpm -q zlib-devel &> /dev/null && ! dpkg -l zlib1g-dev &> /dev/null; then
    MISSING_DEPS+=(zlib-devel)
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}缺少以下依赖: ${MISSING_DEPS[*]}${NC}"
    echo ""
    echo "安装依赖:"
    echo "  CentOS/RHEL:"
    echo "    sudo yum install -y gcc make wget tar readline-devel zlib-devel"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    sudo apt-get install -y gcc make wget tar libreadline-dev zlib1g-dev"
    echo ""
    read -p "是否现在安装依赖? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v yum &> /dev/null; then
            sudo yum install -y gcc make wget tar readline-devel zlib-devel
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y gcc make wget tar libreadline-dev zlib1g-dev
        fi
    else
        echo "请先安装依赖，然后重新运行此脚本"
        exit 1
    fi
fi

echo -e "${GREEN}✓ 依赖检查完成${NC}"
echo ""

# 步骤2: 下载源码
echo -e "${BLUE}步骤2: 下载PostgreSQL源码${NC}"
echo "----------------------------------------"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "下载 PostgreSQL $PG_VERSION ..."
wget -q --show-progress "$DOWNLOAD_URL" || {
    echo -e "${RED}下载失败，尝试备用镜像...${NC}"
    wget -q --show-progress "https://mirrors.tuna.tsinghua.edu.cn/postgresql/source/v${PG_VERSION}/postgresql-${PG_VERSION}.tar.gz"
}

echo "解压源码..."
tar -xzf "postgresql-${PG_VERSION}.tar.gz"
cd "postgresql-${PG_VERSION}"

echo -e "${GREEN}✓ 源码下载完成${NC}"
echo ""

# 步骤3: 配置
echo -e "${BLUE}步骤3: 配置编译环境${NC}"
echo "----------------------------------------"

# 检测PostgreSQL安装路径
PG_CONFIG=$(which pg_config 2>/dev/null || echo "")

if [ -n "$PG_CONFIG" ]; then
    PG_PREFIX=$($PG_CONFIG --bindir | sed 's/\/bin$//')
    echo "检测到PostgreSQL安装路径: $PG_PREFIX"
else
    PG_PREFIX="/usr/pgsql-${PG_MAJOR_VERSION}"
    echo "使用默认路径: $PG_PREFIX"
fi

echo "执行configure..."
./configure --prefix="$PG_PREFIX" > /dev/null 2>&1

echo -e "${GREEN}✓ 配置完成${NC}"
echo ""

# 步骤4: 编译扩展
echo -e "${BLUE}步骤4: 编译PostgreSQL扩展${NC}"
echo "----------------------------------------"

cd contrib

# 扩展列表
EXTENSIONS=(
    "uuid-ossp"
    "btree_gin"
    "pg_trgm"
)

SUCCESS_COUNT=0
FAILED_COUNT=0

for ext in "${EXTENSIONS[@]}"; do
    echo ""
    echo "编译扩展: $ext"
    echo "  - 进入目录: contrib/$ext"

    if [ ! -d "$ext" ]; then
        echo -e "  ${RED}✗ 目录不存在${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi

    cd "$ext"

    echo "  - 执行 make..."
    if make > /tmp/make_${ext}.log 2>&1; then
        echo -e "  ${GREEN}✓ 编译成功${NC}"

        echo "  - 执行 make install..."
        if sudo make install > /tmp/install_${ext}.log 2>&1; then
            echo -e "  ${GREEN}✓ 安装成功${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "  ${RED}✗ 安装失败${NC}"
            echo "    查看日志: /tmp/install_${ext}.log"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo -e "  ${RED}✗ 编译失败${NC}"
        echo "    查看日志: /tmp/make_${ext}.log"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    cd ..
done

echo ""
echo "编译统计: 成功 $SUCCESS_COUNT 个, 失败 $FAILED_COUNT 个"
echo ""

# 步骤5: 验证安装
echo -e "${BLUE}步骤5: 验证安装${NC}"
echo "----------------------------------------"

echo "查找已安装的扩展文件..."

for ext in "${EXTENSIONS[@]}"; do
    SO_FILE="${PG_PREFIX}/lib/${ext}.so"
    CONTROL_FILE="${PG_PREFIX}/share/extension/${ext}.control"

    echo ""
    echo "扩展: $ext"

    if [ -f "$SO_FILE" ]; then
        echo -e "  ${GREEN}✓${NC} 库文件: $SO_FILE"
    else
        echo -e "  ${RED}✗${NC} 库文件未找到"
    fi

    if [ -f "$CONTROL_FILE" ]; then
        echo -e "  ${GREEN}✓${NC} 控制文件: $CONTROL_FILE"
    else
        echo -e "  ${RED}✗${NC} 控制文件未找到"
    fi
done

echo ""

# 步骤6: 在数据库中测试
echo -e "${BLUE}步骤6: 数据库测试${NC}"
echo "----------------------------------------"

echo "测试创建扩展..."

psql -U postgres -d zzdsj_demo << 'EOF'
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 查看已安装的扩展
\echo ''
\echo '已安装的扩展:'
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'btree_gin', 'pg_trgm', 'vector');

-- 测试uuid-ossp功能
\echo ''
\echo '测试uuid-ossp:'
SELECT uuid_generate_v4() AS test_uuid;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ 编译安装成功！"
    echo "======================================${NC}"
else
    echo ""
    echo -e "${YELLOW}======================================"
    echo "⚠️  部分扩展可能需要手动创建"
    echo "======================================${NC}"
fi

echo ""
echo "工作目录: $WORK_DIR"
echo "可以安全删除: rm -rf $WORK_DIR"
echo ""

# 清理提示
read -p "是否删除编译临时文件? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$WORK_DIR"
    echo "临时文件已删除"
fi
