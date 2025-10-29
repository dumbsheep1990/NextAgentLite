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
import DocumentFileTreeViewer from './DocumentFileTreeViewer';

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
  chunk_index?: number;
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
  if (type.includes('word') || type.includes('doc')) {
    return <FileWordOutlined style={{ ...iconStyle, color: '#1976d2' }} />;
  }
  if (type.includes('excel') || type.includes('sheet')) {
    return <FileExcelOutlined style={{ ...iconStyle, color: '#388e3c' }} />;
  }
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return <FileImageOutlined style={{ ...iconStyle, color: '#7b1fa2' }} />;
  }
  if (type.includes('text') || type.includes('md') || type.includes('markdown')) {
    return <FileTextOutlined style={{ ...iconStyle, color: '#f57c00' }} />;
  }
  if (type.includes('ppt') || type.includes('powerpoint')) {
    return <FileTextOutlined style={{ ...iconStyle, color: '#d84315' }} />;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {
    return <FileUnknownOutlined style={{ ...iconStyle, color: '#455a64' }} />;
  }
  return <FileTextOutlined style={{ ...iconStyle, color: '#9e9e9e' }} />;
};

// 文档向量化状态标签（根据vectorized字段判断）
const getVectorizationBadge = (document: KnowledgeDocument) => {
  // 优先检查 vectorized 字段
  if (document.vectorized) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-green-600 font-medium">已向量化</span>
      </div>
    );
  }

  // 检查 vectorization_status 字段
  if (document.vectorization_status === 'processing' || document.status === 'processing') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-xs text-blue-600 font-medium">处理中</span>
      </div>
    );
  }

  // 默认为待向量化
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
      <span className="text-xs text-yellow-600 font-medium">待向量化</span>
    </div>
  );
};

// 文档状态标签（已废弃，保留用于兼容性）
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'vectorized':
    case 'completed':  // 兼容旧数据
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-600 font-medium">已向量化</span>
        </div>
      );
    case 'processing':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs text-blue-600 font-medium">处理中</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-yellow-600 font-medium">待处理</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-xs text-red-600 font-medium">失败</span>
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

// 文档详情组件
const DocumentDetails: React.FC<{
  document: KnowledgeDocument | null;
  chunks: DocumentChunk[];
  chunksLoading: boolean;
  onDeleteDocument: (documentId: string) => void;
  onRefreshChunks: (documentId: string) => void;
}> = ({ document, chunks, chunksLoading, onDeleteDocument, onRefreshChunks }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyChunk = (chunkContent: string, chunkId: string) => {
    navigator.clipboard.writeText(chunkContent);
    setCopiedText(chunkId);
    message.success('分块内容已复制到剪贴板');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDeleteDocument = (documentId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档 "${document?.filename || document?.title}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        onDeleteDocument(documentId);
      }
    });
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileCode2 size={64} className="text-gray-400 mx-auto mb-4" />
          <Text type="secondary" className="text-lg">
            选择一个文档查看详情
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 文档信息头部 - 与左侧高度一致 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          {getFileIcon(document.fileType)}
          <Text className="font-medium text-sm text-gray-700 truncate" style={{ maxWidth: '300px' }}>
            {document.filename || document.title}
          </Text>
          {getVectorizationBadge(document)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{new Date(document.uploadTime).toLocaleString()}</span>
          <Button 
            type="text" 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              onRefreshChunks(document.id);
            }}
            title="刷新分块"
            className="hover:bg-gray-100"
          />
        </div>
      </div>

      {/* 分块信息 */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} />
              <Text strong>文档分块 ({chunks.length})</Text>
            </div>
            <Text type="secondary" className="text-sm">
              展示文档的切分结果和向量化状态
            </Text>
          </div>
        </div>
        
        <ScrollArea className="h-full p-4">
          {chunksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spin tip="加载分块数据..." />
            </div>
          ) : chunks.length === 0 ? (
            <Empty 
              description="暂无分块数据" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk, index) => (
                <Card
                  key={chunk.id || `chunk-${index}`}
                  size="small"
                  className="hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UIBadge variant="outline">#{index + 1}</UIBadge>
                        <Text className="text-sm text-gray-600">
                          {chunk.chunk_size} 字符
                        </Text>
                        {chunk.vector_status === 'completed' ? (
                          <UIBadge variant="default" className="bg-green-100 text-green-700">
                            已向量化 ({chunk.vector_dimension}D)
                          </UIBadge>
                        ) : (
                          <UIBadge variant="secondary">
                            待向量化
                          </UIBadge>
                        )}
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={copiedText === chunk.id ? <Check size={14} /> : <Copy size={14} />}
                        onClick={() => handleCopyChunk(chunk.content, chunk.id)}
                        className="text-gray-500 hover:text-blue-500"
                      />
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 text-sm leading-relaxed">
                      {chunk.content.length > 200 ? (
                        <>
                          {chunk.content.substring(0, 200)}
                          <Text type="secondary">...</Text>
                        </>
                      ) : (
                        chunk.content
                      )}
                    </div>
                    
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          查看元数据
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(chunk.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
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
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [chunksLoading, setChunksLoading] = useState(false);

  // 加载文档树数据
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🌳 [DocumentFileViewer] Loading tree data for collection:', collectionId);
      
      if (!collectionId) {
        console.warn('🌳 [DocumentFileViewer] No collectionId provided');
        setTreeData([]);
        return;
      }
      
      // 获取文件夹层级结构
      const folderResult = await folderService.getFolderHierarchy(collectionId);
      console.log('🌳 [DocumentFileViewer] Folder hierarchy result:', folderResult);
      
      // 同时获取未分类的文档
      const uncategorizedDocuments = await knowledgeService.getDocuments({
        page: 1,
        size: 50,
        collectionId: collectionId
      });
      
      // 构建树形数据
      const buildTreeNodes = async (folders: FolderInfo[]): Promise<TreeNode[]> => {
        const nodes: TreeNode[] = [];

        for (const folder of folders) {
          console.log(`🌳 [buildTreeNodes] Processing folder: ${folder.name}, document_count: ${folder.document_count}`);
          let documents = [];
          if (folder.document_count && folder.document_count > 0) {
            try {
              const documentsResult = await folderService.getFolderDocuments(
                folder.id,
                collectionId,
                {
                  page: 1,
                  size: 100
                }
              );
              documents = documentsResult.documents || [];
              console.log(`🌳 [buildTreeNodes] Folder "${folder.name}" got ${documents.length} documents:`, documents.map(d => d.filename || d.title));
            } catch (error) {
              console.warn(`无法获取文件夹 ${folder.name} 的文档:`, error);
            }
          } else {
            console.log(`🌳 [buildTreeNodes] Folder "${folder.name}" has no documents (count: ${folder.document_count})`);
          }
          
          // 创建文档节点（包含完整的向量化状态信息）
          const documentNodes: TreeNode[] = documents.map(doc => ({
            id: `doc-${doc.id}`,
            name: doc.filename || doc.title,
            type: 'document',
            data: {
              id: doc.id,
              title: doc.title,
              filename: doc.filename,
              fileType: doc.file_type,
              fileSize: doc.file_size,
              status: doc.status,
              vectorized: doc.vectorized || false,
              vectorization_status: doc.vectorization_status,
              dualVectorized: doc.dual_vectorized || false,
              tags: doc.tags || [],
              uploadTime: doc.created_at,
              metadata: doc.metadata || {},
              processing_progress: doc.processing_progress,
              vectorStatus: doc.vector_status
            } as KnowledgeDocument,
            isSelectable: true
          }));
          
          // 递归处理子文件夹
          const childNodes = folder.children ? await buildTreeNodes(folder.children) : [];
          
          // 创建文件夹节点
          const folderNode: TreeNode = {
            id: `folder-${folder.id}`,
            name: `${folder.name} (${folder.document_count || 0})`,
            type: 'folder',
            data: folder,
            children: [...documentNodes, ...childNodes],
            isSelectable: false
          };
          
          nodes.push(folderNode);
        }
        
        return nodes;
      };
      
      const nodes = await buildTreeNodes(folderResult.hierarchy);
      
      // 收集所有已分类文档的ID
      const categorizedDocumentIds = new Set<string>();
      const collectDocumentIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'document') {
            const docId = node.id.replace('doc-', '');
            categorizedDocumentIds.add(docId);
          }
          if (node.children) {
            collectDocumentIds(node.children);
          }
        });
      };
      collectDocumentIds(nodes);

      console.log('🌳 [DocumentFileViewer] Categorized document IDs:', Array.from(categorizedDocumentIds));
      console.log('🌳 [DocumentFileViewer] All documents from API:', uncategorizedDocuments.documents?.map(d => ({ id: d.id, name: d.filename || d.title })));

      // 过滤出未分类的文档
      let uncategorizedDocs: KnowledgeDocument[] = [];
      if (uncategorizedDocuments.documents && uncategorizedDocuments.documents.length > 0) {
        uncategorizedDocs = uncategorizedDocuments.documents.filter(doc =>
          !categorizedDocumentIds.has(doc.id)
        );
        console.log('🌳 [DocumentFileViewer] Found uncategorized documents:', uncategorizedDocs.length, uncategorizedDocs.map(d => d.filename || d.title));
      }
      
      // 创建未分类文档节点
      const uncategorizedNodes: TreeNode[] = uncategorizedDocs.map(doc => ({
        id: `doc-${doc.id}`,
        name: doc.filename || doc.title,
        type: 'document',
        data: doc,
        isSelectable: true
      }));
      
      // 合并文件夹节点和未分类文档节点
      const allNodes = [...nodes, ...uncategorizedNodes];
      setTreeData(allNodes);
      
    } catch (error: any) {
      console.error('加载文档树失败:', error);
      message.error(error.message || '加载文档树失败');
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // 加载文档分块数据
  const loadDocumentChunks = useCallback(async (documentId: string) => {
    try {
      setChunksLoading(true);
      const chunksData = await knowledgeService.getDocumentChunks(documentId);
      setChunks(chunksData || []);
    } catch (error: any) {
      console.error('加载文档分块失败:', error);
      message.error('加载文档分块失败');
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  }, []);

  // 处理文档选择
  const handleDocumentSelect = useCallback((document: KnowledgeDocument) => {
    setSelectedDocument(document);
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
    // 加载文档分块
    loadDocumentChunks(document.id);
  }, [onDocumentSelect, loadDocumentChunks]);

  // 处理文档删除（右侧删除按钮）
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await knowledgeService.deleteDocument(documentId);
      message.success('文档删除成功');
      
      // 清除选中的文档
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setChunks([]);
      }
      
      // 重新加载文档树
      loadTreeData();
      
      // 触发父组件的动作回调
      if (onDocumentAction) {
        onDocumentAction('delete', documentId);
      }
    } catch (error: any) {
      console.error('删除文档失败:', error);
      message.error(error.message || '删除文档失败');
    }
  }, [selectedDocument, loadTreeData, onDocumentAction]);


  // 初始化加载
  useEffect(() => {
    if (collectionId) {
      loadTreeData();
    }
  }, [collectionId, loadTreeData, refreshTrigger]);

  return (
    <div className="h-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="rounded-lg border overflow-hidden"
        style={{ height }}
      >
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <DocumentFileTreeViewer
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
            onDeleteDocument={handleDeleteDocument}
            onRefreshChunks={loadDocumentChunks}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DocumentFileViewer;