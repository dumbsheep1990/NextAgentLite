/**
 * 知识图谱文档管理组件
 */
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  message,
  Tag,
  Tooltip,
  Typography,
  Popconfirm,
  Space
} from 'antd';
import {
  FileTextOutlined,
  DeleteOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { GraphService } from '../../services/graphService';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface GraphDocument {
  id: string;
  filename: string;
  title: string;
  status: string;
  uploadedAt: string;
  fileSize: number;
  tripleCount: number;
  entityCount: number;
  error?: string;
}

interface GraphDocumentManagerProps {
  onRefresh?: () => void;
  compact?: boolean;
  drawerMode?: boolean;
  refreshKey?: number; // 用于触发刷新
}

export const GraphDocumentManager: React.FC<GraphDocumentManagerProps> = ({
  onRefresh,
  compact = false,
  drawerMode = false,
  refreshKey
}) => {
  const [documents, setDocuments] = useState<GraphDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteLoading, setDeleteLoading] = useState<string>('');
  // 多选相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const graphService = new GraphService();

  // 获取文档列表
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize
      };

      const result = await graphService.getKnowledgeGraphDocuments(params);
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文档
  const handleDelete = async (documentId: string, filename: string) => {
    if (!documentId) {
      message.error('文档ID不能为空');
      return;
    }

    setDeleteLoading(documentId);
    try {
      console.log(`正在删除文档: ${filename} (ID: ${documentId})`);
      const result = await graphService.deleteKnowledgeGraphDocument(documentId);
      
      // 显示删除成功信息
      message.success(`文件 "${filename}" 删除成功`);
      console.log('删除结果:', result);
      
      // 刷新列表
      await fetchDocuments();
      
      // 通知父组件刷新图谱
      onRefresh?.();
      
    } catch (error: any) {
      console.error('删除文档失败:', error);
      
      // 详细的错误处理
      let errorMessage = '删除失败';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(`删除文件 "${filename}" 失败: ${errorMessage}`);
    } finally {
      setDeleteLoading('');
    }
  };

  // 批量删除文档
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的文档');
      return;
    }

    setBulkDeleteLoading(true);
    let successCount = 0;
    let failedCount = 0;
    const selectedFiles = documents.filter(doc => selectedRowKeys.includes(doc.id));
    
    try {
      // 并发删除选中的文档
      const deletePromises = selectedFiles.map(async (doc) => {
        try {
          await graphService.deleteKnowledgeGraphDocument(doc.id);
          successCount++;
          return { success: true, filename: doc.filename };
        } catch (error) {
          failedCount++;
          console.error(`删除文档 ${doc.filename} 失败:`, error);
          return { success: false, filename: doc.filename, error };
        }
      });

      await Promise.all(deletePromises);

      // 显示结果
      if (successCount > 0 && failedCount === 0) {
        message.success(`成功删除 ${successCount} 个文档`);
      } else if (successCount > 0 && failedCount > 0) {
        message.warning(`成功删除 ${successCount} 个文档，${failedCount} 个失败`);
      } else {
        message.error(`删除失败，共 ${failedCount} 个文档删除失败`);
      }

      // 清空选中状态
      setSelectedRowKeys([]);
      
      // 刷新列表
      await fetchDocuments();
      
      // 通知父组件刷新图谱
      onRefresh?.();
      
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除操作失败');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = documents.map(doc => doc.id);
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as string[]);
    },
    onSelectAll: handleSelectAll,
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': 'success',
      'processing': 'blue',
      'failed': 'error',
      'pending': 'orange',
      'done': 'success',
      'error': 'error',
      'uploading': 'blue',
      'uploaded': 'success',
      'analyzing': 'cyan',
      'ready': 'green'
    };
    return colorMap[status] || 'default';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 表格列定义
  const columns: ColumnsType<GraphDocument> = [
    {
      title: '文档名称',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: drawerMode ? false : true,
      width: drawerMode ? undefined : 200,
      render: (filename: string, record: GraphDocument) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <FileTextOutlined style={{ marginRight: '8px', color: '#666' }} />
            <Text strong style={{ fontSize: '13px', wordBreak: 'break-all' }}>
              {filename}
            </Text>
          </div>
          {record.title && record.title !== filename && (
            <Text style={{ fontSize: '12px', color: '#999', display: 'block' }}>
              {record.title}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: GraphDocument) => (
        <div>
          <Tag color={getStatusColor(status)} className="text-xs">
            {status === 'completed' || status === 'done' ? '完成' :
             status === 'uploaded' ? '已上传' :
             status === 'processing' || status === 'uploading' ? '处理中' :
             status === 'analyzing' ? '分析中' :
             status === 'ready' ? '就绪' :
             status === 'failed' || status === 'error' ? '失败' : 
             status === 'pending' ? '待处理' : status}
          </Tag>
          {record.error && (
            <Tooltip title={record.error}>
              <ExclamationCircleOutlined className="text-red-500 ml-1" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 60,
      render: (size: number) => (
        <Text className="text-xs">{formatFileSize(size)}</Text>
      ),
    },
    {
      title: '实体',
      dataIndex: 'entityCount',
      key: 'entityCount',
      width: 50,
      render: (count: number) => (
        <Text className="text-xs">{count || 0}</Text>
      ),
    },
    {
      title: '关系',
      dataIndex: 'tripleCount',
      key: 'tripleCount',
      width: 50,
      render: (count: number) => (
        <Text className="text-xs">{count || 0}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 50,
      render: (_, record: GraphDocument) => (
        <Popconfirm
          title="删除文档"
          description={`确定删除"${record.filename}"？将同时删除相关图谱数据。`}
          onConfirm={() => handleDelete(record.id, record.filename)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true, size: 'small' }}
          cancelButtonProps={{ size: 'small' }}
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            loading={deleteLoading === record.id}
            title="删除文档"
          />
        </Popconfirm>
      ),
    },
  ];

  useEffect(() => {
    fetchDocuments();
  }, [page, pageSize]);

  // 监听refreshKey变化，触发刷新
  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchDocuments();
    }
  }, [refreshKey]);

  // 页面切换时清空选中状态
  useEffect(() => {
    setSelectedRowKeys([]);
  }, [page]);

  const containerStyle = drawerMode 
    ? { 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' as const,
        overflow: 'hidden'
      }
    : {};

  // 根据是否有选中项动态调整表格高度
  const getTableScrollY = () => {
    if (!drawerMode) return 400;
    const baseHeight = selectedRowKeys.length > 0 ? 270 : 200; // 有工具栏时增加70px高度
    return `calc(100vh - ${baseHeight}px)`;
  };

  return (
    <div style={containerStyle}>
      {/* 批量操作工具栏 */}
      {selectedRowKeys.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px 16px', 
          background: '#f0f2ff', 
          borderRadius: '6px',
          border: '1px solid #d6e4ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ color: '#1890ff', fontWeight: 500 }}>
              已选择 {selectedRowKeys.length} 个文档
            </Text>
            <Button 
              type="link" 
              size="small"
              onClick={() => setSelectedRowKeys([])}
              style={{ padding: '0 8px' }}
            >
              取消选择
            </Button>
          </div>
          <Space>
            <Popconfirm
              title="批量删除确认"
              description={`确定删除选择的 ${selectedRowKeys.length} 个文档？将同时删除相关图谱数据。`}
              onConfirm={handleBulkDelete}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger
                icon={<DeleteOutlined />}
                loading={bulkDeleteLoading}
                size="small"
              >
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        </div>
      )}
      
      {/* 文档列表表格 */}
      <Table
        columns={columns}
        dataSource={documents}
        rowSelection={rowSelection}
        rowKey="id"
        loading={loading}
        size={compact ? 'small' : 'middle'}
        pagination={drawerMode ? {
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: false,
          showQuickJumper: false,
          simple: true,
          showTotal: (total) => `共 ${total} 个文件`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize || 20);
          },
          style: { 
            padding: '16px 0', 
            borderTop: '1px solid #f0f0f0',
            marginTop: 'auto',
            background: '#fff'
          }
        } : {
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: false,
          showQuickJumper: false,
          simple: true,
          showTotal: (total) => `共 ${total} 个文件`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize || 20);
          },
        }}
        scroll={drawerMode ? { y: getTableScrollY() } : { y: getTableScrollY() }}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#999' }}>
              <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div>暂无文档</div>
            </div>
          )
        }}
      />
    </div>
  );
}; 