#!/bin/bash
#################################################
# PostgreSQL扩展诊断脚本
#################################################

echo "======================================"
echo "PostgreSQL 扩展诊断"
echo "======================================"
echo ""

# 1. PostgreSQL版本和路径
echo "1. PostgreSQL 版本和路径"
echo "----------------------------------------"
psql --version
which psql
which pg_config

if command -v pg_config &> /dev/null; then
    echo ""
    echo "PostgreSQL配置信息:"
    pg_config --version
    echo "BINDIR: $(pg_config --bindir)"
    echo "SHAREDIR: $(pg_config --sharedir)"
    echo "PKGLIBDIR: $(pg_config --pkglibdir)"
fi

echo ""

# 2. 查找扩展文件
echo "2. 查找扩展文件位置"
echo "----------------------------------------"
echo "正在查找 uuid-ossp.control ..."
sudo find / -name "uuid-ossp.control" 2>/dev/null | head -5

echo ""
echo "正在查找 btree_gin.control ..."
sudo find / -name "btree_gin.control" 2>/dev/null | head -5

echo ""
echo "正在查找 pg_trgm.control ..."
sudo find / -name "pg_trgm.control" 2>/dev/null | head -5

echo ""

# 3. 检查已安装的RPM/DEB包
echo "3. 检查已安装的PostgreSQL包"
echo "----------------------------------------"

# CentOS/RHEL
if command -v rpm &> /dev/null; then
    echo "RPM包:"
    rpm -qa | grep postgresql | sort
fi

# Ubuntu/Debian
if command -v dpkg &> /dev/null; then
    echo "DEB包:"
    dpkg -l | grep postgresql | awk '{print $2, $3}'
fi

echo ""

# 4. PostgreSQL运行时配置
echo "4. PostgreSQL 运行时配置"
echo "----------------------------------------"
echo "正在获取配置信息..."

psql -U postgres -t -c "SHOW data_directory;" 2>/dev/null || echo "无法连接到postgres用户"
psql -U postgres -t -c "SHOW config_file;" 2>/dev/null
psql -U postgres -t -c "SHOW dynamic_library_path;" 2>/dev/null
psql -U postgres -t -c "SELECT * FROM pg_config WHERE name IN ('SHAREDIR', 'PKGLIBDIR', 'LIBDIR');" 2>/dev/null

echo ""

# 5. 已安装的扩展
echo "5. 当前已安装的扩展"
echo "----------------------------------------"
psql -U postgres -d postgres -c "SELECT extname, extversion FROM pg_extension ORDER BY extname;" 2>/dev/null

echo ""

# 6. 建议的解决方案
echo "======================================"
echo "诊断完成 - 建议的解决方案"
echo "======================================"
echo ""

# 检查是否找到了扩展文件
UUID_FOUND=$(sudo find / -name "uuid-ossp.control" 2>/dev/null | head -1)

if [ -z "$UUID_FOUND" ]; then
    echo "❌ 未找到扩展文件，需要安装PostgreSQL contrib包"
    echo ""
    echo "解决方案1: 使用包管理器安装"
    echo "  CentOS/RHEL:"
    echo "    sudo yum install postgresql-contrib"
    echo "    sudo yum install postgresql17-contrib"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    sudo apt-get install postgresql-contrib"
    echo "    sudo apt-get install postgresql-contrib-17"
else
    echo "✓ 找到扩展文件: $UUID_FOUND"

    EXPECTED_PATH="/home/postgresql/share/extension/"
    ACTUAL_DIR=$(dirname "$UUID_FOUND")

    if [ "$ACTUAL_DIR" != "$EXPECTED_PATH" ]; then
        echo ""
        echo "⚠️  扩展文件路径不匹配"
        echo "  期望路径: $EXPECTED_PATH"
        echo "  实际路径: $ACTUAL_DIR"
        echo ""
        echo "解决方案2: 创建符号链接"
        echo "  sudo mkdir -p $EXPECTED_PATH"
        echo "  sudo ln -s $ACTUAL_DIR/*.control $EXPECTED_PATH/"
        echo "  sudo ln -s $ACTUAL_DIR/*.sql $EXPECTED_PATH/"
        echo ""
        echo "解决方案3: 修改PostgreSQL配置"
        echo "  编辑 postgresql.conf，添加:"
        echo "  dynamic_library_path = '\$libdir:$(dirname $ACTUAL_DIR | sed 's/share\/extension/lib/')'"
    fi
fi

echo ""
echo "详细信息已保存"
