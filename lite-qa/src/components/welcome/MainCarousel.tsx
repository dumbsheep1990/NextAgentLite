import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { ModeCard } from './ModeCard';
import type { ModeCardProps } from './ModeCard';
import { Logo } from '../common/Logo';
import './MainCarousel.css';

export const MainCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 卡片数据
  const allCards: ModeCardProps[] = [
    {
      title: '专家问答模式',
      description: '单体AI专家提供精准、快速的问答体验，专注于高效解决您的专业问题。',
      features: [
        '极速响应，低延迟体验',
        '精确匹配专业知识库',
        '智能语义理解分析',
        '实时流式对话交互'
      ],
      icon: <Logo size={48} />,
      path: '/app/agent/single',
      gradient: '#8b5cf6, #a855f7',
      badge: '快速模式'
    },
    {
      title: '团队协作模式',
      description: '六大专业AI智能体深度协作，提供全方位分析与多维度智能服务体验。',
      features: [
        '多Agent智能协作系统',
        '深度语义分析推理',
        '多语言实时翻译服务',
        '知识图谱关联增强'
      ],
      icon: <Logo size={48} />,
      path: '/app/agent/team',
      recommended: true,
      gradient: '#f472b6, #ec4899',
      badge: '智能模式'
    },
    {
      title: '知识库管理',
      description: '智能文档管理与向量化处理系统，支持多格式文档上传和高效语义检索。',
      features: [
        '多格式文档智能解析',
        '高效向量检索引擎',
        'QA数据集统一管理',
        '智能文档切分策略'
      ],
      icon: <Logo size={48} />,
      path: '/app/knowledge',
      gradient: '#60a5fa, #3b82f6',
      badge: '管理工具'
    },
    {
      title: '知识图谱分析',
      description: '构建智能知识网络图谱，通过实体关系分析提供深度语义理解能力。',
      features: [
        '自动实体关系抽取',
        '可视化图谱展示',
        '智能图谱推理查询',
        '多维知识关联分析'
      ],
      icon: <Logo size={48} />,
      path: '/app/graph',
      gradient: '#06b6d4, #0891b2',
      badge: '分析工具'
    },
    {
      title: '系统监控看板',
      description: '全方位系统监控与数据分析平台，实时掌握系统运行状态和性能指标。',
      features: [
        '实时系统状态监控',
        '智能数据统计分析',
        '用户行为轨迹追踪',
        '性能指标可视展示'
      ],
      icon: <Logo size={48} />,
      path: '/app/dashboard',
      gradient: '#fbbf24, #f59e0b',
      badge: '监控面板'
    },
    {
      title: 'Atlas向量空间',
      description: '高维向量空间可视化分析工具，深入理解数据分布和相似性关系。',
      features: [
        '高维数据降维可视化',
        '向量相似性深度分析',
        '智能聚类模式识别',
        '交互式数据空间探索'
      ],
      icon: <Logo size={48} />,
      path: '/app/atlas',
      gradient: '#c084fc, #a855f7',
      badge: '可视化'
    }
  ];

  // 检测侧边栏状态
  const [siderExpanded, setSiderExpanded] = useState(false);
  
  useEffect(() => {
    const checkSiderStatus = () => {
      const sider = document.querySelector('.ant-layout-sider');
      if (sider) {
        const isCollapsed = sider.classList.contains('ant-layout-sider-collapsed');
        setSiderExpanded(!isCollapsed);
      }
    };
    
    // 初始检查
    checkSiderStatus();
    
    // 监听 DOM 变化
    const observer = new MutationObserver(checkSiderStatus);
    const sider = document.querySelector('.ant-layout-sider');
    if (sider) {
      observer.observe(sider, { attributes: true, attributeFilter: ['class'] });
    }
    
    return () => observer.disconnect();
  }, []);

  // 根据窗口宽度和侧边栏状态计算显示参数
  const getDisplayParams = () => {
    // 计算可用宽度（减去容器padding和按钮空间）
    const siderWidth = siderExpanded ? 240 : 64;
    const availableWidth = windowWidth - siderWidth - 200; // 减去按钮和间距
    
    // 根据可用宽度决定显示参数
    if (availableWidth <= 600) {
      return {
        cardsToShow: 1,
        cardWidth: Math.min(350, availableWidth - 40),
        gap: 20,
        slideDistance: Math.min(370, availableWidth - 20)
      };
    }
    if (availableWidth <= 1000) {
      return {
        cardsToShow: 2,
        cardWidth: Math.min(360, Math.floor((availableWidth - 30) / 2)),
        gap: 30,
        slideDistance: Math.min(390, Math.floor((availableWidth - 30) / 2) + 30)
      };
    }
    // 默认显示3张卡片
    const cardWidth = Math.min(380, Math.floor((availableWidth - 60) / 3));
    return {
      cardsToShow: 3,
      cardWidth: cardWidth,
      gap: 30,
      slideDistance: cardWidth + 30
    };
  };

  const displayParams = getDisplayParams();
  const maxIndex = allCards.length - displayParams.cardsToShow;

  // 当显示参数改变时，确保currentIndex不超出范围
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [currentIndex, maxIndex]);

  const nextCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  const prevCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? maxIndex : prevIndex - 1
    );
  };

  return (
    <div className="main-carousel">
      <div className="main-carousel-container">
        <Button
          className="main-carousel-btn main-carousel-btn-prev"
          onClick={prevCard}
          icon={<LeftOutlined />}
          size="large"
        />

        <div 
          className="main-carousel-track"
          style={{
            width: `${displayParams.cardsToShow * displayParams.cardWidth + (displayParams.cardsToShow - 1) * displayParams.gap}px`
          }}
        >
          <div 
            className="main-carousel-slides"
            style={{
              width: `${6 * displayParams.cardWidth + 5 * displayParams.gap}px`,
              gap: `${displayParams.gap}px`,
              transform: `translateX(-${currentIndex * displayParams.slideDistance}px)`, 
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {allCards.map((card, index) => (
              <div 
                key={index} 
                className="main-carousel-slide"
                style={{ width: `${displayParams.cardWidth}px` }}
              >
                <ModeCard {...card} />
              </div>
            ))}
          </div>
        </div>

        <Button
          className="main-carousel-btn main-carousel-btn-next"
          onClick={nextCard}
          icon={<RightOutlined />}
          size="large"
        />
      </div>

      <div className="main-carousel-indicators">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            className={`main-carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};