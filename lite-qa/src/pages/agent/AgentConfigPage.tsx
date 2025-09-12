import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Space, Tag, Modal, Form, Input, Select, 
  Row, Col, Statistic, Tooltip, message, Typography, 
  Switch, Avatar, Progress, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  RobotOutlined, ThunderboltOutlined, BrainCircleOutlined,
  ApiOutlined, ToolOutlined, EyeOutlined, BarChartOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import styles from './AgentConfig.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 数据类型定义
interface AgentConfig {
  id: string;
  name: string;
  display_name: string;
  agent_type: 'SimpleAgent' | 'OrchestraAgent';
  description: string;
  instructions: string[];
  model_config: {
    provider: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  tools: Array<{
    name: string;
    type: string;
    enabled: boolean;
  }>;
  status: 'active' | 'inactive' | 'testing';
  performance_metrics: {
    success_rate: number;
    avg_response_time: number;
    total_executions: number;
    last_execution?: string;
  };
  created_at: string;
  updated_at: string;
}

const AgentConfigPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockAgents: AgentConfig[] = [
        {
          id: 'agent_1',
          name: 'knowledge_qa_agent',
          display_name: '知识问答助手',
          agent_type: 'SimpleAgent',
          description: '专门处理知识类问题的智能助手',
          instructions: ['回答用户的知识类问题', '提供准确的信息'],
          model_config: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000
          },
          tools: [
            { name: '搜索工具', type: 'search', enabled: true },
            { name: '知识库', type: 'retrieval', enabled: true }
          ],
          status: 'active',
          performance_metrics: {
            success_rate: 95.2,
            avg_response_time: 1200,
            total_executions: 1580
          },
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T15:45:00Z'
        },
        {
          id: 'agent_2',
          name: 'code_analysis_agent',
          display_name: '代码分析专家',
          agent_type: 'OrchestraAgent',
          description: '专业的代码审查和分析助手',
          instructions: ['分析代码质量', '提供优化建议', '检测潜在问题'],
          model_config: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.3,
            max_tokens: 4000
          },
          tools: [
            { name: '代码分析器', type: 'analysis', enabled: true },
            { name: '文件读取器', type: 'file', enabled: true },
            { name: '语法检查器', type: 'syntax', enabled: true }
          ],
          status: 'active',
          performance_metrics: {
            success_rate: 88.7,
            avg_response_time: 2800,
            total_executions: 892
          },
          created_at: '2024-01-10T09:15:00Z',
          updated_at: '2024-01-22T11:20:00Z'
        }
      ];
      setAgents(mockAgents);
    } catch (error) {
      message.error('加载智能体配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
    form.setFieldsValue({
      name: agent.name,
      display_name: agent.display_name,
      description: agent.description,
      agent_type: agent.agent_type,
      instructions: agent.instructions.join('\n'),
      model_provider: agent.model_config.provider,
      model_name: agent.model_config.model,
      temperature: agent.model_config.temperature,
      max_tokens: agent.model_config.max_tokens
    });
    setModalVisible(true);
  };

  const handleSaveAgent = async (values: any) => {
    try {
      message.success(editingAgent ? '智能体更新成功' : '智能体创建成功');
      setModalVisible(false);
      loadAgents();
    } catch (error) {
      message.error('保存智能体失败');
    }
  };

  const handleToggleAgent = async (agent: AgentConfig) => {
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      message.success(`智能体已${newStatus === 'active' ? '启用' : '停用'}`);
      loadAgents();
    } catch (error) {
      message.error('切换智能体状态失败');
    }
  };

  const handleDeleteAgent = (agent: AgentConfig) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除智能体"${agent.display_name}"吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.success('智能体删除成功');
          loadAgents();
        } catch (error) {
          message.error('删除智能体失败');
        }
      }
    });
  };

  const getAgentTypeConfig = (type: string) => {
    const configs = {
      SimpleAgent: {
        name: '单体智能体',
        color: '#1890ff',
        icon: <RobotOutlined />,
        description: '独立执行任务的基础智能体'
      },
      OrchestraAgent: {
        name: '编排智能体',
        color: '#fa8c16',
        icon: <BrainCircleOutlined />,
        description: '协调多个智能体协同工作的高级智能体'
      }
    };
    return configs[type as keyof typeof configs] || configs.SimpleAgent;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { color: '#52c41a', text: '运行中' },
      inactive: { color: '#d9d9d9', text: '已停用' },
      testing: { color: '#faad14', text: '测试中' }
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  };

  const columns = [
    {
      title: '智能体信息',
      key: 'info',
      render: (_, record: AgentConfig) => {
        const typeConfig = getAgentTypeConfig(record.agent_type);
        return (
          <Space>
            <Avatar 
              size={48} 
              style={{ 
                backgroundColor: typeConfig.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {typeConfig.icon}
            </Avatar>
            <div>
              <div className={styles.agentName}>{record.display_name}</div>
              <Text type="secondary" className={styles.agentDescription}>
                {record.description}
              </Text>
              <div className={styles.agentMeta}>
                <Tag color={typeConfig.color} size="small">
                  {typeConfig.name}
                </Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.model_config.provider}/{record.model_config.model}
                </Text>
              </div>
            </div>
          </Space>
        );
      }
    },
    {
      title: '性能指标',
      key: 'performance',
      render: (_, record: AgentConfig) => {
        const metrics = record.performance_metrics;
        const successColor = metrics.success_rate >= 90 ? '#52c41a' : 
                           metrics.success_rate >= 70 ? '#faad14' : '#ff4d4f';
        return (
          <div className={styles.performanceMetrics}>
            <div className={styles.metricItem}>
              <Text type="secondary">成功率</Text>
              <div className={styles.metricValue}>
                <Progress 
                  percent={metrics.success_rate} 
                  size="small" 
                  strokeColor={successColor}
                  showInfo={false}
                  style={{ width: 60 }}
                />
                <Text strong>{metrics.success_rate.toFixed(1)}%</Text>
              </div>
            </div>
            <div className={styles.metricItem}>
              <Text type="secondary">响应时间</Text>
              <Text strong>{metrics.avg_response_time.toFixed(0)}ms</Text>
            </div>
            <div className={styles.metricItem}>
              <Text type="secondary">执行次数</Text>
              <Text strong>{metrics.total_executions}</Text>
            </div>
          </div>
        );
      }
    },
    {
      title: '工具配置',
      dataIndex: 'tools',
      key: 'tools',
      render: (tools: any[]) => (
        <div className={styles.toolsList}>
          {tools.slice(0, 3).map((tool, index) => (
            <Tag 
              key={index} 
              color={tool.enabled ? 'blue' : 'default'}
              className={styles.toolTag}
            >
              <ToolOutlined /> {tool.name}
            </Tag>
          ))}
          {tools.length > 3 && (
            <Tag color="default">+{tools.length - 3}</Tag>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: AgentConfig) => {
        const statusConfig = getStatusConfig(status);
        return (
          <div className={styles.statusColumn}>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            <Switch
              size="small"
              checked={status === 'active'}
              onChange={() => handleToggleAgent(record)}
              style={{ marginTop: 4 }}
            />
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: AgentConfig) => (
        <Space>
          <Tooltip title="编辑配置">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditAgent(record)}
            />
          </Tooltip>
          <Tooltip title="复制配置">
            <Button 
              type="text" 
              icon={<CopyOutlined />}
              onClick={() => {
                const newAgent = { ...record, name: `${record.name}_copy`, display_name: `${record.display_name} (副本)` };
                setEditingAgent(null);
                form.setFieldsValue(newAgent);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除智能体">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAgent(record)}
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
            智能体配置管理
          </Title>
          <Paragraph className={styles.pageDescription}>
            创建和管理不同类型的智能体，配置模型参数、工具集成和执行策略，监控运行状态和性能表现。
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateAgent}
        >
          新建智能体
        </Button>
      </div>

      {/* 功能说明 */}
      <Alert
        message="智能体类型说明"
        description={
          <div className={styles.featureDescription}>
            <div><strong>单体智能体：</strong>独立执行特定任务，适合简单的查询处理和专门化功能</div>
            <div><strong>编排智能体：</strong>协调多个子智能体协同工作，适合复杂的多步骤任务处理</div>
          </div>
        }
        type="info"
        showIcon
        className={styles.featureAlert}
      />

      {/* 统计概览 */}
      <Row gutter={24} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总智能体数"
              value={agents.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="运行中"
              value={agents.filter(a => a.status === 'active').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="平均成功率"
              value={agents.length > 0 
                ? agents.reduce((sum, a) => sum + a.performance_metrics.success_rate, 0) / agents.length
                : 0
              }
              precision={1}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总执行次数"
              value={agents.reduce((sum, a) => sum + a.performance_metrics.total_executions, 0)}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 智能体列表 */}
      <Card 
        title="智能体配置列表"
        className={styles.agentCard}
        extra={
          <Button icon={<BarChartOutlined />} onClick={loadAgents}>
            刷新数据
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个智能体`
          }}
        />
      </Card>

      {/* 智能体配置模态框 */}
      <Modal
        title={editingAgent ? '编辑智能体配置' : '新建智能体'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAgent}
          initialValues={{
            agent_type: 'SimpleAgent',
            temperature: 0.7,
            max_tokens: 2000,
            model_provider: 'openai',
            model_name: 'gpt-4'
          }}
        >
          {/* 基础信息 */}
          <div className={styles.formSection}>
            <Title level={5}>基础信息</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="智能体标识"
                  rules={[{ required: true, message: '请输入智能体标识' }]}
                >
                  <Input placeholder="agent_name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="display_name"
                  label="显示名称"
                  rules={[{ required: true, message: '请输入显示名称' }]}
                >
                  <Input placeholder="智能体显示名称" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="功能描述">
              <TextArea rows={3} placeholder="描述智能体的功能和用途" />
            </Form.Item>

            <Form.Item
              name="agent_type"
              label="智能体类型"
              rules={[{ required: true, message: '请选择智能体类型' }]}
            >
              <Select>
                <Select.Option value="SimpleAgent">单体智能体</Select.Option>
                <Select.Option value="OrchestraAgent">编排智能体</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* 模型配置 */}
          <div className={styles.formSection}>
            <Title level={5}>模型配置</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="model_provider"
                  label="模型提供商"
                  rules={[{ required: true, message: '请选择模型提供商' }]}
                >
                  <Select>
                    <Select.Option value="openai">OpenAI</Select.Option>
                    <Select.Option value="anthropic">Anthropic</Select.Option>
                    <Select.Option value="local">本地模型</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="model_name"
                  label="模型名称"
                  rules={[{ required: true, message: '请输入模型名称' }]}
                >
                  <Input placeholder="gpt-4" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="temperature" label="创造性">
                  <Select>
                    <Select.Option value={0.1}>保守 (0.1)</Select.Option>
                    <Select.Option value={0.3}>稳定 (0.3)</Select.Option>
                    <Select.Option value={0.7}>均衡 (0.7)</Select.Option>
                    <Select.Option value={0.9}>创新 (0.9)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="max_tokens" label="最大输出">
                  <Select>
                    <Select.Option value={1000}>短回复 (1K)</Select.Option>
                    <Select.Option value={2000}>标准 (2K)</Select.Option>
                    <Select.Option value={4000}>详细 (4K)</Select.Option>
                    <Select.Option value={8000}>长文档 (8K)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 系统指令 */}
          <div className={styles.formSection}>
            <Title level={5}>系统指令</Title>
            <Form.Item name="instructions">
              <TextArea 
                rows={4} 
                placeholder="输入智能体的系统指令，每行一条指令"
              />
            </Form.Item>
          </div>

          <div className={styles.formActions}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAgent ? '更新智能体' : '创建智能体'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AgentConfigPage;