/**
 * Agent配置页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const AgentConfigPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<RobotOutlined style={{ fontSize: '64px', color: '#fa8c16' }} />}
        description="Agent配置页面开发中..."
      >
        <Button type="primary">返回助手管理</Button>
      </Empty>
    </Card>
  );
};

export default AgentConfigPage;