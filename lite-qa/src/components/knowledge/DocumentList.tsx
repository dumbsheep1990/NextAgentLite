/**
 * 知识库文档列表组件
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// 自定义下拉菜单样式
const dropdownStyles = `
  .clean-documents-dropdown .ant-dropdown-menu {
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid #f0f0f0;
    padding: 8px 4px;
    min-width: 240px;
    background: #fff;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item {
    border-radius: 6px;
    margin: 2px 0;
    padding: 6px 8px;
    transition: all 0.2s ease;
    line-height: 1.4;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item:hover {
    background: transparent !important;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item-disabled {
    color: rgba(0, 0, 0, 0.25) !important;
    opacity: 0.5;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item-disabled:hover {
    background: transparent !important;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item-divider {
    margin: 8px 0;
    background: #f0f0f0;
    height: 1px;
  }
  
  .clean-documents-dropdown .ant-dropdown-menu-item .ant-popconfirm-arrow {
    display: none;
  }
`;

// 将样式注入到页面
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('clean-documents-dropdown-styles');
  if (!styleElement) {
    const style = document.createElement('style');
    style.id = 'clean-documents-dropdown-styles';
    style.textContent = dropdownStyles;
    document.head.appendChild(style);
  }
}
import { 
  Table, 
  Button, 
  Tag, 
  Progress, 
  Space, 
  Tooltip, 
  Modal, 
  Input, 
  Select,
  DatePicker,
  Checkbox,
  message,
  Popconfirm,
  Dropdown
} from 'antd';
import { 
  FileTextOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  SettingOutlined,
  BlockOutlined,
  RedoOutlined,
  ClockCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined as PendingIcon,
  WarningOutlined,
  ClearOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { KnowledgeDocument } from '../../types';
import { VectorizeConfigModal, type VectorizeConfig } from './VectorizeConfigModal';
import { formatTime } from '../../utils/timeUtils';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';
import { knowledgeService } from '../../services/knowledgeService';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DocumentListProps {
  documents: KnowledgeDocument[];
  selectedDocuments: string[];
  onSelectDocuments: (ids: string[]) => void;
  onDeleteDocument: (id: string) => void;
  onBatchDeleteDocuments?: (ids: string[]) => Promise<void>;
  onVectorizeDocument: (id: string, config?: VectorizeConfig) => void;
  onUpdateDocumentConfig?: (documentId: string, config: VectorizeConfig) => void;
  loading?: boolean;
  onRefresh?: () => void;
  onFilterChange?: (filters: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  defaultVectorConfig?: VectorizeConfig;
  extraButtons?: React.ReactNode; // 新增额外按钮prop
  hideExtraButtons?: boolean; // 新增隐藏额外按钮prop
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocuments,
  onSelectDocuments,
  onDeleteDocument,
  onBatchDeleteDocuments,
  onVectorizeDocument,
  onUpdateDocumentConfig,
  loading = false,
  onRefresh,
  onFilterChange,
  pagination,
  defaultVectorConfig,
  extraButtons,
  hideExtraButtons = false
}) => {
  const [localDocuments, setLocalDocuments] = useState(documents);
  const { getDefaultChunkingConfig, getChunkingConfigById, chunkingConfigs } = useGlobalResourceStore();
  
  // 状态持久化键
  const DOCUMENT_STATUS_KEY = 'mat-qa-document-status';

  // 保存文档状态到localStorage
  const saveDocumentStatus = (docs: KnowledgeDocument[]) => {
    try {
      const statusMap = docs.reduce((acc, doc) => {
        if (doc.status === 'processing' || doc.vectorStatus) {
          acc[doc.id] = {
            status: doc.status,
            processing_progress: doc.processing_progress,
            vectorStatus: doc.vectorStatus,
            vectorization_status: doc.vectorization_status,
            lastUpdate: Date.now()
          };
        }
        return acc;
      }, {} as Record<string, any>);
      
      localStorage.setItem(DOCUMENT_STATUS_KEY, JSON.stringify(statusMap));
    } catch (error) {
      console.error('保存文档状态失败:', error);
    }
  };

  // 从localStorage恢复文档状态
  const restoreDocumentStatus = (docs: KnowledgeDocument[]) => {
    try {
      const savedStatus = localStorage.getItem(DOCUMENT_STATUS_KEY);
      if (!savedStatus) return docs;
      
      const statusMap = JSON.parse(savedStatus);
      const now = Date.now();
      
      return docs.map(doc => {
        const saved = statusMap[doc.id];
        if (saved) {
          // 如果状态保存时间超过10分钟，则忽略（防止过期状态）
          if (now - saved.lastUpdate > 10 * 60 * 1000) {
            return doc;
          }
          
          // 恢复处理状态
          if (saved.status === 'processing' && doc.status !== 'vectorized') {
            return {
              ...doc,
              status: saved.status,
              processing_progress: saved.processing_progress,
              vectorStatus: saved.vectorStatus,
              vectorization_status: saved.vectorization_status
            };
          }
        }
        return doc;
      });
    } catch (error) {
      console.error('恢复文档状态失败:', error);
      return docs;
    }
  };

  // 同步外部documents到本地状态
  useEffect(() => {
    const restoredDocuments = restoreDocumentStatus(documents);
    setLocalDocuments(restoredDocuments);
  }, [documents]);

  // 监听SSE事件来更新文档处理进度
  useEffect(() => {
    const handleSSEMessage = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📄 DocumentList收到SSE消息:', data);

      // 处理文档处理进度更新
      if (data.type === 'task_progress_update') {
        const { task_id, document_id, data: progressData } = data;
        
        // 从progressData中获取document_id（如果直接的document_id不存在）
        const docId = document_id || progressData?.document_id;
        
        if (docId) {
          console.log('📄 更新文档进度:', { document_id: docId, progressData });
          
          setLocalDocuments(prev => {
            const updatedDocs = prev.map(doc => {
              if (doc.id === docId) {
                // 从stage描述中提取分块信息
                const stage = progressData.stage || '';
                let chunks = doc.vectorStatus?.chunks || 0;
                let chunksCompleted = doc.vectorStatus?.chunksCompleted || 0;
                
                // 解析分块信息
                const chunkMatch = stage.match(/(\d+)个分块/);
                if (chunkMatch) {
                  chunks = parseInt(chunkMatch[1]);
                }
                
                // 从不同阶段判断当前处理状态
                let currentPhase = 'pending';
                if (stage.includes('分块')) {
                  currentPhase = 'chunking';
                } else if (stage.includes('向量化')) {
                  currentPhase = 'vectorizing';
                } else if (stage.includes('完成')) {
                  currentPhase = 'completed';
                }
                
                return {
                  ...doc,
                  processing_progress: progressData.progress || 0,
                  status: progressData.status === 'completed' ? 'vectorized' as const : 'processing' as const,
                  vectorization_status: 'processing' as const,
                  vectorStatus: {
                    progress: progressData.progress || 0,
                    chunks: Math.max(progressData.total_chunks || chunks, chunks),
                    chunksCompleted: progressData.current_chunk || chunksCompleted,
                    currentPhase: currentPhase as "pending" | "chunking" | "vectorizing" | "completed",
                    vectorizationProgress: progressData.current_chunk && progressData.total_chunks ? 
                      `${progressData.current_chunk}/${progressData.total_chunks}` : undefined,
                    ...doc.vectorStatus
                  }
                };
              }
              return doc;
            });
            
            // 保存状态到localStorage
            saveDocumentStatus(updatedDocs);
            return updatedDocs;
          });
        }
      }
      // 处理文档处理完成
      else if (data.type === 'task_completed') {
        const { document_id, data: completedData } = data;
        
        // 从completedData中获取document_id（如果直接的document_id不存在）
        const docId = document_id || completedData?.document_id;
        
        if (docId) {
          console.log('📄 文档处理完成:', docId);
          
          setLocalDocuments(prev => {
            const updatedDocs = prev.map(doc => {
              if (doc.id === docId) {
                return {
                  ...doc,
                  processing_progress: 100,
                  status: 'vectorized' as const,
                  vectorized: true,
                  vectorization_status: 'completed' as const,
                  vectorStatus: {
                    progress: 100,
                    chunks: doc.vectorStatus?.chunks || 0,
                    currentPhase: 'completed' as const,
                    ...doc.vectorStatus
                  }
                };
              }
              return doc;
            });
            
            // 保存状态到localStorage
            saveDocumentStatus(updatedDocs);
            return updatedDocs;
          });
        }
      }
      // 处理文档处理失败
      else if (data.type === 'task_failed') {
        const { document_id, data: errorData } = data;
        
        // 从errorData中获取document_id（如果直接的document_id不存在）
        const docId = document_id || errorData?.document_id;
        
        if (docId) {
          console.log('📄 文档处理失败:', docId, errorData);
          
          setLocalDocuments(prev => {
            const updatedDocs = prev.map(doc => {
              if (doc.id === docId) {
                return {
                  ...doc,
                  processing_progress: 0,
                  status: 'failed' as const,
                  vectorized: false,
                  vectorization_status: 'failed' as const,
                  error_message: errorData?.error || '处理失败'
                };
              }
              return doc;
            });
            
            // 保存状态到localStorage
            saveDocumentStatus(updatedDocs);
            return updatedDocs;
          });
        }
      }
    };

    window.addEventListener('sse-message', handleSSEMessage as EventListener);
    
    return () => {
      window.removeEventListener('sse-message', handleSSEMessage as EventListener);
    };
  }, []);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [vectorizeModalVisible, setVectorizeModalVisible] = useState(false);
  const [documentToVectorize, setDocumentToVectorize] = useState<KnowledgeDocument | null>(null);
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [deletingFailedDocs, setDeletingFailedDocs] = useState(false);
  const [deletingPendingDocs, setDeletingPendingDocs] = useState(false);
  
  // 全局文档状态统计（整个知识库的统计，不只是当前页面）
  const [globalDocumentCounts, setGlobalDocumentCounts] = useState({
    failed: 0,
    pending: 0,
    problematic: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // 获取全局文档状态统计
  const fetchGlobalStatistics = useCallback(async () => {
    try {
      console.log('🔄 开始获取全局文档统计...');
      setStatisticsLoading(true);
      const response = await knowledgeService.getDocumentStatusStatistics();
      
      if (response.success) {
        const { problematic_documents } = response.statistics;
        console.log('✅ 成功获取全局统计 - API响应:', response);
        setGlobalDocumentCounts({
          failed: problematic_documents.failed,
          pending: problematic_documents.pending,
          problematic: problematic_documents.total
        });
        console.log('📊 已更新全局文档统计:', {
          failed: problematic_documents.failed,
          pending: problematic_documents.pending,
          total: problematic_documents.total
        });
      } else {
        console.warn('⚠️ API返回失败:', response);
        throw new Error('API返回success=false');
      }
    } catch (error) {
      console.error('❌ 获取全局文档统计失败:', error);
      console.log('🔄 回退到本地统计（当前页面数据）');
      // 如果获取失败，回退到本地统计
      const failed = localDocuments.filter(doc => doc.status === 'failed').length;
      const pending = localDocuments.filter(doc => doc.status === 'pending').length;
      const problematic = failed + pending;
      setGlobalDocumentCounts({ failed, pending, problematic });
      console.log('📊 本地统计结果:', { failed, pending, problematic });
    } finally {
      setStatisticsLoading(false);
    }
  }, [localDocuments]);

  // 初始化时获取统计
  useEffect(() => {
    fetchGlobalStatistics();
  }, [fetchGlobalStatistics]);

  // 当本地文档列表数量变化时，延迟更新统计（避免频繁请求）
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGlobalStatistics();
    }, 2000); // 增加延迟时间，减少请求频率
    
    return () => clearTimeout(timer);
  }, [localDocuments.length, fetchGlobalStatistics]);

  // 使用全局统计作为文档数量（整个知识库的统计，确保清理操作的数据准确性）
  const documentCounts = globalDocumentCounts;

  // 按钮固定显示，不依赖当前页面是否有失败文档
  const shouldShowDeleteFailedButton = true;
  const [chunksPreviewVisible, setChunksPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<KnowledgeDocument | null>(null);
  const [documentChunks, setDocumentChunks] = useState<any[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  
  // 过滤器状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 处理文档详情查看
  const handleViewDocument = (document: KnowledgeDocument) => {
    setSelectedDocument(document);
    setDetailModalVisible(true);
  };

  // 处理文档删除
  const handleDeleteDocument = async (id: string) => {
    try {
      // 添加到删除中状态
      setDeletingDocuments(prev => new Set([...prev, id]));
      
      // 调用删除API
      await onDeleteDocument(id);
      
      message.success('文档删除成功');
    } catch (error) {
      message.error('文档删除失败');
    } finally {
      // 移除删除中状态
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 处理向量化
  const handleVectorizeDocument = (id: string) => {
    onVectorizeDocument(id);
    message.success('开始向量化处理');
  };

  // 处理删除失败文档（删除所有失败文档，不仅是当前页面）
  const handleDeleteFailedDocuments = async () => {
    try {
      setDeletingFailedDocs(true);
      
      console.log('🔍 开始获取所有失败文档...');
      
      // 获取所有失败状态的文档（分批获取）
      let allFailedDocuments = [];
      let currentPage = 1;
      const pageSize = 50; // 使用后端允许的最大限制
      let hasMore = true;
      
      while (hasMore) {
        const response = await knowledgeService.getDocuments({
          page: currentPage,
          size: pageSize,
          status: 'failed'
        });
        
        allFailedDocuments.push(...response.documents);
        
        // 检查是否还有更多数据
        hasMore = response.documents.length === pageSize && currentPage < response.totalPages;
        currentPage++;
        
        console.log(`📄 已获取第 ${currentPage - 1} 页失败文档: ${response.documents.length} 个`);
      }
      
      console.log(`📋 总共获取到失败文档: ${allFailedDocuments.length} 个`);
      
      if (allFailedDocuments.length === 0) {
        message.info('没有找到失败的文档');
        return;
      }
      
      const failedDocumentIds = allFailedDocuments.map(doc => doc.id);
      
      if (onBatchDeleteDocuments) {
        await onBatchDeleteDocuments(failedDocumentIds);
        message.success(`成功删除 ${allFailedDocuments.length} 个失败文档`);
      } else {
        // 如果没有批量删除函数，逐个删除
        let deletedCount = 0;
        for (const doc of allFailedDocuments) {
          try {
            await onDeleteDocument(doc.id);
            deletedCount++;
          } catch (error) {
            console.error(`删除文档 ${doc.id} 失败:`, error);
          }
        }
        message.success(`成功删除 ${deletedCount} 个失败文档`);
      }
      
      // 刷新列表和统计
      if (onRefresh) {
        onRefresh();
      }
      
      // 立即更新全局统计
      await fetchGlobalStatistics();
      
    } catch (error) {
      message.error('删除失败文档时出错');
      console.error('删除失败文档失败:', error);
    } finally {
      setDeletingFailedDocs(false);
    }
  };

  // 处理删除队列等待文档（删除所有pending状态的文档）
  const handleDeletePendingDocuments = async () => {
    try {
      setDeletingPendingDocs(true);
      
      console.log('🔍 开始清理队列等待文档...');
      
      // 直接调用后端的清理API
      const result = await knowledgeService.clearPendingDocuments();
      
      console.log('✅ 清理队列等待文档完成:', result);
      
      if (result.deleted_count > 0) {
        message.success(
          `成功清理整个知识库中 ${result.deleted_count} 个队列等待文档\n` +
          `清理详情: PG文档(${result.cleaned_data.postgres_documents}) | ` +
          `PG分块(${result.cleaned_data.postgres_chunks}) | ` +
          `ES索引(${result.cleaned_data.elasticsearch_documents}) | ` +
          `任务队列(${result.cleaned_data.task_queue_records})`
        );
      } else {
        message.info(result.message);
      }
      
      // 刷新列表和统计
      if (onRefresh) {
        onRefresh();
      }
      
      // 立即更新全局统计
      await fetchGlobalStatistics();
      
    } catch (error) {
      message.error('清理队列等待文档时出错');
      console.error('清理队列等待文档失败:', error);
    } finally {
      setDeletingPendingDocs(false);
    }
  };

  // 处理删除所有问题文档（失败+队列等待）
  const handleDeleteAllProblematicDocuments = async () => {
    try {
      setDeletingFailedDocs(true);
      setDeletingPendingDocs(true);
      
      console.log('🔍 开始清理所有问题文档...');
      
      // 直接调用后端的清理API
      const result = await knowledgeService.clearProblematicDocuments();
      
      console.log('✅ 清理问题文档完成:', result);
      
      if (result.deleted_count > 0) {
        message.success(
          `成功清理整个知识库中 ${result.deleted_count} 个问题文档\n` +
          `文档类型: 失败(${result.breakdown.failed_documents}) | 等待(${result.breakdown.pending_documents})\n` +
          `清理详情: PG文档(${result.cleaned_data.postgres_documents}) | ` +
          `PG分块(${result.cleaned_data.postgres_chunks}) | ` +
          `ES索引(${result.cleaned_data.elasticsearch_documents}) | ` +
          `任务队列(${result.cleaned_data.task_queue_records})`
        );
      } else {
        message.info(result.message);
      }
      
      // 刷新列表和统计
      if (onRefresh) {
        onRefresh();
      }
      
      // 立即更新全局统计
      await fetchGlobalStatistics();
      
    } catch (error) {
      message.error('清理问题文档时出错');
      console.error('清理问题文档失败:', error);
    } finally {
      setDeletingFailedDocs(false);
      setDeletingPendingDocs(false);
    }
  };



  // 处理批量删除
  const handleBatchDelete = async () => {
    if (!onBatchDeleteDocuments || selectedDocuments.length === 0) {
      return;
    }

    try {
      setBatchDeleting(true);
      await onBatchDeleteDocuments(selectedDocuments);
      message.success(`成功删除 ${selectedDocuments.length} 个文档`);
    } catch (error) {
      message.error('批量删除失败');
      console.error('批量删除失败:', error);
    } finally {
      setBatchDeleting(false);
    }
  };

  // 获取文档分块数据
  const fetchDocumentChunks = async (documentId: string) => {
    try {
      setChunksLoading(true);
      
      const response = await fetch(`/api/v1/knowledge/documents/${documentId}/chunks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取分块数据失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setDocumentChunks(data.chunks || []);
      return data.chunks || [];
    } catch (error) {
      console.error('❌ 获取文档分块失败:', error);
      message.error('获取文档分块数据失败');
      setDocumentChunks([]);
      return [];
    } finally {
      setChunksLoading(false);
    }
  };

  // 处理预览分块
  const handlePreviewChunks = async (document: KnowledgeDocument) => {
    if (document.status !== 'vectorized' && !document.vectorized) {
      message.warning('文档尚未向量化，无法预览分块');
      return;
    }

    setPreviewDocument(document);
    setChunksPreviewVisible(true);
    
    // 获取分块数据
    await fetchDocumentChunks(document.id);
  };

  // 表格列定义
  const columns: ColumnsType<KnowledgeDocument> = [
    {
      title: '文档信息',
      key: 'info',
      width: 400,
      render: (_, document) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <FileTextOutlined className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {document.title}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              上传时间: {formatTime(document.uploadTime)}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '文件信息',
      key: 'file',
      width: 150,
      render: (_, document) => (
        <Tag color="blue">
          {document.fileType.toUpperCase()}
          <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.8 }}>
            {formatFileSize(document.fileSize)}
          </span>
        </Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <Tag key={tag} color="default">
              {tag}
            </Tag>
          ))}
          {tags.length > 3 && (
            <Tag color="default">
              +{tags.length - 3}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '切分策略',
      key: 'chunkingStrategy', 
      width: 150,
      render: (_, document) => {
        // 优先使用 metadata.vector_config，然后是 vectorConfig，最后尝试 processing_config
        const vectorConfig = (document.metadata as any)?.vector_config || document.vectorConfig;
        const chunkingConfigId = (document.metadata as any)?.processing_config?.chunking_config_id;
        
        // 统一的策略颜色映射
        const getStrategyColor = (strategy: string) => {
          const strategyColors: Record<string, string> = {
            'semantic': 'blue',
            'fixed': 'cyan',
            'sentence': 'orange',
            'paragraph': 'purple',
            'naive': 'green',
            'custom': 'orange'  // 自定义配置使用橙色
          };
          return strategyColors[strategy] || 'geekblue';
        };
        
        // 如果有 vectorConfig (文档已向量化或设置了配置)
        if (vectorConfig) {
          // 调试信息（仅在开发环境显示）
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 DocumentList 渲染切分策略:', {
              documentId: document.id,
              vectorConfig,
              configId: vectorConfig.configId,
              configName: vectorConfig.configName
            });
          }
          
          const strategy = vectorConfig.chunkingStrategy;
          const color = getStrategyColor(strategy);
          let configName = vectorConfig.configName;
          
          // 特殊处理自定义配置
          if (vectorConfig.isCustom || strategy === 'custom') {
            configName = '自定义配置';
            if (process.env.NODE_ENV === 'development') {
              console.log('🎯 使用自定义配置名称:', configName);
            }
          } else if (!configName && vectorConfig.configId) {
            // 如果没有配置名但有ID，尝试从全局store获取
            const config = getChunkingConfigById(vectorConfig.configId);
            configName = config?.name || '预设配置';
            if (process.env.NODE_ENV === 'development') {
              console.log('🔧 从store获取配置名称:', {
                configId: vectorConfig.configId,
                foundConfig: config,
                finalName: configName
              });
            }
          } else if (!configName) {
            // 兜底：尝试根据策略获取默认名称
            const defaultConfig = getDefaultChunkingConfig();
            if (defaultConfig && defaultConfig.strategy === strategy) {
              configName = defaultConfig.name;
            } else {
              configName = '预设配置';
            }
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ 使用兜底配置名称:', configName, vectorConfig);
            }
          }
          
          return (
            <Tag color={color}>
              {configName || '未知配置'}
              <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.8 }}>
                {vectorConfig.chunkSize}/{vectorConfig.chunkOverlap}
              </span>
            </Tag>
          );
        }
        
        // 如果有用户选择的配置ID
        if (chunkingConfigId) {
          const selectedConfig = getChunkingConfigById(chunkingConfigId);
          if (selectedConfig) {
            const color = getStrategyColor(selectedConfig.strategy);
            
            return (
              <Tag color={color}>
                {selectedConfig.name}
                <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.8 }}>
                  {selectedConfig.chunk_token_num}/{selectedConfig.chunk_overlap || 0}
                </span>
              </Tag>
            );
          }
        }
        
        // 使用默认配置
        const defaultConfig = getDefaultChunkingConfig();
        if (defaultConfig) {
          const color = getStrategyColor(defaultConfig.strategy);
          
          return (
            <Tag color={color}>
              {defaultConfig.name}
              <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.8 }}>
                {defaultConfig.chunk_token_num}/{defaultConfig.chunk_overlap}
              </span>
            </Tag>
          );
        }
        
        // 兜底显示
        return (
          <Tag color="default">
            未设置
          </Tag>
        );
      }
    },
    {
      title: '向量化状态',
      key: 'vectorized',
      width: 200,
      render: (_, document) => {
        if (document.vectorized) {
          return (
            <Tag color="success" icon={<ExperimentOutlined />}>
              已完成
            </Tag>
          );
        }
        
        // 队列状态显示
        if (document.status === 'pending') {
          return (
            <div>
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                队列等待中
              </Tag>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                等待处理...
              </div>
            </div>
          );
        }
        
        // 根据文档状态显示不同的向量化状态和进度
        if (document.status === 'processing') {
          const progress = document.processing_progress || 0;
          
          // 根据不同阶段显示不同的进度信息
          let progressLabel = `${progress}%`;
          let statusText = '处理中';
          let stageText = '';
          
          // 从当前阶段提取更多信息
          const vectorStatus = document.vectorStatus;
          if (vectorStatus) {
            // 设置分块信息显示
            if (vectorStatus.chunks > 0) {
              stageText = `${vectorStatus.chunks}个分块`;
            }
            
            // 处理双向量化进度
            if (vectorStatus.generalVector && vectorStatus.domainVector) {
              const generalProgress = vectorStatus.generalVector.progress || 0;
              const domainProgress = vectorStatus.domainVector.progress || 0;
              statusText = '双向量化中';
              progressLabel = `通用:${generalProgress}% 领域:${domainProgress}%`;
            }
            
            // 从currentPhase获取阶段信息
            if (vectorStatus.currentPhase) {
              switch (vectorStatus.currentPhase) {
                case 'chunking':
                  stageText = '分块中' + (vectorStatus.chunks > 0 ? ` (${vectorStatus.chunks}个)` : '');
                  break;
                case 'vectorizing':
                  stageText = '向量化中' + (vectorStatus.chunks > 0 ? ` (${vectorStatus.chunks}个)` : '');
                  break;
                case 'completed':
                  stageText = '完成';
                  break;
                default:
                  if (vectorStatus.currentPhase !== 'pending') {
                    stageText = vectorStatus.currentPhase;
                  }
              }
            }
          }
          
          // 紧凑的水平布局
          return (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Tag color="processing" style={{ margin: 0 }}>
                  {statusText}
                </Tag>
                {stageText && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {stageText}
                  </span>
                )}
              </div>
              <Progress 
                percent={progress} 
                size="small" 
                status="active"
                format={() => progressLabel}
                style={{ marginBottom: 0 }}
              />
              {/* 显示详细信息 */}
              {vectorStatus && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                  {vectorStatus.chunks > 0 && `${vectorStatus.chunks}个分块`}
                  {(vectorStatus.chunksCompleted || 0) > 0 && vectorStatus.chunks > 0 && (
                    <span style={{ marginLeft: 8 }}>
                      已处理: {vectorStatus.chunksCompleted}/{vectorStatus.chunks}
                    </span>
                  )}
                  {vectorStatus.vectorizationProgress && (
                    <span style={{ marginLeft: 8 }}>
                      {vectorStatus.vectorizationProgress}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }
        
        if (document.status === 'failed') {
          return (
            <Tag color="error">
              处理失败
            </Tag>
          );
        }
        
        return (
          <Tag color="default">
            未处理
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 220, // 增加操作列宽度，确保删除loading状态时不会挤压
      fixed: 'right', // 固定操作列，防止滚动时看不到操作按钮
      render: (_, document) => (
        <Space size="small" className="document-action-buttons">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDocument(document)}
            />
          </Tooltip>
          
          {!document.vectorized && (
            <Tooltip title="向量化配置">
              <Button 
                type="text" 
                size="small"
                icon={<SettingOutlined />}
                onClick={() => {
                  setDocumentToVectorize(document);
                  setVectorizeModalVisible(true);
                }}
              />
            </Tooltip>
          )}

          {document.vectorized && (
            <Tooltip title="预览分块">
              <Button 
                type="text" 
                size="small"
                icon={<BlockOutlined />}
                onClick={() => handlePreviewChunks(document)}
              />
            </Tooltip>
          )}
          
          {document.vectorized && (
            <Tooltip title="重新向量化">
              <Button 
                type="text" 
                size="small"
                icon={<RedoOutlined />}
                onClick={() => {
                  setDocumentToVectorize(document);
                  setVectorizeModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          
          <Popconfirm
            title="确定要删除这个文档吗？"
            onConfirm={() => handleDeleteDocument(document.id)}
            okText="确定"
            cancelText="取消"
            disabled={deletingDocuments.has(document.id)}
          >
            <Tooltip title={deletingDocuments.has(document.id) ? "删除中..." : "删除"}>
              <Button 
                type="text" 
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={deletingDocuments.has(document.id)}
                disabled={deletingDocuments.has(document.id)}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <style>{`
        .document-deleting {
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        .document-deleting td:not(.ant-table-cell-fix-right) {
          background-color: #fafafa !important;
        }
        .document-action-buttons .ant-btn {
          min-width: 32px !important;
          justify-content: center;
        }
        .document-action-buttons .ant-space {
          width: 100%;
          justify-content: flex-start;
        }
      `}</style>
      {/* 工具栏 */}
      <div style={{ padding: '16px 0 16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Search
              placeholder="搜索文档标题、标签..."
              style={{ width: 300 }}
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={(value) => {
                onFilterChange?.({
                  search: value,
                  status: statusFilter,
                  page: 1,
                  size: 6
                });
              }}
            />
            
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                onFilterChange?.({
                  status: value,
                  search: searchQuery,
                  page: 1,
                  size: 6
                });
              }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">等待中</Option>
              <Option value="processing">处理中</Option>
              <Option value="vectorized">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              刷新
            </Button>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'failed',
                    label: (
                      <Popconfirm
                        title="确定要删除所有失败文档吗？"
                        description={`此操作将清理整个知识库中所有处理失败的文档（共${documentCounts.failed}个），不可撤销`}
                        onConfirm={handleDeleteFailedDocuments}
                        okText="确定删除"
                        cancelText="取消"
                        disabled={deletingFailedDocs || deletingPendingDocs}
                      >
                        <div className="flex items-center justify-between px-1 py-1 rounded hover:bg-red-50 transition-colors w-full">
                          <div className="flex items-center space-x-2">
                            <ExclamationCircleOutlined className="text-red-500" />
                            <span className="text-gray-700">清理失败文档</span>
                          </div>
                          {documentCounts.failed > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              {documentCounts.failed}
                            </span>
                          )}
                        </div>
                      </Popconfirm>
                    ),
                    disabled: deletingFailedDocs || deletingPendingDocs,
                    className: deletingFailedDocs || deletingPendingDocs ? 'opacity-50' : ''
                  },
                  {
                    key: 'pending',
                    label: (
                      <Popconfirm
                        title="确定要删除所有队列等待文档吗？"
                        description={`此操作将清理整个知识库中所有处理等待中的文档（共${documentCounts.pending}个），不可撤销`}
                        onConfirm={handleDeletePendingDocuments}
                        okText="确定删除"
                        cancelText="取消"
                        disabled={deletingFailedDocs || deletingPendingDocs}
                      >
                        <div className="flex items-center justify-between px-1 py-1 rounded hover:bg-orange-50 transition-colors w-full">
                          <div className="flex items-center space-x-2">
                            <PendingIcon className="text-orange-500" />
                            <span className="text-gray-700">清理队列等待文档</span>
                          </div>
                          {documentCounts.pending > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                              {documentCounts.pending}
                            </span>
                          )}
                        </div>
                      </Popconfirm>
                    ),
                    disabled: deletingFailedDocs || deletingPendingDocs,
                    className: deletingFailedDocs || deletingPendingDocs ? 'opacity-50' : ''
                  },
                  {
                    type: 'divider',
                    className: 'my-1'
                  },
                  {
                    key: 'all',
                    label: (
                      <Popconfirm
                        title="确定要删除所有问题文档吗？"
                        description={`此操作将清理整个知识库中所有失败和队列等待中的文档（共${documentCounts.problematic}个），不可撤销`}
                        onConfirm={handleDeleteAllProblematicDocuments}
                        okText="确定删除"
                        cancelText="取消"
                        disabled={deletingFailedDocs || deletingPendingDocs}
                      >
                        <div className="flex items-center justify-between px-1 py-1 rounded hover:bg-purple-50 transition-colors w-full">
                          <div className="flex items-center space-x-2">
                            <ClearOutlined className="text-purple-500" />
                            <span className="text-gray-700 font-medium">清理所有问题文档</span>
                          </div>
                          {documentCounts.problematic > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                              {documentCounts.problematic}
                            </span>
                          )}
                        </div>
                      </Popconfirm>
                    ),
                    disabled: deletingFailedDocs || deletingPendingDocs,
                    className: deletingFailedDocs || deletingPendingDocs ? 'opacity-50' : ''
                  }
                ]
              }}
              disabled={deletingFailedDocs || deletingPendingDocs}
              overlayClassName="clean-documents-dropdown"
              placement="bottomRight"
            >
              <Button 
                danger
                type="primary"
                icon={<ClearOutlined />}
                loading={deletingFailedDocs || deletingPendingDocs}
                disabled={deletingFailedDocs || deletingPendingDocs}
                className="shadow-sm hover:shadow-md transition-shadow duration-200"
                style={{
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                <span className="flex items-center space-x-1">
                  <span>
                    清理文档
                    {documentCounts.problematic > 0 && (
                      <span className="ml-1 text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full">
                        {documentCounts.problematic}
                      </span>
                    )}
                  </span>
                  <DownOutlined className="text-xs" />
                </span>
              </Button>
            </Dropdown>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              已选择 {selectedDocuments.length} 项
            </span>
            
            {selectedDocuments.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedDocuments.length} 个文档吗？`}
                description="此操作不可撤销，将同时删除文档的所有向量数据"
                onConfirm={handleBatchDelete}
                okText="确定删除"
                cancelText="取消"
                disabled={batchDeleting}
              >
                <Button 
                  size="small" 
                  danger
                  loading={batchDeleting}
                  disabled={batchDeleting}
                  icon={<DeleteOutlined />}
                >
                  批量删除 ({selectedDocuments.length})
                </Button>
              </Popconfirm>
            )}
            
            {/* 从外部传入的额外按钮 */}
            {!hideExtraButtons && extraButtons}
          </div>
        </div>
      </div>

      {/* 文档列表 */}
      <Table
        columns={columns}
        dataSource={localDocuments}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }} // 增加滚动阈值，适应所有列的总宽度
        pagination={pagination ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `显示 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          onChange: (page) => {
            if (onFilterChange) {
              onFilterChange({ page, size: pagination.pageSize });
            }
          }
        } : {
          pageSize: 6,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `显示 ${range[0]}-${range[1]} 项，共 ${total} 项`
        }}
        rowSelection={{
          selectedRowKeys: selectedDocuments,
          onChange: (selectedRowKeys) => onSelectDocuments(selectedRowKeys as string[]),
          getCheckboxProps: (record) => ({
            name: record.title,
            disabled: deletingDocuments.has(record.id)
          }),
        }}
        rowClassName={(record) => 
          deletingDocuments.has(record.id) ? 'document-deleting' : ''
        }
        size="middle"
      />


      {/* 文档详情Modal */}
      <Modal
        title="文档详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDocument.title}
              </h3>
            </div>
            
            {selectedDocument.metadata?.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">描述</h4>
                <p className="text-gray-700 leading-relaxed">
                  {selectedDocument.metadata.description}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">文件信息</h4>
                <div className="space-y-1 text-sm">
                  <div>类型: {selectedDocument.fileType.toUpperCase()}</div>
                  <div>大小: {formatFileSize(selectedDocument.fileSize)}</div>
                  <div>上传时间: {formatTime(selectedDocument.uploadTime)}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">处理状态</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">向量化:</span>
                    {selectedDocument.vectorized ? (
                      <Tag color="success">已完成</Tag>
                    ) : (
                      <Tag color="warning">未处理</Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDocument.tags.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 向量化配置Modal */}
      <VectorizeConfigModal
        visible={vectorizeModalVisible}
        document={documentToVectorize}
        onCancel={() => {
          setVectorizeModalVisible(false);
          setDocumentToVectorize(null);
        }}
        onConfirm={async (documentId, config) => {
          console.log('🔧 DocumentList 配置确认:', { documentId, config });
          
          try {
            // 先更新本地文档列表的配置（立即反馈）
            setLocalDocuments(prev => {
              const updated = prev.map(doc => 
                doc.id === documentId 
                  ? { 
                      ...doc, 
                      vectorConfig: config,
                      metadata: {
                        ...doc.metadata,
                        vector_config: config
                      }
                    }
                  : doc
              );
              console.log('📝 DocumentList 本地状态更新:', {
                documentId,
                updatedDoc: updated.find(d => d.id === documentId)
              });
              return updated;
            });
            
            // 强制重新渲染表格
            setTimeout(() => {
              setLocalDocuments(prev => [...prev]);
            }, 100);
            
            // 调用向量化处理
            await onVectorizeDocument(documentId, config);
            
            setVectorizeModalVisible(false);
            setDocumentToVectorize(null);
            message.success('配置已更新，开始向量化处理');
          } catch (error) {
            console.error('配置更新失败:', error);
            message.error('配置更新失败');
          }
        }}
        defaultConfig={defaultVectorConfig}
      />

      {/* 文档分块预览Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <BlockOutlined />
            <span>文档分块预览</span>
            {previewDocument && (
              <span className="text-sm text-gray-500">
                - {previewDocument.title}
              </span>
            )}
          </div>
        }
        open={chunksPreviewVisible}
        onCancel={() => {
          setChunksPreviewVisible(false);
          setPreviewDocument(null);
          setDocumentChunks([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setChunksPreviewVisible(false);
            setPreviewDocument(null);
            setDocumentChunks([]);
          }}>
            关闭
          </Button>
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <div className="space-y-4">
          {/* 分块统计信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {chunksLoading ? '...' : documentChunks.length}
                </div>
                <div className="text-sm text-gray-500">总分块数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {chunksLoading ? '...' : documentChunks.filter(chunk => chunk.vector_status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">已向量化</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {chunksLoading ? '...' : Math.round(documentChunks.reduce((total, chunk) => total + (chunk.content?.length || 0), 0) / documentChunks.length) || 0}
                </div>
                <div className="text-sm text-gray-500">平均长度</div>
              </div>
            </div>
          </div>

          {/* 分块列表 */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chunksLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">加载分块数据中...</div>
              </div>
            ) : documentChunks.length > 0 ? (
              documentChunks.map((chunk, index) => (
                <div key={chunk.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                  {/* 分块头部信息 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">
                        分块 #{index + 1}
                      </span>
                      <Tag color={chunk.vector_status === 'completed' ? 'success' : 'warning'}>
                        {chunk.vector_status === 'completed' ? '已向量化' : '未向量化'}
                      </Tag>
                      {chunk.chunk_size && (
                        <span className="text-xs text-gray-500">
                          {chunk.chunk_size} 字符
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {chunk.id || '未知'}
                    </div>
                  </div>

                  {/* 分块内容 */}
                  <div className="bg-white border rounded p-3">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {chunk.content ? (
                        chunk.content.length > 300 ? (
                          <div>
                            <div>{chunk.content.substring(0, 300)}...</div>
                            <Button 
                              type="link" 
                              size="small" 
                              className="p-0 h-auto"
                              onClick={() => {
                                // 展开全部内容的逻辑
                                Modal.info({
                                  title: `分块 #${index + 1} 完整内容`,
                                  content: (
                                    <div className="max-h-96 overflow-y-auto">
                                      <pre className="whitespace-pre-wrap text-sm">
                                        {chunk.content}
                                      </pre>
                                    </div>
                                  ),
                                  width: 800,
                                  okText: '关闭'
                                });
                              }}
                            >
                              查看完整内容
                            </Button>
                          </div>
                        ) : (
                          chunk.content
                        )
                      ) : (
                        <span className="text-gray-400">暂无内容</span>
                      )}
                    </div>
                  </div>

                  {/* 分块元数据 */}
                  {chunk.metadata && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        {chunk.metadata.page && (
                          <div>页码: {chunk.metadata.page}</div>
                        )}
                        {chunk.metadata.section && (
                          <div>章节: {chunk.metadata.section}</div>
                        )}
                        {chunk.created_at && (
                          <div>创建时间: {new Date(chunk.created_at).toLocaleString()}</div>
                        )}
                        {chunk.vector_dimension && (
                          <div>向量维度: {chunk.vector_dimension}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">暂无分块数据</div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 删除状态样式 */}
      <style>{`
        .document-deleting {
          background-color: #fff2f0 !important;
          opacity: 0.7;
          position: relative;
        }
        
        .document-deleting::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 77, 79, 0.1) 50%, transparent 70%);
          pointer-events: none;
          animation: deleting-shimmer 1.5s infinite;
        }
        
        @keyframes deleting-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .document-deleting .ant-checkbox-wrapper {
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}; 