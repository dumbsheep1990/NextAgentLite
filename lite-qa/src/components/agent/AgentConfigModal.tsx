import React from 'react';
import { Modal, Space, Divider, Empty } from 'antd';

interface AgentConfigModalProps {
  visible: boolean;
  agent: {
    id: string;
    name: string;
    model?: string;
    tools?: string[];
    toolsWithNames?: Array<{ code: string; name: string; type?: string }>;
    collections?: Array<{ id: string; name: string; document_count?: number }>;
    retrieval_strategy?: string;
    rerank_model?: string;
    temperature?: number;
    top_k?: number;
  };
  onClose: () => void;
}

const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ visible, agent, onClose }) => {
  // 工具信息映射
  const toolInfo: Record<string, { name: string; type: string; desc: string }> = {
    'builtin:baidusearch': {
      name: '百度搜索',
      type: 'search',
      desc: '实时网络搜索引擎'
    },
    'builtin:duckduckgo': {
      name: 'DuckDuckGo',
      type: 'search',
      desc: '注重隐私的搜索引擎'
    },
    'custom:web_crawler': {
      name: '网页爬虫',
      type: 'crawler',
      desc: '抓取网页内容'
    },
    'custom:api_tool': {
      name: 'API工具',
      type: 'api',
      desc: '调用外部API接口'
    },
  };

  const getToolInfo = (toolId: string) => {
    if (toolInfo[toolId]) return toolInfo[toolId];
    const cleanName = toolId.replace('builtin:', '').replace('custom:', '');
    return {
      name: cleanName,
      type: 'other',
      desc: '自定义工具'
    };
  };

  const typeColors: Record<string, string> = {
    search: '#1890ff',
    api: '#722ed1',
    crawler: '#52c41a',
    database: '#fa8c16',
    'pre-hook': '#13c2c2',
    'post-hook': '#eb2f96',
    other: '#8c8c8c'
  };

  return (
    <Modal
      title="智能体配置"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 0 8px 0' }}>

        {/* 集成工具 */}
        {(() => {
          const toolsList = agent.toolsWithNames ||
            (agent.tools?.map(t => ({ code: t, name: getToolInfo(t).name, type: getToolInfo(t).type })) || []);

          return toolsList.length > 0 ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#262626',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  集成工具
                  <span style={{
                    fontSize: '12px',
                    color: '#8c8c8c',
                    fontWeight: 400
                  }}>
                    ({toolsList.length})
                  </span>
                </div>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {toolsList.map((tool) => {
                    const toolType = tool.type || 'other';
                    const toolColor = typeColors[toolType] || typeColors.other;
                    const toolDesc = tool.type === 'pre-hook'
                      ? '预处理Hook，在主流程前执行'
                      : tool.type === 'post-hook'
                      ? '后处理Hook，在主流程后执行'
                      : getToolInfo(tool.code).desc;

                    return (
                      <div
                        key={tool.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          background: '#fafafa',
                          borderRadius: '8px',
                          gap: '12px',
                          border: '1px solid #f0f0f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = toolColor;
                          e.currentTarget.style.background = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#f0f0f0';
                          e.currentTarget.style.background = '#fafafa';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: 2 }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                            {toolDesc}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: toolColor + '15',
                            color: toolColor,
                            fontWeight: 500
                          }}
                        >
                          {toolType}
                        </span>
                      </div>
                    );
                  })}
                </Space>
              </div>
              <Divider style={{ margin: '20px 0' }} />
            </>
          ) : null;
        })()}

        {/* 知识库 */}
        {agent.collections && agent.collections.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#262626',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                知识库
                <span style={{
                  fontSize: '12px',
                  color: '#8c8c8c',
                  fontWeight: 400
                }}>
                  ({agent.collections.length})
                </span>
              </div>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {agent.collections.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f6ffed',
                      borderRadius: '8px',
                      gap: '12px',
                      border: '1px solid #d9f7be',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#52c41a';
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9f7be';
                      e.currentTarget.style.background = '#f6ffed';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: 2 }}>
                        {col.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#52c41a' }}>
                        {col.document_count || 0} 个文档
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#52c41a15',
                        color: '#52c41a',
                        fontWeight: 500
                      }}
                    >
                      已启用
                    </span>
                  </div>
                ))}
              </Space>
            </div>
            <Divider style={{ margin: '20px 0' }} />
          </>
        ) : null}

        {/* 模型与策略 */}
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#262626',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            模型与策略
          </div>

          <div style={{
            background: '#f5f5ff',
            border: '1px solid #d9d9ff',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {/* LLM模型 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '12px', color: '#595959', minWidth: '70px' }}>
                  LLM模型:
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#531dab',
                  fontFamily: 'monospace'
                }}>
                  {agent.model || 'qwen3-30b-a3b-instruct-2507'}
                </span>
              </div>

              {/* 检索策略 */}
              {agent.retrieval_strategy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '12px', color: '#595959', minWidth: '70px' }}>
                    检索策略:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#fa8c16' }}>
                    {agent.retrieval_strategy === 'hybrid'
                      ? '混合检索 (向量 + 关键词)'
                      : agent.retrieval_strategy}
                  </span>
                </div>
              )}

              {/* 重排序模型 */}
              {agent.rerank_model && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '12px', color: '#595959', minWidth: '70px' }}>
                    重排序:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#1890ff' }}>
                    {agent.rerank_model}
                  </span>
                </div>
              )}

              {/* Top-K */}
              {agent.top_k && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '12px', color: '#595959', minWidth: '70px' }}>
                    Top-K:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    {agent.top_k}
                  </span>
                </div>
              )}

              {/* 温度 */}
              {agent.temperature !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '12px', color: '#595959', minWidth: '70px' }}>
                    温度:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    {agent.temperature}
                  </span>
                </div>
              )}
            </Space>
          </div>
        </div>

        {/* 无配置提示 */}
        {(() => {
          const toolsList = agent.toolsWithNames || agent.tools || [];
          const hasNoTools = toolsList.length === 0;
          const hasNoCollections = !agent.collections || agent.collections.length === 0;

          return hasNoTools && hasNoCollections ? (
            <Empty
              description="暂无配置信息"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : null;
        })()}
      </div>
    </Modal>
  );
};

export default AgentConfigModal;
