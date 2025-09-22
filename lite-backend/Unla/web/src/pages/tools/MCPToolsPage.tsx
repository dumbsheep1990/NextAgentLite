import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, Button, Chip, Input, Modal, ModalBody, ModalContent, ModalHeader, Spinner } from '@heroui/react';
import LocalIcon from '@/components/LocalIcon';
import { getMCPServers } from '@/services/api';
import type { Gateway } from '@/types/gateway';
import { toast } from '@/utils/toast';
import { mcpGatewayApi } from '@/services/llm-config';

type ServerRow = {
  tenant: string;
  config: string;
  serverName: string;
  prefix?: string;
  running: boolean;
  raw: Gateway;
}

const MCPToolsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [showToolsOf, setShowToolsOf] = useState<string | null>(null);
  const [tools, setTools] = useState<Array<{name:string;description?:string}>>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const getUnlaGatewayBase = () => {
    const rc = (window as any)?.RUNTIME_CONFIG;
    const fromRC = rc?.UNLA_GATEWAY_BASE as string | undefined;
    // 支持 .env 本地配置
    const fromEnv = (import.meta as any)?.env?.VITE_UNLA_GATEWAY_BASE as string | undefined;
    return (fromRC || fromEnv || 'http://localhost:5235').replace(/\/$/, '');
  };

  const load = async () => {
    try {
      setLoading(true);
      const servers: Gateway[] = await getMCPServers();
      const list: ServerRow[] = [];
      // Build server->prefix map (best-effort)
      const prefixMap: Record<string, string> = {};
      for (const cfg of servers) {
        for (const r of (cfg.routers || []) as any[]) {
          if (r.server && r.prefix && !prefixMap[r.server]) prefixMap[r.server] = r.prefix as string;
        }
      }
      const registry = await mcpGatewayApi.registry();
      for (const cfg of servers) {
        const tenant = cfg.tenant || 'default';
        const configName = cfg.name;
        for (const ms of (cfg.mcpServers || []) as any[]) {
          const sName = (ms.name as string) || '';
          let prefix = prefixMap[sName] || (sName ? `/${sName}` : undefined);
          const reg = Array.isArray(registry) ? registry.find((r: any) => r.name === sName) : null;
          list.push({ tenant, config: configName, serverName: sName, prefix, running: reg?.status === 'running', raw: cfg });
        }
      }
      setRows(list);
    } catch (e) {
      toast.error('加载工具列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.serverName || '').toLowerCase().includes(q) || r.config.toLowerCase().includes(q) || r.tenant.toLowerCase().includes(q));
  }, [rows, query]);

  const startServer = async (row: ServerRow) => {
    try {
      setBusy(prev=>({...prev, [row.serverName]: true}));
      await mcpGatewayApi.startServer(row.serverName);
      toast.success('已启动');
      await load();
    } catch (e:any) {
      toast.error(`启动失败：${e.message || e}`);
    } finally {
      setBusy(prev=>{ const n={...prev}; delete n[row.serverName]; return n; });
    }
  };

  const stopServer = async (row: ServerRow) => {
    try {
      setBusy(prev=>({...prev, [row.serverName]: true}));
      await mcpGatewayApi.stopServer(row.serverName);
      toast.success('已停止');
      await load();
    } catch (e:any) {
      toast.error(`停止失败：${e.message || e}`);
    } finally {
      setBusy(prev=>{ const n={...prev}; delete n[row.serverName]; return n; });
    }
  };

  const restartServer = async (row: ServerRow) => {
    try {
      setBusy(prev=>({...prev, [row.serverName]: true}));
      await mcpGatewayApi.stopServer(row.serverName).catch(()=>{});
      await mcpGatewayApi.startServer(row.serverName);
      toast.success('已重启');
      await load();
    } catch (e:any) {
      toast.error(`重启失败：${e.message || e}`);
    } finally {
      setBusy(prev=>{ const n={...prev}; delete n[row.serverName]; return n; });
    }
  };

  const viewTools = async (row: ServerRow) => {
    try {
      const list = await mcpGatewayApi.listTools(row.serverName);
      setTools(list || []);
      setShowToolsOf(row.serverName);
    } catch (e:any) {
      toast.error(`获取工具失败：${e.message || e}`);
    }
  };

  // legacy function removed: runtime now uses 9050 APIs

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LocalIcon icon="lucide:terminal" className="text-default-500" />
          <h1 className="text-lg font-semibold">MCP 工具管理</h1>
        </div>
        <div className="w-64">
          <Input size="sm" placeholder="搜索服务器/配置/租户" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><LocalIcon icon="lucide:loader-2" className="animate-spin text-2xl" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((r, idx) => (
              <Card
                key={`${r.tenant}-${r.config}-${r.serverName}-${idx}`}
                className="transition-all hover:shadow-lg rounded-xl border border-default-200/60 bg-content1/60 backdrop-blur"
              >
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-default-100 flex items-center justify-center">
                        <LocalIcon icon="custom:mcp" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate text-sm">{r.serverName || '(未命名 MCP)'}</div>
                        <div className="text-xs text-default-500 truncate font-mono">{r.prefix || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${r.running ? 'bg-success-100 text-success-700' : 'bg-default-100 text-default-600'}`}>
                        <span className={`w-1 h-1 rounded-full ${r.running ? 'bg-success-500' : 'bg-default-400'}`} />
                        {r.running ? '已启动' : '未启动'}
                      </span>
                      <Button
                        size="sm"
                        variant="light"
                        className="min-w-0 px-2 py-1 text-xs"
                        onPress={()=>viewTools(r)}
                      >
                        查看工具
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-2xs text-default-500">
                    <Chip size="sm" variant="flat">租户: {r.tenant}</Chip>
                    <Chip size="sm" variant="flat">配置: {r.config}</Chip>
                  </div>

                  {/* 协议地址（通过 5235 暴露的网关前缀） */}
                  <div className="mt-1 p-1.5 rounded-md bg-content2/40 border border-default-200/70">
                    {r.prefix ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-default-500">AllInOne - Nginx</div>
                        <div className="font-mono text-[10px] text-default-600">SSE {r.prefix}/sse</div>
                        <div className="font-mono text-[10px] text-default-600">HTTP {r.prefix}/mcp</div>
                        <div className="text-[10px] text-default-500 mt-0.5">直连 MCP Gateway</div>
                        <div className="font-mono text-[10px] text-default-600 break-all">SSE {getUnlaGatewayBase()}{r.prefix}/sse</div>
                        <div className="font-mono text-[10px] text-default-600 break-all">HTTP {getUnlaGatewayBase()}{r.prefix}/mcp</div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-default-400">未检测到路由前缀，无法生成协议地址</div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {r.running ? (
                      <>
                        <Button size="sm" color="danger" variant="solid" isDisabled={!!busy[r.serverName]} onPress={()=> stopServer(r)}>
                          {busy[r.serverName] ? <Spinner size="sm" /> : '停止'}
                        </Button>
                        <Button size="sm" color="secondary" variant="solid" isDisabled={!!busy[r.serverName]} onPress={()=> restartServer(r)}>
                          {busy[r.serverName] ? <Spinner size="sm" /> : '重启'}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" color={'success'} variant={'solid'} isDisabled={!!busy[r.serverName]} onPress={()=> startServer(r)}>
                        {busy[r.serverName] ? <Spinner size="sm" /> : '启动'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      )}

      <Modal isOpen={!!showToolsOf} onOpenChange={()=>setShowToolsOf(null)}>
        <ModalContent>
          <ModalHeader>工具列表：{showToolsOf}</ModalHeader>
          <ModalBody>
            <div className="space-y-1">
              {tools.length === 0 ? (
                <div className="text-default-400 text-sm">暂无工具（请先启动再试）</div>
              ) : tools.map((t,i)=> (
                <div key={i} className="flex items-center justify-between text-sm py-1">
                  <div className="truncate"><span className="font-medium">{t.name}</span><span className="text-default-400 ml-2">{t.description||''}</span></div>
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MCPToolsPage;
