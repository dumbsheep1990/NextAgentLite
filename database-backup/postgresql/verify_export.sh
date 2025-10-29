#!/bin/bash

# 数据库导出验证脚本
# 验证导出文件的完整性和表数量

echo "======================================"
echo "数据库导出验证"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查文件是否存在
echo "1. 检查导出文件..."
files=("complete_dump.sql" "new_schema_only.sql" "new_data_only.sql")
all_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo -e "${GREEN}✓${NC} $file 存在 (大小: $size)"
    else
        echo -e "${RED}✗${NC} $file 不存在"
        all_exist=false
    fi
done

echo ""

# 统计表数量
echo "2. 统计表数量..."
if [ -f "new_schema_only.sql" ]; then
    table_count=$(grep -c "CREATE TABLE" new_schema_only.sql)
    echo -e "${GREEN}✓${NC} 找到 $table_count 个 CREATE TABLE 语句"

    if [ "$table_count" -eq 114 ]; then
        echo -e "${GREEN}✓${NC} 表数量正确 (期望: 114, 实际: $table_count)"
    else
        echo -e "${YELLOW}⚠${NC} 表数量不匹配 (期望: 114, 实际: $table_count)"
    fi
else
    echo -e "${RED}✗${NC} new_schema_only.sql 不存在，无法验证"
fi

echo ""

# 检查关键表是否存在
echo "3. 检查关键表..."
critical_tables=(
    "custom_hooks"
    "user_agents"
    "document_chunks"
    "qa_routes"
    "llm_models"
    "mcp_tools"
    "knowledge_documents"
)

if [ -f "new_schema_only.sql" ]; then
    missing_tables=()
    for table in "${critical_tables[@]}"; do
        if grep -q "CREATE TABLE.*$table" new_schema_only.sql; then
            echo -e "${GREEN}✓${NC} $table 表存在"
        else
            echo -e "${RED}✗${NC} $table 表缺失"
            missing_tables+=("$table")
        fi
    done

    if [ ${#missing_tables[@]} -eq 0 ]; then
        echo -e "\n${GREEN}✓ 所有关键表都存在${NC}"
    else
        echo -e "\n${RED}✗ 缺失 ${#missing_tables[@]} 个关键表${NC}"
    fi
fi

echo ""

# 检查扩展
echo "4. 检查PostgreSQL扩展..."
extensions=("vector" "uuid-ossp" "btree_gin" "pg_trgm")

if [ -f "complete_dump.sql" ]; then
    for ext in "${extensions[@]}"; do
        if grep -q "CREATE EXTENSION.*$ext" complete_dump.sql; then
            echo -e "${GREEN}✓${NC} $ext 扩展存在"
        else
            echo -e "${YELLOW}⚠${NC} $ext 扩展未找到（可能需要单独安装）"
        fi
    done
fi

echo ""

# 统计数据行数（INSERT语句）
echo "5. 统计数据量..."
if [ -f "new_data_only.sql" ]; then
    insert_count=$(grep -c "^INSERT INTO" new_data_only.sql)
    copy_count=$(grep -c "^COPY " new_data_only.sql)
    total_data_statements=$((insert_count + copy_count))
    echo -e "${GREEN}✓${NC} INSERT 语句: $insert_count"
    echo -e "${GREEN}✓${NC} COPY 语句: $copy_count"
    echo -e "${GREEN}✓${NC} 总数据语句: $total_data_statements"
fi

echo ""

# 生成摘要
echo "======================================"
echo "验证摘要"
echo "======================================"
if [ "$all_exist" = true ] && [ "$table_count" -eq 114 ]; then
    echo -e "${GREEN}✓ 导出文件完整且正确${NC}"
    echo ""
    echo "可以使用以下命令导入:"
    echo ""
    echo "  完整导入:"
    echo "  psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo -f complete_dump.sql"
    echo ""
    echo "  仅表结构:"
    echo "  psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo -f new_schema_only.sql"
    echo ""
    echo "  仅数据:"
    echo "  psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo -f new_data_only.sql"
else
    echo -e "${RED}✗ 导出文件可能不完整，请检查${NC}"
fi

echo ""
