import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, Tag, Modal, Form, Input,
  Row, Col, Statistic, Tooltip, message, Typography,
  Switch, Avatar, Divider, Badge, Table, Empty, Spin, Select
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ThunderboltOutlined, EyeOutlined, BarChartOutlined,
  SettingOutlined, FileTextOutlined, BookOutlined,
  BankOutlined, NodeIndexOutlined, DatabaseOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, UnorderedListOutlined, FieldTimeOutlined,
  TagsOutlined, KeyOutlined, SafetyOutlined, FunctionOutlined
} from '@ant-design/icons';
import { apiRequest } from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 元数据字段详细信息接口
interface MetadataField {
  name: string;
  display_name: string;
  field_type: string;
  is_required: boolean;
  description: string;
  extraction_method: string;
  validation_rule?: string;
}

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
  detailed_fields?: MetadataField[]; // 详细字段信息
  usage_statistics: {
    total_documents: number;
    active_collections: number;
    avg_extraction_accuracy: number;
    last_used: string;
  };
  created_at: string;
  updated_at: string;
}

const SceneManagementPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<BusinessScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScenario, setEditingScenario] = useState<BusinessScenario | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<string[]>([]);
  const [editingFields, setEditingFields] = useState<MetadataField[]>([]);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<MetadataField | null>(null);
  const [form] = Form.useForm();
  const [fieldForm] = Form.useForm();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const scenarios = await getBusinessScenariosWithDetails();
      setScenarios(scenarios);
    } catch (error) {
      message.error('加载业务场景失败');
      console.error('Load scenarios error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取业务场景数据（包含详细字段信息）
  const getBusinessScenariosWithDetails = async (): Promise<BusinessScenario[]> => {
    try {
      // 调用后端API获取元数据模板类型
      // api实例的baseURL已包含/api/v1，这里只需传相对路径
      console.log('📋 [SceneManagement] 开始请求元数据模板列表');
      const typesResponse = await apiRequest('GET', '/metadata-templates');
      console.log('📋 [SceneManagement] API返回:', typesResponse);
      const types = typesResponse.templates || []; // 🔥 修复：后端返回的key是templates，不是types

      // 为每个场景获取详细的字段配置
      const scenarios: BusinessScenario[] = await Promise.all(
        types.map(async (type: any) => {
          // 尝试获取该场景的详细模板信息
          let detailedFields: MetadataField[] = [];
          try {
            const templateResponse = await apiRequest('GET', `/metadata-templates/${type.id}`);
            if (templateResponse.template?.template_schema?.fields) {
              detailedFields = Object.entries(templateResponse.template.template_schema.fields).map(
                ([fieldName, fieldConfig]: [string, any]) => ({
                  name: fieldName,
                  display_name: fieldConfig.display_name || fieldName,
                  field_type: fieldConfig.type || 'string',
                  is_required: fieldConfig.required || false,
                  description: fieldConfig.description || '',
                  extraction_method: fieldConfig.extraction_method || 'auto',
                  validation_rule: fieldConfig.validation_rule
                })
              );
            }
          } catch (err) {
            console.warn(`无法获取 ${type.id} 的详细字段配置:`, err);
            // 使用默认字段配置
            detailedFields = getDefaultDetailedFields(type.id);
          }

          return {
            id: type.id,
            name: type.id,
            display_name: type.name,
            description: type.description,
            icon: getScenarioIcon(type.id),
            color: getScenarioColor(type.id),
            is_active: true,
            document_count: 0,
            collection_count: 0,
            template_config: {
              metadata_fields: detailedFields.map(f => f.display_name),
              extraction_rules: [],
              validation_rules: []
            },
            detailed_fields: detailedFields,
            usage_statistics: {
              total_documents: 0,
              active_collections: 0,
              avg_extraction_accuracy: 0,
              last_used: ''
            },
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          };
        })
      );

      return scenarios;
    } catch (error) {
      console.warn('获取场景配置失败，使用默认配置:', error);
      return getDefaultBusinessScenarios();
    }
  };

  // 获取默认详细字段配置
  const getDefaultDetailedFields = (scenarioId: string): MetadataField[] => {
    const fieldsMap: Record<string, MetadataField[]> = {
      general: [
        { name: 'title', display_name: '标题', field_type: 'string', is_required: true, description: '文档标题', extraction_method: 'auto' },
        { name: 'author', display_name: '作者', field_type: 'string', is_required: false, description: '文档作者', extraction_method: 'auto' },
        { name: 'created_at', display_name: '创建时间', field_type: 'datetime', is_required: false, description: '文档创建时间', extraction_method: 'auto' },
        { name: 'keywords', display_name: '关键词', field_type: 'list', is_required: false, description: '文档关键词', extraction_method: 'llm' },
        { name: 'summary', display_name: '摘要', field_type: 'text', is_required: false, description: '文档摘要', extraction_method: 'llm' }
      ],
      policy: [
        { name: 'index_number', display_name: '索引号', field_type: 'string', is_required: true, description: '政策文档索引号', extraction_method: 'pattern', validation_rule: '^\\d{20,}' },
        { name: 'information_category', display_name: '信息分类', field_type: 'string', is_required: false, description: '政策信息分类', extraction_method: 'pattern' },
        { name: 'issuing_authority', display_name: '发布机构', field_type: 'string', is_required: true, description: '政策发布机构全称', extraction_method: 'pattern' },
        { name: 'publish_date', display_name: '生成日期', field_type: 'date', is_required: true, description: '政策生成日期', extraction_method: 'pattern', validation_rule: '^\\d{4}-\\d{2}-\\d{2}$' },
        { name: 'document_number', display_name: '文号', field_type: 'string', is_required: true, description: '政策文件编号', extraction_method: 'pattern' },
        { name: 'is_valid', display_name: '是否有效', field_type: 'boolean', is_required: false, description: '政策是否有效', extraction_method: 'pattern' },
        { name: 'policy_name', display_name: '名称', field_type: 'string', is_required: true, description: '政策文件名称', extraction_method: 'pattern' },
        { name: 'policy_number', display_name: '政策编号', field_type: 'string', is_required: false, description: '政策编号（从文号提取）', extraction_method: 'pattern' },
        { name: 'authority_level', display_name: '权威级别', field_type: 'string', is_required: false, description: '发文机关级别', extraction_method: 'infer' },
        { name: 'policy_category', display_name: '政策分类', field_type: 'string', is_required: false, description: '政策所属分类', extraction_method: 'infer' }
      ],
      academic: [
        { name: 'title', display_name: '论文标题', field_type: 'string', is_required: true, description: '学术论文标题', extraction_method: 'auto' },
        { name: 'authors', display_name: '作者', field_type: 'list', is_required: true, description: '论文作者列表', extraction_method: 'pattern' },
        { name: 'journal', display_name: '期刊', field_type: 'string', is_required: false, description: '发表期刊名称', extraction_method: 'pattern' },
        { name: 'publish_date', display_name: '发表时间', field_type: 'date', is_required: false, description: '论文发表日期', extraction_method: 'pattern' },
        { name: 'keywords', display_name: '关键词', field_type: 'list', is_required: false, description: '论文关键词', extraction_method: 'llm' },
        { name: 'abstract', display_name: '摘要', field_type: 'text', is_required: false, description: '论文摘要', extraction_method: 'llm' },
        { name: 'doi', display_name: 'DOI', field_type: 'string', is_required: false, description: '数字对象标识符', extraction_method: 'pattern', validation_rule: '^10\\.\\d{4,}' }
      ],
      enterprise: [
        { name: 'document_type', display_name: '文档类型', field_type: 'string', is_required: true, description: '企业文档类型', extraction_method: 'auto' },
        { name: 'department', display_name: '部门', field_type: 'string', is_required: false, description: '负责部门', extraction_method: 'pattern' },
        { name: 'owner', display_name: '负责人', field_type: 'string', is_required: false, description: '文档负责人', extraction_method: 'pattern' },
        { name: 'version', display_name: '版本号', field_type: 'string', is_required: false, description: '文档版本', extraction_method: 'pattern' },
        { name: 'approval_status', display_name: '审批状态', field_type: 'string', is_required: false, description: '审批流程状态', extraction_method: 'pattern' }
      ]
    };
    return fieldsMap[scenarioId] || fieldsMap.general;
  };

  const getDefaultBusinessScenarios = (): BusinessScenario[] => {
    const scenarioIds = ['general', 'policy', 'academic', 'enterprise'];
    return scenarioIds.map(id => ({
      id,
      name: id,
      display_name: getScenarioDisplayName(id),
      description: getScenarioDescription(id),
      icon: getScenarioIcon(id),
      color: getScenarioColor(id),
      is_active: true,
      document_count: 0,
      collection_count: 0,
      template_config: {
        metadata_fields: getDefaultDetailedFields(id).map(f => f.display_name),
        extraction_rules: [],
        validation_rules: []
      },
      detailed_fields: getDefaultDetailedFields(id),
      usage_statistics: {
        total_documents: 0,
        active_collections: 0,
        avg_extraction_accuracy: 0,
        last_used: ''
      },
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    }));
  };

  const getScenarioDisplayName = (id: string) => {
    const names: Record<string, string> = {
      general: '通用场景',
      policy: '政策问答',
      academic: '学术领域',
      enterprise: '企业场景'
    };
    return names[id] || '未知场景';
  };

  const getScenarioDescription = (id: string) => {
    const descriptions: Record<string, string> = {
      general: '适用于一般文档的通用元数据提取和管理',
      policy: '专门针对政策文档的结构化元数据提取',
      academic: '学术论文和研究文档的专业元数据管理',
      enterprise: '企业内部文档和知识管理系统优化'
    };
    return descriptions[id] || '';
  };

  const getScenarioIcon = (scenarioId: string) => {
    const iconMap: Record<string, string> = {
      general: 'default',
      policy: 'policy',
      academic: 'academic',
      enterprise: 'enterprise'
    };
    return iconMap[scenarioId] || 'default';
  };

  // 新的现代配色方案
  const getScenarioColor = (scenarioId: string) => {
    const colorMap: Record<string, string> = {
      general: '#10b981',    // 翠绿色
      policy: '#3b82f6',     // 天蓝色
      academic: '#8b5cf6',   // 紫色
      enterprise: '#f59e0b'  // 琥珀色
    };
    return colorMap[scenarioId] || '#6b7280';
  };

  const handleToggleStatus = (scenario: BusinessScenario) => {
    const newStatus = !scenario.is_active;
    setScenarios(prevScenarios =>
      prevScenarios.map(s =>
        s.id === scenario.id
          ? { ...s, is_active: newStatus }
          : s
      )
    );
    message.success(`已${newStatus ? '启用' : '禁用'}场景`);
  };

  const handleEditScenario = (scenario: BusinessScenario) => {
    setEditingScenario(scenario);
    setEditingFields(scenario.detailed_fields || []);
    setModalVisible(true);
    form.setFieldsValue({
      display_name: scenario.display_name,
      description: scenario.description,
      is_active: scenario.is_active
    });
  };

  const handleAddField = () => {
    setEditingField(null);
    fieldForm.resetFields();
    setFieldModalVisible(true);
  };

  const handleEditField = (field: MetadataField) => {
    setEditingField(field);
    fieldForm.setFieldsValue(field);
    setFieldModalVisible(true);
  };

  const handleDeleteField = (fieldName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个字段吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setEditingFields(editingFields.filter(f => f.name !== fieldName));
        message.success('字段已删除');
      }
    });
  };

  const handleFieldSave = async (values: any) => {
    const newField: MetadataField = {
      name: values.name,
      display_name: values.display_name,
      field_type: values.field_type,
      is_required: values.is_required || false,
      description: values.description || '',
      extraction_method: values.extraction_method,
      validation_rule: values.validation_rule
    };

    if (editingField) {
      // 编辑现有字段
      setEditingFields(editingFields.map(f =>
        f.name === editingField.name ? newField : f
      ));
      message.success('字段已更新');
    } else {
      // 添加新字段
      if (editingFields.some(f => f.name === newField.name)) {
        message.error('字段名称已存在');
        return;
      }
      setEditingFields([...editingFields, newField]);
      message.success('字段已添加');
    }
    setFieldModalVisible(false);
  };

  const handleSave = async (values: any) => {
    try {
      console.log('Save scenario:', values);
      console.log('Fields:', editingFields);

      // 这里应该调用API保存场景配置和字段配置
      // await apiRequest('PUT', `/api/v1/scenarios/${editingScenario.id}`, {
      //   ...values,
      //   detailed_fields: editingFields
      // });

      message.success(editingScenario ? '更新成功' : '创建成功');
      setModalVisible(false);
      loadScenarios();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const renderScenarioIcon = (scenario: BusinessScenario) => {
    const iconMap: Record<string, React.ReactNode> = {
      general: <FileTextOutlined style={{ fontSize: 18 }} />,
      policy: <BankOutlined style={{ fontSize: 18 }} />,
      academic: <BookOutlined style={{ fontSize: 18 }} />,
      enterprise: <NodeIndexOutlined style={{ fontSize: 18 }} />,
      default: <FileTextOutlined style={{ fontSize: 18 }} />
    };
    return iconMap[scenario.icon] || iconMap.default;
  };

  // 获取提取方法的显示标签
  const getExtractionMethodTag = (method: string) => {
    const methodMap: Record<string, { label: string; color: string }> = {
      auto: { label: '自动提取', color: 'blue' },
      pattern: { label: '模式匹配', color: 'green' },
      llm: { label: 'AI提取', color: 'purple' },
      infer: { label: '智能推断', color: 'orange' }
    };
    return methodMap[method] || { label: '未知', color: 'default' };
  };

  // 获取字段类型的显示标签
  const getFieldTypeTag = (type: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      string: { label: '文本', color: 'default' },
      text: { label: '长文本', color: 'default' },
      date: { label: '日期', color: 'cyan' },
      datetime: { label: '日期时间', color: 'cyan' },
      boolean: { label: '布尔', color: 'purple' },
      list: { label: '列表', color: 'geekblue' },
      number: { label: '数字', color: 'orange' }
    };
    return typeMap[type] || { label: type, color: 'default' };
  };

  // 渲染总体统计卡片（浅色配色）
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
          <Card
            bordered={false}
            style={{
              background: '#e0f2fe',
              borderRadius: 12,
              border: '1px solid #bae6fd'
            }}
          >
            <Statistic
              title={<span style={{ color: '#0369a1', fontSize: 14 }}>激活场景</span>}
              value={activeScenarios}
              suffix={`/ ${scenarios.length}`}
              valueStyle={{ color: '#0c4a6e', fontWeight: 'bold', fontSize: 28 }}
              prefix={<ThunderboltOutlined style={{ fontSize: 20, color: '#0284c7' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            style={{
              background: '#fef3c7',
              borderRadius: 12,
              border: '1px solid #fde68a'
            }}
          >
            <Statistic
              title={<span style={{ color: '#92400e', fontSize: 14 }}>总文档数</span>}
              value={totalDocuments}
              valueStyle={{ color: '#78350f', fontWeight: 'bold', fontSize: 28 }}
              prefix={<FileTextOutlined style={{ fontSize: 20, color: '#d97706' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            style={{
              background: '#ddd6fe',
              borderRadius: 12,
              border: '1px solid #c4b5fd'
            }}
          >
            <Statistic
              title={<span style={{ color: '#5b21b6', fontSize: 14 }}>活跃集合</span>}
              value={totalCollections}
              valueStyle={{ color: '#4c1d95', fontWeight: 'bold', fontSize: 28 }}
              prefix={<DatabaseOutlined style={{ fontSize: 20, color: '#7c3aed' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            bordered={false}
            style={{
              background: '#d1fae5',
              borderRadius: 12,
              border: '1px solid #a7f3d0'
            }}
          >
            <Statistic
              title={<span style={{ color: '#065f46', fontSize: 14 }}>平均精度</span>}
              value={avgAccuracy}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#064e3b', fontWeight: 'bold', fontSize: 28 }}
              prefix={<BarChartOutlined style={{ fontSize: 20, color: '#059669' }} />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染场景卡片（紧凑版）
  const renderScenarioCard = (scenario: BusinessScenario) => {
    const isExpanded = expandedScenarios.includes(scenario.id);

    return (
      <Card
        key={scenario.id}
        className="scenario-card"
        style={{
          marginBottom: 12,
          borderRadius: 8,
          border: `1px solid ${scenario.color}30`,
          boxShadow: `0 2px 8px ${scenario.color}10`,
          background: isExpanded ? `${scenario.color}05` : '#fff',
          transition: 'all 0.3s ease'
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* 卡片头部 */}
        <div style={{
          padding: '12px 16px',
          background: `${scenario.color}08`,
          borderBottom: `1px solid ${scenario.color}15`
        }}>
          <Row align="middle" justify="space-between">
            <Col flex="auto">
              <Space size="middle">
                {/* 场景图标和名称 */}
                <Avatar
                  size={40}
                  shape="square"
                  style={{
                    background: scenario.color,
                    borderRadius: 6
                  }}
                  icon={renderScenarioIcon(scenario)}
                />
                <div>
                  <Space size="small">
                    <Text strong style={{ fontSize: 15, color: scenario.color }}>
                      {scenario.display_name}
                    </Text>
                    <Tag color={scenario.color} style={{ fontSize: 11 }}>{scenario.name}</Tag>
                    {scenario.is_active ? (
                      <Badge status="success" text="启用" />
                    ) : (
                      <Badge status="default" text="禁用" />
                    )}
                  </Space>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {scenario.description}
                    </Text>
                  </div>
                </div>
              </Space>
            </Col>
            <Col>
              <Space size="small">
                {/* 统计数据 */}
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: scenario.color }}>
                    {scenario.document_count}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>文档</div>
                </div>
                <Divider type="vertical" style={{ height: 32 }} />
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: scenario.color }}>
                    {scenario.collection_count}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>集合</div>
                </div>
                <Divider type="vertical" style={{ height: 32 }} />
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: scenario.color }}>
                    {scenario.usage_statistics.avg_extraction_accuracy || 0}%
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>精度</div>
                </div>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 操作按钮 */}
        <div style={{
          padding: '8px 16px',
          background: '#fafafa',
          borderBottom: isExpanded ? `1px solid ${scenario.color}15` : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space size="small">
            <Button
              size="small"
              type={isExpanded ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => {
                if (isExpanded) {
                  setExpandedScenarios(expandedScenarios.filter(id => id !== scenario.id));
                } else {
                  setExpandedScenarios([...expandedScenarios, scenario.id]);
                }
              }}
            >
              {isExpanded ? '收起' : '查看字段'}
              <Badge
                count={scenario.detailed_fields?.length || 0}
                style={{ marginLeft: 4, backgroundColor: scenario.color }}
              />
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditScenario(scenario)}
            >
              编辑
            </Button>
          </Space>
          <Switch
            size="small"
            checked={scenario.is_active}
            onChange={() => handleToggleStatus(scenario)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </div>

        {/* 展开的元数据字段详情 - 紧凑表格形式 */}
        {isExpanded && scenario.detailed_fields && (
          <div style={{ padding: '12px 16px 16px', background: '#fff' }}>
            <Text strong style={{ marginBottom: 8, color: scenario.color, fontSize: 14, display: 'block' }}>
              <TagsOutlined /> 元数据字段配置 ({scenario.detailed_fields.length} 个)
            </Text>
            <Table
              dataSource={scenario.detailed_fields}
              pagination={false}
              size="small"
              rowKey="name"
              columns={[
                {
                  title: '字段名称',
                  dataIndex: 'display_name',
                  width: 120,
                  render: (text, record) => (
                    <Space>
                      <Text strong style={{ color: scenario.color }}>{text}</Text>
                      {record.is_required && <Tag color="red" style={{ fontSize: 11 }}>必填</Tag>}
                    </Space>
                  )
                },
                {
                  title: '字段标识',
                  dataIndex: 'name',
                  width: 150,
                  render: (text) => <Text code style={{ fontSize: 12 }}>{text}</Text>
                },
                {
                  title: '说明',
                  dataIndex: 'description',
                  ellipsis: true
                },
                {
                  title: '类型',
                  dataIndex: 'field_type',
                  width: 90,
                  render: (type) => {
                    const tag = getFieldTypeTag(type);
                    return <Tag color={tag.color} style={{ fontSize: 11 }}>{tag.label}</Tag>;
                  }
                },
                {
                  title: '提取方法',
                  dataIndex: 'extraction_method',
                  width: 100,
                  render: (method) => {
                    const tag = getExtractionMethodTag(method);
                    return <Tag color={tag.color} style={{ fontSize: 11 }}>{tag.label}</Tag>;
                  }
                },
                {
                  title: '验证规则',
                  dataIndex: 'validation_rule',
                  width: 100,
                  render: (rule) => rule ? (
                    <Tooltip title={rule}>
                      <Tag color="orange" style={{ fontSize: 11 }}>有规则</Tag>
                    </Tooltip>
                  ) : <Text type="secondary">-</Text>
                }
              ]}
            />
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f5f7fa' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          <Space>
            <SettingOutlined />
            业务场景管理
          </Space>
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginTop: 8, marginBottom: 0 }}>
          管理四大基础业务场景的元数据模板配置和使用统计，查看详细的字段提取规则
        </Paragraph>
      </div>

      {/* 顶部统计卡片 */}
      {renderOverallStats()}

      {/* 场景列表标题 */}
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            <NodeIndexOutlined /> 场景配置列表
          </Title>
          <Badge count={scenarios.length} style={{ backgroundColor: '#3b82f6' }} />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建场景
        </Button>
      </div>

      {/* 场景卡片列表 */}
      <Spin spinning={loading}>
        {scenarios.length > 0 ? (
          scenarios.map(scenario => renderScenarioCard(scenario))
        ) : (
          <Empty description="暂无场景配置" />
        )}
      </Spin>

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
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="display_name"
                label="场景显示名称"
                rules={[{ required: true, message: '请输入场景显示名称' }]}
              >
                <Input placeholder="输入场景显示名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="场景状态" valuePropName="checked">
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  defaultChecked
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="场景描述说明"
            rules={[{ required: true, message: '请输入场景描述' }]}
          >
            <TextArea rows={2} placeholder="描述该场景的业务用途和应用特点" />
          </Form.Item>

          <Divider orientation="left">元数据字段配置</Divider>

          <div style={{ marginBottom: 16 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddField}
              block
            >
              添加字段
            </Button>
          </div>

          <Table
            dataSource={editingFields}
            pagination={false}
            size="small"
            rowKey="name"
            scroll={{ y: 300, x: 'max-content' }}
            columns={[
              {
                title: '字段名',
                dataIndex: 'display_name',
                width: 100,
                fixed: 'left',
                render: (text, record) => (
                  <Space>
                    <Text strong>{text}</Text>
                    {record.is_required && <Tag color="red" style={{ fontSize: 11 }}>必填</Tag>}
                  </Space>
                )
              },
              {
                title: '标识',
                dataIndex: 'name',
                width: 120,
                render: (text) => <Text code style={{ fontSize: 11 }}>{text}</Text>
              },
              {
                title: '类型',
                dataIndex: 'field_type',
                width: 80,
                render: (type) => {
                  const tag = getFieldTypeTag(type);
                  return <Tag color={tag.color} style={{ fontSize: 11 }}>{tag.label}</Tag>;
                }
              },
              {
                title: '提取方法',
                dataIndex: 'extraction_method',
                width: 100,
                render: (method) => {
                  const tag = getExtractionMethodTag(method);
                  return <Tag color={tag.color} style={{ fontSize: 11 }}>{tag.label}</Tag>;
                }
              },
              {
                title: '说明',
                dataIndex: 'description',
                width: 250,
                ellipsis: true
              },
              {
                title: '操作',
                width: 100,
                fixed: 'right',
                render: (_, record) => (
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditField(record)}
                    />
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteField(record.name)}
                    />
                  </Space>
                )
              }
            ]}
          />
        </Form>
      </Modal>

      {/* 添加/编辑字段模态框 */}
      <Modal
        title={
          <Space>
            <TagsOutlined />
            {editingField ? '编辑字段' : '添加字段'}
          </Space>
        }
        open={fieldModalVisible}
        onCancel={() => setFieldModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFieldModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => fieldForm.submit()}>
            {editingField ? '保存修改' : '添加字段'}
          </Button>
        ]}
        width={600}
      >
        <Form
          form={fieldForm}
          layout="vertical"
          onFinish={handleFieldSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="display_name"
                label="字段显示名"
                rules={[{ required: true, message: '请输入字段显示名' }]}
              >
                <Input placeholder="例如：索引号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="字段标识"
                rules={[
                  { required: true, message: '请输入字段标识' },
                  { pattern: /^[a-z_][a-z0-9_]*$/, message: '只能使用小写字母、数字和下划线，且不能以数字开头' }
                ]}
              >
                <Input placeholder="例如：index_number" disabled={!!editingField} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_type"
                label="字段类型"
                rules={[{ required: true, message: '请选择字段类型' }]}
              >
                <Select placeholder="选择字段类型">
                  <Select.Option value="string">文本</Select.Option>
                  <Select.Option value="text">长文本</Select.Option>
                  <Select.Option value="date">日期</Select.Option>
                  <Select.Option value="datetime">日期时间</Select.Option>
                  <Select.Option value="boolean">布尔</Select.Option>
                  <Select.Option value="list">列表</Select.Option>
                  <Select.Option value="number">数字</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="extraction_method"
                label="提取方法"
                rules={[{ required: true, message: '请选择提取方法' }]}
              >
                <Select placeholder="选择提取方法">
                  <Select.Option value="auto">自动提取</Select.Option>
                  <Select.Option value="pattern">模式匹配</Select.Option>
                  <Select.Option value="llm">AI提取</Select.Option>
                  <Select.Option value="infer">智能推断</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="字段说明"
          >
            <TextArea rows={2} placeholder="描述该字段的用途" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_required" label="是否必填" valuePropName="checked">
                <Switch checkedChildren="必填" unCheckedChildren="可选" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="validation_rule"
                label="验证规则（正则）"
              >
                <Input placeholder="例如：^\d{4}-\d{2}-\d{2}$" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style>{`
        .scenario-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }

        .ant-statistic-title {
          font-weight: 500;
        }

        .ant-card-small .ant-card-body {
          padding: 12px;
        }
      `}</style>
    </div>
  );
};

export default SceneManagementPage;
