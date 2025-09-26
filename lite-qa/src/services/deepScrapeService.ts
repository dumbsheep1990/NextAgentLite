/**
 * 智能爬虫服务 - 对接智能抓取后端API
 */
import type { ApiResponse } from '../types';
import { getApiBaseUrl } from '../config/appConfig';

// DeepScrape任务相关类型
export interface DeepScrapeTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'single_url' | 'batch_urls' | 'website_crawl';
  urls: string[];
  progress: number;
  created_at: string;
  updated_at: string;
  options?: any;
  results?: any[];
  error?: string;
  collection_id?: string;
  collection_name?: string;
  folder_id?: string;
  folder_path?: string;
  metadata?: {
    total_urls: number;
    completed_urls: number;
    failed_urls: number;
    start_time?: string;
    end_time?: string;
    duration?: number;
  };
}

export interface DeepScrapeRequest {
  urls: string[];
  extraction_schema?: any;
  summary_enabled?: boolean;
  max_summary_length?: number;
  batch_mode?: boolean;
  concurrency?: number;
  options?: any;
}

export interface DeepScrapeToKnowledgeRequest extends DeepScrapeRequest {
  collection_id?: string;
  folder_id?: string;
}

export interface DeepScrapeResponse {
  success: boolean;
  message: string;
  task_id?: string;
  results?: any[];
  statistics?: any;
}

export interface DeepScrapeTaskListResponse {
  success: boolean;
  tasks: DeepScrapeTask[];
  total: number;
  page: number;
  size: number;
}

export class DeepScrapeService {
  // 使用 API base（已含 /api/v1），所有具体接口使用相对路径 /url-crawl/...
  private baseUrl = getApiBaseUrl();

  /**
   * 获取DeepScrape服务状态
   */
  async getServiceStatus(): Promise<{ status: string; health: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/url-crawl/config`);
      const data = await response.json();
      return {
        status: data.success ? 'healthy' : 'error',
        health: data.engines?.deepscrape || { available: false }
      };
    } catch (error) {
      return {
        status: 'error',
        health: { available: false, error: error.message }
      };
    }
  }

  /**
   * 提交URL抓取任务
   */
  async submitScrapeTask(request: DeepScrapeRequest): Promise<DeepScrapeResponse> {
    const response = await fetch(`${this.baseUrl}/url-crawl/deepscrape-with-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`智能抓取请求失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 提交URL抓取到知识库任务
   */
  async submitScrapeToKnowledgeTask(request: DeepScrapeToKnowledgeRequest): Promise<DeepScrapeResponse> {
    const response = await fetch(`${this.baseUrl}/url-crawl/deepscrape-to-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`智能抓取到知识库请求失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 网站爬取
   */
  async submitWebsiteCrawl(request: {
    start_url: string;
    limit?: number;
    max_depth?: number;
    include_paths?: string[];
    options?: any;
  }): Promise<DeepScrapeResponse> {
    const response = await fetch(`${this.baseUrl}/url-crawl/deepscrape/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`网站爬取请求失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取任务列表
   */
  async getTaskList(params: {
    page?: number;
    size?: number;
    status?: string;
  } = {}): Promise<DeepScrapeTaskListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${this.baseUrl}/url-crawl/tasks?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`获取任务列表失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId: string): Promise<DeepScrapeTask | null> {
    const response = await fetch(`${this.baseUrl}/url-crawl/tasks/${taskId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`获取任务详情失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.task : null;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/url-crawl/tasks/${taskId}/cancel`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`取消任务失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/url-crawl/tasks/${taskId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`删除任务失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 验证URL可访问性
   */
  async validateUrl(url: string): Promise<{
    valid: boolean;
    message: string;
    title?: string;
    content_type?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/url-crawl/validate?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`URL验证失败: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const deepScrapeService = new DeepScrapeService();
export default deepScrapeService;
