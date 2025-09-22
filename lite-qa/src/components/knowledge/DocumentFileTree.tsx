/**
 * 文档文件树组件 - 使用shadcn file-tree样式
 * 适配现有的文档和文件夹数据结构
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Modal,
  message,
  Spin,
  Empty,
  Tag,
  Dropdown,
  Typography
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  SettingOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  File,
  Folder,
  FileText,
  Image,
  FileText as PdfIcon,
  Table,
  Globe,
} from 'lucide-react';
import { Tree, type TreeDataItem } from '../ui/file-tree';
import { TooltipProvider } from '../ui/tooltip';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';
import { knowledgeService } from '../../services/knowledgeService';
import type { KnowledgeDocument } from '../../types';

const { Text } = Typography;

export interface DocumentFileTreeProps {
  collectionId: string;
  onDocumentSelect?: (document: KnowledgeDocument) => void;
  onDocumentAction?: (action: string, documentId: string) => void;
  onFolderAction?: (action: string, folderId: string) => void;
  showActions?: boolean;
  height?: number;
  refreshTrigger?: number;
}

// 文件类型图标映射 (使用lucide-react图标)
const getFileIcon = (fileType: string, size = 16) => {
  const type = fileType.toLowerCase();
  const iconProps = { size, className: "text-muted-foreground" };
  
  if (type.includes('pdf')) return <PdfIcon {...iconProps} className="text-red-500" />;
  if (type.includes('word') || type.includes('doc')) return <FileText {...iconProps} className="text-blue-500" />;
  if (type.includes('excel') || type.includes('sheet')) return <Table {...iconProps} className="text-green-500" />;
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return <Image {...iconProps} className="text-purple-500" />;
  }
  if (type.includes('text') || type.includes('md') || type.includes('markdown')) {
    return <FileText {...iconProps} className="text-orange-500" />;
  }
  if (type === 'url') return <Globe {...iconProps} className="text-green-500" />;
  return <File {...iconProps} />;
};

// 文档状态标签
const getStatusTag = (status: string) => {
  switch (status) {
    case 'vectorized':
      return <Tag icon={<CheckCircleOutlined />} color="success" size="small">已向量化</Tag>;
    case 'processing':
      return <Tag icon={<ClockCircleOutlined />} color="processing" size="small">处理中</Tag>;
    case 'pending':
      return <Tag icon={<ClockCircleOutlined />} color="warning" size="small">待处理</Tag>;
    case 'failed':
      return <Tag icon={<ExclamationCircleOutlined />} color="error" size="small">失败</Tag>;
    default:
      return <Tag color="default" size="small">{status}</Tag>;
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

export const DocumentFileTree: React.FC<DocumentFileTreeProps> = ({
  collectionId,
  onDocumentSelect,
  onDocumentAction,
  onFolderAction,
  showActions = true,
  height = 600,
  refreshTrigger
}) => {
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  // 加载文件夹层级结构和文档
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🌳 [DocumentFileTree] Loading tree data for collection:', collectionId);
      
      if (!collectionId) {
        console.warn('🌳 [DocumentFileTree] No collectionId provided');
        setTreeData([]);
        return;
      }
      
      // 获取文件夹层级结构
      const folderResult = await folderService.getFolderHierarchy(collectionId);
      console.log('🌳 [DocumentFileTree] Folder hierarchy result:', folderResult);
      
      // 同时获取未分类的文档
      const uncategorizedDocuments = await knowledgeService.getDocuments({
        page: 1,
        size: 50,
        collectionId: collectionId
      });
      
      // 构建树形数据
      const buildTreeNodes = async (folders: FolderInfo[]): Promise<TreeDataItem[]> => {
        const nodes: TreeDataItem[] = [];
        
        for (const folder of folders) {
          // 只有当文件夹有文档时才获取文档详情
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
            } catch (error) {
              console.warn(`无法获取文件夹 ${folder.name} 的文档:`, error);
            }
          }
          
          // 创建文档节点
          const documentNodes: TreeDataItem[] = documents.map(doc => {
            const knowledgeDoc = {
              id: doc.id,
              title: doc.title,
              filename: doc.filename,
              fileType: doc.file_type,
              fileSize: doc.file_size,
              status: doc.status,
              tags: doc.tags || [],
              uploadTime: doc.created_at
            };
            
            return {
              id: `doc-${doc.id}`,
              name: knowledgeDoc.title,
              fileType: "file",
              icon: getFileIcon(knowledgeDoc.fileType),
              actions: showActions ? (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'view',
                        label: '查看详情',
                        icon: <EyeOutlined />,
                        onClick: () => onDocumentSelect?.(knowledgeDoc as any)
                      },
                      {
                        key: 'vectorize',
                        label: '重新向量化',
                        icon: <ExperimentOutlined />,
                        onClick: () => onDocumentAction?.('vectorize', knowledgeDoc.id),
                        disabled: knowledgeDoc.status === 'processing'
                      },
                      {
                        key: 'config',
                        label: '配置管理',
                        icon: <SettingOutlined />,
                        onClick: () => onDocumentAction?.('config', knowledgeDoc.id)
                      },
                      { type: 'divider' },
                      {
                        key: 'delete',
                        label: '删除文档',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除文档 "${knowledgeDoc.title}" 吗？`,
                            onOk: () => onDocumentAction?.('delete', knowledgeDoc.id)
                          });
                        }
                      }
                    ]
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ opacity: 0.6 }}
                  />
                </Dropdown>
              ) : undefined
            };
          });
          
          // 递归处理子文件夹
          const childNodes = folder.children ? await buildTreeNodes(folder.children) : [];
          
          // 创建文件夹节点
          const folderNode: TreeDataItem = {
            id: `folder-${folder.id}`,
            name: `${folder.name} (${folder.document_count || 0})`,
            fileType: "folder",
            icon: <Folder size={16} className="text-blue-500" />,
            children: [...documentNodes, ...childNodes],
            actions: showActions ? (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'refresh',
                      label: '刷新文件夹',
                      icon: <ReloadOutlined />,
                      onClick: () => loadTreeData()
                    },
                    {
                      key: 'manage',
                      label: '管理文件夹',
                      icon: <SettingOutlined />,
                      onClick: () => onFolderAction?.('manage', folder.id)
                    }
                  ]
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            ) : undefined
          };
          
          nodes.push(folderNode);
        }
        
        return nodes;
      };
      
      const nodes = await buildTreeNodes(folderResult.hierarchy);
      
      // 收集所有已分类文档的ID
      const categorizedDocumentIds = new Set<string>();
      const collectDocumentIds = (nodes: TreeDataItem[]) => {
        nodes.forEach(node => {
          if (node.fileType === 'file') {
            // 从 "doc-{id}" 格式中提取实际的文档ID
            const docId = node.id.replace('doc-', '');
            categorizedDocumentIds.add(docId);
          }
          if (node.children) {
            collectDocumentIds(node.children);
          }
        });
      };
      collectDocumentIds(nodes);
      
      // 过滤出未分类的文档
      let uncategorizedDocs: KnowledgeDocument[] = [];
      if (uncategorizedDocuments.documents && uncategorizedDocuments.documents.length > 0) {
        uncategorizedDocs = uncategorizedDocuments.documents.filter(doc => 
          !categorizedDocumentIds.has(doc.id)
        );
        console.log('🌳 [DocumentFileTree] Found uncategorized documents:', uncategorizedDocs.length);
      }
      
      // 创建未分类文档节点
      const uncategorizedNodes: TreeDataItem[] = uncategorizedDocs.map(doc => ({
        id: `doc-${doc.id}`,
        name: doc.title,
        fileType: "file",
        icon: getFileIcon(doc.fileType),
        actions: showActions ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: '查看详情',
                  icon: <EyeOutlined />,
                  onClick: () => onDocumentSelect?.(doc)
                },
                {
                  key: 'vectorize',
                  label: '重新向量化',
                  icon: <ExperimentOutlined />,
                  onClick: () => onDocumentAction?.('vectorize', doc.id),
                  disabled: doc.status === 'processing'
                },
                {
                  key: 'config',
                  label: '配置管理',
                  icon: <SettingOutlined />,
                  onClick: () => onDocumentAction?.('config', doc.id)
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: '删除文档',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    Modal.confirm({
                      title: '确认删除',
                      content: `确定要删除文档 "${doc.title}" 吗？`,
                      onOk: () => onDocumentAction?.('delete', doc.id)
                    });
                  }
                }
              ]
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ) : undefined
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
  }, [collectionId, showActions, onDocumentSelect, onDocumentAction, onFolderAction]);

  // 初始化和刷新触发
  useEffect(() => {
    if (collectionId) {
      loadTreeData();
    }
  }, [collectionId, loadTreeData, refreshTrigger]);

  // 处理节点选择
  const handleSelectChange = (item: TreeDataItem | undefined) => {
    setSelectedItemId(item?.id);
    
    if (item && item.fileType === 'file') {
      // 从 "doc-{id}" 格式中提取实际的文档ID
      const docId = item.id.replace('doc-', '');
      // 这里需要根据docId获取完整的文档信息
      // 暂时先传递一个基本的文档对象
      const basicDoc = {
        id: docId,
        title: item.name,
        filename: item.name,
        fileType: 'unknown',
        fileSize: 0,
        status: 'unknown',
        tags: [],
        uploadTime: new Date().toISOString()
      } as KnowledgeDocument;
      
      onDocumentSelect?.(basicDoc);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        height,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin tip="加载文档树..." />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div style={{ height }}>
        <Empty 
          description="暂无文档" 
          style={{ padding: '40px 0' }}
        />
      </div>
    );
  }

  return (
    <div style={{ height, overflow: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: 500, fontSize: '14px' }}>文档结构</span>
        <Button 
          type="text" 
          size="small"
          icon={<ReloadOutlined />}
          onClick={loadTreeData}
          title="刷新"
        />
      </div>
      
      <div style={{ padding: '0 8px' }}>
        <TooltipProvider>
          <Tree
            data={treeData}
            initialSlelectedItemId={selectedItemId}
            onSelectChange={handleSelectChange}
            className="w-full"
          />
        </TooltipProvider>
      </div>
    </div>
  );
};

export default DocumentFileTree;