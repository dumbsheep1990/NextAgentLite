import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Button, Chip, Input, Modal, ModalBody, ModalContent, ModalHeader, Textarea, Spinner } from '@heroui/react';
import LocalIcon from '@/components/LocalIcon';
import { apiToolsGatewayApi, apiToolsMgmtApi } from '@/services/llm-config';
import { toast } from '@/utils/toast';

type ServerMeta = { name: string; base_url?: string; allowed?: number };
type RouterMeta = { prefix: string; server: string };
type ConfigRow = { name: string; tools: number; servers?: ServerMeta[]; routers?: RouterMeta[] };

const APIToolsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<ConfigRow | null>(null);
  const [tools, setTools] = useState<Array<{name:string;description?:string;method:string;endpoint:string}>>([]);
  const [argText, setArgText] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [routePrefix, setRoutePrefix] = useState('');
  const [routeServer, setRouteServer] = useState('');

  const getGatewayBase = () => {
    const rc = (window as any)?.RUNTIME_CONFIG;
    const fromRC = rc?.LLM_GATEWAY_URL as string | undefined;
    const fromEnv = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL as string | undefined;
    return (fromRC || fromEnv || 'http://127.0.0.1:9050').replace(/\/$/, '');
  };

  const load = async () => {
    try {
      setLoading(true);
      // 尝试先同步一次，保证DB更新后可见
      try { await apiToolsGatewayApi.syncFromUnlaDb(); } catch {}
      const list = await apiToolsGatewayApi.listConfigs();
      setRows(list);
    } catch (e) {
      toast.error('加载API工具失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const openTools = async (cfgName: string) => {
    try {
      const t = await apiToolsGatewayApi.listTools(cfgName);
      setTools(t);
      const row = rows.find(r=>r.name===cfgName) || null;
      setSelectedRow(row);
      if (row && row.servers && row.servers.length>0) { setRouteServer(row.servers[0].name); }
      setSelected(cfgName);
    } catch (e:any) {
      toast.error(`获取工具失败：${e.message || e}`);
    }
  };

  const callTool = async (cfgName: string, toolName: string) => {
    try {
      setBusy(prev=>({...prev,[toolName]:true}));
      let payload: any = {};
      const key = `${cfgName}:${toolName}`;
      const txt = argText[key];
      if (txt && txt.trim()) {
        try { payload = JSON.parse(txt); } catch { toast.error('参数需为 JSON'); return; }
      }
      const res = await apiToolsGatewayApi.call(cfgName, toolName, payload);
      toast.success(`调用成功(${res.status})`);
    } catch (e:any) {
      toast.error(`调用失败：${e.message || e}`);
    } finally {
      setBusy(prev=>{ const n={...prev}; delete n[toolName]; return n; });
    }
  };

  const allowTool = async (server: string, tool: string, add: boolean) => {
    if (!selected) return;
    try {
      await apiToolsMgmtApi.allow(selected, { server, tools: [tool], action: add ? 'add' : 'remove' });
      toast.success(add ? '已允许' : '已取消允许');
      const list = await apiToolsGatewayApi.listConfigs();
      setRows(list);
    } catch (e:any) {
      toast.error(`操作失败：${e.message || e}`);
    }
  };

  const addRouter = async () => {
    if (!selected) return;
    if (!routePrefix || !routeServer) { toast.error('请输入前缀并选择服务'); return; }
    try {
      await apiToolsMgmtApi.routers(selected, { action: 'add', prefix: routePrefix, server: routeServer });
      toast.success('已添加路由');
      const list = await apiToolsGatewayApi.listConfigs();
      setRows(list);
      setRoutePrefix('');
    } catch (e:any) {
      toast.error(`添加路由失败：${e.message || e}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LocalIcon icon="lucide:route" className="text-default-500" />
          <h1 className="text-lg font-semibold">API 管理（网关）</h1>
        </div>
        <div className="w-64">
          <Input size="sm" placeholder="搜索配置名称" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><LocalIcon icon="lucide:loader-2" className="animate-spin text-2xl" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((r, idx) => (
            <Card key={`${r.name}-${idx}`} className="transition-all hover:shadow-lg rounded-xl border border-default-200/60 bg-content1/60 backdrop-blur">
              <CardBody className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-sm">{r.name}</div>
                    <div className="text-xs text-default-500">工具数：{r.tools}</div>
                  </div>
                  <Button size="sm" variant="light" className="min-w-0 px-2 py-1 text-xs" onPress={()=>openTools(r.name)}>查看工具</Button>
                </div>
                <div className="space-y-1">
                  {r.servers && r.servers.length > 0 ? (
                    <div>
                      <div className="text-2xs text-default-500 mb-1">HTTP 服务</div>
                      <div className="flex flex-col gap-1">
                        {r.servers.slice(0,3).map((s, i) => (
                          <div key={s.name+String(i)} className="flex items-center justify-between text-2xs">
                            <div className="truncate">
                              <span className="font-medium">{s.name}</span>
                              {s.base_url && s.base_url !== '<nil>' ? <span className="text-default-500 ml-1 truncate">{s.base_url}</span> : null}
                            </div>
                            <Chip size="sm" variant="flat" color="success">已允许 {s.allowed ?? 0}</Chip>
                          </div>
                        ))}
                        {r.servers.length > 3 && (
                          <div className="text-2xs text-default-400">… 共 {r.servers.length} 个</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xs text-default-400">未绑定 HTTP 服务</div>
                  )}
                  <div>
                    <div className="text-2xs text-default-500 mb-1">路由</div>
                    {r.routers && r.routers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.routers.slice(0,4).map((rt, i) => (
                          <Chip key={rt.prefix+String(i)} size="sm" variant="flat">{rt.prefix}<span className="text-default-400">@{rt.server}</span></Chip>
                        ))}
                        {r.routers.length > 4 && <Chip size="sm" variant="flat">…{r.routers.length}</Chip>}
                      </div>
                    ) : (
                      <div className="text-2xs text-default-400">暂无路由（不可对外访问）</div>
                    )}
                  </div>
                  {/* 紧凑的调用地址展示（仅用于提示，不替代测试） */}
                  <div className="mt-1 p-1.5 rounded-md bg-content2/40 border border-default-200/70">
                    <div className="text-[10px] text-default-500">测试（9050 直连）</div>
                    <div className="font-mono text-[10px] text-default-600 break-all">{getGatewayBase()}/api-tools/configs/{r.name}/tools/&lt;tool&gt;/call</div>
                    {r.routers && r.routers.length>0 ? (
                      <>
                        <div className="text-[10px] text-default-500 mt-0.5">网关前缀（5235）</div>
                        <div className="font-mono text-[10px] text-default-600 break-all">{r.routers[0].prefix}</div>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onOpenChange={()=>{setSelected(null); setTools([]); setSelectedRow(null);}}>
        <ModalContent>
          <ModalHeader>API 工具：{selected}</ModalHeader>
          <ModalBody>
            {selectedRow && (
              <div className="mb-2 p-2 rounded-lg bg-content2/60 border border-default-200">
                <div className="text-2xs text-default-500 mb-1">绑定的 HTTP 服务与路由</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {(selectedRow.servers||[]).map((s)=> (
                    <Chip key={s.name} size="sm" variant="flat">{s.name}<span className="text-default-400"> · 允许 {s.allowed ?? 0}</span></Chip>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(selectedRow.routers||[]).map((r)=> (
                    <Chip key={r.prefix+':'+r.server} size="sm" variant="flat">{r.prefix}<span className="text-default-400">@{r.server}</span></Chip>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input size="sm" placeholder="新增路由前缀，如 /api/public" value={routePrefix} onChange={e=>setRoutePrefix(e.target.value)} className="max-w-xs" />
                  <select className="border rounded-md text-sm px-2 py-1" value={routeServer} onChange={e=>setRouteServer(e.target.value)}>
                    {(selectedRow.servers||[]).map(s=> (<option key={s.name} value={s.name}>{s.name}</option>))}
                  </select>
                  <Button size="sm" color="primary" variant="flat" onPress={addRouter}>添加路由</Button>
                </div>
              </div>
            )}
            {tools.length === 0 ? (
              <div className="text-default-400 text-sm">暂无工具</div>
            ) : tools.map((t)=> {
              const key = `${selected}:${t.name}`;
              return (
                <div key={t.name} className="p-2 border border-default-200 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm truncate">{t.name}</div>
                    <Chip size="sm" variant="flat">{t.method}</Chip>
                  </div>
                  <div className="text-xs text-default-500 break-all">{t.endpoint}</div>
                  <div className="text-xs text-default-400">{t.description || '-'}</div>
                  <div className="mt-2 space-y-1">
                    <Textarea minRows={2} size="sm" placeholder='调用参数（JSON，可留空）。示例：{"args":{"path":{},"query":{},"headers":{},"body":{}}}' value={argText[key] || ''} onChange={(e)=> setArgText(prev=>({...prev,[key]: e.target.value}))} />
                    <div className="flex items-center justify-between">
                      {selectedRow && (selectedRow.servers||[]).length>0 ? (
                        <div className="flex items-center gap-2 text-2xs">
                          <span className="text-default-500">绑定到:</span>
                          {(selectedRow.servers||[]).map(s => (
                            <div key={s.name} className="flex items-center gap-1">
                              <Button size="sm" variant="light" onPress={()=>allowTool(s.name, t.name, true)}>允许</Button>
                              <Button size="sm" variant="light" onPress={()=>allowTool(s.name, t.name, false)}>取消</Button>
                              <span className="text-default-400">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : <div />}
                      <Button size="sm" color="primary" variant="solid" isDisabled={!!busy[t.name]} onPress={()=>callTool(selected!, t.name)}>
                        {busy[t.name] ? <Spinner size="sm" /> : '测试调用'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default APIToolsPage;
