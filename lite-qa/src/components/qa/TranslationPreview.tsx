/**
 * 翻译预览组件 - 实时显示翻译结果
 * 基于WebSocket的实时翻译预览，显示在输入框上方
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Skeleton, Alert, Button, Tooltip, Tag, message } from 'antd';
import { 
  TranslationOutlined, 
  CloseOutlined, 
  LoadingOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { getWebSocketUrl } from '../../config/appConfig';
// Using CSS transitions instead of framer-motion

const { Text, Paragraph } = Typography;

interface TranslationResult {
  text: string;
  translated_text: string;
  show_translation: boolean;
  source_language?: string;
  target_language?: string;
  confidence?: number;
  processing_time?: number;
  model_used?: string;
  timestamp: number;
}

interface TranslationPreviewProps {
  inputText: string;
  enabled: boolean;
  model?: string;
  onClose?: () => void;
  className?: string;
}

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  inputText,
  enabled,
  model,
  onClose,
  className = ''
}) => {
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>('');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 生成客户端ID
  const generateClientId = useCallback(() => {
    return `translation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 连接WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enabled) return;
    
    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      clientIdRef.current = generateClientId();
      const wsUrl = getWebSocketUrl(`api/v1/ws/translation/${clientIdRef.current}`);
      
      console.log('🔗 [TranslationPreview] 连接WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ [TranslationPreview] WebSocket连接成功');
        setIsConnected(true);
        setError(null);
        
        // 清除重连定时器
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 [TranslationPreview] 收到消息:', message);
          
          switch (message.type) {
            case 'connection_confirmed':
              console.log('🤝 [TranslationPreview] 连接已确认');
              break;
              
            case 'translation_status':
              if (message.status === 'translating') {
                setIsTranslating(true);
                setError(null);
              }
              break;
              
            case 'translation_result':
              setTranslationResult(message);
              setIsTranslating(false);
              setError(null);
              break;
              
            case 'translation_error':
              setError(message.error || '翻译失败');
              setIsTranslating(false);
              setTranslationResult(null);
              break;
              
            case 'pong':
              // 心跳响应
              break;
              
            default:
              console.log('❓ [TranslationPreview] 未知消息类型:', message.type);
          }
        } catch (err) {
          console.error('❌ [TranslationPreview] 解析消息失败:', err);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('❌ [TranslationPreview] WebSocket连接关闭:', event.code, event.reason);
        setIsConnected(false);
        setIsTranslating(false);
        
        // 如果启用状态且不是主动关闭，则尝试重连
        if (enabled && event.code !== 1000) {
          console.log('🔄 [TranslationPreview] 3秒后尝试重连...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ [TranslationPreview] WebSocket错误:', error);
        setError('WebSocket连接错误');
        setIsConnected(false);
        setIsTranslating(false);
      };
      
    } catch (err) {
      console.error('❌ [TranslationPreview] 创建WebSocket失败:', err);
      setError('WebSocket连接创建失败');
    }
  }, [enabled, generateClientId]);

  // 断开WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Normal closure');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsTranslating(false);
    setError(null);
  }, []);

  // 发送翻译请求
  const sendTranslationRequest = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('⚠️ [TranslationPreview] WebSocket未连接，跳过翻译请求');
      return;
    }
    
    const message = {
      type: 'translation_request',
      text: text.trim(),
      model: model,
      enable_translation: enabled,
      timestamp: Date.now()
    };
    
    console.log('📤 [TranslationPreview] 发送翻译请求:', message);
    
    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      console.error('❌ [TranslationPreview] 发送消息失败:', err);
      setError('发送翻译请求失败');
    }
  }, [model, enabled]);

  // 处理输入文本变化（带防抖）
  useEffect(() => {
    if (!enabled || !inputText.trim()) {
      setTranslationResult(null);
      setIsTranslating(false);
      return;
    }
    
    // 清除之前的防抖定时器
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // 设置新的防抖定时器
    debounceTimeoutRef.current = setTimeout(() => {
      sendTranslationRequest(inputText);
    }, 800); // 800ms防抖延迟
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputText, enabled, sendTranslationRequest]);

  // 处理启用状态变化
  useEffect(() => {
    if (enabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setTranslationResult(null);
      setError(null);
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [enabled, connectWebSocket, disconnectWebSocket]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [disconnectWebSocket]);

  // 复制翻译结果
  const handleCopy = useCallback(async () => {
    if (translationResult?.translated_text) {
      const success = await copyToClipboard(translationResult.translated_text);
      if (success) {
        setCopied(true);
        message.success('翻译结果已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      } else {
        message.error('复制失败，请手动复制');
      }
    }
  }, [translationResult]);

  // 如果翻译功能未启用，不显示组件
  if (!enabled) {
    return null;
  }

  // 如果没有输入文本，不显示组件
  if (!inputText.trim()) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto mb-3 ${className}`}
      style={{
        animation: 'slideInFromTop 0.3s ease-out'
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg border overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            {isTranslating ? (
              <LoadingOutlined className="text-blue-600" />
            ) : (
              <TranslationOutlined className="text-blue-600" />
            )}
            <Text className="font-medium text-gray-700 text-sm">
              {isTranslating ? '正在翻译...' : '英文翻译'}
            </Text>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* 复制按钮 */}
            {translationResult?.show_translation && (
              <Tooltip title={copied ? '已复制!' : '复制翻译结果'}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  className={`w-6 h-6 rounded ${copied ? 'text-green-600' : 'text-gray-500 hover:text-blue-600'} transition-all duration-200`}
                />
              </Tooltip>
            )}
            
            {/* 关闭按钮 */}
            {onClose && (
              <Tooltip title="关闭翻译预览">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={onClose}
                  className="w-6 h-6 rounded text-gray-500 hover:text-red-600 transition-all duration-200"
                />
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* 翻译结果 */}
        <div className="p-3">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-3"
              closable
              onClose={() => setError(null)}
            />
          )}
          
          {isTranslating ? (
            <div className="flex items-center space-x-2 py-2">
              <LoadingOutlined className="text-blue-600" />
              <Text className="text-gray-600 text-sm">翻译中...</Text>
            </div>
          ) : translationResult?.show_translation ? (
            <div>
              <Paragraph className="text-sm text-gray-800 mb-2 leading-relaxed">
                {translationResult.translated_text}
              </Paragraph>
              {translationResult?.processing_time && (
                <Text className="text-xs text-gray-400">
                  {translationResult.processing_time.toFixed(2)}s
                  {translationResult?.model_used && ` • ${translationResult.model_used}`}
                </Text>
              )}
            </div>
          ) : (
            <Text className="text-gray-500 text-xs">
              {inputText.length < 2 ? '请输入更多文字以开始翻译' : '检测到非中文文本，无需翻译'}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationPreview;