/**
 * Team消息渲染组件 - 展示Agno Team的执行过程和结果
 * 🔥 支持简化测试模式：添加localStorage标记可切换到纯文本显示模式
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ClockIcon,
  ChevronRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import DocumentRetrievalResult from './DocumentRetrievalResult';

// 添加CSS动画样式
const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(59, 130, 246, 0.15); }
    50% { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 12px rgba(59, 130, 246, 0.3); }
  }
  @keyframes loading-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
  }
  @keyframes card-hover {
    0% { transform: translateY(0) scale(1); }
    100% { transform: translateY(-2px) scale(1.01); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined' && !document.getElementById('team-pulse-animation')) {
  const style = document.createElement('style');
  style.id = 'team-pulse-animation';
  style.innerHTML = pulseKeyframes;
  document.head.appendChild(style);
}
import { 
  Card, 
  Collapse, 
  Tag, 
  Progress, 
  Timeline, 
  Typography, 
  Space, 
  Button, 
  Tooltip, 
  Badge,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  Drawer,
  Tabs
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  CodeOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  BulbOutlined,
  BarsOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  DownOutlined,
  UpOutlined,
  DeploymentUnitOutlined,
  BookOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import type { TeamMessage, TeamMemberCall, TeamStructuredOutput, TeamCoordinationInfo } from '../../types';
import { AcademicMarkdownRenderer } from '../common';
import AgentDecisionRenderer from './AgentDecisionRenderer';
import AgentOutputRenderer from './AgentOutputRenderer';
import AgentDecisionOnlyRenderer from './AgentDecisionOnlyRenderer';
import TeamDecisionRenderer from './TeamDecisionRenderer';
import AgentFlowVisualization from './AgentFlowVisualization';
import { useTeamExecutionStore } from '../../stores/teamExecutionStore';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface TeamMessageRendererProps {
  message: TeamMessage;
  onViewDetails?: (memberCall: TeamMemberCall) => void;
  onViewMetrics?: (executionId: string) => void;
  viewMode?: 'flow' | 'detail'; // 新增：视图模式，控制团队执行过程的显示方式
}

const TeamMessageRenderer: React.FC<TeamMessageRendererProps> = ({
  message,
  onViewDetails,
  onViewMetrics,
  viewMode = 'detail'
}) => {
  // 添加样式标签到头部 - 必须在组件最开始调用
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 所有hooks都必须在组件顶部调用
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [showStructuredOutput, setShowStructuredOutput] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showExecutionFlow, setShowExecutionFlow] = useState(false);
  const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
  const [useFlowVisualization, setUseFlowVisualization] = useState(true); // 新流程可视化开关
  const [detailViewCollapsed, setDetailViewCollapsed] = useState(false); // 详细视图折叠状态
  const [decisionViewExpanded, setDecisionViewExpanded] = useState(true);
  const [executionViewExpanded, setExecutionViewExpanded] = useState(true);
  const [answerGenerationExpanded, setAnswerGenerationExpanded] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, Set<number>>>({});
  const [expandedGraphAgent, setExpandedGraphAgent] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAgentForDrawer, setSelectedAgentForDrawer] = useState<any>(null);
  
  // 调试抽屉状态变化
  useEffect(() => {
    console.log('🔥 [DRAWER] selectedAgentForDrawer 状态变化:', selectedAgentForDrawer);
  }, [selectedAgentForDrawer]);
  
  // 抽屉助手函数
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

  const formatAgentDuration = (step: any) => {
    if (!step.startTime) return '';
    const endTime = step.endTime || Date.now();
    const duration = Math.round((endTime - step.startTime) / 1000);
    return `${duration}s`;
  };

  // 🔥 检查是否启用简化测试模式
  const isSimpleTestMode = localStorage.getItem('team-simple-test-mode') === 'true';
  
  // 如果启用简化模式，返回纯文本显示
  if (isSimpleTestMode) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px dashed #1890ff', 
        borderRadius: '8px',
        backgroundColor: '#f0f8ff',
        margin: '10px 0'
      }}>
        <div style={{ marginBottom: '15px', color: '#1890ff', fontWeight: 'bold' }}>
          🧪 简化测试模式 - 纯文本显示
          <button 
            onClick={() => {
              localStorage.removeItem('team-simple-test-mode');
              window.location.reload();
            }}
            style={{ 
              marginLeft: '10px', 
              padding: '2px 8px', 
              background: '#1890ff', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            退出简化模式
          </button>
        </div>
        <pre style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333',
          margin: 0,
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #e8e8e8',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {message.content || '等待团队响应...'}
        </pre>
        {message.loading && (
          <div style={{ marginTop: '10px', color: '#666' }}>
            ⏳ 正在处理...
          </div>
        )}
      </div>
    );
  }
  
  // 添加内联样式支持CSS动画
  const spinStyle = {
    animation: 'spin 1s linear infinite'
  };
  // 管理知识源和Agent结果的展开状态（按消息ID分组）
  
  // 获取当前消息的展开状态
  const getMessageExpandedSources = (messageId: string) => {
    return expandedSources[messageId] || new Set();
  };
  
  const getMessageExpandedGraphAgent = (messageId: string) => {
    return expandedGraphAgent[messageId] || false;
  };
  
  // 切换展开状态的函数（绑定到特定消息）
  const toggleExpanded = (messageId: string, index: number) => {
    setExpandedSources(prev => {
      const messageExpandedSources = prev[messageId] || new Set();
      const newExpandedSources = new Set(messageExpandedSources);
      
      if (newExpandedSources.has(index)) {
        newExpandedSources.delete(index);
      } else {
        newExpandedSources.add(index);
      }
      
      return {
        ...prev,
        [messageId]: newExpandedSources
      };
    });
  };
  
  // 切换图谱Agent展开状态的函数
  const toggleGraphAgentExpanded = (messageId: string) => {
    setExpandedGraphAgent(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  
  // 使用全局团队执行状态
  const { 
    currentExecution, 
    startExecution, 
    updateExecution, 
    completeExecution,
    openDrawer,
    getExecutionStats,
    updateTask,
    updatePhase
  } = useTeamExecutionStore();
  
  // 首先计算清理后的内容
  const getCleanedContent = (content: string) => {
    if (!content) return '';
    
    // 查找最后一个ReasoningStep之后的内容，通常是最终回答
    const lastReasoningMatch = content.lastIndexOf('[ReasoningStep:');
    if (lastReasoningMatch !== -1) {
      // 找到最后一个ReasoningStep结束的位置
      const lastReasoningEnd = content.indexOf(']', lastReasoningMatch) + 1;
      if (lastReasoningEnd > lastReasoningMatch) {
        const afterReasoning = content.substring(lastReasoningEnd).trim();
        // 如果有实质性内容，返回清理后的内容
        if (afterReasoning && afterReasoning.length > 10) {
          return afterReasoning;
        }
      }
    }
    
    // 查找### 开头的最终回答部分
    const finalAnswerMatch = content.match(/###\s*[^#\n\r]*[\n\r]*([\s\S]*?)(?=think\(|analyze\(|$)/);
    if (finalAnswerMatch && finalAnswerMatch[1]) {
      return finalAnswerMatch[1].trim();
    }
    
    // 如果找不到明确的最终回答，返回去除ReasoningStep标记的内容
    return content
      .replace(/think\([^)]*\)\s*completed in [^s]+s\.\[ReasoningStep:[^\]]*\]/g, '')
      .replace(/analyze\([^)]*\)\s*completed in [^s]+s\.\[ReasoningStep:[^\]]*\]/g, '')
      .trim();
  };

  // 智能判断是否开始回答 - 有内容且不在加载状态，表示开始生成回答
  const isGeneratingAnswer = message.content && message.content.trim() !== '' && !message.loading;
  
  // 首先解构所有需要的变量
  const { teamInfo } = message;
  const { memberCalls = [], structuredOutput, coordinationInfo, currentAgent: originalCurrentAgent, agentProgress, teamDecisions = [] } = teamInfo;
  
  // 🔥 智能状态管理：根据对话完成状态调整currentAgent
  const currentAgent = useMemo(() => {
    if (!originalCurrentAgent) return null;
    
    // 检查对话是否已完成（不在loading且有内容）
    const isConversationComplete = !message.loading && message.content && message.content.trim() !== '';
    
    // 如果对话完成但Agent状态还是running，更新为completed
    if (isConversationComplete && originalCurrentAgent.status === 'running') {
      return {
        ...originalCurrentAgent,
        status: 'completed'
      };
    }
    
    return originalCurrentAgent;
  }, [originalCurrentAgent, message.loading, message.content]);
  
  // 🔥 调试：检查currentAgent状态
  console.log('[TEAM_RENDERER] currentAgent状态:', currentAgent, 'agentProgress:', agentProgress);

  // 实时更新时间，用于超时检查
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (message.loading) {
      timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 5000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [message.loading]);

  // 获取有效的团队决策数据（只使用真实数据）
  const getEffectiveTeamDecisions = () => {
    console.log('🔍 [TEAM_DECISIONS] 检查真实决策数据:', {
      'teamDecisions': teamDecisions,
      'teamDecisions.length': teamDecisions?.length || 0,
      'message.thinking': message.thinking,
      'message.thinking.length': message.thinking?.length || 0
    });
    
    // 优先使用数据库中保存的thinking数据（历史对话）
    if (message.thinking && Array.isArray(message.thinking) && message.thinking.length > 0) {
      console.log('✅ [TEAM_DECISIONS] 使用数据库thinking数据:', message.thinking);
      return message.thinking;
    }
    
    // 实时对话使用teamDecisions数据
    if (teamDecisions && Array.isArray(teamDecisions) && teamDecisions.length > 0) {
      console.log('✅ [TEAM_DECISIONS] 使用实时teamDecisions数据:', teamDecisions);
      return teamDecisions;
    }
    
    // 没有真实数据时返回空数组，不生成任何假数据
    console.log('❌ [TEAM_DECISIONS] 无任何真实决策数据');
    return [];
  };
  
  // 获取有效决策数据
  const effectiveTeamDecisions = useMemo(() => {
    return getEffectiveTeamDecisions();
  }, [message.thinking, teamDecisions]);
  
  // 解析消息内容中的ReasoningStep信息
  const parseReasoningSteps = (content: string): Array<{
    title: string;
    action: string;
    result: string;
    reasoning: string;
    confidence: number;
    type: string;
  }> => {
    const steps: Array<{
      title: string;
      action: string;
      result: string;
      reasoning: string;
      confidence: number;
      type: string;
    }> = [];
    
    // 正则匹配ReasoningStep格式 - 更灵活的匹配
    const reasoningStepPattern = /\[ReasoningStep:\s*title=(?:["']([^"']*?)["'])\s*action=(?:["']?([^"']*?)["']?)\s*result=(?:["']?([^"']*?)["']?)\s*reasoning=(?:["']([^"']*?)["'])\s*.*?confidence=([0-9.]+)\]/g;
    
    let match;
    while ((match = reasoningStepPattern.exec(content)) !== null) {
      const [, title, action, result, reasoning, confidence] = match;
      
      // 清理和处理字段值
      const cleanTitle = title?.trim() || '执行步骤';
      const cleanAction = action?.replace(/['"=\s]/g, '').trim() || 'process';
      const cleanResult = result?.trim();
      const cleanReasoning = reasoning?.trim() || '正在执行相关操作';
      const cleanConfidence = parseFloat(confidence) || 0.8;
      
      // 处理result字段：如果是None或空，则表示还在处理中
      const processedResult = (!cleanResult || cleanResult === 'None' || cleanResult === 'null') ? 
        '处理中...' : cleanResult;
      
      steps.push({
        title: cleanTitle,
        action: cleanAction,
        result: processedResult,
        reasoning: cleanReasoning,
        confidence: cleanConfidence,
        type: 'reasoning_step'
      });
    }
    
    return steps;
  };

  // 从消息内容解析实时的执行步骤
  const realTimeSteps = parseReasoningSteps(message.content || '');
  console.log('[REASONING_STEPS] 解析到的实时步骤:', realTimeSteps.length, realTimeSteps);

  // 添加调试日志
  console.log('[TEAM_RENDERER] teamInfo:', teamInfo);
  console.log('[TEAM_RENDERER] memberCalls数量:', memberCalls.length, 'teamDecisions数量:', teamDecisions?.length || 0);
  console.log('[TEAM_RENDERER] 知识来源数量:', message.knowledgeSources?.length || 0, 'knowledgeSources:', message.knowledgeSources);

  // 根据memberId区分中间执行Agent和最终答案Agent
  const getFinalAnswerAgent = () => {
    // 优先查找明确的summary agent
    return memberCalls.find(call => 
      call.memberId === 'summary_answer_agent' || 
      call.memberId === 'answer_agent' ||
      call.memberId === 'summary_agent' ||
      call.member_id === 'summary_answer_agent' ||
      call.member_id === 'answer_agent' ||
      call.member_id === 'summary_agent' ||
      call.memberName?.toLowerCase().includes('summary') ||
      call.memberName?.toLowerCase().includes('answer') ||
      call.member_name?.toLowerCase().includes('summary') ||
      call.member_name?.toLowerCase().includes('answer')
    ) || 
    // 如果没找到summary agent，使用最后一个完成的agent
    memberCalls.filter(call => call.status === 'completed').pop();
  };

  const getIntermediateAgents = () => {
    const finalAgent = getFinalAnswerAgent();
    const finalAgentId = finalAgent?.memberId || finalAgent?.member_id;
    return memberCalls.filter(call => {
      const callId = call.memberId || call.member_id;
      return callId !== finalAgentId;
    });
  };

  const finalAnswerAgent = getFinalAnswerAgent();
  const intermediateAgents = getIntermediateAgents();
  
  console.log('🚨 [TEAM_RENDERER] 关键调试信息:');
  console.log('📊 [TEAM_RENDERER] memberCalls原始数组:', memberCalls);
  console.log('📊 [TEAM_RENDERER] memberCalls.length:', memberCalls.length);
  console.log('📊 [TEAM_RENDERER] teamInfo完整对象:', teamInfo);
  console.log('📊 [TEAM_RENDERER] message完整对象:', message);
  
  if (memberCalls.length > 0) {
    console.log('✅ [TEAM_RENDERER] 找到memberCalls数据');
    console.log('🎯 [TEAM_RENDERER] 最终答案Agent:', finalAnswerAgent);
    console.log('🔄 [TEAM_RENDERER] 中间执行Agent数量:', intermediateAgents.length);
    console.log('📋 [TEAM_RENDERER] 所有Agents详情:', memberCalls.map(call => ({
      id: call.memberId || call.member_id,
      name: call.memberName || call.member_name,
      status: call.status,
      hasOutput: !!(call.output || call.result || call.response)
    })));
  } else {
    console.log('❌ [TEAM_RENDERER] memberCalls为空或未定义！');
    console.log('🔍 [TEAM_RENDERER] 检查teamInfo.memberCalls:', teamInfo.memberCalls);
    console.log('🔍 [TEAM_RENDERER] 检查teamInfo.member_calls:', teamInfo.member_calls);
  }

  // 计算执行统计
  const executionStats = {
    total: memberCalls.length,
    completed: memberCalls.filter(call => call.status === 'completed').length,
    running: memberCalls.filter(call => call.status === 'running').length,
    error: memberCalls.filter(call => call.status === 'error').length,
    pending: memberCalls.filter(call => call.status === 'pending').length
  };
  
  // 执行统计
  const effectiveStats = executionStats;
  
  // 在所有变量定义之后，添加处理展开逻辑的useEffect
  useEffect(() => {
    if (!isGeneratingAnswer) {
      const shouldExpand = () => {
        // 1. 如果正在生成回答，自动折叠前置流程
        if (isGeneratingAnswer) {
          return false;
        }
        
        // 2. 如果还没有答案且正在处理，展开前置流程显示详细信息
        if (message.loading || (!message.content || message.content.trim() === '')) {
          return true;
        }
        
        // 3. 如果有团队决策数据或执行步骤，且还没有回答内容，保持展开 - 临时简化
        if (memberCalls.length > 0 && !isGeneratingAnswer) {
          return true;
        }
        
        // 4. 默认折叠
        return false;
      };
      
      setIsExpanded(shouldExpand());
    }
    
    // 检查是否需要完成执行：消息已完成且有内容，且当前有活跃执行
    if (!message.loading && message.content && message.content.trim() !== '' && 
        currentExecution && currentExecution.isActive) {
      console.log('[TEAM_MESSAGE] 团队消息完成，开始兜底逻辑标记执行完成');
      
      // 兜底逻辑：自动标记所有任务为完成状态
      try {
        // 遍历所有阶段和任务，将未完成的标记为完成
        if (currentExecution.phases) {
          currentExecution.phases.forEach((phase, phaseIndex) => {
            if (phase.tasks) {
              phase.tasks.forEach((task, taskIndex) => {
                if (task.status === 'running' || task.status === 'pending') {
                  console.log(`[TEAM_MESSAGE] 兜底逻辑：标记任务完成 ${task.agentName}`);
                  // 注意：updateTask需要从teamExecutionStore导入
                  updateTask(task.id, {
                    status: 'completed',
                    progress: 100,
                    endTime: Date.now()
                  });
                }
              });
            }
            
            // 标记阶段完成
            if (phase.status === 'running' || phase.status === 'pending') {
              console.log(`[TEAM_MESSAGE] 兜底逻辑：标记阶段完成 ${phase.name}`);
              updatePhase(phase.id, {
                status: 'completed',
                endTime: Date.now()
              });
            }
          });
        }
      } catch (error) {
        console.error('[TEAM_MESSAGE] 兜底逻辑执行失败:', error);
      }
      
      // 最后完成整个执行
      completeExecution();
    }
  }, [isGeneratingAnswer, message.loading, memberCalls.length, currentExecution, completeExecution, updateTask, updatePhase]);

  // 解析ReasoningStep思考过程的函数
  const parseReasoningStepsAdvanced = (content: string) => {
    const reasoningSteps: Array<{
      id: string;
      type: 'think' | 'analyze';
      title: string;
      thought?: string;
      reasoning?: string;
      result?: string;
      confidence: number;
      duration?: string;
      nextaction?: string;
    }> = [];

    // 解析think()和analyze()调用
    const thinkRegex = /think\(title=([^,]+),\s*thought=([^,]*),\s*confidence=([^)]+)\)\s*completed in ([^s]+)s\.\[ReasoningStep:\s*title='([^']+)'[^}]*reasoning="([^"]*)"[^}]*confidence=([^}]+)\]/g;
    const analyzeRegex = /analyze\([^)]*\)\s*completed in ([^s]+)s\.\[ReasoningStep:\s*title='([^']+)'[^}]*result='([^']*)'[^}]*reasoning='([^']*)'[^}]*confidence=([^}]+)\]/g;

    let match;
    let stepIndex = 0;

    // 解析think步骤
    while ((match = thinkRegex.exec(content)) !== null) {
      reasoningSteps.push({
        id: `step-${stepIndex++}`,
        type: 'think',
        title: match[5] || match[1]?.replace(/'/g, ''),
        thought: match[2]?.replace(/\.\.\./g, '') || '',
        reasoning: match[6] || '',
        confidence: parseFloat(match[7] || match[3]) || 0,
        duration: match[4] || ''
      });
    }

    // 解析analyze步骤
    while ((match = analyzeRegex.exec(content)) !== null) {
      reasoningSteps.push({
        id: `step-${stepIndex++}`,
        type: 'analyze',
        title: match[2] || '',
        result: match[3] || '',
        reasoning: match[4] || '',
        confidence: parseFloat(match[5]) || 0,
        duration: match[1] || ''
      });
    }

    // 按时间顺序排序（基于在内容中的出现顺序）
    return reasoningSteps.sort((a, b) => {
      const aIndex = content.indexOf(a.title);
      const bIndex = content.indexOf(b.title);
      return aIndex - bIndex;
    });
  };

  // 获取解析后的思考步骤
  const reasoningSteps = parseReasoningStepsAdvanced(message.content || '');

  // 渲染中间Agent执行过程 - 状态渐变背景设计
  const renderIntermediateAgentExecution = (agent: TeamMemberCall) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'completed': 
          return { 
            bg: '#10b981', 
            light: 'rgba(16, 185, 129, 0.1)', 
            text: '#047857', 
            accent: '#059669',
            gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 30%, rgba(254, 215, 170, 0.4) 100%)'
          };
        case 'running': 
          return { 
            bg: '#f59e0b', 
            light: 'rgba(245, 158, 11, 0.1)', 
            text: '#d97706', 
            accent: '#f59e0b',
            gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 50%, rgba(255, 237, 213, 0.25) 100%)'
          };
        case 'failed': 
          return { 
            bg: '#ef4444', 
            light: 'rgba(239, 68, 68, 0.1)', 
            text: '#dc2626', 
            accent: '#ef4444',
            gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 30%, rgba(254, 226, 226, 0.4) 100%)'
          };
        default: 
          return { 
            bg: '#6b7280', 
            light: 'rgba(107, 114, 128, 0.1)', 
            text: '#4b5563', 
            accent: '#6b7280',
            gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 50%, rgba(243, 244, 246, 0.3) 100%)'
          };
      }
    };
    
    const statusConfig = getStatusConfig(agent.status || 'pending');
    
    return (
      <div key={agent.memberId} style={{
        background: statusConfig.gradient,
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: '4px',
        padding: '10px 12px',
        marginBottom: '4px',
        position: 'relative',
        transition: 'all 0.12s ease-out',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        {/* Agent名称和角色 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '2px',
            letterSpacing: '-0.01em'
          }}>
            {agent.memberName || agent.member_name || agent.memberId || agent.member_id}
          </div>
          <div style={{
            fontSize: '9px',
            color: '#6b7280',
            fontWeight: '500',
            lineHeight: '1.3'
          }}>
            {agent.action || agent.role || '执行中'}
          </div>
        </div>
        
        {/* 右侧状态区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* 执行时间指标 */}
          {(agent.durationMs || agent.duration_ms) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '8px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#94a3b8'
              }} />
              {(agent.durationMs || agent.duration_ms) < 1000 ? `${agent.durationMs || agent.duration_ms}ms` : `${((agent.durationMs || agent.duration_ms) / 1000).toFixed(1)}s`}
            </div>
          )}
          
          {/* 置信度条 */}
          {agent.confidence && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '24px',
                height: '3px',
                background: 'rgba(156, 163, 175, 0.3)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${agent.confidence * 100}%`,
                  height: '100%',
                  background: agent.confidence > 0.8 ? '#10b981' : agent.confidence > 0.6 ? '#f59e0b' : '#ef4444',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                fontSize: '7px',
                color: '#64748b',
                fontWeight: '600',
                minWidth: '22px'
              }}>
                {Math.round(agent.confidence * 100)}%
              </div>
            </div>
          )}
          
          {/* 状态图标 */}
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            background: statusConfig.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: '700',
            color: statusConfig.text,
            border: `1px solid ${statusConfig.accent}30`
          }}>
            {agent.status === 'completed' ? '✓' : 
             agent.status === 'running' ? '⚡' : 
             agent.status === 'failed' ? '✗' : '◯'}
          </div>
        </div>
        
        {/* 动态加载动画 - 底部进度条 */}
        {agent.status === 'running' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'rgba(245, 158, 11, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '30%',
              background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
              animation: 'loading-shimmer 2s infinite linear'
            }} />
          </div>
        )}
      </div>
    );
  };

  // 渲染最终答案Agent - 统一橙色渐变设计
  const renderFinalAnswerAgent = (agent: TeamMemberCall) => {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 50%, rgba(255, 237, 213, 0.3) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 165, 0, 0.15)',
        borderRadius: '8px',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(255, 165, 0, 0.12)',
        marginTop: '4px',
        marginBottom: '4px'
      }}>
        {/* 左侧状态圆点 */}
        <div style={{
          position: 'absolute',
          left: '6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#ff8500',
          boxShadow: '0 0 8px rgba(255, 133, 0, 0.4)'
        }} />
        
        {/* 内容区域 */}
        <div style={{
          marginLeft: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {/* Agent信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#c2410c',
                marginBottom: '1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {agent.memberName || agent.member_name || agent.memberId || '答案总结'}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#ea580c',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {agent.action || '生成最终回答'}
              </div>
            </div>
          </div>
          
          {/* 右侧指标区 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}>
            {/* 置信度 */}
            {agent.confidence && (
              <div style={{
                fontSize: '9px',
                color: '#c2410c',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: '#ff8500'
                }} />
                {Math.round(agent.confidence * 100)}%
              </div>
            )}
            
            {/* 执行时间 */}
            {(agent.durationMs || agent.duration_ms) && (
              <div style={{
                fontSize: '9px',
                color: '#c2410c',
                fontWeight: '500',
                padding: '1px 4px',
                background: 'rgba(255, 133, 0, 0.15)',
                borderRadius: '3px'
              }}>
                {agent.durationMs || agent.duration_ms}ms
              </div>
            )}
            
            {/* 完成状态标签 */}
            <div style={{
              fontSize: '8px',
              padding: '2px 5px',
              borderRadius: '3px',
              background: 'rgba(255, 133, 0, 0.15)',
              color: '#c2410c',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              border: '1px solid rgba(255, 133, 0, 0.2)'
            }}>
              FINAL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 新的内容隔离渲染器 - 基于Agent完成计数器
  const renderIsolatedContent = (content: string) => {
    if (!content) return null;

    // 优化正则匹配逻辑 - 避免性能问题
    console.log('[CONTENT_ISOLATION] 开始正则匹配，内容长度:', content.length);
    
    let agentCompleteMatches = [];
    
    // 使用更简单的正则，避免贪婪匹配导致的性能问题
    const simpleRegexes = [
      /---\s*\*\*●[^*]*执行完成\*\*/g,     // 简化版：● 执行完成
      /---\s*\*\*✅[^*]*执行完成\*\*/g,    // 简化版：✅ 执行完成
    ];
    
    for (const regex of simpleRegexes) {
      try {
        const matches = content.match(regex);
        console.log('[CONTENT_ISOLATION] 正则匹配结果:', regex.source, matches?.length || 0);
        if (matches && matches.length > 0) {
          agentCompleteMatches = matches;
          break;
        }
      } catch (error) {
        console.error('[CONTENT_ISOLATION] 正则匹配出错:', error);
      }
    }
    
    const completedAgentCount = agentCompleteMatches.length;
    const totalAgents = 6; // 固定6个Agent
    
    console.log('🔥🔥🔥 [CONTENT_ISOLATION] 内容隔离渲染器被调用!', {
      contentLength: content.length,
      completedAgentCount,
      totalAgents,
      shouldSeparate: completedAgentCount >= 5,
      agentMatches: agentCompleteMatches,
      messageLoading: message.loading,
      messageId: message.id,
      willEnterSeparationMode: completedAgentCount >= 5 ? 'YES' : 'NO',
      timestamp: new Date().toISOString()
    });
    
    // 添加防护：如果内容过长，可能是渲染问题
    if (content.length > 100000) {
      console.warn('[CONTENT_ISOLATION] 内容过长，可能导致渲染问题:', content.length);
    }
    
    if (completedAgentCount >= 5) {
      // 前5个Agent执行完成，需要分离显示
      // 使用第5个Agent的完成标记作为分离点（索引4）
      const fifthAgentMatch = agentCompleteMatches[4];  // 第5个Agent（索引4）
      const fifthAgentIndex = content.indexOf(fifthAgentMatch);
      const separationIndex = fifthAgentIndex + fifthAgentMatch.length;
      
      const preExecutionContent = content.substring(0, separationIndex);
      const finalAnswerContent = content.substring(separationIndex).trim();
      
      console.log('✅ [CONTENT_ISOLATION] 内容分离完成:', {
        preLength: preExecutionContent.length,
        finalLength: finalAnswerContent.length,
        separationIndex
      });
      
      return (
        <div>
          {/* 预执行内容区域 - 保持浅灰蓝色，区别于最终回答 */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '12px',
            borderLeft: '4px solid rgba(148, 163, 184, 0.5)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(71, 85, 105, 0.8)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>●</span>
              <span>团队协作执行过程 ({completedAgentCount}/{totalAgents})</span>
            </div>
            <AcademicMarkdownRenderer content={preExecutionContent} />
          </div>
          
          {/* 最终回答区域 - 橙色主题 */}
          {finalAnswerContent && (
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.9) 0%, rgba(254, 215, 170, 0.9) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '12px',
              borderLeft: '4px solid rgba(249, 115, 22, 0.5)',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'rgba(194, 65, 12, 0.9)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>●</span>
                <span>最终回答</span>
              </div>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: 'rgba(55, 65, 81, 0.9)'
              }}>
                <AcademicMarkdownRenderer content={finalAnswerContent} />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Agent还在执行中 - 使用白灰色中间Agent样式
      return (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '12px',
          borderLeft: '4px solid rgba(148, 163, 184, 0.5)'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(71, 85, 105, 0.8)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>●</span>
            <span>团队协作执行中... ({completedAgentCount}/{totalAgents})</span>
          </div>
          <AcademicMarkdownRenderer content={content} />
        </div>
      );
    }

    return (
      <div>
        {/* 预执行内容区域 */}
        {preExecutionContent.trim() && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(219, 234, 254, 0.8) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            borderLeft: '4px solid rgba(59, 130, 246, 0.4)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(59, 130, 246, 0.8)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔄</span>
              <span>团队协作执行过程</span>
            </div>
            <AcademicMarkdownRenderer content={preExecutionContent} />
          </div>
        )}
        
        {/* 最终回答区域 */}
        {finalAnswerContent.trim() && (
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(254, 249, 195, 0.9) 0%, rgba(254, 240, 138, 0.9) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            borderLeft: '4px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'rgba(245, 158, 11, 0.9)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✨</span>
              <span>最终回答</span>
            </div>
            <div style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'rgba(55, 65, 81, 0.9)'
            }}>
              <AcademicMarkdownRenderer content={finalAnswerContent} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // 创建格式化的内容渲染器 - 修复：保留thinking格式化，但不过滤其他Agent执行内容
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // 分割内容为各个部分
    const parts: Array<{
      type: 'text' | 'reasoning_step';
      content: string;
      data?: any;
    }> = [];

    let lastIndex = 0;
    
    // 只查找thinking/analyze步骤用于特殊格式化，但保留所有其他内容
    const thinkingRegex = /(think\([^)]*\)\s*completed in [^s]+s\.\[ReasoningStep:[^\]]*\]|analyze\([^)]*\)\s*completed in [^s]+s\.\[ReasoningStep:[^\]]*\])/g;
    
    let match;
    while ((match = thinkingRegex.exec(content)) !== null) {
      // 添加thinking步骤之前的所有内容（包括Agent执行、决策等）
      if (match.index > lastIndex) {
        const textContent = content.substring(lastIndex, match.index);
        if (textContent.trim()) {
          parts.push({
            type: 'text',
            content: textContent
          });
        }
      }
      
      // 解析thinking步骤用于特殊格式化
      const stepMatch = match[0];
      const isThink = stepMatch.startsWith('think');
      
      // 解析步骤数据
      const titleMatch = stepMatch.match(/title='([^']+)'/);
      const reasoningMatch = stepMatch.match(/reasoning="([^"]*)"/);
      const confidenceMatch = stepMatch.match(/confidence=([^}]+)/);
      const durationMatch = stepMatch.match(/completed in ([^s]+)s/);
      const resultMatch = stepMatch.match(/result='([^']*)'/);
      
      parts.push({
        type: 'reasoning_step',
        content: stepMatch,
        data: {
          type: isThink ? 'think' : 'analyze',
          title: titleMatch ? titleMatch[1] : '',
          reasoning: reasoningMatch ? reasoningMatch[1] : '',
          result: resultMatch ? resultMatch[1] : '',
          confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
          duration: durationMatch ? durationMatch[1] : ''
        }
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余的所有内容（包括Agent执行、决策等）
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push({
          type: 'text',
          content: remainingText
        });
      }
    }

    // 如果没有找到任何thinking步骤，直接渲染全部内容
    if (parts.length === 0) {
      return (
        <div>
          <AcademicMarkdownRenderer content={content} />
        </div>
      );
    }

    return (
      <div>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div key={index}>
                <AcademicMarkdownRenderer content={part.content} />
              </div>
            );
          } else if (part.type === 'reasoning_step') {
            return (
              <div key={index} style={{ 
                margin: '12px 0',
                padding: '10px',
                background: part.data.type === 'think' 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(167, 243, 208, 0.12) 100%)',
                border: `1px solid ${part.data.type === 'think' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: '8px',
                borderLeft: `4px solid ${part.data.type === 'think' ? '#3b82f6' : '#10b981'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {part.data.type === 'think' ? (
                    <BulbOutlined style={{ color: '#3b82f6', fontSize: '14px' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: '14px' }} />
                  )}
                  <Text strong style={{ 
                    color: part.data.type === 'think' ? '#1d4ed8' : '#059669',
                    fontSize: '13px'
                  }}>
                    {part.data.title}
                  </Text>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                    {part.data.duration && (
                      <Tag size="small" style={{ 
                        fontSize: '9px',
                        background: 'rgba(107, 114, 128, 0.1)',
                        border: '1px solid rgba(107, 114, 128, 0.2)',
                        color: '#6b7280'
                      }}>
                        {part.data.duration}s
                      </Tag>
                    )}
                    <Tag size="small" style={{ 
                      fontSize: '9px',
                      background: `rgba(${part.data.type === 'think' ? '59, 130, 246' : '16, 185, 129'}, 0.15)`,
                      border: `1px solid rgba(${part.data.type === 'think' ? '59, 130, 246' : '16, 185, 129'}, 0.35)`,
                      color: part.data.type === 'think' ? '#1d4ed8' : '#059669'
                    }}>
                      {Math.round(part.data.confidence * 100)}%
                    </Tag>
                  </div>
                </div>
                
                {part.data.reasoning && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#6b7280',
                    lineHeight: '1.4',
                    marginBottom: '6px',
                    fontStyle: 'italic'
                  }}>
                    💭 {part.data.reasoning}
                  </div>
                )}
                
                {part.data.result && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#374151',
                    lineHeight: '1.4',
                    background: 'rgba(249, 250, 251, 0.8)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(229, 231, 235, 0.8)'
                  }}>
                    <Text strong style={{ fontSize: '10px', color: '#059669' }}>📋 结果：</Text>
                    {part.data.result}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  
  // 执行流程数据（只基于真实数据）
  const executionFlow = useMemo(() => {
    if (memberCalls.length === 0) return null;
    
    const phases = memberCalls.map((call, index) => ({
      id: `phase-${index}`,
      name: call.memberName || call.member_name || `Agent ${index + 1}`,
      status: call.status || 'pending',
      tasks: [{
        id: call.memberId || call.member_id || `task-${index}`,
        agentName: call.memberName || call.member_name || 'Unknown Agent',
        taskName: call.action || 'Processing',
        status: call.status || 'pending',
        progress: call.status === 'completed' ? 100 : 0
      }]
    }));
    
    return { phases };
  }, [memberCalls]);

  // 判断是否显示Team界面
  const shouldShowTeamInterface = () => {
    return teamInfo?.isTeamMessage === true;
  };

  // 统一使用Team消息渲染模式

  // 获取状态图标 - 增强动画效果
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} spin />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'processing';
      case 'error':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 格式化持续时间
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return 'N/A';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  // 渲染成员调用详情
  const renderMemberCallDetails = (memberCall: TeamMemberCall) => {
    return (
      <Card size="small" style={{ marginTop: 8 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="开始时间"
              value={new Date(memberCall.startTime).toLocaleTimeString()}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="持续时间"
              value={formatDuration(memberCall.durationMs)}
              prefix={<PlayCircleOutlined />}
            />
          </Col>
        </Row>
        
        {memberCall.confidence && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Statistic
                title="置信度"
                value={memberCall.confidence}
                suffix="%"
                precision={1}
              />
            </Col>
          </Row>
        )}

        <Divider />

        <Collapse size="small">
          <Panel header="输入数据" key="input">
            <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(memberCall.input, null, 2)}
            </pre>
          </Panel>
          <Panel header="输出数据" key="output">
            <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(memberCall.output, null, 2)}
            </pre>
          </Panel>
          {memberCall.errorMessage && (
            <Panel header="错误信息" key="error">
              <Alert
                message="执行错误"
                description={memberCall.errorMessage}
                type="error"
                showIcon
              />
            </Panel>
          )}
        </Collapse>
      </Card>
    );
  };

  // 渲染结构化输出
  const renderStructuredOutput = (output: TeamStructuredOutput) => {
    return (
      <Card 
        title={
          <Space>
            <CodeOutlined />
            <Text strong>结构化输出</Text>
            <Tag color="blue">{output.type}</Tag>
          </Space>
        }
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="link"
            size="small"
            onClick={() => setShowStructuredOutput(!showStructuredOutput)}
          >
            {showStructuredOutput ? '隐藏' : '显示'}详情
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="置信度"
              value={output.confidence}
              suffix="%"
              precision={1}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="数据类型"
              value={output.type}
            />
          </Col>
        </Row>

        {showStructuredOutput && (
          <div style={{ marginTop: 16 }}>
            <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(output.data, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    );
  };

  // 渲染协调信息 - 重新设计的性能仪表板
  const renderCoordinationInfo = (info: TeamCoordinationInfo) => {
    const metrics = info.performanceMetrics;
    const successRate = metrics?.successRate || 0;
    const efficiency = metrics?.executionEfficiency || 0;
    
    return (
      <Card 
        title={
          <Space>
            <DeploymentUnitOutlined style={{ color: '#f97316' }} />
            <Text strong style={{ color: '#ea580c' }}>团队协调与性能分析</Text>
            <Tag color="orange">实时监控</Tag>
          </Space>
        }
        size="small"
        style={{ 
          marginTop: 16,
          background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.6) 0%, rgba(254, 215, 170, 0.3) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '12px'
        }}
        headStyle={{ 
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(254, 215, 170, 0.1) 100%)',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)'
        }}
      >
        {/* 核心性能指标 */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <BarsOutlined style={{ color: '#3b82f6', fontSize: '18px', marginBottom: '4px' }} />
              <div style={{ color: '#1d4ed8', fontWeight: 'bold', fontSize: '20px' }}>
                {metrics?.totalSteps || 0}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '500' }}>
                总执行步骤
              </div>
            </div>
          </Col>
          
          <Col span={6}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(167, 243, 208, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <CheckCircleOutlined style={{ color: '#10b981', fontSize: '18px', marginBottom: '4px' }} />
              <div style={{ color: '#059669', fontWeight: 'bold', fontSize: '20px' }}>
                {metrics?.completedSteps || 0}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '500' }}>
                成功完成
              </div>
            </div>
          </Col>
          
          <Col span={6}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(253, 230, 138, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <ThunderboltOutlined style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '4px' }} />
              <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '20px' }}>
                {formatDuration(metrics?.totalExecutionTime || 0)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '500' }}>
                总执行时间
              </div>
            </div>
          </Col>
          
          <Col span={6}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(196, 181, 253, 0.15) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <RobotOutlined style={{ color: '#a855f7', fontSize: '18px', marginBottom: '4px' }} />
              <div style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '20px' }}>
                {info.coordinatorId || 'Auto'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '500' }}>
                协调器ID
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0', borderColor: 'rgba(249, 115, 22, 0.15)' }} />

        {/* 性能指标与效率分析 */}
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                执行成功率
              </div>
              <Progress
                type="circle"
                size={80}
                percent={Math.round(successRate * 100)}
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#059669',
                }}
                format={percent => (
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>
                    {percent}%
                  </span>
                )}
              />
            </div>
          </Col>
          
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                执行效率
              </div>
              <Progress
                type="circle"
                size={80}
                percent={Math.round(efficiency * 100)}
                strokeColor={{
                  '0%': '#f59e0b',
                  '100%': '#d97706',
                }}
                format={percent => (
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706' }}>
                    {percent}%
                  </span>
                )}
              />
            </div>
          </Col>
          
          <Col span={8}>
            <div style={{ padding: '0 8px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                <span>协调模式</span>
                <Tag color="blue" style={{ fontSize: '10px' }}>
                  {info.coordinationMode || 'Auto'}
                </Tag>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <span>平均步骤时间</span>
                <Text strong style={{ color: '#f97316', fontSize: '12px' }}>
                  {formatDuration(metrics?.averageStepDuration || 0)}
                </Text>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <span>失败步骤</span>
                <Text strong style={{ color: metrics?.failedSteps ? '#ef4444' : '#10b981', fontSize: '12px' }}>
                  {metrics?.failedSteps || 0}
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        {/* 路由决策时间线 */}
        {info.routingDecisions && info.routingDecisions.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0', borderColor: 'rgba(249, 115, 22, 0.15)' }} />
            <div style={{ marginBottom: '12px' }}>
              <Text strong style={{ color: '#ea580c', fontSize: '13px' }}>
                <TeamOutlined style={{ marginRight: '6px' }} />
                智能路由决策链
              </Text>
              <Tag color="processing" size="small" style={{ marginLeft: '8px' }}>
                {info.routingDecisions.length} 个决策点
              </Tag>
            </div>
            <Timeline size="small">
              {info.routingDecisions.map((decision, index) => (
                <Timeline.Item 
                  key={index}
                  dot={
                    <div style={{
                      width: '16px',
                      height: '16px',
                      background: 'linear-gradient(45deg, #f97316 0%, #ea580c 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 4px rgba(249, 115, 22, 0.3)'
                    }}>
                      <RobotOutlined style={{ color: '#ffffff', fontSize: '8px' }} />
                    </div>
                  }
                >
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(254, 215, 170, 0.1) 100%)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#ea580c', fontSize: '12px' }}>
                        Agent: {decision.memberId}
                      </Text>
                      <Tag size="small" style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#2563eb',
                        fontSize: '10px'
                      }}>
                        置信度 {decision.confidence}%
                      </Tag>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ color: '#6b7280', fontSize: '11px', lineHeight: '1.4' }}>
                        {decision.reason}
                      </Text>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Card>
    );
  };

  // 简化的Team渲染（用于简单问答）
  // 获取决策过程数据（从memberCalls生成决策信息）
  const getDecisionProcesses = useCallback(() => {
    try {
      console.log('🔍 [GET_DECISIONS] 获取决策数据:', {
        'message.thinking': message.thinking,
        'teamDecisions': teamDecisions,
        'memberCalls': memberCalls
      });
      
      // 优先使用数据库中的thinking数据（历史对话）
      if (message.thinking && Array.isArray(message.thinking) && message.thinking.length > 0) {
        console.log('✅ [GET_DECISIONS] 使用thinking数据');
        return message.thinking;
      }
      
      // 实时对话使用teamDecisions数据
      if (teamDecisions && Array.isArray(teamDecisions) && teamDecisions.length > 0) {
        console.log('✅ [GET_DECISIONS] 使用teamDecisions数据');
        return teamDecisions;
      }
      
      // 🔥 新增：从memberCalls生成决策流程信息 - 区分开始和结束事件
      if (memberCalls && Array.isArray(memberCalls) && memberCalls.length > 0) {
        console.log('✅ [GET_DECISIONS] 从memberCalls生成决策数据');
        
        // Agent ID到人类可读名称的映射
        const agentNameMapping = {
          'question_decomposition_agent': '问题分析',
          'intelligent_routing_agent': '智能路由', 
          'dag_reconstruction_agent': 'DAG重构',
          'translation_agent': '翻译处理',
          'knowledge_retrieval_agent': '知识检索',
          'knowledge_graph_agent': '知识图谱',
          'summary_answer_agent': '答案总结'
        };
        
        // 按Agent分组，区分开始和结束事件
        const agentGroups = new Map();
        
        memberCalls.forEach((call) => {
          const agentId = call.memberId || call.member_id;
          const agentName = call.memberName || call.member_name;
          const displayName = agentNameMapping[agentId] || agentName || agentId || 'Unknown Agent';
          const durationMs = call.durationMs || 0;
          
          if (!agentGroups.has(agentId)) {
            agentGroups.set(agentId, {
              agentId,
              displayName,
              startEvent: null,
              endEvent: null
            });
          }
          
          const group = agentGroups.get(agentId);
          
          // 耗时为0或很小的是开始事件，有具体耗时的是结束事件
          if (durationMs <= 10) {
            group.startEvent = {
              title: `${displayName} - 开始`,
              content: `开始执行${call.action || '任务'}`,
              timestamp: call.startTime || Date.now() - 1000, // 确保开始事件在前
              agent: agentId,
              agentName: displayName,
              confidence: call.confidence || 0.9,
              status: 'running',
              eventType: 'start',
              durationMs: 0
            };
          } else {
            group.endEvent = {
              title: `${displayName} - 完成`,
              content: `${call.action || '执行'}完成，耗时${durationMs}ms`,
              timestamp: (call.startTime || Date.now()) + durationMs, // 计算结束时间
              agent: agentId,
              agentName: displayName,
              confidence: call.confidence || 0.9,
              status: 'completed',
              eventType: 'end',
              durationMs
            };
          }
        });
        
        // 生成决策事件数组 - 按Agent和执行顺序排列
        const decisions = [];
        
        // 按Agent执行顺序排序
        const agentOrder = [
          'question_decomposition_agent',
          'intelligent_routing_agent', 
          'dag_reconstruction_agent',
          'translation_agent',
          'knowledge_retrieval_agent',
          'knowledge_graph_agent',
          'summary_answer_agent'
        ];
        
        agentOrder.forEach(agentId => {
          const group = agentGroups.get(agentId);
          if (group) {
            // 先添加开始事件，再添加结束事件
            if (group.startEvent) {
              decisions.push(group.startEvent);
            }
            if (group.endEvent) {
              decisions.push(group.endEvent);
            }
          }
        });
        
        // 处理未在预定义顺序中的Agent
        agentGroups.forEach((group, agentId) => {
          if (!agentOrder.includes(agentId)) {
            if (group.startEvent) {
              decisions.push(group.startEvent);
            }
            if (group.endEvent) {
              decisions.push(group.endEvent);
            }
          }
        });
        
        console.log('📊 [GET_DECISIONS] 生成决策事件:', decisions.length, '个事件');
        return decisions;
      }
      
      console.log('❌ [GET_DECISIONS] 无任何决策数据');
      return [];
      
    } catch (error) {
      console.error('❌ [GET_DECISIONS_ERROR]', error);
      return [];
    }
  }, [message.thinking, teamDecisions, memberCalls]);

  // 按Agent分组收集执行数据
  const getAgentExecutionData = useCallback(() => {
    const agentDataMap = new Map();
    
    // Agent名称映射
    const agentNameMapping = {
      'question_decomposition_agent': '问题分析',
      'intelligent_routing_agent': '智能路由', 
      'dag_reconstruction_agent': 'DAG重构',
      'translation_agent': '翻译处理',
      'knowledge_retrieval_agent': '知识检索',
      'knowledge_graph_agent': '知识图谱',
      'summary_answer_agent': '答案总结'
    };
    
    // 1. 从member_calls收集基本执行信息
    if (memberCalls && memberCalls.length > 0) {
      memberCalls.forEach(call => {
        const agentId = call.memberId || call.member_id;
        const agentName = call.memberName || call.member_name;
        const displayName = agentNameMapping[agentId] || agentName || agentId;
        
        if (!agentDataMap.has(agentId)) {
          agentDataMap.set(agentId, {
            id: agentId,
            name: displayName,
            originalName: agentName,
            decisions: [],
            content: [],
            status: call.status || 'completed',
            startTime: call.startTime,
            endTime: call.endTime,
            duration: call.durationMs || (call.endTime - call.startTime),
            confidence: call.confidence,
            action: call.action,
            output: call.output
          });
        }
      });
    }
    
    // 2. 从teamDecisions/thinking数据收集决策信息
    const decisionProcesses = getDecisionProcesses();
    decisionProcesses.forEach(decision => {
      const agentId = decision.agent || decision.agentId || 'unknown';
      const displayName = agentNameMapping[agentId] || decision.agentName || agentId;
      
      if (!agentDataMap.has(agentId)) {
        agentDataMap.set(agentId, {
          id: agentId,
          name: displayName,
          originalName: decision.agentName,
          decisions: [],
          content: [],
          status: decision.status || 'completed',
          confidence: decision.confidence
        });
      }
      
      const agentData = agentDataMap.get(agentId);
      agentData.decisions.push(decision);
    });
    
    // 3. 🔥 从message.content中解析Agent内容数据
    // 解析Agent专属内容（基于已知的content模式）
    const messageContent = message.content || '';
    const agentContentPatterns = [
      { agent: 'question_decomposition_agent', patterns: ['问题分析完成：'] },
      { agent: 'intelligent_routing_agent', patterns: ['路由决策：'] },
      { agent: 'translation_agent', patterns: ['翻译完成：'] },
      { agent: 'knowledge_retrieval_agent', patterns: ['知识库检索完成', '多语言知识库检索完成'] },
      { agent: 'knowledge_graph_agent', patterns: ['知识图谱查询完成', '📊 知识图谱查询完成', '## ', '### ', '**', 'Properties', 'Natural Rubber'] },
      { agent: 'summary_answer_agent', patterns: ['基于收集的信息', '根据检索到的信息'] }
    ];
    
    agentContentPatterns.forEach(({ agent, patterns }) => {
      patterns.forEach(pattern => {
        const index = messageContent.indexOf(pattern);
        if (index !== -1) {
          // 找到内容的结束位置（下一个Agent的开始或字符串结束）
          let endIndex = messageContent.length;
          agentContentPatterns.forEach(({ patterns: otherPatterns }) => {
            otherPatterns.forEach(otherPattern => {
              if (otherPattern !== pattern) {
                const otherIndex = messageContent.indexOf(otherPattern, index + 1);
                if (otherIndex !== -1 && otherIndex < endIndex) {
                  endIndex = otherIndex;
                }
              }
            });
          });
          
          const content = messageContent.substring(index, endIndex).trim();
          if (content.length > 10) { // 只保存有意义的内容
            const agentId = agent;
            const displayName = agentNameMapping[agentId] || agentId;
            
            if (!agentDataMap.has(agentId)) {
              agentDataMap.set(agentId, {
                id: agentId,
                name: displayName,
                originalName: agentId,
                decisions: [],
                content: [],
                status: 'completed',
                confidence: 0.9
              });
            }
            
            const agentData = agentDataMap.get(agentId);
            if (!agentData.content.find(c => (c.content || c) === content)) {
              agentData.content.push({ content, timestamp: Date.now() });
            }
          }
        }
      });
    });
    
    return Array.from(agentDataMap.values()).sort((a, b) => {
      // 按执行顺序排序
      const orderMapping = {
        'question_decomposition_agent': 1,
        'intelligent_routing_agent': 2,
        'dag_reconstruction_agent': 3,
        'translation_agent': 4,
        'knowledge_retrieval_agent': 5,
        'knowledge_graph_agent': 6,
        'summary_answer_agent': 7
      };
      return (orderMapping[a.id] || 999) - (orderMapping[b.id] || 999);
    });
  }, [memberCalls, getDecisionProcesses]);

  // 获取Agent执行数据
  const agentExecutionData = getAgentExecutionData();

  // 转换数据为新流程可视化组件格式
  const agentSteps = useMemo(() => {
    const steps: any[] = [];
    const agentOrder = [
      'question_decomposition_agent',
      'intelligent_routing_agent', 
      'dag_reconstruction_agent',
      'translation_agent',
      'knowledge_retrieval_agent',
      'knowledge_graph_agent',
      'summary_answer_agent'
    ];

    const agentNameMapping = {
      'question_decomposition_agent': '问题分析',
      'intelligent_routing_agent': '智能路由',
      'dag_reconstruction_agent': 'DAG重构',
      'translation_agent': '翻译处理',
      'knowledge_retrieval_agent': '知识检索',
      'knowledge_graph_agent': '知识图谱',
      'summary_answer_agent': '答案总结'
    };

    agentOrder.forEach(agentId => {
      const agentInfo = agentExecutionData.find(a => a.id === agentId);
      if (!agentInfo) return;

      // 确定状态 - 改进状态判断逻辑
      let status = 'pending';
      let content = '';
      let startTime: number | undefined;
      let endTime: number | undefined;

      // 从memberCalls中获取真实状态
      const memberCall = memberCalls.find(call => 
        (call.memberId === agentId || call.member_id === agentId)
      );

      if (memberCall) {
        // 使用memberCall的状态作为准确状态
        if (memberCall.status === 'completed') {
          status = 'completed';
          startTime = memberCall.startTime;
          endTime = memberCall.endTime;
        } else if (memberCall.status === 'running' || memberCall.status === 'processing') {
          status = 'running';
          startTime = memberCall.startTime;
        } else {
          status = memberCall.status || 'pending';
        }
      }

      // 获取内容
      if (agentInfo.content && agentInfo.content.length > 0) {
        content = agentInfo.content.map((c: any) => c.content || c).join('\n');
        if (status === 'pending') status = 'completed'; // 如果有内容但状态未定，设为完成
      } else if (agentInfo.decisions && agentInfo.decisions.length > 0 && status === 'pending') {
        status = 'running'; // 如果有决策但没有内容，且状态未定，设为运行中
      }

      // 检查是否应该显示summary_answer_agent
      if (agentId === 'summary_answer_agent') {
        // 只有在其他主要Agent完成后才显示
        const mainAgents = ['knowledge_retrieval_agent', 'knowledge_graph_agent'];
        const hasMainAgentContent = mainAgents.some(id => {
          const agent = agentExecutionData.find(a => a.id === id);
          return agent && agent.content && agent.content.length > 0;
        });
        
        if (!hasMainAgentContent && status === 'pending') {
          return; // 跳过显示
        }
      }

      steps.push({
        id: agentId,
        name: agentId,
        displayName: agentNameMapping[agentId as keyof typeof agentNameMapping] || agentId,
        status,
        startTime,
        endTime,
        content,
        decisions: agentInfo.decisions || [],
        outputData: agentInfo.outputData
      });
    });

    return steps;
  }, [agentExecutionData]);

  // 渲染单个Agent的执行过程 - 特色背景设计
  const renderAgentExecution = (agentData: any) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'completed':
          return {
            dotColor: '#10b981',
            tagColor: 'success',
            borderColor: '#e5e7eb',
            bgColor: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
          };
        case 'running':
          return {
            dotColor: '#3b82f6',
            tagColor: 'processing', 
            borderColor: '#e5e7eb',
            bgColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
          };
        case 'error':
          return {
            dotColor: '#ef4444',
            tagColor: 'error',
            borderColor: '#e5e7eb',
            bgColor: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
          };
        default:
          return {
            dotColor: '#9ca3af',
            tagColor: 'default',
            borderColor: '#e5e7eb',
            bgColor: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
          };
      }
    };

    const config = getStatusConfig(agentData.status);

    return (
      <div 
        key={agentData.id} 
        className="rounded-lg border p-4 mb-4 transition-all duration-200 hover:shadow-md"
        style={{
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`
        }}
      >
        {/* Agent标题栏 - 简洁设计 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.dotColor }}
            ></div>
            <span className="font-medium text-gray-900 text-sm">
              {agentData.name}
            </span>
            <Tag size="small" color={config.tagColor}>
              {agentData.status === 'completed' ? '已完成' : 
               agentData.status === 'running' ? '执行中' : 
               agentData.status === 'error' ? '错误' : '等待中'}
            </Tag>
          </div>
          
          <div className="flex items-center gap-2">
            {agentData.confidence && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                置信度: {Math.round(agentData.confidence * 100)}%
              </span>
            )}
            {agentData.duration && (
              <span className="text-xs text-gray-500">
                {agentData.duration < 1000 ? `${agentData.duration}ms` : `${(agentData.duration / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="space-y-3">
          {/* 执行结果 - 只显示最终完成事件 */}
          {agentData.decisions && agentData.decisions.length > 0 && (() => {
            // 过滤只显示结束事件（有耗时的完成事件）
            const completedDecisions = agentData.decisions.filter((decision: any) => {
              return decision.eventType === 'end' || 
                     (decision.durationMs && decision.durationMs > 10) ||
                     (decision.content && decision.content.includes('完成')) ||
                     decision.status === 'completed';
            });

            if (completedDecisions.length === 0) return null;

            return (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">执行结果</div>
                <div className="space-y-2">
                  {completedDecisions.map((decision: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-md p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 text-sm">
                          {decision.agentName || decision.title || '执行完成'}
                        </span>
                        <div className="flex items-center gap-2">
                          {decision.durationMs && decision.durationMs > 10 && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                              {decision.durationMs < 1000 ? `${decision.durationMs}ms` : `${(decision.durationMs / 1000).toFixed(1)}s`}
                            </span>
                          )}
                          {decision.confidence && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              {Math.round(decision.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {decision.content && (
                        <div className="text-gray-700 text-sm leading-relaxed mb-1">
                          {decision.content}
                        </div>
                      )}
                      {decision.reasoning && (
                        <div className="text-xs text-gray-500 italic">
                          💭 {decision.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          
          {/* 执行输出 */}
          {(() => {
            // 🔥 优先检查content数据，然后检查output数据
            const hasValidContent = agentData.content && Array.isArray(agentData.content) && agentData.content.length > 0;
            const hasValidOutput = agentData.output && 
              (typeof agentData.output === 'string' && agentData.output.trim() !== '') ||
              (typeof agentData.output === 'object' && agentData.output !== null && Object.keys(agentData.output).length > 0);
            
            // 如果有收集到的content数据，优先显示
            if (hasValidContent) {
              const fullContent = agentData.content.map((item: any) => item.content || item).join('\n');
              const isContentLong = fullContent.length > 200;
              
              return (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">执行结果</div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-md border border-gray-100 relative">
                    <div className="p-3">
                      <div className="text-sm text-gray-700 leading-relaxed h-24 overflow-hidden">
                        {agentData.content.slice(0, 2).map((contentItem: any, idx: number) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            {(contentItem.content || contentItem).toString().substring(0, 150)}
                            {(contentItem.content || contentItem).toString().length > 150 && '...'}
                          </div>
                        ))}
                      </div>
                    </div>
                    {isContentLong && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => {
                              // 转换为 AgentFlowVisualization 所需的格式
                              const agentStep = {
                                id: agentData.id,
                                name: agentData.name,
                                displayName: agentData.name,
                                status: agentData.status,
                                content: fullContent,
                                decisions: agentData.decisions || [],
                                outputData: agentData.output
                              };
                              // 使用内部状态控制抽屉显示
                              console.log('🔥 [DRAWER] 点击查看完整内容按钮:', agentStep);
                              setSelectedAgentForDrawer(agentStep);
                            }}
                            className="w-full py-2 px-3 text-xs font-medium bg-gray-300/30 backdrop-blur-sm hover:bg-gray-400/40 focus:bg-gray-400/40 text-black rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 focus:outline-none border-none hover:border-none focus:border-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            查看完整内容
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            // 如果有有效输出，显示实际数据
            if (hasValidOutput) {
              const outputString = typeof agentData.output === 'string' ? agentData.output : JSON.stringify(agentData.output, null, 2);
              const isOutputLong = outputString.length > 200;
              
              return (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">执行结果</div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-md border border-gray-100 relative">
                    <div className="p-3">
                      <div className="text-sm text-gray-700 leading-relaxed h-24 overflow-hidden">
                        {outputString.substring(0, 200)}
                        {isOutputLong && '...'}
                      </div>
                    </div>
                    {isOutputLong && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => {
                              // 转换为 AgentFlowVisualization 所需的格式
                              const agentStep = {
                                id: agentData.id,
                                name: agentData.name,
                                displayName: agentData.name,
                                status: agentData.status,
                                content: outputString,
                                decisions: agentData.decisions || [],
                                outputData: agentData.output
                              };
                              // 使用内部状态控制抽屉显示
                              console.log('🔥 [DRAWER] 点击查看完整内容按钮:', agentStep);
                              setSelectedAgentForDrawer(agentStep);
                            }}
                            className="w-full py-2 px-3 text-xs font-medium bg-gray-300/30 backdrop-blur-sm hover:bg-gray-400/40 focus:bg-gray-400/40 text-black rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 focus:outline-none border-none hover:border-none focus:border-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            查看完整内容
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            // 如果没有有效输出，显示基于Agent类型的描述性信息
            const getAgentResultDescription = (agentId: string, agentName: string, status: string) => {
              const descriptions = {
                'question_decomposition_agent': '完成问题分析和领域识别，将复杂问题分解为可处理的子问题',
                'intelligent_routing_agent': '完成智能路由决策，确定最优的Agent执行顺序和策略',
                'dag_reconstruction_agent': '完成DAG重构分析，优化执行依赖关系',
                'translation_agent': '完成查询翻译处理，支持多语言知识检索',
                'knowledge_retrieval_agent': '完成知识库检索，获取相关文档和资料',
                'knowledge_graph_agent': '完成知识图谱查询，提取结构化关系信息',
                'summary_answer_agent': '完成答案综合生成，整合所有信息形成最终回答'
              };
              
              return descriptions[agentId] || `${agentName}执行完成`;
            };
            
            return (
              <div>
                <Text strong style={{ color: '#374151', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                  执行概要
                </Text>
                <div style={{
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: '#374151'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: agentData.status === 'completed' ? '#10b981' : '#6b7280'
                    }} />
                    <Text style={{ fontSize: '10px', fontWeight: '600', color: '#059669' }}>
                      {agentData.status === 'completed' ? '执行成功' : '执行中'}
                    </Text>
                  </div>
                  <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                    {getAgentResultDescription(agentData.id, agentData.name, agentData.status)}
                  </Text>
                </div>
              </div>
            );
          })()}
          
          {/* 执行动作描述 */}
          {agentData.action && (
            <div style={{ marginTop: '8px' }}>
              <Text style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>
                执行动作: {agentData.action}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 新的Team消息渲染函数 - 按Agent分组显示
  const renderNewTeamMessage = () => {

    // 🔥 修复最终答案提取 - 只显示summary_answer_agent的内容
    const getFinalAnswer = () => {
      const messageContent = message.content || '';
      
      // 查找总结回答开始的位置（summary_answer_agent的实际内容）
      const summaryPatterns = [
        '基于收集的信息', '根据检索到的信息',
        '综合分析表明', '研究表明', '总结如下'
      ];
      
      for (const pattern of summaryPatterns) {
        const index = messageContent.indexOf(pattern);
        if (index !== -1) {
          return messageContent.substring(index).trim();
        }
      }
      
      // 如果没找到特征模式，检查是否整个内容都是最终答案
      // 通过检查是否包含Agent流程关键词来判断
      const hasAgentProcessKeywords = [
        '问题分析完成', '路由决策', '翻译完成', '检索完成', '图谱查询'
      ].some(keyword => messageContent.includes(keyword));
      
      // 如果包含Agent流程关键词，尝试找最后一个实质性内容
      if (hasAgentProcessKeywords) {
        const lines = messageContent.split('\n');
        const meaningfulLines = lines.filter(line => 
          line.trim().length > 20 && 
          !line.includes('问题分析完成') &&
          !line.includes('路由决策') &&
          !line.includes('翻译完成') &&
          !line.includes('检索完成') &&
          !line.includes('图谱查询')
        );
        
        if (meaningfulLines.length > 0) {
          return meaningfulLines.join('\n').trim();
        }
      }
      
      return messageContent;
    };

    // 获取最终答案
    const finalAnswer = getFinalAnswer();
    
    console.log('🎯 [RENDER_NEW_TEAM] Agent执行数据:', agentExecutionData);
    console.log('🎯 [RENDER_NEW_TEAM] memberCalls数量:', memberCalls.length);
    console.log('🎯 [RENDER_NEW_TEAM] 最终答案:', finalAnswer);

    return (
      <div className="new-team-message">
        {/* Team标识 - 精致紧凑的头部样式 */}
        <div 
          className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-lg px-3 py-2.5 mb-3 border border-orange-100/60 shadow-sm"
          style={{ transition: 'all 0.2s ease' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                <TeamOutlined className="text-white text-sm" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Text strong className="text-gray-800 text-sm">
                    {teamInfo.teamName || 'general_qa_team_v2'}
                  </Text>
                  <Tag color="orange" className="text-xs px-1.5 py-0 rounded border-0 leading-tight">
                    {teamInfo.teamMode || 'coordinate'}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  {message.loading ? (
                    <Tag color="processing" className="text-xs px-1.5 py-0 leading-tight">
                      <LoadingOutlined spin className="mr-1" /> 执行中
                    </Tag>
                  ) : (
                    <Tag color="success" className="text-xs px-1.5 py-0 leading-tight">
                      ✓ 已完成
                    </Tag>
                  )}
                  {agentExecutionData.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {agentExecutionData.filter(a => a.status === 'completed').length}/{agentExecutionData.length} Agent已完成
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧操作按钮 - 现代橙色样式 */}
            <div className="flex items-center gap-2">
              {!useFlowVisualization && agentExecutionData.length > 0 && !detailViewCollapsed && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<UpOutlined />}
                  onClick={() => setDetailViewCollapsed(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border-0 shadow-sm hover:shadow"
                >
                  折叠
                </Button>
              )}
              <Button 
                type="text" 
                size="small" 
                onClick={() => setUseFlowVisualization(!useFlowVisualization)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm hover:shadow-md"
              >
                {useFlowVisualization ? '详细视图' : '流程视图'}
              </Button>
            </div>
          </div>
        </div>


        {/* Agent执行流程可视化 */}
        {useFlowVisualization ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ color: '#374151', fontSize: 14 }}>
                Agent执行流程 ({agentSteps.filter(s => s.status !== 'pending').length}/{agentSteps.length})
              </Text>
            </div>
            <AgentFlowVisualization 
              steps={agentSteps}
              className="mb-4"
            />
          </div>
        ) : (
          /* 按Agent分组显示执行过程 - 详情视图带折叠功能 */
          <>
            {agentExecutionData.length > 0 && (
              <div style={{ marginBottom: 16 }}>
              {detailViewCollapsed ? (
                /* 折叠状态 - 现代简约卡片 */
                <div className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 shadow-sm"
                     onClick={() => setDetailViewCollapsed(false)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">
                          {agentExecutionData.filter(a => a.status === 'completed').length}
                        </span>
                      </div>
                      <div>
                        <Text strong className="text-gray-800 text-base">
                          Agent执行过程已折叠
                        </Text>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                          <span>{agentExecutionData.length} 个Agent</span>
                          <span className="text-green-600 font-medium">{agentExecutionData.filter(a => a.status === 'completed').length} 已完成</span>
                          {agentExecutionData.filter(a => a.status === 'running').length > 0 && (
                            <span className="text-blue-600 font-medium">{agentExecutionData.filter(a => a.status === 'running').length} 执行中</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-600 mr-2 font-medium">点击展开</span>
                      <DownOutlined className="text-gray-500 text-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                /* 展开状态 - 显示所有Agent卡片 */
                agentExecutionData.map(agentData => renderAgentExecution(agentData))
              )}
            </div>
          )}
            
          
          {/* 详情视图专用抽屉 */}
          {selectedAgentForDrawer && createPortal(
            <>
              {/* 背景遮罩 */}
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-[1000]"
                onClick={() => setSelectedAgentForDrawer(null)}
              />
                
              {/* 抽屉内容 */}
              <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-xl z-[1001] overflow-y-auto">
                  {/* 抽屉头部 */}
                  <div className="bg-white border-b border-gray-100 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedAgentForDrawer.displayName}
                        </h2>
                        <div className="text-sm text-gray-500 mt-1">
                          Agent执行详情
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedAgentForDrawer(null)}
                        className="p-2 hover:bg-orange-100 rounded-lg transition-colors ml-4 bg-transparent border-0"
                        style={{ backgroundColor: 'transparent', border: 'none' }}
                      >
                        <XMarkIcon className="w-5 h-5 text-orange-500 hover:text-orange-600" />
                      </button>
                    </div>
                  </div>

                  {/* 抽屉内容 */}
                  <div className="p-6 space-y-5">
                    {/* 知识检索特殊处理 - 显示documents */}
                    {selectedAgentForDrawer.id === 'knowledge_retrieval_agent' && selectedAgentForDrawer.outputData?.documents && (
                      <div className="space-y-4">
                        {/* 执行概要 - 显示摘要信息而非原始content */}
                        <div className="bg-green-50/60 rounded-lg p-4 border border-green-100">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                            检索概要
                          </h3>
                          
                          <div className="bg-white rounded-md p-3 border border-green-100/50">
                            <div className="text-sm text-gray-700 leading-relaxed">
                              {selectedAgentForDrawer.outputData?.search_summary || 
                               selectedAgentForDrawer.outputData?.agent_name ||
                               '完成知识库检索，找到相关文档'}
                            </div>
                            {selectedAgentForDrawer.outputData?.total_count && (
                              <div className="text-xs text-green-600 mt-2">
                                总共找到 {selectedAgentForDrawer.outputData.total_count} 个相关文档
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 文档检索结果 - 使用新的DocumentRetrievalResult组件 */}
                        <DocumentRetrievalResult
                          documents={selectedAgentForDrawer.outputData.documents || []}
                          agentName={selectedAgentForDrawer.displayName || '知识检索'}
                          totalCount={selectedAgentForDrawer.outputData.total_count}
                          searchSummary={selectedAgentForDrawer.outputData.search_summary}
                        />
                      </div>
                    )}
                    
                    {/* 其他Agent的标准执行内容显示 */}
                    {selectedAgentForDrawer.id !== 'knowledge_retrieval_agent' && selectedAgentForDrawer.content && (
                      <div className="bg-green-50/60 rounded-lg p-4 border border-green-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                          执行结果
                        </h3>
                        
                        <div className="bg-white rounded-md p-3 border border-green-100/50">
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {selectedAgentForDrawer.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 决策信息 */}
                    {selectedAgentForDrawer.decisions && selectedAgentForDrawer.decisions.length > 0 && (
                      <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                          <span className="flex items-center">
                            <ChevronRightIcon className="w-4 h-4 text-blue-600 mr-2" />
                            决策信息
                          </span>
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {selectedAgentForDrawer.decisions.length}
                          </span>
                        </h3>
                        
                        <div className="space-y-3">
                          {selectedAgentForDrawer.decisions.map((decision: any, index: number) => (
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
                    
                    {/* 其他输出数据 - 智能解析显示 */}
                    {selectedAgentForDrawer.outputData && Object.keys(selectedAgentForDrawer.outputData).length > 0 && 
                     selectedAgentForDrawer.id !== 'knowledge_retrieval_agent' && (
                      <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <ChevronRightIcon className="w-4 h-4 text-gray-600 mr-2" />
                          输出数据
                        </h3>
                        
                        <div className="space-y-3">
                          {Object.entries(selectedAgentForDrawer.outputData).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-white rounded-md p-3 border border-gray-100/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {typeof value === 'object' && Array.isArray(value) ? `Array(${value.length})` : 
                                   typeof value === 'object' ? 'Object' : typeof value}
                                </span>
                              </div>
                              
                              {/* 智能显示不同类型的数据 */}
                              {typeof value === 'string' ? (
                                <div className="text-sm text-gray-700 leading-relaxed">
                                  {value.length > 300 ? `${value.substring(0, 300)}...` : value}
                                </div>
                              ) : Array.isArray(value) ? (
                                <div className="space-y-2">
                                  {value.slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx} className="text-xs text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                      {typeof item === 'object' ? 
                                        JSON.stringify(item).substring(0, 100) + (JSON.stringify(item).length > 100 ? '...' : '') :
                                        String(item).substring(0, 100)
                                      }
                                    </div>
                                  ))}
                                  {value.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      还有 {value.length - 3} 个项目...
                                    </div>
                                  )}
                                </div>
                              ) : typeof value === 'object' && value !== null ? (
                                <div className="space-y-2">
                                  {Object.entries(value).slice(0, 5).map(([subKey, subValue]: [string, any]) => (
                                    <div key={subKey} className="text-xs">
                                      <span className="text-gray-600 font-medium">{subKey}:</span>
                                      <span className="text-gray-700 ml-2">
                                        {typeof subValue === 'object' ? 
                                          JSON.stringify(subValue).substring(0, 80) + '...' :
                                          String(subValue).substring(0, 80)
                                        }
                                      </span>
                                    </div>
                                  ))}
                                  {Object.keys(value).length > 5 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      还有 {Object.keys(value).length - 5} 个字段...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-700">
                                  {String(value)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>,
            document.body
          )}
          </>
        )}
        
        {/* 如果没有Agent数据但有memberCalls，回退到旧的显示方式 */}
        {agentExecutionData.length === 0 && memberCalls && memberCalls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#374151', fontSize: 14, marginBottom: 12, display: 'block' }}>
              Agent执行状态
            </Text>
            {memberCalls.map((memberCall, index) => {
              const agentNameMapping = {
                'question_decomposition_agent': '问题分析',
                'intelligent_routing_agent': '智能路由', 
                'dag_reconstruction_agent': 'DAG重构',
                'translation_agent': '翻译处理',
                'knowledge_retrieval_agent': '知识检索',
                'knowledge_graph_agent': '知识图谱',
                'summary_answer_agent': '答案总结'
              };
              
              const agentId = memberCall?.memberId || memberCall?.member_id || 'unknown';
              const agentName = memberCall?.memberName || memberCall?.member_name;
              const displayName = agentNameMapping[agentId] || agentName || agentId || 'Unknown Agent';
              
              return (
                <AgentDecisionOnlyRenderer
                  key={`fallback-agent-${index}`}
                  agentId={agentId}
                  agentName={displayName}
                  status={memberCall?.status === 'completed' ? 'completed' : 'pending'}
                  duration={memberCall?.endTime && memberCall?.startTime ? 
                           memberCall.endTime - memberCall.startTime : undefined}
                />
              );
            })}
          </div>
        )}

        {/* 最终答案 - 精致的橙色渐变卡片设计 */}
        {finalAnswer && (
          <div style={{ marginBottom: 16 }}>
            <div 
              className="relative bg-white rounded-lg border border-orange-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-orange-300"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 40%, #fed7aa 100%)',
                boxShadow: '0 2px 4px rgba(249, 115, 22, 0.08)'
              }}
            >
              {/* 标题栏 - 橙色主题 */}
              <div 
                className="px-4 py-3 flex items-center justify-between border-b"
                style={{ 
                  borderBottomColor: 'rgba(249, 115, 22, 0.15)',
                  background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.8) 0%, rgba(254, 215, 170, 0.3) 100%)'
                }}
              >
                <div className="flex items-center gap-3">
                  {/* 状态圆点 - 根据团队完成状态动态显示 */}
                  {(() => {
                    const completedCount = agentExecutionData.filter(a => a.status === 'completed').length;
                    const totalCount = agentExecutionData.length;
                    const isTeamComplete = totalCount > 0 && completedCount === totalCount;
                    
                    return isTeamComplete ? (
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    );
                  })()}
                  <span className="font-medium text-orange-800 text-sm">最终答案</span>
                  {/* 动态状态标签 - 根据团队完成状态 */}
                  {(() => {
                    const completedCount = agentExecutionData.filter(a => a.status === 'completed').length;
                    const totalCount = agentExecutionData.length;
                    const isTeamComplete = totalCount > 0 && completedCount === totalCount;
                    
                    return isTeamComplete ? (
                      <Tag size="small" color="success">已完成</Tag>
                    ) : (
                      <Tag size="small" color="processing" icon={<div className="inline-block w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>}>
                        回答中 ({completedCount}/{totalCount})
                      </Tag>
                    );
                  })()}
                </div>
                
                {/* 右侧装饰 - 只显示完成状态的勾选图标 */}
                <div className="w-4 h-4">
                  {(() => {
                    const completedCount = agentExecutionData.filter(a => a.status === 'completed').length;
                    const totalCount = agentExecutionData.length;
                    const isTeamComplete = totalCount > 0 && completedCount === totalCount;
                    
                    return isTeamComplete ? (
                      <div className="text-green-500">
                        <CheckCircleOutlined />
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
              
              {/* 内容区域 */}
              <div className="p-4">
                <div 
                  className="bg-white rounded-md p-4"
                  style={{
                    border: '1px solid rgba(249, 115, 22, 0.1)',
                    boxShadow: '0 1px 2px rgba(249, 115, 22, 0.05)'
                  }}
                >
                  <AcademicMarkdownRenderer content={finalAnswer} />
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Team决策过程渲染 - 使用原始的TeamDecisionRenderer */}
        {effectiveTeamDecisions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <TeamDecisionRenderer
              teamDecisions={effectiveTeamDecisions}
              viewMode={viewMode}
            />
          </div>
        )}

        {/* 加载状态 - 与最终答案卡片风格一致，仅在没有最终答案时显示 */}
        {message.loading && !finalAnswer && (
          <div 
            className="relative bg-white rounded-lg border border-orange-200 overflow-hidden transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 40%, #fed7aa 100%)',
              boxShadow: '0 2px 4px rgba(249, 115, 22, 0.08)',
              marginBottom: '16px'
            }}
          >
            {/* 标题栏 */}
            <div 
              className="px-4 py-3 flex items-center gap-3 border-b"
              style={{ 
                borderBottomColor: 'rgba(249, 115, 22, 0.15)',
                background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.8) 0%, rgba(254, 215, 170, 0.3) 100%)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="font-medium text-orange-800 text-sm">团队协作执行中</span>
              <Tag size="small" color="processing">
                <LoadingOutlined spin /> 处理中
              </Tag>
            </div>
            
            {/* 加载内容 */}
            <div className="p-6 text-center">
              <LoadingOutlined spin style={{ fontSize: 18, color: '#f97316', marginBottom: 8 }} />
              <div className="text-orange-700 text-sm">正在分析问题并生成答案...</div>
            </div>
            
          </div>
        )}
      </div>
    );
  };

  const renderSimpleTeamMessage = () => (
    <div className="simple-team-message">
      {/* 简化的Team标识 */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamOutlined style={{ color: '#f97316', fontSize: 16 }} />
        <Text strong style={{ color: '#f97316' }}>{teamInfo.teamName}</Text>
        <Tag color="orange" size="small">{teamInfo.teamMode}</Tag>
        {message.loading && (
          <Tag color="processing" size="small">
            <LoadingOutlined spin /> 思考中
          </Tag>
        )}
      </div>
      
      {/* 消息内容 - 只在简化模式下显示 */}
      {message.content && isSimpleQA && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
          border: '1px solid #fed7aa',
          borderRadius: 8,
          padding: 16,
          marginTop: 8
        }}>
          <AcademicMarkdownRenderer content={message.content} />
        </div>
      )}
      
      {/* 加载状态 */}
      {message.loading && !message.content && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
          border: '1px solid #fed7aa',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          color: '#ea580c'
        }}>
          <LoadingOutlined spin style={{ fontSize: 18, marginRight: 8 }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              Team正在分析问题，请稍候...
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {memberCalls.length === 0 ? 
                '简单问题将直接返回答案，复杂问题会显示详细的Agent协作过程' : 
                `正在执行 ${memberCalls.length} 个Agent任务`
              }
            </div>
          </div>
        </div>
      )}
      
      {/* 超时提示 */}
      {message.loading && (currentTime - message.timestamp > 25000) && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 6,
          padding: 8,
          marginTop: 8,
          fontSize: '12px',
          color: '#92400e'
        }}>
          ⏳ 处理时间较长，系统可能正在处理复杂问题...
        </div>
      )}
    </div>
  );

  // 统一使用新的Team消息渲染（重点展示Agent决策和输出）
  return renderNewTeamMessage();
};

export default TeamMessageRenderer;
