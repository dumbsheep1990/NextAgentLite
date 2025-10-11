/**
 * Action操作面板组件 - 展示工具调用的Action和Observation
 * 默认折叠，可以点击展开查看详情
 */
import React, { useState } from 'react';
import { Card, Collapse, Tag, Space, Typography } from 'antd';
import {
  ThunderboltOutlined,
  EyeOutlined,
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ActionInfo {
  action: string;
  actionInput: Record<string, any>;
  observation?: string;
  status: 'executing' | 'completed' | 'failed';
}

interface ActionPanelProps {
  content: string; // 完整的消息内容
  className?: string;
}

/**
 * 从消息内容中提取Action信息
 */
const extractActionInfo = (content: string): ActionInfo | null => {
  // 匹配 Action: xxx Action Input: {...} 或 Action: xxx
  const actionPatternWithInput = /Action:\s*(\w+)\s*Action Input:\s*(\{[^}]+\})/;
  const actionPatternSimple = /Action:\s*(\w+)/;

  let match = content.match(actionPatternWithInput);
  let actionName: string;
  let actionInput: Record<string, any> = {};

  if (match) {
    // 有Action Input
    actionName = match[1];
    try {
      actionInput = JSON.parse(match[2]);
    } catch (e) {
      console.error('解析Action Input失败:', e);
    }
  } else {
    // 只有Action
    match = content.match(actionPatternSimple);
    if (!match) {
      return null;
    }
    actionName = match[1];
  }

  // 提取Observation
  const observationPattern = /Observation:\s*([\s\S]*?)(?=Final Answer:|$)/;
  const observationMatch = content.match(observationPattern);
  const observation = observationMatch ? observationMatch[1].trim() : undefined;

  // 判断状态
  const status = observation ? 'completed' : 'executing';

  return {
    action: actionName,
    actionInput,
    observation,
    status
  };
};

/**
 * Action面板组件
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({ content, className }) => {
  const [expanded, setExpanded] = useState(false);
  const actionInfo = extractActionInfo(content);

  if (!actionInfo) {
    return null;
  }

  const { action, actionInput, observation, status } = actionInfo;

  // 获取工具显示名称
  const getActionDisplayName = (actionName: string): string => {
    const nameMap: Record<string, string> = {
      'baidusearch': '百度搜索',
      'baidu_search': '百度搜索',
      'google_search': '谷歌搜索',
      'web_search': '网络搜索',
      'knowledge_search': '知识库检索',
      'database_query': '数据库查询'
    };
    return nameMap[actionName.toLowerCase()] || actionName;
  };

  // 获取状态信息
  const getStatusInfo = () => {
    switch (status) {
      case 'executing':
        return {
          icon: <ClockCircleOutlined spin />,
          text: '执行中',
          color: '#1890ff'
        };
      case 'completed':
        return {
          icon: <CheckCircleOutlined />,
          text: '已完成',
          color: '#52c41a'
        };
      case 'failed':
        return {
          icon: <ClockCircleOutlined />,
          text: '失败',
          color: '#ff4d4f'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={className} style={{ marginBottom: 16 }}>
      <Card
        size="small"
        style={{
          background: 'rgba(24, 144, 255, 0.03)',
          border: '1px solid rgba(24, 144, 255, 0.15)',
          borderRadius: 8,
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* 折叠头部 - 可点击展开/收起 */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background 0.2s',
            background: expanded ? 'rgba(24, 144, 255, 0.05)' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!expanded) {
              e.currentTarget.style.background = 'rgba(24, 144, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!expanded) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <Space size="middle">
            {expanded ? <DownOutlined style={{ fontSize: 12, color: '#1890ff' }} /> : <RightOutlined style={{ fontSize: 12, color: '#1890ff' }} />}
            <ThunderboltOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 14 }}>
              {getActionDisplayName(action)}
            </Text>
            <Tag
              icon={statusInfo.icon}
              color={statusInfo.color}
              style={{ margin: 0, fontSize: 12 }}
            >
              {statusInfo.text}
            </Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            点击{expanded ? '收起' : '查看'}详情
          </Text>
        </div>

        {/* 折叠内容 */}
        {expanded && (
          <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(24, 144, 255, 0.1)' }}>
            {/* Action输入参数 */}
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" strong style={{ fontSize: 12 }}>
                调用参数：
              </Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: 4,
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {JSON.stringify(actionInput, null, 2)}
              </div>
            </div>

            {/* Observation结果 */}
            {observation && (
              <div style={{ marginTop: 16 }}>
                <Space>
                  <EyeOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary" strong style={{ fontSize: 12 }}>
                    执行结果：
                  </Text>
                </Space>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: 'rgba(82, 196, 26, 0.03)',
                    border: '1px solid rgba(82, 196, 26, 0.15)',
                    borderRadius: 4,
                    fontSize: 13,
                    lineHeight: 1.8,
                    maxHeight: 400,
                    overflowY: 'auto'
                  }}
                >
                  <Paragraph
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {observation}
                  </Paragraph>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ActionPanel;
