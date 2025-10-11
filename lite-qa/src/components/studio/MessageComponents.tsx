import React, { useState } from 'react';
import { Button, Avatar, Card, Tag, Space, Typography, Collapse } from 'antd';
import {
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  RedoOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import './MessageComponents.css';
import StreamContentRenderer, { type OutputMode } from './StreamContentRenderer';
import './StreamContentRenderer.css';

const { Text, Paragraph } = Typography;

// 思考状态类型
export type ReasoningStatus = 'thinking' | 'complete';

// 思考气泡组件
interface ReasoningBubbleProps {
  content: string;
  status?: ReasoningStatus;
  timestamp?: number;
  onExpand?: () => void;
  outputMode?: OutputMode;
  showAvatar?: boolean;
}

export const ReasoningBubble: React.FC<ReasoningBubbleProps> = ({
  content,
  status = 'thinking',
  timestamp,
  onExpand,
  outputMode = 'markdown',
  showAvatar = true
}) => {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    : '';

  // 自动滚动到底部
  const textRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (textRef.current && status === 'thinking') {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [content, status]);

  return (
    <div className="reasoning-bubble-container">
      {showAvatar ? (
        <div className="reasoning-bubble-avatar">
          <Avatar
            size={32}
            className="reasoning-avatar"
            icon={status === 'thinking' ? <LoadingOutlined spin /> : <BulbOutlined />}
          />
        </div>
      ) : (
        <div style={{ width: '32px', flexShrink: 0 }}></div>
      )}
      <div className="reasoning-bubble-content">
        <div className={`reasoning-card ${status}`}>
          <div className="reasoning-header">
            <div className="reasoning-title">
              <BulbOutlined className="title-icon" />
              <span>思考过程</span>
              {status === 'thinking' && (
                <span className="thinking-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </span>
              )}
              {status === 'complete' && (
                <CheckCircleOutlined className="complete-icon" />
              )}
            </div>
            {onExpand && (
              <Button
                type="link"
                size="small"
                onClick={onExpand}
                className="expand-btn"
              >
                展开详情
              </Button>
            )}
          </div>
          <div className="reasoning-body">
            <div className="reasoning-text" ref={textRef}>
              {content ? (
                <StreamContentRenderer
                  content={content}
                  mode={outputMode}
                  className="stream-content-renderer"
                />
              ) : '正在思考...'}
            </div>
          </div>
          {timeStr && (
            <div className="reasoning-footer">
              <span className="reasoning-time">{timeStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 回答气泡组件
interface AnswerBubbleProps {
  content: string;
  streaming?: boolean;
  timestamp?: number;
  citations?: any[];
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onRerun?: () => void;
}

export const AnswerBubble: React.FC<AnswerBubbleProps> = ({
  content,
  streaming = false,
  timestamp,
  citations,
  onCopy,
  onLike,
  onDislike,
  onRerun
}) => {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    : '';

  // 从消息内容中分离Action部分和Final Answer部分
  const separateActionAndAnswer = (text: string) => {
    const hasAction = /Action:\s*\w+\s*Action Input:/.test(text);
    if (!hasAction) {
      return { fullContent: text, answerOnly: text };
    }

    // 提取Final Answer部分
    const finalAnswerMatch = text.match(/Final Answer:\s*([\s\S]*?)$/);
    const answerOnly = finalAnswerMatch ? finalAnswerMatch[1].trim() : text;

    return {
      fullContent: text,
      answerOnly: answerOnly
    };
  };

  const { fullContent, answerOnly } = separateActionAndAnswer(content);

  // 清理数字标记，仅保留有效的引用
  const cleanNumericMarkers = (text: string, cites: any[]) => {
    let t = text;
    const maxN = Array.isArray(cites) ? cites.length : 0;
    if (maxN >= 0) {
      t = t.replace(/\[(\d+)\]/g, (m, d) => {
        const n = parseInt(String(d), 10);
        return (n >= 1 && n <= maxN) ? m : '';
      });
    }
    return t;
  };

  // 渲染带内联引用的内容
  const renderContentWithCitations = (text: string, cites: any[]) => {
    if (!cites || cites.length === 0) return <>{text}</>;

    const cleaned = cleanNumericMarkers(text, cites);
    const parts = cleaned.split(/(\[(\d+)\])/g);

    return (
      <>
        {parts.map((seg, idx) => {
          const m = seg.match(/^\[(\d+)\]$/);
          if (m) {
            const n = parseInt(m[1], 10);
            const cit = cites.find((c: any) => Number(c.index) === n);
            if (!cit) return null;

            return (
              <sup
                key={`cite-${idx}`}
                className="inline-citation"
                data-index={n}
                title={cit.title || '引用'}
              >
                [{n}]
              </sup>
            );
          }
          return <span key={`text-${idx}`}>{seg}</span>;
        })}
      </>
    );
  };

  return (
    <div className="answer-bubble-container">
      <div className="answer-bubble-avatar">
        <Avatar size={32} className="answer-avatar">助</Avatar>
      </div>
      <div className="answer-bubble-content">
        {/* Action面板 - 独立于答案气泡 */}
        {fullContent && <ActionPanel content={fullContent} />}

        <div className={`answer-card ${streaming ? 'streaming' : 'complete'}`}>
          <div className="answer-body">
            {streaming && !content && (
              <span className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </span>
            )}
            {answerOnly && (
              <div className="answer-text">
                {citations && citations.length > 0
                  ? renderContentWithCitations(answerOnly, citations)
                  : answerOnly
                }
              </div>
            )}
          </div>
          <div className="answer-footer">
            <span className="answer-time">{timeStr}</span>
            <div className="answer-actions">
              {onCopy && (
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={onCopy}
                  className="action-btn"
                  title="复制"
                />
              )}
              {onLike && (
                <Button
                  type="text"
                  size="small"
                  icon={<LikeOutlined />}
                  onClick={onLike}
                  className="action-btn"
                  title="点赞"
                />
              )}
              {onDislike && (
                <Button
                  type="text"
                  size="small"
                  icon={<DislikeOutlined />}
                  onClick={onDislike}
                  className="action-btn"
                  title="点踩"
                />
              )}
              {onRerun && (
                <Button
                  type="text"
                  size="small"
                  icon={<RedoOutlined />}
                  onClick={onRerun}
                  className="action-btn"
                  title="重新生成"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 溯源按钮组件
interface CitationButtonProps {
  citations: any[];
  expanded?: boolean;
  onToggle?: () => void;
  onCitationClick?: (citation: any) => void;
}

export const CitationButton: React.FC<CitationButtonProps> = ({
  citations,
  expanded = false,
  onToggle,
  onCitationClick
}) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="citation-section">
      <button
        className="citation-toggle-btn"
        onClick={onToggle}
      >
        <span className="citation-label">参考来源</span>
        <span className="citation-count">{citations.length}</span>
        <span className={`citation-arrow ${expanded ? 'expanded' : ''}`}>▼</span>
      </button>

      {expanded && (
        <div className="citation-list">
          {citations.map((citation, index) => {
            const combo = citation?.unscored
              ? undefined
              : (typeof citation?.combined_score === 'number'
                  ? citation.combined_score
                  : (typeof citation?.score === 'number' ? citation.score : undefined));
            const pct = typeof combo === 'number'
              ? Math.round(Math.max(0, Math.min(1, combo)) * 100)
              : undefined;

            return (
              <div
                key={`citation-${index}`}
                className="citation-item"
                onClick={() => onCitationClick?.(citation)}
              >
                <div className="citation-content">
                  <div className="citation-header">
                    <span className="citation-badge">[{citation.index}]</span>
                    <span className="citation-title" title={citation.title}>
                      {citation.title || '未命名文档'}
                    </span>
                  </div>
                  <div className="citation-snippet">
                    {(citation.content || '').slice(0, 120)}
                    {(citation.content || '').length > 120 ? '…' : ''}
                  </div>
                </div>
                {pct !== undefined && (
                  <div className="citation-score-container">
                    <div
                      className="citation-score-bar"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="citation-score-text">{pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 用户消息气泡组件
interface UserBubbleProps {
  content: string;
  timestamp?: number;
  onCopy?: () => void;
}

export const UserBubble: React.FC<UserBubbleProps> = ({
  content,
  timestamp,
  onCopy
}) => {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="user-bubble-container">
      <div className="user-bubble-content">
        <div className="user-card">
          <div className="user-text">{content}</div>
          <div className="user-footer">
            <span className="user-time">{timeStr}</span>
            {onCopy && (
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={onCopy}
                className="action-btn"
                title="复制"
              />
            )}
          </div>
        </div>
      </div>
      <div className="user-bubble-avatar">
        <Avatar size={32} className="user-avatar">我</Avatar>
      </div>
    </div>
  );
};