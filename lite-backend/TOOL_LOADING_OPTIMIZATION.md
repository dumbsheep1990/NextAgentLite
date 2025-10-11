# 工具加载逻辑优化

## 优化目标

**所有智能体类型都可以调用工具，但前提是用户明确选择了可用的工具。**

## 优化前的问题

### 问题1: 默认自动加载工具
**代码位置**: `agent_service_v2.py` line 426, 434, 442

**原逻辑**:
```python
if _has_duckduckgo and ('builtin:duckduckgo' in selected_set or not selected_tools):
    tools.append(DuckDuckGoTools())
```

**问题**:
- 当 `selected_tools = None` 或 `[]` 时，`not selected_tools` 为 `True`
- 导致即使用户没有选择工具，也会自动加载内置工具
- 违反了"用户明确选择才加载"的原则

### 问题2: 日志不够清晰
- 没有明确区分"用户选择"和"自动加载"
- 没有汇总日志，难以快速了解加载了多少工具

## 优化后的逻辑

### 核心原则

```python
# 规则1: 只有用户明确选择的工具才加载
if 'builtin:baidusearch' in selected_set:
    tools.append(BaiduSearchTools())

# 规则2: 没有选择 = 不加载
if selected_tools is None or len(selected_tools) == 0:
    # 不加载任何内置工具

# 规则3: 知识库/图谱工具独立控制
if search_knowledge:
    tools.append(CustomKnowledgeTools())
```

### 优化后的代码

**文件**: `service/agent_service_v2.py`

#### 1. 函数签名增强 (line 420-425)
```python
async def _configure_agent_tools_v2(self, ...) -> List[Any]:
    """配置智能体工具V2

    重要：只有当用户明确选择了工具时才加载工具
    - selected_tools = None 或 [] : 不加载任何内置工具
    - selected_tools = ["builtin:baidusearch"] : 只加载百度搜索
    """
```

#### 2. 工具选择判断 (line 427-428)
```python
selected_set = set(selected_tools or [])
has_tool_selection = selected_tools is not None and len(selected_tools) > 0
```

#### 3. 内置工具加载 (line 432, 441, 450)
```python
# ❌ 旧逻辑
if _has_baidusearch and ('builtin:baidusearch' in selected_set or not selected_tools):

# ✅ 新逻辑
if _has_baidusearch and 'builtin:baidusearch' in selected_set:
```

#### 4. 动态工具加载 (line 475-487)
```python
if has_tool_selection:
    try:
        reg = await get_tool_registry()
        dynamic_tools = await reg.build_tool_objects(selected=selected_tools)
        if dynamic_tools:
            tools.extend(dynamic_tools)
            logger.info(f"已挂载动态工具 {len(dynamic_tools)} 个 (用户选择)")
    except Exception as e:
        logger.warning(f"动态工具注册失败: {e}")
else:
    logger.info("用户未选择任何工具，跳过动态工具加载")
```

#### 5. 汇总日志 (line 489-493)
```python
if tools:
    logger.info(f"智能体 {agent_name} 共加载 {len(tools)} 个工具")
else:
    logger.info(f"智能体 {agent_name} 未加载任何工具 (纯对话模式)")
```

## 使用场景对比

### 场景1: 通用问答智能体（不使用工具）

**用户配置**:
- 智能体类型: `qa_expert`
- 选择的工具: `[]` (空)
- 知识库: 无

**结果**:
- ✅ 不加载任何工具
- ✅ 纯对话模式
- ✅ 日志: "智能体 qa_expert 未加载任何工具 (纯对话模式)"

### 场景2: 通用问答 + 百度搜索

**用户配置**:
- 智能体类型: `qa_expert`
- 选择的工具: `["builtin:baidusearch"]`
- 知识库: 无

**结果**:
- ✅ 加载百度搜索工具
- ✅ 工具数量: 1
- ✅ 日志: "已添加百度搜索工具 (用户选择)" + "智能体 qa_expert 共加载 1 个工具"

### 场景3: 知识库智能体（不使用其他工具）

**用户配置**:
- 智能体类型: `knowledge_expert`
- 选择的工具: `[]`
- 知识库: 已绑定

**结果**:
- ✅ 自动加载知识库检索工具 (由 `search_knowledge=True` 控制)
- ✅ 不加载其他工具
- ✅ 工具数量: 1 (CustomKnowledgeTools)

### 场景4: 知识库 + 百度搜索 + MCP工具

**用户配置**:
- 智能体类型: `knowledge_expert`
- 选择的工具: `["builtin:baidusearch", "mcp:playwright"]`
- 知识库: 已绑定

**结果**:
- ✅ 加载知识库检索工具 (自动)
- ✅ 加载百度搜索工具 (用户选择)
- ✅ 加载playwright MCP工具 (用户选择)
- ✅ 工具数量: 3

### 场景5: 混合工具

**用户配置**:
- 选择的工具: `["builtin:baidusearch", "builtin:duckduckgo", "mcp:playwright", "api:test"]`

**结果**:
- ✅ 加载2个内置工具
- ✅ 加载1个MCP工具
- ✅ 加载1个API工具
- ✅ 工具数量: 4
- ✅ 日志详细记录每个工具

## 日志示例

### 示例1: 无工具
```
[INFO] 用户未选择任何工具，跳过动态工具加载
[INFO] 智能体 qa_expert 未加载任何工具 (纯对话模式)
```

### 示例2: 单个内置工具
```
[INFO] 已添加百度搜索工具 (用户选择)
[INFO] 用户选择的工具中没有MCP或API工具
[INFO] 智能体 qa_expert 共加载 1 个工具
```

### 示例3: 混合工具
```
[INFO] 已添加百度搜索工具 (用户选择)
[INFO] 已添加DuckDuckGo搜索工具 (用户选择)
[INFO] 智能体 qa_expert 启用检索工具（知识库: True, 图谱: False）
[INFO] 已挂载动态工具 2 个 (用户选择)
[INFO] 智能体 qa_expert 共加载 5 个工具
```

## 数据流验证

```
前端 AgentStudioPage
  用户选择工具: ["builtin:baidusearch"]
  ↓
API agent_workflows.py
  selected_tools: ["builtin:baidusearch"]
  ↓
Workflow step_prepare
  ctx.inputs["selected_tools"] = ["builtin:baidusearch"]
  ↓
Agent Service create_agent_v2
  selected_tools = ["builtin:baidusearch"]
  ↓
_configure_agent_tools_v2
  selected_set = {"builtin:baidusearch"}
  has_tool_selection = True
  ↓
  检查: 'builtin:baidusearch' in selected_set → True ✅
  加载: BaiduSearchTools()
  ↓
Agent创建
  tools = [BaiduSearchTools实例]
```

## 测试验证

### 测试1: 空工具列表
```python
agent = await service.create_agent_v2(
    agent_name="qa_expert",
    selected_tools=[],  # 空列表
    search_knowledge=False,
    search_graph=False,
)
assert len(agent.tools) == 0  # ✅ 不应该有工具
```

### 测试2: 单个工具
```python
agent = await service.create_agent_v2(
    agent_name="qa_expert",
    selected_tools=["builtin:baidusearch"],
    search_knowledge=False,
    search_graph=False,
)
assert len(agent.tools) == 1  # ✅ 只有百度搜索
```

### 测试3: None vs 空列表
```python
# None
agent1 = await service.create_agent_v2(
    agent_name="qa_expert",
    selected_tools=None,
)
assert len(agent1.tools) == 0  # ✅

# 空列表
agent2 = await service.create_agent_v2(
    agent_name="qa_expert",
    selected_tools=[],
)
assert len(agent2.tools) == 0  # ✅
```

### 测试4: 知识库工具独立
```python
agent = await service.create_agent_v2(
    agent_name="knowledge_expert",
    selected_tools=[],  # 不选择其他工具
    search_knowledge=True,  # 但启用知识库
    search_graph=False,
)
assert len(agent.tools) == 1  # ✅ 只有知识库工具
assert isinstance(agent.tools[0], CustomKnowledgeTools)
```

## 优化总结

### ✅ 优化点

1. **严格的工具选择控制**
   - 移除了 `or not selected_tools` 的兼容逻辑
   - 只有明确选择才加载

2. **清晰的日志记录**
   - 每个工具加载都标注"(用户选择)"
   - 汇总日志显示总工具数
   - 区分"纯对话模式"和"工具模式"

3. **更好的性能**
   - 跳过不必要的动态工具查询
   - `has_tool_selection` 快速判断

4. **符合预期的行为**
   - 通用问答智能体不再自动加载工具
   - 所有智能体类型都可以按需加载工具
   - 知识库/图谱工具保持独立控制

### 📝 注意事项

1. **向后兼容性**: 旧的代码如果依赖自动加载，需要显式传入`selected_tools`
2. **知识库工具**: 依然通过 `search_knowledge` 和 `search_graph` 参数控制，不受 `selected_tools` 影响
3. **测试覆盖**: 需要测试所有工具类型和组合场景

## 相关文件

- ✅ `/Users/wxn/Desktop/NextAgentLite/lite-backend/service/agent_service_v2.py` (lines 414-495)
- 📖 `/Users/wxn/Desktop/NextAgentLite/lite-backend/TOOL_INTEGRATION_FLOW.md`

## 修改时间

2025-09-30

## 修改人员

Claude Code (AI Assistant)