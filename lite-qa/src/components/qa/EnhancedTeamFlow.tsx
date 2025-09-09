/**
 * 增强的Team流程视图组件 - 支持开始/结束事件的动态渲染
 */
import React, { useState, useEffect } from 'react';
import { Timeline, Tag, Progress } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';

interface FlowEvent {
  title: string;
  content: string;
  timestamp: number;
  agent: string;
  agentName: string;
  confidence: number;
  status: 'running' | 'completed';
  eventType: 'start' | 'end';
  durationMs?: number;
}

interface EnhancedTeamFlowProps {
  events: FlowEvent[];
  className?: string;
}

const EnhancedTeamFlow: React.FC<EnhancedTeamFlowProps> = ({ 
  events, 
  className = '' 
}) => {
  const [visibleEvents, setVisibleEvents] = useState<FlowEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 按时间排序事件
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  // 动态显示事件
  useEffect(() => {
    if (sortedEvents.length === 0) return;

    const timer = setInterval(() => {
      if (currentIndex < sortedEvents.length) {
        setVisibleEvents(prev => [...prev, sortedEvents[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(timer);
      }
    }, 800); // 每800ms显示一个事件

    return () => clearInterval(timer);
  }, [sortedEvents, currentIndex]);

  // 重置动画（当events变化时）
  useEffect(() => {
    setVisibleEvents([]);
    setCurrentIndex(0);
  }, [events]);

  const getEventIcon = (event: FlowEvent) => {
    if (event.eventType === 'start') {
      return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
    } else {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getEventColor = (event: FlowEvent) => {
    if (event.eventType === 'start') {
      return '#1890ff'; // 蓝色表示开始
    } else {
      return '#52c41a'; // 绿色表示完成
    }
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 10) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  if (sortedEvents.length === 0) {
    return null;
  }

  return (
    <div className={`enhanced-team-flow ${className}`}>
      <div style={{ 
        background: 'linear-gradient(135deg, #f6f9fc 0%, #f0f4f8 100%)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#374151',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ClockCircleOutlined />
          执行流程
        </div>

        <Timeline>
          {visibleEvents.map((event, index) => (
            <Timeline.Item
              key={`${event.agent}-${event.eventType}-${index}`}
              dot={getEventIcon(event)}
              color={getEventColor(event)}
              style={{
                opacity: 0,
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`
              }}
            >
              <div style={{ paddingBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}>
                  <span style={{ 
                    fontWeight: 600, 
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    {event.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {event.durationMs && event.durationMs > 10 && (
                      <Tag size="small" color="orange">
                        {formatDuration(event.durationMs)}
                      </Tag>
                    )}
                    <Tag size="small" color="blue">
                      {Math.round(event.confidence * 100)}%
                    </Tag>
                  </div>
                </div>
                
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  {event.content}
                </div>
                
                {event.eventType === 'start' && (
                  <div style={{ marginTop: '4px' }}>
                    <Progress 
                      percent={100} 
                      size="small" 
                      strokeColor="#1890ff"
                      showInfo={false}
                      style={{ width: '120px' }}
                    />
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
          
          {/* 显示正在加载的事件 */}
          {currentIndex < sortedEvents.length && (
            <Timeline.Item
              dot={<LoadingOutlined />}
              color="gray"
            >
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                正在执行...
              </div>
            </Timeline.Item>
          )}
        </Timeline>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default EnhancedTeamFlow;