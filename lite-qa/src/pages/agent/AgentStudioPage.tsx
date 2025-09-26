import React, { useEffect, useMemo, useRef, useState } from 'react';
import RetrievalExecPanel from '../../components/retrieval/RetrievalExecPanel';
import './AgentStudioPage.css';
import {
  Layout, Button, Input, Typography, Space, Row, Col, Card, Avatar, Upload, message,
  Switch, Select, Slider, InputNumber, Divider, Spin, Tag, Collapse, Segmented, Tabs, Tooltip, Modal, Drawer
} from 'antd';
import {
  SaveOutlined, SendOutlined, UploadOutlined, ArrowLeftOutlined,
  BookOutlined, NodeIndexOutlined, CopyOutlined,
  LikeOutlined, DislikeOutlined, RedoOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import type { KnowledgeCollection, ModelOption, AgentTemplate, AgentTool } from '../../services/userAgentService';
import { listGatewayEmbeddingModels, runWorkflowStream } from '../../services/workflowService';
import { CollectionService } from '../../services/collectionService';
import StudioSettingsPanel from './studio/StudioSettingsPanel';
import PromptSettingsSection from './studio/PromptSettingsSection';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 统一的“智能体工作室”页面：左侧会话、中间对话测试、右侧配置栏
  const AgentStudioPage: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const templateId = sp.get('templateId') || '';
  const templateKind = (sp.get('kind') || '').toLowerCase();
  const agentId = sp.get('agentId') || '';

  // 基础数据
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [embeddingMap, setEmbeddingMap] = useState<Record<string, any[]>>({});
  const [requirements, setRequirements] = useState<any[]>([]);
  // 草稿管理
  const [drafts, setDrafts] = useState<Array<{ id:string; name:string; createdAt:number }>>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  // 工具选择与配置
  const [availableTools, setAvailableTools] = useState<AgentTool[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({});
  const [toolTab, setToolTab] = useState<'builtin'|'mcp'|'api'>('mcp');
  const [toolQuery, setToolQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [configTab, setConfigTab] = useState<'basic'|'model'|'tools'|'advanced'>('basic');
  const [showPromptModal, setShowPromptModal] = useState(false);
  // 根据入口或参数决定是否默认展示配置：openConfig=1 强制展示；保留默认逻辑但移除用户侧的收起/展开按钮
  const openConfigParam = (sp.get('openConfig') || '').trim();
  const [showConfig, setShowConfig] = useState<boolean>(() => {
    if (openConfigParam === '1') return true;
    return !!templateId && !agentId;
  });
  const [mcpToolCache, setMcpToolCache] = useState<Record<string, string[]>>({});

  // 根据工具的 config_schema 渲染简单配置表单（string/number/boolean/enum）
  const renderToolForm = (tool: AgentTool) => {
    // 针对 MCP 服务器：展示子工具选择
    if ((tool.tool_type || '').toLowerCase() === 'mcp') {
      const server = tool.tool_code.replace(/^mcp:/, '');
      const base = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:9050';
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
      // 立即触发一次加载（无副作用，仅首次）
      void loadIfNeeded();
      return (
        <div>
          <div style={{ marginBottom: 6, color: '#64748b' }}>选择要启用的 MCP 子工具：</div>
          <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e8ecf3', borderRadius: 8, padding: 8 }}>
            {(mcpToolCache[server] || []).map(name => (
              <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '6px 4px' }}>
                <span>{name}</span>
                <Switch size="small"
                  checked={allowed.includes(name)}
                  onChange={(v)=>{
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

    // API 工具：显示该配置下的 API 工具列表
    if ((tool.tool_type || '').toLowerCase() === 'api') {
      const cfg = tool.tool_code.replace(/^api:/, '');
      const list = (toolConfigs[tool.tool_code]?.__cache_list as string[] | undefined);
      const allowed: string[] = (toolConfigs[tool.tool_code]?.allowed_tools as string[] | undefined) || [];
      const loadIfNeeded = async () => {
        if (!list) {
          try {
            const r = await fetch(`/api/v1/gateway/api-tools/configs/${encodeURIComponent(cfg)}/tools`);
            const j = await r.json();
            const arr = Array.isArray(j) ? j : [];
            const names = arr.map((x:any)=> x?.name || x).filter(Boolean);
            setToolConfigs(prev => ({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), __cache_list: names, __cache_full: arr } }));
          } catch {}
        }
      };
      void loadIfNeeded();
      const items = (toolConfigs[tool.tool_code]?.__cache_list as string[] | undefined) || [];
      const full  = (toolConfigs[tool.tool_code]?.__cache_full as any[] | undefined) || [];
      return (
        <div>
          <div style={{ marginBottom: 6, color: '#64748b' }}>选择要启用的 API 工具：</div>
          <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e8ecf3', borderRadius: 8, padding: 8 }}>
            {items.map(name => {
              const meta = full.find((x:any)=> (x?.name||'') === name) || {};
              const method = (meta?.method || meta?.httpMethod || '').toString().toUpperCase();
              const endpoint = meta?.endpoint || meta?.path || meta?.url || '';
              return (
                <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'flex-start', padding: '6px 4px', gap: 8 }}>
                  {method ? <Tag color="blue" style={{ marginRight: 4 }}>{method}</Tag> : null}
                  <span className="api-endpoint-text">{endpoint || '未提供路径'}</span>
                </div>
              );
            })}
            {!items.length && <div className="empty">加载中…</div>}
          </div>
        </div>
      );
    }

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
            <Text className="setting-label">{title}{isReq ? ' *' : ''}</Text>
            <Select
              value={value}
              onChange={(v)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: v } }))}
              options={prop.enum.map((v:any)=>({ value: v, label: String(v) }))}
              style={{ width: '100%' }}
              size="middle"
            />
          </div>
        );
      } else if (type === 'boolean') {
        items.push(
          <div key={key} className="studio-row" style={{ marginBottom: 8 }}>
            <span>{title}{isReq ? ' *' : ''}</span>
            <Switch
              checked={!!value}
              onChange={(v)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: v } }))}
            />
          </div>
        );
      } else if (type === 'number' || type === 'integer') {
        items.push(
          <div key={key} style={{ marginBottom: 8 }}>
            <Text className="setting-label">{title}{isReq ? ' *' : ''}</Text>
            <InputNumber
              value={typeof value === 'number' ? value : undefined}
              onChange={(v)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: v } }))}
              style={{ width: '100%' }}
            />
          </div>
        );
      } else {
        items.push(
          <div key={key} style={{ marginBottom: 8 }}>
            <Text className="setting-label">{title}{isReq ? ' *' : ''}</Text>
            <Input
              value={value ?? ''}
              onChange={(e)=>setToolConfigs(prev=>({ ...prev, [tool.tool_code]: { ...(prev[tool.tool_code]||{}), [key]: e.target.value } }))}
            />
          </div>
        );
      }
    });
    // 如果没有明确的 properties，回退 JSON 编辑
    if (items.length === 0) {
      return (
        <TextArea
          rows={5}
          value={(() => { try { return JSON.stringify(current || {}, null, 2);} catch { return '{}'; }})()}
          onChange={(e)=>{
            try {
              const cfg = JSON.parse(e.target.value || '{}');
              setToolConfigs(prev => ({ ...prev, [tool.tool_code]: cfg }));
            } catch { /* ignore */ }
          }}
          style={{ borderRadius: 8 }}
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

  const toggleSelectTool = (code: string) => {
    setSelectedTools(prev => prev.includes(code) ? prev.filter(x=>x!==code) : [...prev, code]);
    setActiveTool(code);
  };

  // 配置状态（右侧）
  const [agentName, setAgentName] = useState('我的助手');
  const [agentDesc, setAgentDesc] = useState('');
  const [greeting, setGreeting] = useState('你好！我是你的助手，有什么可以帮助你的吗？');
  const [emptyReply, setEmptyReply] = useState('');
  // 图谱检索配置
  const [graphMode, setGraphMode] = useState<'auto'|'fixed'>('auto');
  const [graphQueryMode, setGraphQueryMode] = useState<'local'|'global'|'hybrid'|'naive'|'mix'|'bypass'>('mix');
  const [graphFixedQuery, setGraphFixedQuery] = useState('');
  const [graphTopK, setGraphTopK] = useState<number>(40);
  const [graphChunkTopK, setGraphChunkTopK] = useState<number>(10);
  // 移除无效的系统外功能（关键词分析/文本转语音/使用知识自问）
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [useMetadata, setUseMetadata] = useState(false);
  const [retrievalRoute, setRetrievalRoute] = useState<string>('default');
  const [metadataFilters, setMetadataFilters] = useState<Array<{key:string, op:any, value:string}>>([]);
  const [hiragEnabled, setHiragEnabled] = useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('你是一个智能助手，请总结知识库的内容来回答问题。');
  const [simThreshold, setSimThreshold] = useState<number>(0.2);
  const [simWeight, setSimWeight] = useState<number>(0.3);
  const [topN, setTopN] = useState<number>(8);
  const [multiTurn, setMultiTurn] = useState(false);
  const [maxRounds, setMaxRounds] = useState<number>(6);
  const [reasoning, setReasoning] = useState(true);
  const [rerankModel, setRerankModel] = useState<string | undefined>(undefined);
  const [rerankOptions, setRerankOptions] = useState<Array<{ value:string; label:string }>>([]);
  // 移除：跨索引搜索占位
  const [crossCollections, setCrossCollections] = useState<string[]>([]);
  const [variables, setVariables] = useState<Array<{key: string, optional?: boolean}>>([]);
  const [chatModel, setChatModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.8);
  const [presencePenalty, setPresencePenalty] = useState<number>(0);
  const [freqPenalty, setFreqPenalty] = useState<number>(0);
  const [maxTokens, setMaxTokens] = useState<number>(2000);
  const [embedProvider, setEmbedProvider] = useState<string | undefined>(undefined);
  const [embedModelId, setEmbedModelId] = useState<string | undefined>(undefined);

  // 中间对话测试
  type StudioMsg = { role:'user'|'assistant', content:string, ts?: number };
  const [messages, setMessages] = useState<Array<StudioMsg>>([
    { role: 'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？', ts: Date.now() }
  ]);
  // 生成一个本地对话session_id（用于保存反馈）
  const [studioSessionId] = useState<string>(()=> `studio_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);

  const postReaction = async (idx: number, mark: 'like'|'dislike') => {
    try {
      const m = messages[idx];
      await fetch('/api/v1/conversations/reactions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ session_id: studioSessionId, content: m.content, mark, message_type: m.role })
      });
      message.success(mark === 'like' ? '已点赞' : '已点踩');
    } catch(e:any) {
      message.error('保存反馈失败');
    }
  };

  const rerunFrom = async (idx: number) => {
    // 找到该条消息之前最近的一条用户消息作为重运行输入
    for (let i = idx; i >= 0; i--) {
      if (messages[i].role === 'user') {
        setInputText(messages[i].content);
        await handleRun();
        return;
      }
    }
    message.info('未找到可重运行的用户消息');
  };
  const [inputText, setInputText] = useState('');
  const [testing, setTesting] = useState(false);
  const runRef = useRef<{ abort: () => void } | null>(null);

  // 会话管理（仅前端状态）
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; summary?: string; messages: Array<{role:'user'|'assistant',content:string}>; createdAt: number }>>([
    { id: 'conv_1', title: '新对话', messages: [{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}], createdAt: Date.now() }
  ]);
  const [currentConvIdx, setCurrentConvIdx] = useState(0);
  useEffect(()=>{
    // 同步当前会话到消息区
    const c = conversations[currentConvIdx];
    if (c) setMessages(c.messages);
  }, [currentConvIdx]);
  const hasUserMessage = (arr: Array<{role:'user'|'assistant',content:string}>) => arr.some(m=>m.role==='user' && String(m.content||'').trim().length>0);
  const handleNewConversation = () => {
    if (!hasUserMessage(messages)) return; // 只有当前会话有用户消息时允许新建
    const title = messages.find(m=>m.role==='user')?.content?.slice(0,18) || '新对话';
    const next = { id: `conv_${Date.now()}`, title, messages: [{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}], createdAt: Date.now() };
    setConversations(prev => [...prev, next]);
    setCurrentConvIdx(conversations.length);
  };
  const handleClearConversation = () => {
    setMessages([{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}]);
    setConversations(prev => prev.map((c,i)=> i===currentConvIdx ? { ...c, messages: [{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}], summary: undefined } : c));
  };

  // 多轮对话优化：自动摘要 + token 压缩（简化实现）
  const GATEWAY_BASE = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL || 'http://127.0.0.1:9050';
  const approxTokens = (text: string) => Math.ceil(text.length / 3.5); // 粗略估算
  const buildPromptFromMessages = (arr: Array<{role:'user'|'assistant',content:string}>) => arr.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const maybeSummarize = async (arr: Array<{role:'user'|'assistant',content:string}>) => {
    if (!multiTurn) return { messages: arr };
    try {
      const budget = (models.find(m=>m.id===chatModel)?.context_length || 4000) * 0.7;
      const total = approxTokens(arr.map(m=>m.content).join('\n'));
      const conv = conversations[currentConvIdx];
      if (total < budget) return { messages: arr };
      // 优先使用已有摘要
      let contextHead: Array<{role:'user'|'assistant',content:string}> = [];
      if (conv?.summary) contextHead = [{ role:'assistant', content: `对话摘要：${conv.summary}` }];
      // 触发在线摘要
      const payload = {
        model: chatModel || (models[0]?.id || ''),
        messages: [
          { role: 'system', content: '你是一个对话摘要器，将多轮对话压缩为不超过 200 汉字的要点摘要，保留重要事实、上下文线索与未完成目标。' },
          { role: 'user', content: buildPromptFromMessages(arr) }
        ],
        max_tokens: 200
      };
      const res = await fetch(`${GATEWAY_BASE}/v1/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const j = await res.json();
        const summary = j?.choices?.[0]?.message?.content || '';
        // 仅保留最近 6 条消息，前置摘要
        const tail = arr.slice(-6);
        const merged = [...contextHead, { role:'assistant', content: `对话摘要：${summary}` }, ...tail];
        setConversations(prev => prev.map((c,i)=> i===currentConvIdx ? { ...c, summary } : c));
        return { messages: merged };
      }
      return { messages: arr };
    } catch {
      return { messages: arr };
    }
  };

  useEffect(() => {
    // 进入工作室页面时自动折叠主导航侧边栏
    try {
      window.dispatchEvent(new Event('collapse-sidebar'));
    } catch {}

    (async () => {
      try {
        setLoading(true);
        const [tpls, cols, tools, enabled] = await Promise.all([
          userAgentService.getAgentTemplates(),
          userAgentService.getKnowledgeCollections(),
          userAgentService.getAvailableTools(),
          userAgentService.getEnabledModelsUnified()
        ]);
        setTemplates(tpls || []);
        let finalCols = cols || [];
        // 兜底：如用户侧整合接口暂无数据，从标准集合接口获取
        if (!finalCols || finalCols.length === 0) {
          try {
            const svc = new CollectionService();
            const resp = await svc.getCollections({ page: 1, size: 1000 });
            finalCols = (resp.collections || []).map(c => ({
              id: c.id,
              name: c.name,
              description: c.description,
              document_count: c.document_count,
              status: c.status as any
            }));
          } catch {}
        }
        setCollections(finalCols);
        // 解析 9050 /v1/models/enabled
        try {
          const providers = (enabled?.providers || []) as any[];
          // chat models
          const chatOpts: Array<{ value:string; label:string; provider?:string; isDefault?: boolean }> = [];
          const chatDefault: string[] = [];
          const embMap: Record<string, any[]> = {};
          const embProviders: string[] = [];
          let embDefault: { provider?:string; model_id?:string } = {};
          const rrList: Array<{ value:string; name:string; provider?:string; isDefault?: boolean }> = [];
          let rrDefault: string | undefined = undefined;
          providers.forEach((p:any) => {
            const pname = p?.name || p?.type || '';
            (p?.models||[]).forEach((m:any) => {
              const mid = (m?.model_id||'').trim();
              const dname = (m?.display_name||mid).trim();
              if (!mid) return;
              const t = (m?.model_type||'').toLowerCase();
              if (t==='chat') {
                const isDef = !!m?.default_chat;
                chatOpts.push({ value: mid, label: dname, provider: pname, isDefault: isDef });
                if (isDef) chatDefault.push(mid);
              } else if (t==='embedding') {
                if (!embMap[pname]) embMap[pname] = [];
                embMap[pname].push({ id: mid, name: dname, default: !!m?.default_embedding });
                if (!embProviders.includes(pname)) embProviders.push(pname);
                if (m?.default_embedding) embDefault = { provider: pname, model_id: mid };
              } else if (t==='rerank') {
                const isDef = !!m?.default_rerank;
                rrList.push({ value: mid, name: dname, provider: pname, isDefault: isDef });
                if (isDef) rrDefault = mid;
              }
            })
          });
          setModels(chatOpts.map(o => ({ id:o.value, name:o.label, provider:o.provider||'', isDefault: !!o.isDefault } as any)));
          setEmbeddingMap(embMap);
          // 设置默认 embedding provider/model
          if (!embedProvider && embDefault.provider) setEmbedProvider(embDefault.provider);
          if (!embedModelId && embDefault.model_id) setEmbedModelId(embDefault.model_id);
          // 设置默认 chat model
          if (!chatModel && chatDefault[0]) setChatModel(chatDefault[0]);
          // rerank 下拉（含厂商与默认标签）
          setRerankOptions(rrList.map(r => ({ value: r.value, label: (<span>{r.name}{r.provider ? <Tag color="cyan" style={{ marginLeft: 8 }}>{r.provider}</Tag> : null}{r.isDefault ? <Tag color="gold" style={{ marginLeft: 6 }}>默认</Tag> : null}</span>) })));
          if (!rerankModel && rrDefault) setRerankModel(rrDefault);
        } catch {}
        setAvailableTools(tools || []);
        // 若后端合并接口暂时为空，则从 9050 兜底聚合 MCP / API 工具
        if (!tools || tools.length === 0) {
          try {
            const [reg, apis] = await Promise.all([
              fetch(`/api/v1/gateway/mcp/registry`).then(r=>r.ok?r.json():[]).catch(()=>[]),
              fetch(`/api/v1/gateway/api-tools/configs`).then(r=>r.ok?r.json():[]).catch(()=>[])
            ]);
            const extra: AgentTool[] = [];
            if (Array.isArray(reg)) {
              reg.forEach((it:any)=>{
                const name = (it?.name||'').trim();
                if (name) extra.push({ id:`mcp:${name}`, tool_code:`mcp:${name}`, tool_name:`MCP:${name}`, tool_type:'mcp', description: it?.status||'' });
              });
            }
            if (Array.isArray(apis)) {
              apis.forEach((it:any)=>{
                const name = (it?.name||'').trim();
                if (name) extra.push({ id:`api:${name}`, tool_code:`api:${name}`, tool_name:`API:${name}`, tool_type:'api', description:'' });
              });
            }
            if (extra.length) setAvailableTools(extra);
          } catch {}
        }
        // 预取 embedding providers
        listGatewayEmbeddingModels().then(setEmbeddingMap).catch(()=>setEmbeddingMap({}));
        // 若通过 templateId 进入，设置默认名（按卡片名称）
        if (templateId) {
          const t = tpls.find(t => t.id === templateId);
          if (t) {
            // 优先使用卡片（模板）的展示名称，并进行显示规范化
            const rawCardName = (t as any).template_name || (t as any).name || '我的助手';
            const normalizeDisplayName = (s: string) => {
              let out = String(s || '').trim();
              // 名称规范：优先使用“智能体”作为后缀
              if (/专家$/.test(out)) out = out.replace(/专家$/, '智能体');
              if (/助手$/.test(out)) out = out.replace(/助手$/, '智能体');
              // 可选：去除多余版本后缀
              out = out.replace(/团队V2$/i, '团队');
              return out || '我的助手';
            };
            const defaultNameFromCard = normalizeDisplayName(rawCardName);
            try {
              if (t?.template_code) {
                const reqRes = await userAgentService.getTemplateRequirements(t.template_code);
                const reqs = reqRes?.requirements || [];
                setRequirements(reqs);
              }
            } catch {}
            setAgentName(prev => (prev && prev.trim().length>0 && prev !== '我的助手') ? prev : defaultNameFromCard);
          }
        }
      } catch (e: any) {
        message.error(e?.message || '加载智能体工作室失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId, agentId]);

  // 草稿工具
  const _readDraftStore = () => {
    try { return JSON.parse(localStorage.getItem('agent_studio_drafts_v2') || '{}'); } catch { return {}; }
  };
  const _writeDraftStore = (store:any) => {
    try { localStorage.setItem('agent_studio_drafts_v2', JSON.stringify(store)); } catch {}
  };
  const _loadDraftList = () => {
    const store = _readDraftStore();
    const list = (store?.[templateId || '']?.list || []) as Array<any>;
    setDrafts(list.map(d => ({ id: d.id, name: d.name || '未命名', createdAt: d.createdAt || Date.now() })));
  };
  useEffect(() => { if (templateId && !agentId) _loadDraftList(); }, [templateId, agentId]);

  const onSaveDraftAs = () => { setSaveAsOpen(true); setSaveAsName(`${agentName || '草稿'}-${new Date().toLocaleString()}`); };
  const doSaveDraftAs = () => {
    const store = _readDraftStore();
    const entry = store[templateId] || { list: [] };
    const id = `d_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const req = {
      template_id: templateId,
      agent_name: agentName,
      description: agentDesc || undefined,
      collection_id: collectionId,
      enable_knowledge_search: !!showKnowledge,
      enable_graph_search: false,
      retrieval_mode: 'all',
      selected_tools: selectedTools,
      tool_configs: toolConfigs,
      model_config: { default_model: chatModel || (models[0]?.id || ''), temperature, max_tokens: maxTokens, top_p: topP },
      custom_config: {
        custom_prompt: systemPrompt,
        resources: {
          ...(collectionId ? { knowledge_collection: { collection_id: collectionId } } : {}),
          ...(embedModelId ? { embedding_model: { provider: embedProvider, model_id: embedModelId } } : {}),
          ...(crossCollections && crossCollections.length ? { cross_collections: crossCollections } : {})
        },
        chat_config: { multi_turn: !!multiTurn, max_rounds: Number(maxRounds) || 0 },
        ...(useMetadata ? { metadata_filters: metadataFilters || [] } : {})
      }
    };
    const draft = { id, name: saveAsName || agentName || '未命名', createdAt: Date.now(), req };
    entry.list = [draft, ...(entry.list || [])].slice(0, 20);
    store[templateId] = entry; _writeDraftStore(store); _loadDraftList(); setSelectedDraftId(id); setSaveAsOpen(false);
    message.success('已另存为草稿');
  };
  const onLoadDraft = (id: string) => {
    const store = _readDraftStore();
    const entry = store[templateId] || { list: [] };
    const d = (entry.list || []).find((x:any)=> x.id === id);
    if (!d) { message.warning('草稿不存在'); return; }
    try {
      const req = d.req || {};
      setAgentName(req.agent_name || '');
      setAgentDesc(req.description || '');
      const cc = req.custom_config || {};
      setSystemPrompt(cc.custom_prompt || '');
      setCollectionId(req.collection_id || undefined);
      setSelectedTools(req.selected_tools || []);
      setToolConfigs(req.tool_configs || {});
      const mc = req.model_config || {};
      setChatModel(mc.default_model || ''); setTemperature(mc.temperature ?? 0.7); setTopP(mc.top_p ?? 0.8); setMaxTokens(mc.max_tokens ?? 2000);
      const res = cc.resources || {}; if (res.embedding_model) { setEmbedProvider(res.embedding_model.provider); setEmbedModelId(res.embedding_model.model_id); }
      if (Array.isArray(res.cross_collections)) setCrossCollections(res.cross_collections);
      const chatCfg = cc.chat_config || {}; setMultiTurn(!!chatCfg.multi_turn); setMaxRounds(chatCfg.max_rounds ?? 6);
      if (Array.isArray(cc.metadata_filters)) setMetadataFilters(cc.metadata_filters);
      message.success('已加载草稿');
    } catch { message.error('加载草稿失败'); }
  };
  const onDeleteDraft = (id: string) => {
    const store = _readDraftStore(); const entry = store[templateId] || { list: [] };
    entry.list = (entry.list || []).filter((x:any)=> x.id !== id); store[templateId] = entry; _writeDraftStore(store); _loadDraftList(); setSelectedDraftId(null); message.success('已删除草稿');
  };

  const handleSave = async () => {
    try {
      if (!templateId) { message.warning('请从模板入口进入'); return; }
      if (!agentName.trim()) { message.warning('请填写助手名称'); return; }
      const draft = { templateId, createdAt: Date.now(), req: {
        template_id: templateId,
        agent_name: agentName,
        description: agentDesc || undefined,
        collection_id: collectionId,
        enable_knowledge_search: !!showKnowledge,
        enable_graph_search: false,
        retrieval_mode: 'all',
        selected_tools: selectedTools,
        tool_configs: toolConfigs,
        model_config: {
          default_model: chatModel || (models[0]?.id || ''),
          temperature,
          max_tokens: maxTokens,
          top_p: topP
        },
        custom_config: {
          custom_prompt: systemPrompt,
          resources: {
            ...(collectionId ? { knowledge_collection: { collection_id: collectionId } } : {}),
            ...(embedModelId ? { embedding_model: { provider: embedProvider, model_id: embedModelId } } : {}),
            ...(crossCollections && crossCollections.length ? { cross_collections: crossCollections } : {})
          },
          chat_config: {
            multi_turn: !!multiTurn,
            max_rounds: Number(maxRounds) || 0
          },
          ...(useMetadata ? { metadata_filters: metadataFilters || [] } : {})
        }
      } };
      localStorage.setItem('agent_studio_draft', JSON.stringify(draft));
      // 同步创建临时智能体（服务端草稿）
      try {
        const res: any = await userAgentService.createDraftUserAgent(draft.req as any);
        if (res?.id) localStorage.setItem('last_draft_agent_id', res.id);
        if (res?.name) setAgentName(res.name);
      } catch {}
      message.success('保存为草稿，仅用于创建页测试');
    } catch (e: any) {
      message.error(e?.message || '保存草稿失败');
    }
  };

  const handleRun = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setMessages(prev => [...prev, { role:'user', content: text, ts: Date.now() }]);
    try {
      setTesting(true);
      // 流式累积缓冲
      let hasStream = false;
      let streamBuffer = '';
      // 初始化检索面板事件（如果选择了知识库或跨库）
      try {
        if (collectionId || (crossCollections && crossCollections.length)) {
          setRetrievalEvents([{ stage: 'retrieve', mode: 'auto', query: text, top_n: topN, collections: [collectionId, ...(crossCollections||[])].filter(Boolean) }]);
        } else {
          setRetrievalEvents([]);
        }
      } catch {}
      const handle = await runWorkflowStream({
        agent_name: agentName || 'studio_agent',
        prompt: text,
        selected_tools: [],
        model: chatModel || (models[0]?.id || ''),
        save_session: false,
        // 将资源透传到工作流，以便后端检索步骤使用跨知识库
        session_state: undefined,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        custom_prompt: systemPrompt,
        ...(collectionId || (crossCollections && crossCollections.length) || embedModelId ? {
          resources: {
            ...(collectionId ? { knowledge_collection: { collection_id: collectionId } } : {}),
            ...(crossCollections && crossCollections.length ? { cross_collections: crossCollections } : {}),
            ...(embedModelId ? { embedding_model: { provider: embedProvider, model_id: embedModelId } } : {})
          },
          top_n: topN,
          sim_threshold: simThreshold,
          sim_weight: simWeight,
          ...(useMetadata && metadataFilters && metadataFilters.length ? { filters: { metadata_filters: metadataFilters } } : {})
        } : {})
      }, (ev) => {
        try {
          // unwrap step_event
          const payload: any = (ev && ev.type === 'step_event' && ev.data) ? ev.data : ev;

          // 检索阶段事件：更新检索面板
          if (payload?.stage === 'retrieve') {
            const evt: any = {
              stage: 'retrieve',
              mode: payload.mode || 'auto',
              collections: payload.collections,
              top_n: payload.top_n,
              query: payload.query,
              hits: payload.hits,
              context_preview: payload.context_preview,
              sample_ids: payload.sample_ids,
              filters: payload.filters,
              warning: payload.warning
            };
            setRetrievalEvents(prev => ([...prev, evt]));
            return;
          }

          // 流式增量（execute阶段）
          if (payload?.stage === 'execute') {
            // 状态提示（思考/回答中）可在UI上做轻提示，这里先忽略
            if (typeof payload.delta === 'string' && payload.delta.length) {
              hasStream = true;
              const token = payload.delta as string;
              streamBuffer += token;
              setMessages(prev => {
                const arr = [...prev];
                // 若最后一条不是assistant，则新建一条流式消息
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  arr.push({ role:'assistant', content: token, ts: Date.now(), streaming: true } as any);
                } else {
                  // 直接拼接最后一条assistant内容
                  const last = { ...arr[arr.length-1] } as any;
                  last.content = (last.content || '') + token;
                  last.ts = Date.now();
                  arr[arr.length-1] = last;
                }
                return arr;
              });
              return;
            }
            // 非增量：一次性结果
            if (typeof payload.result === 'string') {
              const full = (payload.result as string) ?? '';
              if (!full.trim()) {
                // 忽略空结果，等待后续事件或由 workflow_end 兜底
                return;
              }
              setMessages(prev => {
                // 若前面已经在流式累积，覆盖最后一条assistant为完整内容
                if (hasStream && prev.length && prev[prev.length-1].role === 'assistant') {
                  const arr = [...prev];
                  const last = { ...arr[arr.length-1] } as any;
                  last.content = full;
                  delete last.streaming;
                  last.ts = Date.now();
                  arr[arr.length-1] = last;
                  return arr;
                }
                return [...prev, { role:'assistant', content: full, ts: Date.now() }];
              });
              return;
            }
          }

          // 错误事件
          if (ev?.type === 'workflow_error' || ev?.type === 'step_error' || ev?.type === 'error') {
            const msg = ev?.detail || ev?.error || '执行出错';
            setMessages(prev => [...prev, { role:'assistant', content: `执行失败：${msg}`, ts: Date.now() }]);
            return;
          }
          if (ev?.type === 'workflow_end') {
            // 如果前面没有产生execute结果，则给个简短提示
            setMessages(prev => {
              const hasAssistant = prev.some(m => m.role==='assistant');
              if (!hasAssistant) {
                return [...prev, { role:'assistant', content: '已完成测试运行', ts: Date.now() }];
              }
              return prev;
            });
            return;
          }
        } catch {}
      });
      runRef.current = handle;
    } catch (e: any) {
      message.error(e?.message || '测试运行失败');
    } finally {
      setTesting(false);
      // 结束后尝试做摘要与压缩
      setMessages(prev => {
        maybeSummarize(prev).then(res => {
          const merged = res.messages;
          setMessages(merged);
          // 落回当前会话
          setConversations(list => list.map((c,i)=> i===currentConvIdx ? { ...c, messages: merged } : c));
        });
        return prev; // 先返回当前状态
      });
    }
  };

  const providerOptions = Object.keys(embeddingMap || {});
  const selectedTemplate = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);
  // 当选中的模板包含 documents 路径且开启 rerank 时，同步到模型设置（以“使用网关默认重排模型”为语义，具体模型在 9050 配置）
  useEffect(() => {
    try {
      if (!selectedTemplate) return;
      // 解析模板路径（兼容多种存储）
      let paths: any = (selectedTemplate as any)._paths || (selectedTemplate as any).paths || [];
      if (typeof paths === 'string') { try { paths = JSON.parse(paths); } catch { paths = []; } }
      if (selectedTemplate && !Array.isArray(paths) && (selectedTemplate as any).definition) {
        const def = (selectedTemplate as any).definition;
        if (Array.isArray(def?.paths)) paths = def.paths;
        else if (typeof def === 'string') { try { const o = JSON.parse(def); if (Array.isArray(o?.paths)) paths = o.paths; } catch {} }
      }
      if (!Array.isArray(paths)) return;
      const docs = paths.find((p:any)=> p.source_type === 'documents');
      if (docs && docs.config && docs.config.rerank) {
        // 打开重排：若未选择具体模型，用“gateway-default”作为占位，表示用 9050 默认模型
        setRerankModel(prev => prev || 'gateway-default');
      } else {
        // 模板未开启重排，不强制关闭，交由用户手动
      }
    } catch {}
  }, [selectedTemplate]);
  // 预取 Rerank 模型
  useEffect(() => {
    (async () => {
      try {
        const arr = await userAgentService.getAvailableRerankModels().catch(()=>[]);
        setRerankOptions((arr||[]).map((m:any)=>({ value: m.id, label: `${m.name}` })));
      } catch {}
    })();
  }, []);
  // 基于模板“需求”决定显示哪些设置项
  const showKnowledge = useMemo(() => (
    templateKind === 'knowledge' ||
    templateKind === 'graph' ||
    requirements.some(r => r.type === 'knowledge_collection')
  ), [requirements, templateKind]);
  const showGraph = useMemo(() => {
    const tplKind = (selectedTemplate as any)?.kind?.toLowerCase?.() || '';
    const tplType = (selectedTemplate as any)?.template_type?.toLowerCase?.() || '';
    const code = ((selectedTemplate as any)?.template_code || '').toLowerCase();
    const name = ((selectedTemplate as any)?.template_name || '').toLowerCase();
    return (
      templateKind === 'graph' ||
      tplKind === 'graph' ||
      tplType === 'graph' ||
      code.includes('graph') ||
      name.includes('图谱') ||
      requirements.some(r => r.type === 'graph_service')
    );
  }, [requirements, templateKind, selectedTemplate]);
  const showEmbedding = useMemo(() => requirements.some(r => r.type === 'embedding_model'), [requirements]);
  const needMcp = useMemo(() => requirements.filter(r => r.type === 'mcp_server'), [requirements]);
  const needApi = useMemo(() => requirements.filter(r => r.type === 'api_config'), [requirements]);

  // 将当前页面选择组装为 selections，用于后端校验
  const currentSelections = useMemo(() => ({
    collection_id: collectionId,
    embedding_model_id: embedModelId,
    graph: showGraph ? { host: '127.0.0.1', port: 9622 } : undefined
  }), [collectionId, embedModelId, showGraph]);

  const handleValidateResources = async () => {
    if (!selectedTemplate?.template_code) return;
    try {
      const res = await userAgentService.validateTemplateResources(selectedTemplate.template_code, currentSelections);
      if (res?.ok) {
        message.success('资源配置校验通过');
      } else {
        const missing = (res?.missing || []).join(', ');
        message.warning(`资源缺失: ${missing || '未知'}`);
      }
    } catch (e:any) {
      message.error(e?.message || '资源校验失败');
    }
  };
  const chatModelOptions = useMemo(() => models.map((m:any) => ({
    value: m.id,
    label: (
      <span>
        {m.name}
        {m.provider ? <Tag style={{ marginLeft: 8 }} color="cyan">{m.provider}</Tag> : null}
        {m.isDefault ? <Tag style={{ marginLeft: 6 }} color="gold">默认</Tag> : null}
      </span>
    )
  })), [models]);

  // 检索面板状态与事件
  const [showRetrievalPanel, setShowRetrievalPanel] = useState<boolean>(false);
  const [retrievalEvents, setRetrievalEvents] = useState<any[]>([]);

  return (
    <Layout style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* 左侧会话列表占位 */}
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #eee', padding: 12, height: '100%', overflow: 'auto', background: '#fafafa' }}>
        <Title level={5}>会话</Title>
        <div style={{ marginTop: 12, display:'flex', gap:8 }}>
          <Button type="primary" block disabled={!hasUserMessage(messages)} onClick={handleNewConversation}>新建对话</Button>
        </div>
        <div style={{ marginTop: 12 }}>
          {conversations.map((c, idx) => (
            <div key={c.id} className={`conv-item ${idx===currentConvIdx ? 'active':''}`} onClick={()=>setCurrentConvIdx(idx)}>
              <div className="title">{c.title}</div>
              {c.summary ? <div className="summary">{c.summary}</div> : null}
            </div>
          ))}
        </div>
      </Sider>

      {/* 中间对话测试 */}
      <Content style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', background: '#f5f6f8' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
          <div className="studio-topbar">
            <div className="left-section">
              <Button 
                size="middle" 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={()=>navigate('/app/agent/navigation')}
                className="back-button"
              >
                返回
              </Button>
              <div className="separator"></div>
              <div className="avatar-section">
                <Avatar 
                  shape="square" 
                  size={28}
                  className="agent-avatar"
                >
                  {agentName?.[0] || '助'}
                </Avatar>
                <div className="agent-info">
                  <div className="agent-name">{agentName}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
                    <Tag className="status-tag online">工作室预览</Tag>
                    {selectedTemplate && (
                      <Tag className="status-tag template">
                        {selectedTemplate.template_name}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="right-section">
              <Button 
                onClick={handleClearConversation}
                className="action-button"
                size="middle"
              >
                清空对话
              </Button>
              {/* 按需移除设置侧边栏的显隐切换按钮（创建场景不再提供收起/展开控制） */}
              <Button 
                onClick={handleValidateResources}
                className="action-button"
                size="middle"
              >
                校验配置
              </Button>
              <Button 
                onClick={()=> setShowRetrievalPanel(v=>!v)}
                className="action-button"
                size="middle"
              >
                {showRetrievalPanel ? '隐藏检索面板' : '检索面板'}
              </Button>
            {/* 顶部去掉保存/导出，避免重复与拥挤 */}
            </div>
          </div>

          <div className="chat-container" style={{ flex: '1 1 auto', minHeight: 0 }}>
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
                {messages.map((m, i) => {
                  const isUser = m.role === 'user';
                  const ts = m.ts ? new Date(m.ts) : null;
                  const timeStr = ts ? ts.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={i} className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
                      {!isUser && <div className="msg-avatar" title="助手">助</div>}
                      <div style={{ maxWidth: '80%' }}>
                        <div className={`msg-bubble ${isUser ? 'user' : 'assistant'}`}>
                          <div>{m.content}</div>
                        </div>
                        <div className={`msg-meta ${isUser ? 'user' : 'assistant'}`}>
                          <span className="time">{timeStr}</span>
                          <div className="actions" style={{ display:'inline-flex', gap:6 }}>
                            <Button size="small" type="text" className="copy-btn" icon={<CopyOutlined />} onClick={()=> navigator.clipboard.writeText(m.content)} />
                            <Button size="small" type="text" icon={<LikeOutlined />} onClick={()=> postReaction(i, 'like')} />
                            <Button size="small" type="text" icon={<DislikeOutlined />} onClick={()=> postReaction(i, 'dislike')} />
                            {!isUser && (
                              <Button size="small" type="text" icon={<RedoOutlined />} onClick={()=> rerunFrom(i)} />
                            )}
                          </div>
                        </div>
                      </div>
                      {isUser && <div className="msg-avatar" title="我">我</div>}
                    </div>
                  );
                })}
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
                <Button type="primary" icon={<SendOutlined />} onClick={handleRun} loading={testing}>发送</Button>
              </div>
            </div>
          </div>
        </div>
      </Content>

      {/* 右侧配置栏（可折叠） */}
      {showConfig && (
      <Sider width={480} theme="light" style={{ borderLeft: '1px solid #e8ecf3', padding: '20px 20px 0 20px', height: '100%', overflow: 'hidden', background: 'linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%)' }}>
        <div className="studio-side-title" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>智能体设置</span>
          <span style={{ display:'inline-flex', gap:8 }}>
            <Button size="small" onClick={()=>setShowPromptModal(true)}>提示词</Button>
          </span>
        </div>
        <StudioSettingsPanel
          configTab={configTab}
          setConfigTab={(k)=>setConfigTab(k)}
          onCancel={()=>navigate('/app/agent/navigation')}
          onSave={handleSave}
          onExport={async ()=>{
            try {
              if (!templateId) { message.warning('请从模板入口进入'); return; }
              if (!agentName.trim()) { message.warning('请填写助手名称'); return; }
              const req: any = {
                template_id: templateId,
                agent_name: agentName,
                description: agentDesc || undefined,
                collection_id: collectionId,
                enable_knowledge_search: !!showKnowledge,
                enable_graph_search: !!showGraph,
                retrieval_mode: 'all',
                selected_tools: selectedTools,
                tool_configs: toolConfigs,
                model_config: { default_model: chatModel || (models[0]?.id || ''), temperature, max_tokens: maxTokens, top_p: topP },
                custom_config: {
                  custom_prompt: systemPrompt,
                  resources: {
                    ...(collectionId ? { knowledge_collection: { collection_id: collectionId } } : {}),
                    ...(embedModelId ? { embedding_model: { provider: embedProvider, model_id: embedModelId } } : {}),
                    ...(crossCollections && crossCollections.length ? { cross_collections: crossCollections } : {})
                  },
                  chat_config: { multi_turn: !!multiTurn, max_rounds: Number(maxRounds) || 0 },
                  ...(useMetadata ? { metadata_filters: metadataFilters || [] } : {}),
                  ...(showGraph ? { graph_config: {
                    trigger: graphMode,
                    query_mode: graphQueryMode,
                    fixed_query: graphFixedQuery || undefined,
                    top_k: graphTopK,
                    chunk_top_k: graphChunkTopK,
                  }} : {})
                }
              };
              let res: any = null;
              const draftId = localStorage.getItem('last_draft_agent_id');
              if (draftId) {
                try {
                  const r = await userAgentService.promoteUserAgent(draftId);
                  res = { id: r.id };
                  localStorage.removeItem('last_draft_agent_id');
                } catch {
                  res = await userAgentService.createUserAgent(req);
                }
              } else {
                res = await userAgentService.createUserAgent(req);
              }
              // 导出成功后清理本模板所有草稿
              try {
                const store = JSON.parse(localStorage.getItem('agent_studio_drafts_v2') || '{}');
                if (store?.[templateId]) { delete store[templateId]; localStorage.setItem('agent_studio_drafts_v2', JSON.stringify(store)); }
              } catch {}
              message.success('已导出到“我的智能体”');
              navigate(`/app/agent/navigation?created=${encodeURIComponent(res.id)}`);
            } catch(e:any) { message.error(e?.message||'导出失败'); }
          }}
          drafts={drafts}
          selectedDraftId={selectedDraftId}
          setSelectedDraftId={setSelectedDraftId}
          onLoadDraft={onLoadDraft}
          onDeleteDraft={onDeleteDraft}
          onSaveDraftAs={onSaveDraftAs}
          basic={{
            showKnowledge, showGraph, requirements, collections,
            collectionId, setCollectionId,
            useMetadata, setUseMetadata, hideMetadata: true,
            systemPrompt, setSystemPrompt,
            simThreshold, setSimThreshold,
            simWeight, setSimWeight,
            topN, setTopN,
            multiTurn, setMultiTurn,
            maxRounds, setMaxRounds,
            reasoning, setReasoning,
            crossCollections, setCrossCollections,
            agentName, setAgentName,
            agentDesc, setAgentDesc,
            greeting, setGreeting,
            emptyReply, setEmptyReply,
            showCrossKnowledge: templateKind !== 'qa',
            graphMode, setGraphMode,
            graphQueryMode, setGraphQueryMode,
            graphFixedQuery, setGraphFixedQuery,
            graphTopK, setGraphTopK,
            graphChunkTopK, setGraphChunkTopK,
          }}
          prompt={{ 
            systemPrompt, setSystemPrompt,
            selectedTools,
            resources: { knowledge_collection: { collection_id: collectionId }, cross_collections: crossCollections },
            simThreshold,
          }}
          model={{
            chatModel, setChatModel, chatModelOptions,
            showEmbedding, requirements,
            providerOptions, embedProvider, setEmbedProvider,
            embedModelId, setEmbedModelId,
            embeddingMap,
            rerankModel, setRerankModel, rerankOptions,
            hideRerank: templateKind === 'qa',
            temperature, setTemperature,
            topP, setTopP,
            maxTokens, setMaxTokens,
            models,
          }}
          showAdvanced={templateKind !== 'qa'}
          tools={{
            availableTools, selectedTools,
            setSelectedTools: (updater)=> setSelectedTools(prev => updater(prev)),
            toolTab, setToolTab,
            activeTool, setActiveTool,
            filteredTools,
            renderToolForm,
          }}
          advanced={{
            kbId: collectionId,
            useMetadata: !!useMetadata, setUseMetadata,
            metadataFilters, setMetadataFilters,
            hiragEnabled, setHiragEnabled,
          }}
        />
        {/* 提示词配置弹窗 */}
        <Modal open={showPromptModal} onCancel={()=>setShowPromptModal(false)} onOk={()=>setShowPromptModal(false)} title="提示词配置" width={960} footer={null}>
          <PromptSettingsSection
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            selectedTools={selectedTools}
            resources={{ knowledge_collection: { collection_id: collectionId }, cross_collections: crossCollections }}
            simThreshold={simThreshold}
          />
        </Modal>
      </Sider>
      )}
      {/* 草稿另存为 */}
      <Modal open={saveAsOpen} onCancel={()=>setSaveAsOpen(false)} onOk={doSaveDraftAs} okText="保存" title="另存为草稿">
        <Input value={saveAsName} onChange={e=>setSaveAsName(e.target.value)} placeholder="输入草稿名称" />
      </Modal>
    </Layout>
  );
};

export default AgentStudioPage;
