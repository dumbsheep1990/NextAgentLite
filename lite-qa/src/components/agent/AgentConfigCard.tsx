import React, { useState } from 'react';
import { Space, Tag, Button, Tooltip, Popover } from 'antd';
import { InfoCircleOutlined, DownOutlined } from '@ant-design/icons';
import AgentConfigModal from './AgentConfigModal';

interface AgentConfigCardProps {
  agent: {
    id: string;
    name: string;
    model?: string;
    tools?: string[];
    toolsWithNames?: Array<{ code: string; name: string; type?: string }>;
    collections?: Array<{ id: string; name: string; document_count?: number }>;
    retrieval_strategy?: string;
    rerank_model?: string;
  };
}

const AgentConfigCard: React.FC<AgentConfigCardProps> = ({ agent }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [toolsPopoverVisible, setToolsPopoverVisible] = useState(false);

  // 工具显示名称映射（不含emoji）
  const toolNames: Record<string, string> = {
    'builtin:baidusearch': '百度搜索',
    'builtin:duckduckgo': 'DuckDuckGo',
    'builtin:reasoning': 'reasoning',
    'custom:web_crawler': '网页爬虫',
    'custom:api_tool': 'API工具',
  };

  const getToolDisplay = (tool: string) => {
    if (toolNames[tool]) return toolNames[tool];

    // 处理自定义爬虫工具格式：custom_crawler:数字ID
    if (tool.startsWith('custom_crawler:')) {
      const id = tool.replace('custom_crawler:', '');
      // 尝试从工具代码中提取有意义的名称
      return `自定义爬虫-${id}`;
    }

    // 其他格式的清理
    const cleanName = tool.replace(/^(builtin|custom|custom_crawler):/, '');
    return cleanName || tool;
  };

  const getModelShortName = (model?: string) => {
    if (!model) return 'qwen3-30b';
    // 简化模型名称显示
    if (model.includes('qwen3-30b')) return 'qwen3-30b';
    if (model.includes('qwen')) return 'qwen';
    return model.split('-')[0] || model;
  };

  return (
    <>
      <div className="agent-config-bar">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          flex: 1
        }}>
          {/* 工具标签 */}
          <Space size={4} wrap>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>工具:</span>
            {(() => {
              // 优先使用 toolsWithNames，否则使用 tools
              const toolsList = agent.toolsWithNames ||
                (agent.tools?.map(t => ({ code: t, name: getToolDisplay(t) })) || []);

              if (toolsList.length === 0) {
                return <span style={{ fontSize: '11px', color: '#bfbfbf' }}>未配置</span>;
              }

              return (
                <>
                  {/* 显示前3个工具 */}
                  {toolsList.slice(0, 3).map((tool) => (
                    <Tag key={tool.code} style={{ margin: 0, fontSize: '11px' }} color="blue">
                      {tool.name}
                    </Tag>
                  ))}
                  {/* 如果超过3个，显示总数和下拉 */}
                  {toolsList.length > 3 && (
                    <Popover
                      open={toolsPopoverVisible}
                      onOpenChange={setToolsPopoverVisible}
                      content={
                        <div style={{ maxWidth: 300 }}>
                          <div style={{
                            fontWeight: 500,
                            marginBottom: 8,
                            fontSize: '13px',
                            color: '#262626'
                          }}>
                            全部工具 ({toolsList.length})
                          </div>
                          <Space size={4} wrap>
                            {toolsList.map((tool) => (
                              <Tag key={tool.code} style={{ margin: 0, fontSize: '11px' }} color="blue">
                                {tool.name}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      }
                      trigger="click"
                    >
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          cursor: 'pointer',
                          background: '#e6f7ff',
                          borderColor: '#91d5ff'
                        }}
                        icon={<DownOutlined style={{ fontSize: '10px' }} />}
                      >
                        共{toolsList.length}个
                      </Tag>
                    </Popover>
                  )}
                </>
              );
            })()}
          </Space>

          <span style={{ color: '#d9d9d9' }}>|</span>

          {/* 知识库标签 */}
          <Space size={4} wrap>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>知识库:</span>
            {agent.collections && agent.collections.length > 0 ? (
              agent.collections.map((col) => (
                <Tag key={col.id} style={{ margin: 0, fontSize: '11px' }} color="green">
                  {col.name}
                </Tag>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: '#bfbfbf' }}>未配置</span>
            )}
          </Space>

          <span style={{ color: '#d9d9d9' }}>|</span>

          {/* 模型配置 */}
          <Space size={4} wrap>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>模型:</span>
            <Tag style={{ margin: 0, fontSize: '11px' }} color="purple">
              {agent.model ? getModelShortName(agent.model) : '未配置'}
            </Tag>
          </Space>

          {/* 检索策略 */}
          {agent.retrieval_strategy && (
            <Tag style={{ margin: 0, fontSize: '11px' }} color="orange">
              {agent.retrieval_strategy === 'hybrid' ? '混合检索' : agent.retrieval_strategy}
            </Tag>
          )}

          {/* 重排序模型 */}
          {agent.rerank_model && (
            <Tag style={{ margin: 0, fontSize: '11px' }} color="cyan">
              重排序: {agent.rerank_model}
            </Tag>
          )}
        </div>

        {/* 详情按钮 */}
        <Tooltip title="查看详细配置">
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ flexShrink: 0 }}
          >
            详情
          </Button>
        </Tooltip>
      </div>

      {/* 详情Modal */}
      <AgentConfigModal
        visible={modalVisible}
        agent={agent}
        onClose={() => setModalVisible(false)}
      />

      <style>{`
        .agent-config-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          background: #fafafa;
          border-bottom: 1px solid #e8e8e8;
          transition: all 0.2s;
        }

        .agent-config-bar:hover {
          background: #f5f5f5;
        }
      `}</style>
    </>
  );
};

export default AgentConfigCard;
