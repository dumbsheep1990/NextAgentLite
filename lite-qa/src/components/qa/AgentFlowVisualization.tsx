import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'antd';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// 注入流动动画样式
const flowAnimationStyle = `
  @keyframes flowDown {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 8px;
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined' && !document.getElementById('flow-animation-style')) {
  const style = document.createElement('style');
  style.id = 'flow-animation-style';
  style.innerHTML = flowAnimationStyle;
  document.head.appendChild(style);
}

interface AgentStep {
  id: string;
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  content?: string;
  decisions?: any[];
  outputData?: any;
}

interface AgentFlowVisualizationProps {
  steps: AgentStep[];
  className?: string;
}

const AgentFlowVisualization: React.FC<AgentFlowVisualizationProps> = ({
  steps,
  className = ''
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentStep | null>(null);
  const [animationCompletedSteps, setAnimationCompletedSteps] = useState<Set<string>>(new Set());

  // 获取Agent的完整信息，包括最新状态
  const getAgentFullInfo = React.useCallback((step: AgentStep): AgentStep => {
    return {
      ...step,
      // 这里数据已经是最新的，因为steps是通过useMemo动态计算的
    };
  }, []);

  // 稳定的点击处理函数
  const handleAgentClick = React.useCallback((step: AgentStep) => {
    setSelectedAgent(getAgentFullInfo(step));
  }, [getAgentFullInfo]);

  // 稳定的关闭抽屉函数
  const handleCloseDrawer = React.useCallback(() => {
    setSelectedAgent(null);
  }, []);
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(new Set());
  
  // 实时更新可见步骤
  useEffect(() => {
    const newVisibleSteps = new Set<string>();
    let showNext = true;
    
    for (const step of steps) {
      // 显示已开始执行的步骤
      if (step.status !== 'pending') {
        newVisibleSteps.add(step.id);
      } else if (showNext && step.status === 'pending') {
        // 显示第一个pending步骤（即将执行的下一个步骤）
        const hasRunningOrCompleted = steps.some(s => s.status === 'running' || s.status === 'completed');
        if (hasRunningOrCompleted) {
          newVisibleSteps.add(step.id);
        }
        showNext = false;
      }
      
      // 如果当前步骤正在执行，显示它但停止显示更多pending步骤
      if (step.status === 'running') {
        showNext = false;
      }
    }
    
    setVisibleSteps(newVisibleSteps);
  }, [steps]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'running':
        return (
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          dotColor: '#10b981',
          tagColor: 'success'
        };
      case 'running':
        return {
          dotColor: '#3b82f6',
          tagColor: 'processing'
        };
      case 'error':
        return {
          dotColor: '#ef4444',
          tagColor: 'error'
        };
      default:
        return {
          dotColor: '#9ca3af',
          tagColor: 'default'
        };
    }
  };

  const formatDuration = (step: AgentStep) => {
    if (!step.startTime) return '';
    const endTime = step.endTime || Date.now();
    const duration = Math.round((endTime - step.startTime) / 1000);
    return `${duration}s`;
  };

  const visibleStepsArray = React.useMemo(() => 
    steps.filter(step => visibleSteps.has(step.id)), 
    [steps, visibleSteps]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Agent流程卡片 */}
      <div className="space-y-6">
        <AnimatePresence>
          {visibleStepsArray.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative"
            >
              {/* 连接线 - 虚线流动效果 */}
              {index > 0 && (
                <div 
                  className="absolute"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: '-24px',
                    height: '24px',
                    width: '2px'
                  }}
                >
                  <div 
                    className="w-full h-full"
                    style={{
                      background: 'repeating-linear-gradient(to bottom, #9ca3af 0%, #9ca3af 4px, transparent 4px, transparent 8px)',
                      animation: 'flowDown 2s linear infinite'
                    }}
                  ></div>
                </div>
              )}
              
              {/* Agent卡片 - 简洁现代设计 */}
              <div
                onClick={() => handleAgentClick(step)}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
              >
                {/* Agent标题栏 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* 简洁状态圆点 */}
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusConfig(step.status).dotColor }}
                    ></div>
                    <span className="font-medium text-gray-900 text-sm">
                      {step.displayName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tag color={getStatusConfig(step.status).tagColor}>
                      {step.status === 'completed' ? '已完成' : 
                       step.status === 'running' ? '执行中' : 
                       step.status === 'error' ? '错误' : '等待中'}
                    </Tag>
                    {step.status !== 'pending' && (
                      <span className="text-xs text-gray-500">
                        {formatDuration(step)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 内容区域 */}
                <div className="space-y-3">
                  {/* 决策过程预览 - 动态加载 */}
                  {step.decisions && step.decisions.length > 0 && (() => {
                    const DynamicDecisionRenderer = () => {
                      const [visibleDecisions, setVisibleDecisions] = useState<any[]>([]);
                      const [currentIndex, setCurrentIndex] = useState(0);
                      
                      // 获取要显示的决策（最多2个）
                      const decisionsToShow = step.decisions.slice(0, 2);
                      
                      // 检查该步骤的动画是否已经完成
                      const hasAnimationCompleted = animationCompletedSteps.has(step.id);
                      
                      // 动态显示决策事件 - 只在首次加载或实时渲染时执行
                      useEffect(() => {
                        if (decisionsToShow.length === 0) return;
                        
                        // 如果动画已经完成过，直接显示所有决策，不执行动画
                        if (hasAnimationCompleted) {
                          setVisibleDecisions(decisionsToShow);
                          setCurrentIndex(decisionsToShow.length);
                          return;
                        }
                        
                        // 首次加载或实时渲染时执行动画
                        setVisibleDecisions([]);
                        setCurrentIndex(0);
                        
                        const timer = setInterval(() => {
                          setCurrentIndex(prevIndex => {
                            if (prevIndex < decisionsToShow.length) {
                              setVisibleDecisions(prev => [...prev, decisionsToShow[prevIndex]]);
                              return prevIndex + 1;
                            } else {
                              clearInterval(timer);
                              return prevIndex;
                            }
                          });
                        }, 800); // 每800ms显示一个决策
                        
                        return () => clearInterval(timer);
                      }, [decisionsToShow.length, hasAnimationCompleted, step.id]); // 添加step.id和hasAnimationCompleted依赖
                      
                      // 单独处理动画完成状态更新
                      useEffect(() => {
                        if (currentIndex >= decisionsToShow.length && decisionsToShow.length > 0 && !hasAnimationCompleted) {
                          setAnimationCompletedSteps(prev => new Set([...prev, step.id]));
                        }
                      }, [currentIndex, decisionsToShow.length, hasAnimationCompleted, step.id]);
                      
                      return (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-2">决策过程</div>
                          <div className="space-y-2">
                            {visibleDecisions.map((decision, idx) => (
                              <div 
                                key={idx}
                                className="bg-gray-50 rounded-md p-3 text-sm"
                                style={{
                                  opacity: hasAnimationCompleted ? 1 : 0,
                                  animation: hasAnimationCompleted ? 'none' : `fadeInUp 0.6s ease-out ${idx * 0.2}s forwards`
                                }}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    {/* 动态状态指示器 */}
                                    <div className={`w-2 h-2 rounded-full ${
                                      decision.eventType === 'start' 
                                        ? 'bg-blue-400' 
                                        : 'bg-green-400'
                                    }`}></div>
                                    <span className="font-medium text-gray-800">
                                      {decision.decision_type || '决策'}
                                    </span>
                                    {decision.eventType === 'start' && (
                                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        开始
                                      </span>
                                    )}
                                    {decision.eventType === 'end' && decision.durationMs && (
                                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                        完成 ({decision.durationMs}ms)
                                      </span>
                                    )}
                                  </div>
                                  {decision.confidence && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                      {Math.round(decision.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-700 text-sm leading-relaxed">
                                  {decision.decision_content?.substring(0, 120) || decision.content?.substring(0, 120) || ''}
                                  {(decision.decision_content?.length > 120 || decision.content?.length > 120) && '...'}
                                </div>
                                {decision.reasoning && (
                                  <div className="text-xs text-gray-500 mt-2 italic">
                                    💭 {decision.reasoning.substring(0, 100)}
                                    {decision.reasoning.length > 100 && '...'}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {/* 显示加载中的下一个决策 - 只在动画过程中显示 */}
                            {!hasAnimationCompleted && currentIndex < decisionsToShow.length && (
                              <div 
                                className="bg-gray-50 rounded-md p-3 text-sm opacity-50"
                                style={{
                                  background: 'linear-gradient(90deg, #f9fafb, #f3f4f6, #f9fafb)',
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 1.5s infinite'
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                                  <span className="text-gray-400">正在执行决策...</span>
                                </div>
                              </div>
                            )}
                            
                            {step.decisions.length > 2 && (
                              <div className="text-center text-xs text-gray-500">
                                还有 {step.decisions.length - 2} 个决策...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    };
                    
                    return <DynamicDecisionRenderer />;
                  })()}
                  
                  {/* 执行结果预览 */}
                  {(step.status === 'running' || step.status === 'completed') && step.content && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">执行结果</div>
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {step.content.substring(0, 200)}
                          {step.content.length > 200 && '...'}
                        </div>
                        {step.content.length > 200 && (
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            点击查看完整内容
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 等待状态提示 */}
                  {step.status === 'pending' && (
                    <div className="text-center py-6">
                      <div className="text-gray-400 text-sm">⏳ 等待执行</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 连接下一个的箭头线 - 虚线流动效果 */}
              {index < visibleStepsArray.length - 1 && (
                <div 
                  className="absolute"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: '-24px',
                    height: '24px',
                    width: '2px'
                  }}
                >
                  <div 
                    className="w-full h-full"
                    style={{
                      background: 'repeating-linear-gradient(to bottom, #9ca3af 0%, #9ca3af 4px, transparent 4px, transparent 8px)',
                      animation: 'flowDown 2s linear infinite'
                    }}
                  ></div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 侧滑抽屉 - 通过 Portal 渲染到 body */}
      {createPortal(
        <AnimatePresence mode="wait">
          {selectedAgent && (
            <div key={selectedAgent.id}>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-30 z-[1000]"
              onClick={handleCloseDrawer}
            />
            
            {/* 抽屉内容 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-[1001] overflow-y-auto border-l border-gray-200"
            >
              {/* 抽屉头部 - 简洁重新设计 */}
              <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusConfig(selectedAgent.status).dotColor }}
                      ></div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedAgent.displayName}
                      </h2>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: getStatusConfig(selectedAgent.status).dotColor + '20',
                          color: getStatusConfig(selectedAgent.status).dotColor
                        }}
                      >
                        {selectedAgent.status === 'completed' ? '已完成' : 
                         selectedAgent.status === 'running' ? '执行中' : 
                         selectedAgent.status === 'error' ? '错误' : '等待中'}
                      </span>
                      {selectedAgent.status !== 'pending' && (
                        <span className="text-gray-500">
                          {formatDuration(selectedAgent)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1 hover:bg-gray-100 rounded transition-colors ml-4"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 抽屉内容 - 全新简洁设计 */}
              <div className="p-6 space-y-5">
                {/* 执行概要卡片 */}
                <div className="bg-gray-50/70 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <ClockIcon className="w-4 h-4 text-gray-600 mr-2" />
                    执行概要
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">状态</span>
                      <span className="font-medium text-gray-900">
                        {selectedAgent.status === 'completed' ? '已完成' : 
                         selectedAgent.status === 'running' ? '执行中' : 
                         selectedAgent.status === 'error' ? '错误' : '等待中'}
                      </span>
                    </div>
                    
                    {selectedAgent.startTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">开始</span>
                        <span className="font-mono text-gray-700 text-xs">
                          {new Date(selectedAgent.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {selectedAgent.endTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">结束</span>
                        <span className="font-mono text-gray-700 text-xs">
                          {new Date(selectedAgent.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">耗时</span>
                      <span className="font-semibold text-blue-600">
                        {formatDuration(selectedAgent) || '计算中...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 决策信息 */}
                {selectedAgent.decisions && selectedAgent.decisions.length > 0 && (
                  <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                      <span className="flex items-center">
                        <ChevronRightIcon className="w-4 h-4 text-blue-600 mr-2" />
                        决策信息
                      </span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {selectedAgent.decisions.length}
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {selectedAgent.decisions.map((decision, index) => (
                        <div key={index} className="bg-white rounded-md p-3 border border-blue-100/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                              {decision.decision_type || '决策'}
                            </span>
                            {decision.confidence && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                {(decision.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {decision.decision_content || decision.content || '无内容'}
                          </p>
                          
                          {decision.reasoning && (
                            <div className="mt-2 pl-3 border-l-2 border-amber-300 bg-amber-50/50 py-1">
                              <p className="text-xs text-amber-700">
                                {decision.reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 知识检索结果 */}
                {selectedAgent.outputData && selectedAgent.outputData.retrieved_docs && selectedAgent.outputData.retrieved_docs.length > 0 && (
                  <div className="bg-purple-50/60 rounded-lg p-4 border border-purple-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                      <span className="flex items-center">
                        📚 知识检索
                      </span>
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        {selectedAgent.outputData.retrieved_docs.length} 个文档
                      </span>
                    </h3>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedAgent.outputData.retrieved_docs.map((doc, index) => (
                        <div key={index} className="bg-white rounded-md p-3 border border-purple-100/50">
                          {doc.title && (
                            <div className="font-medium text-sm text-gray-800 mb-2">
                              {doc.title}
                            </div>
                          )}
                          {doc.content && (
                            <div className="text-xs text-gray-600 leading-relaxed">
                              {doc.content.length > 300 ? 
                                `${doc.content.substring(0, 300)}...` : 
                                doc.content
                              }
                            </div>
                          )}
                          {doc.score && (
                            <div className="mt-2 text-xs text-purple-600">
                              相关度: {(doc.score * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 执行内容 */}
                {selectedAgent.content && (
                  <div className="bg-green-50/60 rounded-lg p-4 border border-green-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                      执行结果
                    </h3>
                    
                    <div className="bg-white rounded-md p-3 border border-green-100/50">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedAgent.content}
                      </div>
                    </div>
                  </div>
                )}

                {/* 其他输出数据 */}
                {selectedAgent.outputData && Object.keys(selectedAgent.outputData).filter(key => key !== 'retrieved_docs').length > 0 && (
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <ChevronRightIcon className="w-4 h-4 text-gray-600 mr-2" />
                      附加数据
                    </h3>
                    
                    <div className="bg-white rounded-md p-3 border border-gray-100/50">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto font-mono max-h-32 overflow-y-auto">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(selectedAgent.outputData).filter(([key]) => key !== 'retrieved_docs')
                          ), 
                          null, 2
                        )}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AgentFlowVisualization;