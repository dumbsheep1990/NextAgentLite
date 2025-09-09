/**
 * 知识图谱提取进度组件
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Steps,
  Progress,
  Card,
  Typography,
  Space,
  Statistic,
  Tag,
  Alert,
  Button,
  Divider,
  Row,
  Col,
  Timeline,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  ScissorOutlined,
  BranchesOutlined,
  NodeIndexOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

export interface ExtractionStep {
  key: string;
  title: string;
  description: string;
  status: 'wait' | 'process' | 'finish' | 'error';
  progress?: number;
  details?: {
    current?: number;
    total?: number;
    message?: string;
    subSteps?: string[];
  };
}

export interface ExtractionProgress {
  documentId: string;
  fileName: string;
  fileSize: number;
  currentStep: number;
  totalSteps: number;
  steps: ExtractionStep[];
  statistics: {
    chunksProcessed: number;
    totalChunks: number;
    entitiesExtracted: number;
    relationshipsExtracted: number;
    keywordsExtracted: number;
  };
  startTime: string;
  estimatedEndTime?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

interface GraphExtractionProgressProps {
  visible: boolean;
  progress: ExtractionProgress | null;
  onClose: () => void;
  onCancel?: (documentId: string) => void;
  embedded?: boolean; // 嵌入模式，不显示Modal包装
}

export const GraphExtractionProgress: React.FC<GraphExtractionProgressProps> = ({
  visible,
  progress,
  onClose,
  onCancel,
  embedded = false
}) => {
  const [showDetails, setShowDetails] = useState(embedded ? true : false); // 嵌入模式默认显示详情
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取当前步骤状态图标
  const getStepIcon = (step: ExtractionStep) => {
    switch (step.status) {
      case 'finish':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'process':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  // 计算总体进度
  const calculateOverallProgress = () => {
    if (!progress) return 0;
    
    const finishedSteps = progress.steps.filter(step => step.status === 'finish').length;
    const currentStep = progress.steps[progress.currentStep];
    const currentStepProgress = currentStep?.progress || 0;
    
    // 如果当前步骤已完成（status为finish），不重复计算其进度
    const currentStepContribution = currentStep?.status === 'finish' ? 0 : currentStepProgress / 100;
    
    const totalProgress = (finishedSteps + currentStepContribution) / progress.totalSteps * 100;
    return Math.min(Math.round(totalProgress), 100); // 确保不超过100%
  };

  // 估算剩余时间
  const getEstimatedTime = () => {
    if (!progress?.startTime) return null;
    
    const startTime = new Date(progress.startTime);
    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const overallProgress = calculateOverallProgress();
    
    if (overallProgress > 0) {
      const estimatedTotal = (elapsed / overallProgress) * 100;
      const remaining = estimatedTotal - elapsed;
      
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / (1000 * 60));
        return `预计还需 ${minutes} 分钟`;
      }
    }
    
    return null;
  };

  const handleCancel = () => {
    if (progress && onCancel) {
      onCancel(progress.documentId);
    }
  };

  if (!progress) return null;

  const overallProgress = calculateOverallProgress();
  const currentStep = progress.steps[progress.currentStep];
  const estimatedTime = getEstimatedTime();

  // 主要内容渲染
  const renderContent = () => (
    <div style={{ padding: embedded ? '0' : '16px 0' }}>
        {/* 文件信息 */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="文件名"
                value={progress.fileName}
                valueStyle={{ fontSize: '14px' }}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="文件大小"
                value={`${(progress.fileSize / 1024 / 1024).toFixed(2)} MB`}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总体进度"
                value={overallProgress}
                suffix="%"
                valueStyle={{ 
                  fontSize: '18px',
                  color: overallProgress === 100 ? '#52c41a' : '#1890ff'
                }}
              />
            </Col>
          </Row>
          
          {estimatedTime && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">{estimatedTime}</Text>
            </div>
          )}
        </Card>

        {/* 总体进度条 */}
        <Progress
          percent={overallProgress}
          status={currentStep?.status === 'error' ? 'exception' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          style={{ marginBottom: '24px' }}
        />

        {/* 步骤进度 */}
        <Steps
          current={progress.currentStep}
          status={currentStep?.status === 'error' ? 'error' : 'process'}
          size="small"
          style={{ 
            fontSize: '12px',
            '.ant-steps-item-title': { 
              fontSize: '12px',
              lineHeight: '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '120px'
            },
            '.ant-steps-item-description': {
              fontSize: '11px',
              lineHeight: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '120px'
            }
          }}
        >
          {progress.steps.map((step, index) => (
            <Step
              key={step.key}
              title={
                <div style={{ 
                  fontSize: '12px',
                  lineHeight: '16px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}>
                  {step.title}
                </div>
              }
              description={
                <div style={{ 
                  fontSize: '11px',
                  lineHeight: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                  color: '#666'
                }}>
                  {step.description}
                </div>
              }
              icon={getStepIcon(step)}
            />
          ))}
        </Steps>

        {/* 当前步骤详情 */}
        {currentStep && (
          <Card 
            size="small" 
            style={{ marginTop: '16px' }}
            title={`当前步骤: ${currentStep.title}`}
          >
            {currentStep.progress !== undefined && (
              <Progress
                percent={currentStep.progress}
                size="small"
                status={currentStep.status === 'error' ? 'exception' : 'active'}
                format={() => {
                  const current = currentStep.details?.current || 0;
                  const total = currentStep.details?.total || 0;
                  return total > 0 ? `${current}/${total}` : `${currentStep.progress}%`;
                }}
              />
            )}
            
            {currentStep.details?.message && (
              <Paragraph style={{ marginTop: '8px', marginBottom: '8px' }}>
                <InfoCircleOutlined style={{ marginRight: '4px' }} />
                {currentStep.details.message}
              </Paragraph>
            )}

            {/* 实时统计 */}
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={6}>
                <Statistic
                  title="已处理分段"
                  value={progress.statistics.chunksProcessed}
                  suffix={`/ ${progress.statistics.totalChunks}`}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="提取实体"
                  value={progress.statistics.entitiesExtracted}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="提取关系"
                  value={progress.statistics.relationshipsExtracted}
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="关键词"
                  value={progress.statistics.keywordsExtracted}
                  valueStyle={{ fontSize: '14px', color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* 详细日志 */}
        {showDetails && (
          <Card
            size="small"
            title="提取日志"
            style={{ marginTop: '16px' }}
            bodyStyle={{ maxHeight: '200px', overflow: 'auto' }}
          >
            <Timeline size="small">
              {progress.logs.map((log, index) => (
                <Timeline.Item
                  key={index}
                  color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'orange' : 'blue'}
                  dot={
                    log.level === 'error' ? <ExclamationCircleOutlined /> :
                    log.level === 'warning' ? <ExclamationCircleOutlined /> :
                    <InfoCircleOutlined />
                  }
                >
                  <div>
                    <Text strong>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                    <br />
                    <Text type={log.level === 'error' ? 'danger' : 'secondary'}>
                      {log.message}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}

        {/* 错误提示 */}
        {currentStep?.status === 'error' && (
          <Alert
            message="提取过程中出现错误"
            description={currentStep.details?.message || '未知错误，请检查文件格式或重试'}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" danger onClick={handleCancel}>
                重新提取
              </Button>
            }
          />
        )}
        
        {/* 嵌入模式下的操作按钮 */}
        {embedded && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button 
              size="small" 
              onClick={() => setShowDetails(!showDetails)}
              style={{ marginRight: '8px' }}
            >
              {showDetails ? '隐藏详情' : '查看详情'}
            </Button>
            {onCancel && (
              <Button 
                size="small" 
                danger 
                onClick={() => onCancel(progress.documentId)}
              >
                取消提取
              </Button>
            )}
          </div>
        )}
    </div>
  );

  // 根据模式返回不同的组件
  if (embedded) {
    return visible ? renderContent() : null;
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NodeIndexOutlined style={{ color: '#1890ff' }} />
          <span>知识图谱提取进度</span>
          <Tag color={currentStep?.status === 'error' ? 'error' : 'processing'}>
            {currentStep?.status === 'error' ? '提取失败' : '提取中'}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="details" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? '隐藏详情' : '查看详情'}
        </Button>,
        <Button key="cancel" onClick={handleCancel} danger>
          取消提取
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
      destroyOnClose
    >
      {renderContent()}
    </Modal>
  );
};