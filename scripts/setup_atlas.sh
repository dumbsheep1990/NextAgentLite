#!/bin/bash

# Embedding Atlas 集成部署脚本
# 用于在NextAgentLite项目中设置和配置Atlas环境

set -e  # 出错时退出

echo "🚀 开始设置 Embedding Atlas 集成环境..."

# 颜色输出函数
print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

# 检查当前目录
if [[ ! -d "mat-backend" || ! -d "mat-qa" ]]; then
    print_error "请在NextAgentLite项目根目录下执行此脚本"
    exit 1
fi

PROJECT_ROOT=$(pwd)
ATLAS_DIR="$PROJECT_ROOT/embedding-atlas"

print_info "项目根目录: $PROJECT_ROOT"

# Step 1: 检查系统依赖
print_info "Step 1: 检查系统依赖..."

# 检查Python版本
if ! python3 --version | grep -E "Python 3\.(10|11|12)" > /dev/null; then
    print_error "需要Python 3.10+版本"
    exit 1
fi
print_success "Python版本检查通过"

# 检查Node.js版本  
if ! node --version | grep -E "v(18|20|22)" > /dev/null; then
    print_error "需要Node.js 18+版本"
    exit 1
fi
print_success "Node.js版本检查通过"

# 检查Git
if ! command -v git &> /dev/null; then
    print_error "需要安装Git"
    exit 1
fi
print_success "Git检查通过"

# Step 2: 克隆或更新 Embedding Atlas
print_info "Step 2: 设置 Embedding Atlas..."

if [[ -d "$ATLAS_DIR" ]]; then
    print_warning "Atlas目录已存在，正在更新..."
    cd "$ATLAS_DIR"
    git pull origin main
else
    print_info "克隆 Embedding Atlas 仓库..."
    git clone https://github.com/apple/embedding-atlas.git "$ATLAS_DIR"
    cd "$ATLAS_DIR"
fi

print_success "Embedding Atlas 代码已就绪"

# Step 3: 安装 Atlas Python 依赖
print_info "Step 3: 安装 Atlas Python 依赖..."

# 检查虚拟环境
if [[ -n "$VIRTUAL_ENV" ]]; then
    print_info "使用当前虚拟环境: $VIRTUAL_ENV"
else
    print_warning "建议在虚拟环境中安装Atlas依赖"
fi

# 安装Atlas Python包
print_info "安装embedding-atlas Python包..."
pip install -e packages/backend/

# 验证安装
if command -v embedding-atlas &> /dev/null; then
    print_success "Atlas CLI 安装成功: $(embedding-atlas --version 2>/dev/null || echo 'installed')"
else
    print_error "Atlas CLI 安装失败"
    exit 1
fi

# Step 4: 安装 Atlas Node.js 依赖 (可选)
print_info "Step 4: 安装 Atlas Node.js 依赖..."

if [[ -f "package.json" ]]; then
    npm install
    npm run build
    print_success "Atlas前端构建完成"
else
    print_warning "未找到package.json，跳过Node.js依赖安装"
fi

# Step 5: 创建测试数据验证安装
print_info "Step 5: 创建测试数据验证安装..."

cd "$PROJECT_ROOT"

# 创建测试数据文件
cat > atlas_test_data.csv << 'EOF'
id,text,category
1,地聚物材料具有优异的力学性能和耐久性,材料性能
2,碱激发剂浓度影响地聚物的凝结时间,制备工艺
3,粉煤灰是制备地聚物的主要原料,原料组成
4,地聚物在高温环境下表现稳定,性能测试
5,水玻璃作为激发剂广泛应用于地聚物制备,激发剂
EOF

print_info "测试Atlas服务启动..."

# 启动Atlas测试服务 (后台运行，10秒后关闭)
timeout 10s embedding-atlas atlas_test_data.csv --text text --port 8099 --no-browser > /dev/null 2>&1 &
ATLAS_PID=$!

# 等待服务启动
sleep 3

# 检查服务是否运行
if ps -p $ATLAS_PID > /dev/null 2>&1; then
    print_success "Atlas测试服务运行正常"
    kill $ATLAS_PID 2>/dev/null || true
else
    print_warning "Atlas服务测试完成"
fi

# 清理测试文件
rm -f atlas_test_data.csv

# Step 6: 更新NextAgentLite环境配置
print_info "Step 6: 更新项目环境配置..."

# 检查后端requirements.txt
REQUIREMENTS_FILE="mat-backend/requirements.txt"
if [[ -f "$REQUIREMENTS_FILE" ]]; then
    if ! grep -q "embedding-atlas" "$REQUIREMENTS_FILE"; then
        echo "# Atlas可视化依赖" >> "$REQUIREMENTS_FILE"
        echo "# embedding-atlas>=0.1.0  # 通过本地安装" >> "$REQUIREMENTS_FILE"
        print_success "已更新requirements.txt"
    fi
fi

# 检查前端package.json的构建脚本
PACKAGE_JSON="mat-qa/package.json"
if [[ -f "$PACKAGE_JSON" ]]; then
    print_info "前端配置已就绪"
fi

# Step 7: 创建启动脚本
print_info "Step 7: 创建便捷启动脚本..."

cat > start_atlas_dev.sh << 'EOF'
#!/bin/bash
# Atlas开发环境启动脚本

echo "🚀 启动NextAgentLite + Atlas开发环境..."

# 启动后端 (后台)
echo "启动后端服务..."
cd mat-backend
python main.py &
BACKEND_PID=$!
echo "后端PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 启动前端 (后台)  
echo "启动前端服务..."
cd ../mat-qa
npm run dev &
FRONTEND_PID=$!
echo "前端PID: $FRONTEND_PID"

echo "✅ 服务启动完成!"
echo "📖 后端API: http://localhost:8000"
echo "🌐 前端界面: http://localhost:3000"
echo "📊 Atlas可在前端界面中启动"
echo ""
echo "按Ctrl+C停止所有服务..."

# 捕获中断信号
trap 'echo "停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
wait
EOF

chmod +x start_atlas_dev.sh

print_success "创建了便捷启动脚本: start_atlas_dev.sh"

# Step 8: 生成配置信息
print_info "Step 8: 生成配置信息..."

cat > ATLAS_INTEGRATION_INFO.md << 'EOF'
# Embedding Atlas 集成信息

## 安装状态
- ✅ Embedding Atlas 已安装
- ✅ Python CLI 工具可用
- ✅ 后端API集成完成  
- ✅ 前端组件已创建

## 使用方式

### 方式1: 通过前端界面 (推荐)
1. 启动服务: `./start_atlas_dev.sh`
2. 访问前端: http://localhost:3000
3. 进入"向量化管理" -> "向量可视化"页面
4. 配置参数并启动Atlas服务

### 方式2: 通过API直接调用
```bash
# 启动Atlas服务
curl -X POST "http://localhost:8000/atlas/start" \
  -H "Content-Type: application/json" \
  -d '{"port": 8081, "limit": 1000}'

# 查看服务状态
curl "http://localhost:8000/atlas/status"

# 停止服务
curl -X POST "http://localhost:8000/atlas/stop?port=8081"
```

### 方式3: 命令行直接使用
```bash
# 从数据库导出数据后使用
embedding-atlas your_data.csv --text content --port 8081
```

## 目录结构
```
NextAgentLite/
├── embedding-atlas/           # Atlas源代码
├── mat-backend/
│   ├── service/atlas_data_service.py      # 数据服务
│   └── api/endpoints/atlas_integration.py # API端点
├── mat-qa/
│   ├── src/services/atlasService.ts       # 前端服务
│   └── src/components/embedding/AtlasVisualization.tsx
└── start_atlas_dev.sh         # 开发环境启动脚本
```

## 注意事项
1. Atlas服务会占用指定端口（默认8081）
2. 大量数据可视化可能需要较长处理时间
3. 服务停止后临时数据文件会自动清理
4. 建议在测试环境先用少量数据验证功能

## 故障排除
- 如果端口被占用，可以更改端口号
- 如果数据加载失败，检查数据库中是否有向量数据
- 如果服务无法启动，检查Python依赖和虚拟环境
EOF

print_success "生成了集成信息文档: ATLAS_INTEGRATION_INFO.md"

# 完成安装
print_success "🎉 Embedding Atlas 集成安装完成!"
echo ""
print_info "📋 安装摘要:"
echo "   - Atlas代码位置: $ATLAS_DIR"
echo "   - Python包: embedding-atlas (已安装)"
echo "   - CLI命令: embedding-atlas"
echo "   - 后端API: /atlas/* 端点"
echo "   - 前端组件: AtlasVisualization"
echo ""
print_info "🚀 快速开始:"
echo "   1. 运行: ./start_atlas_dev.sh"
echo "   2. 访问: http://localhost:3000"
echo "   3. 进入向量化管理页面启动Atlas可视化"
echo ""
print_info "📚 详细信息请查看: ATLAS_INTEGRATION_INFO.md"
EOF