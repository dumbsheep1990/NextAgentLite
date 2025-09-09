/**
 * 任务状态恢复组件 - 纯SSE事件驱动
 * 完全移除HTTP轮询，所有任务状态通过统一SSE实时推送
 * 注意：仅提供任务状态管理功能，不显示UI指示器（UI由DocumentList负责）
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, List, Progress, Badge, Button, Typography, Space, Empty, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, 
         SyncOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TaskProgress {
  task_id: string;
  progress: number;
  stage: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  processing_time?: number;
  document_id?: string;
  task_type?: string;
}

interface TaskStateRecoveryProps {
  sessionId: string;
  onTaskComplete?: (taskId: string, result?: any) => void;
  onTaskFailed?: (taskId: string, error?: string) => void;
  className?: string;
  // 新增：是否显示右下角指示器（默认false，由DocumentList负责显示进度）
  showFloatingIndicator?: boolean;
}

export const TaskStateRecovery: React.FC<TaskStateRecoveryProps> = ({
  sessionId,
  onTaskComplete,
  onTaskFailed,
  className,
  showFloatingIndicator = false
}) => {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  
  const sseEventHandlerRef = useRef<((event: CustomEvent) => void) | null>(null);

  // SSE事件处理器
  const handleSSEMessage = useCallback((event: CustomEvent) => {
    const data = event.detail;
    
    // 只处理任务相关的消息，不处理连接状态
    if (!data.type.startsWith('task_')) {
      return;
    }

    console.log('📡 TaskStateRecovery收到任务消息:', data);

    switch (data.type) {
      case 'task_progress_update':
        handleTaskProgressUpdate(data.task_id, data.data);
        break;

      case 'task_completed':
        handleTaskCompleted(data.task_id, data.data);
        break;

      case 'task_failed':
        handleTaskFailed(data.task_id, data.data);
        break;

      case 'task_cancelled':
        handleTaskCancelled(data.task_id);
        break;

      default:
        console.log('📡 收到其他任务消息类型:', data.type);
    }
  }, []);

  // 处理任务进度更新
  const handleTaskProgressUpdate = useCallback((taskId: string, progressData: any) => {
    setTasks(prevTasks => {
      const existingIndex = prevTasks.findIndex(task => task.task_id === taskId);
      
      const updatedTask: TaskProgress = {
        task_id: taskId,
        progress: progressData.progress || 0,
        stage: progressData.stage || '处理中',
        detail: progressData.detail || '',
        status: progressData.status || 'running',
        document_id: progressData.document_id,
        task_type: progressData.task_type,
        error_message: progressData.error_message
      };

      if (existingIndex >= 0) {
        const newTasks = [...prevTasks];
        newTasks[existingIndex] = updatedTask;
        return newTasks;
      } else {
        return [...prevTasks, updatedTask];
      }
    });
  }, []);

  // 处理任务完成
  const handleTaskCompleted = useCallback((taskId: string, resultData: any) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.task_id === taskId
          ? { 
              ...task, 
              status: 'completed' as const,
              progress: 100,
              stage: '已完成',
              detail: resultData?.detail || '任务已完成',
              processing_time: resultData?.processing_time
            }
          : task
      );
      
      // 更新完成计数
      const newCompletedCount = updatedTasks.filter(t => t.status === 'completed').length;
      setCompletedTasks(newCompletedCount);
      
      return updatedTasks;
    });

    // 触发回调
    if (onTaskComplete) {
      onTaskComplete(taskId, resultData?.result);
    }
  }, [onTaskComplete]);

  // 处理任务失败
  const handleTaskFailed = useCallback((taskId: string, errorData: any) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task_id === taskId
          ? {
              ...task,
              status: 'failed' as const,
              stage: '失败',
              detail: errorData?.detail || '任务失败',
              error_message: errorData?.error_message
            }
          : task
      )
    );

    // 触发回调
    if (onTaskFailed) {
      onTaskFailed(taskId, errorData?.error_message);
    }
  }, [onTaskFailed]);

  // 处理任务取消
  const handleTaskCancelled = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task_id === taskId
          ? {
              ...task,
              status: 'cancelled' as const,
              stage: '已取消',
              detail: '任务已取消'
            }
          : task
      )
    );
  }, []);

  // 清理已完成的任务
  const clearCompletedTasks = useCallback(() => {
    setTasks(prevTasks => prevTasks.filter(task => 
      task.status !== 'completed' && task.status !== 'cancelled'
    ));
    setCompletedTasks(0);
    message.success('已清理完成的任务');
  }, []);

  // 初始化和清理
  useEffect(() => {
    // 创建事件处理器
    sseEventHandlerRef.current = handleSSEMessage;
    
    // 监听SSE消息事件
    window.addEventListener('sse-message', sseEventHandlerRef.current as EventListener);
    
    // 更新总任务数
    setTotalTasks(tasks.length);
    
    return () => {
      if (sseEventHandlerRef.current) {
        window.removeEventListener('sse-message', sseEventHandlerRef.current as EventListener);
      }
    };
  }, [handleSSEMessage, tasks.length]);

  // 获取状态图标
  const getStatusIcon = (task: TaskProgress) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'cancelled':
        return <StopOutlined style={{ color: '#faad14' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      case 'running': return 'processing';
      default: return 'default';
    }
  };

  // 计算运行中的任务数量
  const runningTasks = tasks.filter(task => 
    task.status === 'running' || task.status === 'pending'
  ).length;

  // 如果不显示浮动指示器，只返回Modal
  if (!showFloatingIndicator) {
    return (
      <Modal
        title="任务状态管理"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="clear" onClick={clearCompletedTasks} disabled={completedTasks === 0}>
            <DeleteOutlined />
            清理已完成
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {tasks.length === 0 ? (
          <Empty description="当前没有任务" />
        ) : (
          <List
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(task)}
                  title={
                    <Space>
                      <Text code>{task.task_id.slice(0, 8)}</Text>
                      <Badge 
                        status={getStatusColor(task.status) as any} 
                        text={task.stage} 
                      />
                      {task.task_type && (
                        <Text type="secondary">({task.task_type})</Text>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{task.detail}</Text>
                      {task.status === 'running' && (
                        <Progress 
                          percent={task.progress} 
                          size="small" 
                          style={{ marginTop: 4 }}
                        />
                      )}
                      {task.error_message && (
                        <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                          错误: {task.error_message}
                        </Text>
                      )}
                      {task.processing_time && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                          耗时: {task.processing_time.toFixed(1)}秒
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    );
  }

  // 如果没有任务，不显示指示器
  if (tasks.length === 0) {
    return null;
  }

  // 显示浮动指示器的情况（目前不使用）
  return (
    <>
      {/* 浮动任务指示器 - 暂时禁用 */}
      {/* <div 
        className={`${styles.taskIndicator} ${className}`}
        onClick={() => setIsModalVisible(true)}
      >
        <Space>
          {runningTasks > 0 ? (
            <SyncOutlined spin style={{ color: '#1890ff' }} />
          ) : (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          )}
          <span className={styles.indicatorText}>
            任务: {completedTasks}/{totalTasks}
            {runningTasks > 0 && ` (${runningTasks} 运行中)`}
                </span>
        </Space>
      </div> */}

      {/* 任务详情弹窗 */}
      <Modal
        title="任务状态管理"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="clear" onClick={clearCompletedTasks} disabled={completedTasks === 0}>
            <DeleteOutlined />
            清理已完成
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {tasks.length === 0 ? (
          <Empty description="当前没有任务" />
        ) : (
        <List
          dataSource={tasks}
          renderItem={(task) => (
              <List.Item>
              <List.Item.Meta
                  avatar={getStatusIcon(task)}
                title={
                    <Space>
                      <Text code>{task.task_id.slice(0, 8)}</Text>
                    <Badge
                        status={getStatusColor(task.status) as any} 
                        text={task.stage} 
                      />
                      {task.task_type && (
                        <Text type="secondary">({task.task_type})</Text>
                      )}
                    </Space>
                }
                description={
                  <div>
                      <Text>{task.detail}</Text>
                      {task.status === 'running' && (
                      <Progress
                        percent={task.progress}
                        size="small"
                          style={{ marginTop: 4 }}
                      />
                    )}
                    {task.error_message && (
                        <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                        错误: {task.error_message}
                        </Text>
                      )}
                      {task.processing_time && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                          耗时: {task.processing_time.toFixed(1)}秒
                        </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
        )}
      </Modal>
    </>
  );
};