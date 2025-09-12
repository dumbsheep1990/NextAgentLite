#!/bin/bash

# 数据清理脚本 v2 - 使用正确的bucket名称
# 清空所有文档相关数据: PostgreSQL, Elasticsearch, MinIO

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "NextAgentLite 文档数据清理脚本 v2"
echo "=========================================="
echo ""
echo -e "${YELLOW}警告: 此脚本将删除所有文档相关数据！${NC}"
echo "包括:"
echo "  - PostgreSQL: 文档记录、分块、任务等"
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

echo "=========================================="
echo "步骤 1/4: 清理 PostgreSQL 数据"
echo "=========================================="

psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} << 'EOF'
-- 清理文档相关表
DELETE FROM document_chunks;
DELETE FROM knowledge_documents;
DELETE FROM task_queue WHERE task_type LIKE '%document%' OR task_type LIKE '%vectoriz%';

-- 显示清理结果
SELECT 'PostgreSQL cleanup results:' as status;
SELECT 'knowledge_documents' as table_name, COUNT(*) as count FROM knowledge_documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'task_queue', COUNT(*) FROM task_queue WHERE task_type LIKE '%document%';
EOF

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
indices=("document_chunks" "general_vectors" "domain_vectors" "documents" "papers" "retrieval_cache" "media")

for index in "${indices[@]}"; do
    echo "清理 ${index} 索引..."
    curl -X POST "${ES_URL}/${index}/_delete_by_query" \
      -H 'Content-Type: application/json' \
      -d '{"query": {"match_all": {}}}' 2>/dev/null
    echo ""
done

echo -e "${GREEN}✓ Elasticsearch 索引数据清理完成${NC}"

# 验证ES清理结果
echo ""
echo "验证 Elasticsearch 清理结果:"
for index in "${indices[@]}"; do
    count=$(curl -s "${ES_URL}/${index}/_count" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "  ${index}: ${count:-0} 条记录"
done

echo ""
echo "=========================================="
echo "步骤 3/4: 清理 MinIO 文档数据"
echo "=========================================="

# 使用正确的bucket名称清理MinIO
python3 << 'PYTHON_SCRIPT'
import os
from minio import Minio
from minio.error import S3Error

# MinIO 配置
client = Minio(
    "localhost:9000",
    access_key="zzdsjadmin",
    secret_key="zzdsjadmin",
    secure=False
)

print("清理 MinIO 存储桶...")

# 使用正确的bucket名称
buckets_to_clean = [
    'policy-qa-documents',
    'policy-qa-media',
    'policy-qa-thumbnails',
    'policy-qa-knowledge-graph',
    'policy-qa-reports',
    'policy-qa-cache'
]

total_deleted = 0
for bucket_name in buckets_to_clean:
    try:
        if client.bucket_exists(bucket_name):
            print(f"\n清理桶: {bucket_name}")
            objects = list(client.list_objects(bucket_name, recursive=True))
            if objects:
                for obj in objects:
                    client.remove_object(bucket_name, obj.object_name)
                    print(f"  删除: {obj.object_name}")
                    total_deleted += 1
                print(f"  ✓ {bucket_name} 清理完成 (删除 {len(objects)} 个文件)")
            else:
                print(f"  ✓ {bucket_name} 已经是空的")
        else:
            print(f"  - 桶 {bucket_name} 不存在")
    except S3Error as e:
        print(f"  ✗ 访问 {bucket_name} 失败: {e}")

print(f"\n✓ MinIO 清理完成，共删除 {total_deleted} 个文件")
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MinIO 数据清理完成${NC}"
else
    echo -e "${YELLOW}! MinIO 清理可能有问题，请检查${NC}"
fi

echo ""
echo "=========================================="
echo "步骤 4/4: 清理本地文件系统"
echo "=========================================="

# 清理本地上传目录
LOCAL_UPLOAD_DIR="../lite-backend/uploads"
if [ -d "$LOCAL_UPLOAD_DIR" ]; then
    echo "清理本地上传目录: $LOCAL_UPLOAD_DIR"
    
    # 统计文件数量
    file_count=$(find "$LOCAL_UPLOAD_DIR" -type f \( -name "*.pdf" -o -name "*.txt" -o -name "*.docx" -o -name "*.md" \) | wc -l)
    
    if [ "$file_count" -gt 0 ]; then
        echo "  找到 ${file_count} 个文档文件"
        find "$LOCAL_UPLOAD_DIR" -type f \( -name "*.pdf" -o -name "*.txt" -o -name "*.docx" -o -name "*.md" \) -delete
        echo "  ✓ 删除了 ${file_count} 个文件"
    else
        echo "  ✓ 目录已经是空的"
    fi
    
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

# 最终验证
echo "最终数据状态:"
echo ""
echo "PostgreSQL:"
psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} -t << 'EOF' 2>/dev/null
SELECT '  knowledge_documents: ' || COUNT(*) FROM knowledge_documents
UNION ALL
SELECT '  document_chunks: ' || COUNT(*) FROM document_chunks;
EOF

echo ""
echo "Elasticsearch:"
for index in document_chunks documents; do
    count=$(curl -s "${ES_URL}/${index}/_count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "  ${index}: ${count:-0} 条记录"
done

echo ""
echo -e "${GREEN}=========================================="
echo "所有文档相关数据已清理完成！"
echo "系统现在处于干净状态，可以重新上传文档。"
echo "==========================================${NC}"
echo ""