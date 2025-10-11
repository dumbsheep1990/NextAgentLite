/**
 * QA数据集页面 - 从知识库页面拆分出的独立子页面
 */
import React, { useEffect } from 'react';
import { Card, Tabs, Space, Button } from 'antd';
import { 
  QuestionCircleOutlined,
  UploadOutlined,
  ReloadOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { QADatasetPanel } from '../../components/knowledge';
import QueueMonitor from '../../components/common/QueueMonitor';
import { useState } from 'react';

const QADatasetPage: React.FC = () => {
  const [queueMonitorVisible, setQueueMonitorVisible] = useState(false);

  // 监听来自Layout的事件
  useEffect(() => {
    const handleOpenQueueMonitor = () => {
      setQueueMonitorVisible(true);
    };

    window.addEventListener('open-queue-monitor', handleOpenQueueMonitor);
    
    return () => {
      window.removeEventListener('open-queue-monitor', handleOpenQueueMonitor);
    };
  }, []);

  // 功能按钮渲染
  const renderActionButtons = () => {
    return (
      <Space size="small">
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => {
            console.log('点击上传QA数据按钮');
            if ((window as any).triggerQADatasetUpload) {
              console.log('找到触发函数，执行上传');
              (window as any).triggerQADatasetUpload();
            } else {
              console.warn('未找到triggerQADatasetUpload函数');
            }
          }}
        >
          上传QA数据
        </Button>
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={() => {
            console.log('点击刷新QA数据按钮');
            if ((window as any).triggerQADatasetRefresh) {
              console.log('找到刷新函数，执行刷新');
              (window as any).triggerQADatasetRefresh();
            } else {
              console.warn('未找到triggerQADatasetRefresh函数');
            }
          }}
        >
          刷新
        </Button>
        <Button
          type="default"
          icon={<MonitorOutlined />}
          onClick={() => setQueueMonitorVisible(true)}
        >
          队列监控
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
                <QuestionCircleOutlined />
                QA数据集管理
              </span>
              {renderActionButtons()}
            </div>
          }
        >
          <QADatasetPanel onUploadTrigger={() => console.log('QADataset上传触发器激活')} />
        </Card>
      </div>

      {/* 队列监控组件 */}
      <QueueMonitor
        visible={queueMonitorVisible}
        onClose={() => setQueueMonitorVisible(false)}
      />
    </div>
  );
};

export default QADatasetPage; 
