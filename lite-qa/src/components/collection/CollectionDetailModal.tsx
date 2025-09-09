/**
 * 知识库详情弹窗组件
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Card,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Button,
  Table,
  Input,
  Select,
  message,
  Spin,
  Empty,
  Tabs
} from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  SettingOutlined,
  EditOutlined,
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  TagOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCollectionStore } from '../../stores/collectionStore';
import { collectionService, type KnowledgeCollection } from '../../services/collectionService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CollectionDetailModalProps {
  visible: boolean;
  collection: KnowledgeCollection;
  onCancel: () => void;
  onUpdate: () => void;
}

interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  status: string;
  vectorized: boolean;
  collectionId?: string;
  metadataTemplateId?: string;
}

const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  visible,
  collection,
  onCancel,
  onUpdate
}) => {
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  
  // Document table state
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentStatus, setDocumentStatus] = useState('all');
  const [documentPagination, setDocumentPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const { templateTypes } = useCollectionStore();

  // 加载知识库文档
  const loadCollectionDocuments = async (params: any = {}) => {
    if (!collection?.id) return;
    
    setDocumentsLoading(true);
    try {
      const response = await collectionService.getCollectionDocuments(collection.id, {
        page: params.page || documentPagination.current,
        size: params.size || documentPagination.pageSize,
        search: params.search || documentSearch,
        status: params.status === 'all' ? undefined : params.status || documentStatus
      });
      
      setDocuments(response.documents || []);
      setDocumentPagination({
        current: response.page,
        pageSize: response.size,
        total: response.total
      });
    } catch (error) {
      console.error('加载知识库文档失败:', error);
      message.error('加载文档列表失败');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // 加载知识库统计信息
  const loadCollectionStatistics = async () => {
    if (!collection?.id) return;
    
    setStatisticsLoading(true);
    try {
      const stats = await collectionService.getCollectionStatistics(collection.id);
      setStatistics(stats);
    } catch (error) {
      console.error('加载知识库统计失败:', error);
      message.error('加载统计信息失败');
    } finally {
      setStatisticsLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (visible && collection?.id) {
      if (activeTab === 'overview') {
        loadCollectionStatistics();
      } else if (activeTab === 'documents') {
        loadCollectionDocuments();
      }
    }
  }, [visible, collection?.id, activeTab]);

  // 获取模版类型名称
  const getTemplateTypeName = (type: string) => {
    const template = templateTypes.find(t => t.id === type);
    return template?.name || type;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vectorized': return 'green';
      case 'processing': return 'blue';
      case 'pending': return 'orange';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'vectorized': return '已完成';
      case 'processing': return '处理中';
      case 'pending': return '等待中';
      case 'failed': return '失败';
      default: return status;
    }
  };

  // 文档表格列配置
  const documentColumns: ColumnsType<DocumentItem> = [
    {
      title: '文档名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DocumentItem) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-gray-500 text-xs">{record.filename}</div>
        </div>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
    },
    {
      title: '向量化',
      dataIndex: 'vectorized',
      key: 'vectorized',
      render: (vectorized: boolean) => (
        <Tag color={vectorized ? 'green' : 'default'}>
          {vectorized ? '已完成' : '未完成'}
        </Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (date: string) => (
        <div className="text-gray-500 text-sm">
          {new Date(date).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    },
  ];

  // 渲染概览tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 基础信息 */}
      <Card title="基础信息" size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="知识库名称">
            {collection.name}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={collection.status === 'active' ? 'green' : 'orange'}>
              {collection.status === 'active' ? '活跃' : '非活跃'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="元数据模版">
            <Tag color="blue">{getTemplateTypeName(collection.metadata_template)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(collection.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {collection.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 统计信息 */}
      <Card title="统计信息" size="small" loading={statisticsLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="文档总数"
              value={collection.document_count}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="已向量化"
              value={collection.vectorized_count}
              prefix={<CloudServerOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="向量化率"
              value={collection.document_count > 0 ? 
                (collection.vectorized_count / collection.document_count * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="存储大小"
              value={statistics?.total_size ? 
                `${(statistics.total_size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
              prefix={<DatabaseOutlined />}
            />
          </Col>
        </Row>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Text>向量化进度</Text>
            <Text className="text-gray-500">
              {collection.vectorized_count} / {collection.document_count}
            </Text>
          </div>
          <Progress
            percent={collection.document_count > 0 ? 
              (collection.vectorized_count / collection.document_count * 100) : 0}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

      {/* 元数据分布 */}
      {statistics?.metadata_distribution && (
        <Card title="元数据分布" size="small">
          <Row gutter={[8, 8]}>
            {Object.entries(statistics.metadata_distribution).map(([key, count]) => (
              <Col key={key}>
                <Tag>{key}: {count as number}</Tag>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );

  // 渲染文档tab
  const renderDocumentsTab = () => (
    <div className="space-y-4">
      {/* 文档操作工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input.Search
            placeholder="搜索文档..."
            style={{ width: 200 }}
            value={documentSearch}
            onChange={(e) => setDocumentSearch(e.target.value)}
            onSearch={(value) => loadCollectionDocuments({ search: value })}
          />
          <Select
            value={documentStatus}
            style={{ width: 120 }}
            onChange={(value) => {
              setDocumentStatus(value);
              loadCollectionDocuments({ status: value });
            }}
          >
            <Select.Option value="all">所有状态</Select.Option>
            <Select.Option value="vectorized">已完成</Select.Option>
            <Select.Option value="processing">处理中</Select.Option>
            <Select.Option value="pending">等待中</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadCollectionDocuments()}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              // TODO: 打开上传弹窗，指定Collection
              message.info('上传功能开发中...');
            }}
          >
            上传文档
          </Button>
        </div>
      </div>

      {/* 文档列表 */}
      <Table
        columns={documentColumns}
        dataSource={documents}
        rowKey="id"
        loading={documentsLoading}
        pagination={{
          current: documentPagination.current,
          pageSize: documentPagination.pageSize,
          total: documentPagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 个文档`,
          onChange: (page, pageSize) => {
            setDocumentPagination({ ...documentPagination, current: page, pageSize });
            loadCollectionDocuments({ page, size: pageSize });
          }
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="该知识库暂无文档"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => message.info('上传功能开发中...')}
              >
                上传第一个文档
              </Button>
            </Empty>
          )
        }}
      />
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <FolderOutlined />
          <span>{collection.name}</span>
          <Tag color="blue" size="small">
            {getTemplateTypeName(collection.metadata_template)}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={
        <div className="flex justify-between">
          <Button onClick={onCancel}>关闭</Button>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                // TODO: 打开编辑弹窗
                message.info('编辑功能开发中...');
              }}
            >
              编辑设置
            </Button>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => {
                // TODO: 打开管理页面
                message.info('管理功能开发中...');
              }}
            >
              进入管理
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <BarChartOutlined />
                概览
              </span>
            ),
            children: renderOverviewTab()
          },
          {
            key: 'documents',
            label: (
              <span>
                <FileTextOutlined />
                文档 ({collection.document_count})
              </span>
            ),
            children: renderDocumentsTab()
          }
        ]}
      />
    </Modal>
  );
};

export default CollectionDetailModal;