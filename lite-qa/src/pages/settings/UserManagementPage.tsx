/**
 * 用户管理页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const UserManagementPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<UserOutlined style={{ fontSize: '64px', color: '#13c2c2' }} />}
        description="用户管理页面开发中..."
      >
        <Button type="primary">返回系统设置</Button>
      </Empty>
    </Card>
  );
};

export default UserManagementPage;