/**
 * QA历史对话侧边栏组件
 */
import React, { useState, useEffect, useMemo } from 'react';
import { qaService } from '../../services/qaService';
import { useAuthStore } from '../../stores/authStore';

import { Button, Typography, Tooltip, Empty, Modal, message } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  MessageOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CommentOutlined,
  SettingOutlined,
  TagOutlined,
  ReloadOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  RobotOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  StarOutlined,
  BulbOutlined,
  ApiOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { HistoryConversation } from '../../types';
import { getShortVersionInfo } from '../../config/version';

const { Text, Title } = Typography;

interface HistoryPanelProps {
  conversations: HistoryConversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: (mode?: 'expert' | 'team') => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations?: () => void;
  onSystemSettings?: () => void;
  onRetryLoadHistory?: () => void;
  onLoadMoreConversations?: () => void;
  currentConversationId?: string;
  className?: string;
  loading?: boolean;
  hasMoreConversations?: boolean;
  paginationInfo?: {
    currentPage: number;
    total: number;
    pageSize: number;
  };
  // 新增模式相关props
  currentMode?: 'expert' | 'team';
  onModeChange?: (mode: 'expert' | 'team') => void;
  onLoadConversationsByMode?: (mode: 'expert' | 'team') => void;
  onCollapse?: () => void;
  // 控制是否显示模式切换按钮
  hideModeSwitch?: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllConversations,
  onSystemSettings,
  onRetryLoadHistory,
  onLoadMoreConversations,
  currentConversationId,
  className = '',
  loading = false,
  hasMoreConversations = false,
  paginationInfo,
  // 新增模式相关props
  currentMode = 'expert',
  onModeChange,
  onLoadConversationsByMode,
  onCollapse,
  // 控制是否显示模式切换按钮
  hideModeSwitch = false
}) => {
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('expert'); // 默认选中专家模式
  const [realTimeStats, setRealTimeStats] = useState<{
    expertCount: number;
    teamCount: number;
    totalCount: number;
  } | null>(null);

  // 获取当前用户
  const { user: currentUser } = useAuthStore();

  // 组件初始化时同步状态
  useEffect(() => {
    // 根据当前模式设置activeTabKey，不强制切换到expert模式
    setActiveTabKey(currentMode || 'expert');
    console.log(`[HistoryPanel] 初始化activeTabKey: ${currentMode || 'expert'}`);
  }, []); // 只在组件挂载时执行一次

  // 同步外部模式变化到内部tab状态
  useEffect(() => {
    setActiveTabKey(currentMode || 'expert');
  }, [currentMode]);

  // 获取实时统计信息 - 在对话列表变化时自动更新
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('📡 开始获取实时统计信息...');
        const userId = currentUser?.id;
        console.log('👤 使用用户ID获取统计信息:', userId);
        const stats = await qaService.getConversationStats(userId);
        setRealTimeStats(stats);
        console.log('📊 获取实时统计信息成功:', stats);
      } catch (error) {
        console.error('❌ 获取统计信息失败:', error);
        // API失败时使用本地计算作为兜底
        setRealTimeStats(null);
      }
    };

    // 组件挂载时获取
    fetchStats();
  }, [Array.isArray(conversations) ? conversations.length : 0, currentUser?.id]); // 🔥 修复：当对话数量或用户变化时重新获取统计信息

  // 根据当前tab过滤对话列表
  const filteredConversations = useMemo(() => {
    // 确保conversations是数组
    if (!Array.isArray(conversations)) {
      console.warn('[HistoryPanel] conversations不是数组:', conversations);
      return [];
    }
    
    console.log(`[HistoryPanel] 开始过滤对话: activeTabKey=${activeTabKey}, 总对话数=${conversations.length}`);
    
    const filtered = conversations.filter(conv => {
      const mode = conv.conversation_mode || 'expert';
      const shouldInclude = activeTabKey === 'expert' ? mode === 'expert' : mode === 'team';
      
      if (activeTabKey === 'team') {
        console.log(`[HistoryPanel] 对话 ${conv.id}: mode=${mode}, shouldInclude=${shouldInclude}`);
      }
      
      return shouldInclude;
    });
    
    console.log(`[HistoryPanel] 过滤结果: ${activeTabKey}模式显示${filtered.length}个对话`);
    return filtered;
  }, [conversations, activeTabKey]);

  // 统计不同模式的对话数量 - 修复：统计数据应该是固定的，不随tab切换变化
  const conversationStats = useMemo(() => {
    // 🔥 优先使用API返回的实时统计信息（这是最准确的）
    if (realTimeStats) {
      console.log('📊 使用API实时统计信息:', realTimeStats);
      return {
        expertCount: realTimeStats.expertCount,
        teamCount: realTimeStats.teamCount
      };
    }
    
    // 🔥 API没有数据时，使用本地计算作为兜底
    // 注意：统计数据应该独立计算，不依赖当前激活的tab或分页信息
    
    // 确保conversations是数组
    if (!Array.isArray(conversations)) {
      return { expertCount: 0, teamCount: 0, totalCount: 0 };
    }
    
    const loadedTeamCount = conversations.filter(conv => {
      return conv.conversation_mode === 'team';
    }).length;
    
    const loadedExpertCount = conversations.filter(conv => {
      const mode = conv.conversation_mode || 'expert';
      return mode === 'expert';
    }).length;
    
    // 本地计算作为兜底
    const expertCount = loadedExpertCount;
    const teamCount = loadedTeamCount;
    
    console.log('📊 本地兜底统计逻辑:', { 
      hasRealTimeStats: !!realTimeStats,
      loadedExpertCount, 
      loadedTeamCount,
      finalExpertCount: expertCount, 
      finalTeamCount: teamCount,
      note: 'API无数据时使用本地计算，数据固定不随tab变化'
    });
    
    return { expertCount, teamCount };
  }, [conversations, realTimeStats]); // 依赖conversations和realTimeStats，但不依赖activeTabKey

  // 处理tab切换
  const handleTabChange = (key: string) => {
    console.log('🔄 HistoryPanel handleTabChange called:', { key, currentActiveTabKey: activeTabKey });
    const mode = key as 'expert' | 'team';
    setActiveTabKey(key);
    
    // 通知父组件模式变化
    console.log('🔄 Calling onModeChange with mode:', mode);
    onModeChange?.(mode);
    
    // 加载对应模式的对话
    onLoadConversationsByMode?.(mode);
  };

  // 处理新建对话 - 根据当前tab创建对应模式的对话
  const handleNewConversation = () => {
    const mode = activeTabKey as 'expert' | 'team';
    onNewConversation(mode);
  };
  
  // 渲染模式标签的辅助函数
  const renderModeTag = (conversation: HistoryConversation) => {
    const mode = conversation.conversation_mode || 'expert';
    const isTeamMode = mode === 'team';
    
    return (
      <div 
        className={`
          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
          transition-all duration-200 shadow-sm
          ${isTeamMode 
            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white ring-1 ring-orange-300/40' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ring-1 ring-blue-300/40'
          }
        `}
        style={{
          boxShadow: isTeamMode 
            ? '0 2px 6px -1px rgba(251, 146, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
            : '0 2px 6px -1px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          fontSize: '9px',
          height: '20px',
          minWidth: '45px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {isTeamMode ? (
          <>
            <TeamOutlined className="mr-1" style={{ fontSize: '8px' }} />
            <span style={{ fontWeight: 600, letterSpacing: '0.2px' }}>Team</span>
          </>
        ) : (
          <>
            <UserOutlined className="mr-1" style={{ fontSize: '8px' }} />
            <span style={{ fontWeight: 600, letterSpacing: '0.2px' }}>专家</span>
          </>
        )}
      </div>
    );
  };
  
  // 处理清空所有对话
  const handleClearAllConversations = async () => {
    try {
      if (onClearAllConversations) {
        await onClearAllConversations();
        setClearModalVisible(false);
        message.success('所有对话历史已清空');
      }
    } catch (error) {
      console.error('清空对话历史失败:', error);
      message.error('清空对话历史失败，请重试');
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '刚刚';
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 ${className}`}>
      {/* 头部 */}
      <div className="px-4 py-4 bg-white/90 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2.5">
              <MessageOutlined className="text-gray-600 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                对话历史
              </div>
              <div className="text-xs text-gray-500">
                {conversations.length} 个对话
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            {/* 折叠按钮 */}
            {onCollapse && (
              <Tooltip title="折叠侧边栏">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={onCollapse}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:bg-gray-100"
                />
              </Tooltip>
            )}
            
            {/* 新建对话按钮 - 胶囊形状 */}
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={handleNewConversation}
              className="capsule-new-btn"
              style={{
                height: '30px',
                padding: '0 10px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '500',
                border: '2px solid #d1d5db',
                backgroundColor: '#f9fafb',
                color: '#374151',
                transition: 'all 0.25s ease',
                boxShadow: 'none'
              }}
            >
              新建
            </Button>
            
            {/* 清空对话按钮 - 胶囊形状 */}
            {onClearAllConversations && conversations.length > 0 && (
              <Tooltip title="清空所有对话历史">
                <Button
                  type="default"
                  icon={<ClearOutlined />}
                  onClick={() => setClearModalVisible(true)}
                  className="capsule-clear-btn"
                  style={{
                    height: '30px',
                    padding: '0 10px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: '2px solid #fca5a5',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    transition: 'all 0.25s ease',
                    boxShadow: 'none'
                  }}
                >
                  清空
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* 模式切换按钮 - 重新设计 */}
      {!hideModeSwitch && (
        <div className="px-4 py-2 bg-white/95">
          <div className="flex items-center bg-gray-100/80 rounded-lg p-1 gap-2">
          <button
            onClick={() => handleTabChange('expert')}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ease-out
              text-sm font-medium flex-1 justify-center
              ${activeTabKey === 'expert' 
                ? 'text-white shadow-lg transform scale-105' 
                : 'text-gray-600 hover:text-blue-500 hover:bg-white/60 hover:shadow-md'
              }
            `}
            style={{
              background: activeTabKey === 'expert' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              boxShadow: activeTabKey === 'expert' 
                ? '0 4px 12px rgba(59, 130, 246, 0.35), 0 2px 6px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                : 'none',
              border: activeTabKey === 'expert' 
                ? '1px solid rgba(59, 130, 246, 0.3)' 
                : '1px solid rgba(209, 213, 219, 0.6)'
            }}
          >
            <UserOutlined style={{ fontSize: '12px' }} />
            <span>专家</span>
            {conversationStats.expertCount > 0 && (
              <span 
                className={`
                  inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold
                  rounded-full transition-all duration-300
                  ${activeTabKey === 'expert' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'bg-gray-400 text-white'
                  }
                `}
              >
                {conversationStats.expertCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleTabChange('team')}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ease-out
              text-sm font-medium flex-1 justify-center
              ${activeTabKey === 'team' 
                ? 'text-white shadow-lg transform scale-105' 
                : 'text-gray-600 hover:text-orange-500 hover:bg-white/60 hover:shadow-md'
              }
            `}
            style={{
              background: activeTabKey === 'team' 
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
                : 'transparent',
              boxShadow: activeTabKey === 'team' 
                ? '0 4px 12px rgba(249, 115, 22, 0.35), 0 2px 6px rgba(249, 115, 22, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                : 'none',
              border: activeTabKey === 'team' 
                ? '1px solid rgba(249, 115, 22, 0.3)' 
                : '1px solid rgba(209, 213, 219, 0.6)'
            }}
          >
            <TeamOutlined style={{ fontSize: '12px' }} />
            <span>团队</span>
            {conversationStats.teamCount > 0 && (
              <span 
                className={`
                  inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold
                  rounded-full transition-all duration-300
                  ${activeTabKey === 'team' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'bg-gray-400 text-white'
                  }
                `}
              >
                {conversationStats.teamCount}
              </span>
            )}
          </button>
        </div>
        </div>
      )}

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-hidden relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/2 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl"></div>
        </div>
        
        {filteredConversations.length === 0 ? (
          <div className="mt-8 text-center space-y-4">
            <Empty 
              description={
                activeTabKey === 'expert' 
                  ? "暂无专家模式对话" 
                  : "暂无团队模式对话"
              } 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            {onRetryLoadHistory && (
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={onRetryLoadHistory}
                loading={loading}
                className="border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
              >
                {loading ? '加载中...' : '重新加载历史记录'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 relative px-4 py-2">
            {filteredConversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className={`
                  group relative cursor-pointer transition-all duration-300
                  ${conversation.id === currentConversationId 
                    ? 'transform scale-[1.02]' 
                    : 'hover:transform hover:translate-x-1'
                  }
                `}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {(() => {
                  const isTeamMode = conversation.conversation_mode === 'team';
                  const isActive = conversation.id === currentConversationId;
                  
                  return (
                    <div 
                      className={`
                        group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer
                        hover:scale-[1.02] active:scale-[0.98]
                        ${isActive 
                          ? (isTeamMode 
                              ? 'bg-gradient-to-br from-orange-50/90 via-amber-50/80 to-orange-50/90 shadow-2xl ring-2 ring-orange-300/60 transform scale-[1.03]' 
                              : 'bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-blue-50/90 shadow-2xl ring-2 ring-blue-300/60 transform scale-[1.03]'
                            )
                          : 'bg-white hover:bg-gray-50/50 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                      style={{
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        ...(isActive ? {
                          boxShadow: isTeamMode 
                            ? '0 20px 50px -5px rgba(251, 146, 60, 0.25), 0 8px 32px -4px rgba(251, 146, 60, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.9)'
                            : '0 20px 50px -5px rgba(59, 130, 246, 0.25), 0 8px 32px -4px rgba(59, 130, 246, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.9)',
                          position: 'relative',
                          zIndex: 10
                        } : {
                          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
                        })
                      }}
                    >
                      {/* 问题标题 */}
                      <Tooltip title={conversation.title || (isTeamMode ? '新团队对话' : '新专家对话')} placement="right">
                        <Text 
                          className={`
                            text-sm font-semibold block mb-2.5 pr-8 truncate
                            ${isActive 
                              ? (isTeamMode ? 'text-orange-900' : 'text-blue-900') 
                              : 'text-gray-800'
                            }
                            ${!conversation.title ? 'italic opacity-75' : ''}
                          `}
                          style={{ lineHeight: '1.3' }}
                        >
                          {conversation.title || (isTeamMode ? '新团队对话' : '新专家对话')}
                          {!conversation.title && 
                            <span className={`ml-2 text-xs font-normal ${
                              isActive 
                                ? (isTeamMode ? 'text-orange-600' : 'text-blue-600')
                                : 'text-gray-500'
                            }`}>点击开始对话</span>
                          }
                        </Text>
                      </Tooltip>

                      {/* 模式标签 */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          {renderModeTag(conversation)}
                        </div>
                      </div>

                      {/* 时间和消息数量 */}
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center text-xs transition-colors duration-200 ${
                          isActive 
                            ? (isTeamMode ? 'text-orange-700' : 'text-blue-700') 
                            : 'text-gray-600'
                        }`}>
                          <ClockCircleOutlined 
                            className="mr-1.5" 
                            style={{ 
                              fontSize: '11px',
                              opacity: 0.8
                            }} 
                          />
                          <span style={{ 
                            fontWeight: '500',
                            letterSpacing: '0.2px',
                            fontSize: '11px'
                          }}>
                            {formatTime(conversation.time)}
                          </span>
                        </div>
                        
                        {conversation.messageCount > 0 && (
                          <div className={`flex items-center text-xs transition-colors duration-200 ${
                            isActive 
                              ? (isTeamMode ? 'text-orange-700' : 'text-blue-700') 
                              : 'text-gray-600'
                          }`}>
                            <CommentOutlined 
                              className="mr-1.5" 
                              style={{ 
                                fontSize: '11px',
                                opacity: 0.8
                              }} 
                            />
                            <span style={{ 
                              fontWeight: '500',
                              letterSpacing: '0.2px',
                              fontSize: '11px'
                            }}>
                              {conversation.messageCount} 条消息
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 最后一条消息 */}
                      {conversation.lastMessage ? (
                        <Text className={`text-xs mt-2 block line-clamp-2 ${
                          isActive 
                            ? (isTeamMode ? 'text-orange-600' : 'text-blue-600') 
                            : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage}
                        </Text>
                      ) : (
                        <Text className={`text-xs mt-2 block italic ${
                          isActive 
                            ? (isTeamMode ? 'text-orange-500' : 'text-blue-500') 
                            : 'text-gray-400'
                        }`}>
                          开始一段新的对话吧...
                        </Text>
                      )}
                      
                      {/* 删除按钮 */}
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                          isActive 
                            ? 'text-gray-600 hover:text-red-500 hover:bg-red-50' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            ))}
            
            {/* 加载更多按钮 */}
            {hasMoreConversations && onLoadMoreConversations && 
             filteredConversations.length < (activeTabKey === 'expert' ? conversationStats.expertCount : conversationStats.teamCount) && (
              <div className="mt-4 text-center">
                <Button
                  type="default"
                  onClick={onLoadMoreConversations}
                  loading={loading}
                  className="load-more-btn transition-all duration-300"
                  style={{
                    height: '36px',
                    padding: '0 20px',
                    borderRadius: '18px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    minWidth: '140px'
                  }}
                >
                  {loading ? '加载中...' : `加载更多 (${paginationInfo ? `${paginationInfo.currentPage}/${Math.ceil(
                    (activeTabKey === 'expert' ? conversationStats.expertCount : conversationStats.teamCount) / paginationInfo.pageSize
                  )}` : ''})`}
                </Button>
                
                {paginationInfo && (
                  <div className="mt-2 text-xs text-gray-500">
                    已显示 {filteredConversations.length} / {
                      activeTabKey === 'expert' 
                        ? conversationStats.expertCount 
                        : conversationStats.teamCount
                    } 个对话
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* 清空对话确认Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <ExclamationCircleOutlined className="text-red-500 mr-2" />
            <span>确认清空所有对话历史</span>
          </div>
        }
        open={clearModalVisible}
        onOk={handleClearAllConversations}
        onCancel={() => setClearModalVisible(false)}
        okText="确认清空"
        cancelText="取消"
        okType="danger"
        confirmLoading={loading}
        centered
        width={450}
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationCircleOutlined className="text-red-500 mr-2 mt-0.5" />
              <div>
                <div className="font-medium text-red-800 mb-1">
                  此操作不可撤销
                </div>
                <div className="text-red-700 text-sm">
                  您即将删除所有 {conversations.length} 个对话及其全部消息记录
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-gray-600 mb-4">
            清空后的影响：
          </div>
          
          <ul className="space-y-2 text-sm text-gray-600 ml-4">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>所有对话记录将被永久删除</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>消息内容和对话历史无法恢复</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>将从数据库中彻底清除所有数据</span>
            </li>
          </ul>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            请确认您要继续执行此操作
          </div>
        </div>
      </Modal>

      {/* 自定义滚动条样式 */}
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

        /* 隐藏滚动条样式 */
        .custom-scrollbar-hidden {
          /* WebKit浏览器 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .custom-scrollbar-hidden::-webkit-scrollbar {
          display: none; /* WebKit */
        }

        /* 胶囊按钮hover效果 - 渐变边框 */
        .capsule-new-btn:hover {
          background: linear-gradient(#f9fafb, #f9fafb) padding-box, 
                      linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4) border-box !important;
          border: 2px solid transparent !important;
          color: #1f2937 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
        }
        
        .capsule-new-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15) !important;
        }

        /* 清空按钮hover效果 - 红色渐变边框 */
        .capsule-clear-btn:hover {
          background: linear-gradient(#fef2f2, #fef2f2) padding-box, 
                      linear-gradient(135deg, #ef4444, #dc2626, #b91c1c) border-box !important;
          border: 2px solid transparent !important;
          color: #991b1b !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
        }
        
        .capsule-clear-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.15) !important;
        }

        .settings-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%) !important;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
          transform: translateY(-1px);
        }

        .version-button:hover {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%) !important;
          box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3) !important;
          transform: translateY(-1px);
        }

        /* 静态装饰样式 */
        .bubble-1, .bubble-2, .bubble-3 {
          opacity: 0.15;
        }

        .glow-line {
          opacity: 0.3;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.2) 30%, 
            rgba(99, 102, 241, 0.4) 50%, 
            rgba(107, 114, 128, 0.3) 70%, 
            transparent 100%);
        }

        /* 加载更多按钮样式 */
        .load-more-btn:hover {
          background: linear-gradient(#f9fafb, #f9fafb) padding-box, 
                      linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4) border-box !important;
          border: 2px solid transparent !important;
          color: #374151 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
        }
        
        .load-more-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1) !important;
        }

      `}</style>
    </div>
  );
}; 