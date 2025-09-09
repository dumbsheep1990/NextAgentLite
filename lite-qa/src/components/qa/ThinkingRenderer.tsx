/**
 * AI思考过程渲染组件 - 简化版文本滚动展示
 */
import React, { useState, useEffect } from 'react';
import { Typography, Card, Tag, Spin } from 'antd';
import { BulbOutlined, DatabaseOutlined, FileTextOutlined, BookOutlined, LoadingOutlined, CloudOutlined } from '@ant-design/icons';
import type { UnifiedThinkingStep, ThinkingStep, AgnoThinkingStep } from '../../types';

const { Text } = Typography;

interface ThinkingRendererProps {
  thinking: UnifiedThinkingStep[];
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({ thinking }) => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  console.log('🎬 ThinkingRenderer接收数据:', {
    hasThinking: !!thinking,
    thinkingLength: thinking?.length || 0,
    thinkingData: JSON.stringify(thinking, null, 2)
  });
  
  // 逐步显示思考步骤的动画效果
  useEffect(() => {
    if (thinking && thinking.length > 0) {
      let currentStep = 0;
      const timer = setInterval(() => {
        if (currentStep < thinking.length) {
          setVisibleSteps(currentStep + 1);
          currentStep++;
        } else {
          clearInterval(timer);
          setIsAnimating(false);
        }
      }, 300); // 每300ms显示一个新步骤
      
      return () => clearInterval(timer);
    }
  }, [thinking]);
  
  if (!thinking || !Array.isArray(thinking) || thinking.length === 0) {
    console.log('⚠️ ThinkingRenderer: 无thinking数据或数据格式错误，返回null');
    return null;
  }

  // 将所有thinking步骤统一处理为AgnoThinkingStep格式
  const normalizedThinking = thinking.map((step: any) => ({
    title: step.title || '思考中...',
    content: step.content || '',
    confidence: step.confidence || 0.8,
    timestamp: step.timestamp || Date.now(),
    search_results: step.search_results || []  // 包含检索结果
  }));

  // 去重和限制显示
  const uniqueThinking = normalizedThinking.filter((step, index, arr) => {
    const existingIndex = arr.findIndex((s, i) => 
      i < index && s.title === step.title && s.content === step.content
    );
    return existingIndex === -1;
  });

  const displayThinking = uniqueThinking.slice(0, 8);

  // 渲染检索结果
  const renderSearchResults = (searchResults: any[]) => {
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="space-y-2">
          {searchResults.slice(0, 3).map((result, index) => (
            <div 
              key={index} 
              className="p-3 bg-white/80 rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200 opacity-0 animate-slideInLeft"
              style={{ 
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start flex-1">
                  <div className="mr-2 mt-1">
                    {result.source_type === 'document' ? (
                      <FileTextOutlined className="text-green-600" style={{ fontSize: '12px' }} />
                    ) : (
                      <BookOutlined className="text-blue-600" style={{ fontSize: '12px' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <Text className="text-xs text-gray-700 font-medium leading-relaxed block">
                      {result.title || result.content?.substring(0, 80) + '...'}
                    </Text>
                  </div>
                </div>
                <Tag 
                  color={result.source_type === 'document' ? 'green' : 'blue'} 
                  className="text-xs font-medium ml-2"
                >
                  {result.source_type === 'document' ? '文档' : 'QA'}
                </Tag>
              </div>
              {result.score && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    相关度: <span className="font-medium text-green-600">{(result.score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(result.score * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {searchResults.length > 3 && (
            <div className="text-xs text-gray-500 text-center py-2 opacity-0 animate-fadeIn" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              还有 {searchResults.length - 3} 条相关资料...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-3 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-sm transition-all duration-500">
      {/* 标题栏 */}
      <div className="flex items-center mb-3">
        <div className="relative mr-2">
          <BulbOutlined className={`text-blue-500 text-lg transition-all duration-500 ${isAnimating ? 'animate-pulse' : ''}`} />
          {isAnimating && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          )}
        </div>
        <Text strong className="text-sm text-blue-700 font-semibold">
          AI思考过程 {isAnimating && <span className="text-blue-500 animate-pulse">·</span>}
        </Text>
        {/* 检索结果数量标签 */}
        {displayThinking.some(step => step.search_results && step.search_results.length > 0) && (
          <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            已检索 {displayThinking.reduce((total, step) => total + (step.search_results?.length || 0), 0)} 条
          </div>
        )}
        {isAnimating && (
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 12, color: '#3b82f6' }} spin />} 
            className="ml-2"
          />
        )}
      </div>
      
      <div className="space-y-2 h-32 overflow-y-auto">
        {displayThinking.slice(0, visibleSteps).map((step, index) => (
          <div 
            key={index} 
            className="opacity-0 animate-fadeInUp pl-2"
            style={{ 
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {/* 思考步骤 */}
            <div className="flex items-start mb-1">
              <div className="flex-1">
                <div className="text-sm text-blue-700 leading-relaxed font-medium mb-1 flex items-center">
                  <div className="mr-2 w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  {step.title}
                </div>
                {step.content && (
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {step.content}
                  </div>
                )}
              </div>
              {index === visibleSteps - 1 && isAnimating && (
                <div className="ml-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse flex-shrink-0 mt-1.5"></div>
              )}
            </div>
            
            {/* 检索结果 */}
            {step.search_results && step.search_results.length > 0 && (
              <div className="mt-2">
                {renderSearchResults(step.search_results)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 添加CSS动画样式 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.4s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};