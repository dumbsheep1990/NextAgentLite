import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * LaTeX公式渲染组件
 * 支持行内公式 $...$ 和块级公式 $$...$$
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  // 解析并渲染包含LaTeX公式的文本
  const renderContentWithLatex = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // 正则表达式匹配LaTeX公式
    // 块级公式: $$...$$
    // 行内公式: $...$
    const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;
    
    let match;
    let keyIndex = 0;
    
    while ((match = latexRegex.exec(text)) !== null) {
      // 添加公式前的普通文本（应用基础Markdown格式）
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(
            <span 
              key={`text-${keyIndex++}`} 
              style={{ color: '#374151' }}
              dangerouslySetInnerHTML={{ 
                __html: beforeText
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
                  .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
              }}
            />
          );
        }
      }
      
      const formula = match[1];
      
      try {
        if (formula.startsWith('$$') && formula.endsWith('$$')) {
          // 块级公式
          const math = formula.slice(2, -2).trim();
          if (math) {
            parts.push(
              <div key={`block-${keyIndex++}`} className="math-display my-4">
                <BlockMath math={math} />
              </div>
            );
          }
        } else if (formula.startsWith('$') && formula.endsWith('$')) {
          // 行内公式
          const math = formula.slice(1, -1).trim();
          if (math) {
            parts.push(
              <span key={`inline-${keyIndex++}`} className="math-inline mx-1">
                <InlineMath math={math} />
              </span>
            );
          }
        }
      } catch (error) {
        // 如果渲染失败，显示原始文本
        console.warn('LaTeX渲染失败:', formula, error);
        parts.push(
          <span key={`error-${keyIndex++}`} className="text-red-400 bg-red-100 px-1 rounded">
            {formula}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余的普通文本（应用基础Markdown格式）
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex);
      if (afterText) {
        parts.push(
          <span 
            key={`text-final-${keyIndex++}`} 
            style={{ color: '#374151' }}
            dangerouslySetInnerHTML={{ 
              __html: afterText
                .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
                .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
            }}
          />
        );
      }
    }
    
    return parts.length > 0 ? parts : [
      <span 
        key="text-only" 
        style={{ color: '#374151' }}
        dangerouslySetInnerHTML={{ 
          __html: text
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
        }}
      />
    ];
  };

  // 处理多行文本
  const renderMultilineContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <div key={`line-${index}`} className={index > 0 ? 'mt-2' : ''}>
        {renderContentWithLatex(line)}
      </div>
    ));
  };

  return (
    <div 
      className={`latex-content ${className}`}
      style={{
        color: '#374151',
        fontSize: '15px',
        lineHeight: '1.6'
      }}
    >
      {renderMultilineContent(content)}
    </div>
  );
};

interface MathFormulaProps {
  formula: string;
  display?: boolean;
  className?: string;
}

/**
 * 单独的数学公式组件
 */
export const MathFormula: React.FC<MathFormulaProps> = ({ 
  formula, 
  display = false, 
  className = '' 
}) => {
  try {
    if (display) {
      return (
        <div className={`math-display my-4 ${className}`}>
          <BlockMath math={formula} />
        </div>
      );
    } else {
      return (
        <span className={`math-inline mx-1 ${className}`}>
          <InlineMath math={formula} />
        </span>
      );
    }
  } catch (error) {
    console.warn('数学公式渲染失败:', formula, error);
    return (
      <span className="text-red-400 bg-red-100 px-1 rounded">
        {display ? `$$${formula}$$` : `$${formula}$`}
      </span>
    );
  }
};

/**
 * 检测文本中是否包含LaTeX公式
 */
export const hasLatexFormulas = (text: string): boolean => {
  const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/;
  const result = latexRegex.test(text);
  console.log('🔍 LaTeX检测:', { text: text.slice(0, 100), hasLatex: result });
  return result;
};

/**
 * 提取文本中的所有LaTeX公式
 */
export const extractLatexFormulas = (text: string): string[] => {
  const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;
  const formulas: string[] = [];
  let match;
  
  while ((match = latexRegex.exec(text)) !== null) {
    formulas.push(match[1]);
  }
  
  return formulas;
};

export default LatexRenderer; 