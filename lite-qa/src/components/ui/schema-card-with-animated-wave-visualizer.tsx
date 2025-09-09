/**
 * Schema Card 组件 - 简化版，专注于卡片样式
 */
import React from 'react';
import { GlassCard, GlassCardHeader, GlassCardContent, GlassDivider } from './glass-card';

interface SchemaCardProps {
  title?: string;
  description?: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  status?: string;
  floating?: boolean;
}

export default function SchemaCard({
  title = "Schema Management",
  description = "Design, optimize and maintain your database structure with powerful schema tools.",
  badge = "Database",
  actionText = "Manage",
  onAction,
  status = "Live",
  floating = true
}: SchemaCardProps) {
  return (
    <div className="w-full max-w-xs">
      <GlassCard dark floating={floating}>
        <GlassCardHeader gradient>
          <div className="w-full h-48 rounded-xl gradient-border inner-glow overflow-hidden relative">
            {/* 动画网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="w-full h-full animate-pulse" 
                style={{ 
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', 
                  backgroundSize: '15px 15px' 
                }} 
              />
            </div>
            
            {/* 示例内容区域 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl glass border border-white/20 flex items-center justify-center animate-pulse-slow">
                <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7V10C4 10.5523 4.44772 11 5 11H9C9.55228 11 10 10.5523 10 10V7C10 6.44772 9.55228 6 9 6H5C4.44772 6 4 6.44772 4 7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 7V10C14 10.5523 14.4477 11 15 11H19C19.5523 11 20 10.5523 20 10V7C20 6.44772 19.5523 6 19 6H15C14.4477 6 14 6.44772 14 7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 17V20C4 20.5523 4.44772 21 5 21H9C9.55228 21 10 20.5523 10 20V17C10 16.4477 9.55228 16 9 16H5C4.44772 16 4 16.4477 4 17Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 17V20C14 20.5523 14.4477 21 15 21H19C19.5523 21 20 20.5523 20 20V17C20 16.4477 19.5523 16 19 16H15C14.4477 16 14 16.4477 14 17Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 8.5H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10 18.5H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </GlassCardHeader>
        
        <GlassDivider />
        
        <GlassCardContent>
          <span className="inline-block px-3 py-1 glass text-indigo-300 rounded-full text-xs font-medium mb-3 border border-indigo-400/30">
            {badge}
          </span>
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          <p className="text-white/70 mb-4 leading-relaxed text-xs">
            {description}
          </p>
          <div className="flex justify-between items-center">
            <button 
              onClick={onAction}
              className="text-indigo-400 hover:text-indigo-300 transition flex items-center text-xs font-medium glass px-3 py-1.5 rounded-lg border border-indigo-400/30 hover:border-indigo-300/50"
            >
              {actionText}
              <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-white/50 text-xs glass px-2 py-1 rounded-full border border-white/10">
              {status}
            </span>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}