import React, { useEffect, useState } from 'react';

type RunItem = {
  id: number;
  created_at: string;
  finished_at?: string;
  agent_name?: string;
  mode?: string;
  model_id?: string;
  model_provider?: string;
  status?: string;
  selected_tools_preview?: string;
  prompt_preview?: string;
};

const ToolsRunListPage: React.FC = () => {
  const [items, setItems] = useState<RunItem[]>([]);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [agentName, setAgentName] = useState('');
  const [mode, setMode] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<any|null>(null);

  const load = async (ofs=0) => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(ofs));
      if (agentName) params.set('agent_name', agentName);
      if (mode) params.set('mode', mode);
      if (status) params.set('status', status);
      const r = await fetch(`/api/v1/agents/tools/runs?`+params.toString());
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || '加载失败');
      setItems(Array.isArray(data?.items) ? data.items : []);
      setOffset(ofs);
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const view = async (id:number) => {
    try {
      const r = await fetch(`/api/v1/agents/tools/runs/${id}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || '加载失败');
      setDetail(data?.data || null);
    } catch (e:any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(()=>{ load(0); }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">工具执行记录</h1>
        <div className="text-xs text-default-500">记录 Agent 工具调用的输出与调试信息</div>
      </div>

      <div className="border rounded p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label>Agent：</label>
          <input className="border rounded px-2 py-1 text-xs" value={agentName} onChange={e=>setAgentName(e.target.value)} placeholder="tools_tester" />
          <label>模式：</label>
          <select className="border rounded px-2 py-1 text-xs" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="">全部</option>
            <option value="auto">auto</option>
            <option value="manual_react">manual_react</option>
          </select>
          <label>状态：</label>
          <select className="border rounded px-2 py-1 text-xs" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">全部</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </select>
          <button className="ml-2 text-xs px-3 py-1.5 rounded bg-primary-600 text-white" onClick={()=>load(0)} disabled={loading}>{loading? '加载中…':'查询'}</button>
        </div>
      </div>

      <div className="border rounded overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-default-100">
            <tr>
              <th className="text-left p-2">时间</th>
              <th className="text-left p-2">Agent</th>
              <th className="text-left p-2">模式</th>
              <th className="text-left p-2">状态</th>
              <th className="text-left p-2">模型</th>
              <th className="text-left p-2">工具</th>
              <th className="text-left p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="p-3 text-default-500" colSpan={7}>暂无数据</td></tr>
            ) : items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</td>
                <td className="p-2">{it.agent_name || '-'}</td>
                <td className="p-2">{it.mode || '-'}</td>
                <td className="p-2">{it.status || '-'}</td>
                <td className="p-2">{it.model_id || '-'}</td>
                <td className="p-2 max-w-[240px] truncate" title={it.selected_tools_preview}>{it.selected_tools_preview}</td>
                <td className="p-2">
                  <button className="text-xs px-2 py-1 rounded bg-default-100" onClick={()=>view(it.id)}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button className="text-xs px-2 py-1 rounded bg-default-100" disabled={offset===0 || loading} onClick={()=>load(Math.max(0, offset-limit))}>上一页</button>
        <button className="text-xs px-2 py-1 rounded bg-default-100" disabled={items.length < limit || loading} onClick={()=>load(offset+limit)}>下一页</button>
      </div>

      {err && <div className="text-xs text-danger-500">错误：{err}</div>}

      {detail && (
        <div className="border rounded p-3 bg-content2/30">
          <div className="text-sm font-medium mb-2">执行详情（ID: {detail.id}）</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-default-500">时间</div>
              <div>{new Date(detail.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-default-500">Agent / 模式 / 状态</div>
              <div>{detail.agent_name} / {detail.mode} / {detail.status}</div>
            </div>
            <div>
              <div className="text-default-500">模型</div>
              <div>{detail.model_id || '-'}</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-default-500 text-xs mb-1">Prompt</div>
            <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all max-h-40 overflow-auto">{detail.prompt}</pre>
          </div>
          <div className="mt-2">
            <div className="text-default-500 text-xs mb-1">输出</div>
            <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all max-h-40 overflow-auto">{detail.output}</pre>
          </div>
          {detail.error && (
            <div className="mt-2">
              <div className="text-danger-500 text-xs mb-1">错误</div>
              <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all max-h-40 overflow-auto">{detail.error}</pre>
            </div>
          )}
          {detail.debug_logs && (
            <div className="mt-2">
              <div className="text-default-500 text-xs mb-1">调试日志</div>
              <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all max-h-40 overflow-auto">{detail.debug_logs}</pre>
            </div>
          )}
          {detail.manual_run && (
            <div className="mt-2">
              <div className="text-default-500 text-xs mb-1">回退执行器（ReAct）轮次</div>
              <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all max-h-60 overflow-auto">{JSON.stringify(detail.manual_run, null, 2)}</pre>
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button className="text-xs px-3 py-1.5 rounded bg-default-100" onClick={()=>setDetail(null)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsRunListPage;

