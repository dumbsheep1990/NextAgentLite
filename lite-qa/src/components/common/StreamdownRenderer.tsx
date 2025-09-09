/**
 * StreamdownRenderer - 使用官方Vercel Streamdown库的React组件包装器
 * 专为AI流式内容设计，支持未完成的markdown块和实时渲染
 */
import React from 'react';
import { Streamdown } from 'streamdown';
import type { StreamdownProps as OriginalStreamdownProps } from 'streamdown';
import './StreamdownRenderer.css';

// 扩展官方StreamdownProps以适配我们的接口
export interface StreamdownProps {
  children: string;
  className?: string;
  enableCodeCopy?: boolean;
  enableMath?: boolean;
  enableTables?: boolean;
  streaming?: boolean;
  shikiTheme?: OriginalStreamdownProps['shikiTheme'];
}

/**
 * StreamdownRenderer 主组件 - 使用官方Vercel Streamdown
 */
export const StreamdownRenderer: React.FC<StreamdownProps> = ({
  children,
  className = '',
  enableCodeCopy = true,
  enableMath = true,
  enableTables = true,
  streaming = false,
  shikiTheme = ['github-light', 'github-dark']
}) => {
  // 如果内容为空，返回空div
  if (!children || children.trim() === '') {
    return <div className={`streamdown-content ${className}`}></div>;
  }

  console.log('🎯 StreamdownRenderer 使用官方Vercel库，streaming:', streaming, 'content length:', children.length);

  return (
    <div className={`streamdown-content ${className}`}>
      <Streamdown 
        parseIncompleteMarkdown={streaming}
        shikiTheme={shikiTheme}
        className="streamdown-markdown"
        // 安全设置
        defaultOrigin={window.location.origin}
        allowedLinkPrefixes={['http://', 'https://', 'mailto:']}
        allowedImagePrefixes={['http://', 'https://', 'data:']}
        // 启用相关插件
        remarkPlugins={enableMath ? undefined : []}
        rehypePlugins={enableMath ? undefined : []}
      >
        {children}
      </Streamdown>
    </div>
  );
};

export default StreamdownRenderer;