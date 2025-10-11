#!/bin/bash
#################################################
# 使用PGXS方式编译uuid-ossp扩展
# 适用于已安装PostgreSQL，单独编译扩展的场景
#################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo "PGXS方式编译uuid-ossp扩展"
echo "======================================"
echo ""

# 检查pg_config
if ! command -v pg_config &> /dev/null; then
    echo -e "${RED}错误: 找不到pg_config${NC}"
    echo "请确保PostgreSQL已正确安装"
    exit 1
fi

PG_VERSION=$(pg_config --version | grep -oP '\d+' | head -1)
echo "PostgreSQL版本: $PG_VERSION"

# 步骤1: 安装UUID库
echo ""
echo -e "${BLUE}步骤1: 检查UUID库${NC}"
echo "----------------------------------------"

if rpm -q libuuid-devel &> /dev/null; then
    echo -e "${GREEN}✓ libuuid-devel 已安装${NC}"
else
    echo "安装 libuuid-devel..."
    sudo yum install -y libuuid-devel uuid-devel
fi

# 步骤2: 下载PostgreSQL源码（如果还没有）
echo ""
echo -e "${BLUE}步骤2: 准备源码${NC}"
echo "----------------------------------------"

SOURCE_DIR="/tmp/postgresql-${PG_VERSION}.0"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "下载PostgreSQL ${PG_VERSION}.0源码..."
    cd /tmp
    wget -q --show-progress "https://ftp.postgresql.org/pub/source/v${PG_VERSION}.0/postgresql-${PG_VERSION}.0.tar.gz"
    tar -xzf "postgresql-${PG_VERSION}.0.tar.gz"
else
    echo "源码目录已存在: $SOURCE_DIR"
fi

cd "$SOURCE_DIR/contrib/uuid-ossp"

# 步骤3: 修改源码，强制使用e2fs UUID
echo ""
echo -e "${BLUE}步骤3: 配置UUID类型${NC}"
echo "----------------------------------------"

# 备份原文件
if [ ! -f uuid-ossp.c.original ]; then
    cp uuid-ossp.c uuid-ossp.c.original
fi

# 恢复到原始状态（如果之前修改过）
cp uuid-ossp.c.original uuid-ossp.c

# 方法1: 在文件开头添加宏定义
echo "在uuid-ossp.c开头添加HAVE_UUID_E2FS定义..."
cat > /tmp/uuid_header.txt << 'EOF'
/*
 * Force use of e2fs UUID library
 */
#ifndef HAVE_UUID_E2FS
#define HAVE_UUID_E2FS 1
#endif

EOF

# 将新内容添加到文件开头
cat /tmp/uuid_header.txt uuid-ossp.c.original > uuid-ossp.c

echo -e "${GREEN}✓ 源码修改完成${NC}"

# 步骤4: 编译
echo ""
echo -e "${BLUE}步骤4: 编译uuid-ossp${NC}"
echo "----------------------------------------"

# 清理
make clean 2>/dev/null || true

# 使用PGXS编译，明确指定链接uuid库
echo "执行编译..."
if make USE_PGXS=1 SHLIB_LINK="-luuid" > /tmp/make_uuid.log 2>&1; then
    echo -e "${GREEN}✓ 编译成功${NC}"
else
    echo -e "${RED}✗ 编译失败${NC}"
    echo "查看日志: /tmp/make_uuid.log"
    cat /tmp/make_uuid.log | tail -30
    exit 1
fi

# 步骤5: 安装
echo ""
echo -e "${BLUE}步骤5: 安装uuid-ossp${NC}"
echo "----------------------------------------"

if sudo make USE_PGXS=1 install > /tmp/install_uuid.log 2>&1; then
    echo -e "${GREEN}✓ 安装成功${NC}"
else
    echo -e "${RED}✗ 安装失败${NC}"
    cat /tmp/install_uuid.log
    exit 1
fi

# 步骤6: 验证
echo ""
echo -e "${BLUE}步骤6: 验证安装${NC}"
echo "----------------------------------------"

PG_LIBDIR=$(pg_config --pkglibdir)
if [ -f "$PG_LIBDIR/uuid-ossp.so" ]; then
    echo -e "${GREEN}✓ 找到库文件: $PG_LIBDIR/uuid-ossp.so${NC}"
    ls -lh "$PG_LIBDIR/uuid-ossp.so"
else
    echo -e "${RED}✗ 未找到库文件${NC}"
fi

PG_SHAREDIR=$(pg_config --sharedir)
if [ -f "$PG_SHAREDIR/extension/uuid-ossp.control" ]; then
    echo -e "${GREEN}✓ 找到控制文件: $PG_SHAREDIR/extension/uuid-ossp.control${NC}"
else
    echo -e "${RED}✗ 未找到控制文件${NC}"
fi

# 步骤7: 数据库测试
echo ""
echo -e "${BLUE}步骤7: 数据库测试${NC}"
echo "----------------------------------------"

echo "测试创建扩展..."
psql -U postgres -d zzdsj_demo << 'EOF'
-- 删除旧扩展（如果存在）
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- 创建扩展
CREATE EXTENSION "uuid-ossp";

-- 测试功能
SELECT uuid_generate_v4() AS test_uuid;

-- 查看扩展信息
\dx uuid-ossp
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ uuid-ossp编译安装成功！"
    echo "======================================${NC}"
else
    echo ""
    echo -e "${RED}======================================"
    echo "❌ 创建扩展失败"
    echo "======================================${NC}"
    echo ""
    echo "可能的原因:"
    echo "1. 数据库权限不足"
    echo "2. 扩展文件路径不匹配"
    echo "3. PostgreSQL版本不匹配"
fi

echo ""
echo "完成！"
