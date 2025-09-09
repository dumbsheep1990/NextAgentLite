/**
 * 资源测试页面 - 用于测试全局资源加载功能
 */
import React from 'react';
import { Card, Typography, Space, Tag, Button, Descriptions, Alert } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useGlobalResourceStore } from '../stores/globalResourceStore';
import ResourceStatusIndicator from '../components/common/ResourceStatusIndicator';

const { Title, Text } = Typography;

const ResourceTestPage: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    loadErrors,
    chunkingConfigs,
    defaultChunkingConfig,
    modelConfigs,
    embeddingModels,
    chatModels,
    vectorConfig,
    systemConfig,
    initializeResources,
    refreshChunkingConfigs,
    refreshModelConfigs,
    refreshVectorConfig,
    refreshSystemConfig,
    isResourceLoaded
  } = useGlobalResourceStore();

  const resources = [
    {
      name: '切分配置',
      key: '切分配置',
      data: chunkingConfigs,
      count: chunkingConfigs.length,
      default: defaultChunkingConfig?.name,
      refresh: refreshChunkingConfigs
    },
    {
      name: '模型配置',
      key: '模型配置',
      data: modelConfigs,
      count: modelConfigs.length,
      details: `${embeddingModels.length} 个嵌入模型, ${chatModels.length} 个对话模型`,
      refresh: refreshModelConfigs
    },
    {
      name: '向量配置',
      key: '向量配置',
      data: vectorConfig,
      count: vectorConfig ? 1 : 0,
      details: vectorConfig ? `策略: ${vectorConfig.strategy}, 模型: ${vectorConfig.model}` : '未加载',
      refresh: refreshVectorConfig
    },
    {
      name: '系统配置',
      key: '系统配置',
      data: systemConfig,
      count: systemConfig ? Object.keys(systemConfig.sections || {}).length : 0,
      details: systemConfig ? `${Object.keys(systemConfig.sections || {}).length} 个配置节` : '未加载',
      refresh: refreshSystemConfig
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>全局资源管理测试页面</Title>
        <Text type="secondary">
          此页面用于测试和监控全局资源的加载状态。系统启动时会自动预加载这些资源，提升用户体验。
        </Text>
      </div>

      {/* 总体状态 */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>系统状态</Title>
        <ResourceStatusIndicator showDetails />
        
        <Descriptions column={3} style={{ marginTop: '16px' }}>
          <Descriptions.Item label="初始化状态">
            {isInitialized ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
            ) : (
              <Tag color="processing">未完成</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="加载状态">
            {isLoading ? (
              <Tag color="processing">加载中</Tag>
            ) : (
              <Tag color="default">空闲</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="错误数量">
            {Object.keys(loadErrors).length > 0 ? (
              <Tag color="error">{Object.keys(loadErrors).length}</Tag>
            ) : (
              <Tag color="success">0</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: '16px' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={initializeResources}
            loading={isLoading}
          >
            重新初始化所有资源
          </Button>
        </div>
      </Card>

      {/* 资源详情 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {resources.map(resource => {
          const isLoaded = isResourceLoaded(resource.key);
          const hasError = loadErrors[resource.key];
          
          return (
            <Card
              key={resource.key}
              title={
                <Space>
                  {resource.name}
                  {hasError ? (
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  ) : isLoaded ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <Tag>未加载</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={resource.refresh}
                  loading={isLoading}
                >
                  刷新
                </Button>
              }
              style={{
                borderColor: hasError ? '#ff4d4f' : isLoaded ? '#52c41a' : '#d9d9d9'
              }}
            >
              {hasError && (
                <Alert
                  message="加载失败"
                  description={hasError}
                  type="error"
                  size="small"
                  style={{ marginBottom: '12px' }}
                />
              )}
              
              <Descriptions column={1} size="small">
                <Descriptions.Item label="数量">
                  <Tag>{resource.count}</Tag>
                </Descriptions.Item>
                {resource.default && (
                  <Descriptions.Item label="默认项">
                    {resource.default}
                  </Descriptions.Item>
                )}
                {resource.details && (
                  <Descriptions.Item label="详情">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {resource.details}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* 显示部分数据内容 */}
              {isLoaded && resource.data && (
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ fontSize: '12px' }}>数据预览:</Text>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginTop: '4px',
                    maxHeight: '100px',
                    overflow: 'auto'
                  }}>
                    <pre style={{ 
                      fontSize: '10px', 
                      margin: 0, 
                      fontFamily: 'Monaco, Consolas, monospace' 
                    }}>
                      {Array.isArray(resource.data) 
                        ? JSON.stringify(resource.data.slice(0, 2), null, 2)
                        : JSON.stringify(resource.data, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 性能信息 */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>性能信息</Title>
        <Text type="secondary">
          通过在系统启动时预加载这些资源，避免了用户在使用特定功能时的等待时间。
          切分配置、模型配置等资源会在后台静默加载，提升整体用户体验。
        </Text>
        
        <div style={{ marginTop: '16px' }}>
          <Tag color="blue">预加载策略</Tag>
          <Tag color="green">静默加载</Tag>
          <Tag color="orange">错误降级</Tag>
          <Tag color="purple">缓存机制</Tag>
        </div>
      </Card>
    </div>
  );
};

export default ResourceTestPage;