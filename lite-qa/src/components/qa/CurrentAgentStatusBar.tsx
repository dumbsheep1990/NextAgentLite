/**
 * 当前执行Agent状态栏组件 - 显示正在执行的Agent信息
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Typography,
  Space,
  Progress,
  Avatar,
  Tooltip,
  Badge
} from 'antd';
import {
  RobotOutlined,
  TeamOutlined,
  TranslationOutlined,
  SearchOutlined,
  DatabaseOutlined,
  BulbOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface AgentStatusData {
  agent_name: string;
  status: string;
  action: string;
  confidence: number;
  content_preview: string;
  timestamp: number;
  team_name: string;
}

interface CurrentAgentStatusBarProps {
  agentStatus?: AgentStatusData;
  visible?: boolean;
  style?: React.CSSProperties;
}

const CurrentAgentStatusBar: React.FC<CurrentAgentStatusBarProps> = ({
  agentStatus,
  visible = true,
  style = {}
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // 更新运行时间
  useEffect(() => {
    if (!agentStatus || agentStatus.status !== 'running') {
      setElapsedTime(0);
      return;
    }

    const startTime = agentStatus.timestamp * 1000;
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);

    return () => clearInterval(timer);
  }, [agentStatus]);

  // Agent状态变化动画
  useEffect(() => {
    if (agentStatus) {
      setAnimationClass('agent-status-enter');
      const timer = setTimeout(() => setAnimationClass(''), 500);
      return () => clearTimeout(timer);
    }
  }, [agentStatus?.agent_name]);

  // 获取Agent图标
  const getAgentIcon = (agentName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "问题分解专家": <BulbOutlined style={{ color: '#722ed1' }} />,
      "实时翻译专家": <TranslationOutlined style={{ color: '#13c2c2' }} />,
      "多语言知识检索专家": <SearchOutlined style={{ color: '#1890ff' }} />,
      "知识图谱专家": <DatabaseOutlined style={{ color: '#52c41a' }} />,
      "总结回答专家": <BulbOutlined style={{ color: '#fa8c16' }} />,
      "多语言问答协调器": <TeamOutlined style={{ color: '#eb2f96' }} />,
      "系统协调器": <RobotOutlined style={{ color: '#595959' }} />
    };
    return iconMap[agentName] || <RobotOutlined style={{ color: '#595959' }} />;
  };

  // 获取Agent颜色
  const getAgentColor = (agentName: string) => {
    const colorMap: Record<string, string> = {
      "问题分解专家": '#722ed1',
      "实时翻译专家": '#13c2c2', 
      "多语言知识检索专家": '#1890ff',
      "知识图谱专家": '#52c41a',
      "总结回答专家": '#fa8c16',
      "多语言问答协调器": '#eb2f96',
      "系统协调器": '#595959'
    };
    return colorMap[agentName] || '#595959';
  };

  // 格式化时间
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    }
  };

  if (!visible || !agentStatus) {
    return null;
  }

  return (
    <>
      {/* CSS 动画样式 */}
      <style>
        {`
          @keyframes agent-status-enter {
            0% { 
              opacity: 0; 
              transform: translateY(-10px) scale(0.95); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% { 
              box-shadow: 0 0 5px rgba(24, 144, 255, 0.3); 
            }
            50% { 
              box-shadow: 0 0 15px rgba(24, 144, 255, 0.6); 
            }
          }
          
          .agent-status-enter {
            animation: agent-status-enter 0.5s ease-out;
          }
          
          .agent-status-card {
            transition: all 0.3s ease;
            animation: pulse-glow 2s infinite;
          }
          
          .agent-status-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }
        `}
      </style>

      <Card
        className={`agent-status-card ${animationClass}`}
        size="small"
        style={{
          marginBottom: '12px',
          borderRadius: '12px',
          border: `2px solid ${getAgentColor(agentStatus.agent_name)}`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(8px)',
          ...style
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Agent头像 */}
          <div style={{ position: 'relative' }}>
            <Avatar
              size={40}
              style={{
                backgroundColor: getAgentColor(agentStatus.agent_name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              icon={getAgentIcon(agentStatus.agent_name)}
            />
            {agentStatus.status === 'running' && (
              <Badge
                dot
                status="processing"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2
                }}
              />
            )}
          </div>

          {/* Agent信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '14px', color: '#1f2937' }}>
                {agentStatus.agent_name}
              </Text>
              <Tag
                color={getAgentColor(agentStatus.agent_name)}
                style={{ 
                  fontSize: '10px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none'
                }}
              >
                {agentStatus.action}
              </Tag>
            </div>

            {/* 内容预览 */}
            {agentStatus.content_preview && (
              <Tooltip title={agentStatus.content_preview}>
                <Text
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '300px'
                  }}
                >
                  {agentStatus.content_preview}
                </Text>
              </Tooltip>
            )}
          </div>

          {/* 右侧状态信息 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {/* 执行时间 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ClockCircleOutlined style={{ fontSize: '10px', color: '#9ca3af' }} />
              <Text style={{ fontSize: '10px', color: '#9ca3af' }}>
                {formatElapsedTime(elapsedTime)}
              </Text>
            </div>

            {/* 置信度 */}
            {agentStatus.confidence && (
              <Tag
                style={{
                  fontSize: '9px',
                  background: `rgba(16, 185, 129, 0.1)`,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#059669',
                  borderRadius: '4px',
                  margin: 0
                }}
              >
                {Math.round(agentStatus.confidence * 100)}%
              </Tag>
            )}

            {/* 运行状态指示器 */}
            {agentStatus.status === 'running' && (
              <SyncOutlined 
                spin 
                style={{ 
                  color: getAgentColor(agentStatus.agent_name),
                  fontSize: '12px'
                }} 
              />
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

export default CurrentAgentStatusBar;