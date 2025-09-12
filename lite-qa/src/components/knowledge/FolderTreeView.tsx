/**
 * 文件夹树形视图组件
 * 支持文件夹的创建、重命名、移动、删除等操作
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tree,
  Dropdown,
  Modal,
  Input,
  Form,
  message,
  Button,
  Space,
  Tooltip,
  Badge,
  Typography
} from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  FileOutlined
} from '@ant-design/icons';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';

const { Text } = Typography;

export interface FolderTreeViewProps {
  collectionId: string;
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string, folder: FolderInfo) => void;
  onFolderUpdate?: () => void;
  showDocumentCount?: boolean;
  allowEdit?: boolean;
}

interface TreeNode {
  key: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
  folder: FolderInfo;
}

interface CreateFolderModalProps {
  visible: boolean;
  parentFolder?: FolderInfo;
  collectionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface RenameFolderModalProps {
  visible: boolean;
  folder?: FolderInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

// 创建文件夹弹窗
const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  parentFolder,
  collectionId,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await folderService.createFolder({
        name: values.name,
        collection_id: collectionId,
        parent_folder_id: parentFolder?.id,
        description: values.description
      });

      message.success('文件夹创建成功');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error('创建文件夹失败:', error);
      message.error(error.message || '创建文件夹失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={`创建文件夹${parentFolder ? ` - ${parentFolder.name}` : ''}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="文件夹名称"
          rules={[
            { required: true, message: '请输入文件夹名称' },
            { max: 200, message: '文件夹名称不能超过200个字符' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const validation = folderService.validateFolderName(value);
                return validation.valid 
                  ? Promise.resolve() 
                  : Promise.reject(new Error(validation.message));
              }
            }
          ]}
        >
          <Input placeholder="请输入文件夹名称" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="文件夹描述"
          rules={[{ max: 1000, message: '描述不能超过1000个字符' }]}
        >
          <Input.TextArea
            placeholder="请输入文件夹描述（可选）"
            rows={3}
          />
        </Form.Item>

        {parentFolder && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              将创建到: {folderService.formatFolderPath(parentFolder)}
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

// 重命名文件夹弹窗
const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  visible,
  folder,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && folder) {
      form.setFieldsValue({
        name: folder.name
      });
    }
  }, [visible, folder, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!folder) return;

      setLoading(true);

      await folderService.renameFolder(
        folder.id,
        folder.collection_id,
        values.name
      );

      message.success('文件夹重命名成功');
      onSuccess();
    } catch (error: any) {
      console.error('重命名文件夹失败:', error);
      message.error(error.message || '重命名文件夹失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="重命名文件夹"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="文件夹名称"
          rules={[
            { required: true, message: '请输入文件夹名称' },
            { max: 200, message: '文件夹名称不能超过200个字符' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const validation = folderService.validateFolderName(value);
                return validation.valid 
                  ? Promise.resolve() 
                  : Promise.reject(new Error(validation.message));
              }
            }
          ]}
        >
          <Input placeholder="请输入文件夹名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 主组件
export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  collectionId,
  selectedFolderId,
  onFolderSelect,
  onFolderUpdate,
  showDocumentCount = true,
  allowEdit = true
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  
  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [currentParentFolder, setCurrentParentFolder] = useState<FolderInfo>();
  const [currentEditFolder, setCurrentEditFolder] = useState<FolderInfo>();

  // 加载文件夹层级结构
  const loadFolderHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      const result = await folderService.getFolderHierarchy(collectionId);
      
      const convertToTreeNodes = (folders: FolderInfo[]): TreeNode[] => {
        return folders.map(folder => {
          const isSystemFolder = folder.folder_metadata?.system_folder;
          const canAddChild = folderService.canAddSubfolder(folder);
          
          const title = (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <Space size={4}>
                <span>{folder.name}</span>
                {showDocumentCount && folder.document_count !== undefined && (
                  <Badge 
                    count={folder.document_count} 
                    size="small"
                    style={{ backgroundColor: '#52c41a' }}
                  />
                )}
              </Space>
              
              {allowEdit && !isSystemFolder && (
                <Dropdown
                  menu={{
                    items: [
                      ...(canAddChild ? [{
                        key: 'create-subfolder',
                        label: '创建子文件夹',
                        icon: <PlusOutlined />,
                        onClick: () => handleCreateFolder(folder)
                      }] : []),
                      {
                        key: 'rename',
                        label: '重命名',
                        icon: <EditOutlined />,
                        onClick: () => handleRenameFolder(folder)
                      },
                      {
                        key: 'delete',
                        label: '删除',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => handleDeleteFolder(folder)
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
          );

          return {
            key: folder.id,
            title,
            icon: isSystemFolder ? <HomeOutlined /> : <FolderOutlined />,
            children: folder.children ? convertToTreeNodes(folder.children) : undefined,
            isLeaf: !folder.children || folder.children.length === 0,
            folder
          };
        });
      };

      const nodes = convertToTreeNodes(result.hierarchy);
      setTreeData(nodes);

      // 默认展开根文件夹
      if (nodes.length > 0) {
        setExpandedKeys([nodes[0].key]);
      }

      // 设置选中的文件夹
      if (selectedFolderId) {
        setSelectedKeys([selectedFolderId]);
      }

    } catch (error: any) {
      console.error('加载文件夹层级结构失败:', error);
      message.error(error.message || '加载文件夹失败');
    } finally {
      setLoading(false);
    }
  }, [collectionId, selectedFolderId, showDocumentCount, allowEdit]);

  useEffect(() => {
    if (collectionId) {
      loadFolderHierarchy();
    }
  }, [collectionId, loadFolderHierarchy]);

  // 处理文件夹选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const key = selectedKeys[0];
    if (key && onFolderSelect) {
      const node = info.node as TreeNode;
      setSelectedKeys([key]);
      onFolderSelect(key as string, node.folder);
    }
  };

  // 处理展开/收起
  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  // 创建文件夹
  const handleCreateFolder = (parentFolder?: FolderInfo) => {
    setCurrentParentFolder(parentFolder);
    setCreateModalVisible(true);
  };

  // 重命名文件夹
  const handleRenameFolder = (folder: FolderInfo) => {
    setCurrentEditFolder(folder);
    setRenameModalVisible(true);
  };

  // 删除文件夹
  const handleDeleteFolder = (folder: FolderInfo) => {
    const isSystemFolder = folder.folder_metadata?.system_folder;
    if (isSystemFolder) {
      message.warning('系统文件夹不能删除');
      return;
    }

    Modal.confirm({
      title: '确认删除文件夹',
      content: (
        <div>
          <p>确定要删除文件夹 <strong>"{folder.name}"</strong> 吗？</p>
          {folder.document_count && folder.document_count > 0 && (
            <p style={{ color: '#ff4d4f' }}>
              该文件夹包含 {folder.document_count} 个文档，删除后文档将移动到根文件夹。
            </p>
          )}
          <p style={{ color: '#666', fontSize: '12px' }}>
            此操作不可撤销，请谨慎操作。
          </p>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await folderService.deleteFolder(folder.id, folder.collection_id, true);
          message.success('文件夹删除成功');
          loadFolderHierarchy();
          onFolderUpdate?.();
        } catch (error: any) {
          console.error('删除文件夹失败:', error);
          message.error(error.message || '删除文件夹失败');
        }
      }
    });
  };

  // 处理弹窗成功回调
  const handleModalSuccess = () => {
    setCreateModalVisible(false);
    setRenameModalVisible(false);
    setCurrentParentFolder(undefined);
    setCurrentEditFolder(undefined);
    loadFolderHierarchy();
    onFolderUpdate?.();
  };

  // 处理弹窗取消回调
  const handleModalCancel = () => {
    setCreateModalVisible(false);
    setRenameModalVisible(false);
    setCurrentParentFolder(undefined);
    setCurrentEditFolder(undefined);
  };

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => handleCreateFolder()}
            disabled={!allowEdit}
          >
            创建文件夹
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            size="small"
            onClick={loadFolderHierarchy}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Tree
        showIcon
        loadData={undefined}
        treeData={treeData}
        onSelect={handleSelect}
        onExpand={handleExpand}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        loading={loading}
        style={{ 
          background: '#fafafa',
          padding: '8px',
          borderRadius: '4px',
          minHeight: '200px'
        }}
      />

      {/* 创建文件夹弹窗 */}
      <CreateFolderModal
        visible={createModalVisible}
        parentFolder={currentParentFolder}
        collectionId={collectionId}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />

      {/* 重命名文件夹弹窗 */}
      <RenameFolderModal
        visible={renameModalVisible}
        folder={currentEditFolder}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />
    </>
  );
};