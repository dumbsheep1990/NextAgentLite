# 快速开始 - 数据库部署指南

## 🎯 推荐导入流程

### 一键导入（最简单）

```bash
# 进入部署包目录
cd database-backup

# 运行自动化导入脚本
bash import_postgresql_clean.sh
```

脚本会自动完成：
1. ✅ 数据库连接测试
2. ✅ 创建数据库（如果不存在）
3. ✅ 安装必要扩展（pgvector, uuid-ossp等）
4. ✅ 导入完整数据库结构和数据
5. ✅ 验证导入结果

---

## 📁 文件说明

### ✅ 推荐使用（真实数据）

| 文件 | 大小 | 说明 | 用途 |
|------|------|------|------|
| **complete_dump.sql** | 1.6MB | 完整备份 | ⭐ 推荐用于全新部署 |
| **new_schema_only.sql** | 166KB | 仅表结构 | 需要空数据库时使用 |
| **new_data_only.sql** | 1.5MB | 仅数据 | 数据迁移场景 |
| **import_postgresql_clean.sh** | - | 导入脚本 | 自动化导入工具 |

### ❌ 已废弃（包含硬编码示例数据）

```
postgresql/old_with_hardcoded_data/
├── 01_core_tables.sql
├── 02_knowledge_tables.sql
...
└── 08_initialization_data.sql  ← 包含地聚物等硬编码数据
```

**不要使用这些文件！** 它们包含硬编码的地聚物示例数据。

---

## 🚀 部署步骤

### 步骤1: 准备环境

确保已安装：
- PostgreSQL 12+ （推荐 17+）
- pgvector 扩展
- uuid-ossp, btree_gin, pg_trgm 扩展

```bash
# CentOS/RHEL 安装扩展
sudo yum install -y postgresql17-contrib postgresql17-devel

# Ubuntu/Debian 安装扩展
sudo apt-get install -y postgresql-17-pgvector postgresql-contrib
```

### 步骤2: 执行导入

```bash
# 方法1: 使用自动化脚本（推荐）
bash import_postgresql_clean.sh

# 方法2: 手动导入
psql -h <host> -p <port> -U <user> -d postgres << 'SQL'
CREATE DATABASE zzdsj_demo ENCODING 'UTF8';
\c zzdsj_demo
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SQL

psql -h <host> -p <port> -U <user> -d zzdsj_demo \
  -f postgresql/complete_dump.sql
```

### 步骤3: 初始化其他服务

#### 初始化 Elasticsearch

```bash
bash init_elasticsearch.sh
```

#### 初始化 MinIO

**前置条件**: 需要先安装 MinIO Client (mc)

```bash
# Linux 安装 mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# macOS 安装 mc
brew install minio/stable/mc

# 然后运行初始化脚本
bash init_minio.sh
```

### 步骤4: 验证部署

```bash
# 检查表数量
psql -h <host> -p <port> -U <user> -d zzdsj_demo \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# 检查扩展
psql -h <host> -p <port> -U <user> -d zzdsj_demo \
  -c "SELECT * FROM pg_extension;"

# 检查关键表
psql -h <host> -p <port> -U <user> -d zzdsj_demo \
  -c "SELECT COUNT(*) FROM users;"
```

---

## 📊 数据验证

### document_categories 表验证

```bash
# 本地数据库（源）
PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo \
  -c "SELECT COUNT(*) FROM document_categories;"
# 结果: 0 条记录

# 线上数据库（目标）
psql -h <online_host> -p <port> -U <user> -d zzdsj_demo \
  -c "SELECT COUNT(*) FROM document_categories;"
# 应该也是: 0 条记录
```

如果线上数据库显示有数据（如地聚物分类），说明导入了旧的硬编码文件！

---

## ⚠️ 常见问题

### Q1: 扩展安装失败

**错误**: `ERROR: extension "uuid-ossp" is not available`

**解决**:
```bash
# 找到扩展文件
find /usr -name "uuid-ossp.control" 2>/dev/null

# 检查 PostgreSQL 扩展目录
pg_config --sharedir
pg_config --pkglibdir

# 如果找不到，需要编译安装或使用正确版本
```

### Q2: 循环外键约束错误

**错误**: `ERROR: circular foreign key constraint`

**解决**:
```bash
# 临时禁用触发器
psql ... -c "SET session_replication_role = replica;" \
  -f postgresql/complete_dump.sql
```

### Q3: 导入后有地聚物数据

**原因**: 使用了旧的硬编码文件

**解决**:
1. 清空数据库
2. 使用 `complete_dump.sql` 重新导入
3. 确认使用的是 `postgresql/` 目录下的文件，而非 `old_with_hardcoded_data/` 中的文件

---

## 📝 检查清单

部署前确认：

- [ ] 使用 `complete_dump.sql` 文件
- [ ] **不要使用** `old_with_hardcoded_data/` 中的文件
- [ ] PostgreSQL 版本 >= 12
- [ ] 已安装 pgvector 扩展
- [ ] 数据库字符编码为 UTF8
- [ ] 导入用户有 CREATE 权限

部署后验证：

- [ ] 表数量 >= 50
- [ ] `document_categories` 表为空（0条记录）
- [ ] `users` 表有数据
- [ ] 扩展已安装（vector, uuid-ossp, btree_gin, pg_trgm）

---

## 📞 支持

遇到问题？

1. 查看详细文档: `README_CLEAN_EXPORT.md`
2. 查看导入说明: `postgresql/IMPORT_README.md`
3. 检查日志: `/tmp/pg_import.log`

---

**最后更新**: 2025-10-10  
**数据源**: localhost:5434/zzdsj_demo  
**导出方式**: pg_dump 真实数据备份
