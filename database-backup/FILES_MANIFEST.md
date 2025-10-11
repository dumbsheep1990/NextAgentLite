# NextAgentLite 部署文件清单

**生成日期**: 2025-09-26
**版本**: v1.3.2

---

## 📦 核心部署文件

### 🚀 部署脚本和配置

| 文件 | 说明 | 使用方式 |
|------|------|---------|
| `deploy_init.sh` | 一键部署初始化脚本 | `chmod +x deploy_init.sh && ./deploy_init.sh` |
| `docker-compose.yml` | Docker Compose编排配置 | `docker-compose up -d` |
| `env.template` | 环境变量配置模板 | `cp env.template .env` 并修改配置 |

### 📚 文档

| 文件 | 说明 |
|------|------|
| `README.md` | 备份和部署总览 |
| `DEPLOYMENT_GUIDE.md` | 完整部署指南（38页，详细步骤） |
| `QUICK_REFERENCE.md` | 快速参考卡片（常用命令） |
| `FILES_MANIFEST.md` | 本文件 - 文件清单 |

---

## 🗄️ PostgreSQL 数据库文件

### 核心SQL文件（按执行顺序）

| 文件 | 表数量 | 说明 |
|------|--------|------|
| `postgresql/01_core_tables.sql` | 13个表 | 核心表：用户、对话、Agent、Team |
| `postgresql/02_knowledge_tables.sql` | 15个表 | 知识库：文档、分块、QA数据集 |
| `postgresql/03_team_tables.sql` | 4个表 | Team协作：执行、步骤、成员 |
| `postgresql/04_system_tables.sql` | 16个表 | 系统表：配置、任务队列、日志 |
| `postgresql/05_graph_tables.sql` | 8个表 | 图谱表：节点、边、统计 |
| `postgresql/06_remaining_tables_and_views.sql` | 3个表+5个视图 | 其他表和视图 |
| `postgresql/07_indexes_and_constraints.sql` | 80+索引 | 索引和约束定义 |
| `postgresql/08_initialization_data.sql` | - | 初始化数据和配置 |

**总计**: 59个表 + 5个视图 + 80+索引

### 附加文件

| 文件 | 说明 |
|------|------|
| `postgresql/schema_only.sql` | 纯结构导出（无数据） |
| `postgresql/00_schema_export_script.sql` | 导出脚本 |
| `postgresql/20250828_add_metadata_fields_update.sql` | 元数据字段更新 |

---

## 🔍 Elasticsearch 索引文件

| 文件 | 说明 |
|------|------|
| `elasticsearch/elasticsearch_index_templates_v2.json` | V2索引模板（741行，7个索引） |
| `elasticsearch/elasticsearch_index_templates.json` | 原始索引模板 |
| `elasticsearch/elasticsearch_setup.md` | ES配置说明 |
| `elasticsearch/migrate_to_v2.sh` | V2迁移脚本 |

### 索引列表

1. `mat_qa_chunks` - 文档分块 + 双向量嵌入
2. `mat_qa_general_vectors` - 通用向量（1024维）
3. `mat_qa_domain_vectors` - 领域向量（768维）
4. `mat_qa_papers` - 学术论文
5. `mat_qa_documents` - 文档元数据
6. `mat_qa_retrieval_cache` - 检索缓存
7. `mat_qa_media` - 多媒体文件

---

## 💾 Redis 配置文件

| 文件 | 说明 |
|------|------|
| `redis/redis_config.md` | Redis配置、数据结构、备份脚本 |

### 主要功能

- **缓存系统**: LLM响应、翻译结果、配置数据
- **任务队列**: 文档处理、向量化、后台任务
- **实时功能**: SSE连接、用户活动、系统指标

---

## 📁 MinIO 对象存储文件

| 文件 | 说明 |
|------|------|
| `minio/minio_config.md` | MinIO配置、存储桶创建、迁移脚本 |

### 存储桶列表

1. `policy-qa-documents` - 文档存储
2. `policy-qa-media` - 多媒体文件
3. `policy-qa-thumbnails` - 缩略图
4. `policy-qa-knowledge-graph` - 知识图谱资源
5. `policy-qa-reports` - 生成报告
6. `policy-qa-backups` - 系统备份
7. `policy-qa-logs` - 日志归档
8. `policy-qa-cache` - 临时缓存

---

## 🛠️ 辅助脚本

| 文件 | 说明 |
|------|------|
| `cleanup_all_data_v2.sh` | 数据清理脚本（V2版本） |
| `cleanup_all_document_data.sh` | 文档数据清理 |

---

## 📊 统计信息

### 文件统计

- **总文件数**: 27个主要文件
- **SQL文件**: 11个
- **配置文件**: 6个
- **文档文件**: 6个
- **脚本文件**: 4个

### 数据库统计

- **PostgreSQL表**: 59个表 + 5个视图
- **PostgreSQL索引**: 80+个
- **Elasticsearch索引**: 7个
- **Redis数据模式**: 8种
- **MinIO存储桶**: 8个

### 代码行数

```bash
# SQL代码
postgresql/*.sql: ~5000行

# 配置JSON
elasticsearch/*.json: ~800行

# 文档
*.md: ~3000行

# 脚本
*.sh: ~600行
```

---

## 🚀 快速使用指南

### 1. Docker一键部署

```bash
cd /Users/wxn/Desktop/NextAgentLite/database-backup

# 配置环境
cp env.template .env
vi .env

# 启动服务
docker-compose up -d

# 初始化数据库
./deploy_init.sh
```

### 2. 手动部署PostgreSQL

```bash
# 按顺序执行SQL文件
for i in 01 02 03 04 05 06 07 08; do
  psql -h localhost -U postgres -d nextagent_lite \
    -f postgresql/${i}_*.sql
done
```

### 3. 手动部署Elasticsearch

```bash
# 导入索引模板
curl -X PUT "http://localhost:9200/_index_template/mat_qa_chunks" \
  -u elastic:password \
  -H "Content-Type: application/json" \
  -d @elasticsearch/elasticsearch_index_templates_v2.json
```

### 4. 手动部署MinIO

```bash
# 创建所有存储桶
mc alias set myminio http://localhost:9000 minio minio123

buckets=(policy-qa-documents policy-qa-media policy-qa-thumbnails \
         policy-qa-knowledge-graph policy-qa-reports policy-qa-backups \
         policy-qa-logs policy-qa-cache)

for bucket in "${buckets[@]}"; do
  mc mb myminio/$bucket
done
```

---

## 📋 部署检查清单

### 部署前检查

- [ ] Docker/Docker Compose已安装（如使用Docker部署）
- [ ] PostgreSQL 17+ 已安装（手动部署）
- [ ] Elasticsearch 8+ 已安装（手动部署）
- [ ] Redis 7+ 已安装（手动部署）
- [ ] MinIO 已安装（手动部署）
- [ ] 已复制并修改 `.env` 配置文件
- [ ] 已设置数据库密码和API密钥

### 部署后验证

- [ ] PostgreSQL连接成功：`psql -h localhost -U postgres -d nextagent_lite -c "SELECT 1"`
- [ ] Elasticsearch运行正常：`curl http://localhost:9200/_cluster/health`
- [ ] Redis连接成功：`redis-cli ping`
- [ ] MinIO可访问：`mc admin info myminio`
- [ ] 后端API响应：`curl http://localhost:8000/health`
- [ ] 前端页面可访问：`curl http://localhost:5173`
- [ ] 数据库表已创建：`psql -h localhost -U postgres -d nextagent_lite -c "\dt"`
- [ ] ES索引已创建：`curl http://localhost:9200/_cat/indices`
- [ ] MinIO存储桶已创建：`mc ls myminio`

### 功能测试

- [ ] 单Agent查询功能
- [ ] Team协作查询功能
- [ ] 文档上传功能
- [ ] 向量检索功能
- [ ] 知识图谱功能
- [ ] 翻译功能

---

## 📞 技术支持

### 文档参考

1. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - 完整部署指南
   - 系统要求
   - 详细安装步骤
   - 配置说明
   - 故障排除

2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 快速参考
   - 常用命令
   - 端口清单
   - 默认凭证
   - 快速修复

3. **[README.md](README.md)** - 备份总览
   - 快速开始
   - 数据库概览
   - 服务配置

### 日志位置

```bash
# 应用日志
tail -f ../lite-backend/logs/app.log

# Docker日志
docker-compose logs -f

# PostgreSQL日志
tail -f /var/log/postgresql/postgresql-17-main.log
```

### 常见问题

参考 `DEPLOYMENT_GUIDE.md` 的"常见问题"章节，包含：
- PostgreSQL扩展安装
- Elasticsearch内存配置
- MinIO权限问题
- Redis连接问题
- 向量检索问题

---

## 🔐 安全提醒

**⚠️ 重要：生产环境部署前必须修改的配置**

1. **数据库密码**
   - PostgreSQL: `DB_PASSWORD`
   - Elasticsearch: `ELASTICSEARCH_PASSWORD`
   - Redis: `REDIS_PASSWORD`

2. **MinIO凭证**
   - Access Key: `MINIO_ACCESS_KEY`
   - Secret Key: `MINIO_SECRET_KEY`

3. **API密钥**
   - LLM API: `ALIBABA_LLM_API_KEY`
   - 嵌入API: `GENERAL_EMBEDDING_API_KEY`

4. **应用密钥**
   - Secret Key: `SECRET_KEY`
   - JWT密钥: 使用强随机字符串

5. **网络安全**
   - 配置防火墙规则
   - 启用HTTPS/TLS
   - 限制数据库访问IP

---

## 📈 版本历史

### v1.3.2 (2025-09-26)

**新增文件**:
- ✅ `deploy_init.sh` - 一键部署脚本
- ✅ `docker-compose.yml` - Docker编排配置
- ✅ `env.template` - 环境变量模板
- ✅ `DEPLOYMENT_GUIDE.md` - 完整部署指南
- ✅ `QUICK_REFERENCE.md` - 快速参考卡片
- ✅ `FILES_MANIFEST.md` - 文件清单（本文档）

**更新文件**:
- ✅ `README.md` - 添加快速开始指南
- ✅ PostgreSQL结构更新
- ✅ Elasticsearch V2索引模板

### v1.3.0 (2025-08-27)

**初始备份**:
- PostgreSQL完整结构和数据
- Elasticsearch索引模板
- Redis配置说明
- MinIO存储桶配置

---

## 📦 打包和传输

### 创建部署包

```bash
# 打包所有部署文件
cd /Users/wxn/Desktop/NextAgentLite
tar -czf nextagent_deployment_v1.3.2.tar.gz \
  database-backup/ \
  --exclude=database-backup/logs \
  --exclude=database-backup/.DS_Store

# 查看包大小
ls -lh nextagent_deployment_v1.3.2.tar.gz
```

### 传输到目标服务器

```bash
# 使用scp传输
scp nextagent_deployment_v1.3.2.tar.gz user@target-server:/opt/

# 在目标服务器解压
ssh user@target-server
cd /opt
tar -xzf nextagent_deployment_v1.3.2.tar.gz
cd database-backup
```

---

**清单完成时间**: 2025-09-26
**清单维护者**: NextAgentLite开发团队

✅ **所有文件已准备就绪，可以开始部署！**
