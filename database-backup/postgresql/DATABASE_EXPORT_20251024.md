# 数据库导出说明 - 2025-10-24

## 导出信息

- **导出时间**: 2025年10月24日 11:30
- **数据库**: zzdsj_demo
- **表数量**: 114张表
- **导出方式**: pg_dump (PostgreSQL)

## 导出文件

### 1. complete_dump.sql (2.5MB)
**用途**: 完整的数据库备份（表结构 + 数据）

**导出命令**:
```bash
PGPASSWORD='zzdsj123!' pg_dump -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo --no-owner --no-privileges -f complete_dump.sql
```

**恢复方法**:
```bash
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo -f complete_dump.sql
```

### 2. new_schema_only.sql (196KB)
**用途**: 仅包含数据库表结构（DDL）

**导出命令**:
```bash
PGPASSWORD='zzdsj123!' pg_dump -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo --schema-only --no-owner --no-privileges -f new_schema_only.sql
```

### 3. new_data_only.sql (2.3MB)
**用途**: 仅包含数据（INSERT语句）

**导出命令**:
```bash
PGPASSWORD='zzdsj123!' pg_dump -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo --data-only --no-owner --no-privileges -f new_data_only.sql
```

**注意**: 该文件导出时有循环外键约束警告，恢复时可能需要使用 `--disable-triggers` 选项。

## 本次更新内容

本次导出包含了以下新功能的数据表和配置：

### Hook系统增强
1. **custom_hooks表** - 支持Hook配置保存到数据库
   - 新增metadata字段存储config_params
   - tool_bindings字段存储工具绑定信息

2. **Hook配置API**
   - POST `/api/v1/custom-hooks/configure` - 保存Hook配置
   - GET `/api/v1/custom-hooks/{hook_id}/configuration` - 获取Hook配置

3. **前端Hook管理页面**
   - 新增"配置"按钮允许用户配置Hook参数和工具绑定
   - 配置保存到数据库

### 主要表分类 (114张表)

#### Hook相关 (7张)
- custom_hooks (136 kB)
- custom_hook_executions (56 kB)
- custom_hook_versions (40 kB)
- hook_pipelines (96 kB)
- hook_tool_templates (80 kB)
- hook_execution_logs (64 kB)

#### Agent相关 (约15张)
- user_agents (672 kB) - 最大的Agent表
- agent_configs (8 kB)
- agent_executions (40 kB)
- agent_templates (136 kB)
- unified_agents (56 kB)

#### 知识库相关 (约10张)
- document_chunks (2784 kB) - 数据量最大的表
- knowledge_documents (216 kB)
- knowledge_collections (64 kB)
- knowledge_folders (48 kB)

#### MCP相关 (约10张)
- mcp_instances (200 kB)
- mcp_servers (48 kB)
- mcp_tools (48 kB)
- mcp_gateway_config (40 kB)

#### QA相关 (约15张)
- qa_routes (1728 kB) - 第二大表
- qa_pairs (232 kB)
- qa_datasets (136 kB)
- qa_generation_tasks (96 kB)

#### LLM配置 (约10张)
- llm_models (344 kB)
- llm_providers (48 kB)
- unla_* 系列表 (约15张)

#### 工具相关 (约8张)
- custom_crawler_tools (128 kB)
- api_tool_catalog (80 kB)
- agent_tools (48 kB)

## 数据量统计

**前3大表**:
1. document_chunks - 2784 kB (文档分块)
2. qa_routes - 1728 kB (QA路由规则)
3. user_agents - 672 kB (用户智能体)

**总数据量**: 约 2.5 MB (完整导出)

## 导入注意事项

### 全新数据库导入
```bash
# 1. 创建数据库
createdb -h localhost -p 5434 -U zzdsj_demo zzdsj_demo

# 2. 导入完整备份
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo -f complete_dump.sql
```

### 仅更新表结构
```bash
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo -f new_schema_only.sql
```

### 仅导入数据
```bash
# 注意：由于循环外键约束，可能需要禁用触发器
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo \
  -d zzdsj_demo -c "SET session_replication_role = replica;" \
  -f new_data_only.sql \
  -c "SET session_replication_role = DEFAULT;"
```

## 版本历史

- **2025-10-24**: 导出114张表，包含Hook配置系统增强
- **2025-10-10**: 上一次导出（complete_dump.sql 1.6MB）

## 相关文档

- [Hook工具绑定配置指南](../../lite-backend/Hook工具绑定配置指南.md)
- [Hooks实施总结](../Hooks实施总结-20251017.md)
- [Hooks管理页面实施说明](../Hooks管理页面实施说明-20251020.md)
