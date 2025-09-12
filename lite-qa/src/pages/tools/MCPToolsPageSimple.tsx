/**
 * MCP工具管理页面 - 简化版本
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  message,
  Alert,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  List,
  Badge,
  Tag
} from 'antd';
import {
  ToolOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// 简化的类型定义
interface SystemStatus {
  gateway_status: string;
  total_servers: number;
  active_servers: number;
  total_tools: number;
  active_tools: number;
  recent_calls: number;
  avg_response_time: number;
}

interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  server_type: string;
  health_status: string;
  is_enabled: boolean;
}

interface MCPTool {
  id: string;
  name: string;
  display_name: string;
  category?: string;
  usage_count: number;
  is_enabled: boolean;
}

const MCPToolsPageSimple: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);

  // 检查MCP服务状态
  const checkMCPStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/health');
      
      if (response.ok) {
        const healthData = await response.json();
        setInitialized(healthData.status === 'healthy');
        
        if (healthData.status === 'healthy') {
          await loadData();
        }
      } else {
        setInitialized(false);
      }
    } catch (error) {
      console.error('检查MCP状态失败:', error);
      setInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  // 加载所有数据
  const loadData = async () => {
    try {
      // 并行加载所有数据
      const [statusRes, serversRes, toolsRes] = await Promise.all([
        fetch('/api/mcp/status'),
        fetch('/api/mcp/servers'),
        fetch('/api/mcp/tools')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData);
      }

      if (serversRes.ok) {
        const serversData = await serversRes.json();
        setServers(serversData);
      }

      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setTools(toolsData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  // 初始化MCP服务
  const initializeMCP = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/initialize', { method: 'POST' });
      
      if (response.ok) {
        message.success('MCP服务初始化成功');
        setInitialized(true);
        await loadData();
      } else {
        const errorData = await response.json();
        message.error(`初始化失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('初始化MCP服务失败:', error);
      message.error('初始化MCP服务失败');
    } finally {
      setLoading(false);
    }
  };

  // 同步工具和服务器
  const syncAll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/sync', { method: 'POST' });
      
      if (response.ok) {
        message.success('同步任务已启动');
        setTimeout(() => {
          loadData();
        }, 2000);
      } else {
        message.error('同步失败');
      }
    } catch (error) {
      console.error('同步失败:', error);
      message.error('同步失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMCPStatus();
  }, []);

  // 渲染系统状态
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
              title="服务器"
              value={systemStatus.active_servers}
              suffix={`/ ${systemStatus.total_servers}`}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="工具"
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

  // 未初始化状态
  if (!initialized) {
    return (
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <ToolOutlined style={{ marginRight: 8 }} />
            MCP 工具管理中心
          </Title>
          <Paragraph type="secondary">
            统一工具管理和调用平台
          </Paragraph>
        </div>

        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ marginBottom: 24 }}>
            <CloudServerOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 16 }} />
            <Title level={3}>MCP 服务未初始化</Title>
            <Paragraph>
              工具管理服务尚未初始化。请点击下方按钮初始化服务。
            </Paragraph>
          </div>
          
          <Space direction="vertical" size="large">
            <Alert
              message="初始化要求"
              description="请确保工具管理服务正在运行并且数据库连接正常"
              type="info"
              showIcon
            />
            
            <Space>
              <Button 
                type="primary" 
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={initializeMCP}
                loading={loading}
              >
                初始化 MCP 服务
              </Button>
              
              <Button 
                icon={<ReloadOutlined />}
                onClick={checkMCPStatus}
                loading={loading}
              >
                重新检查
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  // 已初始化状态
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ToolOutlined style={{ marginRight: 8 }} />
          MCP 工具管理中心
        </Title>
        <Paragraph type="secondary">
          统一工具管理和调用平台
        </Paragraph>
      </div>

      {/* 系统状态 */}
      {renderSystemStatus()}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新数据
          </Button>
          <Button 
            icon={<ApiOutlined />}
            onClick={syncAll}
            loading={loading}
          >
            同步工具
          </Button>
        </Space>
      </Card>

      {/* 服务器和工具列表 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title={
            <span>
              <CloudServerOutlined style={{ marginRight: 8 }} />
              MCP 服务器 ({servers.length})
            </span>
          }>
            {servers.length === 0 ? (
              <Empty description="暂无服务器" />
            ) : (
              <List
                dataSource={servers}
                renderItem={(server) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          {server.display_name}
                          <Badge 
                            status={server.health_status === 'healthy' ? 'success' : 'error'} 
                            text={server.health_status}
                          />
                        </Space>
                      }
                      description={
                        <Space>
                          <Tag color="blue">{server.server_type}</Tag>
                          <Text type="secondary">{server.name}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title={
            <span>
              <ToolOutlined style={{ marginRight: 8 }} />
              可用工具 ({tools.length})
            </span>
          }>
            {tools.length === 0 ? (
              <Empty description="暂无工具" />
            ) : (
              <List
                dataSource={tools}
                renderItem={(tool) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          {tool.display_name}
                          {tool.category && <Tag color="green">{tool.category}</Tag>}
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">{tool.name}</Text>
                          <Text type="secondary">使用次数: {tool.usage_count}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {loading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default MCPToolsPageSimple;
