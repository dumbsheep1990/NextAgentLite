#!/bin/bash
# Team系统启动脚本
# 自动化启动后端和前端服务

set -e

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

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_ROOT="$(cd "$PROJECT_ROOT/../mat-qa" && pwd)"

echo -e "${BLUE}🚀 Team系统启动脚本${NC}"
echo "========================================"

# 检查必要的服务
check_services() {
    log_info "检查系统服务..."
    
    # 检查PostgreSQL
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            log_success "PostgreSQL 服务正常"
        else
            log_warning "PostgreSQL 服务未运行"
            echo "  请运行: sudo systemctl start postgresql"
            echo "  或: brew services start postgresql (macOS)"
        fi
    else
        log_warning "PostgreSQL 客户端工具未安装"
    fi
    
    # 检查ElasticSearch
    if curl -s -f http://localhost:9200/_cluster/health &> /dev/null; then
        log_success "ElasticSearch 服务正常"
    else
        log_warning "ElasticSearch 服务未运行"
        echo "  请运行: sudo systemctl start elasticsearch"
        echo "  或: brew services start elasticsearch (macOS)"
    fi
    
    # 检查Redis (可选)
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            log_success "Redis 服务正常"
        else
            log_warning "Redis 服务未运行 (可选)"
        fi
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd "$PROJECT_ROOT"
    
    # 检查Python环境
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi
    
    # 检查虚拟环境
    if [[ -n "$VIRTUAL_ENV" ]]; then
        log_success "已激活虚拟环境: $VIRTUAL_ENV"
    else
        log_warning "未检测到虚拟环境，建议使用虚拟环境"
    fi
    
    # 安装依赖
    log_info "安装Python依赖..."
    pip install -r requirements.txt > /dev/null 2>&1
    log_success "依赖安装完成"
    
    # 检查配置文件
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "已从 env.example 创建 .env 文件，请检查配置"
        else
            log_error "未找到配置文件"
            exit 1
        fi
    fi
    
    # 系统初始化
    log_info "执行系统初始化..."
    if ./scripts/setup.sh init > /dev/null 2>&1; then
        log_success "系统初始化完成"
    else
        log_warning "系统初始化失败，但继续启动"
    fi
    
    # 启动后端服务
    log_info "启动FastAPI应用..."
    echo -e "${YELLOW}后端服务将在 http://localhost:8000 启动${NC}"
    echo -e "${YELLOW}API文档: http://localhost:8000/docs${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
    echo ""
    
    # 使用nohup在后台启动
    nohup python main.py > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    
    # 等待服务启动
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -s -f http://localhost:8000/health &> /dev/null; then
            log_success "后端服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi
        sleep 1
    done
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    cd "$FRONTEND_ROOT"
    
    # 检查Node.js环境
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm install > /dev/null 2>&1
    log_success "前端依赖安装完成"
    
    # 启动前端服务
    log_info "启动前端开发服务器..."
    echo -e "${YELLOW}前端服务将在 http://localhost:5173 启动${NC}"
    echo -e "${YELLOW}Team页面: http://localhost:5173/team${NC}"
    echo -e "${YELLOW}LangDB监控: http://localhost:5173/langdb-monitor${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
    echo ""
    
    # 使用nohup在后台启动
    nohup npm run dev > ../mat-backend/logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../mat-backend/.frontend.pid
    
    # 等待服务启动
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -s -f http://localhost:5173 &> /dev/null; then
            log_success "前端服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "前端服务启动可能较慢，请手动检查"
            break
        fi
        sleep 1
    done
}

# 运行测试
run_tests() {
    log_info "运行Team功能测试..."
    
    cd "$PROJECT_ROOT"
    
    if python scripts/test_team_functionality.py; then
        log_success "Team功能测试通过"
    else
        log_warning "Team功能测试失败，请检查服务状态"
    fi
}

# 显示服务状态
show_status() {
    echo ""
    echo -e "${BLUE}📊 服务状态${NC}"
    echo "========================================"
    
    # 后端状态
    if curl -s -f http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✅ 后端服务: http://localhost:8000${NC}"
    else
        echo -e "${RED}❌ 后端服务: 未运行${NC}"
    fi
    
    # 前端状态
    if curl -s -f http://localhost:5173 &> /dev/null; then
        echo -e "${GREEN}✅ 前端服务: http://localhost:5173${NC}"
    else
        echo -e "${RED}❌ 前端服务: 未运行${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 重要链接${NC}"
    echo "========================================"
    echo -e "${YELLOW}Team页面: http://localhost:5173/team${NC}"
    echo -e "${YELLOW}LangDB监控: http://localhost:5173/langdb-monitor${NC}"
    echo -e "${YELLOW}API文档: http://localhost:8000/docs${NC}"
    echo -e "${YELLOW}系统信息: http://localhost:8000/info${NC}"
    echo ""
    echo -e "${BLUE}📝 日志文件${NC}"
    echo "========================================"
    echo -e "${YELLOW}后端日志: $PROJECT_ROOT/logs/backend.log${NC}"
    echo -e "${YELLOW}前端日志: $PROJECT_ROOT/logs/frontend.log${NC}"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    cd "$PROJECT_ROOT"
    
    # 停止后端
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            log_success "后端服务已停止"
        fi
        rm -f .backend.pid
    fi
    
    # 停止前端
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            log_success "前端服务已停止"
        fi
        rm -f .frontend.pid
    fi
}

# 清理函数
cleanup() {
    log_info "清理资源..."
    stop_services
}

# 设置信号处理
trap cleanup EXIT INT TERM

# 主函数
main() {
    case "${1:-start}" in
        "start")
            check_services
            start_backend
            start_frontend
            run_tests
            show_status
            log_success "Team系统启动完成！"
            ;;
        "stop")
            stop_services
            log_success "Team系统已停止"
            ;;
        "restart")
            stop_services
            sleep 2
            check_services
            start_backend
            start_frontend
            run_tests
            show_status
            log_success "Team系统重启完成！"
            ;;
        "status")
            show_status
            ;;
        "test")
            run_tests
            ;;
        *)
            echo "用法: $0 [start|stop|restart|status|test]"
            echo ""
            echo "命令:"
            echo "  start   启动Team系统 (默认)"
            echo "  stop    停止Team系统"
            echo "  restart 重启Team系统"
            echo "  status  显示服务状态"
            echo "  test    运行功能测试"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 