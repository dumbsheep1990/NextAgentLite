/**
 * 文档管理页面 - 从知识库页面拆分出的独立子页面
 */
import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Space, 
  Card, 
  Statistic, 
  Row, 
  Col,
  message 
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  ExperimentOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MonitorOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { 
  DocumentList, 
  DocumentTreeView,
  UploadModal
} from '../../components/knowledge';
import { FolderTreeView } from '../../components/knowledge/FolderTreeView';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useAppStore } from '../../stores/appStore';
import ResourceStatusIndicator from '../../components/common/ResourceStatusIndicator';
import { TaskStateRecovery } from '../../components/common/TaskStateRecovery';
import QueueMonitor from '../../components/common/QueueMonitor';
import { knowledgeService } from '../../services/knowledgeService';
import { folderService } from '../../services/folderService';
import type { FolderInfo } from '../../services/folderService';

const DocumentManagementPage: React.FC = () => {
  // 硬编码的知识库ID - 应该从路由参数或上下文获取
  const COLLECTION_ID = "d8fc64d5-22d5-46d3-8843-e0e7aeb6b2b3";
  
  const [queueMonitorVisible, setQueueMonitorVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);
  const [folderTreeVisible, setFolderTreeVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  // 知识库切分配置状态
  const [collectionChunkingConfig, setCollectionChunkingConfig] = useState<any>(null);
  // 添加全局统计状态
  const [globalStats, setGlobalStats] = useState({
    totalDocuments: 0,
    vectorizedDocuments: 0,
    failedDocuments: 0,
    pendingDocuments: 0,
    totalSize: 0,
    activeTags: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // 使用持久化的sessionId，避免页面刷新时重新生成
  const [sessionId] = useState(() => {
    // 检查是否有缓存的sessionId
    const cachedSessionId = sessionStorage.getItem('knowledge-session-id');
    if (cachedSessionId) {
      return cachedSessionId;
    }
    
    // 生成新的sessionId并缓存
    const newSessionId = `knowledge-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('knowledge-session-id', newSessionId);
    return newSessionId;
  });
  
  const {
    // 数据状态
    documents,
    selectedDocuments,
    pagination,
    
    // UI状态
    uploadModalVisible,
    isUploading,
    
    // Actions
    setSelectedDocuments,
    deleteDocument,
    batchDeleteDocuments,
    updateDocument,
    setUploadModalVisible,
    uploadDocuments,
    vectorizeDocuments,
    fetchDocuments
  } = useKnowledgeStore();

  // 存储相关状态
  const {
    storageConfig,
    storageStatus,
    checkStorageHealth
  } = useAppStore();

  // 统计数据 - 使用全局统计优先，回退到本地统计
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
      // 删除成功后刷新文档列表
      await fetchCollectionDocuments({ page: 1, size: 6, status: 'all' });
    } catch (error) {
      console.error('文档删除失败:', error);
      throw error; // 重新抛出错误让DocumentList处理
    }
  };

  // 处理批量删除
  const handleBatchDeleteDocuments = async (ids: string[]) => {
    try {
      await batchDeleteDocuments(ids);
      // 删除成功后刷新文档列表
      await fetchCollectionDocuments({ page: 1, size: 6, status: 'all' });
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error; // 重新抛出错误让DocumentList处理
    }
  };

  // 处理向量化
  const handleVectorizeDocument = async (id: string, config?: any) => {
    try {
      console.log('🔧 DocumentManagementPage: 开始向量化文档', { id, config });
      
      // 通过config参数传递sessionId
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
    console.log('📝 任务完成:', { taskId, result });
    message.success(`任务完成: ${result.stage || '处理完成'}`);
    
    // 刷新文档列表以获取最新状态，保持当前页面
    fetchCollectionDocuments({ page: pagination.current, size: 6, status: 'all' });
  };

  // 处理任务错误
  const handleTaskError = (taskId: string, error?: string) => {
    console.error('❌ 任务失败:', { taskId, error });
    message.error(`任务失败: ${error}`);
    
    // 刷新文档列表以获取最新状态，保持当前页面
    fetchCollectionDocuments({ page: pagination.current, size: 6, status: 'all' });
  };

  // 处理文档配置更新
  const handleUpdateDocumentConfig = (documentId: string, config: any) => {
    console.log('📝 DocumentManagementPage: 更新文档配置', { documentId, config });
    
    // 立即更新文档的vectorConfig以供前端显示
    updateDocument(documentId, {
      vectorConfig: config
    });
    
    console.log('✅ DocumentManagementPage: 文档配置已更新');
  };

  // 创建带有collectionId的fetchDocuments辅助函数
  const fetchCollectionDocuments = (params?: any) => {
    return fetchDocuments({
      ...params,
      collectionId: COLLECTION_ID
    });
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
          totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0), // 暂时使用本地数据
          activeTags: [...new Set(documents.flatMap(doc => doc.tags))].length // 暂时使用本地数据
        });
        
        console.log('✅ 成功获取全局统计数据:', response.statistics);
      }
    } catch (error) {
      console.error('❌ 获取全局统计失败:', error);
      // 失败时使用本地数据，已在stats计算中处理
    } finally {
      setStatsLoading(false);
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = (folderId: string, folder: FolderInfo) => {
    console.log('选择文件夹:', folder);
    setSelectedFolder(folder);
    // 根据选择的文件夹过滤文档
    fetchCollectionDocuments({
      page: 1,
      size: 6,
      status: 'all',
      folderId: folderId
    });
  };

  // 处理文件夹更新（创建、重命名、删除后的回调）
  const handleFolderUpdate = () => {
    console.log('文件夹已更新，刷新文档列表');
    // 刷新当前文件夹的文档列表
    if (selectedFolder) {
      fetchCollectionDocuments({
        page: 1,
        size: 6,
        status: 'all',
        folderId: selectedFolder.id
      });
    } else {
      fetchCollectionDocuments({
        page: 1,
        size: 6,
        status: 'all'
      });
    }
    // 同时刷新统计信息
    fetchGlobalStats();
  };

  // 页面初始化时检查存储状态和获取文档列表
  useEffect(() => {
    checkStorageHealth();
    // 获取所有状态的文档，增加每页数量
    fetchCollectionDocuments({ 
      page: 1, 
      size: 6, // 每页6个文档
      status: 'all' // 显示所有状态的文档
    });
    // 获取全局统计
    fetchGlobalStats();
  }, []);

  // 监听文档变化，刷新统计
  useEffect(() => {
    if (documents.length > 0) {
      fetchGlobalStats();
    }
  }, [documents.length]);

  // 监听来自Layout的事件
  useEffect(() => {
    const handleClearStores = () => {
      console.log('🧹 DocumentManagementPage: 收到清理事件，重置知识库状态');
      const knowledgeStore = useKnowledgeStore.getState();
      if (knowledgeStore.resetAllState) {
        knowledgeStore.resetAllState();
      }
    };

    const handleOpenQueueMonitor = () => {
      setQueueMonitorVisible(true);
    };

    const handleRefreshDocuments = () => {
      fetchCollectionDocuments({ page: 1, size: 6, status: 'all' });
      fetchGlobalStats();
    };

    window.addEventListener('clear-all-stores', handleClearStores);
    window.addEventListener('open-queue-monitor', handleOpenQueueMonitor);
    window.addEventListener('refresh-documents', handleRefreshDocuments);
    
    return () => {
      window.removeEventListener('clear-all-stores', handleClearStores);
      window.removeEventListener('open-queue-monitor', handleOpenQueueMonitor);
      window.removeEventListener('refresh-documents', handleRefreshDocuments);
    };
  }, []);

  // 获取知识库切分配置
  useEffect(() => {
    const fetchCollectionConfig = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/collections/${COLLECTION_ID}/chunking-config`);
        if (response.ok) {
          const apiResponse = await response.json();
          console.log('🔍 DocumentManagementPage获取知识库配置:', apiResponse);
          
          if (apiResponse.success && apiResponse.data) {
            setCollectionChunkingConfig(apiResponse.data);
          }
        }
      } catch (error) {
        console.error('获取知识库配置失败:', error);
      }
    };
    
    fetchCollectionConfig();
  }, []);

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        padding: '0',
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '1200px',
        overflowX: 'auto'
      }}
    >

      {/* 统计卡片区域 */}
      <div style={{ padding: '16px', marginBottom: '8px', minWidth: '1200px', overflowX: 'auto' }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px'
          }}
        >
          {/* 文档总数卡片 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.borderColor = '#e0e7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = '#f1f5f9';
          }}>
            {/* 装饰性渐变背景 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
              borderRadius: '0 12px 0 20px'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                }}>
                  <FileTextOutlined style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    文档总数
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    lineHeight: '1'
                  }}>
                    {statsLoading ? '...' : stats.totalDocuments}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 已向量化卡片 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.1)';
            e.currentTarget.style.borderColor = '#d1fae5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = '#f1f5f9';
          }}>
            {/* 装饰性渐变背景 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))',
              borderRadius: '0 12px 0 20px'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                }}>
                  <ExperimentOutlined style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    已向量化
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    lineHeight: '1'
                  }}>
                    {statsLoading ? '...' : stats.vectorizedDocuments}
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#64748b', 
                      marginLeft: '6px',
                      fontWeight: 500
                    }}>
                      / {stats.totalDocuments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 存储大小卡片 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15), 0 0 0 1px rgba(245, 158, 11, 0.1)';
            e.currentTarget.style.borderColor = '#fef3c7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = '#f1f5f9';
          }}>
            {/* 装饰性渐变背景 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))',
              borderRadius: '0 12px 0 20px'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)'
                }}>
                  <BarChartOutlined style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    存储大小
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    lineHeight: '1'
                  }}>
                    {statsLoading ? '...' : formatFileSize(stats.totalSize)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 活跃标签卡片 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)';
            e.currentTarget.style.borderColor = '#e9d5ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = '#f1f5f9';
          }}>
            {/* 装饰性渐变背景 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02))',
              borderRadius: '0 12px 0 20px'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)'
                }}>
                  <FileTextOutlined style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    活跃标签
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    lineHeight: '1'
                  }}>
                    {statsLoading ? '...' : stats.activeTags}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 存储状态卡片 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px 20px',
            border: `1px solid ${storageStatus === 'healthy' ? '#d1fae5' : 
                   storageStatus === 'error' ? '#fee2e2' : '#f1f5f9'}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={checkStorageHealth}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            const hoverColor = storageStatus === 'healthy' ? 'rgba(16, 185, 129, 0.15)' : 
                              storageStatus === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${hoverColor}, 0 0 0 1px ${hoverColor.replace('0.15', '0.1')}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)';
          }}>
            {/* 装饰性渐变背景 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background: `linear-gradient(135deg, ${
                storageStatus === 'healthy' ? 'rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02)' :
                storageStatus === 'error' ? 'rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02)' :
                'rgba(148, 163, 184, 0.05), rgba(148, 163, 184, 0.02)'
              })`,
              borderRadius: '0 12px 0 20px'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: storageConfig.type === 'minio' ? 
                    'linear-gradient(135deg, #06b6d4, #0891b2)' : 
                    'linear-gradient(135deg, #84cc16, #65a30d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  boxShadow: `0 4px 8px ${storageConfig.type === 'minio' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(132, 204, 22, 0.3)'}`
                }}>
                  {storageConfig.type === 'minio' ? (
                    <CloudServerOutlined style={{ color: 'white', fontSize: '20px' }} />
                  ) : (
                    <FolderOutlined style={{ color: 'white', fontSize: '20px' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    存储服务
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    lineHeight: '1'
                  }}>
                    {storageConfig.type === 'minio' ? 'MinIO' : '本地存储'}
                  </div>
                </div>
                <div style={{ marginLeft: '8px' }}>
                  {storageStatus === 'checking' && (
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '2px solid #f59e0b', 
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {storageStatus === 'healthy' && (
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: '20px' }} />
                  )}
                  {storageStatus === 'error' && (
                    <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: '20px' }} />
                  )}
                  {storageStatus === null && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#94a3b8', 
                      textAlign: 'center',
                      fontWeight: 500,
                      padding: '4px'
                    }}>
                      点击<br/>检查
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 文件夹树和文档列表 */}
      <div style={{ 
        padding: '0 16px 16px 16px', 
        flex: 1, 
        display: 'flex', 
        gap: '16px',
        minWidth: '1200px' 
      }}>
        {/* 文件夹树侧边栏 */}
        {folderTreeVisible && (
          <Card 
            style={{
              width: '300px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              minHeight: '400px'
            }}
            styles={{ body: { padding: '16px' } }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><FolderOutlined /> 文件夹</span>
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => setFolderTreeVisible(false)}
                >隐藏</Button>
              </div>
            }
          >
            <FolderTreeView
              collectionId="default" // TODO: 从context获取当前collection
              selectedFolderId={selectedFolder?.id}
              onFolderSelect={handleFolderSelect}
              onFolderUpdate={handleFolderUpdate}
              showDocumentCount={true}
              allowEdit={true}
            />
          </Card>
        )}

        {/* 文档列表主要内容区域 */}
        <Card 
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          styles={{
            body: {
              padding: '24px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileTextOutlined />
                <span>文档管理</span>
                {selectedFolder && (
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    - {selectedFolder.name}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!folderTreeVisible && (
                  <Button 
                    type="text" 
                    size="small"
                    icon={<FolderOutlined />}
                    onClick={() => setFolderTreeVisible(true)}
                  >
                    显示文件夹
                  </Button>
                )}
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                >
                  上传文档
                </Button>
                <Button 
                  icon={<MonitorOutlined />}
                  onClick={() => setQueueMonitorVisible(true)}
                >
                  任务监控
                </Button>
                <Button.Group style={{ marginLeft: '8px' }}>
                  <Button 
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode('list')}
                    size="middle"
                  >
                    列表
                  </Button>
                  <Button 
                    type={viewMode === 'tree' ? 'primary' : 'default'}
                    icon={<ApartmentOutlined />}
                    onClick={() => setViewMode('tree')}
                    size="middle"
                  >
                    树形
                  </Button>
                </Button.Group>
              </div>
            </div>
          }
        >
          {/* 文档展示区域 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {viewMode === 'list' ? (
              <DocumentList
                documents={documents}
                selectedDocuments={selectedDocuments}
                onSelectDocuments={setSelectedDocuments}
                onDeleteDocument={handleDeleteDocument}
                onBatchDeleteDocuments={handleBatchDeleteDocuments}
                onVectorizeDocument={handleVectorizeDocument}
                onUpdateDocumentConfig={handleUpdateDocumentConfig}
                collectionChunkingConfig={collectionChunkingConfig}
                onRefresh={() => {
                  if (selectedFolder) {
                    fetchCollectionDocuments({ page: 1, size: 6, status: 'all', folderId: selectedFolder.id });
                  } else {
                    fetchCollectionDocuments({ page: 1, size: 6, status: 'all' });
                  }
                }}
                onFilterChange={(filters) => {
                  console.log('📋 应用文档过滤器:', filters);
                  fetchCollectionDocuments({
                    ...filters,
                    size: 6, // 确保分页大小为6
                    ...(selectedFolder && { folderId: selectedFolder.id })
                  });
                }}
                pagination={pagination}
                loading={isUploading}
                hideExtraButtons={true} // 隐藏原有的额外按钮，已移到标题栏
              />
            ) : (
              <DocumentTreeView
                collectionId={COLLECTION_ID}
                onDocumentSelect={(doc) => {
                  console.log('选择文档:', doc);
                  // TODO: 可以实现文档详情预览
                }}
                onDocumentAction={(action, documentId) => {
                  console.log('文档操作:', action, documentId);
                  switch (action) {
                    case 'delete':
                      handleDeleteDocument(documentId);
                      break;
                    case 'vectorize':
                      handleVectorizeDocument(documentId);
                      break;
                    case 'config':
                      // TODO: 实现配置管理
                      break;
                  }
                }}
                onFolderAction={(action, folderId) => {
                  console.log('文件夹操作:', action, folderId);
                  // TODO: 实现文件夹操作
                }}
                showActions={true}
                height={500}
                refreshTrigger={selectedFolder?.id ? 1 : 0} // 当文件夹变化时刷新
              />
            )}
          </div>
        </Card>
      </div>

      {/* 上传Modal */}
      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={(files, urls, metadata) => {
          // 为每个文件的metadata添加folderId
          const enrichedMetadata = metadata?.map(meta => ({
            ...meta,
            folderId: selectedFolder?.id
          }));
          return uploadDocuments(files, urls, enrichedMetadata, sessionId);
        }}
        loading={isUploading}
        selectedFolder={selectedFolder}
        collectionId="d8fc64d5-22d5-46d3-8843-e0e7aeb6b2b3"
      />

      {/* 任务状态恢复组件 - 完全基于SSE事件驱动 */}
      <TaskStateRecovery
        sessionId={sessionId}
        onTaskComplete={handleTaskComplete}
        onTaskFailed={handleTaskError}
      />

      {/* 全局Layout已经管理SSE连接，此处不再重复 */}

      {/* 队列监控组件 */}
      <QueueMonitor
        visible={queueMonitorVisible}
        onClose={() => setQueueMonitorVisible(false)}
      />
    </div>
  );
};

export default DocumentManagementPage; 