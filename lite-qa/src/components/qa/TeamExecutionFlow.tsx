/**
 * Team执行流程状态展示组件 - 显示动态执行步骤和智能体状态
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Timeline, 
  Progress, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Tooltip, 
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Steps
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  StopOutlined,
  PauseCircleOutlined,
  RobotOutlined,
  BulbOutlined,
  SearchOutlined,
  TranslationOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Step } = Steps;

interface AgentTask {
  id: string;
  agentName: string;
  agentType: 'coordinator' | 'translator' | 'retriever' | 'analyzer' | 'synthesizer';
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime?: number;
  endTime?: number;
  progress: number;
  confidence?: number;
  errorMessage?: string;
  reasoning?: string;
  dependencies?: string[];
}

interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tasks: AgentTask[];
  startTime?: number;
  endTime?: number;
}

interface TeamExecutionFlowProps {
  executionId: string;
  teamName: string;
  query: string;
  phases: ExecutionPhase[];
  currentPhase?: string;
  totalProgress: number;
  remainingTasks: number;
  executionTimeout?: number;
  onTimeoutAction?: () => void;
  onRetry?: (taskId: string) => void;
  onCancel?: () => void;
}

const TeamExecutionFlow: React.FC<TeamExecutionFlowProps> = ({
  executionId,
  teamName,
  query,
  phases,
  currentPhase,
  totalProgress,
  remainingTasks,
  executionTimeout = 60000, // 默认60秒超时
  onTimeoutAction,
  onRetry,
  onCancel
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  // 定时更新当前时间，用于计算执行时间和超时检测
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 超时检测
  useEffect(() => {
    const runningTasks = phases.flatMap(phase => 
      phase.tasks.filter(task => task.status === 'running')
    );

    const hasTimeoutTasks = runningTasks.some(task => {
      if (task.startTime) {
        const runningTime = currentTime - task.startTime;
        return runningTime > executionTimeout;
      }
      return false;
    });

    if (hasTimeoutTasks && !timeoutWarning) {
      setTimeoutWarning(true);
      onTimeoutAction?.();
    }
  }, [currentTime, phases, executionTimeout, timeoutWarning, onTimeoutAction]);

  // 获取执行状态统计
  const getExecutionStats = () => {
    const allTasks = phases.flatMap(phase => phase.tasks);
    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      running: allTasks.filter(t => t.status === 'running').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      timeout: allTasks.filter(t => t.status === 'timeout').length,
      pending: allTasks.filter(t => t.status === 'pending').length
    };
    return stats;
  };

  const executionStats = getExecutionStats();

  // 获取智能体图标
  const getAgentIcon = (agentType: AgentTask['agentType']) => {
    const iconMap = {
      coordinator: <TeamOutlined />,
      translator: <TranslationOutlined />,
      retriever: <SearchOutlined />,
      analyzer: <BarChartOutlined />,
      synthesizer: <BulbOutlined />
    };
    return iconMap[agentType] || <RobotOutlined />;
  };

  // 获取状态颜色 - 统一现代配色方案
  const getStatusColor = (status: AgentTask['status']) => {
    const colorMap = {
      pending: '#94a3b8',
      running: '#6366f1',
      completed: '#64748b',
      failed: '#ef4444',
      timeout: '#f59e0b'
    };
    return colorMap[status];
  };

  // 获取状态图标
  const getStatusIcon = (status: AgentTask['status']) => {
    const iconMap = {
      pending: <ClockCircleOutlined />,
      running: <SyncOutlined spin />,
      completed: <CheckCircleOutlined />,
      failed: <ExclamationCircleOutlined />,
      timeout: <WarningOutlined />
    };
    return iconMap[status];
  };

  // 计算任务执行时间
  const getTaskDuration = (task: AgentTask) => {
    if (task.status === 'running' && task.startTime) {
      return Math.floor((currentTime - task.startTime) / 1000);
    }
    if (task.startTime && task.endTime) {
      return Math.floor((task.endTime - task.startTime) / 1000);
    }
    return 0;
  };

  // 渲染现代化团队执行节点 - 去除边框，统一配色
  const renderAnalysisNode = (task: AgentTask) => (
    <div
      key={task.id}
      className="modern-execution-card"
      style={{
        marginBottom: '12px',
        borderRadius: '12px',
        background: task.status === 'running' 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)'
          : task.status === 'completed'
          ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.05) 0%, rgba(71, 85, 105, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
        boxShadow: task.status === 'running' 
          ? '0 4px 12px rgba(99, 102, 241, 0.15)'
          : '0 2px 6px rgba(100, 116, 139, 0.08)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        padding: '16px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      {/* 运行状态的微妙动态效果 */}
      {task.status === 'running' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.08), transparent)',
            animation: 'shimmer 2s infinite'
          }}
        />
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 智能体图标 - 现代化设计 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: task.status === 'running' 
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : task.status === 'completed'
              ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
              : task.status === 'failed'
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : task.status === 'timeout'
              ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
              : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            color: 'white',
            fontSize: '16px',
            boxShadow: task.status === 'running' 
              ? '0 3px 10px rgba(99, 102, 241, 0.3)'
              : '0 2px 6px rgba(100, 116, 139, 0.2)'
          }}
        >
          {getAgentIcon(task.agentType)}
        </div>

        {/* 任务信息 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '14px', color: '#1f2937' }}>
              {task.agentName}
            </Text>
            {getStatusIcon(task.status)}
            <Tag 
              size="small" 
              color={getStatusColor(task.status)}
              style={{ 
                fontSize: '10px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 500
              }}
            >
              {task.status.toUpperCase()}
            </Tag>
          </div>
          
          <Text style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
            {task.taskName}
          </Text>

          {/* 进度条 - 统一配色 */}
          {task.status === 'running' && (
            <Progress
              percent={task.progress}
              size="small"
              strokeColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              trailColor="rgba(99, 102, 241, 0.1)"
              style={{ marginBottom: '6px' }}
            />
          )}

          {/* 推理内容 - 现代化样式 */}
          {task.reasoning && (
            <div style={{
              fontSize: '11px',
              color: '#475569',
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
              padding: '8px 10px',
              borderRadius: '8px',
              marginBottom: '6px',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              lineHeight: '1.4'
            }}>
              💭 {task.reasoning}
            </div>
          )}
        </div>

        {/* 右侧信息 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {/* 执行时间 */}
          <Text style={{ fontSize: '10px', color: '#9ca3af' }}>
            {getTaskDuration(task)}s
          </Text>
          
          {/* 置信度 - 统一配色 */}
          {task.confidence && (
            <Tag 
              size="small"
              style={{
                fontSize: '9px',
                background: task.status === 'running' 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : task.status === 'completed'
                  ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                  : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              {Math.round(task.confidence * 100)}%
            </Tag>
          )}

          {/* 错误信息或重试按钮 */}
          {(task.status === 'failed' || task.status === 'timeout') && (
            <Button
              size="small"
              type="text"
              danger
              onClick={() => onRetry?.(task.id)}
              style={{ fontSize: '10px', padding: '2px 6px', height: 'auto' }}
            >
              重试
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="team-execution-flow" style={{ padding: '16px' }}>
      {/* CSS动画 */}
      <style>
        {`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          .modern-execution-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15) !important;
          }
        `}
      </style>

      {/* 执行总览 */}
      <Card 
        title={
          <Space>
            <TeamOutlined style={{ color: '#3b82f6' }} />
            <span>团队执行流程</span>
            <Tag color="blue">{teamName}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button size="small" danger onClick={onCancel}>
              终止执行
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总体进度"
              value={totalProgress}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ 
                color: totalProgress === 100 ? '#52c41a' : 
                       totalProgress > 60 ? '#1890ff' : '#faad14'
              }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="运行中"
              value={executionStats.running}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="已完成"
              value={executionStats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="剩余"
              value={remainingTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="执行ID"
              value={executionId.slice(-8)}
              prefix={<DatabaseOutlined />}
            />
          </Col>
        </Row>

        {/* 失败和超时状态警告 */}
        {(executionStats.failed > 0 || executionStats.timeout > 0) && (
          <Row gutter={16} style={{ marginTop: '12px' }}>
            {executionStats.failed > 0 && (
              <Col span={12}>
                <Alert
                  message={`${executionStats.failed} 个任务失败`}
                  type="error"
                  size="small"
                  showIcon
                />
              </Col>
            )}
            {executionStats.timeout > 0 && (
              <Col span={12}>
                <Alert
                  message={`${executionStats.timeout} 个任务超时`}
                  type="warning"
                  size="small"
                  showIcon
                />
              </Col>
            )}
          </Row>
        )}

        {/* 超时警告 */}
        {timeoutWarning && (
          <Alert
            message="检测到超时任务"
            description="部分智能体执行时间过长，建议检查或重启执行"
            type="warning"
            showIcon
            style={{ marginTop: '12px' }}
            action={
              <Button size="small" danger onClick={onTimeoutAction}>
                处理超时
              </Button>
            }
          />
        )}
      </Card>

      {/* 执行阶段 */}
      {phases.map((phase, phaseIndex) => (
        <Card
          key={phase.id}
          title={
            <Space>
              <Badge 
                status={
                  phase.status === 'completed' ? 'success' :
                  phase.status === 'running' ? 'processing' :
                  phase.status === 'failed' ? 'error' : 'default'
                }
              />
              <span>{phase.name}</span>
              {phase.status === 'running' && (
                <Tag color="blue" icon={<SyncOutlined spin />}>
                  执行中
                </Tag>
              )}
            </Space>
          }
          style={{ marginBottom: '16px' }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            {phase.description}
          </Text>

          {/* 任务列表 */}
          <div>
            {phase.tasks.map(task => renderAnalysisNode(task))}
          </div>

          {/* 阶段进度 */}
          <div style={{ marginTop: '12px' }}>
            <Text strong style={{ fontSize: '12px' }}>阶段进度：</Text>
            <Progress
              percent={Math.round(
                (phase.tasks.filter(t => t.status === 'completed').length / phase.tasks.length) * 100
              )}
              size="small"
              status={phase.status === 'failed' ? 'exception' : 'normal'}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TeamExecutionFlow;