/**
 * 状态统一化工具函数
 * 处理系统中 vectorized 和 completed 状态的一致性问题
 */

/**
 * 标准化文档状态
 * 将 completed 映射为 vectorized，保持系统一致性
 */
export function normalizeDocumentStatus(status: string): string {
  if (status === 'completed') {
    return 'vectorized';
  }
  return status;
}

/**
 * 检查文档是否已向量化
 * 同时兼容 vectorized 和 completed 状态
 */
export function isDocumentVectorized(status: string): boolean {
  const normalizedStatus = normalizeDocumentStatus(status);
  return normalizedStatus === 'vectorized';
}

/**
 * 获取状态显示文本
 */
export function getStatusDisplayText(status: string): string {
  const normalizedStatus = normalizeDocumentStatus(status);
  
  const statusMap: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'vectorized': '已向量化',
    'failed': '失败',
    'graph_extracted': '图谱已提取'
  };
  
  return statusMap[normalizedStatus] || status;
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = normalizeDocumentStatus(status);
  
  const colorMap: Record<string, string> = {
    'pending': 'orange',
    'processing': 'blue',
    'vectorized': 'green',
    'failed': 'red',
    'graph_extracted': 'purple'
  };
  
  return colorMap[normalizedStatus] || 'default';
}

/**
 * 获取状态图标类名
 */
export function getStatusIconClass(status: string): string {
  const normalizedStatus = normalizeDocumentStatus(status);
  
  const iconMap: Record<string, string> = {
    'pending': 'clock-circle',
    'processing': 'loading',
    'vectorized': 'check-circle',
    'failed': 'close-circle',
    'graph_extracted': 'share-alt'
  };
  
  return iconMap[normalizedStatus] || 'question-circle';
}

/**
 * 标准化向量状态
 */
export function normalizeVectorStatus(vectorStatus: any): any {
  if (!vectorStatus) return null;
  
  if (typeof vectorStatus === 'string') {
    try {
      vectorStatus = JSON.parse(vectorStatus);
    } catch {
      return vectorStatus;
    }
  }
  
  if (vectorStatus.status === 'completed') {
    return {
      ...vectorStatus,
      status: 'vectorized'
    };
  }
  
  return vectorStatus;
}