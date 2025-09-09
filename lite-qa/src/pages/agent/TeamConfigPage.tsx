/**
 * Team配置页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

const TeamConfigPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<TeamOutlined style={{ fontSize: '64px', color: '#13c2c2' }} />}
        description="Team配置页面开发中..."
      >
        <Button type="primary">返回助手管理</Button>
      </Empty>
    </Card>
  );
};

export default TeamConfigPage;