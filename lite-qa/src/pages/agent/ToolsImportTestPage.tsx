import React, { useEffect, useMemo, useState } from 'react';

type MCPServer = { name: string; status?: string; prefix?: string };
type MCPTool = { name: string; description?: string };
type APIConfig = { name: string };
type APITool = { name: string; description?: string; method?: string; endpoint?: string };
type ModelItem = { id: number; model_id: string; display_name: string; model_type: string; provider_name: string; provider_type: string };

const getGatewayBase = (): string => {
  const rc = (window as any)?.RUNTIME_CONFIG;
  const fromRC = rc?.LLM_GATEWAY_URL as string | undefined;
  const fromEnv = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL as string | undefined;
  return (fromRC || fromEnv || 'http://127.0.0.1:9050').replace(/\/$/, '');
};

const ToolsImportTestPage: React.FC = () => {
  const base = getGatewayBase();
  const [loading, setLoading] = useState(true);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [toolsOf, setToolsOf] = useState<{ kind: 'mcp'|'api'; id: string } | null>(null);
  const [tools, setTools] = useState<Array<MCPTool|APITool>>([]);
  const [quickRunning, setQuickRunning] = useState<string>('');
  const [quickOut, setQuickOut] = useState<string>('');
  const [quickErr, setQuickErr] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState<string>(
    '严格只按以下格式调用本地工具（两行）：\n' +
    'Action: browser_navigate\n' +
    'Action Input: {"url":"https://www.baidu.com"}\n' +
    '系统返回 Observation 后，再只输出：\n' +
    'Action: browser_take_screenshot\n' +
    'Action Input: {"fullPage": true}\n' +
    '最后输出：\n' +
    'Final Answer: 截图的 Base64 前 80 个字符'
  );
  const [execMode, setExecMode] = useState<'auto'|'manual_react'>('auto');
  const [running, setRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [agnoLogs, setAgnoLogs] = useState<string>('');
  const [agnoMeta, setAgnoMeta] = useState<any>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  // 自定义参数测试（MCP）
  const [customTool, setCustomTool] = useState<string>('');
  const [customJSON, setCustomJSON] = useState<string>('{\n  "url": "https://example.com"\n}');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [reg, apis, mods] = await Promise.all([
        fetch(`${base}/mcp/registry`).then(r=>r.json()),
        fetch(`${base}/api-tools/configs`).then(r=>r.json()),
        fetch(`/api/v1/models/models-gateway/models?type=chat&enabled=1`).then(r=>r.json()).catch(()=>[])
      ]);
      const ms: MCPServer[] = Array.isArray(reg) ? reg.map((r: any) => ({ name: r.name, status: r.status, prefix: r.prefix })) : [];
      const ac: APIConfig[] = Array.isArray(apis) ? apis.map((a:any)=>({ name: a.name })) : [];
      setMcpServers(ms);
      setApiConfigs(ac);
      if (Array.isArray(mods)) setModels(mods);
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openMcpTools = async (name: string) => {
    try {
      setToolsOf({ kind: 'mcp', id: name });
      const list = await fetch(`${base}/mcp/servers/${encodeURIComponent(name)}/tools`).then(r=>r.json());
      setTools(Array.isArray(list) ? list : []);
      setQuickOut(''); setQuickErr(''); setQuickRunning('');
    } catch (e:any) {
      setErr(e?.message || String(e));
    }
  };

  const openApiTools = async (name: string) => {
    try {
      setToolsOf({ kind: 'api', id: name });
      const list = await fetch(`${base}/api-tools/configs/${encodeURIComponent(name)}/tools`).then(r=>r.json());
      setTools(Array.isArray(list) ? list : []);
      setQuickOut(''); setQuickErr(''); setQuickRunning('');
    } catch (e:any) {
      setErr(e?.message || String(e));
    }
  };

  // 选择“定义好的 MCP 工具（即服务器）/ API 工具（即配置）”
  const toggleTopLevel = (kind: 'mcp'|'api', id: string) => {
    const key = `${kind}:${id}`;
    setSelected(prev => {
      const n = new Set(Array.from(prev));
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const runAgnoTest = async () => {
    try {
      setRunning(true); setOutput(''); setErr('');
      const body = {
        agent_name: 'tools_tester',
        prompt,
        selected_tools: Array.from(selected),
        model: selectedModel || undefined,
        provider: undefined,
        mode: execMode,
      };
      const r = await fetch('/api/v1/agents/tools/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) {
        try {
          const obj = typeof data.detail === 'string' ? JSON.parse(data.detail) : data.detail;
          setDebugInfo(obj);
          setAgnoLogs(obj?.debug_logs || '');
          throw new Error(obj?.error || '调用失败');
        } catch {
          setDebugInfo(null);
          setAgnoLogs('');
          throw new Error(data?.detail || '调用失败');
        }
      } else {
        setDebugInfo(null);
        setAgnoLogs(data?.debug_logs || '');
        setAgnoMeta(data?.agent_meta || null);
        // 若是回退执行模式，保留 manual_run 以供下方面板展示
        if (execMode === 'manual_react' && data?.manual_run) {
          setDebugInfo({ manual_run: data.manual_run });
        }
      }
      setOutput(typeof data?.output === 'string' ? data.output : JSON.stringify(data, null, 2));
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">工具导入测试</h1>
        <div className="text-xs text-default-500">Gateway: {base}</div>
      </div>

      {loading ? (
        <div className="text-default-500 text-sm">加载中…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">MCP 服务器</div>
            {mcpServers.length === 0 ? (
              <div className="text-xs text-default-400">暂无</div>
            ) : (
              <div className="space-y-1">
                {mcpServers.map(s => (
                  <label key={s.name} className="flex items-center justify-between text-sm cursor-pointer">
                    <div className="truncate">
                      <span className="font-medium">{s.name}</span>
                      {s.prefix ? <span className="ml-2 text-default-500 font-mono text-xs">{s.prefix}</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 rounded bg-default-100" onClick={()=>openMcpTools(s.name)}>查看内置工具</button>
                      <input type="checkbox" className="h-3.5 w-3.5" checked={selected.has(`mcp:${s.name}`)} onChange={()=>toggleTopLevel('mcp', s.name)} />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">API 配置</div>
            {apiConfigs.length === 0 ? (
              <div className="text-xs text-default-400">暂无</div>
            ) : (
              <div className="space-y-1">
                {apiConfigs.map(c => (
                  <label key={c.name} className="flex items-center justify-between text-sm cursor-pointer">
                    <div className="truncate">
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 rounded bg-default-100" onClick={()=>openApiTools(c.name)}>查看接口</button>
                      <input type="checkbox" className="h-3.5 w-3.5" checked={selected.has(`api:${c.name}`)} onChange={()=>toggleTopLevel('api', c.name)} />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toolsOf && (
        <div className="border rounded-lg p-3">
          <div className="text-sm font-medium mb-2">{toolsOf.kind.toUpperCase()} 工具列表 - {toolsOf.id}</div>
          {tools.length === 0 ? (
            <div className="text-xs text-default-400">暂无工具</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左侧：工具清单 */}
              <div className="space-y-1">
                {tools.map((t:any, i:number) => (
                  <div key={i} className="text-xs flex items-center justify-between">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{t.name}</span>
                      {t.method || t.endpoint ? (
                        <span className="ml-2 text-default-500 font-mono text-[10px]">{t.method || ''} {t.endpoint || ''}</span>
                      ) : null}
                      {t.description ? <span className="ml-2 text-default-500 text-[10px]">{t.description}</span> : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* 右侧：快速测试（仅 MCP） */}
              {toolsOf.kind === 'mcp' && (
                <div className="border rounded-lg p-3 bg-content2/30">
                  <div className="text-xs font-medium mb-2">快速测试</div>
                  {(() => {
                    const names = tools.map((t:any)=>String(t.name||'').toLowerCase());
                    const has = (keys:string[]) => keys.find(k=>names.some(n=>n.includes(k)));
                    const server = toolsOf.id;
                    const openName = has(['open','goto','navigate']);
                    const screenshotName = has(['screenshot','snapshot']);
                    const clickName = has(['click']);
                    const typeName = has(['type','fill','input']);

                    const runQuick = async (toolName: string, args: any) => {
                      setQuickRunning(toolName); setQuickErr(''); setQuickOut('');
                      try {
                        const url = `${base}/mcp/servers/${encodeURIComponent(server)}/tools/${encodeURIComponent(toolName)}/call`;
                        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
                        const text = await r.text();
                        if (!r.ok) throw new Error(text || r.statusText);
                        setQuickOut(text);
                      } catch (e:any) {
                        setQuickErr(e?.message || String(e));
                      } finally {
                        setQuickRunning('');
                      }
                    };

                    return (
                      <div className="space-y-2">
                        {openName && (
                          <button
                            className="text-xs px-2 py-1 rounded bg-primary-600 text-white disabled:opacity-50"
                            disabled={quickRunning!==''}
                            onClick={()=>runQuick(openName, { url: 'https://example.com' })}
                          >{quickRunning===openName? '执行中…' : `打开网页 (${openName})`}</button>
                        )}
                        {screenshotName && (
                          <button
                            className="ml-2 text-xs px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                            disabled={quickRunning!==''}
                            onClick={()=>runQuick(screenshotName, { fullPage: true })}
                          >{quickRunning===screenshotName? '执行中…' : `截图 (${screenshotName})`}</button>
                        )}
                        {clickName && (
                          <button
                            className="ml-2 text-xs px-2 py-1 rounded bg-amber-600 text-white disabled:opacity-50"
                            disabled={quickRunning!==''}
                            onClick={()=>runQuick(clickName, { selector: 'a,button' })}
                          >{quickRunning===clickName? '执行中…' : `点击 (${clickName})`}</button>
                        )}
                        {typeName && (
                          <button
                            className="ml-2 text-xs px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                            disabled={quickRunning!==''}
                            onClick={()=>runQuick(typeName, { selector: 'input,textarea', text: 'hello' })}
                          >{quickRunning===typeName? '执行中…' : `输入文本 (${typeName})`}</button>
                        )}
                        {(!openName && !screenshotName && !clickName && !typeName) && (
                          <div className="text-2xs text-default-500">未识别到常用动作（open/screenshot/click/type），仍可在上方选择并通过 Agent 测试。</div>
                        )}

                        {(quickOut || quickErr) && (
                          <div className="mt-2">
                            {quickErr ? (
                              <pre className="text-[11px] text-danger-500 whitespace-pre-wrap break-all">{quickErr}</pre>
                            ) : (
                              <pre className="text-[11px] bg-content2 p-2 rounded whitespace-pre-wrap break-all">{quickOut}</pre>
                            )}
                          </div>
                        )}

                        {/* 自定义参数测试 */}
                        <div className="mt-3 border-t pt-3">
                          <div className="text-xs font-medium mb-2">自定义参数测试</div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-2xs text-default-600">选择工具：</label>
                            <select className="border rounded text-xs px-2 py-1 min-w-[220px]" value={customTool} onChange={e=>setCustomTool(e.target.value)}>
                              <option value="">（请选择）</option>
                              {tools.map((t:any)=> (
                                <option key={t.name} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                            <button
                              className="text-2xs px-2 py-1 rounded bg-default-100"
                              onClick={()=>{
                                const nm = String(customTool||'').toLowerCase();
                                if (!nm) return;
                                if (nm.includes('open') || nm.includes('goto') || nm.includes('navigate')) {
                                  setCustomJSON(JSON.stringify({ url: 'https://example.com' }, null, 2));
                                } else if (nm.includes('screenshot') || nm.includes('snapshot')) {
                                  setCustomJSON(JSON.stringify({ fullPage: true }, null, 2));
                                } else if (nm.includes('click')) {
                                  setCustomJSON(JSON.stringify({ selector: 'a,button' }, null, 2));
                                } else if (nm.includes('type') || nm.includes('fill') || nm.includes('input')) {
                                  setCustomJSON(JSON.stringify({ selector: 'input,textarea', text: 'hello' }, null, 2));
                                } else {
                                  setCustomJSON('{\n  "key": "value"\n}');
                                }
                              }}
                            >插入示例</button>
                          </div>
                          <textarea className="w-full border rounded p-2 text-xs font-mono" rows={6} value={customJSON} onChange={e=>setCustomJSON(e.target.value)} />
                          <div className="mt-2 flex items-center justify-end">
                            <button
                              className="text-xs px-3 py-1.5 rounded bg-secondary-600 text-white disabled:opacity-50"
                              disabled={!customTool || quickRunning!==''}
                              onClick={async()=>{
                                try {
                                  const args = JSON.parse(customJSON || '{}');
                                  setQuickRunning(customTool); setQuickErr(''); setQuickOut('');
                                  const url = `${base}/mcp/servers/${encodeURIComponent(toolsOf.id)}/tools/${encodeURIComponent(customTool)}/call`;
                                  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
                                  const text = await r.text();
                                  if (!r.ok) throw new Error(text || r.statusText);
                                  setQuickOut(text);
                                } catch (e:any) {
                                  if (e?.message?.startsWith('参数 JSON 解析失败')) setQuickErr(e.message);
                                  else setQuickErr(e?.message || String(e));
                                } finally {
                                  setQuickRunning('');
                                }
                              }}
                            >{quickRunning===customTool? '执行中…' : '执行自定义参数'}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 运行区 */}
      <div className="border rounded-lg p-3">
        <div className="text-sm font-medium mb-2">Agno 创建与测试</div>
        <div className="text-2xs text-default-500 mb-2">已选择：{Array.from(selected).join(', ') || '无'}（选择层级：mcp:{'{'}server{'}'} 或 api:{'{'}config{'}'}）</div>
        <div className="mb-2 flex items-center gap-3">
          <label className="text-xs text-default-600">执行模式：</label>
          <select className="border rounded text-xs px-2 py-1" value={execMode} onChange={e=>setExecMode(e.target.value as any)}>
            <option value="auto">自动（Agno）</option>
            <option value="manual_react">回退（手写 ReAct）</option>
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <button className="text-2xs px-2 py-1 rounded bg-default-100" onClick={()=>{
              setPrompt(`严格只按以下格式调用本地工具（两行）：\nAction: browser_navigate\nAction Input: {"url":"https://www.baidu.com"}\n系统返回 Observation 后，再只输出：\nAction: browser_take_screenshot\nAction Input: {"fullPage": true}\n最后输出：\nFinal Answer: 截图的 Base64 前 80 个字符`);
            }}>插入示例A（打开+截图）</button>
            <button className="text-2xs px-2 py-1 rounded bg-default-100" onClick={()=>{
              setPrompt(`先后严格调用以下工具（每次只输出两行）：\n1) Action: browser_navigate\n   Action Input: {"url":"https://www.baidu.com"}\n2) Action: browser_wait_for\n   Action Input: {"selector":"input[name=wd]","timeout_ms":8000}\n3) Action: browser_type\n   Action Input: {"selector":"input[name=wd]","text":"Agno MCP"}\n4) Action: browser_press_key\n   Action Input: {"key":"Enter"}\n5) Action: browser_wait_for\n   Action Input: {"selector":"#content_left","timeout_ms":10000}\n6) Action: browser_take_screenshot\n   Action Input: {"fullPage": true}\n最后仅输出：\nFinal Answer: 搜索结果页截图的 Base64 前 80 个字符`);
            }}>插入示例B（搜索流程）</button>
          </div>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <label className="text-xs text-default-600">选择模型：</label>
          <select className="border rounded text-xs px-2 py-1 min-w-[240px]" value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}>
            <option value="">（使用默认模型）</option>
            {models.map(m => (
              <option key={`${m.provider_name}:${m.model_id}`} value={m.model_id}>
                {m.provider_name ? `[${m.provider_name}] `: ''}{m.model_id}
              </option>
            ))}
          </select>
        </div>
        <textarea className="w-full border rounded p-2 text-sm" rows={3} placeholder="输入测试指令或问题" value={prompt} onChange={e=>setPrompt(e.target.value)} />
        <div className="mt-2 flex items-center justify-end">
          <button className="text-xs px-3 py-1.5 rounded bg-primary-600 text-white disabled:opacity-50" disabled={running} onClick={runAgnoTest}>{running ? '执行中…' : '创建并执行'}</button>
        </div>
        {output && (
          <pre className="mt-2 text-xs bg-content2/50 p-2 rounded whitespace-pre-wrap break-all">{output}</pre>
        )}
        {(agnoLogs || agnoMeta) && execMode==='auto' && (
          <div className="mt-2 border rounded p-3 bg-content2/30">
            <div className="text-sm font-medium mb-2">Agno 执行预览</div>
            <div className="text-2xs text-default-500 mb-2">
              模型：{agnoMeta?.model_id || '未知'}；已选工具：{Array.from(selected).join(', ') || '无'}
            </div>
            <pre className="text-[11px] whitespace-pre-wrap break-all max-h-64 overflow-auto">{agnoLogs || '（无日志）'}</pre>
          </div>
        )}
      </div>

      {err && <div className="text-xs text-danger-500">错误：{err}</div>}
      {debugInfo && (
        <div className="border rounded-lg p-3 bg-warning-50">
          <div className="text-sm font-medium mb-2">调试详情</div>
          <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      {/* 若是回退模式且返回了 manual_run，单独展示执行轮次 */}
      {output && execMode==='manual_react' && debugInfo?.manual_run && (
        <div className="border rounded-lg p-3 bg-content2/30">
          <div className="text-sm font-medium mb-2">回退执行器（ReAct）轮次</div>
          <pre className="text-[11px] whitespace-pre-wrap break-all max-h-64 overflow-auto">{JSON.stringify(debugInfo.manual_run, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ToolsImportTestPage;
