/**
 * 文档树形展示组件
 * 按文件夹层级展示文档结构，支持树形导航和文档管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tree,
  Card,
  Space,
  Button,
  Tooltip,
  Badge,
  Tag,
  Dropdown,
  Modal,
  Progress,
  Typography,
  message,
  Spin,
  Empty
} from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  FileOutlined,
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
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';
import { knowledgeService } from '../../services/knowledgeService';
import type { KnowledgeDocument } from '../../types';
import './DocumentTreeView.css';

const { Text } = Typography;

export interface DocumentTreeViewProps {
  collectionId: string;
  onDocumentSelect?: (document: KnowledgeDocument) => void;
  onDocumentAction?: (action: string, documentId: string) => void;
  onFolderAction?: (action: string, folderId: string) => void;
  showActions?: boolean;
  height?: number;
  refreshTrigger?: number; // 外部刷新触发器
}

interface TreeNode {
  key: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
  data: FolderInfo | KnowledgeDocument;
  type: 'folder' | 'document';
  selectable?: boolean;
}

// 文件类型图标映射
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (type.includes('word') || type.includes('doc')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
  if (type.includes('excel') || type.includes('sheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return <FileImageOutlined style={{ color: '#722ed1' }} />;
  }
  if (type.includes('text') || type.includes('md') || type.includes('markdown')) {
    return <FileTextOutlined style={{ color: '#fa8c16' }} />;
  }
  return <FileUnknownOutlined style={{ color: '#8c8c8c' }} />;
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

export const DocumentTreeView: React.FC<DocumentTreeViewProps> = ({
  collectionId,
  onDocumentSelect,
  onDocumentAction,
  onFolderAction,
  showActions = true,
  height = 600,
  refreshTrigger
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [folderDocuments, setFolderDocuments] = useState<Record<string, KnowledgeDocument[]>>({});

  // 加载文件夹层级结构和文档
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🌳 [DocumentTreeView] Loading tree data for collection:', collectionId);
      
      if (!collectionId) {
        console.warn('🌳 [DocumentTreeView] No collectionId provided');
        setTreeData([]);
        return;
      }
      
      // 获取文件夹层级结构
      const folderResult = await folderService.getFolderHierarchy(collectionId);
      console.log('🌳 [DocumentTreeView] Folder hierarchy result:', folderResult);
      
      // 同时获取未分类的文档（folder_id为NULL的文档）
      const uncategorizedDocuments = await knowledgeService.getDocuments({
        page: 1,
        size: 50, // 减少size参数避免422错误
        collectionId: collectionId
        // 不传folderId参数，这样应该会获取所有文档，我们再在客户端过滤
      });
      
      // 构建树形数据
      const buildTreeNodes = async (folders: FolderInfo[]): Promise<TreeNode[]> => {
        const nodes: TreeNode[] = [];
        
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
                  size: 100 // 获取前100个文档
                }
              );
              documents = documentsResult.documents || [];
            } catch (error) {
              console.warn(`无法获取文件夹 ${folder.name} 的文档:`, error);
            }
          }
          
          // 缓存文档数据
          setFolderDocuments(prev => ({
            ...prev,
            [folder.id]: documents
          }));
          
          // 创建文档节点，转换数据格式以匹配KnowledgeDocument类型
          const documentNodes: TreeNode[] = documents.map(doc => {
            // 转换FolderDocument到KnowledgeDocument格式
            const knowledgeDoc = {
              id: doc.id,
              title: doc.title,
              filename: doc.filename,
              fileType: doc.file_type, // 转换字段名
              fileSize: doc.file_size, // 转换字段名
              status: doc.status,
              tags: doc.tags || [],
              uploadTime: doc.created_at
            };
            
            return {
            key: `doc-${doc.id}`,
            title: (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  minWidth: 0,
                  flex: 1
                }}>
                  <span style={{ 
                    marginRight: '8px',
                    flexShrink: 0
                  }}>
                    {knowledgeDoc.title}
                  </span>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    {getStatusTag(knowledgeDoc.status)}
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {formatFileSize(knowledgeDoc.fileSize)}
                    </Text>
                  </div>
                </div>
                
                {showActions && (
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
                )}
              </div>
            ),
            icon: getFileIcon(knowledgeDoc.fileType),
            isLeaf: true,
            data: knowledgeDoc,
            type: 'document',
            selectable: true
          }
          });
          
          // 递归处理子文件夹
          const childNodes = folder.children ? await buildTreeNodes(folder.children) : [];
          
          // 创建文件夹节点
          const folderNode: TreeNode = {
            key: `folder-${folder.id}`,
            title: (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <Space size={4}>
                  <span>{folder.name}</span>
                  {folder.document_count !== undefined && (
                    <Badge 
                      count={folder.document_count} 
                      size="small"
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  )}
                </Space>
                
                {showActions && (
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
                      data-testid="more-actions"
                    />
                  </Dropdown>
                )}
              </div>
            ),
            icon: folder.folder_metadata?.system_folder ? 
              <FolderOutlined style={{ color: '#1890ff' }} /> : 
              <FolderOutlined />,
            children: [...documentNodes, ...childNodes],
            isLeaf: documentNodes.length === 0 && childNodes.length === 0,
            data: folder,
            type: 'folder',
            selectable: false
          };
          
          nodes.push(folderNode);
        }
        
        return nodes;
      };
      
      const nodes = await buildTreeNodes(folderResult.hierarchy);
      
      // 收集所有已分类文档的ID（在文件夹中的文档）
      const categorizedDocumentIds = new Set<string>();
      const collectDocumentIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'document') {
            categorizedDocumentIds.add(node.data.id);
          }
          if (node.children) {
            collectDocumentIds(node.children);
          }
        });
      };
      collectDocumentIds(nodes);
      
      // 过滤出未分类的文档（不在任何文件夹中的文档）
      let uncategorizedDocs: KnowledgeDocument[] = [];
      if (uncategorizedDocuments.documents && uncategorizedDocuments.documents.length > 0) {
        uncategorizedDocs = uncategorizedDocuments.documents.filter(doc => 
          !categorizedDocumentIds.has(doc.id)
        );
        console.log('🌳 [DocumentTreeView] Found uncategorized documents:', uncategorizedDocs.length);
        
      }
      
      // 创建未分类文档节点
      let uncategorizedNodes: TreeNode[] = [];
      if (uncategorizedDocs.length > 0) {
        uncategorizedNodes = uncategorizedDocs.map(doc => ({
          key: `doc-${doc.id}`,
          title: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              minWidth: 0
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                minWidth: 0,
                flex: 1
              }}>
                <span style={{ 
                  marginRight: '8px',
                  flexShrink: 0
                }}>
                  {doc.title}
                </span>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  flexShrink: 0
                }}>
                  {getStatusTag(doc.status)}
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {formatFileSize(doc.fileSize)}
                  </Text>
                </div>
              </div>
              
              {showActions && (
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
                    data-testid="more-actions"
                  />
                </Dropdown>
              )}
            </div>
          ),
          icon: getFileIcon(doc.fileType),
          isLeaf: true,
          data: doc,
          type: 'document',
          selectable: true
        }));
      }
      
      // 合并文件夹节点和未分类文档节点
      const allNodes = [...nodes, ...uncategorizedNodes];
      setTreeData(allNodes);
      
      // 默认展开第一层文件夹
      if (allNodes.length > 0) {
        const firstLevelKeys = allNodes.filter(node => node.type === 'folder').map(node => node.key);
        setExpandedKeys(firstLevelKeys);
      }
      
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
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const key = selectedKeys[0];
    if (key && info.node.type === 'document') {
      setSelectedKeys([key]);
      onDocumentSelect?.(info.node.data);
    }
  };

  // 处理节点展开
  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  if (loading) {
    return (
      <Card style={{ height }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' 
        }}>
          <Spin tip="加载文档树..." />
        </div>
      </Card>
    );
  }

  if (treeData.length === 0) {
    return (
      <Card style={{ height }}>
        <Empty 
          description="暂无文档" 
          style={{ padding: '40px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <FolderOpenOutlined />
          <span>文档结构</span>
          <Button 
            type="text" 
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadTreeData}
            title="刷新"
          />
        </Space>
      }
      style={{ height, background: '#ffffff' }}
      bodyStyle={{ 
        padding: '8px', 
        height: height - 60, 
        overflow: 'auto',
        background: '#ffffff'
      }}
    >
      <Tree
        showIcon
        showLine
        treeData={treeData}
        onSelect={handleSelect}
        onExpand={handleExpand}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        style={{ 
          background: 'transparent',
          padding: '0',
          minHeight: '100%'
        }}
        className="custom-document-tree"
      />
    </Card>
  );
};

export default DocumentTreeView;