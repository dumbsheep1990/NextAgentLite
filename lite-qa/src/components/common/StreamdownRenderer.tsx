/**
 * StreamdownRenderer - 基于Vercel Streamdown设计理念的流式Markdown渲染器
 * 专为AI流式内容设计，支持未完成的markdown块和实时渲染
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { LatexRenderer } from './LatexRenderer';
import './StreamdownRenderer.css';

export interface StreamdownProps {
  children: string;
  className?: string;
  enableCodeCopy?: boolean;
  enableMath?: boolean;
  enableTables?: boolean;
  streaming?: boolean;
}

interface CodeBlockProps {
  language?: string;
  children: string;
  enableCopy?: boolean;
}

interface MarkdownNode {
  type: 'text' | 'heading' | 'paragraph' | 'code' | 'blockquote' | 'list' | 'table' | 'math';
  content: string;
  props?: Record<string, any>;
  children?: MarkdownNode[];
  incomplete?: boolean;
}

/**
 * 代码块组件 - 支持语法高亮和复制功能
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ 
  language = 'text', 
  children, 
  enableCopy = true 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      message.success('代码已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('复制失败');
    }
  };

  return (
    <div className="streamdown-code-block">
      <div className="streamdown-code-header">
        <span className="streamdown-code-language">{language}</span>
        {enableCopy && (
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            className="streamdown-code-copy"
          >
            {copied ? '已复制' : '复制'}
          </Button>
        )}
      </div>
      <pre className="streamdown-code-content">
        <code>{children}</code>
      </pre>
    </div>
  );
};

/**
 * 流式Markdown解析器
 */
class StreamdownParser {
  private buffer: string = '';
  private nodes: MarkdownNode[] = [];
  private inCodeBlock: boolean = false;
  private inMathBlock: boolean = false;
  private codeBlockLanguage: string = '';
  private codeBlockContent: string = '';
  private mathBlockContent: string = '';

  parse(content: string, streaming: boolean = false): MarkdownNode[] {
    this.buffer = content;
    this.nodes = [];
    this.resetState();

    const lines = content.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      i += this.parseLine(line, i, lines, streaming);
    }

    // 处理未完成的块
    if (streaming) {
      if (this.inCodeBlock) {
        this.nodes.push({
          type: 'code',
          content: this.codeBlockContent,
          props: { 
            language: this.codeBlockLanguage,
            incomplete: true
          },
          incomplete: true
        });
      }
      if (this.inMathBlock) {
        this.nodes.push({
          type: 'math',
          content: this.mathBlockContent,
          incomplete: true
        });
      }
    }

    return this.nodes;
  }

  private resetState() {
    this.inCodeBlock = false;
    this.inMathBlock = false;
    this.codeBlockLanguage = '';
    this.codeBlockContent = '';
    this.mathBlockContent = '';
  }

  private parseLine(line: string, index: number, lines: string[], streaming: boolean): number {
    const trimmed = line.trim();

    // 处理代码块
    if (trimmed.startsWith('```')) {
      if (this.inCodeBlock) {
        // 代码块结束
        this.nodes.push({
          type: 'code',
          content: this.codeBlockContent,
          props: { 
            language: this.codeBlockLanguage,
            incomplete: false
          }
        });
        this.inCodeBlock = false;
        this.codeBlockContent = '';
        this.codeBlockLanguage = '';
      } else {
        // 代码块开始
        this.inCodeBlock = true;
        this.codeBlockLanguage = trimmed.slice(3).trim() || 'text';
      }
      return 1;
    }

    // 在代码块内
    if (this.inCodeBlock) {
      this.codeBlockContent += (this.codeBlockContent ? '\n' : '') + line;
      return 1;
    }

    // 处理数学公式块
    if (trimmed.startsWith('$$')) {
      if (this.inMathBlock) {
        // 数学块结束
        this.nodes.push({
          type: 'math',
          content: this.mathBlockContent,
          props: { block: true }
        });
        this.inMathBlock = false;
        this.mathBlockContent = '';
      } else {
        // 数学块开始
        this.inMathBlock = true;
      }
      return 1;
    }

    // 在数学块内
    if (this.inMathBlock) {
      this.mathBlockContent += (this.mathBlockContent ? '\n' : '') + line;
      return 1;
    }

    // 处理标题
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      this.nodes.push({
        type: 'heading',
        content: headingMatch[2],
        props: { level: headingMatch[1].length }
      });
      return 1;
    }

    // 处理引用
    const blockquoteMatch = trimmed.match(/^>\s*(.*)$/);
    if (blockquoteMatch) {
      this.nodes.push({
        type: 'blockquote',
        content: blockquoteMatch[1]
      });
      return 1;
    }

    // 处理列表
    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      this.nodes.push({
        type: 'list',
        content: listMatch[2],
        props: { 
          ordered: /^\d+\./.test(listMatch[1]),
          marker: listMatch[1]
        }
      });
      return 1;
    }

    // 处理表格
    if (trimmed.includes('|') && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(cell => cell.trim());
      this.nodes.push({
        type: 'table',
        content: '',
        props: { cells }
      });
      return 1;
    }

    // 处理行内数学公式
    if (this.hasInlineMath(trimmed)) {
      this.nodes.push({
        type: 'math',
        content: trimmed,
        props: { inline: true }
      });
      return 1;
    }

    // 处理段落
    if (trimmed) {
      this.nodes.push({
        type: 'paragraph',
        content: this.processInlineMarkdown(trimmed)
      });
    }

    return 1;
  }

  private hasInlineMath(text: string): boolean {
    return /\$[^$\n]+\$/.test(text) && !text.startsWith('$$');
  }

  private processInlineMarkdown(text: string): string {
    return text
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  }
}

/**
 * 渲染Markdown节点
 */
const renderNode = (node: MarkdownNode, index: number, enableCodeCopy: boolean, enableMath: boolean): React.ReactNode => {
  const key = `${node.type}-${index}`;

  switch (node.type) {
    case 'heading':
      const HeadingTag = `h${node.props?.level || 1}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key} className={`streamdown-heading streamdown-h${node.props?.level || 1}`}>
          {node.content}
        </HeadingTag>
      );

    case 'paragraph':
      return (
        <p 
          key={key} 
          className="streamdown-paragraph"
          dangerouslySetInnerHTML={{ __html: node.content }}
        />
      );

    case 'code':
      return (
        <CodeBlock
          key={key}
          language={node.props?.language}
          enableCopy={enableCodeCopy}
        >
          {node.content}
        </CodeBlock>
      );

    case 'blockquote':
      return (
        <blockquote key={key} className="streamdown-blockquote">
          {node.content}
        </blockquote>
      );

    case 'list':
      const ListTag = node.props?.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={key} className="streamdown-list">
          <li className="streamdown-list-item">{node.content}</li>
        </ListTag>
      );

    case 'table':
      return (
        <div key={key} className="streamdown-table-wrapper">
          <table className="streamdown-table">
            <tbody>
              <tr>
                {node.props?.cells?.map((cell: string, cellIndex: number) => (
                  <td key={cellIndex} className="streamdown-table-cell">
                    {cell}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );

    case 'math':
      if (!enableMath) {
        return (
          <span key={key} className="streamdown-math-disabled">
            {node.content}
          </span>
        );
      }
      
      if (node.props?.inline) {
        return (
          <span key={key} className="streamdown-math-inline">
            <LatexRenderer content={node.content} inline />
          </span>
        );
      } else {
        return (
          <div key={key} className="streamdown-math-block">
            <LatexRenderer content={node.content} />
          </div>
        );
      }

    default:
      return (
        <span key={key} className="streamdown-text">
          {node.content}
        </span>
      );
  }
};

/**
 * StreamdownRenderer 主组件
 */
export const StreamdownRenderer: React.FC<StreamdownProps> = ({
  children,
  className = '',
  enableCodeCopy = true,
  enableMath = true,
  enableTables = true,
  streaming = false
}) => {
  const parser = useMemo(() => new StreamdownParser(), []);

  const nodes = useMemo(() => {
    if (!children || children.trim() === '') {
      return [];
    }
    return parser.parse(children, streaming);
  }, [children, streaming, parser]);

  const renderedContent = useMemo(() => {
    return nodes.map((node, index) => 
      renderNode(node, index, enableCodeCopy, enableMath)
    );
  }, [nodes, enableCodeCopy, enableMath]);

  return (
    <div className={`streamdown-content ${className}`}>
      {renderedContent}
    </div>
  );
};

export default StreamdownRenderer;