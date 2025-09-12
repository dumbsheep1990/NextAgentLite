# Embedding 模型维度验证报告

## 验证日期
2025-09-11

## 验证结果

### Qwen/Qwen3-Embedding-4B 模型
- **API提供商**: 硅基流动 (SiliconFlow)
- **API端点**: https://api.siliconflow.cn/v1/embeddings
- **实际输出维度**: **2560**
- **之前的错误配置**: 2048
- **验证方法**: 直接调用API测试

### 测试详情
```python
模型: Qwen/Qwen3-Embedding-4B
实际返回维度: 2560
Token使用: 12 tokens
```

## 配置更新

### 1. `.env` 文件
```bash
# 已更新
DATAGRAPH_EMBEDDING_DIM="2560"  # 之前是 "2048"
```

### 2. Elasticsearch 索引映射
所有 `dense_vector` 字段的 `dims` 属性已更新为 2560：
- document_chunks 索引: `embedding` 字段 - 2560维
- general_vectors 索引: `embedding` 字段 - 2560维
- domain_vectors 索引: `embedding` 字段 - 2560维
- papers 索引: `abstract_embedding` 字段 - 2560维
- media 索引: `caption_embedding` 字段 - 2560维
- retrieval_cache 索引: `query_embedding` 字段 - 2560维

### 3. 代码更新
- `service/embedding_service.py`: dimension = 2560
- `migrations/init_elasticsearch.py`: dims = 2560

## 重要说明

1. **为什么是2560维而不是2048维？**
   - Qwen3-Embedding-4B 模型的实际输出维度是 2560
   - 这是模型的固定输出，无法更改
   - 之前配置的 2048 是错误的

2. **维度不匹配的影响**
   - 如果ES索引配置为2048维，但实际向量是2560维，会导致索引失败
   - 错误信息: "The [dense_vector] field [embedding] in doc has more dimensions than defined in the mapping"

3. **其他常见模型维度参考**
   - text-embedding-v4: 2048维
   - text-embedding-v3: 1536维
   - text-embedding-v2: 1536维
   - BAAI/bge-large-zh-v1.5: 1024维
   - BAAI/bge-m3: 1024维
   - OpenAI text-embedding-3-large: 3072维
   - OpenAI text-embedding-3-small: 1536维

## 验证命令

如需再次验证，可以使用以下Python代码：

```python
import requests

api_key = "sk-mnennlifdngjififromhljflqsblutyfgfvwerkfhsxummcn"
base_url = "https://api.siliconflow.cn/v1"

response = requests.post(
    f'{base_url}/embeddings',
    headers={'Authorization': f'Bearer {api_key}'},
    json={
        'model': 'Qwen/Qwen3-Embedding-4B',
        'input': 'test text',
        'encoding_format': 'float'
    }
)

result = response.json()
embedding = result['data'][0]['embedding']
print(f"维度: {len(embedding)}")  # 输出: 维度: 2560
```

## 结论

✅ **确认 Qwen/Qwen3-Embedding-4B 模型的输出维度是 2560**
✅ 所有相关配置已更新为正确的维度值
✅ 系统现在使用统一的 2560 维向量配置