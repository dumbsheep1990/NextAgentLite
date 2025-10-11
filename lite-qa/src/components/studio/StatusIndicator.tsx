import React from 'react';
import { LoadingOutlined, CheckCircleOutlined, SyncOutlined, SearchOutlined, BulbOutlined } from '@ant-design/icons';
import './StatusIndicator.css';

export type StatusType = 'processing' | 'retrieving' | 'thinking' | 'answering' | 'done';

interface StatusIndicatorProps {
  content: string;
  status?: StatusType;
  timestamp?: number;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ content, status = 'processing', timestamp }) => {
  const getIcon = () => {
    switch (status) {
      case 'retrieving':
        return <SearchOutlined spin className="status-icon retrieving" />;
      case 'thinking':
        return <BulbOutlined className="status-icon thinking" />;
      case 'answering':
        return <SyncOutlined spin className="status-icon answering" />;
      case 'done':
        return <CheckCircleOutlined className="status-icon done" />;
      default:
        return <LoadingOutlined spin className="status-icon processing" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'retrieving':
        return '检索中';
      case 'thinking':
        return '思考中';
      case 'answering':
        return '回答中';
      case 'done':
        return '完成';
      default:
        return '处理中';
    }
  };

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  // 简化内容显示：只显示第一行或使用默认状态文本
  const displayContent = content && content.trim()
    ? content.split('\n')[0]
    : getStatusText();

  return (
    <div className={`status-indicator ${status}`}>
      <div className="status-content">
        <div className="status-header">
          {getIcon()}
          <span className="status-label">{getStatusText()}</span>
        </div>
        {displayContent && (
          <span className="status-message">{displayContent}</span>
        )}
        {timeStr && (
          <span className="status-time">{timeStr}</span>
        )}
      </div>
      <div className={`status-progress ${status}`}>
        <div className="status-progress-bar"></div>
      </div>
    </div>
  );
};

export default StatusIndicator;