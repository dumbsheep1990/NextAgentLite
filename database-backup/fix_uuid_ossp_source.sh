#!/bin/bash
#################################################
# 修复uuid-ossp.c源码，强制使用e2fs UUID
#################################################

cd /tmp/postgresql-17.0/contrib/uuid-ossp

echo "备份原文件..."
cp uuid-ossp.c uuid-ossp.c.original

echo "修改uuid-ossp.c源码..."

# 使用cat和heredoc创建修复后的文件头部
cat > /tmp/uuid_fixed_header.c << 'HEADER_EOF'
/*
 * uuid-ossp.c
 * Force use of e2fs UUID library
 */

/* 强制定义使用e2fs UUID */
#ifndef HAVE_UUID_E2FS
#define HAVE_UUID_E2FS 1
#endif

/* 跳过configure检查 */
#define HAVE_UUID_OSSP 1

HEADER_EOF

# 查找#error那一行的行号
ERROR_LINE=$(grep -n "please use configure's --with-uuid" uuid-ossp.c | cut -d: -f1)

if [ -n "$ERROR_LINE" ]; then
    echo "找到错误检查在第 $ERROR_LINE 行，将其注释掉..."

    # 方法1: 创建一个新文件，跳过错误检查部分
    # 取文件开头到错误行之前的内容
    head -n $((ERROR_LINE - 1)) uuid-ossp.c.original > /tmp/uuid_part1.c

    # 注释掉错误行
    sed -n "${ERROR_LINE}p" uuid-ossp.c.original | sed 's/^#error/\/\/ #error/' > /tmp/uuid_error.c

    # 取错误行之后的内容
    tail -n +$((ERROR_LINE + 1)) uuid-ossp.c.original > /tmp/uuid_part2.c

    # 合并文件
    cat /tmp/uuid_fixed_header.c /tmp/uuid_part1.c /tmp/uuid_error.c /tmp/uuid_part2.c > uuid-ossp.c

    echo "✓ 源码修复完成"
else
    # 如果找不到错误行，直接在开头添加定义
    cat /tmp/uuid_fixed_header.c uuid-ossp.c.original > uuid-ossp.c
    echo "✓ 添加了UUID定义"
fi

echo ""
echo "检查修改后的文件前50行:"
echo "========================================"
head -50 uuid-ossp.c

echo ""
echo "开始编译..."
make clean
make USE_PGXS=1 SHLIB_LINK="-luuid"

if [ $? -eq 0 ]; then
    echo "✓ 编译成功，正在安装..."
    sudo make USE_PGXS=1 install

    if [ $? -eq 0 ]; then
        echo "✓ 安装成功！"

        # 验证
        PG_LIBDIR=$(pg_config --pkglibdir)
        ls -lh "$PG_LIBDIR/uuid-ossp.so"

        # 测试
        echo ""
        echo "测试扩展..."
        psql -U postgres -d zzdsj_demo -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
        psql -U postgres -d zzdsj_demo -c "SELECT uuid_generate_v4();"
    fi
else
    echo "✗ 编译失败"
fi
