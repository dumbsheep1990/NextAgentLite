/**
 * Agent创建工坊 - 专业版
 * 企业级智能体创建和定制化配置平台
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Card, Steps, Button, Input, Space, Typography, 
  Alert, Spin, Row, Col, Form, Modal, Select, 
  Slider, message, Descriptions
} from 'antd';
import {
  RobotOutlined, MessageOutlined, ToolOutlined,
  SaveOutlined, BulbOutlined, CheckCircleOutlined, 
  SettingOutlined, ThunderboltOutlined, FileTextOutlined,
  EyeOutlined, UserOutlined, CustomerServiceOutlined,
  ApiOutlined, CodeOutlined, SearchOutlined
} from '@ant-design/icons';
import { TabDock } from '../../components/ui/tab-dock';
import { CyclingInfoCards, type InfoItem } from '../../components/ui/cycling-info-cards';
import { youtuAgentService } from '../../services/youtuAgentService';
import type { CreateAgentConfigParams } from '../../services/youtuAgentService';
import { ModernTextInput } from '../../components/ui/modern-text-input';
import styles from './AgentCreator.module.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

// 创建模式
type CreationMode = 'auto' | 'template' | 'manual';

// 动态配置类型定义
interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface AgentEnvironment {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface AgentTypeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  features: string[];
}

interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  config: {
    agent_type: string;
    tools: string[];
    environments: string[];
    instructions: string[];
  };
  metadata: {
    created_at: string;
    updated_at: string;
    author: string;
    version: string;
    tags: string[];
  };
}

// 预设模板（移除emoji，采用专业化图标）
const AGENT_TEMPLATES = [
  {
    id: 'data_analyst',
    name: '数据分析师',
    description: '专业的数据分析和报告生成Agent，擅长处理CSV、Excel等表格数据，生成可视化报告',
    category: 'Analytics',
    config: {
      agent_type: 'SimpleAgent' as const,
      tools: ['tabular_data', 'file_ops', 'analysis'],
      environments: ['shell_env'],
      instructions: [
        '你是一个专业的数据分析师',
        '擅长分析CSV、Excel等表格数据',
        '能生成清晰的数据报告和可视化图表',
        '保持数据分析的客观性和准确性'
      ]
    }
  },
  {
    id: 'research_assistant',
    name: '研究助手',
    description: '深度研究和文献调研Agent，能够综合多个信息源生成全面的研究报告',
    category: 'Research',
    config: {
      agent_type: 'OrchestraAgent' as const,
      tools: ['search', 'document', 'knowledge'],
      environments: ['browser_env', 'knowledge_env'],
      instructions: [
        '你是一个专业的研究助手',
        '擅长进行深度调研和文献分析',
        '能够综合多个信息源生成全面的研究报告',
        '保持研究的严谨性和学术标准'
      ]
    }
  },
  {
    id: 'code_assistant',
    name: '编程助手',
    description: '代码生成和技术解决方案Agent，熟悉多种编程语言和开发框架',
    category: 'Development',
    config: {
      agent_type: 'SimpleAgent' as const,
      tools: ['code_exec', 'file_ops', 'git'],
      environments: ['shell_env'],
      instructions: [
        '你是一个专业的编程助手',
        '能够编写、调试和优化代码',
        '熟悉多种编程语言和开发框架',
        '遵循代码最佳实践和安全规范'
      ]
    }
  },
  {
    id: 'content_creator',
    name: '内容创作者',
    description: '文案写作和内容生成Agent，能够适应不同的写作风格和目标受众',
    category: 'Content',
    config: {
      agent_type: 'SimpleAgent' as const,
      tools: ['search', 'translation', 'file_ops'],
      environments: ['browser_env'],
      instructions: [
        '你是一个创意内容创作者',
        '擅长写作各种类型的文案和内容',
        '能够适应不同的写作风格和目标受众',
        '保持内容的原创性和吸引力'
      ]
    }
  }
];

// 说明信息数据
const INFO_ITEMS: InfoItem[] = [
  {
    id: 'intelligent-generation',
    title: '智能生成优势',
    description: 'NextAgent通过4步智能对话流程，根据您的具体需求自动生成最适合的Agent配置，包括工具选择、指令优化和参数调整。',
    icon: <BulbOutlined />,
    color: 'blue'
  },
  {
    id: 'template-benefits',
    title: '模板快速部署',
    description: '选择预设的专业模板，快速创建常用场景的Agent。每个模板都经过优化测试，可直接使用或作为定制的起点。',
    icon: <FileTextOutlined />,
    color: 'green'
  },
  {
    id: 'manual-flexibility',
    title: '手动配置灵活性',
    description: '完全自定义Agent的每个参数，包括模型选择、工具集配置、环境设置和执行策略，满足高级用户的个性化需求。',
    icon: <SettingOutlined />,
    color: 'orange'
  },
  {
    id: 'best-practices',
    title: '最佳实践建议',
    description: '首次使用建议选择智能生成，可以快速了解Agent配置原理。有经验用户可选择模板加速开发，或使用手动配置实现精细控制。',
    icon: <CheckCircleOutlined />,
    color: 'purple'
  }
];

const AgentCreatorPage: React.FC = () => {
  const [creationMode, setCreationMode] = useState<CreationMode>('auto');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 渲染消息内容，识别工具选择
  const renderMessageContent = (content: string, type: 'user' | 'assistant') => {
    if (type === 'user') {
      return <Text>{content}</Text>;
    }

    // 检测特定的工具选择格式：已选择工具：
    const toolSelectionRegex = /已选择工具[：:]\s*([\s\S]*?)(?=接下来|$)/g;
    const toolItemRegex = /-\s*([^(]+)\s*\(([^)]+)\)/g;

    // 检测步骤信息
    const stepPatterns = [
      /第(\d+)步[：:](.+)/g,
      /Step\s+(\d+)[：:](.+)/gi,
      /步骤\s*(\d+)[：:](.+)/g
    ];

    let processedContent = content;
    let hasSpecialContent = false;

    // 检查是否包含工具选择信息
    const toolMatch = toolSelectionRegex.exec(content);
    if (toolMatch) {
      hasSpecialContent = true;
      const toolsSection = toolMatch[1];
      const tools: Array<{name: string, id: string}> = [];
      
      let toolItemMatch;
      while ((toolItemMatch = toolItemRegex.exec(toolsSection)) !== null) {
        tools.push({
          name: toolItemMatch[1].trim(),
          id: toolItemMatch[2].trim()
        });
      }

      const beforeTools = content.substring(0, toolMatch.index);
      const afterTools = content.substring(toolMatch.index + toolMatch[0].length);

      return (
        <div>
          {beforeTools && <Text>{beforeTools}</Text>}
          
          <div className={styles.toolSelection}>
            <div className={styles.toolSelectionHeader}>
              <div className={styles.toolSelectionIcon}>
                <ToolOutlined />
              </div>
              已选择工具
            </div>
            <div className={styles.toolsList}>
              {tools.map((tool, index) => (
                <div key={index} className={styles.toolItem}>
                  <ApiOutlined className="toolIcon" />
                  <span>{tool.name}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    opacity: 0.8,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    {tool.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {afterTools && <Text>{afterTools}</Text>}
        </div>
      );
    }

    // 检查步骤信息
    for (const pattern of stepPatterns) {
      const match = pattern.exec(content);
      if (match) {
        hasSpecialContent = true;
        return (
          <div className={styles.systemMessage}>
            <div className="statusIcon">
              <CheckCircleOutlined />
            </div>
            <div className="stepInfo">第{match[1]}步</div>
            <div className="stepDetail">{match[2]}</div>
          </div>
        );
      }
    }

    return <Text>{content}</Text>;
  };

  // 自动生成状态
  const [autoGeneration, setAutoGeneration] = useState({
    sessionId: '',
    userRequirement: '',
    conversationHistory: [] as Array<{type: 'user' | 'assistant'; content: string}>,
    currentQuestion: '',
    generatedConfig: null as any,
    isGenerating: false,
    isComplete: false
  });

  // 模板选择状态
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // 模板详情弹窗状态
  const [templateDetailVisible, setTemplateDetailVisible] = useState(false);
  const [currentTemplateDetail, setCurrentTemplateDetail] = useState<any>(null);

  // 动态配置数据状态
  const [availableTools, setAvailableTools] = useState<AgentTool[]>([]);
  const [availableEnvironments, setAvailableEnvironments] = useState<AgentEnvironment[]>([]);
  const [agentTypes, setAgentTypes] = useState<AgentTypeConfig[]>([]);
  const [dynamicTemplates, setDynamicTemplates] = useState<DynamicTemplate[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  // 自动滚动到对话底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoGeneration.conversationHistory]);

  // 手动配置状态
  const [manualConfig, setManualConfig] = useState<Partial<CreateAgentConfigParams>>({
    agent_type: 'SimpleAgent',
    model_config: {
      provider: 'one_api',
      model_id: 'Qwen/Qwen3-30B-A3B-Thinking-2507',
      temperature: 0.1,
      max_tokens: 4096,
      top_p: 1.0
    },
    tools: [],
    environments: []
  });

  // 加载动态配置数据
  useEffect(() => {
    const loadDynamicConfig = async () => {
      setConfigLoading(true);
      try {
        // 加载工具配置
        const toolsResponse = await youtuAgentService.getAvailableTools();
        if (toolsResponse.success) {
          setAvailableTools(toolsResponse.data || []);
        }

        // 加载环境配置
        const environmentsResponse = await youtuAgentService.getAvailableEnvironments();
        if (environmentsResponse.success) {
          setAvailableEnvironments(environmentsResponse.data || []);
        }

        // 加载Agent类型配置
        const typesResponse = await youtuAgentService.getAgentTypes();
        if (typesResponse.success) {
          setAgentTypes(typesResponse.data || []);
        }

        // 加载动态模板
        const templatesResponse = await youtuAgentService.getDynamicTemplates();
        if (templatesResponse.success) {
          setDynamicTemplates(templatesResponse.data || []);
        }
      } catch (error) {
        console.error('Failed to load dynamic config:', error);
        // 使用fallback数据
        setAvailableTools(youtuAgentService.getSupportedTools());
        setAvailableEnvironments(youtuAgentService.getSupportedEnvironments());
        setAgentTypes([
          { id: 'SimpleAgent', name: 'SimpleAgent', displayName: '简单Agent', description: '基于ReAct模式的单步推理Agent', features: ['快速响应', '直接执行', '适合简单任务'] },
          { id: 'OrchestraAgent', name: 'OrchestraAgent', displayName: '协作Agent', description: '基于Plan-Execute模式的多步骤协作Agent', features: ['复杂规划', '多步执行', '适合复杂任务'] }
        ]);
      } finally {
        setConfigLoading(false);
      }
    };

    loadDynamicConfig();
  }, []);

  // 开始自动生成流程
  const handleStartAutoGeneration = async () => {
    if (!autoGeneration.userRequirement.trim()) {
      message.warning('请先描述你的Agent需求');
      return;
    }

    setLoading(true);
    setAutoGeneration(prev => ({ ...prev, isGenerating: true }));

    try {
      const response = await youtuAgentService.startAutoGeneration(autoGeneration.userRequirement);
      
      if (response.success && response.data) {
        setAutoGeneration(prev => ({
          ...prev,
          sessionId: response.data!.session_id,
          conversationHistory: [
            { type: 'user', content: prev.userRequirement },
            { type: 'assistant', content: response.data!.initial_response }
          ],
          currentQuestion: response.data!.initial_response,
          isGenerating: false
        }));

        // 跳转到第一步显示对话界面
        setCurrentStep(1);
        message.success('Meta-Agent已启动，正在与您对话确认需求');
      } else {
        throw new Error(response.message || '启动自动生成失败');
      }
    } catch (error: any) {
      message.error(`启动自动生成失败: ${error.message || '请稍后重试'}`);
      console.error('Auto generation error:', error);
      setAutoGeneration(prev => ({ ...prev, isGenerating: false }));
    } finally {
      setLoading(false);
    }
  };

  // 继续对话 - youtu-agent 4步流程处理
  const handleContinueConversation = async (userMessage: string) => {
    if (!userMessage.trim() || !autoGeneration.sessionId) return;

    setAutoGeneration(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory,
        { type: 'user', content: userMessage }
      ],
      isGenerating: true
    }));

    try {
      const response = await youtuAgentService.continueAutoGeneration({
        session_id: autoGeneration.sessionId,
        user_response: userMessage
      });

      if (response.success && response.data) {
        // 更新对话历史
        const newHistory = [
          ...autoGeneration.conversationHistory,
          { type: 'user', content: userMessage },
          { type: 'assistant', content: response.data.assistant_response || response.data.response }
        ];

        setAutoGeneration(prev => ({
          ...prev,
          conversationHistory: newHistory,
          isGenerating: false,
          isComplete: response.data.status === 'completed',
          generatedConfig: response.data.generated_config
        }));

        // 根据当前步骤更新UI
        const stepMap = {
          'step1_requirements_clarification': 1,
          'step2_tools_selection': 2,
          'step3_instructions_generation': 3,
          'step4_name_generation': 4,
          'completed': 4
        };

        const newStep = stepMap[response.data.status] || currentStep;
        if (newStep !== currentStep) {
          setCurrentStep(newStep);
        }

        // 后端现在会自动处理步骤推进，不需要前端再次发送请求

        if (response.data.status === 'completed') {
          message.success('Agent配置生成完成！所有4个步骤已完成');
        }
      } else {
        throw new Error(response.message || '对话继续失败');
      }

    } catch (error: any) {
      message.error(`对话继续失败: ${error.message || '请重试'}`);
      console.error('Conversation error:', error);
      setAutoGeneration(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // 显示模板详情
  const showTemplateDetail = (template: any) => {
    setCurrentTemplateDetail(template);
    setTemplateDetailVisible(true);
  };

  // 基于模板创建
  const handleTemplateCreation = async () => {
    if (!selectedTemplate) {
      message.warning('请先选择一个模板');
      return;
    }

    const template = AGENT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    setLoading(true);
    try {
      const config: CreateAgentConfigParams = {
        name: `${template.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        display_name: template.name,
        description: template.description,
        agent_type: template.config.agent_type,
        instructions: template.config.instructions,
        model_config: manualConfig.model_config!,
        tools: template.config.tools,
        environments: template.config.environments
      };

      const response = await youtuAgentService.createAgentConfig(config);
      
      if (response.success) {
        message.success('Agent创建成功！');
        setSelectedTemplate(''); // 重置选择
      } else {
        message.error('Agent创建失败：' + response.message);
      }
    } catch (error) {
      message.error('创建过程中出现错误');
      console.error('Template creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 手动创建
  const handleManualCreation = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const config: CreateAgentConfigParams = {
        ...values,
        model_config: manualConfig.model_config!,
        instructions: values.instructions.split('\n').filter((line: string) => line.trim())
      };

      const response = await youtuAgentService.createAgentConfig(config);
      
      if (response.success) {
        message.success('Agent创建成功！');
        form.resetFields();
      } else {
        message.error('Agent创建失败：' + response.message);
      }
    } catch (error) {
      console.error('Manual creation error:', error);
    } finally {
      setLoading(false);
    }
  };


  // 自动生成界面
  const renderAutoGeneration = () => (
    <div className={styles.tabContent}>
      <div className={styles.stepsHeader}>
        <Steps current={currentStep} size="small">
          <Step title="需求澄清" />
          <Step title="工具选择" />
          <Step title="指令生成" />
          <Step title="名称生成" />
        </Steps>
      </div>

      <div className={styles.contentArea}>
        {currentStep === 0 && (
          <div className={styles.stepSection}>
            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, marginBottom: '24px' }}>
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '16px', 
                    background: currentStep === 0 ? '#e6f7ff' : 
                               currentStep === 1 ? '#fff2e6' : 
                               currentStep === 2 ? '#f0f9e6' : 
                               currentStep === 3 ? '#e6f2ff' : '#f6ffed', 
                    border: `1px solid ${currentStep === 0 ? '#91d5ff' : 
                                        currentStep === 1 ? '#ffd591' : 
                                        currentStep === 2 ? '#b7eb8f' : 
                                        currentStep === 3 ? '#91caff' : '#b7eb8f'}`, 
                    borderRadius: '6px' 
                  }}>
                    <Title level={5} style={{ 
                      margin: 0, 
                      color: currentStep === 0 ? '#096dd9' : 
                             currentStep === 1 ? '#d46b08' : 
                             currentStep === 2 ? '#389e0d' : 
                             currentStep === 3 ? '#0958d9' : '#389e0d' 
                    }}>
                      {currentStep === 0 && "第一步：需求澄清"}
                      {currentStep === 1 && "第一步：需求澄清进行中"}
                      {currentStep === 2 && "第二步：工具选择"}
                      {currentStep === 3 && "第三步：指令生成"}
                      {currentStep === 4 && "第四步：配置完成"}
                    </Title>
                    <Text style={{ 
                      color: currentStep === 0 ? '#0050b3' : 
                             currentStep === 1 ? '#ad4e00' : 
                             currentStep === 2 ? '#237804' : 
                             currentStep === 3 ? '#003a8c' : '#237804', 
                      fontSize: '14px' 
                    }}>
                      {currentStep === 0 && "NextAgent将与您交互对话，确认Agent的详细功能需求和使用场景"}
                      {currentStep === 1 && "NextAgent正在与您交互确认详细需求"}
                      {currentStep === 2 && "系统正在从可用工具包中智能选择最适合的工具组合"}
                      {currentStep === 3 && "基于确认的需求和选定的工具自动生成Agent执行指令"}
                      {currentStep === 4 && "为Agent生成合适的名称，所有配置步骤已完成"}
                    </Text>
                  </div>
                  <ModernTextInput
                    value={autoGeneration.userRequirement}
                    onChange={(value) => setAutoGeneration(prev => ({ ...prev, userRequirement: value }))}
                    onSend={() => {
                      if (!autoGeneration.userRequirement.trim()) {
                        message.warning('请先描述您的Agent需求');
                        return;
                      }
                      handleStartAutoGeneration();
                    }}
                    placeholder="简要描述您想要创建的Agent..."
                    loading={loading}
                    disabled={loading}
                    maxHeight={240}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
          <div className={styles.stepSection}>
            <Card>

              <div className={styles.conversationArea}>
                {autoGeneration.conversationHistory.map((msg, index) => (
                  <div key={index} className={`${styles.conversationMessage} ${msg.type}`}>
                    <div className={`${styles.messageAvatar} ${msg.type}`}>
                      {msg.type === 'user' ? <UserOutlined /> : <CustomerServiceOutlined />}
                    </div>
                    <div className={`${styles.messageBubble} ${msg.type}`}>
                      {renderMessageContent(msg.content, msg.type)}
                    </div>
                  </div>
                ))}
                {autoGeneration.isGenerating && (
                  <div className={styles.loadingMessage}>
                    <Spin size="small" />
                    <Text type="secondary">
                      {currentStep === 1 && "NextAgent正在分析您的需求..."}
                      {currentStep === 2 && "正在智能选择工具..."}
                      {currentStep === 3 && "正在生成执行指令..."}
                    </Text>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {!autoGeneration.isComplete && currentStep === 1 && (
                <div className={styles.chatInput}>
                  <Input.Search
                    placeholder="请详细回答NextAgent的问题..."
                    enterButton="发送回答"
                    size="large"
                    onSearch={handleContinueConversation}
                    disabled={autoGeneration.isGenerating}
                  />
                </div>
              )}

              {(currentStep === 2 || currentStep === 3) && !autoGeneration.isComplete && (
                <div className={styles.actionCenter}>
                  <Alert
                    type="info"
                    message={`步骤${currentStep}进行中`}
                    description={
                      currentStep === 2 ? "系统正在自动选择最适合的工具组合..." :
                      "系统正在根据需求和工具生成详细的执行指令..."
                    }
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Spin size="large" />
                </div>
              )}

              {autoGeneration.isComplete && (
                <div className={styles.actionCenter}>
                  <Alert
                    type="success"
                    message="配置流程完成"
                    description="所有步骤已完成"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => setCurrentStep(4)}
                  >
                    查看最终配置
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {currentStep === 4 && autoGeneration.generatedConfig && (
          <div className={styles.stepSection}>
            <Alert
              type="success"
              message="Agent配置生成完成"
              description="所有配置步骤已完成，请检查最终配置"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Row gutter={24}>
              <Col span={12}>
                <Card title="基础信息" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="名称">{autoGeneration.generatedConfig.name}</Descriptions.Item>
                    <Descriptions.Item label="显示名称">{autoGeneration.generatedConfig.display_name}</Descriptions.Item>
                    <Descriptions.Item label="类型">{autoGeneration.generatedConfig.agent_type}</Descriptions.Item>
                    <Descriptions.Item label="描述">{autoGeneration.generatedConfig.description}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="能力配置" size="small">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>工具集：</Text>
                    <br />
                    {autoGeneration.generatedConfig.tools && typeof autoGeneration.generatedConfig.tools === 'object' ? 
                      Object.keys(autoGeneration.generatedConfig.tools).map((toolCategory: string) => (
                        <div key={toolCategory} style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '12px' }}>{toolCategory}:</Text>
                          {' '}
                          {(autoGeneration.generatedConfig.tools[toolCategory] as string[])?.map((tool: string) => (
                            <Text key={tool} code style={{ marginRight: 4, fontSize: '11px' }}>{tool}</Text>
                          ))}
                        </div>
                      )) : 
                      Array.isArray(autoGeneration.generatedConfig.tools) ? 
                        autoGeneration.generatedConfig.tools.map((tool: string) => (
                          <Text key={tool} code style={{ marginRight: 8 }}>{tool}</Text>
                        )) : 
                        <Text type="secondary">暂无工具配置</Text>
                    }
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>执行环境：</Text>
                    <br />
                    {autoGeneration.generatedConfig.environments?.map((env: string) => (
                      <Text key={env} code style={{ marginRight: 8 }}>{env}</Text>
                    ))}
                  </div>
                  <div>
                    <Text strong>指令集：</Text>
                    <ul style={{ marginTop: 8 }}>
                      {autoGeneration.generatedConfig.instructions?.map((instruction: string, index: number) => (
                        <li key={index}>
                          <Text type="secondary">{instruction}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </Col>
            </Row>

            <div className={styles.actionBar}>
              <Button 
                size="large" 
                onClick={() => {
                  setCurrentStep(1);
                  setAutoGeneration(prev => ({ ...prev, isComplete: false }));
                }}
              >
                返回修改
              </Button>
              <Button 
                type="primary" 
                size="large"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await youtuAgentService.createAgentConfig(autoGeneration.generatedConfig);
                    if (response.success) {
                      message.success('Agent创建成功！');
                      setCurrentStep(3);
                    } else {
                      message.error('创建失败：' + response.message);
                    }
                  } catch (error) {
                    message.error('创建过程中出现错误');
                    console.error('Create error:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                创建Agent
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.stepSection}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>
                <CheckCircleOutlined />
              </div>
              <Title level={3}>Agent创建成功</Title>
              <Text type="secondary">你的Agent已成功创建并保存，现在可以开始使用了</Text>
              
              <div className={styles.actionCenter} style={{ marginTop: 32 }}>
                <Space size="large">
                  <Button 
                    size="large"
                    onClick={() => {
                      setCurrentStep(0);
                      setAutoGeneration({
                        sessionId: '',
                        userRequirement: '',
                        conversationHistory: [],
                        currentQuestion: '',
                        generatedConfig: null,
                        isGenerating: false,
                        isComplete: false
                      });
                    }}
                  >
                    创建新Agent
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => window.location.href = '/app/agent-management'}
                  >
                    查看我的Agent
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );

  // 模板创建界面
  const renderTemplateCreation = () => {
    // 使用动态模板，如果没有则使用静态模板作为fallback
    const templates = dynamicTemplates.length > 0 ? dynamicTemplates : AGENT_TEMPLATES;
    
    return (
      <div className={styles.tabContent}>
        <div className={styles.contentArea}>
          {configLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>加载模板配置中...</div>
            </div>
          )}
          
          <div className={styles.templateGrid}>
          {templates.map(template => (
          <Card
            key={template.id}
            className={`${styles.templateCard} ${selectedTemplate === template.id ? styles.selected : ''}`}
            data-category={template.category}
            hoverable
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className={styles.templateHeader}>
              <div className={styles.templateIcon}>
                <ToolOutlined />
              </div>
              <div>
                <div className={styles.templateTitle}>{template.name}</div>
              </div>
            </div>
            
            <div className={styles.templateDescription}>
              {template.description}
            </div>
            
            <div className={styles.templateTags}>
              <span className={styles.categoryTag}>{template.category}</span>
              <span className={styles.typeTag}>{template.config.agent_type}</span>
            </div>

            <div className={styles.templateMeta}>
              <div>
                {template.config.tools.length} 工具 • {template.config.environments.length} 环境
              </div>
              <div className={styles.templateActions}>
                <div 
                  className={styles.templateViewBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    showTemplateDetail(template);
                  }}
                >
                  <EyeOutlined /> 详情
                </div>
                {selectedTemplate === template.id && (
                  <div className={styles.templateSelectBtn}>
                    <CheckCircleOutlined /> 已选择
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.actionCenter} style={{ marginTop: 32 }}>
        <Button 
          type="primary" 
          size="large"
          icon={<RobotOutlined />}
          onClick={handleTemplateCreation}
          loading={loading}
          disabled={!selectedTemplate}
        >
          基于模板创建Agent
        </Button>
      </div>

      {/* 模板详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.templateIcon} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
              <ToolOutlined />
            </div>
            <span>模板详情</span>
          </div>
        }
        open={templateDetailVisible}
        onCancel={() => setTemplateDetailVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTemplateDetailVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="select" 
            type="primary" 
            onClick={() => {
              if (currentTemplateDetail) {
                setSelectedTemplate(currentTemplateDetail.id);
                setTemplateDetailVisible(false);
                message.success('已选择模板: ' + currentTemplateDetail.name);
              }
            }}
          >
            选择此模板
          </Button>
        ]}
        width={600}
        className={styles.templateDetailModal}
      >
        {currentTemplateDetail && (
          <div>
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" title="基础信息">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="名称">{currentTemplateDetail.name}</Descriptions.Item>
                    <Descriptions.Item label="类别">{currentTemplateDetail.category}</Descriptions.Item>
                    <Descriptions.Item label="类型">{currentTemplateDetail.config.agent_type}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="功能描述">
                  <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {currentTemplateDetail.description}
                  </Text>
                </Card>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Card size="small" title="工具集">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentTemplateDetail.config.tools.map((tool: string) => (
                      <Text key={tool} code style={{ fontSize: '12px' }}>{tool}</Text>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="执行环境">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentTemplateDetail.config.environments.map((env: string) => (
                      <Text key={env} code style={{ fontSize: '12px' }}>{env}</Text>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="指令集" style={{ marginTop: 16 }}>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                {currentTemplateDetail.config.instructions.map((instruction: string, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>{instruction}</Text>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Modal>
          </div>
        </div>
    );
  };

  // 手动配置界面
  const renderManualConfiguration = () => (
    <div className={styles.tabContent}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleManualCreation}
        initialValues={manualConfig}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title="基础配置" size="small">
              <Form.Item
                name="name"
                label="Agent名称"
                rules={[{ required: true, message: '请输入Agent名称' }]}
              >
                <Input placeholder="例如: data_analysis_agent" />
              </Form.Item>

              <Form.Item
                name="display_name"
                label="显示名称"
                rules={[{ required: true, message: '请输入显示名称' }]}
              >
                <Input placeholder="例如: 数据分析助手" />
              </Form.Item>

              <Form.Item
                name="agent_type"
                label="Agent类型"
                rules={[{ required: true, message: '请选择Agent类型' }]}
              >
                <Select loading={configLoading}>
                  {agentTypes.map(type => (
                    <Select.Option key={type.id} value={type.id}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{type.displayName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{type.description}</div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="功能描述"
                rules={[{ required: true, message: '请输入功能描述' }]}
              >
                <TextArea rows={3} placeholder="描述Agent的主要功能和用途..." />
              </Form.Item>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="能力配置" size="small">
              <Form.Item
                name="instructions"
                label="指令集"
                rules={[{ required: true, message: '请输入至少一条指令' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="每行一条指令，例如：&#10;你是一个专业的数据分析师&#10;善于分析和整理信息&#10;保持客观和准确"
                />
              </Form.Item>

              <Form.Item
                name="tools"
                label="工具集"
              >
                <Select
                  mode="multiple"
                  placeholder="选择Agent可使用的工具"
                  loading={configLoading}
                >
                  {availableTools.map(tool => (
                    <Select.Option key={tool.id} value={tool.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{tool.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{tool.description}</div>
                        </div>
                        <Text code style={{ fontSize: '10px' }}>{tool.category}</Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="environments"
                label="执行环境"
              >
                <Select
                  mode="multiple"
                  placeholder="选择Agent的执行环境"
                  loading={configLoading}
                >
                  {availableEnvironments.map(env => (
                    <Select.Option key={env.id} value={env.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{env.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{env.description}</div>
                        </div>
                        <Text code style={{ fontSize: '10px' }}>{env.type}</Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Card title="模型配置" size="small" style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="模型提供商">
                <Select 
                  value={manualConfig.model_config?.provider}
                  onChange={(value) => setManualConfig(prev => ({
                    ...prev,
                    model_config: { ...prev.model_config!, provider: value }
                  }))}
                >
                  <Select.Option value="one_api">One API</Select.Option>
                  <Select.Option value="alibaba">阿里云DashScope</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="模型ID">
                <Select 
                  value={manualConfig.model_config?.model_id}
                  onChange={(value) => setManualConfig(prev => ({
                    ...prev,
                    model_config: { ...prev.model_config!, model_id: value }
                  }))}
                >
                  <Select.Option value="Qwen/Qwen3-30B-A3B-Thinking-2507">Qwen3-30B-Thinking</Select.Option>
                  <Select.Option value="gpt-4">GPT-4</Select.Option>
                  <Select.Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最大Token数">
                <Input 
                  type="number"
                  value={manualConfig.model_config?.max_tokens}
                  onChange={(e) => setManualConfig(prev => ({
                    ...prev,
                    model_config: { ...prev.model_config!, max_tokens: parseInt(e.target.value) || 4096 }
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={`温度参数: ${manualConfig.model_config?.temperature}`}>
                <Slider
                  min={0}
                  max={2}
                  step={0.1}
                  value={manualConfig.model_config?.temperature}
                  onChange={(value) => setManualConfig(prev => ({
                    ...prev,
                    model_config: { ...prev.model_config!, temperature: value }
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={`Top-P: ${manualConfig.model_config?.top_p}`}>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={manualConfig.model_config?.top_p}
                  onChange={(value) => setManualConfig(prev => ({
                    ...prev,
                    model_config: { ...prev.model_config!, top_p: value }
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className={styles.actionCenter} style={{ marginTop: 32 }}>
          <Space size="large">
            <Button 
              size="large"
              onClick={() => form.resetFields()}
            >
              重置
            </Button>
            <Button 
              type="primary" 
              size="large" 
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              创建Agent
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );

  // Tab配置 - 使用TabDock
  const tabItems = [
    {
      id: 'auto',
      icon: <BulbOutlined className="w-6 h-6" />,
      label: '智能生成',
      onClick: () => setCreationMode('auto')
    },
    {
      id: 'template',
      icon: <FileTextOutlined className="w-6 h-6" />,
      label: '模板创建',
      onClick: () => setCreationMode('template')
    },
    {
      id: 'manual',
      icon: <SettingOutlined className="w-6 h-6" />,
      label: '手动配置',
      onClick: () => setCreationMode('manual')
    }
  ];

  // 渲染当前选中的内容
  const renderActiveContent = () => {
    switch (creationMode) {
      case 'auto':
        return renderAutoGeneration();
      case 'template':
        return renderTemplateCreation();
      case 'manual':
        return renderManualConfiguration();
      default:
        return renderAutoGeneration();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layoutWrapper}>
        {/* 左侧导航栏 */}
        <div className={styles.sidebarContainer}>
          <TabDock
            items={tabItems}
            activeId={creationMode}
            onTabChange={(id) => setCreationMode(id as CreationMode)}
          />
          
          {/* 说明信息卡片组 - 循环显示 */}
          <div className={styles.infoCardsContainer}>
            <CyclingInfoCards items={INFO_ITEMS} />
          </div>
        </div>
        
        {/* 右侧内容区域 */}
        <div className={styles.mainContent}>
          <div className={styles.contentCard}>
            {renderActiveContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCreatorPage;