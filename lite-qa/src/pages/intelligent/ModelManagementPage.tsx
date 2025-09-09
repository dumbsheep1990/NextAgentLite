/**
 * 模型管理页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const ModelManagementPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<SettingOutlined style={{ fontSize: '64px', color: '#eb2f96' }} />}
        description="模型管理页面开发中..."
      >
        <Button type="primary">返回智能体管理</Button>
      </Empty>
    </Card>
  );
};

export default ModelManagementPage;