/**
 * 资源状态指示器 - 显示全局资源的加载状态
 */
import React from 'react';
import { Alert, Space, Tag, Tooltip, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LoadingOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';

interface ResourceStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

const ResourceStatusIndicator: React.FC<ResourceStatusIndicatorProps> = ({
  compact = false,
  showDetails = false
}) => {
  const {
    isInitialized,
    isLoading,
    loadErrors,
    isResourceLoaded,
    initializeResources
  } = useGlobalResourceStore();

  // 资源列表
  const resources = [
    { key: '切分配置', name: '切分配置' },
    { key: '模型配置', name: '模型配置' },
    { key: '向量配置', name: '向量配置' },
    { key: '系统配置', name: '系统配置' }
  ];

  const loadedCount = resources.filter(r => isResourceLoaded(r.key)).length;
  const errorCount = Object.keys(loadErrors).length;
  const hasErrors = errorCount > 0;

  // 如果已完全初始化且无错误，不显示指示器
  if (isInitialized && !hasErrors && compact) {
    return null;
  }

  // 如果没有错误且不在加载中，返回空占位元素（简单模式）
  if (!hasErrors && !isLoading && !compact) {
    return <div style={{ width: '100%', height: '0' }} />;
  }

  // 紧凑模式
  if (compact) {
    return (
      <div style={{ padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px' }}>
        <Space size="small">
          {isLoading ? (
            <>
              <LoadingOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#000000' }}>资源加载中...</span>
            </>
          ) : hasErrors ? (
            <>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ fontSize: '12px', color: '#000000' }}>部分资源加载失败</span>
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                onClick={initializeResources}
                style={{ padding: 0, fontSize: '12px', color: '#000000' }}
              >
                重试
              </Button>
            </>
          ) : (
            <>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontSize: '12px', color: '#000000' }}>资源就绪</span>
            </>
          )}
        </Space>
      </div>
    );
  }

  // 详细模式
  if (showDetails) {
    return (
      <div style={{ marginBottom: '16px', width: '100%' }}>
        {hasErrors && (
          <Alert
            message="部分资源加载失败"
            description={
              <div>
                <div style={{ marginBottom: '8px' }}>
                  以下资源加载遇到问题，可能影响相关功能：
                </div>
                {Object.entries(loadErrors).map(([resource, error]) => (
                  <div key={resource} style={{ marginBottom: '4px' }}>
                    <Tag color="error">{resource}</Tag>
                    <span style={{ fontSize: '12px', color: '#666' }}>{error}</span>
                  </div>
                ))}
                <div style={{ marginTop: '8px' }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={initializeResources}
                    loading={isLoading}
                  >
                    重新加载
                  </Button>
                </div>
              </div>
            }
            type="warning"
            showIcon
            closable
            style={{ width: '100%' }}
          />
        )}

        {isLoading && (
          <Alert
            message="资源加载中"
            description={
              <Space>
                <span>正在加载系统资源，请稍候...</span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  ({loadedCount}/{resources.length})
                </span>
              </Space>
            }
            type="info"
            showIcon
            icon={<LoadingOutlined />}
            style={{ width: '100%' }}
          />
        )}

        {/* 资源状态详情 */}
        <Space wrap style={{ marginTop: hasErrors || isLoading ? '8px' : '0' }}>
          {resources.map(resource => {
            const isLoaded = isResourceLoaded(resource.key);
            const hasError = loadErrors[resource.key];
            
            return (
              <Tooltip
                key={resource.key}
                title={hasError ? `错误: ${hasError}` : isLoaded ? '已加载' : '加载中...'}
              >
                <Tag
                  color={hasError ? 'error' : isLoaded ? 'success' : 'processing'}
                  icon={
                    hasError ? (
                      <ExclamationCircleOutlined />
                    ) : isLoaded ? (
                      <CheckCircleOutlined />
                    ) : (
                      <LoadingOutlined />
                    )
                  }
                >
                  {resource.name}
                </Tag>
              </Tooltip>
            );
          })}
        </Space>
      </div>
    );
  }

  // 简单模式（默认）
  return (
    <div style={{ marginBottom: '8px', width: '100%' }}>
      {hasErrors ? (
        <Alert
          message={`${errorCount} 个资源加载失败，部分功能可能受限`}
          type="warning"
          showIcon
          action={
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={initializeResources}
              loading={isLoading}
            >
              重试
            </Button>
          }
          closable
          style={{ width: '100%' }}
        />
      ) : isLoading ? (
        <Alert
          message={`资源加载中 (${loadedCount}/${resources.length})`}
          type="info"
          showIcon
          icon={<LoadingOutlined />}
          style={{ width: '100%' }}
        />
      ) : null}
    </div>
  );
};

export default ResourceStatusIndicator;