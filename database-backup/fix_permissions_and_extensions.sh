#!/bin/bash
#################################################
# PostgreSQL权限和扩展修复脚本
#
# 使用方法:
#   1. 在服务器上执行: bash fix_permissions_and_extensions.sh
#   2. 或者复制SQL命令手动执行
#################################################

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-zzdsj_demo}"
DB_USER="${DB_USER:-zzdsj_demo}"
ADMIN_USER="${ADMIN_USER:-postgres}"

echo "======================================"
echo "PostgreSQL 权限和扩展修复"
echo "======================================"
echo "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo "用户: $DB_USER"
echo ""

echo -e "${YELLOW}请确保你有PostgreSQL超级用户权限！${NC}"
echo ""

# 生成SQL脚本
SQL_SCRIPT=$(cat <<'EOF'
-- ============================================
-- 步骤1: 创建扩展
-- ============================================
\echo '创建PostgreSQL扩展...'

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\echo '✓ 扩展创建完成'

-- ============================================
-- 步骤2: 授予数据库权限
-- ============================================
\echo '授予数据库权限...'

GRANT ALL PRIVILEGES ON DATABASE zzdsj_demo TO zzdsj_demo;

\echo '✓ 数据库权限授予完成'

-- ============================================
-- 步骤3: 授予Schema权限
-- ============================================
\echo '授予Schema权限...'

GRANT ALL ON SCHEMA public TO zzdsj_demo;
GRANT CREATE ON SCHEMA public TO zzdsj_demo;
GRANT USAGE ON SCHEMA public TO zzdsj_demo;

\echo '✓ Schema权限授予完成'

-- ============================================
-- 步骤4: 授予现有对象权限
-- ============================================
\echo '授予现有对象权限...'

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zzdsj_demo;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zzdsj_demo;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO zzdsj_demo;

\echo '✓ 现有对象权限授予完成'

-- ============================================
-- 步骤5: 设置默认权限
-- ============================================
\echo '设置默认权限...'

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zzdsj_demo;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zzdsj_demo;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO zzdsj_demo;

\echo '✓ 默认权限设置完成'

-- ============================================
-- 步骤6: 验证权限
-- ============================================
\echo ''
\echo '验证权限设置:'
\echo '----------------------------------------'

-- 检查数据库权限
SELECT
    datname AS database,
    array_agg(privilege_type) AS privileges
FROM (
    SELECT
        d.datname,
        unnest(ARRAY['CONNECT', 'CREATE', 'TEMPORARY']) AS privilege_type
    FROM pg_database d
    WHERE d.datname = 'zzdsj_demo'
    AND has_database_privilege('zzdsj_demo', d.datname, unnest(ARRAY['CONNECT', 'CREATE', 'TEMPORARY']))
) AS subquery
GROUP BY datname;

-- 检查Schema权限
SELECT
    nspname AS schema,
    array_agg(privilege_type) AS privileges
FROM (
    SELECT
        n.nspname,
        unnest(ARRAY['CREATE', 'USAGE']) AS privilege_type
    FROM pg_namespace n
    WHERE n.nspname = 'public'
    AND has_schema_privilege('zzdsj_demo', n.nspname, unnest(ARRAY['CREATE', 'USAGE']))
) AS subquery
GROUP BY nspname;

-- 检查扩展
\echo ''
\echo '已安装的扩展:'
SELECT extname AS extension_name, extversion AS version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector', 'btree_gin', 'pg_trgm')
ORDER BY extname;

\echo ''
\echo '✅ 权限和扩展修复完成！'
EOF
)

# 执行SQL脚本
echo -e "${BLUE}正在执行修复脚本...${NC}"
echo ""

# 尝试使用postgres用户
echo "$SQL_SCRIPT" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d "$DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ 修复成功！"
    echo "======================================${NC}"
    echo ""
    echo "现在可以重新运行导入脚本:"
    echo "  psql -h 127.0.0.1 -p 5432 -U zzdsj_demo -d zzdsj_demo -f postgresql/01_core_tables.sql"
else
    echo ""
    echo -e "${RED}======================================"
    echo "❌ 修复失败"
    echo "======================================${NC}"
    echo ""
    echo -e "${YELLOW}请手动执行以下操作:${NC}"
    echo ""
    echo "1. 使用超级用户连接数据库:"
    echo "   sudo -u postgres psql -d zzdsj_demo"
    echo ""
    echo "2. 执行以下SQL:"
    echo ""
    echo "$SQL_SCRIPT"
fi
