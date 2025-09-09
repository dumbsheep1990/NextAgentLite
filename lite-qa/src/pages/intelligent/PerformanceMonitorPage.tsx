/**
 * 性能监控页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';

const PerformanceMonitorPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<DashboardOutlined style={{ fontSize: '64px', color: '#f5222d' }} />}
        description="性能监控页面开发中..."
      >
        <Button type="primary">返回智能体管理</Button>
      </Empty>
    </Card>
  );
};

export default PerformanceMonitorPage;