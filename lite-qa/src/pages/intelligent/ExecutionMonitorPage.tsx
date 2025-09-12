/**
 * 执行监控页面 - Youtu Agent性能监控和执行日志分析
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Timeline,
  Alert,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Tabs,
  List,
  Avatar,
  Badge,
  Tooltip,
  Drawer,
  Descriptions,
  Spin,
  Empty,
  message
} from 'antd';
import {
  MonitorOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  EyeOutlined,
  BugOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';
import styles from './ExecutionMonitor.module.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 数据类型定义
interface ExecutionTask {
  id: string;
  query: string;
  strategy: string;
  route: 'agno' | 'youtu' | 'hybrid';
  status: 'running' | 'completed' | 'failed' | 'timeout';
  start_time: string;
  end_time?: string;
  duration?: number;
  response_time: number;
  error_message?: string;
  user_id: string;
  session_id: string;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  active_connections: number;
  api_calls_per_minute: number;
  queue_size: number;
  cache_hit_rate: number;
}

interface PerformanceStats {
  total_executions: number;
  success_rate: number;
  avg_response_time: number;
  error_count: number;
  timeout_count: number;
  peak_qps: number;
}

const ExecutionMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState<ExecutionTask[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    active_connections: 0,
    api_calls_per_minute: 0,
    queue_size: 0,
    cache_hit_rate: 0
  });
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    total_executions: 0,
    success_rate: 0,
    avg_response_time: 0,
    error_count: 0,
    timeout_count: 0,
    peak_qps: 0
  });
  const [selectedTask, setSelectedTask] = useState<ExecutionTask | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(1, 'hour'),
    dayjs()
  ]);
  
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadHistoricalData(),
        loadSystemMetrics(),
        loadPerformanceStats()
      ]);
    } catch (error) {
      message.error('加载监控数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      // 调用真实的API获取任务数据
      const response = await fetch('/api/v1/youtu/monitor/tasks?limit=50');
      if (!response.ok) {
        throw new Error('获取任务数据失败');
      }
      
      const tasks = await response.json();
      
      // 转换数据格式
      const formattedTasks: ExecutionTask[] = tasks.map((task: any) => ({
        id: task.id,
        query: task.query,
        strategy: task.metadata?.strategy_id || 'unknown',
        route: task.metadata?.route || 'agno',
        status: task.status,
        start_time: task.start_time,
        end_time: task.end_time,
        duration: task.duration,
        response_time: task.duration || 0,
        user_id: task.metadata?.user_id || 'unknown',
        session_id: task.session_id || 'unknown'
      }));
      
      setRealTimeData(formattedTasks);
    } catch (error) {
      console.error('加载历史数据失败:', error);
      // 如果API失败，显示空数据
      setRealTimeData([]);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch('/api/v1/youtu/monitor/metrics/system');
      if (!response.ok) {
        throw new Error('获取系统指标失败');
      }
      
      const metrics = await response.json();
      setSystemMetrics({
        cpu_usage: metrics.cpu_usage,
        memory_usage: metrics.memory_usage,
        active_connections: metrics.active_connections,
        api_calls_per_minute: metrics.api_calls_per_minute,
        queue_size: metrics.queue_size,
        cache_hit_rate: metrics.cache_hit_rate
      });
    } catch (error) {
      console.error('加载系统指标失败:', error);
    }
  };

  const loadPerformanceStats = async () => {
    try {
      const response = await fetch('/api/v1/youtu/monitor/metrics/performance');
      if (!response.ok) {
        throw new Error('获取性能指标失败');
      }
      
      const stats = await response.json();
      setPerformanceStats({
        total_executions: stats.total_executions,
        success_rate: stats.success_rate,
        avg_response_time: stats.avg_response_time,
        error_count: stats.error_count,
        timeout_count: stats.timeout_count,
        peak_qps: 0, // 从趋势数据中计算
        current_qps: stats.current_qps
      });
    } catch (error) {
      console.error('加载性能指标失败:', error);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
    message.success('数据已刷新');
  };

  const handleTaskDetail = (task: ExecutionTask) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'timeout': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <ClockCircleOutlined spin />;
      case 'completed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'timeout': return <WarningOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getRouteColor = (route: string) => {
    switch (route) {
      case 'agno': return 'blue';
      case 'youtu': return 'purple';
      case 'hybrid': return 'orange';
      default: return 'default';
    }
  };

  // 表格列定义
  const taskColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'running' ? '执行中' : 
           status === 'completed' ? '完成' :
           status === 'failed' ? '失败' : '超时'}
        </Tag>
      )
    },
    {
      title: '查询内容',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '路由',
      dataIndex: 'route',
      key: 'route',
      width: 80,
      render: (route: string) => (
        <Tag color={getRouteColor(route)}>
          {route.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 100,
      render: (time: number) => `${Math.round(time)}ms`
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 120,
      render: (time: string) => dayjs(time).format('HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: ExecutionTask) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleTaskDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  // 性能图表数据
  const performanceChartData = Array.from({ length: 24 }, (_, i) => ({
    time: dayjs().subtract(23 - i, 'hours').format('HH:mm'),
    success_rate: Math.random() * 20 + 80,
    response_time: Math.random() * 1000 + 1000,
    qps: Math.random() * 30 + 10
  }));

  const routeDistributionData = [
    { type: 'Agno框架', value: 45, color: '#1890ff' },
    { type: 'Youtu-Agent', value: 35, color: '#722ed1' },
    { type: '混合执行', value: 20, color: '#fa8c16' }
  ];

  return (
    <div className={styles.executionMonitorPage}>
      <div className={styles.pageHeader}>
        <Title level={2}>
          <MonitorOutlined /> 执行监控
        </Title>
        <Paragraph>
          实时监控Youtu-Agent执行状态，分析性能指标和系统资源使用情况
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="realtime" size="large">
        {/* 实时监控 */}
        <TabPane tab="实时监控" key="realtime">
          <Row gutter={[16, 16]}>
            {/* 系统指标卡片 */}
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="CPU使用率"
                  value={systemMetrics.cpu_usage}
                  precision={1}
                  suffix="%"
                  prefix={<CloudServerOutlined />}
                  valueStyle={{ color: systemMetrics.cpu_usage > 80 ? '#cf1322' : '#3f8600' }}
                />
                <Progress 
                  percent={systemMetrics.cpu_usage} 
                  showInfo={false} 
                  strokeColor={systemMetrics.cpu_usage > 80 ? '#ff4d4f' : '#52c41a'}
                  size="small"
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="内存使用率"
                  value={systemMetrics.memory_usage}
                  precision={1}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: systemMetrics.memory_usage > 85 ? '#cf1322' : '#3f8600' }}
                />
                <Progress 
                  percent={systemMetrics.memory_usage} 
                  showInfo={false}
                  strokeColor={systemMetrics.memory_usage > 85 ? '#ff4d4f' : '#52c41a'}
                  size="small"
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="活跃连接"
                  value={systemMetrics.active_connections}
                  prefix={<ApiOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="API调用/分钟"
                  value={systemMetrics.api_calls_per_minute}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card 
                title="实时执行任务" 
                extra={
                  <Space>
                    <Badge count={realTimeData.filter(t => t.status === 'running').length} showZero>
                      <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                        刷新
                      </Button>
                    </Badge>
                  </Space>
                }
              >
                <Table
                  dataSource={realTimeData}
                  columns={taskColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  loading={loading}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 性能分析 */}
        <TabPane tab="性能分析" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总执行次数"
                  value={performanceStats.total_executions}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="成功率"
                  value={performanceStats.success_rate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={performanceStats.avg_response_time}
                  precision={0}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="峰值QPS"
                  value={performanceStats.peak_qps}
                  precision={1}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card title="性能趋势">
                <Line
                  data={performanceChartData}
                  xField="time"
                  yField="success_rate"
                  height={300}
                  smooth
                  color="#1890ff"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="路由分布">
                <Pie
                  data={routeDistributionData}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  height={300}
                  label={{
                    type: 'outer',
                    content: '{name} {percentage}'
                  }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 错误日志 */}
        <TabPane tab="错误日志" key="errors">
          <Card title="错误统计" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="错误总数"
                  value={performanceStats.error_count}
                  prefix={<BugOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="超时次数"
                  value={performanceStats.timeout_count}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="错误率"
                  value={(performanceStats.error_count / performanceStats.total_executions) * 100}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="超时率"
                  value={(performanceStats.timeout_count / performanceStats.total_executions) * 100}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="错误日志">
            <List
              dataSource={realTimeData.filter(t => t.status === 'failed' || t.status === 'timeout')}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => handleTaskDetail(item)}>
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.status === 'failed' ? <CloseCircleOutlined /> : <WarningOutlined />}
                        style={{ 
                          backgroundColor: item.status === 'failed' ? '#ff4d4f' : '#faad14' 
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{item.query}</Text>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status === 'failed' ? '执行失败' : '执行超时'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          路由: {item.route.toUpperCase()} | 策略: {item.strategy}
                        </Text>
                        <Text type="secondary">
                          时间: {dayjs(item.start_time).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务执行详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedTask && (
          <div>
            <Descriptions title="基本信息" bordered column={1}>
              <Descriptions.Item label="任务ID">{selectedTask.id}</Descriptions.Item>
              <Descriptions.Item label="查询内容">{selectedTask.query}</Descriptions.Item>
              <Descriptions.Item label="执行策略">{selectedTask.strategy}</Descriptions.Item>
              <Descriptions.Item label="路由方式">
                <Tag color={getRouteColor(selectedTask.route)}>
                  {selectedTask.route.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="执行状态">
                <Tag color={getStatusColor(selectedTask.status)} icon={getStatusIcon(selectedTask.status)}>
                  {selectedTask.status === 'running' ? '执行中' : 
                   selectedTask.status === 'completed' ? '完成' :
                   selectedTask.status === 'failed' ? '失败' : '超时'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {dayjs(selectedTask.start_time).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedTask.end_time && (
                <Descriptions.Item label="结束时间">
                  {dayjs(selectedTask.end_time).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="响应时间">
                {Math.round(selectedTask.response_time)}ms
              </Descriptions.Item>
              {selectedTask.duration && (
                <Descriptions.Item label="总耗时">
                  {Math.round(selectedTask.duration)}ms
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedTask.error_message && (
              <Alert
                message="错误信息"
                description={selectedTask.error_message}
                type="error"
                style={{ marginTop: 16 }}
              />
            )}

            <Card title="执行时间线" style={{ marginTop: 16 }}>
              <Timeline>
                <Timeline.Item color="blue">
                  <Text strong>任务开始</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(selectedTask.start_time).format('HH:mm:ss')}
                  </Text>
                </Timeline.Item>
                <Timeline.Item color="green">
                  <Text strong>策略选择: {selectedTask.strategy}</Text>
                  <br />
                  <Text type="secondary">路由到 {selectedTask.route.toUpperCase()}</Text>
                </Timeline.Item>
                {selectedTask.end_time && (
                  <Timeline.Item 
                    color={selectedTask.status === 'completed' ? 'green' : 'red'}
                  >
                    <Text strong>
                      {selectedTask.status === 'completed' ? '执行完成' : '执行失败'}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedTask.end_time).format('HH:mm:ss')}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ExecutionMonitorPage;
