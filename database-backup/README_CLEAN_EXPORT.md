# 数据库真实数据导出说明

## 导出信息

- **导出时间**: 2025-10-10
- **源数据库**: localhost:5434/zzdsj_demo
- **导出方式**: pg_dump 完整备份
- **数据类型**: 真实数据（无硬编码示例数据）

## 重要说明

### ✅ 已修复的问题

之前版本的导出脚本（`08_initialization_data.sql`）中包含了**硬编码的地聚物示例数据**：

```sql
-- 旧版本包含的硬编码数据（已废弃）
INSERT INTO document_categories VALUES
('geopolymer', 'geopolymer', '地聚物材料', ...);  -- ← 这些是硬编码的示例数据
```

### ✅ 新版本导出

新版本使用 `pg_dump` 直接从本地数据库导出，**完全真实反映当前数据库状态**：

1. **complete_dump.sql** - 完整备份（1.6MB）
   - 包含所有表结构和真实数据
   - `document_categories` 表为空（0条记录）
   - 其他表数据与本地数据库完全一致

2. **new_schema_only.sql** - 仅结构（166KB）
   - 仅包含 DDL 语句
   - 不含任何数据

3. **new_data_only.sql** - 仅数据（1.5MB）
   - 仅包含 INSERT 语句
   - 真实数据，无硬编码内容

## 数据验证

### document_categories 表

```bash
# 本地数据库查询
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo \
  -c "SELECT COUNT(*) FROM document_categories;"

# 结果: 0 条记录 ✅
```

### 导出文件验证

```bash
# 检查 document_categories 表数据
grep "INSERT INTO document_categories" complete_dump.sql
# 结果: 无匹配（表为空）✅
```

## 关于测试数据说明

导出的数据中，在其他表（如 `qa_datasets`, `conversations` 等）可能包含一些测试问题，例如：

- "什么是地聚物材料？"
- "什么是NextAgentLite？"

**这些是正常的测试数据**，它们确实存在于你的本地数据库中，不是硬编码添加的。如果需要清除这些测试数据，请在导出前手动清理本地数据库。

## 文件对比

### 旧版本（已废弃，不推荐使用）

```
01_core_tables.sql              # 包含硬编码初始数据
02_knowledge_tables.sql
...
08_initialization_data.sql      # ❌ 包含地聚物硬编码数据
```

### 新版本（推荐使用）

```
complete_dump.sql               # ✅ 完整真实数据备份（推荐）
new_schema_only.sql             # ✅ 仅结构
new_data_only.sql               # ✅ 仅数据
```

## 导入方法

### 快速导入（推荐）

```bash
# 使用自动化脚本
bash import_postgresql_clean.sh
```

### 手动导入

```bash
# 1. 创建数据库和扩展
psql -h <host> -p <port> -U <user> -d postgres << 'SQL'
CREATE DATABASE zzdsj_demo ENCODING 'UTF8';
\c zzdsj_demo
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SQL

# 2. 导入完整备份
psql -h <host> -p <port> -U <user> -d zzdsj_demo \
  -f postgresql/complete_dump.sql
```

## 数据统计

从导出文件统计的表数量：

```bash
grep -c "^CREATE TABLE" postgresql/complete_dump.sql
# 约 50+ 个表
```

## 注意事项

1. **扩展依赖**:
   - pgvector (向量检索)
   - uuid-ossp (UUID生成)
   - btree_gin (GIN索引)
   - pg_trgm (模糊匹配)

2. **字符编码**: 确保目标数据库使用 UTF8 编码

3. **循环外键**: 部分表存在循环外键约束，导入时可能需要：
   ```bash
   psql ... -c "SET session_replication_role = replica;" -f complete_dump.sql
   ```

4. **权限要求**: 导入用户需要 CREATE 和 USAGE 权限

## 清理旧文件建议

可以删除以下包含硬编码数据的旧文件：

```bash
cd postgresql/
rm -f 01_core_tables.sql
rm -f 02_knowledge_tables.sql
rm -f 03_team_tables.sql
rm -f 04_system_tables.sql
rm -f 05_graph_tables.sql
rm -f 06_remaining_tables_and_views.sql
rm -f 07_indexes_and_constraints.sql
rm -f 08_initialization_data.sql  # ← 包含地聚物硬编码数据
```

**只保留新导出的真实数据文件**：
- `complete_dump.sql`
- `new_schema_only.sql`
- `new_data_only.sql`

## 相关文档

- `postgresql/IMPORT_README.md` - 详细导入说明
- `import_postgresql_clean.sh` - 自动化导入脚本
- `init_elasticsearch.sh` - Elasticsearch 初始化
- `init_minio.sh` - MinIO 初始化

---

**最后更新**: 2025-10-10
**维护者**: NextAgentLite Team
