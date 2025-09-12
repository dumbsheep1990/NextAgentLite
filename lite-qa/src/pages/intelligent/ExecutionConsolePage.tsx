import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Row, Col, Button, Table, Space, Tag, Modal, Drawer, 
  Typography, Progress, Statistic, Alert, Input, Slider, Switch,
  Select, Tabs, Timeline, message, Badge, Tooltip, Divider
} from 'antd';
import {
  PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, BugOutlined,
  SettingOutlined, EyeOutlined, DeleteOutlined, PlusOutlined,
  RobotOutlined, BulbOutlined, ThunderboltOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ApiOutlined, MessageOutlined,
  BarChartOutlined, CodeOutlined, SendOutlined
} from '@ant-design/icons';
import { Line, Area } from '@ant-design/plots';
import styles from './ExecutionConsole.module.css';
import { unifiedAgentService } from '../../services/unifiedAgentService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 数据类型定义
interface AgentInstance {
  id: string;
  name: string;
  displayName: string;
  type: 'SimpleAgent' | 'OrchestraAgent';
  status: 'running' | 'idle' | 'error' | 'stopped';
  currentTask?: string;
  performance: {
    qps: number;
    avgResponseTime: number;
    successRate: number;
  };
  resources: {
    cpu: number;
    memory: number;
    concurrent: number;
  };
  config: {
    temperature: number;
    maxTokens: number;
    maxTurns: number;
    timeout: number;
  };
  createdAt: string;
  lastActivity?: string;
}

interface ExecutionStep {
  id: string;
  type: 'reasoning' | 'tool_call' | 'planning' | 'execution' | 'reporting';
  status: 'pending' | 'running' | 'completed' | 'error';
  title: string;
  input?: string;
  output?: string;
  duration?: number;
  toolUsed?: string;
  startTime: Date;
  endTime?: Date;
}

interface ExecutionFlow {
  taskId: string;
  agentId: string;
  agentType: 'SimpleAgent' | 'OrchestraAgent';
  query: string;
  status: 'running' | 'completed' | 'error';
  steps: ExecutionStep[];
  currentStep: number;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'tool_call';
  content: string;
  timestamp: Date;
  metadata?: {
    reasoning?: string;
    toolUsed?: string;
    executionTime?: number;
    confidence?: number;
  };
}

const ExecutionConsolePage: React.FC = () => {
  // 状态管理
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInstance | null>(null);
  const [executionFlow, setExecutionFlow] = useState<ExecutionFlow | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [parameterDrawerVisible, setParameterDrawerVisible] = useState(false);
  const [chatDrawerVisible, setChatDrawerVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  // WebSocket连接 (暂时禁用)
  // const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadAgentInstances();
    initializeWebSocket();
    
    // return () => {
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //   }
    // };
  }, []);

  const loadAgentInstances = async () => {
    setLoading(true);
    try {
      // 调用真实API获取智能体实例
      const agentsData = await unifiedAgentService.listAgents({ status: 'active' });
      
      const formattedAgents: AgentInstance[] = agentsData.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        displayName: agent.displayName,
        type: agent.type === 'simple' ? 'SimpleAgent' : 'OrchestraAgent',
        status: agent.status === 'active' ? 'running' : 'idle',
        currentTask: agent.currentTask || '',
        performance: agent.performanceStats || {
          qps: 0,
          avgResponseTime: 0,
          successRate: 0
        },
        resources: {
          cpu: 0,
          memory: 0,
          concurrent: 0
        },
        config: {
          temperature: agent.config?.model?.temperature || 0.7,
          maxTokens: agent.config?.model?.maxTokens || 2000,
          maxTurns: 10,
          timeout: 30000
        },
        createdAt: agent.createdAt,
        lastActivity: agent.updatedAt
      }));
      
      setAgents(formattedAgents);
      if (formattedAgents.length > 0) {
        setSelectedAgent(formattedAgents[0]);
        loadExecutionFlow(formattedAgents[0].id);
      }
    } catch (error) {
      console.error('加载智能体实例失败:', error);
      message.error('加载智能体实例失败');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionFlow = async (agentId: string) => {
    try {
      // 调用真实API获取执行流程数据
      const executionsData = await unifiedAgentService.getAgentExecutions(agentId, { limit: 1 });
      if (executionsData.length === 0) {
        setExecutionFlow(null);
        return;
      }
      
      const execution = executionsData[0];
      const flow: ExecutionFlow = {
        taskId: execution.id,
        agentId,
        agentType: agents.find(a => a.id === agentId)?.type || 'SimpleAgent',
        query: execution.query || '',
        status: execution.status === 'running' ? 'running' : execution.status === 'completed' ? 'completed' : 'failed',
        steps: [], // 实际步骤数据需要从执行详情API获取
        currentStep: 0,
        startTime: new Date(execution.startedAt)
      };
      
      setExecutionFlow(flow);
    } catch (error) {
      console.error('加载执行流程失败:', error);
      setExecutionFlow(null);
    }
  };

  const initializeWebSocket = () => {
    // 模拟WebSocket连接
    // socketRef.current = io('ws://localhost:8000');
    
    // 模拟实时数据更新
    const interval = setInterval(() => {
      setPerformanceData(prev => [
        ...prev.slice(-20),
        {
          time: new Date().toLocaleTimeString(),
          qps: Math.random() * 20 + 5,
          responseTime: Math.random() * 1000 + 500,
          successRate: Math.random() * 10 + 90
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  };

  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      // 调用后端API
      message.success(`智能体${action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启'}成功`);
      loadAgentInstances();
    } catch (error) {
      message.error(`操作失败: ${error}`);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // 模拟智能体回复
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'agent',
        content: '我正在分析您的问题，请稍等...',
        timestamp: new Date(),
        metadata: {
          reasoning: '分析用户查询意图',
          executionTime: 1200,
          confidence: 0.85
        }
      };
      setChatMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  const getAgentTypeConfig = (type: string) => {
    const configs = {
      SimpleAgent: {
        name: '单体智能体',
        icon: <RobotOutlined />,
        color: '#1890ff'
      },
      OrchestraAgent: {
        name: '编排智能体',
        icon: <BulbOutlined />,
        color: '#fa8c16'
      }
    };
    return configs[type as keyof typeof configs] || configs.SimpleAgent;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      running: { color: '#52c41a', text: '运行中' },
      idle: { color: '#faad14', text: '空闲' },
      error: { color: '#ff4d4f', text: '错误' },
      stopped: { color: '#d9d9d9', text: '已停止' }
    };
    return configs[status as keyof typeof configs] || configs.stopped;
  };

  const getStepIcon = (type: string, status: string) => {
    const icons = {
      reasoning: <BulbOutlined />,
      tool_call: <ApiOutlined />,
      planning: <SettingOutlined />,
      execution: <ThunderboltOutlined />,
      reporting: <BarChartOutlined />
    };
    
    const colors = {
      completed: '#52c41a',
      running: '#1890ff',
      error: '#ff4d4f',
      pending: '#d9d9d9'
    };

    return (
      <div 
        className={styles.stepIcon} 
        style={{ color: colors[status as keyof typeof colors] }}
      >
        {icons[type as keyof typeof icons] || <CodeOutlined />}
      </div>
    );
  };

  // 性能图表配置
  const performanceConfig = {
    data: performanceData,
    xField: 'time',
    yField: 'qps',
    smooth: true,
    color: '#1890ff',
    height: 200,
    point: { size: 3 }
  };

  const agentColumns = [
    {
      title: '智能体',
      key: 'agent',
      render: (_, record: AgentInstance) => {
        const typeConfig = getAgentTypeConfig(record.type);
        const statusConfig = getStatusConfig(record.status);
        
        return (
          <div className={styles.agentCell}>
            <div className={styles.agentHeader}>
              <span className={styles.agentIcon} style={{ color: typeConfig.color }}>
                {typeConfig.icon}
              </span>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{record.displayName}</div>
                <Text type="secondary" className={styles.agentType}>
                  {typeConfig.name}
                </Text>
              </div>
              <Badge color={statusConfig.color} text={statusConfig.text} />
            </div>
            {record.currentTask && (
              <div className={styles.currentTask}>
                <Text type="secondary" ellipsis>
                  {record.currentTask}
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '性能指标',
      key: 'performance',
      render: (_, record: AgentInstance) => (
        <div className={styles.performanceCell}>
          <div className={styles.performanceItem}>
            <Text type="secondary">QPS</Text>
            <Text strong>{record.performance.qps.toFixed(1)}</Text>
          </div>
          <div className={styles.performanceItem}>
            <Text type="secondary">响应时间</Text>
            <Text strong>{record.performance.avgResponseTime}ms</Text>
          </div>
          <div className={styles.performanceItem}>
            <Text type="secondary">成功率</Text>
            <Text strong style={{ color: record.performance.successRate > 90 ? '#52c41a' : '#faad14' }}>
              {record.performance.successRate.toFixed(1)}%
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '资源使用',
      key: 'resources',
      render: (_, record: AgentInstance) => (
        <div className={styles.resourceCell}>
          <div className={styles.resourceItem}>
            <Text type="secondary">CPU</Text>
            <Progress 
              percent={record.resources.cpu} 
              size="small" 
              strokeColor={record.resources.cpu > 80 ? '#ff4d4f' : '#52c41a'}
              showInfo={false}
            />
            <Text className={styles.resourceValue}>{record.resources.cpu}%</Text>
          </div>
          <div className={styles.resourceItem}>
            <Text type="secondary">内存</Text>
            <Progress 
              percent={record.resources.memory} 
              size="small" 
              strokeColor={record.resources.memory > 80 ? '#ff4d4f' : '#52c41a'}
              showInfo={false}
            />
            <Text className={styles.resourceValue}>{record.resources.memory}%</Text>
          </div>
          <div className={styles.resourceItem}>
            <Text type="secondary">并发</Text>
            <Text strong>{record.resources.concurrent}</Text>
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: AgentInstance) => (
        <Space>
          <Tooltip title={record.status === 'running' ? '暂停' : '启动'}>
            <Button
              type="text"
              icon={record.status === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleAgentAction(record.id, record.status === 'running' ? 'stop' : 'start')}
            />
          </Tooltip>
          <Tooltip title="重启">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => handleAgentAction(record.id, 'restart')}
            />
          </Tooltip>
          <Tooltip title="调试">
            <Button
              type="text"
              icon={<BugOutlined />}
              onClick={() => {
                setSelectedAgent(record);
                setChatDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="参数">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => {
                setSelectedAgent(record);
                setParameterDrawerVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Title level={2} className={styles.pageTitle}>
            执行控制台
          </Title>
          <Paragraph className={styles.pageDescription}>
            实时监控和控制智能体执行，支持交互式调试和参数调优，提供完整的执行流程可视化。
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={() => message.info('创建新实例功能开发中')}
        >
          创建实例
        </Button>
      </div>

      {/* 状态概览 */}
      <Row gutter={24} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="活跃实例"
              value={agents.filter(a => a.status === 'running').length}
              suffix={`/ ${agents.length}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="执行中任务"
              value={agents.filter(a => a.currentTask).length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="平均QPS"
              value={agents.length > 0 
                ? agents.reduce((sum, a) => sum + a.performance.qps, 0) / agents.length
                : 0
              }
              precision={1}
              valueStyle={{ color: '#faad14' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="系统状态"
              value="正常"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Row gutter={24}>
        {/* 左侧：智能体列表 */}
        <Col xs={24} lg={14}>
          <Card 
            title="智能体实例"
            className={styles.agentListCard}
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadAgentInstances}>
                刷新
              </Button>
            }
          >
            <Table
              columns={agentColumns}
              dataSource={agents}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedAgent ? [selectedAgent.id] : [],
                onSelect: (record) => {
                  setSelectedAgent(record);
                  loadExecutionFlow(record.id);
                }
              }}
            />
          </Card>
        </Col>

        {/* 右侧：执行详情 */}
        <Col xs={24} lg={10}>
          <Card 
            title="执行详情"
            className={styles.executionCard}
            extra={
              selectedAgent && (
                <Space>
                  <Button 
                    icon={<MessageOutlined />}
                    onClick={() => setChatDrawerVisible(true)}
                  >
                    对话调试
                  </Button>
                  <Button 
                    icon={<SettingOutlined />}
                    onClick={() => setParameterDrawerVisible(true)}
                  >
                    参数调节
                  </Button>
                </Space>
              )
            }
          >
            {selectedAgent ? (
              <div className={styles.executionDetail}>
                {/* 当前任务信息 */}
                <div className={styles.taskInfo}>
                  <Title level={5}>当前任务</Title>
                  <Text>{selectedAgent.currentTask || '无活动任务'}</Text>
                </div>

                <Divider />

                {/* 执行流程 */}
                {executionFlow && (
                  <div className={styles.executionFlow}>
                    <Title level={5}>执行流程</Title>
                    <Timeline className={styles.executionTimeline}>
                      {executionFlow.steps.map((step, index) => (
                        <Timeline.Item
                          key={step.id}
                          dot={getStepIcon(step.type, step.status)}
                          color={step.status === 'completed' ? 'green' : 
                                 step.status === 'running' ? 'blue' : 
                                 step.status === 'error' ? 'red' : 'gray'}
                        >
                          <div className={styles.stepContent}>
                            <div className={styles.stepHeader}>
                              <Text strong>{step.title}</Text>
                              {step.duration && (
                                <Text type="secondary" className={styles.stepDuration}>
                                  {step.duration}ms
                                </Text>
                              )}
                            </div>
                            {step.toolUsed && (
                              <Tag size="small" color="blue">{step.toolUsed}</Tag>
                            )}
                            {step.output && (
                              <Text type="secondary" className={styles.stepOutput}>
                                {step.output}
                              </Text>
                            )}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                )}

                <Divider />

                {/* 性能图表 */}
                <div className={styles.performanceChart}>
                  <Title level={5}>实时性能</Title>
                  {performanceData.length > 0 && (
                    <Line {...performanceConfig} />
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noSelection}>
                <Text type="secondary">请选择一个智能体实例查看执行详情</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 参数调节抽屉 */}
      <Drawer
        title="参数调节"
        placement="right"
        width={400}
        open={parameterDrawerVisible}
        onClose={() => setParameterDrawerVisible(false)}
      >
        {selectedAgent && (
          <div className={styles.parameterPanel}>
            <div className={styles.parameterSection}>
              <Title level={5}>模型参数</Title>
              
              <div className={styles.parameterItem}>
                <Text>创造性 (Temperature)</Text>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={selectedAgent.config.temperature}
                  marks={{ 0: '保守', 0.5: '均衡', 1: '创新' }}
                />
              </div>

              <div className={styles.parameterItem}>
                <Text>最大输出 (Max Tokens)</Text>
                <Select 
                  value={selectedAgent.config.maxTokens}
                  style={{ width: '100%' }}
                >
                  <Select.Option value={1000}>短回复 (1K)</Select.Option>
                  <Select.Option value={2000}>标准 (2K)</Select.Option>
                  <Select.Option value={4000}>详细 (4K)</Select.Option>
                  <Select.Option value={8000}>长文档 (8K)</Select.Option>
                </Select>
              </div>
            </div>

            <Divider />

            <div className={styles.parameterSection}>
              <Title level={5}>执行参数</Title>
              
              <div className={styles.parameterItem}>
                <Text>最大轮次</Text>
                <Slider
                  min={1}
                  max={50}
                  value={selectedAgent.config.maxTurns}
                  marks={{ 1: '1', 25: '25', 50: '50' }}
                />
              </div>

              <div className={styles.parameterItem}>
                <Text>超时时间 (秒)</Text>
                <Select 
                  value={selectedAgent.config.timeout / 1000}
                  style={{ width: '100%' }}
                >
                  <Select.Option value={10}>快速 (10s)</Select.Option>
                  <Select.Option value={30}>标准 (30s)</Select.Option>
                  <Select.Option value={60}>详细 (60s)</Select.Option>
                  <Select.Option value={120}>深度 (120s)</Select.Option>
                </Select>
              </div>
            </div>

            <Divider />

            <div className={styles.parameterActions}>
              <Space>
                <Button onClick={() => setParameterDrawerVisible(false)}>
                  取消
                </Button>
                <Button 
                  type="primary"
                  onClick={() => {
                    message.success('参数更新成功');
                    setParameterDrawerVisible(false);
                  }}
                >
                  应用更改
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* 对话调试抽屉 */}
      <Drawer
        title="对话调试"
        placement="right"
        width={500}
        open={chatDrawerVisible}
        onClose={() => setChatDrawerVisible(false)}
      >
        {selectedAgent && (
          <div className={styles.chatPanel}>
            <div className={styles.chatMessages}>
              {chatMessages.map((message) => (
                <div key={message.id} className={`${styles.chatMessage} ${styles[message.type]}`}>
                  <div className={styles.messageContent}>
                    <Text>{message.content}</Text>
                    <Text type="secondary" className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                  {message.metadata && (
                    <div className={styles.messageMetadata}>
                      {message.metadata.reasoning && (
                        <Text type="secondary" className={styles.reasoning}>
                          推理: {message.metadata.reasoning}
                        </Text>
                      )}
                      {message.metadata.toolUsed && (
                        <Tag size="small">{message.metadata.toolUsed}</Tag>
                      )}
                      {message.metadata.executionTime && (
                        <Text type="secondary">
                          {message.metadata.executionTime}ms
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={styles.chatInput}>
              <Input.Group compact>
                <TextArea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="输入消息与智能体对话..."
                  rows={3}
                  onPressEnter={handleSendMessage}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                >
                  发送
                </Button>
              </Input.Group>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ExecutionConsolePage;
