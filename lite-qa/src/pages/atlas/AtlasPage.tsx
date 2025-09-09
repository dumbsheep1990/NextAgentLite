/**
 * Atlas向量可视化页面
 * 集成Apple Embedding Atlas到NextAgentLite系统 - 全屏模式
 */
import React from 'react';
import { AtlasIframeViewer } from '../../components/embedding/AtlasIframeViewer';

const AtlasPage: React.FC = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 全屏Atlas可视化组件 */}
      <AtlasIframeViewer 
        height="100%"
        className="atlas-fullscreen"
      />
    </div>
  );
};

export default AtlasPage;