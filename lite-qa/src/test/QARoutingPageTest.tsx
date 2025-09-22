import React from 'react';
import { render, screen } from '@testing-library/react';
import QARoutingPage from '../pages/knowledge/QARoutingPage';

// 简单的功能测试
describe('QARoutingPage', () => {
  test('页面正常渲染', () => {
    render(<QARoutingPage />);
    
    // 检查主要元素是否存在
    expect(screen.getByText('问答路由管理')).toBeInTheDocument();
    expect(screen.getByText('配置智能路由规则，将不同类型的问题自动分发到最合适的知识库和智能体')).toBeInTheDocument();
    
    // 检查统计卡片
    expect(screen.getByText('路由规则')).toBeInTheDocument();
    expect(screen.getByText('启用规则')).toBeInTheDocument();
    expect(screen.getByText('路由次数')).toBeInTheDocument();
    expect(screen.getByText('平均成功率')).toBeInTheDocument();
    
    // 检查按钮
    expect(screen.getByText('创建路由规则')).toBeInTheDocument();
    expect(screen.getByText('测试路由')).toBeInTheDocument();
    expect(screen.getByText('刷新')).toBeInTheDocument();
    
    // 检查表格标签页
    expect(screen.getByText('路由规则')).toBeInTheDocument();
    expect(screen.getByText('路由日志')).toBeInTheDocument();
  });
  
  test('空状态显示正常', () => {
    render(<QARoutingPage />);
    
    // 应该显示空状态提示
    expect(screen.getByText('暂无路由规则')).toBeInTheDocument();
    expect(screen.getByText('点击"创建路由规则"开始配置智能路由')).toBeInTheDocument();
  });
});