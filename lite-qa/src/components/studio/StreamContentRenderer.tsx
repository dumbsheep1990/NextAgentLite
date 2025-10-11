/**
 * 流式内容渲染器
 * 支持三种模式：Markdown、HTML、Mixed（混合）
 */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 自定义sanitize schema，允许sup标签及citation相关属性
const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'sup'],
  attributes: {
    ...defaultSchema.attributes,
    sup: ['className', 'class', 'dataIndex', 'data-index', 'style'],
  },
};

export type OutputMode = 'markdown' | 'html' | 'mixed';

interface StreamContentRendererProps {
  content: string;
  mode: OutputMode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Markdown 渲染器
 */
const MarkdownRenderer: React.FC<{ content: string; className?: string; style?: React.CSSProperties }> = ({
  content,
  className,
  style
}) => {
  return (
    <div className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // 自定义表格样式
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', margin: '12px 0' }}>
                <table style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  border: '1px solid #e2e8f0'
                }}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th style={{
                border: '1px solid #e2e8f0',
                padding: '8px 12px',
                background: '#f8fafc',
                fontWeight: 600,
                textAlign: 'left'
              }}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td style={{
                border: '1px solid #e2e8f0',
                padding: '8px 12px'
              }}>
                {children}
              </td>
            );
          },
          // 自定义列表样式
          ul({ children }) {
            return <ul style={{ paddingLeft: '24px', margin: '8px 0' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ paddingLeft: '24px', margin: '8px 0' }}>{children}</ol>;
          },
          // 自定义链接样式
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                {children}
              </a>
            );
          },
          // 自定义标题样式
          h1({ children }) {
            return <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '16px 0 12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '14px 0 10px' }}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '12px 0 8px' }}>{children}</h3>;
          },
          // 自定义引用样式
          blockquote({ children }) {
            return (
              <blockquote style={{
                borderLeft: '4px solid #3b82f6',
                paddingLeft: '12px',
                margin: '12px 0',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

/**
 * HTML 渲染器（经过清理和安全处理）
 */
const HTMLRenderer: React.FC<{ content: string; className?: string; style?: React.CSSProperties }> = ({
  content,
  className,
  style
}) => {
  // 使用 dangerouslySetInnerHTML 需要先进行 HTML 清理
  // 这里简单处理，生产环境建议使用 DOMPurify
  const sanitizedHTML = useMemo(() => {
    // 基础 HTML 清理：移除危险标签和属性
    let cleaned = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 移除事件处理器
      .replace(/javascript:/gi, '');

    // 检测是否包含 HTML 标签
    const hasHTMLTags = /<[a-z][\s\S]*>/i.test(cleaned);

    // 如果没有 HTML 标签，说明是纯文本，需要转换为基本 HTML
    if (!hasHTMLTags) {
      // 将纯文本转换为段落
      cleaned = cleaned
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }

    return cleaned;
  }, [content]);

  return (
    <div
      className={className}
      style={{
        ...style,
        lineHeight: 1.8,
        wordBreak: 'break-word'
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

/**
 * 混合模式渲染器
 * 智能检测内容格式并选择合适的渲染方式
 */
const MixedRenderer: React.FC<{ content: string; className?: string; style?: React.CSSProperties }> = ({
  content,
  className,
  style
}) => {
  const { mode, processedContent } = useMemo(() => {
    // 检测内容中是否包含大量 HTML 标签
    const htmlTagCount = (content.match(/<[^>]+>/g) || []).length;
    const markdownIndicators = [
      /^#{1,6}\s+/m,      // 标题
      /^\*\s+/m,          // 无序列表
      /^\d+\.\s+/m,       // 有序列表
      /\[.+\]\(.+\)/,     // 链接
      /```[\s\S]*```/,    // 代码块
      /\*\*.*\*\*/,       // 粗体
      /\*.*\*/,           // 斜体
      /^>\s+/m,           // 引用
    ];

    const markdownScore = markdownIndicators.reduce(
      (score, pattern) => score + (pattern.test(content) ? 1 : 0),
      0
    );

    // 决策逻辑
    if (htmlTagCount > 5 && markdownScore < 3) {
      // 大量 HTML 标签且少量 Markdown 特征 → HTML 模式
      return { mode: 'html' as const, processedContent: content };
    } else if (htmlTagCount > 2 && markdownScore > 2) {
      // 混合内容：使用 Markdown 渲染器的 rehypeRaw 支持
      return { mode: 'markdown-with-html' as const, processedContent: content };
    } else {
      // 默认 Markdown 模式
      return { mode: 'markdown' as const, processedContent: content };
    }
  }, [content]);

  if (mode === 'html') {
    return <HTMLRenderer content={processedContent} className={className} style={style} />;
  } else if (mode === 'markdown-with-html') {
    // Markdown 渲染器，启用 HTML 支持
    return (
      <div className={className} style={style}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema]]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  } else {
    return <MarkdownRenderer content={processedContent} className={className} style={style} />;
  }
};

/**
 * 主渲染器组件
 */
const StreamContentRenderer: React.FC<StreamContentRendererProps> = ({
  content,
  mode,
  className,
  style
}) => {
  if (!content) {
    return null;
  }

  switch (mode) {
    case 'markdown':
      return <MarkdownRenderer content={content} className={className} style={style} />;
    case 'html':
      return <HTMLRenderer content={content} className={className} style={style} />;
    case 'mixed':
      return <MixedRenderer content={content} className={className} style={style} />;
    default:
      return <MarkdownRenderer content={content} className={className} style={style} />;
  }
};

// 🔥 使用 React.memo 优化：只有 content 改变时才重新渲染
export default React.memo(StreamContentRenderer);