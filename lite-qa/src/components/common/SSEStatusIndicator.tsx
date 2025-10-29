/**
 * SSE连接状态指示器
 * 显示在页面右下角，仅提供连接状态信息
 */

import React, { useState, useEffect } from 'react';
import { Button, Popover, Space, Typography } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  LoadingOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { documentStatusSSE } from '../../services/sseService';

const { Text } = Typography;

interface SSEStatusIndicatorProps {
  sessionId: string;
}

export const SSEStatusIndicator: React.FC<SSEStatusIndicatorProps> = React.memo(({ sessionId }) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastConnectTime, setLastConnectTime] = useState<string>('');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [heartbeatCount, setHeartbeatCount] = useState<number>(0);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<string>('');
  const [teamSSEStatus, setTeamSSEStatus] = useState<'disconnected' | 'connected' | 'timeout'>('disconnected');

  // 手动重连
  const handleReconnect = () => {
    console.log('📡 [SSEStatusIndicator] 用户手动触发重连');
    setReconnectAttempts(prev => prev + 1);
    setConnectionStatus('connecting');
    // 使用强制重连
    documentStatusSSE.forceReconnect(sessionId);
  };

  // 初始化状态检查 - 只在组件挂载时执行一次
  // 🔥🔥🔥 核心修复：SSEStatusIndicator 只负责显示状态，不管理连接！
  // SSEConnectionManager 在 Layout.tsx 全局挂载，负责管理连接
  useEffect(() => {
    console.log('📡 [SSEStatusIndicator] 组件挂载, sessionId=', sessionId);

    // 🔥 只检查并同步当前连接状态，不做任何连接操作
    if (documentStatusSSE.isConnected()) {
      console.log('📡 [SSEStatusIndicator] 检测到现有连接，同步UI状态为已连接');
      setConnectionStatus('connected');
      setLastConnectTime(new Date().toLocaleTimeString());
      setReconnectAttempts(0);
    } else {
      console.log('📡 [SSEStatusIndicator] 当前无连接，同步UI状态为未连接');
      setConnectionStatus('disconnected');
    }

    // 🔥 清理函数：组件卸载时只清理UI状态，不断开连接
    return () => {
      console.log('📡 [SSEStatusIndicator] 组件卸载，保持连接不断开');
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 监听SSE连接状态事件
  useEffect(() => {
    const handleSSEMessage = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📡 SSEStatusIndicator收到SSE消息:', data);

      if (data.type === 'connection_established') {
        console.log('📡 SSEStatusIndicator: 收到连接建立事件');
        setConnectionStatus('connected');
        setLastConnectTime(new Date().toLocaleTimeString());
        setReconnectAttempts(0);
      }

      // 🔥 处理心跳消息
      if (data.type === 'heartbeat') {
        setHeartbeatCount(prev => prev + 1);
        setLastHeartbeatTime(new Date().toLocaleTimeString());
        setTeamSSEStatus('connected');
        console.debug('📡 SSEStatusIndicator收到心跳:', data.data?.message);
      }
    };

    // 🔥 监听Team服务的心跳超时事件
    const handleTeamHeartbeatTimeout = () => {
      console.warn('📡 SSEStatusIndicator: Team服务心跳超时');
      setTeamSSEStatus('timeout');
      if (connectionStatus === 'connected') {
        setConnectionStatus('error');
      }
    };

    // 🔥 监听Team服务连接状态
    const handleTeamConnectionStatus = (event: CustomEvent) => {
      const { type, detail } = event;
      console.log('📡 SSEStatusIndicator收到Team连接状态:', detail);

      if (detail.includes && detail.includes('心跳超时')) {
        handleTeamHeartbeatTimeout();
      } else if (detail.includes && detail.includes('连接可能已断开')) {
        setTeamSSEStatus('disconnected');
        if (connectionStatus === 'connected') {
          setConnectionStatus('error');
        }
      }
    };

    const handleConnectionStatus = (event: CustomEvent) => {
      const { status, connectionTime, attempt } = event.detail;
      console.log('📡 SSEStatusIndicator收到连接状态变化:', status, event.detail);

      switch (status) {
        case 'connected':
          console.log('📡 SSEStatusIndicator: 状态更新为已连接');
          setConnectionStatus('connected');
          setLastConnectTime(connectionTime || new Date().toLocaleTimeString());
          setReconnectAttempts(0);
          break;
        case 'connecting':
        case 'reconnecting':
          console.log('📡 SSEStatusIndicator: 状态更新为连接中');
          setConnectionStatus('connecting');
          if (attempt) {
            setReconnectAttempts(attempt);
          }
          break;
        case 'error':
        case 'timeout':
        case 'max_retries_reached':
          console.log('📡 SSEStatusIndicator: 状态更新为错误');
          setConnectionStatus('error');
          break;
        case 'disconnected':
          console.log('📡 SSEStatusIndicator: 状态更新为断开');
          setConnectionStatus('disconnected');
          break;
        default:
          console.log('📡 SSEStatusIndicator: 未知状态，检查实际连接状态');
          // 对于未知状态，检查实际连接状态
          if (documentStatusSSE.isConnected()) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('disconnected');
          }
      }
    };

    // 注册事件监听器
    window.addEventListener('sse-message', handleSSEMessage as EventListener);
    window.addEventListener('sse-connection-status', handleConnectionStatus as EventListener);

    // 🔥 监听console错误以检测Team服务心跳问题
    const originalConsoleError = console.error;
    const consoleErrorHandler = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[TEAM_SERVICE] 心跳超时')) {
        handleTeamHeartbeatTimeout();
      }
      return originalConsoleError.apply(console, args);
    };
    console.error = consoleErrorHandler;

    return () => {
      window.removeEventListener('sse-message', handleSSEMessage as EventListener);
      window.removeEventListener('sse-connection-status', handleConnectionStatus as EventListener);
      // 恢复原始console.error
      console.error = originalConsoleError;
    };
  }, [connectionStatus]); // 只依赖connectionStatus

  // 定期检查连接状态（降低频率，主要依赖事件）
  useEffect(() => {
    const checkConnectionStatus = () => {
      const state = documentStatusSSE.getConnectionState();
      const isConnected = documentStatusSSE.isConnected();
      
      console.log('📡 SSEStatusIndicator定期检查: 连接状态=', state, '是否连接=', isConnected, '当前UI状态=', connectionStatus);
      
      // 只在状态不一致时更新
      switch (state) {
        case EventSource.OPEN:
          if (connectionStatus !== 'connected' && isConnected) {
            console.log('📡 SSEStatusIndicator: 定期检查发现连接已建立，更新UI状态');
            setConnectionStatus('connected');
            setLastConnectTime(new Date().toLocaleTimeString());
          }
          break;
        case EventSource.CONNECTING:
          if (connectionStatus !== 'connecting') {
            console.log('📡 SSEStatusIndicator: 定期检查发现正在连接，更新UI状态');
            setConnectionStatus('connecting');
          }
          break;
        case EventSource.CLOSED:
          if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
            console.log('📡 SSEStatusIndicator: 定期检查发现连接已断开，更新UI状态');
            setConnectionStatus('disconnected');
          }
          break;
      }
    };

    // 降低检查频率到30秒，主要依赖事件驱动，减少频繁检查
    const interval = setInterval(checkConnectionStatus, 30000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // 获取状态图标和颜色
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <WifiOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a',
          status: 'success' as const,
          text: '已连接',
          description: '实时推送正常'
        };
      case 'connecting':
        return {
          icon: <LoadingOutlined spin style={{ color: '#1890ff' }} />,
          color: '#1890ff',
          status: 'processing' as const,
          text: '连接中',
          description: '正在建立连接...'
        };
      case 'error':
        return {
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
          color: '#ff4d4f',
          status: 'error' as const,
          text: teamSSEStatus === 'timeout' ? '心跳超时' : '连接失败',
          description: teamSSEStatus === 'timeout' ? 'Team服务心跳超时，连接可能中断' : '连接异常，可手动重试'
        };
      default:
        return {
          icon: <DisconnectOutlined style={{ color: '#d9d9d9' }} />,
          color: '#d9d9d9',
          status: 'default' as const,
          text: '未连接',
          description: '实时推送未连接'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Popover内容
  const popoverContent = (
    <div style={{ width: 280 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>实时推送状态</Text>
        </div>
        
        <div>
          <Text type="secondary">状态:</Text>
          <Space>
            {statusConfig.icon}
            <Text>{statusConfig.text}</Text>
          </Space>
        </div>
        
        {lastConnectTime && (
          <div>
            <Text type="secondary">最后连接:</Text>
            <Text>{lastConnectTime}</Text>
          </div>
        )}
        
        {reconnectAttempts > 0 && (
          <div>
            <Text type="secondary">重连次数:</Text>
            <Text>{reconnectAttempts}</Text>
          </div>
        )}
        
        {heartbeatCount > 0 && (
          <div>
            <Text type="secondary">心跳计数:</Text>
            <Text>{heartbeatCount}</Text>
          </div>
        )}
        
        {lastHeartbeatTime && (
          <div>
            <Text type="secondary">最后心跳:</Text>
            <Text>{lastHeartbeatTime}</Text>
          </div>
        )}
        
        {teamSSEStatus !== 'disconnected' && (
          <div>
            <Text type="secondary">Team连接:</Text>
            <Text style={{ 
              color: teamSSEStatus === 'connected' ? '#52c41a' : 
                     teamSSEStatus === 'timeout' ? '#ff4d4f' : '#d9d9d9' 
            }}>
              {teamSSEStatus === 'connected' ? '正常' : 
               teamSSEStatus === 'timeout' ? '心跳超时' : '断开'}
            </Text>
          </div>
        )}
        
        <div style={{ marginTop: 12 }}>
          <Button 
            type="primary" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleReconnect}
            loading={connectionStatus === 'connecting'}
          >
            手动重连
          </Button>
        </div>
      </Space>
    </div>
  );

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 100,
      }}
    >
      <Popover
        content={popoverContent}
        title={null}
        placement="topRight"
        open={isPopoverVisible}
        onOpenChange={setIsPopoverVisible}
        trigger="click"
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${statusConfig.color}`,
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            minWidth: 80,
            textAlign: 'center'
          }}
          className="hover:shadow-lg"
        >
          <Space>
            {statusConfig.icon}
            <Text style={{ fontSize: 12, color: statusConfig.color }}>
              {statusConfig.text}
            </Text>
          </Space>
        </div>
      </Popover>
    </div>
  );
});