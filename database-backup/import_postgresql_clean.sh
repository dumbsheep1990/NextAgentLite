#!/bin/bash

################################################################################
# PostgreSQL 数据库导入脚本 - 真实数据版本
# 功能: 从 complete_dump.sql 导入完整的数据库结构和数据
# 数据源: localhost:5434/zzdsj_demo (真实数据，无示例数据)
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 显示标题
echo "======================================================================"
echo "  PostgreSQL 数据库导入工具 - 真实数据版本"
echo "======================================================================"
echo ""

# 步骤1: 读取数据库连接信息
log_info "请输入目标数据库连接信息："
echo ""

read -p "数据库主机 [127.0.0.1]: " DB_HOST
DB_HOST=${DB_HOST:-127.0.0.1}

read -p "数据库端口 [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "数据库名称 [zzdsj_demo]: " DB_NAME
DB_NAME=${DB_NAME:-zzdsj_demo}

read -p "数据库用户 [zzdsj_demo]: " DB_USER
DB_USER=${DB_USER:-zzdsj_demo}

read -sp "数据库密码: " DB_PASSWORD
echo ""
echo ""

export PGPASSWORD="$DB_PASSWORD"

# 步骤2: 测试数据库连接
log_info "测试数据库连接..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    log_success "数据库连接成功"
else
    log_error "无法连接到数据库，请检查连接信息"
    exit 1
fi

# 步骤3: 检查数据库是否存在
log_info "检查数据库 $DB_NAME 是否存在..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    log_warning "数据库 $DB_NAME 已存在"
    read -p "是否删除现有数据库并重新创建? (yes/no) [no]: " DROP_DB
    if [ "$DROP_DB" = "yes" ]; then
        log_info "删除现有数据库..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        log_success "数据库已删除"

        log_info "创建新数据库..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME ENCODING 'UTF8';"
        log_success "数据库已创建"
    else
        log_info "将在现有数据库中导入数据"
    fi
else
    log_info "创建数据库 $DB_NAME ..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME ENCODING 'UTF8';"
    log_success "数据库已创建"
fi

# 步骤4: 安装必要的扩展
log_info "安装必要的PostgreSQL扩展..."

EXTENSIONS=("vector" "uuid-ossp" "btree_gin" "pg_trgm")

for ext in "${EXTENSIONS[@]}"; do
    log_info "正在安装扩展: $ext"
    set +e
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" > /dev/null 2>&1
    EXT_RESULT=$?
    set -e

    if [ $EXT_RESULT -eq 0 ]; then
        log_success "扩展 $ext 安装成功"
    else
        log_error "扩展 $ext 安装失败，可能影响后续功能"
    fi
done

# 步骤5: 导入完整数据库
log_info "准备导入数据库..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/postgresql/complete_dump.sql"

if [ ! -f "$SQL_FILE" ]; then
    log_error "找不到SQL文件: $SQL_FILE"
    exit 1
fi

log_info "SQL文件路径: $SQL_FILE"
log_info "SQL文件大小: $(du -h "$SQL_FILE" | cut -f1)"
echo ""

read -p "开始导入? (yes/no) [yes]: " START_IMPORT
START_IMPORT=${START_IMPORT:-yes}

if [ "$START_IMPORT" != "yes" ]; then
    log_warning "用户取消导入"
    exit 0
fi

log_info "开始导入数据库..."
log_info "这可能需要几分钟时间，请耐心等待..."
echo ""

# 导入数据
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" 2>&1 | tee /tmp/pg_import.log; then
    log_success "数据库导入完成"
else
    log_error "数据库导入过程中出现错误，请检查日志: /tmp/pg_import.log"
    exit 1
fi

# 步骤6: 验证导入结果
log_info "验证导入结果..."
echo ""

log_info "检查表数量..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
log_success "共导入 $TABLE_COUNT 个表"

log_info "检查关键表的数据..."

# 检查几个关键表
TABLES=("users" "knowledge_documents" "conversations" "agent_configs")

for table in "${TABLES[@]}"; do
    # 检查表是否存在
    TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='$table');")

    if [ "$TABLE_EXISTS" = "t" ]; then
        ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM $table;")
        log_success "表 $table: $ROW_COUNT 条记录"
    else
        log_warning "表 $table 不存在"
    fi
done

# 步骤7: 完成
echo ""
echo "======================================================================"
log_success "数据库导入完成！"
echo "======================================================================"
echo ""
log_info "数据库连接信息："
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"
echo ""
log_info "导入的是从 localhost:5434/zzdsj_demo 导出的真实数据"
log_info "不包含任何硬编码的示例数据"
echo ""

# 清理环境变量
unset PGPASSWORD
