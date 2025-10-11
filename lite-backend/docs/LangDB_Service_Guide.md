# LangDB服务启动指南

## 概述

LangDB服务是地聚物材料智能问答系统中的内置监控服务，用于记录和监控Agno Team的执行数据。该服务不需要单独启动外部进程，而是作为后端应用的一部分自动运行。

## 服务架构

### 核心组件

1. **LangDBService类** (`service/langdb_service.py`)
   - 监控数据记录
   - 执行历史管理
   - 性能指标统计
   - 数据库操作

2. **Team API端点** (`api/endpoints/team_api.py`)
   - Team查询接口
   - 监控数据获取
   - 执行状态管理

3. **数据库表结构**
   - `langdb_metrics` - 监控指标表
   - `team_executions` - 执行记录表
   - `team_execution_steps` - 执行步骤表
   - `team_members` - 团队成员表

## 启动流程

### 1. 环境准备

确保以下服务已启动：

```bash
# PostgreSQL数据库
sudo systemctl start postgresql
# 或 macOS
brew services start postgresql

# ElasticSearch
sudo systemctl start elasticsearch
# 或 macOS
brew services start elasticsearch

# Redis (可选，用于缓存)
sudo systemctl start redis
# 或 macOS
brew services start redis
```

### 2. 配置文件设置

复制并配置环境变量：

```bash
cd mat-backend
cp env.example .env
```

编辑 `.env` 文件，确保以下配置正确：

```bash
# 数据库配置
POSTGRESQL_HOST="localhost"
POSTGRESQL_PORT="5432"
POSTGRESQL_DATABASE="mat_demo"
POSTGRESQL_USERNAME="mat_demo"
POSTGRESQL_PASSWORD="your-database-password"

# LLM API配置
ONE_API_KEY="your-one-api-key-here"
ONE_API_BASE_URL="http://your-one-api-host:port/v1"

# 应用环境
MAT_QA_ENV="development"
```

### 3. 系统初始化

运行系统初始化脚本：

```bash
# 安装依赖
pip install -r requirements.txt

# 执行系统初始化
./scripts/setup.sh init

# 或使用快速启动脚本
./scripts/quick_start.sh
```

### 4. 启动后端应用

```bash
# 方式1：直接启动
python main.py

# 方式2：使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 方式3：使用PM2 (生产环境)
pm2 start ecosystem.config.js
```

## 服务验证

### 1. 健康检查

访问以下端点验证服务状态：

```bash
# 系统信息
curl http://localhost:8000/info

# 健康检查
curl http://localhost:8000/health

# API文档
curl http://localhost:8000/docs
```

### 2. Team功能测试

```bash
# 测试Team查询
curl -X POST http://localhost:8000/api/team/query \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "geopolymer_qa_team_v2",
    "query": "地聚物材料的强度特性是什么？",
    "session_id": "test_session",
    "stream": false,
    "enable_monitoring": true
  }'

# 获取可用团队列表
curl http://localhost:8000/api/team/teams

# 获取Team统计
curl http://localhost:8000/api/team/stats
```

### 3. LangDB监控验证

```bash
# 获取监控指标
curl http://localhost:8000/api/team/langdb/metrics/test_session

# 获取执行历史
curl http://localhost:8000/api/team/langdb/history/test_session

# 获取性能数据
curl http://localhost:8000/api/team/langdb/performance/test_session
```

## 数据库表结构

### langdb_metrics表

```sql
CREATE TABLE langdb_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### team_executions表

```sql
CREATE TABLE team_executions (
    execution_id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    team_name VARCHAR(200) NOT NULL,
    query TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    result_content TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 监控功能

### 1. 实时监控

LangDB服务提供以下实时监控功能：

- **执行状态跟踪**：记录每个Team查询的执行状态
- **成员调用监控**：监控每个智能体成员的调用情况
- **性能指标收集**：收集响应时间、成功率等指标
- **错误追踪**：记录和追踪执行过程中的错误

### 2. 数据可视化

通过前端页面可以查看：

- **执行历史**：查看所有Team查询的历史记录
- **性能统计**：查看成功率、平均响应时间等统计信息
- **成员性能**：查看每个智能体成员的性能表现
- **实时指标**：查看实时的执行状态和指标

### 3. 告警机制

系统支持以下告警：

- **执行失败告警**：当Team查询失败时发出告警
- **性能告警**：当响应时间超过阈值时发出告警
- **错误率告警**：当错误率超过阈值时发出告警

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查PostgreSQL服务状态
   sudo systemctl status postgresql
   
   # 检查数据库连接
   psql -h localhost -U mat_demo -d mat_demo
   ```

2. **ElasticSearch连接失败**
   ```bash
   # 检查ElasticSearch服务状态
   sudo systemctl status elasticsearch
   
   # 检查ES健康状态
   curl http://localhost:9200/_cluster/health
   ```

3. **API调用失败**
   ```bash
   # 检查后端服务状态
   curl http://localhost:8000/health
   
   # 查看应用日志
   tail -f logs/app.log
   ```

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看LangDB服务日志
grep "LangDB" logs/app.log
```

## 性能优化

### 1. 数据库优化

```sql
-- 创建索引优化查询性能
CREATE INDEX idx_langdb_metrics_session_id ON langdb_metrics(session_id);
CREATE INDEX idx_langdb_metrics_metric_type ON langdb_metrics(metric_type);
CREATE INDEX idx_langdb_metrics_timestamp ON langdb_metrics(timestamp);

-- 定期清理旧数据
DELETE FROM langdb_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
```

### 2. 缓存优化

```python
# 启用Redis缓存
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

# 缓存配置
CACHE_TTL = 3600  # 1小时
```

### 3. 监控优化

```python
# 批量写入优化
BATCH_SIZE = 100
FLUSH_INTERVAL = 30  # 30秒刷新一次
```

## 生产环境部署

### 1. 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

### 2. 使用Docker部署

```bash
# 构建镜像
docker build -t mat-backend .

# 运行容器
docker run -d -p 8000:8000 --name mat-backend mat-backend
```

### 3. 反向代理配置

```nginx
# Nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 总结

LangDB服务是地聚物材料智能问答系统的重要组成部分，提供了完整的Team执行监控功能。通过正确的配置和启动流程，可以确保系统正常运行并提供高质量的监控数据。

如需更多帮助，请参考：
- [系统初始化文档](../document/系统初始化文档.md)
- [数据库设计文档](../document/数据库设计.md)
- [ES初始化及设计文档](../document/ES初始化及设计.md) 