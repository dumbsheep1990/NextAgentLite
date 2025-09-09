/**
 * 知识库全局配置页面 - 系统级配置和策略管理
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Divider,
  message,
  Row,
  Col,
  Typography,
  Tabs,
  Slider,
  Alert,
  Tag,
  Tooltip,
  Table,
  Statistic,
  Progress,
  List,
  Badge,
  Modal,
  Spin
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SecurityScanOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { apiService } from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface GlobalConfig {
  // 文档处理配置
  defaultChunkSize: number;
  chunkOverlap: number;
  maxDocumentSize: number;
  allowedFileTypes: string[];
  
  // 向量化配置
  embeddingModel: string;
  vectorDimension: number;
  batchSize: number;
  
  // 检索配置
  defaultRetrievalStrategy: string;
  maxRetrievalResults: number;
  similarityThreshold: number;
  
  // 存储配置
  storageRetentionDays: number;
  autoCleanup: boolean;
  compressionEnabled: boolean;
  
  // 安全配置
  enableContentFilter: boolean;
  maxUploadSize: number;
  allowedDomains: string[];
}

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

const KnowledgeGlobalConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [config, setConfig] = useState<GlobalConfig>({
    // 默认配置值
    defaultChunkSize: 1000,
    chunkOverlap: 200,
    maxDocumentSize: 10485760, // 10MB
    allowedFileTypes: ['pdf', 'txt', 'docx', 'md'],
    embeddingModel: 'text-embedding-v4',
    vectorDimension: 1024,
    batchSize: 10,
    defaultRetrievalStrategy: 'hybrid',
    maxRetrievalResults: 20,
    similarityThreshold: 0.7,
    storageRetentionDays: 90,
    autoCleanup: true,
    compressionEnabled: true,
    enableContentFilter: true,
    maxUploadSize: 52428800, // 50MB
    allowedDomains: []
  });

  // 维护相关状态
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats>({
    totalCollections: 0,
    totalDocuments: 0,
    orphanedDocuments: 0,
    failedDocuments: 0,
    duplicateDocuments: 0,
    indexingIssues: 0,
    storageUsage: 0,
    lastMaintenance: '从未运行'
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
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
  const { confirm } = Modal;

  // 加载配置
  const loadConfig = async () => {
    try {
      setLoading(true);
      // TODO: 从后端加载配置
      // const response = await configService.getGlobalConfig();
      // setConfig(response.config);
      // form.setFieldsValue(response.config);
      
      // 暂时使用本地存储
      const savedConfig = localStorage.getItem('knowledge-global-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        form.setFieldsValue(parsedConfig);
      } else {
        form.setFieldsValue(config);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async (values: GlobalConfig) => {
    try {
      setSaving(true);
      // TODO: 保存到后端
      // await configService.updateGlobalConfig(values);
      
      // 暂时保存到本地存储
      localStorage.setItem('knowledge-global-config', JSON.stringify(values));
      setConfig(values);
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 从后端加载模型配置
  const loadModelConfig = async () => {
    try {
      setModelsLoading(true);
      const response = await apiService.get('/config/models/current');
      
      if (response.success) {
        setModelConfig(response.data);
        
        // 设置当前默认的嵌入模型到表单
        const defaultEmbeddingModel = response.data?.embedding?.default_model;
        if (defaultEmbeddingModel) {
          form.setFieldsValue({
            embeddingModel: defaultEmbeddingModel
          });
        }
        
        console.log('模型配置加载成功:', response.data);
      } else {
        console.error('模型配置加载失败:', response);
        message.error('加载模型配置失败');
      }
      
    } catch (error) {
      console.error('加载模型配置失败:', error);
      message.error(`加载模型配置失败: ${error.message || error}`);
    } finally {
      setModelsLoading(false);
    }
  };

  // 重置配置
  const resetConfig = () => {
    form.setFieldsValue(config);
    message.info('配置已重置');
  };

  // 维护功能方法
  const fetchMaintenanceStats = async () => {
    try {
      setLoading(true);
      // TODO: 实际的API调用
      // 这里使用模拟数据
      setMaintenanceStats({
        totalCollections: 15,
        totalDocuments: 234,
        orphanedDocuments: 3,
        failedDocuments: 2,
        duplicateDocuments: 8,
        indexingIssues: 5,
        storageUsage: 1024 * 1024 * 150, // 150MB
        lastMaintenance: localStorage.getItem('last-maintenance') || '从未运行'
      });
    } catch (error) {
      console.error('获取维护统计失败:', error);
      message.error('获取维护统计失败');
    } finally {
      setLoading(false);
    }
  };

  const runMaintenanceTask = async (taskId: string) => {
    const taskIndex = maintenanceTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const updatedTasks = [...maintenanceTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      status: 'running',
      progress: 0
    };
    setMaintenanceTasks(updatedTasks);

    const logMessage = `${new Date().toLocaleString()} - 开始执行维护任务: ${updatedTasks[taskIndex].name}`;
    setSystemLogs(prev => [logMessage, ...prev]);

    try {
      for (let i = 1; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedTasks[taskIndex].progress = i;
        setMaintenanceTasks([...updatedTasks]);
      }

      updatedTasks[taskIndex].status = 'completed';
      updatedTasks[taskIndex].progress = 100;
      updatedTasks[taskIndex].lastRun = new Date().toLocaleString();
      setMaintenanceTasks([...updatedTasks]);

      const successMessage = `${new Date().toLocaleString()} - 维护任务完成: ${updatedTasks[taskIndex].name}`;
      setSystemLogs(prev => [successMessage, ...prev]);
      message.success(`${updatedTasks[taskIndex].name} 执行完成`);

      localStorage.setItem('last-maintenance', new Date().toLocaleString());
      
    } catch (error) {
      updatedTasks[taskIndex].status = 'failed';
      setMaintenanceTasks([...updatedTasks]);

      const errorMessage = `${new Date().toLocaleString()} - 维护任务失败: ${updatedTasks[taskIndex].name} - ${error}`;
      setSystemLogs(prev => [errorMessage, ...prev]);
      message.error(`${updatedTasks[taskIndex].name} 执行失败`);
    }
  };

  const runAllMaintenanceTasks = () => {
    confirm({
      title: '确认运行所有维护任务',
      icon: <ExclamationCircleOutlined />,
      content: '这将运行所有维护任务，可能需要较长时间。确定继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        for (const task of maintenanceTasks) {
          if (task.status === 'pending') {
            await runMaintenanceTask(task.id);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        message.success('所有维护任务已完成');
      }
    });
  };

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

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  useEffect(() => {
    loadConfig();
    fetchMaintenanceStats();
    loadModelConfig();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8fafc', 
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto',
      position: 'relative'
    }}>

      <Form
        form={form}
        layout="vertical"
        onFinish={saveConfig}
        initialValues={config}
      >
        <Tabs 
          defaultActiveKey="document-processing"
          style={{
            background: 'transparent'
          }}
          tabBarStyle={{
            borderBottom: '2px solid #f1f5f9',
            marginBottom: '24px'
          }}
        >
          {/* 文档处理配置 */}
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                文档处理
              </span>
            }
            key="document-processing"
          >
            <Row gutter={[20, 20]}>
              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px' 
                  }}>文档切分配置</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="defaultChunkSize"
                    label={
                      <Space>
                        默认切分大小
                        <Tooltip title="文档切分的默认字符数，影响检索精度">
                          <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Slider
                      min={500}
                      max={2000}
                      step={100}
                      marks={{
                        500: '500',
                        1000: '1000',
                        1500: '1500',
                        2000: '2000'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="chunkOverlap"
                    label={
                      <Space>
                        重叠字符数
                        <Tooltip title="相邻切分块的重叠字符数，避免语义截断">
                          <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={0}
                      max={500}
                      style={{ width: '100%' }}
                      addonAfter="字符"
                    />
                  </Form.Item>
                  </Card>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px' 
                  }}>文件限制</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="maxDocumentSize"
                    label="单文档最大大小"
                  >
                    <Select>
                      <Option value={5242880}>5MB</Option>
                      <Option value={10485760}>10MB</Option>
                      <Option value={20971520}>20MB</Option>
                      <Option value={52428800}>50MB</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="allowedFileTypes"
                    label="允许的文件类型"
                  >
                    <Select
                      mode="tags"
                      placeholder="选择或输入文件类型"
                    >
                      <Option value="pdf">PDF</Option>
                      <Option value="txt">TXT</Option>
                      <Option value="docx">DOCX</Option>
                      <Option value="md">Markdown</Option>
                      <Option value="xlsx">Excel</Option>
                    </Select>
                  </Form.Item>
                </Card>
                </div>
              </Col>
            </Row>

            {/* 向量化和检索配置 */}
            <Row gutter={[24, 0]} style={{ marginTop: '32px' }}>
              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px'
                  }}>嵌入模型配置</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="embeddingModel"
                    label={
                      <Space>
                        嵌入模型
                        <Tooltip title={`当前默认模型: ${modelConfig?.embedding?.default_model || '加载中...'}`}>
                          <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Select 
                      loading={modelsLoading}
                      placeholder={modelsLoading ? "从后端加载模型配置..." : "选择嵌入模型"}
                      notFoundContent={modelsLoading ? <Spin size="small" /> : "暂无可用模型"}
                    >
                      {/* 显示默认模型 */}
                      {modelConfig?.embedding?.default_model && (
                        <Option value={modelConfig.embedding.default_model}>
                          <Space>
                            {modelConfig.embedding.default_model}
                            <Tag color="green">默认配置</Tag>
                          </Space>
                        </Option>
                      )}
                      
                      {/* 显示所有配置的模型 */}
                      {modelConfig?.embedding?.configured_models?.filter(model => 
                        model !== modelConfig?.embedding?.default_model
                      ).map((model: string) => (
                        <Option key={model} value={model}>
                          {model}
                        </Option>
                      ))}
                      
                      {/* 如果没有从后端加载到模型，显示加载状态 */}
                      {!modelsLoading && (!modelConfig?.embedding?.configured_models || modelConfig.embedding.configured_models.length === 0) && (
                        <Option disabled value="no-models">
                          <span style={{ color: '#999' }}>
                            {modelsLoading ? '加载中...' : '未配置嵌入模型，请检查后端配置'}
                          </span>
                        </Option>
                      )}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="batchSize"
                    label="批处理大小"
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      style={{ width: '100%' }}
                      addonAfter="文档/批"
                    />
                  </Form.Item>
                  </Card>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px'
                  }}>检索参数</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="defaultRetrievalStrategy"
                    label="默认检索策略"
                  >
                    <Select>
                      <Option value="vector">纯向量检索</Option>
                      <Option value="keyword">关键词检索</Option>
                      <Option value="hybrid">混合检索</Option>
                      <Option value="graph">图谱增强检索</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="maxRetrievalResults"
                    label="最大检索结果数"
                  >
                    <InputNumber
                      min={5}
                      max={100}
                      style={{ width: '100%' }}
                      addonAfter="条"
                    />
                  </Form.Item>

                  <Form.Item
                    name="similarityThreshold"
                    label="相似度阈值"
                  >
                    <Slider
                      min={0.5}
                      max={1.0}
                      step={0.05}
                      marks={{
                        0.5: '0.5',
                        0.7: '0.7',
                        0.9: '0.9'
                      }}
                    />
                  </Form.Item>
                  </Card>
                </div>
              </Col>
            </Row>
          </TabPane>

          {/* 系统维护配置 */}
          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                系统维护
              </span>
            }
            key="maintenance"
          >
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px' 
                  }}>自动维护</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="autoCleanup"
                    label="启用自动清理"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="storageRetentionDays"
                    label="数据保留天数"
                  >
                    <InputNumber
                      min={7}
                      max={365}
                      style={{ width: '100%' }}
                      addonAfter="天"
                    />
                  </Form.Item>

                  <Form.Item
                    name="compressionEnabled"
                    label="启用数据压缩"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Card>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '16px' 
                  }}>安全设置</h4>
                  <Card 
                    size="small"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                  <Form.Item
                    name="enableContentFilter"
                    label="启用内容过滤"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="maxUploadSize"
                    label="最大上传大小"
                  >
                    <Select>
                      <Option value={10485760}>10MB</Option>
                      <Option value={52428800}>50MB</Option>
                      <Option value={104857600}>100MB</Option>
                      <Option value={209715200}>200MB</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="allowedDomains"
                    label="允许的域名"
                    help="URL文档抓取时允许的域名列表"
                  >
                    <Select
                      mode="tags"
                      placeholder="输入允许的域名"
                    />
                  </Form.Item>
                </Card>
                </div>
              </Col>
            </Row>


            {/* 维护任务 */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ToolOutlined style={{ color: '#f59e0b' }} />
                维护任务
              </h4>
              <Card 
                size="small"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
                bodyStyle={{ padding: '20px' }}
                extra={
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={fetchMaintenanceStats}
                      loading={loading}
                      size="small"
                    >
                      刷新
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<ToolOutlined />}
                      onClick={runAllMaintenanceTasks}
                      disabled={maintenanceTasks.some(task => task.status === 'running')}
                      size="small"
                      style={{
                        background: '#f59e0b',
                        borderColor: '#f59e0b'
                      }}
                    >
                      运行维护
                    </Button>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  {maintenanceTasks.map((task) => (
                    <Col span={12} key={task.id}>
                      <div style={{ 
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          {getTaskTypeIcon(task.type)}
                          <span style={{ marginLeft: '8px', fontWeight: 500, fontSize: '14px' }}>
                            {task.name}
                          </span>
                          {getTaskStatusTag(task.status)}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <Progress
                            percent={task.progress}
                            size="small"
                            status={task.status === 'failed' ? 'exception' : 'active'}
                            strokeColor={task.status === 'completed' ? '#10b981' : '#f59e0b'}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {task.lastRun || '从未运行'}
                          </Text>
                          <Button
                            size="small"
                            type="link"
                            loading={task.status === 'running'}
                            disabled={task.status === 'running'}
                            onClick={() => runMaintenanceTask(task.id)}
                            style={{ padding: '0 8px', height: '24px' }}
                          >
                            {task.status === 'running' ? '运行中' : '运行'}
                          </Button>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* 问题警告 */}
                {(maintenanceStats.failedDocuments > 0 || maintenanceStats.indexingIssues > 0) && (
                  <Alert
                    message="发现系统问题，建议运行维护任务"
                    type="warning"
                    showIcon
                    style={{ marginTop: '16px' }}
                    action={
                      <Button type="primary" size="small" onClick={runAllMaintenanceTasks}>
                        立即处理
                      </Button>
                    }
                  />
                )}
              </Card>
            </div>
          </TabPane>

        </Tabs>

        {/* 底部操作栏 - 固定在内容区底部 */}
        <Card 
          style={{ 
            marginTop: '24px',
            position: 'sticky',
            bottom: '20px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text type="secondary">
                配置变更将影响所有新创建的知识库和文档处理流程
              </Text>
            </div>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={resetConfig}
              >
                重置
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadConfig}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={saving}
                style={{
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '12px',
                  height: '40px',
                  padding: '0 24px',
                  fontWeight: '600',
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                保存配置
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default KnowledgeGlobalConfigPage;