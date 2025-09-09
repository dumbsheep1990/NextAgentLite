/**
 * 向量索引管理服务
 * 
 * 提供向量索引的分析、创建、重建和状态查询功能
 */

import { api } from './api';

// 类型定义
export interface IndexConfig {
  index_type: string;
  distance_metric: string;
  m?: number;
  ef_construction?: number;
  lists?: number;
}

export interface CreateIndexRequest {
  collection_id: string;
  vector_field: string;
  config: IndexConfig;
  force_recreate?: boolean;
}

export interface RebuildIndexRequest {
  collection_id: string;
  vector_fields?: string[];
  config?: IndexConfig;
}

export interface IndexStatus {
  collection_id: string;
  collection_name: string;
  index_name: string;
  index_type: string;
  vector_field: string;
  vector_dimension: number;
  exists: boolean;
  is_valid: boolean;
  size_mb: number;
  last_rebuild?: string;
  avg_query_time?: number;
  index_scan_ratio?: number;
  total_vectors: number;
  null_vectors: number;
  data_distribution: Record<string, any>;
}

export interface VectorAnalysis {
  collection_id: string;
  total_chunks: number;
  vector_statistics: Record<string, { count: number; dimension: number }>;
  data_range: {
    earliest: string;
    latest: string;
  };
  default_config: {
    index_type: string;
    distance_metric: string;
    m: number;
    ef_construction: number;
  };
}

export interface SupportedConfigs {
  index_types: Array<{
    value: string;
    name: string;
    description: string;
    is_default: boolean;
    parameters: Record<string, any>;
  }>;
  distance_metrics: Array<{
    value: string;
    name: string;
    description: string;
    is_default: boolean;
  }>;
  default_config: {
    index_type: string;
    distance_metric: string;
    parameters: Record<string, any>;
  };
}

export interface CreateIndexResponse {
  success: boolean;
  message: string;
  data: {
    index_name: string;
    build_time: number;
    vector_field: string;
    index_type: string;
    collection_id: string;
  };
}

export interface RebuildIndexResponse {
  success: boolean;
  message: string;
  async_mode: boolean;
  estimated_time_minutes?: number;
  data: {
    collection_id: string;
    total_vectors?: number;
    analysis?: VectorAnalysis;
    total_build_time?: number;
    rebuilt_indexes?: Array<{
      index_name: string;
      build_time: number;
      vector_field: string;
    }>;
    errors?: Array<{
      vector_field: string;
      error: string;
    }>;
  };
}

class VectorIndexService {
  private baseUrl = '/api/v1/vector-index';

  /**
   * 获取支持的配置选项
   */
  async getSupportedConfigs(): Promise<SupportedConfigs> {
    try {
      const response = await api.get<SupportedConfigs>(`${this.baseUrl}/supported-configs`);
      return response.data;
    } catch (error) {
      console.error('获取配置选项失败:', error);
      throw error;
    }
  }

  /**
   * 分析Collection向量数据
   */
  async analyzeCollectionVectors(collectionId: string): Promise<VectorAnalysis> {
    try {
      const response = await api.get<VectorAnalysis>(
        `${this.baseUrl}/collections/${collectionId}/analysis`
      );
      return response.data;
    } catch (error) {
      console.error('分析向量数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取Collection索引状态
   */
  async getIndexStatus(collectionId: string): Promise<IndexStatus[]> {
    try {
      const response = await api.get<IndexStatus[]>(
        `${this.baseUrl}/collections/${collectionId}/status`
      );
      return response.data;
    } catch (error) {
      console.error('获取索引状态失败:', error);
      throw error;
    }
  }

  /**
   * 创建向量索引
   */
  async createIndex(params: CreateIndexRequest): Promise<CreateIndexResponse> {
    try {
      const response = await api.post<CreateIndexResponse>(`${this.baseUrl}/create`, params);
      return response.data;
    } catch (error) {
      console.error('创建索引失败:', error);
      throw error;
    }
  }

  /**
   * 重建向量索引
   */
  async rebuildIndexes(params: RebuildIndexRequest): Promise<RebuildIndexResponse> {
    try {
      const response = await api.post<RebuildIndexResponse>(`${this.baseUrl}/rebuild`, params);
      return response.data;
    } catch (error) {
      console.error('重建索引失败:', error);
      throw error;
    }
  }

  /**
   * 获取索引健康状态摘要
   */
  async getIndexHealthSummary(collectionId: string): Promise<{
    total_fields: number;
    indexed_fields: number;
    healthy_indexes: number;
    total_size_mb: number;
    last_update: string;
  }> {
    try {
      const statuses = await this.getIndexStatus(collectionId);
      
      const totalFields = statuses.length;
      const indexedFields = statuses.filter(s => s.exists).length;
      const healthyIndexes = statuses.filter(s => s.exists && s.is_valid).length;
      const totalSizeMb = statuses.reduce((sum, s) => sum + s.size_mb, 0);
      const lastUpdate = statuses
        .map(s => s.last_rebuild)
        .filter(Boolean)
        .sort()
        .pop() || '';

      return {
        total_fields: totalFields,
        indexed_fields: indexedFields,
        healthy_indexes: healthyIndexes,
        total_size_mb: totalSizeMb,
        last_update: lastUpdate
      };
    } catch (error) {
      console.error('获取索引健康状态失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否需要重建索引
   */
  async checkRebuildNeeded(collectionId: string): Promise<{
    needs_rebuild: boolean;
    reasons: string[];
    affected_fields: string[];
  }> {
    try {
      const statuses = await this.getIndexStatus(collectionId);
      
      const reasons: string[] = [];
      const affectedFields: string[] = [];
      
      statuses.forEach(status => {
        if (!status.exists) {
          reasons.push(`${status.vector_field} 字段缺少索引`);
          affectedFields.push(status.vector_field);
        } else if (!status.is_valid) {
          reasons.push(`${status.vector_field} 字段索引异常`);
          affectedFields.push(status.vector_field);
        }
      });

      return {
        needs_rebuild: reasons.length > 0,
        reasons,
        affected_fields: affectedFields
      };
    } catch (error) {
      console.error('检查重建需求失败:', error);
      throw error;
    }
  }

  /**
   * 获取索引性能建议
   */
  async getPerformanceRecommendations(collectionId: string): Promise<{
    recommendations: Array<{
      field: string;
      current_config: string;
      suggested_config: string;
      reason: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      const [analysis, statuses] = await Promise.all([
        this.analyzeCollectionVectors(collectionId),
        this.getIndexStatus(collectionId)
      ]);

      const recommendations: Array<{
        field: string;
        current_config: string;
        suggested_config: string;
        reason: string;
        impact: 'high' | 'medium' | 'low';
      }> = [];

      // 分析每个向量字段
      Object.entries(analysis.vector_statistics).forEach(([field, stats]) => {
        const status = statuses.find(s => s.vector_field === field);
        
        if (stats.count > 0) {
          // 检查是否缺少索引
          if (!status?.exists) {
            recommendations.push({
              field,
              current_config: '无索引',
              suggested_config: 'HNSW (默认配置)',
              reason: '该字段有向量数据但缺少索引，查询性能较差',
              impact: 'high'
            });
          }
          // 检查索引类型是否合适（这里简化处理，实际可以根据数据量给出更精确建议）
          else if (status.index_type === 'none') {
            recommendations.push({
              field,
              current_config: '无有效索引',
              suggested_config: 'HNSW (默认配置)',
              reason: '索引状态异常，需要重建',
              impact: 'high'
            });
          }
        }
      });

      return { recommendations };
    } catch (error) {
      console.error('获取性能建议失败:', error);
      throw error;
    }
  }
}

// 创建服务实例
export const vectorIndexService = new VectorIndexService();

export default vectorIndexService;