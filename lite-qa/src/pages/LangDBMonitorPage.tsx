/**
 * LangDB监控页面 - 显示Agno Team的执行监控数据
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Alert,
  Modal,
  Descriptions,
  Divider,
  Tabs,
  Badge,
  Tooltip,
  Input
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  TeamOutlined,
  UserOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { LangDBMetric, TeamExecutionStats, TeamMemberPerformance } from '../types';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

interface LangDBMonitorPageProps {
  // 可以添加props用于数据获取
}

const LangDBMonitorPage: React.FC<LangDBMonitorPageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<LangDBMetric[]>([]);
  const [teamStats, setTeamStats] = useState<TeamExecutionStats[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<TeamMemberPerformance[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedMetricType, setSelectedMetricType] = useState<string>('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<LangDBMetric | null>(null);

  // 模拟数据 - 实际项目中应该从API获取
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    setLoading(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      const mockMetrics: LangDBMetric[] = [
        {
          id: '1',
          sessionId: 'session_001',
          metricType: 'execution_time',
          metricName: 'Total Execution Time',
          metricValue: { value: 2500, unit: 'ms' },
          timestamp: Date.now() - 3600000,
          metadata: { teamName: 'geopolymer_qa_team_v2', executionId: 'exec_001' }
        },
        {
          id: '2',
          sessionId: 'session_001',
          metricType: 'member_performance',
          metricName: 'Member Response Time',
          metricValue: { 
            question_decomposition_agent: 800,
            translation_agent: 1200,
            knowledge_retrieval_agent: 1500
          },
          timestamp: Date.now() - 1800000,
          metadata: { teamName: 'geopolymer_qa_team_v2', executionId: 'exec_001' }
        },
        {
          id: '3',
          sessionId: 'session_002',
          metricType: 'error_rate',
          metricName: 'Error Rate',
          metricValue: { value: 0.05, unit: 'percentage' },
          timestamp: Date.now() - 900000,
          metadata: { teamName: 'geopolymer_qa_team_v2', executionId: 'exec_002' }
        }
      ];

      const mockTeamStats: TeamExecutionStats[] = [
        {
          teamName: 'geopolymer_qa_team_v2',
          totalExecutions: 150,
          successfulExecutions: 142,
          failedExecutions: 8,
          avgDurationMs: 3200,
          lastExecutionTime: new Date().toISOString()
        }
      ];

      const mockMemberPerformance: TeamMemberPerformance[] = [
        {
          memberId: 'question_decomposition_agent',
          memberName: '问题分解专家',
          totalSteps: 150,
          successfulSteps: 145,
          failedSteps: 5,
          avgDurationMs: 800,
          lastStepTime: new Date().toISOString()
        },
        {
          memberId: 'translation_agent',
          memberName: '实时翻译专家',
          totalSteps: 120,
          successfulSteps: 118,
          failedSteps: 2,
          avgDurationMs: 1200,
          lastStepTime: new Date().toISOString()
        },
        {
          memberId: 'knowledge_retrieval_agent',
          memberName: '多语言知识检索专家',
          totalSteps: 150,
          successfulSteps: 142,
          failedSteps: 8,
          avgDurationMs: 1500,
          lastStepTime: new Date().toISOString()
        }
      ];

      setMetrics(mockMetrics);
      setTeamStats(mockTeamStats);
      setMemberPerformance(mockMemberPerformance);
      setLoading(false);
    }, 1000);
  };

  // 计算总体统计
  const overallStats = {
    totalExecutions: teamStats.reduce((sum, stat) => sum + stat.totalExecutions, 0),
    successfulExecutions: teamStats.reduce((sum, stat) => sum + stat.successfulExecutions, 0),
    failedExecutions: teamStats.reduce((sum, stat) => sum + stat.failedExecutions, 0),
    avgDuration: teamStats.length > 0 ? teamStats.reduce((sum, stat) => sum + stat.avgDurationMs, 0) / teamStats.length : 0,
    successRate: teamStats.length > 0 ? 
      (teamStats.reduce((sum, stat) => sum + stat.successfulExecutions, 0) / 
       teamStats.reduce((sum, stat) => sum + stat.totalExecutions, 0)) * 100 : 0
  };

  // 过滤指标数据
  const filteredMetrics = metrics.filter(metric => {
    if (selectedTeam !== 'all' && metric.metadata?.teamName !== selectedTeam) return false;
    if (selectedMetricType !== 'all' && metric.metricType !== selectedMetricType) return false;
    if (selectedTimeRange) {
      const metricTime = new Date(metric.timestamp);
      const startTime = new Date(selectedTimeRange[0]);
      const endTime = new Date(selectedTimeRange[1]);
      return metricTime >= startTime && metricTime <= endTime;
    }
    return true;
  });

  // 指标表格列定义
  const metricColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    },
    {
      title: '会话ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      render: (sessionId: string) => (
        <Tag color="blue">{sessionId}</Tag>
      )
    },
    {
      title: '指标类型',
      dataIndex: 'metricType',
      key: 'metricType',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          'execution_time': 'green',
          'member_performance': 'blue',
          'error_rate': 'red',
          'success_rate': 'green'
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName'
    },
    {
      title: '指标值',
      dataIndex: 'metricValue',
      key: 'metricValue',
      render: (value: any) => {
        if (typeof value === 'object') {
          return (
            <div>
              {Object.entries(value).map(([key, val]) => (
                <div key={key}>
                  <Text strong>{key}:</Text> {String(val)}
                </div>
              ))}
            </div>
          );
        }
        return String(value);
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: LangDBMetric) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedMetric(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      )
    }
  ];

  // 成员性能表格列定义
  const memberColumns = [
    {
      title: '成员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (name: string, record: TeamMemberPerformance) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
          <Tag color="blue">{record.memberId}</Tag>
        </Space>
      )
    },
    {
      title: '总步骤',
      dataIndex: 'totalSteps',
      key: 'totalSteps'
    },
    {
      title: '成功步骤',
      dataIndex: 'successfulSteps',
      key: 'successfulSteps',
      render: (value: number) => (
        <Text type="success">{value}</Text>
      )
    },
    {
      title: '失败步骤',
      dataIndex: 'failedSteps',
      key: 'failedSteps',
      render: (value: number) => (
        <Text type="danger">{value}</Text>
      )
    },
    {
      title: '成功率',
      key: 'successRate',
      render: (_, record: TeamMemberPerformance) => {
        const rate = record.totalSteps > 0 ? (record.successfulSteps / record.totalSteps) * 100 : 0;
        return (
          <Progress
            percent={rate}
            size="small"
            status={rate >= 90 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
          />
        );
      }
    },
    {
      title: '平均耗时',
      dataIndex: 'avgDurationMs',
      key: 'avgDurationMs',
      render: (value: number) => `${value}ms`
    },
    {
      title: '最后执行',
      dataIndex: 'lastStepTime',
      key: 'lastStepTime',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  return (
    <div className="langdb-monitor-page" style={{ padding: '16px' }}>

      {/* 总体统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总执行次数"
              value={overallStats.totalExecutions}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="成功执行"
              value={overallStats.successfulExecutions}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="失败执行"
              value={overallStats.failedExecutions}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="成功率"
              value={overallStats.successRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 过滤器和操作栏 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Text strong>时间范围:</Text>
            <RangePicker
              style={{ marginLeft: '8px' }}
              onChange={(dates) => {
                if (dates) {
                  setSelectedTimeRange([dates[0]!.toISOString(), dates[1]!.toISOString()]);
                } else {
                  setSelectedTimeRange(null);
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Text strong>团队:</Text>
            <Select
              style={{ 
                marginLeft: '8px', 
                width: '120px',
                color: '#000000'
              }}
              value={selectedTeam}
              onChange={setSelectedTeam}
              placeholder="选择团队"
            >
              <Option value="all">所有团队</Option>
              <Option value="geopolymer_qa_team_v2">地聚物QA团队</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong>指标类型:</Text>
            <Select
              style={{ 
                marginLeft: '8px', 
                width: '120px',
                color: '#000000'
              }}
              value={selectedMetricType}
              onChange={setSelectedMetricType}
              placeholder="选择类型"
            >
              <Option value="all">所有类型</Option>
              <Option value="execution_time">执行时间</Option>
              <Option value="member_performance">成员性能</Option>
              <Option value="error_rate">错误率</Option>
              <Option value="success_rate">成功率</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Search
              placeholder="搜索指标..."
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadMockData}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容区域 */}
      <Tabs defaultActiveKey="metrics">
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              指标数据
            </span>
          }
          key="metrics"
        >
          <Card size="small">
            <Table
              columns={metricColumns}
              dataSource={filteredMetrics}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              团队统计
            </span>
          }
          key="teams"
        >
          <Card size="small">
            <Table
              columns={[
                {
                  title: '团队名称',
                  dataIndex: 'teamName',
                  key: 'teamName',
                  render: (name: string) => (
                    <Space>
                      <TeamOutlined />
                      <Text strong>{name}</Text>
                    </Space>
                  )
                },
                {
                  title: '总执行次数',
                  dataIndex: 'totalExecutions',
                  key: 'totalExecutions'
                },
                {
                  title: '成功/失败',
                  key: 'successFail',
                  render: (_, record: TeamExecutionStats) => (
                    <Space>
                      <Text type="success">{record.successfulExecutions}</Text>
                      <Text>/</Text>
                      <Text type="danger">{record.failedExecutions}</Text>
                    </Space>
                  )
                },
                {
                  title: '成功率',
                  key: 'successRate',
                  render: (_, record: TeamExecutionStats) => {
                    const rate = (record.successfulExecutions / record.totalExecutions) * 100;
                    return (
                      <Progress
                        percent={rate}
                        size="small"
                        status={rate >= 90 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
                      />
                    );
                  }
                },
                {
                  title: '平均耗时',
                  dataIndex: 'avgDurationMs',
                  key: 'avgDurationMs',
                  render: (value: number) => `${value}ms`
                },
                {
                  title: '最后执行',
                  dataIndex: 'lastExecutionTime',
                  key: 'lastExecutionTime',
                  render: (time: string) => new Date(time).toLocaleString()
                }
              ]}
              dataSource={teamStats}
              rowKey="teamName"
              loading={loading}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <UserOutlined />
              成员性能
            </span>
          }
          key="members"
        >
          <Card size="small">
            <Table
              columns={memberColumns}
              dataSource={memberPerformance}
              rowKey="memberId"
              loading={loading}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              实时监控
            </span>
          }
          key="realtime"
        >
          <Card size="small">
            <Alert
              message="实时监控功能"
              description="实时监控功能正在开发中，将提供实时的执行状态、性能指标和异常告警。"
              type="info"
              showIcon
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 指标详情模态框 */}
      <Modal
        title="指标详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedMetric && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="指标ID" span={2}>
              {selectedMetric.id}
            </Descriptions.Item>
            <Descriptions.Item label="会话ID">
              {selectedMetric.sessionId}
            </Descriptions.Item>
            <Descriptions.Item label="指标类型">
              <Tag color="blue">{selectedMetric.metricType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="指标名称" span={2}>
              {selectedMetric.metricName}
            </Descriptions.Item>
            <Descriptions.Item label="时间戳" span={2}>
              {new Date(selectedMetric.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="指标值" span={2}>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(selectedMetric.metricValue, null, 2)}
              </pre>
            </Descriptions.Item>
            {selectedMetric.metadata && (
              <Descriptions.Item label="元数据" span={2}>
                <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(selectedMetric.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LangDBMonitorPage; 