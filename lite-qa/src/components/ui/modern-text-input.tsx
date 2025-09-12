'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { cn } from '../../utils/cn';

interface ModernTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  maxHeight?: number;
}

export function ModernTextInput({
  value,
  onChange,
  onSend,
  placeholder = "请详细描述您想要创建的Agent...",
  disabled = false,
  loading = false,
  maxHeight = 240
}: ModernTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [value, maxHeight]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim() && !disabled && !loading) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled && !loading) {
      onSend();
    }
  };

  return (
    <div className="w-full">
      {/* 输入区域 */}
      <div
        className={cn(
          "relative border rounded-xl bg-white transition-all duration-200",
          "shadow-sm hover:shadow-md",
          isFocused
            ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20"
            : "border-gray-200 hover:border-gray-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full resize-none border-0 outline-none",
              "text-gray-900 placeholder-gray-500",
              "text-sm leading-6",
              "min-h-[60px] max-h-60",
              "bg-transparent"
            )}
            style={{ 
              minHeight: '60px',
              maxHeight: `${maxHeight}px`,
              overflow: 'auto'
            }}
          />
        </div>

        {/* 底部操作区 */}
        <div className="flex items-center justify-between px-4 pb-3 pt-0">
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span>支持 Ctrl/Cmd + Enter 快速发送</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              loading={loading}
              size="large"
              className={cn(
                "flex items-center gap-2 h-10 px-6",
                "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              开始创建
            </Button>
          </div>
        </div>
      </div>

      {/* 示例提示 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="text-sm text-gray-600 mb-2 font-medium">💡 示例需求：</div>
        <div className="text-sm text-gray-500 space-y-1">
          <div>• 分析CSV文件并生成数据报告</div>
          <div>• 帮我整理和归类本地文件</div>
          <div>• 基于论文URL进行深度研究分析</div>
          <div>• 处理客户邮件并自动回复</div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          不用写得太详细，NextAgent会和您进一步交互确认具体需求。
        </div>
      </div>
    </div>
  );
}
