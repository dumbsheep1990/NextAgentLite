import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Space, Button, Table, Tag, Switch, Input, InputNumber, message, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { userAgentService } from '../../services/userAgentService';
import { listGatewayApiConfigs, listGatewayEmbeddingModels } from '../../services/workflowService';
import type { AgentTemplate } from '../../services/userAgentService';

const { Title, Text } = Typography;

type ReqItem = {
  key?: string;
  type: 'knowledge_collection' | 'graph_service' | 'mcp_server' | 'embedding_model' | 'api_config' | string;
  required: boolean;
  name?: string;      // for mcp_server / api etc.
  host?: string;      // for graph_service
  port?: number;      // for graph_service
  provider?: string;  // for embedding_model
  model?: string;     // for embedding_model
};

const DEFAULT_ROW: ReqItem = { type: 'knowledge_collection', required: true };

const TemplateRequirementsEditor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [tplId, setTplId] = useState<string>('');
  const [reqs, setReqs] = useState<ReqItem[]>([]);
  const tpl = useMemo(() => templates.find(t => t.id === tplId), [templates, tplId]);
  const [apiConfigs, setApiConfigs] = useState<any[]>([]);
  const [embeddingMap, setEmbeddingMap] = useState<Record<string, any[]>>({});

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await userAgentService.getAgentTemplates();
      setTemplates(list || []);
      if (!tplId && list?.length) setTplId(list[0].id);
    } catch (e: any) { message.error(e?.message || '加载模板失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const [apis, embs] = await Promise.all([
          listGatewayApiConfigs().catch(()=>[]),
          listGatewayEmbeddingModels().catch(()=>({}))
        ]);
        setApiConfigs(apis || []);
        setEmbeddingMap(embs || {});
      } catch {}
    })();
  }, []);
  useEffect(() => {
    // 同步选择模板的 requirements
    if (!tpl) { setReqs([]); return; }
    const bc = (tpl.base_config || {}) as any;
    const arr = Array.isArray(bc.requirements) ? bc.requirements : [];
    setReqs((arr || []).map((r: any, idx: number) => ({ key: `${idx}`, ...r })));
  }, [tpl]);

  const addRow = () => setReqs(prev => ([...prev, { ...DEFAULT_ROW, key: `${Date.now()}` }]));
  const removeRow = (key?: string) => setReqs(prev => prev.filter(r => r.key !== key));

  const updateRow = (key: string, patch: Partial<ReqItem>) => setReqs(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));

  const columns: ColumnsType<ReqItem> = [
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 220,
      render: (v, r) => (
        <Select value={r.type} style={{ width: 200 }} onChange={(val) => updateRow(r.key!, { type: val as any })}>
          <Select.Option value="knowledge_collection">知识库</Select.Option>
          <Select.Option value="graph_service">知识图谱服务</Select.Option>
          <Select.Option value="mcp_server">MCP服务器</Select.Option>
          <Select.Option value="embedding_model">向量模型</Select.Option>
          <Select.Option value="api_config">API配置</Select.Option>
        </Select>
      )
    },
    {
      title: '必需', dataIndex: 'required', key: 'required', width: 100,
      render: (v, r) => (<Switch checked={!!r.required} onChange={(val)=>updateRow(r.key!, { required: val })} />)
    },
    {
      title: '名称/主机', key: 'name_host',
      render: (_, r) => (
        r.type === 'mcp_server' ? (
          <Input placeholder="服务器名（如 playwright）" value={r.name} onChange={e=>updateRow(r.key!, { name: e.target.value })} style={{ width: 240 }} />
        ) : r.type === 'graph_service' ? (
          <Space>
            <Input placeholder="host" value={r.host} onChange={e=>updateRow(r.key!, { host: e.target.value })} style={{ width: 160 }} />
            <InputNumber placeholder="port" value={r.port} onChange={(val)=>updateRow(r.key!, { port: Number(val)||0 })} />
          </Space>
        ) : r.type === 'embedding_model' ? (
          <Space>
            <Select placeholder="provider" value={r.provider} onChange={(v)=>updateRow(r.key!, { provider: v })} style={{ width: 200 }} allowClear>
              {Object.keys(embeddingMap).map(p => (<Select.Option key={p} value={p}>{p}</Select.Option>))}
            </Select>
            <Select placeholder="model（精确匹配）" value={r.model} onChange={(v)=>updateRow(r.key!, { model: v })} style={{ width: 260 }} allowClear>
              {(embeddingMap[r.provider || ''] || []).map((m:any) => (
                <Select.Option key={m.id} value={m.id}>{m.id}</Select.Option>
              ))}
            </Select>
          </Space>
        ) : r.type === 'api_config' ? (
          <Select placeholder="API配置名" value={r.name} onChange={(v)=>updateRow(r.key!, { name: v })} style={{ width: 260 }} showSearch allowClear
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {apiConfigs.map((c:any)=> (<Select.Option key={c.name} value={c.name}>{c.name}</Select.Option>))}
          </Select>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '操作', key: 'op', width: 120,
      render: (_, r) => (<Button danger size="small" onClick={()=>removeRow(r.key)}>删除</Button>)
    }
  ];

  const save = async () => {
    if (!tpl) { message.warning('请选择模板'); return; }
    try {
      const base = { ...(tpl.base_config || {}), requirements: reqs.map(({ key, ...rest}) => rest) };
      await userAgentService.updateTemplateBaseConfig(tpl.id, base);
      message.success('已保存');
      await loadTemplates();
    } catch (e: any) { message.error(e?.message || '保存失败'); }
  };

  const selfCheck = async () => {
    if (!tpl) { message.warning('请选择模板'); return; }
    try {
      const code = tpl.template_code || tpl.template_name;
      const res = await userAgentService.getTemplateRequirements(code);
      const list = res?.requirements || [];
      if (list.length === 0) { message.info('未声明任何需求'); return; }
      const msgs = list.map((r: any) => {
        if (r.type === 'graph_service') return `${r.type}: ${r.host || '127.0.0.1'}:${r.port || 9622} → ${r.healthy ? '健康' : '未就绪'}`;
        if (r.type === 'mcp_server') return `${r.type}: ${r.name} → ${r.present ? '可用' : '缺失'}`;
        if (r.type === 'embedding_model') return `${r.type}: provider=${r.provider || '-'} model=${r.model || '-'} → ${r.available ? '可用' : '不可用'}`;
        if (r.type === 'knowledge_collection') return `${r.type}: 可用集合=${r.available_collections}`;
        return `${r.type}`;
      }).join('\n');
      message.success(`自检结果:\n${msgs}`.replace(/\n/g, '\n'));
    } catch (e: any) { message.error(e?.message || '自检失败'); }
  };

  return (
    <div className="p-6">
      <Space style={{ width: '100%', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>模板资源需求编辑器</Title>
        <Space>
          <Select value={tplId} onChange={setTplId} style={{ width: 360 }} loading={loading}>
            {templates.map(t => (<Select.Option key={t.id} value={t.id}>{t.template_name} <Tag style={{ marginLeft: 8 }}>{t.template_type}</Tag></Select.Option>))}
          </Select>
          <Button onClick={addRow}>添加需求</Button>
          <Button onClick={selfCheck}>一键自检</Button>
          <Button type="primary" onClick={save}>保存</Button>
        </Space>
      </Space>
      <Card size="small">
        <Table rowKey={(r)=>r.key!} columns={columns} dataSource={reqs} pagination={false} />
      </Card>
    </div>
  );
};

export default TemplateRequirementsEditor;
