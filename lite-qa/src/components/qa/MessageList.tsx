/**
 * QA消息列表容器组件
 */
import React, { useEffect, useRef } from 'react';
import { Spin, Empty, Button } from 'antd';
import { ReloadOutlined, MessageOutlined, BookOutlined, RobotOutlined } from '@ant-design/icons';
import { MessageItem } from './MessageItem';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  error?: string;
  onMessageAction?: (action: 'like' | 'dislike' | 'regenerate' | 'copy' | 'view_sources', messageId: string) => void;
  onImagePreview?: (image: string, title: string, desc: string) => void;
  onRetry?: () => void;
  className?: string;
  // 新增模式相关属性
  currentMode?: 'default' | 'team';
}

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  error,
  onMessageAction,
  onImagePreview,
  onRetry,
  className = '',
  currentMode = 'default'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 确保 messages 是数组
  const safeMessages = Array.isArray(messages) ? messages : [];

  // 自动滚动到底部 - 新消息或loading状态变化时滚动
  useEffect(() => {
    // 使用 setTimeout 确保 DOM 更新完成后再滚动
    const scrollToBottom = () => {
      if (containerRef.current) {
        // 强制滚动到最底部，确保不被输入框遮挡
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
    
    // 延迟滚动以确保内容已渲染
    const timeoutId = setTimeout(scrollToBottom, 150);
    
    return () => clearTimeout(timeoutId);
  }, [safeMessages.length, loading]); // 只依赖消息数量和loading状态

  // 强制滚动hook - 专门处理流式更新时的滚动
  useEffect(() => {
    const lastMessage = safeMessages[safeMessages.length - 1];
    if (lastMessage && lastMessage.type === 'assistant') {
      // 对于AI消息的任何更新，都应该检查是否需要滚动
      if (containerRef.current) {
        const container = containerRef.current;
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 400;
        
        // 如果消息正在加载，或者用户在底部附近且有内容更新
        if (lastMessage.loading || (lastMessage.content && (isAtBottom || isNearBottom))) {
          // 使用 requestAnimationFrame 确保DOM更新后再滚动
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: lastMessage.loading && !lastMessage.content ? 'instant' : 'smooth'
              });
            }
          });
        }
      }
    }
  }, [
    safeMessages[safeMessages.length - 1]?.content, 
    safeMessages[safeMessages.length - 1]?.loading,
    safeMessages[safeMessages.length - 1]?.thinking
  ]);

  // 添加一个额外的effect监听整个消息数组的变化，确保新消息能触发滚动
  useEffect(() => {
    if (safeMessages.length > 0) {
      const lastMessage = safeMessages[safeMessages.length - 1];
      if (lastMessage?.type === 'assistant' && containerRef.current) {
        // 对于新的AI消息，强制滚动到底部
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }
  }, [safeMessages]);

  // 处理消息操作
  const handleMessageAction = (action: 'like' | 'dislike' | 'regenerate' | 'copy' | 'view_sources', messageId: string) => {
    onMessageAction?.(action, messageId);
    
    // 处理复制操作
    if (action === 'copy') {
      const message = safeMessages.find(m => m.id === messageId);
      if (message) {
        import('../../utils/clipboardUtils').then(async ({ copyToClipboard }) => {
          const success = await copyToClipboard(message.content);
          if (success) {
            // 这里可以添加一个toast提示
            console.log('消息已复制到剪贴板');
          } else {
            console.log('复制失败');
          }
        });
      }
    }
  };

  // 渲染加载状态 - 简化专业的思考状态
  const renderLoading = () => (
    <div className="flex mb-8 px-4">
      <div className="mr-4 mt-1 flex-shrink-0">
        <div style={{
          width: '42px',
          height: '42px',
          background: 'rgba(243, 244, 246, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(229, 231, 235, 0.6)'
        }}>
          <RobotOutlined style={{ 
            color: '#6b7280', 
            fontSize: '18px',
            fontWeight: '500'
          }} />
        </div>
      </div>
      
      <div className="max-w-[85%] flex-1">
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: '20px',
          borderTopLeftRadius: '6px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="flex items-center space-x-3" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex space-x-1">
              <div style={{
                width: '4px',
                height: '4px',
                background: '#9ca3af',
                borderRadius: '50%',
                animation: 'simpleSlide 1.5s infinite ease-in-out',
                animationDelay: '0ms'
              }}></div>
              <div style={{
                width: '4px',
                height: '4px',
                background: '#9ca3af',
                borderRadius: '50%',
                animation: 'simpleSlide 1.5s infinite ease-in-out',
                animationDelay: '0.3s'
              }}></div>
              <div style={{
                width: '4px',
                height: '4px',
                background: '#9ca3af',
                borderRadius: '50%',
                animation: 'simpleSlide 1.5s infinite ease-in-out',
                animationDelay: '0.6s'
              }}></div>
            </div>
            <span style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>正在思考...</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-8 px-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
      {onRetry && (
        <Button 
          type="primary" 
          size="middle" 
          icon={<ReloadOutlined />}
          onClick={onRetry}
        >
          重试
        </Button>
      )}
    </div>
  );

  // 渲染空状态
  const renderEmpty = () => {
    if (currentMode === 'team') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-16 px-8">
          <div className="mb-6">
            <div className="relative w-24 h-24 mx-auto">
              {/* 外层装饰环 - Team协作风格 */}
              <div 
                className="absolute inset-0 rounded-full border-2 opacity-25"
                style={{
                  borderColor: '#f97316',
                  borderStyle: 'dashed'
                }}
              ></div>
              
              {/* 主体容器 - Team协作风格 */}
              <div 
                className="relative w-20 h-20 mx-auto mt-2 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)',
                  boxShadow: '0 0 24px rgba(249, 115, 22, 0.25), 0 8px 32px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  border: '2px solid rgba(249, 115, 22, 0.6)',
                  borderRadius: '16px',
                  position: 'relative'
                }}
              >
                {/* 内层高光效果 */}
                <div 
                  className="absolute inset-1 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(249, 115, 22, 0.1) 100%)',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}
                ></div>
                
                {/* Team协作图标 */}
                <div className="relative" style={{ zIndex: 2 }}>
                  {/* 中心智能体 */}
                  <div 
                    className="w-4 h-4 rounded-full absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      background: 'linear-gradient(45deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 0 8px rgba(249, 115, 22, 0.4), 0 2px 6px rgba(234, 88, 12, 0.3)'
                    }}
                  ></div>
                  
                  {/* 周围智能体 */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full absolute"
                    style={{
                      background: 'linear-gradient(45deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.5), 0 1px 4px rgba(5, 150, 105, 0.3)',
                      top: '-6px',
                      left: '8px'
                    }}
                  ></div>
                  <div 
                    className="w-2.5 h-2.5 rounded-full absolute"
                    style={{
                      background: 'linear-gradient(45deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.5), 0 1px 4px rgba(217, 119, 6, 0.3)',
                      bottom: '-6px',
                      right: '8px'
                    }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full absolute"
                    style={{
                      background: 'linear-gradient(45deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 0 6px rgba(249, 115, 22, 0.5), 0 1px 3px rgba(234, 88, 12, 0.3)',
                      top: '2px',
                      right: '-8px'
                    }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full absolute"
                    style={{
                      background: 'linear-gradient(45deg, #ef4444 0%, #dc2626 100%)',
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.5), 0 1px 3px rgba(220, 38, 38, 0.3)',
                      bottom: '2px',
                      left: '-8px'
                    }}
                  ></div>
                  
                  {/* 协作连接线 */}
                  <svg 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                  >
                    <g stroke="#f97316" strokeWidth="1.5" opacity="0.8">
                      <line x1="16" y1="16" x2="24" y2="10" />
                      <line x1="16" y1="16" x2="24" y2="22" />
                      <line x1="16" y1="16" x2="8" y2="10" />
                      <line x1="16" y1="16" x2="8" y2="22" />
                    </g>
                  </svg>
                </div>
              </div>
              
              {/* 底部标识 - Team标识 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                <div 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    fontSize: '10px',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)'
                  }}
                >
                  Team
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              NextAgentLite Team协作问答
            </h3>
            <p className="text-gray-600 max-w-md text-sm">
              多智能体协作系统，为您提供专业的多语言智能问答服务
            </p>
          </div>
          
          {/* Team模式快速问题示例 */}
          <div className="w-full max-w-2xl">
            <div className="text-center text-gray-600 text-sm mb-4">推荐问题：</div>
            <div className="space-y-2">
              {[
                {
                  icon: "🤖",
                  question: "多智能体协作的优势是什么？"
                },
                {
                  icon: "🌍",
                  question: "NextAgentLite如何处理复杂问题？"
                },
                {
                  icon: "⚡",
                  question: "智能问答系统的核心功能有哪些？"
                },
                {
                  icon: "📊",
                  question: "如何优化AI问答的准确性？"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center bg-white hover:bg-orange-50 text-gray-700 text-sm p-4 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-orange-300 hover:shadow-sm group"
                  onClick={() => {
                    // 触发问题填入输入框的事件
                    const event = new CustomEvent('quickQuestionClick', { 
                      detail: { question: item.question } 
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="flex-1">{item.question}</span>
                  <span className="text-gray-400 group-hover:text-orange-600 transition-colors">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // 默认模式 - 保持原有内容
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-8">
        <div className="mb-6">
          <div className="relative w-24 h-24 mx-auto">
            {/* 外层装饰环 - 表示AI智能网络 */}
            <div 
              className="absolute inset-0 rounded-full border-2 opacity-25"
              style={{
                borderColor: '#1e40af',
                borderStyle: 'dashed'
              }}
            ></div>
            
            {/* 主体容器 - 智能科技风格 */}
            <div 
              className="relative w-20 h-20 mx-auto mt-2 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.25), 0 8px 32px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '2px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '16px',
                position: 'relative'
              }}
            >
              {/* 内层高光效果 */}
              <div 
                className="absolute inset-1 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              ></div>
              {/* AI智能网络图标组合 */}
              <div className="relative" style={{ zIndex: 2 }}>
                {/* 中心AI核心 - 深蓝核心 */}
                <div 
                  className="w-4 h-4 rounded-full absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background: 'linear-gradient(45deg, #1e40af 0%, #2563eb 100%)',
                    boxShadow: '0 0 8px rgba(30, 64, 175, 0.4), 0 2px 6px rgba(37, 99, 235, 0.3)'
                  }}
                ></div>
                
                {/* 外围智能节点 - 明亮配色 */}
                <div 
                  className="w-2.5 h-2.5 rounded-full absolute"
                  style={{
                    background: 'linear-gradient(45deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 0 8px rgba(251, 191, 36, 0.5), 0 1px 4px rgba(245, 158, 11, 0.3)',
                    top: '-6px',
                    left: '8px'
                  }}
                ></div>
                <div 
                  className="w-2.5 h-2.5 rounded-full absolute"
                  style={{
                    background: 'linear-gradient(45deg, #34d399 0%, #10b981 100%)',
                    boxShadow: '0 0 8px rgba(52, 211, 153, 0.5), 0 1px 4px rgba(16, 185, 129, 0.3)',
                    bottom: '-6px',
                    right: '8px'
                  }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full absolute"
                  style={{
                    background: 'linear-gradient(45deg, #a78bfa 0%, #8b5cf6 100%)',
                    boxShadow: '0 0 6px rgba(167, 139, 250, 0.5), 0 1px 3px rgba(139, 92, 246, 0.3)',
                    top: '2px',
                    right: '-8px'
                  }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full absolute"
                  style={{
                    background: 'linear-gradient(45deg, #fb7185 0%, #f43f5e 100%)',
                    boxShadow: '0 0 6px rgba(251, 113, 133, 0.5), 0 1px 3px rgba(244, 63, 94, 0.3)',
                    bottom: '2px',
                    left: '-8px'
                  }}
                ></div>
                
                {/* 智能网络连接线 - 明亮科技风 */}
                <svg 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <g stroke="#60a5fa" strokeWidth="1.5" opacity="0.8">
                    <line x1="16" y1="16" x2="24" y2="10" />
                    <line x1="16" y1="16" x2="24" y2="22" />
                    <line x1="16" y1="16" x2="8" y2="10" />
                    <line x1="16" y1="16" x2="8" y2="22" />
                  </g>
                </svg>
              </div>
            </div>
            
            {/* 底部标识 - NextAgent标识 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
              <div 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: 'linear-gradient(90deg, #1e40af 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(30, 64, 175, 0.25)'
                }}
              >
                AI
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            NextAgentLite 智能问答系统
          </h3>
          <p className="text-gray-600 max-w-md text-sm">
            基于先进多智能体技术的智能问答服务，为您提供专业精准的知识解答
          </p>
        </div>
      
      {/* 快速问题示例 */}
      <div className="w-full max-w-2xl">
        <div className="text-center text-gray-600 text-sm mb-4">推荐问题：</div>
        <div className="space-y-2">
          {[
            {
              icon: "🤖",
              question: "单智能体和多智能体协作的区别？"
            },
            {
              icon: "🌡️",
              question: "如何进行精准的信息检索和答案生成？"
            },
            {
              icon: "⚗️",
              question: "AI系统如何理解和处理复杂上下文？"
            }
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center bg-white hover:bg-gray-50 text-gray-700 text-sm p-4 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
              onClick={() => {
                // 触发问题填入输入框的事件
                const event = new CustomEvent('quickQuestionClick', { 
                  detail: { question: item.question } 
                });
                window.dispatchEvent(event);
              }}
            >
              <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="flex-1">{item.question}</span>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  };

  // 判断是否为聊天模式
  const isChatMode = safeMessages.length > 0 || loading;

  return (
    <div className={`flex-1 overflow-hidden ${className}`}>
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto custom-scrollbar transition-all duration-300"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="w-full h-full">
          {/* 消息为空时显示欢迎界面 */}
          {safeMessages.length === 0 && !loading && !error && (
            <div className="animate-fadeIn">
              {renderEmpty()}
            </div>
          )}
          
          {/* 消息列表 */}
          {safeMessages.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              {safeMessages.map((message, index) => (
                <div 
                  key={message.id}
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MessageItem
                    message={message}
                    onImagePreview={onImagePreview}
                    onMessageAction={handleMessageAction}
                    isTeamMode={currentMode === 'team'}
                    streaming={message.loading || false}
                    useStreamdown={true}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 加载状态现在通过消息级别的loading字段处理，不需要单独渲染 */}

          {/* 错误状态 */}
          {error && (
            <div className="animate-fadeIn">
              {renderError()}
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 自定义滚动条和动画样式 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        @keyframes simpleSlide {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

export const MessageList = React.memo(MessageListComponent, (prevProps, nextProps) => {
  // 检查消息数量变化
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  
  // 检查loading状态变化
  if (prevProps.loading !== nextProps.loading) {
    return false;
  }
  
  // 检查error状态变化
  if (prevProps.error !== nextProps.error) {
    return false;
  }
  
  // 检查模式变化
  if (prevProps.currentMode !== nextProps.currentMode) {
    return false;
  }
  
  // 检查是否有消息内容或loading状态变化
  for (let i = 0; i < prevProps.messages.length; i++) {
    const prevMsg = prevProps.messages[i];
    const nextMsg = nextProps.messages[i];
    
    // 如果消息ID不同
    if (prevMsg?.id !== nextMsg?.id) {
      return false;
    }
    
    // 如果消息内容变化
    if (prevMsg?.content !== nextMsg?.content) {
      return false;
    }
    
    // 如果loading状态变化
    if (prevMsg?.loading !== nextMsg?.loading) {
      return false;
    }
    
    // 如果thinking数据变化
    if (prevMsg?.thinking !== nextMsg?.thinking) {
      return false;
    }
  }
  
  // 所有检查都通过，可以复用渲染结果
  return true;
}); 