#!/bin/bash

# Collection数据迁移和管理脚本
# 提供便捷的命令行界面执行Collection相关的迁移和验证操作

set -e  # 遇到错误时退出

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_ENV="${SCRIPT_DIR}/venv/bin/python"

# 如果虚拟环境不存在，使用系统Python
if [ ! -f "$PYTHON_ENV" ]; then
    PYTHON_ENV="python"
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示帮助信息
show_help() {
    echo "Collection数据迁移和管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  quick-setup           快速Collection设置（推荐用于开发环境）"
    echo "  full-migration        完整数据迁移（生产环境使用）" 
    echo "  dry-run              模拟迁移（不实际修改数据）"
    echo "  validate             验证Collection架构完整性"
    echo "  validate-fix         验证并自动修复问题"
    echo "  status               检查当前系统状态"
    echo "  help                 显示此帮助信息"
    echo ""
    echo "选项:"
    echo "  --force              强制重新创建默认Collection"
    echo "  --detailed           显示详细信息"
    echo ""
    echo "示例:"
    echo "  $0 quick-setup                    # 快速设置Collection架构"
    echo "  $0 dry-run                        # 模拟完整迁移过程"
    echo "  $0 full-migration --force         # 强制执行完整迁移"
    echo "  $0 validate --detailed            # 详细验证系统状态"
    echo "  $0 validate-fix                   # 验证并自动修复问题"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖环境..."
    
    # 检查Python
    if ! command -v $PYTHON_ENV &> /dev/null; then
        print_error "Python环境未找到，请确保Python已安装"
        exit 1
    fi
    
    # 检查脚本目录
    if [ ! -d "$SCRIPT_DIR/scripts" ]; then
        print_error "scripts目录未找到，请确保在正确的项目目录中执行"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 快速设置
quick_setup() {
    print_info "执行快速Collection设置..."
    cd "$SCRIPT_DIR"
    
    $PYTHON_ENV scripts/quick_collection_setup.py
    
    if [ $? -eq 0 ]; then
        print_success "快速设置完成"
        print_info "建议运行验证: $0 validate"
    else
        print_error "快速设置失败"
        exit 1
    fi
}

# 完整迁移
full_migration() {
    local force_flag=""
    
    if [ "$1" == "--force" ]; then
        force_flag="--force"
        print_warning "使用强制模式，将重新创建默认Collection"
    fi
    
    print_info "执行完整Collection数据迁移..."
    cd "$SCRIPT_DIR"
    
    $PYTHON_ENV scripts/create_default_collection_migration.py $force_flag
    
    if [ $? -eq 0 ]; then
        print_success "完整迁移完成"
        print_info "建议运行验证: $0 validate"
    else
        print_error "完整迁移失败"
        exit 1
    fi
}

# 模拟迁移
dry_run() {
    print_info "执行模拟迁移（不修改数据）..."
    cd "$SCRIPT_DIR"
    
    $PYTHON_ENV scripts/create_default_collection_migration.py --dry-run
    
    if [ $? -eq 0 ]; then
        print_success "模拟迁移完成"
        print_info "如果结果正常，可以执行: $0 full-migration"
    else
        print_error "模拟迁移失败"
        exit 1
    fi
}

# 验证架构
validate_architecture() {
    local detailed_flag=""
    local fix_flag=""
    
    if [ "$1" == "--detailed" ]; then
        detailed_flag="--detailed"
    elif [ "$1" == "--fix" ]; then
        fix_flag="--fix-issues"
    fi
    
    print_info "验证Collection架构完整性..."
    cd "$SCRIPT_DIR"
    
    $PYTHON_ENV scripts/validate_collection_integrity.py $detailed_flag $fix_flag
    
    if [ $? -eq 0 ]; then
        print_success "架构验证通过"
    else
        print_error "架构验证发现问题"
        exit 1
    fi
}

# 检查系统状态
check_status() {
    print_info "检查Collection系统状态..."
    cd "$SCRIPT_DIR"
    
    # 简单的状态检查
    $PYTHON_ENV -c "
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def check_status():
    try:
        from database.connection import get_db_connection
        db_pool = await get_db_connection()
        
        async with db_pool.acquire() as conn:
            # 检查Collection表
            table_exists = await conn.fetchval('''
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'knowledge_collections'
                )
            ''')
            
            if not table_exists:
                print('❌ knowledge_collections表不存在')
                return False
            
            # 统计基本信息
            collections = await conn.fetchval('SELECT COUNT(*) FROM knowledge_collections')
            documents = await conn.fetchval('SELECT COUNT(*) FROM knowledge_documents')
            chunks = await conn.fetchval('SELECT COUNT(*) FROM document_chunks')
            orphaned_docs = await conn.fetchval('SELECT COUNT(*) FROM knowledge_documents WHERE collection_id IS NULL')
            
            print(f'✅ Collection架构已存在')
            print(f'   • Collections: {collections} 个')
            print(f'   • 文档: {documents} 个')
            print(f'   • 文档块: {chunks} 个')
            print(f'   • 孤立文档: {orphaned_docs} 个')
            
            if orphaned_docs > 0:
                print(f'⚠️  发现 {orphaned_docs} 个孤立文档，建议运行迁移')
                return False
            
            return True
            
        await db_pool.close()
        
    except Exception as e:
        print(f'❌ 状态检查失败: {e}')
        return False

if asyncio.run(check_status()):
    sys.exit(0)
else:
    sys.exit(1)
"
    
    if [ $? -eq 0 ]; then
        print_success "系统状态正常"
    else
        print_warning "系统需要迁移或修复"
        print_info "建议执行: $0 quick-setup 或 $0 full-migration"
    fi
}

# 主逻辑
main() {
    case "$1" in
        "quick-setup")
            check_dependencies
            quick_setup
            ;;
        "full-migration")
            check_dependencies
            full_migration "$2"
            ;;
        "dry-run")
            check_dependencies
            dry_run
            ;;
        "validate")
            check_dependencies
            validate_architecture "$2"
            ;;
        "validate-fix")
            check_dependencies
            validate_architecture "--fix"
            ;;
        "status")
            check_dependencies
            check_status
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 确保脚本在正确的目录中执行
if [ ! -f "$SCRIPT_DIR/main.py" ]; then
    print_error "请在mat-backend目录中执行此脚本"
    exit 1
fi

# 执行主逻辑
main "$@"