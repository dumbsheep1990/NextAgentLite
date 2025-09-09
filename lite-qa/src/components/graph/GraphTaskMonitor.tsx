/**
 * 知识图谱任务监控组件
 * 融合了进度显示和队列监控功能
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Progress,
  Row,
  Col,
  Statistic,
  Badge,
  Divider,
  message,
  Tabs
} from 'antd';
import {
  ReloadOutlined,
  StopOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  CloseOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { GraphExtractionProgress, type ExtractionProgress } from './GraphExtractionProgress';

const { Title, Text } = Typography;

interface GraphTask {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  stage?: string;
  detail?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  extractionResult?: {
    entitiesCount: number;
    relationshipsCount: number;
  };
}

interface GraphTaskMonitorProps {
  visible: boolean;
  onClose: () => void;
  currentExtractionProgress?: ExtractionProgress | null;
  onCancelExtraction?: (documentId: string) => void;
  defaultActiveTab?: string; // 默认激活的Tab页
}

const GraphTaskMonitor: React.FC<GraphTaskMonitorProps> = ({
  visible,
  onClose,
  currentExtractionProgress,
  onCancelExtraction,
  defaultActiveTab = 'queue'
}) => {
  const [tasks, setTasks] = useState<GraphTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  
  // 当visible和defaultActiveTab变化时更新activeTab
  useEffect(() => {
    if (visible) {
      setActiveTab(defaultActiveTab);
    }
  }, [visible, defaultActiveTab]);
  const [statistics, setStatistics] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  // 加载知识图谱任务列表
  const loadGraphTasks = async () => {
    try {
      setLoading(true);
      
      // 获取知识图谱文档统计
      const statsResponse = await fetch('/api/v1/graph/documents/status-statistics');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        
        // 支持多种状态值的映射
        const pending = (stats.pending_count || 0) + (stats.uploaded_count || 0);
        const processing = (stats.processing_count || 0) + (stats.vectorizing_count || 0) + (stats.extracting_count || 0);
        const completed = (stats.completed_count || 0) + (stats.vectorized_count || 0);
        const failed = (stats.failed_count || 0) + (stats.error_count || 0);
        
        setStatistics({
          pending,
          processing,
          completed,
          failed
        });
      }

      // 获取任务列表（这里可以根据实际API调整）
      const tasksResponse = await fetch('/api/v1/graph/documents?limit=50&sort=created_at:desc');
      if (tasksResponse.ok) {
        const result = await tasksResponse.json();
        const documents = result.documents || [];
        
        const graphTasks: GraphTask[] = documents.map((doc: any) => ({
          id: doc.id,
          fileName: doc.title || doc.filename || 'Unknown',
          fileSize: doc.fileSize || doc.file_size || 0,
          status: doc.status || 'pending',
          createdAt: doc.uploadTime || doc.upload_time || doc.created_at,
          startedAt: doc.uploadTime || doc.upload_time,
          completedAt: doc.status === 'completed' ? doc.uploadTime || doc.upload_time : undefined,
          error: doc.metadata?.processing_error || doc.error_message,
          extractionResult: doc.extractionResult ? {
            entitiesCount: doc.extractionResult.entities_count || 0,
            relationshipsCount: doc.extractionResult.relationships_count || 0
          } : undefined
        }));
        
        setTasks(graphTasks);
      }
    } catch (error) {
      console.error('加载知识图谱任务失败:', error);
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
      case 'uploaded':
        return <Tag icon={<ClockCircleOutlined />} color="default">等待处理</Tag>;
      case 'processing':
      case 'vectorizing':
      case 'extracting':
        return <Tag icon={<PlayCircleOutlined />} color="processing">处理中</Tag>;
      case 'completed':
      case 'vectorized':
        return <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>;
      case 'failed':
      case 'error':
        return <Tag icon={<ExclamationCircleOutlined />} color="error">失败</Tag>;
      default:
        return <Tag color="default">{status || '未知'}</Tag>;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // 任务表格列
  const taskColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => (
        <Space>
          <ApartmentOutlined style={{ color: '#1890ff' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '结果',
      key: 'result',
      render: (record: GraphTask) => {
        if (record.extractionResult) {
          return (
            <Space direction="vertical" size="small">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                实体: {record.extractionResult.entitiesCount}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                关系: {record.extractionResult.relationshipsCount}
              </Text>
            </Space>
          );
        }
        if (record.error) {
          return <Text type="danger" style={{ fontSize: '12px' }}>{record.error}</Text>;
        }
        return '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => {
        if (!time) return '-';
        try {
          return new Date(time).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (error) {
          return time; // 如果格式化失败，显示原始值
        }
      },
    },
  ];

  // 自动刷新
  useEffect(() => {
    if (visible && autoRefresh) {
      loadGraphTasks();
      const interval = setInterval(loadGraphTasks, 10000); // 每10秒刷新
      return () => clearInterval(interval);
    }
  }, [visible, autoRefresh]);

  // 初始加载
  useEffect(() => {
    if (visible) {
      loadGraphTasks();
    }
  }, [visible]);

  return (
    <Modal
      title={
        <Space>
          <ApartmentOutlined />
          知识图谱任务监控
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={loadGraphTasks}
          loading={loading}
        >
          刷新
        </Button>,
        <Button
          key="auto-refresh"
          type={autoRefresh ? 'primary' : 'default'}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? '停止自动刷新' : '启动自动刷新'}
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'queue',
            label: (
              <Space>
                <UnorderedListOutlined />
                队列管理
                {statistics.processing > 0 && (
                  <Badge count={statistics.processing} size="small" />
                )}
              </Space>
            ),
            children: (
              <div>
                {/* 统计信息 */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="等待处理"
                        value={statistics.pending}
                        prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="处理中"
                        value={statistics.processing}
                        prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="已完成"
                        value={statistics.completed}
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="失败"
                        value={statistics.failed}
                        prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 任务列表 */}
                <Card>
                  <Title level={5}>任务历史</Title>
                  <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    size="small"
                    locale={{ emptyText: '暂无知识图谱任务' }}
                    scroll={{ y: 400 }}
                    loading={loading}
                  />
                </Card>
              </div>
            )
          },
          {
            key: 'progress',
            label: (
              <Space>
                <FileTextOutlined />
                提取进度
                {currentExtractionProgress && (
                  <Badge status="processing" />
                )}
              </Space>
            ),
            children: (
              <div>
                {/* 当前进度显示 */}
                {currentExtractionProgress ? (
                  <Card 
                    title="当前处理任务"
                    size="small"
                    extra={
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => onCancelExtraction?.(currentExtractionProgress.documentId)}
                      >
                        取消任务
                      </Button>
                    }
                  >
                    <GraphExtractionProgress
                      visible={true}
                      progress={currentExtractionProgress}
                      onClose={() => {}}
                      onCancel={onCancelExtraction || (() => {})}
                      embedded={true} // 嵌入模式，不显示Modal
                    />
                  </Card>
                ) : (
                  <Card>
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 0',
                      color: '#999'
                    }}>
                      <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <div>当前没有进行中的提取任务</div>
                    </div>
                  </Card>
                )}
              </div>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default GraphTaskMonitor;