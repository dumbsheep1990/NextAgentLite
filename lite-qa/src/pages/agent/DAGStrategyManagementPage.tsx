/**
 * DAG执行策略管理页面
 * 管理四种执行策略：直接回答、知识检索、图谱增强、多语言问答
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Tooltip,
  Statistic,
  Row,
  Col,
  Divider,
  InputNumber,
  message,
  Typography,
  Badge
} from 'antd';
import {
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  NodeIndexOutlined,
  GlobalOutlined,
  MessageOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { scenarioService } from '../../services/scenarioService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DAGExecutionStep {
  agent: string;
  action: string;
  depends_on?: string[];
}

interface DAGTemplate {
  execution_sequence: DAGExecutionStep[];
  parallel_execution: boolean;
  parallel_agents?: string[];
  timeout_seconds: number;
}

interface ExecutionStrategy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  dag_template: DAGTemplate;
  agents: string[];
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

const DAGStrategyManagementPage: React.FC = () => {
  const [strategies, setStrategies] = useState<ExecutionStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<ExecutionStrategy | null>(null);
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await scenarioService.getAllScenarios();
      setStrategies(data);
    } catch (error) {
      console.error('加载执行策略失败:', error);
      message.error('加载执行策略失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    setCurrentStrategy(null);
    form.resetFields();
    setEditModalVisible(true);
  };

  const handleEditStrategy = (strategy: ExecutionStrategy) => {
    setCurrentStrategy(strategy);
    form.setFieldsValue({
      name: strategy.name,
      display_name: strategy.display_name,
      description: strategy.description,
      parallel_execution: strategy.dag_template.parallel_execution,
      timeout_seconds: strategy.dag_template.timeout_seconds,
      status: strategy.status
    });
    setEditModalVisible(true);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      await scenarioService.deleteScenario(strategyId);
      message.success('删除成功');
      loadStrategies();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (strategyId: string, status: 'active' | 'inactive') => {
    try {
      await scenarioService.toggleScenarioStatus(strategyId, status);
      message.success('状态更新成功');
      loadStrategies();
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败');
    }
  };

  const handleTestStrategy = (strategy: ExecutionStrategy) => {
    setCurrentStrategy(strategy);
    testForm.resetFields();
    setTestModalVisible(true);
  };

  const executeTest = async () => {
    try {
      const values = testForm.getFieldsValue();
      if (!currentStrategy || !values.testQuery) {
        message.warning('请输入测试查询');
        return;
      }

      const result = await scenarioService.testScenario(currentStrategy.id, values.testQuery);
      message.success('测试执行成功');
      setTestModalVisible(false);
    } catch (error) {
      console.error('测试执行失败:', error);
      message.error('测试执行失败');
    }
  };

  const getStrategyIcon = (strategyName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      direct_answer: <MessageOutlined style={{ color: '#52c41a' }} />,
      knowledge_retrieval: <SearchOutlined style={{ color: '#1890ff' }} />,
      graph_enhanced: <NodeIndexOutlined style={{ color: '#fa8c16' }} />,
      multilang_qa: <GlobalOutlined style={{ color: '#722ed1' }} />
    };
    return iconMap[strategyName] || <ThunderboltOutlined style={{ color: '#d9d9d9' }} />;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'success',
      inactive: 'default',
      testing: 'processing'
    };
    return colorMap[status] || 'default';
  };

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text: string, record: ExecutionStrategy) => (
        <Space>
          {getStrategyIcon(record.name)}
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.name}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '执行模式',
      key: 'execution_mode',
      render: (_: any, record: ExecutionStrategy) => (
        <Space direction="vertical" size="small">
          <Tag color={record.dag_template.parallel_execution ? 'orange' : 'blue'}>
            {record.dag_template.parallel_execution ? '并行执行' : '顺序执行'}
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            超时: {record.dag_template.timeout_seconds}s
          </Text>
        </Space>
      )
    },
    {
      title: '智能体数量',
      key: 'agent_count',
      render: (_: any, record: ExecutionStrategy) => (
        <Badge count={record.agents.length} style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: '性能指标',
      key: 'metrics',
      render: (_: any, record: ExecutionStrategy) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            成功率: <Text strong style={{ color: record.performance_metrics.success_rate > 90 ? '#52c41a' : '#fa8c16' }}>
              {record.performance_metrics.success_rate}%
            </Text>
          </Text>
          <Text style={{ fontSize: '12px' }}>
            响应时间: <Text strong>{record.performance_metrics.avg_response_time}ms</Text>
          </Text>
          <Text style={{ fontSize: '12px' }}>
            执行次数: <Text strong>{record.performance_metrics.total_executions}</Text>
          </Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? '激活' : status === 'inactive' ? '停用' : '测试中'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ExecutionStrategy) => (
        <Space>
          <Tooltip title="测试策略">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTestStrategy(record)}
            />
          </Tooltip>
          <Tooltip title="编辑策略">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditStrategy(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '停用' : '激活'}>
            <Button
              type="text"
              icon={record.status === 'active' ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(
                record.id, 
                record.status === 'active' ? 'inactive' : 'active'
              )}
            />
          </Tooltip>
          <Tooltip title="删除策略">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除策略 "${record.display_name}" 吗？`,
                  onOk: () => handleDeleteStrategy(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const renderPerformanceOverview = () => {
    const totalExecutions = strategies.reduce((sum, s) => sum + s.performance_metrics.total_executions, 0);
    const avgSuccessRate = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.performance_metrics.success_rate, 0) / strategies.length 
      : 0;
    const avgResponseTime = strategies.length > 0
      ? strategies.reduce((sum, s) => sum + s.performance_metrics.avg_response_time, 0) / strategies.length
      : 0;
    const activeStrategies = strategies.filter(s => s.status === 'active').length;

    return (
      <Card 
        title={
          <Space>
            <ThunderboltOutlined />
            <span>性能总览</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="激活策略"
              value={activeStrategies}
              suffix={`/ ${strategies.length}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总执行次数"
              value={totalExecutions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均成功率"
              value={avgSuccessRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: avgSuccessRate > 90 ? '#52c41a' : '#fa8c16' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均响应时间"
              value={avgResponseTime}
              precision={0}
              suffix="ms"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="dag-strategy-management">
      <div className="mb-6">
        <Title level={2}>
          <Space>
            <SettingOutlined />
            DAG执行策略管理
          </Space>
        </Title>
        <Paragraph type="secondary">
          管理智能体协作的DAG执行策略，包括执行序列、并行配置和性能监控
        </Paragraph>
      </div>

      {renderPerformanceOverview()}

      <Card
        title={
          <Space>
            <NodeIndexOutlined />
            <span>执行策略列表</span>
            <Badge count={strategies.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateStrategy}>
            创建策略
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={strategies}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个策略`
          }}
        />
      </Card>

      {/* 编辑策略模态框 */}
      <Modal
        title={currentStrategy ? '编辑执行策略' : '创建执行策略'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {currentStrategy ? '更新' : '创建'}
          </Button>
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              if (currentStrategy) {
                await scenarioService.updateScenario(currentStrategy.id, values);
                message.success('更新成功');
              } else {
                await scenarioService.createScenario(values);
                message.success('创建成功');
              }
              setEditModalVisible(false);
              loadStrategies();
            } catch (error) {
              console.error('操作失败:', error);
              message.error('操作失败');
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
                <Input placeholder="输入策略名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="display_name" label="显示名称" rules={[{ required: true }]}>
                <Input placeholder="输入显示名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="策略描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="输入策略描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parallel_execution" label="并行执行" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timeout_seconds" label="超时时间(秒)" rules={[{ required: true }]}>
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select placeholder="选择状态">
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="testing">测试中</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试策略模态框 */}
      <Modal
        title="测试执行策略"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalVisible(false)}>
            取消
          </Button>,
          <Button key="test" type="primary" icon={<PlayCircleOutlined />} onClick={executeTest}>
            执行测试
          </Button>
        ]}
        width={600}
      >
        {currentStrategy && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              {getStrategyIcon(currentStrategy.name)}
              <Text strong>{currentStrategy.display_name}</Text>
            </Space>
            <Divider />
            <Text type="secondary">{currentStrategy.description}</Text>
          </div>
        )}
        
        <Form form={testForm} layout="vertical">
          <Form.Item name="testQuery" label="测试查询" rules={[{ required: true }]}>
            <TextArea
              rows={4}
              placeholder="输入测试查询内容..."
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .dag-strategy-management {
          padding: 24px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: calc(100vh - 64px);
        }

        .dag-strategy-management .ant-card {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
        }

        .dag-strategy-management .ant-table-thead > tr > th {
          background: rgba(250, 250, 250, 0.8);
          border-bottom: 1px solid #e8e8e8;
        }

        .dag-strategy-management .ant-statistic-content-value {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default DAGStrategyManagementPage;