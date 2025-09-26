/**
 * 知识库Collection状态管理
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { collectionService } from '../services/collectionService';
import type { 
  KnowledgeCollection, 
  CollectionCreateRequest, 
  CollectionUpdateRequest,
  CollectionStatistics,
  MetadataTemplate 
} from '../services/collectionService';

interface CollectionState {
  // 知识库管理状态
  collections: KnowledgeCollection[];
  currentCollection: KnowledgeCollection | null;
  collectionStatistics: Record<string, CollectionStatistics>;
  globalStatistics: {
    total_collections: number;
    total_documents: number;
    total_vectorized: number;
    active_collections: number;
    template_distribution: Record<string, number>;
    recent_activity: Array<{
      collection_id: string;
      collection_name: string;
      activity_type: string;
      timestamp: string;
    }>;
  };
  
  // 元数据模版状态
  metadataTemplates: MetadataTemplate[];
  templateTypes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  
  // UI状态
  loading: {
    collections: boolean;
    statistics: boolean;
    templates: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  
  // 搜索和过滤状态
  searchQuery: string;
  filterStatus: string;
  filterTemplate: string;
  selectedCollectionIds: string[];
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // 错误状态
  error: string | null;
  
  // ============ Actions ============
  
  // 知识库管理Actions
  loadCollections: (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    metadata_template?: string;
  }) => Promise<void>;
  
  loadCollection: (collectionId: string) => Promise<void>;
  createCollection: (request: CollectionCreateRequest) => Promise<KnowledgeCollection>;
  updateCollection: (collectionId: string, request: CollectionUpdateRequest) => Promise<KnowledgeCollection>;
  deleteCollection: (collectionId: string) => Promise<void>;
  
  // 统计信息Actions
  loadCollectionStatistics: (collectionId: string) => Promise<void>;
  loadGlobalStatistics: () => Promise<void>;
  
  // 元数据模版Actions
  loadMetadataTemplates: (params?: {
    template_type?: string;
    status?: string;
    include_system_defaults?: boolean;
  }) => Promise<void>;
  loadTemplateTypes: () => Promise<void>;
  
  // Collection选择和过滤Actions
  setCurrentCollection: (collection: KnowledgeCollection | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterTemplate: (template: string) => void;
  setSelectedCollectionIds: (ids: string[]) => void;
  
  // UI状态Actions
  setLoading: (key: keyof CollectionState['loading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<CollectionState['pagination']>) => void;
  
  // 重置Actions
  resetCollectionState: () => void;
  clearError: () => void;
}

const initialState = {
  collections: [],
  currentCollection: null,
  collectionStatistics: {},
  globalStatistics: {
    total_collections: 0,
    total_documents: 0,
    total_vectorized: 0,
    active_collections: 0,
    template_distribution: {},
    recent_activity: []
  },
  metadataTemplates: [],
  templateTypes: [],
  loading: {
    collections: false,
    statistics: false,
    templates: false,
    creating: false,
    updating: false,
    deleting: false
  },
  searchQuery: '',
  filterStatus: 'all',
  filterTemplate: 'all',
  selectedCollectionIds: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  },
  error: null
};

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ============ Collection管理实现 ============
      
      loadCollections: async (params = {}) => {
        set({ loading: { ...get().loading, collections: true }, error: null });
        
        try {
          const requestParams = {
            page: params.page || get().pagination.current,
            size: params.size || get().pagination.pageSize,
            search: params.search || get().searchQuery,
            status: params.status || get().filterStatus,
            metadata_template: params.metadata_template || get().filterTemplate
          };
          
          console.log('🔍 CollectionStore loadCollections 请求参数:', requestParams);
          
          const response = await collectionService.getCollections(requestParams);

          console.log('📚 CollectionStore loadCollections 响应:', response);

          // 追加实时统计兜底：为每个集合拉取 /collections/{id}/statistics 并覆盖计数字段
          const baseCollections = response.collections || [];
          let mergedCollections = baseCollections;
          try {
            const statsList = await Promise.all(
              baseCollections.map(async (c) => {
                try {
                  const s = await collectionService.getCollectionStatistics(c.id);
                  return { id: c.id, stats: s };
                } catch (e) {
                  console.warn('获取集合统计失败（忽略并使用后端返回值）:', c.id, e);
                  return { id: c.id, stats: null };
                }
              })
            );
            const statsMap: Record<string, any> = {};
            statsList.forEach((x) => { if (x && x.id) statsMap[x.id] = x.stats; });
            mergedCollections = baseCollections.map((c) => {
              const s = statsMap[c.id];
              return {
                ...c,
                document_count: (s && typeof s.document_count === 'number') ? s.document_count : (c.document_count || 0),
                vectorized_count: (s && typeof s.vectorized_count === 'number') ? s.vectorized_count : (c.vectorized_count || 0),
                status: (c as any).status || (c.is_active ? 'active' : 'inactive'),
              } as any;
            });
          } catch (mergeErr) {
            console.warn('集合列表统计兜底合并失败，使用原始后端返回值:', mergeErr);
          }

          set({
            collections: mergedCollections,
            pagination: {
              ...get().pagination,
              current: response.page || 1,
              total: response.total || 0
            },
            loading: { ...get().loading, collections: false }
          });
        } catch (error: any) {
          console.error('加载知识库列表失败:', error);
          set({
            error: error?.message || '加载知识库列表失败',
            loading: { ...get().loading, collections: false }
          });
        }
      },
      
      loadCollection: async (collectionId: string) => {
        set({ loading: { ...get().loading, collections: true }, error: null });
        
        try {
          const collection = await collectionService.getCollection(collectionId);
          set({
            currentCollection: collection,
            loading: { ...get().loading, collections: false }
          });
        } catch (error: any) {
          console.error('加载知识库详情失败:', error);
          set({
            error: error?.message || '加载知识库详情失败',
            loading: { ...get().loading, collections: false }
          });
        }
      },
      
      createCollection: async (request: CollectionCreateRequest) => {
        set({ loading: { ...get().loading, creating: true }, error: null });
        
        try {
          const newCollection = await collectionService.createCollection(request);
          
          // 将新知识库添加到列表开头
          set({
            collections: [newCollection, ...get().collections],
            loading: { ...get().loading, creating: false }
          });
          
          return newCollection;
        } catch (error: any) {
          console.error('创建知识库失败:', error);
          set({
            error: error?.message || '创建知识库失败',
            loading: { ...get().loading, creating: false }
          });
          throw error;
        }
      },
      
      updateCollection: async (collectionId: string, request: CollectionUpdateRequest) => {
        set({ loading: { ...get().loading, updating: true }, error: null });
        
        try {
          const updatedCollection = await collectionService.updateCollection(collectionId, request);
          
          // 更新列表中的知识库
          set({
            collections: get().collections.map(collection =>
              collection.id === collectionId ? updatedCollection : collection
            ),
            currentCollection: get().currentCollection?.id === collectionId 
              ? updatedCollection 
              : get().currentCollection,
            loading: { ...get().loading, updating: false }
          });
          
          return updatedCollection;
        } catch (error: any) {
          console.error('更新知识库失败:', error);
          set({
            error: error?.message || '更新知识库失败',
            loading: { ...get().loading, updating: false }
          });
          throw error;
        }
      },
      
      deleteCollection: async (collectionId: string) => {
        set({ loading: { ...get().loading, deleting: true }, error: null });
        
        try {
          await collectionService.deleteCollection(collectionId);
          
          // 从列表中移除知识库
          set({
            collections: get().collections.filter(collection => collection.id !== collectionId),
            currentCollection: get().currentCollection?.id === collectionId 
              ? null 
              : get().currentCollection,
            loading: { ...get().loading, deleting: false }
          });
        } catch (error: any) {
          console.error('删除知识库失败:', error);
          set({
            error: error?.message || '删除知识库失败',
            loading: { ...get().loading, deleting: false }
          });
          throw error;
        }
      },
      
      // ============ 统计信息实现 ============
      
      loadCollectionStatistics: async (collectionId: string) => {
        set({ loading: { ...get().loading, statistics: true }, error: null });
        
        try {
          const statistics = await collectionService.getCollectionStatistics(collectionId);
          
          set({
            collectionStatistics: {
              ...get().collectionStatistics,
              [collectionId]: statistics
            },
            loading: { ...get().loading, statistics: false }
          });
        } catch (error: any) {
          console.error('加载知识库统计失败:', error);
          set({
            error: error?.message || '加载知识库统计失败',
            loading: { ...get().loading, statistics: false }
          });
        }
      },
      
      loadGlobalStatistics: async () => {
        set({ loading: { ...get().loading, statistics: true }, error: null });
        
        try {
          const globalStats = await collectionService.getGlobalStatistics();
          
          set({
            globalStatistics: globalStats,
            loading: { ...get().loading, statistics: false }
          });
        } catch (error: any) {
          console.error('加载全局统计失败:', error);
          set({
            error: error?.message || '加载全局统计失败',
            loading: { ...get().loading, statistics: false }
          });
        }
      },
      
      // ============ 元数据模版实现 ============
      
      loadMetadataTemplates: async (params = {}) => {
        set({ loading: { ...get().loading, templates: true }, error: null });
        
        try {
          const response = await collectionService.getMetadataTemplates(params);
          
          set({
            metadataTemplates: response.templates,
            loading: { ...get().loading, templates: false }
          });
        } catch (error: any) {
          console.error('加载元数据模版失败:', error);
          set({
            error: error?.message || '加载元数据模版失败',
            loading: { ...get().loading, templates: false }
          });
        }
      },
      
      loadTemplateTypes: async () => {
        try {
          const types = await collectionService.getTemplateTypes();
          set({ templateTypes: types || [] });
        } catch (error: any) {
          console.error('加载模版类型失败:', error);
          // 设置默认模板类型作为备选
          set({ 
            templateTypes: [
              { id: 'general', name: '通用场景', description: '适用于一般文档的通用元数据提取' },
              { id: 'policy', name: '政策问答', description: '专门针对政策文档的结构化元数据提取' },
              { id: 'academic', name: '学术领域', description: '学术论文和研究文档的专业元数据' },
              { id: 'enterprise', name: '企业场景', description: '企业内部文档和知识管理元数据' }
            ]
          });
        }
      },
      
      // ============ UI状态管理 ============
      
      setCurrentCollection: (collection: KnowledgeCollection | null) => {
        set({ currentCollection: collection });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      setFilterStatus: (status: string) => {
        set({ filterStatus: status });
      },
      
      setFilterTemplate: (template: string) => {
        set({ filterTemplate: template });
      },
      
      setSelectedCollectionIds: (ids: string[]) => {
        set({ selectedCollectionIds: ids });
      },
      
      setLoading: (key: keyof CollectionState['loading'], loading: boolean) => {
        set({
          loading: {
            ...get().loading,
            [key]: loading
          }
        });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      setPagination: (pagination: Partial<CollectionState['pagination']>) => {
        set({
          pagination: {
            ...get().pagination,
            ...pagination
          }
        });
      },
      
      // ============ 重置Actions ============
      
      resetCollectionState: () => {
        set(initialState);
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'collection-store',
      storage: createJSONStorage(() => localStorage),
      // 只持久化关键状态，不包括加载状态和临时数据
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        filterStatus: state.filterStatus,
        filterTemplate: state.filterTemplate,
        selectedCollectionIds: state.selectedCollectionIds,
        pagination: state.pagination
      })
    }
  )
);

export default useCollectionStore;
