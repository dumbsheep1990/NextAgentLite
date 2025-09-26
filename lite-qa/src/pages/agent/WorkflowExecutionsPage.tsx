import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Space, Tag, Select, Input, Drawer, Typography, message, Timeline, Collapse, Badge } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, ClockCircleTwoTone } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getApiUrl } from '../../config/appConfig';

const { Title, Text } = Typography;

interface ExecRow {
  execution_id: string;
  session_id?: string;
  team_name: string;
  query?: string;
  status: string;
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
}

const WorkflowExecutionsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ExecRow[]>([]);
  const [team, setTeam] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const statusColor = (st?: string) => st === 'completed' ? 'green' : st === 'error' ? 'red' : 'blue';

  const timelineItems = useMemo(() => {
    return (steps || []).map((s: any) => {
      const icon = s.status === 'completed' ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : s.status === 'error' ? <CloseCircleTwoTone twoToneColor="#ff4d4f" /> : <ClockCircleTwoTone twoToneColor="#1677ff" />;
      return {
        dot: icon,
        color: statusColor(s.status),
        children: (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color={statusColor(s.status)}>{s.status}</Tag>
                <b>{s.step_id}</b>
                <span style={{ color: '#999' }}>{s.member_name}</span>
                <Badge status={s.status === 'completed' ? 'success' : s.status === 'error' ? 'error' : 'processing'} text={s.action || ''} />
              </Space>
              <Space>
                {typeof s.duration_ms === 'number' && <Tag>{s.duration_ms} ms</Tag>}
                <span style={{ color: '#999' }}>{s.start_time?.replace('T',' ').replace('Z','')}</span>
              </Space>
            </div>
            <Collapse ghost style={{ marginTop: 8 }}>
              <Collapse.Panel header="输入（input_data）" key="inp">
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(s.input_data, null, 2)}</pre>
              </Collapse.Panel>
              <Collapse.Panel header="输出（output_data / error）" key="out">
                {s.error_message ? (
                  <pre style={{ whiteSpace: 'pre-wrap', color: '#ff4d4f' }}>{s.error_message}</pre>
                ) : (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(s.output_data, null, 2)}</pre>
                )}
              </Collapse.Panel>
            </Collapse>
          </div>
        )
      } as any;
    });
  }, [steps]);

  const load = async () => {
    setLoading(true);
    try {
      const url = new URL(getApiUrl('/workflows/executions'));
      if (team) url.searchParams.set('team_name', team);
      if (status) url.searchParams.set('status', status);
      url.searchParams.set('limit', '100');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data || []);
    } catch (e: any) { message.error(e?.message || '加载失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [team, status]);

  const columns: ColumnsType<ExecRow> = [
    { title: '执行ID', dataIndex: 'execution_id', key: 'eid' },
    { title: '模板', dataIndex: 'team_name', key: 'team' },
    { title: '状态', dataIndex: 'status', key: 'st', render: (v) => <Tag color={v==='completed'?'green':v==='error'?'red':'blue'}>{v}</Tag> },
    { title: '开始时间', dataIndex: 'start_time', key: 'stt' },
    { title: '耗时(ms)', dataIndex: 'duration_ms', key: 'dur', width: 120 },
  ];

  const onRowClick = async (rec: ExecRow) => {
    setSelected(null);
    setSteps([]);
    setOpen(true);
    try {
      const base = getApiUrl(`/workflows/executions/${encodeURIComponent(rec.execution_id)}`);
      const res = await fetch(base);
      if (!res.ok) throw new Error(await res.text());
      const info = await res.json();
      setSelected(info);
      const res2 = await fetch(getApiUrl(`/workflows/executions/${encodeURIComponent(rec.execution_id)}/steps`));
      if (!res2.ok) throw new Error(await res2.text());
      setSteps(await res2.json());
    } catch (e: any) { message.error(e?.message || '加载详情失败'); }
  };

  return (
    <div className="p-6">
      <Space style={{ width: '100%', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>工作流执行历史</Title>
        <Space>
          <Input placeholder="模板名" value={team} onChange={e=>setTeam(e.target.value)} allowClear />
          <Select value={status} onChange={setStatus} style={{ width: 160 }} allowClear placeholder="状态">
            <Select.Option value="running">running</Select.Option>
            <Select.Option value="completed">completed</Select.Option>
            <Select.Option value="error">error</Select.Option>
          </Select>
        </Space>
      </Space>
      <Card size="small">
        <Table rowKey="execution_id" columns={columns} loading={loading} dataSource={rows} onRow={(rec)=>({ onClick: ()=>onRowClick(rec) })} />
      </Card>

      <Drawer open={open} onClose={()=>setOpen(false)} width={960} title="执行详情">
        {!selected ? <Text type="secondary">加载中...</Text> : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small" title="基本信息">
              <Space wrap>
                <Tag color={statusColor(selected.status)}>{selected.status}</Tag>
                <Tag>模板：{selected.team_name}</Tag>
                <Tag>执行ID：{selected.execution_id}</Tag>
                {typeof selected.duration_ms === 'number' && <Tag>耗时：{selected.duration_ms} ms</Tag>}
                {selected.start_time && <Tag>开始：{selected.start_time.replace('T',' ').replace('Z','')}</Tag>}
              </Space>
              {selected.query && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Query：</Text>
                  <div style={{ fontFamily: 'monospace' }}>{selected.query}</div>
                </div>
              )}
            </Card>
            <Card size="small" title="步骤时间线">
              {steps.length === 0 ? (
                <Text type="secondary">暂无步骤</Text>
              ) : (
                <div style={{ maxHeight: 520, overflow: 'auto' }}>
                  <Timeline mode="left" items={timelineItems as any} />
                </div>
              )}
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default WorkflowExecutionsPage;
