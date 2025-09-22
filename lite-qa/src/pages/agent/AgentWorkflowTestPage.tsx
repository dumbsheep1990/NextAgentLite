import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Input, Button, Checkbox, Row, Col, Typography, Space, Tag, Select, message } from 'antd';
import { getApiUrl } from '../../config/appConfig';
import { userAgentService } from '../../services/userAgentService';
import type { AgentTool, ModelOption } from '../../services/userAgentService';
import { runWorkflowStream } from '../../services/workflowService';
import type { RunWorkflowParams, WorkflowEvent } from '../../services/workflowService';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const AgentWorkflowTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [modelId, setModelId] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('请执行一次工作流测试。');
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const runRef = useRef<{ abort: () => void } | null>(null);

  const groupedModels = useMemo(() => {
    const g: Record<string, ModelOption[]> = {};
    models.forEach(m => {
      const key = m.provider || '未分组';
      if (!g[key]) g[key] = [];
      g[key].push(m);
    });
    return g;
  }, [models]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [m, t] = await Promise.all([
          userAgentService.getAvailableModels(),
          userAgentService.getAvailableTools()
        ]);
        setModels(m);
        setTools(t);
        if (m.length > 0) setModelId(m[0].id);
      } catch (e: any) {
        message.error(e?.message || '加载工作流测试所需数据失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      try { runRef.current?.abort(); } catch {}
    };
  }, []);

  const startRun = async () => {
    if (!prompt.trim()) {
      message.warning('请输入测试提示词');
      return;
    }
    if (!modelId) {
      message.warning('请选择模型');
      return;
    }
    try {
      setEvents([]);
      setLoading(true);
      const params: RunWorkflowParams = {
        agent_name: 'workflow_agent',
        prompt,
        selected_tools: selectedTools,
        model: modelId,
      };
      const handle = await runWorkflowStream(params, (ev) => {
        setEvents(prev => [...prev, ev]);
      });
      runRef.current = handle;
    } catch (e: any) {
      message.error(e?.message || '启动工作流失败');
    } finally {
      setLoading(false);
    }
  };

  const stopRun = () => {
    try { runRef.current?.abort(); } catch {}
    message.info('已停止');
  };

  const builtin = tools.filter(t => t.tool_type === 'builtin');
  const mcp = tools.filter(t => t.tool_type === 'mcp');
  const api = tools.filter(t => t.tool_type === 'api');
  const custom = tools.filter(t => !['builtin','mcp','api'].includes(t.tool_type));

  const renderToolGroup = (title: string, list: AgentTool[]) => (
    <Card size="small" title={<>{title} <Tag color="blue">{list.length}</Tag></>} className="mb-3">
      <Space direction="vertical" style={{ width: '100%' }}>
        {list.length === 0 ? <Text type="secondary">暂无</Text> : list.map(t => (
          <Checkbox
            key={t.tool_code}
            checked={selectedTools.includes(t.tool_code)}
            onChange={e => {
              const checked = e.target.checked;
              setSelectedTools(prev => checked ? [...prev, t.tool_code] : prev.filter(x => x !== t.tool_code));
            }}
          >{t.tool_name} <Tag>{t.tool_type}</Tag></Checkbox>
        ))}
      </Space>
    </Card>
  );

  return (
    <div className="p-6">
      <Title level={4}>工作流测试（异步事件流）</Title>
      <Row gutter={16}>
        <Col span={10}>
          <Card size="small" title="配置" loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>模型</Text>
                <Select
                  style={{ width: '100%' }}
                  value={modelId}
                  onChange={setModelId}
                  popupClassName="agent-wizard-select-dropdown"
                >
                  {Object.entries(groupedModels).map(([prov, items]) => (
                    <Select.OptGroup key={prov} label={prov}>
                      {items.map(m => (
                        <Option key={m.id} value={m.id} label={m.name}>{m.name}</Option>
                      ))}
                    </Select.OptGroup>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>提示词</Text>
                <TextArea rows={6} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="输入用于工作流执行的提示词" />
              </div>

              <Space>
                <Button type="primary" onClick={startRun} loading={loading}>开始运行</Button>
                <Button onClick={stopRun}>停止</Button>
              </Space>
            </Space>
          </Card>

          {renderToolGroup('内置工具', builtin)}
          {renderToolGroup('MCP 服务', mcp)}
          {renderToolGroup('API 配置', api)}
          {renderToolGroup('自定义工具', custom)}
        </Col>
        <Col span={14}>
          <Card size="small" title="事件流">
            <div style={{ height: 520, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {events.map((ev, i) => (
                <div key={i}>
                  {JSON.stringify(ev, null, 2)}
                </div>
              ))}
              {events.length === 0 && <Text type="secondary">尚无事件</Text>}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AgentWorkflowTestPage;
