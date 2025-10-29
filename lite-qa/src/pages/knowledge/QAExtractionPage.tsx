/**
 * 问答对提取页面 - 基于GC-QA-RAG的自动QA生成
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Typography,
  Statistic,
  Row,
  Col,
  Select,
  Input,
  Modal,
  Form,
  message,
  Divider,
  Tabs,
  Tooltip,
  Alert,
  Empty,
  Spin,
  Badge,
  Timeline,
  Layout,
  Affix
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  BarChartOutlined,
  ExportOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';

import { 
  qaExtractionService, 
  type QATask, 
  type QAPair, 
  type QAStatistics, 
  type Document 
} from '../../services/qaExtractionService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { Content, Sider } = Layout;

const QAExtractionPage: React.FC = () => {
  const [tasks, setTasks] = useState<QATask[]>([]);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statistics, setStatistics] = useState<QAStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QATask | null>(null);
  const [qaViewModalVisible, setQaViewModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<QAPair[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();

  // QA生成默认配置
  const [qaConfig, setQaConfig] = useState({
    chunk_size: 1200,
    chunk_overlap: 100,
    qa_count_per_chunk: 3,
    language: 'zh',
    quality_threshold: 0.7,
    include_summary: true
  });

  // 加载任务列表
  const loadTasks = async () => {
    setLoading(true);
    try {
      // 若存在知识库上下文，优先按collection过滤（从URL或全局上下文获取，简化：尝试从window取）
      const collectionId = (window as any).currentCollectionId || undefined;
      const response = await qaExtractionService.getTasks({ limit: 100, collection_id: collectionId });
      if (response.success) {
        setTasks(response.data.tasks);
      } else {
        message.error('加载任务列表失败');
      }
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('Load tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听 QA 任务创建事件，自动刷新任务列表/统计
  useEffect(() => {
    const handler = () => {
      loadTasks();
      loadStatistics();
    };
    window.addEventListener('qa-task-created', handler);
    return () => window.removeEventListener('qa-task-created', handler);
  }, []);

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await qaExtractionService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  };

  // 加载文档列表
  const loadDocuments = async () => {
    try {
      const response = await qaExtractionService.getDocuments();
      if (response.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Load documents error:', error);
    }
  };

  // 加载QA对
  const loadQAPairs = async (taskId: number) => {
    try {
      const response = await qaExtractionService.getTaskQAPairs(taskId);
      if (response.success) {
        setQaPairs(response.data.qa_pairs);
      } else {
        message.error('加载QA对失败');
      }
    } catch (error) {
      message.error('加载QA对失败');
      console.error('Load QA pairs error:', error);
    }
  };

  // 搜索QA对
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await qaExtractionService.searchQAPairs({
        query: value,
        vector_field: 'question',
        limit: 20
      });
      if (response.success) {
        setSearchResults(response.data.results);
      }
    } catch (error) {
      message.error('搜索失败');
      console.error('Search error:', error);
    }
  };

  // 创建提取任务
  const handleCreateTask = async (values: any) => {
    try {
      // 构建QA提取配置
      const qaConfig = {
        chunk_size: values.chunk_size || 1200,
        chunk_overlap: values.chunk_overlap || 100,
        qa_count_per_chunk: values.qa_count_per_chunk || 3,
        language: values.language || 'zh',
        quality_threshold: values.quality_threshold || 0.7,
        include_summary: values.include_summary !== false
      };

      const response = await qaExtractionService.createTask({
        document_id: values.document_id,
        config: qaConfig
      });

      if (response.success) {
        message.success(`QA生成任务创建成功！配置: ${values.qa_count_per_chunk}个QA/块`);
        setCreateModalVisible(false);
        form.resetFields();
        loadTasks();

        // 自动刷新任务状态
        setTimeout(() => {
          loadTasks();
        }, 3000);
      } else {
        message.error('创建任务失败');
      }
    } catch (error) {
      message.error('创建任务失败');
      console.error('Create task error:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个QA生成任务吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          const response = await qaExtractionService.deleteTask(taskId);
          if (response.success) {
            message.success('任务删除成功');
            loadTasks();
          } else {
            message.error('删除任务失败');
          }
        } catch (error) {
          message.error('删除任务失败');
        }
      }
    });
  };

  // 查看QA对
  const handleViewQAPairs = async (task: QATask) => {
    setSelectedTask(task);
    await loadQAPairs(task.id);
    setQaViewModalVisible(true);
  };

  // 加载配置
  const loadConfig = async () => {
    try {
      // 从数据库加载配置 (TODO: 获取当前用户ID)
      const response = await qaExtractionService.getConfig();
      if (response.success && response.data) {
        const config = {
          chunk_size: response.data.chunk_size,
          chunk_overlap: response.data.chunk_overlap,
          qa_count_per_chunk: response.data.qa_count_per_chunk,
          language: response.data.language,
          quality_threshold: response.data.quality_threshold,
          include_summary: response.data.include_summary
        };
        setQaConfig(config);
        configForm.setFieldsValue(config);
      }
    } catch (e) {
      console.error('Failed to load config:', e);
      message.warning('加载配置失败，使用默认配置');
    }
  };

  // 保存配置
  const handleSaveConfig = async (values: any) => {
    try {
      const newConfig = {
        chunk_size: values.chunk_size || 1200,
        chunk_overlap: values.chunk_overlap || 100,
        qa_count_per_chunk: values.qa_count_per_chunk || 3,
        language: values.language || 'zh',
        quality_threshold: values.quality_threshold || 0.7,
        include_summary: values.include_summary !== false
      };

      // 保存到数据库 (TODO: 获取当前用户ID)
      const response = await qaExtractionService.saveConfig(newConfig);

      if (response.success) {
        setQaConfig(newConfig); // 更新state以刷新右侧预览
        message.success('QA生成配置已保存到数据库！配置将在下次文档上传时自动应用');
      } else {
        message.error('保存配置失败');
      }
    } catch (error) {
      message.error('保存配置失败');
      console.error('Save config error:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadStatistics();
    loadDocuments();
    loadConfig();
  }, []);

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', icon: <ClockCircleOutlined />, text: '待处理' },
      processing: { color: 'blue', icon: <PlayCircleOutlined />, text: '处理中' },
      completed: { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'red', icon: <ExclamationCircleOutlined />, text: '失败' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 任务表格列配置
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '文档',
      dataIndex: 'document_title',
      key: 'document_title',
      ellipsis: { showTitle: false },
      render: (title: string, record: QATask) => (
        <Tooltip title={title || record.document_id}>
          <Text>{title || `文档 ${record.document_id}`}</Text>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: 'QA对数量',
      dataIndex: 'qa_pairs_count',
      key: 'qa_pairs_count',
      width: 100,
      render: (count: number) => (
        <Statistic
          value={count}
          valueStyle={{ fontSize: '14px', color: count > 0 ? '#52c41a' : '#8c8c8c' }}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 160,
      render: (time?: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: QATask) => (
        <Space>
          <Tooltip title="查看QA对">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              disabled={record.qa_pairs_count === 0}
              onClick={() => handleViewQAPairs(record)}
            />
          </Tooltip>
          <Tooltip title="删除任务">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTask(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // QA对表格列配置
  const qaPairColumns = [
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '答案',
      dataIndex: 'answer',
      key: 'answer',
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: { showTitle: false },
      render: (text?: string) => (
        <Tooltip title={text}>
          <Text type="secondary">{text || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  const filteredTasks = selectedStatus === 'all' ? tasks : tasks.filter(task => task.status === selectedStatus);

  return (
    <div className="qa-extraction-page" style={{
      height: 'calc(100vh - 56px)',
      background: '#f5f7fa',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    }}>
      <div style={{
        padding: '16px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Tab切换 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexShrink: 0
        }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'tasks', label: '任务管理', icon: <PlayCircleOutlined /> },
              { key: 'search', label: 'QA搜索', icon: <SearchOutlined /> },
              { key: 'config', label: 'QA生成配置', icon: <SettingOutlined /> }
            ]}
            style={{ marginBottom: 0 }}
          />
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建任务
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTasks}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 主内容区域 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}>
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 统计卡片 */}
              {statistics && (
                <Row gutter={[16, 16]}>
                  {[
                    {
                      title: '总任务数',
                      value: statistics.total_tasks,
                      icon: <FileTextOutlined />,
                      color: '#1890ff',
                      cardBg: '#e6f7ff'
                    },
                    {
                      title: '已完成',
                      value: statistics.completed_tasks,
                      icon: <CheckCircleOutlined />,
                      color: '#52c41a',
                      cardBg: '#f6ffed'
                    },
                    {
                      title: '处理中',
                      value: statistics.processing_tasks,
                      icon: <PlayCircleOutlined />,
                      color: '#faad14',
                      cardBg: '#fffbe6'
                    },
                    {
                      title: '总QA对数',
                      value: statistics.total_qa_pairs,
                      icon: <QuestionCircleOutlined />,
                      color: '#13c2c2',
                      cardBg: '#e6fffb'
                    }
                  ].map((stat, index) => (
                    <Col span={6} key={index}>
                      <Card
                        style={{
                          borderRadius: '8px',
                          border: 'none',
                          background: stat.cardBg,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: '#595959', fontSize: '14px' }}>
                              {stat.title}
                            </Text>
                          }
                          value={stat.value}
                          prefix={
                            <span style={{ color: stat.color, fontSize: '20px', marginRight: '8px' }}>
                              {stat.icon}
                            </span>
                          }
                          valueStyle={{ 
                            color: '#262626', 
                            fontSize: '24px', 
                            fontWeight: 600
                          }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}

              {/* 任务列表 */}
            <Card
              style={{
                borderRadius: '8px',
                border: 'none',
                background: '#fff'
              }}
              extra={
                <Space size="middle">
                  <Select
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    style={{ width: 120 }}
                    placeholder="状态筛选"
                  >
                    <Option value="all">全部状态</Option>
                    <Option value="pending">待处理</Option>
                    <Option value="processing">处理中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="failed">失败</Option>
                  </Select>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadTasks}
                    loading={loading}
                  >
                    刷新
                  </Button>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                  >
                    导出数据
                  </Button>
                </Space>
              }
            >
              <Table
                columns={taskColumns}
                dataSource={filteredTasks}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个任务`,
                }}
                style={{ background: 'transparent' }}
              />
            </Card>
            </div>
          )}

          {activeTab === 'search' && (
            <Card
              style={{
                borderRadius: '8px',
                border: 'none',
                background: '#fff'
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <Search
                  placeholder="输入问题关键词搜索QA对"
                  allowClear
                  enterButton={
                    <Button type="primary" icon={<SearchOutlined />}>
                      搜索
                    </Button>
                  }
                  size="large"
                  onSearch={handleSearch}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  style={{ borderRadius: '8px' }}
                />
              </div>

              {searchResults.length > 0 ? (
                <Table
                  columns={qaPairColumns}
                  dataSource={searchResults}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `找到 ${total} 个QA对`,
                  }}
                />
              ) : searchText ? (
                <Empty 
                  description="未找到相关QA对" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Alert
                  message="使用搜索功能查找QA对"
                  description="输入问题关键词来搜索已生成的QA对，支持模糊匹配和语义搜索"
                  type="info"
                  showIcon
                  style={{ borderRadius: '8px' }}
                />
              )}
            </Card>
          )}

          {activeTab === 'config' && (
            <Row gutter={24}>
              {/* 左侧配置表单 */}
              <Col span={16}>
                <Card
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    background: '#fff',
                    height: '100%'
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <SettingOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>QA自动生成默认配置</div>
                        <div style={{ fontSize: '13px', color: '#666', fontWeight: 'normal', marginTop: '4px' }}>
                          配置保存后，文档上传时将自动使用这些参数进行QA生成
                        </div>
                      </div>
                    </div>
                  }
                >
              <Form
                form={configForm}
                layout="vertical"
                onFinish={handleSaveConfig}
                initialValues={qaConfig}
              >
                {/* 文档处理配置 */}
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: '#262626', fontSize: '15px' }}>
                    <FileTextOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                    文档处理配置
                  </Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="chunk_size"
                        label="分块大小"
                        tooltip="决定文档分割的粒度，影响生成QA的范围"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value={800}>小 (800字符) - 精细提取</Option>
                          <Option value={1200}>中 (1200字符) - 推荐</Option>
                          <Option value={1600}>大 (1600字符) - 快速提取</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="chunk_overlap"
                        label="重叠字符数"
                        tooltip="相邻分块间的重叠，避免丢失边界信息"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value={0}>无重叠</Option>
                          <Option value={50}>少量 (50字符)</Option>
                          <Option value={100}>适中 (100字符) - 推荐</Option>
                          <Option value={200}>较多 (200字符)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* QA生成配置 */}
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: '#262626', fontSize: '15px' }}>
                    <RobotOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
                    QA生成配置
                  </Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="qa_count_per_chunk"
                        label="每块生成QA数量"
                        tooltip="每个分块生成的问答对数量"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value={1}>少量 (1个/块)</Option>
                          <Option value={2}>适中 (2个/块)</Option>
                          <Option value={3}>标准 (3个/块) - 推荐</Option>
                          <Option value={5}>较多 (5个/块)</Option>
                          <Option value={8}>大量 (8个/块)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="quality_threshold"
                        label="质量过滤阈值"
                        tooltip="过滤低质量QA对的标准，值越大过滤越严格"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value={0.5}>宽松 (0.5) - 生成更多QA</Option>
                          <Option value={0.6}>适中 (0.6)</Option>
                          <Option value={0.7}>标准 (0.7) - 推荐</Option>
                          <Option value={0.8}>严格 (0.8) - 高质量</Option>
                          <Option value={0.9}>非常严格 (0.9)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 其他设置 */}
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: '#262626', fontSize: '15px' }}>
                    <SettingOutlined style={{ marginRight: '6px', color: '#722ed1' }} />
                    其他设置
                  </Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="language"
                        label="语言设置"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value="zh">中文</Option>
                          <Option value="en">English</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="include_summary"
                        label="是否包含摘要"
                        style={{ marginBottom: '16px' }}
                      >
                        <Select>
                          <Option value={true}>是</Option>
                          <Option value={false}>否</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Form.Item style={{ marginTop: '20px', marginBottom: 0 }}>
                  <Space size="middle">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<CheckCircleOutlined />}
                    >
                      保存配置
                    </Button>
                    <Button
                      size="large"
                      onClick={() => {
                        configForm.resetFields();
                        loadConfig();
                      }}
                    >
                      重置为默认
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧说明区域 */}
          <Col span={8}>
            <div style={{ position: 'sticky', top: '16px' }}>
              {/* 当前配置预览 */}
              <Card
                title={
                  <span>
                    <EyeOutlined style={{ marginRight: '8px' }} />
                    当前配置预览
                  </span>
                }
                style={{ marginBottom: '16px', borderRadius: '8px' }}
                size="small"
              >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary">分块大小</Text>
                  <Text strong>{qaConfig.chunk_size} 字符</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary">重叠字符</Text>
                  <Text strong>{qaConfig.chunk_overlap} 字符</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary">QA数量/块</Text>
                  <Text strong>{qaConfig.qa_count_per_chunk} 个</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary">质量阈值</Text>
                  <Text strong>{qaConfig.quality_threshold}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary">语言</Text>
                  <Text strong>{qaConfig.language === 'zh' ? '中文' : 'English'}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <Text type="secondary">包含摘要</Text>
                  <Text strong>{qaConfig.include_summary ? '是' : '否'}</Text>
                </div>
              </Space>
            </Card>

            {/* 配置说明 */}
            <Card
              title={
                <span>
                  <QuestionCircleOutlined style={{ marginRight: '8px' }} />
                  配置说明
                </span>
              }
              style={{ marginBottom: '16px', borderRadius: '8px' }}
              size="small"
            >
              <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#666' }}>
                <p style={{ margin: '0 0 8px 0' }}><Text strong>分块大小</Text>: 文档分割粒度，推荐1200字符</p>
                <p style={{ margin: '0 0 8px 0' }}><Text strong>重叠字符</Text>: 避免边界丢失，推荐100字符</p>
                <p style={{ margin: '0 0 8px 0' }}><Text strong>QA数量</Text>: 每块生成问答对数，推荐3个/块</p>
                <p style={{ margin: '0' }}><Text strong>质量阈值</Text>: 过滤标准，推荐0.7</p>
              </div>
            </Card>

            {/* 应用场景 */}
            <Card
              title={
                <span>
                  <ThunderboltOutlined style={{ marginRight: '8px' }} />
                  应用场景
                </span>
              }
              style={{ borderRadius: '8px' }}
              size="small"
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ padding: '8px 12px', background: '#f6ffed', borderRadius: '6px', borderLeft: '3px solid #52c41a' }}>
                  <Text strong style={{ fontSize: '13px' }}>文档上传后的自动QA生成</Text>
                </div>
                <div style={{ padding: '8px 12px', background: '#e6f7ff', borderRadius: '6px', borderLeft: '3px solid #1890ff' }}>
                  <Text strong style={{ fontSize: '13px' }}>知识库文档批量处理</Text>
                </div>
                <div style={{ padding: '8px 12px', background: '#fff7e6', borderRadius: '6px', borderLeft: '3px solid #faad14' }}>
                  <Text strong style={{ fontSize: '13px' }}>手动创建QA提取任务的默认值</Text>
                </div>
              </Space>
            </Card>
            </div>
          </Col>
        </Row>
          )}

        </div>
      </div>

      {/* 创建任务对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>创建QA生成任务</span>
          </div>
        }
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        width={650}
        style={{ borderRadius: '12px' }}
        okText="开始生成"
        cancelText="取消"
        okButtonProps={{
          icon: <PlayCircleOutlined />,
          size: 'large'
        }}
        cancelButtonProps={{
          size: 'large'
        }}
      >
        <div style={{ padding: '16px 0' }}>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateTask}
          >
            <Form.Item
              name="document_id"
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileTextOutlined />
                  <span>选择文档</span>
                </div>
              }
              rules={[{ required: true, message: '请选择要处理的文档' }]}
            >
              <Select
                placeholder="请选择要提取QA对的文档"
                showSearch
                size="large"
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ borderRadius: '8px' }}
              >
                {documents.map(doc => (
                  <Option key={doc.id} value={doc.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{doc.title}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{doc.filename}</div>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {/* 配置选项 */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SettingOutlined />
                  <span>提取配置</span>
                </div>
              }
              style={{
                marginTop: '16px',
                borderRadius: '8px',
                background: '#fafafa',
                border: '1px solid #e8ecf1'
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 文档分块设置 */}
                <div>
                  <Text style={{ fontSize: '13px', color: '#595959', marginBottom: '8px', display: 'block' }}>
                    分块大小 (chunk_size)
                  </Text>
                  <Form.Item name="chunk_size" initialValue={1200} noStyle>
                    <Select style={{ width: '100%' }} size="middle">
                      <Option value={800}>小 (800字符) - 精细提取</Option>
                      <Option value={1200}>中 (1200字符) - 推荐</Option>
                      <Option value={1600}>大 (1600字符) - 快速提取</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 重叠设置 */}
                <div>
                  <Text style={{ fontSize: '13px', color: '#595959', marginBottom: '8px', display: 'block' }}>
                    重叠字符数 (chunk_overlap)
                  </Text>
                  <Form.Item name="chunk_overlap" initialValue={100} noStyle>
                    <Select style={{ width: '100%' }} size="middle">
                      <Option value={0}>无重叠</Option>
                      <Option value={50}>少量 (50字符)</Option>
                      <Option value={100}>适中 (100字符) - 推荐</Option>
                      <Option value={200}>较多 (200字符)</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 每块QA数量 */}
                <div>
                  <Text style={{ fontSize: '13px', color: '#595959', marginBottom: '8px', display: 'block' }}>
                    每块生成QA数量 (qa_count_per_chunk)
                  </Text>
                  <Form.Item name="qa_count_per_chunk" initialValue={3} noStyle>
                    <Select style={{ width: '100%' }} size="middle">
                      <Option value={1}>少量 (1个/块)</Option>
                      <Option value={2}>适中 (2个/块)</Option>
                      <Option value={3}>标准 (3个/块) - 推荐</Option>
                      <Option value={5}>较多 (5个/块)</Option>
                      <Option value={8}>大量 (8个/块)</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 质量阈值 */}
                <div>
                  <Text style={{ fontSize: '13px', color: '#595959', marginBottom: '8px', display: 'block' }}>
                    质量过滤阈值 (quality_threshold)
                  </Text>
                  <Form.Item name="quality_threshold" initialValue={0.7} noStyle>
                    <Select style={{ width: '100%' }} size="middle">
                      <Option value={0.5}>宽松 (0.5) - 生成更多QA</Option>
                      <Option value={0.6}>适中 (0.6)</Option>
                      <Option value={0.7}>标准 (0.7) - 推荐</Option>
                      <Option value={0.8}>严格 (0.8) - 高质量</Option>
                      <Option value={0.9}>非常严格 (0.9)</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 语言设置 */}
                <div>
                  <Text style={{ fontSize: '13px', color: '#595959', marginBottom: '8px', display: 'block' }}>
                    语言 (language)
                  </Text>
                  <Form.Item name="language" initialValue="zh" noStyle>
                    <Select style={{ width: '100%' }} size="middle">
                      <Option value="zh">中文</Option>
                      <Option value="en">English</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 包含摘要 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: '13px', color: '#595959' }}>
                    包含摘要 (include_summary)
                  </Text>
                  <Form.Item name="include_summary" valuePropName="checked" initialValue={true} noStyle>
                    <Select style={{ width: '120px' }} size="middle">
                      <Option value={true}>是</Option>
                      <Option value={false}>否</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 配置说明 */}
                <Alert
                  message="配置说明"
                  description={
                    <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                      • <strong>分块大小</strong>: 决定文档分割的粒度，影响生成QA的范围<br/>
                      • <strong>重叠字符</strong>: 相邻分块间的重叠，避免丢失边界信息<br/>
                      • <strong>QA数量</strong>: 每个分块生成的问答对数量<br/>
                      • <strong>质量阈值</strong>: 过滤低质量QA对的标准
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{
                    fontSize: '12px',
                    borderRadius: '6px',
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff'
                  }}
                />
              </Space>
            </Card>
          </Form>
        </div>
      </Modal>

      {/* QA对查看对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <span>QA对详情 - 任务 {selectedTask?.id}</span>
          </div>
        }
        open={qaViewModalVisible}
        onCancel={() => setQaViewModalVisible(false)}
        footer={[
          <Button key="export" icon={<DownloadOutlined />} type="primary">
            导出QA对
          </Button>,
          <Button key="close" onClick={() => setQaViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        {selectedTask && (
          <div>
            {/* 任务信息卡片 */}
            <Card
              size="small"
              style={{ 
                marginBottom: '24px',
                borderRadius: '8px',
                background: '#fafafa',
                border: '1px solid #e8ecf1'
              }}
            >
              <Row gutter={24} align="middle">
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                    <div>
                      <div style={{ fontWeight: 500, color: '#262626' }}>文档名称</div>
                      <div style={{ color: '#595959', fontSize: '14px' }}>
                        {selectedTask.document_title || selectedTask.document_id}
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500, color: '#262626' }}>状态</div>
                    <div style={{ marginTop: '4px' }}>
                      {renderStatusTag(selectedTask.status)}
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500, color: '#262626' }}>QA对数量</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', marginTop: '4px' }}>
                      {selectedTask.qa_pairs_count}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                    <div>
                      <div style={{ fontWeight: 500, color: '#262626' }}>创建时间</div>
                      <div style={{ color: '#595959', fontSize: '14px' }}>
                        {new Date(selectedTask.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
            
            {/* QA对表格 */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '0' }}>
              <Table
                columns={[
                  {
                    title: '序号',
                    key: 'index',
                    width: 60,
                    render: (_, __, index) => (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {index + 1}
                      </div>
                    )
                  },
                  {
                    title: '问题',
                    dataIndex: 'question',
                    key: 'question',
                    render: (text: string) => (
                      <div style={{ 
                        padding: '8px 12px',
                        background: '#f6f8fa',
                        borderRadius: '8px',
                        borderLeft: '4px solid #1890ff',
                        fontSize: '14px',
                        lineHeight: 1.6
                      }}>
                        {text}
                      </div>
                    ),
                  },
                  {
                    title: '答案',
                    dataIndex: 'answer',
                    key: 'answer',
                    render: (text: string) => (
                      <div style={{ 
                        padding: '8px 12px',
                        background: '#f6ffed',
                        borderRadius: '8px',
                        borderLeft: '4px solid #52c41a',
                        fontSize: '14px',
                        lineHeight: 1.6
                      }}>
                        {text}
                      </div>
                    ),
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    width: 150,
                    render: (time: string) => (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(time).toLocaleString()}
                      </Text>
                    ),
                  }
                ]}
                dataSource={qaPairs}
                rowKey="id"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个QA对`,
                }}
                style={{ background: 'transparent' }}
                size="middle"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QAExtractionPage;
