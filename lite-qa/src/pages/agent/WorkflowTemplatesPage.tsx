import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Table, Space, Modal, Input, message, Tag, Drawer, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  listWorkflowTemplates,
  upsertWorkflowTemplate,
  deleteWorkflowTemplate,
  validateWorkflowTemplate,
  runTemplateStream,
} from '../../services/workflowService';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface TemplateRow {
  id: string;
  template_name: string;
  description?: string;
  is_default?: boolean;
  team_config?: any;
  execution_flow: any;
  created_at?: string;
  updated_at?: string;
}

const WorkflowTemplatesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [teamConfigStr, setTeamConfigStr] = useState<string>('{\n  "timeout_seconds": 30\n}');
  const [flowStr, setFlowStr] = useState<string>('{}');
  const [running, setRunning] = useState(false);
  const [runDrawer, setRunDrawer] = useState(false);
  const [runPrompt, setRunPrompt] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const runHandle = useRef<{ abort: () => void } | null>(null);
  const [runTemplateName, setRunTemplateName] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listWorkflowTemplates();
      setRows(data || []);
    } catch (e: any) {
      message.error(e?.message || '加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); return () => { try { runHandle.current?.abort(); } catch {} }; }, []);

  const columns: ColumnsType<TemplateRow> = [
    { title: '名称', dataIndex: 'template_name', key: 'name', render: (v, r) => (<Space>{v}{r.is_default && <Tag color="green">默认</Tag>}</Space>) },
    { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
    { title: '更新时间', dataIndex: 'updated_at', key: 'ut', width: 180 },
    {
      title: '操作', key: 'op', width: 320, render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => onEdit(r)}>编辑</Button>
          <Button size="small" onClick={() => onValidate(r)}>校验</Button>
          <Button size="small" type="primary" onClick={() => onRun(r)}>运行</Button>
          <Button size="small" danger onClick={() => onDelete(r)}>删除</Button>
        </Space>
      )
    }
  ];

  const onNew = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setTeamConfigStr('{\n  "timeout_seconds": 30\n}');
    setFlowStr('{\n  "steps": [],\n  "dependencies": {}\n}');
    setOpenEditor(true);
  };

  const onEdit = (r: TemplateRow) => {
    setEditing(r);
    setName(r.template_name);
    setDesc(r.description || '');
    setTeamConfigStr(JSON.stringify(r.team_config || {}, null, 2));
    setFlowStr(JSON.stringify(r.execution_flow || {}, null, 2));
    setOpenEditor(true);
  };

  const onValidate = async (r?: TemplateRow) => {
    try {
      const team = r ? (r.team_config || {}) : JSON.parse(teamConfigStr || '{}');
      const flow = r ? (r.execution_flow || {}) : JSON.parse(flowStr || '{}');
      const res = await validateWorkflowTemplate(team, flow);
      if (res.ok) message.success('校验通过'); else message.error('校验失败：' + (res.issues || []).join('；'));
    } catch (e: any) { message.error(e?.message || '校验失败'); }
  };

  const onSave = async () => {
    try {
      const team = JSON.parse(teamConfigStr || '{}');
      const flow = JSON.parse(flowStr || '{}');
      const res = await upsertWorkflowTemplate({ template_name: name.trim(), description: desc, team_config: team, execution_flow: flow, is_default: editing?.is_default || false });
      message.success('保存成功');
      setOpenEditor(false);
      await load();
    } catch (e: any) { message.error(e?.message || '保存失败'); }
  };

  const onDelete = (r: TemplateRow) => {
    Modal.confirm({ title: `删除模板 ${r.template_name}?`, onOk: async () => { try { await deleteWorkflowTemplate(r.template_name); message.success('已删除'); await load(); } catch (e: any) { message.error(e?.message || '删除失败'); } } });
  };

  const onRun = async (r: TemplateRow) => {
    setRunPrompt('');
    setEvents([]);
    setRunTemplateName(r.template_name);
    setRunDrawer(true);
    setRunning(false);
  };

  const stopRun = () => { try { runHandle.current?.abort(); } catch {} setRunning(false); };

  const startRun = async () => {
    if (!runTemplateName) { message.warning('未选择模板'); return; }
    setEvents([]);
    setRunning(true);
    try {
      runHandle.current = await runTemplateStream({ template_name: runTemplateName, prompt: runPrompt }, (ev) => setEvents(prev => [...prev, ev]));
    } catch (e: any) { message.error(e?.message || '启动运行失败'); setRunning(false); }
  };

  return (
    <div className="p-6">
      <Space style={{ width: '100%', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>工作流模板管理</Title>
        <Button type="primary" onClick={onNew}>新建模板</Button>
      </Space>
      <Card size="small">
        <Table rowKey="template_name" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal open={openEditor} onCancel={() => setOpenEditor(false)} onOk={onSave} width={960} title={(editing ? '编辑模板' : '新建模板')}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="模板名称" value={name} onChange={e => setName(e.target.value)} disabled={!!editing} />
          <Input placeholder="描述" value={desc} onChange={e => setDesc(e.target.value)} />
          <div>
            <Text strong>Team Config (JSON)</Text>
            <TextArea rows={6} value={teamConfigStr} onChange={e => setTeamConfigStr(e.target.value)} spellCheck={false} />
          </div>
          <div>
            <Text strong>Execution Flow (JSON)</Text>
            <TextArea rows={10} value={flowStr} onChange={e => setFlowStr(e.target.value)} spellCheck={false} />
          </div>
          <Space>
            <Button onClick={() => onValidate(undefined)}>校验</Button>
          </Space>
        </Space>
      </Modal>

      <Drawer open={runDrawer} onClose={() => { setRunDrawer(false); stopRun(); }} width={720} title="运行模板（SSE）">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="运行提示词（可选）" value={runPrompt} onChange={e => setRunPrompt(e.target.value)} />
          <Space>
            {!running ? <Button type="primary" onClick={startRun}>开始</Button> : <Button danger onClick={stopRun}>停止</Button>}
          </Space>
          <Card size="small" title="事件流">
            <div style={{ height: 420, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {events.length === 0 ? <Text type="secondary">尚无事件</Text> : events.map((e, i) => (<div key={i}>{JSON.stringify(e, null, 2)}</div>))}
            </div>
          </Card>
        </Space>
      </Drawer>
    </div>
  );
};

export default WorkflowTemplatesPage;
