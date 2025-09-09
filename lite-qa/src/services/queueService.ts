/**
 * 文件处理队列服务
 */
import { apiService } from './api';

export interface QueueTask {
  id: string;
  file_name: string;
  task_type: 'document_processing' | 'qa_dataset_processing';
  priority: number;
  created_at: string;
  started_at?: string;
}

export interface RunningTask {
  id: string;
  file_name: string;
  task_type: 'document_processing' | 'qa_dataset_processing';
  started_at?: string;
}

export interface QueueStatus {
  pending_count: number;
  running_count: number;
  completed_count: number;
  max_concurrent: number;
  pending_tasks: QueueTask[];
  running_tasks: RunningTask[];
}

export interface TaskStatus {
  id: string;
  task_type: 'document_processing' | 'qa_dataset_processing';
  file_name: string;
  file_size: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class QueueService {
  private baseUrl = '/queue';

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const response = await apiService.get<ApiResponse<QueueStatus>>(`${this.baseUrl}/status`);
    
    if (!response.success) {
      throw new Error(response.message || '获取队列状态失败');
    }
    
    return response.data;
  }

  /**
   * 获取特定任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await apiService.get<ApiResponse<TaskStatus>>(`${this.baseUrl}/task/${taskId}`);
    
    if (!response.success) {
      throw new Error(response.message || '获取任务状态失败');
    }
    
    return response.data;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    const response = await apiService.post<ApiResponse<any>>(`${this.baseUrl}/task/${taskId}/cancel`);
    
    if (!response.success) {
      throw new Error(response.message || '取消任务失败');
    }
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedTasks(maxKeep: number = 100): Promise<void> {
    const response = await apiService.post<ApiResponse<any>>(`${this.baseUrl}/cleanup`, { max_keep: maxKeep });
    
    if (!response.success) {
      throw new Error(response.message || '清理任务失败');
    }
  }

  /**
   * 获取任务类型的中文名称
   */
  getTaskTypeName(taskType: string): string {
    switch (taskType) {
      case 'document_processing':
        return '文档处理';
      case 'qa_dataset_processing':
        return 'QA数据集处理';
      default:
        return '未知类型';
    }
  }

  /**
   * 获取任务状态的中文名称
   */
  getTaskStatusName(status: string): string {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'running':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知状态';
    }
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
   * 计算任务执行时间
   */
  calculateDuration(startTime?: string, endTime?: string): string {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}秒`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  }
}

export const queueService = new QueueService();