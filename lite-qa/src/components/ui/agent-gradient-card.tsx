import React from "react";
import { useId } from "react";
import { Button } from "antd";
import { PlusOutlined, MessageOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { AgentTemplate, UserAgent } from '../../services/userAgentService';

interface AgentGradientCardProps {
  agent: AgentTemplate | UserAgent;
  type: 'template' | 'user';
  onCreateFromTemplate?: (template: AgentTemplate) => void;
  onChatWithAgent?: (agent: UserAgent) => void;
  onEditAgent?: (agent: UserAgent) => void;
  onShowDetails?: (agent: AgentTemplate | UserAgent) => void;
}

export function AgentGradientCard({
  agent,
  type,
  onCreateFromTemplate,
  onChatWithAgent,
  onEditAgent,
  onShowDetails
}: AgentGradientCardProps) {
  const isTemplate = type === 'template';
  const template = agent as AgentTemplate;
  const userAgent = agent as UserAgent;

  return (
    <div className="relative p-6 rounded-3xl overflow-hidden min-h-[280px] flex flex-col border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
         style={{
           background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
           colorScheme: 'light',
           color: '#1f2937'
         }}>
      <Grid size={20} />
      
      {/* 标题区域 */}
      <div className="relative z-20 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1f2937' }}>
              {agent.agent_name || (agent as AgentTemplate).template_name || '未命名智能体'}
            </h3>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                {agent.agent_type === 'team' ? 'Team' : '单体'}
              </span>
              
              {isTemplate && (
                <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  {template.category || '通用'}
                </span>
              )}
              
              {isTemplate && template.is_system && (
                <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                  系统
                </span>
              )}
              
              {!isTemplate && (
                <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                  使用 {userAgent.usage_count || 0} 次
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 描述 */}
        <p className="text-sm font-normal relative z-20 mb-4 overflow-hidden text-ellipsis"
           style={{
             display: '-webkit-box',
             WebkitLineClamp: 3,
             WebkitBoxOrient: 'vertical',
             color: '#6b7280'
           }}>
          {agent.description || '暂无描述'}
        </p>
      </div>
      
      {/* 底部按钮区域 */}
      <div className="relative z-20 flex gap-2 mt-auto">
        {isTemplate ? (
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onCreateFromTemplate?.(template)}
              className="flex-1 h-8 text-xs"
              size="small"
            >
              创建
            </Button>
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => onShowDetails?.(agent)}
              className="h-8 text-xs"
              size="small"
            >
              详情
            </Button>
          </>
        ) : (
          <>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => onChatWithAgent?.(userAgent)}
              className="flex-1 h-8 text-xs"
              size="small"
            >
              聊天
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => onEditAgent?.(userAgent)}
              className="h-8 text-xs"
              size="small"
            >
              设置
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  const p = pattern ?? [
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
  ];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] from-neutral-100/20 to-neutral-200/20 opacity-100"
           style={{ background: 'linear-gradient(to right, rgba(245,245,245,0.2), rgba(229,229,229,0.2))' }}>
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full mix-blend-overlay"
          style={{ stroke: 'rgba(209,213,219,0.5)', fill: 'rgba(209,213,219,0.5)' }}
        />
      </div>
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}