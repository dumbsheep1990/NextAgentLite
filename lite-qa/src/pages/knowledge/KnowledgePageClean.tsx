/**
 * 重构版知识库管理页面 - 移除路由阻塞问题
 */
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import {
  Button,
  Tabs,
  Card,
  message,
  Empty,
  Modal,
  Form,
  Input,
  Space
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { 
  DocumentList, 
  DocumentFileViewer,
  UploadModal, 
  RetrievalTest,
  QADatasetPanel,
} from '../../components/knowledge';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAppStore } from '../../stores/appStore';
import { TaskStateRecovery } from '../../components/common/TaskStateRecovery';
import QueueMonitor from '../../components/common/QueueMonitor';
import { knowledgeService } from '../../services/knowledgeService';
import { collectionService } from '../../services/collectionService';
import { folderService } from '../../services/folderService';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import CollectionManagementPage from './CollectionManagementPage';
import GlobalChunkingManager from '../../components/knowledge/GlobalChunkingManager';
import CollectionChunkingPanel from '../../components/knowledge/CollectionChunkingPanel';

// Collection上下文类型
interface CollectionContextType {
  selectedCollectionId: string | null;
  selectedCollectionInfo: any;
  setSelectedCollection: (collectionId: string | null, info?: any) => void;
}

// 创建Collection上下文
const CollectionContext = createContext<CollectionContextType>({
  selectedCollectionId: null,
  selectedCollectionInfo: null,
  setSelectedCollection: () => {}
});

// Collection上下文Hook
export const useCollectionContext = () => useContext(CollectionContext);

const { TabPane } = Tabs;

const KnowledgePageClean: React.FC = () => {
  // 页面层级状态：'collections' | 'documents' | 'global_chunking'
  const [currentView, setCurrentView] = useState<'collections' | 'documents' | 'global_chunking'>('collections');
  const [activeTab, setActiveTab] = useState('documents');
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [queueMonitorVisible, setQueueMonitorVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'file-viewer'>('list'); // 默认列表视图
  const [folderCreateVisible, setFolderCreateVisible] = useState(false);
  const [folderCreating, setFolderCreating] = useState(false);
  const [folderForm] = Form.useForm();
  const [toolbarExpanded, setToolbarExpanded] = useState(false); // 工具栏展开状态
  const [treeViewRefreshTrigger, setTreeViewRefreshTrigger] = useState(0); // 树形视图刷新触发器

  // Collection上下文状态
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionInfo, setSelectedCollectionInfo] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // 当前知识库的统计状态（不受文件夹筛选影响）
  const [collectionStats, setCollectionStats] = useState({
    totalDocuments: 0,
    vectorizedDocuments: 0,
    failedDocuments: 0,
    pendingDocuments: 0,
    totalSize: 0,
    activeTags: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // 使用全局统一的 SSE 会话ID（与 Layout 保持一致，便于后端推送）
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('knowledge-session-id');
    if (!id) {
      id = `knowledge-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('knowledge-session-id', id);
    }
    return id;
  });
  
  const {
    documents,
    selectedDocuments,
    retrievalQuery,
    retrievalResults,
    retrievalLoading,
    pagination,
    uploadModalVisible,
    isUploading,
    isVectorizing,
    setSelectedDocuments,
    deleteDocument,
    batchDeleteDocuments,
    updateDocument,
    setUploadModalVisible,
    setRetrievalQuery,
    testRetrieval,
    uploadDocuments,
    vectorizeDocuments,
    fetchDocuments
  } = useKnowledgeStore();

  const {
    storageConfig,
    storageStatus,
    checkStorageHealth
  } = useAppStore();
  
  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumb();

  // 统计数据（使用当前知识库的统计，不受文件夹筛选影响）
  const stats = {
    totalDocuments: collectionStats.totalDocuments,
    vectorizedDocuments: collectionStats.vectorizedDocuments,
    totalSize: collectionStats.totalSize,
    activeTags: collectionStats.activeTags,
    problematicDocuments: collectionStats.failedDocuments + collectionStats.pendingDocuments
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 处理文档删除
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      // 删除后刷新，保持文件夹过滤状态
      await fetchDocuments({
        page: 1,
        size: 6,
        status: 'all',
        folderId: selectedFolderId || undefined,
        collectionId: selectedCollectionId || undefined
      });
      // 刷新文件夹列表以更新文档计数
      if (selectedCollectionId) {
        fetchFolders(selectedCollectionId);
        fetchCollectionStats(selectedCollectionId); // 刷新统计
      }
    } catch (error) {
      console.error('文档删除失败:', error);
      throw error;
    }
  };

  // 处理批量删除
  const handleBatchDeleteDocuments = async (ids: string[]) => {
    try {
      await batchDeleteDocuments(ids);
      // 批量删除后刷新，保持文件夹过滤状态
      await fetchDocuments({
        page: 1,
        size: 6,
        status: 'all',
        folderId: selectedFolderId || undefined,
        collectionId: selectedCollectionId || undefined
      });
      // 刷新文件夹列表以更新文档计数
      if (selectedCollectionId) {
        fetchFolders(selectedCollectionId);
        fetchCollectionStats(selectedCollectionId); // 刷新统计
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  };

  // 处理向量化
  const handleVectorizeDocument = async (id: string, config?: any) => {
    try {
      const configWithSession = { 
        ...config, 
        sessionId: sessionId 
      };
      await vectorizeDocuments([id], configWithSession);
      message.success('向量化任务已提交，可在任务监控中查看进度');
    } catch (error) {
      console.error('向量化失败:', error);
      message.error('向量化失败');
    }
  };

  // 处理任务完成
  const handleTaskComplete = (taskId: string, result: any) => {
    message.success(`任务完成: ${result.stage || '处理完成'}`);
    // 任务完成后刷新，保持文件夹过滤状态
    fetchDocuments({
      page: pagination.current,
      size: 6,
      status: 'all',
      folderId: selectedFolderId || undefined,
      collectionId: selectedCollectionId || undefined
    });
    // 刷新文件夹列表以更新文档计数
    if (selectedCollectionId) {
      fetchFolders(selectedCollectionId);
      fetchCollectionStats(selectedCollectionId); // 刷新统计
    }
  };

  // 处理任务错误
  const handleTaskError = (taskId: string, error?: string) => {
    message.error(`任务失败: ${error}`);
    // 任务失败后刷新，保持文件夹过滤状态
    fetchDocuments({
      page: pagination.current,
      size: 6,
      status: 'all',
      folderId: selectedFolderId || undefined,
      collectionId: selectedCollectionId || undefined
    });
    // 刷新文件夹列表以更新文档计数
    if (selectedCollectionId) {
      fetchFolders(selectedCollectionId);
      fetchCollectionStats(selectedCollectionId); // 刷新统计
    }
  };

  // 处理文档配置更新
  const handleUpdateDocumentConfig = (documentId: string, config: any) => {
    updateDocument(documentId, {
      vectorConfig: config
    });
  };

  // Collection选择处理
  const handleCollectionSelect = (collectionId: string | null, collectionInfo?: any) => {
    console.log('🎯 [KnowledgePageClean] Collection选择:', collectionId, collectionInfo?.name || collectionInfo?.collection_name);
    setSelectedCollectionId(collectionId);
    setSelectedCollectionInfo(collectionInfo);
    if (collectionId) {
      console.log('📋 切换到文档视图');
      setCurrentView('documents');
      setActiveTab('documents');
    }
  };

  // 返回Collection列表
  const handleBackToCollections = () => {
    setCurrentView('collections');
    setSelectedCollectionId(null);
    setSelectedCollectionInfo(null);
  };

  // 进入全局切分规则管理
  const handleEnterGlobalChunking = () => {
    setCurrentView('global_chunking');
  };

  // 处理Tab切换
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  // 根据view和tab自动调整统计区域的折叠状态
  useEffect(() => {
    if (currentView === 'documents' && activeTab === 'documents') {
      setIsStatsCollapsed(false);
    } else {
      setIsStatsCollapsed(true);
    }
  }, [currentView, activeTab]);

  // 更新面包屑导航
  useEffect(() => {
    if (currentView === 'collections') {
      clearBreadcrumbs();
    } else if (currentView === 'documents' && selectedCollectionInfo) {
      setBreadcrumbs([
        {
          icon: <AppstoreOutlined />,
          text: '知识库',
          onClick: handleBackToCollections
        },
        {
          icon: <FolderOpenOutlined />,
          text: selectedCollectionInfo.name || selectedCollectionInfo.collection_name || '未知知识库'
        }
      ]);
    } else if (currentView === 'global_chunking') {
      setBreadcrumbs([
        {
          icon: <AppstoreOutlined />,
          text: '知识库',
          onClick: handleBackToCollections
        },
        {
          icon: <SettingOutlined />,
          text: '全局切分规则库'
        }
      ]);
    }
  }, [currentView, selectedCollectionInfo, setBreadcrumbs, clearBreadcrumbs]);

  // 清理面包屑导航（组件卸载时）
  useEffect(() => {
    return () => {
      clearBreadcrumbs();
    };
  }, []);

  // 获取Collections列表
  const fetchCollections = async () => {
    try {
      setCollectionsLoading(true);
      const response = await collectionService.getCollections();
      setCollections(response.collections || []);
    } catch (error) {
      console.error('获取Collection列表失败:', error);
      message.error('获取知识库列表失败');
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  // 获取文件夹列表
  const fetchFolders = async (collectionId: string) => {
    if (!collectionId) return;
    try {
      const response = await folderService.getCollectionFolders(collectionId);
      console.log('📁 获取文件夹列表:', response);
      setFolders(response || []);
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      setFolders([]);
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    // 根据选中的文件夹过滤文档
    if (selectedCollectionId) {
      fetchDocuments({ 
        page: 1, 
        size: 6,
        status: 'all',
        folderId: folderId || undefined,
        collectionId: selectedCollectionId
      });
    }
  };

  // 处理文件夹删除
  const handleFolderDelete = async (folderId: string) => {
    if (!selectedCollectionId) return;

    try {
      await folderService.deleteFolder(folderId, selectedCollectionId);
      message.success('文件夹删除成功');
      // 刷新文件夹列表
      fetchFolders(selectedCollectionId);
      // 如果删除的是当前选中的文件夹，重置选择
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        fetchDocuments({
          page: 1,
          size: 6,
          status: 'all',
          collectionId: selectedCollectionId
        });
      }
    } catch (error: any) {
      console.error('删除文件夹失败:', error);
      message.error(`删除文件夹失败: ${error.message || '未知错误'}`);
    }
  };

  // 处理文件夹创建
  const handleCreateFolder = async (values: { name: string; description?: string }) => {
    if (!selectedCollectionId) {
      message.error('请先选择知识库');
      return;
    }

    try {
      setFolderCreating(true);
      await folderService.createFolder({
        name: values.name,
        collection_id: selectedCollectionId,
        description: values.description
      });
      message.success('文件夹创建成功');
      setFolderCreateVisible(false);
      folderForm.resetFields();
      // 刷新文件夹列表
      fetchFolders(selectedCollectionId);
      // 刷新文档列表
      fetchDocuments({
        page: 1,
        size: 6,
        status: 'all',
        folderId: selectedFolderId || undefined,
        collectionId: selectedCollectionId
      });
      // 触发树形视图刷新
      setTreeViewRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('创建文件夹失败:', error);
      message.error(error.message || '创建文件夹失败');
    } finally {
      setFolderCreating(false);
    }
  };

  // 获取当前知识库的统计数据（不受文件夹筛选影响）
  const fetchCollectionStats = async (collectionId: string) => {
    if (!collectionId) return;

    try {
      setStatsLoading(true);
      console.log('📊 开始获取知识库统计，collectionId:', collectionId);

      // 分批获取所有文档来计算统计（因为后端有size限制）
      let allDocs: any[] = [];
      let currentPage = 1;
      const pageSize = 50; // 使用后端允许的合理大小
      let hasMore = true;

      while (hasMore) {
        const response = await knowledgeService.getDocuments({
          collectionId,
          page: currentPage,
          size: pageSize,
          status: 'all'
        });

        console.log(`📊 获取第 ${currentPage} 页数据:`, {
          documentsCount: response.documents?.length || 0,
          total: response.total,
          totalPages: response.totalPages
        });

        allDocs.push(...(response.documents || []));

        // 检查是否还有更多数据
        hasMore = response.documents.length === pageSize && currentPage < response.totalPages;
        currentPage++;
      }

      console.log('📊 总共获取到文档数:', allDocs.length);

      const newStats = {
        totalDocuments: allDocs.length,
        vectorizedDocuments: allDocs.filter(doc => doc.status === 'vectorized').length,
        failedDocuments: allDocs.filter(doc => doc.status === 'failed').length,
        pendingDocuments: allDocs.filter(doc => doc.status === 'pending').length,
        totalSize: allDocs.reduce((sum, doc) => sum + doc.fileSize, 0),
        activeTags: [...new Set(allDocs.flatMap(doc => doc.tags))].length
      };

      console.log('📊 计算出的统计数据:', newStats);
      setCollectionStats(newStats);
    } catch (error) {
      console.error('❌ 获取知识库统计失败:', error);
      // 如果获取失败，重置统计
      setCollectionStats({
        totalDocuments: 0,
        vectorizedDocuments: 0,
        failedDocuments: 0,
        pendingDocuments: 0,
        totalSize: 0,
        activeTags: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // 页面初始化
  useEffect(() => {
    checkStorageHealth();
    fetchCollections();
  }, []);

  // 监听 QA 任务创建事件，显示 Toast
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const d = e?.detail || {};
        // 仅当前选中集合或同集合时提示，避免无关提示
        if (!selectedCollectionId || d.collectionId === selectedCollectionId) {
          // 使用可选的 message 全局组件
          // 动态加载以避免循环依赖
          import('antd').then(({ message }) => {
            message.success(`已创建QA提取任务${d.filename ? `：${d.filename}` : ''}`);
          });
        }
      } catch {}
    };
    window.addEventListener('qa-task-created', handler as EventListener);
    return () => window.removeEventListener('qa-task-created', handler as EventListener);
  }, [selectedCollectionId]);

  // 当选择了Collection时，获取对应的文档、文件夹和统计
  useEffect(() => {
    console.log('🔍 useEffect触发 - selectedCollectionId:', selectedCollectionId, 'currentView:', currentView);
    if (selectedCollectionId && currentView === 'documents') {
      console.log('📁 加载选中Collection的文档、文件夹和统计:', selectedCollectionId);
      fetchDocuments({
        page: 1,
        size: 6,
        status: 'all',
        collectionId: selectedCollectionId
      });
      fetchFolders(selectedCollectionId);
      fetchCollectionStats(selectedCollectionId); // 获取知识库统计
    } else {
      console.log('⚠️ 条件不满足 - selectedCollectionId:', selectedCollectionId, 'currentView:', currentView);
    }
  }, [selectedCollectionId, currentView]); // 移除fetchDocuments依赖以避免无限循环


  // Collection上下文值
  const collectionContextValue: CollectionContextType = {
    selectedCollectionId,
    selectedCollectionInfo,
    setSelectedCollection: handleCollectionSelect
  };

  // 动态渲染Tab栏右侧操作区域
  const renderTabActions = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 创建文件夹按钮 - 渐变橙色 */}
            <Button
              type="primary"
              icon={<FolderOutlined />}
              onClick={() => setFolderCreateVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(250, 173, 20, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(250, 173, 20, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(250, 173, 20, 0.2)';
              }}
            >
              创建文件夹
            </Button>

            {/* 上传文档按钮 - 渐变蓝色 */}
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(24, 144, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.2)';
              }}
            >
              上传文档
            </Button>

            {/* 高级功能按钮 */}
            <Button
              icon={<CodeOutlined />}
              onClick={() => setToolbarExpanded(!toolbarExpanded)}
              style={{
                background: toolbarExpanded ? '#f0f5ff' : '#fff',
                border: `1px solid ${toolbarExpanded ? '#1890ff' : '#d9d9d9'}`,
                color: toolbarExpanded ? '#1890ff' : '#595959',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: toolbarExpanded ? 500 : 400,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!toolbarExpanded) {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.color = '#1890ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!toolbarExpanded) {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#595959';
                }
              }}
            >
              高级功能
            </Button>
          </div>
        );
      
      case 'qa-dataset':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                console.log('点击QA数据集上传按钮');
                if ((window as any).triggerQADatasetUpload) {
                  console.log('找到QA数据集上传函数，执行上传');
                  (window as any).triggerQADatasetUpload();
                } else {
                  console.warn('未找到triggerQADatasetUpload函数');
                }
              }}
              style={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                color: '#595959',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: 400,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#595959';
              }}
            >
              上传QA数据
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if ((window as any).triggerQADatasetRefresh) {
                  (window as any).triggerQADatasetRefresh();
                } else {
                  message.warn('刷新入口未就绪');
                }
              }}
              style={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                color: '#595959',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: 400,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#595959';
              }}
            >
              刷新
            </Button>
            
            <Button
              icon={<MonitorOutlined />}
              onClick={() => setQueueMonitorVisible(true)}
              style={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                color: '#595959',
                borderRadius: '6px',
                padding: '0 16px',
                height: '32px',
                fontWeight: 400,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#52c41a';
                e.currentTarget.style.color = '#52c41a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#595959';
              }}
            >
              队列监控
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <CollectionContext.Provider value={collectionContextValue}>
      <div 
        className="knowledge-scope"
        style={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          padding: `${currentView === 'collections' ? '20px' : '8px'} 4px 6px 4px`,
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 64px)'
        }}
      >

      {/* 保留用于文档视图的详细统计 */}
      {currentView === 'documents' && selectedCollectionId && (
        <div
          style={{
            height: isStatsCollapsed ? '0px' : 'auto',
            overflow: 'hidden',
            transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: isStatsCollapsed ? '0px' : '16px',
            marginTop: isStatsCollapsed ? '0px' : '16px'
          }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* 左侧统计信息 */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}>
                  <FileTextOutlined style={{ color: '#fff', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>文档总数</span>
                  <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, lineHeight: '1.2' }}>
                    {statsLoading ? '...' : stats.totalDocuments}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}>
                  <CheckCircleOutlined style={{ color: '#fff', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>已向量化</span>
                  <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, lineHeight: '1.2' }}>
                    {statsLoading ? '...' : stats.vectorizedDocuments}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                }}>
                  <BarChartOutlined style={{ color: '#fff', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>存储大小</span>
                  <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, lineHeight: '1.2' }}>
                    {formatFileSize(stats.totalSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 视图切换按钮组 */}
              <div style={{
                display: 'inline-flex',
                background: '#f0f2f5',
                borderRadius: '6px',
                padding: '2px',
                gap: '2px'
              }}>
                <Button
                  type="text"
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                  style={{
                    background: viewMode === 'list' ? '#fff' : 'transparent',
                    borderRadius: '4px',
                    margin: 0,
                    border: 'none',
                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    color: viewMode === 'list' ? '#1890ff' : '#595959',
                    fontWeight: viewMode === 'list' ? 500 : 400,
                    height: '32px',
                    padding: '0 12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  列表
                </Button>
                <Button
                  type="text"
                  icon={<FolderOpenOutlined />}
                  onClick={() => setViewMode('file-viewer')}
                  title="树形视图"
                  style={{
                    background: viewMode === 'file-viewer' ? '#fff' : 'transparent',
                    borderRadius: '4px',
                    margin: 0,
                    border: 'none',
                    boxShadow: viewMode === 'file-viewer' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    color: viewMode === 'file-viewer' ? '#1890ff' : '#595959',
                    fontWeight: viewMode === 'file-viewer' ? 500 : 400,
                    height: '32px',
                    padding: '0 12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  树形
                </Button>
              </div>

              {/* 分隔线 */}
              <div style={{ width: '1px', height: '20px', background: '#e8e8e8' }} />

              {/* 刷新按钮 */}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  const currentFilters = {
                    page: 1,
                    size: 6,
                    status: 'all',
                    folderId: selectedFolderId || undefined,
                    collectionId: selectedCollectionId,
                  };
                  fetchDocuments(currentFilters);
                  if (selectedCollectionId) {
                    fetchFolders(selectedCollectionId);
                  }
                }}
                style={{
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  color: '#595959',
                  borderRadius: '6px',
                  padding: '0 16px',
                  height: '32px',
                  fontWeight: 400,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.color = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#595959';
                }}
              >
                刷新
              </Button>

              {/* 队列监控按钮 */}
              <Button
                icon={<MonitorOutlined />}
                onClick={() => setQueueMonitorVisible(true)}
                style={{
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  color: '#595959',
                  borderRadius: '6px',
                  padding: '0 16px',
                  height: '32px',
                  fontWeight: 400,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#52c41a';
                  e.currentTarget.style.color = '#52c41a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#595959';
                }}
              >
                队列监控
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      {currentView === 'collections' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CollectionManagementPage
            onCollectionSelect={handleCollectionSelect}
            onNavigateToGlobalChunking={handleEnterGlobalChunking}
          />
        </div>
      )}

      {/* 全局切分规则管理视图 */}
      {currentView === 'global_chunking' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <GlobalChunkingManager />
        </div>
      )}
      
      {currentView === 'documents' && selectedCollectionId && (
        <Tabs 
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '0',
            border: '1px solid #e5e7eb',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          tabBarStyle={{
            margin: 0,
            padding: '16px 16px 0 16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px 8px 0 0',
            flex: 'none'
          }}
          tabBarExtraContent={{
            right: renderTabActions()
          }}
        >
        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileTextOutlined />
              文档管理
            </span>
          } 
          key="documents"
        >
          <div style={{ 
            padding: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {viewMode === 'file-viewer' ? (
                <DocumentFileViewer
                  collectionId={selectedCollectionId!}
                  height={800}
                  refreshTrigger={treeViewRefreshTrigger}
                  onDocumentSelect={(document) => {
                    console.log('📄 选择文档:', document);
                  }}
                  onDocumentAction={(action, documentId) => {
                    console.log('📄 文档操作:', action, documentId);
                    if (action === 'vectorize') {
                      handleVectorizeDocument(documentId);
                    } else if (action === 'delete') {
                      handleDeleteDocument(documentId);
                    }
                  }}
                />
              ) : (
                <DocumentList
                  documents={documents}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  selectedDocuments={selectedDocuments}
                  onSelectDocuments={setSelectedDocuments}
                  onDeleteDocument={handleDeleteDocument}
                  onBatchDeleteDocuments={handleBatchDeleteDocuments}
                  onVectorizeDocument={handleVectorizeDocument}
                  onUpdateDocumentConfig={handleUpdateDocumentConfig}
                  onFolderSelect={handleFolderSelect}
                  onFolderDelete={handleFolderDelete}
                  toolbarExpanded={toolbarExpanded}
                  onRefresh={() => {
                    const currentFilters = {
                      page: 1,
                      size: 6,
                      status: 'all',
                      folderId: selectedFolderId || undefined,
                      collectionId: selectedCollectionId
                    };
                    fetchDocuments(currentFilters);
                    if (selectedCollectionId) {
                      fetchFolders(selectedCollectionId);
                    }
                  }}
                  onFilterChange={(filters) => {
                    fetchDocuments({
                      ...filters,
                      size: 6,
                      folderId: selectedFolderId || undefined,
                      collectionId: selectedCollectionId
                    });
                  }}
                  pagination={pagination}
                  loading={isUploading}
                  currentCollectionId={selectedCollectionId}
                  totalDocumentsCount={stats.totalDocuments}
                />
              )}
            </div>
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <QuestionCircleOutlined />
              QA数据集
            </span>
          } 
          key="qa-dataset"
        >
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <QADatasetPanel 
              onUploadTrigger={() => {}}
              collectionId={selectedCollectionId}
            />
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ExperimentOutlined />
              检索测试
            </span>
          } 
          key="retrieval"
        >
          <div style={{
            padding: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 130px)',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
              <RetrievalTest
                query={retrievalQuery}
                results={retrievalResults}
                loading={retrievalLoading}
                onQueryChange={setRetrievalQuery}
                onTest={(query, params) => testRetrieval(query, params)}
                collectionId={selectedCollectionId || undefined}
                collectionName={selectedCollectionInfo?.name || selectedCollectionInfo?.collection_name}
              />
            </div>
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SettingOutlined />
              切分配置
            </span>
          } 
          key="chunking"
        >
          <div style={{ 
            padding: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CollectionChunkingPanel />
          </div>
        </TabPane>
        </Tabs>
      )}
      
      {/* 当前视图为文档但未选择Collection时的提示 */}
      {currentView === 'documents' && !selectedCollectionId && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '0',
          border: '1px solid #e5e7eb',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>
                  请选择一个知识库
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  返回知识库列表选择要管理的知识库
                </div>
              </div>
            }
          >
            <Button type="primary" icon={<DatabaseOutlined />} onClick={handleBackToCollections}>
              选择知识库
            </Button>
          </Empty>
        </div>
      )}

      {/* 上传Modal */}
      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={async (files, urls, metadata) => {
          // 执行上传
          await uploadDocuments(files, urls, metadata, sessionId, selectedCollectionId || undefined);

          // 上传成功后刷新当前视图，保持文件夹过滤状态
          setTimeout(() => {
            fetchDocuments({
              page: 1,
              size: 6,
              status: 'all',
              folderId: selectedFolderId || undefined,  // ⭐ 保持文件夹过滤
              collectionId: selectedCollectionId || undefined
            });

            // 同时刷新文件夹列表和统计（更新文档计数）
            if (selectedCollectionId) {
              fetchFolders(selectedCollectionId);
              fetchCollectionStats(selectedCollectionId); // 刷新统计
            }
          }, 1000);
        }}
        loading={isUploading}
        collectionId={selectedCollectionId || undefined}
        selectedFolder={selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null}  // ⭐ 传递选中的文件夹
      />

      {/* 任务状态恢复和SSE连接管理 */}
      <TaskStateRecovery
        sessionId={sessionId}
        onTaskComplete={handleTaskComplete}
        onTaskFailed={handleTaskError}
      />


      {/* 队列监控组件 */}
      <QueueMonitor
        visible={queueMonitorVisible}
        onClose={() => setQueueMonitorVisible(false)}
      />

      {/* 文件夹创建Modal */}
      <Modal
        title="创建文件夹"
        open={folderCreateVisible}
        onCancel={() => {
          setFolderCreateVisible(false);
          folderForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={folderForm}
          layout="vertical"
          onFinish={handleCreateFolder}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[
              { required: true, message: '请输入文件夹名称' },
              { max: 200, message: '文件夹名称不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述（可选）"
            rules={[
              { max: 1000, message: '描述不能超过1000个字符' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入文件夹描述"
              rows={3}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setFolderCreateVisible(false);
                folderForm.resetFields();
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={folderCreating}
                icon={<FolderOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                  border: 'none'
                }}
              >
                创建文件夹
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </CollectionContext.Provider>
  );
};

export default KnowledgePageClean;
