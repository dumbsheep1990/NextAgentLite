/**
 * 系统工具页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const SystemToolsPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<ToolOutlined style={{ fontSize: '64px', color: '#52c41a' }} />}
        description="系统工具页面开发中..."
      >
        <Button type="primary">返回工具广场</Button>
      </Empty>
    </Card>
  );
};

export default SystemToolsPage;