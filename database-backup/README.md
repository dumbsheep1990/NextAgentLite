# NextAgent Lite Database Backup & Deployment

**Export Date**: 2025-08-27
**Updated**: 2025-09-26
**Source Server**: 103.6.168.6
**Project**: NextAgent Lite - 智能Agent开发平台

---

## 🚀 快速开始

### 方式1: Docker 一键部署（推荐）

```bash
# 1. 配置环境变量
cp env.template .env
vi .env  # 修改数据库密码、API密钥等

# 2. 启动所有服务
docker-compose up -d

# 3. 初始化数据库
chmod +x deploy_init.sh
./deploy_init.sh

# 4. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:8000
# API文档: http://localhost:8000/docs
```

### 方式2: 手动部署

```bash
# 1. 安装依赖服务 (PostgreSQL 17+, Elasticsearch 8+, Redis 7+, MinIO)
# 2. 执行初始化脚本
./deploy_init.sh \
  --postgres-host localhost \
  --es-host localhost:9200 \
  --redis-host localhost \
  --minio-endpoint localhost:9000

# 3. 启动后端
cd ../lite-backend && python main.py

# 4. 启动前端
cd ../lite-qa && npm run dev
```

### 📚 完整文档

- **[部署指南](DEPLOYMENT_GUIDE.md)** - 详细的部署步骤和配置说明
- **[快速参考](QUICK_REFERENCE.md)** - 常用命令和快速查阅
- **[环境配置](env.template)** - 完整的环境变量配置模板

---

## 📁 Backup Structure

```
database-backup/
├── README.md                          # 本文件 - 备份总览
├── DEPLOYMENT_GUIDE.md                # 📘 完整部署指南
├── QUICK_REFERENCE.md                 # 📋 快速参考卡片
├── deploy_init.sh                     # 🚀 一键部署脚本
├── docker-compose.yml                 # 🐳 Docker编排配置
├── env.template                       # ⚙️ 环境变量模板
├── postgresql/                        # PostgreSQL数据库备份
│   ├── 01_core_tables.sql            # 核心表结构 (Agent, 用户, 对话)
│   ├── 02_knowledge_tables.sql       # 知识管理表 (文档, 分块, QA)
│   ├── 03_team_tables.sql            # Team协作表 (执行, 成员, 步骤)
│   ├── 04_system_tables.sql          # 系统表 (配置, 任务队列, 日志)
│   ├── 05_graph_tables.sql           # 图谱表 (节点, 边, 统计, 媒体)
│   ├── 06_remaining_tables_and_views.sql # 剩余表和视图定义
│   ├── 07_indexes_and_constraints.sql # 索引和约束定义
│   └── 08_initialization_data.sql    # 初始化数据和配置
├── elasticsearch/                     # Elasticsearch索引备份
│   ├── elasticsearch_index_templates.json # 完整索引模板配置
│   ├── elasticsearch_index_templates_v2.json # V2索引模板
│   └── elasticsearch_setup.md        # 配置说明和设置指南
├── redis/                             # Redis缓存备份
│   └── redis_config.md               # Redis配置和数据结构说明
└── minio/                             # MinIO对象存储备份
    └── minio_config.md               # 存储桶配置和迁移指南
```

## 🗃️ 数据库概览

### PostgreSQL (主数据库)
- **服务器**: 103.6.168.6:5432
- **数据库**: zzdsj_demo  
- **用户**: zzdsj_demo
- **表数量**: 59个基础表 + 5个视图
- **扩展**: pgvector, uuid-ossp, btree_gin, pg_trgm

#### 核心模块数据
- **用户系统**: 用户管理、会话、权限控制
- **对话系统**: 对话记录、消息、思维过程
- **知识库**: 文档、分块、向量化、QA数据集
- **Agent系统**: 配置、记忆、工具调用、Team协作
- **任务队列**: 异步处理、工作线程、统计监控
- **图谱系统**: 节点、边、布局、算法执行
- **多媒体**: 文件、OCR、视频分析、多模态任务
- **系统配置**: 模型配置、系统设置、性能监控

### Elasticsearch (搜索引擎)
- **服务器**: https://103.6.168.6:9200
- **用户**: elastic / n_pehJf6G7WsW4=5zkpq
- **索引**: 7个主要索引模式
- **特色**: 双向量检索 (通用1024维 + 领域768维)

#### 索引结构
- **mat_qa_chunks**: 文档分块 + 双向量嵌入
- **mat_qa_papers**: 学术论文语义检索
- **mat_qa_documents**: 文档元数据管理
- **mat_qa_media**: 多媒体内容检索
- **mat_qa_retrieval_cache**: 检索结果缓存
- **mat_qa_general_vectors**: 通用向量存储
- **mat_qa_domain_vectors**: 领域向量存储

### Redis (缓存&队列)
- **服务器**: 103.6.168.6:6379
- **密码**: zzdsj123
- **用途**: LLM缓存、任务队列、会话管理、实时连接

#### 主要功能
- **缓存系统**: LLM响应、翻译结果、配置数据
- **任务队列**: 文档处理、向量化、后台任务
- **实时功能**: SSE连接、用户活动、系统指标
- **限流控制**: API调用频率限制、用户配额

### MinIO (对象存储)
- **服务器**: http://103.6.168.6:9000
- **访问**: minio / minio123
- **存储桶**: 8个功能分类存储桶

#### 存储分类
- **documents**: 原始文档存储
- **media**: 多媒体文件存储  
- **thumbnails**: 缩略图和预览
- **knowledge-graph**: 图谱可视化资源
- **reports**: 生成的报告文件
- **backups**: 系统备份数据
- **logs**: 日志文件归档
- **cache**: 临时缓存文件

## 🚀 快速恢复指南

### 1. PostgreSQL 恢复
```bash
# 创建数据库和用户
createdb -h localhost -U postgres zzdsj_demo
createuser -h localhost -U postgres zzdsj_demo

# 按顺序执行SQL文件
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 01_core_tables.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 02_knowledge_tables.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 03_team_tables.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 04_system_tables.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 05_graph_tables.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 06_remaining_tables_and_views.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 07_indexes_and_constraints.sql
psql -h localhost -U zzdsj_demo -d zzdsj_demo -f 08_initialization_data.sql
```

### 2. Elasticsearch 恢复  
```bash
# 导入索引模板
curl -X PUT "localhost:9200/_index_template/mat_qa_chunks" \
  -H "Content-Type: application/json" \
  -d @elasticsearch_index_templates.json

# 详细步骤见 elasticsearch/elasticsearch_setup.md
```

### 3. Redis 恢复
```bash
# 安装配置Redis
sudo apt-get install redis-server

# 配置认证和网络访问
# 详细步骤见 redis/redis_config.md
```

### 4. MinIO 恢复
```bash
# 安装MinIO服务器
wget https://dl.min.io/server/minio/release/linux-amd64/minio

# 创建存储桶和配置访问策略
# 详细步骤见 minio/minio_config.md
```

## ⚠️ 重要注意事项

### 版本兼容性
- **PostgreSQL**: 需要17+版本 (支持pgvector扩展)
- **Elasticsearch**: 8.x版本 (向量搜索支持)
- **Redis**: 6.x+版本 (现代Redis功能)
- **Python**: 3.11+版本 (应用程序要求)

### 安全配置
1. **修改默认密码**: 所有服务的默认密码都需要在生产环境中修改
2. **网络安全**: 配置防火墙规则，限制数据库访问
3. **SSL/TLS**: 生产环境启用加密传输
4. **备份加密**: 敏感数据备份需要加密存储

### 数据迁移检查清单
- [ ] PostgreSQL连接和查询测试
- [ ] pgvector扩展功能验证
- [ ] Elasticsearch索引创建和搜索测试
- [ ] 向量检索功能验证
- [ ] Redis连接和缓存功能测试
- [ ] MinIO存储桶和文件上传测试
- [ ] 应用程序配置文件更新
- [ ] 系统集成测试

## 📞 技术支持信息

### 核心依赖版本
```yaml
postgresql: "17.5"
pgvector: "0.7.0+"
elasticsearch: "8.11+"
redis: "7.0+"
minio: "latest"
python: "3.11+"
nodejs: "18+"
```

### 性能建议
- **PostgreSQL**: 至少4GB RAM，SSD存储
- **Elasticsearch**: 至少8GB JVM堆内存
- **Redis**: 至少2GB内存用于缓存
- **MinIO**: 根据存储需求配置磁盘空间

### 监控指标
- 数据库连接池状态
- Elasticsearch集群健康状态
- Redis内存使用率和命中率
- MinIO存储使用量和带宽
- 应用程序错误率和响应时间

---

**备份完成时间**: 2025-08-27  
**备份类型**: 完整结构 + 配置 + 初始化数据  
**下次备份建议**: 2025-09-27 或服务器迁移前