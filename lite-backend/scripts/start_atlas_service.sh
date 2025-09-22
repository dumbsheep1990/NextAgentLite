#!/bin/bash

# Atlas 向量可视化服务独立启动脚本
# 用于独立启动 Embedding Atlas 可视化服务

set -e

echo "🎯 Atlas 向量可视化服务独立启动脚本"
echo "=================================="
echo ""

# 颜色输出函数
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

# 检查是否在正确的目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📁 项目根目录: $PROJECT_ROOT"

if [[ ! -d "$PROJECT_ROOT/lite-backend" || ! -d "$PROJECT_ROOT/lite-qa" ]]; then
    print_error "请在NextAgentLite项目根目录下执行此脚本"
    exit 1
fi

cd "$PROJECT_ROOT"

# 检查 Atlas 目录
ATLAS_DIR="$PROJECT_ROOT/embedding-atlas"
if [[ ! -d "$ATLAS_DIR" ]]; then
    print_error "未找到 embedding-atlas 目录: $ATLAS_DIR"
    print_info "请先运行项目根目录的 quick_start_atlas.sh 完成 Atlas 安装"
    exit 1
fi

print_success "找到 Atlas 目录: $ATLAS_DIR"

# 检查 embedding-atlas CLI 是否可用
if ! command -v embedding-atlas &> /dev/null; then
    print_error "embedding-atlas CLI 未安装或未在PATH中"
    print_info "请先运行以下命令安装："
    echo "  cd $ATLAS_DIR"
    echo "  pip install -e packages/backend/"
    exit 1
fi

print_success "embedding-atlas CLI 已安装"

# 获取版本信息
ATLAS_VERSION=$(embedding-atlas --version 2>/dev/null || echo "已安装")
print_info "版本: $ATLAS_VERSION"

echo ""
echo "🔍 Atlas 服务启动选项"
echo "====================="
echo ""
echo "1. 使用测试数据启动 Atlas 服务"
echo "2. 使用自定义数据文件启动 Atlas 服务"
echo "3. 启动 Atlas Viewer Web 界面"
echo "4. 查看帮助信息"
echo ""

# 默认配置
DEFAULT_PORT=8099
DEFAULT_HOST="localhost"
ATLAS_DATA_FILE=""

# 读取用户选择
read -p "请选择启动方式 (1-4): " choice

case $choice in
    1)
        print_info "创建测试数据并启动服务..."
        
        # 创建测试数据文件
        cat > /tmp/atlas_test_data.csv << 'EOF'
id,text,category,embedding
1,智能体系统具有自主学习和决策能力,AI技术,"[0.1,0.2,0.3,0.4]"
2,机器学习算法在数据分析中发挥重要作用,机器学习,"[0.2,0.3,0.4,0.5]"
3,自然语言处理技术实现人机交互,NLP技术,"[0.3,0.4,0.5,0.6]"
4,深度学习网络模拟人脑神经结构,深度学习,"[0.4,0.5,0.6,0.7]"
5,计算机视觉让机器理解图像内容,计算机视觉,"[0.5,0.6,0.7,0.8]"
6,大语言模型推动AI技术发展,大模型,"[0.6,0.7,0.8,0.9]"
7,强化学习通过试错获得最优策略,强化学习,"[0.7,0.8,0.9,1.0]"
8,知识图谱构建结构化知识表示,知识图谱,"[0.8,0.9,1.0,0.1]"
9,多模态AI融合文本图像音频,多模态,"[0.9,1.0,0.1,0.2]"
10,边缘计算将AI推理部署到本地,边缘计算,"[1.0,0.1,0.2,0.3]"
EOF
        
        ATLAS_DATA_FILE="/tmp/atlas_test_data.csv"
        print_success "测试数据创建完成: $ATLAS_DATA_FILE"
        ;;
        
    2)
        echo ""
        read -p "请输入数据文件路径: " ATLAS_DATA_FILE
        
        if [[ ! -f "$ATLAS_DATA_FILE" ]]; then
            print_error "文件不存在: $ATLAS_DATA_FILE"
            exit 1
        fi
        
        print_success "将使用数据文件: $ATLAS_DATA_FILE"
        ;;
        
    3)
        print_info "启动 Atlas Viewer Web 界面..."
        
        # 检查viewer构建文件
        VIEWER_DIST_DIR="$ATLAS_DIR/packages/viewer/dist"
        if [[ ! -d "$VIEWER_DIST_DIR" ]]; then
            print_info "构建 Atlas Viewer..."
            
            cd "$ATLAS_DIR"
            npm install
            cd packages/viewer
            npm run build
            
            if [[ $? -ne 0 ]]; then
                print_error "Viewer 构建失败"
                exit 1
            fi
            
            cd "$PROJECT_ROOT"
        fi
        
        # 启动Web服务器
        cd "$VIEWER_DIST_DIR"
        print_success "启动 Atlas Viewer Web 界面..."
        print_info "访问地址: http://localhost:$DEFAULT_PORT"
        print_warning "按 Ctrl+C 停止服务"
        
        if command -v python3 &> /dev/null; then
            python3 -m http.server $DEFAULT_PORT
        elif command -v python &> /dev/null; then
            python -m http.server $DEFAULT_PORT
        else
            print_error "需要 Python 来启动 Web 服务器"
            exit 1
        fi
        exit 0
        ;;
        
    4)
        print_info "Atlas CLI 帮助信息:"
        embedding-atlas --help
        exit 0
        ;;
        
    *)
        print_error "无效选择，请输入 1-4"
        exit 1
        ;;
esac

# 获取自定义端口（如果需要）
echo ""
read -p "端口号 (默认 $DEFAULT_PORT): " custom_port
if [[ -n "$custom_port" ]]; then
    DEFAULT_PORT="$custom_port"
fi

# 检查端口是否被占用
if lsof -Pi :$DEFAULT_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "端口 $DEFAULT_PORT 已被占用"
    
    # 尝试找到占用进程
    PID=$(lsof -Pi :$DEFAULT_PORT -sTCP:LISTEN -t 2>/dev/null)
    if [[ -n "$PID" ]]; then
        print_info "占用进程PID: $PID"
        ps -p $PID -o pid,ppid,cmd 2>/dev/null || true
        
        echo ""
        read -p "是否终止占用进程? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "终止进程 $PID..."
            kill $PID 2>/dev/null || true
            sleep 2
        else
            print_info "将使用其他端口..."
            DEFAULT_PORT=$((DEFAULT_PORT + 1))
        fi
    fi
fi

# 启动 Atlas 服务
echo ""
print_success "🚀 启动 Atlas 向量可视化服务..."
echo "================================"
print_info "数据文件: $ATLAS_DATA_FILE"
print_info "服务地址: http://$DEFAULT_HOST:$DEFAULT_PORT"
print_info "文本字段: text"
print_warning "按 Ctrl+C 停止服务"
echo ""

# 构建启动命令
ATLAS_CMD="embedding-atlas \"$ATLAS_DATA_FILE\" --text text --port $DEFAULT_PORT --host $DEFAULT_HOST"

# 检查是否有分类字段
if grep -q "category" "$ATLAS_DATA_FILE" 2>/dev/null; then
    ATLAS_CMD="$ATLAS_CMD --color category"
    print_info "检测到分类字段，将按 category 着色"
fi

# 检查是否有embedding字段
if grep -q "embedding" "$ATLAS_DATA_FILE" 2>/dev/null; then
    ATLAS_CMD="$ATLAS_CMD --embedding embedding"
    print_info "检测到嵌入向量字段，将使用预计算向量"
fi

print_info "执行命令: $ATLAS_CMD"
echo ""

# 启动服务
eval $ATLAS_CMD

# 清理临时文件
if [[ "$ATLAS_DATA_FILE" == "/tmp/atlas_test_data.csv" ]]; then
    rm -f "$ATLAS_DATA_FILE"
    print_info "清理临时测试数据文件"
fi

print_success "Atlas 服务已停止"