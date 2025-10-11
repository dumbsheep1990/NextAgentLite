#!/bin/bash
#################################################
# Elasticsearch索引初始化脚本
#
# 使用方法:
#   bash init_elasticsearch.sh
#################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
ES_HOST="${ES_HOST:-localhost:9200}"
ES_USER="${ES_USER:-elastic}"
ES_PASSWORD="${ES_PASSWORD:-}"
ES_PROTOCOL="${ES_PROTOCOL:-http}"

echo "======================================"
echo "Elasticsearch 索引初始化"
echo "======================================"
echo "服务器: ${ES_PROTOCOL}://${ES_HOST}"
echo "用户: ${ES_USER}"
echo ""

# 读取密码
if [ -z "$ES_PASSWORD" ]; then
    read -sp "请输入Elasticsearch密码: " ES_PASSWORD
    echo ""
fi

ES_URL="${ES_PROTOCOL}://${ES_HOST}"
ES_AUTH="-u ${ES_USER}:${ES_PASSWORD}"

# 步骤1: 测试连接
echo ""
echo -e "${BLUE}步骤1: 测试连接${NC}"
echo "----------------------------------------"

if curl -s -k ${ES_AUTH} "${ES_URL}/_cluster/health" > /dev/null; then
    echo -e "${GREEN}✓ 连接成功${NC}"
else
    echo -e "${RED}✗ 无法连接到Elasticsearch${NC}"
    exit 1
fi

# 步骤2: 创建索引
echo ""
echo -e "${BLUE}步骤2: 创建索引${NC}"
echo "----------------------------------------"

# 索引列表
INDICES=(
    "mat_qa_chunks"
    "mat_qa_general_vectors"
    "mat_qa_domain_vectors"
    "mat_qa_papers"
    "mat_qa_documents"
    "mat_qa_retrieval_cache"
    "mat_qa_media"
)

SUCCESS=0
FAILED=0

for index in "${INDICES[@]}"; do
    echo ""
    echo "创建索引: $index"

    # 检查索引是否存在
    if curl -s -k ${ES_AUTH} -I "${ES_URL}/${index}" | grep -q "200 OK"; then
        echo -e "  ${YELLOW}⚠ 索引已存在${NC}"
        read -p "  是否删除并重建? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -s -k ${ES_AUTH} -X DELETE "${ES_URL}/${index}" > /dev/null
            echo -e "  ${GREEN}✓ 旧索引已删除${NC}"
        else
            echo -e "  ${BLUE}⊙ 跳过${NC}"
            continue
        fi
    fi

    # 基础索引配置
    INDEX_CONFIG='{
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "max_result_window": 50000
        },
        "mappings": {
            "properties": {
                "content": {"type": "text"},
                "chunk_id": {"type": "keyword"},
                "document_id": {"type": "keyword"},
                "created_at": {"type": "date"},
                "metadata": {"type": "object", "enabled": false}
            }
        }
    }'

    # 为向量索引添加向量字段
    if [[ "$index" == *"chunks"* ]] || [[ "$index" == *"vectors"* ]]; then
        if [[ "$index" == *"general"* ]] || [[ "$index" == *"chunks"* ]]; then
            INDEX_CONFIG=$(echo "$INDEX_CONFIG" | jq '.mappings.properties.general_embedding = {"type": "dense_vector", "dims": 1024, "similarity": "cosine"}')
        fi
        if [[ "$index" == *"domain"* ]] || [[ "$index" == *"chunks"* ]]; then
            INDEX_CONFIG=$(echo "$INDEX_CONFIG" | jq '.mappings.properties.domain_embedding = {"type": "dense_vector", "dims": 768, "similarity": "cosine"}')
        fi
    fi

    # 创建索引
    RESPONSE=$(curl -s -k ${ES_AUTH} -X PUT "${ES_URL}/${index}" \
        -H "Content-Type: application/json" \
        -d "$INDEX_CONFIG")

    if echo "$RESPONSE" | grep -q '"acknowledged":true'; then
        echo -e "  ${GREEN}✓ 创建成功${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}✗ 创建失败${NC}"
        echo "     $RESPONSE"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "======================================"
echo "索引创建完成: 成功 $SUCCESS 个, 失败 $FAILED 个"
echo "======================================"

# 步骤3: 验证
echo ""
echo -e "${BLUE}步骤3: 验证索引${NC}"
echo "----------------------------------------"

curl -s -k ${ES_AUTH} "${ES_URL}/_cat/indices?v"

echo ""
echo -e "${GREEN}✓ Elasticsearch初始化完成${NC}"
