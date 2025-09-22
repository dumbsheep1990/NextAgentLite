/**
 * QA路由服务
 * 处理知识库的问答路由相关API调用
 */

import apiService from './apiService';
import type { ApiResponse } from '../types';

// ===================== 类型定义 =====================

export interface QARoute {
  id: string;
  knowledge_base_id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
  source_type: 'manual' | 'imported';
  source_ref?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface QARouteCreate {
  knowledge_base_id: string;
  category: string;
  question: string;
  answer: string;
  keywords?: string[];
  priority?: number;
  is_active?: boolean;
  source_type?: 'manual' | 'imported';
  source_ref?: string;
  metadata?: Record<string, any>;
}

export interface QARouteUpdate {
  category?: string;
  question?: string;
  answer?: string;
  keywords?: string[];
  priority?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface RetrievalPathConfig {
  id: string;
  knowledge_base_id: string;
  path_name: string;
  path_order: number;
  source_type: 'qa_routes' | 'qa_datasets' | 'documents';
  is_enabled: boolean;
  config: Record<string, any>;
  fallback_action: 'continue' | 'stop';
  min_confidence: number;
  max_results: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseStatus {
  knowledge_base: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
  };
  documents: {
    total: number;
    vectorized: number;
    total_chunks: number;
    avg_chunk_size: number;
  };
  qa_routes: {
    total: number;
    active: number;
    categories: number;
    avg_match_score: number;
    total_matches: number;
    helpful_rate: number;
  };
  qa_datasets: {
    total_pairs: number;
    datasets_count: number;
  };
  retrieval_paths: Array<{
    name: string;
    order: number;
    source: string;
    enabled: boolean;
  }>;
  status: {
    is_configured: boolean;
    has_content: boolean;
    is_ready: boolean;
  };
}

export interface QARouteStatistics {
  knowledge_base_id: string;
  total_routes: number;
  active_routes: number;
  categories_count: number;
  avg_match_score: number;
  total_matches: number;
  helpful_rate: number;
  last_updated: string;
}

export interface QARouteImportHistory {
  id: string;
  knowledge_base_id: string;
  qa_dataset_id?: string;
  import_type: string;
  total_items: number;
  imported_items: number;
  failed_items: number;
  import_config: Record<string, any>;
  error_details: Array<Record<string, any>>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
}

export interface QARouteQuery {
  knowledge_base_id: string;
  query: string;
  category?: string;
  use_semantic?: boolean;
  max_results?: number;
}

export interface QARouteSearchResult {
  route: QARoute;
  match_score: number;
  match_method: 'exact' | 'keyword' | 'semantic';
  highlights?: string[];
}

export interface QARoutingResponse {
  query: string;
  knowledge_base_id: string;
  matched_routes: QARouteSearchResult[];
  retrieval_paths: Array<{
    path_name: string;
    source_type: string;
    results: any[];
    execution_time_ms: number;
    confidence_score: number;
    error?: string;
  }>;
  total_time_ms: number;
  session_id: string;
}

export interface CategoryInfo {
  name: string;
  count: number;
  active_count: number;
}

// ===================== API服务类 =====================

class QARoutingService {
  private baseUrl = '/api/qa-routing';

  // =================== 知识库状态 ===================

  /**
   * 获取知识库状态
   */
  async getKnowledgeBaseStatus(kbId: string): Promise<KnowledgeBaseStatus> {
    const response = await apiService.get<KnowledgeBaseStatus>(
      `${this.baseUrl}/knowledge-base/${kbId}/status`
    );
    return response.data;
  }

  /**
   * 获取所有知识库概览
   */
  async getKnowledgeBasesOverview(): Promise<{
    total: number;
    knowledge_bases: Array<{
      id: string;
      name: string;
      description?: string;
      stats: {
        documents: number;
        qa_routes: number;
        is_ready: boolean;
      };
    }>;
  }> {
    const response = await apiService.get(`${this.baseUrl}/knowledge-bases/overview`);
    return response.data;
  }

  // =================== QA路由管理 ===================

  /**
   * 创建QA路由
   */
  async createQARoute(routeData: QARouteCreate): Promise<QARoute> {
    const response = await apiService.post<QARoute>(
      `${this.baseUrl}/routes`,
      routeData
    );
    return response.data;
  }

  /**
   * 获取单个QA路由
   */
  async getQARoute(routeId: string): Promise<QARoute> {
    const response = await apiService.get<QARoute>(
      `${this.baseUrl}/routes/${routeId}`
    );
    return response.data;
  }

  /**
   * 更新QA路由
   */
  async updateQARoute(routeId: string, updateData: QARouteUpdate): Promise<QARoute> {
    const response = await apiService.put<QARoute>(
      `${this.baseUrl}/routes/${routeId}`,
      updateData
    );
    return response.data;
  }

  /**
   * 删除QA路由
   */
  async deleteQARoute(routeId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/routes/${routeId}`);
  }

  /**
   * 批量删除QA路由
   */
  async deleteQARoutes(routeIds: string[]): Promise<void> {
    // 并行删除所有路由
    await Promise.all(routeIds.map(id => this.deleteQARoute(id)));
  }

  /**
   * 列出知识库的QA路由
   */
  async listQARoutes(
    kbId: string,
    params?: {
      category?: string;
      is_active?: boolean;
      page?: number;
      page_size?: number;
    }
  ): Promise<{
    total: number;
    page: number;
    page_size: number;
    routes: QARoute[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await apiService.get(
      `${this.baseUrl}/knowledge-base/${kbId}/routes?${queryParams.toString()}`
    );
    return response.data;
  }

  // =================== 检索路径配置 ===================

  /**
   * 创建检索路径配置
   */
  async createRetrievalPath(configData: Omit<RetrievalPathConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RetrievalPathConfig> {
    const response = await apiService.post<RetrievalPathConfig>(
      `${this.baseUrl}/retrieval-paths`,
      configData
    );
    return response.data;
  }

  /**
   * 获取检索路径配置
   */
  async getRetrievalPaths(kbId: string): Promise<{
    knowledge_base_id: string;
    paths: RetrievalPathConfig[];
  }> {
    const response = await apiService.get(
      `${this.baseUrl}/knowledge-base/${kbId}/retrieval-paths`
    );
    return response.data;
  }

  /**
   * 更新检索路径配置
   */
  async updateRetrievalPath(pathId: string, updateData: Partial<RetrievalPathConfig>): Promise<RetrievalPathConfig> {
    const response = await apiService.put<RetrievalPathConfig>(
      `${this.baseUrl}/retrieval-paths/${pathId}`,
      updateData
    );
    return response.data;
  }

  // =================== QA路由搜索 ===================

  /**
   * 搜索QA路由
   */
  async searchQARoutes(queryData: QARouteQuery): Promise<QARoutingResponse> {
    const response = await apiService.post<QARoutingResponse>(
      `${this.baseUrl}/search`,
      queryData
    );
    return response.data;
  }

  // =================== 批量导入 ===================

  /**
   * 从QA数据集导入路由
   */
  async importFromQADataset(
    kbId: string,
    datasetId: string,
    options?: {
      category?: string;
      auto_categorize?: boolean;
      merge_strategy?: 'skip' | 'replace' | 'merge';
    }
  ): Promise<QARouteImportHistory> {
    const response = await apiService.post<QARouteImportHistory>(
      `${this.baseUrl}/import/qa-dataset`,
      {
        kb_id: kbId,
        dataset_id: datasetId,
        ...options
      }
    );
    return response.data;
  }

  /**
   * 批量导入QA路由
   */
  async batchImportRoutes(
    kbId: string,
    routes: QARouteCreate[],
    options?: {
      category?: string;
      auto_categorize?: boolean;
      merge_strategy?: 'skip' | 'replace' | 'merge';
    }
  ): Promise<QARouteImportHistory> {
    const response = await apiService.post<QARouteImportHistory>(
      `${this.baseUrl}/import/batch`,
      {
        knowledge_base_id: kbId,
        routes,
        ...options
      }
    );
    return response.data;
  }

  // =================== 分类管理 ===================

  /**
   * 获取QA路由分类
   */
  async getRouteCategories(kbId: string): Promise<{
    total: number;
    categories: CategoryInfo[];
  }> {
    const response = await apiService.get(
      `${this.baseUrl}/knowledge-base/${kbId}/categories`
    );
    return response.data;
  }

  // =================== 统计信息 ===================

  /**
   * 获取QA路由统计
   */
  async getRouteStatistics(kbId: string): Promise<QARouteStatistics> {
    const response = await apiService.get<QARouteStatistics>(
      `${this.baseUrl}/knowledge-base/${kbId}/statistics`
    );
    return response.data;
  }

  // =================== 健康检查 ===================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    database: string;
  }> {
    const response = await apiService.get(`${this.baseUrl}/health`);
    return response.data;
  }
}

// 导出服务单例
const qaRoutingService = new QARoutingService();
export default qaRoutingService;