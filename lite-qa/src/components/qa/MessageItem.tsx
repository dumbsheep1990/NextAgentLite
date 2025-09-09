/**
 * QA消息项组件 - 展示单条对话消息
 */
import React, { useState, useMemo } from 'react';
import { Avatar, Button, Tooltip, Progress, Typography, Image, Table, Tag, Card, Divider, Space, Collapse } from 'antd';
import { 
  UserOutlined, 
  RobotOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
  CopyOutlined,
  FullscreenOutlined,
  FileTextOutlined,
  EyeOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  DatabaseOutlined,
  BookOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import type { Message, UnifiedThinkingStep, AgnoThinkingStep, TeamMessage } from '../../types';
import { SourceViewer } from './SourceViewer';
import { ThinkingRenderer } from './ThinkingRenderer';
import { WaitingForAnswer } from './WaitingForAnswer';
import TeamMessageRenderer from './TeamMessageRenderer';
import TeamSourcePanel from './TeamSourcePanel';
import { getAgentAvatarConfig, getAgentAvatarStyle, getAgentIcon } from '../../utils/agentConfig';
import { AcademicMarkdownRenderer, SmartMarkdownRenderer } from '../common';
import { formatTime } from '../../utils/timeUtils';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 使用统一的智能体配置

interface MessageItemProps {
  message: Message;
  onImagePreview?: (image: string, title: string, desc: string) => void;
  onMessageAction?: (action: 'like' | 'dislike' | 'regenerate' | 'copy' | 'view_sources', messageId: string) => void;
  className?: string;
  isTeamMode?: boolean; // 新增：标识是否为Team模式
  streaming?: boolean; // 新增：标识是否为流式内容
  useStreamdown?: boolean; // 新增：是否优先使用Streamdown渲染器
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
  message,
  onImagePreview,
  onMessageAction,
  className,
  isTeamMode = false,
  streaming = false,
  useStreamdown = true
}) => {
  const [sourceViewerMode, setSourceViewerMode] = useState<'floating' | 'modal' | 'drawer' | null>(null);
  const [sourcePosition, setSourcePosition] = useState<{ x: number; y: number } | undefined>();
  const [knowledgeSourcesExpanded, setKnowledgeSourcesExpanded] = useState(false);
  const [teamSourceVisible, setTeamSourceVisible] = useState(false);


  
  // 知识库检索结果统计
  const knowledgeStats = useMemo(() => {
    const sources = message.knowledgeSources || [];
    const stats = {
      total: sources.length,
      documents: sources.filter(s => s.source_type === 'document').length,
      qaDataset: sources.filter(s => s.source_type === 'qa_dataset').length,
      averageScore: sources.length > 0 ? sources.reduce((sum, s) => sum + (s.score || 0), 0) / sources.length : 0
    };
    return stats;
  }, [message.knowledgeSources]);

  const handleAction = (action: 'like' | 'dislike' | 'regenerate' | 'copy' | 'view_sources') => {
    onMessageAction?.(action, message.id);
  };

  const handleImageClick = (image: any) => {
    onImagePreview?.(image.url, image.title, image.description);
  };

  const handleSourceView = (event: React.MouseEvent, mode: 'floating' | 'modal' | 'drawer') => {
    if (mode === 'floating') {
      const rect = event.currentTarget.getBoundingClientRect();
      setSourcePosition({
        x: rect.right + 10,
        y: rect.top
      });
    }
    setSourceViewerMode(mode);
  };

  // 使用原始消息数据，不添加硬编码测试数据
  const messageWithSources = message;

  // 渲染消息内容 - 使用智能Markdown渲染器
  const renderMessageContent = () => {
    
    // 如果内容为空，显示占位符
    if (!message.content || message.content.trim() === '') {
      if (message.loading) {
        return (
          <div style={{ 
            color: '#6b7280', 
            fontStyle: 'italic',
            padding: '12px 0'
          }}>
            思考中...
          </div>
        );
      } else {
        return (
          <div style={{ 
            color: '#ef4444', 
            fontStyle: 'italic',
            padding: '12px 0'
          }}>
            回答内容为空
          </div>
        );
      }
    }
    
    // 使用智能Markdown渲染器，根据内容特征和流式状态自动选择最适合的渲染器
    return (
      <SmartMarkdownRenderer
        content={message.content}
        className="message-content-smart"
        streaming={streaming || message.loading}
        preferStreamdown={useStreamdown}
        enableCodeCopy={true}
        enableMath={true}
        enableTables={true}
      />
    );
  };

  // 简化的溯源指示器 - 只显示是否有溯源数据，不显示详细内容
  const renderSourceIndicator = () => {
    const hasKnowledgeSources = message.knowledgeSources && message.knowledgeSources.length > 0;
    const hasSources = message.sources && message.sources.length > 0;
    const hasGraphSources = message.graphSources && message.graphSources.length > 0;
    const isTeamMessage = message.teamInfo?.isTeamMessage;
    const hasTeamInfo = message.teamInfo?.memberCalls && message.teamInfo.memberCalls.length > 0;
    
    if (!hasKnowledgeSources && !hasSources && !hasGraphSources && !hasTeamInfo) {
      return null;
    }

    // Team消息的溯源功能已移至TeamMessageRenderer中实现（使用抽屉样式）
    if (isTeamMessage) {
      return null;
    }

    // 普通消息使用原有的溯源查看器
    return (
      <div style={{ marginTop: 8 }}>
        <Button
          type="text"
          size="small"
          icon={<DatabaseOutlined />}
          onClick={() => {
            // 触发显示溯源抽屉的回调
            if (onMessageAction) {
              onMessageAction('view_sources' as any, message.id);
            }
          }}
          style={{ 
            padding: '4px 8px',
            height: 'auto',
            color: '#1890ff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          {(() => {
            const totalSources = (message.knowledgeSources?.length || 0) + 
                               (message.sources?.length || 0) + 
                               (message.graphSources?.length || 0);
            return totalSources > 0 ? `查看溯源 (${totalSources})` : '查看引用';
          })()}
        </Button>
      </div>
    );
  };

  // 判断是否为Team模式消息 - 优先使用props，然后检查message的teamInfo
  const isTeamModeMessage = isTeamMode || message.teamInfo?.isTeamMessage;

  if (message.type === 'user') {
    // Team模式下的用户气泡配色
    const userBubbleStyles = isTeamModeMessage ? {
      // Team模式：橙色系配色，与回答气泡做区分
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(234, 88, 12, 0.95) 100%)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      color: '#ffffff',
      borderRadius: '20px',
      borderTopRightRadius: '6px',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(249, 115, 22, 0.15), 0 2px 8px rgba(249, 115, 22, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative' as const,
      overflow: 'hidden' as const
    } : {
      // 普通模式：蓝色系配色
      background: 'rgba(59, 130, 246, 0.95)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      color: '#ffffff',
      borderRadius: '20px',
      borderTopRightRadius: '6px',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative' as const,
      overflow: 'hidden' as const
    };

    return (
      <div className="flex justify-end mb-8 px-4">
        <div className="max-w-[75%] group">
          <div style={userBubbleStyles}>
            {/* 内部磨砂光晕效果 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
            }} />
            
            <div style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '15px',
              lineHeight: '1.6',
              fontWeight: '500',
              color: '#ffffff',
              position: 'relative',
              zIndex: 1
            }}>
              {message.content}
            </div>
          </div>
          
          {/* 时间戳持久显示 */}
          <div className="text-xs text-gray-500 text-right mt-3 transition-all duration-200">
            {message.time}
          </div>
        </div>
        
        <div className="ml-4 mt-1 flex-shrink-0">
          {/* Team模式下的用户头像样式 */}
          <div style={isTeamModeMessage ? {
            width: '42px',
            height: '42px',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249, 115, 22, 0.1)',
            border: '1.5px solid rgba(249, 115, 22, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          } : {
            width: '42px',
            height: '42px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)',
            border: '1.5px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <UserOutlined style={{ 
              color: isTeamModeMessage ? '#f97316' : '#3b82f6', 
              fontSize: '18px',
              fontWeight: '600',
              position: 'relative',
              zIndex: 1
            }} />
          </div>
        </div>
      </div>
    );
  }

  // 获取Agent配置 - Team模式下使用专门的配置
  const avatarConfig = isTeamModeMessage ? {
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    iconColor: '#f97316'
  } : getAgentAvatarConfig(message.agentId);

  return (
    <div className="flex group mb-8 px-4">
      <div className="mr-4 mt-1 flex-shrink-0">
        <div style={{
          width: '42px',
          height: '42px',
          background: avatarConfig.bgColor,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isTeamModeMessage 
            ? '0 4px 16px rgba(249, 115, 22, 0.1)' 
            : `0 4px 16px ${avatarConfig.bgColor}`,
          border: `1.5px solid ${avatarConfig.borderColor}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isTeamModeMessage ? (
            <TeamOutlined style={{ 
              color: '#f97316',
              fontSize: '18px',
              fontWeight: '600',
              position: 'relative',
              zIndex: 1
            }} />
          ) : (
            getAgentIcon(message.agentId, { 
              fontWeight: '600',
              position: 'relative',
              zIndex: 1
            })
          )}
        </div>
      </div>
      <div className="max-w-[85%] flex-1">
        {/* Thinking过程显示 - 只在专家模式下显示，Team模式不显示思考组件 */}
        {message.thinking && message.thinking.length > 0 && !message.teamInfo?.isTeamMessage && (
          <div style={{ marginBottom: 12 }}>
            <ThinkingRenderer thinking={message.thinking} />
          </div>
        )}

        {/* 等待回答的过渡动画 - Team消息不显示此状态 */}
        <WaitingForAnswer 
          show={message.loading && (!message.content || message.content.trim() === '') && !message.teamInfo?.isTeamMessage}
          hasSearchResults={message.thinking && Array.isArray(message.thinking) && message.thinking.some(t => t.search_results && t.search_results.length > 0)}
        />

        {/* 消息内容渲染 */}
        {message.teamInfo?.isTeamMessage ? (
          // Team消息使用专门的渲染器
          <TeamMessageRenderer
            message={message as TeamMessage}
            onViewDetails={(memberCall) => {
              // 可以在这里添加查看成员调用详情的逻辑
              console.log('View member call details:', memberCall);
            }}
            onViewMetrics={(executionId) => {
              // 可以在这里添加查看监控指标的逻辑
              console.log('View metrics for execution:', executionId);
            }}
          />
        ) : (
          // 普通消息使用原有的学术风格渲染
          <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-lg border border-gray-200 relative" style={{
            color: '#1f2937',
            fontSize: '15px',
            lineHeight: '1.7',
            fontWeight: '400',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-30 rounded-xl"></div>
            <div className="relative z-10">
              {renderMessageContent()}
            </div>
          </div>
        )}

        {/* 简化的溯源指示器 */}
        {renderSourceIndicator()}

        {/* 图片展示 */}
        {message.images && message.images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-sm font-medium text-gray-700 block mb-3">
              图表资料
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.images.map((image, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <div className="relative">
                    <Image
                      src={image.url}
                      alt={image.title}
                      className="w-full h-48 object-cover cursor-pointer"
                      preview={{
                        mask: (
                          <div className="flex items-center justify-center bg-black bg-opacity-50">
                            <FullscreenOutlined className="text-white text-xl" />
                          </div>
                        )
                      }}
                      onClick={() => handleImageClick(image)}
                    />
                  </div>
                  <div className="p-3">
                    <Text strong className="text-sm text-gray-800 block">
                      {image.title}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1 block">
                      {image.description}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 表格展示 */}
        {message.tables && message.tables.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {message.tables.map((table, index) => (
              <div key={index} className="mb-4">
                <Text className="text-sm font-medium text-gray-700 block mb-2">
                  {table.title}
                </Text>
                <Table
                  dataSource={table.data}
                  columns={table.columns}
                  pagination={false}
                  size="small"
                  className="border border-gray-200"
                  scroll={{ x: 'max-content' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮栏 - 持久显示 */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{
          borderTop: '1px solid rgba(16, 185, 129, 0.08)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.02), transparent)'
        }}>
          <div className="text-xs text-gray-500 font-medium">
            {message.time}
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip title="有帮助">
              <Button 
                type="text" 
                size="small" 
                className={`rounded-full transition-all duration-200 ${
                  message.liked === true 
                    ? 'text-blue-500 bg-blue-50 shadow-sm border border-blue-200' 
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 hover:shadow-sm'
                }`}
                icon={<LikeOutlined style={{ fontSize: '14px' }} />}
                onClick={() => handleAction('like')}
              />
            </Tooltip>
            <Tooltip title="无帮助">
              <Button 
                type="text" 
                size="small" 
                className={`rounded-full transition-all duration-200 ${
                  message.liked === false 
                    ? 'text-red-500 bg-red-50 shadow-sm border border-red-200' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-sm'
                }`}
                icon={<DislikeOutlined style={{ fontSize: '14px' }} />}
                onClick={() => handleAction('dislike')}
              />
            </Tooltip>
            <Tooltip title="重新回答">
              <Button 
                type="text" 
                size="small" 
                className="text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all duration-200 hover:shadow-sm"
                icon={<ReloadOutlined style={{ fontSize: '14px' }} />}
                onClick={() => handleAction('regenerate')}
              />
            </Tooltip>
            <Tooltip title="复制内容">
              <Button 
                type="text" 
                size="small" 
                className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all duration-200 hover:shadow-sm"
                icon={<CopyOutlined style={{ fontSize: '14px' }} />}
                onClick={() => handleAction('copy')}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      
      {/* 添加CSS动画样式 */}
      <style>
        {`
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
          }
          50% {
            opacity: 0.5;
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
        `}
      </style>
      
      {/* 溯源查看器 */}
      {sourceViewerMode && (
        <SourceViewer
          message={messageWithSources}
          onClose={() => setSourceViewerMode(null)}
          viewMode={sourceViewerMode}
          position={sourcePosition}
        />
      )}

      {/* Team专用溯源面板 - 已移动到TeamMessageRenderer中使用抽屉样式 */}
    </div>
  );
};

export const MessageItem = React.memo(MessageItemComponent, (prevProps, nextProps) => {
  // 对于流式更新的消息，更加精确地控制重新渲染
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  
  // 如果消息ID不同，必须重新渲染
  if (prevMsg.id !== nextMsg.id) return false;
  
  // 如果loading状态发生变化，必须重新渲染
  if (prevMsg.loading !== nextMsg.loading) {
    return false;
  }
  
  // 如果内容发生变化，必须重新渲染
  if (prevMsg.content !== nextMsg.content) {
    return false;
  }
  
  // 如果thinking数据发生变化，必须重新渲染
  if (prevMsg.thinking !== nextMsg.thinking) return false;
  
  // 如果sources发生变化，必须重新渲染
  if (prevMsg.sources !== nextMsg.sources) return false;
  
  // 其他情况都相同，可以复用渲染结果
  return true;
}); 