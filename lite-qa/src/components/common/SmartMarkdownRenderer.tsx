/**
 * SmartMarkdownRenderer - 智能Markdown渲染选择器
 * 根据内容特征和配置自动选择最适合的渲染器
 */
import React from 'react';
import { StreamdownRenderer } from './StreamdownRenderer';
import { LegacyAcademicMarkdownRenderer } from './LegacyAcademicMarkdownRenderer';

export interface SmartMarkdownRendererProps {
  content: string;
  className?: string;
  streaming?: boolean;
  preferStreamdown?: boolean;
  enableCodeCopy?: boolean;
  enableMath?: boolean;
  enableTables?: boolean;
}

/**
 * 分析内容特征，决定使用哪个渲染器
 */
const analyzeContentFeatures = (content: string) => {
  const features = {
    hasCodeBlocks: /```[\s\S]*?```/.test(content),
    hasIncompletCodeBlocks: /```[^`]*$/.test(content.trim()),
    hasMathFormulas: /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/.test(content),
    hasIncompleteMath: /\$\$[^$]*$/.test(content.trim()),
    hasComplexTables: /\|.*\|.*\n.*\|.*\|/.test(content),
    hasThinkingTags: /<thinking>[\s\S]*?<\/thinking>/i.test(content),
    hasToolCalls: /<function_calls>[\s\S]*?<\/antml:function_calls>/i.test(content),
    hasHtmlTags: /<[^>]+>/.test(content) && !/<(thinking|function_calls|antml:function_calls)/.test(content),
    contentLength: content.length,
    hasMultipleLineBreaks: /\n{3,}/.test(content),
    hasListItems: /^[\s]*[-*+]\s+/m.test(content) || /^[\s]*\d+\.\s+/m.test(content)
  };

  return features;
};

/**
 * 根据特征决定使用哪个渲染器
 */
const shouldUseStreamdown = (
  features: ReturnType<typeof analyzeContentFeatures>,
  streaming: boolean,
  preferStreamdown: boolean
): boolean => {
  // 如果显式偏好streamdown且内容适合
  if (preferStreamdown && !features.hasThinkingTags && !features.hasToolCalls) {
    return true;
  }

  // 如果是流式内容且有未完成的块
  if (streaming && (features.hasIncompletCodeBlocks || features.hasIncompleteMath)) {
    return true;
  }

  // 如果内容相对简单且没有特殊标签
  if (!features.hasThinkingTags && 
      !features.hasToolCalls && 
      !features.hasHtmlTags &&
      features.contentLength < 5000) {
    return true;
  }

  // 如果主要是代码块和数学公式
  if ((features.hasCodeBlocks || features.hasMathFormulas) && 
      !features.hasThinkingTags && 
      !features.hasToolCalls) {
    return true;
  }

  // 默认情况下，对于复杂内容使用学术渲染器
  return false;
};

export const SmartMarkdownRenderer: React.FC<SmartMarkdownRendererProps> = ({
  content,
  className = '',
  streaming = false,
  preferStreamdown = false,
  enableCodeCopy = true,
  enableMath = true,
  enableTables = true
}) => {
  // 分析内容特征
  const features = React.useMemo(() => 
    analyzeContentFeatures(content), 
    [content]
  );

  // 决定使用哪个渲染器
  const useStreamdown = React.useMemo(() => 
    shouldUseStreamdown(features, streaming, preferStreamdown),
    [features, streaming, preferStreamdown]
  );

  // 在开发环境下显示渲染器选择信息
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 SmartMarkdownRenderer 渲染器选择:', {
        renderer: useStreamdown ? 'Streamdown' : 'LegacyAcademic',
        streaming,
        preferStreamdown,
        features,
        contentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : '')
      });
    }
  }, [useStreamdown, streaming, preferStreamdown, features, content]);

  // 如果选择使用Streamdown
  if (useStreamdown) {
    return (
      <StreamdownRenderer
        streaming={streaming}
        className={`smart-markdown-streamdown ${className}`}
        enableCodeCopy={enableCodeCopy}
        enableMath={enableMath}
        enableTables={enableTables}
      >
        {content}
      </StreamdownRenderer>
    );
  }

  // 使用传统的学术风格渲染器
  return (
    <div className={`smart-markdown-legacy ${className}`}>
      <LegacyAcademicMarkdownRenderer 
        content={content}
        className="legacy-academic-content"
      />
    </div>
  );
};

export default SmartMarkdownRenderer;