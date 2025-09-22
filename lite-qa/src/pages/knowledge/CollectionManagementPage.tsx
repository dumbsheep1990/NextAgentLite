/**
 * 知识库管理页面 - 替代原文档管理，支持Collection概念
 */
import React, { useEffect, useState, useContext } from 'react';
import {
  Button,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Input,
  Select,
  Table,
  Tag,
  Dropdown,
  Modal,
  Tooltip,
  Badge,
  Empty,
  Spin,
  Typography,
  Descriptions,
  Divider,
  Alert
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  BookOutlined,
  FileTextOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  ExportOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useCollectionStore } from '../../stores/collectionStore';
import { useAppStore } from '../../stores/appStore';
import type { KnowledgeCollection } from '../../services/collectionService';
import CollectionCreateModal from '../../components/collection/CollectionCreateModal';
import CollectionStatisticsCard from '../../components/collection/CollectionStatisticsCard';
import { VectorIndexManager } from '../../components/knowledge/VectorIndexManager';
import CollectionSettingsModal from '../../components/knowledge/CollectionSettingsModal';
import { useCollectionContext } from './KnowledgePageClean';

// 注意：Collection上下文定义已移至 KnowledgePage.tsx

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

// 自定义样式
const pageStyles = `
  .search-input-compact .ant-input-search .ant-input {
    border-radius: 6px 0 0 6px !important;
    border-right: none !important;
    height: 32px !important;
    font-size: 13px !important;
    line-height: 32px !important;
    padding: 0 11px !important;
    box-sizing: border-box !important;
  }
  .search-input-compact .ant-input-search .ant-input::placeholder {
    line-height: 32px !important;
    font-size: 13px !important;
  }
  .search-input-compact .ant-input:focus {
    box-shadow: none;
  }
  .search-input-compact .ant-input-search-button {
    height: 32px;
  }
  
  /* Modern Collection Table Styles */
  .modern-collection-table .ant-table-thead > tr > th {
    background: #f8f9fa;
    color: #495057 !important;
    font-weight: 500;
    border-bottom: 2px solid #dee2e6;
    padding: 12px;
    font-size: 13px;
    letter-spacing: 0.3px;
  }
  .modern-collection-table .ant-table-tbody > tr > td {
    padding: 14px 12px;
    border-bottom: 1px solid #f1f3f5;
    vertical-align: middle;
  }
  .modern-collection-table .ant-table-tbody > tr {
    transition: all 0.2s ease;
    background: white;
  }
  .modern-collection-table .ant-table-tbody > tr:hover > td {
    background: #f8f9fa;
  }
  .modern-collection-table .ant-table-tbody > tr:hover {
    transform: translateX(4px);
    box-shadow: -4px 0 0 0 #1890ff;
  }
  .modern-collection-table .ant-spin-nested-loading {
    border-radius: 12px;
    overflow: hidden;
  }
  .modern-collection-table {
    background: white;
    border-radius: 12px;
    overflow: hidden;
  }
  .modern-collection-table .ant-table-pagination {
    padding: 12px 16px;
    background: #fafafa;
    border-top: 1px solid #f0f0f0;
  }
  
  .select-compact .ant-select-selector {
    border-radius: 6px;
    height: 32px;
    border: 1px solid #d9d9d9;
    background: #ffffff;
    font-size: 13px;
  }
  .select-compact .ant-select-selector:hover {
    border-color: #1890ff;
  }
  .select-compact.ant-select-focused .ant-select-selector {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
  .select-compact .ant-select-selection-item {
    line-height: 30px;
  }
  .ant-table-thead > tr > th {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    color: #374151;
    padding: 12px 16px;
    font-size: 13px;
  }
  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    border-bottom: 1px solid #f8f9fa;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafbff;
    transition: background-color 0.2s ease;
  }
  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
  .ant-table-tbody > tr {
    transition: all 0.2s ease;
  }
  .ant-table-tbody > tr:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  }
`;

interface CollectionManagementPageProps {
  onCollectionSelect?: (collectionId: string, collectionInfo: KnowledgeCollection) => void;
  onNavigateToGlobalChunking?: () => void;
}

const CollectionManagementPage: React.FC<CollectionManagementPageProps> = ({ onCollectionSelect, onNavigateToGlobalChunking }) => {
  // State管理
  const {
    collections,
    globalStatistics,
    loading,
    error,
    searchQuery,
    filterStatus,
    filterTemplate,
    pagination,
    templateTypes,
    loadCollections,
    loadGlobalStatistics,
    loadTemplateTypes,
    deleteCollection,
    setSearchQuery,
    setFilterStatus,
    setFilterTemplate,
    setPagination,
    clearError
  } = useCollectionStore();

  const { darkMode } = useAppStore();

  // Collection上下文
  const collectionContext = useCollectionContext();

  // Local state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [vectorIndexModalVisible, setVectorIndexModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollection | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Collection选择处理
  const handleSelectCollection = (collection: KnowledgeCollection) => {
    console.log('🎯 选择知识库:', collection.name, collection.id);
    console.log('📦 上下文状态:', collectionContext);
    
    if (onCollectionSelect) {
      console.log('📡 通过 onCollectionSelect 回调处理');
      onCollectionSelect(collection.id, collection);
    } else if (collectionContext) {
      console.log('📡 通过上下文处理');
      collectionContext.setSelectedCollection(collection.id, collection);
    } else {
      console.warn('⚠️ 没有找到处理方式');
    }
  };

  // 初始化加载
  useEffect(() => {
    console.log('🔄 初始化加载知识库数据...');
    loadCollections();
    loadGlobalStatistics();
    loadTemplateTypes();
  }, [loadCollections, loadGlobalStatistics, loadTemplateTypes]);

  // 监听数据变化
  useEffect(() => {
    console.log('📊 知识库数据变化:', {
      collections: collections?.length || 0,
      loading: loading.collections,
      error: error
    });
  }, [collections, loading.collections, error]);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCollections(),
        loadGlobalStatistics()
      ]);
      message.success('数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    loadCollections({ search: value });
  };

  // 过滤处理
  const handleFilterChange = (type: 'status' | 'template', value: string) => {
    if (type === 'status') {
      setFilterStatus(value);
      loadCollections({ status: value });
    } else {
      setFilterTemplate(value);
      loadCollections({ metadata_template: value });
    }
  };

  // 分页处理
  const handleTableChange: TableProps<KnowledgeCollection>['onChange'] = (paginationInfo) => {
    if (paginationInfo) {
      setPagination({
        current: paginationInfo.current || 1,
        pageSize: paginationInfo.pageSize || 10
      });
      loadCollections({
        page: paginationInfo.current,
        size: paginationInfo.pageSize
      });
    }
  };

  // 管理向量索引
  const handleManageVectorIndex = (collection: KnowledgeCollection) => {
    setSelectedCollection(collection);
    setVectorIndexModalVisible(true);
  };

  // 打开设置Modal
  const handleOpenSettings = (collection: KnowledgeCollection) => {
    setSelectedCollection(collection);
    setSettingsModalVisible(true);
  };

  // 删除知识库
  const handleDeleteCollection = (collection: KnowledgeCollection) => {
    confirm({
      title: '删除知识库',
      content: (
        <div>
          <p>确定要删除知识库 <strong>{collection.name}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            ⚠️ 此操作会删除该知识库中的所有文档和相关数据，且不可恢复
          </p>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCollection(collection.id);
          message.success('知识库删除成功');
          loadGlobalStatistics(); // 刷新全局统计
        } catch (error) {
          message.error('知识库删除失败');
        }
      }
    });
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'orange';
      case 'archived': return 'red';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'inactive': return '非活跃';
      case 'archived': return '已归档';
      default: return '未知';
    }
  };

  // 获取模版类型名称
  const getTemplateTypeName = (type: string) => {
    const template = templateTypes.find(t => t.id === type);
    return template?.name || type;
  };

  // 表格列配置
  const columns: ColumnsType<KnowledgeCollection> = [
    {
      title: '知识库名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: KnowledgeCollection) => {
        if (!record) return null;
        
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              <DatabaseOutlined className="text-lg text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 text-sm">{name || record.name || '未命名'}</div>
              {record.description && (
                <div className="text-gray-500 text-xs mt-0.5">{record.description}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '模版类型',
      dataIndex: 'metadata_template',
      key: 'metadata_template',
      render: (template: string) => {
        const templateColors: Record<string, string> = {
          'general': 'blue',
          'policy': 'purple',
          'academic': 'cyan',
          'enterprise': 'gold'
        };
        return (
          <Tag 
            color={templateColors[template] || 'default'}
            className="px-3 py-1"
          >
            {getTemplateTypeName(template)}
          </Tag>
        );
      },
      filters: templateTypes.map(type => ({
        text: type.name,
        value: type.id
      })),
      onFilter: (value, record) => record.metadata_template === value,
    },
    {
      title: '文档统计',
      key: 'documents',
      render: (_: any, record: KnowledgeCollection) => {
        if (!record) return null;
        
        const documentCount = record.document_count || 0;
        const vectorizedCount = record.vectorized_count || 0;
        const percentage = documentCount > 0 ? (vectorizedCount / documentCount * 100) : 0;
        
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <FileTextOutlined className="text-gray-400 mr-1.5" />
                <span className="text-sm text-gray-700 font-medium">{documentCount}</span>
                <span className="text-xs text-gray-500 ml-1">文档</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <CheckCircleOutlined className="text-green-500 mr-1.5" />
                <span className="text-sm text-gray-700 font-medium">{vectorizedCount}</span>
                <span className="text-xs text-gray-500 ml-1">向量化</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '活跃', value: 'active' },
        { text: '非活跃', value: 'inactive' },
        { text: '已归档', value: 'archived' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <div className="text-gray-500">
          {new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: KnowledgeCollection) => {
        if (!record) return null;
        
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  // TODO: 实现编辑功能
                  message.info('编辑功能开发中...');
                }}
              />
            </Tooltip>
            <Tooltip title="设置">
              <Button 
                type="text" 
                icon={<SettingOutlined />}
                onClick={() => handleOpenSettings(record)}
              />
            </Tooltip>
        </Space>
        );
      },
    },
  ];

  return (
    <>
      <style>{pageStyles}</style>
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        maxHeight: '100%'
      }}>
      {/* CollectionManagementPage 作为内容组件，固定高度容器，overflow hidden */}
      {/* 错误提示 */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mx-2 shadow-sm border-0"
          style={{
            background: 'linear-gradient(135deg, #fef2f2, #fef7f7)',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}
        />
      )}

      {/* 全局统计卡片 */}
      <div className="px-2 pb-4" style={{ flexShrink: 0 }}>
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={12} md={6}>
            <Card 
              className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
                borderRadius: '14px',
                border: '1px solid #bfdbfe'
              }}
              bodyStyle={{ padding: '14px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm font-medium mb-1">知识库总数</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loading.statistics ? <Spin size="small" /> : (globalStatistics?.total_collections || 0)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DatabaseOutlined className="text-blue-600 text-xl" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4, #f7fef7)',
                borderRadius: '14px',
                border: '1px solid #bbf7d0'
              }}
              bodyStyle={{ padding: '14px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm font-medium mb-1">文档总数</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loading.statistics ? <Spin size="small" /> : (globalStatistics?.total_documents || 0)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileTextOutlined className="text-green-600 text-xl" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #faf5ff, #fdf7ff)',
                borderRadius: '14px',
                border: '1px solid #e9d5ff'
              }}
              bodyStyle={{ padding: '14px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm font-medium mb-1">已向量化</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loading.statistics ? <Spin size="small" /> : (globalStatistics?.total_vectorized || 0)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CloudServerOutlined className="text-purple-600 text-xl" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card 
              className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #fffbeb, #fefce8)',
                borderRadius: '14px',
                border: '1px solid #fed7aa'
              }}
              bodyStyle={{ padding: '14px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm font-medium mb-1">活跃知识库</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loading.statistics ? <Spin size="small" /> : (globalStatistics?.active_collections || 0)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CheckCircleOutlined className="text-orange-600 text-xl" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 操作工具栏 */}
      <div className="px-2 pb-4" style={{ flexShrink: 0 }}>
        <Card 
          className="border-0 shadow-sm"
          style={{
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
          bodyStyle={{ padding: '8px 12px' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search
                  placeholder="搜索知识库..."
                  allowClear
                  enterButton={
                    <Button 
                      type="primary" 
                      icon={<SearchOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                        border: 'none',
                        borderRadius: '0 6px 6px 0',
                        height: '32px'
                      }}
                    />
                  }
                  size="middle"
                  style={{ 
                    width: 260,
                  }}
                  value={searchQuery}
                  onSearch={handleSearch}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-compact"
                />
              </div>

              {/* 状态过滤 */}
              <Select
                placeholder="状态"
                style={{ 
                  width: 100,
                }}
                size="middle"
                value={filterStatus}
                onChange={(value) => handleFilterChange('status', value)}
                className="select-compact"
              >
                <Option value="all">全部</Option>
                <Option value="active">活跃</Option>
                <Option value="inactive">非活跃</Option>
                <Option value="archived">已归档</Option>
              </Select>

              {/* 模版过滤 */}
              <Select
                placeholder="模版"
                style={{ 
                  width: 120,
                }}
                size="middle"
                value={filterTemplate}
                onChange={(value) => handleFilterChange('template', value)}
                className="select-compact"
              >
                <Option value="all">全部模版</Option>
                {templateTypes.map(type => (
                  <Option key={type.id} value={type.id}>{type.name}</Option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* 刷新按钮 */}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                size="middle"
                style={{
                  borderRadius: '8px',
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid #d9d9d9',
                  background: '#ffffff',
                  fontSize: '13px'
                }}
                className="hover:border-blue-400 hover:text-blue-500 transition-all duration-200"
              >
                刷新
              </Button>

              {/* 全局切分规则管理按钮 */}
              <Button
                icon={<SettingOutlined />}
                onClick={onNavigateToGlobalChunking}
                size="middle"
                style={{
                  borderRadius: '8px',
                  height: '32px',
                  padding: '0 16px',
                  border: '1px solid #d9d9d9',
                  background: '#ffffff',
                  fontSize: '13px'
                }}
                className="hover:border-blue-400 hover:text-blue-500 transition-all duration-200"
              >
                切分规则库
              </Button>

              {/* 创建知识库按钮 */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                loading={loading.creating}
                size="middle"
                style={{
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '32px',
                  padding: '0 16px',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                  fontWeight: 500,
                  fontSize: '13px'
                }}
                className="hover:shadow-md transition-all duration-200"
              >
                创建知识库
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 知识库列表 - 固定高度容器，仅表格内容可滚动 */}
      <div className="px-2" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Card 
          className="border-0 shadow-sm h-full"
          style={{
            borderRadius: '10px',
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            height: '100%',
            overflow: 'hidden'
          }}
          bodyStyle={{ 
            padding: '12px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ 
            height: '100%', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Table<KnowledgeCollection>
              columns={columns}
              dataSource={collections}
              rowKey="id"
              loading={loading.collections}
              size="middle"
              scroll={{ y: 'calc(100vh - 424px)' }}
              className="modern-collection-table"
              style={{
                backgroundColor: 'transparent',
                flex: 1
              }}
              onRow={(record) => ({
                onClick: (event) => {
                  // 检查点击的是否是操作按钮区域
                  const target = event.target as HTMLElement;
                  const isActionButton = target.closest('button') || target.closest('.ant-dropdown');
                  
                  // 如果点击的不是操作按钮，则触发管理文档功能
                  if (!isActionButton) {
                    handleSelectCollection(record);
                  }
                },
                style: {
                  cursor: 'pointer'
                }
              })}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条知识库`,
                pageSizeOptions: ['10', '20', '50', '100'],
                style: {
                  margin: '16px 0 0 0',
                  padding: '16px 0 0 0',
                  borderTop: '1px solid #f0f0f0',
                  flexShrink: 0
                }
              }}
              onChange={handleTableChange}
              locale={{
                emptyText: (
                  <div className="py-16">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className="text-gray-500">
                          <div className="text-lg font-medium mb-2">暂无知识库</div>
                          <div className="text-sm">创建您的第一个知识库开始管理文档</div>
                        </div>
                      }
                    >
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                        style={{
                          background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                          border: 'none',
                          borderRadius: '8px',
                          height: '40px',
                          padding: '0 24px',
                          marginTop: '8px'
                        }}
                      >
                        创建第一个知识库
                      </Button>
                    </Empty>
                  </div>
                )
              }}
            />
          </div>
        </Card>
      </div>

      {/* 创建知识库弹窗 */}
      <CollectionCreateModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          console.log('🎉 创建知识库成功，刷新数据...');
          setCreateModalVisible(false);
          loadCollections();
          loadGlobalStatistics();
        }}
      />

      {/* 向量索引管理弹窗 */}
      <Modal
        title={`向量索引管理 - ${selectedCollection?.name}`}
        open={vectorIndexModalVisible}
        onCancel={() => {
          setVectorIndexModalVisible(false);
          setSelectedCollection(null);
        }}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {selectedCollection && (
          <VectorIndexManager
            collectionId={selectedCollection.id}
            collectionName={selectedCollection.name}
          />
        )}
      </Modal>

      {/* 设置Modal */}
      <CollectionSettingsModal
        visible={settingsModalVisible}
        onCancel={() => {
          setSettingsModalVisible(false);
          setSelectedCollection(null);
        }}
        collection={selectedCollection}
        onDeleteCollection={handleDeleteCollection}
        onManageVectorIndex={handleManageVectorIndex}
        onRefresh={() => {
          loadCollections({
            page: pagination.current,
            size: pagination.pageSize
          });
        }}
      />
      </div>
    </>
  );
};

export default CollectionManagementPage;