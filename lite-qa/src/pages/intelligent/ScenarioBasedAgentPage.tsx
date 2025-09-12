/**
 * 智能任务助手页面
 * 按照使用场景和任务类型组织功能
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Card, Tabs, Button, Input, Space, Typography, 
  Alert, Badge, Spin, Divider, Tag, Tooltip, Form,
  Modal, Drawer, Progress, Timeline, Row, Col, Avatar,
  Steps, Collapse, Radio, Checkbox
} from 'antd';
import {
  QuestionCircleOutlined, SearchOutlined, FileTextOutlined,
  CodeOutlined, BranchesOutlined, MessageOutlined,
  PlayCircleOutlined, SettingOutlined, BulbOutlined,
  RobotOutlined, ThunderboltOutlined, TeamOutlined,
  EyeOutlined, EditOutlined, SaveOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Step } = Steps;

// 场景定义
interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  capabilities: string[];
  examples: string[];
  complexity: 'simple' | 'complex';
}

// 执行状态
interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  result?: string;
  timestamp?: number;
}

const ScenarioBasedAgentPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('knowledge-qa');
  const [currentQuery, setCurrentQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');

  // 场景配置
  const scenarios: ScenarioConfig[] = [
    {
      id: 'knowledge-qa',
      name: '知识问答',
      description: '基于知识库进行专业问答，适合快速获取准确信息',
      icon: <QuestionCircleOutlined />,
      color: '#1890ff',
      capabilities: ['知识库检索', '多语言翻译', '知识图谱查询', '上下文理解'],
      examples: [
        '解释某个专业概念',
        '查找相关研究文献',
        '对比不同技术方案'
      ],
      complexity: 'simple'
    },
    {
      id: 'web-research',
      name: '网络研究',
      description: '智能搜索和分析网络内容，获取最新信息和深度分析',
      icon: <SearchOutlined />,
      color: '#52c41a',
      capabilities: ['网页搜索', '内容抓取', '信息整合', '趋势分析'],
      examples: [
        '调研最新技术动态',
        '分析市场趋势报告',
        '收集竞品信息'
      ],
      complexity: 'complex'
    },
    {
      id: 'document-analysis',
      name: '文档处理',
      description: '智能分析和处理各类文档，提取关键信息',
      icon: <FileTextOutlined />,
      color: '#fa8c16',
      capabilities: ['PDF解析', '表格提取', '图像识别', '内容总结'],
      examples: [
        '分析技术文档',
        '提取表格数据',
        '生成文档摘要'
      ],
      complexity: 'simple'
    },
    {
      id: 'code-assistant',
      name: '代码辅助',
      description: '编程支持和代码分析，提供开发帮助',
      icon: <CodeOutlined />,
      color: '#722ed1',
      capabilities: ['代码生成', '错误诊断', '性能优化', '代码审查'],
      examples: [
        '生成API接口代码',
        '修复代码错误',
        '优化算法性能'
      ],
      complexity: 'simple'
    },
    {
      id: 'task-decomposition',
      name: '任务分解',
      description: '将复杂任务智能分解为可执行的步骤',
      icon: <BranchesOutlined />,
      color: '#f5222d',
      capabilities: ['任务拆解', '步骤规划', '执行监控', '结果整合'],
      examples: [
        '制定项目计划',
        '分解复杂流程',
        '设计工作方案'
      ],
      complexity: 'complex'
    },
    {
      id: 'content-creation',
      name: '内容创作',
      description: '智能内容生成和创意辅助',
      icon: <MessageOutlined />,
      color: '#13c2c2',
      capabilities: ['文案生成', '创意策划', '多媒体制作', '风格调整'],
      examples: [
        '撰写技术博客',
        '制作演示文稿',
        '生成营销文案'
      ],
      complexity: 'simple'
    }
  ];

  // 获取当前选中的场景配置
  const getCurrentScenario = () => scenarios.find(s => s.id === selectedScenario) || scenarios[0];

  // 执行任务
  const executeTask = async () => {
    if (!currentQuery.trim()) return;

    setIsExecuting(true);
    setExecutionResult('');
    setShowExecutionDetails(true);
    
    const scenario = getCurrentScenario();
    
    // 根据场景复杂度决定执行步骤
    const steps: ExecutionStep[] = [];
    
    if (scenario.complexity === 'simple') {
      // 简单场景 - 直接执行
      steps.push(
        { id: '1', title: '理解需求', description: '分析任务要求', status: 'running' },
        { id: '2', title: '执行操作', description: `使用${scenario.capabilities[0]}`, status: 'waiting' },
        { id: '3', title: '生成结果', description: '整理并输出答案', status: 'waiting' }
      );
    } else {
      // 复杂场景 - 多步骤执行  
      steps.push(
        { id: '1', title: '任务分析', description: '理解和分解复杂任务', status: 'running' },
        { id: '2', title: '制定计划', description: '规划执行步骤', status: 'waiting' },
        { id: '3', title: '执行步骤1', description: '开始第一个子任务', status: 'waiting' },
        { id: '4', title: '执行步骤2', description: '处理第二个子任务', status: 'waiting' },
        { id: '5', title: '整合结果', description: '汇总所有结果', status: 'waiting' }
      );
    }
    
    setExecutionSteps(steps);

    // 模拟执行过程
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setExecutionSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'completed' : index === i + 1 ? 'running' : step.status,
        timestamp: index === i ? Date.now() : step.timestamp
      })));
    }

    // 生成模拟结果
    const mockResults = {
      'knowledge-qa': '基于知识库检索，找到了相关的专业资料和解答...',
      'web-research': '通过网络搜索，收集到最新的行业动态和分析报告...',
      'document-analysis': '文档分析完成，提取了关键信息和数据表格...',
      'code-assistant': '代码分析完成，提供了优化建议和修复方案...',
      'task-decomposition': '任务已分解为5个可执行步骤，制定了详细执行计划...',
      'content-creation': '内容创作完成，生成了符合要求的专业文案...'
    };

    setExecutionResult(mockResults[selectedScenario] || '任务执行完成');
    setIsExecuting(false);
  };

  // 渲染场景选择卡片
  const renderScenarioCard = (scenario: ScenarioConfig) => (
    <Card
      key={scenario.id}
      hoverable
      className={selectedScenario === scenario.id ? 'selected-scenario' : ''}
      style={{
        borderColor: selectedScenario === scenario.id ? scenario.color : undefined,
        borderWidth: selectedScenario === scenario.id ? 2 : 1
      }}
      onClick={() => setSelectedScenario(scenario.id)}
    >
      <Card.Meta
        avatar={
          <Avatar 
            icon={scenario.icon} 
            style={{ backgroundColor: scenario.color }} 
            size="large"
          />
        }
        title={
          <Space>
            {scenario.name}
            <Badge 
              count={scenario.complexity === 'complex' ? '复杂' : '简单'} 
              color={scenario.complexity === 'complex' ? 'orange' : 'blue'}
            />
          </Space>
        }
        description={scenario.description}
      />
      <div style={{ marginTop: 12 }}>
        <Text strong style={{ fontSize: 12 }}>主要能力:</Text>
        <div style={{ marginTop: 4 }}>
          <Space wrap>
            {scenario.capabilities.map(cap => (
              <Tag key={cap} size="small" color={scenario.color}>{cap}</Tag>
            ))}
          </Space>
        </div>
      </div>
    </Card>
  );

  // 渲染执行面板
  const renderExecutionPanel = () => {
    const scenario = getCurrentScenario();
    
    return (
      <Card title={`${scenario.name} - 任务执行`}>
        <Form layout="vertical">
          <Form.Item label="任务描述">
            <TextArea
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder={`输入您的${scenario.name}任务...`}
              rows={4}
              disabled={isExecuting}
            />
          </Form.Item>
          
          <Form.Item label="示例任务">
            <Space direction="vertical" style={{ width: '100%' }}>
              {scenario.examples.map(example => (
                <Button 
                  key={example}
                  type="text" 
                  size="small"
                  onClick={() => setCurrentQuery(example)}
                  disabled={isExecuting}
                  style={{ textAlign: 'left', height: 'auto', padding: '4px 8px' }}
                >
                  💡 {example}
                </Button>
              ))}
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={executeTask}
                loading={isExecuting}
                disabled={!currentQuery.trim()}
              >
                开始执行
              </Button>
              
              {executionSteps.length > 0 && (
                <Button 
                  icon={<EyeOutlined />}
                  onClick={() => setShowExecutionDetails(!showExecutionDetails)}
                >
                  {showExecutionDetails ? '隐藏' : '显示'}执行详情
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        {/* 执行进度 */}
        {executionSteps.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Divider>执行进度</Divider>
            <Steps 
              current={executionSteps.findIndex(step => step.status === 'running')}
              status={isExecuting ? 'process' : 'finish'}
            >
              {executionSteps.map(step => (
                <Step 
                  key={step.id}
                  title={step.title} 
                  description={step.description}
                  icon={step.status === 'running' ? <Spin size="small" /> : undefined}
                />
              ))}
            </Steps>
          </div>
        )}

        {/* 执行结果 */}
        {executionResult && (
          <div style={{ marginTop: 24 }}>
            <Divider>执行结果</Divider>
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <Text>{executionResult}</Text>
            </Card>
          </div>
        )}

        {/* 执行详情 */}
        {showExecutionDetails && executionSteps.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Divider>详细执行日志</Divider>
            <Timeline>
              {executionSteps
                .filter(step => step.status === 'completed')
                .map(step => (
                  <Timeline.Item key={step.id} color="green">
                    <div>
                      <Text strong>{step.title}</Text>
                      <br />
                      <Text type="secondary">{step.description}</Text>
                      {step.timestamp && (
                        <Text 
                          type="secondary" 
                          style={{ fontSize: 12, marginLeft: 8 }}
                        >
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </Text>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
            </Timeline>
          </div>
        )}
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面头部 */}
          <div style={{ marginBottom: 32 }}>
            <Title level={2}>
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                智能任务助手
              </Space>
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16 }}>
              选择适合的场景，让AI助手帮您高效完成各类任务
            </Paragraph>
          </div>

          {/* 场景选择 */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4}>选择任务场景</Title>
            <Row gutter={[16, 16]}>
              {scenarios.map(scenario => (
                <Col xs={24} sm={12} lg={8} key={scenario.id}>
                  {renderScenarioCard(scenario)}
                </Col>
              ))}
            </Row>
          </div>

          {/* 执行面板 */}
          {renderExecutionPanel()}
        </div>
      </Content>
      
      <style>{`
        .selected-scenario {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
          transform: translateY(-2px);
        }
        
        .selected-scenario .ant-card-body {
          background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0.02) 100%);
        }
      `}</style>
    </Layout>
  );
};

export default ScenarioBasedAgentPage;