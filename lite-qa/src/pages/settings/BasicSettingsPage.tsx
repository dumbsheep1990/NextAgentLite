/**
 * 基础设置页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const BasicSettingsPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<SettingOutlined style={{ fontSize: '64px', color: '#722ed1' }} />}
        description="基础设置页面开发中..."
      >
        <Button type="primary">返回系统设置</Button>
      </Empty>
    </Card>
  );
};

export default BasicSettingsPage;