# Agno框架多层检索集成方案

## 一、Agno框架原生能力分析

### 1.1 Agno工具系统（Tools）
Agno框架通过`@tool`装饰器提供了灵活的工具定义机制，允许我们创建自定义的检索工具：

```python
from agno.tools.toolkit import Toolkit
from agno.tools import tool

class MultilayerRetrievalTools(Toolkit):
    @tool
    async def route_and_retrieve(self, query: str, knowledge_base_id: str):
        # 自定义的多层检索逻辑
        pass
```

### 1.2 Agent协作机制
Agno的Agent和Team系统天然支持多个专业Agent的协作，可以实现复杂的检索流程：

- `question_decomposition_agent` - 问题分解
- `translation_agent` - 多语言翻译
- `knowledge_retrieval_agent` - 知识检索
- `knowledge_graph_agent` - 图谱查询
- `summary_answer_agent` - 答案总结

### 1.3 流式响应支持
Agno支持流式响应（stream=True），可以实时传输检索进度和中间结果。

## 二、我们的四层路由架构实现

### 2.1 架构设计
```
┌─────────────────────────────────────────┐
│         用户查询（User Query）           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      QA路由层（qa_routing_advanced）     │
│         - 仅负责路由决策                 │
│         - 不执行任何检索                 │
│         - 返回routing_decision JSON      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Agno工具层（agno_multilayer_tools）   │
│         - 接收路由决策                   │
│         - 调用多层检索服务               │
│         - 集成到Agno框架                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  多层检索服务（multilayer_retrieval）    │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 第1层：固定问答对（Fixed Q&A）    │  │
│  │ - 优先级：100（最高）            │  │
│  │ - 相似度阈值：0.85               │  │
│  └──────────────────────────────────┘  │
│                 ↓                       │
│  ┌──────────────────────────────────┐  │
│  │ 第2层：QA数据集（QA Dataset）    │  │
│  │ - 优先级：80                     │  │
│  │ - 置信度阈值：0.75               │  │
│  └──────────────────────────────────┘  │
│                 ↓                       │
│  ┌──────────────────────────────────┐  │
│  │ 第3层：知识库（Knowledge Base）  │  │
│  │ - 优先级：60                     │  │
│  │ - 基础置信度：0.7                │  │
│  └──────────────────────────────────┘  │
│                 ↓                       │
│  ┌──────────────────────────────────┐  │
│  │ 第4层：Agent处理（Agent Route）  │  │
│  │ - 优先级：40                     │  │
│  │ - 兜底处理                       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 关键实现点

#### 路由层（qa_routing_advanced.py）
```python
@router.post("/rules/test")
async def test_routing(request: RoutingTestRequest):
    """只返回路由决策，不执行检索"""
    # 检查固定问答对
    if has_fixed_qa:
        return {
            "routing_layer": "fixed_qa",
            "routing_decision": {
                "type": "fixed_qa_retrieval",
                "fixed_qa_ids": [...],
                "retrieval_params": {...}
            }
        }
    # 其他路由逻辑...
```

#### Agno工具集成（agno_multilayer_tools.py）
```python
class MultilayerRetrievalTools(Toolkit):
    @tool
    async def route_and_retrieve(self, query: str, knowledge_base_id: str):
        # 1. 获取路由决策
        routing_response = await qa_routing_service.search_qa_routes(...)
        
        # 2. 构建路由决策
        routing_decision = self._build_routing_decision(routing_response)
        
        # 3. 执行多层检索
        result = await multilayer_service.execute_multilayer_retrieval(
            query=query,
            routing_decision=routing_decision,
            knowledge_base_id=knowledge_base_id
        )
        
        return result
```

#### 多层检索服务（multilayer_retrieval_service.py）
```python
class MultilayerRetrievalService:
    def __init__(self):
        # 从环境变量读取配置，不硬编码
        self.default_embedding_model = (
            optimized_config_manager.settings.default_embedding_model or
            optimized_config_manager.settings.embeddings.default or
            "text-embedding-v4"
        )
        
    async def execute_multilayer_retrieval(self, query, routing_decision):
        # 根据routing_decision执行实际检索
        if routing_decision["type"] == "fixed_qa_retrieval":
            return await self._execute_fixed_qa_retrieval(...)
        elif routing_decision["type"] == "default_cascade":
            return await self._execute_cascade_retrieval(...)
```

## 三、与Agno的集成优势

### 3.1 充分利用Agno特性
1. **工具系统**: 通过`@tool`装饰器暴露检索功能
2. **Agent协作**: 利用Team系统协调多个专业Agent
3. **流式响应**: 支持实时返回检索进度
4. **配置管理**: 使用Agno的配置系统管理模型参数

### 3.2 保持架构清晰
1. **职责分离**: 路由决策与检索执行分离
2. **可扩展性**: 易于添加新的检索层
3. **可配置性**: 通过环境变量和数据库配置
4. **无硬编码**: 所有配置从环境或数据库读取

### 3.3 性能优化
1. **级联终止**: 高置信度结果可提前返回
2. **并行检索**: 支持多数据源并行查询
3. **缓存机制**: 向量和翻译结果缓存
4. **连接池**: 数据库连接池管理

## 四、使用示例

### 4.1 在Agent中使用
```python
from service.agno_multilayer_tools import multilayer_retrieval_tools

class KnowledgeRetrievalAgent(Agent):
    def __init__(self):
        super().__init__(
            name="knowledge_retrieval_agent",
            tools=[multilayer_retrieval_tools]
        )
    
    async def run(self, query: str):
        result = await self.tools.route_and_retrieve(
            query=query,
            knowledge_base_id=self.context.knowledge_base_id
        )
        return result["answer"]
```

### 4.2 在Team中协作
```python
from agno.team.team import Team

team = Team(
    name="qa_team",
    members=[
        question_decomposition_agent,
        knowledge_retrieval_agent,  # 使用多层检索
        summary_answer_agent
    ]
)

response = await team.run(query, stream=True)
```

## 五、配置说明

### 5.1 环境变量配置
```bash
# .env文件
DEFAULT_EMBEDDING_MODEL=text-embedding-v4
DATABASE_URL=postgresql://...
ELASTICSEARCH_URL=http://...
```

### 5.2 路由规则配置
```sql
-- qa_routes表
CREATE TABLE qa_routes (
    id UUID PRIMARY KEY,
    knowledge_base_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,  -- 有值为固定问答对，空为动态路由
    priority INT DEFAULT 0,
    question_embedding vector(1024),
    ...
);
```

## 六、测试验证

### 6.1 测试脚本
```bash
# 运行集成测试
python scripts/test_qa_routing_with_agno.py
```

### 6.2 测试覆盖
- ✅ 四层路由优先级测试
- ✅ 固定问答对向量匹配
- ✅ 级联检索终止逻辑
- ✅ Agno工具集成
- ✅ 性能和并发测试

## 七、关键改进点

### 7.1 已解决的问题
1. ❌ ~~路由层执行检索~~ → ✅ 路由层只返回决策
2. ❌ ~~硬编码embedding模型~~ → ✅ 从配置读取
3. ❌ ~~混淆路由和检索~~ → ✅ 职责清晰分离
4. ❌ ~~缺少固定问答对层~~ → ✅ 实现四层架构

### 7.2 架构优势
- **模块化**: 每层独立，易于维护
- **可测试**: 每层可独立测试
- **可扩展**: 易于添加新检索策略
- **高性能**: 支持并行和缓存

## 八、总结

我们成功地将四层路由架构与Agno框架集成，实现了：

1. **完整的四层路由**: 固定问答对 → QA数据集 → 知识库 → Agent
2. **与Agno无缝集成**: 通过Tools系统暴露功能
3. **清晰的职责分离**: 路由决策与检索执行分离
4. **灵活的配置管理**: 无硬编码，全部可配置
5. **优秀的性能表现**: 级联终止、并行检索、缓存优化

该方案充分利用了Agno框架的原生能力，同时保持了架构的清晰性和可扩展性，为复杂的多层检索需求提供了优雅的解决方案。