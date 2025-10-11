# NextAgentLite 快速参考卡

**版本**: v1.3.2 | **更新**: 2025-09-26

---

## 🚀 快速启动

### Docker一键部署（推荐）

```bash
cd database-backup
cp env.template .env
vi .env  # 修改配置
docker-compose up -d
./deploy_init.sh
```

### 手动启动

```bash
# 后端
cd lite-backend && python main.py

# 前端
cd lite-qa && npm run dev
```

**访问**: http://localhost:5173

---

## 📦 核心服务端口

| 服务 | 端口 | 访问地址 |
|------|------|---------|
| PostgreSQL | 5432 | localhost:5432 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Backend API | 8000 | http://localhost:8000 |
| Frontend | 5173 | http://localhost:5173 |

---

## 🔧 常用命令

### Docker操作

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启单个服务
docker-compose restart [service_name]

# 进入容器
docker exec -it nextagent_postgres bash
```

### 数据库操作

```bash
# PostgreSQL连接
psql -h localhost -U postgres -d nextagent_lite

# 常用SQL
SELECT COUNT(*) FROM document_chunks;
SELECT COUNT(*) FROM knowledge_documents;
SELECT * FROM agent_configs LIMIT 5;

# 备份数据库
pg_dump -h localhost -U postgres -d nextagent_lite -F c -f backup.dump

# 恢复数据库
pg_restore -h localhost -U postgres -d nextagent_lite -v backup.dump
```

### Elasticsearch操作

```bash
# 查看集群健康
curl -u elastic:password "http://localhost:9200/_cluster/health?pretty"

# 查看所有索引
curl -u elastic:password "http://localhost:9200/_cat/indices?v"

# 查看索引文档数
curl -u elastic:password "http://localhost:9200/mat_qa_chunks/_count"

# 删除索引
curl -X DELETE -u elastic:password "http://localhost:9200/mat_qa_chunks"
```

### Redis操作

```bash
# 连接Redis
redis-cli -h localhost -p 6379 -a password

# 常用命令
PING
INFO
DBSIZE
KEYS pattern*
GET key
DEL key
FLUSHDB  # 清空当前数据库（谨慎使用）
```

### MinIO操作

```bash
# 配置mc
mc alias set myminio http://localhost:9000 minio minio123

# 列出存储桶
mc ls myminio

# 查看存储桶内容
mc ls myminio/policy-qa-documents

# 上传文件
mc cp local-file.pdf myminio/policy-qa-documents/

# 下载文件
mc cp myminio/policy-qa-documents/file.pdf ./

# 备份存储桶
mc mirror myminio/policy-qa-documents ./backup/
```

---

## 🔍 API测试

### 健康检查

```bash
curl http://localhost:8000/health
```

### 单Agent查询

```bash
curl -X POST http://localhost:8000/api/v1/qa/single \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "question_decomposition_agent",
    "question": "什么是地聚物？"
  }'
```

### Team查询

```bash
curl -X POST http://localhost:8000/api/team/query \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "geopolymer_qa_team_v2",
    "query": "地聚物材料的强度特性是什么？"
  }'
```

### 文档上传

```bash
curl -X POST http://localhost:8000/api/v1/knowledge/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "collection_id=your-collection-id"
```

### 向量检索

```bash
curl -X POST http://localhost:8000/api/v1/retrieval/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "测试查询",
    "top_k": 5,
    "threshold": 0.7
  }'
```

---

## 📊 数据库表清单

### 核心表（13个）
- `users` - 用户信息
- `conversations` - 对话会话
- `conversation_messages` - 对话消息
- `agent_configs` - Agent配置
- `agent_memories` - Agent记忆
- `agent_runs` - Agent运行记录
- `agent_sessions` - Agent会话
- `agent_tool_runs` - 工具调用记录
- `workflow_sessions` - 工作流会话
- `team_executions` - Team执行记录
- `team_execution_steps` - Team执行步骤
- `team_members` - Team成员
- `team_execution_templates` - Team模板

### 知识库表（15个）
- `knowledge_collections` - 知识集合
- `knowledge_documents` - 文档管理
- `document_chunks` - 文档分块
- `document_metadata` - 文档元数据
- `qa_datasets` - QA数据集
- `qa_pairs` - QA对
- `qa_extraction_tasks` - QA提取任务
- `qa_pair_sources` - QA来源
- `folders` - 文件夹
- `chunking_configs` - 分块配置
- `embedding_tasks` - 嵌入任务
- `knowledge_sources` - 知识来源
- `metadata_templates` - 元数据模板
- `extraction_rules` - 提取规则
- `document_tags` - 文档标签

### 图谱表（8个）
- `graph_nodes` - 图节点
- `graph_edges` - 图边
- `graph_stats` - 图统计
- `graph_algorithms` - 图算法
- `graph_layouts` - 图布局
- `graph_media` - 图媒体
- `hirag_graphs` - HiRAG图
- `hirag_nodes` - HiRAG节点

### 系统表（16个）
- `task_queue` - 任务队列
- `task_workers` - 任务工作者
- `task_stats` - 任务统计
- `system_config` - 系统配置
- `model_configs` - 模型配置
- `api_keys` - API密钥
- `usage_logs` - 使用日志
- `error_logs` - 错误日志
- `performance_logs` - 性能日志
- `audit_logs` - 审计日志
- `mcp_integrations` - MCP集成
- `mcp_sessions` - MCP会话
- `unla_router_map` - Router映射
- `user_preferences` - 用户偏好
- `notifications` - 通知
- `system_metrics` - 系统指标

---

## 🔑 默认凭证（请在生产环境修改）

### PostgreSQL
- User: `postgres`
- Password: `postgres`
- Database: `nextagent_lite`

### Elasticsearch
- User: `elastic`
- Password: `changeme`

### Redis
- Password: `redis123`

### MinIO
- Access Key: `minio`
- Secret Key: `minio123`

---

## 📝 配置文件位置

### 后端配置
- 环境变量: `lite-backend/.env`
- Agent配置: `lite-backend/config/agent_teams_v2.yaml`
- 模型配置: `lite-backend/config/models.yaml`

### 前端配置
- 环境变量: `lite-qa/.env.local`
- 应用配置: `lite-qa/src/config/appConfig.ts`

### 数据库配置
- PostgreSQL: `/etc/postgresql/17/main/postgresql.conf`
- Elasticsearch: `elasticsearch-8.11.0/config/elasticsearch.yml`
- Redis: `/etc/redis/redis.conf`
- MinIO: `/etc/default/minio`

---

## 🐛 常见问题快速修复

### 1. 服务无法启动

```bash
# 检查端口占用
sudo lsof -i :8000
sudo lsof -i :5432

# 杀掉占用进程
kill -9 <PID>

# 重启服务
docker-compose restart
```

### 2. 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 重启PostgreSQL
sudo systemctl restart postgresql

# 检查连接
psql -h localhost -U postgres -c "SELECT 1"
```

### 3. 向量检索无结果

```bash
# 检查向量是否生成
psql -h localhost -U postgres -d nextagent_lite -c \
  "SELECT COUNT(*) FROM document_chunks WHERE general_embedding IS NOT NULL;"

# 重新生成向量
curl -X POST http://localhost:8000/api/v1/knowledge/vectorize
```

### 4. MinIO访问被拒绝

```bash
# 检查存储桶策略
mc policy get myminio/policy-qa-documents

# 设置公共访问
mc policy set download myminio/policy-qa-documents
```

### 5. Redis内存溢出

```bash
# 检查内存使用
redis-cli INFO memory

# 清理过期键
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL

# 设置最大内存
redis-cli CONFIG SET maxmemory 2gb
```

---

## 📈 性能优化命令

### PostgreSQL优化

```bash
# Vacuum分析
psql -h localhost -U postgres -d nextagent_lite -c "VACUUM ANALYZE;"

# 重建索引
psql -h localhost -U postgres -d nextagent_lite -c "REINDEX DATABASE nextagent_lite;"

# 检查慢查询
psql -h localhost -U postgres -d nextagent_lite -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Elasticsearch优化

```bash
# 强制合并索引
curl -X POST "http://localhost:9200/mat_qa_chunks/_forcemerge?max_num_segments=1"

# 清理缓存
curl -X POST "http://localhost:9200/_cache/clear"

# 查看节点统计
curl "http://localhost:9200/_nodes/stats?pretty"
```

### Redis优化

```bash
# 内存清理
redis-cli MEMORY PURGE

# 持久化
redis-cli BGSAVE

# 查看慢日志
redis-cli SLOWLOG GET 10
```

---

## 🔄 备份和恢复

### 快速备份

```bash
# 一键备份所有数据
BACKUP_DIR="/backup/nextagent/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# PostgreSQL
pg_dump -h localhost -U postgres -d nextagent_lite -F c -f $BACKUP_DIR/db.dump

# MinIO
mc mirror myminio/policy-qa-documents $BACKUP_DIR/minio/

# Redis
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/

# 压缩
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
```

### 快速恢复

```bash
# 解压备份
tar -xzf backup.tar.gz

# PostgreSQL
pg_restore -h localhost -U postgres -d nextagent_lite -v db.dump

# MinIO
mc mirror ./minio/ myminio/policy-qa-documents/

# Redis
sudo cp dump.rdb /var/lib/redis/
sudo systemctl restart redis
```

---

## 📞 获取帮助

### 日志位置

```bash
# 应用日志
tail -f lite-backend/logs/app.log

# Docker日志
docker-compose logs -f

# PostgreSQL日志
tail -f /var/log/postgresql/postgresql-17-main.log

# Nginx日志
tail -f /var/log/nginx/error.log
```

### 系统诊断

```bash
# 检查所有服务状态
./deploy_init.sh --help

# 查看系统资源
docker stats

# 磁盘使用
df -h

# 内存使用
free -h

# 网络连接
netstat -tulpn | grep LISTEN
```

### 文档参考

- **完整部署指南**: `DEPLOYMENT_GUIDE.md`
- **项目说明**: `README.md`
- **技术架构**: `design/TECHNICAL_ARCHITECTURE.md`
- **数据库结构**: `postgresql/README.md`

---

**提示**: 将此文档保存为书签，随时查阅！ 📌
