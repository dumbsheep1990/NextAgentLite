/**
 * 知识库Collection服务 - 处理知识库管理相关API调用
 */
import { apiService } from './api';
import type { ApiResponse } from '../types';

// Collection类型定义
export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  metadata_template: string;
  document_count: number;
  vectorized_count: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  created_by?: string;
  extra_metadata?: Record<string, any>;
  // QA提取相关字段
  auto_qa_extraction_enabled?: boolean;
  qa_extraction_status?: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed';
  qa_extraction_task_id?: number;
  qa_dataset_id?: string;
  qa_extraction_config?: Record<string, any>;
  qa_extraction_started_at?: string;
  qa_extraction_completed_at?: string;
  qa_extraction_error_message?: string;
}

export interface CollectionCreateRequest {
  name: string;
  description?: string;
  metadata_template: string;
  extra_metadata?: Record<string, any>;
  embeddings?: {
    model_id: string;
    provider: string;
  };
}

export interface CollectionUpdateRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  extra_metadata?: Record<string, any>;
}

export interface CollectionStatistics {
  collection_id: string;
  document_count: number;
  vectorized_count: number;
  total_size: number;
  avg_processing_time: number;
  last_activity: string;
  metadata_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

export interface MetadataTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
  schema: Record<string, any>;
  extraction_config: Record<string, any>;
  is_system_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MetadataExtractionRequest {
  template_id: string;
  content: string;
  filename?: string;
  additional_context?: Record<string, any>;
}

export interface MetadataExtractionResponse {
  template_id: string;
  template_name: string;
  extracted_metadata: Record<string, any>;
  confidence_score?: number;
  extraction_time: number;
  validation_result: Record<string, any>;
}

export class CollectionService {
  
  // ============ Collection管理 ============
  
  /**
   * 获取知识库列表
   */
  async getCollections(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    metadata_template?: string;
  }): Promise<{
    collections: KnowledgeCollection[];
    total: number;
    page: number;
    size: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.size) queryParams.set('size', params.size.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params?.metadata_template) queryParams.set('metadata_template', params.metadata_template);
      
      // 后端路由挂载在 api_router.include_router(knowledge_collection.router, prefix="/collections")
      // 因此前缀应为 /collections，而不是 /knowledge/collections
      const finalUrl = `/collections?${queryParams}`;
      console.log('🌐 前端调用API:', finalUrl);
      console.log('📋 请求参数:', params);
      console.log('📋 查询字符串:', queryParams.toString());
      
      const response = await apiService.get<{
        collections: KnowledgeCollection[];
        total: number;
        page: number;
        size: number;
      }>(finalUrl);
      
      console.log('📥 API响应:', response);
      
      // 验证响应数据结构
      if (!response) {
        console.warn('知识库列表API返回数据为空');
        return { collections: [], total: 0, page: 1, size: 10 };
      }
      
      console.log('✅ 解析后数据:', {
        collections: response.collections?.length || 0,
        total: response.total,
        page: response.page,
        size: response.size
      });
      
      return {
        collections: response.collections || [],
        total: response.total || 0,
        page: response.page || 1,
        size: response.size || 10
      };
    } catch (error) {
      console.error('❌ 获取知识库列表失败:', error);
      console.error('❌ 错误详情:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 获取指定知识库详情
   */
  async getCollection(collectionId: string): Promise<KnowledgeCollection> {
    try {
      const response = await apiService.get<KnowledgeCollection>(`/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error(`获取知识库详情失败 ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * 创建新知识库
   */
  async createCollection(request: CollectionCreateRequest): Promise<KnowledgeCollection> {
    try {
      const response = await apiService.post<KnowledgeCollection>('/collections', request);
      return response.data;
    } catch (error) {
      console.error('创建知识库失败:', error);
      throw error;
    }
  }

  /** 获取启用的Embedding模型（统一使用 /v1/models/enabled），并在列表中标记默认 */
  async getEmbeddingDefaultsAndModels(): Promise<{ default: { model_id: string; provider: string }, models: Array<{ model_id: string; display_name: string; provider_name: string; provider_type?: string; default_embedding?: boolean }> }> {
    // 通过后端代理到 9050 的 /v1/models/enabled?type=embedding
    const models = await apiService.get<any[]>('/models-gateway/models?type=embedding&enabled=true');
    const listRaw = Array.isArray(models) ? models : [];
    const list = listRaw.map((m: any) => ({
      model_id: m.model_id,
      display_name: m.display_name || m.model_id,
      provider_name: m.provider_name || '',
      provider_type: m.provider_type || '',
      default_embedding: !!m.default_embedding,
    }));
    // 以 default_embedding 标志选默认；若无则取第一项作为默认显示（仅UI用途）
    const defItem = list.find(m => m.default_embedding) || list[0] || { model_id: '', provider_name: '' } as any;
    const outDef = { model_id: defItem?.model_id || '', provider: defItem?.provider_name || '' };
    return { default: outDef, models: list };
  }

  /**
   * 更新知识库信息
   */
  async updateCollection(collectionId: string, request: CollectionUpdateRequest): Promise<KnowledgeCollection> {
    try {
      const response = await apiService.put<KnowledgeCollection>(`/collections/${collectionId}`, request);
      return response.data;
    } catch (error) {
      console.error(`更新知识库失败 ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * 删除知识库
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      await apiService.delete(`/collections/${collectionId}`);
    } catch (error) {
      console.error(`删除知识库失败 ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getCollectionStatistics(collectionId: string): Promise<CollectionStatistics> {
    try {
      const response = await apiService.get<CollectionStatistics>(`/collections/${collectionId}/statistics`);
      // apiService.get 已返回数据本体，直接返回即可
      return response as unknown as CollectionStatistics;
    } catch (error) {
      console.error(`获取知识库统计失败 ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * 搜索知识库
   */
  async searchCollections(params: {
    query: string;
    top_k?: number;
    metadata_template?: string;
  }): Promise<KnowledgeCollection[]> {
    try {
      const response = await apiService.post<{
        results: KnowledgeCollection[];
      }>('/collections/search', params);
      return response.data.results;
    } catch (error) {
      console.error('搜索知识库失败:', error);
      throw error;
    }
  }

  /**
   * 获取全局知识库统计
   */
  async getGlobalStatistics(): Promise<{
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
  }> {
    try {
      // 优先使用新的实时统计接口 /collections/stats/global
      try {
        const [stats, docStats] = await Promise.all([
          apiService.get<any>('/collections/stats/global'),
          apiService.get<any>('/knowledge/documents/status-statistics').catch(() => null)
        ]);
        const total_collections = stats?.collections?.total ?? 0;
        const active_collections = stats?.collections?.active ?? 0;
        const total_documents = stats?.documents?.total ?? 0;
        const template_distribution = stats?.template_distribution || {};
        const vectorized = docStats?.statistics?.document_status?.vectorized ?? 0;
        return {
          total_collections,
          total_documents,
          total_vectorized: vectorized,
          active_collections,
          template_distribution,
          recent_activity: [],
        };
      } catch (e) {
        // 回退到旧的静态接口（兼容老版本后端）
        const legacy = await apiService.get<any>('/collections/statistics/global');
        return legacy;
      }
    } catch (error) {
      console.error('获取全局统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门知识库
   */
  async getPopularCollections(limit: number = 10): Promise<KnowledgeCollection[]> {
    try {
      const response = await apiService.get<{
        collections: KnowledgeCollection[];
      }>(`/collections/popular?limit=${limit}`);
      return response.data.collections;
    } catch (error) {
      console.error('获取热门知识库失败:', error);
      throw error;
    }
  }

  // ============ 元数据模版管理 ============

  /**
   * 获取元数据模版列表
   */
  async getMetadataTemplates(params?: {
    template_type?: string;
    status?: string;
    include_system_defaults?: boolean;
  }): Promise<{
    templates: MetadataTemplate[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.template_type) queryParams.set('template_type', params.template_type);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.include_system_defaults !== undefined) {
        queryParams.set('include_system_defaults', params.include_system_defaults.toString());
      }
      
      const response = await apiService.get<{
        templates: MetadataTemplate[];
        total: number;
      }>(`/metadata-templates?${queryParams}`);
      
      return response.data;
    } catch (error) {
      console.error('获取元数据模版列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用的模版类型
   */
  async getTemplateTypes(): Promise<Array<{
    id: string;
    name: string;
    description: string;
  }>> {
    try {
      console.log('🔗 请求模版类型API: /metadata-templates/types');
      const response = await apiService.get<{
        types: Array<{
          id: string;
          name: string;
          description: string;
        }>;
      }>('/metadata-templates/types');
      
      console.log('📡 API原始响应:', response);
      console.log('📡 响应数据:', response.data);
      console.log('📡 响应状态:', response.status);
      
      // 修复：检查数据在response还是response.data中
      const apiData = response.data || response;
      console.log('🔧 修正后的数据:', apiData);
      
      // 验证响应数据结构
      if (!apiData || !apiData.types || !Array.isArray(apiData.types)) {
        console.warn('模版类型API返回数据格式异常:', apiData);
        return [];
      }
      
      console.log('✅ 成功获取模版类型:', apiData.types.length, '个');
      return apiData.types;
    } catch (error) {
      console.error('获取模版类型失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定模版详情
   */
  async getMetadataTemplate(templateId: string): Promise<MetadataTemplate> {
    try {
      const response = await apiService.get<MetadataTemplate>(`/metadata-templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error(`获取元数据模版详情失败 ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 获取模版的JSON Schema
   */
  async getTemplateSchema(templateId: string): Promise<{
    template_id: string;
    template_name: string;
    template_type: string;
    schema: Record<string, any>;
    extraction_config: Record<string, any>;
  }> {
    try {
      const response = await apiService.get(`/metadata-templates/${templateId}/schema`);
      return response.data;
    } catch (error) {
      console.error(`获取模版Schema失败 ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 提取元数据
   */
  async extractMetadata(request: MetadataExtractionRequest): Promise<MetadataExtractionResponse> {
    try {
      const response = await apiService.post<MetadataExtractionResponse>(
        '/metadata-templates/extract',
        request
      );
      return response.data;
    } catch (error) {
      console.error('元数据提取失败:', error);
      throw error;
    }
  }

  /**
   * 批量提取元数据
   */
  async batchExtractMetadata(requests: MetadataExtractionRequest[]): Promise<{
    batch_results: Array<{
      template_id: string;
      template_name?: string;
      status: 'success' | 'error';
      extracted_metadata?: Record<string, any>;
      confidence_score?: number;
      extraction_time?: number;
      validation_result?: Record<string, any>;
      error?: string;
    }>;
    total_processed: number;
    success_count: number;
    error_count: number;
  }> {
    try {
      const response = await apiService.post('/metadata-templates/batch-extract', requests);
      return response.data;
    } catch (error) {
      console.error('批量元数据提取失败:', error);
      throw error;
    }
  }

  /**
   * 验证元数据是否符合模版规范
   */
  async validateMetadata(templateId: string, metadata: Record<string, any>): Promise<{
    is_valid: boolean;
    validation_errors: string[];
    suggestions: string[];
  }> {
    try {
      const response = await apiService.post(`/metadata-templates/${templateId}/validate`, metadata);
      return response.data;
    } catch (error) {
      console.error(`元数据验证失败 ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 获取模版使用统计
   */
  async getTemplateUsageStatistics(templateId: string): Promise<{
    template_id: string;
    template_name: string;
    template_type: string;
    usage_statistics: Record<string, any>;
  }> {
    try {
      const response = await apiService.get(`/metadata-templates/${templateId}/statistics`);
      return response.data;
    } catch (error) {
      console.error(`获取模版使用统计失败 ${templateId}:`, error);
      throw error;
    }
  }

  // ============ 文档与Collection关联 ============

  /**
   * 获取指定Collection的文档列表
   */
  async getCollectionDocuments(collectionId: string, params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
  }): Promise<{
    documents: any[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      // 添加Collection过滤
      queryParams.set('collection_id', collectionId);
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.size) queryParams.set('size', params.size.toString());
      if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      
      const response = await apiService.get(`/knowledge/documents?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error(`获取Collection文档列表失败 ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * 将文档移动到指定Collection
   */
  async moveDocumentToCollection(documentId: string, targetCollectionId: string): Promise<void> {
    try {
      await apiService.put(`/knowledge/documents/${documentId}`, {
        collection_id: targetCollectionId
      });
    } catch (error) {
      console.error(`移动文档失败 ${documentId} -> ${targetCollectionId}:`, error);
      throw error;
    }
  }

  /**
   * 批量移动文档到Collection
   */
  async batchMoveDocumentsToCollection(documentIds: string[], targetCollectionId: string): Promise<{
    success_count: number;
    failed_count: number;
    failed_ids: string[];
  }> {
    try {
      const response = await apiService.post('/knowledge/documents/batch-move', {
        document_ids: documentIds,
        target_collection_id: targetCollectionId
      });
      return response.data;
    } catch (error) {
      console.error('批量移动文档失败:', error);
      throw error;
    }
  }

  // ============ Collection检索 ============

  /**
   * 在指定Collection中检索
   */
  async searchInCollection(params: {
    collection_ids?: string[];
    query: string;
    metadata_template?: string;
    top_k?: number;
    time_filters?: Record<string, any>;
    user_mode?: string;
    include_highlights?: boolean;
    enable_reranking?: boolean;
  }): Promise<{
    results: any[];
    total_matches: number;
    strategy_used: string;
    collection_info: Record<string, any>;
    temporal_filters_applied: Record<string, any>;
    performance_metrics: Record<string, any>;
  }> {
    try {
      const response = await apiService.post('/collections/search/advanced', params);
      return response.data;
    } catch (error) {
      console.error('Collection检索失败:', error);
      throw error;
    }
  }

  // ===== 切分配置相关方法 =====

  /**
   * 获取知识库的切分配置
   */
  async getCollectionChunkingConfig(collectionId: string): Promise<any> {
    try {
      const response = await apiService.get(`/collections/${collectionId}/chunking-config`);
      // 后端返回的可能是直接的配置数据对象，也可能是包装的响应
      if (response.success) {
        return response;
      } else if (response.collection_id) {
        // 如果直接返回的是配置数据对象，包装成标准格式
        return {
          success: true,
          data: response,
          message: '获取切分配置成功'
        };
      } else {
        return response;
      }
    } catch (error) {
      console.error('获取知识库切分配置失败:', error);
      throw error;
    }
  }

  // 运行批量元数据提取
  async runMetadataExtraction(
    collectionId: string,
    onlyPending: boolean = true,
    limit?: number
  ): Promise<{
    collection_id: string;
    total: number;
    processed: number;
    success: number;
    failed: number;
    details?: any[];
  }> {
    try {
      const payload: any = { only_pending: onlyPending };
      if (limit !== undefined) payload.limit = limit;
      return await apiService.post(`/collections/${collectionId}/metadata-extraction/run`, payload);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 设置知识库的切分配置
   */
  async setCollectionChunkingConfig(
    collectionId: string,
    configData: {
      chunking_config_id: string;
      custom_config?: {
        inherit_from_global?: boolean;
        custom_rules?: any;
        override_settings?: any;
      };
    }
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const response = await apiService.put(`/collections/${collectionId}/chunking-config`, configData);
      return response;
    } catch (error) {
      console.error('设置知识库切分配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的切分配置
   */
  async getAvailableChunkingConfigs(): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const response = await apiService.get('/collections/chunking-configs/available');
      return response.data;
    } catch (error) {
      console.error('获取可用切分配置失败:', error);
      throw error;
    }
  }

  /**
   * 重置知识库切分配置为默认值
   */
  async resetCollectionChunkingConfig(collectionId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await apiService.post(`/collections/${collectionId}/chunking-config/reset`);
      return response.data;
    } catch (error) {
      console.error('重置知识库切分配置失败:', error);
      throw error;
    }
  }

  // ===== HiRAG 集成相关 =====

  async getHiragStatus(): Promise<any> {
    return await apiService.get('/api/v1/hirag/status');
  }

  async getHiragCapabilities(collectionId: string): Promise<any> {
    return await apiService.get(`/api/v1/hirag/collections/${collectionId}/capabilities`);
  }

  async getRetrievalConfig(collectionId: string): Promise<any> {
    return await apiService.get(`/api/v1/hirag/collections/${collectionId}/retrieval-config`);
  }

  async setRetrievalConfig(collectionId: string, mode: 'hybrid'|'hirag', requireReady: boolean = true): Promise<any> {
    return await apiService.post(`/api/v1/hirag/collections/${collectionId}/retrieval-config`, { mode, requireReady });
  }

  async hiragIndexDryRun(collectionId: string): Promise<any> {
    return await apiService.post('/api/v1/hirag/index-collection', { collectionId, dryRun: true, confirm: false });
  }

  async hiragIndexConfirm(collectionId: string, sessionId?: string, runAsync: boolean = true): Promise<any> {
    const payload: any = { collectionId, confirm: true, async: runAsync };
    if (sessionId) payload.sessionId = sessionId;
    return await apiService.post('/api/v1/hirag/index-collection', payload);
  }

  // ===== QA提取功能相关方法 =====

  /**
   * 启用或禁用Collection的QA提取功能
   */
  async toggleQAExtraction(collectionId: string, enabled: boolean, config?: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    task_id?: number;
    dataset_id?: string;
  }> {
    try {
      console.log('🔄 调用QA提取API:', { collectionId, enabled, config });
      const response = await apiService.put(`/collections/${collectionId}/qa-extraction`, {
        enabled,
        config
      });
      console.log('✅ QA提取API响应:', response);
      return response;
    } catch (error) {
      console.error('❌ 切换QA提取状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取Collection的QA提取状态
   */
  async getQAExtractionStatus(collectionId: string): Promise<{
    enabled: boolean;
    status: string;
    task_id?: number;
    dataset_id?: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
  }> {
    try {
      const response = await apiService.get(`/collections/${collectionId}/qa-extraction/status`);
      return response.data;
    } catch (error) {
      console.error('获取QA提取状态失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
export const collectionService = new CollectionService();

export default collectionService;
