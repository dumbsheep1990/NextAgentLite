/**
 * 问答路由页面 - 对指定的知识库进行指定问题的路由绑定
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Modal,
  Form,
  message,
  Divider,
  Tabs,
  Tree,
  Tooltip,
  Alert,
  Collapse,
  Switch,
  InputNumber,
  Rate
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
// 🔥 修复：改为静态导入，避免动态import触发SSE重连
import collectionService from '../../services/collectionService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface RoutingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  question_patterns: string[];
  target_collections: string[];
  target_agents: string[];
  conditions: {
    keywords?: string[];
    semantic_similarity?: number;
    language?: string;
    user_type?: string;
  };
  routing_strategy: 'collection_only' | 'agent_only' | 'hybrid';
  fallback_behavior: 'default_collection' | 'general_agent' | 'error_message';
  created_at: string;
  updated_at: string;
  usage_count: number;
  success_rate: number;
}

interface RoutingLog {
  id: string;
  rule_id: string;
  rule_name: string;
  question: string;
  matched_pattern: string;
  routed_to: string;
  routing_type: 'collection' | 'agent' | 'hybrid';
  response_time: number;
  success: boolean;
  timestamp: string;
  user_id?: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  document_count: number;
  specialty: string[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'single' | 'team';
  specialty: string[];
}

const QARoutingPage: React.FC = () => {
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [routingLogs, setRoutingLogs] = useState<RoutingLog[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RoutingRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();

  // 加载路由规则列表
  const loadRoutingRules = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取路由规则列表
      // const response = await qaRoutingService.getRules();
      // setRoutingRules(response.data);
      
      // 暂时设置为空数组，等待API接入
      setRoutingRules([]);
    } catch (error) {
      message.error('加载路由规则失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载路由日志
  const loadRoutingLogs = async () => {
    try {
      // TODO: 调用API获取路由日志
      // const response = await qaRoutingService.getLogs();
      // setRoutingLogs(response.data);
      
      // 暂时设置为空数组，等待API接入
      setRoutingLogs([]);
    } catch (error) {
      message.error('加载路由日志失败');
    }
  };

  // 加载Collection和Agent列表
  const loadResources = async () => {
    try {
      // 🔥 修复：直接使用静态导入的collectionService，避免动态import触发SSE重连
      console.log('📚 [QARouting] 开始加载知识库列表');
      const result = await collectionService.getCollections({ page: 1, size: 100, status: 'all' });
      const collectionsData = (result.collections || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        document_count: c.document_count || 0,
        specialty: [] // 可以从metadata或其他字段提取
      }));

      console.log('📚 [QARouting] 成功加载知识库列表:', collectionsData.length, '个');
      setCollections(collectionsData);

      // TODO: 加载Agent列表
      // const agentsResponse = await agentService.getAgents();
      // setAgents(agentsResponse.data);
      setAgents([]);
    } catch (error: any) {
      console.error('❌ [QARouting] 加载资源列表失败:', error);
      message.error(error?.message || '加载知识库失败: 未获取到知识库列表');
    }
  };

  useEffect(() => {
    loadRoutingRules();
    loadRoutingLogs();
    loadResources();
  }, []);

  // （已移除）自定义问答Tab，保持页面职能专一

  // 创建或编辑路由规则
  const handleSaveRule = async (values: any) => {
    try {
      if (selectedRule) {
        // 编辑模式
        // await qaRoutingService.updateRule(selectedRule.id, values);
        message.success('路由规则更新成功');
        setEditModalVisible(false);
      } else {
        // 创建模式
        // await qaRoutingService.createRule(values);
        message.success('路由规则创建成功');
        setCreateModalVisible(false);
      }
      form.resetFields();
      setSelectedRule(null);
      loadRoutingRules();
    } catch (error) {
      message.error('保存路由规则失败');
    }
  };

  // 删除路由规则
  const handleDeleteRule = async (ruleId: string) => {
    try {
      // await qaRoutingService.deleteRule(ruleId);
      message.success('路由规则删除成功');
      loadRoutingRules();
    } catch (error) {
      message.error('删除路由规则失败');
    }
  };

  // 测试路由规则
  const handleTestRouting = async (values: any) => {
    try {
      // TODO: 调用API测试路由
      // const result = await qaRoutingService.testRouting(values.question);
      
      message.info('路由测试功能待API接入后实现');
      testForm.resetFields();
      setTestModalVisible(false);
    } catch (error) {
      message.error('路由测试失败');
    }
  };

  // 切换规则启用状态
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      // await qaRoutingService.toggleRule(ruleId, enabled);
      message.success(`路由规则已${enabled ? '启用' : '禁用'}`);
      loadRoutingRules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 路由规则表格列定义
  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (text: string, record: RoutingRule) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            优先级: {record.priority}
          </Text>
        </Space>
      )
    },
    {
      title: '问题模式',
      dataIndex: 'question_patterns',
      key: 'question_patterns',
      width: '25%',
      render: (patterns: string[]) => (
        <div>
          {patterns.slice(0, 2).map((pattern, index) => (
            <Tag key={index} style={{ marginBottom: '4px', fontSize: '11px' }}>
              {pattern.length > 20 ? `${pattern.substring(0, 20)}...` : pattern}
            </Tag>
          ))}
          {patterns.length > 2 && (
            <Tooltip title={patterns.slice(2).join(', ')}>
              <Tag>+{patterns.length - 2} 更多</Tag>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '路由策略',
      dataIndex: 'routing_strategy',
      key: 'routing_strategy',
      render: (strategy: string) => {
        const strategyConfig = {
          'collection_only': { color: 'blue', text: '仅知识库' },
          'agent_only': { color: 'green', text: '仅智能体' },
          'hybrid': { color: 'purple', text: '混合模式' }
        };
        const config = strategyConfig[strategy as keyof typeof strategyConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '使用统计',
      key: 'stats',
      render: (_, record: RoutingRule) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            使用次数: {record.usage_count}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            成功率: {(record.success_rate * 100).toFixed(1)}%
          </Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: RoutingRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: RoutingRule) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedRule(record);
              form.setFieldsValue({
                ...record,
                question_patterns: record.question_patterns.join('\n')
              });
              setEditModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => {
              form.setFieldsValue({
                ...record,
                name: `${record.name}_副本`,
                question_patterns: record.question_patterns.join('\n')
              });
              setSelectedRule(null);
              setCreateModalVisible(true);
            }}
          >
            复制
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个路由规则吗？',
                onOk: () => handleDeleteRule(record.id)
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 路由日志表格列定义
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      width: '30%',
      render: (text: string) => (
        <Tooltip title={text}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </Tooltip>
      )
    },
    {
      title: '匹配规则',
      dataIndex: 'rule_name',
      key: 'rule_name'
    },
    {
      title: '路由目标',
      dataIndex: 'routed_to',
      key: 'routed_to',
      render: (text: string, record: RoutingLog) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{text}</Text>
          <Tag color={record.routing_type === 'hybrid' ? 'purple' : 
                     record.routing_type === 'collection' ? 'blue' : 'green'}>
            {record.routing_type === 'hybrid' ? '混合' : 
             record.routing_type === 'collection' ? '知识库' : '智能体'}
          </Tag>
        </Space>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'response_time',
      key: 'response_time',
      render: (time: number) => `${time.toFixed(2)}s`
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>问答路由管理</Title>
        <Text type="secondary">
          配置智能路由规则，将不同类型的问题自动分发到最合适的知识库和智能体
        </Text>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card 
            style={{ height: '120px' }}
            bodyStyle={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div style={{ textAlign: 'center', width: '100%' }}>
              <BranchesOutlined style={{ fontSize: '28px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {routingRules.length}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>路由规则</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            style={{ height: '120px' }}
            bodyStyle={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div style={{ textAlign: 'center', width: '100%' }}>
              <ThunderboltOutlined style={{ fontSize: '28px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {routingRules.filter(r => r.enabled).length}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>启用规则</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            style={{ height: '120px' }}
            bodyStyle={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div style={{ textAlign: 'center', width: '100%' }}>
              <QuestionCircleOutlined style={{ fontSize: '28px', color: '#fa8c16', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {routingRules.reduce((sum, r) => sum + r.usage_count, 0)}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>路由次数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            style={{ height: '120px' }}
            bodyStyle={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div style={{ textAlign: 'center', width: '100%' }}>
              <Rate
                disabled
                value={routingRules.length > 0 ? 
                  routingRules.reduce((sum, r) => sum + r.success_rate, 0) / routingRules.length * 5 : 0
                }
                style={{ fontSize: '16px', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                {routingRules.length > 0 ? 
                  (routingRules.reduce((sum, r) => sum + r.success_rate, 0) / routingRules.length * 100).toFixed(1) : 0}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>平均成功率</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建路由规则
            </Button>
            <Button
              icon={<SearchOutlined />}
              onClick={() => setTestModalVisible(true)}
            >
              测试路由
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadRoutingRules}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />}>导出配置</Button>
            <Button icon={<ImportOutlined />}>导入配置</Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="路由规则" key="rules">
            <Table
              columns={ruleColumns}
              dataSource={routingRules}
              rowKey="id"
              loading={loading}
              locale={{
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <BranchesOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                    <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>暂无路由规则</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>
                      点击"创建路由规则"开始配置智能路由
                    </div>
                  </div>
                )
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条规则`
              }}
            />
          </TabPane>
          <TabPane tab="路由日志" key="logs">
            <Table
              columns={logColumns}
              dataSource={routingLogs}
              rowKey="id"
              locale={{
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <QuestionCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                    <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>暂无路由日志</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>
                      当有问题通过路由规则处理时，日志将在此显示
                    </div>
                  </div>
                )
              }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条日志`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑路由规则模态框 */}
      <Modal
        title={selectedRule ? '编辑路由规则' : '创建路由规则'}
        open={createModalVisible || editModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setEditModalVisible(false);
          setSelectedRule(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRule}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="输入路由规则名称" />
          </Form.Item>

          <Form.Item name="description" label="规则描述">
            <TextArea rows={2} placeholder="描述此路由规则的用途和逻辑" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请设置优先级' }]}
                initialValue={1}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="启用状态"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="question_patterns"
            label="问题模式"
            rules={[{ required: true, message: '请输入问题匹配模式' }]}
            extra="每行一个正则表达式，用于匹配问题文本"
          >
            <TextArea
              rows={4}
              placeholder="例如：&#10;.*技术.*文档.*&#10;.*如何.*配置.*&#10;.*API.*接口.*"
            />
          </Form.Item>

          <Form.Item
            name="routing_strategy"
            label="路由策略"
            rules={[{ required: true, message: '请选择路由策略' }]}
          >
            <Select>
              <Option value="collection_only">仅路由到知识库</Option>
              <Option value="agent_only">仅路由到智能体</Option>
              <Option value="hybrid">混合模式（知识库+智能体）</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target_collections"
            label="目标知识库"
            extra="选择匹配此规则的问题应该路由到的知识库"
          >
            <Select
              mode="multiple"
              placeholder="选择目标知识库"
              optionLabelProp="children"
            >
              {collections.map(col => (
                <Option key={col.id} value={col.id}>
                  <Space>
                    <DatabaseOutlined />
                    {col.name}
                    <Text type="secondary">({col.document_count} 文档)</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="target_agents"
            label="目标智能体"
            extra="选择匹配此规则的问题应该路由到的智能体"
          >
            <Select
              mode="multiple"
              placeholder="选择目标智能体"
              optionLabelProp="children"
            >
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  <Space>
                    <RobotOutlined />
                    {agent.name}
                    <Tag color={agent.type === 'team' ? 'blue' : 'green'}>
                      {agent.type === 'team' ? '团队' : '单体'}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Collapse>
            <Panel header="高级条件设置" key="advanced">
              <Form.Item name={['conditions', 'keywords']} label="关键词">
                <Select
                  mode="tags"
                  placeholder="输入关键词，按回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name={['conditions', 'semantic_similarity']}
                label="语义相似度阈值"
                extra="0-1之间，越高越严格"
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item name={['conditions', 'language']} label="语言限制">
                <Select allowClear placeholder="选择语言">
                  <Option value="zh">中文</Option>
                  <Option value="en">英文</Option>
                </Select>
              </Form.Item>

              <Form.Item name="fallback_behavior" label="回退行为">
                <Select>
                  <Option value="default_collection">使用默认知识库</Option>
                  <Option value="general_agent">使用通用智能体</Option>
                  <Option value="error_message">返回错误信息</Option>
                </Select>
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      </Modal>

      {/* 路由测试模态框 */}
      <Modal
        title="测试问答路由"
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          testForm.resetFields();
        }}
        onOk={() => testForm.submit()}
        width={600}
      >
        <Form
          form={testForm}
          layout="vertical"
          onFinish={handleTestRouting}
        >
          <Alert
            message="路由测试"
            description="输入一个问题，系统会模拟路由过程并显示匹配的规则和目标"
            type="info"
            style={{ marginBottom: '16px' }}
          />
          
          <Form.Item
            name="question"
            label="测试问题"
            rules={[{ required: true, message: '请输入测试问题' }]}
          >
            <TextArea
              rows={3}
              placeholder="输入要测试的问题，例如：如何通过API获取数据？"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QARoutingPage;
