# 地聚物材料智能问答系统 - 后端服务

> 基于地聚合物的论文高质量QA问答系统后端服务

## 项目概述

本项目是一个基于地聚物材料研究的智能问答系统后端，采用FastAPI框架开发，支持多模态AI对话、知识图谱构建、文档向量化等功能。

### 技术架构

```
Backend Architecture
├── API Layer (FastAPI)
├── Service Layer (Agno框架)
├── Database Layer (PostgreSQL + ElasticSearch)
└── LLM Layer (Qwen系列 + MatBERT)
```

### ✨ 核心功能

- **智能对话**: 基于Qwen2.5/3系列的专业问答
- **知识库管理**: 支持PDF、DOCX等格式文档向量化
- **多模态处理**: 图像OCR、视频分析、图文理解
- **知识图谱**: 实体关系抽取与可视化
- **检索增强**: 混合检索 + 重排序机制

## 数据库设计

### 数据库统计
- **PostgreSQL**: 25个表，43个索引，14个触发器
- **ElasticSearch**: 向量存储与混合检索
- **ArangoDB**: 知识图谱存储(可选)

### 主要模块

| 模块 | 表数量 | 主要功能 |
|------|--------|----------|
| 用户管理 | 2 | 用户信息、偏好设置 |
| 对话系统 | 2 | 会话管理、消息存储 |
| 知识库 | 4 | 文档管理、向量化、检索缓存 |
| 多模态 | 5 | 媒体文件、OCR |
| 知识图谱 | 7 | 节点、关系、布局、算法 |
| 系统管理 | 3 | 配置、日志、任务队列 |
| 其他 | 2 | 论文、任务处理 |

> 详细设计文档: [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)

### 环境要求

- Python 3.11+
- PostgreSQL 17
- ElasticSearch 9.0.0
- MinIO Server（对象存储）
- Redis 7.0+ (可选)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd mat-backend
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **环境配置**
```bash
cp env.example .env
# 编辑.env文件，配置数据库连接等信息
```

4. **MinIO服务启动**（可选）
```bash
# 如果使用MinIO存储，需要先启动MinIO服务
# 使用Docker启动MinIO（推荐）
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# MinIO控制台访问地址：http://localhost:9001
```

5. **系统初始化**（新版自动化初始化）
```bash
# 方式1: 使用Shell脚本（推荐）
./scripts/setup.sh init

# 方式2: 使用Python脚本
python scripts/initialize_system.py

# 检查初始化状态
./scripts/setup.sh check
```

6. **启动服务**
```bash
python main.py
```

#### 🚀 一键启动（开发环境）
```bash
# 自动检查环境、初始化系统并启动服务
./scripts/quick_start.sh
```

> **新功能**: 系统现在支持自动化初始化，包括数据库和ElasticSearch的完整配置。详见 [初始化指南](./docs/INITIALIZATION_GUIDE.md)

### 配置说明

#### 数据库配置 (`config/config.yaml`)

```yaml
database:
  postgresql:
    host: localhost
    port: 5432
    database: mat_qa_db
    username: mat_user
    password: mat_password
  
  elasticsearch:
    hosts: ["http://localhost:9200"]
    index_prefix: mat_qa

# 对象存储配置
storage:
  minio:
    enabled: true  # 是否启用MinIO（false时使用本地存储）
    endpoint: localhost:9000
    access_key: minioadmin
    secret_key: minioadmin
    documents_bucket: mat-qa-documents
    media_bucket: mat-qa-media
    thumbnails_bucket: mat-qa-thumbnails
    auto_create_buckets: true  # 是否自动创建存储桶
    skip_bucket_validation: false  # 跳过存储桶验证（生产环境推荐设为true）
```

#### AI模型配置

```yaml
llm:
  providers:
    ali:
      api_key: ${DASHSCOPE_API_KEY}
      base_url: https://dashscope.aliyuncs.com/api/v1
      models:
        - id: qwen-chat
          name: Qwen2.5-72B-Instruct
        - id: qwen-reasoning  
          name: Qwen3-7B-Instruct-Q4
        - id: qwen-vl-chat
          name: Qwen-VL-Chat
```

## API文档

### 主要端点

| 模块 | 端点 | 功能 |
|------|------|------|
| 对话 | `/api/qa/chat` | 智能问答 |
| 知识库 | `/api/knowledge/upload` | 文档上传 |
| 图谱 | `/api/graph/data` | 图谱数据 |
| 多模态 | `/api/multimodal/ocr` | OCR识别 |
| 存储 | `/api/storage/upload/document` | 文件上传 |
| 存储 | `/api/storage/download/{bucket}/{file}` | 文件下载 |

### 示例请求

#### 智能问答
```json
POST /api/qa/chat
{
  "message": "什么是地聚物材料？",
  "conversation_id": "conv_123",
  "agent_config": {
    "model": "qwen-chat-model",
    "temperature": 0.7
  }
}
```

#### 文档上传
```json
POST /api/knowledge/upload
Content-Type: multipart/form-data

file: document.pdf
tags: ["地聚物", "材料科学"]
vectorConfig: {
  "useDefault": true,
  "chunkSize": 500
}
```

## 开发工具

### 数据库管理

#### 1. 系统初始化
```bash
# 完整系统初始化（数据库 + ElasticSearch）
./scripts/setup.sh init

# 仅初始化数据库
./scripts/setup.sh init-db

# 仅初始化ElasticSearch
./scripts/setup.sh init-es

# 强制重新初始化
./scripts/setup.sh init --force
```

#### 2. 迁移管理
```bash
# 查看迁移状态
./scripts/setup.sh status

# 执行数据库迁移
python -m migrations.migration_manager migrate

# 执行ES迁移
python migrations/es_migration_manager.py migrate
```

#### 3. 系统维护
```bash
# 检查系统状态
./scripts/setup.sh check

# 修复ElasticSearch索引
./scripts/setup.sh repair-es

# 重置系统（谨慎使用）
./scripts/setup.sh reset
```

### 测试

#### 单元测试
```bash
pytest tests/unit/
```

#### 集成测试
```bash
pytest tests/integration/
```

#### API测试
```bash
pytest tests/api/
```

## 模型集成

### 支持的模型

#### 文本模型
- **Qwen2.5-72B-Instruct**: 主要对话模型
- **Qwen3-7B-Instruct-Q4**: 推理模型(量化版)

#### 嵌入模型  
- **Ali Text Embedding V4**: 通用文本嵌入(1024维)
- **MatBERT**: 材料领域专用嵌入(768维)

#### 多模态模型
- **Qwen-VL-Chat**: 图文对话
- **Qwen-VL-Plus**: 增强OCR识别

### 模型切换

```python
# 在配置中切换默认模型
from core.config_optimized import optimized_config_manager

# 获取模型配置
chat_model = optimized_config_manager.get_provider_config("alibaba", "llm")

# 动态切换模型
agent_service.switch_model("qwen-reasoning-model")
```

## 监控与日志

### 日志配置
```yaml
logging:
  level: INFO
  file_path: "logs/mat_qa_{time:YYYY-MM-DD}.log"
  rotation: "1 day"
  retention: "30 days"
```

### 性能监控
- API响应时间监控
- 数据库查询性能监控  
- AI模型调用统计
- 内存和CPU使用监控

### 健康检查
```bash
# API健康检查
curl http://localhost:8000/health

# 数据库连接检查
curl http://localhost:8000/health/db

# AI模型状态检查
curl http://localhost:8000/health/models
```


## 开发规范

### 代码结构
```
mat-backend/
├── api/                 # API路由层
├── core/               # 核心配置
├── db/                 # 数据库操作
├── service/            # 业务逻辑层
├── models/             # 数据模型
├── migrations/         # 数据库迁移
├── tests/              # 测试文件
└── docs/               # 项目文档
```

### 开发流程
1. 创建功能分支
2. 编写单元测试
3. 实现功能代码
4. 更新API文档
5. 提交代码审查
6. 合并主分支


### 开发环境设置
```bash
# 安装开发依赖
pip install -r requirements-dev.txt

# 配置pre-commit
pre-commit install

# 运行代码检查
black . && flake8 . && mypy .
```

## 故障排除

### MinIO配置问题

#### 签名验证失败 (SignatureDoesNotMatch)

如果在生产环境中遇到MinIO签名验证失败的错误，可以使用跳过验证功能：

```bash
# 设置环境变量跳过存储桶验证
export MINIO_SKIP_BUCKET_VALIDATION=true
export MINIO_AUTO_CREATE_BUCKETS=false

# 或在配置文件中设置
# config/production.yaml
storage:
  minio:
    skip_bucket_validation: true
    auto_create_buckets: false
```

**前提条件**：
- 确保MinIO中已存在所需存储桶：
  - `mat-qa-documents`
  - `mat-qa-media`
  - `mat-qa-thumbnails`
  - `mat-qa-knowledge-graph`

**测试MinIO连接**：
```bash
# 运行MinIO连接测试
python scripts/test_minio_skip_validation.py
```

#### 其他MinIO问题

1. **存储桶权限问题**：确保MinIO凭据有访问所需存储桶的权限
2. **网络连接问题**：检查防火墙设置和网络连通性
3. **时间同步问题**：MinIO签名验证对服务器时间敏感，确保时间同步

详细配置说明参见：[MinIO跳过验证功能文档](./docs/minio_skip_validation.md)

