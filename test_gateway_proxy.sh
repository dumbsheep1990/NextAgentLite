#!/bin/bash

# 测试API网关代理功能
# 验证iframe嵌入页面的反向代理是否正常工作

echo "=========================================="
echo "API网关代理功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expect_code=${3:-200}

    echo -n "测试: $name ... "

    response=$(curl -s -w "\n%{http_code}" -o /tmp/response_body.txt "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" == "$expect_code" ]; then
        echo -e "${GREEN}[通过]${NC} HTTP $http_code"
        return 0
    else
        echo -e "${RED}[失败]${NC} HTTP $http_code (期望 $expect_code)"
        return 1
    fi
}

# 测试带内容检查的端点
test_endpoint_with_content() {
    local name=$1
    local url=$2
    local expect_pattern=$3

    echo -n "测试: $name ... "

    response=$(curl -s "$url")
    http_code=$?

    if [ $http_code -ne 0 ]; then
        echo -e "${RED}[失败]${NC} 请求失败"
        return 1
    fi

    if echo "$response" | grep -q "$expect_pattern"; then
        echo -e "${GREEN}[通过]${NC} 内容匹配"
        echo "      匹配模式: $expect_pattern"
        return 0
    else
        echo -e "${RED}[失败]${NC} 内容不匹配"
        echo "      期望模式: $expect_pattern"
        echo "      响应前100字符: ${response:0:100}"
        return 1
    fi
}

echo -e "${BLUE}1. 网关健康检查${NC}"
echo "----------------------------------------"
test_endpoint "网关健康状态" "http://localhost:8000/api-gateway/health"
echo ""

echo -e "${BLUE}2. 服务列表查询${NC}"
echo "----------------------------------------"
test_endpoint "获取代理服务列表" "http://localhost:8000/api-gateway/services"
echo ""

echo -e "${BLUE}3. MatGraph知识图谱代理${NC}"
echo "----------------------------------------"
# 测试健康检查
test_endpoint "MatGraph健康检查" "http://localhost:8000/api-gateway/matgraph/health"

# 测试WebUI访问（直接）
echo -n "测试: MatGraph WebUI (直接) ... "
direct_response=$(curl -s "http://localhost:9622/webui/")
if echo "$direct_response" | grep -q "<!DOCTYPE html>\|<html"; then
    echo -e "${GREEN}[通过]${NC} HTML内容正常"
else
    echo -e "${YELLOW}[警告]${NC} 非HTML响应"
fi

# 测试WebUI访问（通过网关）
echo -n "测试: MatGraph WebUI (网关代理) ... "
gateway_response=$(curl -s "http://localhost:8000/api-gateway/matgraph/webui/")
if echo "$gateway_response" | grep -q "<!DOCTYPE html>\|<html"; then
    echo -e "${GREEN}[通过]${NC} HTML内容正常"
    echo "      响应长度: ${#gateway_response} 字节"
else
    echo -e "${RED}[失败]${NC} 响应不是HTML"
    echo "      响应前200字符:"
    echo "      ${gateway_response:0:200}"
fi
echo ""

echo -e "${BLUE}4. Unla Web前端代理${NC}"
echo "----------------------------------------"
# 测试根路径访问（直接）
echo -n "测试: Unla Web首页 (直接) ... "
direct_response=$(curl -s "http://localhost:5173/")
if echo "$direct_response" | grep -q "<!DOCTYPE html>\|<html"; then
    echo -e "${GREEN}[通过]${NC} HTML内容正常"
else
    echo -e "${YELLOW}[警告]${NC} 非HTML响应"
fi

# 测试根路径访问（通过网关）
echo -n "测试: Unla Web首页 (网关代理) ... "
gateway_response=$(curl -s "http://localhost:8000/api-gateway/model/")
if echo "$gateway_response" | grep -q "<!DOCTYPE html>\|<html"; then
    echo -e "${GREEN}[通过]${NC} HTML内容正常"
    echo "      响应长度: ${#gateway_response} 字节"
else
    echo -e "${RED}[失败]${NC} 响应不是HTML"
    echo "      响应前200字符:"
    echo "      ${gateway_response:0:200}"
fi
echo ""

echo -e "${BLUE}5. LLM Gateway代理${NC}"
echo "----------------------------------------"
test_endpoint "LLM Gateway健康检查" "http://localhost:8000/api-gateway/llm-gateway/health"
echo ""

echo -e "${BLUE}6. DeepScrape服务代理${NC}"
echo "----------------------------------------"
test_endpoint "DeepScrape健康检查" "http://localhost:8000/api-gateway/deepscrape/health"
echo ""

echo -e "${BLUE}7. 静态资源代理测试${NC}"
echo "----------------------------------------"

# 测试Unla Web的静态资源（如果存在）
echo -n "测试: Unla Web静态资源 ... "
# 尝试获取一些常见的静态资源路径
for asset in "assets/index.js" "assets/index.css" "favicon.ico"; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api-gateway/model/$asset")
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}[找到]${NC} $asset"
        break
    fi
done

# 如果都没找到
if [ "$http_code" != "200" ]; then
    echo -e "${YELLOW}[跳过]${NC} 未找到常见静态资源路径"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""

# 显示网关配置
echo -e "${BLUE}当前网关配置:${NC}"
curl -s http://localhost:8000/api-gateway/services | python3 -m json.tool 2>/dev/null || echo "无法格式化JSON输出"
echo ""

# 显示前端环境变量配置
echo -e "${BLUE}前端环境变量配置:${NC}"
if [ -f "/Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local" ]; then
    echo "VITE_MATGRAPH_BASE_URL=$(grep VITE_MATGRAPH_BASE_URL /Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local)"
    echo "VITE_UNLA_WEB_URL=$(grep VITE_UNLA_WEB_URL /Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local)"
    echo "VITE_LLM_GATEWAY_URL=$(grep VITE_LLM_GATEWAY_URL /Users/wxn/Desktop/NextAgentLite/lite-qa/.env.local)"
fi
echo ""
