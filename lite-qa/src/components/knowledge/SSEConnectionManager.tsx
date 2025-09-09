/**
 * SSE连接管理器 - 简化版
 * 负责建立SSE连接，移除toast提示，改为状态指示器
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { documentStatusSSE } from '../../services/sseService';

interface SSEConnectionManagerProps {
  sessionId: string;
  onConnectionStatusChange?: (status: string) => void;
}

export const SSEConnectionManager: React.FC<SSEConnectionManagerProps> = ({ 
  sessionId, 
  onConnectionStatusChange 
}) => {
  const isInitialized = useRef(false);
  const currentSessionId = useRef<string | null>(null);
  const statusCallbackRef = useRef(onConnectionStatusChange);

  // 更新回调引用但不触发重新连接
  statusCallbackRef.current = onConnectionStatusChange;

  const handleConnectionStatus = useCallback((event: CustomEvent) => {
    const { status } = event.detail;
    console.log('📡 SSE连接状态变化:', status);
    statusCallbackRef.current?.(status);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      console.warn('📡 SSE连接管理器: 缺少sessionId');
      return;
    }

    // 检查是否需要建立新连接
    const needsConnection = 
      !isInitialized.current || 
      currentSessionId.current !== sessionId ||
      !documentStatusSSE.isConnected();

    if (!needsConnection) {
      console.log('📡 SSE连接管理器: 连接已存在，跳过重复连接');
      return;
    }

    console.log('📡 SSE连接管理器启动，会话ID:', sessionId);
    currentSessionId.current = sessionId;
    isInitialized.current = true;

    // 建立SSE连接
    const connectSSE = async () => {
      try {
        await documentStatusSSE.connect(sessionId);
      } catch (error) {
        console.error('📡 SSE连接失败:', error);
      }
    };

    connectSSE();

    // 监听连接状态变化
    window.addEventListener('sse-connection-status', handleConnectionStatus as EventListener);

    // 清理函数 - 只移除事件监听器，不断开连接
    return () => {
      window.removeEventListener('sse-connection-status', handleConnectionStatus as EventListener);
    };
  }, [sessionId, handleConnectionStatus]);

  // SSEConnectionManager不渲染任何UI，由SSEStatusIndicator负责显示状态
  return null;
}; 