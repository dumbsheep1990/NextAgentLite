#!/bin/bash
# Elasticsearch索引迁移脚本 - 从v1.x迁移到v2.0
# 移除双向量支持和mat_qa前缀

# 配置
ES_HOST="${ES_HOST:-localhost}"
ES_PORT="${ES_PORT:-9200}"
ES_URL="http://${ES_HOST}:${ES_PORT}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "NextAgentLite ES索引迁移脚本 v1.x -> v2.0"
echo "=========================================="
echo ""

# 检查Elasticsearch连接
echo -e "${YELLOW}检查Elasticsearch连接...${NC}"
if curl -s "${ES_URL}/_cluster/health" > /dev/null; then
    echo -e "${GREEN}✓ Elasticsearch连接成功${NC}"
else
    echo -e "${RED}✗ 无法连接到Elasticsearch (${ES_URL})${NC}"
    exit 1
fi

# 显示当前索引
echo ""
echo -e "${YELLOW}当前索引列表:${NC}"
curl -s "${ES_URL}/_cat/indices?v" | grep -E "mat_qa|document|vector|paper|cache|media" || echo "没有找到相关索引"

# 询问用户是否继续
echo ""
echo -e "${YELLOW}警告: 此脚本将删除所有旧索引并创建新索引！${NC}"
echo -e "${YELLOW}建议先备份重要数据。${NC}"
read -p "是否继续? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

# 步骤1: 备份旧索引映射（可选）
echo ""
echo -e "${YELLOW}步骤1: 备份旧索引映射...${NC}"
mkdir -p backups/$(date +%Y%m%d)
for index in mat_qa_chunks mat_qa_general_vectors mat_qa_domain_vectors mat_qa_papers mat_qa_documents mat_qa_retrieval_cache mat_qa_media; do
    if curl -s "${ES_URL}/${index}" > /dev/null 2>&1; then
        echo "备份 ${index} 映射..."
        curl -s "${ES_URL}/${index}/_mapping" | python -m json.tool > "backups/$(date +%Y%m%d)/${index}_mapping.json"
    fi
done

# 步骤2: 删除旧索引
echo ""
echo -e "${YELLOW}步骤2: 删除旧索引...${NC}"
for index in mat_qa_chunks mat_qa_general_vectors mat_qa_domain_vectors mat_qa_papers mat_qa_documents mat_qa_retrieval_cache mat_qa_media; do
    echo "删除索引: ${index}"
    curl -X DELETE "${ES_URL}/${index}" 2>/dev/null
    echo ""
done

# 删除可能存在的新索引（如果之前部分迁移过）
for index in document_chunks general_vectors domain_vectors papers documents retrieval_cache media; do
    echo "删除索引: ${index}"
    curl -X DELETE "${ES_URL}/${index}" 2>/dev/null
    echo ""
done

# 步骤3: 创建新索引
echo ""
echo -e "${YELLOW}步骤3: 创建新索引...${NC}"

# 创建document_chunks索引
echo "创建 document_chunks 索引..."
curl -X PUT "${ES_URL}/document_chunks" \
  -H 'Content-Type: application/json' \
  -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "chinese_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop"]
        },
        "english_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "stemmer"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {"type": "keyword"},
      "document_id": {"type": "keyword"},
      "chunk_index": {"type": "integer"},
      "content": {
        "type": "text",
        "analyzer": "chinese_analyzer",
        "fields": {
          "english": {"type": "text", "analyzer": "english_analyzer"},
          "keyword": {"type": "keyword", "ignore_above": 256}
        }
      },
      "title": {
        "type": "text",
        "analyzer": "chinese_analyzer",
        "fields": {
          "keyword": {"type": "keyword", "ignore_above": 256}
        }
      },
      "embedding": {
        "type": "dense_vector",
        "dims": 2560,
        "index": true,
        "similarity": "cosine"
      },
      "embedding_model": {"type": "keyword"},
      "document_type": {"type": "keyword"},
      "tags": {"type": "keyword"},
      "metadata": {"type": "object", "dynamic": true},
      "source_info": {
        "type": "object",
        "properties": {
          "filename": {"type": "keyword"},
          "file_type": {"type": "keyword"},
          "page": {"type": "integer"},
          "section": {"type": "text"}
        }
      },
      "created_at": {"type": "date"},
      "updated_at": {"type": "date"}
    }
  }
}' 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ document_chunks 索引创建成功${NC}"
else
    echo -e "${RED}✗ document_chunks 索引创建失败${NC}"
fi

# 创建其他索引（简化版本）
for index in general_vectors domain_vectors papers documents retrieval_cache media; do
    echo "创建 ${index} 索引..."
    
    # 基础映射结构
    curl -X PUT "${ES_URL}/${index}" \
      -H 'Content-Type: application/json' \
      -d '{
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "id": {"type": "keyword"},
          "created_at": {"type": "date"},
          "updated_at": {"type": "date"}
        }
      }
    }' 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${index} 索引创建成功${NC}"
    else
        echo -e "${RED}✗ ${index} 索引创建失败${NC}"
    fi
done

# 步骤4: 创建别名
echo ""
echo -e "${YELLOW}步骤4: 创建索引别名...${NC}"
curl -X POST "${ES_URL}/_aliases" \
  -H 'Content-Type: application/json' \
  -d '{
  "actions": [
    {"add": {"index": "document_chunks", "alias": "chunks"}},
    {"add": {"index": "retrieval_cache", "alias": "cache"}}
  ]
}' 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 索引别名创建成功${NC}"
else
    echo -e "${YELLOW}! 索引别名创建可能失败（可以忽略）${NC}"
fi

# 步骤5: 验证
echo ""
echo -e "${YELLOW}步骤5: 验证新索引...${NC}"
echo "新索引列表:"
curl -s "${ES_URL}/_cat/indices?v" | grep -E "document_chunks|general_vectors|domain_vectors|papers|documents|retrieval_cache|media" || echo "未找到新索引"

echo ""
echo -e "${GREEN}=========================================="
echo -e "迁移完成！${NC}"
echo ""
echo "注意事项:"
echo "1. 所有索引已重新创建，原有数据已删除"
echo "2. 向量维度已更新为2560（Qwen3-Embedding-4B）"
echo "3. 双向量字段已移除，使用单一embedding字段"
echo "4. 索引名称已去除mat_qa前缀"
echo ""
echo "下一步:"
echo "1. 重新上传和向量化文档"
echo "2. 更新应用程序配置"
echo "3. 测试检索功能"
echo ""