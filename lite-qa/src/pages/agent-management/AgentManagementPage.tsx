/**
 * Agent管理页面 - 查看和管理已创建的Agent
 */
import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Table, Button, Space, Typography, 
  Tag, Modal, Form, Input, Select, message, 
  Popconfirm, Drawer, Descriptions, Row, Col,
  Switch, Badge, Tooltip, Empty, Divider
} from 'antd';
import {
  RobotOutlined, EditOutlined, DeleteOutlined, 
  PlayCircleOutlined, PauseCircleOutlined, CopyOutlined,
  EyeOutlined, SettingOutlined, PlusOutlined,
  ReloadOutlined, ExportOutlined, ImportOutlined,
  BulbOutlined, FileTextOutlined, CodeOutlined
} from '@ant-design/icons';
import { youtuAgentService } from '../../services/youtuAgentService';
import type { YoutuAgentConfig, CreateAgentConfigParams } from '../../services/youtuAgentService';
import type { ColumnsType } from 'antd/es/table';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AgentManagementPage: React.FC = () => {
  const [agents, setAgents] = useState<YoutuAgentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<YoutuAgentConfig | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 加载Agent列表
  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await youtuAgentService.getAgentConfigs();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error) {
      message.error('加载Agent列表失败');
      console.error('Load agents error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // 删除Agent
  const handleDelete = async (agentId: string) => {
    try {
      const response = await youtuAgentService.deleteAgentConfig(agentId);
      if (response.success) {
        message.success('删除成功');
        loadAgents();
      } else {
        message.error('删除失败：' + response.message);
      }
    } catch (error) {
      message.error('删除过程中出现错误');
      console.error('Delete error:', error);
    }
  };

  // 复制Agent
  const handleDuplicate = async (agent: YoutuAgentConfig) => {
    setSelectedAgent(agent);
    form.setFieldsValue({
      name: `${agent.name}_copy_${Date.now()}`,
      display_name: `${agent.display_name} (副本)`,
      description: agent.description,
      instructions: agent.instructions.join('\n'),
      tools: agent.tools,
      environments: agent.environments
    });
    setDuplicateModalOpen(true);
  };

  // 确认复制
  const handleConfirmDuplicate = async () => {
    try {
      const values = await form.validateFields();
      const config: CreateAgentConfigParams = {
        ...values,
        agent_type: selectedAgent?.agent_type || 'SimpleAgent',
        instructions: values.instructions.split('\n').filter((line: string) => line.trim()),
        model_config: selectedAgent?.model_config || {
          provider: 'one_api',
          model_id: 'Qwen/Qwen3-30B-A3B-Thinking-2507',
          temperature: 0.1,
          max_tokens: 4096,
          top_p: 1.0
        }
      };

      const response = await youtuAgentService.createAgentConfig(config);
      if (response.success) {
        message.success('Agent复制成功');
        setDuplicateModalOpen(false);
        loadAgents();
      } else {
        message.error('复制失败：' + response.message);
      }
    } catch (error) {
      message.error('复制过程中出现错误');
      console.error('Duplicate error:', error);
    }
  };

  // 查看详情
  const handleViewDetails = (agent: YoutuAgentConfig) => {
    setSelectedAgent(agent);
    setDetailDrawerOpen(true);
  };

  // 表格列定义
  const columns: ColumnsType<YoutuAgentConfig> = [
    {
      title: 'Agent信息',
      key: 'info',
      width: 300,
      render: (_, agent) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <RobotOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            <Text strong>{agent.display_name}</Text>
            {agent.is_system && <Badge count="系统" style={{ marginLeft: 8 }} />}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{agent.name}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" ellipsis style={{ display: 'block', fontSize: '13px' }}>
              {agent.description}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'agent_type',
      key: 'agent_type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'SimpleAgent' ? 'blue' : 'purple'}>
          {type === 'SimpleAgent' ? '简单Agent' : '协作Agent'}
        </Tag>
      )
    },
    {
      title: '工具和环境',
      key: 'capabilities',
      width: 200,
      render: (_, agent) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            {agent.tools.slice(0, 2).map(tool => (
              <Tag key={tool} size="small" color="green">{tool}</Tag>
            ))}
            {agent.tools.length > 2 && (
              <Tag size="small">+{agent.tools.length - 2}</Tag>
            )}
          </div>
          <div>
            {agent.environments.slice(0, 2).map(env => (
              <Tag key={env} size="small" color="orange">{env}</Tag>
            ))}
            {agent.environments.length > 2 && (
              <Tag size="small">+{agent.environments.length - 2}</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, agent) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetails(agent)}
            />
          </Tooltip>
          <Tooltip title="测试运行">
            <Button 
              icon={<PlayCircleOutlined />} 
              size="small"
              type="primary"
              onClick={() => {
                // 跳转到测试页面或打开测试弹窗
                message.info('功能开发中...');
              }}
            />
          </Tooltip>
          <Tooltip title="复制Agent">
            <Button 
              icon={<CopyOutlined />} 
              size="small"
              onClick={() => handleDuplicate(agent)}
            />
          </Tooltip>
          {!agent.is_system && (
            <Popconfirm
              title="确定要删除这个Agent吗？"
              onConfirm={() => handleDelete(agent.id!)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button 
                  icon={<DeleteOutlined />} 
                  size="small"
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 页面头部 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <SettingOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                  Agent管理中心
                </Title>
                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  管理和配置你创建的所有Agent，监控运行状态和性能表现
                </Paragraph>
              </div>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={loadAgents}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => window.location.href = '/app/intelligent/creator'}
                >
                  创建新Agent
                </Button>
              </Space>
            </div>
          </div>

          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RobotOutlined style={{ fontSize: 40, color: '#1890ff', marginRight: 16 }} />
                  <div>
                    <Text type="secondary">总Agent数</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {agents.length}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <BulbOutlined style={{ fontSize: 40, color: '#52c41a', marginRight: 16 }} />
                  <div>
                    <Text type="secondary">简单Agent</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {agents.filter(a => a.agent_type === 'SimpleAgent').length}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 40, color: '#faad14', marginRight: 16 }} />
                  <div>
                    <Text type="secondary">协作Agent</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                      {agents.filter(a => a.agent_type === 'OrchestraAgent').length}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CodeOutlined style={{ fontSize: 40, color: '#f5222d', marginRight: 16 }} />
                  <div>
                    <Text type="secondary">用户创建</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>
                      {agents.filter(a => !a.is_system).length}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Agent列表 */}
          <Card>
            <Table
              columns={columns}
              dataSource={agents}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个Agent`
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="还没有创建任何Agent"
                  >
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => window.location.href = '/app/intelligent/creator'}
                    >
                      立即创建
                    </Button>
                  </Empty>
                )
              }}
            />
          </Card>

          {/* 详情抽屉 */}
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Agent详细信息
              </div>
            }
            width={600}
            open={detailDrawerOpen}
            onClose={() => setDetailDrawerOpen(false)}
          >
            {selectedAgent && (
              <div>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="显示名称">
                    <Text strong>{selectedAgent.display_name}</Text>
                    {selectedAgent.is_system && <Badge count="系统" style={{ marginLeft: 8 }} />}
                  </Descriptions.Item>
                  <Descriptions.Item label="内部名称">
                    <Text code>{selectedAgent.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Agent类型">
                    <Tag color={selectedAgent.agent_type === 'SimpleAgent' ? 'blue' : 'purple'}>
                      {selectedAgent.agent_type === 'SimpleAgent' ? 'SimpleAgent (简单循环推理)' : 'OrchestraAgent (多步骤协作)'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="功能描述">
                    <Paragraph>{selectedAgent.description}</Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label="指令集">
                    <ul style={{ marginBottom: 0 }}>
                      {selectedAgent.instructions.map((instruction, index) => (
                        <li key={index}>
                          <Text>{instruction}</Text>
                        </li>
                      ))}
                    </ul>
                  </Descriptions.Item>
                  <Descriptions.Item label="可用工具">
                    <div>
                      {selectedAgent.tools.map(tool => (
                        <Tag key={tool} color="green" style={{ marginBottom: 4 }}>
                          {tool}
                        </Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="执行环境">
                    <div>
                      {selectedAgent.environments.map(env => (
                        <Tag key={env} color="orange" style={{ marginBottom: 4 }}>
                          {env}
                        </Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="模型配置">
                    <div>
                      <Text strong>提供商：</Text><Text>{selectedAgent.model_config.provider}</Text><br />
                      <Text strong>模型：</Text><Text>{selectedAgent.model_config.model_id}</Text><br />
                      <Text strong>温度：</Text><Text>{selectedAgent.model_config.temperature}</Text><br />
                      <Text strong>最大Token：</Text><Text>{selectedAgent.model_config.max_tokens}</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    <Text>{new Date(selectedAgent.created_at!).toLocaleString('zh-CN')}</Text>
                  </Descriptions.Item>
                  {selectedAgent.updated_at && (
                    <Descriptions.Item label="更新时间">
                      <Text>{new Date(selectedAgent.updated_at).toLocaleString('zh-CN')}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={() => {
                        message.info('测试功能开发中...');
                      }}
                    >
                      测试运行
                    </Button>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => {
                        setDetailDrawerOpen(false);
                        handleDuplicate(selectedAgent);
                      }}
                    >
                      复制Agent
                    </Button>
                    <Button 
                      icon={<ExportOutlined />}
                      onClick={() => {
                        message.info('导出功能开发中...');
                      }}
                    >
                      导出配置
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </Drawer>

          {/* 复制Agent弹窗 */}
          <Modal
            title="复制Agent"
            open={duplicateModalOpen}
            onCancel={() => setDuplicateModalOpen(false)}
            onOk={handleConfirmDuplicate}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label="Agent名称"
                rules={[{ required: true, message: '请输入Agent名称' }]}
              >
                <Input placeholder="例如: my_research_agent" />
              </Form.Item>

              <Form.Item
                name="display_name"
                label="显示名称"
                rules={[{ required: true, message: '请输入显示名称' }]}
              >
                <Input placeholder="例如: 研究助手" />
              </Form.Item>

              <Form.Item
                name="description"
                label="功能描述"
                rules={[{ required: true, message: '请输入功能描述' }]}
              >
                <TextArea rows={3} placeholder="描述这个Agent的主要功能和用途..." />
              </Form.Item>

              <Form.Item
                name="instructions"
                label="指令集 (每行一条)"
                rules={[{ required: true, message: '请输入至少一条指令' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="每行一条指令，例如：&#10;你是一个专业的研究助手&#10;善于分析和整理信息&#10;保持客观和准确"
                />
              </Form.Item>

              <Form.Item
                name="tools"
                label="工具集"
              >
                <Select
                  mode="multiple"
                  placeholder="选择Agent可使用的工具"
                  options={youtuAgentService.getSupportedTools().map(tool => ({
                    label: `${tool.name} - ${tool.description}`,
                    value: tool.id
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="environments"
                label="执行环境"
              >
                <Select
                  mode="multiple"
                  placeholder="选择Agent的执行环境"
                  options={youtuAgentService.getSupportedEnvironments().map(env => ({
                    label: `${env.name} - ${env.description}`,
                    value: env.id
                  }))}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default AgentManagementPage;