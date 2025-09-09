import React from 'react';
import { Typography } from 'antd';
import { ThunderboltOutlined, BulbOutlined, ShareAltOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const FeatureHighlights: React.FC = () => {
  return (
    <div className="feature-highlights">
      <div className="feature-cards-wrapper">
        <div className="feature-card ai-powered">
          <div className="feature-icon-wrapper">
            <BulbOutlined className="feature-icon" />
          </div>
          <div className="feature-content">
            <Text className="feature-title">AI驱动</Text>
            <Text className="feature-desc">先进大语言模型</Text>
          </div>
        </div>
        
        <div className="feature-card intelligent">
          <div className="feature-icon-wrapper">
            <ThunderboltOutlined className="feature-icon" />
          </div>
          <div className="feature-content">
            <Text className="feature-title">智能检索</Text>
            <Text className="feature-desc">多模态向量搜索</Text>
          </div>
        </div>
        
        <div className="feature-card collaborative">
          <div className="feature-icon-wrapper">
            <ShareAltOutlined className="feature-icon" />
          </div>
          <div className="feature-content">
            <Text className="feature-title">协作系统</Text>
            <Text className="feature-desc">多Agent智能协作</Text>
          </div>
        </div>
      </div>
    </div>
  );
};