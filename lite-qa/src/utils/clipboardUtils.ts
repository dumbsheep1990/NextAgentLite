/**
 * 剪贴板工具函数
 * 兼容HTTPS和HTTP环境，以及不支持Clipboard API的浏览器
 */

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 方法1：使用现代 Clipboard API（需要HTTPS或localhost）
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 方法2：使用传统的 document.execCommand（兼容HTTP环境）
    return fallbackCopyTextToClipboard(text);
  } catch (error) {
    console.warn('复制失败，尝试备用方法:', error);
    // 备用方法失败时，尝试传统方法
    return fallbackCopyTextToClipboard(text);
  }
};

/**
 * 备用复制方法 - 使用传统的 document.execCommand
 * 适用于不支持 Clipboard API 的环境
 */
function fallbackCopyTextToClipboard(text: string): boolean {
  try {
    // 创建临时文本框
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式，确保不影响页面布局
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    
    // 添加到DOM
    document.body.appendChild(textArea);
    
    // 选择文本
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // 兼容移动设备
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    
    // 清理
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('备用复制方法也失败了:', error);
    return false;
  }
}

/**
 * 检查当前环境是否支持 Clipboard API
 */
export const isClipboardApiSupported = (): boolean => {
  return !!(navigator.clipboard && typeof navigator.clipboard.writeText === 'function');
};

/**
 * 检查当前环境是否为安全上下文（HTTPS或localhost）
 */
export const isSecureContext = (): boolean => {
  return !!(window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost');
};

/**
 * 获取复制功能的可用性信息
 */
export const getClipboardInfo = () => {
  return {
    hasClipboardApi: isClipboardApiSupported(),
    isSecureContext: isSecureContext(),
    fallbackAvailable: typeof document.execCommand === 'function'
  };
}; 