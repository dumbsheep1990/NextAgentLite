/**
 * NextAgent Lite 团队实例状态显示组件
 * 显示当前团队实例的状态和智能体信息
 */

import React from 'react';
import { Card, Typography, Space, Tag, Avatar, Tooltip, Collapse, List } from 'antd';
import { 
  RobotOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  ClockCircleOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { TeamInstance } from '../../services/teamTemplateService';
import { teamTemplateService } from '../../services/teamTemplateService';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface TeamInstanceStatusProps {
  instance: TeamInstance | null;
  loading?: boolean;
}

const TeamInstanceStatus: React.FC<TeamInstanceStatusProps> = ({
  instance,
  loading = false
}) => {
  if (!instance) {
    return (
      <Card size="small" title={
        <Space>
          <TeamOutlined />
          <span>团队状态</span>
        </Space>
      }>
        <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
          <Text type="secondary">暂无活跃的团队实例</Text>
        </div>
      </Card>
    );
  }

  // 获取状态图标和颜色
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'running':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return '#faad14';
      case 'running':
        return '#1890ff';
      case 'completed':
        return '#52c41a';
      case 'failed':
        return '#f5222d';
      default:
        return '#8c8c8c';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return '已创建';
      case 'running':
        return '运行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  // 获取智能体列表
  const agentList = Object.entries(instance.agents || {}).map(([agentId, config]) => ({
    id: agentId,
    name: config.name,
    description: config.description,
    model: config.model_id
  }));

  return (
    <Card 
      size="small" 
      loading={loading}
      title={
        <Space>
          <TeamOutlined />
          <span>团队实例</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 基本信息 */}
        <div>
          <Space>
            <Text strong>{instance.team_name}</Text>
            <Tag color={getStatusColor(instance.status)}>
              {getStatusIcon(instance.status)}
              <span style={{ marginLeft: '4px' }}>{getStatusText(instance.status)}</span>
            </Tag>
          </Space>
          <div style={{ marginTop: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              执行模式: {teamTemplateService.getExecutionModeDisplayName(instance.execution_mode)}
            </Text>
          </div>
        </div>

        {/* 智能体信息 */}
        <Collapse size="small" ghost>
          <Panel 
            header={
              <Space>
                <RobotOutlined />
                <span>智能体配置 ({agentList.length}个)</span>
              </Space>
            }
            key="agents"
          >
            <List
              size="small"
              dataSource={agentList}
              renderItem={(agent) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <Space>
                    <Avatar size="small" icon={<RobotOutlined />} />
                    <div>
                      <Text strong style={{ fontSize: '12px' }}>{agent.name}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {agent.description}
                        </Text>
                      </div>
                      <div>
                        <Tag size="small" color="blue">
                          {agent.model}
                        </Tag>
                      </div>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Panel>
        </Collapse>

        {/* 时间信息 */}
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            创建时间: {new Date(instance.created_at).toLocaleString('zh-CN')}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default TeamInstanceStatus;