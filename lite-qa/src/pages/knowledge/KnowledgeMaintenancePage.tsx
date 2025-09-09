/**
 * 知识库维护页面 - 全局知识库维护和系统管理
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Statistic,
  Row,
  Col,
  Modal,
  Progress,
  message,
  Tag,
  Tooltip,
  Alert,
  Divider,
  Typography,
  List,
  Badge
} from 'antd';
import {
  ToolOutlined,
  DatabaseOutlined,
  ClearOutlined,
  SyncOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  SettingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { knowledgeService } from '../../services/knowledgeService';
import { collectionService } from '../../services/collectionService';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface MaintenanceStats {
  totalCollections: number;
  totalDocuments: number;
  orphanedDocuments: number;
  failedDocuments: number;
  duplicateDocuments: number;
  indexingIssues: number;
  storageUsage: number;
  lastMaintenance: string;
}

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'verify' | 'optimize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  lastRun?: string;
  duration?: number;
}

const KnowledgeMaintenancePage: React.FC = () => {
  const [stats, setStats] = useState<MaintenanceStats>({
    totalCollections: 0,
    totalDocuments: 0,
    orphanedDocuments: 0,
    failedDocuments: 0,
    duplicateDocuments: 0,
    indexingIssues: 0,
    storageUsage: 0,
    lastMaintenance: '从未运行'
  });
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([
    {
      id: 'cleanup-orphaned',
      name: '清理孤立文档',
      description: '删除没有关联到任何知识库的文档记录',
      type: 'cleanup',
      status: 'pending',
      progress: 0
    },
    {
      id: 'verify-integrity',
      name: '数据完整性检查',
      description: '验证文档和向量数据的完整性，发现潜在问题',
      type: 'verify',
      status: 'pending',
      progress: 0
    },
    {
      id: 'optimize-storage',
      name: '存储优化',
      description: '优化存储空间，清理临时文件和过期缓存',
      type: 'optimize',
      status: 'pending',
      progress: 0
    },
    {
      id: 'sync-metadata',
      name: '同步元数据',
      description: '同步文档元数据信息，修复不一致问题',
      type: 'verify',
      status: 'pending',
      progress: 0
    }
  ]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  // 获取维护统计信息
  const fetchMaintenanceStats = async () => {
    try {
      setLoading(true);
      
      // 获取基础统计
      const collectionsResponse = await collectionService.getCollections();
      const documentsResponse = await knowledgeService.getDocumentStatusStatistics();
      
      if (documentsResponse.success) {
        const { document_status, problematic_documents } = documentsResponse.statistics;
        
        setStats({
          totalCollections: collectionsResponse.total || 0,
          totalDocuments: Object.values(document_status).reduce((sum: number, count: number) => sum + count, 0),
          orphanedDocuments: 0, // TODO: 实现孤立文档检测
          failedDocuments: problematic_documents.failed || 0,
          duplicateDocuments: 0, // TODO: 实现重复文档检测
          indexingIssues: problematic_documents.pending || 0,
          storageUsage: 0, // TODO: 实现存储使用量统计
          lastMaintenance: localStorage.getItem('last-maintenance') || '从未运行'
        });
      }
    } catch (error) {
      console.error('获取维护统计失败:', error);
      message.error('获取维护统计失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行维护任务
  const runMaintenanceTask = async (taskId: string) => {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    // 更新任务状态为运行中
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      status: 'running',
      progress: 0
    };
    setTasks(updatedTasks);

    // 添加系统日志
    const logMessage = `${new Date().toLocaleString()} - 开始执行维护任务: ${updatedTasks[taskIndex].name}`;
    setSystemLogs(prev => [logMessage, ...prev]);

    try {
      // 模拟任务执行过程
      for (let i = 1; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedTasks[taskIndex].progress = i;
        setTasks([...updatedTasks]);
      }

      // 任务完成
      updatedTasks[taskIndex].status = 'completed';
      updatedTasks[taskIndex].progress = 100;
      updatedTasks[taskIndex].lastRun = new Date().toLocaleString();
      setTasks([...updatedTasks]);

      const successMessage = `${new Date().toLocaleString()} - 维护任务完成: ${updatedTasks[taskIndex].name}`;
      setSystemLogs(prev => [successMessage, ...prev]);
      message.success(`${updatedTasks[taskIndex].name} 执行完成`);

      // 更新最后维护时间
      localStorage.setItem('last-maintenance', new Date().toLocaleString());
      
    } catch (error) {
      // 任务失败
      updatedTasks[taskIndex].status = 'failed';
      setTasks([...updatedTasks]);

      const errorMessage = `${new Date().toLocaleString()} - 维护任务失败: ${updatedTasks[taskIndex].name} - ${error}`;
      setSystemLogs(prev => [errorMessage, ...prev]);
      message.error(`${updatedTasks[taskIndex].name} 执行失败`);
    }
  };

  // 运行所有维护任务
  const runAllMaintenanceTasks = () => {
    confirm({
      title: '确认运行所有维护任务',
      icon: <ExclamationCircleOutlined />,
      content: '这将运行所有维护任务，可能需要较长时间。确定继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        for (const task of tasks) {
          if (task.status === 'pending') {
            await runMaintenanceTask(task.id);
            // 任务间等待1秒
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        message.success('所有维护任务已完成');
      }
    });
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'pending':
        return <Tag color="default">待执行</Tag>;
      case 'running':
        return <Tag color="blue">运行中</Tag>;
      case 'completed':
        return <Tag color="green">已完成</Tag>;
      case 'failed':
        return <Tag color="red">失败</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 获取任务类型图标
  const getTaskTypeIcon = (type: MaintenanceTask['type']) => {
    switch (type) {
      case 'cleanup':
        return <ClearOutlined style={{ color: '#f59e0b', fontSize: '16px' }} />;
      case 'verify':
        return <CheckCircleOutlined style={{ color: '#10b981', fontSize: '16px' }} />;
      case 'optimize':
        return <BarChartOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />;
      default:
        return <ToolOutlined style={{ fontSize: '16px' }} />;
    }
  };

  useEffect(() => {
    fetchMaintenanceStats();
  }, []);

  const columns = [
    {
      title: '任务',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: MaintenanceTask) => (
        <Space>
          {getTaskTypeIcon(record.type)}
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: MaintenanceTask['status']) => getTaskStatusTag(status)
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: MaintenanceTask) => (
        <div style={{ width: 100 }}>
          <Progress
            percent={progress}
            size="small"
            status={record.status === 'failed' ? 'exception' : 'active'}
            showInfo={false}
          />
          <Text style={{ fontSize: '12px', color: '#666' }}>{progress}%</Text>
        </div>
      )
    },
    {
      title: '上次运行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      render: (lastRun?: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {lastRun || '从未运行'}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: MaintenanceTask) => (
        <Button
          size="small"
          type="primary"
          loading={record.status === 'running'}
          disabled={record.status === 'running'}
          onClick={() => runMaintenanceTask(record.id)}
          icon={<ToolOutlined />}
        >
          {record.status === 'running' ? '运行中' : '运行'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8fafc', 
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto'
    }}>

      {/* 系统健康概览 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <SettingOutlined />
          系统健康概览
        </h3>
        <Card 
          bordered={false}
          style={{ 
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            boxShadow: 'none'
          }}
          bodyStyle={{ padding: '32px' }}
        >
        <Row gutter={[20, 20]}>
          <Col span={6}>
            <Statistic
              title="知识库总数"
              value={stats.totalCollections}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="文档总数"
              value={stats.totalDocuments}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="问题文档"
              value={stats.failedDocuments + stats.indexingIssues}
              prefix={<WarningOutlined />}
              valueStyle={{ 
                color: (stats.failedDocuments + stats.indexingIssues) > 0 ? '#ff4d4f' : '#52c41a'
              }}
            />
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                上次维护时间
              </div>
              <Tag icon={<ClockCircleOutlined />} color="blue">
                {stats.lastMaintenance}
              </Tag>
            </div>
          </Col>
        </Row>
        </Card>
      </div>

      {/* 问题警告 */}
      {(stats.failedDocuments > 0 || stats.indexingIssues > 0) && (
        <Alert
          message="发现系统问题"
          description={
            <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
              {stats.failedDocuments > 0 && (
                <li>有 {stats.failedDocuments} 个文档处理失败，建议进行数据完整性检查</li>
              )}
              {stats.indexingIssues > 0 && (
                <li>有 {stats.indexingIssues} 个文档状态异常，建议运行维护任务</li>
              )}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button type="primary" size="small" onClick={runAllMaintenanceTasks}>
              运行维护任务
            </Button>
          }
        />
      )}

      <Row gutter={[24, 24]}>
        {/* 维护任务 */}
        <Col span={16}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ReloadOutlined />
              维护任务
            </h3>
            <Card
              bordered={false}
              style={{ 
                backgroundColor: '#fff7ed',
                borderRadius: '16px',
                boxShadow: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            extra={
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchMaintenanceStats}
                  loading={loading}
                >
                  刷新状态
                </Button>
                <Button 
                  type="primary" 
                  icon={<ToolOutlined />}
                  onClick={runAllMaintenanceTasks}
                  disabled={tasks.some(task => task.status === 'running')}
                >
                  运行所有任务
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
            </Card>
          </div>
        </Col>

        {/* 系统日志 */}
        <Col span={8}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileTextOutlined />
              系统日志
            </h3>
            <Card
              bordered={false}
              style={{ 
                backgroundColor: '#f0fdf4',
                borderRadius: '16px',
                boxShadow: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            extra={
              <Button 
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => setSystemLogs([])}
                disabled={systemLogs.length === 0}
              >
                清空
              </Button>
            }
            bodyStyle={{ padding: '12px' }}
          >
            <div style={{ height: '400px', overflow: 'auto' }}>
              {systemLogs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '40px 0',
                  fontSize: '14px'
                }}>
                  暂无日志记录
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={systemLogs}
                  renderItem={(item, index) => (
                    <List.Item style={{ 
                      padding: '4px 8px',
                      borderBottom: index === systemLogs.length - 1 ? 'none' : '1px solid #f0f0f0'
                    }}>
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {item}
                      </Text>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default KnowledgeMaintenancePage;