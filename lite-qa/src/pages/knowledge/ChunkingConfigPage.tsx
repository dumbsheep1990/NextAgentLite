/**
 * 切分策略配置页面 - 从知识库页面拆分出的独立子页面
 */
import React from 'react';
import { Card, Space, Button } from 'antd';
import { 
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { ChunkingConfigPanel } from '../../components/knowledge';

const ChunkingConfigPage: React.FC = () => {
  
  // 功能按钮渲染
  const renderActionButtons = () => {
    return (
      <Space size="small">
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={() => {
            if ((window as any).triggerChunkingRefresh) {
              (window as any).triggerChunkingRefresh();
            }
          }}
        >
          刷新
        </Button>
        <Button
          type="default"
          icon={<SettingOutlined />}
          onClick={() => {
            if ((window as any).triggerChunkingInitialize) {
              (window as any).triggerChunkingInitialize();
            }
          }}
        >
          初始化默认配置
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if ((window as any).triggerChunkingCreate) {
              (window as any).triggerChunkingCreate();
            }
          }}
        >
          新建配置
        </Button>
      </Space>
    );
  };

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        padding: '0',
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 主要内容区域 */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Card 
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          bodyStyle={{
            padding: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingOutlined />
                切分策略配置
              </span>
              {renderActionButtons()}
            </div>
          }
        >
          <ChunkingConfigPanel onFunctionExpose={true} />
        </Card>
      </div>
    </div>
  );
};

export default ChunkingConfigPage; 