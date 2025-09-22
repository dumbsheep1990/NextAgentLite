/**
 * 智能体创建向导 - 多步骤创建流程
 * 支持模板选择、基础配置、知识库挂载、工具选择、模型配置
 */
import React, { useState, useEffect } from 'react';
import {
  Modal, Steps, Form, Input, Select, Switch, Checkbox, Button, 
  Card, Row, Col, message, Typography, Space, Tag, Tooltip,
  Slider, InputNumber, Divider, Alert, Spin, Tabs
} from 'antd';
import {
  RobotOutlined, TeamOutlined, DatabaseOutlined, ToolOutlined,
  SettingOutlined, ExperimentOutlined, ApiOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { userAgentService } from '../../services/userAgentService';
import type { 
  AgentTemplate, AgentTool, KnowledgeCollection, ModelOption,
  CreateUserAgentRequest
} from '../../services/userAgentService';
import './agent-wizard.css';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface AgentCreationWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  preselectedTemplate?: AgentTemplate | null;
}

interface FormData {
  // 步骤1: 模板选择和基础信息
  template_id: string;
  agent_name: string;
  description: string;
  
  // 步骤2: 知识库配置
  collection_id?: string;
  enable_knowledge_search: boolean;
  enable_graph_search: boolean;
  retrieval_mode: 'all' | 'qa_only' | 'papers_only';
  
  // 步骤3: 工具选择
  selected_tools: string[];
  tool_configs: Record<string, any>;
  
  // 步骤4: 模型配置
  model_id: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  custom_prompt: string;
}

const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
  visible,
  onClose,
  onComplete,
  preselectedTemplate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 数据状态
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    template_id: '',
    agent_name: '',
    description: '',
    collection_id: undefined,
    enable_knowledge_search: true,
    enable_graph_search: false,
    retrieval_mode: 'all',
    selected_tools: [],
    tool_configs: {},
    model_id: 'qwen3-30b-a3b-instruct-2507',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.8,
    custom_prompt: ''
  });
  // 当模型列表或所选模型变化时，如果超过该模型的 context_length，则回退到边界
  useEffect(() => {
    const ctx = models.find(m => m.id === formData.model_id)?.context_length || 4000;
    if (formData.max_tokens > ctx) {
      setFormData(prev => ({ ...prev, max_tokens: ctx }));
    }
  }, [formData.model_id, models]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // 加载初始数据
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const tasks = [
        userAgentService.getAgentTemplates(),            // 0: templates
        userAgentService.getKnowledgeCollections(),      // 1: collections
        userAgentService.getAvailableTools(),            // 2: tools
        userAgentService.getAvailableModels()            // 3: models
      ];
      const results = await Promise.allSettled(tasks);

      const [tplRes, colRes, toolRes, modelRes] = results as const;

      if (tplRes.status === 'fulfilled') setTemplates(tplRes.value);
      if (colRes.status === 'fulfilled') setCollections(colRes.value);
      if (toolRes.status === 'fulfilled') setTools(toolRes.value);
      else setTools([]);
      if (modelRes.status === 'fulfilled') setModels(modelRes.value);

      // 汇总错误但不阻断页面，指出具体失败项
      const parts = ['模板', '知识库', '工具', '模型'];
      const failed: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          failed.push(parts[idx]);
          // 打印详细原因到控制台，便于排查（例如 9050 未启动导致“模型”失败）
          // eslint-disable-next-line no-console
          console.warn(`[AgentCreationWizard] 加载失败: ${parts[idx]}`, r.reason);
        }
      });
      if (failed.length > 0) {
        message.warning(`部分数据加载失败: ${failed.join('、')}（已使用可用数据）`);
      }

      // 如果有预选模板，设置到表单中
      if (preselectedTemplate) {
        setFormData(prev => ({
          ...prev,
          template_id: preselectedTemplate.id
        }));
        setSelectedTemplate(preselectedTemplate);
      }
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadInitialData();
      // 如果有预选模板，跳过模板选择步骤，直接进入基础信息配置
      setCurrentStep(preselectedTemplate ? 0 : 0);
    }
  }, [visible, preselectedTemplate]);

  // 处理表单数据更新
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    updateFormData({ template_id: templateId });
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // 基础信息配置
        // 如果有预选模板，确保template_id已设置
        const templateId = preselectedTemplate ? preselectedTemplate.id : formData.template_id;
        if (!templateId || !formData.agent_name.trim()) {
          message.error('请填写智能体名称');
          return false;
        }
        // 确保表单数据中有template_id
        if (!formData.template_id && preselectedTemplate) {
          updateFormData({ template_id: preselectedTemplate.id });
        }
        return true;
      case 1: // 知识库配置
        return true; // 知识库配置是可选的
      case 2: // 工具选择
        return true; // 工具选择是可选的
      case 3: // 模型配置
        if (!formData.model_id) {
          message.error('请选择模型');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // 下一步
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 提交创建
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    try {
      const request: CreateUserAgentRequest = {
        template_id: formData.template_id,
        agent_name: formData.agent_name,
        description: formData.description || undefined,
        collection_id: formData.collection_id,
        enable_knowledge_search: formData.enable_knowledge_search,
        enable_graph_search: formData.enable_graph_search,
        retrieval_mode: formData.retrieval_mode,
        selected_tools: formData.selected_tools,
        tool_configs: formData.tool_configs,
        model_config: {
          default_model: formData.model_id,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          top_p: formData.top_p
        },
        custom_config: formData.custom_prompt ? {
          custom_prompt: formData.custom_prompt
        } : undefined
      };

      await userAgentService.createUserAgent(request);
      message.success('智能体创建成功！');
      onComplete();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤1: 基础信息配置
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* 如果有预选模板，显示模板信息 */}
      {preselectedTemplate && (
        <div>
          <Title level={4}>已选择模板</Title>
          <Card className="border-blue-500 bg-blue-50">
            <div className="flex items-center space-x-4">
              <div className="text-3xl" style={{ color: preselectedTemplate.color }}>
                {preselectedTemplate.template_type === 'team' ? <TeamOutlined /> : <RobotOutlined />}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Title level={5} className="mb-0">{preselectedTemplate.template_name}</Title>
                  <Tag color={preselectedTemplate.template_type === 'team' ? 'blue' : 'green'}>
                    {preselectedTemplate.template_type === 'team' ? 'Team' : '单体'}
                  </Tag>
                  <Tag color="orange">{preselectedTemplate.category}</Tag>
                </div>
                <Text type="secondary" className="text-sm">
                  {preselectedTemplate.description}
                </Text>
              </div>
              <div>
                <Tooltip title="更换模板">
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setSelectedTemplate(null);
                      updateFormData({ template_id: '' });
                    }}
                  >
                    更换
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 如果没有预选模板，显示模板选择 */}
      {!preselectedTemplate && (
        <div>
          <Title level={4}>选择智能体模板</Title>
          <Row gutter={[16, 16]} className="mb-6">
            {templates.map(template => (
              <Col xs={24} sm={12} md={8} key={template.id}>
                <Card
                  hoverable
                  className={`cursor-pointer ${formData.template_id === template.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2" style={{ color: template.color }}>
                      {template.template_type === 'team' ? <TeamOutlined /> : <RobotOutlined />}
                    </div>
                    <Title level={5} className="mb-1">{template.template_name}</Title>
                    <Text type="secondary" className="text-xs">{template.category}</Text>
                    <Tag color={template.template_type === 'team' ? 'blue' : 'green'} className="mt-2">
                      {template.template_type === 'team' ? 'Team' : '单体'}
                    </Tag>
                  </div>
                  <Paragraph ellipsis={{ rows: 2 }} className="text-xs mt-2">
                    {template.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Divider />

      <div>
        <Title level={4}>基础信息</Title>
        <Form layout="vertical">
          <Form.Item label="智能体名称" required>
            <Input
              placeholder="为您的智能体起一个名字"
              value={formData.agent_name}
              onChange={e => updateFormData({ agent_name: e.target.value })}
              maxLength={50}
            />
          </Form.Item>
          <Form.Item label="描述">
            <TextArea
              placeholder="描述这个智能体的功能和用途"
              value={formData.description}
              onChange={e => updateFormData({ description: e.target.value })}
              rows={3}
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );

  // 渲染步骤2: 知识库配置
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Title level={4}>
          <DatabaseOutlined className="mr-2" />
          知识库配置
        </Title>
        <Text type="secondary">配置智能体的知识来源和检索方式</Text>
      </div>

      <Form layout="vertical">
        <Form.Item label="选择知识库">
          <Select
            placeholder="选择一个知识库（可选）"
            value={formData.collection_id}
            onChange={value => updateFormData({ collection_id: value })}
            allowClear
          >
            {collections.map(collection => (
              <Option key={collection.id} value={collection.id}>
                <div className="flex justify-between items-center">
                  <span>{collection.name}</span>
                  <Tag color="blue">{collection.document_count} 文档</Tag>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="启用知识库检索">
              <Switch
                checked={formData.enable_knowledge_search}
                onChange={value => updateFormData({ enable_knowledge_search: value })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用图谱检索">
              <Switch
                checked={formData.enable_graph_search}
                onChange={value => updateFormData({ enable_graph_search: value })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="检索模式">
          <Select
            value={formData.retrieval_mode}
            onChange={value => updateFormData({ retrieval_mode: value })}
          >
            <Option value="all">全部内容</Option>
            <Option value="qa_only">仅问答对</Option>
            <Option value="papers_only">仅论文</Option>
          </Select>
        </Form.Item>
      </Form>
    </div>
  );

  // 渲染步骤3: 工具选择
  const renderStep3 = () => {
    // 分组并去重（以 tool_code）
    const dedup = (arr: AgentTool[]) => {
      const map = new Map<string, AgentTool>();
      arr.forEach(t => { if (!map.has(t.tool_code)) map.set(t.tool_code, t); });
      return Array.from(map.values());
    };
    const builtin = dedup(tools.filter(t => t.tool_type === 'builtin'));
    const mcp = dedup(tools.filter(t => t.tool_type === 'mcp'));
    const api = dedup(tools.filter(t => t.tool_type === 'api'));
    const custom = dedup(tools.filter(t => t.tool_type !== 'builtin' && t.tool_type !== 'mcp' && t.tool_type !== 'api'));

    const ToolList: React.FC<{items: AgentTool[]}> = ({items}) => (
      items.length === 0 ? (
        <Text type="secondary" className="text-xs">暂无</Text>
      ) : (
        <div className="space-y-2">
          {items.map(tool => (
            <Card
              key={tool.tool_code}
              size="small"
              className={`cursor-pointer ${formData.selected_tools.includes(tool.tool_code) ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={formData.selected_tools.includes(tool.tool_code)}
                    onChange={e => {
                      const selected = e.target.checked
                        ? [...formData.selected_tools, tool.tool_code]
                        : formData.selected_tools.filter(code => code !== tool.tool_code);
                      updateFormData({ selected_tools: selected });
                    }}
                  />
                  <div>
                    <Text strong>{tool.tool_name}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">{tool.description}</Text>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    );

    return (
      <div className="space-y-4">
        <div>
          <Title level={4}><ToolOutlined className="mr-2" />工具选择</Title>
          <Text type="secondary">选择智能体可以使用的工具（内置/MCP/API/自定义）</Text>
        </div>
        <Tabs defaultActiveKey="builtin">
          <Tabs.TabPane tab={<span>内置工具 <Tag color="blue">{builtin.length}</Tag></span>} key="builtin">
            <ToolList items={builtin} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>MCP 服务 <Tag color="blue">{mcp.length}</Tag></span>} key="mcp">
            <ToolList items={mcp} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>API 配置 <Tag color="blue">{api.length}</Tag></span>} key="api">
            <ToolList items={api} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>自定义工具 <Tag color="blue">{custom.length}</Tag></span>} key="custom">
            <ToolList items={custom} />
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  };

  // 渲染步骤4: 模型配置
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Title level={4}>
          <SettingOutlined className="mr-2" />
          模型配置
        </Title>
        <Text type="secondary">配置智能体使用的语言模型和参数</Text>
      </div>

      <Form layout="vertical">
        <Form.Item label="选择模型" required>
          <Select
            value={formData.model_id}
            onChange={value => updateFormData({ model_id: value })}
            popupClassName="agent-wizard-select-dropdown"
            optionLabelProp="label"
            dropdownMatchSelectWidth
          >
            {(() => {
              // 按 provider 分组显示
              const groups: Record<string, typeof models> = {};
              models.forEach(m => {
                const key = m.provider || '未分组';
                if (!groups[key]) groups[key] = [] as any;
                groups[key].push(m);
              });
              return Object.entries(groups).map(([prov, items]) => (
                <Select.OptGroup key={prov} label={prov}>
                  {items.map((model) => (
                    <Option key={model.id} value={model.id} label={model.name}>
                      <div>
                        <Text strong>{model.name}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">{model.description}</Text>
                      </div>
                    </Option>
                  ))}
                </Select.OptGroup>
              ));
            })()}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Temperature">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={formData.temperature}
                onChange={value => updateFormData({ temperature: value })}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={formData.temperature}
                onChange={value => updateFormData({ temperature: value || 0.7 })}
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Tokens">
              <Slider
                min={100}
                max={(models.find(m => m.id === formData.model_id)?.context_length || 4000)}
                step={50}
                value={formData.max_tokens}
                onChange={value => updateFormData({ max_tokens: value })}
              />
              <InputNumber
                min={100}
                max={(models.find(m => m.id === formData.model_id)?.context_length || 4000)}
                step={50}
                value={formData.max_tokens}
                onChange={value => updateFormData({ max_tokens: value || 2000 })}
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Top P">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={formData.top_p}
                onChange={value => updateFormData({ top_p: value })}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={formData.top_p}
                onChange={value => updateFormData({ top_p: value || 0.8 })}
                size="small"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="自定义系统提示词（可选）">
          <TextArea
            placeholder="输入自定义的系统提示词，将与模板提示词合并使用"
            value={formData.custom_prompt}
            onChange={e => updateFormData({ custom_prompt: e.target.value })}
            rows={4}
          />
        </Form.Item>
      </Form>
    </div>
  );

  const steps = [
    {
      title: preselectedTemplate ? '基础信息' : '选择模板',
      content: renderStep1(),
      icon: <ExperimentOutlined />
    },
    {
      title: '知识库配置',
      content: renderStep2(),
      icon: <DatabaseOutlined />
    },
    {
      title: '工具选择',
      content: renderStep3(),
      icon: <ToolOutlined />
    },
    {
      title: '模型配置',
      content: renderStep4(),
      icon: <SettingOutlined />
    }
  ];

  return (
    <Modal
      title="创建智能体"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Steps current={currentStep} className="mb-6">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <div className="mb-6" style={{ minHeight: '400px' }}>
          {steps[currentStep]?.content}
        </div>

        <div className="flex justify-between">
          <Button
            disabled={currentStep === 0}
            onClick={handlePrev}
          >
            上一步
          </Button>
          <Space>
            <Button onClick={onClose}>
              取消
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button 
                type="primary" 
                loading={submitting}
                onClick={handleSubmit}
                icon={<CheckCircleOutlined />}
              >
                创建智能体
              </Button>
            )}
          </Space>
        </div>
      </Spin>
    </Modal>
  );
};

export default AgentCreationWizard;
