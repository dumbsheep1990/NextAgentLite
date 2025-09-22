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

interface UnlaRouter {
  id: string;
  tenant: string;
  server_name: string;
  router_prefix: string;
  proto_type: string;
  mcp_endpoint: string;
  sse_endpoint: string;
  is_active: boolean;
  version?: string;
  last_synced_at?: string;
}

const MCPToolsPageSimple: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [routers, setRouters] = useState<UnlaRouter[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<string>('');
  const [toolName, setToolName] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<string>('{"sql":"-- 在此粘贴DDL"}');
  const [execResult, setExecResult] = useState<any>(null);
  const [execLoading, setExecLoading] = useState<boolean>(false);

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
      const [statusRes, serversRes, toolsRes, routersRes] = await Promise.all([
        fetch('/api/mcp/status'),
        fetch('/api/mcp/servers'),
        fetch('/api/mcp/tools'),
        fetch('/api/v1/mcp/unla/routers')
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

      if (routersRes.ok) {
        const routerData = await routersRes.json();
        setRouters(routerData);
        if (routerData.length > 0) {
          setSelectedRouter(routerData[0].router_prefix);
        }
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

  // 通过 Unla 统一网关调用 MCP 工具（用于执行DDL等场景）
  const executeToolViaUnla = async () => {
    if (!selectedRouter) {
      message.warning('请选择路由前缀');
      return;
    }
    if (!toolName) {
      message.warning('请输入工具名称');
      return;
    }
    let argsObj: any;
    try {
      argsObj = toolArgs ? JSON.parse(toolArgs) : {};
    } catch (e) {
      message.error('参数 JSON 解析失败');
      return;
    }
    setExecLoading(true);
    setExecResult(null);
    try {
      const resp = await fetch('/api/v1/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: toolName, arguments: argsObj, router_prefix: selectedRouter })
      });
      const data = await resp.json();
      setExecResult(data);
      if (resp.ok && data.success) {
        message.success('调用成功');
      } else {
        message.error('调用失败');
      }
    } catch (e) {
      console.error(e);
      message.error('调用异常');
    } finally {
      setExecLoading(false);
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

      {/* Unla 统一网关与快速调用 */}
      <Card style={{ marginBottom: 24 }} title="Unla 路由与统一网关">
        {routers.length === 0 ? (
          <Empty description="未同步到Unla路由，请先导入OpenAPI或在后端同步" />
        ) : (
          <>
            <Row gutter={12} style={{ marginBottom: 12 }}>
              <Col span={8}>
                <div style={{ marginBottom: 6 }}>路由前缀</div>
                <select className="w-full" style={{ width: '100%', padding: 8 }} value={selectedRouter} onChange={e => setSelectedRouter(e.target.value)}>
                  {routers.map(r => (
                    <option key={r.id} value={r.router_prefix}>{r.router_prefix} ({r.proto_type})</option>
                  ))}
                </select>
              </Col>
              <Col span={16}>
                <div className="text-xs" style={{ color: '#666', marginTop: 22 }}>
                  统一网关 MCP: <code>/gateway{selectedRouter || '/<prefix>'}/mcp</code> | SSE: <code>/gateway{selectedRouter || '/<prefix>'}/sse</code>
                </div>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <div style={{ marginBottom: 6 }}>工具名称</div>
                <input style={{ width: '100%', padding: 8 }} value={toolName} onChange={e => setToolName(e.target.value)} placeholder="如 sql_admin.execute" />
              </Col>
              <Col span={16}>
                <div style={{ marginBottom: 6 }}>参数(JSON)</div>
                <textarea style={{ width: '100%', padding: 8 }} rows={4} value={toolArgs} onChange={e => setToolArgs(e.target.value)} />
              </Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <Space>
                <Button type="primary" loading={execLoading} onClick={executeToolViaUnla} icon={<ThunderboltOutlined />}>执行工具调用</Button>
                <Button onClick={loadData} icon={<ReloadOutlined />}>刷新路由</Button>
              </Space>
            </div>
            {execResult && (
              <pre className="mt-3" style={{ marginTop: 12, padding: 12, background: '#fafafa', border: '1px solid #eee', borderRadius: 4, maxHeight: 280, overflow: 'auto' }}>
                {JSON.stringify(execResult, null, 2)}
              </pre>
            )}
          </>
        )}
      </Card>

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
