/**
 * Agent仅决策渲染组件 - 为没有实际输出但参与决策的Agent提供轻量级展示
 */
import React from 'react';
import { Typography, Tag, Avatar } from 'antd';
import { 
  RobotOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getAgentAvatarConfig } from '../../utils/agentConfig';

const { Text } = Typography;

interface AgentDecisionOnlyRendererProps {
  agentId: string;
  agentName: string;
  status?: 'completed' | 'skipped';
  duration?: number;
}

export const AgentDecisionOnlyRenderer: React.FC<AgentDecisionOnlyRendererProps> = ({
  agentId,
  agentName,
  status = 'completed',
  duration
}) => {
  const agentConfig = getAgentAvatarConfig(agentId);
  
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
          text: '已完成决策'
        };
      case 'skipped':
        return {
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: <ClockCircleOutlined style={{ color: '#6b7280' }} />,
          text: '已跳过'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: <RobotOutlined style={{ color: '#6b7280' }} />,
          text: '处理中'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
        border: '1px solid rgba(203, 213, 225, 0.4)',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '6px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 左侧状态指示点 */}
      <div
        style={{
          width: '4px',
          height: '36px',
          background: statusConfig.color,
          borderRadius: '2px',
          opacity: 0.6
        }}
      />

      {/* Agent头像 */}
      <Avatar
        size={28}
        style={{
          background: 'rgba(107, 114, 128, 0.1)',
          border: '1px solid rgba(203, 213, 225, 0.6)',
          color: '#6b7280'
        }}
        icon={agentConfig.icon ? React.createElement(agentConfig.icon) : <RobotOutlined />}
      />

      {/* Agent信息 */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <Text strong style={{ 
            color: '#374151', 
            fontSize: '13px'
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
              borderRadius: '8px',
              lineHeight: '18px',
              height: '20px'
            }}
          >
            {statusConfig.text}
          </Tag>
        </div>
        
        {/* 执行时间 */}
        {duration && (
          <div style={{ 
            fontSize: '11px', 
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ClockCircleOutlined style={{ fontSize: '10px' }} />
            {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`}
          </div>
        )}
      </div>

      {/* 右侧装饰 */}
      <div
        style={{
          width: '2px',
          height: '16px',
          background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.3) 0%, transparent 100%)',
          borderRadius: '1px'
        }}
      />
    </div>
  );
};

export default AgentDecisionOnlyRenderer;