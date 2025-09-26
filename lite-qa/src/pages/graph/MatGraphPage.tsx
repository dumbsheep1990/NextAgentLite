import React, { useState, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getMatGraphHealthUrl, getMatGraphWebUIUrl } from '../../config/appConfig';

/**
 * 知识图谱页面
 * 直接通过iframe嵌入9622端口服务，像测试页面一样简单直接
 */
const MatGraphPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 检查服务可用性
  const checkServiceAvailability = async (): Promise<boolean> => {
    try {
      // 使用配置化的健康检查URL
      const healthUrl = getMatGraphHealthUrl();
      console.log('🏥 检查知识图谱健康状态:', healthUrl);
      const response = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      console.log('Health check failed, trying webui endpoint:', error);
      // 如果health失败，直接返回true让iframe尝试加载
      // iframe可以处理自己的错误状态
      return true;
    }
  };

  // 初始检查和重试逻辑
  useEffect(() => {
    const checkAndLoad = async () => {
      setLoading(true);
      setError(false);
      
      const isAvailable = await checkServiceAvailability();
      
      if (isAvailable) {
        setError(false);
        // 延迟一下再隐藏loading，确保iframe有时间加载
        setTimeout(() => setLoading(false), 1000);
      } else {
        setError(true);
        setLoading(false);
      }
    };

    checkAndLoad();
  }, [refreshKey, retryCount]);

  // 重试功能
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRefreshKey(Date.now());
  };

  // iframe加载成功处理
  const handleIframeLoad = () => {
    const iframeUrl = getMatGraphWebUIUrl({ t: refreshKey, r: Math.random() });
    console.log('知识图谱 iframe 加载完成，URL:', iframeUrl);
    setLoading(false);
    setError(false);
  };

  // iframe加载错误处理
  const handleIframeError = () => {
    console.error('知识图谱 iframe 加载失败');
    setLoading(false);
    setError(true);
  };

  // 错误页面组件
  const ErrorPage = () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 主要内容 */}
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e9ecef'
      }}>
        {/* 图标 */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: '#fff5f5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #fed7d7'
        }}>
          <ExclamationCircleOutlined style={{ 
            fontSize: '32px', 
            color: '#e53e3e'
          }} />
        </div>

        {/* 标题 */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          margin: '0 0 12px 0',
          color: '#1a202c'
        }}>
          知识图谱服务不可达
        </h1>

        {/* 描述 */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.5',
          margin: '0 0 8px 0',
          color: '#4a5568'
        }}>
          无法连接到知识图谱服务
        </p>
        
        <p style={{
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 0 32px 0',
          color: '#718096'
        }}>
          请确保服务已启动并运行在 {getMatGraphHealthUrl().replace('/health', '')}
        </p>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            style={{
              height: '40px',
              padding: '0 20px',
              fontSize: '14px',
              borderRadius: '8px',
              background: '#000',
              border: 'none',
              color: 'white',
              fontWeight: '500'
            }}
          >
            重试连接
          </Button>
        </div>

        {/* 重试次数显示 */}
        {retryCount > 0 && (
          <p style={{
            fontSize: '12px',
            margin: '20px 0 0 0',
            color: '#9ca3af'
          }}>
            已重试 {retryCount} 次
          </p>
        )}
      </div>
    </div>
  );

  // 加载页面组件
  const LoadingPage = () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa'
    }}>
      <Spin size="large" style={{ marginBottom: '16px' }} />
      <h2 style={{ 
        fontSize: '16px', 
        fontWeight: '500', 
        margin: 0,
        color: '#4a5568'
      }}>
        正在加载知识图谱系统...
      </h2>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 错误页面 */}
      {error && <ErrorPage />}
      
      {/* 加载页面 */}
      {loading && !error && <LoadingPage />}
      
      {/* 知识图谱 iframe */}
      {!error && (
        (() => {
          const src = getMatGraphWebUIUrl({ tab: 'knowledge-graph', embed: 1, t: refreshKey, r: Math.random() });
          console.log('[MatGraphPage] iframe src =', src);
          return (
        <iframe
          key={refreshKey}
          src={src}
          className="w-full h-full border-0"
          title="知识图谱系统"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-fullscreen allow-presentation"
          allowFullScreen
          webkitAllowFullScreen
          mozAllowFullScreen
          allow="fullscreen; picture-in-picture"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            overflow: 'hidden',
            display: loading ? 'none' : 'block'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />)
        })()
      )}
    </div>
  );
};

export default MatGraphPage;
