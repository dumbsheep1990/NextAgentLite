/**
 * Team模式专用溯源面板组件
 * 包含两个页面：Agent追踪 和 知识库信息溯源
 */
import React, { useState, useMemo } from 'react';
import { 
  Tabs, 
  Card, 
  Typography, 
  Timeline, 
  Tag, 
  Space, 
  Button, 
  Collapse, 
  Progress, 
  Statistic, 
  Row, 
  Col, 
  Badge, 
  Alert,
  Divider,
  List,
  Avatar,
  Tooltip,
  Empty,
  Descriptions
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  CodeOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BookOutlined,
  SearchOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import type { Message, TeamMessage, TeamMemberCall } from '../../types';
import { SourceViewer } from './SourceViewer';
import { formatTime } from '../../utils/timeUtils';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface TeamSourcePanelProps {
  message: TeamMessage;
  visible?: boolean;
  onClose?: () => void;
  className?: string;
}

const TeamSourcePanel: React.FC<TeamSourcePanelProps> = ({
  message,
  visible = true,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('agents');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sourceViewerMode, setSourceViewerMode] = useState<'floating' | 'modal' | 'drawer' | null>(null);

  const { teamInfo } = message;
  const { memberCalls = [], structuredOutput, coordinationInfo } = teamInfo;

  // 计算Agent统计信息
  const agentStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    memberCalls.forEach(call => {
      if (!stats[call.memberId]) {
        stats[call.memberId] = {
          name: call.memberName,
          role: call.role,
          totalCalls: 0,
          totalDuration: 0,
          successful: 0,
          failed: 0,
          running: 0,
          calls: []
        };
      }
      
      stats[call.memberId].totalCalls++;
      stats[call.memberId].totalDuration += call.durationMs || 0;
      stats[call.memberId].calls.push(call);
      
      if (call.status === 'completed') stats[call.memberId].successful++;
      else if (call.status === 'error') stats[call.memberId].failed++;
      else if (call.status === 'running') stats[call.memberId].running++;
    });
    
    return stats;
  }, [memberCalls]);

  // 获取Agent图标
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'question_decomposition_agent':
        return <NodeIndexOutlined style={{ color: '#1890ff' }} />;
      case 'translation_agent':
        return <ApiOutlined style={{ color: '#52c41a' }} />;
      case 'knowledge_retrieval_agent':
        return <SearchOutlined style={{ color: '#fa8c16' }} />;
      case 'knowledge_graph_agent':
        return <ClusterOutlined style={{ color: '#722ed1' }} />;
      case 'summary_answer_agent':
        return <BulbOutlined style={{ color: '#eb2f96' }} />;
      case 'qa_coordinator_v2':
        return <ThunderboltOutlined style={{ color: '#f5222d' }} />;
      default:
        return <UserOutlined style={{ color: '#666' }} />;
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} spin />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'processing';
      case 'error': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // 格式化持续时间
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return 'N/A';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  // 渲染Agent追踪页面
  const renderAgentTracing = () => (
    <div className="space-y-4">
      {/* Agent概览统计 */}
      <Card title={
        <Space>
          <TeamOutlined style={{ color: '#f97316' }} />
          <span>Agent执行概览</span>
          <Badge count={Object.keys(agentStats).length} showZero>
            <Tag color="blue">活跃Agent</Tag>
          </Badge>
        </Space>
      } size="small">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总执行次数"
              value={memberCalls.length}
              prefix={<PlayCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功执行"
              value={memberCalls.filter(call => call.status === 'completed').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="执行中"
              value={memberCalls.filter(call => call.status === 'running').length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LoadingOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="执行失败"
              value={memberCalls.filter(call => call.status === 'error').length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Agent详细列表 */}
      <Card 
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>Agent详细追踪</span>
          </Space>
        } 
        size="small"
      >
        <List
          itemLayout="vertical"
          dataSource={Object.entries(agentStats)}
          renderItem={([agentId, stats]) => (
            <List.Item
              key={agentId}
              actions={[
                <Button
                  key="view"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setSelectedAgent(agentId)}
                >
                  查看详情
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={getAgentIcon(agentId)} 
                    style={{ 
                      backgroundColor: '#f0f2f5',
                      border: '2px solid #1890ff' 
                    }} 
                  />
                }
                title={
                  <Space>
                    <Text strong>{stats.name}</Text>
                    <Tag color="blue" size="small">{stats.role}</Tag>
                    <Badge 
                      count={stats.totalCalls} 
                      showZero 
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Space wrap>
                      <Text type="secondary">
                        <PlayCircleOutlined /> 总调用: {stats.totalCalls}
                      </Text>
                      <Text type="secondary">
                        <ClockCircleOutlined /> 总耗时: {formatDuration(stats.totalDuration)}
                      </Text>
                      <Text type="secondary" style={{ color: '#52c41a' }}>
                        <CheckCircleOutlined /> 成功: {stats.successful}
                      </Text>
                      {stats.failed > 0 && (
                        <Text type="secondary" style={{ color: '#ff4d4f' }}>
                          <ExclamationCircleOutlined /> 失败: {stats.failed}
                        </Text>
                      )}
                      {stats.running > 0 && (
                        <Text type="secondary" style={{ color: '#1890ff' }}>
                          <LoadingOutlined spin /> 执行中: {stats.running}
                        </Text>
                      )}
                    </Space>
                    
                    {/* Agent执行进度条 */}
                    <Progress
                      percent={stats.totalCalls > 0 ? (stats.successful / stats.totalCalls) * 100 : 0}
                      status={stats.failed > 0 ? 'exception' : stats.running > 0 ? 'active' : 'success'}
                      size="small"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 选中Agent的详细信息 */}
      {selectedAgent && agentStats[selectedAgent] && (
        <Card
          title={
            <Space>
              {getAgentIcon(selectedAgent)}
              <span>{agentStats[selectedAgent].name} 详细执行记录</span>
              <Button 
                type="text" 
                size="small" 
                onClick={() => setSelectedAgent(null)}
              >
                收起
              </Button>
            </Space>
          }
          size="small"
        >
          <Timeline>
            {agentStats[selectedAgent].calls.map((call: TeamMemberCall, index: number) => (
              <Timeline.Item
                key={`${call.memberId}-${index}`}
                dot={getStatusIcon(call.status)}
                color={call.status === 'running' ? 'blue' : call.status === 'error' ? 'red' : 'green'}
              >
                <Card size="small" style={{ marginBottom: 8 }}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="动作">{call.action}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={getStatusColor(call.status)}>
                        {call.status === 'running' && <LoadingOutlined spin style={{ marginRight: 4 }} />}
                        {call.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="开始时间">
                      {new Date(call.startTime).toLocaleTimeString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="持续时间">
                      {formatDuration(call.durationMs)}
                    </Descriptions.Item>
                    {call.confidence && (
                      <Descriptions.Item label="置信度">
                        {call.confidence}%
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {/* 输入输出数据 */}
                  <Collapse size="small" style={{ marginTop: 8 }}>
                    <Panel header="输入数据" key="input">
                      <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                        {JSON.stringify(call.input, null, 2)}
                      </pre>
                    </Panel>
                    <Panel header="输出数据" key="output">
                      <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                        {JSON.stringify(call.output, null, 2)}
                      </pre>
                    </Panel>
                    {call.errorMessage && (
                      <Panel header="错误信息" key="error">
                        <Alert
                          message="执行错误"
                          description={call.errorMessage}
                          type="error"
                          showIcon
                        />
                      </Panel>
                    )}
                  </Collapse>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
    </div>
  );

  // 渲染知识库溯源页面
  const renderKnowledgeSource = () => (
    <div className="space-y-4">
      {/* 知识库检索概览 */}
      <Card title={
        <Space>
          <DatabaseOutlined style={{ color: '#52c41a' }} />
          <span>知识库检索概览</span>
        </Space>
      } size="small">
        {message.knowledgeSources && message.knowledgeSources.length > 0 ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="检索到的文档"
                  value={message.knowledgeSources.length}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="论文文档"
                  value={message.knowledgeSources.filter(s => s.source_type === 'document').length}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="QA数据集"
                  value={message.knowledgeSources.filter(s => s.source_type === 'qa_dataset').length}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均相关度"
                  value={message.knowledgeSources.length > 0 ? 
                    (message.knowledgeSources.reduce((sum, s) => sum + (s.score || 0), 0) / message.knowledgeSources.length * 100).toFixed(1)
                    : 0
                  }
                  suffix="%"
                  precision={1}
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>

            {/* 知识源详细信息 */}
            <SourceViewer
              sources={message.knowledgeSources}
              mode="embedded"
              title="Team模式知识源详情"
              showStats={true}
            />
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无知识库检索结果"
          />
        )}
      </Card>

      {/* 知识图谱信息（如果有的话） */}
      {teamInfo.structuredOutput && (
        <Card
          title={
            <Space>
              <ClusterOutlined style={{ color: '#722ed1' }} />
              <span>知识图谱信息</span>
            </Space>
          }
          size="small"
        >
          <Descriptions bordered size="small">
            <Descriptions.Item label="数据类型" span={2}>
              {teamInfo.structuredOutput.type}
            </Descriptions.Item>
            <Descriptions.Item label="置信度">
              {teamInfo.structuredOutput.confidence}%
            </Descriptions.Item>
            <Descriptions.Item label="数据源" span={3}>
              {teamInfo.structuredOutput.sources?.join(', ') || '无'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Collapse size="small">
            <Panel header="结构化数据详情" key="data">
              <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(teamInfo.structuredOutput.data, null, 2)}
              </pre>
            </Panel>
          </Collapse>
        </Card>
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <div className={`team-source-panel ${className}`}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: '#f97316' }} />
            <span>Team溯源面板</span>
            <Badge 
              count={`${teamInfo.teamName || 'Team'}`}
              style={{ backgroundColor: '#f97316' }}
            />
          </Space>
        }
        extra={
          onClose && (
            <Button type="text" size="small" onClick={onClose}>
              关闭
            </Button>
          )
        }
        size="small"
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="small"
        >
          <TabPane 
            tab={
              <Space>
                <TeamOutlined />
                <span>Agent追踪</span>
                <Badge count={memberCalls.length} showZero />
              </Space>
            } 
            key="agents"
          >
            {renderAgentTracing()}
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <DatabaseOutlined />
                <span>知识库溯源</span>
                <Badge count={message.knowledgeSources?.length || 0} showZero />
              </Space>
            } 
            key="knowledge"
          >
            {renderKnowledgeSource()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default TeamSourcePanel;