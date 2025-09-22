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

  // 加载任务列表
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await qaExtractionService.getTasks({ limit: 100 });
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
      const response = await qaExtractionService.createTask({
        document_id: values.document_id
      });
      
      if (response.success) {
        message.success('QA生成任务创建成功，正在后台处理中...');
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

  useEffect(() => {
    loadTasks();
    loadStatistics();
    loadDocuments();
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
    <div className="qa-extraction-page" style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ padding: '16px' }}>
        {/* Tab切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'tasks', label: '任务管理', icon: <PlayCircleOutlined /> },
              { key: 'search', label: 'QA搜索', icon: <SearchOutlined /> }
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
        <div style={{ marginTop: '16px' }}>
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
              title="提取配置"
              style={{ 
                marginTop: '16px',
                borderRadius: '8px',
                background: '#fafafa'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>智能模式</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      自动优化提取参数
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>高质量</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      确保QA对准确性
                    </div>
                  </div>
                </Col>
              </Row>
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