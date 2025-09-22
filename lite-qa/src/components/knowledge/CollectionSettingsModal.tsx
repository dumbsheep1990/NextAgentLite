import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Space,
  Typography,
  Card,
  Divider,
  message,
  Switch,
  Select,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { KnowledgeCollection } from '../../types';
import { collectionService } from '../../services/collectionService';

const { Title, Text } = Typography;

interface CollectionSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  collection: KnowledgeCollection | null;
  onDeleteCollection: (collection: KnowledgeCollection) => void;
  onManageVectorIndex: (collection: KnowledgeCollection) => void;
  onRefresh?: () => void;
}

// 索引类型配置
const INDEX_TYPES = [
  {
    value: 'none',
    label: '无索引',
    description: '顺序扫描，适合小数据集（<1000条）',
    color: 'default',
    performance: '低',
    buildTime: '无',
    memoryUsage: '低'
  },
  {
    value: 'ivfflat',
    label: 'IVF-Flat',
    description: '倒排文件索引，平衡速度和精度',
    color: 'blue',
    performance: '中',
    buildTime: '快',
    memoryUsage: '中',
    params: {
      lists: 100  // 聚类中心数
    }
  },
  {
    value: 'hnsw',
    label: 'HNSW',
    description: '分层导航小世界图，高精度快速检索',
    color: 'green',
    performance: '高',
    buildTime: '慢',
    memoryUsage: '高',
    params: {
      m: 16,  // 每个节点的连接数
      ef_construction: 64  // 构建时的动态列表大小
    }
  }
];

const CollectionSettingsModal: React.FC<CollectionSettingsModalProps> = ({
  visible,
  onCancel,
  collection,
  onDeleteCollection,
  onManageVectorIndex,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('index');
  const [qaExtractionLoading, setQaExtractionLoading] = useState(false);
  const [currentIndexType, setCurrentIndexType] = useState('hnsw'); // 默认使用HNSW索引
  const [indexSwitching, setIndexSwitching] = useState(false);

  const handleExportData = () => {
    if (!collection) return;
    message.info('导出功能开发中...');
  };

  const handleDeleteCollection = () => {
    if (!collection) return;
    onDeleteCollection(collection);
    onCancel();
  };

  const handleQAToggle = async (enabled: boolean) => {
    if (!collection) return;
    
    try {
      setQaExtractionLoading(true);
      console.log('🔄 准备切换QA提取状态:', { collectionId: collection.id, enabled, currentValue: collection.auto_qa_extraction_enabled });
      
      // 调用API切换QA提取状态
      const result = await collectionService.toggleQAExtraction(collection.id, enabled);
      console.log('🎯 API返回结果:', result);
      
      if (result.success) {
        // 立即更新本地collection对象的状态
        if (collection) {
          collection.auto_qa_extraction_enabled = enabled;
        }
        
        message.success(enabled ? 'QA自动提取已开启' : 'QA自动提取已关闭');
        
        // 延迟刷新以确保状态更新
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 100);
      } else {
        message.error('设置失败，请重试');
      }
    } catch (error: any) {
      console.error('❌ QA提取开关操作失败:', error);
      console.error('❌ 错误详情:', error.response?.data || error.message);
      message.error(`设置失败: ${error.response?.data?.detail || error.message || '请重试'}`);
    } finally {
      setQaExtractionLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          <span>知识库设置</span>
          {collection && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              - {collection.name}
            </Text>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      className="collection-settings-modal"
    >
      {collection && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'index',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ThunderboltOutlined />
                  向量索引管理
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 当前索引状态 */}
                  <Alert
                    message="向量索引配置"
                    description={
                      <div>
                        <Text>pgvector 版本: 0.8.0 | 支持索引类型: IVF-Flat, HNSW</Text>
                        <br />
                        <Text type="secondary">向量索引可以大幅提升检索速度，选择合适的索引类型以平衡性能和资源消耗</Text>
                      </div>
                    }
                    type="info"
                    icon={<InfoCircleOutlined />}
                    showIcon
                  />

                  {/* 索引统计 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>{collection.document_count || 0}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>文档总数</Text>
                    </Card>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <BarChartOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>{collection.vectorized_count || 0}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>已向量化</Text>
                    </Card>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>
                        <Tag color={INDEX_TYPES.find(t => t.value === currentIndexType)?.color}>
                          {INDEX_TYPES.find(t => t.value === currentIndexType)?.label}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>当前索引</Text>
                    </Card>
                  </div>

                  {/* 索引类型选择 */}
                  <Card size="small" title="索引类型配置">
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>选择索引类型：</Text>
                      <Select
                        value={currentIndexType}
                        onChange={(value) => {
                          Modal.confirm({
                            title: '切换索引类型',
                            content: `确认要切换到 ${INDEX_TYPES.find(t => t.value === value)?.label} 索引吗？这将重建索引，可能需要一些时间。`,
                            onOk: async () => {
                              setIndexSwitching(true);
                              // TODO: 调用API切换索引
                              setTimeout(() => {
                                setCurrentIndexType(value);
                                setIndexSwitching(false);
                                message.success('索引切换成功');
                              }, 2000);
                            }
                          });
                        }}
                        style={{ width: '100%', marginTop: '8px' }}
                        loading={indexSwitching}
                      >
                        {INDEX_TYPES.map(type => (
                          <Select.Option key={type.value} value={type.value}>
                            <div>
                              <Tag color={type.color}>{type.label}</Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {type.description}
                              </Text>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    {/* 索引类型对比 */}
                    <Divider />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {INDEX_TYPES.map(type => (
                        <Card 
                          key={type.value} 
                          size="small" 
                          style={{ 
                            border: currentIndexType === type.value ? '1px solid #1890ff' : '1px solid #f0f0f0',
                            background: currentIndexType === type.value ? '#f6ffed' : '#fafafa'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ marginBottom: '8px' }}>
                                <Tag color={type.color}>{type.label}</Tag>
                                {currentIndexType === type.value && (
                                  <Tag color="green">当前使用</Tag>
                                )}
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {type.description}
                              </Text>
                              {type.params && (
                                <div style={{ marginTop: '8px' }}>
                                  <Text type="secondary" style={{ fontSize: '11px' }}>
                                    参数: {JSON.stringify(type.params)}
                                  </Text>
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px' }}>
                              <div><Text type="secondary">性能:</Text> <Tag color={type.performance === '高' ? 'green' : type.performance === '中' ? 'blue' : 'default'}>{type.performance}</Tag></div>
                              <div style={{ marginTop: '4px' }}><Text type="secondary">构建:</Text> <Text>{type.buildTime}</Text></div>
                              <div style={{ marginTop: '4px' }}><Text type="secondary">内存:</Text> <Text>{type.memoryUsage}</Text></div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* 建议提示 */}
                    <Alert
                      message="选择建议"
                      description={
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                          <li>小于 1,000 条向量：使用无索引（顺序扫描）</li>
                          <li>1,000 - 100,000 条向量：使用 IVF-Flat 索引</li>
                          <li>超过 100,000 条向量：使用 HNSW 索引获得最佳性能</li>
                        </ul>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  </Card>
                </div>
              )
            },
            {
              key: 'export',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExportOutlined />
                  导出数据
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title level={5} className="mb-1">数据导出</Title>
                        <Text type="secondary">
                          导出知识库中的文档和向量数据
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        icon={<ExportOutlined />}
                        onClick={handleExportData}
                      >
                        导出数据
                      </Button>
                    </div>
                  </Card>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Card size="small" hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>文档数据</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              导出原始文档内容和元数据
                            </Text>
                          </div>
                        </div>
                        <Button size="small" disabled>即将支持</Button>
                      </div>
                    </Card>
                    
                    <Card size="small" hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <DatabaseOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>向量数据</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              导出文档的向量嵌入数据
                            </Text>
                          </div>
                        </div>
                        <Button size="small" disabled>即将支持</Button>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            },
            {
              key: 'qa-extraction',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QuestionCircleOutlined />
                  QA对提取
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Title level={5} style={{ marginBottom: '4px' }}>自动QA对提取</Title>
                        <Text type="secondary">
                          开启后，文档上传时将自动执行QA对提取任务
                        </Text>
                      </div>
                      <Switch
                        checked={collection?.auto_qa_extraction_enabled || false}
                        onChange={handleQAToggle}
                        loading={qaExtractionLoading}
                        checkedChildren="开启"
                        unCheckedChildren="关闭"
                      />
                    </div>
                  </Card>
                  
                  <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <QuestionCircleOutlined style={{ fontSize: '16px', color: '#52c41a', marginTop: '2px' }} />
                      <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#52c41a' }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>功能说明：</div>
                        <div>• 开启后，所有新上传的文档将自动提取QA对</div>
                        <div>• 提取的QA对将自动同步到对应的QA数据集</div>
                        <div>• 可在文档列表的任务管理中查看提取进度</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: 'danger',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DeleteOutlined />
                  危险操作
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small" style={{ borderColor: '#ffccc7' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <DeleteOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '8px' }} />
                        <Title level={4} style={{ color: '#cf1322', marginBottom: '4px' }}>删除知识库</Title>
                        <Text type="secondary">
                          此操作将永久删除知识库及其所有数据，无法恢复
                        </Text>
                      </div>
                      
                      <Divider />
                      
                      <div style={{ 
                        backgroundColor: '#fff2f0', 
                        padding: '16px', 
                        borderRadius: '6px', 
                        border: '1px solid #ffccc7' 
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                          <Text strong style={{ color: '#a8071a' }}>删除前请确认：</Text>
                          <ul style={{ 
                            fontSize: '14px', 
                            color: '#cf1322', 
                            marginLeft: '16px',
                            lineHeight: 1.6
                          }}>
                            <li>• 所有文档和分块数据将被永久删除</li>
                            <li>• 所有向量索引将被清除</li>
                            <li>• 所有相关的QA数据集将被删除</li>
                            <li>• 此操作无法撤销</li>
                          </ul>
                        </div>
                      </div>
                      
                      <Button
                        danger
                        type="primary"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteCollection}
                        size="large"
                      >
                        确认删除知识库
                      </Button>
                    </div>
                  </Card>
                </div>
              )
            }
          ]}
        />
      )}
    </Modal>
  );
};

export default CollectionSettingsModal;