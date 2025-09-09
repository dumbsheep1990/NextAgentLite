import React, { useState } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AnimatedCard, CardBody, CardTitle, CardDescription, CardVisual } from '@/components/ui/interactive-bento-grid';
import './MainCarousel.css';

// 导入动画视觉组件
import { 
  AnalyticsVisual, 
  WaveVisual, 
  GeometricVisual, 
  NetworkVisual,
  ToolsIntegrationVisual,
  AtlasVisual 
} from './VisualComponents';


interface CardData {
  title: string;
  description: string;
  features: string[];
  path: string;
  recommended?: boolean;
  badge?: string;
  visual: React.ReactNode;
}

export const InteractiveCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);


  // 卡片数据
  const allCards: CardData[] = [
    {
      title: '专家问答模式',
      description: '单体AI专家提供精准、快速的问答体验，专注于高效解决您的专业问题。',
      features: [
        '极速响应，低延迟体验',
        '精确匹配专业知识库',
        '智能语义理解分析',
        '实时流式对话交互'
      ],
      path: '/app/agent/single',
      badge: '快速模式',
      visual: <AnalyticsVisual hovered={hoveredCard === 0} />
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
      path: '/app/agent/team',
      badge: '智能模式',
      visual: <WaveVisual />
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
      path: '/app/knowledge',
      badge: '管理工具',
      visual: <GeometricVisual />
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
      path: '/app/graph',
      badge: '分析工具',
      visual: <NetworkVisual />
    },
    {
      title: '工具集成中心',
      description: '强大的工具集成平台，整合系统工具、MCP工具、API接口和外部服务。',
      features: [
        '系统工具统一管理',
        'MCP工具无缝集成',
        'API接口标准化调用',
        '外部服务智能对接'
      ],
      path: '/app/tools',
      badge: '工具平台',
      visual: <ToolsIntegrationVisual />
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
      path: '/app/atlas',
      badge: '可视化',
      visual: <AtlasVisual />
    }
  ];

  // 固定显示参数，不进行任何计算
  const displayParams = {
    cardsToShow: 3,
    cardWidth: 380,
    gap: 20,
    slideDistance: 400 // 380 + 20
  };
  const maxIndex = allCards.length - displayParams.cardsToShow;

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

  const handleCardClick = (path: string) => {
    navigate(path);
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

        <div className="main-carousel-track">
          <div 
            className="main-carousel-slides"
            style={{
              transform: `translateX(-${currentIndex * displayParams.slideDistance}px)`
            }}
          >
            {allCards.map((card, index) => (
              <div 
                key={index} 
                className="main-carousel-slide"
                onClick={() => handleCardClick(card.path)}
              >
                <AnimatedCard 
                  className="cursor-pointer h-[480px] relative"
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardVisual className="relative">
                    {card.visual}
                  </CardVisual>
                  <CardBody className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <CardTitle className="flex-1">{card.title}</CardTitle>
                        {card.badge && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <CardDescription className="mb-4">{card.description}</CardDescription>
                      
                      {/* 特性列表 */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">核心特性</h5>
                        <div className="space-y-1">
                          {card.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-xs text-gray-600">
                              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                  </CardBody>
                </AnimatedCard>
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