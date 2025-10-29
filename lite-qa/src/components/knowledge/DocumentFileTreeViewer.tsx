/**
 * 文档文件树查看器 - 使用shadcn样式的现代化树形文档浏览器
 * 专门用于DocumentFileViewer中，使用shadcn风格的document-tree组件
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Modal,
  message,
  Input,
  Upload,
  Form,
  Typography
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { FilePlus } from 'lucide-react';
import DocumentTree, { type DocumentNode } from '../ui/document-tree';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';
import { knowledgeService } from '../../services/knowledgeService';
import type { KnowledgeDocument } from '../../types';

const { Text } = Typography;

// 原有的TreeNode接口，用于与外部组件兼容
interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  data: FolderInfo | KnowledgeDocument;
  children?: TreeNode[];
  isSelectable?: boolean;
}

export interface DocumentFileTreeViewerProps {
  treeData: TreeNode[];
  selectedDocument: KnowledgeDocument | null;
  onDocumentSelect: (document: KnowledgeDocument) => void;
  onRefresh: () => void;
  loading: boolean;
  collectionId: string;
}

export const DocumentFileTreeViewer: React.FC<DocumentFileTreeViewerProps> = ({
  treeData,
  selectedDocument,
  onDocumentSelect,
  onRefresh,
  loading,
  collectionId
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 将TreeNode转换为DocumentNode
  const convertToDocumentNodes = useCallback((nodes: TreeNode[]): DocumentNode[] => {
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const folderData = isFolder ? node.data as FolderInfo : null;
      const documentData = !isFolder ? node.data as KnowledgeDocument : null;
      
      return {
        id: node.id,
        name: isFolder ? 
          folderData?.name || 'Unknown' : 
          documentData?.filename || documentData?.title || 'Unknown Document',
        type: isFolder ? 'folder' : 'file',
        size: documentData?.fileSize,
        created_at: documentData?.uploadTime || folderData?.created_at,
        updated_at: documentData?.updatedTime || folderData?.updated_at,
        status: documentData?.status as any,
        file_type: documentData?.fileType,
        children: node.children ? convertToDocumentNodes(node.children) : undefined,
        collection_id: collectionId,
        metadata: documentData?.metadata
      };
    });
  }, [collectionId]);

  // 处理节点选择
  const handleNodeSelect = (node: DocumentNode) => {
    if (node.type === 'file') {
      // 从treeData中找到对应的文档数据
      const findDocument = (nodes: TreeNode[], targetId: string): KnowledgeDocument | null => {
        for (const treeNode of nodes) {
          if (treeNode.id === targetId && treeNode.type === 'document') {
            return treeNode.data as KnowledgeDocument;
          }
          if (treeNode.children) {
            const result = findDocument(treeNode.children, targetId);
            if (result) return result;
          }
        }
        return null;
      };
      
      const document = findDocument(treeData, node.id);
      if (document) {
        onDocumentSelect(document);
      }
    }
  };

  // 处理预览
  const handlePreview = (node: DocumentNode) => {
    handleNodeSelect(node);
    message.success(`预览文档: ${node.name}`);
  };

  // 处理下载
  const handleDownload = (node: DocumentNode) => {
    message.info(`下载功能开发中: ${node.name}`);
    // TODO: 实现文档下载功能
  };

  // 处理删除
  const handleDelete = async (node: DocumentNode) => {
    if (node.type !== 'file') return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档 "${node.name}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 从node.id中提取实际的文档ID (格式: doc-xxx)
          const documentId = node.id.replace('doc-', '');
          await knowledgeService.deleteDocument(documentId);
          message.success('文档删除成功');
          
          // 刷新文档树
          onRefresh();
        } catch (error: any) {
          console.error('删除文档失败:', error);
          message.error(error.message || '删除文档失败');
        }
      }
    });
  };

  // 转换树形数据
  const documentNodes = convertToDocumentNodes(treeData);

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Text className="font-medium text-sm text-gray-700">文档结构</Text>
          <span className="text-xs text-gray-500">({documentNodes.length})</span>
        </div>
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            title="刷新"
            className="hover:bg-gray-100"
          />
        </div>
      </div>
      
      {/* shadcn风格的文档树 */}
      <div className="flex-1 overflow-hidden px-2">
        <DocumentTree
          documents={documentNodes}
          onSelect={handleNodeSelect}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
          selectedId={selectedDocument?.id}
          className="h-full"
        />
      </div>

      {/* 文档上传模态框 */}
      <Modal
        title="上传文档"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        destroyOnClose
      >
        <Upload.Dragger
          multiple
          beforeUpload={() => false}
          style={{ margin: '16px 0' }}
        >
          <p className="ant-upload-drag-icon">
            <FilePlus size={48} className="text-blue-500" />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持批量上传多个文件</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default DocumentFileTreeViewer;