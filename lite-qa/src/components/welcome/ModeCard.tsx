import React from 'react';
import { Card, Button, Typography, Badge, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export interface ModeCardProps {
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  path: string;
  recommended?: boolean;
  badge?: string;
  gradient: string;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  title,
  description,
  features,
  icon,
  path,
  recommended,
  badge,
  gradient
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };

  return (
    <div className={`mode-card-wrapper ${recommended ? 'recommended' : ''}`}>
      {recommended && (
        <div className="recommended-badge">
          <Badge.Ribbon text="推荐使用" color="volcano">
            <div />
          </Badge.Ribbon>
        </div>
      )}
      
      <Card
        className="mode-card"
        onClick={handleClick}
        style={{
          background: `linear-gradient(135deg, ${gradient})`,
          border: 'none',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div className="card-content">
          <div className="card-header">
            <div className="icon-container">
              {icon}
            </div>
            <div className="title-section">
              <Title level={3} style={{ margin: 0, color: 'white' }}>
                {title}
              </Title>
              {badge && (
                <Tag 
                  style={{ 
                    marginTop: '8px', 
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#374151',
                    border: 'none',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {badge}
                </Tag>
              )}
            </div>
          </div>

          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', marginTop: '16px' }}>
            {description}
          </Paragraph>

          <div className="features-list">
            <Title level={5} style={{ color: 'white', marginBottom: '12px' }}>
              核心特性
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-dot" />
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {feature}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            className="action-button"
            style={{
              marginTop: '16px',
              width: '100%',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            开始使用
          </Button>
        </div>
      </Card>
    </div>
  );
};