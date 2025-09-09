/**
 * 简化测试页面 - 独立测试SSE渲染是否有中断问题
 */
import React from 'react';
import SimpleTestRenderer from '../components/qa/SimpleTestRenderer';

const TestSimplePage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>🧪 SSE渲染测试页面</h1>
      <p>这是一个独立的简化测试页面，用于测试team问答的SSE流式渲染是否会中断。</p>
      <SimpleTestRenderer teamName="geopolymer_qa_team_v2" />
    </div>
  );
};

export default TestSimplePage;