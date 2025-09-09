import React, { useState } from 'react';
import { Card, Button, Typography } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined,
  BookOutlined,
  NodeIndexOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  ToolOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import './FunctionCarousel.css';

const { Title, Text } = Typography;

export interface FunctionCardData {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  color: string;
}

export const FunctionCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const functionCards: FunctionCardData[] = [
    {
      id: 'knowledge',
      title: '知识库管理',
      description: '智能文档管理与向量化处理，支持多格式文档上传和语义检索',
      features: [
        '多格式文档解析支持',
        '智能文档切分策略',
        '高效向量检索引擎',
        'QA数据集管理'
      ],
      icon: <BookOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea'
    },
    {
      id: 'graph',
      title: '知识图谱',
      description: '构建智能知识网络，通过实体关系图谱提供深度语义理解',
      features: [
        '自动实体关系抽取',
        '可视化图谱展示',
        '图谱推理查询',
        '知识关联分析'
      ],
      icon: <NodeIndexOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb'
    },
    {
      id: 'intelligent',
      title: '智能配置',
      description: '模型管理与性能监控，提供完整的AI模型配置和优化方案',
      features: [
        '多模型统一管理',
        '实时性能监控',
        '智能参数调优',
        '资源使用分析'
      ],
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe'
    },
    {
      id: 'dashboard',
      title: '系统看板',
      description: '全方位系统监控与数据分析，实时掌握系统运行状态',
      features: [
        '实时系统监控',
        '数据统计分析',
        '用户行为追踪',
        '性能指标展示'
      ],
      icon: <DashboardOutlined />,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      color: '#a8edea'
    },
    {
      id: 'tools',
      title: '系统工具',
      description: '丰富的系统维护与开发工具集，提升开发和运维效率',
      features: [
        '数据库管理工具',
        '系统配置管理',
        '日志分析工具',
        '性能诊断工具'
      ],
      icon: <ToolOutlined />,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      color: '#ffecd2'
    },
    {
      id: 'atlas',
      title: 'Atlas可视化',
      description: '高维向量空间可视化分析，深入理解数据分布和相似性关系',
      features: [
        '高维数据降维展示',
        '向量相似性分析',
        '聚类可视化',
        '交互式数据探索'
      ],
      icon: <RadarChartOutlined />,
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      color: '#d299c2'
    }
  ];

  const nextCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === functionCards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? functionCards.length - 1 : prevIndex - 1
    );
  };

  const currentCard = functionCards[currentIndex];

  return (
    <div className="function-carousel">
      <div className="carousel-header">
        <Title level={3} style={{ color: '#374151', textAlign: 'center', marginBottom: '8px' }}>
          系统功能展示
        </Title>
        <Text style={{ color: '#6b7280', display: 'block', textAlign: 'center' }}>
          探索NextAgentLite的强大功能模块
        </Text>
      </div>

      <div className="carousel-container">
        <Button
          className="carousel-btn carousel-btn-prev"
          onClick={prevCard}
          icon={<LeftOutlined />}
          size="large"
        />

        <div className="function-card-container">
          <Card
            className="function-card"
            style={{
              background: currentCard.gradient,
              border: 'none',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <div className="function-card-content">
              <div className="function-card-header">
                <div className="function-icon-container">
                  {React.cloneElement(currentCard.icon as React.ReactElement, {
                    style: { fontSize: '32px', color: 'white' }
                  })}
                </div>
                <div className="function-title-section">
                  <Title level={2} style={{ margin: 0, color: 'white' }}>
                    {currentCard.title}
                  </Title>
                </div>
              </div>

              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '16px', 
                display: 'block',
                marginTop: '16px',
                marginBottom: '24px'
              }}>
                {currentCard.description}
              </Text>

              <div className="function-features-list">
                <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
                  主要功能
                </Title>
                <div className="function-features-grid">
                  {currentCard.features.map((feature, index) => (
                    <div key={index} className="function-feature-item">
                      <span className="function-feature-dot" />
                      <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                        {feature}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Button
          className="carousel-btn carousel-btn-next"
          onClick={nextCard}
          icon={<RightOutlined />}
          size="large"
        />
      </div>

      <div className="carousel-indicators">
        {functionCards.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            style={{
              backgroundColor: index === currentIndex ? currentCard.color : 'rgba(156, 163, 175, 0.3)'
            }}
          />
        ))}
      </div>
    </div>
  );
};