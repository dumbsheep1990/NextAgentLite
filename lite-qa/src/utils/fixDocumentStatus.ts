/**
 * 修复文档状态工具
 * 调用后端API将所有 completed 状态改为 vectorized
 */
import { apiService } from '@/services/apiService';
import { message } from 'antd';

export interface StatusCheckResult {
  status_distribution: Record<string, number>;
  total_documents: number;
  has_completed_status: boolean;
  examples: {
    completed: Array<{
      id: string;
      title: string;
      filename: string;
      status: string;
    }>;
    vectorized: Array<{
      id: string;
      title: string;
      filename: string;
      status: string;
    }>;
  };
}

export interface StatusFixResult {
  success: boolean;
  message?: string;
  error?: string;
  before: Record<string, number>;
  after: Record<string, number>;
  updated: {
    status_field: number;
    vector_status_field: number;
  };
}

/**
 * 检查当前文档状态分布
 */
export async function checkDocumentStatus(): Promise<StatusCheckResult> {
  try {
    const response = await apiService.get<StatusCheckResult>('/fix/check-document-status');
    return response;
  } catch (error) {
    console.error('检查文档状态失败:', error);
    throw error;
  }
}

/**
 * 修复文档状态
 */
export async function fixDocumentStatus(): Promise<StatusFixResult> {
  try {
    const response = await apiService.post<StatusFixResult>('/fix/fix-document-status');
    
    if (response.success) {
      message.success(`状态修复成功！更新了 ${response.updated.status_field} 个文档`);
    } else {
      message.error('状态修复失败：' + (response.error || '未知错误'));
    }
    
    return response;
  } catch (error) {
    console.error('修复文档状态失败:', error);
    message.error('修复文档状态失败');
    throw error;
  }
}

/**
 * 检查并修复文档状态（如果需要）
 */
export async function checkAndFixDocumentStatus(): Promise<void> {
  try {
    // 先检查状态
    const checkResult = await checkDocumentStatus();
    
    console.log('当前状态分布:', checkResult.status_distribution);
    
    if (checkResult.has_completed_status) {
      console.log(`发现 ${checkResult.status_distribution.completed || 0} 个文档使用 completed 状态，开始修复...`);
      
      // 执行修复
      const fixResult = await fixDocumentStatus();
      
      console.log('修复前:', fixResult.before);
      console.log('修复后:', fixResult.after);
      console.log(`更新了 ${fixResult.updated.status_field} 个文档的 status 字段`);
      console.log(`更新了 ${fixResult.updated.vector_status_field} 个文档的 vector_status 字段`);
      
      // 刷新页面以显示更新后的状态
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      console.log('所有文档状态已正确，无需修复');
      message.info('所有文档状态已正确，无需修复');
    }
  } catch (error) {
    console.error('检查和修复状态失败:', error);
  }
}

// 导出到全局以便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).fixDocumentStatus = checkAndFixDocumentStatus;
}