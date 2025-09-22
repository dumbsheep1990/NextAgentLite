/**
 * QA生成服务API客户端
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface QATask {
  id: number;
  document_id: number;
  document_title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  qa_pairs_count: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface QAPair {
  id: number;
  question: string;
  answer: string;
  summary?: string;
  source_chunk?: string;
  metadata?: Record<string, any>;
  similarity_score?: number;
  created_at?: string;
}

export interface QATaskCreateRequest {
  document_id: number;
}

export interface QASearchRequest {
  query: string;
  vector_field?: 'question' | 'answer';
  limit?: number;
}

export interface QAStatistics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  processing_tasks: number;
  total_qa_pairs: number;
  avg_qa_pairs_per_task: number;
}

export interface QATaskListResponse {
  tasks: QATask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class QAGenerationService {
  private baseURL = `${API_BASE_URL}/api/v1/qa-generation`;

  /**
   * 创建QA生成任务
   */
  async createQATask(request: QATaskCreateRequest): Promise<QATask> {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create QA task');
    }

    const result: APIResponse<QATask> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create QA task');
    }

    return result.data;
  }

  /**
   * 获取QA任务状态
   */
  async getQATaskStatus(taskId: number): Promise<QATask> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get task status');
    }

    const result: APIResponse<QATask> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get task status');
    }

    return result.data;
  }

  /**
   * 获取任务的QA对
   */
  async getQAPairsByTask(taskId: number, limit = 50): Promise<QAPair[]> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}/qa-pairs?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get QA pairs');
    }

    const result: APIResponse<{ task_id: number; qa_pairs: QAPair[]; count: number }> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get QA pairs');
    }

    return result.data.qa_pairs;
  }

  /**
   * 搜索QA对
   */
  async searchQAPairs(request: QASearchRequest): Promise<QAPair[]> {
    const response = await fetch(`${this.baseURL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to search QA pairs');
    }

    const result: APIResponse<{ query: string; results: QAPair[]; count: number }> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to search QA pairs');
    }

    return result.data.results;
  }

  /**
   * 获取QA统计信息
   */
  async getQAStatistics(): Promise<QAStatistics> {
    const response = await fetch(`${this.baseURL}/statistics`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get statistics');
    }

    const result: APIResponse<QAStatistics> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get statistics');
    }

    return result.data;
  }

  /**
   * 获取QA任务列表
   */
  async getQATaskList(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<QATaskListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${this.baseURL}/tasks?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get task list');
    }

    const result: APIResponse<QATaskListResponse> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to get task list');
    }

    return result.data;
  }

  /**
   * 删除QA任务
   */
  async deleteQATask(taskId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete task');
    }

    const result: APIResponse<{ message: string }> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete task');
    }
  }

  /**
   * 获取知识库文档列表（用于选择要处理的文档）
   */
  async getKnowledgeDocuments(collectionId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (collectionId) {
      params.append('collection_id', collectionId);
    }

    const response = await fetch(`${API_BASE_URL}/api/knowledge/documents?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get documents');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * 获取知识库集合列表
   */
  async getCollections(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/collections`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get collections');
    }

    const result = await response.json();
    return result.data || [];
  }
}

export const qaGenerationService = new QAGenerationService();