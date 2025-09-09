import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div 
      className={`logo-container ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0, 201, 255, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <span style={{
        color: 'white',
        fontFamily: 'Arial Black, sans-serif',
        fontSize: `${size * 0.5625}px`, // 18px 对应 32px 的比例
        fontWeight: 900,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>Z</span>
    </div>
  );
};