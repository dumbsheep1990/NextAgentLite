/**
 * 智能网页抓取任务监控页面
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Form,
  Space,
  Tag,
  Progress,
  message,
  Modal,
  Select,
  Divider,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  List,
  Typography,
  Switch,
  Badge,
  notification,
  TreeSelect
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
  GlobalOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  DownloadOutlined,
  SettingOutlined,
  WifiOutlined,
  DisconnectOutlined,
  SyncOutlined,
  FileTextOutlined,
  FolderOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import deepScrapeService from '../../services/deepScrapeService';
import { getWebSocketUrl } from '../../config/appConfig';
import type { DeepScrapeTask, DeepScrapeRequest } from '../../services/deepScrapeService';
import { collectionService } from '../../services/collectionService';
import { FolderTreeView } from '../../components/knowledge/FolderTreeView';
import type { KnowledgeCollection } from '../../services/collectionService';
import type { FolderInfo } from '../../services/folderService';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

interface ServiceStatus {
  status: string;
  health: any;
  lastCheck: string;
}

interface RealtimeConnection {
  connected: boolean;
  lastHeartbeat: string;
  reconnectAttempts: number;
}

const IntelligentCrawlerPage: React.FC = () => {
  // 状态管理
  const [tasks, setTasks] = useState<DeepScrapeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    status: 'unknown',
    health: { available: false },
    lastCheck: ''
  });
  
  // 实时监控连接状态
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnection>({
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0
  });
  
  // WebSocket引用
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal状态
  const [newTaskVisible, setNewTaskVisible] = useState(false);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DeepScrapeTask | null>(null);

  // 表单状态
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 知识库相关状态
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [usePublicWorkspace, setUsePublicWorkspace] = useState(true);
  const [publicWorkspaceTasks, setPublicWorkspaceTasks] = useState<DeepScrapeTask[]>([]);

  // 获取服务状态
  const fetchServiceStatus = async () => {
    try {
      const status = await deepScrapeService.getServiceStatus();
      setServiceStatus({
        ...status,
        lastCheck: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('获取服务状态失败:', error);
      setServiceStatus({
        status: 'error',
        health: { available: false, error: error.message },
        lastCheck: new Date().toLocaleString()
      });
    }
  };

  // 初始化WebSocket连接
  const initializeWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // 使用后端WebSocket URL工具，避免路径错误。后端路由为 /api/v1/ws/tasks
      const wsUrl = getWebSocketUrl('/url-crawl/ws/tasks');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        setConnectionStatus({
          connected: true,
          lastHeartbeat: new Date().toISOString(),
          reconnectAttempts: 0
        });
        
        // 启动心跳检测
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('WebSocket消息解析失败:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket连接已关闭:', event.code, event.reason);
        setConnectionStatus(prev => ({ ...prev, connected: false }));
        stopHeartbeat();
        
        // 自动重连（非正常关闭时）
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        setConnectionStatus(prev => ({ ...prev, connected: false }));
      };

    } catch (error) {
      console.error('WebSocket初始化失败:', error);
    }
  };

  // 处理实时更新
  const handleRealtimeUpdate = (data: any) => {
    const now = new Date().toISOString();
    setConnectionStatus(prev => ({ ...prev, lastHeartbeat: now }));

    switch (data.type) {
      case 'task_update':
        // 更新特定任务
        setTasks(prev => prev.map(task => 
          task.id === data.task.id ? { ...task, ...data.task } : task
        ));
        break;
        
      case 'task_created':
        // 新任务创建
        setTasks(prev => [data.task, ...prev]);
        notification.info({
          message: '新任务已创建',
          description: `任务 ${data.task.id.substring(0, 8)} 已开始执行`,
          placement: 'topRight'
        });
        break;
        
      case 'task_completed':
        // 任务完成
        setTasks(prev => prev.map(task => 
          task.id === data.task.id ? { ...task, ...data.task } : task
        ));
        notification.success({
          message: '任务执行完成',
          description: `任务 ${data.task.id.substring(0, 8)} 已成功完成`,
          placement: 'topRight'
        });
        break;
        
      case 'task_failed':
        // 任务失败
        setTasks(prev => prev.map(task => 
          task.id === data.task.id ? { ...task, ...data.task } : task
        ));
        notification.error({
          message: '任务执行失败',
          description: `任务 ${data.task.id.substring(0, 8)} 执行失败: ${data.task.error}`,
          placement: 'topRight'
        });
        break;
        
      case 'heartbeat':
        // 心跳响应
        break;
        
      default:
        console.log('未知的WebSocket消息类型:', data.type);
    }
  };

  // 启动心跳检测
  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30秒心跳
  };

  // 停止心跳检测
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // 计划重连
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
    console.log(`${delay}ms后尝试重连WebSocket...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      initializeWebSocket();
    }, delay);
  };

  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, '用户主动关闭');
      wsRef.current = null;
    }
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // 手动重连WebSocket
  const manualReconnect = () => {
    if (!connectionStatus.connected) {
      message.info('正在重新连接...');
      setConnectionStatus(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
      connectWebSocket();
    }
  };

  // 获取任务列表（REST 兜底）
  const fetchTasks = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      console.log('开始获取任务列表...');
      const response = await deepScrapeService.getTaskList({
        page,
        size
      });
      console.log('任务列表响应:', response);
      
      setTasks(response.tasks || []);
      setPagination({
        current: page,
        pageSize: size,
        total: response.total || 0
      });
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error(`获取任务列表失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 简单的重连封装
  const connectWebSocket = () => {
    try {
      closeWebSocket();
    } catch {}
    initializeWebSocket();
  };

  // 提交新任务
  const handleSubmitTask = async (values: any) => {
    try {
      setSubmitLoading(true);
      
      const urls = values.urls.split('\n').filter((url: string) => url.trim());
      
      const request: DeepScrapeRequest = {
        urls,
        batch_mode: urls.length > 1,
        concurrency: values.concurrency || 3,
        summary_enabled: values.summary_enabled || false,
        max_summary_length: values.max_summary_length || 300,
        options: {
          timeout: values.timeout || 30,
          ...values.advanced_options
        }
      };

      if (values.extraction_schema) {
        try {
          request.extraction_schema = JSON.parse(values.extraction_schema);
        } catch (error) {
          message.error('提取规则JSON格式错误');
          return;
        }
      }

      // 根据是否保存到知识库决定调用哪个API
      let response;
      if (values.save_to_knowledge && values.collection_id) {
        // 保存到知识库
        response = await deepScrapeService.submitScrapeToKnowledgeTask({
          ...request,
          collection_id: values.collection_id,
          folder_id: values.folder_id || null
        });
      } else {
        // 保存到公共工作空间
        response = await deepScrapeService.submitScrapeTask(request);
      }

      if (response.success) {
        message.success('任务提交成功');
        setNewTaskVisible(false);
        form.resetFields();
        fetchTasks(); // 刷新任务列表
      } else {
        message.error(`任务提交失败: ${response.message}`);
      }
    } catch (error) {
      console.error('提交任务失败:', error);
      message.error(`提交任务失败: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await deepScrapeService.cancelTask(taskId);
      if (response.success) {
        message.success('任务已取消');
        fetchTasks();
      } else {
        message.error(`取消任务失败: ${response.message}`);
      }
    } catch (error) {
      console.error('取消任务失败:', error);
      message.error('取消任务失败');
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await deepScrapeService.deleteTask(taskId);
      if (response.success) {
        message.success('任务已删除');
        fetchTasks();
      } else {
        message.error(`删除任务失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('删除任务失败');
    }
  };

  // 查看任务详情（从后端获取含 results 的详情）
  const handleViewTask = async (task: DeepScrapeTask) => {
    setTaskDetailVisible(true);
    try {
      const detail = await deepScrapeService.getTaskDetail(task.id);
      if (detail) {
        setSelectedTask({ ...task, ...detail });
      } else {
        setSelectedTask(task);
      }
    } catch (e) {
      console.error('获取任务详情失败:', e);
      setSelectedTask(task);
    }
  };

  // 表格列定义
  const columns: ColumnsType<DeepScrapeTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text code copyable={{ text: id }}>
          {id.substring(0, 8)}...
        </Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          'single_url': { color: 'blue', text: '单URL' },
          'batch_urls': { color: 'purple', text: '批量URL' },
          'website_crawl': { color: 'orange', text: '网站爬取' }
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'URL数量',
      key: 'url_count',
      width: 100,
      render: (_, task) => (
        <span>{task.urls?.length || 0}</span>
      )
    },
    {
      title: '知识库',
      dataIndex: 'collection_name',
      key: 'collection_name',
      width: 180,
      render: (collectionName: string, task) => {
        // 兼容后端：优先使用顶层 collection_name，其次基于 collection_id 或 metadata.options.collection_id 映射名称
        const cid = (task as any).collection_id || task.metadata?.options?.collection_id;
        const name = collectionName || (cid ? (collections.find(c => c.id === cid)?.name || cid) : '');
        if (name) {
          return (
            <Tag color="blue" icon={<FileTextOutlined />}>
              {name}
            </Tag>
          );
        }
        return (
          <Tag color="default" icon={<GlobalOutlined />}>
            公共工作空间
          </Tag>
        );
      }
    },
    {
      title: '文件夹',
      dataIndex: 'folder_path',
      key: 'folder_path',
      width: 150,
      render: (folderPath: string) => {
        if (folderPath) {
          return (
            <Tooltip title={folderPath}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <FolderOutlined style={{ marginRight: 4 }} />
                {folderPath.length > 20 ? `${folderPath.substring(0, 20)}...` : folderPath}
              </span>
            </Tooltip>
          );
        }
        return <span style={{ color: '#999' }}>根目录</span>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          'pending': { color: 'orange', icon: <ClockCircleOutlined />, text: '等待中' },
          'running': { color: 'blue', icon: <LoadingOutlined spin />, text: '运行中' },
          'completed': { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },
          'failed': { color: 'red', icon: <ExclamationCircleOutlined />, text: '失败' }
        };
        const config = statusConfig[status] || { color: 'default', icon: null, text: status };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, task) => (
        <div>
          <Progress
            percent={progress}
            size="small"
            status={task.status === 'failed' ? 'exception' : 'active'}
          />
          {task.metadata && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {task.metadata.completed_urls || 0}/{task.metadata.total_urls || 0}
            </Text>
          )}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, task) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTask(task)}
            />
          </Tooltip>
          
          {task.status === 'running' && (
            <Tooltip title="取消任务">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleCancelTask(task.id)}
              />
            </Tooltip>
          )}
          
          {task.status !== 'running' && (
            <Tooltip title="删除任务">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(task.id)}
              />
            </Tooltip>
          )}
          
          {task.status === 'completed' && task.results && (
            <Tooltip title="下载结果">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(task.results, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `deepscrape-${task.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // 获取知识库列表
  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const response = await collectionService.getCollections();
      console.log('知识库列表响应:', response);
      // 直接使用response，因为getCollections已经返回了正确的格式
      if (response && response.collections) {
        setCollections(response.collections);
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setLoadingCollections(false);
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = (folderId: string, folder: FolderInfo) => {
    setSelectedFolder(folderId);
    form.setFieldsValue({ folder_id: folderId });
    console.log('选择的文件夹:', folder);
  };

  // 处理知识库选择变化
  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setSelectedFolder(null);
    form.setFieldsValue({ folder_id: undefined });
  };

  // 初始化
  useEffect(() => {
    fetchServiceStatus();
    fetchTasks();
    fetchCollections();
    
    // 初始化WebSocket连接（默认总是连接）
    initializeWebSocket();
    
    // 定期检查服务状态
    const statusInterval = setInterval(fetchServiceStatus, 30000);
    // 兜底轮询任务列表，避免 WS 失败时列表不更新
    const pollInterval = setInterval(() => fetchTasks(pagination.current, pagination.pageSize), 10000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(pollInterval);
      closeWebSocket();
    };
  }, []);

  // 衍生列表：公共工作空间 vs 知识库任务
  const publicTasks = React.useMemo(() => {
    return (tasks || []).filter(t => {
      const cId = (t as any).collection_id || t.metadata?.options?.collection_id;
      return !cId; // 没有绑定知识库的任务
    });
  }, [tasks]);

  const knowledgeTasks = React.useMemo(() => {
    let arr = (tasks || []).filter(t => {
      const cId = (t as any).collection_id || t.metadata?.options?.collection_id;
      return !!cId;
    });
    if (selectedCollection) {
      arr = arr.filter(t => ((t as any).collection_id || t.metadata?.options?.collection_id) === selectedCollection);
    }
    return arr;
  }, [tasks, selectedCollection]);

  return (
    <div className="p-6" style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 精简的页面标题栏 */}
      <div className="flex items-center justify-between" style={{ 
        marginBottom: '20px', 
        paddingBottom: '12px', 
        borderBottom: '1px solid #e8e8e8',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0'
      }}>
        <Title level={3} style={{ margin: 0, fontSize: '20px' }}>
          <GlobalOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          智能爬虫任务监控
        </Title>
        
        <Space size="middle">
          {/* 实时监控状态与重连按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge 
              status={connectionStatus.connected ? 'processing' : 'error'}
              text={
                <span style={{ fontSize: '13px' }}>
                  {connectionStatus.connected ? '实时监控已连接' : '连接已断开'}
                </span>
              }
            />
            <Button
              size="small"
              icon={<SyncOutlined spin={connectionStatus.reconnectAttempts > 0} />}
              disabled={connectionStatus.connected}
              onClick={manualReconnect}
              type={connectionStatus.connected ? 'default' : 'primary'}
              danger={!connectionStatus.connected}
            >
              重连
            </Button>
          </div>
          
          <Divider type="vertical" style={{ height: '20px' }} />
          
          {/* 服务状态 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#8c8c8c' }}>服务状态:</span>
            <Tag
              color={serviceStatus.status === 'healthy' ? 'green' : 'red'}
              icon={serviceStatus.status === 'healthy' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              style={{ margin: 0 }}
            >
              {serviceStatus.status === 'healthy' ? '正常' : '异常'}
            </Tag>
          </div>
        </Space>
      </div>

      {/* 服务状态提醒 */}
      {serviceStatus.status !== 'healthy' && (
        <Alert
          message="智能爬虫服务异常"
          description={`服务当前不可用，请检查服务状态。最后检查时间: ${serviceStatus.lastCheck}`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 精简的统计信息栏 */}
      <Card size="small" style={{ marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>总任务数</span>}
              value={pagination.total}
              prefix={<GlobalOutlined style={{ fontSize: '16px' }} />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>运行中</span>}
              value={tasks.filter(t => t.status === 'running').length}
              prefix={tasks.filter(t => t.status === 'running').length > 0 ? 
                <LoadingOutlined style={{ fontSize: '16px' }} /> : 
                <ClockCircleOutlined style={{ fontSize: '16px' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>已完成</span>}
              value={tasks.filter(t => t.status === 'completed').length}
              prefix={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>失败</span>}
              value={tasks.filter(t => t.status === 'failed').length}
              prefix={<ExclamationCircleOutlined style={{ fontSize: '16px' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 工具栏 */}
      <Card style={{ marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setNewTaskVisible(true)}
              disabled={serviceStatus.status !== 'healthy'}
            >
              新建任务
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTasks()}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          
          <Space>
            <Button
              icon={<SettingOutlined />}
              onClick={fetchServiceStatus}
            >
              检查服务
            </Button>
          </Space>
        </div>
      </Card>

      {/* 任务列表 - 使用Tabs区分公共工作空间和知识库任务 */}
      <Card style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
        <Tabs defaultActiveKey="public" className="crawler-tabs">
          <TabPane 
            tab={
              <span>
                <GlobalOutlined />
                公共工作空间
              </span>
            } 
            key="public"
          >
            <Table
              columns={columns}
              dataSource={publicTasks}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 项，共 ${total} 项`,
                onChange: (page, size) => {
                  fetchTasks(page, size);
                }
              }}
              scroll={{ x: 1500 }}
            />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                知识库任务
              </span>
            } 
            key="knowledge"
          >
            <div className="mb-4">
              <Space size="middle">
                <Select
                  style={{ width: 300 }}
                  placeholder="选择知识库"
                  loading={loadingCollections}
                  value={selectedCollection}
                  onChange={handleCollectionChange}
                  allowClear
                >
                  {collections.map(collection => (
                    <Option key={collection.id} value={collection.id}>
                      {collection.name}
                    </Option>
                  ))}
                </Select>
                {selectedCollection && (
                  <Alert 
                    message={`当前知识库: ${collections.find(c => c.id === selectedCollection)?.name || ''}`}
                    type="success" 
                    showIcon 
                  />
                )}
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={knowledgeTasks}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 项，共 ${total} 项`,
                onChange: (page, size) => {
                  fetchTasks(page, size);
                }
              }}
              scroll={{ x: 1500 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 新建任务Modal */}
      <Modal
        title="新建智能抓取任务"
        open={newTaskVisible}
        onCancel={() => {
          setNewTaskVisible(false);
          form.resetFields();
          setSelectedCollection(null);
          setSelectedFolder(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitTask}
          initialValues={{
            concurrency: 3,
            timeout: 30,
            summary_enabled: false,
            max_summary_length: 300,
            save_to_knowledge: false
          }}
        >
          <Form.Item
            label="URL列表"
            name="urls"
            rules={[{ required: true, message: '请输入URL列表' }]}
            extra="每行一个URL，支持多个URL批量处理"
          >
            <TextArea
              rows={6}
              placeholder={`请输入URL，每行一个，例如：\nhttps://example.com/page1\nhttps://example.com/page2`}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="并发数"
                name="concurrency"
              >
                <Select>
                  <Option value={1}>1</Option>
                  <Option value={3}>3</Option>
                  <Option value={5}>5</Option>
                  <Option value={10}>10</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="超时时间(秒)"
                name="timeout"
              >
                <Select>
                  <Option value={15}>15秒</Option>
                  <Option value={30}>30秒</Option>
                  <Option value={60}>60秒</Option>
                  <Option value={120}>120秒</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="高级选项">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="summary_enabled"
                  valuePropName="checked"
                  style={{ marginBottom: 8 }}
                >
                  <Switch checkedChildren="启用摘要" unCheckedChildren="禁用摘要" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            label="保存位置"
            name="save_to_knowledge"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Switch
              checkedChildren="保存到知识库"
              unCheckedChildren="公共工作空间"
              onChange={(checked) => {
                form.setFieldsValue({ save_to_knowledge: checked });
                if (!checked) {
                  form.setFieldsValue({ 
                    collection_id: undefined,
                    folder_id: undefined 
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.save_to_knowledge !== currentValues.save_to_knowledge
            }
          >
            {({ getFieldValue }) => {
              const saveToKnowledge = getFieldValue('save_to_knowledge');
              return saveToKnowledge ? (
                <>
                  <Form.Item
                    label="选择知识库"
                    name="collection_id"
                    rules={[{ required: true, message: '请选择知识库' }]}
                  >
                    <Select
                      placeholder="请选择目标知识库"
                      loading={loadingCollections}
                      onChange={handleCollectionChange}
                      allowClear
                    >
                      {collections.map(collection => (
                        <Option key={collection.id} value={collection.id}>
                          {collection.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {selectedCollection && (
                    <>
                      <Form.Item
                        name="folder_id"
                        hidden
                      >
                        <Input />
                      </Form.Item>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>选择或创建文件夹</div>
                        <div style={{ 
                          border: '1px solid #d9d9d9', 
                          borderRadius: 4, 
                          padding: 12,
                          maxHeight: 300,
                          overflowY: 'auto'
                        }}>
                          <FolderTreeView
                            collectionId={selectedCollection}
                            selectedFolderId={selectedFolder}
                            onFolderSelect={handleFolderSelect}
                            showDocumentCount={false}
                            allowEdit={true}
                          />
                        </div>
                        {selectedFolder && (
                          <Alert
                            message={`已选择文件夹: ${collections.find(c => c.id === selectedCollection)?.name || ''} / ${selectedFolder}`}
                            type="success"
                            style={{ marginTop: 8 }}
                            closable
                            onClose={() => {
                              setSelectedFolder(null);
                              form.setFieldsValue({ folder_id: undefined });
                            }}
                          />
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Alert
                  message="公共工作空间"
                  description="抓取的内容将保存到公共工作空间，不关联到特定知识库"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              );
            }}
          </Form.Item>

          <Form.Item
            label="内容提取规则 (JSON)"
            name="extraction_schema"
            extra="可选，JSON格式的结构化提取规则"
          >
            <TextArea
              rows={4}
              placeholder={`示例：\n{\n  "title": "页面标题",\n  "content": "主要内容",\n  "date": "发布时间"\n}`}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setNewTaskVisible(false)}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              icon={<PlusOutlined />}
            >
              提交任务
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 任务详情Modal */}
      <Modal
        title="任务详情"
        open={taskDetailVisible}
        onCancel={() => {
          setTaskDetailVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setTaskDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedTask && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <div className="space-y-2">
                    <div><strong>任务ID:</strong> {selectedTask.id}</div>
                    <div><strong>类型:</strong> {selectedTask.type}</div>
                    <div><strong>状态:</strong> {selectedTask.status}</div>
                    <div><strong>进度:</strong> {selectedTask.progress}%</div>
                    <div><strong>创建时间:</strong> {new Date(selectedTask.created_at).toLocaleString()}</div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="执行统计">
                  {selectedTask.metadata && (
                    <div className="space-y-2">
                      <div><strong>总URL数:</strong> {selectedTask.metadata.total_urls}</div>
                      <div><strong>已完成:</strong> {selectedTask.metadata.completed_urls}</div>
                      <div><strong>失败:</strong> {selectedTask.metadata.failed_urls}</div>
                      {selectedTask.metadata.duration && (
                        <div><strong>耗时:</strong> {selectedTask.metadata.duration}秒</div>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Card size="small" title="URL列表">
              <List
                size="small"
                dataSource={selectedTask.urls}
                renderItem={(url, index) => (
                  <List.Item>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">#{index + 1}</span>
                      <LinkOutlined />
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {selectedTask.error && (
              <Card size="small" title="错误信息">
                <Alert
                  message="任务执行失败"
                  description={selectedTask.error}
                  type="error"
                  showIcon
                />
              </Card>
            )}

            {selectedTask.results && selectedTask.results.length > 0 && (
              <Card size="small" title="抓取结果">
                <Tabs defaultActiveKey="content" size="small">
                  <Tabs.TabPane tab="内容预览" key="content">
                    <div className="max-h-96 overflow-y-auto">
                      {selectedTask.results.map((result, index) => (
                        <Card 
                          key={index} 
                          size="small" 
                          style={{ marginBottom: 16 }}
                          title={
                            <div className="flex items-center gap-2">
                              <LinkOutlined />
                              <span className="text-sm">{result.url}</span>
                            </div>
                          }
                        >
                          {result.title && (
                            <div className="mb-3">
                              <Tag color="blue" className="mb-2">标题</Tag>
                              <div className="font-medium text-base">{result.title}</div>
                            </div>
                          )}
                          
                          {result.content && (
                            <div className="mb-3">
                              <Tag color="green" className="mb-2">正文内容</Tag>
                              <div 
                                className="bg-gray-50 p-3 rounded border max-h-60 overflow-y-auto text-sm leading-relaxed"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {result.content.length > 1000 
                                  ? result.content.substring(0, 1000) + '...\n\n[内容已截断，完整内容请下载JSON文件查看]'
                                  : result.content
                                }
                              </div>
                            </div>
                          )}
                          
                          {result.summary && (
                            <div className="mb-3">
                              <Tag color="orange" className="mb-2">内容摘要</Tag>
                              <div className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                                {result.summary}
                              </div>
                            </div>
                          )}
                          
                          {result.metadata && (
                            <div>
                              <Tag color="purple" className="mb-2">页面信息</Tag>
                              <div className="text-xs text-gray-600 space-y-1">
                                {result.metadata.word_count && <div>字数: {result.metadata.word_count}</div>}
                                {result.metadata.content_type && <div>类型: {result.metadata.content_type}</div>}
                                {result.metadata.language && <div>语言: {result.metadata.language}</div>}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Tabs.TabPane>
                  
                  <Tabs.TabPane tab="原始数据" key="raw">
                    <div className="max-h-60 overflow-y-auto">
                      <pre className="text-xs">
                        {JSON.stringify(selectedTask.results, null, 2)}
                      </pre>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IntelligentCrawlerPage;
