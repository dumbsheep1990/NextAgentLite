/**
 * 统计看板页面
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Badge,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  Typography,
  Divider,
  Alert
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  BookOutlined,
  NodeIndexOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);

  // 模拟数据
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalQuestions: 1245,
      totalAnswers: 1180,
      totalUsers: 156,
      activeAgents: 6,
      todayQuestions: 89,
      todayAnswersRate: 94.2,
      systemUptime: 99.8,
      avgResponseTime: 2.3
    },
    trends: {
      questionTrend: [
        { date: '2025-01-05', count: 45 },
        { date: '2025-01-06', count: 52 },
        { date: '2025-01-07', count: 38 },
        { date: '2025-01-08', count: 67 },
        { date: '2025-01-09', count: 55 },
        { date: '2025-01-10', count: 72 },
        { date: '2025-01-11', count: 89 }
      ],
      categoryDistribution: [
        { category: '知识解答', count: 356, percentage: 28.6 },
        { category: '业务咨询', count: 298, percentage: 23.9 },
        { category: '流程指导', count: 267, percentage: 21.4 },
        { category: '法规查询', count: 201, percentage: 16.1 },
        { category: '其他', count: 123, percentage: 9.9 }
      ]
    },
    agentPerformance: [
      {
        key: '1',
        agentName: '知识解答智能体',
        totalCalls: 456,
        successRate: 96.5,
        avgResponseTime: 2.1,
        status: 'active'
      },
      {
        key: '2',
        agentName: '业务咨询助手',
        totalCalls: 389,
        successRate: 94.8,
        avgResponseTime: 2.5,
        status: 'active'
      },
      {
        key: '3',
        agentName: '流程指导员',
        totalCalls: 312,
        successRate: 97.2,
        avgResponseTime: 1.9,
        status: 'active'
      },
      {
        key: '4',
        agentName: '法规查询专员',
        totalCalls: 234,
        successRate: 93.1,
        avgResponseTime: 2.8,
        status: 'active'
      }
    ],
    recentActivities: [
      {
        key: '1',
        time: '2025-01-11 14:30',
        user: '张三',
        action: '知识咨询',
        question: '关于专业知识问题...',
        status: 'completed'
      },
      {
        key: '2',
        time: '2025-01-11 14:25',
        user: '李四',
        action: 'Team协作',
        question: '企业注册流程详细步骤',
        status: 'processing'
      },
      {
        key: '3',
        time: '2025-01-11 14:20',
        user: '王五',
        action: '法规查询',
        question: '劳动法相关规定查询',
        status: 'completed'
      }
    ]
  });

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里会调用实际的API
      console.log('刷新数据');
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出报告
  const handleExport = () => {
    console.log('导出报告');
  };

  // Agent性能表格列配置
  const agentColumns = [
    {
      title: 'Agent名称',
      dataIndex: 'agentName',
      key: 'agentName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '调用次数',
      dataIndex: 'totalCalls',
      key: 'totalCalls',
      align: 'center' as const,
      render: (value: number) => <Text>{value}</Text>
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      align: 'center' as const,
      render: (value: number) => (
        <div>
          <Text strong color={value >= 95 ? '#52c41a' : value >= 90 ? '#faad14' : '#ff4d4f'}>
            {value}%
          </Text>
          <Progress 
            percent={value} 
            size="small" 
            showInfo={false}
            strokeColor={value >= 95 ? '#52c41a' : value >= 90 ? '#faad14' : '#ff4d4f'}
          />
        </div>
      )
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      align: 'center' as const,
      render: (value: number) => <Text>{value}s</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status === 'active' ? '运行中' : '停止'}
        />
      )
    }
  ];

  // 最近活动表格列配置
  const activityColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 130,
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 80,
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '问题内容',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string) => (
        <Badge
          status={status === 'completed' ? 'success' : 'processing'}
          text={status === 'completed' ? '完成' : '处理中'}
        />
      )
    }
  ];

  // 问题趋势图配置
  const questionTrendConfig = {
    data: dashboardData.trends.questionTrend,
    xField: 'date',
    yField: 'count',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle'
    },
    tooltip: {
      title: '日期',
      formatter: (datum: any) => ({
        name: '问题数量',
        value: `${datum.count} 个`
      })
    }
  };

  // 分类分布饼图配置
  const categoryDistributionConfig = {
    data: dashboardData.trends.categoryDistribution,
    angleField: 'count',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'spider',
      content: '{name}\n{percentage}'
    },
    interactions: [{ type: 'element-active' }]
  };

  return (
    <div style={{ padding: '0', background: '#f5f7fa', minHeight: 'calc(100vh - 88px)' }}>
      {/* 页面头部 */}
      <div style={{ 
        marginBottom: '24px',
        background: 'white',
        padding: '20px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
              系统概览
            </Title>
            <Text type="secondary">
              实时监控系统运行状态和使用情况
            </Text>
          </div>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="YYYY-MM-DD"
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              导出报告
            </Button>
          </Space>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总问题数"
              value={dashboardData.overview.totalQuestions}
              prefix={<MessageOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  <ArrowUpOutlined /> 12%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={dashboardData.overview.totalUsers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  <ArrowUpOutlined /> 8%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行Agents"
              value={dashboardData.overview.activeAgents}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              suffix={<Text type="secondary">/ 6</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="回答准确率"
              value={dashboardData.overview.todayAnswersRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 性能指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card title="今日问题数" extra={<Text type="secondary">vs 昨日</Text>}>
            <Statistic
              value={dashboardData.overview.todayQuestions}
              suffix={
                <Space>
                  <Text type="secondary">个</Text>
                  <Tag color="green">
                    <ArrowUpOutlined /> 15%
                  </Tag>
                </Space>
              }
              valueStyle={{ fontSize: '32px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="系统正常运行时间">
            <Statistic
              value={dashboardData.overview.systemUptime}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}
            />
            <Progress 
              percent={dashboardData.overview.systemUptime} 
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="平均响应时间">
            <Statistic
              value={dashboardData.overview.avgResponseTime}
              precision={1}
              suffix="秒"
              valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">比昨日快 0.3秒</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={16}>
          <Card title="问题趋势" extra={<Select defaultValue="7days" style={{ width: 120 }}>
            <Option value="7days">近7天</Option>
            <Option value="30days">近30天</Option>
            <Option value="90days">近90天</Option>
          </Select>}>
            <Line {...questionTrendConfig} height={300} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="问题分类分布">
            <Pie {...categoryDistributionConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Agent性能和最近活动 */}
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card 
            title="Agent性能监控" 
            extra={
              <Space>
                <Text type="secondary">实时性能数据</Text>
                <Button size="small" icon={<ReloadOutlined />} />
              </Space>
            }
          >
            <Table
              columns={agentColumns}
              dataSource={dashboardData.agentPerformance}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card 
            title="最近活动" 
            extra={<Text type="secondary">实时动态</Text>}
          >
            <Table
              columns={activityColumns}
              dataSource={dashboardData.recentActivities}
              pagination={false}
              size="small"
              scroll={{ y: 250 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统状态提醒 */}
      <div style={{ marginTop: '24px' }}>
        <Alert
          message="系统运行正常"
          description="所有Agent正常运行，知识库同步完成，无异常警告。"
          type="success"
          showIcon
          closable
        />
      </div>
    </div>
  );
};

export default DashboardPage;
