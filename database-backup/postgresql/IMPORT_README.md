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

**最新导出**: 2025-10-24 11:30
**源数据库**: localhost:5434/zzdsj_demo
**表数量**: 114张表
**总大小**: 约 2.5 MB

### 主要表统计

**前3大表**:
1. document_chunks - 2784 kB (文档分块)
2. qa_routes - 1728 kB (QA路由规则)
3. user_agents - 672 kB (用户智能体)

**表分类**:
- Hook相关: 7张表 (custom_hooks, hook_pipelines等)
- Agent相关: 约15张表 (user_agents, agent_configs等)
- 知识库相关: 约10张表 (document_chunks, knowledge_documents等)
- MCP相关: 约10张表 (mcp_instances, mcp_tools等)
- QA相关: 约15张表 (qa_routes, qa_pairs等)
- LLM配置: 约10张表 (llm_models, unla_*系列等)
- 工具相关: 约8张表 (custom_crawler_tools, api_tool_catalog等)

### 本次更新亮点

**Hook配置系统增强**:
- custom_hooks表支持保存Hook配置到数据库
- 新增metadata字段存储config_params
- tool_bindings字段存储工具绑定信息
- 前端Hook管理页面支持配置参数和工具绑定

详细说明请查看: `DATABASE_EXPORT_20251024.md`

## 注意事项

1. **扩展依赖**: 需要先安装 pgvector, uuid-ossp, btree_gin, pg_trgm 扩展
2. **权限要求**: 导入用户需要有 CREATE 权限
3. **循环外键**: 部分表（qa_datasets, knowledge_folders, qa_route_categories）存在循环外键约束
   - 导入数据时可能需要禁用触发器:
   ```bash
   psql -d zzdsj_demo -c "SET session_replication_role = replica;" \
        -f new_data_only.sql \
        -c "SET session_replication_role = DEFAULT;"
   ```
4. **字符编码**: 确保数据库使用 UTF8 编码
5. **PostgreSQL版本**: 推荐使用 PostgreSQL 14+ 以支持所有特性

