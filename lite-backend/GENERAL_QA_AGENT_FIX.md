# 通用问答智能体提示词修复

## 问题描述

通用问答智能体（`qa_expert` 和 `qa_team`）设计为**无知识库**的智能体，但LLM在思考过程中仍然会提到"当前知识库中没有相关数据"。

## 根本原因

### 原因1: 数据库中的指令包含知识库引用
**位置**: `agent_templates` 表中的 `base_config->instructions`

**原指令** (`qa_expert`):
```json
["准确理解用户问题", "提供专业、准确的回答", "基于知识库内容回答，避免幻觉"]
```

**原指令** (`qa_team`):
```json
["回答用户的各类问题，提供准确、专业的答案",
 "优先使用本地知识库进行检索和回答",  // ❌ 问题所在
 "如果本地知识库没有相关信息，基于通用知识提供有用回答",
 ...]
```

### 原因2: YAML配置文件同样存在问题
**位置**: `config/agent_teams_v2.yaml` line 27

```yaml
instructions:
  - "优先使用本地知识库进行检索和回答"  # ❌ 问题所在
  - "如果本地知识库没有相关信息，基于通用知识提供有用回答"
```

### 原因3: Agent指令构建逻辑
**位置**: `service/agent_service_v2.py` line 506-512

```python
# 当 search_knowledge 或 search_graph 为 true 时，会强制添加检索指令
if search_knowledge or search_graph:
    instructions += "\n\n🚨 CRITICAL SYSTEM REQUIREMENT 关键系统要求 🚨"
    instructions += "\n⛔ 禁止规则：绝对禁止在未调用检索工具的情况下直接回答任何专业问题！"
```

**注**: 对于通用问答智能体，`search_knowledge` 和 `search_graph` 应该为 `False`，所以这部分不会被添加。

## 修复方案

### 修复1: 更新数据库中的指令 ✅

**`qa_expert` 新指令**:
```sql
UPDATE agent_templates
SET base_config = jsonb_set(
    base_config,
    '{instructions}',
    '["准确理解用户问题",
      "提供专业、准确的回答",
      "基于通用知识回答问题，无需依赖知识库",  ✅ 明确说明
      "保持回答简洁明了，避免冗余信息"]'::jsonb
)
WHERE template_code = 'qa_expert';
```

**`qa_team` 新指令**:
```sql
UPDATE agent_templates
SET base_config = jsonb_set(
    base_config - 'instructions',
    '{instructions}',
    '["回答用户的各类问题，提供准确、专业的答案",
      "基于通用知识和常识提供回答，无需查询知识库",  ✅ 明确说明
      "如果问题超出能力范围，诚实告知用户",
      "确保回答的准确性和实用性",
      "支持多语言问答",
      "提供结构化、清晰的回答格式"]'::jsonb
)
WHERE template_code = 'qa_team';
```

### 修复2: 更新YAML配置文件 ✅

**文件**: `config/agent_teams_v2.yaml` line 25-31

```yaml
instructions:
  - "回答用户的各类问题，提供准确、专业的答案"
  - "基于通用知识和常识提供回答，无需查询知识库"  ✅ 修改
  - "如果问题超出能力范围，诚实告知用户"
  - "确保回答的准确性和实用性"
  - "支持多语言问答"
  - "提供结构化、清晰的回答格式"
```

## 验证方法

### 1. 检查数据库
```bash
export PGPASSWORD='zzdsj123!'
psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo -c \
"SELECT template_code, base_config->'instructions' FROM agent_templates WHERE template_code IN ('qa_expert', 'qa_team');"
```

### 2. 测试Agent创建
```python
from service.agent_service_v2 import get_agent_service_v2

service = await get_agent_service_v2()
agent = await service.create_agent_v2(
    agent_name="qa_expert",
    selected_tools=[],
    model_name="Qwen/Qwen2.5-7B-Instruct",
    model_provider="siliconflow",
    search_knowledge=False,  # ✅ 确保为False
    search_graph=False,       # ✅ 确保为False
)

# 检查agent的instructions
print(agent.instructions)
```

**预期输出**: 不应该包含任何关于"知识库"、"检索"、"search"的内容

### 3. 实际问答测试
**测试问题**: "什么是人工智能？"

**期望行为**:
- ✅ 直接基于通用知识回答
- ❌ 不应该提到"知识库"
- ❌ 不应该提到"检索失败"
- ❌ 不应该提到"没有相关数据"

## 关键配置参数

在创建通用问答Agent时，务必确保：

```python
search_knowledge = False  # ✅ 不启用知识库检索
search_graph = False      # ✅ 不启用图谱检索
selected_tools = []       # ✅ 不选择任何工具（或只选择搜索工具）
```

## 数据流确认

```
1. 用户选择"通用问答智能体"模板
   ↓
2. 前端发送创建请求（不绑定知识库）
   ↓
3. agent_workflows.py 接收请求
   collection_id = None  ✅
   ↓
4. tool_orchestration.py step_prepare
   search_knowledge = False  ✅ (因为没有collection_id)
   search_graph = False      ✅ (默认为False)
   ↓
5. agent_service_v2.py create_agent_v2
   从数据库/YAML加载指令 → 已修复 ✅
   ↓
6. agent_service_v2.py _build_agent_instructions_v2
   if search_knowledge or search_graph:  # False, 不执行
       # 不会添加检索指令 ✅
   ↓
7. Agent创建完成
   instructions = 修复后的指令 ✅
```

## 测试用例

### 测试1: Agent指令检查
```python
agent = await service.create_agent_v2(
    agent_name="qa_expert",
    search_knowledge=False,
    search_graph=False,
)
assert "知识库" not in agent.instructions
assert "检索" not in agent.instructions
```

### 测试2: 实际问答
```python
response = agent.run("什么是机器学习？")
content = response.content
assert "知识库" not in content
assert "没有相关数据" not in content
```

### 测试3: 思考过程检查
```python
# 如果启用了thinking模式
response = agent.run("解释深度学习的原理")
reasoning = response.reasoning if hasattr(response, 'reasoning') else ""
assert "知识库" not in reasoning
assert "检索" not in reasoning
```

## 已完成的修复

- ✅ 更新 `qa_expert` 模板指令（数据库）
- ✅ 更新 `qa_team` 模板指令（数据库）
- ✅ 更新 `qa_team` 指令（YAML文件）
- ✅ 确认逻辑流程正确（无需修改代码）

## 注意事项

1. **已创建的Agent实例**: 需要重新创建才能使用新指令
2. **缓存问题**: 如果Agent Service有缓存，可能需要重启后端
3. **其他模板**: 检查是否有其他无知识库的模板也需要修复

## 相关文件

- ✅ `/Users/wxn/Desktop/NextAgentLite/lite-backend/config/agent_teams_v2.yaml`
- ⚠️ 数据库表 `agent_templates` (已更新)
- 📖 `/Users/wxn/Desktop/NextAgentLite/lite-backend/service/agent_service_v2.py` (逻辑正确，无需修改)

## 修复时间

2025-09-30

## 修复人员

Claude Code (AI Assistant)