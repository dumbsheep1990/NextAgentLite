import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Space, Tag, Modal, Form, Input, Select, 
  Slider, Row, Col, Statistic, Progress, Tooltip, message, Drawer,
  Typography, Divider, Alert, Switch, InputNumber, Radio, Collapse
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  SettingOutlined, BarChartOutlined, ThunderboltOutlined, 
  BranchesOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, ClockCircleOutlined, ApiOutlined
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import styles from './HybridStrategy.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// 数据类型定义
interface StrategyConfig {
  id: string;
  name: string;
  display_name: string;
  description: string;
  strategy_type: 'intelligent_routing' | 'performance_balanced' | 'domain_specialized' | 'custom';
  is_enabled: boolean;
  performance_metrics: {
    success_rate: number;
    avg_response_time: number;
    total_executions: number;
    last_execution?: string;
  };
  routing_rules: Array<{
    condition: string;
    target: 'primary' | 'secondary' | 'hybrid';
    priority: number;
  }>;
  condition_logic: {
    query_complexity_threshold: number;
    response_time_limit: number;
    fallback_enabled: boolean;
    load_balancing_weight: number;
  };
  created_at: string;
  updated_at: string;
}

const HybridStrategyPage: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/youtu/strategy/list');
      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      }
    } catch (error) {
      message.error('加载查询路由策略失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    setEditingStrategy(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditStrategy = (strategy: StrategyConfig) => {
    setEditingStrategy(strategy);
    form.setFieldsValue({
      name: strategy.name,
      display_name: strategy.display_name,
      description: strategy.description,
      strategy_type: strategy.strategy_type,
      query_complexity_threshold: strategy.condition_logic.query_complexity_threshold,
      response_time_limit: strategy.condition_logic.response_time_limit,
      fallback_enabled: strategy.condition_logic.fallback_enabled,
      load_balancing_weight: strategy.condition_logic.load_balancing_weight
    });
    setModalVisible(true);
  };

  const handleSaveStrategy = async (values: any) => {
    try {
      const strategyData = {
        name: values.name,
        display_name: values.display_name,
        description: values.description,
        strategy_type: values.strategy_type,
        condition_logic: {
          query_complexity_threshold: values.query_complexity_threshold,
          response_time_limit: values.response_time_limit,
          fallback_enabled: values.fallback_enabled,
          load_balancing_weight: values.load_balancing_weight
        },
        routing_rules: [],
        agno_config: {},
        youtu_config: {},
        is_enabled: true
      };

      const url = editingStrategy 
        ? `/api/v1/youtu/strategy/${editingStrategy.id}`
        : '/api/v1/youtu/strategy/create';
      
      const method = editingStrategy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyData)
      });

      if (response.ok) {
        message.success(editingStrategy ? '路由策略更新成功' : '路由策略创建成功');
        setModalVisible(false);
        loadStrategies();
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      message.error('保存路由策略失败');
    }
  };

  const handleToggleStrategy = async (strategy: StrategyConfig) => {
    try {
      const response = await fetch(`/api/v1/youtu/strategy/${strategy.id}/toggle`, {
        method: 'POST'
      });
      
      if (response.ok) {
        message.success(`路由策略已${strategy.is_enabled ? '禁用' : '启用'}`);
        loadStrategies();
      }
    } catch (error) {
      message.error('切换策略状态失败');
    }
  };

  const handleDeleteStrategy = (strategy: StrategyConfig) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除路由策略"${strategy.display_name}"吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/v1/youtu/strategy/${strategy.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            message.success('路由策略删除成功');
            loadStrategies();
          }
        } catch (error) {
          message.error('删除策略失败');
        }
      }
    });
  };

  const getStrategyTypeConfig = (type: string) => {
    const configs = {
      intelligent_routing: {
        name: '智能分发',
        color: '#1890ff',
        description: '根据查询内容自动选择最合适的处理引擎'
      },
      performance_balanced: {
        name: '负载均衡',
        color: '#52c41a',
        description: '在多个处理引擎间平均分配查询负载'
      },
      domain_specialized: {
        name: '专业领域',
        color: '#fa8c16',
        description: '针对特定专业领域优化查询处理路径'
      },
      custom: {
        name: '自定义规则',
        color: '#13c2c2',
        description: '基于自定义条件进行查询路由分发'
      }
    };
    return configs[type as keyof typeof configs] || configs.custom;
  };

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text: string, record: StrategyConfig) => {
        const config = getStrategyTypeConfig(record.strategy_type);
        return (
          <div>
            <div className={styles.strategyName}>{text}</div>
            <Text type="secondary" className={styles.strategyDescription}>
              {record.description || config.description}
            </Text>
          </div>
        );
      }
    },
    {
      title: '路由类型',
      dataIndex: 'strategy_type',
      key: 'strategy_type',
      render: (type: string) => {
        const config = getStrategyTypeConfig(type);
        return (
          <Tag color={config.color}>
            {config.name}
          </Tag>
        );
      }
    },
    {
      title: '性能表现',
      key: 'performance',
      render: (_, record: StrategyConfig) => {
        const metrics = record.performance_metrics;
        const successColor = metrics.success_rate >= 95 ? '#52c41a' : 
                           metrics.success_rate >= 85 ? '#faad14' : '#ff4d4f';
        return (
          <div className={styles.performanceColumn}>
            <div className={styles.performanceItem}>
              <Text type="secondary">成功率</Text>
              <div className={styles.performanceValue}>
                <Progress 
                  percent={metrics.success_rate} 
                  size="small" 
                  strokeColor={successColor}
                  showInfo={false}
                  style={{ width: 60 }}
                />
                <Text strong style={{ color: successColor }}>
                  {metrics.success_rate.toFixed(1)}%
                </Text>
              </div>
            </div>
            <div className={styles.performanceItem}>
              <Text type="secondary">响应时间</Text>
              <Text strong>{metrics.avg_response_time.toFixed(0)}ms</Text>
            </div>
            <div className={styles.performanceItem}>
              <Text type="secondary">处理次数</Text>
              <Text strong>{metrics.total_executions}</Text>
            </div>
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean, record: StrategyConfig) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleStrategy(record)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: StrategyConfig) => (
        <Space>
          <Tooltip title="编辑策略">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditStrategy(record)}
            />
          </Tooltip>
          <Tooltip title="删除策略">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteStrategy(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 页面标题和说明 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Title level={2} className={styles.pageTitle}>
            查询路由策略管理
          </Title>
          <Paragraph className={styles.pageDescription}>
            配置查询在不同处理引擎间的分发规则，实现智能路由、负载均衡和专业化处理，提升查询处理效率和准确性。
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateStrategy}
        >
          新建路由策略
        </Button>
      </div>

      {/* 功能说明卡片 */}
      <Alert
        message="路由策略功能说明"
        description={
          <div className={styles.featureDescription}>
            <div><strong>智能分发：</strong>系统根据查询内容复杂度、领域特征自动选择最适合的处理引擎</div>
            <div><strong>负载均衡：</strong>在多个处理引擎间平衡分配查询，避免单点过载，提升整体吞吐量</div>
            <div><strong>专业领域：</strong>为特定专业领域（如技术文档、业务流程）配置专用处理路径</div>
            <div><strong>自定义规则：</strong>根据业务需求设置灵活的路由条件和优先级规则</div>
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
              title="总策略数"
              value={strategies.length}
              prefix={<BranchesOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="启用中"
              value={strategies.filter(s => s.is_enabled).length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="平均成功率"
              value={strategies.length > 0 
                ? strategies.reduce((sum, s) => sum + s.performance_metrics.success_rate, 0) / strategies.length
                : 0
              }
              precision={1}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总处理量"
              value={strategies.reduce((sum, s) => sum + s.performance_metrics.total_executions, 0)}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 策略列表 */}
      <Card 
        title="路由策略列表"
        className={styles.strategyCard}
        extra={
          <Button icon={<BarChartOutlined />} onClick={loadStrategies}>
            刷新数据
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
            showTotal: (total) => `共 ${total} 条路由策略`
          }}
        />
      </Card>

      {/* 策略配置模态框 */}
      <Modal
        title={editingStrategy ? '编辑路由策略' : '新建路由策略'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveStrategy}
          initialValues={{
            strategy_type: 'intelligent_routing',
            query_complexity_threshold: 50,
            response_time_limit: 5000,
            fallback_enabled: true,
            load_balancing_weight: 50
          }}
        >
          {/* 基础信息 */}
          <div className={styles.formSection}>
            <Title level={5}>基础信息</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="策略标识"
                  rules={[{ required: true, message: '请输入策略标识' }]}
                >
                  <Input placeholder="strategy_name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="display_name"
                  label="策略名称"
                  rules={[{ required: true, message: '请输入策略名称' }]}
                >
                  <Input placeholder="策略显示名称" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="功能描述">
              <TextArea rows={3} placeholder="描述此路由策略的作用和适用场景" />
            </Form.Item>

            <Form.Item
              name="strategy_type"
              label="路由类型"
              rules={[{ required: true, message: '请选择路由类型' }]}
            >
              <Radio.Group>
                <Radio.Button value="intelligent_routing">智能分发</Radio.Button>
                <Radio.Button value="performance_balanced">负载均衡</Radio.Button>
                <Radio.Button value="domain_specialized">专业领域</Radio.Button>
                <Radio.Button value="custom">自定义规则</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>

          <Divider />

          {/* 路由条件配置 */}
          <div className={styles.formSection}>
            <Title level={5}>路由条件配置</Title>
            
            <Form.Item
              name="query_complexity_threshold"
              label={`查询复杂度阈值 (当前: ${form.getFieldValue('query_complexity_threshold') || 50})`}
            >
              <Slider 
                min={0} 
                max={100} 
                marks={{ 
                  0: '简单', 
                  25: '一般', 
                  50: '中等', 
                  75: '复杂',
                  100: '极复杂'
                }} 
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="response_time_limit"
                  label="响应时间限制"
                >
                  <Select>
                    <Select.Option value={3000}>快速响应 (3秒)</Select.Option>
                    <Select.Option value={5000}>标准响应 (5秒)</Select.Option>
                    <Select.Option value={10000}>详细分析 (10秒)</Select.Option>
                    <Select.Option value={30000}>深度处理 (30秒)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="load_balancing_weight"
                  label={`负载权重 (当前: ${form.getFieldValue('load_balancing_weight') || 50}%)`}
                >
                  <Slider 
                    min={0} 
                    max={100} 
                    marks={{ 
                      0: '轻载', 
                      50: '均衡', 
                      100: '重载' 
                    }} 
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="fallback_enabled"
              label="启用降级机制"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </Form.Item>
          </div>

          <div className={styles.formActions}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingStrategy ? '更新策略' : '创建策略'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HybridStrategyPage;