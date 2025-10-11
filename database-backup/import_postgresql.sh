#!/bin/bash
#################################################
# PostgreSQL数据库导入脚本
#
# 功能: 自动导入所有PostgreSQL结构和数据
# 使用: bash import_postgresql.sh
#################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-nextagent_lite}"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$SCRIPT_DIR/postgresql"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印标题
print_header() {
    echo ""
    echo "======================================"
    echo "$1"
    echo "======================================"
}

# 检查目录是否存在
if [ ! -d "$SQL_DIR" ]; then
    log_error "SQL目录不存在: $SQL_DIR"
    exit 1
fi

print_header "PostgreSQL 数据库导入"
log_info "目标数据库: $DB_HOST:$DB_PORT/$DB_NAME"
log_info "SQL文件目录: $SQL_DIR"
echo ""

# 读取密码
if [ -z "$PGPASSWORD" ]; then
    read -sp "请输入PostgreSQL密码: " PGPASSWORD
    echo ""
    export PGPASSWORD
fi

# 步骤1: 检查连接
print_header "步骤 1/5: 检查数据库连接"
log_info "正在测试连接到 $DB_HOST:$DB_PORT ..."

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "SELECT 1" > /dev/null 2>&1; then
    log_error "无法连接到PostgreSQL服务器"
    log_error "请检查: 1) 服务器是否运行 2) 主机地址和端口是否正确 3) 密码是否正确"
    exit 1
fi

log_success "数据库连接成功"

# 步骤2: 创建数据库
print_header "步骤 2/5: 创建数据库"
log_info "检查数据库 '$DB_NAME' 是否存在..."

# 检查数据库是否存在
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -t -c \
    "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | xargs)

if [ "$DB_EXISTS" = "1" ]; then
    log_warning "数据库 '$DB_NAME' 已存在"
    read -p "是否要删除并重建数据库? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "正在删除数据库..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
            -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
            -c "CREATE DATABASE $DB_NAME;"
        log_success "数据库重建成功"
    else
        log_warning "将在现有数据库上执行导入（可能会有冲突）"
    fi
else
    log_info "正在创建数据库 '$DB_NAME' ..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        -c "CREATE DATABASE $DB_NAME;"
    log_success "数据库创建成功"
fi

# 步骤3: 创建扩展
print_header "步骤 3/5: 创建PostgreSQL扩展"

EXTENSIONS=(
    "vector"
    "uuid-ossp"
    "btree_gin"
    "pg_trgm"
)

EXTENSION_SUCCESS=0
EXTENSION_FAILED=0

for ext in "${EXTENSIONS[@]}"; do
    log_info "创建扩展: $ext"

    # 临时禁用set -e，避免扩展创建失败时立即退出
    set +e
    EXT_OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" 2>&1)
    EXT_RESULT=$?
    set -e

    if [ $EXT_RESULT -eq 0 ]; then
        log_success "扩展 $ext 创建成功"
        EXTENSION_SUCCESS=$((EXTENSION_SUCCESS + 1))
    else
        log_error "扩展 $ext 创建失败"
        if [ "$ext" = "vector" ]; then
            log_error "pgvector扩展未安装！请先安装pgvector："
            log_error "  Ubuntu: sudo apt install postgresql-17-pgvector"
            log_error "  macOS: brew install pgvector"
            log_error "  或从源码编译: https://github.com/pgvector/pgvector"
            echo ""
            echo "错误信息: $EXT_OUTPUT"
            exit 1
        else
            log_warning "扩展创建失败，但将继续执行"
            EXTENSION_FAILED=$((EXTENSION_FAILED + 1))
        fi
    fi
done

echo ""
log_info "扩展创建完成: 成功 $EXTENSION_SUCCESS 个, 失败 $EXTENSION_FAILED 个"

# 步骤4: 导入SQL文件
print_header "步骤 4/5: 导入SQL文件"

# SQL文件列表（按执行顺序）
SQL_FILES=(
    "01_core_tables.sql"
    "02_knowledge_tables.sql"
    "03_team_tables.sql"
    "04_system_tables.sql"
    "05_graph_tables.sql"
    "06_remaining_tables_and_views.sql"
    "07_indexes_and_constraints.sql"
    "08_initialization_data.sql"
)

TOTAL_FILES=${#SQL_FILES[@]}
CURRENT=0
SUCCEEDED=0
FAILED=0

for file in "${SQL_FILES[@]}"; do
    CURRENT=$((CURRENT + 1))
    filepath="$SQL_DIR/$file"

    echo ""
    log_info "[$CURRENT/$TOTAL_FILES] 正在导入: $file"

    if [ ! -f "$filepath" ]; then
        log_warning "文件不存在，跳过: $file"
        FAILED=$((FAILED + 1))
        continue
    fi

    # 执行SQL文件，捕获输出（临时禁用set -e）
    set +e
    OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -f "$filepath" 2>&1)
    SQL_RESULT=$?
    set -e

    if [ $SQL_RESULT -eq 0 ]; then
        log_success "$file 导入成功"
        SUCCEEDED=$((SUCCEEDED + 1))
    else
        log_error "$file 导入失败"
        echo ""
        echo "错误详情:"
        echo "----------------------------------------"
        echo "$OUTPUT" | head -20
        echo "----------------------------------------"
        echo ""

        FAILED=$((FAILED + 1))

        # 询问是否继续
        read -p "是否继续导入下一个文件? (Y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            log_error "导入已中止"
            exit 1
        fi
    fi
done

# 步骤5: 验证导入结果
print_header "步骤 5/5: 验证导入结果"

# 统计表数量
log_info "正在统计数据库对象..."
echo ""

# 表统计
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" | xargs)

# 视图统计
VIEW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public';" | xargs)

# 索引统计
INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';" | xargs)

# 扩展统计
EXTENSION_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM pg_extension;" | xargs)

echo "数据库对象统计:"
echo "  - 数据表: $TABLE_COUNT 个"
echo "  - 视图: $VIEW_COUNT 个"
echo "  - 索引: $INDEX_COUNT 个"
echo "  - 扩展: $EXTENSION_COUNT 个"
echo ""

# 列出所有表
log_info "已创建的表列表:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "\dt" 2>/dev/null | grep "^ public" || echo "  （无法列出表）"

echo ""

# 检查关键表
log_info "检查关键表..."
KEY_TABLES=(
    "users"
    "conversations"
    "knowledge_documents"
    "document_chunks"
    "agent_configs"
    "team_executions"
)

ALL_EXIST=true
for table in "${KEY_TABLES[@]}"; do
    EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$table';" | xargs)

    if [ "$EXISTS" = "1" ]; then
        echo "  ✓ $table"
    else
        echo "  ✗ $table (不存在)"
        ALL_EXIST=false
    fi
done

echo ""

# 清除密码环境变量
unset PGPASSWORD

# 最终总结
print_header "导入完成"

echo "导入统计:"
echo "  - 成功: $SUCCEEDED 个文件"
echo "  - 失败: $FAILED 个文件"
echo "  - 总计: $TOTAL_FILES 个文件"
echo ""

if [ $FAILED -eq 0 ] && [ "$ALL_EXIST" = true ]; then
    log_success "✅ 所有SQL文件导入成功！"
    log_success "✅ 所有关键表已创建！"
    echo ""
    log_info "下一步操作:"
    log_info "  1. 启动后端服务: cd ../lite-backend && python main.py"
    log_info "  2. 启动前端服务: cd ../lite-qa && npm run dev"
    log_info "  3. 访问应用: http://localhost:5173"
    exit 0
else
    log_warning "⚠️  部分文件导入失败或关键表缺失"
    log_warning "请检查错误信息并手动修复"
    exit 1
fi
