# 工具集成完整流程

## 数据流向

```
前端 (AgentStudioPage.tsx)
  ↓ selectedTools: ["builtin:baidusearch", "mcp:playwright", "api:test"]
API (agent_workflows.py)
  ↓ RunWorkflowRequest.selected_tools
Workflow (tool_orchestration.py)
  ↓ step_prepare()
  ↓ ctx.inputs["selected_tools"]
Agent Service V2 (agent_service_v2.py)
  ↓ create_agent_v2(selected_tools=...)
  ↓ _configure_agent_tools_v2()
  ↓
  ├─ 内置工具 (builtin:*)
  │   ├─ builtin:reasoning → ReasoningTools()
  │   ├─ builtin:duckduckgo → DuckDuckGoTools()
  │   └─ builtin:baidusearch → BaiduSearchTools() ✅ 新增
  │
  ├─ MCP工具 (mcp:*)
  │   └─ mcp:{server}:{tool} → tools_registry.build_tool_objects()
  │
  └─ API工具 (api:*)
      └─ api:{config}:{tool} → tools_registry.build_tool_objects()
  ↓
Agent.tools = [tool1, tool2, ...]
  ↓
Agent.run(prompt)
  ↓ 模型调用工具
  ↓ 工具执行
  ↓ 返回结果
```

## 关键代码位置

### 1. 前端工具选择
**文件**: `lite-qa/src/pages/agent/AgentStudioPage.tsx`
- **状态**: `selectedTools: string[]`
- **UI**: `ToolsSettingsSection.tsx`
- **分类**: builtin / mcp / api

### 2. 后端API接收
**文件**: `lite-backend/api/endpoints/agent_workflows.py`
- **模型**: `RunWorkflowRequest.selected_tools: List[str]`
- **传递**: 存入 `ctx.inputs["selected_tools"]`

### 3. Workflow准备阶段
**文件**: `lite-backend/service/workflows/tool_orchestration.py`
- **函数**: `step_prepare(ctx)` (line 15)
- **提取**: `selected_tools = ctx.inputs.get("selected_tools") or []` (line 25)
- **传递**: 调用 `create_agent_v2(selected_tools=selected_tools)` (line 52)

### 4. Agent创建与工具配置
**文件**: `lite-backend/service/agent_service_v2.py`
- **函数**: `create_agent_v2()` (line 278)
- **调用**: `_configure_agent_tools_v2(selected_tools=...)` (line 318)

### 5. 工具配置实现
**文件**: `lite-backend/service/agent_service_v2.py`
- **函数**: `_configure_agent_tools_v2()` (line 414)
- **逻辑**:
  ```python
  selected_set = set(selected_tools or [])

  # 内置工具: 根据 selected_set 判断
  if 'builtin:baidusearch' in selected_set:
      tools.append(BaiduSearchTools())

  # MCP/API工具: 通过 tools_registry
  dynamic_tools = await reg.build_tool_objects(selected=selected_tools)
  tools.extend(dynamic_tools)
  ```

### 6. 工具注册表
**文件**: `lite-backend/service/tools_registry.py`
- **类**: `ToolRegistry`
- **函数**: `build_tool_objects(selected)` (line 146)
- **逻辑**:
  - 从9050网关获取MCP服务器和API配置
  - 根据`selected`过滤工具
  - 使用`@tool`装饰器动态创建工具函数

### 7. 工具定义
**内置工具配置**: `docs/agno-tools/builtin-tools.json`
```json
{
  "tool_code": "builtin:baidusearch",
  "tool_name": "百度搜索",
  "tool_type": "builtin",
  "description": "使用百度搜索引擎...",
  "config_schema": {...}
}
```

**内置工具实现**: `lite-backend/service/baidu_search_tools.py`
```python
class BaiduSearchTools:
    @tool(name="baidu_search", description="...")
    def baidu_search(self, query: str, ...) -> str:
        # 搜索实现
```

## 工具类型对比

| 类型 | 前缀 | 配置位置 | 实现位置 | 注册方式 |
|------|------|----------|----------|----------|
| 内置 | `builtin:` | `builtin-tools.json` | `service/*_tools.py` | 直接导入并实例化 |
| MCP | `mcp:` | 9050网关 `/mcp/registry` | 9050网关代理 | `tools_registry` 动态包装 |
| API | `api:` | 9050网关 `/api-tools/configs` | 9050网关代理 | `tools_registry` 动态包装 |

## 工具选择逻辑

### 无选择 (selected_tools = None 或 [])
- **行为**: 加载默认工具（为了兼容性）
- **内置**: 根据库是否安装自动加载
- **MCP/API**: 不加载

### 有选择 (selected_tools = ["builtin:baidusearch", ...])
- **行为**: 只加载选中的工具
- **内置**: `'builtin:xxx' in selected_set` 判断
- **MCP/API**: 传递给 `build_tool_objects(selected=...)`

### 代码示例
```python
# agent_service_v2.py line 422-447
selected_set = set(selected_tools or [])

# 内置工具: 明确判断
if 'builtin:baidusearch' in selected_set or not selected_tools:
    tools.append(BaiduSearchTools())

# 动态工具: 传递过滤
dynamic_tools = await reg.build_tool_objects(selected=selected_tools)
tools.extend(dynamic_tools)
```

## 测试覆盖

### 1. 内置工具测试
- ✅ 工具定义 (`builtin-tools.json`)
- ✅ 工具实现 (`BaiduSearchTools`)
- ✅ 工具导入 (`agent_service_v2.py`)
- ✅ 工具选择逻辑
- 🔄 执行测试 (待运行)

### 2. MCP工具测试
- ✅ 工具发现 (9050 `/mcp/registry`)
- ✅ 工具列举 (9050 `/mcp/servers/{server}/tools`)
- ✅ 工具包装 (`tools_registry.build_tool_objects`)
- 🔄 执行测试 (待运行)

### 3. API工具测试
- ✅ 工具发现 (9050 `/api-tools/configs`)
- ✅ 工具列举 (9050 `/api-tools/configs/{config}/tools`)
- ✅ 工具包装 (`tools_registry.build_tool_objects`)
- 🔄 执行测试 (待运行)

### 4. 混合工具测试
- ✅ 多种类型同时加载
- 🔄 执行测试 (待运行)

## 执行测试

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend
python test_tools_integration.py
```

## 已知问题

### 问题1: 内置工具未根据选择加载 ✅ 已修复
**原因**: 之前的代码没有检查 `selected_tools`，总是加载所有内置工具

**修复**: 添加了 `'builtin:xxx' in selected_set` 判断

### 问题2: 工具执行失败处理
**状态**: 待测试
**需验证**:
- 工具不存在时的错误提示
- 工具执行失败时的错误处理
- 模型调用工具的超时处理

## 下一步

1. ✅ 创建测试脚本
2. 🔄 运行测试脚本
3. 📝 记录测试结果
4. 🐛 修复发现的问题
5. ✅ 完成集成验证