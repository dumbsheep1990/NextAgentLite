/**
 * 智能体模板管理页面
 * 提供智能体模板的查看、创建、编辑和删除功能
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Popconfirm,
  Tabs,
  Badge,
  Descriptions,
  Tooltip,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  RobotOutlined,
  TeamOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  SettingOutlined,
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CloudOutlined,
  ApiOutlined,
  ToolOutlined,
  CodeOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { agentTemplateService } from '@/services/agentTemplateService';
import type { AgentTemplate, AgentTemplateCreate } from '@/services/agentTemplateService';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const AgentTemplateManagePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<'single' | 'team'>('single');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [form] = Form.useForm();

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await agentTemplateService.getTemplateList({
        template_type: selectedType
      });
      setTemplates(data);
    } catch (error) {
      message.error('加载模板列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  // 删除模板
  const handleDelete = async (id: string) => {
    try {
      await agentTemplateService.deleteTemplate(id);
      message.success('删除成功');
      loadTemplates();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  // 编辑模板
  const handleEdit = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    form.setFieldsValue({
      template_name: template.template_name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      color: template.color
    });
    setEditModalVisible(true);
  };

  // 查看详情
  const handleViewDetail = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setDetailModalVisible(true);
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedTemplate) {
        await agentTemplateService.updateTemplate(selectedTemplate.id, values);
        message.success('更新成功');
        setEditModalVisible(false);
        loadTemplates();
      }
    } catch (error: any) {
      message.error('更新失败');
    }
  };

  // 渲染图标
  const renderIcon = (icon: string, color: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'RobotOutlined': <ApiOutlined />,
      'TeamOutlined': <TeamOutlined />,
      'ExperimentOutlined': <ExperimentOutlined />,
      'SettingOutlined': <SettingOutlined />,
      'DashboardOutlined': <DashboardOutlined />,
      'FileTextOutlined': <FileTextOutlined />,
      'AppstoreOutlined': <AppstoreOutlined />,
      'CloudOutlined': <CloudOutlined />,
      'ApiOutlined': <ApiOutlined />,
      'ToolOutlined': <ToolOutlined />,
      'CodeOutlined': <CodeOutlined />,
      'GlobalOutlined': <GlobalOutlined />
    };
    
    return (
      <span style={{ color, fontSize: '20px' }}>
        {iconMap[icon] || <AppstoreOutlined />}
      </span>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      align: 'center' as const,
      render: (icon: string, record: AgentTemplate) => renderIcon(icon, record.color)
    },
    {
      title: '模板代码',
      dataIndex: 'template_code',
      key: 'template_code',
      width: 220,
      render: (code: string) => <code style={{ fontSize: '12px' }}>{code}</code>
    },
    {
      title: '模板名称',
      dataIndex: 'template_name',
      key: 'template_name',
      width: 180
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      align: 'center' as const,
      render: (category: string) => category ? <Tag>{category}</Tag> : '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      key: 'status',
      width: 160,
      render: (record: AgentTemplate) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
          {record.is_system && <Tag color="blue" style={{ margin: 0 }}>系统</Tag>}
          <Badge status={record.is_active ? 'success' : 'default'} 
                 text={record.is_active ? '启用' : '禁用'} 
                 style={{ whiteSpace: 'nowrap' }} />
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: AgentTemplate) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<SettingOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.is_system}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.is_system}
          >
            <Tooltip title={record.is_system ? '系统模板无法删除' : '删除'}>
              <Button 
                type="link" 
                danger
                icon={<DeleteOutlined />}
                disabled={record.is_system}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card 
        title="智能体模板管理"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadTemplates}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('创建功能开发中')}
            >
              创建模板
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={selectedType}
          onChange={(key) => setSelectedType(key as 'single' | 'team')}
        >
          <TabPane 
            tab={
              <span>
                <RobotOutlined /> 单智能体
              </span>
            } 
            key="single"
          >
            <Table 
              columns={columns}
              dataSource={templates}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`
              }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <TeamOutlined /> Team协作
              </span>
            } 
            key="team"
          >
            <Table 
              columns={columns}
              dataSource={templates}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title="编辑智能体模板"
        visible={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
              >
                <Select>
                  <Option value="通用">通用</Option>
                  <Option value="分析">分析</Option>
                  <Option value="检索">检索</Option>
                  <Option value="生成">生成</Option>
                  <Option value="工具">工具</Option>
                  <Option value="专业">专业</Option>
                  <Option value="团队">团队</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="color"
                label="颜色"
              >
                <Input type="color" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="智能体模板详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTemplate && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="模板代码">
              <code>{selectedTemplate.template_code}</code>
            </Descriptions.Item>
            <Descriptions.Item label="模板名称">
              {selectedTemplate.template_name}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={selectedTemplate.template_type === 'team' ? 'blue' : 'green'}>
                {selectedTemplate.template_type === 'team' ? 'Team协作' : '单智能体'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分类">
              {selectedTemplate.category || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {selectedTemplate.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Space>
                {selectedTemplate.is_system && <Tag color="blue">系统模板</Tag>}
                <Badge status={selectedTemplate.is_active ? 'success' : 'default'} 
                       text={selectedTemplate.is_active ? '启用' : '禁用'} />
              </Space>
            </Descriptions.Item>
            {selectedTemplate.team_members && (
              <Descriptions.Item label="团队成员">
                <Space direction="vertical">
                  {selectedTemplate.team_members.map((member, index) => (
                    <div key={index}>
                      {member.agent_id} - {member.role} (顺序: {member.order})
                    </div>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AgentTemplateManagePage;