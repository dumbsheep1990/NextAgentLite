/**
 * 知识库管理状态管理 - 使用zustand
 * 完全基于SSE事件驱动，移除所有HTTP轮询逻辑
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  KnowledgeDocument, 
  VectorConfig, 
  ModelConfig, 
  RetrievalResult,
  DualVectorConfig,
  IntelligentSearchRequest,
  IntelligentSearchResponse,
  VectorizationDecision
} from '../types';
import { dualVectorService } from '../services/dualVectorService';
import { knowledgeService } from '../services/knowledgeService';

interface KnowledgeState {
  // 数据状态
  documents: KnowledgeDocument[];
  selectedDocuments: string[];
  vectorConfig: VectorConfig;
  modelConfigs: ModelConfig[];
  activeModelConfig: string | null;
  retrievalQuery: string;
  retrievalResults: RetrievalResult[];
  retrievalLoading: boolean;
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 文档状态缓存
  documentStatusCache: Map<string, {
    status?: string;
    processing_progress?: number;
    vectorized?: boolean;
    dualVectorized?: boolean;
    lastUpdate?: number;
  }>;
  
  // 双向量化状态
  dualVectorConfig: DualVectorConfig | null;
  intelligentSearchResults: IntelligentSearchResponse | null;
  vectorizationDecisions: VectorizationDecision[];
  
  // 模型列表
  embeddingModels: ModelConfig[];
  chatModels: ModelConfig[];
  selectedEmbeddingModel: string;
  selectedChatModel: string;
  
  // UI状态
  uploadModalVisible: boolean;
  configModalVisible: boolean;
  isUploading: boolean;
  isVectorizing: boolean;
  dualVectorModalVisible: boolean;
  
  // Actions - 文档管理
  setDocuments: (documents: KnowledgeDocument[]) => void;
  addDocument: (document: KnowledgeDocument) => void;
  updateDocument: (id: string, updates: Partial<KnowledgeDocument>) => void;
  deleteDocument: (id: string) => void;
  batchDeleteDocuments: (ids: string[]) => Promise<void>;
  setSelectedDocuments: (ids: string[]) => void;
  setDocumentFilter: (filter: any) => void;
  fetchDocuments: (params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    folderId?: string;
    collectionId?: string;
  }) => Promise<void>;
  
  // Actions - 向量化配置
  setVectorConfig: (config: Partial<VectorConfig>) => void;
  
  // Actions - 模型配置
  setModelConfigs: (configs: ModelConfig[]) => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, updates: Partial<ModelConfig>) => void;
  deleteModelConfig: (id: string) => void;
  setActiveModelConfig: (id: string) => void;
  
  // Actions - 检索测试
  setRetrievalQuery: (query: string) => void;
  setRetrievalResults: (results: RetrievalResult[]) => void;
  setRetrievalLoading: (loading: boolean) => void;
  
  // Actions - UI状态
  setUploadModalVisible: (visible: boolean) => void;
  setConfigModalVisible: (visible: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setVectorizing: (vectorizing: boolean) => void;
  
  // Actions - 模型列表
  setSelectedEmbeddingModel: (model: string) => void;
  setSelectedChatModel: (model: string) => void;
  setChatModels: (models: ModelConfig[]) => void;
  setEmbeddingModels: (models: ModelConfig[]) => void;
  refreshModelsFromAPI: () => Promise<void>;
  
  // Actions - 双向量化
  setDualVectorConfig: (config: DualVectorConfig) => void;
  setIntelligentSearchResults: (results: IntelligentSearchResponse) => void;
  setVectorizationDecisions: (decisions: VectorizationDecision[]) => void;
  setDualVectorModalVisible: (visible: boolean) => void;
  loadDualVectorConfig: () => Promise<void>;
  intelligentSearch: (request: IntelligentSearchRequest) => Promise<void>;
  vectorizeDocumentsDual: (documentIds: string[], mode: string) => Promise<void>;
  analyzeFilesForVectorization: (files: FileList) => Promise<VectorizationDecision[]>;
  
  // Actions - 状态缓存管理
  updateDocumentCache: (id: string, updates: Partial<KnowledgeDocument>) => void;
  clearDocumentCache: (id: string) => void;
  clearAllDocumentCache: () => void;
  
  // Actions - 状态重置
  resetAllState: () => void;
  
  // 复合操作
  uploadDocuments: (files: FileList, urls?: string[], metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
    folderId?: string;
    // 简化配置，不再需要向量化模式选择
  }>, sessionId?: string) => Promise<void>;
  vectorizeDocuments: (documentIds: string[], config?: any) => Promise<void>;
  testRetrieval: (query?: string, params?: {
    topK?: number;
    threshold?: number;
    useRerank?: boolean;
    dataSource?: 'all' | 'documents' | 'qa';
    enableTranslation?: boolean;
  }) => Promise<void>;
  exportDocuments: (format: 'csv' | 'json') => Promise<void>;
}

// 默认配置
const defaultVectorConfig: VectorConfig = {
  model: 'text-embedding-v4',
  dimension: 1024,
  chunkSize: 512,
  overlap: 50,
  strategy: 'semantic'
};

// 根据.env文件配置的模型列表
const defaultModelConfigs: ModelConfig[] = [
  // 通用向量模型 - 仅显示.env中配置的模型
  {
    id: 'text-embedding-v4',
    name: 'Text Embedding V4',
    provider: 'alibaba',
    type: 'embedding',
    maxTokens: 8192,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: '阿里巴巴最新向量模型'
  },
  // MatBERT领域专用向量模型
  {
    id: 'matbert-embedding',
    name: 'MatBERT Embedding',
    provider: 'custom',
    type: 'embedding',
    maxTokens: 512,
    apiEndpoint: 'http://198.145.104.12:8000',
    enabled: true,
    description: '材料工程领域专用向量模型'
  },
  // 对话模型 - 仅显示.env中配置的模型
  {
    id: 'kimi-k2-siliconflow',
    name: 'Kimi K2 SiliconFlow',
    provider: 'moonshot',
    type: 'chat',
    maxTokens: 128000,
    temperature: 0.7,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: 'Moonshot Kimi大模型'
  },
  {
    id: 'qwen3-235b-a22b-instruct-2507',
    name: 'Qwen3 235B A22B Instruct',
    provider: 'alibaba',
    type: 'chat',
    maxTokens: 32768,
    temperature: 0.7,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: '阿里通义千问3代模型'
  },
  {
    id: 'qwen-plus-latest',
    name: 'Qwen Plus Latest',
    provider: 'alibaba',
    type: 'chat',
    maxTokens: 32768,
    temperature: 0.7,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: '统一网关模型'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    type: 'chat',
    maxTokens: 128000,
    temperature: 0.7,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: '统一网关模型'
  },
  {
    id: 'gemini-2.5-flash-preview-thinking',
    name: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    type: 'chat',
    maxTokens: 1048576,
    temperature: 0.7,
    apiEndpoint: 'http://101.132.149.115:30504/v1',
    enabled: true,
    description: '统一网关模型'
  }
];

// 不再使用mock文档数据 - 所有文档从API获取

export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    (set, get) => ({
      // 初始数据
      documents: [],
      selectedDocuments: [],
      documentStatusCache: new Map(),
      pagination: {
        current: 1,
        pageSize: 6,
        total: 0,
        totalPages: 0
      },
      vectorConfig: {
        model: 'text-embedding-v4',
        dimension: 1536,
        chunkSize: 512,
        overlap: 50,
        strategy: 'semantic'
      },
      modelConfigs: defaultModelConfigs,
      activeModelConfig: 'text-embedding-v4',
      embeddingModels: defaultModelConfigs.filter(m => m.type === 'embedding'),
      chatModels: defaultModelConfigs.filter(m => m.type === 'chat'),
      selectedEmbeddingModel: 'text-embedding-v4',
      selectedChatModel: 'qwen3-235b-a22b-instruct-2507',
      retrievalQuery: '',
      retrievalResults: [],
      retrievalLoading: false,
      
      // 双向量化状态
      dualVectorConfig: null,
      intelligentSearchResults: null,
      vectorizationDecisions: [],
      
      // UI状态
      uploadModalVisible: false,
      configModalVisible: false,
      isUploading: false,
      isVectorizing: false,
      dualVectorModalVisible: false,

      // 文档管理
      setDocuments: (documents) => set({ documents }),
      
      addDocument: (document) => set((state) => ({
        documents: [document, ...state.documents]
      })),
      
      updateDocument: (id, updates) => set((state) => {
        // 更新缓存
        const currentCache = state.documentStatusCache.get(id) || {};
        const newCache = {
          ...currentCache,
          ...updates,
          lastUpdate: Date.now()
        };
        const newStatusCache = new Map(state.documentStatusCache);
        newStatusCache.set(id, newCache);
        
        // 更新文档列表，只更新真正变化的字段，保持其他字段不变
        const updatedDocuments = state.documents.map(doc => {
          if (doc.id === id) {
            // 合并缓存的状态和新的更新
            const cachedStatus = newStatusCache.get(id) || {};
            return { 
              ...doc, 
              ...cachedStatus, 
              ...updates 
            };
          }
          return doc;
        });
        
        return {
          documents: updatedDocuments,
          documentStatusCache: newStatusCache
        };
      }),
      
      deleteDocument: async (id) => {
        try {
          console.log('🗑️ 开始删除文档:', id);
          
          // 调用后端API删除文档
          await knowledgeService.deleteDocument(id);
          
          // 清理文档缓存
          get().clearDocumentCache(id);
          
          // 从本地状态中移除文档
          set((state) => ({
            documents: state.documents.filter(doc => doc.id !== id),
            selectedDocuments: state.selectedDocuments.filter(docId => docId !== id)
          }));
          
          console.log('✅ 文档删除成功:', id);
        } catch (error) {
          console.error('❌ 文档删除失败:', error);
          throw error;
        }
      },
      
      batchDeleteDocuments: async (ids) => {
        try {
          console.log('🗑️ 开始批量删除文档:', ids);
          await knowledgeService.batchDeleteDocuments(ids);
          
          // 批量清理文档缓存
          ids.forEach(id => get().clearDocumentCache(id));
          
          set((state) => ({
            documents: state.documents.filter(doc => !ids.includes(doc.id)),
            selectedDocuments: state.selectedDocuments.filter(docId => !ids.includes(docId))
          }));
          console.log('✅ 批量文档删除成功:', ids);
        } catch (error) {
          console.error('❌ 批量文档删除失败:', error);
          throw error;
        }
      },
      
      setSelectedDocuments: (ids) => set({ selectedDocuments: ids }),
      
      setDocumentFilter: (filter) => set((state) => ({
        documentFilter: { ...state.documentFilter, ...filter }
      })),

      fetchDocuments: async (params?: {
        page?: number;
        size?: number;
        status?: string;
        search?: string;
        folderId?: string;
        collectionId?: string;
      }) => {
        try {
          console.log('📄 开始获取文档列表...', params);
          const response = await knowledgeService.getDocuments({
            page: params?.page || 1,
            size: params?.size || 6, // 每页6个文档
            status: params?.status || 'all', // 默认获取所有状态的文档
            search: params?.search,
            folderId: params?.folderId,
            collectionId: params?.collectionId
          });
          console.log('✅ 获取文档列表成功:', response.documents.length, '个文档');
          console.log('📋 分页信息:', {
            total: response.total,
            page: response.page,
            size: response.size,
            totalPages: response.totalPages
          });
          
          // 合并占位文档：保留 id 以 'temp-url-' 开头且尚未被真实文档替换的项
          set((state) => {
            const placeholders = (state.documents || []).filter(d => d.id && d.id.startsWith('temp-url-'));
            const merged = [...response.documents];
            const exists = (ph: any) => {
              // 用 sourceUrl 或 metadata.description 中的 URL 来匹配
              const phUrl = (ph as any).sourceUrl || '';
              return !!merged.find(doc => ((doc as any).sourceUrl === phUrl) || (((doc as any).metadata?.description || '').includes(phUrl)));
            };
            placeholders.forEach(ph => { if (!exists(ph)) merged.unshift(ph); });
            return {
              documents: merged,
              pagination: {
                current: response.page,
                pageSize: response.size,
                total: response.total,
                totalPages: response.totalPages
              }
            };
          });
          
          // 检查是否有处理中的文档需要启动轮询
          const processingDocuments = response.documents.filter(doc => 
            doc.status === 'processing' || doc.status === 'pending'
          );
          
          if (processingDocuments.length > 0) {
            console.log(`📊 发现 ${processingDocuments.length} 个处理中的文档，启动状态监控`);
            const processingIds = processingDocuments.map(doc => doc.id);
            // 延迟启动轮询，让页面先渲染
            setTimeout(() => {
              // 轮询已被SSE推送替代，此方法保留以兼容现有代码但不执行任何操作
            }, 1000);
          }
        } catch (error) {
          console.error('❌ 获取文档列表失败:', error);
          set({ 
            documents: [],
            pagination: {
              current: 1,
              pageSize: 6,
              total: 0,
              totalPages: 0
            }
          });
        }
      },

      // 向量化配置
      setVectorConfig: (config) => set((state) => ({
        vectorConfig: { ...state.vectorConfig, ...config }
      })),

      // 模型配置
      setModelConfigs: (configs) => set({ modelConfigs: configs }),
      
      addModelConfig: (config) => set((state) => ({
        modelConfigs: [...state.modelConfigs, config]
      })),
      
      updateModelConfig: (id, updates) => set((state) => ({
        modelConfigs: state.modelConfigs.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      })),
      
      deleteModelConfig: (id) => set((state) => ({
        modelConfigs: state.modelConfigs.filter(config => config.id !== id)
      })),
      
      setActiveModelConfig: (id) => set({ activeModelConfig: id }),

      // 检索测试
      setRetrievalQuery: (query) => set({ retrievalQuery: query }),
      setRetrievalResults: (results) => set({ retrievalResults: results }),
      setRetrievalLoading: (loading) => set({ retrievalLoading: loading }),

      // UI状态
      setUploadModalVisible: (visible) => set({ uploadModalVisible: visible }),
      setConfigModalVisible: (visible) => set({ configModalVisible: visible }),
      setUploading: (uploading) => set({ isUploading: uploading }),
      setVectorizing: (vectorizing) => set({ isVectorizing: vectorizing }),

      // 复合操作
      uploadDocuments: async (files, urls, metadata, sessionId, collectionId?: string) => {
        set({ isUploading: true });
        try {
          // 允许“文件上传”或“URL爬取”两种模式
          const isUrlMode = Array.isArray(urls) && urls.length > 0;
          const isFileMode = !!files && files.length > 0;
          if (!isUrlMode && !isFileMode) {
            throw new Error('请选择要上传的文件或输入至少一个有效URL');
          }

          // 调用真实的上传API
          console.log('📤 开始上传文档...', { 
            files: Array.from(files || []).map(f => f.name), 
            metadata: metadata?.map(m => ({
              ...m,
              hasCustomParams: !!(m.customChunkSize && m.customChunkOverlap)
            }))
          });
          
          // 使用外部传入的 collectionId；若未传递则抛错提示用户选择
          if (!collectionId) {
            throw new Error('请先选择一个知识库再上传文档');
          }
          const uploadedDocuments = await knowledgeService.uploadDocuments(isFileMode ? files : undefined, isUrlMode ? urls : undefined, metadata, sessionId, collectionId);
          console.log('✅ 文档上传成功:', uploadedDocuments);
          
          // 获取全局资源store用于配置名称查询
          const { useGlobalResourceStore } = await import('../stores/globalResourceStore');
          const { getChunkingConfigById } = useGlobalResourceStore.getState();
          
          // 设置文档为处理中状态并添加到文档列表，同时添加用户配置信息
          const documentsWithProcessingStatus = uploadedDocuments.map((doc, index) => {
            const fileMetadata = metadata?.[index];
            let vectorConfig = null;
            
            // 构建vectorConfig用于前端显示
            if (fileMetadata?.customChunkSize !== undefined && fileMetadata?.customChunkOverlap !== undefined) {
              // 用户使用了自定义参数
              vectorConfig = {
                chunkSize: fileMetadata.customChunkSize,
                chunkOverlap: fileMetadata.customChunkOverlap,
                chunkingStrategy: 'custom' as const,
                useDefault: false,
                isCustom: true,
                configName: '自定义配置'
              };
              console.log('🎯 设置自定义配置:', vectorConfig);
            } else if (fileMetadata?.chunkingConfigId) {
              // 用户选择了预设配置 - 优先使用传递的知识库配置，其次从全局store获取
              let selectedConfig = null;
              let configName = '预设配置';
              
              // 优先使用直接传递的知识库配置
              if (fileMetadata.collectionChunkingConfig?.chunking_config) {
                selectedConfig = fileMetadata.collectionChunkingConfig.chunking_config;
                configName = selectedConfig.name || '预设配置';
                console.log('🎯 使用知识库传递的配置:', {
                  configId: fileMetadata.chunkingConfigId,
                  configName: configName,
                  config: selectedConfig
                });
              } else {
                // 回退到全局store查找
                selectedConfig = getChunkingConfigById(fileMetadata.chunkingConfigId);
                configName = selectedConfig?.name || '预设配置';
                console.log('🎯 从全局store获取配置:', {
                  configId: fileMetadata.chunkingConfigId,
                  configName: configName,
                  config: selectedConfig
                });
              }
              
              // 转换策略名称以匹配前端类型
              const mapStrategy = (strategy: string): 'semantic' | 'fixed' | 'sentence' | 'paragraph' => {
                switch (strategy) {
                  case 'semantic': return 'semantic';
                  case 'fixed': return 'fixed';
                  case 'naive': return 'paragraph'; // naive策略映射为paragraph
                  case 'sliding_window': return 'fixed'; // sliding_window策略映射为fixed显示
                  case 'sentence': return 'sentence';
                  case 'paragraph': return 'paragraph';
                  default: return 'semantic'; // 默认使用semantic
                }
              };
              
              vectorConfig = {
                configId: fileMetadata.chunkingConfigId,
                isCustom: false,
                useDefault: false,
                configName: configName,
                chunkSize: selectedConfig?.chunk_token_num || 150,
                chunkOverlap: selectedConfig?.chunk_overlap || 20,
                chunkingStrategy: mapStrategy(selectedConfig?.strategy || 'semantic')
              };
              console.log('🎯 设置预设配置:', vectorConfig, '真实配置名称:', configName, '参数:', selectedConfig?.chunk_token_num, '/', selectedConfig?.chunk_overlap);
            } else {
              console.log('🎯 没有特定配置，将使用默认配置');
            }
            
            return {
              ...doc,
              status: 'pending' as const,
              processing_progress: 0,
              vectorized: false,
              dualVectorized: false,
              vectorConfig: vectorConfig
            };
          });
          
          // URL模式：创建占位项，立即在文档列表中可见；实际入库完成后由SSE/自动刷新覆盖
          if (isUrlMode && urls && urls.length > 0) {
            const now = new Date().toISOString();
            urls.forEach((u, i) => {
              try {
                const urlObj = new URL(u);
                const tempId = `temp-url-${Date.now()}-${i}`;
                const placeholder: KnowledgeDocument = {
                  id: tempId,
                  title: urlObj.hostname,
                  filename: `${urlObj.hostname}.md`,
                  fileType: 'text/markdown',
                  fileSize: 0,
                  uploadTime: now,
                  status: 'pending',
                  sourceUrl: u,
                  scrapeMethod: 'deepscrape',
                  scrapeMetadata: { placeholder: true },
                  tags: metadata?.[i]?.tags || [],
                  metadata: { description: metadata?.[i]?.description || `来源URL: ${u}` },
                  vectorStatus: { progress: 0, chunks: 0, currentPhase: 'pending' },
                  vectorized: false,
                  dualVectorized: false
                } as KnowledgeDocument;
                // 将占位文档加到列表顶部
                set((state) => ({ documents: [placeholder, ...state.documents] }));
              } catch {}
            });
            // 安排一次延时刷新，等后端入库
            setTimeout(() => {
              const colId = collectionId || undefined;
              get().fetchDocuments({ page: 1, size: 6, status: 'all', collectionId: colId });
            }, 5000);
          } else {
            // 文件模式：直接刷新列表确保排序
            await get().fetchDocuments();
          }
          
          // 上传成功时关闭Modal
          set({ uploadModalVisible: false });
          
          // 不再需要启动轮询，状态更新由SSE推送。URL模式下文档会在爬取完成后入库并触发SSE。
          console.log('📡 上传/爬取任务已提交，状态更新将通过SSE接收');
          
          // 上传成功后设置loading状态为false
          set({ isUploading: false });
          
        } catch (error) {
          console.error('❌ 文档上传失败:', error);
          // 发生错误时不关闭Modal，让用户看到错误信息
          set({ isUploading: false });
          throw error;
        }
      },

      vectorizeDocuments: async (documentIds, config) => {
        set({ isVectorizing: true });
        try {
          console.log('🚀 开始向量化文档:', { documentIds, config });
          
          // 调用真正的向量化API，传递配置
          const result = await knowledgeService.vectorizeDocuments(documentIds, config);
          console.log('✅ 向量化API调用成功:', result);
          
          // 更新文档状态为处理中
          set((state) => ({
            documents: state.documents.map(doc => 
              documentIds.includes(doc.id) ? { 
                ...doc, 
                status: 'processing' as const,
                vectorStatus: {
                  ...doc.vectorStatus,
                  progress: 0,
                  chunks: 0,
                  currentPhase: 'pending' as const
                }
              } : doc
            )
          }));
          
          // 不再需要启动轮询，状态更新由SSE推送
          console.log('📡 向量化任务已启动，进度更新将通过SSE接收');
          
        } catch (error) {
          console.error('❌ 向量化失败:', error);
          throw error;
        } finally {
          set({ isVectorizing: false });
        }
      },

      testRetrieval: async (query?: string, params?: {
        topK?: number;
        threshold?: number;
        useRerank?: boolean;
        dataSource?: 'all' | 'documents' | 'qa';
        enableTranslation?: boolean;
      }) => {
        const state = get();
        const searchQuery = query || state.retrievalQuery;
        
        if (!searchQuery || searchQuery.trim() === '') {
          throw new Error('请输入检索查询');
        }
        
        set({ retrievalLoading: true });
        try {
          // 调用检索测试API，传递新参数
          const results = await knowledgeService.testRetrieval(searchQuery, {
            topK: params?.topK || 10,
            threshold: params?.threshold || 0.7,
            useRerank: params?.useRerank || false,
            dataSource: params?.dataSource || 'all',
            enableTranslation: params?.enableTranslation ?? true
          });
          
          console.log('🔍 检索测试结果:', {
            query: searchQuery,
            dataSource: params?.dataSource || 'all',
            enableTranslation: params?.enableTranslation ?? true,
            resultCount: results.length,
            results: results.map(r => ({ title: r.title, score: r.score, source_type: r.source_type }))
          });
          
          set({ retrievalResults: results });
        } catch (error) {
          console.error('检索测试失败:', error);
          // 检索失败时清空结果
          set({ retrievalResults: [] });
          throw error;
        } finally {
          set({ retrievalLoading: false });
        }
      },

      exportDocuments: async (format) => {
        try {
          // Export process started
          // 这里调用导出API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          // Export failed
          throw error;
        }
      },

      // Actions - 模型列表
      setSelectedEmbeddingModel: (model) => set({ selectedEmbeddingModel: model }),
      setSelectedChatModel: (model) => set({ selectedChatModel: model }),
      setChatModels: (models) => set({ chatModels: models }),
      setEmbeddingModels: (models) => set({ embeddingModels: models }),
      
      refreshModelsFromAPI: async () => {
        try {
          const { systemConfigService } = await import('../services/systemConfigService');
          const response = await systemConfigService.getSystemConfig();
          
          // 从配置中提取模型信息
          const llmSection = response.sections.find(s => s.name === 'llm');
          const embeddingSection = response.sections.find(s => s.name === 'embeddings');
          
          const newChatModels: ModelConfig[] = [];
          const newEmbeddingModels: ModelConfig[] = [];
          
          // 处理LLM模型
          if (llmSection && llmSection.settings.providers) {
            Object.entries(llmSection.settings.providers).forEach(([providerName, providerConfig]: [string, any]) => {
              if (providerConfig.models && Array.isArray(providerConfig.models)) {
                providerConfig.models.forEach((model: any) => {
                  console.log('🔥 Processing model from API:', model);
                  console.log('🔥 Original model.provider:', model.provider);
                  console.log('🔥 Provider key:', providerName);
                  
                  const finalProvider = model.provider || providerName;
                  console.log('🔥 Final provider assigned:', finalProvider);
                  
                  const processedModel = {
                    id: model.id,
                    name: model.name || model.id,
                    alias: model.alias, // 🔥 添加别名字段支持
                    provider: finalProvider, // 🔥 优先使用模型自身的provider
                    type: 'chat',
                    maxTokens: model.max_tokens || 8192,
                    apiEndpoint: providerConfig.base_url,
                    enabled: true,
                    description: '统一网关模型'
                  };
                  
                  console.log('🔥 Final processed model:', processedModel);
                  newChatModels.push(processedModel);
                });
              }
            });
          }
          
          // 处理嵌入模型
          if (embeddingSection && embeddingSection.settings.providers) {
            Object.entries(embeddingSection.settings.providers).forEach(([providerName, providerConfig]: [string, any]) => {
              if (providerConfig.models && Array.isArray(providerConfig.models)) {
                providerConfig.models.forEach((model: any) => {
                  newEmbeddingModels.push({
                    id: model.id,
                    name: model.name || model.id,
                    provider: providerName,
                    type: 'embedding',
                    maxTokens: 8192,
                    apiEndpoint: providerConfig.base_url,
                    enabled: true,
                    description: model.domain === 'materials' ? '材料工程领域专用向量模型' : '统一网关模型'
                  });
                });
              }
            });
          }
          
          // 更新模型列表
          if (newChatModels.length > 0) {
            set({ chatModels: newChatModels });
          }
          
          if (newEmbeddingModels.length > 0) {
            set({ embeddingModels: newEmbeddingModels });
          }
          
          // 如果当前选择的模型不在新列表中，更新为第一个可用模型
          const currentState = get();
          if (newChatModels.length > 0 && !newChatModels.find(m => m.id === currentState.selectedChatModel)) {
            set({ selectedChatModel: newChatModels[0].id });
          }
          
          if (newEmbeddingModels.length > 0 && !newEmbeddingModels.find(m => m.id === currentState.selectedEmbeddingModel)) {
            set({ selectedEmbeddingModel: newEmbeddingModels[0].id });
          }
          
        } catch (error) {
          console.error('Failed to refresh models from API:', error);
          // 保持使用默认配置
        }
      },

      // Actions - 双向量化
      setDualVectorConfig: (config) => set({ dualVectorConfig: config }),
      setIntelligentSearchResults: (results) => set({ intelligentSearchResults: results }),
      setVectorizationDecisions: (decisions) => set({ vectorizationDecisions: decisions }),
      setDualVectorModalVisible: (visible) => set({ dualVectorModalVisible: visible }),

      loadDualVectorConfig: async () => {
        try {
          // Loading dual vector configuration
          const config = await dualVectorService.getDualVectorConfig();
          
          set({ dualVectorConfig: config });
          // Dual vector config loaded successfully
        } catch (error) {
          // Failed to load dual vector config
        }
      },

      intelligentSearch: async (request) => {
        set({ retrievalLoading: true });
        try {
          // Intelligent search started
          const response = await dualVectorService.intelligentSearch(request);
          
          set({
            intelligentSearchResults: response,
            retrievalResults: response.results
          });
          // Intelligent search completed successfully
        } catch (error) {
          console.error('智能搜索失败:', error);
          // 清空搜索结果
          set({ 
            intelligentSearchResults: null,
            retrievalResults: []
          });
          throw error;
        } finally {
          set({ retrievalLoading: false });
        }
      },

      vectorizeDocumentsDual: async (documentIds, mode = 'dual') => {
        set({ isVectorizing: true });
        try {
          // Dual vectorization process started
          const result = await dualVectorService.vectorizeDocuments(documentIds, mode, true);
          
          // Dual vectorization completed successfully
          
          // 更新文档状态
          set((state) => ({
            documents: state.documents.map(doc => 
              documentIds.includes(doc.id) ? {
                ...doc,
                status: 'vectorized' as const,
                vectorizationStrategy: mode as 'general' | 'domain' | 'dual',
                generalVectorAvailable: mode === 'dual' || mode === 'general',
                domainVectorAvailable: mode === 'dual' || mode === 'domain',
                vectorStatus: {
                  ...doc.vectorStatus,
                  progress: 100,
                  dualVectors: mode === 'dual',
                  models: mode === 'dual' ? {
                    general: 'qwen_embedding/text-embedding-v3',
                    domain: 'matbert_embedding/matbert-base-v1'
                  } : undefined
                }
              } : doc
            )
          }));
        } catch (error) {
          // Dual vectorization failed
          throw error;
        } finally {
          set({ isVectorizing: false });
        }
      },

      analyzeFilesForVectorization: async (files) => {
        try {
          // File analysis for vectorization started
          
          const decisions: VectorizationDecision[] = [];
          
          for (const file of Array.from(files)) {
            try {
              const decision = await dualVectorService.analyzeFileForVectorization(file);
              decisions.push(decision);
            } catch (error) {
              // Analysis failed for file
              // 提供默认决策
              decisions.push({
                strategy: 'dual',
                confidence: 1.0,
                reason: '默认使用双向量化',
                metadata: { filename: file.name, error: true }
              });
            }
          }
          
          set({ vectorizationDecisions: decisions });
          return decisions;
        } catch (error) {
          // File analysis failed
          return [];
        }
      },

      // Actions - 状态缓存管理
      updateDocumentCache: (id, updates) => {
        set((state) => {
          const newCache = new Map(state.documentStatusCache);
          const currentCache = newCache.get(id) || {};
          
          newCache.set(id, {
            ...currentCache,
            ...updates,
            lastUpdate: Date.now()
          });
          
          return { documentStatusCache: newCache };
        });
        console.log(`💾 文档缓存已更新: ${id}`, updates);
      },

      clearDocumentCache: (id) => {
        set((state) => {
          const newCache = new Map(state.documentStatusCache);
          newCache.delete(id);
          return { documentStatusCache: newCache };
        });
        console.log(`🗑️ 文档缓存已清理: ${id}`);
      },

      clearAllDocumentCache: () => {
        set({ documentStatusCache: new Map() });
        console.log('🗑️ 所有文档缓存已清理');
      },

      // Actions - 状态重置
      resetAllState: () => {
        set({
          documents: [],
          selectedDocuments: [],
          documentStatusCache: new Map(),
          pagination: {
            current: 1,
            pageSize: 6,
            total: 0,
            totalPages: 0
          },
          vectorConfig: {
            embedding_model: 'text-embedding-v4',
            chunk_size: 1000,
            chunk_overlap: 200,
            similarity_threshold: 0.7
          },
          modelConfigs: [],
          activeModelConfig: null,
          retrievalQuery: '',
          retrievalResults: [],
          retrievalLoading: false,
          dualVectorConfig: null,
          intelligentSearchResults: null,
          vectorizationDecisions: [],
          embeddingModels: [],
          chatModels: [],
          selectedEmbeddingModel: 'text-embedding-v4',
          selectedChatModel: 'qwen2.5:7b',
          uploadModalVisible: false,
          configModalVisible: false,
          isUploading: false,
          isVectorizing: false,
          dualVectorModalVisible: false
        });
        
        console.log('📄 Knowledge Store 状态已重置');
      }
    }),
    { name: 'knowledge-store' }
  )
);

// 添加事件监听器，响应全局清理事件
if (typeof window !== 'undefined') {
  window.addEventListener('clear-all-stores', () => {
    console.log('🔄 Knowledge Store 收到清理事件');
    useKnowledgeStore.getState().resetAllState();
  });
} 
