/**
 * 团队执行流程抽屉组件 - 独立展示执行状态，不受消息刷新影响
 */
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
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
  Timeline,
  Divider,
  Empty,
  Spin
} from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
  WarningOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  RobotOutlined,
  BulbOutlined,
  SearchOutlined,
  TranslationOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface ExecutionTask {
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
  tasks: ExecutionTask[];
  startTime?: number;
  endTime?: number;
}

interface TeamExecutionState {
  executionId: string;
  teamName: string;
  query: string;
  phases: ExecutionPhase[];
  totalProgress: number;
  remainingTasks: number;
  isActive: boolean;
  startTime: number;
  currentPhase?: string;
  timeoutWarnings: number;
  lastActivity: number;
}

interface TeamExecutionDrawerProps {
  visible: boolean;
  onClose: () => void;
  executionState?: TeamExecutionState;
  onTerminate?: () => void;
  onRetry?: (taskId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
}

const TeamExecutionDrawer: React.FC<TeamExecutionDrawerProps> = ({
  visible,
  onClose,
  executionState,
  onTerminate,
  onRetry,
  onPause,
  onResume
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // 定时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 获取智能体图标
  const getAgentIcon = (agentType: ExecutionTask['agentType']) => {
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
  const getStatusColor = (status: ExecutionTask['status']) => {
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
  const getStatusIcon = (status: ExecutionTask['status']) => {
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
  const getTaskDuration = (task: ExecutionTask) => {
    if (task.status === 'running' && task.startTime) {
      return Math.floor((currentTime - task.startTime) / 1000);
    }
    if (task.startTime && task.endTime) {
      return Math.floor((task.endTime - task.startTime) / 1000);
    }
    return 0;
  };

  // 计算总执行时间
  const getTotalExecutionTime = () => {
    if (!executionState) return 0;
    
    // 如果执行已完成，计算从开始到所有任务完成的时间
    if (!executionState.isActive) {
      // 找到最后完成的任务时间
      let lastCompletedTime = executionState.startTime;
      executionState.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          if (task.status === 'completed' && task.endTime && task.endTime > lastCompletedTime) {
            lastCompletedTime = task.endTime;
          }
        });
      });
      return Math.floor((lastCompletedTime - executionState.startTime) / 1000);
    }
    
    // 如果仍在执行中，使用当前时间
    return Math.floor((currentTime - executionState.startTime) / 1000);
  };

  // 获取执行统计
  const getExecutionStats = () => {
    if (!executionState) {
      return { total: 0, completed: 0, running: 0, failed: 0, timeout: 0, pending: 0 };
    }

    const allTasks = executionState.phases.flatMap(phase => phase.tasks);
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      running: allTasks.filter(t => t.status === 'running').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      timeout: allTasks.filter(t => t.status === 'timeout').length,
      pending: allTasks.filter(t => t.status === 'pending').length
    };
  };

  const stats = getExecutionStats();

  // 渲染现代化任务卡片 - 去除边框，统一设计
  const renderTaskCard = (task: ExecutionTask) => (
    <div
      key={task.id}
      style={{
        marginBottom: '10px',
        borderRadius: '12px',
        background: task.status === 'running' 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)'
          : task.status === 'completed'
          ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.05) 0%, rgba(71, 85, 105, 0.03) 100%)'
          : task.status === 'failed'
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.03) 100%)'
          : task.status === 'timeout'
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(249, 115, 22, 0.06) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
        boxShadow: task.status === 'running' 
          ? '0 4px 12px rgba(99, 102, 241, 0.15)'
          : '0 2px 6px rgba(100, 116, 139, 0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '12px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 智能体图标 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
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
            fontSize: '12px',
            boxShadow: task.status === 'running' 
              ? '0 2px 8px rgba(99, 102, 241, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {getAgentIcon(task.agentType)}
        </div>

        {/* 任务信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Text strong style={{ fontSize: '12px', color: '#1f2937' }}>
              {task.agentName}
            </Text>
            {getStatusIcon(task.status)}
          </div>
          
          <Text style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
            {task.taskName}
          </Text>

          {/* 进度条 */}
          {task.status === 'running' && (
            <Progress
              percent={task.progress}
              size="small"
              strokeColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              trailColor="rgba(99, 102, 241, 0.1)"
              style={{ marginTop: '4px' }}
              showInfo={false}
            />
          )}
        </div>

        {/* 右侧信息 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <Text style={{ fontSize: '9px', color: '#9ca3af' }}>
            {getTaskDuration(task)}s
          </Text>
          
          {task.confidence && (
            <Tag 
              style={{ 
                fontSize: '8px', 
                margin: 0,
                background: task.status === 'running' 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : task.status === 'completed'
                  ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                  : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              {Math.round(task.confidence * 100)}%
            </Tag>
          )}

          {(task.status === 'failed' || task.status === 'timeout') && (
            <Button
              size="small"
              type="text"
              onClick={() => onRetry?.(task.id)}
              style={{ 
                fontSize: '8px', 
                padding: '0 4px', 
                height: '16px',
                color: '#ef4444',
                borderColor: '#ef4444',
                borderRadius: '6px'
              }}
            >
              重试
            </Button>
          )}
        </div>
      </div>

      {/* 推理内容 - 优化样式 */}
      {task.reasoning && (
        <div style={{
          fontSize: '10px',
          color: '#475569',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          padding: '8px 10px',
          borderRadius: '8px',
          marginTop: '6px',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          lineHeight: '1.4'
        }}>
          💭 {task.reasoning}
        </div>
      )}
    </div>
  );

  if (!executionState) {
    return (
      <Drawer
        title="团队执行流程"
        placement="right"
        width={fullscreen ? '100%' : 480}
        height={fullscreen ? '100%' : undefined}
        onClose={onClose}
        open={visible}
        destroyOnClose
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无执行中的团队任务"
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '40px',
          padding: '4px 0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: 1,
            minWidth: 0 // 允许内容收缩
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TeamOutlined style={{ color: '#6366f1', fontSize: '18px' }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#1e293b',
                whiteSpace: 'nowrap'
              }}>
                团队执行流程
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Tag 
                style={{ 
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {executionState.teamName}
              </Tag>
              
              {executionState.isActive ? (
                <Tag 
                  style={{ 
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  <LoadingOutlined spin style={{ marginRight: '4px' }} />
                  执行中
                </Tag>
              ) : (
                <Tag 
                  style={{ 
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  已完成
                </Tag>
              )}
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0 // 防止按钮收缩
          }}>
            <Tooltip title={fullscreen ? '退出全屏' : '全屏显示'}>
              <Button
                type="text"
                size="small"
                icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={() => setFullscreen(!fullscreen)}
                style={{ 
                  minWidth: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              />
            </Tooltip>
          </div>
        </div>
      }
      placement="right"
      width={fullscreen ? '100%' : 480}
      height={fullscreen ? '100%' : undefined}
      onClose={onClose}
      open={visible}
      destroyOnClose
      extra={null}
    >
      {/* 控制按钮区域 */}
      {executionState.isActive && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.08) 0%, rgba(148, 163, 184, 0.12) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingOutlined style={{ color: '#64748b', fontSize: '16px' }} />
              <Text strong style={{ color: '#334155', fontSize: '14px' }}>
                执行控制
              </Text>
            </div>
            <Space size="small">
              <Button 
                size="small" 
                icon={<PauseCircleOutlined />} 
                onClick={onPause}
                style={{ 
                  fontSize: '12px',
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  borderRadius: '8px'
                }}
              >
                暂停
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<StopOutlined />} 
                onClick={onTerminate}
                style={{ 
                  fontSize: '12px',
                  borderRadius: '8px'
                }}
              >
                终止
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* 执行总览 - 去除边框，现代化设计 */}
      <div 
        style={{ 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(100, 116, 139, 0.08)'
        }}
      >
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                总进度
              </div>
              <div style={{ 
                fontSize: '20px',
                fontWeight: 700,
                color: executionState.totalProgress === 100 ? '#64748b' : '#6366f1'
              }}>
                {executionState.totalProgress}%
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                运行中
              </div>
              <div style={{ 
                fontSize: '20px',
                fontWeight: 700,
                color: stats.running > 0 ? '#f59e0b' : '#64748b'
              }}>
                {stats.running}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                已完成
              </div>
              <div style={{ 
                fontSize: '20px',
                fontWeight: 700,
                color: '#64748b'
              }}>
                {stats.completed}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                剩余
              </div>
              <div style={{ 
                fontSize: '20px',
                fontWeight: 700,
                color: executionState.remainingTasks > 0 ? '#94a3b8' : '#64748b'
              }}>
                {executionState.remainingTasks}
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ 
          margin: '16px 0', 
          borderColor: 'rgba(148, 163, 184, 0.3)' 
        }} />

        <Row gutter={16}>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                执行时间
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 700,
                color: '#334155'
              }}>
                {getTotalExecutionTime()}s
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b', 
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                执行ID
              </div>
              <div style={{ 
                fontSize: '13px', 
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                color: '#475569',
                fontWeight: 600
              }}>
                {executionState.executionId.slice(-8)}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 超时和错误警告 */}
      {executionState.timeoutWarnings > 0 && (
        <Alert
          message="检测到超时警告"
          description={`已发出 ${executionState.timeoutWarnings} 次超时警告，部分智能体响应缓慢`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {(stats.failed > 0 || stats.timeout > 0) && (
        <Alert
          message="执行异常"
          description={`${stats.failed} 个任务失败，${stats.timeout} 个任务超时`}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 执行阶段 */}
      <div style={{ maxHeight: fullscreen ? 'calc(100vh - 300px)' : 'calc(100vh - 400px)', overflowY: 'auto' }}>
        {executionState.phases.map((phase, phaseIndex) => (
          <div
            key={phase.id}
            style={{ 
              marginBottom: '12px',
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 2px 6px rgba(100, 116, 139, 0.08)'
            }}
          >
            {/* 阶段标题 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <Badge 
                status={
                  phase.status === 'completed' ? 'success' :
                  phase.status === 'running' ? 'processing' :
                  phase.status === 'failed' ? 'error' : 'default'
                }
              />
              <Text strong style={{ fontSize: '13px' }}>{phase.name}</Text>
              {phase.status === 'running' && (
                <Tag 
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '10px'
                  }}
                >
                  <SyncOutlined spin style={{ fontSize: '10px' }} />
                  <span style={{ marginLeft: '4px', fontSize: '10px' }}>执行中</span>
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '12px' }}>
              {phase.description}
            </Text>

            {/* 任务列表 */}
            {phase.tasks.map(task => renderTaskCard(task))}

            {/* 阶段进度 - 统一样式 */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <Text style={{ fontSize: '11px', color: '#6b7280' }}>阶段进度</Text>
                <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                  {phase.tasks.filter(t => t.status === 'completed').length}/{phase.tasks.length}
                </Text>
              </div>
              <Progress
                percent={Math.round(
                  (phase.tasks.filter(t => t.status === 'completed').length / phase.tasks.length) * 100
                )}
                size="small"
                status={phase.status === 'failed' ? 'exception' : 'normal'}
                strokeColor={
                  phase.status === 'completed' 
                    ? '#64748b'
                    : phase.status === 'running'
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : '#94a3b8'
                }
                trailColor="rgba(148, 163, 184, 0.15)"
              />
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
};

export default TeamExecutionDrawer;