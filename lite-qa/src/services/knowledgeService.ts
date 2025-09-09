/**
 * 知识库服务 - 处理文档管理、向量化等API调用
 */
import { apiService } from './api';
import type { 
  KnowledgeDocument, 
  VectorConfig, 
  ModelConfig, 
  RetrievalResult,
  ApiResponse,
  UploadResponse,
  DocumentStatusResponse
} from '../types';

export class KnowledgeService {

  // 文档管理
  async getDocuments(params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    folderId?: string;
  }): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      // 设置默认分页参数
      queryParams.set('page', (params?.page || 1).toString());
      queryParams.set('size', (params?.size || 6).toString()); // 每页6个文档
      
      // 添加状态过滤 - 默认显示所有状态
      if (params?.status && params.status !== 'all') {
        queryParams.set('status', params.status);
      }
      
      // 添加搜索参数
      if (params?.search) {
        queryParams.set('search', params.search);
      }
      
      // 添加文件夹过滤参数
      if (params?.folderId) {
        queryParams.set('folder_id', params.folderId);
      }
      
      const response = await apiService.get<{
        documents: KnowledgeDocument[];
        total: number;
        page: number;
        size: number;
        totalPages: number;
      }>(
        `/knowledge/documents?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      // Failed to get document list
      throw error;
    }
  }

  async uploadDocuments(files?: FileList, urls?: string[], metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
    vectorConfig?: {
      useDefault: boolean;
      chunkSize?: number;
      chunkOverlap?: number;
      chunkingStrategy?: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
    };
    chunkingConfigId?: string;
    customChunkSize?: number;
    customChunkOverlap?: number;
  }>, sessionId?: string): Promise<KnowledgeDocument[]> {
    try {
      // 如果是文件上传模式
      if (files && files.length > 0) {
        const uploadPromises = Array.from(files).map((file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          
          // 添加session_id
          if (sessionId) {
            formData.append('session_id', sessionId);
          }
          
          // 查找对应的元数据
          const fileMeta = metadata?.find(m => m.fileIndex === index);
          if (fileMeta) {
            formData.append('tags', fileMeta.tags?.join(',') || '');
            
            // 构建完整的元数据对象，包含切分配置ID和自定义参数
            const metadataObj: any = {};
            if (fileMeta.description) {
              metadataObj.description = fileMeta.description;
            }
            if (fileMeta.chunkingConfigId) {
              metadataObj.chunkingConfigId = fileMeta.chunkingConfigId;
            }
            
            // 添加自定义切分参数
            if (fileMeta.customChunkSize !== undefined) {
              metadataObj.customChunkSize = fileMeta.customChunkSize;
            }
            if (fileMeta.customChunkOverlap !== undefined) {
              metadataObj.customChunkOverlap = fileMeta.customChunkOverlap;
            }
            
            if (fileMeta.vectorConfig && !fileMeta.vectorConfig.useDefault) {
              metadataObj.vectorConfig = {
                chunkSize: fileMeta.vectorConfig.chunkSize,
                chunkOverlap: fileMeta.vectorConfig.chunkOverlap,
                chunkingStrategy: fileMeta.vectorConfig.chunkingStrategy
              };
            }
            
            console.log('🔧 构建上传元数据:', {
              fileName: file.name,
              chunkingConfigId: metadataObj.chunkingConfigId,
              customChunkSize: metadataObj.customChunkSize,
              customChunkOverlap: metadataObj.customChunkOverlap,
              hasVectorConfig: !!metadataObj.vectorConfig
            });
            
            if (Object.keys(metadataObj).length > 0) {
              formData.append('metadata', JSON.stringify(metadataObj));
            }
          }
          
          return apiService.upload<UploadResponse>('/knowledge/documents/upload', formData);
        });
        
        const responses = await Promise.all(uploadPromises);
        // 从每个 UploadResponse 中提取 documents 数组并展平
        const allDocuments = responses.flatMap(response => response.documents);
        return allDocuments;
      } 
      // 如果是URL处理模式
      else if (urls && urls.length > 0) {
        return await this.processUrls(urls, metadata, sessionId);
      } 
      else {
        throw new Error('必须提供文件或URL');
      }
    } catch (error) {
      // Document upload failed
      throw error;
    }
  }

  // URL处理方法
  async processUrls(urls: string[], metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
    chunkingConfigId?: string;
    customChunkSize?: number;
    customChunkOverlap?: number;
  }>, sessionId?: string): Promise<KnowledgeDocument[]> {
    try {
      // 构建URL处理请求
      const requestData = {
        urls,
        collection_id: null, // 如果需要指定collection，可以从参数中获取
        tags: metadata?.[0]?.tags || [],
        description: metadata?.[0]?.description || '',
        chunking_config_id: metadata?.[0]?.chunkingConfigId,
        custom_chunk_size: metadata?.[0]?.customChunkSize,
        custom_chunk_overlap: metadata?.[0]?.customChunkOverlap,
        crawl_options: {
          use_crawl4ai: true,
          use_content_filter: true,
          word_count_threshold: 50,
          exclude_external_links: true
        }
      };

      console.log('🌐 发送URL处理请求:', {
        urlsCount: urls.length,
        urls: urls.slice(0, 3), // 只显示前3个URL避免日志过长
        hasChunkingConfig: !!requestData.chunking_config_id,
        customChunkSize: requestData.custom_chunk_size,
        customChunkOverlap: requestData.custom_chunk_overlap
      });

      // 调用URL处理API
      const response = await apiService.post<any>('/api/v1/url-crawl/process', requestData);
      
      console.log('🌐 URL处理任务启动成功:', response);
      
      // URL处理是异步的，返回一个空数组，实际文档会通过SSE推送状态
      // 前端可以监听SSE事件来获取处理进度和结果
      return [];
      
    } catch (error) {
      console.error('❌ URL处理失败:', error);
      throw error;
    }
  }

  // URL验证方法
  async validateUrl(url: string): Promise<{
    valid: boolean;
    message: string;
    title?: string;
    content_type?: string;
  }> {
    try {
      const response = await apiService.get<{
        valid: boolean;
        message: string;
        title?: string;
        content_type?: string;
      }>(`/api/v1/url-crawl/validate?url=${encodeURIComponent(url)}`);
      
      return response;
    } catch (error) {
      return {
        valid: false,
        message: '验证请求失败'
      };
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await apiService.delete(`/knowledge/documents/${id}`);
    } catch (error) {
      // Document deletion failed
      throw error;
    }
  }

  async checkDuplicateFilenames(filenames: string[]): Promise<{
    hasDuplicates: boolean;
    duplicateFiles: Array<{
      filename: string;
      existingDocId: string;
      existingDocTitle: string;
    }>;
  }> {
    try {
      const response = await apiService.post<{
        hasDuplicates: boolean;
        duplicateFiles: Array<{
          filename: string;
          existingDocId: string;
          existingDocTitle: string;
        }>;
      }>('/knowledge/documents/check-duplicate', { filenames });
      return response;
    } catch (error) {
      // Check duplicate failed
      throw error;
    }
  }

  async batchDeleteDocuments(ids: string[]): Promise<void> {
    try {
      await apiService.post('/knowledge/documents/batch-delete', { documentIds: ids });
    } catch (error) {
      // Batch document deletion failed
      throw error;
    }
  }

  async clearPendingDocuments(): Promise<{
    success: boolean;
    message: string;
    deleted_count: number;
    cleaned_data: {
      postgres_documents: number;
      postgres_chunks: number;
      elasticsearch_documents: number;
      task_queue_records: number;
    };
  }> {
    try {
      const response = await apiService.delete<{
        success: boolean;
        message: string;
        deleted_count: number;
        cleaned_data: {
          postgres_documents: number;
          postgres_chunks: number;
          elasticsearch_documents: number;
          task_queue_records: number;
        };
      }>('/knowledge/documents/clear-pending');
      return response;
    } catch (error) {
      // Clear pending documents failed
      throw error;
    }
  }

  async clearProblematicDocuments(): Promise<{
    success: boolean;
    message: string;
    deleted_count: number;
    cleaned_data: {
      postgres_documents: number;
      postgres_chunks: number;
      elasticsearch_documents: number;
      task_queue_records: number;
    };
    breakdown: {
      failed_documents: number;
      pending_documents: number;
    };
  }> {
    try {
      const response = await apiService.delete<{
        success: boolean;
        message: string;
        deleted_count: number;
        cleaned_data: {
          postgres_documents: number;
          postgres_chunks: number;
          elasticsearch_documents: number;
          task_queue_records: number;
        };
        breakdown: {
          failed_documents: number;
          pending_documents: number;
        };
      }>('/knowledge/documents/clear-problematic');
      return response;
    } catch (error) {
      // Clear problematic documents failed
      throw error;
    }
  }

  async getDocumentStatusStatistics(): Promise<{
    success: boolean;
    statistics: {
      document_status: Record<string, number>;
      problematic_documents: {
        failed: number;
        pending: number;
        total: number;
      };
      task_queue: Record<string, number>;
      last_updated: string;
    };
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        statistics: {
          document_status: Record<string, number>;
          problematic_documents: {
            failed: number;
            pending: number;
            total: number;
          };
          task_queue: Record<string, number>;
          last_updated: string;
        };
      }>('/knowledge/documents/status-statistics');
      return response;
    } catch (error) {
      // Get document status statistics failed
      throw error;
    }
  }

  async updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    try {
      const response = await apiService.put<KnowledgeDocument>(`/knowledge/documents/${id}`, updates);
      return response;
    } catch (error) {
      // Document update failed
      throw error;
    }
  }

  async getDocumentStatus(id: string): Promise<DocumentStatusResponse | null> {
    try {
      const response = await apiService.get<DocumentStatusResponse>(`/knowledge/documents/${id}/status`);
      return response;
    } catch (error) {
      // Document status fetch failed
      console.error(`获取文档状态失败 ${id}:`, error);
      return null;
    }
  }

  // 向量化管理
  async vectorizeDocuments(documentIds: string[], config?: Partial<VectorConfig>): Promise<void> {
    try {
      await apiService.post('/knowledge/vectorize', {
        documentIds,
        config
      });
    } catch (error) {
      // Document vectorization failed
      throw error;
    }
  }

  async getVectorConfig(): Promise<VectorConfig> {
    try {
      const response = await apiService.get<VectorConfig>('/knowledge/config/vector');
      return response;
    } catch (error) {
      // Failed to get vector config
      throw error;
    }
  }

  async updateVectorConfig(config: Partial<VectorConfig>): Promise<VectorConfig> {
    try {
      const response = await apiService.put<VectorConfig>('/knowledge/config/vector', config);
      return response;
    } catch (error) {
      // Failed to update vector config
      throw error;
    }
  }

  // 模型配置管理
  async getModelConfigs(): Promise<ModelConfig[]> {
    try {
      const response = await apiService.get<ModelConfig[]>('/knowledge/config/models');
      return response;
    } catch (error) {
      // Failed to get model config
      throw error;
    }
  }

  async addModelConfig(config: Omit<ModelConfig, 'id'>): Promise<ModelConfig> {
    try {
      const response = await apiService.post<ModelConfig>('/knowledge/config/models', config);
      return response;
    } catch (error) {
      // Failed to add model config
      throw error;
    }
  }

  async updateModelConfig(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    try {
      const response = await apiService.put<ModelConfig>(`/knowledge/config/models/${id}`, updates);
      return response;
    } catch (error) {
      // Failed to update model config
      throw error;
    }
  }

  async deleteModelConfig(id: string): Promise<void> {
    try {
      await apiService.delete(`/knowledge/config/models/${id}`);
    } catch (error) {
      // Failed to delete model config
      throw error;
    }
  }

  // 检索测试
  async testRetrieval(query: string, params?: {
    topK?: number;
    threshold?: number;
    useRerank?: boolean;
    dataSource?: 'all' | 'documents' | 'qa';
    enableTranslation?: boolean;
  }): Promise<RetrievalResult[]> {
    try {
      const requestData = {
        query,
        topK: params?.topK || 10,
        threshold: params?.threshold || 0.7,
        useRerank: params?.useRerank || false,
        dataSource: params?.dataSource || 'all',
        enableTranslation: params?.enableTranslation ?? true
      };
      
      console.log('🔍 发送检索测试请求:', requestData);
      
      const response = await apiService.post<RetrievalResult[]>('/knowledge/test/retrieval', requestData);
      
      console.log('🔍 检索测试响应:', {
        resultCount: response.length,
        dataTypes: response.map(r => r.source_type || 'unknown')
      });
      
      return response;
    } catch (error) {
      console.error('🚫 检索测试失败:', error);
      throw error;
    }
  }

  // 数据导出
  async exportDocuments(format: 'csv' | 'json', filters?: any): Promise<void> {
    try {
      await apiService.download(
        `/knowledge/export?format=${format}`,
        `knowledge_export.${format}`
      );
    } catch (error) {
      // Document export failed
      throw error;
    }
  }

  // 统计信息
  async getStatistics(): Promise<{
    totalDocuments: number;
    vectorizedDocuments: number;
    totalSize: number;
    activeTags: number;
  }> {
    try {
      const response = await apiService.get<{
        totalDocuments: number;
        vectorizedDocuments: number;
        totalSize: number;
        activeTags: number;
      }>('/knowledge/statistics');
      return response;
    } catch (error) {
      // Failed to get statistics
      throw error;
    }
  }

  // 搜索文档（用于检索测试）
  async searchDocuments(query: string, params?: {
    topK?: number;
    threshold?: number;
    useRerank?: boolean;
  }): Promise<RetrievalResult[]> {
    try {
      const response = await apiService.post<RetrievalResult[]>('/knowledge/search', {
        query,
        ...params
      });
      return response;
    } catch (error) {
      // Search failed
      throw error;
    }
  }

  // 切分配置管理
  async getChunkingConfigs(): Promise<any[]> {
    try {
      const response = await apiService.get<any>('/knowledge/chunking-configs');
      return response.configs || [];
    } catch (error) {
      // Failed to get chunking configs
      console.error('获取切分配置失败:', error);
      return [];
    }
  }

  async getDefaultChunkingConfig(): Promise<any | null> {
    try {
      const response = await apiService.get<any>('/knowledge/chunking-configs/default');
      return response;
    } catch (error) {
      // Failed to get default chunking config
      console.error('获取默认切分配置失败:', error);
      return null;
    }
  }

  // 获取文档分块数据
  async fetchDocumentChunks(documentId: string, offset: number = 0, limit: number = 100): Promise<{
    document_id: string;
    document_title: string;
    total_chunks: number;
    vectorized_chunks: number;
    chunks: Array<{
      id: string;
      content: string;
      chunk_size: number;
      vector_status: 'completed' | 'pending';
      vector_dimension?: number;
      metadata: any;
      created_at: string;
    }>;
  }> {
    try {
      const response = await apiService.get<{
        document_id: string;
        document_title: string;
        total_chunks: number;
        vectorized_chunks: number;
        chunks: Array<{
          id: string;
          content: string;
          chunk_size: number;
          vector_status: 'completed' | 'pending';
          vector_dimension?: number;
          metadata: any;
          created_at: string;
        }>;
      }>(`/knowledge/documents/${documentId}/chunks?offset=${offset}&limit=${limit}`);
      return response;
    } catch (error) {
      // Failed to get document chunks
      console.error('获取文档分块失败:', error);
      throw error;
    }
  }
}

// 导出知识库服务实例
export const knowledgeService = new KnowledgeService(); 