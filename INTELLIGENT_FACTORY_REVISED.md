# 智能工厂架构重新设计 (基于现有系统集成)

基于对现有系统的深入分析，重新设计智能工厂架构，确保与现有知识库系统和Agno Team模式的完全兼容。

---

## 🏭 智能工厂核心定位

### 设计原则
智能工厂是一个**多框架统一管理平台**，支持：
- **Agno Team模式**: 现有的多智能体协作框架
- **Youtu-Agent模式**: 新集成的SimpleAgent和OrchestraAgent
- **混合调用模式**: 两种框架间的互相调用和协作
- **统一知识库**: 共享现有的知识库管理系统

### 架构兼容性
```
现有系统架构:
├── 知识库系统 (PostgreSQL + Elasticsearch + Redis)
│   ├── KnowledgeDocument + DocumentChunk
│   ├── 元数据模板和结构化存储
│   └── Filter-then-Rerank检索模式
├── Agno Team框架
│   ├── AdvancedAgentTeamService
│   ├── 多智能体协作 (coordinator模式)
│   └── 工具化抽象层
└── 新增Youtu-Agent框架
    ├── SimpleAgent (ReAct模式)
    ├── OrchestraAgent (Plan-Execute模式)
    └── 统一配置系统 (AgentConfig)
```

---

## 🗂️ 重新设计的导航架构

### 智能工厂子导航 (5个核心模块)

#### 1. 🔧 Agent创建工坊 (现有)
**功能定位**: 多框架智能体创建中心
**核心能力**:
- **Meta-Agent创建**: Youtu-Agent的对话式创建
- **Agno Team配置**: 基于YAML的团队配置编辑
- **模板库管理**: 两种框架的配置模板
- **框架选择向导**: 帮助用户选择合适的框架

**技术实现**:
- 集成现有的`agent_teams_v2.yaml`配置系统
- 支持Youtu-Agent的`AgentConfig`格式
- 提供框架间的配置转换工具

---

#### 2. 🏗️ 智能体工厂 (升级现有Agent配置管理)
**功能定位**: 多框架智能体实例统一管理

**核心功能**:
- **Agno Team实例管理**:
  - 团队配置 (`general_qa_team_v2`, `research_team`等)
  - 成员管理 (coordinator + members)
  - 工具绑定 (TranslationTools, MultilingualRetrievalTools等)
  - 会话状态监控

- **Youtu-Agent实例管理**:
  - SimpleAgent配置管理
  - OrchestraAgent编排配置
  - Environment和Toolkit配置
  - 模型参数管理

- **统一部署配置**:
  - 环境变量管理 (UTU_LLM_*, AGNO_*)
  - 资源分配和限制
  - 知识库绑定配置
  - API端点管理

**UI设计**:
```
┌─────────────────────────────────────────────────────────┐
│ 框架类型筛选: [全部] [Agno Team] [Youtu-Agent] [混合]     │
├─────────────────────────────────────────────────────────┤
│ 🧠 general_qa_team_v2    | Agno Team    | 运行中 | 5成员 │
│ 🤖 knowledge_qa_agent    | SimpleAgent  | 空闲   | 单体  │
│ 🎭 research_orchestra    | Orchestra    | 运行中 | 3角色 │
│ 🔄 hybrid_routing_agent  | 混合调用      | 配置中 | 动态  │
└─────────────────────────────────────────────────────────┘
```

---

#### 3. ⚡ 执行控制台 (新增 - 已实现)
**功能定位**: 多框架执行监控和调试中心

**扩展功能**:
- **Agno Team监控**:
  - Team协作流程可视化 (coordinator → members → synthesis)
  - 成员间通信监控
  - 工具调用链路追踪
  - 会话状态管理

- **Youtu-Agent监控**:
  - SimpleAgent ReAct循环监控
  - OrchestraAgent Plan-Execute流程图
  - Toolkit调用监控
  - Environment状态追踪

- **混合调用监控**:
  - 框架间调用链路
  - 数据格式转换监控
  - 性能对比分析
  - 错误传播追踪

**技术集成**:
```python
# 扩展现有的ExecutionConsolePage
class UnifiedExecutionConsole:
    def monitor_agno_team(self, team_name: str):
        # 集成AdvancedAgentTeamService的监控
        pass
    
    def monitor_youtu_agent(self, agent_id: str):
        # 集成Youtu-Agent的执行监控
        pass
    
    def monitor_hybrid_call(self, call_chain: List[str]):
        # 监控框架间的混合调用
        pass
```

---

#### 4. 🎯 路由策略中心 (升级现有)
**功能定位**: 多框架智能路由和负载均衡

**核心功能**:
- **框架选择策略**:
  - 基于查询复杂度的框架选择
  - Agno Team vs Youtu-Agent路由规则
  - 混合调用策略配置
  - A/B测试和灰度发布

- **Agno Team路由**:
  - 团队选择逻辑 (`general_qa_team_v2` vs `research_team`)
  - 智能路由Agent的决策监控
  - DAG重构和动态调度
  - 成员负载均衡

- **Youtu-Agent路由**:
  - SimpleAgent vs OrchestraAgent选择
  - 基于并发数的负载均衡
  - Toolkit可用性路由
  - 模型资源调度

**路由决策逻辑**:
```python
class HybridRoutingStrategy:
    async def route_query(self, query: str, context: Dict) -> RoutingDecision:
        # 1. 查询复杂度分析
        complexity = await self.analyze_complexity(query)
        
        # 2. 框架选择
        if complexity.requires_multi_agent_coordination:
            if complexity.has_chinese_content:
                return RoutingDecision(
                    framework="agno",
                    target="general_qa_team_v2",
                    reason="多语言协作需求"
                )
            else:
                return RoutingDecision(
                    framework="youtu",
                    target="OrchestraAgent",
                    reason="复杂任务编排"
                )
        else:
            return RoutingDecision(
                framework="youtu",
                target="SimpleAgent",
                reason="简单查询处理"
            )
```

---

#### 5. 📊 性能监控中心 (升级现有)
**功能定位**: 多框架性能监控和业务分析

**监控维度**:
- **框架性能对比**:
  - Agno Team vs Youtu-Agent性能对比
  - 不同场景下的框架选择效果
  - 混合调用的性能开销
  - 资源利用率分析

- **知识库集成监控**:
  - 现有知识库的检索性能
  - Filter-then-Rerank效果分析
  - 多语言检索成功率
  - 向量化任务监控

- **业务指标分析**:
  - 不同框架的用户满意度
  - 查询类型分布和处理效果
  - 成本效益分析
  - SLA达成情况

**集成现有监控**:
```python
# 扩展现有的ExecutionMonitorPage
class UnifiedPerformanceMonitor:
    async def get_agno_metrics(self):
        # 集成AdvancedAgentTeamService的性能数据
        return await advanced_agent_team_service.get_performance_metrics()
    
    async def get_youtu_metrics(self):
        # 集成Youtu-Agent的性能数据
        return await youtu_agent_service.get_performance_metrics()
    
    async def get_knowledge_metrics(self):
        # 集成现有知识库的检索性能
        return await knowledge_service.get_retrieval_metrics()
```

---

## 🔗 Agno Team与Youtu-Agent互调用设计

### 1. 统一接口层
```python
class UnifiedAgentInterface:
    """统一的智能体调用接口"""
    
    async def execute_query(
        self, 
        query: str, 
        framework: str = "auto",  # auto, agno, youtu
        target: str = None,
        session_id: str = None,
        **kwargs
    ) -> UnifiedResponse:
        
        if framework == "auto":
            framework, target = await self.route_query(query)
        
        if framework == "agno":
            return await self.call_agno_team(target, query, session_id, **kwargs)
        elif framework == "youtu":
            return await self.call_youtu_agent(target, query, session_id, **kwargs)
        else:
            raise ValueError(f"Unsupported framework: {framework}")
```

### 2. 数据格式转换
```python
class DataFormatConverter:
    """框架间数据格式转换器"""
    
    def agno_to_youtu_config(self, agno_config: Dict) -> Dict:
        """将Agno Team配置转换为Youtu-Agent配置"""
        return {
            "type": "orchestra" if agno_config.get("mode") == "coordinate" else "simple",
            "model": self.convert_model_config(agno_config["coordinator"]),
            "toolkits": self.convert_toolkits(agno_config.get("tools", [])),
            "instructions": agno_config.get("instructions", [])
        }
    
    def youtu_to_agno_config(self, youtu_config: Dict) -> Dict:
        """将Youtu-Agent配置转换为Agno Team配置"""
        return {
            "mode": "coordinate" if youtu_config["type"] == "orchestra" else "single",
            "coordinator": self.convert_model_config(youtu_config["model"]),
            "tools": self.convert_toolkits(youtu_config.get("toolkits", {})),
            "instructions": youtu_config.get("instructions", [])
        }
```

### 3. 知识库统一访问
```python
class UnifiedKnowledgeAccess:
    """统一的知识库访问接口"""
    
    def __init__(self):
        # 复用现有的知识库服务
        self.knowledge_service = knowledge_service
        self.graph_service = graph_service
        self.lightrag_client = lightrag_client
    
    async def search_knowledge(
        self,
        query: str,
        retrieval_mode: str = "all",  # all, vector, keyword, graph
        source_framework: str = None
    ) -> List[Dict]:
        """统一的知识库检索接口"""
        
        # 使用现有的Filter-then-Rerank模式
        if retrieval_mode == "all":
            # 并行执行多种检索
            vector_results = await self.knowledge_service.vector_search(query)
            keyword_results = await self.knowledge_service.keyword_search(query)
            graph_results = await self.graph_service.graph_search(query)
            
            # 合并和重排序
            return await self.merge_and_rerank(vector_results, keyword_results, graph_results)
        
        elif retrieval_mode == "vector":
            return await self.knowledge_service.vector_search(query)
        
        elif retrieval_mode == "graph":
            return await self.graph_service.graph_search(query)
        
        else:
            return await self.knowledge_service.keyword_search(query)
```

---

## 🛠️ 技术实现方案

### 1. 后端架构扩展
```python
# lite-backend/youtu_agent_integration/unified_service.py
class UnifiedAgentService:
    """统一的智能体服务"""
    
    def __init__(self):
        # 现有服务
        self.agno_service = advanced_agent_team_service
        self.knowledge_service = knowledge_service
        
        # 新增服务
        self.youtu_service = YoutuAgentService()
        self.routing_service = HybridRoutingService()
        self.converter = DataFormatConverter()
    
    async def create_agent(
        self,
        config: Dict,
        framework: str = "auto"
    ) -> str:
        """统一的智能体创建接口"""
        pass
    
    async def execute_query(
        self,
        agent_id: str,
        query: str,
        session_id: str = None,
        stream: bool = False
    ) -> Any:
        """统一的查询执行接口"""
        pass
```

### 2. 前端组件统一
```typescript
// lite-qa/src/services/unifiedAgentService.ts
export class UnifiedAgentService {
  async createAgent(config: AgentConfig, framework?: string): Promise<string> {
    // 统一的智能体创建
  }
  
  async executeQuery(
    agentId: string, 
    query: string, 
    options?: ExecutionOptions
  ): Promise<Response> {
    // 统一的查询执行
  }
  
  async getPerformanceMetrics(
    agentId: string
  ): Promise<PerformanceMetrics> {
    // 统一的性能监控
  }
}
```

### 3. 配置文件扩展
```yaml
# config/unified_agents.yaml
unified_agents:
  hybrid_qa_agent:
    name: "混合问答智能体"
    primary_framework: "agno"
    fallback_framework: "youtu"
    routing_rules:
      - condition: "complexity > 0.8"
        target: "general_qa_team_v2"
        framework: "agno"
      - condition: "complexity <= 0.8"
        target: "SimpleAgent"
        framework: "youtu"
    
  research_orchestrator:
    name: "研究编排智能体"
    primary_framework: "youtu"
    fallback_framework: "agno"
    routing_rules:
      - condition: "requires_planning"
        target: "OrchestraAgent"
        framework: "youtu"
      - condition: "requires_multilingual"
        target: "research_team"
        framework: "agno"
```

---

## 📋 实施优先级

### 第一阶段: 基础集成 (1周)
- [ ] 统一接口层设计和实现
- [ ] 数据格式转换器
- [ ] 现有知识库的统一访问接口
- [ ] 智能体工厂页面升级

### 第二阶段: 路由策略 (1周)  
- [ ] 混合路由策略实现
- [ ] 框架选择逻辑
- [ ] 路由策略中心页面升级
- [ ] A/B测试功能

### 第三阶段: 监控集成 (1周)
- [ ] 执行控制台多框架支持
- [ ] 性能监控中心升级
- [ ] 统一日志和追踪
- [ ] 错误处理和降级

### 第四阶段: 高级功能 (1周)
- [ ] 混合调用链路监控
- [ ] 配置热更新
- [ ] 权限管理集成
- [ ] 文档和示例

---

## 🎯 核心价值

### 1. 无缝集成
- **零侵入**: 不改变现有Agno Team的任何功能
- **完全兼容**: 现有知识库系统无需修改
- **渐进升级**: 可以逐步迁移到新的架构

### 2. 最佳实践
- **智能路由**: 根据查询特征自动选择最优框架
- **资源优化**: 统一的资源管理和负载均衡
- **性能监控**: 全方位的性能对比和分析

### 3. 用户体验
- **统一界面**: 一个界面管理所有类型的智能体
- **透明切换**: 用户无需关心底层框架差异
- **强大调试**: 跨框架的调试和监控能力

这个重新设计的方案确保了与现有系统的完全兼容，同时提供了强大的多框架统一管理能力！
