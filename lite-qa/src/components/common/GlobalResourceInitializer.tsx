/**
 * 全局资源初始化组件 - 在应用启动时预加载所有公共资源
 */
import React, { useEffect, useState } from 'react';
import { Spin, Alert, Progress, Space, Typography, Button } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';

const { Text, Title } = Typography;

interface GlobalResourceInitializerProps {
  children: React.ReactNode;
  showLoadingScreen?: boolean;
}

const GlobalResourceInitializer: React.FC<GlobalResourceInitializerProps> = ({
  children,
  showLoadingScreen = true
}) => {
  const {
    isInitialized,
    isLoading,
    loadErrors,
    initializeResources,
    isResourceLoaded
  } = useGlobalResourceStore();

  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 资源列表
  const resources = [
    { key: '切分配置', name: '切分配置', description: '文档分块策略配置' },
    { key: '模型配置', name: '模型配置', description: 'AI模型和向量模型配置' },
    { key: '向量配置', name: '向量配置', description: '向量化参数配置' },
    { key: '系统配置', name: '系统配置', description: '系统全局设置' }
  ];

  // 计算加载进度
  const loadedCount = resources.filter(resource => isResourceLoaded(resource.key)).length;
  const totalCount = resources.length;
  const progress = Math.round((loadedCount / totalCount) * 100);

  // 组件挂载时初始化资源
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeResources();
    }
  }, [isInitialized, isLoading, initializeResources]);

  // 重试初始化
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await initializeResources();
  };

  // 如果已初始化且没有错误，直接显示子组件
  if (isInitialized && Object.keys(loadErrors).length === 0) {
    return <>{children}</>;
  }
  
  // 如果已初始化但有错误，且不显示加载屏幕，也直接显示子组件
  if (isInitialized && !showLoadingScreen) {
    return <>{children}</>;
  }

  // 如果不显示加载屏幕且还在加载，显示子组件（静默加载）
  if (!showLoadingScreen && isLoading) {
    return <>{children}</>;
  }

  // 显示加载屏幕
  if (isLoading || !isInitialized) {
    const hasErrors = Object.keys(loadErrors).length > 0;
    const canRetry = hasErrors && !isLoading;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '48px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Logo和标题 */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(to right, #3b82f6, #10b981)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              MAT
            </div>
            <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
              NextAgentLite智能问答系统
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              正在初始化系统资源...
            </Text>
          </div>

          {/* 进度条 */}
          <div style={{ marginBottom: '24px' }}>
            <Progress
              percent={progress}
              status={hasErrors ? 'exception' : isLoading ? 'active' : 'success'}
              strokeColor={{
                '0%': '#3b82f6',
                '100%': '#10b981'
              }}
              format={() => `${loadedCount}/${totalCount}`}
            />
            {isLoading && (
              <div style={{ marginTop: '8px' }}>
                <Spin size="small" />
                <Text style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                  加载中...
                </Text>
              </div>
            )}
          </div>

          {/* 资源加载状态 */}
          {showDetails && (
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {resources.map(resource => {
                  const isLoaded = isResourceLoaded(resource.key);
                  const hasError = loadErrors[resource.key];
                  
                  return (
                    <div
                      key={resource.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: hasError ? '#fef2f2' : isLoaded ? '#f0f9ff' : '#f9fafb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <Text strong>{resource.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {resource.description}
                        </Text>
                      </div>
                      <div>
                        {hasError ? (
                          <ExclamationCircleOutlined style={{ color: '#dc2626' }} />
                        ) : isLoaded ? (
                          <CheckCircleOutlined style={{ color: '#059669' }} />
                        ) : (
                          <Spin size="small" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </Space>
            </div>
          )}

          {/* 错误信息 */}
          {hasErrors && (
            <div style={{ marginBottom: '24px' }}>
              <Alert
                message="部分资源加载失败"
                description={
                  <div>
                    {Object.entries(loadErrors).map(([resource, error]) => (
                      <div key={resource} style={{ marginBottom: '4px' }}>
                        <Text code style={{ fontSize: '11px' }}>
                          {resource}: {error}
                        </Text>
                      </div>
                    ))}
                  </div>
                }
                type="warning"
                showIcon
                style={{ textAlign: 'left', fontSize: '12px' }}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '隐藏详情' : '显示详情'}
            </Button>
            
            {canRetry && (
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                disabled={isLoading}
              >
                重试 {retryCount > 0 && `(${retryCount})`}
              </Button>
            )}
            
            {hasErrors && (
              <Button
                type="default"
                size="small"
                onClick={() => {
                  // 即使有错误也继续进入应用
                  useGlobalResourceStore.setState({ isInitialized: true });
                }}
              >
                继续使用
              </Button>
            )}
          </Space>

          {/* 提示信息 */}
          <div style={{ marginTop: '16px' }}>
            <Text
              type="secondary"
              style={{ fontSize: '11px', lineHeight: '1.4' }}
            >
              {isLoading 
                ? '首次启动可能需要较长时间，请耐心等待...'
                : hasErrors
                ? '部分功能可能受限，建议检查网络连接后重试'
                : '系统已准备就绪'
              }
            </Text>
          </div>
        </div>
      </div>
    );
  }

  // 初始化完成，显示子组件
  return <>{children}</>;
};

export default GlobalResourceInitializer;