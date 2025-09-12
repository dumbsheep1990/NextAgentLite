#!/bin/bash

# 数据清理脚本 - 清空所有文档相关数据
# 包括: PostgreSQL, Elasticsearch, MinIO

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "NextAgentLite 文档数据清理脚本"
echo "=========================================="
echo ""
echo -e "${YELLOW}警告: 此脚本将删除所有文档相关数据！${NC}"
echo "包括:"
echo "  - PostgreSQL: 文档记录、分块、向量化任务等"
echo "  - Elasticsearch: 所有文档索引数据"
echo "  - MinIO: 所有上传的文档文件"
echo ""
read -p "确认继续? (yes/no): " -r
echo ""
if [[ ! $REPLY == "yes" ]]; then
    echo "操作已取消"
    exit 0
fi

# PostgreSQL 配置
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5434}"
PG_USER="${PG_USER:-zzdsj_demo}"
PG_DB="${PG_DB:-zzdsj_demo}"
export PGPASSWORD="${PGPASSWORD:-zzdsj123!}"

# Elasticsearch 配置
ES_HOST="${ES_HOST:-localhost}"
ES_PORT="${ES_PORT:-9200}"
ES_URL="http://${ES_HOST}:${ES_PORT}"

# MinIO 配置
MINIO_HOST="${MINIO_HOST:-localhost}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-zzdsjadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-zzdsjadmin123}"

echo "=========================================="
echo "步骤 1/4: 清理 PostgreSQL 数据"
echo "=========================================="

# 创建清理SQL脚本
cat > /tmp/cleanup_documents.sql << 'EOF'
-- 开始事务
BEGIN;

-- 显示清理前的统计
SELECT 'knowledge_documents' as table_name, COUNT(*) as count FROM knowledge_documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'document_vectors', COUNT(*) FROM document_vectors
UNION ALL
SELECT 'vectorization_tasks', COUNT(*) FROM vectorization_tasks
UNION ALL
SELECT 'task_queue', COUNT(*) FROM task_queue WHERE task_type LIKE '%document%';

-- 清理文档相关表
DELETE FROM document_chunks;
DELETE FROM document_vectors;
DELETE FROM knowledge_documents;
DELETE FROM vectorization_tasks;
DELETE FROM task_queue WHERE task_type LIKE '%document%' OR task_type LIKE '%vectoriz%';

-- 清理相关的会话和消息（可选）
-- DELETE FROM conversation_messages WHERE metadata::text LIKE '%document%';

-- 显示清理后的统计
SELECT '清理完成' as status;
SELECT 'knowledge_documents' as table_name, COUNT(*) as count FROM knowledge_documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'document_vectors', COUNT(*) FROM document_vectors
UNION ALL
SELECT 'vectorization_tasks', COUNT(*) FROM vectorization_tasks
UNION ALL
SELECT 'task_queue', COUNT(*) FROM task_queue WHERE task_type LIKE '%document%';

-- 提交事务
COMMIT;
EOF

echo "执行PostgreSQL清理..."
psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} -f /tmp/cleanup_documents.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL 数据清理完成${NC}"
else
    echo -e "${RED}✗ PostgreSQL 清理失败${NC}"
fi

echo ""
echo "=========================================="
echo "步骤 2/4: 清理 Elasticsearch 索引数据"
echo "=========================================="

# 清理 ES 索引（保留索引结构，只删除数据）
echo "清理 document_chunks 索引..."
curl -X POST "${ES_URL}/document_chunks/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 general_vectors 索引..."
curl -X POST "${ES_URL}/general_vectors/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 domain_vectors 索引..."
curl -X POST "${ES_URL}/domain_vectors/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 documents 索引..."
curl -X POST "${ES_URL}/documents/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 papers 索引..."
curl -X POST "${ES_URL}/papers/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 retrieval_cache 索引..."
curl -X POST "${ES_URL}/retrieval_cache/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo "清理 media 索引..."
curl -X POST "${ES_URL}/media/_delete_by_query" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match_all": {}}}' 2>/dev/null

echo ""
echo -e "${GREEN}✓ Elasticsearch 索引数据清理完成${NC}"

# 验证ES清理结果
echo ""
echo "验证 Elasticsearch 清理结果:"
for index in document_chunks general_vectors domain_vectors documents papers retrieval_cache media; do
    count=$(curl -s "${ES_URL}/${index}/_count" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "  ${index}: ${count:-0} 条记录"
done

echo ""
echo "=========================================="
echo "步骤 3/4: 清理 MinIO 文档数据"
echo "=========================================="

# 检查是否安装了 mc (MinIO Client)
if command -v mc &> /dev/null; then
    echo "使用 MinIO Client 清理..."
    
    # 配置 mc
    mc alias set local http://${MINIO_HOST}:${MINIO_PORT} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} 2>/dev/null
    
    # 清理文档桶
    echo "清理 mat-qa-documents 桶..."
    mc rm -r --force local/mat-qa-documents/ 2>/dev/null
    
    echo "清理 documents 桶..."
    mc rm -r --force local/documents/ 2>/dev/null
    
    echo -e "${GREEN}✓ MinIO 数据清理完成${NC}"
else
    echo -e "${YELLOW}! MinIO Client (mc) 未安装，使用 Python 脚本清理...${NC}"
    
    # 使用 Python 脚本清理 MinIO
    python3 << EOF
import os
from minio import Minio
from minio.error import S3Error

client = Minio(
    "${MINIO_HOST}:${MINIO_PORT}",
    access_key="${MINIO_ACCESS_KEY}",
    secret_key="${MINIO_SECRET_KEY}",
    secure=False
)

buckets_to_clean = ['mat-qa-documents', 'documents']

for bucket_name in buckets_to_clean:
    try:
        if client.bucket_exists(bucket_name):
            print(f"清理桶: {bucket_name}")
            objects = client.list_objects(bucket_name, recursive=True)
            for obj in objects:
                client.remove_object(bucket_name, obj.object_name)
                print(f"  删除: {obj.object_name}")
            print(f"✓ {bucket_name} 清理完成")
        else:
            print(f"桶 {bucket_name} 不存在")
    except S3Error as e:
        print(f"清理 {bucket_name} 失败: {e}")
EOF
fi

echo ""
echo "=========================================="
echo "步骤 4/4: 清理本地文件系统"
echo "=========================================="

# 清理本地上传目录
LOCAL_UPLOAD_DIR="../lite-backend/uploads"
if [ -d "$LOCAL_UPLOAD_DIR" ]; then
    echo "清理本地上传目录: $LOCAL_UPLOAD_DIR"
    find "$LOCAL_UPLOAD_DIR" -type f -name "*.pdf" -o -name "*.txt" -o -name "*.docx" -o -name "*.md" | while read file; do
        echo "  删除: $file"
        rm -f "$file"
    done
    
    # 清理空目录
    find "$LOCAL_UPLOAD_DIR" -type d -empty -delete
    echo -e "${GREEN}✓ 本地文件清理完成${NC}"
else
    echo -e "${YELLOW}! 本地上传目录不存在${NC}"
fi

echo ""
echo "=========================================="
echo "清理总结"
echo "=========================================="
echo -e "${GREEN}✓ PostgreSQL 文档表已清空${NC}"
echo -e "${GREEN}✓ Elasticsearch 索引数据已清空${NC}"
echo -e "${GREEN}✓ MinIO 文档数据已清空${NC}"
echo -e "${GREEN}✓ 本地上传文件已清理${NC}"
echo ""
echo "所有文档相关数据已清理完成！"
echo "系统现在处于干净状态，可以重新上传文档。"
echo ""

# 清理临时文件
rm -f /tmp/cleanup_documents.sql