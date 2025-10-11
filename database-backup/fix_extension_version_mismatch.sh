#!/bin/bash
#################################################
# PostgreSQL扩展版本不匹配修复脚本
#
# 问题: PostgreSQL 17 但扩展库是 9.2 版本
# 解决: 找到正确版本的扩展并重新链接
#################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo "PostgreSQL 扩展版本不匹配修复"
echo "======================================"
echo ""

# 检查PostgreSQL版本
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
echo -e "${BLUE}检测到的PostgreSQL版本: $PG_VERSION${NC}"
echo ""

# 步骤1: 查找正确版本的扩展
echo "步骤1: 查找PostgreSQL $PG_VERSION 的扩展文件"
echo "----------------------------------------"

# 查找uuid-ossp.so
echo "查找 uuid-ossp.so ..."
UUID_SO=$(sudo find / -path "*/pgsql-$PG_VERSION/*" -name "uuid-ossp.so" 2>/dev/null | head -1)

if [ -z "$UUID_SO" ]; then
    UUID_SO=$(sudo find / -path "*/postgresql/$PG_VERSION/*" -name "uuid-ossp.so" 2>/dev/null | head -1)
fi

if [ -z "$UUID_SO" ]; then
    echo -e "${RED}✗ 未找到PostgreSQL $PG_VERSION 版本的 uuid-ossp.so${NC}"
    echo ""
    echo "需要安装PostgreSQL $PG_VERSION 的contrib包:"
    echo "  sudo yum install postgresql${PG_VERSION}-contrib"
    echo "  或"
    echo "  sudo apt-get install postgresql-contrib-${PG_VERSION}"
    exit 1
else
    echo -e "${GREEN}✓ 找到: $UUID_SO${NC}"
fi

# 找到扩展目录
EXT_DIR=$(dirname "$UUID_SO")
SHARE_DIR="${EXT_DIR}/../share/extension"

echo "扩展库目录: $EXT_DIR"
echo "扩展配置目录: $SHARE_DIR"
echo ""

# 步骤2: 备份旧文件
echo "步骤2: 备份旧的扩展文件"
echo "----------------------------------------"

BACKUP_DIR="/home/postgresql/backup_$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

# 备份lib目录
if [ -d "/home/postgresql/lib" ]; then
    echo "备份 /home/postgresql/lib ..."
    sudo cp -r /home/postgresql/lib "$BACKUP_DIR/"
fi

# 备份share/extension目录
if [ -d "/home/postgresql/share/extension" ]; then
    echo "备份 /home/postgresql/share/extension ..."
    sudo cp -r /home/postgresql/share/extension "$BACKUP_DIR/"
fi

echo -e "${GREEN}✓ 备份完成: $BACKUP_DIR${NC}"
echo ""

# 步骤3: 清理旧文件
echo "步骤3: 清理旧的扩展文件"
echo "----------------------------------------"

sudo rm -f /home/postgresql/lib/uuid-ossp.so
sudo rm -f /home/postgresql/lib/btree_gin.so
sudo rm -f /home/postgresql/lib/pg_trgm.so
sudo rm -f /home/postgresql/share/extension/uuid-ossp*
sudo rm -f /home/postgresql/share/extension/btree_gin*
sudo rm -f /home/postgresql/share/extension/pg_trgm*

echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 步骤4: 创建正确的符号链接
echo "步骤4: 创建正确版本的符号链接"
echo "----------------------------------------"

sudo mkdir -p /home/postgresql/lib
sudo mkdir -p /home/postgresql/share/extension

# 链接库文件
echo "链接库文件..."
if [ -f "$EXT_DIR/uuid-ossp.so" ]; then
    sudo ln -s "$EXT_DIR/uuid-ossp.so" /home/postgresql/lib/uuid-ossp.so
    echo "  ✓ uuid-ossp.so"
fi

if [ -f "$EXT_DIR/btree_gin.so" ]; then
    sudo ln -s "$EXT_DIR/btree_gin.so" /home/postgresql/lib/btree_gin.so
    echo "  ✓ btree_gin.so"
fi

if [ -f "$EXT_DIR/pg_trgm.so" ]; then
    sudo ln -s "$EXT_DIR/pg_trgm.so" /home/postgresql/lib/pg_trgm.so
    echo "  ✓ pg_trgm.so"
fi

# 链接控制文件
echo ""
echo "链接控制文件..."
if [ -f "$SHARE_DIR/uuid-ossp.control" ]; then
    sudo ln -s "$SHARE_DIR"/uuid-ossp* /home/postgresql/share/extension/
    echo "  ✓ uuid-ossp.*"
fi

if [ -f "$SHARE_DIR/btree_gin.control" ]; then
    sudo ln -s "$SHARE_DIR"/btree_gin* /home/postgresql/share/extension/
    echo "  ✓ btree_gin.*"
fi

if [ -f "$SHARE_DIR/pg_trgm.control" ]; then
    sudo ln -s "$SHARE_DIR"/pg_trgm* /home/postgresql/share/extension/
    echo "  ✓ pg_trgm.*"
fi

echo ""
echo -e "${GREEN}✓ 符号链接创建完成${NC}"
echo ""

# 步骤5: 验证
echo "步骤5: 验证修复结果"
echo "----------------------------------------"

echo "检查文件版本..."
file /home/postgresql/lib/uuid-ossp.so 2>/dev/null || echo "文件不存在"

echo ""
echo "测试创建扩展..."

psql -U postgres -d zzdsj_demo << 'EOF'
-- 测试创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 查看已安装的扩展
\dx

-- 测试uuid-ossp功能
SELECT uuid_generate_v4();
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ 修复成功！"
    echo "======================================${NC}"
    echo ""
    echo "已安装的扩展:"
    psql -U postgres -d zzdsj_demo -c "\dx"
else
    echo ""
    echo -e "${RED}======================================"
    echo "❌ 修复失败"
    echo "======================================${NC}"
    echo ""
    echo "请检查错误信息，或尝试手动安装:"
    echo "  sudo yum install postgresql${PG_VERSION}-contrib"
fi

echo ""
echo "备份文件位置: $BACKUP_DIR"
