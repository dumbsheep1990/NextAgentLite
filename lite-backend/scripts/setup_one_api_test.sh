#!/bin/bash

# One-API测试环境变量设置和测试运行脚本
# 用于快速配置和测试One-API服务

echo "🚀 设置One-API测试环境"

# 设置One-API环境变量
export ONE_API_KEY="sk-wboEKdPyTgltngVIDCaVU6mHuEvmGik7keR03Fws1yE3HR9m"
export ONE_API_BASE_URL="http://101.132.149.115:30504/v1"

# 设置数据库环境变量
export POSTGRESQL_HOST="8.153.90.125"
export POSTGRESQL_PORT="5432"
export POSTGRESQL_DATABASE="mat_demo"
export POSTGRESQL_USERNAME="mat_demo"
export POSTGRESQL_PASSWORD="NfWNH0mypEtjKETrsVqQg=="

export ELASTICSEARCH_URL="http://8.153.90.125:9200"
export ELASTICSEARCH_USERNAME="elastic"
export ELASTICSEARCH_PASSWORD="MQxFuWBuooxLY2c2a8YE"
export ELASTICSEARCH_API_KEY="LS1nMGdwY0JqZ21fdkZpWXhIQnM6MzZ4Q3lWRUdSTmZOUEViV1BhSmF4QQ=="

export ARANGODB_URL="http://localhost:8529"
export ARANGODB_DATABASE="mat_qa_graph"
export ARANGODB_USERNAME="root"
export ARANGODB_PASSWORD="2O5zBrPQrNfVkhn1gXY"

# 设置其他必要的环境变量
export SECRET_KEY="test-secret-key-for-one-api"
export MAT_QA_ENV="development"

echo "✅ 环境变量设置完成"
echo ""
echo "📋 当前配置："
echo "🔗 One-API URL: $ONE_API_BASE_URL"
echo "🔑 One-API Key: ${ONE_API_KEY:0:20}..."
echo "🗄️  PostgreSQL: $POSTGRESQL_HOST:$POSTGRESQL_PORT/$POSTGRESQL_DATABASE"
echo "🔍 Elasticsearch: $ELASTICSEARCH_URL"
echo "📊 ArangoDB: $ARANGODB_URL"
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未找到，请确保已安装Python3"
    exit 1
fi

# 检查依赖
echo "🔍 检查Python依赖..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ 依赖检查完成"
    else
        echo "⚠️  依赖安装可能有问题，但继续测试..."
    fi
else
    echo "⚠️  未找到requirements.txt文件"
fi

echo ""
echo "🧪 开始One-API测试..."
echo "=================================="

# 运行测试脚本
python3 scripts/test_one_api.py

echo ""
echo "=================================="
echo "🔚 测试完成" 