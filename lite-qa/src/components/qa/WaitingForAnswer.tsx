/**
 * 等待AI回答的过渡动画组件
 */
import React, { useState, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { MessageOutlined, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface WaitingForAnswerProps {
  show: boolean;
  hasSearchResults?: boolean;
}

export const WaitingForAnswer: React.FC<WaitingForAnswerProps> = ({ 
  show, 
  hasSearchResults = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const steps = hasSearchResults 
    ? [
        '正在分析检索结果',
        '正在组织回答内容', 
        '正在生成详细回答',
        '即将为您呈现答案'
      ]
    : [
        '正在理解您的问题',
        '正在准备回答',
        '即将为您呈现答案'
      ];

  // 步骤切换动画
  useEffect(() => {
    if (!show) return;
    
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);
    
    return () => clearInterval(stepTimer);
  }, [show, steps.length]);

  // 点点点动画
  useEffect(() => {
    if (!show) return;
    
    const dotsTimer = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(dotsTimer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="my-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3">
            <MessageOutlined className="text-blue-500 text-lg" />
          </div>
          <Text strong className="text-sm text-gray-700 font-medium">
            {steps[currentStep]}{dots}
          </Text>
        </div>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 14, color: '#3b82f6' }} spin />}
        />
      </div>
    </div>
  );
};