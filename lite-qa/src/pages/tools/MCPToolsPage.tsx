/**
 * MCP工具管理页面
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Drawer,
  Descriptions,
  Badge,
  Statistic,
  Row,
  Col,
  Tabs,
  Timeline,
  Progress,
  Tooltip,
  Popconfirm,
  Empty,
  Alert,
  Switch,
  Spin
} from 'antd';
import {
  ToolOutlined,
  CloudServerOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SearchOutlined,
  FileTextOutlined,
  BugOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 类型定义
interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  server_type: 'external' | 'internal' | 'virtual';
  transport_type: 'stdio' | 'http' | 'sse' | 'websocket';
  is_enabled: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  last_health_check?: string;
  created_at: string;
}

interface MCPTool {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  tags: string[];
  schema: any;
  usage_count: number;
  last_used_at?: string;
  is_enabled: boolean;
}

interface SystemStatus {
  gateway_status: string;
  total_servers: number;
  active_servers: number;
  total_tools: number;
  active_tools: number;
  recent_calls: number;
  avg_response_time: number;
}

interface ToolCallHistory {
  id: string;
  tool_name: string;
  session_id?: string;
  call_status: 'success' | 'error' | 'pending' | 'timeout';
  duration_ms?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

const MCPToolsPage: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('tools');
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [serversLoading, setServersLoading] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);
  
  // 模态框和抽屉状态
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [toolDetailDrawerVisible, setToolDetailDrawerVisible] = useState(false);
  const [serverDetailDrawerVisible, setServerDetailDrawerVisible] = useState(false);
  const [toolCallDrawerVisible, setToolCallDrawerVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [toolCallHistory, setToolCallHistory] = useState<ToolCallHistory[]>([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 表单
  const [serverForm] = Form.useForm();
  const [toolCallForm] = Form.useForm();

  // 工具调用状态
  const [toolCallLoading, setToolCallLoading] = useState(false);
  const [toolCallResult, setToolCallResult] = useState<any>(null);

  // 初始化数据
  useEffect(() => {
    checkMCPServiceAvailability();
  }, []);

  // 检查MCP服务可用性
  const checkMCPServiceAvailability = async () => {
    try {
      const response = await fetch('/api/mcp/health');
      if (response.ok) {
        setInitialized(true);
        loadSystemStatus();
        loadServers();
        loadTools();
      } else {
        // MCP服务未初始化，显示初始化按钮
        setInitialized(false);
      }
    } catch (error) {
      console.error('检查MCP服务可用性失败:', error);
      setInitialized(false);
    }
  };

  // API调用函数
  const api = {
    // 初始化MCP服务
    async initialize() {
      const response = await fetch('/api/mcp/initialize', { method: 'POST' });
      return response.json();
    },

    // 获取系统状态
    async getSystemStatus() {
      const response = await fetch('/api/mcp/status');
      return response.json();
    },

    // 服务器管理
    async getServers() {
      const response = await fetch('/api/mcp/servers');
      return response.json();
    },

    async registerServer(data: any) {
      const response = await fetch('/api/mcp/servers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    async deleteServer(serverId: string) {
      const response = await fetch(`/api/mcp/servers/${serverId}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // 工具管理
    async getTools(category?: string) {
      const url = category ? `/api/mcp/tools?category=${category}` : '/api/mcp/tools';
      const response = await fetch(url);
      return response.json();
    },

    async callTool(data: any) {
      const response = await fetch('/api/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    async getToolCallHistory(toolId: string) {
      const response = await fetch(`/api/mcp/tools/${toolId}/calls`);
      return response.json();
    },

    // 同步操作
    async syncAll() {
      const response = await fetch('/api/mcp/sync', { method: 'POST' });
      return response.json();
    }
  };

  // 初始化MCP服务
  const initializeMCPService = async () => {
    try {
      setLoading(true);
      await api.initialize();
      message.success('MCP服务初始化成功');
      setInitialized(true);
      // 初始化成功后加载数据
      loadSystemStatus();
      loadServers();
      loadTools();
    } catch (error) {
      console.error('初始化MCP服务失败:', error);
      message.error('MCP服务初始化失败');
      setInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  // 加载系统状态
  const loadSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('加载系统状态失败:', error);
    }
  };

  // 加载服务器列表
  const loadServers = async () => {
    try {
      setServersLoading(true);
      const serverList = await api.getServers();
      setServers(serverList);
    } catch (error) {
      console.error('加载服务器列表失败:', error);
      message.error('加载服务器列表失败');
    } finally {
      setServersLoading(false);
    }
  };

  // 加载工具列表
  const loadTools = async (category?: string) => {
    try {
      setToolsLoading(true);
      const toolList = await api.getTools(category);
      setTools(toolList);
    } catch (error) {
      console.error('加载工具列表失败:', error);
      message.error('加载工具列表失败');
    } finally {
      setToolsLoading(false);
    }
  };

  // 注册服务器
  const handleRegisterServer = async (values: any) => {
    try {
      await api.registerServer(values);
      message.success('服务器注册成功');
      setServerModalVisible(false);
      serverForm.resetFields();
      loadServers();
    } catch (error) {
      console.error('注册服务器失败:', error);
      message.error('注册服务器失败');
    }
  };

  // 删除服务器
  const handleDeleteServer = async (serverId: string) => {
    try {
      await api.deleteServer(serverId);
      message.success('服务器删除成功');
      loadServers();
    } catch (error) {
      console.error('删除服务器失败:', error);
      message.error('删除服务器失败');
    }
  };

  // 调用工具
  const handleCallTool = async (values: any) => {
    try {
      setToolCallLoading(true);
      const result = await api.callTool({
        tool_name: selectedTool?.name,
        arguments: JSON.parse(values.arguments),
        session_id: values.session_id
      });
      setToolCallResult(result);
      
      if (result.success) {
        message.success('工具调用成功');
      } else {
        message.error(`工具调用失败: ${result.error}`);
      }
    } catch (error) {
      console.error('调用工具失败:', error);
      message.error('调用工具失败');
    } finally {
      setToolCallLoading(false);
    }
  };

  // 查看工具调用历史
  const handleViewToolHistory = async (tool: MCPTool) => {
    try {
      setCallHistoryLoading(true);
      const history = await api.getToolCallHistory(tool.id);
      setToolCallHistory(history);
      setSelectedTool(tool);
      setToolCallDrawerVisible(true);
    } catch (error) {
      console.error('加载调用历史失败:', error);
      message.error('加载调用历史失败');
    } finally {
      setCallHistoryLoading(false);
    }
  };

  // 同步所有工具和资源
  const handleSyncAll = async () => {
    try {
      setLoading(true);
      await api.syncAll();
      message.success('同步任务已启动');
      setTimeout(() => {
        loadSystemStatus();
        loadServers();
        loadTools();
      }, 2000);
    } catch (error) {
      console.error('同步失败:', error);
      message.error('同步失败');
    } finally {
      setLoading(false);
    }
  };

  // 服务器表格列定义
  const serverColumns: ColumnsType<MCPServer> = [
    {
      title: '服务器名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text, record) => (
        <Space>
          <CloudServerOutlined />
          <span>{text}</span>
          <Text type="secondary">({record.name})</Text>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'server_type',
      key: 'server_type',
      render: (type) => {
        const colors = {
          internal: 'blue',
          external: 'green',
          virtual: 'purple'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: '传输方式',
      dataIndex: 'transport_type',
      key: 'transport_type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: '健康状态',
      dataIndex: 'health_status',
      key: 'health_status',
      render: (status) => {
        const statusConfig = {
          healthy: { color: 'success', icon: <CheckCircleOutlined />, text: '健康' },
          unhealthy: { color: 'error', icon: <ExclamationCircleOutlined />, text: '异常' },
          unknown: { color: 'default', icon: <ClockCircleOutlined />, text: '未知' }
        };
        const config = statusConfig[status] || statusConfig.unknown;
        return (
          <Badge 
            status={config.color} 
            text={
              <Space>
                {config.icon}
                {config.text}
              </Space>
            }
          />
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled) => (
        <Switch checked={enabled} disabled size="small" />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => {
              setSelectedServer(record);
              setServerDetailDrawerVisible(true);
            }}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要删除这个服务器吗？"
            onConfirm={() => handleDeleteServer(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 工具表格列定义
  const toolColumns: ColumnsType<MCPTool> = [
    {
      title: '工具名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text, record) => (
        <Space>
          <ToolOutlined />
          <span>{text}</span>
          <Text type="secondary">({record.name})</Text>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? <Tag color="blue">{category}</Tag> : <Text type="secondary">未分类</Text>
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <Space>
          {tags?.map((tag: string) => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a, b) => a.usage_count - b.usage_count
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (date) => date ? new Date(date).toLocaleString() : <Text type="secondary">从未使用</Text>
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled) => (
        <Switch checked={enabled} disabled size="small" />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => {
              setSelectedTool(record);
              setToolDetailDrawerVisible(true);
            }}
          >
            详情
          </Button>
          <Button 
            icon={<PlayCircleOutlined />} 
            size="small" 
            type="primary"
            onClick={() => {
              setSelectedTool(record);
              setToolCallDrawerVisible(true);
              toolCallForm.resetFields();
              setToolCallResult(null);
            }}
          >
            调用
          </Button>
          <Button 
            icon={<MonitorOutlined />} 
            size="small" 
            onClick={() => handleViewToolHistory(record)}
          >
            历史
          </Button>
        </Space>
      )
    }
  ];

  // 渲染系统状态卡片
  const renderSystemStatus = () => {
    if (!systemStatus) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Gateway状态"
              value={systemStatus.gateway_status}
              prefix={
                systemStatus.gateway_status === 'healthy' ? 
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃服务器"
              value={systemStatus.active_servers}
              suffix={`/ ${systemStatus.total_servers}`}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可用工具"
              value={systemStatus.active_tools}
              suffix={`/ ${systemStatus.total_tools}`}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={systemStatus.avg_response_time}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 如果MCP服务未初始化，显示初始化页面
  if (!initialized) {
    return (
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <ToolOutlined style={{ marginRight: 8 }} />
            MCP 工具管理中心
          </Title>
          <Paragraph type="secondary">
            基于 IBM MCP Context Forge 的统一工具管理平台
          </Paragraph>
        </div>

        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ marginBottom: 24 }}>
            <CloudServerOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 16 }} />
            <Title level={3}>MCP 服务未初始化</Title>
            <Paragraph>
              MCP Context Forge 服务尚未初始化。请点击下方按钮初始化服务，
              这将启动 MCP Gateway 并注册默认的工具服务器。
            </Paragraph>
          </div>
          
          <Space direction="vertical" size="large">
            <Alert
              message="初始化要求"
              description={
                <div>
                  <p>• 确保 MCP Context Forge Gateway 正在运行 (http://localhost:8000)</p>
                  <p>• 确保数据库连接正常</p>
                  <p>• 确保相关服务端点可访问</p>
                </div>
              }
              type="info"
              showIcon
            />
            
            <Button 
              type="primary" 
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={initializeMCPService}
              loading={loading}
            >
              初始化 MCP 服务
            </Button>
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={checkMCPServiceAvailability}
            >
              重新检查状态
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ToolOutlined style={{ marginRight: 8 }} />
          MCP 工具管理中心
        </Title>
        <Paragraph type="secondary">
          基于 IBM MCP Context Forge 的统一工具管理平台
        </Paragraph>
      </div>

      {/* 系统状态概览 */}
      {renderSystemStatus()}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setServerModalVisible(true)}
          >
            注册服务器
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleSyncAll}
            loading={loading}
          >
            同步工具
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => loadSystemStatus()}
          >
            刷新状态
          </Button>
        </Space>
      </Card>

      {/* 主要内容区域 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={
            <span>
              <ToolOutlined />
              工具管理 ({tools.length})
            </span>
          } key="tools">
            <Table
              columns={toolColumns}
              dataSource={tools}
              rowKey="id"
              loading={toolsLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个工具`
              }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <CloudServerOutlined />
              服务器管理 ({servers.length})
            </span>
          } key="servers">
            <Table
              columns={serverColumns}
              dataSource={servers}
              rowKey="id"
              loading={serversLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个服务器`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 注册服务器模态框 */}
      <Modal
        title="注册MCP服务器"
        open={serverModalVisible}
        onCancel={() => setServerModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={serverForm}
          layout="vertical"
          onFinish={handleRegisterServer}
        >
          <Form.Item
            name="name"
            label="服务器名称"
            rules={[{ required: true, message: '请输入服务器名称' }]}
          >
            <Input placeholder="例如: youtu-agent-tools" />
          </Form.Item>
          
          <Form.Item
            name="display_name"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如: Youtu-Agent 工具集" />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="服务器描述信息" />
          </Form.Item>
          
          <Form.Item
            name="server_type"
            label="服务器类型"
            rules={[{ required: true, message: '请选择服务器类型' }]}
          >
            <Select>
              <Option value="internal">内部服务器</Option>
              <Option value="external">外部服务器</Option>
              <Option value="virtual">虚拟服务器</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="transport_type"
            label="传输方式"
            rules={[{ required: true, message: '请选择传输方式' }]}
          >
            <Select>
              <Option value="http">HTTP</Option>
              <Option value="stdio">STDIO</Option>
              <Option value="sse">SSE</Option>
              <Option value="websocket">WebSocket</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="connection_config"
            label="连接配置"
            rules={[{ required: true, message: '请输入连接配置' }]}
          >
            <Input.TextArea 
              placeholder='{"url": "http://localhost:8080/tools", "auth_type": "none"}'
              rows={4}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                注册服务器
              </Button>
              <Button onClick={() => setServerModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 工具详情抽屉 */}
      <Drawer
        title="工具详情"
        placement="right"
        onClose={() => setToolDetailDrawerVisible(false)}
        open={toolDetailDrawerVisible}
        width={600}
      >
        {selectedTool && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="工具名称">{selectedTool.display_name}</Descriptions.Item>
              <Descriptions.Item label="内部名称">{selectedTool.name}</Descriptions.Item>
              <Descriptions.Item label="描述">{selectedTool.description || '无描述'}</Descriptions.Item>
              <Descriptions.Item label="分类">{selectedTool.category || '未分类'}</Descriptions.Item>
              <Descriptions.Item label="标签">
                {selectedTool.tags?.map(tag => <Tag key={tag}>{tag}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="使用次数">{selectedTool.usage_count}</Descriptions.Item>
              <Descriptions.Item label="最后使用">
                {selectedTool.last_used_at ? new Date(selectedTool.last_used_at).toLocaleString() : '从未使用'}
              </Descriptions.Item>
            </Descriptions>
            
            <Title level={4} style={{ marginTop: 24 }}>工具Schema</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(selectedTool.schema, null, 2)}
            </pre>
          </div>
        )}
      </Drawer>

      {/* 工具调用抽屉 */}
      <Drawer
        title={`调用工具: ${selectedTool?.display_name}`}
        placement="right"
        onClose={() => setToolCallDrawerVisible(false)}
        open={toolCallDrawerVisible}
        width={600}
      >
        <Form
          form={toolCallForm}
          layout="vertical"
          onFinish={handleCallTool}
        >
          <Form.Item
            name="arguments"
            label="调用参数 (JSON格式)"
            rules={[{ required: true, message: '请输入调用参数' }]}
          >
            <Input.TextArea 
              placeholder='{"query": "示例查询", "limit": 10}'
              rows={6}
            />
          </Form.Item>
          
          <Form.Item name="session_id" label="会话ID">
            <Input placeholder="可选的会话标识" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={toolCallLoading}>
              调用工具
            </Button>
          </Form.Item>
        </Form>

        {toolCallResult && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>调用结果</Title>
            <Alert
              type={toolCallResult.success ? 'success' : 'error'}
              message={toolCallResult.success ? '调用成功' : '调用失败'}
              description={
                <pre style={{ 
                  marginTop: 8,
                  background: 'transparent',
                  border: 'none',
                  padding: 0
                }}>
                  {JSON.stringify(toolCallResult, null, 2)}
                </pre>
              }
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MCPToolsPage;
