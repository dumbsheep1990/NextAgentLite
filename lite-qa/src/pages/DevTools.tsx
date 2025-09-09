/**
 * 开发工具页面 - 用于调试和测试系统功能
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Statistic, 
  Row, 
  Col, 
  Typography, 
  Alert, 
  List,
  Tag,
  message,
  Descriptions
} from 'antd';
import { 
  BugOutlined, 
  ClearOutlined, 
  ReloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useQAStore } from '../stores/qaStore';
import ClearCacheButton from '../components/common/ClearCacheButton';

const { Title, Text, Paragraph } = Typography;

const DevTools: React.FC = () => {
  const [pollingStatus, setPollingStatus] = useState<{
    activePolling: number;
    totalTimers: number;
    knowledgePolling: number;
  }>({
    activePolling: 0,
    totalTimers: 0,
    knowledgePolling: 0
  });
  
  const [cacheInfo, setCacheInfo] = useState<{
    localStorage: number;
    sessionStorage: number;
    isPollingDisabled: boolean;
  }>({
    localStorage: 0,
    sessionStorage: 0,
    isPollingDisabled: false
  });

  // 获取Store状态
  const knowledgeStore = useKnowledgeStore();
  const qaStore = useQAStore();

  // 刷新状态信息
  const refreshStatus = () => {
    // 检查轮询状态
    const knowledgePollingCount = knowledgeStore.pollingIntervals ? knowledgeStore.pollingIntervals.size : 0;
    
    // 检查缓存状态
    const localStorageCount = Object.keys(localStorage).length;
    const sessionStorageCount = Object.keys(sessionStorage).length;
    const isPollingDisabled = localStorage.getItem('__POLLING_DISABLED__') === 'true' || 
                              !!(window as any).__POLLING_DISABLED__;

    setPollingStatus({
      activePolling: knowledgePollingCount,
      totalTimers: knowledgePollingCount, // 简化统计
      knowledgePolling: knowledgePollingCount
    });

    setCacheInfo({
      localStorage: localStorageCount,
      sessionStorage: sessionStorageCount,
      isPollingDisabled
    });
  };

  // 手动停止所有轮询
  const stopAllPolling = () => {
    try {
      knowledgeStore.stopAllPolling();
      message.success('已停止所有轮询任务');
      refreshStatus();
    } catch (error) {
      message.error('停止轮询失败');
      console.error('停止轮询失败:', error);
    }
  };

  // 清除所有缓存（不重新加载页面）
  const clearCacheWithoutReload = async () => {
    try {
      // 停止轮询
      knowledgeStore.stopAllPolling();
      
      // 清理localStorage中的任务相关数据
      const localKeys = Object.keys(localStorage);
      const taskKeys = localKeys.filter(key => 
        key.includes('task') || key.includes('session') || key.includes('knowledge') ||
        key.includes('polling') || key.includes('upload') || key.includes('processing')
      );
      taskKeys.forEach(key => localStorage.removeItem(key));
      
      // 重置Store状态
      knowledgeStore.resetAllState();
      qaStore.resetAllState();
      
      message.success(`已清除 ${taskKeys.length} 个缓存项目`);
      refreshStatus();
    } catch (error) {
      message.error('清除缓存失败');
      console.error('清除缓存失败:', error);
    }
  };

  // 显示详细的轮询信息
  const getPollingDetails = (): Array<{id: string, type: string, status: string}> => {
    const details: Array<{id: string, type: string, status: string}> = [];
    
    if (knowledgeStore.pollingIntervals) {
      knowledgeStore.pollingIntervals.forEach((interval, documentId) => {
        details.push({
          id: documentId,
          type: 'Document Polling',
          status: 'Active'
        });
      });
    }
    
    return details;
  };

  // 获取缓存详情
  const getCacheDetails = (): Array<{key: string, type: string, value: string}> => {
    const details: Array<{key: string, type: string, value: string}> = [];
    
    // localStorage 详情
    Object.keys(localStorage).forEach(key => {
      if (key.includes('task') || key.includes('session') || key.includes('knowledge') ||
          key.includes('polling') || key.includes('upload') || key.includes('processing')) {
        details.push({
          key,
          type: 'localStorage',
          value: localStorage.getItem(key)?.substring(0, 100) + '...'
        });
      }
    });
    
    return details;
  };

  useEffect(() => {
    refreshStatus();
    
    // 定期刷新状态
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const pollingDetails = getPollingDetails();
  const cacheDetails = getCacheDetails();

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>
        <BugOutlined /> 开发工具
      </Title>
      
      <Paragraph>
        这个页面用于调试和测试系统功能，特别是轮询任务和缓存管理。
      </Paragraph>

      {/* 系统状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃轮询"
              value={pollingStatus.activePolling}
              suffix="个"
              valueStyle={{ color: pollingStatus.activePolling > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="知识库轮询"
              value={pollingStatus.knowledgePolling}
              suffix="个"
              valueStyle={{ color: pollingStatus.knowledgePolling > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本地缓存项"
              value={cacheInfo.localStorage}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="会话缓存项"
              value={cacheInfo.sessionStorage}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      {/* 轮询禁用状态 */}
      {cacheInfo.isPollingDisabled && (
        <Alert
          message="轮询已被禁用"
          description="检测到轮询禁用标记，新的轮询任务将不会启动。"
          type="warning"
          style={{ marginBottom: '16px' }}
          showIcon
        />
      )}

      {/* 操作按钮 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refreshStatus}>
              刷新状态
            </Button>
            <Button 
              icon={<StopOutlined />} 
              onClick={stopAllPolling}
              danger
              disabled={pollingStatus.activePolling === 0}
            >
              停止所有轮询
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearCacheWithoutReload}
            >
              清除缓存(不重载)
            </Button>
            <ClearCacheButton
              size="middle"
              type="primary"
              showText={true}
            />
          </Space>
        </Col>
      </Row>

      {/* 详细信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <PlayCircleOutlined />
                活跃轮询详情 ({pollingDetails.length})
              </Space>
            }
          >
            {pollingDetails.length > 0 ? (
              <List
                dataSource={pollingDetails}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text code>{item.id}</Text>
                          <Tag color="red">{item.status}</Tag>
                        </Space>
                      }
                      description={item.type}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="没有活跃的轮询任务" type="success" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                任务相关缓存 ({cacheDetails.length})
              </Space>
            }
          >
            {cacheDetails.length > 0 ? (
              <List
                dataSource={cacheDetails}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text code>{item.key}</Text>
                          <Tag color="blue">{item.type}</Tag>
                        </Space>
                      }
                      description={
                        <Text ellipsis style={{ width: '200px' }}>
                          {item.value}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="没有任务相关的缓存数据" type="success" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Store状态信息 */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="知识库Store状态">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="文档数量">
                {knowledgeStore.documents.length}
              </Descriptions.Item>
              <Descriptions.Item label="上传中">
                {knowledgeStore.isUploading ? '是' : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="向量化中">
                {knowledgeStore.isVectorizing ? '是' : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="轮询Map大小">
                {knowledgeStore.pollingIntervals ? knowledgeStore.pollingIntervals.size : 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="QA Store状态">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前会话">
                {qaStore.currentSessionId || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="消息数量">
                {qaStore.messages.length}
              </Descriptions.Item>
              <Descriptions.Item label="对话数量">
                {qaStore.conversations.length}
              </Descriptions.Item>
              <Descriptions.Item label="加载中">
                {qaStore.isLoading ? '是' : '否'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DevTools; 