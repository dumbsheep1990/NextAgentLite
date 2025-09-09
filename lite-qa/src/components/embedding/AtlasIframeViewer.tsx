/**
 * Atlas iframe嵌入查看器
 * 直接嵌入原生Apple Embedding Atlas前端界面
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Spin, 
  Alert, 
  Space, 
  Button,
  message,
  Typography,
  Row,
  Col,
  Modal,
  Tooltip
} from 'antd';
import { 
  BarChartOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface AtlasIframeViewerProps {
  className?: string;
  height?: string | number;
  fullscreen?: boolean;
}

export const AtlasIframeViewer: React.FC<AtlasIframeViewerProps> = ({ 
  className = '',
  height = '800px',
  fullscreen = false
}) => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atlasUrl, setAtlasUrl] = useState<string>('http://localhost:8080');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 检查Atlas服务器连接状态
  const checkAtlasConnection = async (url: string = atlasUrl) => {
    setConnectionStatus('checking');
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // 避免CORS问题
      });
      setConnectionStatus('connected');
      setError(null);
      return true;
    } catch (err) {
      console.warn('Atlas连接检查失败:', err);
      setConnectionStatus('disconnected');
      setError('无法连接到Atlas服务器，请确保服务器正在运行');
      return false;
    }
  };

  // 重新加载iframe
  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setLoading(true);
    }
  };

  // iframe加载完成处理
  const handleIframeLoad = () => {
    console.log('Atlas iframe loaded successfully');
    setTimeout(() => {
      setLoading(false);
      setConnectionStatus('connected');
      setError(null);
    }, 1000); // 给Atlas一点时间完全渲染
  };

  // iframe加载错误处理
  const handleIframeError = () => {
    setLoading(false);
    setConnectionStatus('disconnected');
    setError('Atlas界面加载失败，请检查服务器状态');
    message.error('Atlas界面加载失败');
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 组件初始化
  useEffect(() => {
    let mounted = true;
    
    const initCheck = async () => {
      const connected = await checkAtlasConnection();
      if (mounted && connected) {
        setLoading(true);
      }
    };

    initCheck();
    
    // 备用计时器，如果iframe事件没触发，5秒后自动隐藏loading
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        console.log('Fallback: hiding loading overlay after 5 seconds');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [atlasUrl]);

  // 渲染连接状态指示器
  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: '#faad14', text: '检查中...', icon: <Spin size="small" /> },
      connected: { color: '#52c41a', text: '已连接', icon: null },
      disconnected: { color: '#ff4d4f', text: '未连接', icon: <ExclamationCircleOutlined /> }
    };

    const config = statusConfig[connectionStatus];
    
    return (
      <div className="flex items-center space-x-2">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: config.color }}
        />
        {config.icon}
        <Text style={{ color: config.color, fontSize: '12px' }}>
          {config.text}
        </Text>
      </div>
    );
  };

  // 渲染错误状态
  if (error && connectionStatus === 'disconnected') {
    return (
      <div className={`atlas-iframe-viewer ${className}`}>
        <Card>
          <Alert
            message="Atlas服务器连接失败"
            description={
              <div>
                <div className="mb-3">{error}</div>
                <div className="text-sm space-y-1">
                  <div><strong>解决方案:</strong></div>
                  <div>1. 确保Atlas服务器正在运行在: <code>{atlasUrl}</code></div>
                  <div>2. 在项目根目录运行命令启动Atlas:</div>
                  <div className="bg-gray-100 p-2 rounded mt-2 font-mono text-xs">
                    cd embedding-atlas/packages/viewer/dist<br/>
                    python3 -m http.server 8080
                  </div>
                  <div>3. 或者修改Atlas服务器地址</div>
                </div>
              </div>
            }
            type="error"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={() => setShowSettings(true)}>
                  设置
                </Button>
                <Button type="primary" size="small" onClick={() => checkAtlasConnection()}>
                  重新连接
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  // 全屏模式
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {/* 全屏工具栏 */}
          <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
            <Space>
              <BarChartOutlined />
              <Text strong>Atlas 向量可视化 - 全屏模式</Text>
              {renderConnectionStatus()}
            </Space>
            <Space>
              <Button size="small" onClick={reloadIframe} icon={<ReloadOutlined />}>
                刷新
              </Button>
              <Button size="small" onClick={toggleFullscreen}>
                退出全屏
              </Button>
            </Space>
          </div>
          
          {/* 全屏iframe */}
          <div className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <Space direction="vertical" align="center">
                  <Spin size="large" />
                  <Text>正在加载Atlas可视化界面...</Text>
                </Space>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={atlasUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Apple Embedding Atlas Visualization"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </div>
      </div>
    );
  }

  // 检查是否使用全屏模式（通过className判断）
  const isFullscreenMode = fullscreen || className.includes('atlas-fullscreen');

  // 全屏模式渲染
  if (isFullscreenMode) {
    return (
      <div className={`atlas-iframe-viewer-fullscreen ${className}`} style={{ 
        width: '100%', 
        height: typeof height === 'number' ? height + 'px' : height, 
        position: 'relative' 
      }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <Space direction="vertical" align="center">
              <Spin size="large" />
              <div className="text-center">
                <Title level={4}>正在加载Atlas可视化界面...</Title>
                <Text type="secondary">
                  首次加载可能需要几秒钟，请耐心等待...
                </Text>
              </div>
            </Space>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={atlasUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Apple Embedding Atlas Visualization"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />

        {/* 设置模态框 */}
        <Modal
          title="Atlas服务器设置"
          open={showSettings}
          onCancel={() => setShowSettings(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowSettings(false)}>
              取消
            </Button>,
            <Button 
              key="test" 
              onClick={() => checkAtlasConnection(atlasUrl)}
              loading={connectionStatus === 'checking'}
            >
              测试连接
            </Button>,
            <Button 
              key="save" 
              type="primary"
              onClick={() => {
                setShowSettings(false);
                reloadIframe();
              }}
            >
              保存并刷新
            </Button>
          ]}
          width={600}
        >
          <Space direction="vertical" className="w-full" size="large">
            <Alert
              message="Atlas服务器配置"
              description="请确保Atlas服务器正在运行并且可以访问"
              type="info"
              showIcon
            />
            
            <div>
              <Text strong>服务器地址:</Text>
              <div className="mt-2">
                <input
                  type="text"
                  value={atlasUrl}
                  onChange={(e) => setAtlasUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="http://localhost:8080"
                />
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                默认地址: http://localhost:8080
              </Text>
            </div>

            <div>
              <Text strong>启动说明:</Text>
              <div className="mt-2 text-sm space-y-2">
                <div>1. 在项目根目录进入Atlas目录:</div>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  cd embedding-atlas/packages/viewer/dist
                </div>
                <div>2. 启动HTTP服务器:</div>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  python3 -m http.server 8080
                </div>
                <div>3. 或者使用Node.js:</div>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  npx serve -s . -l 8080
                </div>
              </div>
            </div>
          </Space>
        </Modal>
      </div>
    );
  }

  // 正常模式
  return (
    <div className={`atlas-iframe-viewer ${className}`}>
      <Card 
        className="h-full"
        bodyStyle={{ height: `calc(${typeof height === 'number' ? height + 'px' : height} - 57px)`, padding: 0 }}
        title={
          <Space>
            <BarChartOutlined />
            Atlas 向量可视化
            {renderConnectionStatus()}
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="设置Atlas服务器地址">
              <Button 
                size="small" 
                icon={<SettingOutlined />}
                onClick={() => setShowSettings(true)}
              />
            </Tooltip>
            <Tooltip title="刷新界面">
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={reloadIframe}
              />
            </Tooltip>
            <Tooltip title="全屏显示">
              <Button 
                size="small" 
                icon={<FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        }
      >
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <Space direction="vertical" align="center">
                <Spin size="large" />
                <div className="text-center">
                  <Title level={4}>正在加载Atlas可视化界面...</Title>
                  <Text type="secondary">
                    首次加载可能需要几秒钟，请耐心等待...
                  </Text>
                </div>
              </Space>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={atlasUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Apple Embedding Atlas Visualization"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </Card>

      {/* 设置模态框 */}
      <Modal
        title="Atlas服务器设置"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSettings(false)}>
            取消
          </Button>,
          <Button 
            key="test" 
            onClick={() => checkAtlasConnection(atlasUrl)}
            loading={connectionStatus === 'checking'}
          >
            测试连接
          </Button>,
          <Button 
            key="save" 
            type="primary"
            onClick={() => {
              setShowSettings(false);
              reloadIframe();
            }}
          >
            保存并刷新
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" className="w-full" size="large">
          <Alert
            message="Atlas服务器配置"
            description="请确保Atlas服务器正在运行并且可以访问"
            type="info"
            showIcon
          />
          
          <div>
            <Text strong>服务器地址:</Text>
            <div className="mt-2">
              <input
                type="text"
                value={atlasUrl}
                onChange={(e) => setAtlasUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="http://localhost:8080"
              />
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              默认地址: http://localhost:8080
            </Text>
          </div>

          <div>
            <Text strong>启动说明:</Text>
            <div className="mt-2 text-sm space-y-2">
              <div>1. 在项目根目录进入Atlas目录:</div>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                cd embedding-atlas/packages/viewer/dist
              </div>
              <div>2. 启动HTTP服务器:</div>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                python3 -m http.server 8080
              </div>
              <div>3. 或者使用Node.js:</div>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                npx serve -s . -l 8080
              </div>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
};