# 数据库备份 - 2025年10月28日

## 备份信息

- **备份时间**: 2025-10-28 08:59
- **数据库**: zzdsj_demo
- **PostgreSQL版本**: 17+
- **主机**: localhost:5434

## 备份文件说明

### 1. schema_only.sql (206KB)
- **内容**: 仅数据库结构
- **包含**:
  - 表定义
  - 索引
  - 约束
  - 序列
  - 视图
  - 函数等
- **用途**:
  - 创建空数据库
  - 查看数据库结构
  - 结构对比

### 2. complete_dump.sql (6.8MB)
- **内容**: 完整数据库（结构 + 数据）
- **包含**:
  - 所有表结构
  - 所有数据
  - 索引和约束
- **用途**:
  - 完整恢复数据库
  - 迁移到新环境
  - **推荐用于部署**

### 3. data_only.sql (6.6MB)
- **内容**: 仅数据
- **包含**: 所有表的INSERT语句
- **用途**:
  - 在已有结构的数据库中导入数据
  - 数据迁移
- **注意**:
  - 存在循环外键约束
  - 导入时可能需要使用 `--disable-triggers`

## 数据库统计

主要表和数据量：
- **知识库相关**: knowledge_collections, knowledge_documents, document_chunks
- **问答相关**: conversations, conversation_messages, qa_datasets
- **Agent相关**: agent_configs, team_executions, workflow_executions
- **配置相关**: chunking_configs, hook_pipelines, custom_hooks

## 恢复命令

### 恢复完整数据库（推荐）
```bash
# 1. 创建新数据库
createdb -h localhost -p 5434 -U zzdsj_demo zzdsj_demo_new

# 2. 导入数据
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -f complete_dump.sql
```

### 仅恢复结构
```bash
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -f schema_only.sql
```

### 仅恢复数据（需要先有结构）
```bash
# 如果遇到外键约束问题，可以临时禁用触发器
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -c "SET session_replication_role = replica;"
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -f data_only.sql
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -c "SET session_replication_role = DEFAULT;"
```

## 部署建议

### 测试服务器部署
1. 使用 `complete_dump.sql` 进行完整恢复
2. 确保PostgreSQL版本 >= 17
3. 确保已安装 pgvector 扩展
4. 修改相关配置文件中的数据库连接信息

### 验证数据完整性
```bash
# 检查表数量
psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -c "\dt" | wc -l

# 检查扩展
psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -c "\dx"

# 检查关键表的数据量
psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo_new -c "SELECT 'knowledge_documents' as table_name, COUNT(*) FROM knowledge_documents UNION ALL SELECT 'document_chunks', COUNT(*) FROM document_chunks UNION ALL SELECT 'chunking_configs', COUNT(*) FROM chunking_configs;"
```

## 注意事项

1. **密码安全**: 备份文件不包含用户密码和权限信息（使用了 --no-owner --no-privileges）
2. **外键约束**: data_only.sql 存在循环外键约束，完整恢复建议使用 complete_dump.sql
3. **大对象**: 如果数据库中有大对象（BLOB），需要额外备份
4. **扩展依赖**: 恢复前确保目标数据库已安装 pgvector 扩展

## 相关修复

本次备份包含了以下重要修复：
- ✅ URL爬取切分配置修复 (2025-10-28)
  - 修复了URL爬取不使用知识库自定义切分配置的问题
  - 添加了自动从知识库读取 default_chunking_config_id 的逻辑
  - 位置: `api/endpoints/url_crawl_api.py:316-339`

---
*备份创建者: Claude Code*
*备份时间: 2025-10-28 08:59*
