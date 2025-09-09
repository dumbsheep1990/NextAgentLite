/**
 * 时间格式化工具
 */

/**
 * 格式化时间为友好的显示格式
 * @param timeString - ISO时间字符串，如 "2025-07-04T18:06:21.537758+08:00"
 * @returns 格式化后的时间字符串，如 "2025-07-04 18:06"
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    
    // 检查是否是有效日期
    if (isNaN(date.getTime())) {
      return timeString; // 如果解析失败，返回原字符串
    }
    
    // 格式化为 YYYY-MM-DD HH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.warn('时间格式化失败:', error);
    return timeString;
  }
}

/**
 * 格式化时间为相对时间
 * @param timeString - ISO时间字符串
 * @returns 相对时间字符串，如 "2小时前"
 */
export function formatRelativeTime(timeString: string): string {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return formatTime(timeString);
    }
  } catch (error) {
    console.warn('相对时间格式化失败:', error);
    return timeString;
  }
}