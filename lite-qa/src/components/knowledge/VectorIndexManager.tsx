/**
 * 向量索引管理组件
 * 
 * 提供Collection级别的向量索引创建、重建和状态监控功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Tooltip,
  Progress,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Spin
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { vectorIndexService } from '../../services/vectorIndexService';

const { Title, Text } = Typography;
const { Option } = Select;

interface IndexStatus {
  collection_id: string;
  collection_name: string;
  index_name: string;
  index_type: string;
  vector_field: string;
  vector_dimension: number;
  exists: boolean;
  is_valid: boolean;
  size_mb: number;
  last_rebuild?: string;
  total_vectors: number;
  null_vectors: number;
}

interface VectorAnalysis {
  collection_id: string;
  total_chunks: number;
  vector_statistics: Record<string, { count: number; dimension: number }>;
  default_config: {
    index_type: string;
    distance_metric: string;
    m: number;
    ef_construction: number;
  };
}

interface SupportedConfigs {
  index_types: Array<{
    value: string;
    name: string;
    description: string;
    is_default: boolean;
    parameters: Record<string, any>;
  }>;
  distance_metrics: Array<{
    value: string;
    name: string;
    description: string;
    is_default: boolean;
  }>;
  default_config: {
    index_type: string;
    distance_metric: string;
    parameters: Record<string, any>;
  };
}

interface VectorIndexManagerProps {
  collectionId: string;
  collectionName: string;
}

export const VectorIndexManager: React.FC<VectorIndexManagerProps> = ({
  collectionId,
  collectionName
}) => {
  // 状态管理
  const [indexStatuses, setIndexStatuses] = useState<IndexStatus[]>([]);
  const [vectorAnalysis, setVectorAnalysis] = useState<VectorAnalysis | null>(null);
  const [supportedConfigs, setSupportedConfigs] = useState<SupportedConfigs | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  // Modal状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [rebuildModalVisible, setRebuildModalVisible] = useState(false);
  
  // Form实例
  const [createForm] = Form.useForm();
  const [rebuildForm] = Form.useForm();

  // 初始化数据加载
  useEffect(() => {
    loadSupportedConfigs();
    loadVectorAnalysis();
    loadIndexStatuses();
  }, [collectionId]);

  // 加载支持的配置选项
  const loadSupportedConfigs = async () => {
    try {
      const configs = await vectorIndexService.getSupportedConfigs();
      setSupportedConfigs(configs);
    } catch (error) {
      console.error('加载配置选项失败:', error);
      message.error('加载配置选项失败');
    }
  };

  // 加载向量分析数据
  const loadVectorAnalysis = async () => {
    try {
      const analysis = await vectorIndexService.analyzeCollectionVectors(collectionId);
      setVectorAnalysis(analysis);
    } catch (error) {
      console.error('分析向量数据失败:', error);
      message.error('分析向量数据失败');
    }
  };

  // 加载索引状态
  const loadIndexStatuses = async () => {
    try {
      setLoading(true);
      const statuses = await vectorIndexService.getIndexStatus(collectionId);
      setIndexStatuses(statuses);
    } catch (error) {
      console.error('加载索引状态失败:', error);
      message.error('加载索引状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadVectorAnalysis();
    loadIndexStatuses();
  };

  // 创建索引
  const handleCreateIndex = async (values: any) => {
    try {
      setCreating(true);
      
      const config = {
        index_type: values.index_type,
        distance_metric: values.distance_metric,
        ...(values.index_type === 'hnsw' ? {
          m: values.m,
          ef_construction: values.ef_construction
        } : {
          lists: values.lists
        })
      };

      const result = await vectorIndexService.createIndex({
        collection_id: collectionId,
        vector_field: values.vector_field,
        config,
        force_recreate: values.force_recreate || false
      });

      message.success(`索引创建成功，耗时 ${result.data.build_time.toFixed(2)} 秒`);
      setCreateModalVisible(false);
      createForm.resetFields();
      handleRefresh();
      
    } catch (error: any) {
      console.error('创建索引失败:', error);
      message.error(error.response?.data?.detail || '创建索引失败');
    } finally {
      setCreating(false);
    }
  };

  // 重建索引
  const handleRebuildIndexes = async (values: any) => {
    try {
      setRebuilding(true);
      
      const config = values.use_custom_config ? {
        index_type: values.index_type,
        distance_metric: values.distance_metric,
        ...(values.index_type === 'hnsw' ? {
          m: values.m,
          ef_construction: values.ef_construction
        } : {
          lists: values.lists
        })
      } : undefined;

      const result = await vectorIndexService.rebuildIndexes({
        collection_id: collectionId,
        vector_fields: values.vector_fields,
        config
      });

      if (result.async_mode) {
        message.info(`已启动后台重建任务，预计耗时 ${result.data.estimated_time_minutes} 分钟`);
      } else {
        message.success(`索引重建完成，总耗时 ${result.data.total_build_time.toFixed(2)} 秒`);
      }

      setRebuildModalVisible(false);
      rebuildForm.resetFields();
      handleRefresh();
      
    } catch (error: any) {
      console.error('重建索引失败:', error);
      message.error(error.response?.data?.detail || '重建索引失败');
    } finally {
      setRebuilding(false);
    }
  };

  // 获取可用的向量字段
  const getAvailableVectorFields = () => {
    if (!vectorAnalysis) return [];
    
    const fields = [];
    const stats = vectorAnalysis.vector_statistics;
    
    if (stats.general_embedding?.count > 0) {
      fields.push({ value: 'general_embedding', label: `通用向量 (${stats.general_embedding.count}个)` });
    }
    if (stats.domain_embedding?.count > 0) {
      fields.push({ value: 'domain_embedding', label: `领域向量 (${stats.domain_embedding.count}个)` });
    }
    if (stats.embedding?.count > 0) {
      fields.push({ value: 'embedding', label: `原始向量 (${stats.embedding.count}个)` });
    }
    
    return fields;
  };

  // 渲染索引状态标签
  const renderIndexStatusTag = (status: IndexStatus) => {
    if (!status.exists) {
      return <Tag color="default">未创建</Tag>;
    }
    if (!status.is_valid) {
      return <Tag color="error">异常</Tag>;
    }
    return <Tag color="success">正常</Tag>;
  };

  // 渲染索引类型标签
  const renderIndexTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      hnsw: 'blue',
      ivfflat: 'green',
      none: 'default'
    };
    return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '向量字段',
      dataIndex: 'vector_field',
      key: 'vector_field',
      render: (field: string, record: IndexStatus) => (
        <Space direction="vertical" size="small">
          <Text strong>{field}</Text>
          <Text type="secondary">{record.vector_dimension}维</Text>
        </Space>
      )
    },
    {
      title: '索引状态',
      key: 'status',
      render: (_, record: IndexStatus) => renderIndexStatusTag(record)
    },
    {
      title: '索引类型',
      dataIndex: 'index_type',
      key: 'index_type',
      render: (type: string) => renderIndexTypeTag(type)
    },
    {
      title: '索引大小',
      dataIndex: 'size_mb',
      key: 'size_mb',
      render: (size: number) => `${size.toFixed(2)} MB`
    },
    {
      title: '向量数量',
      dataIndex: 'total_vectors',
      key: 'total_vectors',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '最后重建',
      dataIndex: 'last_rebuild',
      key: 'last_rebuild',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    }
  ];

  return (
    <div className="vector-index-manager">
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              向量索引管理 - {collectionName}
            </Title>
            <Tooltip title="管理Collection级别的向量索引">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={!vectorAnalysis || getAvailableVectorFields().length === 0}
            >
              创建索引
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRebuildModalVisible(true)}
              disabled={!vectorAnalysis || indexStatuses.filter(s => s.exists).length === 0}
            >
              重建索引
            </Button>
          </Space>
        }
      >
        {/* 向量统计概览 */}
        {vectorAnalysis && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic
                title="文档分块总数"
                value={vectorAnalysis.total_chunks}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="通用向量"
                value={vectorAnalysis.vector_statistics.general_embedding?.count || 0}
                suffix={`/ ${vectorAnalysis.vector_statistics.general_embedding?.dimension || 0}维`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="领域向量"
                value={vectorAnalysis.vector_statistics.domain_embedding?.count || 0}
                suffix={`/ ${vectorAnalysis.vector_statistics.domain_embedding?.dimension || 0}维`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="默认索引"
                value="HNSW"
                suffix="(推荐)"
              />
            </Col>
          </Row>
        )}

        {/* 索引状态表格 */}
        <Table
          columns={columns}
          dataSource={indexStatuses}
          rowKey={(record) => `${record.vector_field}_${record.index_type}`}
          loading={loading}
          pagination={false}
          size="middle"
        />

        {/* 创建索引Modal */}
        <Modal
          title="创建向量索引"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            createForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateIndex}
            initialValues={supportedConfigs?.default_config}
          >
            <Form.Item
              name="vector_field"
              label="选择向量字段"
              rules={[{ required: true, message: '请选择向量字段' }]}
            >
              <Select placeholder="选择要创建索引的向量字段">
                {getAvailableVectorFields().map(field => (
                  <Option key={field.value} value={field.value}>
                    {field.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="index_type"
              label="索引类型"
              rules={[{ required: true, message: '请选择索引类型' }]}
              extra="默认使用HNSW索引，性能最佳"
            >
              <Select>
                {supportedConfigs?.index_types.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>
                      {type.name}
                      {type.is_default && <Tag color="blue" size="small">默认</Tag>}
                      <Text type="secondary">- {type.description}</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="distance_metric"
              label="距离度量"
              rules={[{ required: true, message: '请选择距离度量' }]}
              extra="余弦相似度适合文本向量"
            >
              <Select>
                {supportedConfigs?.distance_metrics.map(metric => (
                  <Option key={metric.value} value={metric.value}>
                    <Space>
                      {metric.name}
                      {metric.is_default && <Tag color="blue" size="small">默认</Tag>}
                      <Text type="secondary">- {metric.description}</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item dependencies={['index_type']} noStyle>
              {({ getFieldValue }) => {
                const indexType = getFieldValue('index_type');
                if (indexType === 'hnsw') {
                  return (
                    <>
                      <Form.Item
                        name="m"
                        label="连接数 (m)"
                        extra="每个节点的连接数，影响精确度和内存占用"
                        rules={[{ required: true, message: '请输入连接数' }]}
                      >
                        <InputNumber min={1} max={100} placeholder="16" />
                      </Form.Item>
                      <Form.Item
                        name="ef_construction"
                        label="构建搜索深度"
                        extra="构建时的搜索深度，影响索引质量"
                        rules={[{ required: true, message: '请输入构建搜索深度' }]}
                      >
                        <InputNumber min={1} max={1000} placeholder="64" />
                      </Form.Item>
                    </>
                  );
                } else if (indexType === 'ivfflat') {
                  return (
                    <Form.Item
                      name="lists"
                      label="聚类数量"
                      extra="聚类数量，建议设置为向量数量/1000"
                      rules={[{ required: true, message: '请输入聚类数量' }]}
                    >
                      <InputNumber min={1} max={32768} placeholder="100" />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item name="force_recreate" valuePropName="checked">
              <Alert
                message="强制重建已存在的索引"
                description="如果索引已存在，将先删除再重新创建"
                type="warning"
                showIcon
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creating}
                  icon={<PlusOutlined />}
                >
                  创建索引
                </Button>
                <Button onClick={() => setCreateModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 重建索引Modal */}
        <Modal
          title="重建向量索引"
          open={rebuildModalVisible}
          onCancel={() => {
            setRebuildModalVisible(false);
            rebuildForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Alert
            message="重建索引注意事项"
            description="重建索引会删除现有索引并重新创建，大数据集可能需要较长时间"
            type="info"
            style={{ marginBottom: 16 }}
            showIcon
          />
          
          <Form
            form={rebuildForm}
            layout="vertical"
            onFinish={handleRebuildIndexes}
            initialValues={{
              use_custom_config: false,
              ...supportedConfigs?.default_config
            }}
          >
            <Form.Item
              name="vector_fields"
              label="选择重建字段"
              extra="不选择则重建所有有数据的向量字段"
            >
              <Select mode="multiple" placeholder="选择要重建索引的向量字段">
                {getAvailableVectorFields().map(field => (
                  <Option key={field.value} value={field.value}>
                    {field.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="use_custom_config" valuePropName="checked">
              <Alert
                message="使用自定义配置"
                description="不选择则使用默认HNSW配置"
                type="info"
                showIcon
              />
            </Form.Item>

            <Form.Item dependencies={['use_custom_config']} noStyle>
              {({ getFieldValue }) => {
                if (!getFieldValue('use_custom_config')) return null;
                
                return (
                  <>
                    <Form.Item
                      name="index_type"
                      label="索引类型"
                      rules={[{ required: true, message: '请选择索引类型' }]}
                    >
                      <Select>
                        {supportedConfigs?.index_types.map(type => (
                          <Option key={type.value} value={type.value}>
                            <Space>
                              {type.name}
                              {type.is_default && <Tag color="blue" size="small">默认</Tag>}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="distance_metric"
                      label="距离度量"
                      rules={[{ required: true, message: '请选择距离度量' }]}
                    >
                      <Select>
                        {supportedConfigs?.distance_metrics.map(metric => (
                          <Option key={metric.value} value={metric.value}>
                            {metric.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item dependencies={['index_type']} noStyle>
                      {({ getFieldValue: getNestedValue }) => {
                        const indexType = getNestedValue('index_type');
                        if (indexType === 'hnsw') {
                          return (
                            <>
                              <Form.Item name="m" label="连接数 (m)">
                                <InputNumber min={1} max={100} placeholder="16" />
                              </Form.Item>
                              <Form.Item name="ef_construction" label="构建搜索深度">
                                <InputNumber min={1} max={1000} placeholder="64" />
                              </Form.Item>
                            </>
                          );
                        } else if (indexType === 'ivfflat') {
                          return (
                            <Form.Item name="lists" label="聚类数量">
                              <InputNumber min={1} max={32768} placeholder="100" />
                            </Form.Item>
                          );
                        }
                        return null;
                      }}
                    </Form.Item>
                  </>
                );
              }}
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={rebuilding}
                  icon={<ReloadOutlined />}
                >
                  重建索引
                </Button>
                <Button onClick={() => setRebuildModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default VectorIndexManager;