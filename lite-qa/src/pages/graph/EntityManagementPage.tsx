/**
 * 实体管理页面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { NodeIndexOutlined } from '@ant-design/icons';

const EntityManagementPage: React.FC = () => {
  return (
    <Card style={{ height: '100%' }}>
      <Empty
        image={<NodeIndexOutlined style={{ fontSize: '64px', color: '#722ed1' }} />}
        description="实体管理页面开发中..."
      >
        <Button type="primary">返回知识图谱</Button>
      </Empty>
    </Card>
  );
};

export default EntityManagementPage;