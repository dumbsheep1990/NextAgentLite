import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Button, Typography, Tag, Spin, message, Avatar, Input, Drawer } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TeamStudioSettingsPanel from './TeamStudioSettingsPanel';
import type { TeamMemberConfig } from './TeamStudioSettingsPanel';
import { userAgentService } from '../../../services/userAgentService';
import type { KnowledgeCollection, ModelOption, AgentTool } from '../../../services/userAgentService';
import '../../agent/AgentStudioPage.css';
import RetrievalExecPanel from '../../../components/retrieval/RetrievalExecPanel';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const DEFAULT_TEAM: Array<Partial<TeamMemberConfig>> = [
  { id:'question_decomposition_agent', name:'问题分解', role:'任务拆解', enabled: true, canToggle: true,  prompt:'将复杂问题拆解为可执行子任务。' },
  { id:'intelligent_routing_agent',   name:'智能路由', role:'路径规划', enabled: true, canToggle: false, prompt:'根据问题选择检索路径与资源（必启）。' },
  { id:'knowledge_retrieval_agent',   name:'知识检索', role:'召回证据', enabled: true, canToggle: true,  prompt:'检索相关知识并输出证据。' },
  { id:'summary_answer_agent',        name:'答案总结', role:'总结生成', enabled: true, canToggle: false, prompt:'整合多方结果，生成回答（必启）。' }
];

const TeamAgentStudioPage: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const templateId = sp.get('templateId') || '';

  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [availableTools, setAvailableTools] = useState<AgentTool[]>([]);

  const [teamName, setTeamName] = useState('多智能体团队');
  const [members, setMembers] = useState<TeamMemberConfig[]>(() => DEFAULT_TEAM.map((m,i)=> ({
    id: String(m.id || `member_${i}`),
    name: String(m.name || `成员${i+1}`),
    role: m.role,
    enabled: !!m.enabled,
    prompt: String(m.prompt || ''),
    model: ''
  })));
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [retrievalMode, setRetrievalMode] = useState<'hybrid'|'hirag'>('hybrid');

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolTab, setToolTab] = useState<'builtin'|'mcp'|'api'>('mcp');
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({});
  const [toolQuery, setToolQuery] = useState('');
  const [teamResources, setTeamResources] = useState<Record<string, {
    collectionId?: string; retrievalMode?: 'hybrid'|'hirag'; retrievalTemplateId?: string;
    graphTrigger?: 'auto'|'fixed'; graphQueryMode?: 'local'|'global'|'hybrid'|'naive'|'mix'|'bypass'; graphFixedQuery?: string; graphTopK?: number; graphChunkTopK?: number;
  }>>({});

  // 检索面板（纵向抽屉）
  const [showRetrievalPanel, setShowRetrievalPanel] = useState(false);
  const [retrievalEvents, setRetrievalEvents] = useState<any[]>([]);

  const [timeoutMs, setTimeoutMs] = useState<number>(60000);
  const [maxRetries, setMaxRetries] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'members'|'resources'|'tools'|'execution'>('members');
  const [teamMode, setTeamMode] = useState<'sequential'|'parallel'|'collaborative'>('collaborative');
  const [maxConcurrency, setMaxConcurrency] = useState<number>(2);
  const [maxIterations, setMaxIterations] = useState<number>(3);
  const [perAgentTimeoutMs, setPerAgentTimeoutMs] = useState<number>(15000);
  const [perAgentRetryLimit, setPerAgentRetryLimit] = useState<number>(1);
  const [stopOnFirstSuccess, setStopOnFirstSuccess] = useState<boolean>(false);

  const [mcpToolCache, setMcpToolCache] = useState<Record<string, string[]>>({});
  const renderToolForm = (tool: AgentTool) => {
    if ((tool.tool_type || '').toLowerCase() === 'mcp') {
      const server = tool.tool_code.replace(/^mcp:/, '');
      const list = mcpToolCache[server];
      const current = toolConfigs[tool.tool_code] || {};
      const allowed: string[] = current.allowed_tools || [];
      const loadIfNeeded = async () => {
        if (!list) {
          try {
            const r = await fetch(`/api/v1/gateway/mcp/servers/${encodeURIComponent(server)}/tools`);
            const j = await r.json();
            const names = Array.isArray(j) ? j.map((x:any)=> x?.name || x).filter(Boolean) : [];
            setMcpToolCache(prev => ({ ...prev, [server]: names }));
          } catch {}
        }
      };
      void loadIfNeeded();
      return (
        <div>
          <div style={{ marginBottom: 6, color: '#64748b' }}>选择要启用的 MCP 子工具：</div>
          <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e8ecf3', borderRadius: 8, padding: 8 }}>
            {(mcpToolCache[server] || []).map(name => (
              <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '6px 4px' }}>
                <span>{name}</span>
                <input
                  type="checkbox"
                  checked={allowed.includes(name)}
                  onChange={(e)=>{
                    const v = e.target.checked;
                    const next = v ? Array.from(new Set([...(allowed||[]), name])) : (allowed||[]).filter(x=>x!==name);
                    setToolConfigs(prev => ({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), allowed_tools: next } }));
                  }}
                />
              </div>
            ))}
            {!mcpToolCache[server] && (<div className="empty">加载中…</div>)}
            {mcpToolCache[server] && mcpToolCache[server].length === 0 && (<div className="empty">未发现可用子工具</div>)}
          </div>
        </div>
      );
    }
    const current = toolConfigs[tool.tool_code] || {};
    return (
      <textarea
        rows={5}
        value={(() => { try { return JSON.stringify(current || {}, null, 2);} catch { return '{}'; }})()}
        onChange={(e)=>{
          try { setToolConfigs(prev => ({ ...prev, [tool.tool_code]: JSON.parse(e.target.value || '{}') })); } catch {}
        }}
        style={{ width:'100%', borderRadius:8, border:'1px solid #e8ecf3', padding:8 }}
      />
    );
  };

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    return (availableTools || [])
      .filter(t => (t.tool_type || '').toLowerCase() === toolTab)
      .filter(t => !q || (t.tool_name + ' ' + t.tool_code + ' ' + (t.description||'')).toLowerCase().includes(q));
  }, [availableTools, toolTab, toolQuery]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cols, mods, tools] = await Promise.all([
        userAgentService.getKnowledgeCollections(),
        userAgentService.getAvailableModels(),
        userAgentService.getAvailableTools()
      ]);
      setCollections(cols || []);
      setModels(mods || []);
      setAvailableTools(tools || []);
    } catch (e: any) {
      message.error(e?.message || '加载团队工作室失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, [templateId]);

  // 按模板定义加载团队成员开关约束
  useEffect(() => {
    (async () => {
      if (!templateId) return;
      try {
        const _tpl = await userAgentService.getAgentTemplateDetail(templateId);
        const tpl: any = (_tpl as any)?.data || _tpl; // 兼容 { data: {...} } 包装
        // 团队显示名优先模板名
        if (tpl?.template_name) setTeamName(
          typeof (tpl as any).template_name === 'object'
            ? ((tpl as any).template_name?.zh || (tpl as any).template_name?.cn || (tpl as any).template_name?.en || '团队智能体')
            : (tpl as any).template_name
        );
        if ((import.meta as any).env?.DEV) {
          try {
            // eslint-disable-next-line no-console
            console.debug('[TeamStudio] template-detail', tpl);
          } catch {}
        }

        const KNOWN_NAMES: Record<string, {name:string; role?:string; canToggle?:boolean}> = {
          question_decomposition_agent: { name:'问题分解', role:'任务拆解', canToggle:true },
          intelligent_routing_agent:   { name:'智能路由', role:'路径规划', canToggle:false },
          knowledge_retrieval_agent:   { name:'知识检索', role:'召回证据', canToggle:true },
          summary_answer_agent:        { name:'答案总结', role:'总结生成', canToggle:false },
          translation_agent:           { name:'翻译处理', role:'语言工具', canToggle:true },
          knowledge_graph_agent:       { name:'知识图谱', role:'图谱检索', canToggle:true },
          dag_reconstruction_agent:    { name:'DAG重构', role:'DAG重构', canToggle:true },
        };

        const normText = (v:any, fallback?:string): string => {
          if (v == null) return fallback || '';
          if (typeof v === 'string') return v;
          if (typeof v === 'number' || typeof v === 'boolean') return String(v);
          if (Array.isArray(v)) {
            // 取第一个可用文本或拼接
            const first = v.find(x => typeof x === 'string') || v[0];
            const s = normText(first);
            if (s) return s;
            try { return JSON.stringify(v); } catch { return fallback || ''; }
          }
          if (typeof v === 'object') {
            // 常见多语言与显示键
            const lang = (v as any).zh || (v as any).cn || (v as any)['zh-CN'] || (v as any).en;
            if (lang) return normText(lang, fallback);
            const nameLike = (v as any).name || (v as any).display_name || (v as any).displayName || (v as any).label || (v as any).title || (v as any).text || (v as any).value || (v as any).default;
            if (nameLike) return normText(nameLike, fallback);
            // 兜底：尝试序列化
            try { return JSON.stringify(v); } catch { /* ignore */ }
          }
          return fallback || '';
        };

        // 解析优先级：base_config.team.members > team_members > 默认
        const bc: any = (tpl as any).base_config || {};
        const teamCfg: any = bc.team || {};
        let mems: any[] | undefined = Array.isArray(teamCfg.members) ? teamCfg.members : undefined;

        // 初始化执行参数（若模板提供）
        if (typeof bc.max_iterations === 'number') setMaxIterations(bc.max_iterations);
        if (typeof bc.enable_routing === 'boolean') {/* reserved for future */}
        if (typeof (tpl as any).team_mode === 'string') setTeamMode(((tpl as any).team_mode as any) || 'collaborative');

        if (!mems && Array.isArray((tpl as any).team_members)) {
          const arr = (tpl as any).team_members as any[];
          if (arr.length && typeof arr[0] === 'string') {
            mems = arr.map((id:string)=>({ id }));
          } else {
            mems = arr; // 已是对象形式：{ agent_id, role, order, ... }
          }
        }

        if (Array.isArray(mems) && mems.length) {
          let next: TeamMemberConfig[] = mems.map((m:any, i:number) => {
            const id = String(m.id || m.agent_id || m.agent_name || m.name || `member_${i}`);
            const known = KNOWN_NAMES[id] || { name: id };
            // 兼容属性：required 或 canToggle
            const required = !!m.required || m.canToggle === false;
            return {
              id,
              name: normText(m.name ?? m.display_name, known.name),
              role: normText(m.role, known.role),
              prompt: String(m.prompt || ''),
              model: m.model || '',
              enabled: m.enabled !== false, // 默认启用
              canToggle: required ? false : (m.canToggle ?? known.canToggle ?? true),
            };
          });
          // 根据模板上下文强制必启规则：
          // - 智能路由类模板：知识检索 必启
          // - 通用问答类模板：问题分解 必启
          const tcode = String((tpl as any)?.template_code || '').toLowerCase();
          const tname = normText((tpl as any)?.template_name).toLowerCase();
          const isRouting = tcode.includes('routing') || tname.includes('路由');
          const isGeneralQA = tcode.includes('general_qa') || tname.includes('通用问答') || tcode.includes('qa_team');
          if (isRouting) {
            next = next.map(m => m.id === 'knowledge_retrieval_agent' ? { ...m, enabled: true, canToggle: false } : m);
          }
          if (isGeneralQA) {
            next = next.map(m => m.id === 'question_decomposition_agent' ? { ...m, enabled: true, canToggle: false } : m);
          }
          if ((import.meta as any).env?.DEV) {
            try {
              // eslint-disable-next-line no-console
              console.debug('[TeamStudio] parsed-members', next);
            } catch {}
          }
          // 至少保证存在一两个关键位
          setMembers(next);
          // 初始化资源配置：为知识检索成员预留键
          const initRes: Record<string, { collectionId?: string; retrievalMode?: 'hybrid'|'hirag'; retrievalTemplateId?: string }> = {};
          next.forEach(m => { if (m.id === 'knowledge_retrieval_agent') initRes[m.id] = { retrievalMode: 'hybrid' }; });
          setTeamResources(prev => ({ ...initRes, ...prev }));
        } else {
          // 回退默认
          setMembers(DEFAULT_TEAM.map((m,i)=> ({
            id: String(m.id || `member_${i}`),
            name: String(m.name || `成员${i+1}`),
            role: m.role,
            enabled: !!m.enabled,
            canToggle: m.canToggle !== false,
            prompt: String(m.prompt || ''),
            model: ''
          })) as TeamMemberConfig[]);
        }
      } catch (e) {
        // 忽略模板加载错误，使用默认成员
      }
    })();
  }, [templateId]);

  const modelOptions = (models || []).map(m => ({ value: m.id, label: `${m.name} · ${m.provider}` }));

  // 历史会话 + 对话区域（与单体工作室一致结构）
  type ChatMsg = { role:'user'|'assistant', content:string };
  type Conversation = { id: string; title: string; messages: ChatMsg[]; createdAt: number };
  const [conversations, setConversations] = useState<Conversation[]>([{
    id: `conv_${Date.now()}`,
    title: '新的会话',
    createdAt: Date.now(),
    messages: [{ role:'assistant', content:'这里是团队智能体工作室，右侧完成配置后在此进行测试～' }]
  }]);
  const [currentConvIdx, setCurrentConvIdx] = useState(0);
  const messages = conversations[currentConvIdx]?.messages || [];
  const setMessages = (updater: (prev: ChatMsg[]) => ChatMsg[] | ChatMsg[]) => {
    setConversations(prev => {
      const next = [...prev];
      const cur = next[currentConvIdx];
      if (!cur) return prev;
      const nextMsgs = typeof updater === 'function' ? (updater as any)(cur.messages) : updater;
      next[currentConvIdx] = { ...cur, messages: nextMsgs as ChatMsg[] };
      return next;
    });
  };
  const [inputText, setInputText] = useState('');
  const [testing, setTesting] = useState(false);
  const runRef = React.useRef<{ abort: () => void } | null>(null);
  const handleRun = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setMessages(prev => [...prev, { role:'user', content: text }]);
    setTesting(true);
    // 初始化检索面板事件（知识库与/或图谱）
    try {
      const kb = teamResources['knowledge_retrieval_agent'];
      const init: any[] = [];
      if (kb && (kb.collectionId || collectionId)) {
        init.push({
          stage: 'retrieve',
          mode: kb.retrievalMode || retrievalMode,
          query: text,
          top_n: 8,
          collections: [kb.collectionId || collectionId].filter(Boolean)
        });
      }
      const g = teamResources['knowledge_graph_agent'];
      if (g) {
        init.push({ stage: 'retrieve_graph', mode: g.graphQueryMode || 'mix', query: text, top_n: Number(g.graphTopK ?? 40) });
      }
      setRetrievalEvents(init);
    } catch {}
    try {
      const params: any = {
        agent_name: 'workflow_agent',
        prompt: text,
        model: (models && models[0]?.id) || undefined,
        save_session: false,
        ...(collectionId ? { collection_id: collectionId } : {})
      };
      // 透传图谱检索配置到工作流
      try {
        const g = teamResources['knowledge_graph_agent'];
        if (g) {
          params.graph_config = {
            trigger: g.graphTrigger || 'auto',
            query_mode: g.graphQueryMode || 'mix',
            ...(g.graphFixedQuery ? { fixed_query: g.graphFixedQuery } : {}),
            top_k: Number(g.graphTopK ?? 40),
            chunk_top_k: Number(g.graphChunkTopK ?? 10)
          } as any;
        }
      } catch { /* noop */ }
      runRef.current = await runWorkflowStream(params, (ev) => {
        try {
          const payload: any = (ev && ev.type === 'step_event' && ev.data) ? ev.data : ev;
          if (payload?.stage === 'retrieve') {
            setRetrievalEvents(prev => ([...prev, {
              stage: 'retrieve',
              mode: payload.mode,
              collections: payload.collections,
              top_n: payload.top_n,
              query: payload.query,
              hits: payload.hits,
              context_preview: payload.context_preview,
              sample_ids: payload.sample_ids,
              filters: payload.filters,
              warning: payload.warning
            }]));
            return;
          }
          if (payload?.stage === 'retrieve_graph') {
            setRetrievalEvents(prev => ([...prev, {
              stage: 'retrieve_graph',
              mode: payload.mode,
              top_n: payload.top_n,
              query: text,
              hits: payload.hits,
              context_preview: payload.context_preview,
              warning: payload.warning
            }]));
            return;
          }
          if (payload?.stage === 'execute') {
            if (typeof payload.delta === 'string' && payload.delta.length) {
              const token = payload.delta as string;
              setMessages(prev => {
                const arr = [...prev];
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  arr.push({ role:'assistant', content: token } as any);
                } else {
                  const last = { ...arr[arr.length-1] } as any;
                  last.content = (last.content || '') + token;
                  arr[arr.length-1] = last;
                }
                return arr;
              });
              return;
            }
            if (typeof payload.result === 'string') {
              const full = payload.result as string;
              setMessages(prev => {
                if (prev.length && prev[prev.length-1].role === 'assistant') {
                  const arr = [...prev];
                  const last = { ...arr[arr.length-1] } as any;
                  last.content = full;
                  arr[arr.length-1] = last;
                  return arr;
                }
                return [...prev, { role:'assistant', content: full }];
              });
              return;
            }
          }
        } catch {}
      });
    } catch (e:any) {
      message.error(e?.message || '执行失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!templateId) {
        message.warning('请从模板入口进入以创建团队智能体');
        return;
      }
      // 强制保留必启成员（canToggle === false）
      const normalized = members.map(m => (m.canToggle === false ? { ...m, enabled: true } : m));
      // 同步所有成员（包含可关闭/不可关闭、启用状态）到配置
      const finalMembers = normalized.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        prompt: m.prompt,
        model: m.model,
        enabled: !!m.enabled,
        // required = !canToggle；后端可据此在运行期强制启用
        required: m.canToggle === false,
        can_toggle: m.canToggle !== false,
      }));
      if (enabledMembers.length === 0) {
        message.warning('请至少启用一个子智能体');
        return;
      }
      const graphMemberEnabled = !!finalMembers.find(m => m.id === 'knowledge_graph_agent' && m.enabled);
      const req: any = {
        template_id: templateId,
        agent_name: teamName,
        description: '多智能体团队',
        collection_id: collectionId,
        enable_knowledge_search: !!collectionId,
        enable_graph_search: graphMemberEnabled,
        retrieval_mode: 'all',
        selected_tools: selectedTools,
        tool_configs: toolConfigs,
        model_config: undefined,
        custom_config: {
          team: {
            retrieval_mode: retrievalMode,
            team_mode: teamMode,
            max_concurrency: maxConcurrency,
            max_iterations: maxIterations,
            timeout_ms: timeoutMs,
            max_retries: maxRetries,
            per_agent_timeout_ms: perAgentTimeoutMs,
            per_agent_retry_limit: perAgentRetryLimit,
            stop_on_first_success: stopOnFirstSuccess,
            members: finalMembers.map(m => {
              // 构造资源挂载
              let resources: any = undefined;
              if (m.id === 'knowledge_retrieval_agent' && teamResources['knowledge_retrieval_agent']?.collectionId) {
                const kb = teamResources['knowledge_retrieval_agent'];
                resources = {
                  knowledge_collection: {
                    collection_id: kb.collectionId,
                    ...(kb.retrievalTemplateId ? { retrieval_template_id: kb.retrievalTemplateId } : {})
                  },
                  retrieval_mode: kb.retrievalMode || 'hybrid'
                };
              }
              if (m.id === 'knowledge_graph_agent') {
                const g = teamResources['knowledge_graph_agent'] || {};
                resources = {
                  ...(resources || {}),
                  graph_config: {
                    trigger: g.graphTrigger || 'auto',
                    query_mode: g.graphQueryMode || 'mix',
                    ...(g.graphFixedQuery ? { fixed_query: g.graphFixedQuery } : {}),
                    top_k: Number(g.graphTopK ?? 40),
                    chunk_top_k: Number(g.graphChunkTopK ?? 10)
                  }
                };
              }
              return ({ ...m, resources });
            })
          }
        }
      };
      const res = await userAgentService.createUserAgent(req);
      message.success('团队智能体已创建');
      navigate(`/app/agent/studio?agentId=${res.id}`);
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    }
  };

  return (
    <Layout style={{ height:'100%', background:'#fff' }}>
      {/* 左侧历史对话栏 */}
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #e8ecf3', padding: '16px 12px', height:'100%', overflow:'hidden', background:'#fff' }}>
        <div className="studio-side-title" style={{ marginTop: 0 }}>历史对话</div>
        <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
          <Button type="primary" size="small" onClick={() => {
            setConversations(prev => [{ id:`conv_${Date.now()}`, title:'新的会话', createdAt:Date.now(), messages:[{ role:'assistant', content:'开始新的对话。' }] }, ...prev]);
            setCurrentConvIdx(0);
          }}>新建会话</Button>
          <Button size="small" onClick={() => void loadAll()}>刷新模板</Button>
        </div>
        <div style={{ height:'calc(100% - 70px)', overflow:'auto' }}>
          {conversations.map((c, idx) => (
            <div key={c.id} onClick={()=> setCurrentConvIdx(idx)}
                 style={{
                   border:'1px solid ' + (idx===currentConvIdx?'#1677ff':'#e8ecf3'),
                   background: idx===currentConvIdx?'#eef5ff':'#fff',
                   borderRadius:10, padding:10, marginBottom:8, cursor:'pointer'
                 }}>
              <div style={{ fontWeight:600, color:'#1f2937' }}>{c.title}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                {(c.messages[c.messages.length-1]?.content || '').slice(0,40) || '空对话'}
              </div>
            </div>
          ))}
          {conversations.length===0 && <div className="empty">暂无会话</div>}
        </div>
      </Sider>

      <Content style={{ padding:'0 0 0 0' }}>
        <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
          {/* 顶部栏，与单体工作室一致风格 */}
          <div className="studio-topbar">
            <div className="left-section">
              <a className="back-button" onClick={()=>navigate('/app/agent/navigation')}>返回</a>
              <div className="avatar-section">
                <Avatar shape="square" size={36} style={{ background:'#2563eb' }}>{teamName?.[0] || '团'}</Avatar>
                <div className="agent-info">
                  <div className="agent-name">{teamName}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
                    <Tag className="status-tag online">团队工作室</Tag>
                    <Tag className="status-tag template">模板创建</Tag>
                  </div>
                </div>
              </div>
            </div>
            <div className="right-section">
              <Button onClick={()=> setMessages(()=> [{ role:'assistant', content:'已清空对话' }])} className="action-button">清空对话</Button>
              <Button onClick={handleSave} className="action-button primary">保存</Button>
              <Button onClick={()=> setShowRetrievalPanel(true)} className="action-button">检索面板</Button>
            </div>
          </div>

          {/* 中部对话容器 */}
          <div className="chat-container" style={{ flex:'1 1 auto', minHeight: 0 }}>
            <Drawer
              open={showRetrievalPanel}
              onClose={() => setShowRetrievalPanel(false)}
              placement="right"
              width={420}
              title="检索执行"
            >
              <RetrievalExecPanel events={retrievalEvents as any} />
            </Drawer>
            <div className="chat-messages">
              <Spin spinning={loading} style={{ height: '100%' }}>
                {messages.map((m, i) => (
                  <div key={i} className={`msg-line ${m.role === 'user' ? 'from-user' : 'from-assistant'}`}>
                    <div className="msg-author">{m.role === 'user' ? '我' : '团队'}</div>
                    <div className="msg-bubble">{m.content}</div>
                  </div>
                ))}
              </Spin>
            </div>
            <div className="chat-input-area">
              <div className="studio-inputbar">
                <Input
                  value={inputText}
                  onChange={e=>setInputText(e.target.value)}
                  placeholder="输入消息..."
                  onPressEnter={handleRun}
                  style={{ border: 'none', boxShadow: 'none' }}
                />
                <Button type="primary" onClick={handleRun} loading={testing}>发送</Button>
              </div>
            </div>
          </div>
        </div>
      </Content>
      <Sider width={400} theme="light" style={{ borderLeft: '1px solid #e8ecf3', padding: '20px 20px 0 20px', height: '100%', overflow: 'hidden', background: 'linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%)' }}>
        <TeamStudioSettingsPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onCancel={()=>navigate('/app/agent/navigation')}
          onSave={handleSave}
          membersTab={{
            members,
            setMembers: (updater)=> setMembers(prev => updater(prev)),
            modelOptions
          }}
          resourcesTab={{
            collections,
            members,
            resources: teamResources,
            setResources: (updater) => setTeamResources(prev => updater(prev))
          }}
          toolsTab={{
            availableTools,
            selectedTools,
            setSelectedTools: (updater)=> setSelectedTools(prev => updater(prev)),
            toolTab,
            setToolTab,
            activeTool,
            setActiveTool,
            filteredTools,
            renderToolForm
          }}
          executionTab={{
            timeoutMs,
            setTimeoutMs,
            maxRetries,
            setMaxRetries,
            teamMode,
            setTeamMode,
            maxConcurrency,
            setMaxConcurrency,
            maxIterations,
            setMaxIterations,
            perAgentTimeoutMs,
            setPerAgentTimeoutMs,
            perAgentRetryLimit,
            setPerAgentRetryLimit,
            stopOnFirstSuccess,
            setStopOnFirstSuccess
          }}
        />
      </Sider>
    </Layout>
  );
};

export default TeamAgentStudioPage;
