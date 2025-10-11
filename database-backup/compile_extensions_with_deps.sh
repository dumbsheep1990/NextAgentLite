#!/bin/bash
#################################################
# PostgreSQL扩展编译脚本（包含依赖安装）
#################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PG_VERSION="17.0"
WORK_DIR="/tmp/pg_compile_$(date +%s)"

echo "======================================"
echo "PostgreSQL扩展编译安装（完整版）"
echo "======================================"
echo ""

# 步骤1: 安装所有依赖
echo -e "${BLUE}步骤1: 安装编译依赖${NC}"
echo "----------------------------------------"

echo "安装基础编译工具..."
sudo yum install -y gcc make wget tar

echo "安装PostgreSQL开发依赖..."
sudo yum install -y readline-devel zlib-devel

echo "安装UUID库..."
# 尝试安装两种UUID库
sudo yum install -y libuuid-devel uuid-devel || true
sudo yum install -y uuid || true

echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 步骤2: 下载源码
echo -e "${BLUE}步骤2: 下载PostgreSQL源码${NC}"
echo "----------------------------------------"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "下载 PostgreSQL $PG_VERSION ..."
wget -q --show-progress "https://ftp.postgresql.org/pub/source/v${PG_VERSION}/postgresql-${PG_VERSION}.tar.gz"

echo "解压源码..."
tar -xzf "postgresql-${PG_VERSION}.tar.gz"
cd "postgresql-${PG_VERSION}"

echo -e "${GREEN}✓ 源码准备完成${NC}"
echo ""

# 步骤3: 配置
echo -e "${BLUE}步骤3: 配置编译环境${NC}"
echo "----------------------------------------"

PG_PREFIX=$(pg_config --bindir 2>/dev/null | sed 's/\/bin$//' || echo "/usr/pgsql-17")
echo "PostgreSQL安装路径: $PG_PREFIX"

# 尝试不同的UUID配置
echo "配置PostgreSQL编译选项..."

# 尝试e2fs uuid
if ./configure --prefix="$PG_PREFIX" --with-uuid=e2fs > /tmp/configure.log 2>&1; then
    echo -e "${GREEN}✓ 配置成功 (使用e2fs UUID)${NC}"
    UUID_TYPE="e2fs"
elif ./configure --prefix="$PG_PREFIX" --with-uuid=ossp > /tmp/configure.log 2>&1; then
    echo -e "${GREEN}✓ 配置成功 (使用ossp UUID)${NC}"
    UUID_TYPE="ossp"
else
    echo -e "${RED}✗ 配置失败${NC}"
    echo "查看日志: /tmp/configure.log"
    cat /tmp/configure.log | tail -20
    exit 1
fi

echo ""

# 步骤4: 编译扩展
echo -e "${BLUE}步骤4: 编译扩展${NC}"
echo "----------------------------------------"

cd contrib

# uuid-ossp
echo ""
echo "编译 uuid-ossp..."
cd uuid-ossp
if make > /tmp/make_uuid.log 2>&1; then
    echo -e "  ${GREEN}✓ 编译成功${NC}"
    if sudo make install > /tmp/install_uuid.log 2>&1; then
        echo -e "  ${GREEN}✓ 安装成功${NC}"
    else
        echo -e "  ${RED}✗ 安装失败${NC}"
        cat /tmp/install_uuid.log
    fi
else
    echo -e "  ${RED}✗ 编译失败${NC}"
    echo "错误信息:"
    cat /tmp/make_uuid.log | tail -20
fi

# btree_gin
echo ""
echo "编译 btree_gin..."
cd ../btree_gin
if make > /tmp/make_btree.log 2>&1; then
    echo -e "  ${GREEN}✓ 编译成功${NC}"
    sudo make install > /dev/null 2>&1
    echo -e "  ${GREEN}✓ 安装成功${NC}"
else
    echo -e "  ${RED}✗ 编译失败${NC}"
fi

# pg_trgm
echo ""
echo "编译 pg_trgm..."
cd ../pg_trgm
if make > /tmp/make_trgm.log 2>&1; then
    echo -e "  ${GREEN}✓ 编译成功${NC}"
    sudo make install > /dev/null 2>&1
    echo -e "  ${GREEN}✓ 安装成功${NC}"
else
    echo -e "  ${RED}✗ 编译失败${NC}"
fi

echo ""

# 步骤5: 验证
echo -e "${BLUE}步骤5: 验证安装${NC}"
echo "----------------------------------------"

echo "查找扩展文件..."
ls -lh $PG_PREFIX/lib/uuid-ossp.so 2>/dev/null && echo -e "${GREEN}✓ uuid-ossp.so${NC}" || echo -e "${RED}✗ uuid-ossp.so${NC}"
ls -lh $PG_PREFIX/lib/btree_gin.so 2>/dev/null && echo -e "${GREEN}✓ btree_gin.so${NC}" || echo -e "${RED}✗ btree_gin.so${NC}"
ls -lh $PG_PREFIX/lib/pg_trgm.so 2>/dev/null && echo -e "${GREEN}✓ pg_trgm.so${NC}" || echo -e "${RED}✗ pg_trgm.so${NC}"

echo ""

# 步骤6: 数据库测试
echo -e "${BLUE}步骤6: 数据库测试${NC}"
echo "----------------------------------------"

psql -U postgres -d zzdsj_demo << 'EOF'
\echo '创建扩展...'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

\echo ''
\echo '已安装的扩展:'
\dx

\echo ''
\echo '测试UUID生成:'
SELECT uuid_generate_v4();
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ 所有扩展编译安装成功！"
    echo "======================================${NC}"
else
    echo ""
    echo -e "${YELLOW}======================================"
    echo "⚠️  请检查错误信息"
    echo "======================================${NC}"
fi

echo ""
echo "临时文件位置: $WORK_DIR"
echo "可以删除: rm -rf $WORK_DIR"
