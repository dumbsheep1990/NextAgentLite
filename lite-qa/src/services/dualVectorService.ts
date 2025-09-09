/**
 * 智能检索API服务 - 处理向量检索相关的API调用
 */
import { apiService } from './api';
import type {
  DualVectorConfig,
  VectorizationDecision,
  IntelligentSearchRequest,
  IntelligentSearchResponse,
  DocumentVectorInfo,
  ApiResponse
} from '../types';

export class IntelligentSearchService {
  private baseUrl = '/knowledge';

  // 智能检索
  async intelligentSearch(request: IntelligentSearchRequest): Promise<IntelligentSearchResponse> {
    try {
      const response = await apiService.post<IntelligentSearchResponse>(
        `${this.baseUrl}/search/intelligent`,
        request
      );
      return response;
    } catch (error) {
      // Intelligent search failed
      throw error;
    }
  }

  // 文档向量化
  async vectorizeDocuments(
    documentIds: string[], 
    vectorizationMode: string = 'vector', // 使用单一向量模型
    useParallel: boolean = true
  ): Promise<{
    message: string;
    results: {
      success: string[];
      failed: Array<{ document_id: string; error: string }>;
    };
    vectorizationMode: string;
    successCount: number;
    failedCount: number;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        results: {
          success: string[];
          failed: Array<{ document_id: string; error: string }>;
        };
        vectorizationMode: string;
        successCount: number;
        failedCount: number;
      }>(`${this.baseUrl}/documents/vectorize-dual`, {
        document_ids: documentIds,
        vectorization_mode: vectorizationMode,
        use_parallel: useParallel
      });
      return response;
    } catch (error) {
      // Dual vectorization failed
      throw error;
    }
  }

  // 获取文档向量信息
  async getDocumentVectorInfo(documentId: string): Promise<DocumentVectorInfo> {
    try {
      const response = await apiService.get<DocumentVectorInfo>(
        `${this.baseUrl}/documents/${documentId}/vector-info`
      );
      return response;
    } catch (error) {
      // Failed to get document vector info
      throw error;
    }
  }

  // 所有文件都使用单一向量模型，简化决策逻辑
  async decideVectorizationStrategy(
    filename: string,
    fileSize: number,
    fileContent?: string
  ): Promise<VectorizationDecision> {
    try {
      // 简化的API调用，所有文件都使用单一向量模型
      const response: VectorizationDecision = {
        strategy: 'vector',
        confidence: 1.0,
        reason: '系统使用单一先进向量模型',
        metadata: {
          filename,
          fileSize,
          autoSelected: true
        }
      };
      
      return response;
    } catch (error) {
      // Vectorization strategy decision failed
      // 返回默认策略
      return {
        strategy: 'dual',
        confidence: 1.0,
        reason: '默认使用双向量化',
        metadata: { source: 'error_fallback' }
      };
    }
  }

  // 解释检索策略（适应新的模式）
  async explainSearchStrategy(
    query: string,
    mode?: 'dual' | 'general' | 'domain'
  ): Promise<{
    selectedStrategy: string;
    reason: string;
    queryAnalysis: any;
    documentContext: any;
    parameters: any;
    alternatives: Array<{
      strategy: string;
      description: string;
    }>;
  }> {
    try {
      const params = new URLSearchParams({ query });
      if (mode) params.append('mode', mode);
      
      const response = await apiService.get<{
        selectedStrategy: string;
        reason: string;
        queryAnalysis: any;
        documentContext: any;
        parameters: any;
        alternatives: Array<{
          strategy: string;
          description: string;
        }>;
      }>(`${this.baseUrl}/search/explain?${params}`);
      return response;
    } catch (error) {
      // Retrieval strategy explanation failed
      throw error;
    }
  }

  // 获取搜索建议
  async getSearchSuggestions(partialQuery: string): Promise<{
    query: string;
    suggestions: string[];
  }> {
    try {
      const response = await apiService.get<{
        query: string;
        suggestions: string[];
      }>(`${this.baseUrl}/search/suggestions?q=${encodeURIComponent(partialQuery)}`);
      return response;
    } catch (error) {
      // Failed to get search suggestions
      throw error;
    }
  }

  // 获取检索配置（新API端点）
  async getSearchConfig(): Promise<DualVectorConfig> {
    try {
      // 优先尝试新的系统配置API
      try {
        const systemConfigResponse = await apiService.get<{
          success: boolean;
          data: {
            sections: Array<{
              name: string;
              settings: any;
            }>;
          };
        }>('/config');
        
        if (systemConfigResponse.success) {
          const vectorizationSection = systemConfigResponse.data.sections.find(
            section => section.name === 'vectorization'
          );
          
          if (vectorizationSection) {
            const settings = vectorizationSection.settings;
            return {
              enableDualVector: settings.enable_dual_vector || true,
              retrievalMode: settings.retrieval_mode || 'dual',
              retrievalConfig: {
                weights: settings.retrieval_config?.weights || { general: 0.4, domain: 0.6 },
                topK: settings.retrieval_config?.top_k || 10,
                similarityThreshold: settings.retrieval_config?.similarity_threshold || 0.7,
                enableReranking: settings.retrieval_config?.enable_reranking || true
              }
            };
          }
        }
      } catch (configError) {
        // System config API unavailable, using knowledge config API
      }

      // 降级到知识库配置API
      const response = await apiService.get<DualVectorConfig>(
        `${this.baseUrl}/config/dual-vector`
      );
      return response;
    } catch (error) {
      // Failed to get dual vector config
      // 返回默认配置
      return {
        enableDualVector: true,
        retrievalMode: 'dual',
        retrievalConfig: {
          weights: { general: 0.4, domain: 0.6 },
          topK: 10,
          similarityThreshold: 0.7,
          enableReranking: true
        }
      };
    }
  }

  // 更新双向量配置（新API端点）
  async updateDualVectorConfig(config: {
    enableDualVector?: boolean;
    retrievalMode?: 'dual' | 'general' | 'domain';
    retrievalConfig?: any;
  }): Promise<{
    message: string;
    config: DualVectorConfig;
  }> {
    try {
      // 优先尝试新的系统配置API
      try {
        const updateResponse = await apiService.put<{
          success: boolean;
          data: {
            section: string;
            backup_file: string;
            restart_required: boolean;
          };
        }>('/config/update', {
          section: 'vectorization',
          settings: {
            enable_dual_vector: config.enableDualVector,
            retrieval_mode: config.retrievalMode,
            retrieval_config: config.retrievalConfig ? {
              weights: config.retrievalConfig.weights,
              top_k: config.retrievalConfig.topK,
              similarity_threshold: config.retrievalConfig.similarityThreshold,
              enable_reranking: config.retrievalConfig.enableReranking
            } : undefined
          },
          restart_services: false
        });
        
        if (updateResponse.success) {
          return {
            message: '双向量配置更新成功',
            config: {
              enableDualVector: config.enableDualVector || true,
              retrievalMode: config.retrievalMode || 'dual',
              retrievalConfig: config.retrievalConfig || {
                weights: { general: 0.4, domain: 0.6 },
                topK: 10,
                similarityThreshold: 0.7,
                enableReranking: true
              }
            }
          };
        }
      } catch (configError) {
        // System config API unavailable, using knowledge config API
      }

      // 降级到知识库配置API
      const response = await apiService.put<{
        message: string;
        config: DualVectorConfig;
      }>(`${this.baseUrl}/config/dual-vector`, config);
      return response;
    } catch (error) {
      // Failed to update dual vector config
      throw error;
    }
  }

  // 获取双向量系统状态
  async getDualVectorStatus(): Promise<{
    enabled: boolean;
    retrievalMode: string;
    vectorStores: any;
    systemMode: string;
  }> {
    try {
      const response = await apiService.get<{
        enabled: boolean;
        retrievalMode: string;
        vectorStores: any;
        systemMode: string;
      }>(`${this.baseUrl}/config/dual-vector/status`);
      return response;
    } catch (error) {
      // Failed to get dual vector status
      throw error;
    }
  }

  // 切换双向量开关（快捷操作）
  async toggleDualVector(enabled: boolean): Promise<{
    message: string;
    enabled: boolean;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        enabled: boolean;
      }>(`${this.baseUrl}/config/dual-vector/toggle?enabled=${enabled}`);
      return response;
    } catch (error) {
      // Failed to toggle dual vector switch
      throw error;
    }
  }

  // 保持向后兼容的旧方法
  async getVectorizationConfig(): Promise<DualVectorConfig> {
    return this.getDualVectorConfig();
  }

  // 保持向后兼容的旧方法
  async updateVectorizationMode(
    enableDualVector: boolean,
    retrievalMode: 'dual' | 'general' | 'domain'
  ): Promise<{
    message: string;
    enableDualVector: boolean;
    retrievalMode: string;
  }> {
    try {
      const response = await this.updateDualVectorConfig({
        enableDualVector,
        retrievalMode
      });
      return {
        message: response.message,
        enableDualVector: response.config.enableDualVector,
        retrievalMode: response.config.retrievalMode
      };
    } catch (error) {
      // Failed to update vectorization mode
      throw error;
    }
  }

  // 批量获取文档向量信息
  async getDocumentsVectorInfo(documentIds: string[]): Promise<DocumentVectorInfo[]> {
    try {
      const promises = documentIds.map(id => this.getDocumentVectorInfo(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<DocumentVectorInfo> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      // Failed to batch get document vector info
      throw error;
    }
  }

  // 简化文件分析，现在都是双向量化
  async analyzeFileForVectorization(file: File): Promise<VectorizationDecision> {
    try {
      // 现在所有文件都使用双向量化，不需要复杂分析
      return await this.decideVectorizationStrategy(
        file.name,
        file.size
      );
    } catch (error) {
      // File vectorization analysis failed
      // 返回默认策略
      return {
        strategy: 'dual',
        confidence: 1.0,
        reason: '默认使用双向量化',
        metadata: { source: 'error_fallback' }
      };
    }
  }
}

// 导出双向量服务实例
export const intelligentSearchService = new IntelligentSearchService();
// 保持向后兼容性
export const dualVectorService = intelligentSearchService;