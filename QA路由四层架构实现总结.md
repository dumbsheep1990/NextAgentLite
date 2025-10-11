# QA路由四层架构实现总结

## 重要说明：职责分工

### 路由层职责（qa_routing_advanced.py）
- **只负责路由决策**：根据规则返回检索顺序和目标
- **不执行任何检索**：不调用embedding服务，不计算向量相似度
- **纯规则匹配**：基于正则表达式和优先级的规则匹配
- **返回决策信息**：告诉Agno框架该检索什么、按什么顺序

### Agno框架职责
- **执行实际检索**：包括向量化、相似度计算、数据查询
- **管理embedding模型**：从配置读取模型设置，不使用硬编码
- **处理检索结果**：聚合、排序、过滤检索结果
- **调用LLM生成答案**：基于检索结果生成最终回答

## 一、架构概述

### 四层路由优先级（从高到低）

1. **第一层：固定问答对**（Fixed Q&A Pairs）
   - 绑定到特定知识库（knowledge_base_id）
   - 通过向量相似度匹配问题
   - 直接返回预设的固定答案
   - 优先级最高，命中即返回

2. **第二层：QA数据集检索**（QA Dataset）
   - 从qa_datasets表检索相关问答对
   - 基于Agno框架实现检索逻辑

3. **第三层：知识库检索**（Knowledge Base）
   - 从document_chunks检索文档片段
   - 支持向量检索和关键词检索

4. **第四层：Agent路由**（Agent Routing）
   - 路由到特定智能体处理
   - 支持单Agent和Team模式

## 二、核心实现

### 2.1 数据模型设计

#### qa_routes表结构
```sql
-- qa_routes表（复用于固定问答对和路由规则）
CREATE TABLE qa_routes (
    id UUID PRIMARY KEY,
    knowledge_base_id VARCHAR(255) NOT NULL,  -- 绑定的知识库
    category VARCHAR(100),                     -- 分类
    question TEXT NOT NULL,                    -- 问题文本
    answer TEXT,                               -- 固定答案（有值为固定问答对，空为动态路由）
    keywords TEXT[],                           -- 关键词/模式数组
    priority INT DEFAULT 0,                    -- 优先级（越大越优先）
    is_active BOOLEAN DEFAULT true,            -- 是否启用
    question_embedding vector(1024),           -- 问题向量（用于相似度匹配）
    metadata JSONB,                            -- 扩展元数据
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 向量索引
CREATE INDEX idx_qa_routes_embedding 
ON qa_routes USING ivfflat (question_embedding vector_cosine_ops);
```

### 2.2 固定问答对实现

#### 核心逻辑（修正版）
1. **存储时不向量化**：仅存储问题和答案文本
2. **标记需要向量化**：metadata中设置needs_embedding标志
3. **路由时返回ID列表**：不执行检索，只返回固定问答对的ID
4. **Agno执行检索**：由Agno负责向量化和相似度匹配

#### 关键代码
```python
# 路由层：仅返回决策
async def test_routing(request: RoutingTestRequest):
    # 检查是否有固定问答对
    fixed_qa_query = """
        SELECT id FROM qa_routes
        WHERE knowledge_base_id = $1 
              AND is_active = true 
              AND answer IS NOT NULL
    """
    
    if fixed_qa_rows:
        # 返回路由决策，不执行检索
        return {
            "routing_layer": "fixed_qa",
            "routing_decision": {
                "type": "fixed_qa_retrieval",
                "fixed_qa_ids": [str(row['id']) for row in fixed_qa_rows],
                "knowledge_base_id": request.knowledge_base_id,
                "strategy": "vector_similarity",
                "retrieval_params": {
                    "top_k": 5,
                    "threshold": 0.85
                }
            }
        }

# Agno框架：执行实际检索（伪代码）
async def execute_fixed_qa_retrieval(decision):
    # 1. 获取embedding模型配置
    model = config.get('DEFAULT_EMBEDDING_MODEL')
    
    # 2. 向量化查询
    query_embedding = await embed_text(query, model)
    
    # 3. 获取固定问答对并计算相似度
    for qa_id in decision['fixed_qa_ids']:
        qa = await get_qa_by_id(qa_id)
        if not qa.embedding:
            qa.embedding = await embed_text(qa.question, model)
        similarity = cosine_similarity(query_embedding, qa.embedding)
        
    # 4. 返回最佳匹配
    return best_match
```

### 2.3 API接口设计

#### 固定问答对管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/qa-routing/fixed-qa` | POST | 创建固定问答对 |
| `/api/qa-routing/fixed-qa` | GET | 获取固定问答对列表 |
| `/api/qa-routing/fixed-qa/{id}` | PUT | 更新固定问答对 |
| `/api/qa-routing/fixed-qa/{id}` | DELETE | 删除固定问答对 |

#### 路由规则管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/qa-routing/rules` | GET | 获取路由规则列表 |
| `/api/qa-routing/rules` | POST | 创建路由规则 |
| `/api/qa-routing/rules/{id}` | PUT | 更新路由规则 |
| `/api/qa-routing/rules/{id}` | DELETE | 删除路由规则 |
| `/api/qa-routing/rules/{id}/toggle` | PUT | 切换启用状态 |
| `/api/qa-routing/rules/test` | POST | 测试路由匹配 |

#### 资源管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/qa-routing/resources/collections` | GET | 获取可用知识库 |
| `/api/qa-routing/resources/agents` | GET | 获取可用Agent |

#### 日志与统计接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/qa-routing/logs` | GET | 获取路由日志 |
| `/api/qa-routing/reports/usage` | GET | 获取使用报告 |

## 三、技术要点

### 3.1 向量化策略
- **模型选择**：使用`alibaba/text-embedding-v4`（1024维）
- **存储格式**：PostgreSQL的vector类型，支持pgvector扩展
- **索引优化**：使用IVFFlat索引加速向量检索

### 3.2 相似度计算
```python
# 余弦相似度计算
similarity = np.dot(query_embedding, qa_embedding) / (
    np.linalg.norm(query_embedding) * np.linalg.norm(qa_embedding)
)
```

### 3.3 优先级控制
- **固定问答对**：priority默认100（最高）
- **动态路由规则**：priority可配置
- **排序规则**：`ORDER BY priority DESC, created_at DESC`

### 3.4 元数据扩展
```json
{
    "type": "fixed_qa",                    // 类型标识
    "usage_count": 0,                      // 使用次数
    "success_rate": 0.0,                   // 成功率
    "target_qa_datasets": [],              // 目标QA数据集
    "target_collections": [],              // 目标知识库
    "target_agents": [],                   // 目标Agent
    "routing_strategy": "hybrid",          // 路由策略
    "fallback_behavior": "default_collection"  // 回退行为
}
```

## 四、路由决策流程

### 4.1 路由测试响应结构（修正版）
```python
{
    "routing_layer": "fixed_qa|rule_based|default",
    "matched_rule": {...},
    "routing_decision": {
        "type": "fixed_qa_retrieval|rule_based_routing|default_cascade",
        # 固定问答对路由
        "fixed_qa_ids": ["id1", "id2", ...],  # 固定问答对ID列表
        
        # 或规则路由
        "retrieval_layers": [
            {
                "layer": "qa_dataset|knowledge_base|agent",
                "datasets|collections|agents": [...],
                "priority": 1-4
            }
        ],
        
        "strategy": "vector_similarity|hybrid|...",
        "retrieval_params": {
            "top_k": 5,
            "threshold": 0.85
        },
        "fallback": "default_retrieval|..."
    },
    "routed_to": "描述文本",
    "message": "说明文本"
}
```

### 4.2 路由策略类型
- `fixed_answer`：固定答案（最高优先级）
- `qa_dataset_only`：仅QA数据集
- `collection_only`：仅知识库
- `agent_only`：仅Agent
- `hybrid`：混合策略
- `full_cascade`：完整级联（默认）

### 4.3 回退行为
- `default_collection`：默认知识库
- `general_agent`：通用Agent
- `general_retrieval`：通用检索
- `error_message`：错误提示

## 五、关键特性

### 5.1 独立性
- 固定问答对完全独立于QA数据集
- 每个知识库可配置无限多个固定问答对
- 问答对通过knowledge_base_id绑定

### 5.2 灵活性
- 支持精确匹配和模糊匹配
- 支持正则表达式模式
- 支持向量相似度匹配

### 5.3 可扩展性
- 基于JSONB的metadata字段
- 支持动态添加新的路由策略
- 预留与Agno框架集成接口

### 5.4 性能优化
- 向量预计算和缓存
- 索引优化
- 分页查询支持

## 六、与Agno框架集成

### 6.1 分工明确
- **路由层**：负责规则定义和匹配逻辑
- **Agno框架**：负责实际的检索和Agent调用

### 6.2 数据流向
1. 用户查询 → 路由层匹配
2. 路由层返回决策 → Agno框架执行
3. Agno返回结果 → 用户

### 6.3 接口对接
```python
# 路由决策
routing_response = await qa_routing_service.search_qa_routes(query)

# Agno执行
if routing_response.routing_layer == "fixed_qa":
    # 直接返回固定答案
    return routing_response.fixed_answer
else:
    # 调用Agno框架处理
    return await agno_service.process(routing_response.routing_decision)
```

## 七、数据库支持

### 7.1 相关表
- `qa_routes`：路由规则和固定问答对
- `qa_route_match_logs`：匹配日志
- `knowledge_collections`：知识库配置
- `agent_configs`：Agent配置

### 7.2 必要的数据库扩展
```sql
-- 安装pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建向量列
ALTER TABLE qa_routes ADD COLUMN question_embedding vector(1024);

-- 创建索引
CREATE INDEX idx_qa_routes_embedding 
ON qa_routes USING ivfflat (question_embedding vector_cosine_ops);
```

## 八、测试建议

### 8.1 功能测试
1. 创建固定问答对并测试匹配
2. 测试相似度阈值的效果
3. 测试优先级排序
4. 测试四层路由的级联

### 8.2 性能测试
1. 大量固定问答对的检索性能
2. 向量相似度计算性能
3. 并发请求处理能力

### 8.3 集成测试
1. 与前端页面的集成
2. 与Agno框架的对接
3. 与现有检索系统的兼容性

## 九、后续优化建议

### 9.1 功能增强
- [ ] 批量导入固定问答对
- [ ] 问答对版本管理
- [ ] A/B测试支持
- [ ] 多语言问答对

### 9.2 性能优化
- [ ] 向量缓存机制
- [ ] 异步向量计算
- [ ] 分布式检索支持

### 9.3 监控与分析
- [ ] 匹配命中率统计
- [ ] 响应时间监控
- [ ] 用户满意度跟踪

## 十、Agno框架的多级检索支持

### 10.1 实现方案

为了让Agno框架支持四层路由架构，我们实现了以下组件：

#### 1. MultilayerRetrievalService（多层级联检索服务）
- **文件**: `service/multilayer_retrieval_service.py`
- **功能**: 执行实际的四层级联检索
- **特点**:
  - 从环境变量读取embedding模型配置
  - 支持固定问答对的向量检索
  - 实现级联逻辑（高置信度提前返回）
  - 与现有服务集成（qa_dataset_service、intelligent_retrieval_service等）

#### 2. MultilayerRetrievalTools（Agno工具集）
- **文件**: `service/agno_multilayer_tools.py`
- **功能**: 将多层检索集成到Agno框架
- **工具方法**:
  - `route_and_retrieve`: 主入口，执行路由+检索
  - `execute_fixed_qa_retrieval`: 专门的固定问答对检索
  - `execute_cascade_retrieval`: 标准四层级联检索

### 10.2 工作流程

```python
# 1. Agent中使用多层检索工具
from service.agno_multilayer_tools import multilayer_retrieval_tools

class KnowledgeRetrievalAgent(Agent):
    def __init__(self):
        super().__init__(
            name="knowledge_retrieval_agent",
            tools=[multilayer_retrieval_tools]
        )
    
    async def run(self, query: str):
        # 执行路由和检索
        result = await self.tools.route_and_retrieve(
            query=query,
            knowledge_base_id=self.context.knowledge_base_id
        )
        return result["answer"]
```

### 10.3 级联逻辑

1. **固定问答对层**（优先级1）
   - 相似度阈值：0.85
   - 命中即返回，不继续级联

2. **QA数据集层**（优先级2）
   - 置信度阈值：0.75
   - 高置信度（>0.85）直接返回

3. **知识库层**（优先级3）
   - 基础置信度：0.7
   - 收集相关文档供后续处理

4. **Agent层**（优先级4）
   - 兜底处理
   - 基于前面层的检索结果生成答案

### 10.4 配置管理

```python
# 从环境变量读取embedding模型
self.default_embedding_model = (
    optimized_config_manager.settings.default_embedding_model or
    optimized_config_manager.settings.embeddings.default or
    "text-embedding-v4"  # 最后的回退默认值
)
```

### 10.5 与现有系统集成

- **qa_routing_service**: 提供路由决策
- **qa_dataset_service**: QA数据集检索
- **intelligent_retrieval_service**: 知识库检索
- **agent_service**: Agent调用
- **embedding_service**: 向量化服务

## 十一、总结

本次实现完成了完整的四层路由架构，其中固定问答对作为最高优先级的路由层，通过向量相似度匹配实现智能问答。系统设计遵循了以下原则：

1. **独立性**：固定问答对独立管理，与QA数据集解耦
2. **灵活性**：支持多种匹配方式和路由策略
3. **可扩展性**：基于JSONB元数据，便于功能扩展
4. **高性能**：向量索引和缓存优化
5. **易集成**：与Agno框架无缝对接

该架构为知识库系统提供了强大的路由能力，能够根据问题特征智能选择最合适的处理路径，提升问答质量和响应速度。

---

**文档版本**: v1.0  
**创建时间**: 2024-12-XX  
**作者**: Assistant  
**状态**: 待测试验证