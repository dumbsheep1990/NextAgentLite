/**
 * 重构版知识库管理页面 - 移除路由阻塞问题
 */
import React, { useEffect, useState, createContext, useContext } from 'react';
import { 
  Button, 
  Tabs, 
  Card, 
  message,
  Empty
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
  BarChartOutlined
} from '@ant-design/icons';
import { 
  DocumentList, 
  UploadModal, 
  RetrievalTest,
  QADatasetPanel,
  SSEConnectionManager
} from '../../components/knowledge';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAppStore } from '../../stores/appStore';
import { TaskStateRecovery } from '../../components/common/TaskStateRecovery';
import QueueMonitor from '../../components/common/QueueMonitor';
import { knowledgeService } from '../../services/knowledgeService';
import { collectionService } from '../../services/collectionService';
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
  
  // Collection上下文状态
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionInfo, setSelectedCollectionInfo] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  
  // 全局统计状态
  const [globalStats, setGlobalStats] = useState({
    totalDocuments: 0,
    vectorizedDocuments: 0,
    failedDocuments: 0,
    pendingDocuments: 0,
    totalSize: 0,
    activeTags: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // 使用持久化的sessionId
  const [sessionId] = useState(() => {
    const cachedSessionId = sessionStorage.getItem('knowledge-session-id');
    if (cachedSessionId) {
      return cachedSessionId;
    }
    const newSessionId = `knowledge-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('knowledge-session-id', newSessionId);
    return newSessionId;
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

  // 统计数据
  const stats = globalStats.totalDocuments > 0 ? {
    totalDocuments: globalStats.totalDocuments,
    vectorizedDocuments: globalStats.vectorizedDocuments,
    totalSize: globalStats.totalSize,
    activeTags: globalStats.activeTags,
    problematicDocuments: globalStats.failedDocuments + globalStats.pendingDocuments
  } : {
    totalDocuments: documents.length,
    vectorizedDocuments: documents.filter(doc => doc.status === 'vectorized').length,
    totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
    activeTags: [...new Set(documents.flatMap(doc => doc.tags))].length,
    problematicDocuments: documents.filter(doc => ['failed', 'pending'].includes(doc.status)).length
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
      await fetchDocuments({ page: 1, size: 6, status: 'all' });
    } catch (error) {
      console.error('文档删除失败:', error);
      throw error;
    }
  };

  // 处理批量删除
  const handleBatchDeleteDocuments = async (ids: string[]) => {
    try {
      await batchDeleteDocuments(ids);
      await fetchDocuments({ page: 1, size: 6, status: 'all' });
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
    fetchDocuments({ page: pagination.current, size: 6, status: 'all' });
  };

  // 处理任务错误
  const handleTaskError = (taskId: string, error?: string) => {
    message.error(`任务失败: ${error}`);
    fetchDocuments({ page: pagination.current, size: 6, status: 'all' });
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

  // 获取全局统计数据
  const fetchGlobalStats = async () => {
    try {
      setStatsLoading(true);
      const response = await knowledgeService.getDocumentStatusStatistics();
      
      if (response.success) {
        const { document_status, problematic_documents } = response.statistics;
        
        setGlobalStats({
          totalDocuments: Object.values(document_status).reduce((sum: number, count: number) => sum + count, 0),
          vectorizedDocuments: document_status.vectorized || 0,
          failedDocuments: problematic_documents.failed || 0,
          pendingDocuments: problematic_documents.pending || 0,
          totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
          activeTags: [...new Set(documents.flatMap(doc => doc.tags))].length
        });
      }
    } catch (error) {
      console.error('获取全局统计失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 页面初始化
  useEffect(() => {
    checkStorageHealth();
    fetchCollections();
    fetchGlobalStats();
  }, []);

  // 当选择了Collection时，获取对应的文档
  useEffect(() => {
    if (selectedCollectionId && currentView === 'documents') {
      console.log('📁 加载选中Collection的文档:', selectedCollectionId);
      fetchDocuments({ 
        page: 1, 
        size: 6,
        status: 'all',
        collection_id: selectedCollectionId
      });
    }
  }, [selectedCollectionId, currentView, fetchDocuments]);

  // 监听文档变化，刷新统计
  useEffect(() => {
    if (documents.length > 0) {
      fetchGlobalStats();
    }
  }, [documents.length]);

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
          <Tabs
            size="small"
            type="card"
            style={{ margin: 0 }}
            tabBarStyle={{ margin: 0, border: 'none' }}
            items={[
              {
                key: 'upload',
                label: (
                  <span 
                    onClick={() => setUploadModalVisible(true)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      cursor: 'pointer',
                      color: '#1890ff',
                      fontWeight: 500
                    }}
                  >
                    <UploadOutlined />
                    文件上传
                  </span>
                ),
                children: null
              },
              {
                key: 'queue-monitor',
                label: (
                  <span 
                    onClick={() => setQueueMonitorVisible(true)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      cursor: 'pointer',
                      color: '#52c41a',
                      fontWeight: 500
                    }}
                  >
                    <MonitorOutlined />
                    队列监控
                  </span>
                ),
                children: null
              }
            ]}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <CollectionContext.Provider value={collectionContextValue}>
      <div 
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
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextOutlined style={{ color: '#3b82f6' }} />
              <span>文档总数: <strong>{statsLoading ? '...' : stats.totalDocuments}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleOutlined style={{ color: '#10b981' }} />
              <span>已向量化: <strong>{statsLoading ? '...' : stats.vectorizedDocuments}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartOutlined style={{ color: '#f59e0b' }} />
              <span>存储大小: <strong>{formatFileSize(stats.totalSize)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      {currentView === 'collections' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CollectionManagementPage 
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
              <DocumentList
                documents={documents}
                selectedDocuments={selectedDocuments}
                onSelectDocuments={setSelectedDocuments}
                onDeleteDocument={handleDeleteDocument}
                onBatchDeleteDocuments={handleBatchDeleteDocuments}
                onVectorizeDocument={handleVectorizeDocument}
                onUpdateDocumentConfig={handleUpdateDocumentConfig}
                onRefresh={() => fetchDocuments({ page: 1, size: 6, status: 'all' })}
                onFilterChange={(filters) => {
                  fetchDocuments({
                    ...filters,
                    size: 6
                  });
                }}
                pagination={pagination}
                loading={isUploading}
              />
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
            <QADatasetPanel onUploadTrigger={() => {}} />
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
            height: 'calc(100vh - 200px)',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
              <RetrievalTest
                query={retrievalQuery}
                results={retrievalResults}
                loading={retrievalLoading}
                onQueryChange={setRetrievalQuery}
                onTest={(query, params) => testRetrieval(query, params)}
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
        onUpload={(files, metadata) => uploadDocuments(files, metadata, sessionId)}
        loading={isUploading}
      />

      {/* 任务状态恢复和SSE连接管理 */}
      <TaskStateRecovery
        sessionId={sessionId}
        onTaskComplete={handleTaskComplete}
        onTaskFailed={handleTaskError}
      />

      <SSEConnectionManager 
        sessionId={sessionId}
        onConnectionStatusChange={(status) => console.log('📡 KnowledgePage连接状态变化:', status)}
      />

      {/* 队列监控组件 */}
      <QueueMonitor
        visible={queueMonitorVisible}
        onClose={() => setQueueMonitorVisible(false)}
      />
      </div>
    </CollectionContext.Provider>
  );
};

export default KnowledgePageClean;