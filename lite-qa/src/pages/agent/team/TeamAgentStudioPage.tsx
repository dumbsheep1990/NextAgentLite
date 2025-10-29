import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Button, Typography, Tag, Spin, message, Avatar, Input, Drawer } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TeamStudioSettingsPanel from './TeamStudioSettingsPanel';
import type { TeamMemberConfig } from './TeamStudioSettingsPanel';
import { userAgentService } from '../../../services/userAgentService';
import type { KnowledgeCollection, ModelOption, AgentTool } from '../../../services/userAgentService';
import { runWorkflowStream } from '../../../services/workflowService';
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
  const fromParam = sp.get('from')?.toLowerCase();

  // 获取返回路径
  const getBackPath = () => {
    if (fromParam === 'team' || fromParam === 'team-agents') {
      return '/app/agent/team-agents';
    }
    return '/app/agent/navigation';
  };

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
  const [toolTab, setToolTab] = useState<'builtin'|'mcp'|'api'|'custom_crawler'>('builtin');
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

    // 自定义工具：配置最大结果数量
    if ((tool.tool_type || '').toLowerCase() === 'custom_crawler') {
      const current = toolConfigs[tool.tool_code] || {};
      const maxResults = current.max_results ?? 10;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>最大返回结果数量</div>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 50) {
                  setToolConfigs(prev => ({
                    ...prev,
                    [tool.tool_code]: { ...(prev[tool.tool_code] || {}), max_results: v }
                  }));
                }
              }}
              min={1}
              max={50}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e8ecf3' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              设置每次搜索返回的最大结果数量（1-50）
            </div>
          </div>
          {tool.description && (
            <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>{tool.description}</div>
            </div>
          )}
        </div>
      );
    }

    // 内置工具：解析 config_schema 并渲染表单
    const schema: any = tool?.config_schema || {};
    const properties: any = schema?.properties || {};
    const required: string[] = schema?.required || [];
    const current = toolConfigs[tool.tool_code] || {};
    const items: JSX.Element[] = [];

    Object.keys(properties).forEach((key) => {
      const prop = properties[key] || {};
      const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
      const title = prop.title || key;
      const isReq = required.includes(key);
      const value = current[key];

      if (prop.enum && Array.isArray(prop.enum)) {
        items.push(
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>{title}{isReq ? ' *' : ''}</div>
            <select
              value={value || prop.default || ''}
              onChange={(e)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: e.target.value } }))}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e8ecf3' }}
            >
              {prop.enum.map((v:any)=>(<option key={v} value={v}>{String(v)}</option>))}
            </select>
            {prop.description && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{prop.description}</div>}
          </div>
        );
      } else if (type === 'boolean') {
        items.push(
          <div key={key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>{title}{isReq ? ' *' : ''}</span>
            <input
              type="checkbox"
              checked={value !== undefined ? !!value : !!prop.default}
              onChange={(e)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: e.target.checked } }))}
            />
          </div>
        );
      } else if (type === 'number' || type === 'integer') {
        items.push(
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>{title}{isReq ? ' *' : ''}</div>
            <input
              type="number"
              value={typeof value === 'number' ? value : (prop.default || '')}
              onChange={(e)=>{
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: v } }));
                }
              }}
              min={prop.minimum}
              max={prop.maximum}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e8ecf3' }}
            />
            {prop.description && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{prop.description}</div>}
          </div>
        );
      } else {
        items.push(
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>{title}{isReq ? ' *' : ''}</div>
            <input
              type="text"
              value={value ?? prop.default ?? ''}
              onChange={(e)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: e.target.value } }))}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e8ecf3' }}
            />
            {prop.description && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{prop.description}</div>}
          </div>
        );
      }
    });

    // 如果没有明确的 properties，回退 JSON 编辑
    if (items.length === 0) {
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
    }

    return <>{items}</>;
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
        // 始终输出调试信息,不限于开发环境
        try {
          console.log('[TeamStudio] 📋 模板详情:', tpl);
          console.log('[TeamStudio] 📋 team_members类型:', typeof (tpl as any).team_members);
          console.log('[TeamStudio] 📋 team_members内容:', JSON.stringify((tpl as any).team_members, null, 2));
        } catch (e) {
          console.error('[TeamStudio] 输出调试信息失败:', e);
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
          // 始终输出调试信息,不限于开发环境
          try {
            console.log('[TeamStudio] ✅ 解析后的成员配置:', JSON.stringify(next, null, 2));
            // 特别检查 prompt 字段
            next.forEach((m, idx) => {
              console.log(`[TeamStudio] 成员${idx} ${m.name} - prompt长度:`, m.prompt?.length || 0);
            });
          } catch (e) {
            console.error('[TeamStudio] 输出调试信息失败:', e);
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
      const enabledMembers = finalMembers.filter(m => m.enabled);
      if (enabledMembers.length === 0) {
        message.warning('请至少启用一个子智能体');
        return;
      }

      // 生成导出时的时间戳命名（与单智能体一致）
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const MM = pad(now.getMonth() + 1);
      const dd = pad(now.getDate());
      const HH = pad(now.getHours());
      const mm2 = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const exportSuffix = ` · ${yy}${MM}${dd}-${HH}${mm2}${ss}`;

      // 去除旧的时间戳或draft后缀
      const stripSuffix = (name: string) => (name || '').replace(/\s*·\s*(draft-|)\d{6}-\d{6}/i, '').trim();
      const baseName = stripSuffix(teamName || '多智能体团队');
      const exportName = `${baseName}${exportSuffix}`;

      const graphMemberEnabled = !!finalMembers.find(m => m.id === 'knowledge_graph_agent' && m.enabled);
      const req: any = {
        template_id: templateId,
        agent_name: exportName,
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
      message.success('团队智能体已导出');
      navigate(`/app/agent/studio?agentId=${res.id}`);
    } catch (e: any) {
      message.error(e?.message || '导出失败');
    }
  };

  const handleSaveDraft = async () => {
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
        required: m.canToggle === false,
        can_toggle: m.canToggle !== false,
      }));

      // 生成草稿命名（与单智能体一致）：去除旧的 draft 后缀，添加当前时间戳
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const MM = pad(now.getMonth() + 1);
      const dd = pad(now.getDate());
      const HH = pad(now.getHours());
      const mm2 = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const draftSuffix = ` · draft-${yy}${MM}${dd}-${HH}${mm2}${ss}`;

      // 去除旧的draft或时间戳后缀
      const stripDraft = (name: string) => (name || '').replace(/\s*·\s*(draft-|draft|草稿).*$/i, '').trim();
      const baseName = stripDraft(teamName || '多智能体团队');
      const draftName = `${baseName}${draftSuffix}`;

      const graphMemberEnabled = !!finalMembers.find(m => m.id === 'knowledge_graph_agent' && m.enabled);
      const req: any = {
        template_id: templateId,
        agent_name: draftName,
        description: '多智能体团队（草稿）',
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
      const res = await userAgentService.createDraftUserAgent(req);
      message.success('团队智能体草稿已保存，可继续编辑和测试');
      // 保存草稿后更新本地teamName状态为规范化后的草稿名，避免多次保存累积后缀
      setTeamName(draftName);
      // 保存草稿ID以便后续使用（可选）
      if (res?.id) {
        try {
          localStorage.setItem('last_team_draft_id', res.id);
        } catch {}
      }
      // 留在当前页面，允许继续编辑和测试
    } catch (e: any) {
      message.error(e?.message || '保存草稿失败');
    }
  };

  const handleDeleteConversation = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发卡片选择事件

    if (conversations.length <= 1) {
      message.warning('至少保留一个对话');
      return;
    }

    setConversations(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next;
    });

    // 如果删除的是当前对话，需要调整当前索引
    if (idx === currentConvIdx) {
      // 如果删除的是最后一个，跳转到新的最后一个
      if (idx === conversations.length - 1) {
        setCurrentConvIdx(idx - 1);
      } else {
        // 否则保持当前索引（原本后一个会顶上来）
        setCurrentConvIdx(idx);
      }
    } else if (idx < currentConvIdx) {
      // 删除的在当前之前，索引需要减1
      setCurrentConvIdx(currentConvIdx - 1);
    }
    // 删除的在当前之后，索引不变

    message.success('对话已删除');
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
                   borderRadius:10, padding:10, marginBottom:8, cursor:'pointer',
                   position: 'relative'
                 }}>
              <div style={{ fontWeight:600, color:'#1f2937', paddingRight: 24 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                {(c.messages[c.messages.length-1]?.content || '').slice(0,40) || '空对话'}
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => handleDeleteConversation(idx, e)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: '#64748b',
                  opacity: 0.6,
                  transition: 'all 0.2s'
                }}
                className="conversation-delete-btn"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.color = '#64748b';
                }}
              />
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
              <a className="back-button" onClick={()=>navigate(getBackPath())}>返回</a>
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
      <Sider width={500} theme="light" style={{ borderLeft: '1px solid #e8ecf3', padding: '20px 20px 0 20px', height: '100%', overflow: 'hidden', background: 'linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%)' }}>
        <TeamStudioSettingsPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onCancel={()=>navigate(getBackPath())}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
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
