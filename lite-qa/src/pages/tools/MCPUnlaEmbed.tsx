import React, { useEffect } from 'react';

const MCPUnlaEmbed: React.FC = () => {
  const base = import.meta.env.VITE_UNLA_WEB_URL || 'http://localhost:5173';
  const token = window.localStorage.getItem('token');
  const url = new URL(base);
  if (token) {
    url.searchParams.set('token', token);
  }
  // 打开时自动折叠系统侧边导航
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('collapse-sidebar'));
  }, []);
  return (
    <div style={{height: '100%', width: '100%', padding: 0, margin: 0}}>
      <iframe
        title="Unla MCP Gateway UI"
        src={url.toString()}
        style={{border: 'none', width: '100%', height: 'calc(100vh - 64px)'}}
      />
    </div>
  );
};

export default MCPUnlaEmbed;
