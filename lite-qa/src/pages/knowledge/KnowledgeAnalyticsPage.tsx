/**
 * 知识库数据分析页面 - 跨知识库的数据分析和统计
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Progress,
  Tag,
  Tooltip,
  Alert,
  Empty
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { knowledgeService } from '../../services/knowledgeService';
import { collectionService } from '../../services/collectionService';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsData {
  overview: {
    totalCollections: number;
    totalDocuments: number;
    totalSize: number;
    vectorizedRate: number;
    avgDocumentsPerCollection: number;
  };
  collections: Array<{
    id: string;
    name: string;
    documentCount: number;
    size: number;
    vectorizedCount: number;
    lastUpdated: string;
    growth: number;
  }>;
  trends: {
    dailyUploads: Array<{ date: string; count: number }>;
    storageGrowth: Array<{ date: string; size: number }>;
    vectorizationProgress: Array<{ date: string; rate: number }>;
  };
  performance: {
    avgProcessingTime: number;
    successRate: number;
    errorRate: number;
    peakUsageHours: string[];
  };
}

const KnowledgeAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalCollections: 0,
      totalDocuments: 0,
      totalSize: 0,
      vectorizedRate: 0,
      avgDocumentsPerCollection: 0
    },
    collections: [],
    trends: {
      dailyUploads: [],
      storageGrowth: [],
      vectorizationProgress: []
    },
    performance: {
      avgProcessingTime: 0,
      successRate: 0,
      errorRate: 0,
      peakUsageHours: []
    }
  });

  // 获取分析数据
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 获取Collection统计
      const collectionsResponse = await collectionService.getCollections();
      const documentsResponse = await knowledgeService.getDocumentStatusStatistics();
      
      if (documentsResponse.success) {
        const { document_status } = documentsResponse.statistics;
        const totalDocuments = Object.values(document_status).reduce((sum: number, count: number) => sum + count, 0);
        const vectorizedDocuments = document_status.vectorized || 0;
        
        // 构建模拟数据 - 实际应用中应从后端API获取
        setAnalytics({
          overview: {
            totalCollections: collectionsResponse.total || 0,
            totalDocuments,
            totalSize: 0, // TODO: 从后端获取
            vectorizedRate: totalDocuments > 0 ? (vectorizedDocuments / totalDocuments) * 100 : 0,
            avgDocumentsPerCollection: collectionsResponse.total > 0 ? totalDocuments / collectionsResponse.total : 0
          },
          collections: collectionsResponse.collections.map((col: any) => ({
            id: col.id,
            name: col.name,
            documentCount: col.document_count || 0,
            size: col.total_size || 0,
            vectorizedCount: 0, // TODO: 计算已向量化文档数
            lastUpdated: col.updated_at || col.created_at,
            growth: Math.random() * 20 - 10 // 模拟增长率
          })),
          trends: {
            dailyUploads: [], // TODO: 从后端获取趋势数据
            storageGrowth: [],
            vectorizationProgress: []
          },
          performance: {
            avgProcessingTime: 0,
            successRate: totalDocuments > 0 ? (vectorizedDocuments / totalDocuments) * 100 : 0,
            errorRate: 0,
            peakUsageHours: []
          }
        });
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 获取增长趋势颜色
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return '#52c41a';
    if (growth < 0) return '#ff4d4f';
    return '#1890ff';
  };

  // 表格列定义
  const columns = [
    {
      title: '知识库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </Space>
      )
    },
    {
      title: '文档数量',
      dataIndex: 'documentCount',
      key: 'documentCount',
      render: (count: number) => (
        <Statistic
          value={count}
          valueStyle={{ fontSize: '14px' }}
          prefix={<FileTextOutlined />}
        />
      )
    },
    {
      title: '向量化进度',
      key: 'vectorization',
      render: (_, record: any) => {
        const rate = record.documentCount > 0 ? (record.vectorizedCount / record.documentCount) * 100 : 0;
        return (
          <div style={{ width: 120 }}>
            <Progress
              percent={Math.round(rate)}
              size="small"
              status={rate === 100 ? 'success' : 'active'}
            />
            <Text style={{ fontSize: '12px', color: '#666' }}>
              {record.vectorizedCount}/{record.documentCount}
            </Text>
          </div>
        );
      }
    },
    {
      title: '存储大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        <Text>{formatFileSize(size)}</Text>
      )
    },
    {
      title: '增长趋势',
      dataIndex: 'growth',
      key: 'growth',
      render: (growth: number) => (
        <Tag color={growth > 0 ? 'green' : growth < 0 ? 'red' : 'blue'}>
          {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
        </Tag>
      )
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      )
    }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            数据分析
          </Title>
          <Paragraph type="secondary">
            跨知识库的数据分析和统计报告
          </Paragraph>
        </div>
        
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="7d">最近7天</Option>
            <Option value="30d">最近30天</Option>
            <Option value="90d">最近90天</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAnalyticsData}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<DownloadOutlined />}
            type="primary"
          >
            导出报告
          </Button>
        </Space>
      </div>

      {/* 概览统计 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识库总数"
              value={analytics.overview.totalCollections}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文档总数"
              value={analytics.overview.totalDocuments}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="向量化率"
              value={analytics.overview.vectorizedRate}
              suffix="%"
              prefix={<ExperimentOutlined />}
              valueStyle={{ 
                color: analytics.overview.vectorizedRate > 80 ? '#52c41a' : 
                       analytics.overview.vectorizedRate > 60 ? '#faad14' : '#ff4d4f'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均文档数"
              value={analytics.overview.avgDocumentsPerCollection}
              precision={1}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix="个/库"
            />
          </Card>
        </Col>
      </Row>

      {/* 知识库详细统计 */}
      <Card
        title="知识库统计详情"
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            <Tag icon={<CalendarOutlined />} color="blue">
              时间范围: {timeRange === '7d' ? '最近7天' : timeRange === '30d' ? '最近30天' : '最近90天'}
            </Tag>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={analytics.collections}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个知识库`
          }}
        />
      </Card>

      {/* 性能分析 */}
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card title="处理性能" loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="平均处理时间"
                  value={analytics.performance.avgProcessingTime}
                  suffix="秒"
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="成功率"
                  value={analytics.performance.successRate}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: analytics.performance.successRate > 90 ? '#52c41a' : '#faad14'
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="使用趋势" loading={loading}>
            {analytics.trends.dailyUploads.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无趋势数据"
              />
            ) : (
              <div>
                {/* TODO: 集成图表库显示趋势图 */}
                <Alert
                  message="趋势图表开发中"
                  description="将集成图表库显示文档上传趋势、存储增长等数据"
                  type="info"
                  showIcon
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KnowledgeAnalyticsPage;