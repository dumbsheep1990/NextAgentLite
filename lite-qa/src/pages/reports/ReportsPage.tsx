/**
 * 智能报告页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const ReportsPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<FileTextOutlined style={{ fontSize: '64px', color: '#1890ff' }} />}
        description="智能报告页面开发中..."
      >
        <Button type="primary">返回首页</Button>
      </Empty>
    </Card>
  );
};

export default ReportsPage;