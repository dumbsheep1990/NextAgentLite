# NextAgentLite 部署和迁移指南

**版本**: v1.3.2
**更新日期**: 2025-09-26
**适用环境**: 生产环境/开发环境

---

## 📋 目录

1. [部署前准备](#部署前准备)
2. [快速部署（Docker）](#快速部署docker)
3. [手动部署](#手动部署)
4. [数据库初始化](#数据库初始化)
5. [服务配置](#服务配置)
6. [数据迁移](#数据迁移)
7. [验证和测试](#验证和测试)
8. [常见问题](#常见问题)

---

## 部署前准备

### 系统要求

#### 硬件要求
- **CPU**: 4核心及以上
- **内存**:
  - 最小配置: 16GB
  - 推荐配置: 32GB及以上
- **存储**:
  - 系统盘: 50GB SSD
  - 数据盘: 200GB+ (根据数据量调整)

#### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **Docker**: 24.0+ (如使用Docker部署)
- **Docker Compose**: 2.20+ (如使用Docker部署)
- **Python**: 3.11+ (手动部署)
- **Node.js**: 18+ (手动部署前端)
- **PostgreSQL**: 17+ with pgvector
- **Elasticsearch**: 8.11+
- **Redis**: 7.0+
- **MinIO**: latest

### 依赖检查

```bash
# 检查Docker
docker --version
docker-compose --version

# 检查Python
python3 --version

# 检查Node.js
node --version
npm --version
```

---

## 快速部署（Docker）

### 1. 克隆或下载项目

```bash
# 如果从Git仓库克隆
git clone <repository-url> NextAgentLite
cd NextAgentLite/database-backup

# 或者直接使用已有的database-backup目录
cd /path/to/database-backup
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.template .env

# 编辑配置文件（根据实际环境修改）
vi .env
```

**重要配置项**：
```bash
# 数据库密码（必须修改）
DB_PASSWORD=your_secure_password

# Elasticsearch密码（必须修改）
ELASTICSEARCH_PASSWORD=your_es_password

# Redis密码（建议修改）
REDIS_PASSWORD=your_redis_password

# MinIO密钥（建议修改）
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key

# LLM API密钥（必须配置）
ALIBABA_LLM_API_KEY=your_alibaba_api_key
GENERAL_EMBEDDING_API_KEY=your_embedding_api_key
```

### 3. 启动服务

```bash
# 启动所有基础服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 初始化数据库

```bash
# 等待服务完全启动（约30秒）
sleep 30

# 执行数据库初始化脚本
chmod +x deploy_init.sh
./deploy_init.sh
```

### 5. 启动应用服务

```bash
# 方式1: 使用Docker（需要先构建镜像）
# 编辑 docker-compose.yml，取消注释 backend 和 frontend 服务
docker-compose up -d backend frontend

# 方式2: 手动启动（推荐用于开发）
# 后端
cd ../lite-backend
python main.py

# 前端（新终端）
cd ../lite-qa
npm run dev
```

### 6. 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **MinIO控制台**: http://localhost:9001

---

## 手动部署

### 1. PostgreSQL 安装和配置

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-17 postgresql-contrib-17

# 安装pgvector扩展
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# 配置PostgreSQL
sudo vi /etc/postgresql/17/main/postgresql.conf
# 添加或修改：
# listen_addresses = '*'
# max_connections = 100
# shared_buffers = 4GB

sudo vi /etc/postgresql/17/main/pg_hba.conf
# 添加：
# host    all    all    0.0.0.0/0    md5

# 重启服务
sudo systemctl restart postgresql
```

### 2. Elasticsearch 安装和配置

```bash
# 下载和安装
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.11.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.11.0-linux-x86_64.tar.gz
cd elasticsearch-8.11.0

# 配置
vi config/elasticsearch.yml
# 修改：
# cluster.name: nextagent-cluster
# network.host: 0.0.0.0
# discovery.type: single-node
# xpack.security.enabled: true
# xpack.security.http.ssl.enabled: false

# 设置密码
./bin/elasticsearch-setup-passwords interactive

# 启动服务
./bin/elasticsearch -d
```

### 3. Redis 安装和配置

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# 配置
sudo vi /etc/redis/redis.conf
# 修改：
# bind 0.0.0.0
# requirepass your_password
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# 重启服务
sudo systemctl restart redis
```

### 4. MinIO 安装和配置

```bash
# 下载MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# 创建数据目录
sudo mkdir -p /data/minio
sudo chown $USER:$USER /data/minio

# 创建systemd服务
sudo vi /etc/systemd/system/minio.service
# 内容参考 minio/minio_config.md

# 启动服务
sudo systemctl start minio
sudo systemctl enable minio

# 安装MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# 配置并创建存储桶
mc alias set myminio http://localhost:9000 minio minio123
mc mb myminio/policy-qa-documents
# ... 其他存储桶
```

### 5. 初始化数据库

```bash
# 使用初始化脚本
cd database-backup
chmod +x deploy_init.sh

# 交互式初始化
./deploy_init.sh \
  --postgres-host localhost \
  --postgres-user postgres \
  --postgres-db nextagent_lite \
  --es-host localhost:9200 \
  --es-user elastic \
  --redis-host localhost \
  --minio-endpoint localhost:9000
```

### 6. 部署应用

#### 后端部署

```bash
cd lite-backend

# 创建虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 复制并配置环境变量
cp ../database-backup/env.template .env
vi .env  # 根据实际环境修改

# 运行数据库迁移（如果需要）
python run_migration.py

# 启动服务
# 开发环境
python main.py

# 生产环境（使用Gunicorn）
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

#### 前端部署

```bash
cd lite-qa

# 安装依赖
npm install

# 配置环境变量
cp ../database-backup/env.template .env.local
vi .env.local  # 配置前端相关变量

# 开发环境
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview

# 使用nginx部署（生产环境）
sudo cp -r dist/* /var/www/nextagent/
# 配置nginx反向代理
```

---

## 数据库初始化

### 自动初始化（推荐）

```bash
# 使用提供的初始化脚本
cd database-backup
./deploy_init.sh
```

### 手动初始化

#### PostgreSQL

```bash
# 创建数据库
createdb -h localhost -U postgres nextagent_lite

# 创建扩展
psql -h localhost -U postgres -d nextagent_lite <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOF

# 按顺序执行SQL文件
cd postgresql
for file in 01_*.sql 02_*.sql 03_*.sql 04_*.sql 05_*.sql 06_*.sql 07_*.sql 08_*.sql; do
  echo "执行: $file"
  psql -h localhost -U postgres -d nextagent_lite -f "$file"
done
```

#### Elasticsearch

```bash
# 导入索引模板
cd elasticsearch

# 方式1: 使用Python脚本
python3 << 'EOF'
import json
import requests

with open('elasticsearch_index_templates_v2.json', 'r') as f:
    templates = json.load(f)

for template_name, template_config in templates.items():
    url = f"http://localhost:9200/_index_template/{template_name}"
    response = requests.put(
        url,
        auth=('elastic', 'your_password'),
        json=template_config,
        verify=False
    )
    print(f"{template_name}: {response.status_code}")
EOF

# 方式2: 使用curl逐个创建
curl -X PUT "http://localhost:9200/mat_qa_chunks" \
  -u elastic:your_password \
  -H "Content-Type: application/json"
# 重复其他索引...
```

#### MinIO

```bash
# 创建所有存储桶
buckets=(
  "policy-qa-documents"
  "policy-qa-media"
  "policy-qa-thumbnails"
  "policy-qa-knowledge-graph"
  "policy-qa-reports"
  "policy-qa-backups"
  "policy-qa-logs"
  "policy-qa-cache"
)

for bucket in "${buckets[@]}"; do
  mc mb myminio/$bucket
done

# 设置公共访问
mc policy set public myminio/policy-qa-thumbnails
```

---

## 服务配置

### Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/nextagent

upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/nextagent;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # SSE支持
    location /stream/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
```

### Systemd 服务配置

#### 后端服务

```ini
# /etc/systemd/system/nextagent-backend.service

[Unit]
Description=NextAgentLite Backend Service
After=network.target postgresql.service elasticsearch.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/nextagent/lite-backend
Environment="PATH=/opt/nextagent/lite-backend/venv/bin"
ExecStart=/opt/nextagent/lite-backend/venv/bin/gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### PM2 进程管理（开发/小型部署）

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'nextagent-backend',
      cwd: './lite-backend',
      script: 'main.py',
      interpreter: 'python3',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G'
    },
    {
      name: 'nextagent-frontend',
      cwd: './lite-qa',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
```

启动：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 数据迁移

### 从旧服务器迁移到新服务器

#### 1. 导出旧服务器数据

```bash
# PostgreSQL
pg_dump -h old-server -U postgres -d nextagent_lite -F c -b -v -f nextagent_backup.dump

# Elasticsearch（使用快照）
curl -X PUT "http://old-server:9200/_snapshot/my_backup" \
  -H "Content-Type: application/json" \
  -d '{"type": "fs", "settings": {"location": "/backup/elasticsearch"}}'

curl -X PUT "http://old-server:9200/_snapshot/my_backup/snapshot_1?wait_for_completion=true"

# MinIO（使用mc mirror）
mc mirror old-minio/policy-qa-documents ./minio-backup/documents/

# Redis（使用RDB）
redis-cli -h old-server BGSAVE
scp old-server:/var/lib/redis/dump.rdb ./redis-backup/
```

#### 2. 传输到新服务器

```bash
# 打包所有备份
tar -czf nextagent_full_backup.tar.gz \
  nextagent_backup.dump \
  minio-backup/ \
  redis-backup/ \
  elasticsearch-backup/

# 传输到新服务器
scp nextagent_full_backup.tar.gz user@new-server:/tmp/

# 在新服务器上解压
ssh user@new-server
cd /tmp
tar -xzf nextagent_full_backup.tar.gz
```

#### 3. 在新服务器上恢复

```bash
# PostgreSQL
pg_restore -h localhost -U postgres -d nextagent_lite -v nextagent_backup.dump

# Elasticsearch
# 先配置快照仓库，然后恢复
curl -X POST "http://localhost:9200/_snapshot/my_backup/snapshot_1/_restore"

# MinIO
mc mirror ./minio-backup/documents/ myminio/policy-qa-documents/

# Redis
sudo cp redis-backup/dump.rdb /var/lib/redis/
sudo systemctl restart redis
```

### Collection架构迁移

如果需要迁移Collection架构：

```bash
cd lite-backend

# 1. 快速设置Collection架构
bash collection_migration.sh quick-setup

# 2. 验证架构
bash collection_migration.sh validate

# 3. 完整数据迁移
bash collection_migration.sh full-migration

# 4. 检查状态
bash collection_migration.sh status
```

---

## 验证和测试

### 1. 服务健康检查

```bash
# PostgreSQL
psql -h localhost -U postgres -d nextagent_lite -c "SELECT version();"

# Elasticsearch
curl -u elastic:password "http://localhost:9200/_cluster/health?pretty"

# Redis
redis-cli -a password ping

# MinIO
mc admin info myminio

# 后端API
curl http://localhost:8000/health

# 前端
curl http://localhost:5173
```

### 2. 功能测试

```bash
# 测试单Agent查询
curl -X POST http://localhost:8000/api/v1/qa/single \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "question_decomposition_agent",
    "question": "测试问题"
  }'

# 测试Team查询
curl -X POST http://localhost:8000/api/team/query \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "geopolymer_qa_team_v2",
    "query": "测试Team查询"
  }'

# 测试文档上传
curl -X POST http://localhost:8000/api/v1/knowledge/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf"

# 测试向量检索
curl -X POST http://localhost:8000/api/v1/retrieval/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "测试检索",
    "top_k": 5
  }'
```

### 3. 性能测试

```bash
# 使用Apache Bench
ab -n 100 -c 10 http://localhost:8000/health

# 使用wrk
wrk -t4 -c100 -d30s http://localhost:8000/health
```

---

## 常见问题

### Q1: PostgreSQL pgvector扩展安装失败

**问题**: `ERROR: could not open extension control file`

**解决方案**:
```bash
# 检查PostgreSQL版本
pg_config --version

# 确保安装了开发包
sudo apt-get install postgresql-server-dev-17

# 重新编译安装pgvector
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make clean
make
sudo make install
```

### Q2: Elasticsearch 内存不足

**问题**: `OutOfMemoryError: Java heap space`

**解决方案**:
```bash
# 调整JVM堆大小
vi config/jvm.options
# 修改：
-Xms4g
-Xmx4g

# 或使用环境变量
export ES_JAVA_OPTS="-Xms4g -Xmx4g"
```

### Q3: MinIO 存储桶访问权限错误

**问题**: `Access Denied`

**解决方案**:
```bash
# 检查存储桶策略
mc policy get myminio/bucket-name

# 设置正确的策略
mc policy set public myminio/bucket-name  # 公共读取
mc policy set download myminio/bucket-name  # 仅下载
```

### Q4: Redis 连接超时

**问题**: `Connection timeout`

**解决方案**:
```bash
# 检查Redis配置
redis-cli -h localhost -p 6379 CONFIG GET timeout

# 调整超时设置
redis-cli -h localhost -p 6379 CONFIG SET timeout 0

# 检查防火墙
sudo ufw allow 6379
```

### Q5: 向量检索结果为空

**问题**: 检索返回空结果

**解决方案**:
```bash
# 1. 检查向量是否已生成
psql -h localhost -U postgres -d nextagent_lite -c \
  "SELECT COUNT(*) FROM document_chunks WHERE general_embedding IS NOT NULL;"

# 2. 检查Elasticsearch索引
curl -u elastic:password "http://localhost:9200/mat_qa_chunks/_count"

# 3. 重新生成向量
curl -X POST http://localhost:8000/api/v1/knowledge/vectorize \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Q6: Docker容器无法访问

**问题**: 容器间网络不通

**解决方案**:
```bash
# 检查网络
docker network ls
docker network inspect nextagent_network

# 重建网络
docker-compose down
docker network prune
docker-compose up -d

# 检查DNS解析
docker exec nextagent_backend ping postgres
```

---

## 监控和维护

### 日志管理

```bash
# 应用日志
tail -f lite-backend/logs/app.log

# Docker日志
docker-compose logs -f

# PostgreSQL日志
tail -f /var/log/postgresql/postgresql-17-main.log

# Elasticsearch日志
tail -f elasticsearch-8.11.0/logs/nextagent-cluster.log

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 备份策略

```bash
# 每日自动备份脚本
# /etc/cron.daily/nextagent-backup

#!/bin/bash
BACKUP_DIR="/backup/nextagent/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# PostgreSQL
pg_dump -h localhost -U postgres -d nextagent_lite -F c -f $BACKUP_DIR/db.dump

# Elasticsearch
curl -X PUT "http://localhost:9200/_snapshot/daily_backup/snapshot_$(date +%Y%m%d)"

# MinIO
mc mirror myminio/policy-qa-documents $BACKUP_DIR/minio/

# 压缩并保留7天
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
find /backup/nextagent -type f -mtime +7 -delete
```

### 性能优化

```bash
# PostgreSQL vacuum
psql -h localhost -U postgres -d nextagent_lite -c "VACUUM ANALYZE;"

# Elasticsearch索引优化
curl -X POST "http://localhost:9200/mat_qa_chunks/_forcemerge?max_num_segments=1"

# Redis内存优化
redis-cli MEMORY PURGE

# MinIO清理过期文件
mc rm --recursive --force --older-than 30d myminio/policy-qa-cache/
```

---

## 附录

### A. 端口清单

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| PostgreSQL | 5432 | TCP | 数据库服务 |
| Elasticsearch | 9200 | HTTP | REST API |
| Elasticsearch | 9300 | TCP | 集群通信 |
| Redis | 6379 | TCP | 缓存服务 |
| MinIO | 9000 | HTTP | S3 API |
| MinIO | 9001 | HTTP | Web控制台 |
| Backend API | 8000 | HTTP | 后端服务 |
| Frontend | 5173 | HTTP | 前端开发服务 |
| Frontend (Prod) | 80/443 | HTTP/HTTPS | 生产前端 |

### B. 目录结构

```
NextAgentLite/
├── database-backup/              # 数据库备份和部署脚本
│   ├── postgresql/              # PostgreSQL结构和数据
│   ├── elasticsearch/           # ES索引模板
│   ├── redis/                   # Redis配置
│   ├── minio/                   # MinIO配置
│   ├── deploy_init.sh          # 一键部署脚本
│   ├── docker-compose.yml      # Docker编排
│   ├── env.template            # 环境变量模板
│   └── DEPLOYMENT_GUIDE.md     # 本文档
├── lite-backend/                # 后端代码
├── lite-qa/                     # 前端代码
└── design/                      # 设计文档
```

### C. 环境变量清单

详见 `env.template` 文件，主要包括：
- 数据库连接配置
- LLM API密钥
- 嵌入模型配置
- 服务端点配置
- 功能开关

### D. 技术支持

- **文档**: 查看 `CLAUDE.md` 和 `design/TECHNICAL_ARCHITECTURE.md`
- **问题反馈**: 提交到项目Issue跟踪系统
- **紧急联系**: 联系系统管理员

---

**部署完成检查清单**:

- [ ] 所有服务正常启动
- [ ] 数据库连接成功
- [ ] 向量检索功能正常
- [ ] 文档上传功能正常
- [ ] Agent问答功能正常
- [ ] Team协作功能正常
- [ ] 知识图谱功能正常
- [ ] 前端页面可访问
- [ ] 日志记录正常
- [ ] 备份策略已配置

**祝部署顺利！** 🚀
