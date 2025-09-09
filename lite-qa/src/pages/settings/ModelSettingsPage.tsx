/**
 * 模型设置页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

const ModelSettingsPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<ApiOutlined style={{ fontSize: '64px', color: '#fa541c' }} />}
        description="模型设置页面开发中..."
      >
        <Button type="primary">返回系统设置</Button>
      </Empty>
    </Card>
  );
};

export default ModelSettingsPage;