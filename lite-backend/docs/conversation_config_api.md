# 对话配置API文档

## 概览

对话配置API提供了完整的前端对话设置参数支持，包括模型参数、对话管理和快速预设功能。

## API端点

### 基础路径
```
/api/v1/conversation
```

## 1. 获取对话配置

### GET `/config`

获取用户的完整对话配置。

**请求参数：**
- `user_id` (可选): 用户ID，默认为 "default"

**响应示例：**
```json
{
  "success": true,
  "data": {
    "model_params": {
      "temperature": 0.7,
      "max_tokens": 2000,
      "top_p": 0.95,
      "top_k": null,
      "presence_penalty": 0.0,
      "frequency_penalty": 0.0
    },
    "conversation_management": {
      "max_conversation_turns": 20,
      "enable_streaming": true,
      "enable_context_memory": true,
      "context_window_size": 10,
      "auto_save_conversation": true
    },
    "quick_presets": [
      {
        "name": "professional",
        "display_name": "专业模式",
        "description": "精确回答",
        "model_params": {...},
        "conversation_params": {...},
        "agent_settings": {...}
      }
    ],
    "current_preset": "balanced"
  },
  "message": "获取对话配置成功"
}
```

## 2. 更新对话配置

### PUT `/config`

更新用户的对话配置。

**请求体：**
```json
{
  "model_params": {
    "temperature": 0.8,
    "max_tokens": 2500
  },
  "conversation_management": {
    "enable_streaming": false
  },
  "current_preset": "creative"
}
```

## 3. 快速预设管理

### GET `/presets`

获取可用的快速预设列表。

**响应示例：**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "name": "professional",
        "display_name": "专业模式",
        "description": "精确回答"
      },
      {
        "name": "balanced", 
        "display_name": "平衡模式",
        "description": "均衡回答"
      },
      {
        "name": "creative",
        "display_name": "创造模式", 
        "description": "创意回答"
      }
    ],
    "current_preset": "balanced"
  }
}
```

### POST `/config/apply-preset`

应用快速预设。

**请求参数：**
- `preset_name`: 预设名称 (professional/balanced/creative)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "applied_preset": {...},
    "current_config": {...}
  },
  "message": "已应用预设: 平衡模式"
}
```

### POST `/presets`

创建自定义预设。

**请求体：**
```json
{
  "name": "my_custom",
  "display_name": "我的自定义",
  "description": "自定义配置",
  "model_params": {
    "temperature": 0.5,
    "max_tokens": 1500
  },
  "conversation_params": {
    "max_conversation_turns": 15,
    "enable_streaming": true
  },
  "agent_settings": {
    "preferred_agents": ["custom_agent"]
  }
}
```

### DELETE `/presets/{preset_name}`

删除自定义预设（不能删除默认预设）。

## 4. 配置验证和重置

### GET `/config/validate`

验证当前配置的有效性。

**响应示例：**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "issues": [],
    "config": {...}
  }
}
```

### POST `/config/reset`

重置配置为默认值。

## QA接口中的配置支持

### 增强的QA请求

QA接口现在支持以下新参数：

```json
{
  "question": "地聚物材料的性能如何？",
  "session_id": "session_123",
  
  // 模型参数
  "temperature": 0.7,
  "max_tokens": 2000,
  "top_p": 0.95,
  
  // 对话管理
  "enable_streaming": true,
  "enable_context_memory": true,
  "max_context_turns": 10,
  
  // 快速预设
  "preset_name": "professional"
}
```

### 参数优先级

1. **请求参数** > **预设配置** > **用户配置** > **系统默认**

例如：
- 如果请求中指定了 `temperature: 0.8` 和 `preset_name: "professional"`
- 最终使用 `temperature: 0.8`（请求参数优先）
- 其他参数使用专业模式预设的配置

## 预设配置详情

### 专业模式 (professional)
- **目标**: 精确、准确的回答
- **温度**: 0.3（较低创造性）
- **最大tokens**: 2000
- **智能体**: geopolymer_expert, material_scientist
- **向量模式**: 领域向量优先

### 平衡模式 (balanced)
- **目标**: 准确性与创造性平衡
- **温度**: 0.7（中等创造性）
- **最大tokens**: 2000  
- **智能体**: qa_team, geopolymer_qa_team
- **向量模式**: 双向量

### 创造模式 (creative)
- **目标**: 富有创意的回答
- **温度**: 1.0（高创造性）
- **最大tokens**: 2500
- **智能体**: creative_assistant, brainstorm_team
- **向量模式**: 通用向量优先

## 使用示例

### 前端调用示例

```typescript
// 1. 获取当前配置
const response = await fetch('/api/v1/conversation/config');
const config = await response.json();

// 2. 应用专业模式
await fetch('/api/v1/conversation/config/apply-preset?preset_name=professional', {
  method: 'POST'
});

// 3. 使用配置发起问答
const qaResponse = await fetch('/api/v1/qa/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "地聚物材料的强度如何？",
    preset_name: "professional",
    temperature: 0.3,
    max_tokens: 2000
  })
});
```

### 流式问答示例

```typescript
// 流式问答与配置
const eventSource = new EventSource('/api/v1/qa/ask/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "什么是地聚物？",
    preset_name: "balanced",
    enable_streaming: true,
    enable_context_memory: true
  })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    // 处理文字块
    console.log(data.data.content);
  }
};
```

## 配置存储

- 配置文件存储在 `config/conversation_configs/` 目录
- 每个用户一个JSON文件：`{user_id}_conversation.json`
- 支持导入/导出配置（通过用户管理API）

## 错误处理

常见错误码：
- `400`: 请求参数无效
- `404`: 预设不存在
- `500`: 服务器内部错误

## 注意事项

1. **参数验证**: 所有参数都有范围限制，超出范围会返回错误
2. **预设保护**: 默认预设（professional/balanced/creative）不能删除
3. **向后兼容**: 现有QA接口继续工作，新参数为可选
4. **配置持久化**: 配置更改会立即保存，重启后保持
5. **用户隔离**: 不同用户的配置相互独立