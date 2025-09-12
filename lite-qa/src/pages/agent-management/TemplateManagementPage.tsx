/**
 * 模板管理页面 - 管理Agent创建模板
 */
import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Button, Space, Typography, 
  Row, Col, Tag, Modal, Form, Input, Select, 
  message, Popconfirm, Empty, List, Avatar
} from 'antd';
import {
  FileTextOutlined, EditOutlined, DeleteOutlined, 
  PlusOutlined, CopyOutlined, StarOutlined,
  RobotOutlined, ToolOutlined, SettingOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 模板接口定义
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isDefault: boolean;
  isStarred: boolean;
  config: {
    agent_type: 'SimpleAgent' | 'OrchestraAgent';
    tools: string[];
    environments: string[];
    instructions: string[];
  };
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// 默认模板数据
const DEFAULT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'data_analyst',
    name: '数据分析师',
    description: '专业的数据分析和报告生成Agent，擅长处理CSV、Excel等表格数据',
    icon: '📊',
    category: '数据分析',
    isDefault: true,
    isStarred: true,
    config: {
      agent_type: 'SimpleAgent',
      tools: ['tabular_data', 'file_ops', 'analysis'],
      environments: ['shell_env'],
      instructions: [
        '你是一个专业的数据分析师',
        '擅长分析CSV、Excel等表格数据',
        '能生成清晰的数据报告和可视化图表',
        '保持数据分析的客观性和准确性'
      ]
    },
    usage_count: 25,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'research_assistant',
    name: '研究助手',
    description: '深度研究和文献调研Agent，能够综合多个信息源生成全面的研究报告',
    icon: '🔍',
    category: '研究调研',
    isDefault: true,
    isStarred: false,
    config: {
      agent_type: 'OrchestraAgent',
      tools: ['search', 'document', 'knowledge'],
      environments: ['browser_env', 'knowledge_env'],
      instructions: [
        '你是一个专业的研究助手',
        '擅长进行深度调研和文献分析',
        '能够综合多个信息源生成全面的研究报告',
        '保持研究的严谨性和学术标准'
      ]
    },
    usage_count: 18,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'code_assistant',
    name: '编程助手',
    description: '代码生成和技术解决方案Agent，熟悉多种编程语言和开发框架',
    icon: '💻',
    category: '软件开发',
    isDefault: true,
    isStarred: true,
    config: {
      agent_type: 'SimpleAgent',
      tools: ['code_exec', 'file_ops', 'git'],
      environments: ['shell_env'],
      instructions: [
        '你是一个专业的编程助手',
        '能够编写、调试和优化代码',
        '熟悉多种编程语言和开发框架',
        '遵循代码最佳实践和安全规范'
      ]
    },
    usage_count: 42,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'content_creator',
    name: '内容创作者',
    description: '文案写作和内容生成Agent，能够适应不同的写作风格和目标受众',
    icon: '✍️',
    category: '内容创作',
    isDefault: true,
    isStarred: false,
    config: {
      agent_type: 'SimpleAgent',
      tools: ['search', 'translation', 'file_ops'],
      environments: ['browser_env'],
      instructions: [
        '你是一个创意内容创作者',
        '擅长写作各种类型的文案和内容',
        '能够适应不同的写作风格和目标受众',
        '保持内容的原创性和吸引力'
      ]
    },
    usage_count: 31,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const TemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [form] = Form.useForm();

  // 获取分类列表
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  // 过滤模板
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // 切换收藏状态
  const toggleStar = (templateId: string) => {
    setTemplates(prev => 
      prev.map(t => 
        t.id === templateId 
          ? { ...t, isStarred: !t.isStarred }
          : t
      )
    );
  };

  // 删除模板
  const handleDelete = async (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    message.success('模板删除成功');
  };

  // 编辑模板
  const handleEdit = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      agent_type: template.config.agent_type,
      tools: template.config.tools,
      environments: template.config.environments,
      instructions: template.config.instructions.join('\n')
    });
    setEditModalOpen(true);
  };

  // 创建新模板
  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      agent_type: 'SimpleAgent',
      tools: [],
      environments: []
    });
    setSelectedTemplate(null);
    setCreateModalOpen(true);
  };

  // 确认保存
  const handleSave = async (isEdit: boolean) => {
    try {
      const values = await form.validateFields();
      const templateData: AgentTemplate = {
        id: isEdit ? selectedTemplate!.id : `template_${Date.now()}`,
        name: values.name,
        description: values.description,
        icon: values.icon || '🤖',
        category: values.category,
        isDefault: isEdit ? selectedTemplate!.isDefault : false,
        isStarred: isEdit ? selectedTemplate!.isStarred : false,
        config: {
          agent_type: values.agent_type,
          tools: values.tools || [],
          environments: values.environments || [],
          instructions: values.instructions.split('\n').filter((line: string) => line.trim())
        },
        usage_count: isEdit ? selectedTemplate!.usage_count : 0,
        created_at: isEdit ? selectedTemplate!.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isEdit) {
        setTemplates(prev => 
          prev.map(t => t.id === templateData.id ? templateData : t)
        );
      } else {
        setTemplates(prev => [...prev, templateData]);
      }

      setEditModalOpen(false);
      setCreateModalOpen(false);
      message.success(isEdit ? '模板更新成功' : '模板创建成功');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // 使用模板创建Agent
  const handleUseTemplate = (template: AgentTemplate) => {
    // 更新使用次数
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      )
    );
    
    // 跳转到创建页面，传递模板信息
    const templateParam = encodeURIComponent(JSON.stringify({
      id: template.id,
      name: template.name,
      config: template.config
    }));
    window.location.href = `/app/intelligent/creator?template=${templateParam}`;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面头部 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <FileTextOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                  模板管理中心
                </Title>
                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  管理Agent创建模板，提供快速创建预设配置
                </Paragraph>
              </div>
              <Space>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  创建新模板
                </Button>
              </Space>
            </div>
          </div>

          {/* 分类筛选 */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text strong style={{ marginRight: 16 }}>分类筛选：</Text>
              <Space wrap>
                {categories.map(category => (
                  <Button
                    key={category}
                    type={selectedCategory === category ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? '全部' : category}
                    {category !== 'all' && (
                      <span style={{ marginLeft: 4 }}>
                        ({templates.filter(t => t.category === category).length})
                      </span>
                    )}
                  </Button>
                ))}
              </Space>
            </div>
          </Card>

          {/* 模板列表 */}
          <Row gutter={[16, 16]}>
            {filteredTemplates.map(template => (
              <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
                <Card
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<RobotOutlined />}
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用模板
                    </Button>,
                    !template.isDefault && (
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(template)}
                      >
                        编辑
                      </Button>
                    ),
                    !template.isDefault && (
                      <Popconfirm
                        title="确定要删除这个模板吗？"
                        onConfirm={() => handleDelete(template.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          icon={<DeleteOutlined />}
                          danger
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    )
                  ].filter(Boolean)}
                >
                  <div style={{ position: 'relative' }}>
                    {/* 收藏按钮 */}
                    <Button
                      type="text"
                      icon={<StarOutlined style={{ color: template.isStarred ? '#faad14' : '#d9d9d9' }} />}
                      style={{ position: 'absolute', top: -8, right: -8 }}
                      onClick={() => toggleStar(template.id)}
                    />
                    
                    {/* 模板信息 */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{template.icon}</div>
                      <Title level={5} style={{ margin: 0 }}>{template.name}</Title>
                      <Tag color="blue" size="small" style={{ marginTop: 4 }}>
                        {template.category}
                      </Tag>
                      {template.isDefault && (
                        <Tag color="gold" size="small">系统模板</Tag>
                      )}
                    </div>

                    <Paragraph 
                      ellipsis={{ rows: 2 }} 
                      style={{ fontSize: '13px', color: '#666', minHeight: 40 }}
                    >
                      {template.description}
                    </Paragraph>

                    <div style={{ marginBottom: 12 }}>
                      <Text strong>类型：</Text>
                      <Tag color={template.config.agent_type === 'SimpleAgent' ? 'blue' : 'purple'} size="small">
                        {template.config.agent_type === 'SimpleAgent' ? '简单' : '协作'}
                      </Tag>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <Text strong>工具：</Text>
                      <div style={{ marginTop: 4 }}>
                        {template.config.tools.slice(0, 2).map(tool => (
                          <Tag key={tool} size="small" color="green">{tool}</Tag>
                        ))}
                        {template.config.tools.length > 2 && (
                          <Tag size="small">+{template.config.tools.length - 2}</Tag>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        使用 {template.usage_count} 次
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(template.updated_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {filteredTemplates.length === 0 && (
            <Card>
              <Empty
                description="暂无模板"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  创建第一个模板
                </Button>
              </Empty>
            </Card>
          )}

          {/* 编辑模板弹窗 */}
          <Modal
            title="编辑模板"
            open={editModalOpen}
            onCancel={() => setEditModalOpen(false)}
            onOk={() => handleSave(true)}
            width={700}
          >
            <Form
              form={form}
              layout="vertical"
            >
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item
                    name="name"
                    label="模板名称"
                    rules={[{ required: true, message: '请输入模板名称' }]}
                  >
                    <Input placeholder="例如: 数据分析师" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="icon"
                    label="图标"
                  >
                    <Input placeholder="📊" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="分类"
                    rules={[{ required: true, message: '请输入分类' }]}
                  >
                    <Input placeholder="例如: 数据分析" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="agent_type"
                    label="Agent类型"
                    rules={[{ required: true, message: '请选择Agent类型' }]}
                  >
                    <Select>
                      <Select.Option value="SimpleAgent">SimpleAgent - 简单循环推理</Select.Option>
                      <Select.Option value="OrchestraAgent">OrchestraAgent - 多步骤协作</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <TextArea rows={3} placeholder="描述这个模板的用途和特点..." />
              </Form.Item>

              <Form.Item
                name="instructions"
                label="指令集 (每行一条)"
                rules={[{ required: true, message: '请输入至少一条指令' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="每行一条指令，例如：&#10;你是一个专业的数据分析师&#10;擅长分析各种数据&#10;能生成清晰的报告"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tools"
                    label="工具集"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择工具"
                      options={[
                        { label: '表格数据处理', value: 'tabular_data' },
                        { label: '文件操作', value: 'file_ops' },
                        { label: '网络搜索', value: 'search' },
                        { label: '文档处理', value: 'document' },
                        { label: '代码执行', value: 'code_exec' },
                        { label: '翻译工具', value: 'translation' },
                        { label: '知识检索', value: 'knowledge' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="environments"
                    label="执行环境"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择环境"
                      options={[
                        { label: '终端环境', value: 'shell_env' },
                        { label: '浏览器环境', value: 'browser_env' },
                        { label: '知识环境', value: 'knowledge_env' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>

          {/* 创建模板弹窗 */}
          <Modal
            title="创建新模板"
            open={createModalOpen}
            onCancel={() => setCreateModalOpen(false)}
            onOk={() => handleSave(false)}
            width={700}
          >
            <Form
              form={form}
              layout="vertical"
            >
              {/* 表单内容与编辑弹窗相同 */}
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item
                    name="name"
                    label="模板名称"
                    rules={[{ required: true, message: '请输入模板名称' }]}
                  >
                    <Input placeholder="例如: 数据分析师" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="icon"
                    label="图标"
                  >
                    <Input placeholder="📊" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="分类"
                    rules={[{ required: true, message: '请输入分类' }]}
                  >
                    <Input placeholder="例如: 数据分析" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="agent_type"
                    label="Agent类型"
                    rules={[{ required: true, message: '请选择Agent类型' }]}
                  >
                    <Select>
                      <Select.Option value="SimpleAgent">SimpleAgent - 简单循环推理</Select.Option>
                      <Select.Option value="OrchestraAgent">OrchestraAgent - 多步骤协作</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <TextArea rows={3} placeholder="描述这个模板的用途和特点..." />
              </Form.Item>

              <Form.Item
                name="instructions"
                label="指令集 (每行一条)"
                rules={[{ required: true, message: '请输入至少一条指令' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="每行一条指令，例如：&#10;你是一个专业的数据分析师&#10;擅长分析各种数据&#10;能生成清晰的报告"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tools"
                    label="工具集"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择工具"
                      options={[
                        { label: '表格数据处理', value: 'tabular_data' },
                        { label: '文件操作', value: 'file_ops' },
                        { label: '网络搜索', value: 'search' },
                        { label: '文档处理', value: 'document' },
                        { label: '代码执行', value: 'code_exec' },
                        { label: '翻译工具', value: 'translation' },
                        { label: '知识检索', value: 'knowledge' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="environments"
                    label="执行环境"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择环境"
                      options={[
                        { label: '终端环境', value: 'shell_env' },
                        { label: '浏览器环境', value: 'browser_env' },
                        { label: '知识环境', value: 'knowledge_env' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default TemplateManagementPage;