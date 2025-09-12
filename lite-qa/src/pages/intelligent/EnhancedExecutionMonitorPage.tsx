import React, { useState, useEffect } from 'react';
import {
  Card, Button, Table, Space, Tag, Row, Col, Statistic, 
  message, Typography, Select, DatePicker, Alert, Tabs, 
  Progress, Avatar, Tooltip, Empty, Spin
} from 'antd';
import {
  ReloadOutlined, BarChartOutlined, TeamOutlined, RobotOutlined,
  BranchesOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, ThunderboltOutlined, ApiOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import styles from './EnhancedExecutionMonitor.module.css';
import { unifiedAgentService, UnifiedAgent, AgentExecution } from '../../services/unifiedAgentService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  frameworkStats: {
    agno: number;
    youtu: number;
    hybrid: number;
  };
}

const EnhancedExecutionMonitorPage: React.FC = () => {
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);

  useEffect(() => {
    loadData();
  }, [selectedAgent, timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAgents(),
        loadExecutions(),
        loadStats()
      ]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const agentsData = await unifiedAgentService.listAgents();
      setAgents(agentsData);
    } catch (error) {
      console.error('加载智能体列表失败:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      // 调用真实API获取执行记录
      const response = await fetch('/api/v1/youtu/monitor/tasks?limit=50');
      if (!response.ok) {
        throw new Error('获取执行记录失败');
      }
      
      const executionsData = await response.json();
      setExecutions(executionsData);
    } catch (error) {
      console.error('加载执行记录失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      // 计算统计数据
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;
      const avgExecutionTime = executions
        .filter(e => e.executionTimeMs)
        .reduce((sum, e) => sum + (e.executionTimeMs || 0), 0) / successfulExecutions || 0;

      // 按框架统计
      const frameworkStats = { agno: 0, youtu: 0, hybrid: 0 };
      executions.forEach(execution => {
        const agent = agents.find(a => a.id === execution.agentId);
        if (agent) {
          frameworkStats[agent.framework]++;
        }
      });

      setStats({
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgExecutionTime,
        frameworkStats
      });
    } catch (error) {
      console.error('计算统计数据失败:', error);
    }
  };

  const getAgentInfo = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return { name: '未知智能体', framework: 'unknown' };
    
    return {
      name: agent.displayName,
      framework: agent.framework,
      frameworkConfig: unifiedAgentService.getFrameworkConfig(agent.framework)
    };
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      running: { color: '#1890ff', text: '运行中', icon: <PlayCircleOutlined /> },
      completed: { color: '#52c41a', text: '已完成', icon: <CheckCircleOutlined /> },
      failed: { color: '#ff4d4f', text: '失败', icon: <ExclamationCircleOutlined /> },
      cancelled: { color: '#d9d9d9', text: '已取消', icon: <ClockCircleOutlined /> }
    };
    return configs[status as keyof typeof configs] || configs.running;
  };

  // 图表数据
  const getExecutionTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().subtract(6 - i, 'days');
      const dayExecutions = executions.filter(e => 
        dayjs(e.startedAt).isSame(date, 'day')
      );
      
      return {
        date: date.format('MM-DD'),
        total: dayExecutions.length,
        success: dayExecutions.filter(e => e.status === 'completed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length
      };
    });
    
    return last7Days;
  };

  const getFrameworkDistributionData = () => {
    if (!stats) return [];
    
    return [
      { type: 'Agno Team', value: stats.frameworkStats.agno },
      { type: 'Youtu-Agent', value: stats.frameworkStats.youtu },
      { type: '混合调用', value: stats.frameworkStats.hybrid }
    ];
  };

  const getResponseTimeData = () => {
    const timeRanges = [
      { range: '0-1s', count: 0 },
      { range: '1-3s', count: 0 },
      { range: '3-5s', count: 0 },
      { range: '5-10s', count: 0 },
      { range: '>10s', count: 0 }
    ];

    executions.forEach(execution => {
      if (execution.executionTimeMs) {
        const timeInSeconds = execution.executionTimeMs / 1000;
        if (timeInSeconds <= 1) timeRanges[0].count++;
        else if (timeInSeconds <= 3) timeRanges[1].count++;
        else if (timeInSeconds <= 5) timeRanges[2].count++;
        else if (timeInSeconds <= 10) timeRanges[3].count++;
        else timeRanges[4].count++;
      }
    });

    return timeRanges;
  };

  const executionColumns = [
    {
      title: '智能体',
      key: 'agent',
      render: (_, record: AgentExecution) => {
        const agentInfo = getAgentInfo(record.agentId);
        const frameworkConfig = agentInfo.frameworkConfig;
        
        return (
          <Space>
            <Avatar 
              size={32} 
              style={{ backgroundColor: frameworkConfig?.color || '#1890ff' }}
            >
              {agentInfo.framework === 'agno' ? <TeamOutlined /> : 
               agentInfo.framework === 'youtu' ? <RobotOutlined /> : 
               <BranchesOutlined />}
            </Avatar>
            <div>
              <div>{agentInfo.name}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {frameworkConfig?.name || '未知框架'}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: '查询内容',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record: AgentExecution) => {
        const statusConfig = getStatusConfig(record.status);
        return (
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.text}
          </Tag>
        );
      }
    },
    {
      title: '执行时间',
      key: 'executionTime',
      render: (_, record: AgentExecution) => {
        if (record.executionTimeMs) {
          const timeInSeconds = (record.executionTimeMs / 1000).toFixed(1);
          const color = record.executionTimeMs < 2000 ? '#52c41a' : 
                       record.executionTimeMs < 5000 ? '#faad14' : '#ff4d4f';
          return <Text style={{ color }}>{timeInSeconds}s</Text>;
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (text: string) => dayjs(text).format('HH:mm:ss')
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (text: string) => text ? (
        <Tooltip title={text}>
          <Text type="danger" ellipsis style={{ maxWidth: 150 }}>
            {text}
          </Text>
        </Tooltip>
      ) : '-'
    }
  ];

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>
            性能监控中心
          </Title>
          <Text className={styles.pageDescription}>
            多框架智能体执行监控和性能分析，支持实时数据刷新和历史趋势分析
          </Text>
        </div>
        <Space>
          <Select
            value={selectedAgent}
            onChange={setSelectedAgent}
            style={{ width: 150 }}
            placeholder="选择智能体"
          >
            <Select.Option value="all">全部智能体</Select.Option>
            {agents.map(agent => (
              <Select.Option key={agent.id} value={agent.id}>
                {agent.displayName}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={timeRange}
            onChange={(dates) => dates && setTimeRange(dates)}
            style={{ width: 260 }}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
            type="primary"
          >
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 统计概览 */}
      <Row gutter={24} className={styles.statsRow}>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总执行次数"
              value={stats?.totalExecutions || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="成功执行"
              value={stats?.successfulExecutions || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="失败执行"
              value={stats?.failedExecutions || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="平均响应时间"
              value={stats?.avgExecutionTime || 0}
              precision={0}
              suffix="ms"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表分析 */}
      <Row gutter={24} className={styles.chartsRow}>
        <Col xs={24} lg={12}>
          <Card title="执行趋势" className={styles.chartCard}>
            <Line
              data={getExecutionTrendData()}
              xField="date"
              yField="total"
              seriesField="type"
              height={300}
              point={{
                size: 4,
                shape: 'circle',
              }}
              tooltip={{
                showMarkers: true,
              }}
              smooth
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="框架分布" className={styles.chartCard}>
            <Pie
              data={getFrameworkDistributionData()}
              angleField="value"
              colorField="type"
              radius={0.8}
              height={300}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
              }}
              interactions={[{ type: 'element-active' }]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className={styles.chartsRow}>
        <Col xs={24}>
          <Card title="响应时间分布" className={styles.chartCard}>
            <Column
              data={getResponseTimeData()}
              xField="range"
              yField="count"
              height={300}
              label={{
                position: 'middle',
                style: {
                  fill: '#FFFFFF',
                  opacity: 0.6,
                },
              }}
              meta={{
                range: {
                  alias: '响应时间范围',
                },
                count: {
                  alias: '执行次数',
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 执行记录 */}
      <Card 
        title="执行记录"
        className={styles.executionCard}
        extra={
          <Space>
            <Text type="secondary">
              共 {executions.length} 条记录
            </Text>
            <Button size="small" icon={<BarChartOutlined />}>
              导出数据
            </Button>
          </Space>
        }
      >
        <Table
          columns={executionColumns}
          dataSource={executions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条执行记录`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default EnhancedExecutionMonitorPage;
