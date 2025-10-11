# 工具调用修复文档

## 问题描述

用户在智能体工作室中选择了百度搜索工具，并在对话中明确要求"调用工具检索一下最新的LLM新闻"，但模型没有调用工具，而是直接回答"由于我无法直接访问互联网或使用百度搜索工具，因此无法提供最新的LLM（大语言模型）新闻"。

## 根本原因

经过排查，发现了以下4个问题：

### 问题1: 前端硬编码 `selected_tools` 为空数组

**文件**: `lite-qa/src/pages/agent/AgentStudioPage.tsx` line 809

**原代码**:
```typescript
const handle = await runWorkflowStream({
  agent_name: agentName || 'studio_agent',
  prompt: text,
  selected_tools: [],  // ❌ 硬编码为空数组
  model: chatModel || (models[0]?.id || ''),
```

**问题**: 即使用户在工具配置中选择了工具，发送对话时仍然传递空数组。

**修复**:
```typescript
selected_tools: selectedTools,  // ✅ 使用用户选择的工具
```

### 问题2: 提示词中工具名称显示为对象地址

**文件**: `lite-backend/service/agent_service_v2.py` line 554-563

**原代码**:
```python
tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
```

**问题**: 对于工具类实例（如 `BaiduSearchTools`），直接获取 `name` 属性失败，导致显示为 `<service.baidu_search_tools.BaiduSearchTools object at 0x...>`

**修复**: 增加了对 `@tool` 装饰方法的查找逻辑
```python
# 方式2: 检查是否是工具类实例，查找@tool装饰的方法
if not tool_name:
    for attr_name in dir(tool):
        if attr_name.startswith('_'):
            continue
        try:
            attr = getattr(tool, attr_name, None)
            # @tool装饰的方法有name属性，即使不是callable
            if hasattr(attr, 'name'):
                tool_name = attr.name
                tool_desc = getattr(attr, 'description', None)
                break
        except Exception:
            continue
```

### 问题3: 提示词缺乏明确的工具调用指令

**文件**: `lite-backend/service/agent_service_v2.py` line 597-601

**原代码**:
```python
if has_search_tool:
    instructions += "\n\n[搜索工具使用建议]"
    instructions += "\n- 当需要查询最新信息、新闻、实时数据时，使用搜索工具"
```

**问题**: 指令只是"建议"使用，没有强制要求

**修复**:
```python
if has_search_tool:
    instructions += "\n\n[搜索工具使用规则]"
    instructions += "\n- 当用户明确要求'搜索'、'检索'、'查询'、'查找最新'时，必须调用搜索工具"
    instructions += "\n- 当需要查询最新信息、新闻、实时数据时，应该使用搜索工具"
```

### 问题4: Workflow 在 native-tools 模式下未使用 agent.run()

**文件**: `lite-backend/service/workflows/tool_orchestration.py` line 920-940

**原问题**: 当智能体配置了工具且模型支持 native-tools 时，workflow 直接调用网关的 `/v1/chat/completions` 接口，绕过了 Agno 框架的工具调用机制。

**核心问题**:
- 直接调用网关时没有传递 `tools` 参数（OpenAI tools schema）
- 没有处理工具调用的循环（tool_call → execute → continue）
- Agno 框架的 `agent.run()` 方法会自动处理这些

**修复**: 在 `step_execute` 中增加检测逻辑

```python
# 检查是否有工具：如果有工具，应该使用 agent.run() 来处理工具调用循环
agent_has_tools = hasattr(agent, 'tools') and agent.tools and len(agent.tools) > 0

# 如果有工具，使用 agent.run() 而不是直接调用网关
if agent_has_tools:
    logger.info(f"[WF] 检测到智能体有 {len(agent.tools)} 个工具，使用 agent.run() 模式")
    try:
        yield {"stage": "execute", "status": "thinking"}
        # 使用 agent.run() 处理工具调用
        if hasattr(agent, 'arun'):
            res = await agent.arun(final_prompt)
        else:
            res = agent.run(final_prompt)
        text = getattr(res, 'content', None) or (res if isinstance(res, str) else str(res))
        ctx.outputs["result"] = text
        yield {"stage": "execute", "result": text[:2000], "citations": (ctx.vars.get('citations') or [])}
        return
    except Exception as e:
        logger.error(f"[WF] agent.run() 失败: {e}")
        yield {"stage": "execute", "warning": f"agent_run_failed: {e}"}
        # 继续尝试网关调用作为回退
```

## 修复后的完整流程

### 1. 用户选择工具
- 用户在智能体工作室的工具配置中勾选"百度搜索"
- 前端状态: `selectedTools = ["builtin:baidusearch"]`

### 2. 保存草稿智能体
- API: `POST /api/v1/user-agents/drafts`
- 数据库: `user_agents` 表的 `selected_tools` 字段保存为 `["builtin:baidusearch"]`

### 3. 发起对话
- 前端调用: `runWorkflowStream({ ..., selected_tools: selectedTools })`
- API接收: `RunWorkflowRequest.selected_tools = ["builtin:baidusearch"]`
- 日志: `[API] 接收到workflow请求 - agent_name=..., selected_tools=['builtin:baidusearch']`

### 4. Workflow准备阶段
- `step_prepare` 从 `ctx.inputs` 获取 `selected_tools`
- 调用 `create_agent_v2(selected_tools=["builtin:baidusearch"])`

### 5. Agent创建
- `_configure_agent_tools_v2` 检测到 `'builtin:baidusearch' in selected_set`
- 加载 `BaiduSearchTools()` 实例
- 日志: `已添加百度搜索工具 (用户选择)`
- 日志: `智能体 xxx 共加载 1 个工具`

### 6. 构建提示词
- `_build_agent_instructions_v2` 接收 `available_tools=[BaiduSearchTools()]`
- 遍历工具，提取 `baidu_search` 方法的 name 和 description
- 生成指令:
  ```
  【可用工具】
  你可以根据需要调用以下工具来辅助回答：
    - baidu_search: 使用百度搜索引擎查找信息...

  [搜索工具使用规则]
  - 当用户明确要求'搜索'、'检索'、'查询'、'查找最新'时，必须调用搜索工具
  ...
  ```

### 7. 执行对话
- `step_execute` 检测到 `agent.tools` 有1个工具
- 日志: `[WF] 检测到智能体有 1 个工具，使用 agent.run() 模式`
- 调用 `agent.run(prompt)`
- Agno框架自动:
  1. 将 `BaiduSearchTools` 转换为 OpenAI tools schema
  2. 发送给LLM（包含 tools 参数）
  3. 接收 tool_call 响应
  4. 执行 `baidu_search` 方法
  5. 将结果返回给LLM
  6. LLM基于搜索结果生成最终答案

## 验证方法

### 1. 检查日志
应该看到以下日志序列：
```
[API] 接收到workflow请求 - agent_name=通用问答智能体 · draft-xxx, selected_tools=['builtin:baidusearch']
[WF][wf-xxx] step_prepare: agent=通用问答智能体 · draft-xxx tools=['builtin:baidusearch']
已添加百度搜索工具 (用户选择)
智能体 通用问答智能体 · draft-xxx 共加载 1 个工具
[WF] 检测到智能体有 1 个工具，使用 agent.run() 模式
```

### 2. 测试对话
**输入**: "调用工具检索一下最新的LLM新闻"

**预期**:
- 模型调用 `baidu_search` 工具
- 返回实际的搜索结果
- 基于搜索结果生成回答

**不应该**:
- "由于我无法直接访问互联网..."
- 直接使用历史知识回答

## 相关文件

### 后端
- ✅ `api/endpoints/agent_workflows.py` (line 59-60: 添加日志)
- ✅ `service/agent_service_v2.py` (line 563-585: 修复工具名称提取)
- ✅ `service/agent_service_v2.py` (line 597-601: 增强提示词)
- ✅ `service/agent_service_v2.py` (line 321-325: 传递 available_tools 参数)
- ✅ `service/workflows/tool_orchestration.py` (line 920-940: 使用 agent.run() 模式)

### 前端
- ✅ `lite-qa/src/pages/agent/AgentStudioPage.tsx` (line 809: 修复 selected_tools)

## 技术要点

### Agno框架的工具调用机制

1. **工具装饰器**: `@tool` 装饰器将方法转换为可调用的工具
2. **Tools Schema**: Agent 自动将 tools 转换为 OpenAI 兼容的 schema
3. **调用循环**: `agent.run()` 自动处理 LLM → tool_call → execute → continue 的循环
4. **Native vs Local**:
   - **Native Tools**: 模型原生支持 tools，使用 `agent.run()`
   - **Local ReAct**: 模型不支持 tools，使用 Action/Observation 模式

### Native Tools 模式要求

1. 模型必须支持 function calling (如 GPT-4, Qwen2.5 等)
2. 请求必须包含 `tools` 参数（OpenAI schema）
3. 必须使用 `agent.run()` 而不是直接调用 `/v1/chat/completions`
4. 框架会自动处理工具调用的完整循环

## 注意事项

1. **流式响应**: 当使用 `agent.run()` 时，目前是同步返回完整结果，不支持流式
2. **多轮对话**: 工具调用的历史会被 Agent 自动管理
3. **错误处理**: 如果 `agent.run()` 失败，会回退到直接调用网关（无工具模式）

## 测试覆盖

- ✅ 工具选择传递（前端 → 后端）
- ✅ 工具加载逻辑
- ✅ 工具名称提取
- ✅ 提示词生成
- ✅ agent.run() 调用路径
- 🔄 实际工具执行（待测试）

## 修复时间

2025-09-30

## 修复人员

Claude Code (AI Assistant)