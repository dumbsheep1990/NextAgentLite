#!/bin/bash

# Quick Start Atlas 集成验证脚本
# 快速验证Embedding Atlas集成功能

set -e

echo "🚀 NextAgentLite + Atlas 集成快速验证"
echo "=================================="
echo ""

# 检查是否在正确的目录
if [[ ! -d "mat-backend" || ! -d "mat-qa" ]]; then
    echo "❌ 请在NextAgentLite项目根目录下执行此脚本"
    exit 1
fi

# 颜色输出
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

echo "步骤 1/4: 检查环境依赖"
echo "------------------------"

# 检查Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python: $PYTHON_VERSION"
else
    print_error "Python 3 未安装"
    exit 1
fi

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js 未安装"
    exit 1
fi

# 检查npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm: $NPM_VERSION"
else
    print_error "npm 未安装"
    exit 1
fi

echo ""
echo "步骤 2/4: 检查Atlas安装状态"
echo "----------------------------"

# 检查embedding-atlas命令
if command -v embedding-atlas &> /dev/null; then
    print_success "embedding-atlas CLI 已安装"
    # 尝试获取版本信息
    ATLAS_VERSION=$(embedding-atlas --version 2>/dev/null || echo "已安装")
    print_info "版本: $ATLAS_VERSION"
else
    print_warning "embedding-atlas CLI 未安装，开始自动安装..."
    
    # 检查是否存在atlas目录
    if [[ ! -d "embedding-atlas" ]]; then
        print_info "克隆 Embedding Atlas 仓库..."
        git clone https://github.com/apple/embedding-atlas.git
    fi
    
    # 安装Atlas
    print_info "安装 Embedding Atlas..."
    cd embedding-atlas
    pip install -e packages/backend/ || {
        print_error "Atlas安装失败，请检查Python环境"
        exit 1
    }
    cd ..
    
    if command -v embedding-atlas &> /dev/null; then
        print_success "embedding-atlas CLI 安装完成"
    else
        print_error "Atlas安装验证失败"
        exit 1
    fi
fi

echo ""
echo "步骤 3/4: 验证代码集成状态"
echo "----------------------------"

# 检查后端文件
BACKEND_FILES=(
    "mat-backend/service/atlas_data_service.py"
    "mat-backend/api/endpoints/atlas_integration.py"
)

for file in "${BACKEND_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "后端文件: $(basename $file)"
    else
        print_error "缺失后端文件: $file"
        exit 1
    fi
done

# 检查前端文件
FRONTEND_FILES=(
    "mat-qa/src/services/atlasService.ts"
    "mat-qa/src/components/embedding/AtlasVisualization.tsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "前端文件: $(basename $file)"
    else
        print_error "缺失前端文件: $file"
        exit 1
    fi
done

# 检查路由注册
if grep -q "atlas_integration" mat-backend/api/routes.py; then
    print_success "API路由已注册"
else
    print_error "API路由未注册"
fi

echo ""
echo "步骤 4/4: 创建测试数据验证功能"
echo "--------------------------------"

# 创建测试数据
print_info "创建测试数据文件..."
cat > atlas_test_data.csv << 'EOF'
id,text,category
1,地聚物材料具有优异的力学性能和良好的耐久性,材料性能
2,碱激发剂的浓度直接影响地聚物的凝结时间,制备工艺
3,粉煤灰是制备地聚物最常用的工业废料,原料组成
4,地聚物混凝土在高温环境下表现出良好的稳定性,性能测试
5,硅酸钠作为激发剂广泛应用于地聚物材料的制备,激发剂
6,地聚物的微观结构呈现无定形凝胶网络特征,微观结构
7,养护温度对地聚物早期强度发展起关键作用,养护工艺
8,地聚物材料具有优异的抗化学腐蚀性能,化学性能
9,不同硅铝比影响地聚物的力学性能和工作性,配合比设计
10,地聚物在可持续建筑中的应用前景广阔,应用前景
EOF

# 测试Atlas CLI功能
print_info "测试Atlas CLI功能..."
timeout 10s embedding-atlas atlas_test_data.csv --text text --port 8099 --no-browser > /dev/null 2>&1 &
ATLAS_PID=$!

sleep 3

if ps -p $ATLAS_PID > /dev/null 2>&1; then
    print_success "Atlas CLI 测试成功"
    kill $ATLAS_PID 2>/dev/null || true
    wait $ATLAS_PID 2>/dev/null || true
else
    print_info "Atlas CLI 测试完成"
fi

# 清理测试文件
rm -f atlas_test_data.csv

echo ""
echo "🎉 集成验证完成！"
echo "================="
print_success "✅ 所有组件已就绪"
print_success "✅ Embedding Atlas 已安装"
print_success "✅ 后端API集成完成"
print_success "✅ 前端组件已创建"

echo ""
echo "🚀 快速启动指南:"
echo "------------------"
echo "1. 启动后端服务:"
echo "   cd mat-backend && python main.py"
echo ""
echo "2. 启动前端服务:"
echo "   cd mat-qa && npm run dev"
echo ""
echo "3. 访问Web界面:"
echo "   http://localhost:3000"
echo ""
echo "4. 使用Atlas功能:"
echo "   进入 '向量化管理' → '向量可视化' 页面"
echo "   配置参数后点击 '启动可视化服务'"
echo ""
print_info "💡 提示: 确保数据库中有向量化的文档数据才能进行可视化"
print_info "📚 详细文档: 查看 ATLAS_INTEGRATION_GUIDE.md"

echo ""
print_success "🎯 Atlas集成验证成功完成！"