/**
 * 自定义工具管理页面
 * 支持各类自定义工具的创建、管理、执行等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  message,
  Tabs,
  Col,
  Row,
  Divider,
  Tooltip,
  Popconfirm,
  Collapse,
  InputNumber,
  Alert,
  Spin,
  Empty,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  BugOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getTools,
  createTool,
  updateTool,
  deleteTool,
  executeTool,
  analyzeURL,
  testSelector,
  getExecutions,
  type CrawlerTool,
  type ToolExecution,
  type SelectorConfig,
  type ParseConfig,
} from '../../services/customCrawlerService';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

const CustomCrawlerToolsPage: React.FC = () => {
  const [tools, setTools] = useState<CrawlerTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [executeModalVisible, setExecuteModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [currentTool, setCurrentTool] = useState<CrawlerTool | null>(null);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [executeForm] = Form.useForm();
  const [urlAnalyzeForm] = Form.useForm();

  // 加载工具列表
  const loadTools = async () => {
    setLoading(true);
    try {
      const result = await getTools(false, 0, 100);
      setTools(result.data);
    } catch (error) {
      console.error('加载工具列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // URL分析
  const handleAnalyzeURL = async () => {
    try {
      const values = await urlAnalyzeForm.validateFields();
      setAnalyzing(true);

      const result = await analyzeURL(values);

      // 填充表单
      createForm.setFieldsValue({
        name: result.suggested_name,
        description: result.description,
        base_url: result.base_url,
        url_template: result.url_template,
        method: result.method,
        params_mapping: JSON.stringify(result.params_mapping, null, 2),
        selector_config: JSON.stringify(result.selector_config, null, 2),
        parse_config: JSON.stringify(result.parse_config, null, 2),
      });

      message.success('URL分析完成，已自动填充配置');
    } catch (error) {
      console.error('URL分析失败:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // 创建工具
  const handleCreateTool = async () => {
    try {
      const values = await createForm.validateFields();

      // 解析JSON字段
      const toolData = {
        ...values,
        params_mapping: JSON.parse(values.params_mapping),
        selector_config: JSON.parse(values.selector_config),
        parse_config: values.parse_config ? JSON.parse(values.parse_config) : undefined,
        headers: values.headers ? JSON.parse(values.headers) : {},
      };

      await createTool(toolData);
      setCreateModalVisible(false);
      createForm.resetFields();
      urlAnalyzeForm.resetFields();
      loadTools();
    } catch (error) {
      console.error('创建工具失败:', error);
    }
  };

  // 编辑工具
  const handleEditTool = async () => {
    if (!currentTool) return;

    try {
      const values = await editForm.validateFields();

      const updateData: any = { ...values };
      if (values.params_mapping) {
        updateData.params_mapping = JSON.parse(values.params_mapping);
      }
      if (values.selector_config) {
        updateData.selector_config = JSON.parse(values.selector_config);
      }
      if (values.parse_config) {
        updateData.parse_config = JSON.parse(values.parse_config);
      }
      if (values.headers) {
        updateData.headers = JSON.parse(values.headers);
      }

      await updateTool(currentTool.id, updateData);
      setEditModalVisible(false);
      editForm.resetFields();
      setCurrentTool(null);
      loadTools();
    } catch (error) {
      console.error('更新工具失败:', error);
    }
  };

  // 删除工具
  const handleDeleteTool = async (toolId: number) => {
    try {
      await deleteTool(toolId);
      loadTools();
    } catch (error) {
      console.error('删除工具失败:', error);
    }
  };

  // 执行工具
  const handleExecuteTool = async () => {
    if (!currentTool) return;

    try {
      const values = await executeForm.validateFields();
      setExecuting(true);

      const result = await executeTool(currentTool.id, values);
      setExecutionResults(result);
      executeForm.resetFields();
    } catch (error) {
      console.error('执行工具失败:', error);
    } finally {
      setExecuting(false);
    }
  };

  // 查看执行历史
  const handleViewHistory = async (tool: CrawlerTool) => {
    setCurrentTool(tool);
    try {
      const result = await getExecutions(tool.id);
      setExecutions(result.data);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error('获取执行历史失败:', error);
    }
  };

  // 打开编辑模态框
  const openEditModal = (tool: CrawlerTool) => {
    setCurrentTool(tool);
    editForm.setFieldsValue({
      ...tool,
      params_mapping: JSON.stringify(tool.params_mapping, null, 2),
      selector_config: JSON.stringify(tool.selector_config, null, 2),
      parse_config: JSON.stringify(tool.parse_config, null, 2),
      headers: JSON.stringify(tool.headers || {}, null, 2),
    });
    setEditModalVisible(true);
  };

  // 打开执行模态框
  const openExecuteModal = (tool: CrawlerTool) => {
    setCurrentTool(tool);
    setExecutionResults(null);
    setPreviewUrl('');
    setExecuteModalVisible(true);
  };

  // 生成URL预览
  const generatePreviewUrl = (keyword: string) => {
    if (!currentTool || !keyword) {
      setPreviewUrl('');
      return;
    }

    try {
      let url = currentTool.url_template;

      // 替换 {keyword} 占位符
      url = url.replace(/{keyword}/g, encodeURIComponent(keyword));

      // 应用其他默认参数
      const params = currentTool.params_mapping;
      Object.keys(params).forEach((key) => {
        const config = params[key];
        if (config.default_value && url.includes(`{${key}}`)) {
          url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(config.default_value));
        }
      });

      setPreviewUrl(url);
    } catch (error) {
      console.error('生成URL预览失败:', error);
      setPreviewUrl('');
    }
  };

  // 工具列表列定义
  const toolColumns: ColumnsType<CrawlerTool> = [
    {
      title: '工具名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {!record.enabled && <Tag color="default">已禁用</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '目标网站',
      dataIndex: 'base_url',
      key: 'base_url',
      width: 200,
      render: (text) => (
        <Tooltip title={text}>
          <Text copyable={{ text }}>{new URL(text).hostname}</Text>
        </Tooltip>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (text) => <Tag color={text === 'GET' ? 'blue' : 'green'}>{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled) =>
        enabled ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            启用
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            禁用
          </Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="执行">
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => openExecuteModal(record)}
              disabled={!record.enabled}
            >
              执行
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Tooltip title="执行历史">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这个工具吗?"
            onConfirm={() => handleDeleteTool(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 执行历史列定义
  const executionColumns: ColumnsType<ToolExecution> = [
    {
      title: '关键词',
      dataIndex: 'query_keyword',
      key: 'query_keyword',
    },
    {
      title: '状态',
      dataIndex: 'execution_status',
      key: 'execution_status',
      render: (status) => {
        const statusConfig = {
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
          running: { color: 'processing', icon: <SyncOutlined spin />, text: '运行中' },
          pending: { color: 'default', icon: <SyncOutlined />, text: '等待中' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '结果数',
      dataIndex: 'results_count',
      key: 'results_count',
    },
    {
      title: '耗时',
      dataIndex: 'execution_time',
      key: 'execution_time',
      render: (time) => (time ? `${time.toFixed(2)}s` : '-'),
    },
    {
      title: '执行时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <LinkOutlined />
            <span>自定义工具</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            创建工具
          </Button>
        }
      >
        <Table
          columns={toolColumns}
          dataSource={tools}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个工具`,
          }}
        />
      </Card>

      {/* 创建工具模态框 */}
      <Modal
        title="创建自定义工具"
        open={createModalVisible}
        onOk={handleCreateTool}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          urlAnalyzeForm.resetFields();
        }}
        width={900}
        okText="创建"
        cancelText="取消"
      >
        <Tabs defaultActiveKey="analyze">
          <TabPane tab="智能分析" key="analyze">
            <Alert
              message="智能URL分析"
              description="输入目标网站的搜索结果URL（如政府网站、资讯网站等），系统将自动分析并生成工具配置"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={urlAnalyzeForm} layout="vertical">
              <Form.Item
                label="搜索结果URL"
                name="url"
                rules={[{ required: true, message: '请输入URL' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="例如: https://www.gzlps.gov.cn/so/search.shtml?searchWord=最新投资政策&..."
                />
              </Form.Item>
              <Form.Item label="关键词参数名" name="keyword_param">
                <Input placeholder="可选，留空自动检测（如: searchWord, query, keyword等）" />
              </Form.Item>
              <Button
                type="primary"
                icon={<BugOutlined />}
                onClick={handleAnalyzeURL}
                loading={analyzing}
                block
              >
                分析URL并生成配置
              </Button>
            </Form>
          </TabPane>

          <TabPane tab="手动配置" key="manual">
            <Form form={createForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="工具名称"
                    name="name"
                    rules={[{ required: true, message: '请输入工具名称' }]}
                  >
                    <Input placeholder="例如: 六盘水政府政策搜索" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="工具描述" name="description">
                    <Input placeholder="简要描述工具用途" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    label="基础URL"
                    name="base_url"
                    rules={[{ required: true, message: '请输入基础URL' }]}
                  >
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="HTTP方法" name="method" initialValue="GET">
                    <Input placeholder="GET 或 POST" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="URL模板"
                name="url_template"
                rules={[{ required: true, message: '请输入URL模板' }]}
                tooltip="使用 {keyword} 作为搜索关键词的占位符"
              >
                <TextArea
                  rows={2}
                  placeholder="https://example.com/search?q={keyword}&page=1"
                />
              </Form.Item>

              <Form.Item
                label="参数映射配置"
                name="params_mapping"
                rules={[{ required: true, message: '请输入参数映射配置' }]}
                tooltip="JSON格式，定义URL参数的映射关系"
              >
                <TextArea
                  rows={6}
                  placeholder={JSON.stringify(
                    {
                      searchWord: {
                        param_name: 'searchWord',
                        param_type: 'query',
                        required: true,
                        description: '搜索关键词',
                      },
                    },
                    null,
                    2
                  )}
                />
              </Form.Item>

              <Form.Item
                label="选择器配置"
                name="selector_config"
                rules={[{ required: true, message: '请输入选择器配置' }]}
                tooltip="CSS选择器，用于从网页提取内容"
              >
                <TextArea
                  rows={8}
                  placeholder={JSON.stringify(
                    {
                      result_container: '.search-results',
                      item_selector: '.result-item',
                      title_selector: '.title',
                      link_selector: 'a',
                      content_selector: '.content',
                    },
                    null,
                    2
                  )}
                />
              </Form.Item>

              <Form.Item label="解析配置（可选）" name="parse_config">
                <TextArea
                  rows={6}
                  placeholder={JSON.stringify(
                    {
                      extract_full_content: true,
                      follow_links: false,
                      max_results: 20,
                      encoding: 'utf-8',
                      timeout: 30,
                    },
                    null,
                    2
                  )}
                />
              </Form.Item>

              <Form.Item label="自定义请求头（可选）" name="headers">
                <TextArea rows={4} placeholder='{"User-Agent": "..."}' />
              </Form.Item>

              <Form.Item name="enabled" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                <span style={{ marginLeft: 8 }}>启用工具</span>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>

      {/* 编辑工具模态框 */}
      <Modal
        title="编辑工具"
        open={editModalVisible}
        onOk={handleEditTool}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setCurrentTool(null);
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="工具名称" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="工具描述" name="description">
            <Input />
          </Form.Item>
          <Form.Item label="URL模板" name="url_template">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="选择器配置" name="selector_config">
            <TextArea rows={8} />
          </Form.Item>
          <Form.Item label="解析配置" name="parse_config">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            <span style={{ marginLeft: 8 }}>启用工具</span>
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行工具模态框 */}
      <Modal
        title={`执行工具: ${currentTool?.name}`}
        open={executeModalVisible}
        onOk={handleExecuteTool}
        onCancel={() => {
          setExecuteModalVisible(false);
          executeForm.resetFields();
          setExecutionResults(null);
          setPreviewUrl('');
          setCurrentTool(null);
        }}
        width={1000}
        okText="执行"
        cancelText="关闭"
        confirmLoading={executing}
      >
        <Form form={executeForm} layout="vertical">
          <Form.Item
            label="搜索关键词"
            name="keyword"
            rules={[{ required: true, message: '请输入搜索关键词' }]}
          >
            <Input
              placeholder="输入要搜索的关键词"
              size="large"
              onChange={(e) => generatePreviewUrl(e.target.value)}
            />
          </Form.Item>

          {previewUrl && (
            <Alert
              message="预览URL"
              description={
                <div>
                  <Text copyable={{ text: previewUrl }} style={{ wordBreak: 'break-all' }}>
                    {previewUrl}
                  </Text>
                </div>
              }
              type="info"
              icon={<LinkOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>

        {executionResults && (
          <Card title="执行结果" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {executionResults.url && (
                <Alert
                  message="实际请求URL"
                  description={
                    <Text copyable={{ text: executionResults.url }} style={{ wordBreak: 'break-all' }}>
                      {executionResults.url}
                    </Text>
                  }
                  type="success"
                  icon={<CheckCircleOutlined />}
                  style={{ marginBottom: 8 }}
                />
              )}
              <Text>
                结果数: <Text strong>{executionResults.results_count}</Text>
              </Text>
              <Text>
                耗时: <Text strong>{executionResults.execution_time?.toFixed(2)}s</Text>
              </Text>
              {executionResults.render_method && (
                <Text>
                  渲染方式: <Tag color="blue">{executionResults.render_method === 'playwright' ? 'JavaScript渲染' : 'HTTP请求'}</Tag>
                </Text>
              )}
              <Divider />
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {executionResults.results?.map((item: any, index: number) => (
                  <Card key={index} size="small" style={{ marginBottom: 8 }}>
                    <Paragraph strong>{item.title}</Paragraph>
                    {item.link && (
                      <Paragraph>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {item.link}
                        </a>
                      </Paragraph>
                    )}
                    {item.content && (
                      <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                        {item.content}
                      </Paragraph>
                    )}
                    {item.date && <Text type="secondary">{item.date}</Text>}
                  </Card>
                ))}
              </div>
            </Space>
          </Card>
        )}
      </Modal>

      {/* 执行历史模态框 */}
      <Modal
        title={`执行历史: ${currentTool?.name}`}
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setCurrentTool(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Table
          columns={executionColumns}
          dataSource={executions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default CustomCrawlerToolsPage;
