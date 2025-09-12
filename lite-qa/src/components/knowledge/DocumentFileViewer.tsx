/**
 * 文档文件查看器 - 代码编辑器风格
 * 左侧文档树，右侧文档分段信息和切分结果
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Space,
  Button,
  Badge,
  Tag,
  Typography,
  message,
  Spin,
  Empty,
  Tooltip,
  Dropdown,
  Modal,
  Input,
  Upload,
  Form
} from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  SettingOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  FolderAddOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  FileCode2,
  Copy,
  Check,
  Database
} from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable';
import { Badge as UIBadge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';
import { knowledgeService } from '../../services/knowledgeService';
import type { KnowledgeDocument } from '../../types';

const { Text, Title } = Typography;

export interface DocumentFileViewerProps {
  collectionId: string;
  height?: number;
  refreshTrigger?: number;
  onDocumentSelect?: (document: KnowledgeDocument) => void;
  onDocumentAction?: (action: string, documentId: string) => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  data: FolderInfo | KnowledgeDocument;
  children?: TreeNode[];
  isSelectable?: boolean;
}

interface DocumentChunk {
  id: string;
  content: string;
  chunk_size: number;
  vector_status: 'completed' | 'pending';
  vector_dimension?: number;
  metadata: any;
  created_at: string;
}

// 文件类型图标映射
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  const iconStyle = { fontSize: '16px' };
  
  if (type.includes('pdf')) {
    return <FilePdfOutlined style={{ ...iconStyle, color: '#d32f2f' }} />;
  }
  if (type.includes('word') || type.includes('doc') || type.includes('docx')) {
    return <FileWordOutlined style={{ ...iconStyle, color: '#2563eb' }} />;
  }
  if (type.includes('excel') || type.includes('sheet') || type.includes('xlsx') || type.includes('xls')) {
    return <FileExcelOutlined style={{ ...iconStyle, color: '#16a085' }} />;
  }
  if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) {
    return <FileImageOutlined style={{ ...iconStyle, color: '#e67e22' }} />;
  }
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif') || type.includes('bmp')) {
    return <FileImageOutlined style={{ ...iconStyle, color: '#9c27b0' }} />;
  }
  if (type.includes('text') || type.includes('txt')) {
    return <FileTextOutlined style={{ ...iconStyle, color: '#607d8b' }} />;
  }
  if (type.includes('markdown') || type.includes('md')) {
    return <FileTextOutlined style={{ ...iconStyle, color: '#f57c00' }} />;
  }
  if (type.includes('json') || type.includes('xml') || type.includes('csv')) {
    return <FileTextOutlined style={{ ...iconStyle, color: '#795548' }} />;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {
    return <FileUnknownOutlined style={{ ...iconStyle, color: '#455a64' }} />;
  }
  return <FileTextOutlined style={{ ...iconStyle, color: '#9e9e9e' }} />;
};

// 文档状态标签
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'vectorized':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-700 font-medium">已完成</span>
        </div>
      );
    case 'processing':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs text-blue-700 font-medium">处理中</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-yellow-700 font-medium">待处理</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-xs text-red-700 font-medium">失败</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-xs text-gray-600 font-medium">{status}</span>
        </div>
      );
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 文档树组件
const DocumentTree: React.FC<{
  treeData: TreeNode[];
  selectedDocument: KnowledgeDocument | null;
  onDocumentSelect: (document: KnowledgeDocument) => void;
  onRefresh: () => void;
  loading: boolean;
  collectionId: string;
}> = ({ treeData, selectedDocument, onDocumentSelect, onRefresh, loading, collectionId }) => {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<{id: string, name: string} | null>(null);
  const [uploading, setUploading] = useState(false);

  // 处理文件夹操作
  const handleFolderAction = async (action: string, folderId: string, folderName: string) => {
    try {
      switch (action) {
        case 'upload':
          setSelectedFolderId(folderId);
          setShowUploadModal(true);
          break;
        case 'rename':
          setRenamingFolder({ id: folderId, name: folderName });
          setNewFolderName(folderName);
          setShowRenameModal(true);
          break;
        case 'delete':
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除文件夹 "${folderName}" 吗？此操作不可恢复。`,
            onOk: async () => {
              await folderService.deleteFolder(folderId, collectionId);
              message.success('文件夹删除成功');
              onRefresh();
            }
          });
          break;
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 处理文档操作
  const handleDocumentAction = async (action: string, document: KnowledgeDocument) => {
    try {
      switch (action) {
        case 'view':
          onDocumentSelect(document);
          message.success(`查看文档: ${document.title}`);
          break;
        case 'vectorize':
          message.info(`重新向量化: ${document.title}`);
          // TODO: 实现向量化逻辑
          break;
        case 'delete':
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除文档 "${document.title}" 吗？此操作不可恢复。`,
            onOk: async () => {
              await knowledgeService.deleteDocument(document.id);
              message.success('文档删除成功');
              onRefresh();
            }
          });
          break;
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('请输入文件夹名称');
      return;
    }

    try {
      await folderService.createFolder({
        name: newFolderName.trim(),
        collection_id: collectionId,
        description: '用户创建的文件夹'
      });
      
      message.success('文件夹创建成功');
      setNewFolderName('');
      setShowCreateFolder(false);
      onRefresh();
    } catch (error: any) {
      console.error('创建文件夹失败:', error);
      message.error(error.message || '创建文件夹失败');
    }
  };

  // 重命名文件夹
  const handleRenameFolder = async () => {
    if (!renamingFolder || !newFolderName.trim()) {
      message.error('请输入文件夹名称');
      return;
    }

    try {
      await folderService.updateFolder(renamingFolder.id, collectionId, {
        name: newFolderName.trim()
      });
      
      message.success('文件夹重命名成功');
      setNewFolderName('');
      setShowRenameModal(false);
      setRenamingFolder(null);
      onRefresh();
    } catch (error: any) {
      console.error('重命名文件夹失败:', error);
      message.error(error.message || '重命名文件夹失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!selectedFolderId) {
      message.error('请选择文件夹');
      return;
    }

    try {
      setUploading(true);
      
      // 使用knowledgeService上传文件到指定文件夹
      await knowledgeService.uploadFiles([file], {
        collectionId,
        folderId: selectedFolderId,
        tags: [],
        category: 'document'
      });

      message.success('文件上传成功');
      setShowUploadModal(false);
      setSelectedFolderId('');
      onRefresh();
    } catch (error: any) {
      console.error('文件上传失败:', error);
      message.error(error.message || '文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 默认展开所有文件夹
  useEffect(() => {
    const collectAllFolderIds = (nodes: TreeNode[]): string[] => {
      const folderIds: string[] = [];
      nodes.forEach(node => {
        if (node.type === 'folder') {
          folderIds.push(node.id);
          if (node.children) {
            folderIds.push(...collectAllFolderIds(node.children));
          }
        }
      });
      return folderIds;
    };
    
    const allFolderIds = collectAllFolderIds(treeData);
    setExpandedKeys(allFolderIds);
  }, [treeData]);

  // 同步选中状态
  useEffect(() => {
    if (selectedDocument) {
      const docKey = `doc-${selectedDocument.id}`;
      if (!selectedKeys.includes(docKey)) {
        setSelectedKeys([docKey]);
      }
    } else {
      setSelectedKeys([]);
    }
  }, [selectedDocument, selectedKeys]);

  // 自定义渲染树节点
  const renderTreeNodes = (nodes: TreeNode[], depth: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const folder = node.data as FolderInfo;
        const isExpanded = expandedKeys.includes(node.id);
        const documentCount = node.children?.filter(c => c.type === 'document').length || 0;
        
        return (
          <div key={node.id} className="select-none">
            {/* 文件夹头部 */}
            <div 
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group"
              style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
              <div className="flex items-center gap-2 flex-1">
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />}
                  onClick={() => {
                    const newExpanded = isExpanded 
                      ? expandedKeys.filter(key => key !== node.id)
                      : [...expandedKeys, node.id];
                    setExpandedKeys(newExpanded);
                  }}
                  className="text-green-600 hover:text-green-700 p-0 h-5 w-5 min-w-5"
                />
                <span className="font-medium text-gray-800 text-sm">{folder.name}</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  {documentCount} 文档
                </span>
              </div>
              
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'upload',
                      label: '上传文档到此文件夹',
                      icon: <PlusOutlined />
                    },
                    {
                      key: 'rename',
                      label: '重命名',
                      icon: <SettingOutlined />
                    },
                    { type: 'divider' },
                    {
                      key: 'delete',
                      label: '删除文件夹',
                      icon: <DeleteOutlined />,
                      danger: true
                    }
                  ],
                  onClick: ({ key }) => {
                    handleFolderAction(key, folder.id, folder.name);
                  }
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity text-gray-500"
                />
              </Dropdown>
            </div>
            
            {/* 文件夹内容 */}
            {isExpanded && node.children && node.children.length > 0 && (
              <div>
                {renderTreeNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        // 文档节点
        const document = node.data as KnowledgeDocument;
        const isSelected = selectedDocument?.id === document.id;
        
        return (
          <div 
            key={node.id}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all group ${
              isSelected 
                ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                : 'hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${depth * 20 + 28}px` }}
            onClick={() => onDocumentSelect(document)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(document.fileType)}
              <span className="font-medium text-gray-800 text-sm truncate">
                {document.title}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                {getStatusBadge(document.status)}
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatFileSize(document.fileSize)}
                </span>
              </div>
            </div>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view',
                    label: '查看详情',
                    icon: <EyeOutlined />
                  },
                  {
                    key: 'vectorize',
                    label: '重新向量化',
                    icon: <ExperimentOutlined />,
                    disabled: document.status === 'processing'
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    label: '删除文档',
                    icon: <DeleteOutlined />,
                    danger: true
                  }
                ],
                onClick: ({ key }) => {
                  handleDocumentAction(key, document);
                }
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity text-gray-500 ml-1"
              />
            </Dropdown>
          </div>
        );
      }
    });
  };

  return (
    <div className="h-full bg-gray-50">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <FileCode2 size={20} className="text-gray-600" />
          <span className="font-semibold text-gray-800">文档结构</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
          className="text-gray-500 hover:text-gray-700"
        />
      </div>

      {/* 创建文件夹输入框 */}
      {showCreateFolder && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Input
              size="small"
              placeholder="输入文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onPressEnter={handleCreateFolder}
              className="flex-1"
            />
            <Button
              size="small"
              type="primary"
              onClick={handleCreateFolder}
              loading={loading}
            >
              创建
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 快速操作栏 */}
      <div className="px-4 py-3 bg-white border-b">
        <Button
          type="dashed"
          size="small"
          icon={<FolderAddOutlined />}
          onClick={() => setShowCreateFolder(true)}
          disabled={loading}
          className="w-full h-8 text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          创建新文件夹
        </Button>
      </div>

      {/* 树形列表 */}
      <div className="p-3 h-[calc(100%-140px)] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spin tip="加载文档树..." />
          </div>
        ) : treeData.length === 0 ? (
          <Empty description="暂无文档" />
        ) : (
          <div className="space-y-1">
            {renderTreeNodes(treeData, 0)}
          </div>
        )}
      </div>

      {/* 上传文件模态框 */}
      <Modal
        title="上传文档到文件夹"
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedFolderId('');
        }}
        footer={null}
        width={600}
      >
        <div className="py-4">
          <Upload.Dragger
            name="files"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽文件到此区域上传
            </p>
            <p className="ant-upload-hint">
              支持单个或批量上传。严格禁止上传公司数据或其他违禁文件。
            </p>
          </Upload.Dragger>
          
          {uploading && (
            <div className="mt-4 text-center">
              <Spin tip="上传中..." />
            </div>
          )}
        </div>
      </Modal>

      {/* 重命名文件夹模态框 */}
      <Modal
        title="重命名文件夹"
        open={showRenameModal}
        onOk={handleRenameFolder}
        onCancel={() => {
          setShowRenameModal(false);
          setRenamingFolder(null);
          setNewFolderName('');
        }}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <Input
            placeholder="请输入新的文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onPressEnter={handleRenameFolder}
          />
        </div>
      </Modal>
    </div>
  );
};

// 文档详情组件
const DocumentDetails: React.FC<{
  document: KnowledgeDocument | null;
  chunks: DocumentChunk[];
  chunksLoading: boolean;
}> = ({ document, chunks, chunksLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    message.success('内容已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Empty 
          description="请选择文档查看详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 文档头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UIBadge variant="outline" className="text-xs shrink-0">
            {document.fileType.toUpperCase()}
          </UIBadge>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{document.title}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <span>大小: {formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span>分段: {chunks.length}</span>
              <span>•</span>
              {getStatusBadge(document.status)}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Tooltip title="复制文档信息">
            <Button
              type="text"
              size="small"
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={() => handleCopy(document.title)}
            />
          </Tooltip>
        </div>
      </div>

      {/* 分段列表 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-gray-600" />
            <span className="font-medium text-gray-800">文档分段</span>
            <UIBadge variant="outline">{chunks.length}</UIBadge>
          </div>

          {chunksLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spin tip="加载分段数据..." />
            </div>
          ) : chunks.length === 0 ? (
            <Empty description="暂无分段数据" />
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk, index) => (
                <Card
                  key={chunk.id}
                  size="small"
                  className="border border-gray-200 hover:border-gray-300 transition-colors"
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">分段 {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <UIBadge 
                          variant={chunk.vector_status === 'completed' ? 'default' : 'outline'}
                          className={
                            chunk.vector_status === 'completed' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'border-yellow-200 text-yellow-800'
                          }
                        >
                          {chunk.vector_status === 'completed' ? '已向量化' : '待向量化'}
                        </UIBadge>
                        <Text className="text-xs text-gray-500">
                          {chunk.chunk_size} 字符
                        </Text>
                      </div>
                    </div>
                  }
                  extra={
                    <Button
                      type="text"
                      size="small"
                      icon={<Copy size={12} />}
                      onClick={() => handleCopy(chunk.content)}
                      className="opacity-60 hover:opacity-100"
                    />
                  }
                >
                  <div className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-auto">
                    {chunk.content}
                  </div>
                  
                  {chunk.vector_dimension && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs text-gray-500">
                        向量维度: {chunk.vector_dimension} | 创建时间: {new Date(chunk.created_at).toLocaleString()}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 主组件
export const DocumentFileViewer: React.FC<DocumentFileViewerProps> = ({
  collectionId,
  height = 600,
  refreshTrigger,
  onDocumentSelect,
  onDocumentAction
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // 加载文档树数据
  const loadTreeData = useCallback(async () => {
    if (!collectionId) return;
    
    try {
      setLoading(true);
      
      // 获取文件夹层级结构
      const folderResult = await folderService.getFolderHierarchy(collectionId);
      
      // 获取所有文档
      const documentsResult = await knowledgeService.getDocuments({
        page: 1,
        size: 50,
        collectionId: collectionId
      });

      // 构建树形数据
      const nodes: TreeNode[] = [];
      const folderMap = new Map<string, TreeNode>();
      
      // 首先创建所有文件夹节点
      folderResult.hierarchy.forEach(folder => {
        const folderNode: TreeNode = {
          id: `folder-${folder.id}`,
          name: folder.name,
          type: 'folder',
          data: folder,
          children: [],
          isSelectable: false
        };
        
        folderMap.set(folder.id, folderNode);
        
        // 如果有父文件夹，添加到父文件夹的子节点中
        if (folder.parent_folder_id) {
          const parentNode = folderMap.get(folder.parent_folder_id);
          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(folderNode);
          }
        } else {
          // 根级别文件夹
          nodes.push(folderNode);
        }
      });
      
      // 处理文档，分配到相应的文件夹或根级别
      const allDocuments = documentsResult.documents || [];
      allDocuments.forEach(doc => {
        const documentNode: TreeNode = {
          id: `doc-${doc.id}`,
          name: doc.title,
          type: 'document',
          data: doc,
          isSelectable: true
        };
        
        // 如果文档有folder_id，添加到对应文件夹
        if (doc.folder_id) {
          const parentFolder = folderMap.get(doc.folder_id);
          if (parentFolder) {
            parentFolder.children = parentFolder.children || [];
            parentFolder.children.push(documentNode);
            return;
          }
        }
        
        // 未分类文档添加到根级别
        nodes.push(documentNode);
      });

      setTreeData(nodes);
      
    } catch (error: any) {
      console.error('加载文档树失败:', error);
      message.error(error.message || '加载文档树失败');
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // 加载文档分段数据
  const loadDocumentChunks = useCallback(async (documentId: string) => {
    try {
      setChunksLoading(true);
      const chunksData = await knowledgeService.fetchDocumentChunks(documentId, 0, 100);
      setChunks(chunksData.chunks);
    } catch (error: any) {
      console.error('加载文档分段失败:', error);
      message.error('加载文档分段失败');
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  }, []);

  // 处理文档选择
  const handleDocumentSelect = useCallback((document: KnowledgeDocument) => {
    setSelectedDocument(document);
    loadDocumentChunks(document.id);
    onDocumentSelect?.(document);
  }, [loadDocumentChunks, onDocumentSelect]);

  // 初始化和刷新触发
  useEffect(() => {
    loadTreeData();
  }, [loadTreeData, refreshTrigger]);

  return (
    <div className="h-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="rounded-lg border overflow-hidden"
        style={{ height }}
      >
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <DocumentTree
            treeData={treeData}
            selectedDocument={selectedDocument}
            onDocumentSelect={handleDocumentSelect}
            onRefresh={loadTreeData}
            loading={loading}
            collectionId={collectionId}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65} minSize={50}>
          <DocumentDetails
            document={selectedDocument}
            chunks={chunks}
            chunksLoading={chunksLoading}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DocumentFileViewer;