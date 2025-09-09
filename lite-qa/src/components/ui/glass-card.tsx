/**
 * 磨砂玻璃卡片组件 - 基于提供的 SchemaCard 样式
 */
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  floating?: boolean;
  glow?: boolean;
  dark?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  floating = false,
  glow = false,
  dark = false
}) => {
  const baseClasses = dark ? 'card-border' : 'glass';
  const animationClasses = floating ? 'animate-float' : '';
  const glowClasses = glow ? 'inner-glow' : '';
  
  return (
    <div className={`${baseClasses} ${animationClasses} ${glowClasses} rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

interface GlassCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({
  children,
  className = '',
  gradient = false
}) => {
  const headerClasses = gradient ? 'settings-header' : 'glass';
  
  return (
    <div className={`${headerClasses} p-6 relative ${className}`}>
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full" 
          style={{ 
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', 
            backgroundSize: '15px 15px' 
          }} 
        />
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

interface GlassCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardContent: React.FC<GlassCardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

interface GlassDividerProps {
  className?: string;
}

export const GlassDivider: React.FC<GlassDividerProps> = ({
  className = ''
}) => {
  return (
    <div className={`w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent ${className}`} />
  );
};