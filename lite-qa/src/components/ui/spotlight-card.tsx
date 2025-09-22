import React, { ReactNode, memo } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const borderColorMap = {
  blue: 'border-blue-300',
  purple: 'border-purple-300', 
  green: 'border-green-300',
  red: 'border-red-300',
  orange: 'border-orange-300'
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles: React.CSSProperties = {};

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  const borderColorClass = borderColorMap[glowColor];

  return (
    <div
      style={getInlineStyles()}
      className={`
        ${getSizeClasses()}
        ${!customSize ? 'aspect-[3/4]' : ''}
        ${borderColorClass}
        rounded-2xl 
        relative 
        grid 
        grid-rows-[1fr_auto] 
        p-4 
        gap-4 
        bg-white/70
        backdrop-blur-md
        border-2
        shadow-lg
        transition-all 
        duration-300 
        hover:shadow-xl
        hover:scale-[1.02]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const MemoizedGlowCard = memo(GlowCard);

export { MemoizedGlowCard as GlowCard };