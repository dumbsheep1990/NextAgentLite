# HiRAG 插件化集成调研报告

## 项目概述

**HiRAG (Hierarchical Knowledge Retrieval-Augmented Generation)** 是一个基于层次化知识结构的检索增强生成系统，由 EMNLP 2025 收录。该项目提供了一种创新的多层次知识检索方法，相比传统的 Naive RAG 和 GraphRAG 有显著性能提升。

- **GitHub**: https://github.com/hhy-huang/HiRAG
- **论文**: https://arxiv.org/abs/2503.10150
- **License**: MIT

## 核心技术特点

### 1. 层次化知识结构
HiRAG 采用三层知识架构：
- **Local Knowledge (局部知识)**: 细粒度的实体和关系信息
- **Global Knowledge (全局知识)**: 社区级别的聚合信息和报告
- **Bridge Knowledge (桥接知识)**: 连接局部和全局的中间层知识

### 2. 检索模式
支持多种检索模式：
- `hi`: 完整的层次化检索（推荐）
- `naive`: 传统的朴素RAG模式
- `hi_nobridge`: 无桥接的层次化检索
- `hi_local`: 仅局部知识检索
- `hi_global`: 仅全局知识检索  
- `hi_bridge`: 仅桥接知识检索

### 3. 性能优势
根据官方评测数据，HiRAG 相比 Naive RAG：
- 综合性(Comprehensiveness): 83.4% vs 16.6%
- 赋能性(Empowerment): 88.4% vs 11.6%
- 多样性(Diversity): 87.3% vs 12.7%

## 技术架构分析

### 依赖项
```python
# 核心依赖
- networkx==3.3        # 图存储和操作
- nano_vectordb==0.0.2 # 轻量级向量数据库
- openai==1.61.1       # LLM接口
- tiktoken==0.7.0      # Token处理
- graspologic==3.4.1   # 图聚类算法
- transformers==4.47.1 # 嵌入模型
```

### 核心组件
1. **存储层**
   - `JsonKVStorage`: JSON键值存储
   - `NanoVectorDBStorage`: 向量存储
   - `NetworkXStorage`: 图存储

2. **处理层**
   - 文本分块 (Chunking)
   - 实体抽取 (Entity Extraction)
   - 社区发现 (Community Detection)
   - 嵌入生成 (Embedding Generation)

3. **检索层**
   - 层次化查询策略
   - 多路径融合
   - 相关性评分

## 集成方案设计

### 1. 作为独立检索模式插件

```python
# 在 NextAgentLite 中新增 HiRAG 检索策略
class HiRAGRetrievalStrategy(BaseRetrievalStrategy):
    def __init__(self, config):
        self.hirag = HiRAG(
            working_dir=config.working_dir,
            enable_hierachical_mode=True,
            embedding_func=self._create_embedding_func(),
            best_model_func=self._create_llm_func()
        )
    
    async def index(self, documents: List[Document]):
        """索引文档到 HiRAG"""
        for doc in documents:
            await self.hirag.insert(doc.content)
    
    async def search(self, query: str, mode: str = "hi") -> List[SearchResult]:
        """执行层次化检索"""
        result = await self.hirag.query(
            query, 
            param=QueryParam(mode=mode)
        )
        return self._format_results(result)
```

### 2. 集成架构

```
NextAgentLite
├── 现有检索系统
│   ├── 双向量检索
│   ├── 关键词检索
│   └── 混合检索
├── HiRAG 插件 (新增)
│   ├── HiRAGService
│   ├── HiRAGConfig
│   └── HiRAGAPI
└── 统一检索接口
    └── IntelligentRetrievalService
```

### 3. API 端点设计

```python
# 新增 API 端点
@router.post("/api/v1/retrieval/hirag/index")
async def index_with_hirag(
    collection_id: str,
    documents: List[Document]
):
    """使用 HiRAG 索引文档"""
    
@router.post("/api/v1/retrieval/hirag/search")  
async def search_with_hirag(
    query: str,
    mode: str = "hi",  # hi|naive|hi_nobridge|hi_local|hi_global
    collection_id: str
):
    """使用 HiRAG 检索"""
```

## 集成步骤

### 第一阶段：基础集成
1. **环境准备**
   ```bash
   pip install nano-vectordb networkx graspologic
   ```

2. **创建 HiRAG 服务模块**
   ```python
   # mat-backend/service/hirag_service.py
   class HiRAGService:
       def __init__(self, config: HiRAGConfig):
           self.hirag = self._init_hirag(config)
       
       async def process_collection(self, collection_id: str):
           """处理知识库，构建层次化索引"""
       
       async def hierarchical_search(self, query: str, params: dict):
           """执行层次化检索"""
   ```

3. **配置管理**
   ```yaml
   # config/hirag_config.yaml
   hirag:
     working_dir: "./hirag_cache"
     enable_hierachical_mode: true
     chunk_token_size: 1200
     embedding_batch_num: 6
     modes:
       - hi
       - naive
       - hi_local
       - hi_global
   ```

### 第二阶段：深度集成

1. **与现有系统融合**
   - 将 HiRAG 作为可选检索策略
   - 在 Agent 中支持选择 HiRAG 模式
   - 支持检索结果的融合和排序

2. **性能优化**
   - 异步处理大规模文档索引
   - 缓存层次化结构
   - 批量嵌入优化

3. **前端支持**
   ```typescript
   // 新增检索模式选择
   interface RetrievalMode {
     type: 'dual-vector' | 'keyword' | 'hybrid' | 'hirag';
     hiragMode?: 'hi' | 'naive' | 'hi_local' | 'hi_global';
   }
   ```

## 优势与挑战

### 优势
1. **检索质量提升**: 层次化结构提供更全面的知识覆盖
2. **灵活性**: 支持多种检索模式，适应不同场景
3. **可解释性**: 层次化结构便于理解检索路径

### 挑战
1. **索引开销**: 构建层次化结构需要额外计算
2. **存储需求**: 需要存储多层次的知识表示
3. **依赖管理**: 引入新的依赖项需要兼容性测试

## 实施建议

### 短期目标（1-2周）
1. 搭建 HiRAG 独立服务原型
2. 实现基本的索引和检索功能
3. 在测试环境验证可行性

### 中期目标（3-4周）
1. 完成 API 接口开发
2. 实现与现有检索系统的集成
3. 添加配置管理和监控

### 长期目标（1-2月）
1. 性能优化和缓存策略
2. 前端界面集成
3. A/B 测试和效果评估

## 代码示例

### 快速集成示例
```python
# mat-backend/service/hirag_integration.py
from hirag import HiRAG, QueryParam
from typing import List, Dict, Any
import asyncio

class HiRAGIntegration:
    def __init__(self):
        self.hirag = HiRAG(
            working_dir="./hirag_workspace",
            enable_hierachical_mode=True,
            enable_naive_rag=True,
            embedding_func=self._get_embedding_func(),
            best_model_func=self._get_llm_func()
        )
    
    def _get_embedding_func(self):
        """适配现有嵌入模型"""
        from service.embedding_service import embedding_service
        
        async def embed_wrapper(texts: List[str]):
            # 使用现有的 embedding_service
            response = await embedding_service.create_embeddings(
                model="text-embedding-v4",
                texts=texts
            )
            return response.embeddings
        
        return embed_wrapper
    
    def _get_llm_func(self):
        """适配现有LLM服务"""
        from service.llm_service import llm_service
        
        async def llm_wrapper(prompt: str, **kwargs):
            response = await llm_service.generate(
                prompt=prompt,
                model="qwen3-30b",
                **kwargs
            )
            return response.text
        
        return llm_wrapper
    
    async def index_documents(self, documents: List[Dict[str, Any]]):
        """索引文档集合"""
        for doc in documents:
            await self.hirag.insert(doc['content'])
    
    async def search(
        self, 
        query: str, 
        mode: str = "hi",
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """执行检索"""
        result = await self.hirag.query(
            query,
            param=QueryParam(mode=mode, top_k=top_k)
        )
        return self._format_results(result)
    
    def _format_results(self, raw_results) -> List[Dict[str, Any]]:
        """格式化检索结果"""
        formatted = []
        for item in raw_results:
            formatted.append({
                'content': item.get('content'),
                'score': item.get('score'),
                'metadata': item.get('metadata', {}),
                'knowledge_level': item.get('level')  # local/global/bridge
            })
        return formatted
```

## 结论

HiRAG 作为一个创新的层次化检索系统，具有很高的集成价值。建议采用**插件化架构**进行集成，将其作为一个独立的检索模式，与现有的双向量检索、关键词检索等并行存在。这种方式既能充分利用 HiRAG 的优势，又不会影响现有系统的稳定性。

推荐先在特定领域（如地聚物材料）进行试点，评估效果后再逐步推广到其他领域。