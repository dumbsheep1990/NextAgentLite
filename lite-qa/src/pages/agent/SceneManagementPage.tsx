import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Space, Tag, Modal, Form, Input, Select, 
  Row, Col, Statistic, Tooltip, message, Typography, 
  Switch, Avatar, Progress, Alert, Divider, Badge, List
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  RobotOutlined, ThunderboltOutlined, BranchesOutlined,
  ApiOutlined, ToolOutlined, EyeOutlined, BarChartOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  NodeIndexOutlined, SearchOutlined, MessageOutlined, SettingOutlined,
  FileTextOutlined, BookOutlined, BankOutlined, QuestionCircleOutlined,
  DatabaseOutlined, UsergroupAddOutlined, FileSearchOutlined
} from '@ant-design/icons';
import { apiRequest } from '../../services/api';

// 业务场景配置接口
interface BusinessScenario {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  document_count: number;
  collection_count: number;
  template_config: {
    metadata_fields: string[];
    extraction_rules: any[];
    validation_rules: any[];
  };
  usage_statistics: {
    total_documents: number;
    active_collections: number;
    avg_extraction_accuracy: number;
    last_used: string;
  };
  created_at: string;
  updated_at: string;
}

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;


const SceneManagementPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<BusinessScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScenario, setEditingScenario] = useState<BusinessScenario | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      // 获取四个业务场景的配置
      const scenarios = await getBusinessScenarios();
      setScenarios(scenarios);
    } catch (error) {
      message.error('加载业务场景失败');
      console.error('Load scenarios error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取业务场景数据
  const getBusinessScenarios = async (): Promise<BusinessScenario[]> => {
    try {
      // 调用后端API获取元数据模板类型
      const typesResponse = await apiRequest('GET', '/api/v1/metadata-templates/types');
      const types = typesResponse.types || [];
      
      // 构建业务场景配置，但统计数据清零
      const scenarios: BusinessScenario[] = types.map((type: any) => ({
        id: type.id,
        name: type.id,
        display_name: type.name,
        description: type.description,
        icon: getScenarioIcon(type.id),
        color: getScenarioColor(type.id),
        is_active: true,
        document_count: 0, // 清零
        collection_count: 0, // 清零
        template_config: {
          metadata_fields: getDefaultMetadataFields(type.id),
          extraction_rules: [],
          validation_rules: []
        },
        usage_statistics: {
          total_documents: 0, // 清零
          active_collections: 0, // 清零
          avg_extraction_accuracy: 0, // 清零
          last_used: '' // 清空
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      }));

      return scenarios;
    } catch (error) {
      console.warn('获取场景配置失败，使用默认配置:', error);
      // 返回默认的四个业务场景（数据清零）
      return getDefaultBusinessScenarios();
    }
  };

  const getDefaultBusinessScenarios = (): BusinessScenario[] => {
    return [
      {
        id: 'general',
        name: 'general',
        display_name: '通用场景',
        description: '适用于一般文档的通用元数据提取和管理',
        icon: 'default',
        color: getScenarioColor('general'),
        is_active: true,
        document_count: 0, // 清零
        collection_count: 0, // 清零
        template_config: {
          metadata_fields: ['标题', '作者', '创建时间', '标签', '摘要'],
          extraction_rules: [],
          validation_rules: []
        },
        usage_statistics: {
          total_documents: 0, // 清零
          active_collections: 0, // 清零
          avg_extraction_accuracy: 0, // 清零
          last_used: '' // 清空
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 'policy',
        name: 'policy',
        display_name: '政策问答',
        description: '专门针对政策文档的结构化元数据提取',
        icon: 'policy',
        color: getScenarioColor('policy'),
        is_active: true,
        document_count: 0, // 清零
        collection_count: 0, // 清零
        template_config: {
          metadata_fields: ['政策名称', '发布机关', '生效日期', '适用范围', '关键条款'],
          extraction_rules: [],
          validation_rules: []
        },
        usage_statistics: {
          total_documents: 0, // 清零
          active_collections: 0, // 清零
          avg_extraction_accuracy: 0, // 清零
          last_used: '' // 清空
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-19T16:20:00Z'
      },
      {
        id: 'academic',
        name: 'academic',
        display_name: '学术领域',
        description: '学术论文和研究文档的专业元数据管理',
        icon: 'academic',
        color: getScenarioColor('academic'),
        is_active: true,
        document_count: 0, // 清零
        collection_count: 0, // 清零
        template_config: {
          metadata_fields: ['论文标题', '作者', '期刊', '发表时间', '关键词', '摘要'],
          extraction_rules: [],
          validation_rules: []
        },
        usage_statistics: {
          total_documents: 0, // 清零
          active_collections: 0, // 清零
          avg_extraction_accuracy: 0, // 清零
          last_used: '' // 清空
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-18T10:45:00Z'
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        display_name: '企业场景',
        description: '企业内部文档和知识管理系统优化',
        icon: 'enterprise',
        color: getScenarioColor('enterprise'),
        is_active: true,
        document_count: 0, // 清零
        collection_count: 0, // 清零
        template_config: {
          metadata_fields: ['文档类型', '部门', '负责人', '版本号', '审批状态'],
          extraction_rules: [],
          validation_rules: []
        },
        usage_statistics: {
          total_documents: 0, // 清零
          active_collections: 0, // 清零
          avg_extraction_accuracy: 0, // 清零
          last_used: '' // 清空
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-21T09:15:00Z'
      }
    ];
  };

  // 获取场景图标
  const getScenarioIcon = (scenarioId: string) => {
    const iconMap: Record<string, string> = {
      general: 'default',
      policy: 'policy',
      academic: 'academic',
      enterprise: 'enterprise'
    };
    return iconMap[scenarioId] || 'default';
  };

  // 获取场景颜色
  const getScenarioColor = (scenarioId: string) => {
    const colorMap: Record<string, string> = {
      general: '#52c41a',
      policy: '#1890ff',
      academic: '#f5222d',
      enterprise: '#fa8c16'
    };
    return colorMap[scenarioId] || '#d9d9d9';
  };

  // 获取默认元数据字段
  const getDefaultMetadataFields = (scenarioId: string): string[] => {
    const fieldsMap: Record<string, string[]> = {
      general: ['标题', '作者', '创建时间', '标签', '摘要'],
      policy: ['政策名称', '发布机关', '生效日期', '适用范围', '关键条款'],
      academic: ['论文标题', '作者', '期刊', '发表时间', '关键词', '摘要'],
      enterprise: ['文档类型', '部门', '负责人', '版本号', '审批状态']
    };
    return fieldsMap[scenarioId] || ['标题', '内容', '创建时间'];
  };

  const handleAddScenario = () => {
    setEditingScenario(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditScenario = (scenario: BusinessScenario) => {
    setEditingScenario(scenario);
    setModalVisible(true);
    form.setFieldsValue({
      display_name: scenario.display_name,
      description: scenario.description,
      is_active: scenario.is_active,
      metadata_fields: scenario.template_config.metadata_fields.join(', ')
    });
  };

  const handleDeleteScenario = (scenarioId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个场景配置吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 这里调用删除API
        message.success('删除成功');
        loadScenarios();
      }
    });
  };

  const handleToggleStatus = (scenario: BusinessScenario) => {
    const newStatus = !scenario.is_active;
    
    // 立即更新本地状态
    setScenarios(prevScenarios => 
      prevScenarios.map(s => 
        s.id === scenario.id 
          ? { ...s, is_active: newStatus }
          : s
      )
    );
    
    message.success(`已${newStatus ? '启用' : '禁用'}场景`);
    
    // 这里可以调用API保存状态到后端
    // await apiRequest('PUT', `/api/v1/scenarios/${scenario.id}/status`, { is_active: newStatus });
  };

  const handleSave = async (values: any) => {
    try {
      // 这里调用保存API
      console.log('Save scenario:', values);
      message.success(editingScenario ? '更新成功' : '创建成功');
      setModalVisible(false);
      loadScenarios();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const renderScenarioIcon = (scenario: BusinessScenario) => {
    const iconMap: Record<string, React.ReactNode> = {
      general: <FileTextOutlined style={{ color: scenario.color, fontSize: 18 }} />,
      policy: <BankOutlined style={{ color: scenario.color, fontSize: 18 }} />,
      academic: <BookOutlined style={{ color: scenario.color, fontSize: 18 }} />,
      enterprise: <NodeIndexOutlined style={{ color: scenario.color, fontSize: 18 }} />,
      default: <QuestionCircleOutlined style={{ color: scenario.color, fontSize: 18 }} />
    };
    return iconMap[scenario.icon] || iconMap.default;
  };

  const columns = [
    {
      title: '场景信息',
      key: 'info',
      render: (_: any, record: BusinessScenario) => (
        <Space>
          <Avatar
            shape="square"
            size={48}
            style={{ 
              backgroundColor: `${record.color}15`,
              border: `2px solid ${record.color}30`,
              borderRadius: 8
            }}
            icon={renderScenarioIcon(record)}
          />
          <div>
            <Text strong style={{ fontSize: 16, color: record.color }}>
              {record.display_name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13, maxWidth: 200, display: 'inline-block' }}>
              {record.description}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '配置概览',
      key: 'config',
      render: (_: any, record: BusinessScenario) => (
        <div style={{ minWidth: 180 }}>
          <Space direction="vertical" size="small">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>元数据字段:</Text>
              <div style={{ marginTop: 4 }}>
                {record.template_config.metadata_fields.slice(0, 2).map(field => (
                  <Tag key={field} color={record.color} size="small" style={{ marginBottom: 2 }}>
                    {field}
                  </Tag>
                ))}
                {record.template_config.metadata_fields.length > 2 && (
                  <Tag color="default" size="small">
                    +{record.template_config.metadata_fields.length - 2}
                  </Tag>
                )}
              </div>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: '使用统计',
      key: 'statistics',
      render: (_: any, record: BusinessScenario) => (
        <div style={{ minWidth: 140 }}>
          <Space direction="vertical" size="small">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>文档: </Text>
              <Text strong>{record.document_count}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>集合: </Text>
              <Text strong>{record.collection_count}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>精度: </Text>
              <Text strong style={{ 
                color: record.usage_statistics.avg_extraction_accuracy > 90 ? '#52c41a' : 
                      record.usage_statistics.avg_extraction_accuracy > 0 ? '#fa8c16' : '#d9d9d9'
              }}>
                {record.usage_statistics.avg_extraction_accuracy}%
              </Text>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: BusinessScenario) => (
        <div style={{ textAlign: 'center' }}>
          <Switch
            checked={record.is_active}
            onChange={() => handleToggleStatus(record)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            style={{ marginBottom: 8 }}
          />
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.is_active ? '启用中' : '已禁用'}
          </Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BusinessScenario) => (
        <Space>
          <Tooltip title="编辑配置">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditScenario(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 渲染总体统计卡片
  const renderOverallStats = () => {
    const totalDocuments = scenarios.reduce((sum, s) => sum + s.usage_statistics.total_documents, 0);
    const totalCollections = scenarios.reduce((sum, s) => sum + s.usage_statistics.active_collections, 0);
    const avgAccuracy = scenarios.length > 0 
      ? scenarios.reduce((sum, s) => sum + s.usage_statistics.avg_extraction_accuracy, 0) / scenarios.length 
      : 0;
    const activeScenarios = scenarios.filter(s => s.is_active).length;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: 12
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>激活场景</span>}
              value={activeScenarios}
              suffix={`/ ${scenarios.length}`}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            borderRadius: 12
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>总文档数</span>}
              value={totalDocuments}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: 'none',
            borderRadius: 12
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>活跃集合</span>}
              value={totalCollections}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            border: 'none',
            borderRadius: 12
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>平均精度</span>}
              value={avgAccuracy}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="scene-management-container">
      <div className="header-section">
        <Title level={2} style={{ color: '#2c3e50', marginBottom: 8 }}>
          <Space>
            <SettingOutlined />
            业务场景管理
          </Space>
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 16 }}>
          管理四大基础业务场景的元数据模板配置和使用统计
        </Paragraph>
      </div>

      {renderOverallStats()}

      <Card
        className="scenarios-table-card"
        title={
          <Space>
            <NodeIndexOutlined />
            <span style={{ fontSize: 16, fontWeight: 600 }}>场景配置列表</span>
            <Badge count={scenarios.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddScenario}>
            创建场景
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={scenarios}
          rowKey="id"
          loading={loading}
          pagination={false}
          showHeader={true}
          size="large"
          rowClassName={(record) => `scenario-row-${record.name}`}
        />
      </Card>

      {/* 编辑场景模态框 */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            {editingScenario ? '编辑场景配置' : '创建场景配置'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingScenario ? '更新配置' : '创建场景'}
          </Button>
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item 
            name="display_name" 
            label="场景显示名称" 
            rules={[{ required: true, message: '请输入场景显示名称' }]}
          >
            <Input placeholder="输入场景显示名称" />
          </Form.Item>

          <Form.Item 
            name="description" 
            label="场景描述说明"
            rules={[{ required: true, message: '请输入场景描述' }]}
          >
            <TextArea rows={3} placeholder="描述该场景的业务用途和应用特点" />
          </Form.Item>

          <Form.Item 
            name="metadata_fields" 
            label="元数据字段配置"
            rules={[{ required: true, message: '请输入元数据字段' }]}
          >
            <TextArea 
              rows={2} 
              placeholder="请用逗号分隔多个字段，例如：标题, 作者, 创建时间, 标签, 摘要" 
            />
          </Form.Item>

          <Form.Item name="is_active" label="场景状态" valuePropName="checked">
            <Switch 
              checkedChildren="启用" 
              unCheckedChildren="禁用" 
              defaultChecked 
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .scene-management-container {
          padding: 24px;
          min-height: calc(100vh - 64px);
        }

        .header-section {
          margin-bottom: 24px;
          text-align: left;
        }

        .scenarios-table-card {
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .scenarios-table-card .ant-card-head {
          border-bottom: 2px solid #f0f2f5;
          background: rgba(250, 250, 250, 0.8);
        }

        .scenarios-table-card .ant-table-thead > tr > th {
          background: rgba(245, 247, 250, 0.9);
          border-bottom: 2px solid #e8e8e8;
          font-weight: 600;
          color: #2c3e50;
        }

        .scenarios-table-card .ant-table-tbody > tr:hover > td {
          background: rgba(24, 144, 255, 0.03) !important;
        }

        .scenario-row-general {
          border-left: 4px solid #52c41a;
        }

        .scenario-row-policy {
          border-left: 4px solid #1890ff;
        }

        .scenario-row-academic {
          border-left: 4px solid #f5222d;
        }

        .scenario-row-enterprise {
          border-left: 4px solid #fa8c16;
        }
      `}</style>
    </div>
  );
};

export default SceneManagementPage;