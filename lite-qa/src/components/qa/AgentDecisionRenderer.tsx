/**
 * Agent决策过程渲染组件 - 为Team模式下每个Agent的决策过程提供单独的样式渲染
 */
import React from 'react';
import { Typography, Tag, Divider } from 'antd';
import { 
  BulbOutlined, 
  CheckCircleOutlined, 
  ExperimentOutlined,
  DatabaseOutlined,
  SearchOutlined,
  BarChartOutlined 
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface AgentDecisionRendererProps {
  agentId: string;
  agentName: string;
  decision: {
    type: 'thinking' | 'analysis' | 'search' | 'reasoning';
    title: string;
    content: string;
    confidence?: number;
    duration?: number;
    timestamp?: number;
    searchResults?: any[];
  };
}

export const AgentDecisionRenderer: React.FC<AgentDecisionRendererProps> = ({
  agentId,
  agentName,
  decision
}) => {
  // 获取决策类型的配置
  const getDecisionConfig = (type: string) => {
    switch (type) {
      case 'thinking':
        return {
          bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 100%)',
          border: 'rgba(59, 130, 246, 0.25)',
          leftBorder: '#3b82f6',
          textColor: '#1d4ed8',
          icon: <BulbOutlined style={{ color: '#3b82f6', fontSize: '14px' }} />,
          tag: 'THINK'
        };
      case 'analysis':
        return {
          bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(167, 243, 208, 0.12) 100%)',
          border: 'rgba(16, 185, 129, 0.25)',
          leftBorder: '#10b981',
          textColor: '#059669',
          icon: <BarChartOutlined style={{ color: '#10b981', fontSize: '14px' }} />,
          tag: 'ANALYZE'
        };
      case 'search':
        return {
          bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(196, 181, 253, 0.12) 100%)',
          border: 'rgba(139, 92, 246, 0.25)',
          leftBorder: '#8b5cf6',
          textColor: '#7c3aed',
          icon: <SearchOutlined style={{ color: '#8b5cf6', fontSize: '14px' }} />,
          tag: 'SEARCH'
        };
      case 'reasoning':
        return {
          bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(253, 186, 116, 0.12) 100%)',
          border: 'rgba(249, 115, 22, 0.25)',
          leftBorder: '#f97316',
          textColor: '#ea580c',
          icon: <ExperimentOutlined style={{ color: '#f97316', fontSize: '14px' }} />,
          tag: 'REASON'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(156, 163, 175, 0.12) 100%)',
          border: 'rgba(107, 114, 128, 0.25)',
          leftBorder: '#6b7280',
          textColor: '#374151',
          icon: <CheckCircleOutlined style={{ color: '#6b7280', fontSize: '14px' }} />,
          tag: 'PROCESS'
        };
    }
  };

  const config = getDecisionConfig(decision.type);

  return (
    <div
      style={{
        margin: '8px 0',
        padding: '14px 16px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '10px',
        borderLeft: `3px solid ${config.leftBorder}`,
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        position: 'relative' as const
      }}
    >
      {/* Agent标识和决策类型 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '8px'
      }}>
        {config.icon}
        <Text strong style={{ 
          color: config.textColor,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {decision.title}
        </Text>
        
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {/* Agent名称标签 */}
          <Tag
            size="small"
            style={{
              fontSize: '10px',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              color: '#ea580c',
              fontWeight: '500',
              borderRadius: '6px',
              lineHeight: '16px',
              height: '20px'
            }}
          >
            {agentName}
          </Tag>
          
          {/* 决策类型标签 */}
          <Tag
            size="small"
            style={{
              fontSize: '9px',
              background: `${config.leftBorder}12`,
              border: `1px solid ${config.border}`,
              color: config.textColor,
              fontWeight: '600',
              letterSpacing: '0.2px',
              borderRadius: '6px',
              lineHeight: '16px',
              height: '20px'
            }}
          >
            {config.tag}
          </Tag>
          
          {/* 执行时间 */}
          {decision.duration && (
            <Tag size="small" style={{ 
              fontSize: '9px',
              background: 'rgba(107, 114, 128, 0.08)',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              color: '#6b7280',
              borderRadius: '6px',
              lineHeight: '16px',
              height: '20px'
            }}>
              {decision.duration < 1000 ? `${decision.duration}ms` : `${(decision.duration / 1000).toFixed(2)}s`}
            </Tag>
          )}
        </div>
      </div>

      {/* 决策内容 */}
      <div style={{
        fontSize: '13px',
        color: '#374151',
        lineHeight: '1.6',
        marginBottom: decision.confidence || decision.searchResults ? '10px' : '0'
      }}>
        <Paragraph style={{ margin: 0, color: 'inherit', fontSize: 'inherit' }}>
          {decision.content || '暂无决策内容'}
        </Paragraph>
      </div>

      {/* 置信度指标 */}
      {decision.confidence && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: decision.searchResults ? '10px' : '0'
        }}>
          <Text style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>置信度:</Text>
          <div style={{
            width: '70px',
            height: '6px',
            background: 'rgba(107, 114, 128, 0.15)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${decision.confidence * 100}%`,
              height: '100%',
              background: decision.confidence > 0.8 ? '#10b981' : 
                         decision.confidence > 0.6 ? '#f59e0b' : '#ef4444',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <Text style={{ 
            fontSize: '11px', 
            color: config.textColor,
            fontWeight: '700'
          }}>
            {Math.round(decision.confidence * 100)}%
          </Text>
        </div>
      )}

      {/* 搜索结果 */}
      {decision.searchResults && decision.searchResults.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0', borderColor: config.border }} />
          <div>
            <Text style={{ 
              fontSize: '10px', 
              color: config.textColor,
              fontWeight: '600',
              marginBottom: '6px',
              display: 'block'
            }}>
              <DatabaseOutlined style={{ marginRight: '4px' }} />
              检索结果 ({decision.searchResults.length})
            </Text>
            <div style={{ 
              maxHeight: '120px', 
              overflowY: 'auto',
              padding: '4px 0'
            }}>
              {decision.searchResults.slice(0, 3).map((result, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginBottom: '4px',
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '4px',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                  }}
                >
                  {result.title || result.content?.substring(0, 80) + '...'}
                  {result.score && (
                    <span style={{ 
                      marginLeft: '6px', 
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      ({(result.score * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              ))}
              {decision.searchResults.length > 3 && (
                <div style={{ 
                  fontSize: '9px', 
                  color: '#94a3b8', 
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  还有 {decision.searchResults.length - 3} 条结果...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentDecisionRenderer;