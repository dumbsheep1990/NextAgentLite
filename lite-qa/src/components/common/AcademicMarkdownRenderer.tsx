import React from 'react';
import { hasLatexFormulas, LatexRenderer } from './LatexRenderer';

interface AcademicMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * 学术风格的Markdown渲染器
 * 支持标题、列表、粗体、斜体、代码、引用、链接等元素
 */
// 学术风格的Markdown渲染函数  
const renderAcademicMarkdown = (text: string): string => {
  if (!text || text.trim() === '') {
    return '';
  }
  
  // 直接处理，不保护LaTeX - 让上层组件决定如何处理LaTeX
  let rendered = text
    // 处理标题 (h1-h6)
    .replace(/^#{6}\s+(.+)$/gm, '<h6 class="academic-h6">$1</h6>')
    .replace(/^#{5}\s+(.+)$/gm, '<h5 class="academic-h5">$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4 class="academic-h4">$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="academic-h3">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="academic-h2">$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="academic-h1">$1</h1>')
    
    // 处理粗体 **text** 或 __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong class="academic-bold">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="academic-bold">$1</strong>')
    
    // 处理斜体 *text* 或 _text_
    .replace(/\*(.*?)\*/g, '<em class="academic-italic">$1</em>')
    .replace(/_(.*?)_/g, '<em class="academic-italic">$1</em>')
    
    // 处理行内代码 `code`
    .replace(/`([^`]+)`/g, '<code class="academic-code">$1</code>')
    
    // 处理代码块 ```code```
    .replace(/```([\s\S]*?)```/g, '<pre class="academic-code-block"><code>$1</code></pre>')
    
    // 处理引用 > text
    .replace(/^>\s+(.+)$/gm, '<blockquote class="academic-quote">$1</blockquote>')
    
    // 处理无序列表 - item 或 * item
    .replace(/^[-*]\s+(.+)$/gm, '<li class="academic-list-item">$1</li>')
    
    // 处理有序列表 1. item
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="academic-ordered-item"><span class="academic-number">$1.</span>$2</li>')
    
    // 处理链接 [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="academic-link" target="_blank">$1</a>')
    
    // 处理分割线 ---
    .replace(/^---$/gm, '<hr class="academic-divider" />');

  // 🔥 新增：处理Markdown表格 - 在换行处理之前
  rendered = parseMarkdownTables(rendered);
  
  // 处理换行 - 更好地保持段落结构
  rendered = rendered
    .replace(/\n\n+/g, '\n<br class="paragraph-break" />\n') // 多个换行变成段落分隔
    .replace(/\n/g, ' '); // 单个换行变成空格
  
  return rendered;
};

// 🔥 增强：解析Markdown表格的函数 - 支持单行和多行表格
const parseMarkdownTables = (text: string): string => {
  
  try {
    // 优化：先简单检查是否包含表格标记，避免不必要的复杂处理
    if (!text.includes('|') || text.length > 50000) {
      return text;
    }
    
    // 🔥 预处理：清理可能导致解析失败的特殊字符
    let processed = text
      .replace(/[\r\n]+/g, '\n')  // 统一换行符
      .replace(/\u00A0/g, ' ')   // 替换不间断空格
      .replace(/\u2000-\u200F/g, ' ')  // 替换各种空白字符
      .replace(/\u2028\u2029/g, '\n'); // 替换行分隔符
    
    // 预处理完成
    
    // 1. 首先尝试解析标准的多行Markdown表格
    // 🔥 修复：改进标准表格检测，正确处理多行内容
    const standardTableRegex = /((?:^|\n)\|[^\n]*\|(?:\n\|[^\n]*\|)+)/gm;
    processed = processed.replace(standardTableRegex, (tableMatch) => {
      const lines = tableMatch.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 2) return tableMatch;
      
      // 🔥 修复：更灵活地查找分隔符行
      let separatorIndex = -1;
      let headerLine = '';
      let dataLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isLikelySeparator = line.includes('---') || line.includes('--') || 
                                 line.includes(':-') || line.includes('-:') ||
                                 /^\s*\|[\s\-:|]*\|\s*$/.test(line);
        
        if (isLikelySeparator && i > 0) {
          separatorIndex = i;
          headerLine = lines[i - 1]; // 分隔符前一行是表头
          dataLines = lines.slice(i + 1); // 分隔符后的都是数据行
          break;
        }
      }
      
      if (separatorIndex === -1 || !headerLine) {
        return tableMatch;
      }
      
      return generateTableHTML(headerLine, dataLines);
    });
    
    // 2. 然后尝试解析密集表格（包括单行和多行但无标准分隔符的表格）
    // 🔥 修复：支持包含换行的复杂表格内容
    const denseTableRegex = /(##?[^|\n]*\s*)?(\|[\s\S]*?\|)(?=\n\s*(?:[^|]|$)|$)/g;
    processed = processed.replace(denseTableRegex, (match, titlePart, tablePart) => {
      // 检查是否包含足够的|分隔符
      const pipeCount = (tablePart.match(/\|/g) || []).length;
      const hasStandardSeparator = tablePart.includes('---') || tablePart.includes(':-');
      
      // 🔥 修复：允许包含换行的表格，只要不是标准表格格式
      if (pipeCount >= 4 && !hasStandardSeparator) {
        const result = parseDenseTable(tablePart);
        if (result) {
          return (titlePart || '') + result;
        }
      }
      
      return match;
    });
    
    // 3. 处理复杂的内容块（包含多行描述和表格数据）
    processed = processed.replace(/(\|[^\n]+\|)\s*([\s\S]*?)(?=\n\s*\n|$)/g, (match, tableLine, content) => {
      console.log('📊 检测到复杂内容块:', tableLine.slice(0, 50));
      
      // 如果表格行后面的内容包含大量文本，尝试解析为表格+补充信息
      if (content && content.trim().length > 50) {
        const tableResult = parseDenseTable(tableLine);
        if (tableResult) {
          // 将补充内容作为表格下方的说明
          const additionalInfo = `<div class="table-additional-info">${content.trim()}</div>`;
          return tableResult + additionalInfo;
        }
      }
      
      return match;
    });
    
    return processed;
  } catch (error) {
    console.error('表格解析出错:', error);
    return text;
  }
};

// 🔥 增强：解析密集表格（如材料属性表格）
const parseDenseTable = (tableText: string): string | null => {
  try {
    
    // 🔥 修复：预处理表格文本，统一格式并清理空白
    let cleanText = tableText
      .replace(/[\r\n]+/g, ' ')  // 将换行转换为空格
      .replace(/\s+/g, ' ')      // 合并多个空格
      .trim();
    
    // 按 | 分割所有部分
    const allParts = cleanText.split('|');
    const parts = allParts.map(part => part.trim()).filter((part, index) => {
      // 过滤掉开头和结尾的空字符串（由于|开头和结尾导致的）
      return !(part === '' && (index === 0 || index === allParts.length - 1));
    });
    
    if (parts.length < 4) {
      return null;
    }
    
    // 🔥 增强：多种智能检测表格结构的方法
    
    // 方法1：检测键值对格式 (属性名: 值 或 属性名：值)
    const propertyPattern = /[\u4e00-\u9fa5a-zA-Z]+\s*[:：]\s*$/;
    const keyValuePairs = [];
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (propertyPattern.test(part)) {
        const key = part.replace(/[:：]\s*$/, '').trim();
        const value = parts[i + 1].trim();
        if (key && value) {
          keyValuePairs.push({ key, value });
          i++; // 跳过值的部分
        }
      }
    }
    
    if (keyValuePairs.length >= 2) {
      return generateKeyValueTable(keyValuePairs);
    }
    
    // 方法2：检测分隔符结构（表头 | 数据 | 表头 | 数据）
    const separatorResult = parseSeparatorStructure(parts);
    if (separatorResult) {
      return separatorResult;
    }
    
    // 方法3：尝试按固定列数解析（优先2列，然后3列、4列）
    for (const cols of [2, 3, 4, 5]) {
      if (parts.length >= cols * 2) {
        // 🔥 修复：不强制要求完全整除，允许最后一行不完整
        const fullRows = Math.floor(parts.length / cols);
        if (fullRows >= 2) {
          const rows = [];
          for (let i = 0; i < fullRows * cols; i += cols) {
            rows.push(parts.slice(i, i + cols));
          }
          
          // 检查是否有合理的表头
          const firstRow = rows[0];
          const hasReasonableHeaders = firstRow.every(cell => 
            cell.length > 0 && cell.length < 50 && /[\u4e00-\u9fa5a-zA-Z]/.test(cell)
          );
          
          if (hasReasonableHeaders) {
            return generateTableFromRows(rows);
          }
        }
      }
    }
    
    // 方法4：智能分组 - 将相似长度的连续元素分组
    const groups = smartGroupParts(parts);
    if (groups.length >= 2) {
      return generateTableFromRows(groups);
    }
    
    return null;
    
  } catch (error) {
    console.error('密集表格解析出错:', error);
    return null;
  }
};

// 生成键值对表格
const generateKeyValueTable = (pairs: Array<{key: string, value: string}>): string => {
  
  let tableHtml = '<div class="academic-table-container"><table class="academic-table academic-kv-table">\n';
  
  // 使用两列布局：属性名 | 属性值
  tableHtml += '<thead class="academic-table-header">\n<tr>';
  tableHtml += '<th class="academic-table-th">属性</th>';
  tableHtml += '<th class="academic-table-th">值</th>';
  tableHtml += '</tr>\n</thead>\n';
  
  tableHtml += '<tbody class="academic-table-body">\n';
  pairs.forEach(pair => {
    tableHtml += '<tr class="academic-table-row">';
    tableHtml += `<td class="academic-table-td academic-table-key">${pair.key}</td>`;
    tableHtml += `<td class="academic-table-td academic-table-value">${pair.value}</td>`;
    tableHtml += '</tr>\n';
  });
  tableHtml += '</tbody>\n</table></div>';
  
  return tableHtml;
};

// 从行数组生成表格
const generateTableFromRows = (rows: string[][]): string => {
  
  if (rows.length === 0) return '';
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  let tableHtml = '<div class="academic-table-container"><table class="academic-table">\n';
  
  // 表头
  tableHtml += '<thead class="academic-table-header">\n<tr>';
  headers.forEach(header => {
    tableHtml += `<th class="academic-table-th">${header}</th>`;
  });
  tableHtml += '</tr>\n</thead>\n';
  
  // 表体
  tableHtml += '<tbody class="academic-table-body">\n';
  dataRows.forEach(row => {
    tableHtml += '<tr class="academic-table-row">';
    row.forEach((cell, index) => {
      if (index < headers.length) {
        tableHtml += `<td class="academic-table-td">${cell}</td>`;
      }
    });
    tableHtml += '</tr>\n';
  });
  tableHtml += '</tbody>\n</table></div>';
  
  return tableHtml;
};

// 🔥 新增：解析分隔符结构（如：说明 | 数据 ...）
const parseSeparatorStructure = (parts: string[]): string | null => {
  
  // 查找可能的表头（通常较短且不包含大量数字）
  const potentialHeaders = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.length > 0 && part.length < 20 && /[\u4e00-\u9fa5a-zA-Z]/.test(part)) {
      potentialHeaders.push({ index: i, text: part });
    }
  }
  
  // 潜在表头数量: potentialHeaders.length
  
  // 如果找到足够的表头，尝试重建表格
  if (potentialHeaders.length >= 2 && potentialHeaders.length <= 6) {
    const headerTexts = potentialHeaders.map(h => h.text);
    const dataRows = [];
    
    // 根据表头位置推断数据结构
    const headerIndices = potentialHeaders.map(h => h.index);
    
    // 简单情况：如果表头是连续的，数据也可能是连续的
    if (headerIndices.length === 2 && headerIndices[1] - headerIndices[0] === 1) {
      // 两列表格：表头1 | 表头2 | 数据1 | 数据2 | ...
      const remainingParts = parts.slice(2);
      for (let i = 0; i < remainingParts.length; i += 2) {
        if (i + 1 < remainingParts.length) {
          dataRows.push([remainingParts[i], remainingParts[i + 1]]);
        }
      }
    } else {
      // 复杂情况：尝试按表头数量分组剩余数据
      const dataStart = Math.max(...headerIndices) + 1;
      const remainingParts = parts.slice(dataStart);
      const cols = headerTexts.length;
      
      for (let i = 0; i < remainingParts.length; i += cols) {
        const row = remainingParts.slice(i, i + cols);
        if (row.length === cols) {
          dataRows.push(row);
        }
      }
    }
    
    if (dataRows.length > 0) {
      return generateTableFromHeaderAndData(headerTexts, dataRows);
    }
  }
  
  return null;
};

// 从表头和数据行生成表格
const generateTableFromHeaderAndData = (headers: string[], dataRows: string[][]): string => {
  
  let tableHtml = '<div class="academic-table-container"><table class="academic-table">\n';
  
  // 表头
  tableHtml += '<thead class="academic-table-header">\n<tr>';
  headers.forEach(header => {
    tableHtml += `<th class="academic-table-th">${header}</th>`;
  });
  tableHtml += '</tr>\n</thead>\n';
  
  // 表体
  tableHtml += '<tbody class="academic-table-body">\n';
  dataRows.forEach(row => {
    tableHtml += '<tr class="academic-table-row">';
    row.forEach((cell, index) => {
      if (index < headers.length) {
        tableHtml += `<td class="academic-table-td">${cell}</td>`;
      }
    });
    tableHtml += '</tr>\n';
  });
  tableHtml += '</tbody>\n</table></div>';
  
  return tableHtml;
};

// 智能分组算法
const smartGroupParts = (parts: string[]): string[][] => {
  if (parts.length < 4) return [];
  
  // 🔥 增强：根据内容特征智能分组
  
  // 计算每个部分的特征
  const features = parts.map(part => ({
    text: part,
    length: part.length,
    hasNumbers: /\d/.test(part),
    hasChinese: /[\u4e00-\u9fa5]/.test(part),
    hasColon: /[:：]/.test(part)
  }));
  
  // 尝试找到重复的模式
  for (let groupSize = 2; groupSize <= 6; groupSize++) {
    if (parts.length >= groupSize * 2) {
      const groups = [];
      const maxGroups = Math.floor(parts.length / groupSize);
      
      for (let i = 0; i < maxGroups; i++) {
        const group = parts.slice(i * groupSize, (i + 1) * groupSize);
        groups.push(group);
      }
      
      // 验证分组是否合理：第一组可能是表头
      const firstGroup = groups[0];
      const hasValidHeaders = firstGroup.every(cell => 
        cell.length > 0 && cell.length < 30 && /[\u4e00-\u9fa5a-zA-Z]/.test(cell)
      );
      
      if (hasValidHeaders && groups.length >= 2) {
        return groups;
      }
    }
  }
  
  return [];
};

// 🔥 提取：生成表格HTML的公共函数
const generateTableHTML = (headerLine: string, dataLines: string[]): string => {
  // 解析表头
  const headers = headerLine.split('|')
    .map(cell => cell.trim())
    .filter(cell => cell !== '');
  
  // 解析数据行
  const rows = dataLines.map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '')
  ).filter(row => row.length > 0);
  
  // 生成HTML表格
  let tableHtml = '<div class="academic-table-container"><table class="academic-table">\n';
  
  // 表头
  tableHtml += '<thead class="academic-table-header">\n<tr>';
  headers.forEach(header => {
    tableHtml += `<th class="academic-table-th">${header}</th>`;
  });
  tableHtml += '</tr>\n</thead>\n';
  
  // 表体
  tableHtml += '<tbody class="academic-table-body">\n';
  rows.forEach(row => {
    tableHtml += '<tr class="academic-table-row">';
    row.forEach((cell, index) => {
      if (index < headers.length) { // 确保不超过表头列数
        tableHtml += `<td class="academic-table-td">${cell}</td>`;
      }
    });
    tableHtml += '</tr>\n';
  });
  tableHtml += '</tbody>\n</table></div>';
  
  return tableHtml;
};

export const AcademicMarkdownRenderer: React.FC<AcademicMarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  // 基本性能优化：对于超长内容使用简化渲染
  if (content && content.length > 50000) {
    console.warn('⚠️ AcademicMarkdownRenderer: 内容过长，使用简化渲染');
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {content.slice(0, 10000)}...
        <div style={{ color: '#666', fontStyle: 'italic', marginTop: '8px' }}>
          内容过长，已截断显示
        </div>
      </div>
    );
  }
  // 识别并特殊处理thinking和tool调用内容
  const processSpecialContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let keyIndex = 0;

    // 匹配thinking标签
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
    // 匹配tool调用标签 (暂未使用)
    // const toolCallRegex = /<function_calls>([\s\S]*?)<\/antml:function_calls>/gi;
    // const toolResultRegex = /<function_results>([\s\S]*?)<\/function_results>/gi;

    // 收集所有特殊内容的位置
    const specialMatches: Array<{start: number, end: number, type: string, content: string}> = [];
    
    let match;
    
    // 查找thinking内容
    while ((match = thinkingRegex.exec(text)) !== null) {
      specialMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'thinking',
        content: match[1]
      });
    }
    
    // 查找tool调用内容
    const toolCallRegexReset = /<function_calls>([\s\S]*?)<\/antml:function_calls>/gi;
    while ((match = toolCallRegexReset.exec(text)) !== null) {
      specialMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'tool_call',
        content: match[1]
      });
    }
    
    // 查找tool结果内容
    const toolResultRegexReset = /<function_results>([\s\S]*?)<\/function_results>/gi;
    while ((match = toolResultRegexReset.exec(text)) !== null) {
      specialMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'tool_result',
        content: match[1]
      });
    }

    // 按位置排序
    specialMatches.sort((a, b) => a.start - b.start);

    // 构建结果
    specialMatches.forEach((specialMatch) => {
      // 添加之前的普通内容（应用Markdown渲染和LaTeX渲染）
      if (currentIndex < specialMatch.start) {
        const beforeText = text.slice(currentIndex, specialMatch.start);
        if (beforeText.trim()) {
          console.log('🔧 processSpecialContent 处理文本段:', beforeText.slice(0, 50));
          // 检查是否包含LaTeX公式
          if (hasLatexFormulas(beforeText)) {
            console.log('🧮 processSpecialContent 检测到LaTeX，使用LatexRenderer');
            parts.push(
              <div key={`latex-${keyIndex++}`} style={{ color: '#374151' }}>
                <LatexRenderer content={beforeText} />
              </div>
            );
          } else {
            console.log('📝 processSpecialContent 使用Markdown渲染');
            // 对普通文本应用学术风格Markdown渲染
            const renderedText = renderAcademicMarkdown(beforeText);
            parts.push(
              <div 
                key={`text-${keyIndex++}`} 
                style={{ color: '#374151' }}
                dangerouslySetInnerHTML={{ __html: renderedText }}
              />
            );
          }
        }
      }

      // 只添加tool相关的特殊内容，跳过thinking（前端已有专门的ThinkingRenderer处理）
      if (specialMatch.type !== 'thinking') {
        parts.push(renderSpecialContent(specialMatch.type, specialMatch.content, keyIndex++));
      }
      
      currentIndex = specialMatch.end;
    });

    // 添加剩余的普通内容（应用Markdown渲染和LaTeX渲染）
    if (currentIndex < text.length) {
      const afterText = text.slice(currentIndex);
      if (afterText.trim()) {
        console.log('🔧 processSpecialContent 处理剩余文本:', afterText.slice(0, 50));
        // 检查是否包含LaTeX公式
        if (hasLatexFormulas(afterText)) {
          console.log('🧮 processSpecialContent 剩余文本检测到LaTeX');
          parts.push(
            <div key={`latex-final-${keyIndex++}`} style={{ color: '#374151' }}>
              <LatexRenderer content={afterText} />
            </div>
          );
        } else {
          console.log('📝 processSpecialContent 剩余文本使用Markdown渲染');
          // 对剩余文本应用学术风格Markdown渲染
          const renderedText = renderAcademicMarkdown(afterText);
          parts.push(
            <div 
              key={`text-final-${keyIndex++}`} 
              style={{ color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: renderedText }}
            />
          );
        }
      }
    }

    return parts.length > 0 ? parts : [
      // 处理纯文本情况，也要检查LaTeX
      hasLatexFormulas(text) ? (
        <div key="latex-only" style={{ color: '#374151' }}>
          <LatexRenderer content={text} />
        </div>
      ) : (
        <div 
          key="text-only" 
          style={{ color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: renderAcademicMarkdown(text) }}
        />
      )
    ];
  };

  // 渲染特殊内容的函数
  const renderSpecialContent = (type: string, content: string, key: number): React.ReactNode => {
    switch (type) {
      case 'thinking':
        return (
          <div
            key={`thinking-${key}`}
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              border: '1px solid #90caf9',
              borderRadius: '12px',
              padding: '16px',
              margin: '12px 0',
              fontStyle: 'italic',
              color: '#1565c0',
              fontSize: '14px',
              lineHeight: '1.5',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#0d47a1'
            }}>
              🤔 AI思考过程
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {hasLatexFormulas(content.trim()) ? (
                <LatexRenderer content={content.trim()} />
              ) : (
                content.trim()
              )}
            </div>
          </div>
        );
      
      case 'tool_call':
        return (
          <div
            key={`tool-call-${key}`}
            style={{
              background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
              border: '1px solid #ce93d8',
              borderRadius: '8px',
              padding: '12px',
              margin: '8px 0',
              fontSize: '13px',
              color: '#6a1b9a',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#4a148c'
            }}>
              🔧 工具调用
            </div>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {content.trim()}
            </pre>
          </div>
        );
      
      case 'tool_result':
        return (
          <div
            key={`tool-result-${key}`}
            style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: '1px solid #a5d6a7',
              borderRadius: '8px',
              padding: '12px',
              margin: '8px 0',
              fontSize: '13px',
              color: '#2e7d32',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#1b5e20'
            }}>
              📊 工具结果
            </div>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {content.trim()}
            </pre>
          </div>
        );
      
      default:
        return null;
    }
  };

  // 检查是否包含特殊内容（tool调用等，thinking由专门的ThinkingRenderer处理）
  const hasSpecialContent = (text: string): boolean => {
    const hasThinking = /<thinking>[\s\S]*?<\/thinking>/gi.test(text);
    const hasFunctionCalls = /<function_calls>[\s\S]*?<\/antml:function_calls>/gi.test(text);
    const hasFunctionResults = /<function_results>[\s\S]*?<\/function_results>/gi.test(text);
    
    // 调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AcademicMarkdownRenderer 内容检测:', {
        contentLength: text.length,
        hasThinking,
        hasFunctionCalls,
        hasFunctionResults,
        preview: text.slice(0, 100) + (text.length > 100 ? '...' : '')
      });
    }
    
    // 只有tool调用才算特殊内容，thinking由专门组件处理
    return hasFunctionCalls || hasFunctionResults;
  };

  // 如果包含特殊内容，使用特殊处理
  if (hasSpecialContent(content)) {
    const processedParts = processSpecialContent(content);
    console.log('🚀 使用特殊内容处理，生成组件数:', processedParts.length);
    return (
      <div 
        className={`academic-markdown-content ${className}`}
        style={{
          color: '#374151',
          fontSize: '14px',
          lineHeight: '1.4',
          fontFamily: 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif'
        }}
      >
        {processedParts}
      </div>
    );
  }


  // 如果包含LaTeX公式，使用LaTeX渲染器
  if (hasLatexFormulas(content)) {
    console.log('✅ AcademicMarkdownRenderer 检测到LaTeX，使用LatexRenderer');
    return (
      <div className={`academic-markdown-content ${className}`}>
        <LatexRenderer content={content} />
      </div>
    );
  }



  // 后处理：包装列表项
  const postProcessLists = (html: string): string => {
    // 包装连续的无序列表项
    html = html.replace(
      /(<li class="academic-list-item">.*?<\/li>(?:\s*<br\s*\/?>)*)+/g,
      '<ul class="academic-list">$&</ul>'
    );
    
    // 包装连续的有序列表项
    html = html.replace(
      /(<li class="academic-ordered-item">.*?<\/li>(?:\s*<br\s*\/?>)*)+/g,
      '<ol class="academic-ordered-list">$&</ol>'
    );
    
    // 清理列表中多余的换行
    html = html.replace(/(<\/li>)\s*<br\s*\/?>/g, '$1');
    
    return html;
  };

  // 清理thinking标签（已由专门组件处理）
  const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  
  // 检查清理后的内容是否为空
  if (!cleanContent) {
    return (
      <div className={`academic-markdown-content ${className}`}>
        <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          内容为空
        </div>
      </div>
    );
  }
  
  const renderedHtml = postProcessLists(renderAcademicMarkdown(cleanContent));

  return (
    <div 
      className={`academic-markdown-content ${className}`}
      style={{
        color: '#374151',
        fontSize: '14px',
        lineHeight: '1.4',
        fontFamily: 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif'
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

// 样式组件 - 使用内联样式避免CSS冲突
const styles = `
  .academic-markdown-content {
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
    line-height: 1.4;
  }
  
  .academic-markdown-content * {
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
  }
  
  .academic-h1 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 8px 0 6px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid #e5e7eb;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
  }
  
  .academic-h2 {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 6px 0 4px 0;
    padding-left: 8px;
    border-left: 3px solid #3b82f6;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
  }
  
  .academic-h3 {
    font-size: 15px;
    font-weight: 600;
    color: #4b5563;
    margin: 4px 0 2px 0;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
  }
  
  .academic-h4, .academic-h5, .academic-h6 {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    margin: 4px 0 2px 0;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
  }
  
  .academic-bold {
    font-weight: 600;
    color: #1f2937;
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.08), transparent);
    padding: 1px 4px;
    border-radius: 3px;
  }
  
  .academic-italic {
    font-style: italic;
    color: #4b5563;
  }
  
  .academic-code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    background: #f3f4f6;
    color: #dc2626;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    border: 1px solid #e5e7eb;
  }
  
  .academic-code-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
    overflow-x: auto;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #334155;
  }
  
  .academic-quote {
    border-left: 4px solid #d1d5db;
    padding: 8px 0 8px 16px;
    margin: 12px 0;
    background: linear-gradient(90deg, rgba(156, 163, 175, 0.05), transparent);
    font-style: italic;
    color: #6b7280;
  }
  
  .academic-list {
    margin: 4px 0;
    padding-left: 0;
    list-style: none;
  }
  
  .academic-list-item {
    margin: 2px 0;
    padding-left: 20px;
    position: relative;
    color: #374151;
    line-height: 1.3;
  }
  
  .academic-list-item::before {
    content: '•';
    color: #3b82f6;
    font-weight: bold;
    position: absolute;
    left: 8px;
  }
  
  .academic-ordered-list {
    margin: 4px 0;
    padding-left: 0;
    list-style: none;
    counter-reset: academic-counter;
  }
  
  .academic-ordered-item {
    margin: 2px 0;
    padding-left: 30px;
    position: relative;
    color: #374151;
    counter-increment: academic-counter;
    line-height: 1.3;
  }
  
  .academic-number {
    color: #3b82f6;
    font-weight: 600;
    position: absolute;
    left: 0;
  }
  
  .academic-link {
    color: #2563eb;
    text-decoration: underline;
    text-decoration-style: dotted;
    transition: all 0.2s ease;
  }
  
  .academic-link:hover {
    color: #1d4ed8;
    text-decoration-style: solid;
  }
  
  .academic-divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d1d5db, transparent);
    margin: 24px 0;
  }
  
  /* 🔥 增强：表格容器样式 */
  .academic-table-container {
    margin: 16px 0 !important;
    overflow-x: auto !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    max-width: 100% !important;
  }

  /* 🔥 增强：表格样式 */
  .academic-table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    border: none !important;
    box-shadow: none !important;
    font-size: 13px !important;
    background: transparent !important;
    table-layout: auto !important;
  }
  
  /* 键值对表格特殊样式 */
  .academic-kv-table {
    table-layout: fixed !important;
  }
  
  .academic-kv-table .academic-table-key {
    width: 35% !important;
    background: #f8fafc !important;
    font-weight: 600 !important;
    color: #1f2937 !important;
  }
  
  .academic-kv-table .academic-table-value {
    width: 65% !important;
    background: #ffffff !important;
  }
  
  .academic-table-header {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  }
  
  .academic-table-th {
    padding: 14px 16px !important;
    text-align: left !important;
    font-weight: 600 !important;
    color: #1f2937 !important;
    border-bottom: 2px solid #d1d5db !important;
    border-right: 1px solid #e5e7eb !important;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
    position: relative !important;
    font-size: 14px !important;
    white-space: nowrap !important;
    vertical-align: middle !important;
  }
  
  .academic-table-th:last-child {
    border-right: none !important;
  }
  
  .academic-table-body {
    background: #ffffff !important;
  }
  
  .academic-table-row {
    transition: background-color 0.2s ease !important;
    border-bottom: 1px solid #e5e7eb !important;
  }
  
  .academic-table-row:nth-child(even) {
    background: #f9fafb !important;
  }
  
  .academic-table-row:hover {
    background: #f3f4f6 !important;
  }
  
  .academic-table-td {
    padding: 12px 16px !important;
    color: #374151 !important;
    border-right: 1px solid #e5e7eb !important;
    line-height: 1.5 !important;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important;
    vertical-align: top !important;
    word-wrap: break-word !important;
    word-break: break-all !important;
    max-width: 200px !important;
    overflow-wrap: break-word !important;
  }
  
  .academic-table-td:last-child {
    border-right: none !important;
  }
  
  .academic-table-row:last-child {
    border-bottom: none !important;
  }
  
  /* 段落分隔样式 */
  .paragraph-break {
    display: block !important;
    margin: 8px 0 !important;
    height: 0 !important;
    border: none !important;
  }
  
  /* 表格内容增强样式 */
  .academic-table strong,
  .academic-table .academic-bold {
    color: #1f2937 !important;
    font-weight: 600 !important;
  }
  
  .academic-table em,
  .academic-table .academic-italic {
    color: #6b7280 !important;
    font-style: italic !important;
  }
  
  .academic-table code,
  .academic-table .academic-code {
    background: #f1f5f9 !important;
    color: #dc2626 !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
    font-size: 13px !important;
  }
  
  /* 表格附加信息样式 */
  .table-additional-info {
    margin-top: 12px !important;
    padding: 12px 16px !important;
    background: #f8fafc !important;
    border-left: 4px solid #3b82f6 !important;
    border-radius: 0 6px 6px 0 !important;
    font-size: 13px !important;
    line-height: 1.6 !important;
    color: #475569 !important;
  }
  
  .table-additional-info::before {
    content: '📝 补充信息：' !important;
    display: block !important;
    font-weight: 600 !important;
    color: #3b82f6 !important;
    margin-bottom: 6px !important;
    font-size: 12px !important;
  }
`;

// 添加样式到head
if (typeof document !== 'undefined') {
  const styleId = 'academic-markdown-styles';
  // 🔥 强制重新加载样式，确保表格样式被正确应用
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default AcademicMarkdownRenderer; 