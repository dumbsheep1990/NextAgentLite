# PostgreSQL 数据库导入说明

## 文件说明

本目录包含从本地数据库（localhost:5434/zzdsj_demo）导出的**真实数据**：

### 最新导出文件（推荐使用）

1. **complete_dump.sql** - 完整数据库备份（结构 + 数据）
   - 包含所有表结构、索引、约束、扩展
   - 包含所有真实数据，无示例数据
   - 推荐用于全新部署

2. **new_schema_only.sql** - 仅表结构
   - 仅包含DDL语句（CREATE TABLE, CREATE INDEX等）
   - 不包含任何数据
   - 适合需要空数据库结构的场景

3. **new_data_only.sql** - 仅数据
   - 仅包含INSERT语句
   - 需要先有表结构才能导入
   - 适合数据迁移场景

### 旧文件（包含硬编码示例数据，不推荐使用）

- 01_core_tables.sql ~ 08_initialization_data.sql - 旧版本，包含地聚物等示例数据

## 导入方法

### 方法1: 使用完整备份文件（推荐）

```bash
# 1. 创建数据库和扩展
psql -h <host> -p <port> -U <user> -d postgres << 'SQL'
CREATE DATABASE zzdsj_demo;
\c zzdsj_demo
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SQL

# 2. 导入完整备份
psql -h <host> -p <port> -U <user> -d zzdsj_demo -f complete_dump.sql
```

### 方法2: 分步导入（结构 + 数据）

```bash
# 1. 导入结构
psql -h <host> -p <port> -U <user> -d zzdsj_demo -f new_schema_only.sql

# 2. 导入数据
psql -h <host> -p <port> -U <user> -d zzdsj_demo -f new_data_only.sql
```

### 方法3: 使用自动化脚本

```bash
bash ../import_postgresql_clean.sh
```

## 数据统计

导出时间: $(date '+%Y-%m-%d %H:%M:%S')
源数据库: localhost:5434/zzdsj_demo

## 注意事项

1. **扩展依赖**: 需要先安装 pgvector, uuid-ossp, btree_gin, pg_trgm 扩展
2. **权限要求**: 导入用户需要有 CREATE 权限
3. **循环外键**: 部分表（qa_datasets, knowledge_folders等）存在循环外键，导入时可能需要使用 `--disable-triggers`
4. **字符编码**: 确保数据库使用 UTF8 编码

