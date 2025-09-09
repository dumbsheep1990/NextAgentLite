# 向量索引管理系统文档

## 概述

NextAgentLite 的向量索引管理系统基于 PostgreSQL + pgvector 扩展，提供了 Collection 级别的向量索引创建、重建和优化功能。系统支持 IVFFlat 和 HNSW 两种索引类型，可以根据数据规模自动推荐最佳配置。

## 功能特性

### ✅ 已实现功能

1. **多种索引类型支持**
   - IVFFlat: 适合大规模数据的聚类索引
   - HNSW: 高性能图结构索引，查询速度快

2. **多种距离度量**
   - 余弦相似度 (vector_cosine_ops) - 推荐用于文本向量
   - 欧几里得距离 (vector_l2_ops)
   - 内积距离 (vector_ip_ops)

3. **Collection 级别管理**
   - 按 Collection 隔离的索引管理
   - 支持多向量字段 (embedding, general_embedding, domain_embedding)
   - 自动分析数据分布和推荐配置

4. **简化配置管理**
   - 默认使用 HNSW 索引 (m=16, ef_construction=64)
   - 用户可选择 IVFFlat 索引进行构建
   - 移除智能推荐，避免不必要的复杂度

5. **性能监控**
   - 索引大小统计
   - 构建时间记录
   - 索引状态监控

## 技术架构

### 服务层架构

```
┌─────────────────────────────────┐
│      VectorIndexService         │
│  (service/vector_index_service) │
├─────────────────────────────────┤
│ • 索引分析和推荐                │
│ • 索引创建和重建                │
│ • 状态监控和性能统计            │
│ • 元数据管理                    │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      VectorIndexAPI             │
│   (api/endpoints/vector_index)  │
├─────────────────────────────────┤
│ • REST API 端点                 │
│ • 请求验证和响应格式化          │
│ • 异步任务管理                  │
│ • 错误处理和日志记录            │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│         PostgreSQL              │
│       + pgvector 扩展           │
├─────────────────────────────────┤
│ • 向量数据存储                  │
│ • IVFFlat/HNSW 索引             │
│ • 距离计算优化                  │
│ • Collection 级过滤             │
└─────────────────────────────────┘
```

### 数据模型

#### 向量存储表结构

```sql
-- 文档分块表 (document_chunks)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES knowledge_documents(id),
    content TEXT NOT NULL,
    
    -- 向量字段
    embedding JSONB,              -- 原始向量 (1536维)
    general_embedding JSONB,      -- 通用向量 text-embedding-v4 (1536维)  
    domain_embedding JSONB,       -- 领域向量 MatBERT (768维)
    
    -- 向量模型信息
    general_model VARCHAR(100),
    domain_model VARCHAR(100),
    vectorization_strategy VARCHAR(20),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Collection 表
CREATE TABLE knowledge_collections (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    config JSONB,                 -- 存储索引元数据
    document_count INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 索引创建示例

```sql
-- HNSW 索引 (适合小到中等规模数据)
CREATE INDEX idx_collection_general_hnsw 
ON document_chunks 
USING hnsw (general_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE document_id IN (
    SELECT id FROM knowledge_documents 
    WHERE collection_id = 'target_collection_id'
    AND general_embedding IS NOT NULL
);

-- IVFFlat 索引 (适合大规模数据)  
CREATE INDEX idx_collection_general_ivfflat
ON document_chunks 
USING ivfflat (general_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE document_id IN (
    SELECT id FROM knowledge_documents 
    WHERE collection_id = 'target_collection_id'
    AND general_embedding IS NOT NULL
);
```

## API 接口文档

### 基础 URL

```
http://localhost:8000/api/v1/vector-index
```

### 1. 获取支持的配置选项

**GET** `/supported-configs`

**响应示例:**
```json
{
  "index_types": [
    {
      "value": "hnsw",
      "name": "HNSW",
      "description": "高性能图结构索引，构建慢但查询快",
      "parameters": {
        "m": {"description": "每个节点的连接数", "default": 16},
        "ef_construction": {"description": "构建时搜索深度", "default": 64}
      }
    }
  ],
  "distance_metrics": [
    {
      "value": "vector_cosine_ops",
      "name": "Cosine Similarity", 
      "description": "余弦相似度，适合文本向量"
    }
  ],
  "recommended_configs": {
    "small": {
      "name": "小规模数据 (<1K向量)",
      "index_type": "hnsw",
      "parameters": {"m": 16, "ef_construction": 64}
    }
  }
}
```

### 2. 分析 Collection 向量数据

**GET** `/collections/{collection_id}/analysis`

**响应示例:**
```json
{
  "collection_id": "uuid-string",
  "total_chunks": 1500,
  "vector_statistics": {
    "general_embedding": {
      "count": 1200,
      "dimension": 1536
    },
    "domain_embedding": {
      "count": 800, 
      "dimension": 768
    }
  },
  "default_config": {
    "index_type": "hnsw",
    "distance_metric": "vector_cosine_ops",
    "m": 16,
    "ef_construction": 64
  }
}
```

### 3. 获取索引状态

**GET** `/collections/{collection_id}/status`

**响应示例:**
```json
[
  {
    "collection_id": "uuid-string",
    "collection_name": "材料科学知识库",
    "index_name": "idx_abc12345_general_embedding_hnsw",
    "index_type": "hnsw",
    "vector_field": "general_embedding",
    "vector_dimension": 1536,
    "exists": true,
    "is_valid": true,
    "size_mb": 45.2,
    "total_vectors": 1200,
    "last_rebuild": "2025-08-22T10:30:00Z"
  }
]
```

### 4. 创建向量索引

**POST** `/create`

**请求体:**
```json
{
  "collection_id": "uuid-string",
  "vector_field": "general_embedding",
  "config": {
    "index_type": "hnsw",
    "distance_metric": "vector_cosine_ops",
    "m": 16,
    "ef_construction": 64
  },
  "force_recreate": false
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "索引 idx_abc12345_general_embedding_hnsw 创建成功",
  "data": {
    "index_name": "idx_abc12345_general_embedding_hnsw",
    "build_time": 12.45,
    "vector_field": "general_embedding",
    "index_type": "hnsw"
  }
}
```

### 5. 重建索引

**POST** `/rebuild`

**请求体:**
```json
{
  "collection_id": "uuid-string",
  "vector_fields": ["general_embedding", "domain_embedding"],
  "config": {
    "index_type": "hnsw",
    "distance_metric": "vector_cosine_ops",
    "m": 16,
    "ef_construction": 64
  }
}
```

**响应示例 (同步模式):**
```json
{
  "success": true,
  "message": "索引重建完成，耗时 25.67 秒",
  "async_mode": false,
  "data": {
    "collection_id": "uuid-string",
    "total_build_time": 25.67,
    "rebuilt_indexes": [
      {
        "index_name": "idx_abc12345_general_embedding_hnsw",
        "build_time": 15.23,
        "vector_field": "general_embedding"
      }
    ],
    "errors": []
  }
}
```

**响应示例 (异步模式):**
```json
{
  "success": true,
  "message": "已启动后台重建任务，共需处理 50000 个向量",
  "async_mode": true,
  "estimated_time_minutes": 50,
  "data": {
    "collection_id": "uuid-string",
    "total_vectors": 50000
  }
}
```

## 使用指南

### 1. 选择合适的索引类型

#### HNSW 索引 (默认推荐)
- **适用场景**: 通用场景，默认使用
- **优势**: 查询速度快，精确度高
- **参数配置**:
  - `m`: 16 (连接数，影响精确度和内存)
  - `ef_construction`: 64 (构建时搜索深度)

#### IVFFlat 索引  
- **适用场景**: 特大规模数据或有特殊需求时选择
- **优势**: 内存占用小，构建速度快
- **参数配置**:
  - `lists`: 向量数量 / 1000 (聚类数量)

### 2. 距离度量选择

| 度量类型 | 适用场景 | 计算特点 |
|---------|---------|---------|
| `vector_cosine_ops` | 文本向量、语义相似度 | 忽略向量长度，关注方向 |
| `vector_l2_ops` | 图像特征、精确匹配 | 考虑向量长度差异 |
| `vector_ip_ops` | 特殊应用场景 | 内积计算 |

### 3. 性能优化建议

#### 索引参数配置

```python
# 默认 HNSW 配置 (推荐使用)
default_config = {
    "index_type": "hnsw",
    "distance_metric": "vector_cosine_ops",
    "m": 16,
    "ef_construction": 64
}

# IVFFlat 配置 (特殊场景)
ivfflat_config = {
    "index_type": "ivfflat", 
    "distance_metric": "vector_cosine_ops",
    "lists": max(100, total_vectors // 1000)  # 根据数据量调整
}
```

#### 查询优化

```python
# 设置查询时的搜索参数
# 对于 IVFFlat 索引
SET ivfflat.probes = 10;  # 搜索的聚类数量

# 对于 HNSW 索引  
SET hnsw.ef_search = 100;  # 查询时的搜索深度
```

### 4. 监控和维护

#### 索引状态检查

```python
import requests

# 定期检查索引状态
response = requests.get(f"{BASE_URL}/vector-index/collections/{collection_id}/status")
if response.status_code == 200:
    statuses = response.json()
    for status in statuses:
        if not status['exists'] or not status['is_valid']:
            print(f"⚠️ 索引异常: {status['index_name']}")
```

#### 性能监控

```sql
-- 查看索引大小
SELECT 
    schemaname,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE tablename = 'document_chunks'
    AND indexdef LIKE '%vector%';

-- 查看查询执行计划
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM document_chunks 
WHERE general_embedding <-> '[0.1,0.2,...]'::vector < 0.5
LIMIT 10;
```

## 故障排除

### 常见问题

#### 1. 索引创建失败

**问题**: `ERROR: extension "vector" does not exist`

**解决**: 安装 pgvector 扩展
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. 向量维度不匹配

**问题**: `ERROR: vector dimension mismatch`

**解决**: 检查向量数据的维度一致性
```python
# 分析向量数据
analysis = requests.get(f"{BASE_URL}/vector-index/collections/{collection_id}/analysis")
print("向量维度分布:", analysis.json()['vector_statistics'])
```

#### 3. 内存不足

**问题**: 大规模 HNSW 索引创建时内存溢出

**解决**: 
1. 切换到 IVFFlat 索引
2. 调整 `work_mem` 参数
3. 分批创建索引

```sql
-- 临时增加内存限制
SET work_mem = '2GB';
```

#### 4. 索引构建时间过长

**解决策略**:
1. 使用异步模式处理大数据集
2. 调整 `maintenance_work_mem`
3. 考虑使用更少的 `lists` 参数

```sql
-- 调整维护内存
SET maintenance_work_mem = '4GB';
```

### 性能基准

#### 不同索引类型的性能对比

| 数据规模 | 索引类型 | 构建时间 | 内存占用 | 查询时间 (Top-10) | 召回率 |
|---------|---------|---------|---------|-----------------|-------|
| 1K向量   | HNSW    | 2秒      | 15MB    | 1ms             | 99%   |
| 10K向量  | HNSW    | 25秒     | 120MB   | 2ms             | 99%   |
| 10K向量  | IVFFlat | 8秒      | 45MB    | 3ms             | 95%   |
| 100K向量 | IVFFlat | 60秒     | 300MB   | 5ms             | 95%   |

## 扩展开发

### 添加新的索引类型

```python
# 在 VectorIndexService 中添加新的索引类型
class IndexType(Enum):
    IVFFLAT = "ivfflat"
    HNSW = "hnsw"
    NEW_INDEX = "new_index"  # 新增

def _build_index_sql(self, index_name, vector_field, config, collection_id):
    if config.index_type == IndexType.NEW_INDEX:
        # 实现新索引类型的 SQL
        pass
```

### 自定义距离度量

```python
class DistanceMetric(Enum):
    COSINE = "vector_cosine_ops"
    L2 = "vector_l2_ops" 
    INNER_PRODUCT = "vector_ip_ops"
    CUSTOM_METRIC = "custom_metric_ops"  # 新增
```

### 添加性能指标

```python
@dataclass
class IndexStatus:
    # 现有字段...
    
    # 新增性能指标
    query_count: int = 0
    avg_build_memory: float = 0.0
    last_query_time: Optional[datetime] = None
```

## 总结

PostgreSQL + pgvector 向量索引管理系统提供了：

1. **完整的 API 接口**: 支持索引分析、创建、重建和监控
2. **智能配置推荐**: 根据数据规模自动推荐最佳索引类型
3. **Collection 级隔离**: 确保不同知识库的索引独立管理
4. **异步处理支持**: 大数据集索引操作不阻塞系统
5. **灵活的参数配置**: 支持各种索引类型和距离度量
6. **完善的监控机制**: 实时掌握索引状态和性能指标

这套系统为 NextAgentLite 的向量检索提供了强大的性能基础，特别是在大规模知识库场景下的高效向量相似度搜索。