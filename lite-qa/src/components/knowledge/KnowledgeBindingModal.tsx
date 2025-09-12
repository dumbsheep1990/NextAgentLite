/**
 * 知识库绑定Modal组件
 * 支持多知识库选择和文件夹层级过滤
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Tabs,
  Tree,
  Checkbox,
  Button,
  Space,
  Input,
  Badge,
  Typography,
  Empty,
  Spin,
  message,
  Tooltip,
  Divider
} from 'antd';
import {
  DatabaseOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { knowledgeService } from '../../services/knowledgeService';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';

const { Text, Title } = Typography;
const { Search } = Input;

export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  document_count?: number;
  is_active: boolean;
  metadata_template: string;
  created_at: string;
}

export interface KnowledgeBindingConfig {
  enabledCollections: string[];
  folderFilters: Record<string, string[]>; // collection_id -> folder_ids
  searchScope: 'all' | 'selected_folders';
}

export interface KnowledgeBindingModalProps {
  visible: boolean;
  currentConfig?: KnowledgeBindingConfig;
  onConfirm: (config: KnowledgeBindingConfig) => void;
  onCancel: () => void;
}

interface TreeNode {
  key: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
  folder: FolderInfo;
  selectable?: boolean;
}

const KnowledgeBindingModal: React.FC<KnowledgeBindingModalProps> = ({
  visible,
  currentConfig,
  onConfirm,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [folderData, setFolderData] = useState<Record<string, TreeNode[]>>({});
  const [selectedFolders, setSelectedFolders] = useState<Record<string, string[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, React.Key[]>>({});
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('collections');
  const [folderLoading, setFolderLoading] = useState<Record<string, boolean>>({});

  // 初始化配置
  useEffect(() => {
    if (visible && currentConfig) {
      setSelectedCollections(currentConfig.enabledCollections || []);
      setSelectedFolders(currentConfig.folderFilters || {});
    } else if (visible) {
      setSelectedCollections([]);
      setSelectedFolders({});
    }
  }, [visible, currentConfig]);

  // 加载知识库列表
  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await knowledgeService.getCollections();
      if (response.success) {
        setCollections(response.data.filter((col: KnowledgeCollection) => col.is_active));
      }
    } catch (error: any) {
      console.error('加载知识库列表失败:', error);
      message.error(error.message || '加载知识库列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载文件夹层级结构
  const loadFolderHierarchy = useCallback(async (collectionId: string) => {
    try {
      setFolderLoading(prev => ({ ...prev, [collectionId]: true }));
      const result = await folderService.getFolderHierarchy(collectionId);
      
      const convertToTreeNodes = (folders: FolderInfo[]): TreeNode[] => {
        return folders.map(folder => {
          const isSystemFolder = folder.folder_metadata?.system_folder;
          
          const title = (
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
            </div>
          );

          return {
            key: folder.id,
            title,
            icon: isSystemFolder ? <HomeOutlined /> : <FolderOutlined />,
            children: folder.children ? convertToTreeNodes(folder.children) : undefined,
            isLeaf: !folder.children || folder.children.length === 0,
            folder,
            selectable: true
          };
        });
      };

      const nodes = convertToTreeNodes(result.hierarchy);
      setFolderData(prev => ({ ...prev, [collectionId]: nodes }));

      // 默认展开根文件夹
      if (nodes.length > 0) {
        setExpandedKeys(prev => ({ 
          ...prev, 
          [collectionId]: [nodes[0].key] 
        }));
      }

    } catch (error: any) {
      console.error('加载文件夹层级结构失败:', error);
      message.error(error.message || '加载文件夹失败');
    } finally {
      setFolderLoading(prev => ({ ...prev, [collectionId]: false }));
    }
  }, []);

  // 初始化时加载知识库列表
  useEffect(() => {
    if (visible) {
      loadCollections();
    }
  }, [visible, loadCollections]);

  // 当选择知识库时加载其文件夹结构
  useEffect(() => {
    selectedCollections.forEach(collectionId => {
      if (!folderData[collectionId]) {
        loadFolderHierarchy(collectionId);
      }
    });
  }, [selectedCollections, folderData, loadFolderHierarchy]);

  // 处理知识库选择
  const handleCollectionChange = (collectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedCollections(prev => [...prev, collectionId]);
    } else {
      setSelectedCollections(prev => prev.filter(id => id !== collectionId));
      // 清除该知识库的文件夹选择
      setSelectedFolders(prev => {
        const newFolders = { ...prev };
        delete newFolders[collectionId];
        return newFolders;
      });
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = (collectionId: string, selectedKeys: React.Key[]) => {
    setSelectedFolders(prev => ({
      ...prev,
      [collectionId]: selectedKeys as string[]
    }));
  };

  // 处理文件夹展开
  const handleFolderExpand = (collectionId: string, expandedKeys: React.Key[]) => {
    setExpandedKeys(prev => ({
      ...prev,
      [collectionId]: expandedKeys
    }));
  };

  // 全选/取消全选知识库
  const handleSelectAllCollections = () => {
    const allCollectionIds = collections.map(col => col.id);
    const isAllSelected = allCollectionIds.every(id => selectedCollections.includes(id));
    
    if (isAllSelected) {
      setSelectedCollections([]);
      setSelectedFolders({});
    } else {
      setSelectedCollections(allCollectionIds);
    }
  };

  // 确认配置
  const handleConfirm = () => {
    if (selectedCollections.length === 0) {
      message.warning('请至少选择一个知识库');
      return;
    }

    const config: KnowledgeBindingConfig = {
      enabledCollections: selectedCollections,
      folderFilters: selectedFolders,
      searchScope: Object.keys(selectedFolders).some(id => selectedFolders[id].length > 0) 
        ? 'selected_folders' 
        : 'all'
    };

    onConfirm(config);
  };

  // 渲染知识库列表
  const renderCollectionList = () => {
    const filteredCollections = collections.filter(col => 
      !searchValue || col.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (filteredCollections.length === 0) {
      return (
        <Empty 
          description="暂无知识库" 
          style={{ margin: '40px 0' }}
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              选择知识库 ({selectedCollections.length}/{collections.length})
            </Title>
            <Button 
              type="link" 
              size="small"
              icon={selectedCollections.length === collections.length ? <BorderOutlined /> : <CheckSquareOutlined />}
              onClick={handleSelectAllCollections}
            >
              {selectedCollections.length === collections.length ? '取消全选' : '全选'}
            </Button>
          </Space>
          <Search
            placeholder="搜索知识库"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            size="small"
          />
        </div>

        {filteredCollections.map(collection => (
          <div
            key={collection.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedCollections.includes(collection.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCollectionChange(
              collection.id, 
              !selectedCollections.includes(collection.id)
            )}
          >
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={selectedCollections.includes(collection.id)}
                onChange={(e) => handleCollectionChange(collection.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <DatabaseOutlined style={{ color: collection.color || '#1890ff' }} />
                  <Text strong>{collection.name}</Text>
                  {collection.document_count !== undefined && (
                    <Badge 
                      count={collection.document_count} 
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  )}
                </div>
                {collection.description && (
                  <Text type="secondary" className="text-sm">
                    {collection.description}
                  </Text>
                )}
                <div className="flex items-center space-x-4 mt-1">
                  <Text type="secondary" className="text-xs">
                    模板: {collection.metadata_template}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    创建时间: {new Date(collection.created_at).toLocaleDateString()}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染文件夹过滤
  const renderFolderFilters = () => {
    if (selectedCollections.length === 0) {
      return (
        <Empty 
          description="请先选择知识库" 
          style={{ margin: '40px 0' }}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <FilterOutlined />
          <Title level={5} style={{ margin: 0 }}>
            文件夹过滤 (可选)
          </Title>
          <Tooltip title="不选择文件夹将搜索整个知识库">
            <Text type="secondary" className="text-sm">
              默认搜索全部文档
            </Text>
          </Tooltip>
        </div>

        {selectedCollections.map(collectionId => {
          const collection = collections.find(col => col.id === collectionId);
          const treeData = folderData[collectionId] || [];
          const selectedKeys = selectedFolders[collectionId] || [];
          const expandedKey = expandedKeys[collectionId] || [];
          const isLoading = folderLoading[collectionId];

          return (
            <div key={collectionId} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <DatabaseOutlined style={{ color: collection?.color || '#1890ff' }} />
                <Text strong>{collection?.name}</Text>
                {selectedKeys.length > 0 && (
                  <Badge count={selectedKeys.length} size="small" />
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spin tip="加载文件夹结构..." />
                </div>
              ) : treeData.length > 0 ? (
                <Tree
                  showIcon
                  checkable
                  multiple
                  treeData={treeData}
                  checkedKeys={selectedKeys}
                  expandedKeys={expandedKey}
                  onCheck={(checkedKeys) => handleFolderSelect(collectionId, checkedKeys as React.Key[])}
                  onExpand={(expandedKeys) => handleFolderExpand(collectionId, expandedKeys)}
                  style={{ 
                    background: '#fafafa',
                    padding: '8px',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                />
              ) : (
                <Empty 
                  description="该知识库暂无文件夹" 
                  style={{ margin: '20px 0' }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Tab配置
  const tabItems = [
    {
      key: 'collections',
      label: (
        <Space>
          <DatabaseOutlined />
          选择知识库
          {selectedCollections.length > 0 && (
            <Badge count={selectedCollections.length} size="small" />
          )}
        </Space>
      ),
      children: renderCollectionList()
    },
    {
      key: 'folders',
      label: (
        <Space>
          <FolderOutlined />
          文件夹过滤
          {Object.values(selectedFolders).some(folders => folders.length > 0) && (
            <Badge 
              count={Object.values(selectedFolders).reduce((sum, folders) => sum + folders.length, 0)} 
              size="small" 
            />
          )}
        </Space>
      ),
      children: renderFolderFilters()
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <DatabaseOutlined />
          <span>知识库绑定配置</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      style={{ top: 50 }}
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            已选择 {selectedCollections.length} 个知识库
            {Object.values(selectedFolders).some(folders => folders.length > 0) && (
              <span>
                {', '}共 {Object.values(selectedFolders).reduce((sum, folders) => sum + folders.length, 0)} 个文件夹
              </span>
            )}
          </div>
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleConfirm}
              disabled={selectedCollections.length === 0}
            >
              确定
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default KnowledgeBindingModal;