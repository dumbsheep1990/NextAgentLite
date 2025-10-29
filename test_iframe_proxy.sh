#!/bin/bash

# 测试iframe页面代理功能
# 验证HTML路径重写是否正常工作

echo "=========================================="
echo "iframe页面代理路径重写测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. MatGraph WebUI 测试${NC}"
echo "----------------------------------------"

# 测试MatGraph HTML加载
echo -n "测试: 获取MatGraph HTML ... "
matgraph_html=$(curl -s "http://localhost:8000/api-gateway/matgraph/webui/")

if echo "$matgraph_html" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}[通过]${NC} HTML加载成功"
else
    echo -e "${RED}[失败]${NC} HTML加载失败"
fi

# 检查路径重写
echo -n "测试: 检查MatGraph静态资源路径重写 ... "
if echo "$matgraph_html" | grep -q 'src="/api-gateway/matgraph/webui/'; then
    echo -e "${GREEN}[通过]${NC} 路径重写成功"
    echo "      示例: $(echo "$matgraph_html" | grep -o 'src="/api-gateway/matgraph/webui/[^"]*"' | head -1)"
elif echo "$matgraph_html" | grep -q 'src="/webui/'; then
    echo -e "${RED}[失败]${NC} 路径未重写，仍为原始路径"
    echo "      示例: $(echo "$matgraph_html" | grep -o 'src="/webui/[^"]*"' | head -1)"
else
    echo -e "${YELLOW}[警告]${NC} 未找到预期的资源引用"
fi

# 测试重写后的资源是否可访问
echo -n "测试: 访问重写后的静态资源 ... "
asset_path=$(echo "$matgraph_html" | grep -o '/api-gateway/matgraph/webui/assets/[^"]*\.js' | head -1)
if [ -n "$asset_path" ]; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000$asset_path")
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}[通过]${NC} HTTP $http_code"
        echo "      资源路径: $asset_path"
    else
        echo -e "${RED}[失败]${NC} HTTP $http_code"
        echo "      资源路径: $asset_path"
    fi
else
    echo -e "${YELLOW}[跳过]${NC} 未找到资源路径"
fi

echo ""
echo -e "${BLUE}2. Unla Web 测试${NC}"
echo "----------------------------------------"

# 测试Unla Web HTML加载
echo -n "测试: 获取Unla Web HTML ... "
unla_html=$(curl -s "http://localhost:8000/api-gateway/model/")

if echo "$unla_html" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}[通过]${NC} HTML加载成功"
else
    echo -e "${RED}[失败]${NC} HTML加载失败"
fi

# 检查路径重写
echo -n "测试: 检查Unla Web静态资源路径重写 ... "
if echo "$unla_html" | grep -q 'src="/api-gateway/model/'; then
    echo -e "${GREEN}[通过]${NC} 路径重写成功"
    echo "      示例: $(echo "$unla_html" | grep -o 'src="/api-gateway/model/[^"]*"' | head -1)"
elif echo "$unla_html" | grep -q 'src="/assets/'; then
    echo -e "${RED}[失败]${NC} 路径未重写，仍为原始路径"
    echo "      示例: $(echo "$unla_html" | grep -o 'src="/assets/[^"]*"' | head -1)"
else
    echo -e "${YELLOW}[警告]${NC} 未找到预期的资源引用"
fi

# 测试重写后的资源是否可访问
echo -n "测试: 访问重写后的静态资源 ... "
asset_path=$(echo "$unla_html" | grep -o '/api-gateway/model/assets/[^"]*\.js' | head -1)
if [ -n "$asset_path" ]; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000$asset_path")
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}[通过]${NC} HTTP $http_code"
        echo "      资源路径: $asset_path"
    else
        echo -e "${RED}[失败]${NC} HTTP $http_code"
        echo "      资源路径: $asset_path"
    fi
else
    echo -e "${YELLOW}[跳过]${NC} 未找到资源路径"
fi

echo ""
echo -e "${BLUE}3. 详细分析${NC}"
echo "----------------------------------------"

echo ""
echo "MatGraph HTML中的资源引用 (前5个):"
echo "$matgraph_html" | grep -o 'src="[^"]*"' | head -5
echo ""

echo "Unla Web HTML中的资源引用 (前5个):"
echo "$unla_html" | grep -o 'src="[^"]*"' | head -5
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="

echo -e "${BLUE}4. Base标签检查${NC}"
echo "----------------------------------------"

# 检查Unla Web是否插入了base标签
echo -n "测试: Unla Web base标签插入 ... "
if echo "$unla_html" | grep -q '<base href="/api-gateway/model/">'; then
    echo -e "${GREEN}[通过]${NC} base标签已插入"
    echo "      $(echo "$unla_html" | grep -o '<base[^>]*>')"
else
    echo -e "${RED}[失败]${NC} base标签未找到"
fi

# 检查MatGraph不应该有base标签（因为有路径前缀）
echo -n "测试: MatGraph base标签（应该没有） ... "
if echo "$matgraph_html" | grep -q '<base href='; then
    echo -e "${YELLOW}[警告]${NC} 发现base标签（可能导致路径错误）"
else
    echo -e "${GREEN}[通过]${NC} 无base标签（使用路径替换）"
fi

echo ""
echo "提示: 重启后端服务后再次运行测试"
echo "  pm2 restart server && sleep 5 && bash test_iframe_proxy.sh"
