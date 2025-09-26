import React from "react";
import { useId } from "react";
import { Button, Popconfirm } from "antd";
import { PlusOutlined, MessageOutlined, SettingOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AgentTemplate, UserAgent } from '../../services/userAgentService';

interface AgentGradientCardProps {
  agent: AgentTemplate | UserAgent;
  type: 'template' | 'user';
  onCreateFromTemplate?: (template: AgentTemplate) => void;
  onChatWithAgent?: (agent: UserAgent) => void;
  onEditAgent?: (agent: UserAgent) => void;
  onShowDetails?: (agent: AgentTemplate | UserAgent) => void;
  onDeleteAgent?: (agent: UserAgent) => void;
  deletable?: boolean;
  onPublishAgent?: (agent: UserAgent) => void;
}

export function AgentGradientCard({
  agent,
  type,
  onCreateFromTemplate,
  onChatWithAgent,
  onEditAgent,
  onShowDetails,
  onDeleteAgent,
  deletable,
  onPublishAgent
}: AgentGradientCardProps) {
  const isTemplate = type === 'template';
  const template = agent as AgentTemplate;
  const userAgent = agent as UserAgent;

  const normalizeDisplayName = (raw?: string) => {
    if (!raw) return '未命名智能体';
    let s = raw;
    // 先处理更具体的短语，避免被通用替换干扰
    s = s.replaceAll('多语言知识检索专家', '知识库检索智能体');
    s = s.replaceAll('文档问答专家', '知识库问答智能体');
    s = s.replaceAll('文献检索专家', '文献检索智能体');
    s = s.replaceAll('知识解答专家', '知识解答智能体');
    s = s.replaceAll('知识检索专家', '知识库检索智能体');
    s = s.replaceAll('知识图谱专家', '知识图谱智能体');
    s = s.replaceAll('实时翻译专家', '实时翻译智能体');
    s = s.replaceAll('总结回答专家', '总结回答智能体');
    s = s.replaceAll('多模态专家', '多模态智能体');
    s = s.replaceAll('问答专家', '问答智能体');
    // 通用兜底：任何剩余的“专家”统一替换为“智能体”
    s = s.replaceAll('专家', '智能体');
    return s;
  };

  const normText = (v: any, fallback?: string): string => {
    if (v == null) return fallback || '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
      const first = v.find(x => typeof x === 'string') || v[0];
      const s = normText(first);
      if (s) return s;
      try { return JSON.stringify(v); } catch { return fallback || ''; }
    }
    if (typeof v === 'object') {
      const first = (v as any).zh || (v as any).cn || (v as any)['zh-CN'] || (v as any).en;
      if (first) return normText(first, fallback);
      const nameLike = (v as any).name || (v as any).display_name || (v as any).displayName || (v as any).label || (v as any).title || (v as any).text || (v as any).value || (v as any).default;
      if (nameLike) return normText(nameLike, fallback);
      try { return JSON.stringify(v); } catch { /* ignore */ }
    }
    return fallback || '';
  };

  const rawAgentName = (agent as any)?.agent_name;
  const rawTemplateName = (template as any)?.template_name;
  const displayNameSource = normText(rawAgentName ?? rawTemplateName, '未命名智能体');
  const displayName = normalizeDisplayName(displayNameSource);
  if ((import.meta as any).env?.DEV) {
    try {
      // 仅开发环境输出调试日志
      // eslint-disable-next-line no-console
      console.debug('[AgentGradientCard] name-debug', {
        rawAgentName,
        rawTemplateName,
        displayNameSource,
        displayName
      });
      // 分类与描述的原值也记录，辅助定位 [object Object]
      // eslint-disable-next-line no-console
      console.debug('[AgentGradientCard] meta-debug', {
        rawCategory: (template as any)?.category,
        rawDescription: (agent as any)?.description
      });
    } catch {}
  }

  // 基于类别返回像素网格的配色（方块/描边/背景渐变）
  const derivePalette = (categoryRaw?: string) => {
    const name = (categoryRaw || '').toString().toLowerCase();
    // 规则匹配（中文关键字）
    if (name.includes('图谱')) {
      return {
        square: 'rgba(16,185,129,0.28)',
        stroke: 'rgba(16,185,129,0.35)',
        bgFrom: 'rgba(16,185,129,0.08)',
        bgTo: 'rgba(16,185,129,0.02)'
      };
    }
    if (name.includes('检索') || name.includes('知识') || name.includes('文档')) {
      return {
        square: 'rgba(59,130,246,0.28)',
        stroke: 'rgba(59,130,246,0.35)',
        bgFrom: 'rgba(59,130,246,0.08)',
        bgTo: 'rgba(59,130,246,0.02)'
      };
    }
    if (name.includes('问答')) {
      return {
        square: 'rgba(99,102,241,0.28)',
        stroke: 'rgba(99,102,241,0.35)',
        bgFrom: 'rgba(99,102,241,0.08)',
        bgTo: 'rgba(99,102,241,0.02)'
      };
    }
    if (name.includes('多模态')) {
      return {
        square: 'rgba(244,63,94,0.28)',
        stroke: 'rgba(244,63,94,0.35)',
        bgFrom: 'rgba(244,63,94,0.08)',
        bgTo: 'rgba(244,63,94,0.02)'
      };
    }
    if (name.includes('工具') || name.includes('mcp') || name.includes('api')) {
      return {
        square: 'rgba(245,158,11,0.28)',
        stroke: 'rgba(245,158,11,0.35)',
        bgFrom: 'rgba(245,158,11,0.08)',
        bgTo: 'rgba(245,158,11,0.02)'
      };
    }
    if (name.includes('翻译')) {
      return {
        square: 'rgba(8,145,178,0.28)',
        stroke: 'rgba(8,145,178,0.35)',
        bgFrom: 'rgba(8,145,178,0.08)',
        bgTo: 'rgba(8,145,178,0.02)'
      };
    }
    // 默认：slate 灰
    return {
      square: 'rgba(100,116,139,0.28)',
      stroke: 'rgba(100,116,139,0.35)',
      bgFrom: 'rgba(148,163,184,0.10)',
      bgTo: 'rgba(148,163,184,0.02)'
    };
  };

  const categoryLabel = (() => {
    if (isTemplate) return normText((template as any).category, '通用');
    // 用户智能体可能没有类目，尝试读取保存时的来源类目
    return normText((userAgent as any).category || (userAgent as any).source_template_category, '通用');
  })();
  const palette = derivePalette(categoryLabel);

  return (
    <div className="agent-card relative p-6 rounded-3xl overflow-hidden min-h-[280px] flex flex-col transition-shadow duration-200"
         style={{
           background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
           colorScheme: 'light',
           color: '#1f2937',
           border: '1px solid #d5e4f7',
           boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)'
         }}>
      <Grid size={20} squareColor={palette.square} strokeColor={palette.stroke} bgFrom={palette.bgFrom} bgTo={palette.bgTo} />
      
      {/* 标题区域 */}
      <div className="relative z-20 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1f2937' }}>
              {displayName}
            </h3>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                {agent.agent_type === 'team' ? 'Team' : '单体'}
              </span>
              
              {isTemplate && (
                <span className="px-2 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  {normText((template as any).category, '通用')}
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
          {normText((agent as any).description, '暂无描述')}
        </p>
        {type === 'user' && (agent as any).created_at && (
          <div className="text-xs" style={{ color:'#94a3b8', marginTop: -6, marginBottom: 8 }}>
            保存时间：{new Date((agent as any).created_at).toLocaleString()}
          </div>
        )}
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
            <Button
              icon={<PlusOutlined />}
              onClick={() => onPublishAgent?.(userAgent)}
              className="h-8 text-xs"
              size="small"
            >
              发布
            </Button>
            <Popconfirm
              title="确认删除该智能体？"
              description="删除后不可恢复，确定要删除吗？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              disabled={!deletable}
              onConfirm={() => deletable && onDeleteAgent?.(userAgent)}
            >
              <Button
                danger
                disabled={!deletable}
                icon={<DeleteOutlined />}
                className="h-8 text-xs"
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
          </>
        )}
      </div>
    </div>
  );
}

export const Grid = ({
  pattern,
  size,
  squareColor,
  strokeColor,
  bgFrom,
  bgTo,
}: {
  pattern?: number[][];
  size?: number;
  squareColor?: string;
  strokeColor?: string;
  bgFrom?: string;
  bgTo?: string;
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
           style={{ background: `linear-gradient(to right, ${bgFrom || 'rgba(245,245,245,0.20)'}, ${bgTo || 'rgba(229,229,229,0.20)'})` }}>
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full mix-blend-overlay"
          style={{ stroke: strokeColor || 'rgba(209,213,219,0.5)', fill: squareColor || 'rgba(209,213,219,0.5)' }}
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
          {squares.map(([sx, sy]: any, i: number) => (
            <rect
              strokeWidth="0"
              key={`${sx}-${sy}-${i}`}
              width={width + 1}
              height={height + 1}
              x={sx * width}
              y={sy * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
