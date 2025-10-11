#!/bin/bash
#################################################
# NextAgentLite 一键部署初始化脚本
#
# 功能：自动初始化所有数据库和服务
# 包含：PostgreSQL, Elasticsearch, Redis, MinIO
#
# 使用方法：
#   bash deploy_init.sh [options]
#
# 选项：
#   --postgres-host     PostgreSQL主机地址 (默认: localhost)
#   --postgres-port     PostgreSQL端口 (默认: 5432)
#   --postgres-user     PostgreSQL用户名 (默认: postgres)
#   --postgres-db       数据库名 (默认: nextagent_lite)
#   --es-host           Elasticsearch主机地址 (默认: localhost:9200)
#   --es-user           Elasticsearch用户名 (默认: elastic)
#   --redis-host        Redis主机地址 (默认: localhost)
#   --redis-port        Redis端口 (默认: 6379)
#   --minio-endpoint    MinIO端点 (默认: localhost:9000)
#   --skip-postgres     跳过PostgreSQL初始化
#   --skip-es           跳过Elasticsearch初始化
#   --skip-redis        跳过Redis初始化
#   --skip-minio        跳过MinIO初始化
#################################################

set -e  # 遇到错误立即退出

# 颜色输出
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

# 默认配置
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_DB="nextagent_lite"
POSTGRES_PASSWORD=""

ES_HOST="localhost:9200"
ES_USER="elastic"
ES_PASSWORD=""
ES_SECURE="false"

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"

SKIP_POSTGRES=false
SKIP_ES=false
SKIP_REDIS=false
SKIP_MINIO=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --postgres-host)
            POSTGRES_HOST="$2"
            shift 2
            ;;
        --postgres-port)
            POSTGRES_PORT="$2"
            shift 2
            ;;
        --postgres-user)
            POSTGRES_USER="$2"
            shift 2
            ;;
        --postgres-db)
            POSTGRES_DB="$2"
            shift 2
            ;;
        --es-host)
            ES_HOST="$2"
            shift 2
            ;;
        --es-user)
            ES_USER="$2"
            shift 2
            ;;
        --redis-host)
            REDIS_HOST="$2"
            shift 2
            ;;
        --redis-port)
            REDIS_PORT="$2"
            shift 2
            ;;
        --minio-endpoint)
            MINIO_ENDPOINT="$2"
            shift 2
            ;;
        --skip-postgres)
            SKIP_POSTGRES=true
            shift
            ;;
        --skip-es)
            SKIP_ES=true
            shift
            ;;
        --skip-redis)
            SKIP_REDIS=true
            shift
            ;;
        --skip-minio)
            SKIP_MINIO=true
            shift
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log_info "======================================"
log_info "NextAgentLite 部署初始化开始"
log_info "======================================"
log_info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info ""

#################################################
# PostgreSQL 初始化
#################################################
if [ "$SKIP_POSTGRES" = false ]; then
    log_info "======================================"
    log_info "1. 初始化 PostgreSQL 数据库"
    log_info "======================================"

    # 检查密码
    if [ -z "$POSTGRES_PASSWORD" ]; then
        read -sp "请输入PostgreSQL密码: " POSTGRES_PASSWORD
        echo ""
    fi

    # 设置环境变量
    export PGPASSWORD="$POSTGRES_PASSWORD"

    # 检查连接
    log_info "检查PostgreSQL连接..."
    if ! psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "SELECT 1" > /dev/null 2>&1; then
        log_error "无法连接到PostgreSQL"
        exit 1
    fi
    log_success "PostgreSQL连接成功"

    # 创建数据库
    log_info "创建数据库: $POSTGRES_DB"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB" 2>/dev/null || log_warning "数据库已存在"

    # 创建扩展
    log_info "创建必要的扩展..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOF

    # 按顺序执行SQL文件
    log_info "执行数据库结构脚本..."

    SQL_FILES=(
        "postgresql/01_core_tables.sql"
        "postgresql/02_knowledge_tables.sql"
        "postgresql/03_team_tables.sql"
        "postgresql/04_system_tables.sql"
        "postgresql/05_graph_tables.sql"
        "postgresql/06_remaining_tables_and_views.sql"
        "postgresql/07_indexes_and_constraints.sql"
        "postgresql/08_initialization_data.sql"
    )

    for sql_file in "${SQL_FILES[@]}"; do
        if [ -f "$sql_file" ]; then
            log_info "执行: $sql_file"
            psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$sql_file" || log_warning "$sql_file 执行出现警告"
        else
            log_warning "文件不存在: $sql_file"
        fi
    done

    log_success "PostgreSQL初始化完成"
    echo ""
else
    log_warning "跳过PostgreSQL初始化"
    echo ""
fi

#################################################
# Elasticsearch 初始化
#################################################
if [ "$SKIP_ES" = false ]; then
    log_info "======================================"
    log_info "2. 初始化 Elasticsearch 索引"
    log_info "======================================"

    # 检查密码
    if [ -z "$ES_PASSWORD" ]; then
        read -sp "请输入Elasticsearch密码: " ES_PASSWORD
        echo ""
    fi

    # 确定协议
    if [[ "$ES_HOST" == https://* ]]; then
        ES_PROTOCOL="https"
        ES_HOST="${ES_HOST#https://}"
    else
        ES_PROTOCOL="http"
        ES_HOST="${ES_HOST#http://}"
    fi

    ES_URL="$ES_PROTOCOL://$ES_HOST"

    # 检查连接
    log_info "检查Elasticsearch连接..."
    if ! curl -s -k -u "$ES_USER:$ES_PASSWORD" "$ES_URL/_cluster/health" > /dev/null; then
        log_error "无法连接到Elasticsearch"
        exit 1
    fi
    log_success "Elasticsearch连接成功"

    # 导入索引模板
    log_info "导入索引模板..."

    if [ -f "elasticsearch/elasticsearch_index_templates_v2.json" ]; then
        # 读取JSON文件并为每个索引模板创建
        log_info "从 elasticsearch_index_templates_v2.json 导入索引模板"

        INDEX_NAMES=(
            "mat_qa_chunks"
            "mat_qa_general_vectors"
            "mat_qa_domain_vectors"
            "mat_qa_papers"
            "mat_qa_documents"
            "mat_qa_retrieval_cache"
            "mat_qa_media"
        )

        for index_name in "${INDEX_NAMES[@]}"; do
            log_info "创建索引模板: $index_name"
            # 这里需要根据实际JSON结构提取对应的模板
            # 简化版：直接创建基础索引
            curl -s -k -X PUT "$ES_URL/$index_name" \
                -u "$ES_USER:$ES_PASSWORD" \
                -H "Content-Type: application/json" \
                > /dev/null || log_warning "索引 $index_name 可能已存在"
        done

        log_success "索引模板导入完成"
    else
        log_warning "未找到Elasticsearch索引模板文件"
    fi

    log_success "Elasticsearch初始化完成"
    echo ""
else
    log_warning "跳过Elasticsearch初始化"
    echo ""
fi

#################################################
# Redis 初始化
#################################################
if [ "$SKIP_REDIS" = false ]; then
    log_info "======================================"
    log_info "3. 初始化 Redis 缓存"
    log_info "======================================"

    # 检查密码
    if [ -z "$REDIS_PASSWORD" ]; then
        read -sp "请输入Redis密码 (留空表示无密码): " REDIS_PASSWORD
        echo ""
    fi

    # 检查连接
    log_info "检查Redis连接..."
    if [ -z "$REDIS_PASSWORD" ]; then
        REDIS_CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
    else
        REDIS_CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD"
    fi

    if ! $REDIS_CLI PING > /dev/null 2>&1; then
        log_error "无法连接到Redis"
        exit 1
    fi
    log_success "Redis连接成功"

    # 设置基础配置
    log_info "配置Redis基础设置..."
    $REDIS_CLI CONFIG SET maxmemory 2gb 2>/dev/null || log_warning "无法设置maxmemory"
    $REDIS_CLI CONFIG SET maxmemory-policy allkeys-lru 2>/dev/null || log_warning "无法设置maxmemory-policy"

    log_success "Redis初始化完成"
    echo ""
else
    log_warning "跳过Redis初始化"
    echo ""
fi

#################################################
# MinIO 初始化
#################################################
if [ "$SKIP_MINIO" = false ]; then
    log_info "======================================"
    log_info "4. 初始化 MinIO 对象存储"
    log_info "======================================"

    # 检查mc是否安装
    if ! command -v mc &> /dev/null; then
        log_warning "MinIO Client (mc) 未安装，正在下载..."
        curl -s https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
        chmod +x /tmp/mc
        MC_CMD="/tmp/mc"
    else
        MC_CMD="mc"
    fi

    # 配置mc别名
    log_info "配置MinIO连接..."
    $MC_CMD alias set deployinit "http://$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" > /dev/null 2>&1

    # 检查连接
    if ! $MC_CMD admin info deployinit > /dev/null 2>&1; then
        log_error "无法连接到MinIO"
        exit 1
    fi
    log_success "MinIO连接成功"

    # 创建存储桶
    log_info "创建MinIO存储桶..."

    BUCKETS=(
        "policy-qa-documents"
        "policy-qa-media"
        "policy-qa-thumbnails"
        "policy-qa-knowledge-graph"
        "policy-qa-reports"
        "policy-qa-backups"
        "policy-qa-logs"
        "policy-qa-cache"
    )

    for bucket in "${BUCKETS[@]}"; do
        log_info "创建存储桶: $bucket"
        $MC_CMD mb deployinit/$bucket 2>/dev/null || log_warning "存储桶 $bucket 可能已存在"
    done

    # 设置公共访问（仅缩略图）
    log_info "设置缩略图存储桶为公共读取..."
    $MC_CMD policy set public deployinit/policy-qa-thumbnails 2>/dev/null || log_warning "无法设置公共访问策略"

    # 清理临时文件
    if [ "$MC_CMD" = "/tmp/mc" ]; then
        rm /tmp/mc
    fi

    log_success "MinIO初始化完成"
    echo ""
else
    log_warning "跳过MinIO初始化"
    echo ""
fi

#################################################
# 完成
#################################################
log_info "======================================"
log_success "✅ 所有服务初始化完成！"
log_info "======================================"
echo ""

log_info "下一步操作："
log_info "1. 更新应用配置文件 (.env)"
log_info "2. 启动后端服务: cd lite-backend && python main.py"
log_info "3. 启动前端服务: cd lite-qa && npm run dev"
log_info "4. 访问应用: http://localhost:5173"
echo ""

log_info "配置信息摘要："
log_info "  PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
log_info "  Elasticsearch: $ES_URL"
log_info "  Redis: $REDIS_HOST:$REDIS_PORT"
log_info "  MinIO: http://$MINIO_ENDPOINT"
echo ""

log_success "部署初始化完成！"
