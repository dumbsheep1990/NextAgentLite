# Youtu-Agent 框架集成方案

## 概述

本文档详细分析了腾讯开源的 Youtu-Agent 框架与 NextAgentLite 项目的集成可行性，并提供了完整的集成实施方案。通过深入的技术兼容性分析和架构对比，制定了一套既保持现有系统稳定性，又能充分利用 Youtu-Agent 创新功能的集成策略。

## 1. 框架分析对比

### 1.1 NextAgentLite 当前架构

**技术栈概览:**
- **后端**: FastAPI + Python 3.11
- **多智能体框架**: Agno Framework (v1.6.4)
- **配置管理**: YAML配置文件 (agent_teams_v2.yaml)
- **Agent模式**: 
  - 单Agent模式: 7个专业Agent
  - Team协作模式: general_qa_team_v2团队
- **核心依赖**: 
  - pydantic==2.11.5
  - FastAPI==0.115.12
  - SQLAlchemy==2.0.36
- **数据库**: PostgreSQL 17+ (pgvector)
- **知识检索**: 双向量检索 + 知识图谱

**Agent架构特点:**
```yaml
# 现有Agent配置示例
question_decomposition_agent:
  name: "问答拆分智能体"
  model_provider: "one_api"
  model_id: "Qwen/Qwen3-30B-A3B-Thinking-2507"
  temperature: 0.1
  instructions:
    - "分析用户问题的复杂程度和类型"
    - "将复杂问题拆分为可处理的子问题"
```

### 1.2 Youtu-Agent 框架特点

**技术栈要求:**
- **Python版本**: 3.12+ (与现有3.11存在版本差异)
- **配置系统**: pydantic + hydra
- **包管理**: uv (推荐)
- **Agent类型**:
  - SimpleAgent: 单智能体循环推理
  - OrchestraAgent: 多智能体协作指挥

**核心创新功能:**
1. **元智能体 (Meta-Agent)**: 通过对话自动生成Agent配置
2. **环境支持**: ShellLocalEnv、BrowserEnv等多种执行环境
3. **工具集丰富**: 网页搜索、文件操作、代码执行、文档分析
4. **性能验证**: WebWalkerQA 71.47% accuracy, GAIA 72.8% Pass@1

**配置特点:**
```yaml
# Youtu-Agent配置示例
agent:
  name: "research_agent"
  type: "SimpleAgent"
  environments:
    - "ShellLocalEnv"
    - "BrowserEnv"
  toolkits:
    - "search"
    - "file_ops"
```

## 2. 兼容性深度分析

### 2.1 技术兼容性评估

#### ✅ 高兼容性方面

**1. Python生态兼容**
- 两个框架都基于现代Python生态
- 共同依赖pydantic，版本兼容性良好
- FastAPI与两个框架都能良好集成

**2. 配置系统兼容**
- 都使用YAML配置格式
- pydantic数据验证机制一致
- 配置结构可通过转换器互转

**3. 异步架构兼容**
- NextAgentLite基于FastAPI异步架构
- Youtu-Agent支持异步执行
- 可共享异步执行环境

**4. 工具集成兼容**
```python
# 现有工具集成方式
from agno.tools import tool

@tool
def knowledge_search(query: str) -> str:
    return knowledge_service.search(query)

# Youtu-Agent工具集成方式 (兼容)
from youtu_agent.toolkit import Toolkit

class KnowledgeToolkit(Toolkit):
    def search(self, query: str) -> str:
        return knowledge_service.search(query)
```

#### ⚠️ 需要适配的方面

**1. Python版本差异**
- NextAgentLite: Python 3.11
- Youtu-Agent: Python 3.12+
- **解决方案**: 升级到Python 3.12 (向后兼容)

**2. 依赖管理差异**
- NextAgentLite: pip + requirements.txt
- Youtu-Agent: uv (推荐)
- **解决方案**: 保持pip，按需引入uv

**3. 配置系统差异**
- NextAgentLite: 纯YAML + Agno配置
- Youtu-Agent: pydantic + hydra + YAML
- **解决方案**: 创建配置转换层

#### ❌ 潜在冲突点

**1. 框架冲突风险**
- Agno框架 vs Youtu-Agent框架
- **缓解策略**: 平行集成，避免直接替换

**2. 模型调用接口差异**
- NextAgentLite: one_api统一接口
- Youtu-Agent: DeepSeek API直接调用
- **解决方案**: 统一模型调用层

### 2.2 架构兼容性矩阵

| 组件 | NextAgentLite | Youtu-Agent | 兼容性 | 适配难度 |
|------|---------------|-------------|---------|----------|
| Python版本 | 3.11 | 3.12+ | ⚠️ | 低 |
| Web框架 | FastAPI | 独立 | ✅ | 无 |
| 配置系统 | YAML | pydantic+hydra | ⚠️ | 中 |
| Agent模式 | 单/Team | Simple/Orchestra | ✅ | 中 |
| 工具集成 | Agno tools | Toolkit | ✅ | 中 |
| 异步支持 | ✅ | ✅ | ✅ | 无 |
| 数据库 | PostgreSQL | 独立 | ✅ | 无 |
| 知识检索 | 内置 | 可扩展 | ✅ | 低 |

## 3. 集成架构设计

### 3.1 整体架构方案

采用**混合平行集成架构**，保持现有Agno框架稳定运行的同时，引入Youtu-Agent作为增强功能模块。

```
NextAgentLite/
├── lite-backend/
│   ├── service/
│   │   ├── advanced_agent_team_service.py  # 现有Agno服务
│   │   ├── youtu_agent_service.py          # 新增Youtu-Agent服务
│   │   └── hybrid_agent_service.py         # 混合调度服务
│   ├── youtu_integration/                  # Youtu-Agent集成模块
│   │   ├── __init__.py
│   │   ├── agents/                         # Agent配置目录
│   │   │   ├── meta_agent.yaml
│   │   │   ├── research_agent.yaml
│   │   │   └── custom_agents/
│   │   ├── environments/                   # 环境配置
│   │   │   ├── shell_env.py
│   │   │   ├── browser_env.py
│   │   │   └── knowledge_env.py            # 定制知识库环境
│   │   ├── toolkits/                      # 工具集扩展
│   │   │   ├── knowledge_toolkit.py        # 知识库工具集
│   │   │   ├── graph_toolkit.py           # 图谱工具集
│   │   │   └── translation_toolkit.py     # 翻译工具集
│   │   ├── adapters/                      # 适配器层
│   │   │   ├── config_converter.py        # 配置转换器
│   │   │   ├── model_adapter.py           # 模型调用适配器
│   │   │   └── response_formatter.py      # 响应格式化器
│   │   └── meta_agent/                    # 元智能体模块
│   │       ├── meta_agent_core.py
│   │       ├── config_generator.py
│   │       └── conversation_handler.py
│   └── api/endpoints/
│       ├── team_api.py                     # 现有Team API
│       ├── youtu_agent_api.py             # 新增Youtu-Agent API
│       └── hybrid_agent_api.py            # 混合调度API
```

### 3.2 核心服务设计

#### 3.2.1 Youtu-Agent服务层

```python
# lite-backend/service/youtu_agent_service.py
from typing import Dict, Any, List, Optional, AsyncGenerator
import yaml
import asyncio
from pathlib import Path

from youtu_agent import SimpleAgent, OrchestraAgent
from youtu_agent.meta_agent import MetaAgent
from youtu_agent.environments import ShellLocalEnv, BrowserEnv

from core.logger import logger
from core.config_optimized import optimized_config_manager
from .youtu_integration.adapters.config_converter import ConfigConverter
from .youtu_integration.adapters.model_adapter import ModelAdapter

class YoutuAgentService:
    """Youtu-Agent集成服务"""
    
    def __init__(self):
        self.config_base_path = Path("youtu_integration/agents")
        self.meta_agent = None
        self.config_converter = ConfigConverter()
        self.model_adapter = ModelAdapter()
        self.active_agents: Dict[str, Any] = {}
        
    async def initialize(self):
        """初始化Youtu-Agent服务"""
        try:
            # 初始化元智能体
            self.meta_agent = MetaAgent(
                model_config=self.model_adapter.get_model_config()
            )
            
            # 加载预定义配置
            await self._load_predefined_configs()
            
            logger.info("Youtu-Agent服务初始化完成")
            
        except Exception as e:
            logger.error(f"Youtu-Agent服务初始化失败: {e}")
            raise

    async def create_agent_from_conversation(
        self,
        user_messages: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """通过对话创建智能体配置"""
        try:
            # 使用元智能体生成配置
            config = await self.meta_agent.generate_config_from_conversation(
                messages=user_messages,
                context=context or {}
            )
            
            # 转换为NextAgentLite兼容格式
            compatible_config = self.config_converter.youtu_to_agno(config)
            
            # 保存生成的配置
            config_id = await self._save_generated_config(config)
            
            return {
                "config_id": config_id,
                "youtu_config": config,
                "agno_config": compatible_config,
                "status": "generated"
            }
            
        except Exception as e:
            logger.error(f"智能体配置生成失败: {e}")
            raise

    async def run_youtu_agent(
        self,
        config: Dict[str, Any],
        query: str,
        stream: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """运行Youtu-Agent"""
        try:
            # 创建Agent实例
            agent = await self._create_agent_instance(config)
            
            if stream:
                # 流式响应
                async for chunk in agent.run_stream(query):
                    yield {
                        "type": "chunk",
                        "content": chunk,
                        "timestamp": time.time()
                    }
            else:
                # 单次响应
                result = await agent.run(query)
                yield {
                    "type": "complete",
                    "result": result,
                    "timestamp": time.time()
                }
                
        except Exception as e:
            logger.error(f"Youtu-Agent执行失败: {e}")
            yield {
                "type": "error",
                "error": str(e),
                "timestamp": time.time()
            }

    async def _create_agent_instance(self, config: Dict[str, Any]):
        """创建Agent实例"""
        agent_type = config.get("type", "SimpleAgent")
        
        if agent_type == "SimpleAgent":
            return SimpleAgent(
                name=config["name"],
                instructions=config.get("instructions", []),
                model=self.model_adapter.create_model(config.get("model", {})),
                tools=await self._create_tools(config.get("tools", [])),
                environments=await self._create_environments(config.get("environments", []))
            )
        elif agent_type == "OrchestraAgent":
            return OrchestraAgent(
                name=config["name"],
                agents=await self._create_sub_agents(config.get("agents", [])),
                coordinator_config=config.get("coordinator", {})
            )
        else:
            raise ValueError(f"不支持的Agent类型: {agent_type}")
```

#### 3.2.2 混合调度服务

```python
# lite-backend/service/hybrid_agent_service.py
from typing import Dict, Any, List, Optional, AsyncGenerator, Union
from enum import Enum

from .advanced_agent_team_service import AdvancedAgentTeamService
from .youtu_agent_service import YoutuAgentService
from core.logger import logger

class AgentMode(Enum):
    AGNO = "agno"
    YOUTU = "youtu"
    HYBRID = "hybrid"
    AUTO = "auto"

class HybridAgentService:
    """混合智能体调度服务"""
    
    def __init__(self):
        self.agno_service = AdvancedAgentTeamService()
        self.youtu_service = YoutuAgentService()
        
    async def initialize(self):
        """初始化混合服务"""
        await self.agno_service.initialize()
        await self.youtu_service.initialize()
        
    async def query_agent(
        self,
        query: str,
        mode: Union[AgentMode, str] = AgentMode.AUTO,
        agent_config: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """智能体查询统一入口"""
        
        # 模式选择逻辑
        if isinstance(mode, str):
            mode = AgentMode(mode)
            
        if mode == AgentMode.AUTO:
            mode = await self._determine_optimal_mode(query, agent_config)
            
        # 路由到对应的服务
        if mode == AgentMode.AGNO:
            async for result in self._query_agno_agent(query, agent_config, **kwargs):
                yield result
                
        elif mode == AgentMode.YOUTU:
            async for result in self._query_youtu_agent(query, agent_config, **kwargs):
                yield result
                
        elif mode == AgentMode.HYBRID:
            async for result in self._query_hybrid_agent(query, agent_config, **kwargs):
                yield result

    async def _determine_optimal_mode(
        self,
        query: str,
        config: Optional[Dict[str, Any]]
    ) -> AgentMode:
        """智能选择最优执行模式"""
        
        # 基于查询特征判断
        query_features = await self._analyze_query_features(query)
        
        # 规则引擎
        if query_features.get("requires_browser", False):
            return AgentMode.YOUTU
        elif query_features.get("requires_knowledge_graph", False):
            return AgentMode.AGNO
        elif query_features.get("complexity_score", 0) > 0.8:
            return AgentMode.HYBRID
        else:
            return AgentMode.AGNO  # 默认使用现有稳定方案

    async def _query_hybrid_agent(
        self,
        query: str,
        config: Optional[Dict[str, Any]],
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """混合模式执行"""
        
        # 分阶段执行策略
        # 阶段1: 使用Agno进行基础检索和分析
        agno_results = []
        async for result in self._query_agno_agent(query, config, **kwargs):
            agno_results.append(result)
            yield {
                "stage": "agno_processing",
                "result": result
            }
        
        # 阶段2: 基于Agno结果，使用Youtu-Agent进行深度分析
        if agno_results:
            enhanced_query = self._enhance_query_with_agno_results(query, agno_results)
            
            async for result in self._query_youtu_agent(enhanced_query, config, **kwargs):
                yield {
                    "stage": "youtu_enhancement",
                    "result": result
                }
```

### 3.3 前端集成方案

#### 3.3.1 智能配置向导组件

```typescript
// lite-qa/src/components/youtu/YoutuAgentWizard.tsx
import React, { useState, useCallback } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Select,
  message,
  Spin
} from 'antd';
import { RobotOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface YoutuAgentWizardProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (config: any) => void;
}

export const YoutuAgentWizard: React.FC<YoutuAgentWizardProps> = ({
  visible,
  onCancel,
  onConfirm
}) => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [generatedConfig, setGeneratedConfig] = useState<any>(null);
  const [form] = Form.useForm();

  const steps = [
    {
      title: '需求描述',
      content: '描述您想要的智能体功能',
      icon: <RobotOutlined />
    },
    {
      title: '对话配置',
      content: '通过对话完善智能体设置',
      icon: <SettingOutlined />
    },
    {
      title: '配置确认',
      content: '确认生成的智能体配置',
      icon: <CheckCircleOutlined />
    }
  ];

  const handleConversation = useCallback(async (message: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtu-agent/meta-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversationHistory, message],
          context: {
            existing_agents: [], // 可传入现有Agent信息
            domain: 'knowledge_qa'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedConfig(result.config);
        setConversationHistory(prev => [...prev, message]);
        
        if (result.config.status === 'generated') {
          setCurrent(2); // 跳转到确认步骤
          message.success('智能体配置生成成功！');
        } else {
          // 需要更多对话
          message.info('请继续描述您的需求...');
        }
      } else {
        message.error('配置生成失败，请重试');
      }
    } catch (error) {
      console.error('对话处理失败:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [conversationHistory]);

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <Card>
            <Form form={form} layout="vertical">
              <Form.Item
                name="description"
                label="智能体功能描述"
                rules={[{ required: true, message: '请描述您想要的智能体功能' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="例如：我需要一个能够搜索网页并分析技术文档的智能体..."
                />
              </Form.Item>
              
              <Form.Item name="domain" label="应用领域">
                <Select
                  placeholder="选择应用领域"
                  options={[
                    { label: '知识问答', value: 'knowledge_qa' },
                    { label: '文档分析', value: 'document_analysis' },
                    { label: '网页研究', value: 'web_research' },
                    { label: '代码助手', value: 'code_assistant' }
                  ]}
                />
              </Form.Item>
            </Form>
          </Card>
        );

      case 1:
        return (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>与元智能体对话</Title>
              <Paragraph>
                元智能体会通过对话了解您的具体需求，请详细描述您期望的功能。
              </Paragraph>
              
              {/* 对话历史 */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {conversationHistory.map((msg, index) => (
                  <Card key={index} size="small" style={{ marginBottom: 8 }}>
                    <Typography.Text>{msg}</Typography.Text>
                  </Card>
                ))}
              </div>

              {/* 输入框 */}
              <Input.Group compact>
                <Input
                  style={{ width: 'calc(100% - 80px)' }}
                  placeholder="继续描述您的需求..."
                  onPressEnter={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (value.trim()) {
                      handleConversation(value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  disabled={loading}
                />
                <Button 
                  type="primary" 
                  loading={loading}
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleConversation(input.value);
                      input.value = '';
                    }
                  }}
                >
                  发送
                </Button>
              </Input.Group>
            </Space>
          </Card>
        );

      case 2:
        return (
          <Card>
            <Title level={4}>生成的智能体配置</Title>
            {generatedConfig && (
              <div>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Typography.Text strong>智能体名称:</Typography.Text> {generatedConfig.youtu_config?.name}
                </Card>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Typography.Text strong>类型:</Typography.Text> {generatedConfig.youtu_config?.type}
                </Card>
                <Card size="small">
                  <Typography.Text strong>功能描述:</Typography.Text>
                  <pre style={{ marginTop: 8, fontSize: '12px' }}>
                    {JSON.stringify(generatedConfig.youtu_config, null, 2)}
                  </pre>
                </Card>
              </div>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  const next = () => {
    if (current === 0) {
      form.validateFields().then(values => {
        handleConversation(values.description);
        setCurrent(current + 1);
      });
    } else {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <Modal
      title="智能体配置向导"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          {current > 0 && (
            <Button onClick={prev}>上一步</Button>
          )}
          {current < steps.length - 1 ? (
            <Button type="primary" onClick={next} loading={loading}>
              下一步
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                if (generatedConfig) {
                  onConfirm(generatedConfig);
                }
              }}
              disabled={!generatedConfig}
            >
              确认创建
            </Button>
          )}
        </Space>
      }
    >
      <Steps current={current} style={{ marginBottom: 24 }}>
        {steps.map((item, index) => (
          <Step key={index} title={item.title} description={item.content} icon={item.icon} />
        ))}
      </Steps>

      <Spin spinning={loading}>
        {renderStepContent()}
      </Spin>
    </Modal>
  );
};
```

#### 3.3.2 Agent模式选择器

```typescript
// lite-qa/src/components/youtu/AgentModeSelector.tsx
import React from 'react';
import { Radio, Card, Typography, Space, Tag } from 'antd';
import { 
  TeamOutlined, 
  RobotOutlined, 
  ThunderboltOutlined,
  AutomationOutlined 
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export type AgentMode = 'agno' | 'youtu' | 'hybrid' | 'auto';

interface AgentModeSelectorProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
  disabled?: boolean;
}

export const AgentModeSelector: React.FC<AgentModeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const modes = [
    {
      value: 'auto' as AgentMode,
      icon: <AutomationOutlined style={{ color: '#1890ff' }} />,
      title: '智能选择',
      description: '系统根据问题类型自动选择最优的执行模式',
      tags: ['推荐', '智能'],
      color: '#1890ff'
    },
    {
      value: 'agno' as AgentMode,
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
      title: 'Team协作模式',
      description: '使用现有的Agno团队协作，适合知识库查询和复杂推理',
      tags: ['稳定', '知识库'],
      color: '#52c41a'
    },
    {
      value: 'youtu' as AgentMode,
      icon: <RobotOutlined style={{ color: '#722ed1' }} />,
      title: 'Youtu-Agent模式',
      description: '使用Youtu-Agent，支持网页浏览、代码执行等高级功能',
      tags: ['创新', '多功能'],
      color: '#722ed1'
    },
    {
      value: 'hybrid' as AgentMode,
      icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
      title: '混合模式',
      description: '结合两种框架优势，先用Team分析再用Youtu增强',
      tags: ['强化', '全面'],
      color: '#fa8c16'
    }
  ];

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>选择执行模式</Title>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {modes.map((mode) => (
            <Radio key={mode.value} value={mode.value} style={{ width: '100%' }}>
              <Card
                size="small"
                style={{
                  marginLeft: 8,
                  border: value === mode.value ? `2px solid ${mode.color}` : '1px solid #d9d9d9',
                  backgroundColor: value === mode.value ? `${mode.color}10` : 'transparent'
                }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <Space align="start">
                  {mode.icon}
                  <div>
                    <Space>
                      <Typography.Text strong>{mode.title}</Typography.Text>
                      {mode.tags.map((tag, index) => (
                        <Tag key={index} color={mode.color} size="small">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                    <Paragraph style={{ margin: 0, marginTop: 4, fontSize: '12px', color: '#666' }}>
                      {mode.description}
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};
```

## 4. API接口设计

### 4.1 核心API端点

```python
# lite-backend/api/endpoints/youtu_agent_api.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, AsyncGenerator
from sse_starlette.sse import EventSourceResponse

from service.youtu_agent_service import YoutuAgentService
from service.hybrid_agent_service import HybridAgentService, AgentMode

router = APIRouter(prefix="/api/youtu-agent", tags=["Youtu Agent Integration"])

# 请求模型
class MetaAgentRequest(BaseModel):
    messages: List[str] = Field(..., description="对话消息列表")
    context: Optional[Dict[str, Any]] = Field(None, description="上下文信息")

class AgentRunRequest(BaseModel):
    query: str = Field(..., description="查询内容")
    mode: AgentMode = Field(AgentMode.AUTO, description="执行模式")
    config: Optional[Dict[str, Any]] = Field(None, description="Agent配置")
    stream: bool = Field(False, description="是否使用流式响应")

class HybridQueryRequest(BaseModel):
    query: str = Field(..., description="查询内容")
    mode: AgentMode = Field(AgentMode.AUTO, description="执行模式")
    agent_config: Optional[Dict[str, Any]] = Field(None, description="Agent配置")
    session_id: Optional[str] = Field(None, description="会话ID")

# API端点
@router.post("/meta-generate")
async def generate_agent_config(request: MetaAgentRequest):
    """通过对话生成智能体配置"""
    try:
        service = YoutuAgentService()
        await service.initialize()
        
        result = await service.create_agent_from_conversation(
            user_messages=request.messages,
            context=request.context
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"元智能体配置生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run")
async def run_youtu_agent(request: AgentRunRequest):
    """运行Youtu-Agent（非流式）"""
    try:
        service = YoutuAgentService()
        await service.initialize()
        
        results = []
        async for result in service.run_youtu_agent(
            config=request.config or {},
            query=request.query,
            stream=False
        ):
            results.append(result)
        
        return {
            "success": True,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Youtu-Agent执行失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-stream")
async def run_youtu_agent_stream(request: AgentRunRequest):
    """运行Youtu-Agent（流式响应）"""
    
    async def event_generator():
        try:
            service = YoutuAgentService()
            await service.initialize()
            
            async for result in service.run_youtu_agent(
                config=request.config or {},
                query=request.query,
                stream=True
            ):
                yield {
                    "event": "data",
                    "data": json.dumps(result)
                }
                
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
        finally:
            yield {
                "event": "end",
                "data": json.dumps({"status": "completed"})
            }
    
    return EventSourceResponse(event_generator())

@router.post("/hybrid-query")
async def hybrid_agent_query(request: HybridQueryRequest):
    """混合智能体查询"""
    
    async def event_generator():
        try:
            service = HybridAgentService()
            await service.initialize()
            
            async for result in service.query_agent(
                query=request.query,
                mode=request.mode,
                agent_config=request.agent_config
            ):
                yield {
                    "event": "data",
                    "data": json.dumps(result, ensure_ascii=False)
                }
                
        except Exception as e:
            logger.error(f"混合Agent查询失败: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}, ensure_ascii=False)
            }
        finally:
            yield {
                "event": "end",
                "data": json.dumps({"status": "completed"}, ensure_ascii=False)
            }
    
    return EventSourceResponse(event_generator())

@router.get("/configs")
async def list_agent_configs():
    """获取所有可用的Agent配置"""
    try:
        service = YoutuAgentService()
        configs = await service.list_available_configs()
        
        return {
            "success": True,
            "configs": configs
        }
        
    except Exception as e:
        logger.error(f"获取Agent配置列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查Youtu-Agent服务状态
        service = YoutuAgentService()
        await service.initialize()
        
        return {
            "status": "healthy",
            "youtu_agent": "available",
            "timestamp": time.time()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }
```

## 5. 配置管理和转换

### 5.1 配置转换器

```python
# lite-backend/youtu_integration/adapters/config_converter.py
from typing import Dict, Any, List
import yaml
from pathlib import Path

class ConfigConverter:
    """配置格式转换器"""
    
    def youtu_to_agno(self, youtu_config: Dict[str, Any]) -> Dict[str, Any]:
        """将Youtu-Agent配置转换为Agno兼容格式"""
        
        # 基础映射
        agno_config = {
            "agents": {},
            "agent_teams": {}
        }
        
        # 转换单个Agent
        if youtu_config.get("type") == "SimpleAgent":
            agent_name = youtu_config.get("name", "converted_agent")
            agno_config["agents"][agent_name] = {
                "name": youtu_config.get("display_name", agent_name),
                "role": youtu_config.get("description", "转换的智能体"),
                "model_provider": "one_api",
                "model_id": self._convert_model_id(youtu_config.get("model", {})),
                "temperature": youtu_config.get("temperature", 0.1),
                "max_tokens": youtu_config.get("max_tokens", 4096),
                "instructions": youtu_config.get("instructions", []),
                "tools": self._convert_tools(youtu_config.get("tools", [])),
                "environments": self._convert_environments(youtu_config.get("environments", []))
            }
            
        # 转换Orchestra Agent为Team
        elif youtu_config.get("type") == "OrchestraAgent":
            team_name = youtu_config.get("name", "converted_team")
            
            # 转换子Agent
            sub_agents = {}
            for sub_agent_config in youtu_config.get("agents", []):
                sub_agent_name = sub_agent_config.get("name")
                sub_agents[sub_agent_name] = self._convert_sub_agent(sub_agent_config)
            
            agno_config["agents"].update(sub_agents)
            
            # 创建Team配置
            agno_config["agent_teams"][team_name] = {
                "name": youtu_config.get("display_name", team_name),
                "mode": "coordinate",
                "coordinator": self._create_coordinator(youtu_config.get("coordinator", {})),
                "members": list(sub_agents.keys()),
                "instructions": youtu_config.get("instructions", []),
                "success_criteria": youtu_config.get("success_criteria", "完成指定任务"),
                "description": youtu_config.get("description", "转换的智能体团队")
            }
        
        return agno_config
    
    def agno_to_youtu(self, agno_config: Dict[str, Any]) -> Dict[str, Any]:
        """将Agno配置转换为Youtu-Agent格式"""
        
        youtu_configs = []
        
        # 转换单个Agent
        for agent_name, agent_config in agno_config.get("agents", {}).items():
            youtu_config = {
                "name": agent_name,
                "display_name": agent_config.get("name", agent_name),
                "type": "SimpleAgent",
                "description": agent_config.get("role", ""),
                "instructions": agent_config.get("instructions", []),
                "model": {
                    "provider": agent_config.get("model_provider", "openai"),
                    "model_id": agent_config.get("model_id", "gpt-3.5-turbo"),
                    "temperature": agent_config.get("temperature", 0.1),
                    "max_tokens": agent_config.get("max_tokens", 4096)
                },
                "tools": self._convert_agno_tools(agent_config.get("tools", [])),
                "environments": ["default"]
            }
            youtu_configs.append(youtu_config)
        
        # 转换Team为Orchestra Agent
        for team_name, team_config in agno_config.get("agent_teams", {}).items():
            orchestra_config = {
                "name": team_name,
                "display_name": team_config.get("name", team_name),
                "type": "OrchestraAgent",
                "description": team_config.get("description", ""),
                "instructions": team_config.get("instructions", []),
                "coordinator": self._convert_coordinator(team_config.get("coordinator", {})),
                "agents": [
                    {
                        "name": member_name,
                        "config": agno_config["agents"].get(member_name, {})
                    }
                    for member_name in team_config.get("members", [])
                ]
            }
            youtu_configs.append(orchestra_config)
        
        return youtu_configs[0] if len(youtu_configs) == 1 else youtu_configs
    
    def _convert_model_id(self, model_config: Dict[str, Any]) -> str:
        """转换模型ID"""
        provider = model_config.get("provider", "openai")
        model_id = model_config.get("model_id", "gpt-3.5-turbo")
        
        # 映射规则
        model_mapping = {
            "deepseek": "Qwen/Qwen3-30B-A3B-Thinking-2507",
            "openai": "Qwen/Qwen3-30B-A3B-Thinking-2507",
            "default": "Qwen/Qwen3-30B-A3B-Thinking-2507"
        }
        
        return model_mapping.get(provider, model_mapping["default"])
    
    def _convert_tools(self, youtu_tools: List[str]) -> List[str]:
        """转换工具列表"""
        tool_mapping = {
            "search": "web_search",
            "file_ops": "file_operations", 
            "code_exec": "code_execution",
            "browser": "browser_automation"
        }
        
        return [tool_mapping.get(tool, tool) for tool in youtu_tools]
    
    def _convert_environments(self, youtu_envs: List[str]) -> List[str]:
        """转换环境列表"""
        env_mapping = {
            "ShellLocalEnv": "shell",
            "BrowserEnv": "browser",
            "KnowledgeEnv": "knowledge_base"
        }
        
        return [env_mapping.get(env, env) for env in youtu_envs]
```

## 6. 部署和迁移策略

### 6.1 渐进式部署方案

#### 阶段1: 基础集成（2周）
1. **环境准备**
   - Python版本升级到3.12
   - 安装Youtu-Agent依赖
   - 配置uv包管理器（可选）

2. **核心服务开发**
   - 实现YoutuAgentService基础功能
   - 创建基础API端点
   - 配置转换器开发

3. **前端组件**
   - 元智能体对话组件
   - Agent模式选择器
   - 基础配置界面

#### 阶段2: 功能扩展（3周）
1. **高级功能集成**
   - 混合调度服务
   - 工具集扩展
   - 环境适配器

2. **前端增强**
   - 配置向导完善
   - 流式响应支持
   - 结果展示优化

3. **性能优化**
   - 异步处理优化
   - 缓存机制
   - 错误处理完善

#### 阶段3: 生产部署（2周）
1. **稳定性测试**
   - 集成测试
   - 性能测试
   - 兼容性验证

2. **监控和日志**
   - 服务监控
   - 性能指标
   - 错误追踪

3. **文档和培训**
   - 用户手册
   - 开发文档
   - 使用培训

### 6.2 风险控制措施

#### 技术风险
1. **框架冲突**: 采用平行集成避免直接替换
2. **性能影响**: 独立进程运行，不影响现有服务
3. **依赖冲突**: 使用虚拟环境隔离

#### 业务风险
1. **功能回退**: 保持原有Agno框架完全可用
2. **用户体验**: 提供模式选择，让用户主动选择
3. **数据安全**: 新功能不影响现有数据

#### 运维风险
1. **服务稳定性**: 独立部署，故障隔离
2. **资源消耗**: 监控资源使用，设置限制
3. **版本管理**: 严格的版本控制和回滚机制

## 7. 性能和监控

### 7.1 性能基准测试

基于官方数据，Youtu-Agent在标准测试中表现：
- WebWalkerQA: 71.47% accuracy (pass@1)
- GAIA text subset: 72.8% Pass@1
- 使用DeepSeek-V3系列模型

### 7.2 监控指标

```python
# 关键性能指标
MONITORING_METRICS = {
    "response_time": {
        "youtu_agent_execution": "Youtu-Agent执行时间",
        "config_generation": "配置生成时间",
        "hybrid_processing": "混合模式处理时间"
    },
    "success_rate": {
        "meta_agent_generation": "元智能体生成成功率", 
        "agent_execution": "Agent执行成功率",
        "config_conversion": "配置转换成功率"
    },
    "resource_usage": {
        "memory_consumption": "内存使用量",
        "cpu_utilization": "CPU使用率",
        "api_call_frequency": "API调用频率"
    }
}
```

## 8. 预期收益和价值

### 8.1 功能增强
1. **智能配置生成**: 通过元智能体降低Agent创建门槛
2. **环境扩展**: 支持浏览器、Shell等多种执行环境
3. **工具集丰富**: 集成网页搜索、文件操作、代码执行等
4. **性能提升**: 利用已验证的高性能框架

### 8.2 用户体验提升
1. **降低使用门槛**: 对话式配置生成
2. **增强功能性**: 支持更多类型的任务
3. **提高准确性**: 利用高性能模型和优化算法
4. **保持灵活性**: 多模式选择，适应不同场景

### 8.3 技术债务控制
1. **架构清晰**: 平行集成避免复杂重构
2. **兼容性好**: 保持现有功能完全可用
3. **扩展性强**: 为未来功能扩展奠定基础
4. **风险可控**: 独立部署，影响范围有限

## 9. 总结和建议

### 9.1 集成可行性评估

**综合可行性评分: 8.5/10**

- **技术可行性**: 9/10 (高度兼容，技术栈匹配)
- **业务价值**: 8/10 (显著功能增强)
- **实施难度**: 7/10 (中等复杂度，需要careful设计)
- **风险控制**: 9/10 (风险可控，影响范围限定)

### 9.2 关键成功因素

1. **渐进式集成**: 分阶段实施，每阶段验证
2. **充分测试**: 全面的兼容性和性能测试
3. **用户反馈**: 及时收集用户反馈并优化
4. **文档完善**: 详细的使用和开发文档

### 9.3 最终建议

**推荐实施集成方案**，原因如下：

1. **技术兼容性良好**: 两个框架在技术栈层面高度兼容
2. **功能互补性强**: Youtu-Agent的创新功能很好补充现有能力
3. **风险可控**: 采用平行集成策略，不影响现有服务稳定性
4. **用户价值高**: 元智能体功能将显著提升用户体验

通过本集成方案，NextAgentLite将获得：
- 更智能的Agent配置生成能力
- 更丰富的执行环境和工具集
- 更高的任务执行成功率
- 更好的用户使用体验

同时保持：
- 现有功能的完全可用性
- 系统架构的稳定性
- 数据和服务的安全性

---

*文档版本: v1.0*  
*创建日期: 2025-09-10*  
*最后更新: 2025-09-10*