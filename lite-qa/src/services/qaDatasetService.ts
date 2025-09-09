/**
 * QA数据集服务
 */
import { api } from './api';

export interface QADataset {
  id: string;
  title: string;
  description: string;
  category: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  vectorization_status: 'pending' | 'processing' | 'completed' | 'failed';
  total_qa_pairs: number;
  processed_qa_pairs: number;
  categories_count: number;
  vector_model: string;
  processing_logs?: any; // 添加处理日志字段
  created_at: string;
  updated_at: string;
}

export interface QAPair {
  id: string;
  category: string;
  question: string;
  answer: string;
  row_number: number;
  source_sheet: string;
  vector_status: string;
  quality_score: number;
  is_validated: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface QADatasetListResponse {
  total: number;
  datasets: QADataset[];
  limit: number;
  offset: number;
}

export interface QAPairListResponse {
  total: number;
  qa_pairs: QAPair[];
  limit: number;
  offset: number;
  dataset_id: string;
  category?: string;
}

export interface UploadResponse {
  dataset_id: string;
  status: 'uploaded' | 'duplicate';
  message: string;
  preview?: {
    sheets: string[];
    columns: string[];
    total_rows: number;
    categories: string[];
    categories_count: number;
    preview_data: any[];
  };
}

export interface ProcessingStatus {
  dataset_id: string;
  status: string;
  vectorization_status: string;
  total_qa_pairs: number;
  vectorized_qa_pairs: number;
  categories_count: number;
  processing_logs: any;
  updated_at: string;
}

class QADatasetService {
  private baseUrl = '/qa-dataset';

  /**
   * 获取QA数据集列表
   */
  async listDatasets(status?: string, limit = 50, offset = 0): Promise<QADatasetListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`${this.baseUrl}/list?${params.toString()}`);
    return response.data;
  }

  /**
   * 上传QA数据集
   */
  async uploadDataset(formData: FormData): Promise<UploadResponse> {
    const response = await api.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 获取QA数据集详情
   */
  async getDatasetDetail(datasetId: string): Promise<QADataset> {
    const response = await api.get(`${this.baseUrl}/${datasetId}/detail`);
    return response.data;
  }

  /**
   * 获取QA数据集的问答对列表
   */
  async getQAPairs(
    datasetId: string,
    category?: string,
    limit = 20,
    offset = 0
  ): Promise<QAPairListResponse> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`${this.baseUrl}/${datasetId}/qa-pairs?${params.toString()}`);
    return response.data;
  }

  /**
   * 删除QA数据集
   */
  async deleteDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${datasetId}`);
    return response.data;
  }

  /**
   * 重新处理QA数据集
   */
  async reprocessDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${this.baseUrl}/${datasetId}/reprocess`);
    return response.data;
  }

  /**
   * 获取处理状态
   */
  async getProcessingStatus(datasetId: string): Promise<ProcessingStatus> {
    const response = await api.get(`${this.baseUrl}/${datasetId}/processing-status`);
    return response.data;
  }

  /**
   * 获取数据集状态 (用于轮询)
   */
  async getDatasetStatus(datasetId: string): Promise<Partial<QADataset> | null> {
    try {
      const response = await api.get(`${this.baseUrl}/${datasetId}/processing-status`);
      return response.data;
    } catch (error) {
      console.error(`获取QA数据集状态失败 ${datasetId}:`, error);
      return null;
    }
  }

  /**
   * 批量获取多个数据集的处理状态
   */
  async batchGetProcessingStatus(datasetIds: string[]): Promise<ProcessingStatus[]> {
    const promises = datasetIds.map(id => this.getProcessingStatus(id));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ProcessingStatus> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * 轮询处理状态 - 已废弃，改为SSE推送
   * @deprecated 使用统一SSE推送替代HTTP轮询
   */
  async pollProcessingStatus(
    datasetId: string,
    onUpdate: (status: ProcessingStatus) => void,
    interval = 3000,
    maxAttempts = 100
  ): Promise<void> {
    console.warn('⚠️ pollProcessingStatus已废弃，请使用统一SSE推送获取状态更新');
    // 不再执行轮询逻辑，改为SSE推送
  }

  /**
   * 获取数据集统计信息
   */
  async getDatasetStats(): Promise<{
    totalDatasets: number;
    completedDatasets: number;
    processingDatasets: number;
    failedDatasets: number;
    totalQAPairs: number;
    vectorizedQAPairs: number;
  }> {
    try {
      const response = await this.listDatasets();
      const datasets: QADataset[] = Array.isArray(response) ? response : response.datasets;
      
      const stats = {
        totalDatasets: datasets.length,
        completedDatasets: datasets.filter(d => d.status === 'completed').length,
        processingDatasets: datasets.filter(d => d.status === 'processing').length,
        failedDatasets: datasets.filter(d => d.status === 'failed').length,
        totalQAPairs: datasets.reduce((sum, d) => sum + (d.total_qa_pairs || 0), 0),
        vectorizedQAPairs: datasets.reduce((sum, d) => sum + (d.processed_qa_pairs || 0), 0)
      };
      
      return stats;
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalDatasets: 0,
        completedDatasets: 0,
        processingDatasets: 0,
        failedDatasets: 0,
        totalQAPairs: 0,
        vectorizedQAPairs: 0
      };
    }
  }

  /**
   * 验证Excel文件格式
   */
  validateExcelFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      errors.push('文件类型不正确，请选择Excel文件(.xlsx或.xls)');
    }
    
    // 检查文件大小 (50MB限制)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('文件大小不能超过50MB');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 获取快速测试问题列表（基于热门问题）
   */
  async getQuickTestQuestions(limit = 5): Promise<string[]> {
    try {
      // 方案1: 尝试获取基于使用统计的热门问题
      const response = await api.get(`${this.baseUrl}/popular-questions?limit=${limit}`);
      return response.data.questions || [];
    } catch (error) {
      console.warn('获取热门问题失败，尝试从QA数据集中随机获取问题:', error);
      
      try {
        // 方案2: 从现有QA数据集中随机获取问题
        const datasetsResponse = await this.listDatasets('completed', 1, 0);
        if (datasetsResponse.datasets && datasetsResponse.datasets.length > 0) {
          const firstDataset = datasetsResponse.datasets[0];
          const qaPairsResponse = await this.getQAPairs(firstDataset.id, undefined, limit, 0);
          return qaPairsResponse.qa_pairs.map(pair => pair.question);
        }
      } catch (secondError) {
        console.warn('从QA数据集获取问题也失败:', secondError);
      }
      
      // 方案3: 返回默认问题作为最后的后备
      return [
        'AI智能体如何协作处理复杂问题？',
        '多模态信息如何融合处理？',
        '知识图谱在问答中的作用机制',
        '向量检索技术的核心原理',
        'SiO₂/Al₂O₃摩尔比的最佳范围'
      ];
    }
  }

  /**
   * 格式化处理进度
   */
  getProcessingProgress(dataset: QADataset): {
    percentage: number;
    status: string;
    description: string;
  } {
    if (dataset.status === 'failed') {
      return {
        percentage: 0,
        status: 'exception',
        description: '处理失败'
      };
    }
    
    if (dataset.status === 'completed') {
      if (dataset.vectorization_status === 'completed') {
        return {
          percentage: 100,
          status: 'success',
          description: '处理完成'
        };
      } else if (dataset.vectorization_status === 'processing') {
        const progress = dataset.total_qa_pairs > 0 
          ? Math.round((dataset.processed_qa_pairs / dataset.total_qa_pairs) * 100)
          : 50;
        return {
          percentage: progress,
          status: 'active',
          description: `向量化中 ${dataset.processed_qa_pairs}/${dataset.total_qa_pairs}`
        };
      } else if (dataset.vectorization_status === 'failed') {
        return {
          percentage: 50,
          status: 'exception',
          description: '向量化失败'
        };
      }
    }
    
    if (dataset.status === 'processing') {
      return {
        percentage: 30,
        status: 'active',
        description: '解析处理中...'
      };
    }
    
    return {
      percentage: 0,
      status: 'normal',
      description: '等待处理'
    };
  }
}

export const qaDatasetService = new QADatasetService();