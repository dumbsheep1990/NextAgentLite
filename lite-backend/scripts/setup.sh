#!/bin/bash
# 地聚物材料QA系统初始化脚本
# 用于快速部署和初始化系统

set -e  # 遇到错误立即退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

# 显示帮助信息
show_help() {
    echo "地聚物材料QA系统初始化脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  init           执行完整系统初始化"
    echo "  init-db        仅初始化数据库"
    echo "  init-es        仅初始化ElasticSearch"
    echo "  check          检查系统状态"
    echo "  status         查看迁移状态"
    echo "  repair-es      修复ElasticSearch索引"
    echo "  reset          重置系统（谨慎使用）"
    echo "  install-deps   安装Python依赖"
    echo ""
    echo "选项:"
    echo "  --force        强制重新初始化"
    echo "  --env ENV      指定运行环境 (dev/test/prod)"
    echo "  --skip-es      跳过ElasticSearch初始化"
    echo "  --help, -h     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init                    # 执行完整初始化"
    echo "  $0 init --force            # 强制重新初始化"
    echo "  $0 init --env prod         # 生产环境初始化"
    echo "  $0 init --skip-es          # 跳过ES初始化"
    echo "  $0 check                   # 检查系统状态"
    echo ""
}

# 检查Python环境
check_python() {
    log_info "检查Python环境..."
    
    if ! command -v python3 &> /dev/null; then
        log_error "未找到python3命令"
        return 1
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    log_info "Python版本: $PYTHON_VERSION"
    
    # 检查虚拟环境
    if [[ -n "$VIRTUAL_ENV" ]]; then
        log_success "已激活虚拟环境: $VIRTUAL_ENV"
    else
        log_warning "未检测到虚拟环境，建议使用虚拟环境"
    fi
    
    return 0
}

# 安装Python依赖
install_dependencies() {
    log_info "安装Python依赖..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -f "requirements.txt" ]]; then
        pip install -r requirements.txt
        log_success "依赖安装完成"
    else
        log_error "未找到requirements.txt文件"
        return 1
    fi
}

# 检查服务状态
check_services() {
    log_info "检查系统服务状态..."
    
    # 检查PostgreSQL
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            log_success "PostgreSQL服务正常"
        else
            log_error "PostgreSQL服务未运行"
        fi
    else
        log_warning "未安装PostgreSQL客户端工具"
    fi
    
    # 检查ElasticSearch
    if curl -s -f http://localhost:9200/_cluster/health &> /dev/null; then
        ES_STATUS=$(curl -s http://localhost:9200/_cluster/health | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")
        if [[ "$ES_STATUS" == "green" ]] || [[ "$ES_STATUS" == "yellow" ]]; then
            log_success "ElasticSearch服务正常 (状态: $ES_STATUS)"
        else
            log_error "ElasticSearch服务状态异常: $ES_STATUS"
        fi
    else
        log_error "ElasticSearch服务未运行或无法访问"
    fi
}

# 执行Python初始化脚本
run_python_init() {
    local args=("$@")
    
    cd "$PROJECT_ROOT"
    
    log_info "执行Python初始化脚本..."
    
    if python3 scripts/initialize_system.py "${args[@]}"; then
        log_success "初始化完成"
        return 0
    else
        log_error "初始化失败"
        return 1
    fi
}

# 检查系统状态
check_system_status() {
    log_info "检查系统完整状态..."
    
    check_python
    check_services
    
    cd "$PROJECT_ROOT"
    
    # 检查数据库迁移状态
    log_info "检查数据库迁移状态..."
    if python3 -c "
from migrations.migration_manager import MigrationManager
import asyncio
async def check():
    manager = MigrationManager()
    status = await manager.get_migration_status()
    print(f'数据库版本: {status[\"current_version\"]}')
    print(f'是否最新: {status[\"is_up_to_date\"]}')
asyncio.run(check())
" 2>/dev/null; then
        log_success "数据库状态检查完成"
    else
        log_warning "数据库状态检查失败"
    fi
    
    # 检查ES迁移状态
    log_info "检查ElasticSearch迁移状态..."
    if python3 -c "
from migrations.es_migration_manager import ESMigrationManager
manager = ESMigrationManager()
status = manager.get_migration_status()
print(f'ES版本: {status[\"current_version\"]}')
print(f'是否最新: {status[\"is_up_to_date\"]}')
" 2>/dev/null; then
        log_success "ElasticSearch状态检查完成"
    else
        log_warning "ElasticSearch状态检查失败"
    fi
}

# 显示迁移状态
show_migration_status() {
    log_info "获取详细迁移状态..."
    
    cd "$PROJECT_ROOT"
    
    echo ""
    echo "=== 数据库迁移状态 ==="
    python3 -c "
from migrations.migration_manager import MigrationManager
import asyncio
import json
async def show_status():
    manager = MigrationManager()
    status = await manager.get_migration_status()
    print(json.dumps(status, indent=2, ensure_ascii=False))
asyncio.run(show_status())
" 2>/dev/null || log_error "获取数据库状态失败"
    
    echo ""
    echo "=== ElasticSearch迁移状态 ==="
    python3 migrations/es_migration_manager.py status 2>/dev/null || log_error "获取ES状态失败"
}

# 修复ElasticSearch
repair_elasticsearch() {
    log_info "修复ElasticSearch索引..."
    
    cd "$PROJECT_ROOT"
    
    if python3 migrations/es_migration_manager.py repair; then
        log_success "ElasticSearch修复完成"
    else
        log_error "ElasticSearch修复失败"
        return 1
    fi
}

# 重置系统
reset_system() {
    log_warning "⚠️  这将删除所有数据库表和ElasticSearch索引！"
    read -p "确定要重置系统吗？输入 'yes' 确认: " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "取消重置操作"
        return 0
    fi
    
    log_info "开始重置系统..."
    
    cd "$PROJECT_ROOT"
    
    # 重置ES索引
    log_info "重置ElasticSearch索引..."
    if python3 migrations/es_migration_manager.py rollback 0.0.0; then
        log_success "ElasticSearch重置完成"
    else
        log_warning "ElasticSearch重置失败"
    fi
    
    # 重置数据库（需要手动实现）
    log_warning "数据库重置需要手动执行SQL脚本"
    
    log_success "系统重置完成"
}

# 解析命令行参数
COMMAND=""
PYTHON_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        init|init-db|init-es|check|status|repair-es|reset|install-deps)
            COMMAND="$1"
            shift
            ;;
        --force)
            PYTHON_ARGS+=("--force")
            shift
            ;;
        --env)
            PYTHON_ARGS+=("--env" "$2")
            shift 2
            ;;
        --skip-es)
            PYTHON_ARGS+=("--skip-es")
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行命令
case "$COMMAND" in
    "")
        log_error "请指定命令"
        show_help
        exit 1
        ;;
    init)
        check_python
        check_services
        run_python_init "${PYTHON_ARGS[@]}"
        ;;
    init-db)
        check_python
        run_python_init "${PYTHON_ARGS[@]}" --skip-es
        ;;
    init-es)
        check_python
        cd "$PROJECT_ROOT"
        python3 migrations/es_migration_manager.py migrate
        ;;
    check)
        check_system_status
        ;;
    status)
        show_migration_status
        ;;
    repair-es)
        repair_elasticsearch
        ;;
    reset)
        reset_system
        ;;
    install-deps)
        install_dependencies
        ;;
    *)
        log_error "未知命令: $COMMAND"
        show_help
        exit 1
        ;;
esac 