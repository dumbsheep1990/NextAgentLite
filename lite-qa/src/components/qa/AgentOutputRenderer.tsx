/**
 * Agent输出渲染组件 - 为Team模式下每个Agent的输出内容提供统一的橙色背景样式
 */
import React from 'react';
import { Typography, Tag, Avatar } from 'antd';
import { 
  RobotOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { AcademicMarkdownRenderer } from '../common';
import { getAgentAvatarConfig } from '../../utils/agentConfig';

const { Text } = Typography;

interface AgentOutputRendererProps {
  agentId: string;
  agentName: string;
  content: string;
  status?: 'thinking' | 'completed' | 'failed' | 'running';
  startTime?: number;
  endTime?: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

export const AgentOutputRenderer: React.FC<AgentOutputRendererProps> = ({
  agentId,
  agentName,
  content,
  status = 'completed',
  startTime,
  endTime,
  metadata
}) => {
  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'thinking':
        return {
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />,
          text: '思考中...'
        };
      case 'running':
        return {
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: <ClockCircleOutlined style={{ color: '#3b82f6' }} />,
          text: '执行中...'
        };
      case 'completed':
        return {
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
          text: '已完成'
        };
      case 'failed':
        return {
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
          text: '执行失败'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: <RobotOutlined style={{ color: '#6b7280' }} />,
          text: '未知状态'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const agentConfig = getAgentAvatarConfig(agentId);
  
  // 计算执行时间
  const getDuration = () => {
    if (!startTime || !endTime) return null;
    const duration = endTime - startTime;
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(234, 88, 12, 0.95) 50%, rgba(251, 146, 60, 0.85) 100%)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: '16px',
        padding: '16px',
        margin: '8px 0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* 背景装饰效果 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)',
          pointerEvents: 'none'
        }}
      />

      {/* Agent头部信息 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Agent头像 */}
        <Avatar
          size={32}
          style={{
            background: agentConfig.gradient || 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          icon={agentConfig.icon ? React.createElement(agentConfig.icon) : <RobotOutlined />}
        />

        {/* Agent名称和状态 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ 
              color: '#ffffff', 
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              {agentName}
            </Text>
            <Tag
              icon={statusConfig.icon}
              style={{
                background: statusConfig.bgColor,
                border: `1px solid ${statusConfig.color}30`,
                color: statusConfig.color,
                fontSize: '10px',
                fontWeight: '500',
                borderRadius: '12px'
              }}
            >
              {statusConfig.text}
            </Tag>
          </div>
          
          {/* 元数据信息 */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '4px',
            fontSize: '11px'
          }}>
            {getDuration() && (
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                {getDuration()}
              </span>
            )}
            {metadata?.model && (
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                模型: {metadata.model}
              </span>
            )}
            {metadata?.tokens && (
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                令牌: {metadata.tokens.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Agent输出内容 */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '16px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {content ? (
          <div style={{ color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
            <AcademicMarkdownRenderer content={content} />
          </div>
        ) : (
          <div style={{ 
            color: '#9ca3af', 
            fontSize: '13px',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '20px 0'
          }}>
            {status === 'thinking' ? 'Agent正在思考中...' : 
             status === 'running' ? 'Agent正在执行中...' : 
             '暂无输出内容'}
          </div>
        )}
      </div>

      {/* 加载动画 */}
      {(status === 'thinking' || status === 'running') && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'rgba(255, 255, 255, 0.3)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
              animation: 'loading-shimmer 2s infinite'
            }}
          />
        </div>
      )}

      {/* CSS动画 */}
      <style>{`
        @keyframes loading-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default AgentOutputRenderer;