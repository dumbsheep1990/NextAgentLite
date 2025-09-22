import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Space, Tag, Modal, Form, Input, Select, 
  Row, Col, Statistic, Tooltip, message, Typography, 
  Switch, Avatar, Progress, Alert, Tabs, Radio, Collapse, Divider, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, PlayCircleOutlined,
  RobotOutlined, TeamOutlined, BranchesOutlined, SettingOutlined,
  ApiOutlined, ToolOutlined, EyeOutlined, BarChartOutlined, PauseCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ThunderboltOutlined, ReloadOutlined
} from '@ant-design/icons';
import styles from './UnifiedAgentFactory.module.css';
import { unifiedAgentService } from '../../services/unifiedAgentService';
import type { UnifiedAgent, AgentTemplate, AgentOverview } from '../../services/unifiedAgentService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Panel } = Collapse;

// 数据类型定义使用导入的类型

const UnifiedAgentFactoryPage: React.FC = () => {
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [overview, setOverview] = useState<AgentOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<UnifiedAgent | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAgents(),
        loadTemplates(),
        loadOverview()
      ]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const params = selectedFramework !== 'all' ? { framework: selectedFramework } : {};
      const agentsData = await unifiedAgentService.listAgents(params);
      setAgents(agentsData || []);
    } catch (error) {
      console.error('加载智能体列表失败:', error);
      // 不显示错误消息，只设置空数组
      setAgents([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await unifiedAgentService.listTemplates();
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('加载模板失败:', error);
      // 不显示错误消息，只设置空数组
      setTemplates([]);
    }
  };

  const loadOverview = async () => {
    try {
      const overviewData = await unifiedAgentService.getAgentsOverview();
      setOverview(overviewData);
    } catch (error) {
      console.error('加载统计概览失败:', error);
      // 设置默认概览数据
      setOverview({
        totalAgents: 0,
        activeAgents: 0,
        totalExecutions: 0,
        avgExecutionTime: 0,
        frameworkDistribution: { agno: 0, youtu: 0, hybrid: 0 },
        typeDistribution: { simple: 0, orchestrated: 0 },
        recentPerformance: []
      });
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleCreateFromTemplate = (template: AgentTemplate) => {
    setEditingAgent(null);
    form.setFieldsValue({
      name: `${template.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      displayName: template.name,
      description: template.description,
      framework: template.framework,
      type: template.type,
      config: template.defaultConfig,
      knowledgeBinding: unifiedAgentService.generateDefaultKnowledgeBinding(),
      tags: [template.category]
    });
    setTemplateModalVisible(false);
    setModalVisible(true);
  };

  const handleEditAgent = (agent: UnifiedAgent) => {
    setEditingAgent(agent);
    form.setFieldsValue({
      name: agent.name,
      displayName: agent.displayName,
      description: agent.description,
      framework: agent.framework,
      type: agent.type,
      config: agent.config,
      knowledgeBinding: agent.knowledgeBinding,
      tags: agent.tags
    });
    setModalVisible(true);
  };

  const handleSaveAgent = async (values: any) => {
    try {
      if (editingAgent) {
        // 更新智能体
        await unifiedAgentService.updateAgent(editingAgent.id, {
          displayName: values.displayName,
          description: values.description,
          config: values.config,
          knowledgeBinding: values.knowledgeBinding,
          tags: values.tags || []
        });
        message.success('智能体更新成功');
      } else {
        // 创建智能体
        await unifiedAgentService.createAgent({
          name: values.name,
          displayName: values.displayName,
          description: values.description,
          framework: values.framework,
          type: values.type,
          config: values.config || unifiedAgentService.generateDefaultConfig(values.framework, values.type),
          knowledgeBinding: values.knowledgeBinding || unifiedAgentService.generateDefaultKnowledgeBinding(),
          tags: values.tags || []
        });
        message.success('智能体创建成功');
      }
      
      setModalVisible(false);
      await loadAgents();
      await loadOverview();
    } catch (error) {
      console.error('保存智能体失败:', error);
      message.error('保存智能体失败');
    }
  };

  const handleToggleAgent = async (agent: UnifiedAgent) => {
    try {
      const result = await unifiedAgentService.toggleAgentStatus(agent.id);
      message.success(result.message);
      await loadAgents();
      await loadOverview();
    } catch (error) {
      console.error('切换状态失败:', error);
      message.error('切换状态失败');
    }
  };

  const handleDeleteAgent = (agent: UnifiedAgent) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除智能体"${agent.displayName}"吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await unifiedAgentService.deleteAgent(agent.id);
          message.success('智能体删除成功');
          await loadAgents();
          await loadOverview();
        } catch (error) {
          console.error('删除智能体失败:', error);
          message.error('删除智能体失败');
        }
      }
    });
  };

  const getFrameworkConfig = (framework: string) => {
    const baseConfig = unifiedAgentService.getFrameworkConfig(framework);
    const iconMap = {
      agno: <TeamOutlined />,
      youtu: <RobotOutlined />,
      hybrid: <BranchesOutlined />
    };
    return {
      ...baseConfig,
      icon: iconMap[framework as keyof typeof iconMap] || <RobotOutlined />
    };
  };

  const getTypeConfig = (type: string) => {
    return unifiedAgentService.getTypeConfig(type);
  };

  const getStatusConfig = (status: string) => {
    return unifiedAgentService.getStatusConfig(status);
  };

  const filteredAgents = selectedFramework === 'all' 
    ? agents 
    : agents.filter(agent => agent.framework === selectedFramework);

  const columns = [
    {
      title: '智能体信息',
      key: 'info',
      render: (_, record: UnifiedAgent) => {
        const frameworkConfig = getFrameworkConfig(record.framework);
        const typeConfig = getTypeConfig(record.type);
        const statusConfig = getStatusConfig(record.status);
        
        return (
          <div className={styles.agentInfo}>
            <div className={styles.agentHeader}>
              <Avatar 
                size={48} 
                style={{ 
                  backgroundColor: frameworkConfig.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {frameworkConfig.icon}
              </Avatar>
              <div className={styles.agentDetails}>
                <div className={styles.agentName}>{record.displayName}</div>
                <Text type="secondary" className={styles.agentDescription}>
                  {record.description}
                </Text>
                <div className={styles.agentTags}>
                  <Tag color={frameworkConfig.color} size="small">
                    {frameworkConfig.name}
                  </Tag>
                  <Tag color={typeConfig.color} size="small">
                    {typeConfig.name}
                  </Tag>
                  <Badge color={statusConfig.color} text={statusConfig.text} />
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: '配置详情',
      key: 'config',
      render: (_, record: UnifiedAgent) => (
        <div className={styles.configDetails}>
          {record.framework === 'agno' && (
            <div className={styles.configSection}>
              <Text type="secondary">协调器:</Text>
              <Text strong>{record.config.coordinator}</Text>
              <br />
              <Text type="secondary">成员数:</Text>
              <Text strong>{record.config.members?.length || 0}</Text>
              <br />
              <Text type="secondary">模式:</Text>
              <Text strong>{record.config.mode}</Text>
            </div>
          )}
          {record.framework === 'youtu' && (
            <div className={styles.configSection}>
              <Text type="secondary">模型:</Text>
              <Text strong>
                {record.config.model?.provider}/{record.config.model?.model}
              </Text>
              <br />
              <Text type="secondary">工具包:</Text>
              <Text strong>{record.config.toolkits?.length || 0} 个</Text>
              <br />
              <Text type="secondary">环境:</Text>
              <Text strong>{record.config.environment}</Text>
            </div>
          )}
          {record.framework === 'hybrid' && (
            <div className={styles.configSection}>
              <Text type="secondary">主框架:</Text>
              <Text strong>{record.config.primaryFramework}</Text>
              <br />
              <Text type="secondary">备用框架:</Text>
              <Text strong>{record.config.fallbackFramework}</Text>
              <br />
              <Text type="secondary">路由规则:</Text>
              <Text strong>{record.config.routingRules?.length || 0} 条</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: '性能指标',
      key: 'performance',
      render: (_, record: UnifiedAgent) => {
        const metrics = record.performanceStats;
        const successColor = metrics.successRate >= 90 ? '#52c41a' : 
                           metrics.successRate >= 70 ? '#faad14' : '#ff4d4f';
        return (
          <div className={styles.performanceMetrics}>
            <div className={styles.metricItem}>
              <Text type="secondary">成功率</Text>
              <div className={styles.metricValue}>
                <Progress 
                  percent={metrics.successRate} 
                  size="small" 
                  strokeColor={successColor}
                  showInfo={false}
                  style={{ width: 60 }}
                />
                <Text strong>{metrics.successRate.toFixed(1)}%</Text>
              </div>
            </div>
            <div className={styles.metricItem}>
              <Text type="secondary">响应时间</Text>
              <Text strong>{metrics.avgResponseTime.toFixed(0)}ms</Text>
            </div>
            <div className={styles.metricItem}>
              <Text type="secondary">执行次数</Text>
              <Text strong>{metrics.totalExecutions}</Text>
            </div>
          </div>
        );
      }
    },
    {
      title: '知识库绑定',
      key: 'knowledge',
      render: (_, record: UnifiedAgent) => (
        <div className={styles.knowledgeBinding}>
          <div className={styles.knowledgeItem}>
            <Text type="secondary">绑定集合:</Text>
            <Text strong>{record.knowledgeBinding.collections.length}</Text>
          </div>
          <div className={styles.knowledgeItem}>
            <Text type="secondary">检索模式:</Text>
            <Tag size="small" color="blue">
              {record.knowledgeBinding.retrievalMode}
            </Tag>
          </div>
          <div className={styles.collectionTags}>
            {record.knowledgeBinding.collections.slice(0, 2).map((collection, index) => (
              <Tag key={index} size="small">{collection}</Tag>
            ))}
            {record.knowledgeBinding.collections.length > 2 && (
              <Tag size="small">+{record.knowledgeBinding.collections.length - 2}</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: UnifiedAgent) => (
        <Space>
          <Tooltip title={record.status === 'active' ? '停用' : '启用'}>
            <Button
              type="text"
              icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleAgent(record)}
            />
          </Tooltip>
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
                setEditingAgent(null);
                form.setFieldsValue({
                  name: `${record.name}_copy_${Date.now()}`,
                  displayName: `${record.displayName} (副本)`,
                  description: record.description,
                  framework: record.framework,
                  type: record.type,
                  config: record.config,
                  knowledgeBinding: record.knowledgeBinding,
                  tags: record.tags
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="导出配置">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  const config = await unifiedAgentService.exportAgentConfig(record.id);
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${record.name}_config.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  message.success('配置导出成功');
                } catch (error) {
                  message.error('导出配置失败');
                }
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

  const templateColumns = [
    {
      title: '模板信息',
      key: 'info',
      render: (_, record: AgentTemplate) => {
        const frameworkConfig = getFrameworkConfig(record.framework);
        return (
          <Space>
            <Avatar size={40} style={{ backgroundColor: frameworkConfig.color }}>
              {frameworkConfig.icon}
            </Avatar>
            <div>
              <div className={styles.templateName}>{record.name}</div>
              <Text type="secondary">{record.description}</Text>
              <div>
                <Tag color={frameworkConfig.color} size="small">
                  {frameworkConfig.name}
                </Tag>
                <Tag color="orange" size="small">{record.category}</Tag>
              </div>
            </div>
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: AgentTemplate) => (
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => handleCreateFromTemplate(record)}
        >
          使用模板
        </Button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Title level={2} className={styles.pageTitle}>
            智能体工厂
          </Title>
          <Paragraph className={styles.pageDescription}>
            统一管理团队协作模式和智能助手模式，支持混合调用和智能路由，集成现有知识库系统。
          </Paragraph>
        </div>
        <Space>
          <Button 
            icon={<SettingOutlined />}
            size="large"
            onClick={() => setTemplateModalVisible(true)}
          >
            模板库
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateAgent}
          >
            创建智能体
          </Button>
        </Space>
      </div>

      {/* 功能说明 */}
      <Alert
        message="多模式统一管理"
        description={
          <div className={styles.frameworkDescription}>
            <div><strong>团队协作模式:</strong> 多角色协同处理复杂任务，支持coordinator模式的团队协作</div>
            <div><strong>智能助手模式:</strong> 单一智能体高效处理，支持简单和编排两种类型</div>
            <div><strong>智能路由模式:</strong> 自适应智能体，根据查询特征自动选择最优处理方式</div>
            <div><strong>知识库集成:</strong> 统一使用现有的知识库系统，支持Filter-then-Rerank检索模式</div>
          </div>
        }
        type="info"
        showIcon
        className={styles.frameworkAlert}
      />

      {/* 统计概览 */}
      <Row gutter={24} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总智能体数"
              value={overview?.totalAgents || agents.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="运行中"
              value={overview?.activeAgents || agents.filter(a => a.status === 'active').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="近期执行"
              value={overview?.recentExecutions || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="平均响应时间"
              value={overview?.avgExecutionTime || 0}
              suffix="ms"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 智能体列表 */}
      <Card 
        title="智能体实例列表"
        className={styles.agentListCard}
        extra={
          <Space>
            <Select
              value={selectedFramework}
              onChange={(value) => {
                setSelectedFramework(value);
                // 框架筛选变化时重新加载数据
                setTimeout(() => loadAgents(), 100);
              }}
              style={{ width: 120 }}
            >
              <Select.Option value="all">全部模式</Select.Option>
              <Select.Option value="agno">团队协作</Select.Option>
              <Select.Option value="youtu">智能助手</Select.Option>
              <Select.Option value="hybrid">智能路由</Select.Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadData}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAgents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个智能体实例`
          }}
        />
      </Card>

      {/* 智能体配置模态框 */}
      <Modal
        title={editingAgent ? '编辑智能体配置' : '创建新智能体'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className={styles.configModal}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAgent}
          initialValues={{
            framework: 'youtu',
            type: 'simple'
          }}
        >
          {/* 基础配置 */}
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
                  name="displayName"
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

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="framework"
                  label="框架选择"
                  rules={[{ required: true, message: '请选择框架' }]}
                >
                  <Radio.Group>
                    <Radio.Button value="agno">团队协作</Radio.Button>
                    <Radio.Button value="youtu">智能助手</Radio.Button>
                    <Radio.Button value="hybrid">智能路由</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="智能体类型"
                  rules={[{ required: true, message: '请选择类型' }]}
                >
                  <Select>
                    <Select.Option value="team">协作团队</Select.Option>
                    <Select.Option value="simple">单体智能体</Select.Option>
                    <Select.Option value="orchestra">编排智能体</Select.Option>
                    <Select.Option value="hybrid">混合智能体</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
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

      {/* 模板选择模态框 */}
      <Modal
        title="选择智能体模板"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={900}
      >
        <Tabs defaultActiveKey="all">
          <TabPane tab="全部模板" key="all">
            <Table
              columns={templateColumns}
              dataSource={templates}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
          <TabPane tab="团队协作" key="agno">
            <Table
              columns={templateColumns}
              dataSource={templates.filter(t => t.framework === 'agno')}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
          <TabPane tab="智能助手" key="youtu">
            <Table
              columns={templateColumns}
              dataSource={templates.filter(t => t.framework === 'youtu')}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
          <TabPane tab="智能路由" key="hybrid">
            <Table
              columns={templateColumns}
              dataSource={templates.filter(t => t.framework === 'hybrid')}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default UnifiedAgentFactoryPage;
