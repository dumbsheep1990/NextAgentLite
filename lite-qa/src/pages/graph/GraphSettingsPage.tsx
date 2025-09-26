import React, { useEffect, useMemo, useState } from 'react';
import { Card, Descriptions, Tag, Space, Button, Alert, Typography, Select, message, Modal } from 'antd';
import { ReloadOutlined, CloudServerOutlined, ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { getMatGraphHealthUrl } from '../../config/appConfig';

const { Text, Paragraph } = Typography;

type HealthResponse = {
  status: string;
  working_directory: string;
  input_directory: string;
  configuration: {
    llm_binding: string;
    llm_binding_host: string | null;
    llm_model: string | null;
    embedding_binding: string;
    embedding_binding_host: string | null;
    embedding_model: string | null;
    enable_rerank: boolean;
    rerank_model: string | null;
    rerank_binding_host: string | null;
    kv_storage: string;
    graph_storage: string;
    vector_storage: string;
    workspace: string;
    embedding_batch_num?: number;
    embedding_func_max_async?: number;
    max_graph_nodes?: number;
    max_tokens?: number;
    cosine_threshold?: number;
  };
  auth_mode: string;
  core_version: string;
  api_version: string;
  webui_title?: string;
  webui_description?: string;
};

type EnabledModels = {
  chat: { provider: string; model_id: string; display_name: string; default?: boolean }[];
  rerank: { provider: string; model_id: string; display_name: string; default?: boolean }[];
  gateway: string;
};

const GraphSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [models, setModels] = useState<EnabledModels | null>(null);
  const [llmModel, setLlmModel] = useState<string | undefined>(undefined);
  const [rerankModel, setRerankModel] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getMatGraphHealthUrl();
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setData(json as HealthResponse);
    } catch (e: any) {
      setError(e?.message || '获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // fetch enabled models from DataGraph which proxies 9050
    (async () => {
      try {
        const url = getMatGraphHealthUrl().replace('/health', '/config/models/enabled');
        const resp = await fetch(url);
        if (resp.ok) {
          const json = (await resp.json()) as EnabledModels;
          setModels(json);
          // initialize selections based on current health
          setLlmModel(prev => prev ?? data?.configuration?.llm_model ?? json.chat.find(m => m.default)?.model_id ?? json.chat[0]?.model_id);
          setRerankModel(prev => prev ?? data?.configuration?.rerank_model ?? json.rerank.find(m => m.default)?.model_id ?? json.rerank[0]?.model_id);
        }
      } catch (e) {
        // ignore silently
      }
    })();
  }, []);

  const isFromGateway = useMemo(() => {
    const host = data?.configuration?.llm_binding_host || '';
    return host.includes(':9050') || host.endsWith('/v1');
  }, [data]);

  const doApply = async () => {
    if (!llmModel && !rerankModel) {
      message.info('未选择任何模型');
      return;
    }
    setSubmitting(true);
    try {
      const url = getMatGraphHealthUrl().replace('/health', '/config/models/apply');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm_model: llmModel, rerank_model: rerankModel, use_gateway: true })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json.updated) {
        message.success('已应用模型配置');
        await fetchHealth();
      } else {
        message.info(json.message || '未发生变更');
      }
    } catch (e: any) {
      message.error(e?.message || '应用失败');
    } finally {
      setSubmitting(false);
    }
  };
  const applySelection = () => {
    Modal.confirm({
      title: '确认应用模型配置',
      content: (
        <div>
          <div>对话模型：<Text code>{llmModel || '-'}</Text></div>
          <div>Rerank模型：<Text code>{rerankModel || '-'}</Text></div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">说明：将通过模型网关(9050)注入配置；Embedding模型不变。</Text>
          </div>
        </div>
      ),
      okText: '应用',
      cancelText: '取消',
      onOk: doApply
    });
  };

  const clearAllData = async () => {
    if (!data) return;
    const url = getMatGraphHealthUrl().replace('/health', '/documents');
    try {
      const resp = await fetch(url, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json.status === 'success' || json.status === 'partial_success') {
        message.success(json.message || '已清除所有数据');
      } else if (json.status === 'busy') {
        message.warning('当前管道繁忙，稍后重试');
      } else {
        message.error(json.message || '清除失败');
      }
    } catch (e: any) {
      message.error(e?.message || '清除失败');
    }
  };

  const confirmClearAll = () => {
    if (!data) return;
    Modal.confirm({
      title: '确认清除所有知识图谱数据？',
      okText: '确认清除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      centered: true,
      content: (
        <div>
          <Paragraph>
            此操作将删除当前工作空间下的所有图谱数据、文档索引及上传文件，且无法恢复。
          </Paragraph>
          <Paragraph>
            工作空间：<Text code>{data.configuration.workspace || '-'}</Text>
          </Paragraph>
          <Paragraph>
            工作目录：<Text code>{data.working_directory}</Text>
          </Paragraph>
          <Paragraph>
            输入目录：<Text code>{data.input_directory}</Text>
          </Paragraph>
        </div>
      ),
      onOk: clearAllData,
    });
  };

  return (
    <div className="p-4">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space size="middle">
            <SettingOutlined />
            <Typography.Title level={4} style={{ margin: 0 }}>知识图谱设置</Typography.Title>
            {isFromGateway && <Tag color="geekblue">模型来源：模型网关(9050)</Tag>}
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchHealth} loading={loading}>刷新</Button>
        </Space>

        {error && (
          <Alert type="error" message="加载失败" description={error} showIcon />
        )}

        {data && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={<Space><CloudServerOutlined /><span>服务信息</span></Space>}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="状态">{data.status === 'healthy' ? <Tag color="green">健康</Tag> : <Tag color="red">异常</Tag>}</Descriptions.Item>
                <Descriptions.Item label="认证模式">{data.auth_mode}</Descriptions.Item>
                <Descriptions.Item label="工作目录"><Text code>{data.working_directory}</Text></Descriptions.Item>
                <Descriptions.Item label="输入目录"><Text code>{data.input_directory}</Text></Descriptions.Item>
                <Descriptions.Item label="版本">core {data.core_version} / api {data.api_version}</Descriptions.Item>
                <Descriptions.Item label="WebUI">{data.webui_title || 'DataGraph WebUI'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<Space><ApiOutlined /><span>模型与检索配置</span></Space>}>
              
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="LLM绑定">{data.configuration.llm_binding}</Descriptions.Item>
                <Descriptions.Item label="LLM模型">
                  <Select
                    style={{ minWidth: 280 }}
                    value={llmModel ?? data.configuration.llm_model ?? undefined}
                    onChange={setLlmModel}
                    placeholder="选择对话模型"
                    options={(models?.chat || []).map(m => ({ label: `${m.display_name}`, value: m.model_id }))}
                    showSearch
                    filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="LLM主机"><Text code>{data.configuration.llm_binding_host || '-'}</Text></Descriptions.Item>

                <Descriptions.Item label={<span>Embedding绑定 <Tag color="gold">未自动注入</Tag></span>}>
                  {data.configuration.embedding_binding}
                </Descriptions.Item>
                <Descriptions.Item label="Embedding模型">{data.configuration.embedding_model || '-'}</Descriptions.Item>
                <Descriptions.Item label="Embedding主机"><Text code>{data.configuration.embedding_binding_host || '-'}</Text></Descriptions.Item>

                <Descriptions.Item label="Rerank启用">{data.configuration.enable_rerank ? <Tag color="green">已启用</Tag> : <Tag>未启用</Tag>}</Descriptions.Item>
                <Descriptions.Item label="Rerank模型">
                  <Select
                    style={{ minWidth: 280 }}
                    value={rerankModel ?? data.configuration.rerank_model ?? undefined}
                    onChange={setRerankModel}
                    placeholder="选择Rerank模型"
                    options={(models?.rerank || []).map(m => ({ label: `${m.display_name}`, value: m.model_id }))}
                    showSearch
                    filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Rerank主机" span={2}><Text code>{data.configuration.rerank_binding_host || '-'}</Text></Descriptions.Item>
              </Descriptions>

              <Paragraph type="secondary" style={{ marginTop: 12 }}>
                说明：模型自动注入仅覆盖「对话模型」与「Rerank模型」，Embedding模型为保持向量维度一致，暂不自动修改。
              </Paragraph>
            </Card>

            <Card title={<Space><SettingOutlined /><span>存储与参数</span></Space>}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="向量存储">{data.configuration.vector_storage}</Descriptions.Item>
                <Descriptions.Item label="图谱存储">{data.configuration.graph_storage}</Descriptions.Item>
                <Descriptions.Item label="KV存储">{data.configuration.kv_storage}</Descriptions.Item>
                <Descriptions.Item label="工作空间">{data.configuration.workspace || '-'}</Descriptions.Item>
                <Descriptions.Item label="节点上限">{data.configuration.max_graph_nodes ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="TopK">{data.configuration.max_tokens ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="阈值">{data.configuration.cosine_threshold ?? '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<Space><SettingOutlined /><span>危险操作</span></Space>}>
              <Alert
                type="warning"
                showIcon
                message="此操作不可恢复"
                description={
                  <span>
                    将删除当前知识图谱的所有存量数据（文档、实体、关系、索引）以及输入目录中的已上传文件。
                  </span>
                }
                style={{ marginBottom: 12 }}
              />
              <Button danger onClick={confirmClearAll}>清除所有数据</Button>
            </Card>
          </Space>
        )}
      </Space>
    </div>
  );
};

export default GraphSettingsPage;
