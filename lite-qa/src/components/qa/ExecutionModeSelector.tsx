/**
 * NextAgent Lite 执行模式选择器组件
 * 用于选择智能体团队的执行模式
 */

import React, { useEffect } from 'react';
import { Select, Card, Typography, Space, Tooltip, Spin, Alert } from 'antd';
import { RobotOutlined, SearchOutlined, ShareAltOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTeamTemplateStore } from '../../stores/teamTemplateStore';
import { teamTemplateService } from '../../services/teamTemplateService';

const { Option } = Select;
const { Text } = Typography;

interface ExecutionModeSelectorProps {
  value?: string;
  onChange?: (mode: string) => void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const ExecutionModeSelector: React.FC<ExecutionModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'middle'
}) => {
  const {
    executionModes,
    loading,
    errors,
    loadExecutionModes,
    clearErrors
  } = useTeamTemplateStore();

  useEffect(() => {
    // 组件挂载时加载执行模式
    loadExecutionModes();
  }, [loadExecutionModes]);

  // 获取模式图标
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'direct_answer':
        return <RobotOutlined style={{ color: '#52c41a' }} />;
      case 'knowledge_retrieval':
        return <SearchOutlined style={{ color: '#1890ff' }} />;
      case 'graph_enhanced':
        return <ShareAltOutlined style={{ color: '#722ed1' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // 获取模式颜色
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'direct_answer':
        return '#52c41a';
      case 'knowledge_retrieval':
        return '#1890ff';
      case 'graph_enhanced':
        return '#722ed1';
      default:
        return '#8c8c8c';
    }
  };

  if (loading.modes) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            加载执行模式...
          </Text>
        </div>
      </Card>
    );
  }

  if (errors.modes) {
    return (
      <Alert
        type="error"
        message="加载执行模式失败"
        description={errors.modes}
        showIcon
        closable
        onClose={clearErrors}
      />
    );
  }

  if (!executionModes) {
    return (
      <Alert
        type="warning"
        message="无可用执行模式"
        description="请检查系统配置或联系管理员"
        showIcon
      />
    );
  }

  const currentValue = value || executionModes.default_mode;

  return (
    <Card size="small" title="执行模式" extra={
      <Tooltip title="选择不同的执行模式来优化问答体验">
        <QuestionCircleOutlined />
      </Tooltip>
    }>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          size={size}
          style={{ width: '100%' }}
          placeholder="选择执行模式"
        >
          {executionModes.available_modes.map(mode => (
            <Option key={mode} value={mode}>
              <Space>
                {getModeIcon(mode)}
                <span>{teamTemplateService.getExecutionModeDisplayName(mode)}</span>
              </Space>
            </Option>
          ))}
        </Select>
        
        {/* 显示当前模式的描述 */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          borderLeft: `4px solid ${getModeColor(currentValue)}`
        }}>
          <Space>
            {getModeIcon(currentValue)}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {executionModes.mode_descriptions[currentValue] || 
               teamTemplateService.getExecutionModeDescription(currentValue)}
            </Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default ExecutionModeSelector;