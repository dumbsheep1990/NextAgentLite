/**
 * 文件处理队列监控组件
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Progress,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd';
import {
  ReloadOutlined,
  StopOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { queueService } from '../../services/queueService';
import type { QueueStatus, QueueTask, RunningTask } from '../../services/queueService';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface QueueMonitorProps {
  visible: boolean;
  onClose: () => void;
}

const QueueMonitor: React.FC<QueueMonitorProps> = ({ visible, onClose }) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载队列状态
  const loadQueueStatus = async () => {
    try {
      setLoading(true);
      const status = await queueService.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('加载队列状态失败:', error);
      message.error('加载队列状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消任务
  const handleCancelTask = (taskId: string, fileName: string) => {
    confirm({
      title: '确认取消任务',
      content: `确定要取消任务"${fileName}"吗？`,
      onOk: async () => {
        try {
          await queueService.cancelTask(taskId);
          message.success('任务已取消');
          loadQueueStatus();
        } catch (error) {
          message.error('取消任务失败');
        }
      },
    });
  };

  // 清理已完成任务
  const handleCleanup = () => {
    confirm({
      title: '确认清理',
      content: '确定要清理已完成的任务吗？（保留最近100个）',
      onOk: async () => {
        try {
          await queueService.cleanupCompletedTasks();
          message.success('清理完成');
          loadQueueStatus();
        } catch (error) {
          message.error('清理失败');
        }
      },
    });
  };

  // 获取任务类型图标
  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'document_processing':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'qa_dataset_processing':
        return <DatabaseOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="default">等待中</Tag>;
      case 'running':
        return <Tag icon={<PlayCircleOutlined />} color="processing">处理中</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>;
      case 'failed':
        return <Tag icon={<ExclamationCircleOutlined />} color="error">失败</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 待处理任务表格列
  const pendingColumns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: QueueTask) => (
        <Space>
          {getTaskTypeIcon(record.task_type)}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: string) => queueService.getTaskTypeName(type),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Badge 
          count={priority} 
          style={{ 
            backgroundColor: priority === 1 ? '#ff4d4f' : '#1890ff',
            fontSize: '12px'
          }} 
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: QueueTask) => (
        <Button
          type="text"
          danger
          icon={<StopOutlined />}
          onClick={() => handleCancelTask(record.id, record.file_name)}
        >
          取消
        </Button>
      ),
    },
  ];

  // 运行中任务表格列
  const runningColumns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: RunningTask) => (
        <Space>
          {getTaskTypeIcon(record.task_type)}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: string) => queueService.getTaskTypeName(type),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '运行时长',
      dataIndex: 'started_at',
      key: 'duration',
      render: (startTime: string) => (
        <Text>{queueService.calculateDuration(startTime)}</Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: () => getStatusTag('running'),
    },
  ];

  // 自动刷新
  useEffect(() => {
    if (visible && autoRefresh) {
      loadQueueStatus();
      const interval = setInterval(loadQueueStatus, 5000); // 每5秒刷新
      return () => clearInterval(interval);
    }
  }, [visible, autoRefresh]);

  // 初始加载
  useEffect(() => {
    if (visible) {
      loadQueueStatus();
    }
  }, [visible]);

  return (
    <Modal
      title="文件处理队列监控"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="cleanup" onClick={handleCleanup}>
          清理已完成任务
        </Button>,
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={loadQueueStatus}
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
      {queueStatus && (
        <div>
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <div style={{
                background: 'linear-gradient(135deg, #fff7e6, #fffbf0)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #ffd591',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#faad14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <ClockCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '4px' }}>等待中</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                    {queueStatus.pending_count}
                  </div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{
                background: 'linear-gradient(135deg, #e6f4ff, #f0f8ff)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #91caff',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <PlayCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '4px' }}>处理中</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                    {queueStatus.running_count}
                  </div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{
                background: 'linear-gradient(135deg, #f6ffed, #f0fff0)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #b7eb8f',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <CheckCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '4px' }}>已完成</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                    {queueStatus.completed_count}
                  </div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{
                background: 'linear-gradient(135deg, #f9f0ff, #f6efff)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #d3adf7',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#722ed1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <DatabaseOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '4px' }}>最大并发</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                    {queueStatus.max_concurrent}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* 系统负载指示器 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              <MonitorOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>系统负载</span>
            </div>
            <Progress
              percent={Math.round((queueStatus.running_count / queueStatus.max_concurrent) * 100)}
              status={queueStatus.running_count >= queueStatus.max_concurrent ? 'exception' : 'active'}
              format={() => `${queueStatus.running_count}/${queueStatus.max_concurrent}`}
              strokeColor={{
                '0%': '#1890ff',
                '100%': '#52c41a',
              }}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
              当前有 <span style={{ color: '#1890ff', fontWeight: 500 }}>{queueStatus.running_count}</span> 个任务在处理，
              <span style={{ color: '#faad14', fontWeight: 500 }}>{queueStatus.pending_count}</span> 个任务等待中
            </div>
          </div>

          {/* 运行中任务 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              <PlayCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>运行中任务</span>
            </div>
            <Table
              columns={runningColumns}
              dataSource={queueStatus.running_tasks}
              rowKey="id"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              size="small"
              locale={{ emptyText: '没有运行中的任务' }}
              scroll={{ y: 240 }}
              style={{
                '.ant-table': {
                  backgroundColor: 'transparent'
                }
              }}
            />
          </div>

          {/* 等待中任务 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              <ClockCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>等待中任务</span>
            </div>
            <Table
              columns={pendingColumns}
              dataSource={queueStatus.pending_tasks}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="small"
              locale={{ emptyText: '没有等待中的任务' }}
              scroll={{ y: 300 }}
              style={{
                '.ant-table': {
                  backgroundColor: 'transparent'
                }
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QueueMonitor;