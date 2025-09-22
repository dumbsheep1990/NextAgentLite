/**
 * QA提取服务API
 */
import { apiService } from './api';
import type { ApiResponse } from '../types';

export interface QATask {
  id: number;
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  qa_pairs_count: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  document_title?: string;
}

export interface QAPair {
  id: number;
  question: string;
  answer: string;
  summary?: string;
  source_chunk?: string;
  metadata?: any;
  created_at: string;
}

export interface QAStatistics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  processing_tasks: number;
  total_qa_pairs: number;
  avg_qa_pairs_per_task: number;
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
}

export interface TaskListResponse {
  tasks: QATask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QAPairsResponse {
  task_id: number;
  qa_pairs: QAPair[];
  count: number;
}

export interface SearchRequest {
  query: string;
  vector_field: 'question' | 'answer';
  limit: number;
}

export interface SearchResponse {
  query: string;
  vector_field: string;
  results: (QAPair & { similarity: number })[];
  count: number;
}

export interface CreateTaskRequest {
  document_id: string;
}

export interface CreateTaskResponse {
  task_id: number;
  status: string;
  message: string;
}

class QAExtractionService {
  /**
   * 创建QA生成任务
   */
  async createTask(request: CreateTaskRequest): Promise<ApiResponse<CreateTaskResponse>> {
    return apiService.post('/qa-generation/tasks', request);
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: number): Promise<ApiResponse<QATask>> {
    return apiService.get(`/qa-generation/tasks/${taskId}`);
  }

  /**
   * 获取任务列表
   */
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<TaskListResponse>> {
    return apiService.get('/qa-generation/tasks', { params });
  }

  /**
   * 获取任务的QA对
   */
  async getTaskQAPairs(taskId: number, limit = 50): Promise<ApiResponse<QAPairsResponse>> {
    return apiService.get(`/qa-generation/tasks/${taskId}/qa-pairs`, {
      params: { limit }
    });
  }

  /**
   * 搜索QA对
   */
  async searchQAPairs(request: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    return apiService.post('/qa-generation/search', request);
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ApiResponse<QAStatistics>> {
    return apiService.get('/qa-generation/statistics');
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: number): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete(`/qa-generation/tasks/${taskId}`);
  }

  /**
   * 获取可用文档列表
   */
  async getDocuments(limit = 50): Promise<ApiResponse<{ documents: Document[]; count: number }>> {
    return apiService.get('/qa-generation/documents', {
      params: { limit }
    });
  }
}

export const qaExtractionService = new QAExtractionService();