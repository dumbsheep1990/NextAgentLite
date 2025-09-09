/**
 * Team决策过程渲染组件
 * 展示Team模式的决策过程，区别于Agent个体思考
 */
import React, { useState } from 'react';
import { 
  Card, 
  Collapse, 
  Tag, 
  Timeline, 
  Progress, 
  Tooltip, 
  Typography, 
  Space,
  Divider,
  Alert,
  Button
} from 'antd';
import { 
  TeamOutlined, 
  BranchesOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ExpandOutlined,
  ShrinkOutlined
} from '@ant-design/icons';
// 直接定义 TeamDecision 类型以避免导入问题
interface TeamDecision {
  type: 'decision' | 'coordination' | 'task_assignment' | 'result_synthesis' | 'quality_assessment' | 'strategy_selection';
  title: string;
  content: string;
  confidence: number;
  reasoning?: string;
  affected_agents?: string[];
  alternatives?: Array<{
    option: string;
    score: number;
    reasoning: string;
  }>;
  coordination_type?: 'task_assignment' | 'resource_allocation' | 'conflict_resolution' | 'priority_setting';
  agents_involved?: string[];
  strategy?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

interface TeamDecisionRendererProps {
  teamDecisions: TeamDecision[];
  className?: string;
  viewMode?: 'flow' | 'detail'; // 新增：视图模式，flow显示所有事件，detail只显示最终结果
}

// 决策类型配置
const DECISION_TYPE_CONFIG = {
  decision: {
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    label: '决策制定',
    description: 'Team综合分析做出的关键决策'
  },
  coordination: {
    icon: <TeamOutlined />,
    color: '#1890ff',
    label: '协调安排',
    description: 'Team成员间的协调和任务分配'
  },
  task_assignment: {
    icon: <UserSwitchOutlined />,
    color: '#fa8c16',
    label: '任务分配',
    description: '将任务分配给合适的Agent执行'
  },
  result_synthesis: {
    icon: <BranchesOutlined />,
    color: '#722ed1',
    label: '结果综合',
    description: '整合各Agent的输出形成最终答案'
  },
  quality_assessment: {
    icon: <ExclamationCircleOutlined />,
    color: '#eb2f96',
    label: '质量评估',
    description: '评估结果质量并决定优化策略'
  },
  strategy_selection: {
    icon: <SettingOutlined />,
    color: '#13c2c2',
    label: '策略选择',
    description: '选择最佳的执行策略或方法'
  }
};

const TeamDecisionRenderer: React.FC<TeamDecisionRendererProps> = ({ 
  teamDecisions, 
  className,
  viewMode = 'detail'
}) => {
  // 根据视图模式过滤决策数据
  const filteredDecisions = React.useMemo(() => {
    if (!teamDecisions || teamDecisions.length === 0) return [];
    
    if (viewMode === 'flow') {
      // 流程视图：显示所有事件（包括开始和结束），用于动态渲染
      return teamDecisions;
    } else {
      // 详细视图：只显示结束事件（有耗时的），过滤掉开始事件
      return teamDecisions.filter(decision => {
        // 检查是否是结束事件（有具体耗时）
        const isEndEvent = (decision as any).eventType === 'end' || 
                          ((decision as any).durationMs && (decision as any).durationMs > 10) ||
                          (decision.content && decision.content.includes('完成')) ||
                          (decision as any).status === 'completed';
        return isEndEvent;
      });
    }
  }, [teamDecisions, viewMode]);
  
  // 默认展开所有决策，确保保持显示状态
  const [activeKey, setActiveKey] = useState<string[]>(() => {
    if (!filteredDecisions || filteredDecisions.length === 0) return [];
    return filteredDecisions.map((_, index) => `decision-${index}`);
  });

  if (!filteredDecisions || filteredDecisions.length === 0) {
    return null;
  }

  // 按时间排序决策
  const sortedDecisions = [...filteredDecisions].sort((a, b) => a.timestamp - b.timestamp);

  // 展开/收起所有决策
  const handleExpandAll = () => {
    setActiveKey(sortedDecisions.map((_, index) => `decision-${index}`));
  };

  const handleCollapseAll = () => {
    setActiveKey([]);
  };

  const isAllExpanded = activeKey.length === sortedDecisions.length;
  const isAllCollapsed = activeKey.length === 0;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#52c41a';
    if (confidence >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  const renderDecisionContent = (decision: TeamDecision) => (
    <div className="team-decision-content">
      <div className="decision-header">
        <Space>
          <Tag 
            icon={DECISION_TYPE_CONFIG[decision.type]?.icon}
            color={DECISION_TYPE_CONFIG[decision.type]?.color}
          >
            {DECISION_TYPE_CONFIG[decision.type]?.label || decision.type}
          </Tag>
          <Text type="secondary">
            {formatTimestamp(decision.timestamp)}
          </Text>
          <Tooltip title={`决策置信度: ${(decision.confidence * 100).toFixed(1)}%`}>
            <Progress
              percent={decision.confidence * 100}
              size="small"
              strokeColor={getConfidenceColor(decision.confidence)}
              showInfo={false}
              style={{ width: 60 }}
            />
          </Tooltip>
        </Space>
      </div>

      <div className="decision-body" style={{ marginTop: 12 }}>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>{decision.content}</Text>
        </Paragraph>

        {decision.reasoning && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">推理过程：</Text>
            <Paragraph style={{ marginLeft: 16, marginTop: 4 }}>
              {decision.reasoning}
            </Paragraph>
          </div>
        )}

        {decision.affected_agents && decision.affected_agents.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">涉及Agent：</Text>
            <div style={{ marginTop: 4 }}>
              {decision.affected_agents.map((agent, idx) => (
                <Tag key={idx} color="blue" size="small">
                  {agent}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {decision.agents_involved && decision.agents_involved.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">参与Agent：</Text>
            <div style={{ marginTop: 4 }}>
              {decision.agents_involved.map((agent, idx) => (
                <Tag key={idx} color="cyan" size="small">
                  {agent}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {decision.strategy && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">执行策略：</Text>
            <Text code style={{ marginLeft: 8 }}>{decision.strategy}</Text>
          </div>
        )}

        {decision.alternatives && decision.alternatives.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">备选方案：</Text>
            <div style={{ marginTop: 8 }}>
              {decision.alternatives.map((alt, idx) => (
                <div key={idx} style={{ 
                  padding: '8px 12px', 
                  background: '#fafafa', 
                  borderRadius: 6, 
                  marginBottom: 6 
                }}>
                  <Space>
                    <Text strong>{alt.option}</Text>
                    <Progress
                      percent={alt.score * 100}
                      size="small"
                      strokeColor={getConfidenceColor(alt.score)}
                      style={{ width: 40 }}
                    />
                  </Space>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {alt.reasoning}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card
      className={className}
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space>
            <ThunderboltOutlined style={{ color: '#fa8c16' }} />
            <span>Team决策过程</span>
            <Tag color="orange">{sortedDecisions.length}个决策</Tag>
          </Space>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={isAllExpanded ? <ShrinkOutlined /> : <ExpandOutlined />}
              onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
              style={{ color: '#fa8c16' }}
            >
              {isAllExpanded ? '收起全部' : '展开全部'}
            </Button>
          </Space>
        </div>
      }
      style={{ 
        marginTop: 8,
        border: '1px solid #fa8c16',
        borderRadius: 8
      }}
      headStyle={{
        background: 'linear-gradient(135deg, rgba(250, 140, 22, 0.1) 0%, rgba(250, 140, 22, 0.05) 100%)',
        borderBottom: '1px solid #fa8c16'
      }}
    >
      <Alert
        message="Team智能决策"
        description="以下展示了Team模式下的协调决策过程，包括任务分配、策略选择和结果综合等关键环节。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Timeline
        mode="left"
        items={sortedDecisions.map((decision, index) => ({
          key: index,
          dot: React.cloneElement(
            DECISION_TYPE_CONFIG[decision.type]?.icon || <ClockCircleOutlined />,
            { style: { color: DECISION_TYPE_CONFIG[decision.type]?.color || '#1890ff' } }
          ),
          children: (
            <Card
              size="small"
              style={{ 
                marginBottom: 8,
                border: `1px solid ${DECISION_TYPE_CONFIG[decision.type]?.color || '#d9d9d9'}`,
                borderRadius: 6
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: '14px' }}>
                  {decision.title}
                </Text>
              </div>
              
              <Collapse
                ghost
                expandIconPosition="end"
                activeKey={activeKey}
                onChange={setActiveKey}
              >
                <Panel
                  header={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {DECISION_TYPE_CONFIG[decision.type]?.description || '查看详细信息'}
                    </Text>
                  }
                  key={`decision-${index}`}
                >
                  {renderDecisionContent(decision)}
                </Panel>
              </Collapse>
            </Card>
          )
        }))}
      />

      <Divider style={{ margin: '16px 0 8px 0' }} />
      
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          💡 Team决策过程体现了多Agent协作的智能化程度
        </Text>
      </div>
    </Card>
  );
};

export default TeamDecisionRenderer;