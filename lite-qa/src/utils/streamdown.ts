/**
 * Streamdown - 基于 Vercel streamdown 设计理念的流式 Markdown 解析器
 * 专为实时流式内容渲染优化，支持增量解析和渲染
 */

export interface StreamdownNode {
  type: 'text' | 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'table' | 'math' | 'html';
  content?: string;
  level?: number; // for headings
  language?: string; // for code blocks
  children?: StreamdownNode[];
  raw?: string;
  metadata?: Record<string, any>;
}

export interface StreamdownParseResult {
  nodes: StreamdownNode[];
  complete: boolean;
  buffered: string;
  position: number;
}

export interface StreamdownOptions {
  enableMath?: boolean;
  enableTables?: boolean;
  enableCodeHighlight?: boolean;
  maxBufferSize?: number;
  parseTimeout?: number;
}

/**
 * StreamdownParser - 流式 Markdown 解析器类
 */
export class StreamdownParser {
  private buffer = '';
  private nodes: StreamdownNode[] = [];
  private position = 0;
  private options: StreamdownOptions;
  private incompleteNode: StreamdownNode | null = null;
  
  constructor(options: StreamdownOptions = {}) {
    this.options = {
      enableMath: true,
      enableTables: true,
      enableCodeHighlight: true,
      maxBufferSize: 10000,
      parseTimeout: 100,
      ...options
    };
  }

  /**
   * 添加流式内容块
   */
  push(chunk: string): StreamdownParseResult {
    this.buffer += chunk;
    
    // 防止缓冲区过大
    if (this.buffer.length > this.options.maxBufferSize!) {
      this.buffer = this.buffer.slice(-this.options.maxBufferSize! / 2);
      this.position = 0;
    }

    return this.parse();
  }

  /**
   * 标记流式内容结束
   */
  end(): StreamdownParseResult {
    // 处理剩余的缓冲内容
    if (this.buffer.length > this.position) {
      const remaining = this.buffer.slice(this.position);
      if (remaining.trim()) {
        this.nodes.push({
          type: 'paragraph',
          content: remaining.trim()
        });
      }
    }

    return {
      nodes: this.nodes,
      complete: true,
      buffered: '',
      position: this.buffer.length
    };
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.buffer = '';
    this.nodes = [];
    this.position = 0;
    this.incompleteNode = null;
  }

  /**
   * 核心解析逻辑
   */
  private parse(): StreamdownParseResult {
    const lines = this.buffer.split('\n');
    let currentPosition = this.position;
    
    for (let i = 0; i < lines.length - 1; i++) { // 保留最后一行作为缓冲
      const line = lines[i];
      const node = this.parseLine(line, currentPosition);
      
      if (node) {
        // 如果有未完成的节点，尝试合并
        if (this.incompleteNode) {
          const merged = this.tryMergeNodes(this.incompleteNode, node);
          if (merged) {
            this.incompleteNode = merged;
          } else {
            this.nodes.push(this.incompleteNode);
            this.incompleteNode = node;
          }
        } else {
          this.incompleteNode = node;
        }
      }
      
      currentPosition += line.length + 1; // +1 for newline
    }

    // 如果有完整的节点，添加到结果中
    if (this.incompleteNode && this.isNodeComplete(this.incompleteNode)) {
      this.nodes.push(this.incompleteNode);
      this.incompleteNode = null;
    }

    this.position = currentPosition;

    return {
      nodes: this.nodes,
      complete: false,
      buffered: this.buffer.slice(this.position),
      position: this.position
    };
  }

  /**
   * 解析单行内容
   */
  private parseLine(line: string, position: number): StreamdownNode | null {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      return null;
    }

    // 标题解析 (### Title)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      return {
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
        raw: line
      };
    }

    // 代码块解析 (```language)
    const codeBlockMatch = trimmedLine.match(/^```(\w+)?$/);
    if (codeBlockMatch) {
      return {
        type: 'code',
        language: codeBlockMatch[1] || 'text',
        content: '',
        raw: line,
        metadata: { opening: true }
      };
    }

    // 代码块结束 (```)
    if (trimmedLine === '```') {
      return {
        type: 'code',
        content: '',
        raw: line,
        metadata: { closing: true }
      };
    }

    // 引用块解析 (> Quote)
    const blockquoteMatch = trimmedLine.match(/^>\s*(.*)$/);
    if (blockquoteMatch) {
      return {
        type: 'blockquote',
        content: blockquoteMatch[1],
        raw: line
      };
    }

    // 列表解析 (- Item or 1. Item)
    const listMatch = trimmedLine.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      return {
        type: 'list',
        content: listMatch[2],
        raw: line,
        metadata: { 
          ordered: /^\d+\./.test(listMatch[1]),
          marker: listMatch[1]
        }
      };
    }

    // 表格行解析 (| Col1 | Col2 |)
    if (this.options.enableTables && this.isTableRow(trimmedLine)) {
      const cells = this.parseTableRow(trimmedLine);
      return {
        type: 'table',
        content: '',
        raw: line,
        metadata: { cells, isHeader: false }
      };
    }

    // 数学公式解析 ($$formula$$ or $inline$)
    if (this.options.enableMath && this.hasMathContent(trimmedLine)) {
      return {
        type: 'math',
        content: trimmedLine,
        raw: line,
        metadata: { inline: !trimmedLine.startsWith('$$') }
      };
    }

    // 默认作为段落处理
    return {
      type: 'paragraph',
      content: trimmedLine,
      raw: line
    };
  }

  /**
   * 尝试合并两个节点
   */
  private tryMergeNodes(node1: StreamdownNode, node2: StreamdownNode): StreamdownNode | null {
    // 代码块合并
    if (node1.type === 'code' && node2.type === 'code') {
      if (node1.metadata?.opening && !node2.metadata?.closing) {
        return {
          ...node1,
          content: (node1.content || '') + '\n' + (node2.content || node2.raw || ''),
          metadata: { ...node1.metadata, opening: false }
        };
      }
      if (!node1.metadata?.opening && !node2.metadata?.closing && !node2.metadata?.opening) {
        return {
          ...node1,
          content: (node1.content || '') + '\n' + (node2.content || node2.raw || '')
        };
      }
      if (node2.metadata?.closing) {
        return {
          ...node1,
          metadata: { ...node1.metadata, complete: true }
        };
      }
    }

    // 段落合并
    if (node1.type === 'paragraph' && node2.type === 'paragraph') {
      return {
        ...node1,
        content: (node1.content || '') + ' ' + (node2.content || ''),
        raw: (node1.raw || '') + '\n' + (node2.raw || '')
      };
    }

    // 表格行合并
    if (node1.type === 'table' && node2.type === 'table') {
      return {
        ...node1,
        metadata: {
          ...node1.metadata,
          rows: [...(node1.metadata?.rows || [node1.metadata?.cells]), node2.metadata?.cells]
        }
      };
    }

    // 列表项合并
    if (node1.type === 'list' && node2.type === 'list') {
      const node1Ordered = node1.metadata?.ordered;
      const node2Ordered = node2.metadata?.ordered;
      
      if (node1Ordered === node2Ordered) {
        return {
          ...node1,
          children: [...(node1.children || []), node2],
          metadata: { ...node1.metadata, items: (node1.metadata?.items || 1) + 1 }
        };
      }
    }

    return null;
  }

  /**
   * 检查节点是否完整
   */
  private isNodeComplete(node: StreamdownNode): boolean {
    switch (node.type) {
      case 'code':
        return node.metadata?.complete === true;
      case 'heading':
      case 'paragraph':
      case 'blockquote':
      case 'math':
        return true;
      case 'table':
        return node.metadata?.rows?.length > 0;
      case 'list':
        return true;
      default:
        return true;
    }
  }

  /**
   * 检查是否为表格行
   */
  private isTableRow(line: string): boolean {
    return line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|');
  }

  /**
   * 解析表格行
   */
  private parseTableRow(line: string): string[] {
    return line.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, array) => index > 0 && index < array.length - 1); // 移除首尾空元素
  }

  /**
   * 检查是否包含数学公式
   */
  private hasMathContent(line: string): boolean {
    return /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/.test(line);
  }
}

/**
 * 流式内容解析工厂函数
 */
export function createStreamdownParser(options?: StreamdownOptions): StreamdownParser {
  return new StreamdownParser(options);
}

/**
 * 简单的流式解析函数
 */
export function parseStreamdown(content: string, options?: StreamdownOptions): StreamdownNode[] {
  const parser = new StreamdownParser(options);
  parser.push(content);
  const result = parser.end();
  return result.nodes;
}

/**
 * 渐进式内容分块解析
 */
export function parseStreamdownChunks(chunks: string[], options?: StreamdownOptions): StreamdownNode[] {
  const parser = new StreamdownParser(options);
  
  for (const chunk of chunks) {
    parser.push(chunk);
  }
  
  const result = parser.end();
  return result.nodes;
}