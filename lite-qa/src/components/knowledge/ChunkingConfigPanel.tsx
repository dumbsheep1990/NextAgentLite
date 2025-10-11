/**
 * 切分配置管理面板
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Row,
  Col,
  Alert
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ExperimentOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';
import { chunkingConfigService } from '../../services/chunkingConfigService';
import type { ChunkingConfig } from '../../services/chunkingConfigService';

const { Option } = Select;
const { TextArea } = Input;

interface ChunkingConfigPanelProps {
  onFunctionExpose?: boolean;
}

const ChunkingConfigPanel = ({ onFunctionExpose }: ChunkingConfigPanelProps) => {
  // 使用全局资源store
  const {
    chunkingConfigs,
    defaultChunkingConfig,
    refreshChunkingConfigs,
    isResourceLoaded,
    loadErrors
  } = useGlobalResourceStore();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChunkingConfig | null>(null);
  const [form] = Form.useForm();

  // 检查资源是否已加载
  const isConfigsLoaded = isResourceLoaded('切分配置');
  const configError = loadErrors['切分配置'];

  // 从数据库配置生成预设模板
  const presets = chunkingConfigs.map(config => ({
    name: config.name,
    description: config.description || getStrategyDescription(config.strategy),
    strategy: config.strategy,
    chunkSize: config.chunkSize || config.chunk_token_num,
    chunkOverlap: config.chunkOverlap || config.chunk_overlap,
    tokenizer: 'simple',
    separators: ['。', '！', '？', '\n\n', '\n'] // 使用默认分隔符
  }));

  // 根据数据库配置动态生成策略选项
  const getStrategyOptions = () => {
    const uniqueStrategies = new Map();
    
    // 从切分配置中提取所有策略
    chunkingConfigs.forEach(config => {
      if (!uniqueStrategies.has(config.strategy)) {
        uniqueStrategies.set(config.strategy, {
          value: config.strategy,
          label: getStrategyLabel(config.strategy),
          description: getStrategyDescription(config.strategy),
          icon: getStrategyIcon(config.strategy)
        });
      }
    });
    
    return Array.from(uniqueStrategies.values());
  };
  
  // 获取策略显示名称
  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'semantic': return '语义切分';
      case 'sliding_window': return '滑动窗口';
      case 'fixed': return '固定切分';
      case 'naive': return '朴素切分';
      case 'sentence': return '句子切分';
      case 'paragraph': return '段落切分';
      default: return strategy.charAt(0).toUpperCase() + strategy.slice(1);
    }
  };
  
  // 获取策略描述
  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'semantic': return '基于内容语义相关性智能合并';
      case 'fixed': return '严格按照Token数量限制切分';
      case 'naive': return '基础的段落分割方法';
      case 'sentence': return '按句子边界切分，保持语义完整性';
      case 'paragraph': return '按段落边界切分，适合长篇文档';
      default: return '自定义切分策略';
    }
  };
  
  // 获取策略图标
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'semantic': return <BranchesOutlined style={{ color: '#3b82f6' }} />;
      case 'fixed': return <ThunderboltOutlined style={{ color: '#f59e0b' }} />;
      case 'naive': return <ExperimentOutlined style={{ color: '#10b981' }} />;
      case 'sentence': return <ExperimentOutlined style={{ color: '#8b5cf6' }} />;
      case 'paragraph': return <ExperimentOutlined style={{ color: '#06b6d4' }} />;
      default: return <SettingOutlined style={{ color: '#6b7280' }} />;
    }
  };
  
  const strategyOptions = getStrategyOptions();

  // 刷新配置（使用全局store）
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshChunkingConfigs();
      message.success('配置列表已刷新');
    } catch (error) {
      console.error('刷新配置失败:', error);
      message.error('刷新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化默认配置
  const initializeConfigs = async () => {
    setLoading(true);
    try {
      await chunkingConfigService.initializeDefaults({ force: true, normalize: true });
      message.success('默认配置初始化成功');
      // 刷新全局配置数据
      await refreshChunkingConfigs();
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建/更新配置
  const handleSave = async (values: any) => {
    try {
      const url = editingConfig 
        ? `/api/v1/knowledge/chunking-configs/${editingConfig.id}`
        : '/api/v1/knowledge/chunking-configs';
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(editingConfig ? '配置更新成功' : '配置创建成功');
        setModalVisible(false);
        setEditingConfig(null);
        form.resetFields();
        // 刷新全局配置数据
        await refreshChunkingConfigs();
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '操作失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  // 设置默认配置 - 只更新本地状态，不重排序
  const handleSetDefault = async (configId: string) => {
    try {
      console.log('设置默认配置:', configId);
      const response = await fetch('/api/v1/knowledge/chunking-configs/set-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config_id: configId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('设置默认配置响应:', result);
        message.success('默认配置设置成功');
        
        // 不重新获取数据，直接更新本地状态的is_default标记
        const store = useGlobalResourceStore.getState();
        const updatedConfigs = store.chunkingConfigs.map(config => ({
          ...config,
          is_default: config.id === configId
        }));
        
        const newDefaultConfig = updatedConfigs.find(config => config.id === configId);
        
        // 直接更新store状态
        useGlobalResourceStore.setState({
          chunkingConfigs: updatedConfigs,
          defaultChunkingConfig: newDefaultConfig || null
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: '设置失败' }));
        console.error('设置默认配置失败:', errorData);
        message.error(errorData.detail || '设置失败');
      }
    } catch (error) {
      console.error('设置默认配置失败:', error);
      message.error('网络错误，请稍后重试');
    }
  };

  // 删除配置
  const handleDelete = async (configId: string) => {
    try {
      const response = await fetch(`/api/v1/knowledge/chunking-configs/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('配置删除成功');
        // 刷新全局配置数据
        await refreshChunkingConfigs();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  // 编辑配置
  const handleEdit = (config: ChunkingConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setModalVisible(true);
  };

  // 使用预设配置
  const handleUsePreset = (preset: any) => {
    form.setFieldsValue(preset);
    setPresetModalVisible(false);
  };

  // 表格列定义
  const columns: ColumnsType<ChunkingConfig> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Space>
            <span style={{ fontWeight: 500 }}>{text}</span>
            {record.isDefault && (
              <Tag color="gold" icon={<StarFilled />}>默认</Tag>
            )}
          </Space>
          {record.description && (
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '切分策略',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy) => {
        const option = strategyOptions.find(opt => opt.value === strategy);
        return (
          <Space>
            {option?.icon}
            <span>{option?.label}</span>
          </Space>
        );
      },
    },
    {
      title: 'Token范围',
      key: 'tokens',
      render: (_, record) => (
        <span>{record.chunkSize} - {record.maxTokenNum}</span>
      ),
    },
    {
      title: '重叠',
      key: 'overlap',
      render: (_, record) => (
        <span>{record.chunkOverlap} Token</span>
      ),
    },
    {
      title: '支持格式',
      dataIndex: 'supported_formats',
      key: 'supported_formats',
      render: (formats) => (
        <Space wrap>
          {formats?.slice(0, 3).map((format: string) => (
            <Tag key={format}>{format.toUpperCase()}</Tag>
          ))}
          {formats?.length > 3 && <Tag>+{formats.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑配置">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          {!record.isDefault && (
            <Tooltip title="设为默认">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleSetDefault(record.id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          
          {!record.isDefault && (
            <Popconfirm
              title="确定删除此配置吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除配置">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 不再需要手动获取配置，因为全局store已经预加载了
  useEffect(() => {
    // 如果配置还没有加载，可以触发刷新
    if (!isConfigsLoaded && !loading) {
      handleRefresh();
    }
  }, [isConfigsLoaded]);

  // 暴露函数到window
  useEffect(() => {
    if (onFunctionExpose) {
      (window as any).triggerChunkingInitialize = initializeConfigs;
      (window as any).triggerChunkingCreate = () => {
        setEditingConfig(null);
        form.resetFields();
        setModalVisible(true);
      };
      (window as any).triggerChunkingRefresh = handleRefresh;
    }
    
    return () => {
      if ((window as any).triggerChunkingInitialize) {
        delete (window as any).triggerChunkingInitialize;
      }
      if ((window as any).triggerChunkingCreate) {
        delete (window as any).triggerChunkingCreate;
      }
      if ((window as any).triggerChunkingRefresh) {
        delete (window as any).triggerChunkingRefresh;
      }
    };
  }, [onFunctionExpose]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 添加自定义滚动条和下拉框样式 */}
      <style>
        {`
          .ant-modal-body::-webkit-scrollbar {
            width: 6px;
          }
          .ant-modal-body::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
            margin: 8px 0;
          }
          .ant-modal-body::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
          .ant-modal-body::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          
          /* 强制设置下拉框背景为白色 */
          .ant-select-dropdown {
            background-color: #ffffff !important;
          }
          .ant-select-item {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .ant-select-item-option-content {
            background-color: transparent !important;
            color: #000000 !important;
          }
          .ant-select-item:hover {
            background-color: #f5f5f5 !important;
            color: #000000 !important;
          }
          .ant-select-item-option-selected {
            background-color: #e6f4ff !important;
            color: #000000 !important;
          }
        `}
      </style>
      {/* 错误提示 */}
      {configError && (
        <Alert
          message="切分配置加载失败"
          description={configError}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" onClick={handleRefresh} loading={loading}>
              重试
            </Button>
          }
        />
      )}

      {/* 配置列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={chunkingConfigs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
        />
      </Card>

      {/* 配置编辑Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: editingConfig 
                ? '#1890ff'
                : '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px'
            }}>
              {editingConfig ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                {editingConfig ? '编辑切分配置' : '新建切分配置'}
              </div>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingConfig(null);
          form.resetFields();
        }}
        footer={
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0 8px 0'
          }}>
            <Button
              type="dashed"
              icon={<ExperimentOutlined />}
              onClick={() => setPresetModalVisible(true)}
              style={{
                borderRadius: '6px',
                height: '36px',
                padding: '0 16px'
              }}
            >
              使用预设模板
            </Button>
            
            <Space size="middle">
              <Button
                size="middle"
                style={{
                  borderRadius: '6px',
                  height: '36px',
                  padding: '0 20px'
                }}
                onClick={() => {
                  setModalVisible(false);
                  setEditingConfig(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="middle"
                style={{
                  borderRadius: '6px',
                  height: '36px',
                  padding: '0 24px'
                }}
                icon={editingConfig ? <EditOutlined /> : <PlusOutlined />}
                onClick={() => form.submit()}
              >
                {editingConfig ? '更新配置' : '创建配置'}
              </Button>
            </Space>
          </div>
        }
        width={800}
        centered
        destroyOnClose
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '8px',
            marginBottom: '0'
          },
          body: {
            paddingTop: '16px',
            paddingRight: '16px',
            maxHeight: 'calc(70vh - 120px)',
            overflowY: 'auto',
            marginRight: '8px'
          },
          footer: {
            borderTop: '1px solid #f0f0f0',
            marginTop: '0'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            strategy: 'semantic',
            chunk_token_num: 400,
            max_token_num: 512,
            chunk_overlap: 50,
            delimiter: '.!?',
            tokenizer_type: 'simple',
            preserve_structure: true,
            semantic_threshold: 30,
            supported_formats: ['txt', 'md', 'pdf', 'docx'],
          }}
        >
          {/* 基础信息卡片 */}
          <div style={{
            background: 'linear-gradient(135deg, #e6f4ff, #f0f8ff)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #d6e4ff'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <SettingOutlined style={{ 
                color: '#1890ff', 
                fontSize: '16px' 
              }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                基础信息
              </span>
            </div>
            
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      配置名称
                    </span>
                  }
                  name="name"
                  rules={[{ required: true, message: '请输入配置名称' }]}
                >
                  <Input 
                    placeholder="例如：语义切分、固定长度切分、句子切分..." 
                    size="large"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#374151' }}>
                  配置描述
                </span>
              }
              name="description"
            >
              <TextArea 
                placeholder="描述该配置的使用场景和特点（可选）" 
                rows={3}
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </div>

          {/* 切分策略卡片 */}
          <div style={{
            background: 'linear-gradient(135deg, #f6ffed, #f0fff0)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #b7eb8f'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <BranchesOutlined style={{ 
                color: '#52c41a', 
                fontSize: '16px' 
              }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                切分策略
              </span>
            </div>

            <Form.Item
              label={
                <span style={{ fontWeight: 600, color: '#374151' }}>
                  策略类型
                </span>
              }
              name="strategy"
              rules={[{ required: true, message: '请选择切分策略' }]}
            >
              <Select 
                placeholder="选择适合的切分策略"
                optionLabelProp="label"
                size="large"
                style={{ borderRadius: '8px' }}
                dropdownStyle={{ 
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px'
                }}
              >
                {strategyOptions.map(option => (
                  <Option key={option.value} value={option.value} label={option.label}>
                    <div style={{ 
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '16px' }}>
                        {option.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          {option.label}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 根据策略类型显示不同的参数设置 */}
          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.strategy !== currentValues.strategy}>
            {({ getFieldValue }) => {
              const strategy = getFieldValue('strategy');
              
              // 朴素切分策略的说明
              if (strategy === 'naive') {
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f5ff, #f6f9ff)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #adc6ff'
                  }}>
                    <Alert
                      message={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ExperimentOutlined style={{ color: '#597ef7' }} />
                          <span style={{ fontWeight: 600 }}>朴素段落切分</span>
                        </div>
                      }
                      description="该策略按文档的自然段落边界进行切分，保持原始文档结构，无需设置切分大小和重叠量参数。适合结构清晰的文档处理。"
                      type="info"
                      showIcon={false}
                      style={{ 
                        border: 'none',
                        background: 'transparent',
                        padding: 0
                      }}
                    />
                  </div>
                );
              }
              
              // 语义切分和固定切分需要显示Token参数
              if (strategy === 'semantic' || strategy === 'fixed') {
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f5ff, #f6f9ff)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #adc6ff'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '20px' 
                    }}>
                      <ThunderboltOutlined style={{ 
                        color: '#597ef7', 
                        fontSize: '16px' 
                      }} />
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        color: '#374151' 
                      }}>
                        Token参数设置
                      </span>
                    </div>
                    
                    <Row gutter={24}>
                      <Col span={8}>
                        <Form.Item
                          label={
                            <span style={{ fontWeight: 600, color: '#374151' }}>
                              最小Token数
                            </span>
                          }
                          name="chunk_token_num"
                          rules={[{ required: true, message: '请输入最小Token数' }]}
                        >
                          <InputNumber
                            min={50}
                            max={1000}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="50-1000"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label={
                            <span style={{ fontWeight: 600, color: '#374151' }}>
                              最大Token数
                            </span>
                          }
                          name="max_token_num"
                          rules={[{ required: true, message: '请输入最大Token数' }]}
                        >
                          <InputNumber
                            min={100}
                            max={2000}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="100-2000"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label={
                            <span style={{ fontWeight: 600, color: '#374151' }}>
                              重叠Token数
                            </span>
                          }
                          name="chunk_overlap"
                          rules={[{ required: true, message: '请输入重叠Token数' }]}
                        >
                          <InputNumber
                            min={0}
                            max={200}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="0-200"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                );
              }
              
              // 其他策略的基础参数设置
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f5ff, #f6f9ff)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: '1px solid #adc6ff'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <SettingOutlined style={{ 
                      color: '#597ef7', 
                      fontSize: '16px' 
                    }} />
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#374151' 
                    }}>
                      基础参数设置
                    </span>
                  </div>
                  
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, color: '#374151' }}>
                            切分大小
                          </span>
                        }
                        name="chunk_token_num"
                        rules={[{ required: true, message: '请输入切分大小' }]}
                      >
                        <InputNumber
                          min={50}
                          max={1000}
                          style={{ width: '100%', borderRadius: '8px' }}
                          placeholder="300"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, color: '#374151' }}>
                            重叠量
                          </span>
                        }
                        name="chunk_overlap"
                        rules={[{ required: true, message: '请输入重叠量' }]}
                      >
                        <InputNumber
                          min={0}
                          max={200}
                          style={{ width: '100%', borderRadius: '8px' }}
                          placeholder="30"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              );
            }}
          </Form.Item>

          {/* 高级设置卡片 */}
          <div style={{
            background: 'linear-gradient(135deg, #fff7e6, #fffbf0)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #ffd591'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <SettingOutlined style={{ 
                color: '#fa8c16', 
                fontSize: '16px' 
              }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                高级设置
              </span>
            </div>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      分隔符
                    </span>
                  }
                  name="delimiter"
                  rules={[{ required: true, message: '请输入分隔符' }]}
                >
                  <Input 
                    placeholder=".!?。！？" 
                    size="large"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      分词器类型
                    </span>
                  }
                  name="tokenizer_type"
                  rules={[{ required: true, message: '请选择分词器类型' }]}
                >
                  <Select 
                    placeholder="选择分词器类型"
                    size="large"
                    style={{ borderRadius: '8px' }}
                    dropdownStyle={{ 
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '4px'
                    }}
                  >
                    <Option value="simple">简单分词器</Option>
                    <Option value="advanced">高级分词器</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      保留文档结构
                    </span>
                  }
                  name="preserve_structure"
                  valuePropName="checked"
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '8px 0'
                  }}>
                    <Switch size="default" />
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      flex: 1
                    }}>
                      保持原始文档的段落和章节结构
                    </span>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>
                        语义阈值
                      </span>
                      <Tooltip title="语义相关性阈值，0-100的百分比值。值越高，要求文本间语义相关性越强">
                        <InfoCircleOutlined style={{ color: '#6b7280', fontSize: '14px' }} />
                      </Tooltip>
                    </div>
                  }
                  name="semantic_threshold"
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%', borderRadius: '8px' }}
                    addonAfter="%"
                    size="large"
                    placeholder="30"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>

      {/* 预设配置选择Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: '#fa8c16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px'
            }}>
              <ExperimentOutlined />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                选择预设配置模板
              </div>
            </div>
          </div>
        }
        open={presetModalVisible}
        onCancel={() => setPresetModalVisible(false)}
        footer={null}
        width={720}
        centered
        zIndex={1001}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '8px',
            marginBottom: '0'
          },
          body: {
            paddingTop: '16px',
            maxHeight: '60vh',
            overflowY: 'auto',
            overflowX: 'hidden'
          }
        }}
      >
        <div style={{ width: '100%' }}>
          <Row gutter={16}>
            {presets.map((preset, index) => (
              <Col span={24} key={index} style={{ marginBottom: '16px' }}>
                <Card
                  hoverable
                  onClick={() => handleUsePreset(preset)}
                  style={{ 
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: '16px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* 图标 */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      border: '1px solid #d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#262626',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {React.cloneElement(
                        strategyOptions.find(opt => opt.value === preset.strategy)?.icon || <SettingOutlined />,
                        { style: { color: '#262626' } }
                      )}
                    </div>
                    
                    {/* 内容 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        color: '#262626',
                        marginBottom: '4px'
                      }}>
                        {preset.name}
                      </div>
                      
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#8c8c8c',
                        marginBottom: '8px'
                      }}>
                        {preset.description}
                      </div>
                      
                      {/* 参数标签 */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: '#f0f2ff',
                          border: '1px solid #d6e4ff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1890ff'
                        }}>
                          Token: {preset.chunkSize}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#52c41a'
                        }}>
                          重叠: {preset.chunkOverlap}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: '#fff7e6',
                          border: '1px solid #ffd591',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#fa8c16'
                        }}>
                          {strategyOptions.find(opt => opt.value === preset.strategy)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* 底部提示 */}
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
              选择预设模板后，您可以根据需要进一步调整参数
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChunkingConfigPanel;
