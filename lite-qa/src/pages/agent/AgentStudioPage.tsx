import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { flushSync } from 'react-dom'; // 移除：flushSync会卡死页面
import RetrievalExecPanel from '../../components/retrieval/RetrievalExecPanel';
import './AgentStudioPage.css';
import {
  Layout, Button, Input, Typography, Space, Row, Col, Card, Avatar, Upload, message,
  Switch, Select, Slider, InputNumber, Divider, Spin, Tag, Collapse, Segmented, Tabs, Tooltip, Modal, Drawer
} from 'antd';
import {
  SaveOutlined, SendOutlined, UploadOutlined, ArrowLeftOutlined,
  BookOutlined, NodeIndexOutlined, CopyOutlined,
  LikeOutlined, DislikeOutlined, RedoOutlined, StopOutlined
} from '@ant-design/icons';
import { ReasoningBubble, AnswerBubble, CitationButton, UserBubble } from '../../components/studio/MessageComponents';
import StatusIndicator from '../../components/studio/StatusIndicator';
import StreamContentRenderer, { type OutputMode } from '../../components/studio/StreamContentRenderer';
import { ActionPanel } from '../../components/qa/ActionPanel';
import '../../components/studio/StreamContentRenderer.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import type { KnowledgeCollection, ModelOption, AgentTemplate, AgentTool } from '../../services/userAgentService';
import { listGatewayEmbeddingModels, runWorkflowStream } from '../../services/workflowService';
import { CollectionService } from '../../services/collectionService';
import StudioSettingsPanel from './studio/StudioSettingsPanel';
import PromptSettingsSection from './studio/PromptSettingsSection';
import AgentConfigCard from '../../components/agent/AgentConfigCard';

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
  // 草稿管理（精简：仅“保存草稿”快速功能）
  // 工具选择与配置
  const [availableTools, setAvailableTools] = useState<AgentTool[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({});
  const [toolTab, setToolTab] = useState<'builtin'|'mcp'|'api'|'custom_crawler'>('builtin');
  const [toolQuery, setToolQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [configTab, setConfigTab] = useState<'basic'|'knowledge'|'graph'|'model'|'tools'|'advanced'>('basic');
  const [showPromptModal, setShowPromptModal] = useState(false);
  // 溯源 Modal 状态
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any>(null);
  // 思考 Modal 状态
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [activeReasoning, setActiveReasoning] = useState<string>('');
  // 返回确认 Modal 状态
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // 滚动到最新思考的工具
  const scrollReasoningToBottom = () => {
    try {
      const list = document.querySelectorAll('.reasoning-fixed');
      if (list && list.length) {
        const el = list[list.length - 1] as HTMLElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  };
  // 根据入口或参数决定是否默认展示配置：openConfig=1 强制展示；保留默认逻辑但移除用户侧的收起/展开按钮
  const openConfigParam = (sp.get('openConfig') || '').trim();
  const [showConfig, setShowConfig] = useState<boolean>(() => {
    if (openConfigParam === '1') return true;
    return !!templateId && !agentId;
  });
  const [mcpToolCache, setMcpToolCache] = useState<Record<string, string[]>>({});

  // 检索策略（新增：路由与数据源开关）
  const [useQARouting, setUseQARouting] = useState<boolean>(false);
  const [includeDocuments, setIncludeDocuments] = useState<boolean>(true);
  const [includeQADatasets, setIncludeQADatasets] = useState<boolean>(true);
  const [useReranking, setUseReranking] = useState<boolean>(true);

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

    // 自定义爬虫工具：配置最大结果数量
    if ((tool.tool_type || '').toLowerCase() === 'custom_crawler') {
      const current = toolConfigs[tool.tool_code] || {};
      const maxResults = current.max_results ?? 10;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text className="setting-label">最大返回结果数量</Text>
            <InputNumber
              value={maxResults}
              onChange={(v) => setToolConfigs(prev => ({
                ...prev,
                [tool.tool_code]: { ...(prev[tool.tool_code] || {}), max_results: v ?? 10 }
              }))}
              min={1}
              max={50}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              设置每次搜索返回的最大结果数量（1-50）
            </div>
          </div>
          {tool.description && (
            <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{tool.description}</Text>
            </div>
          )}
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
  const [enableAgenticFilters, setEnableAgenticFilters] = useState<boolean>(true);
  // 总结输出风格（默认值）
  const [summaryIntroMax, setSummaryIntroMax] = useState<number>(150);
  const [summaryPointMax, setSummaryPointMax] = useState<number>(80);
  const [summaryPointsMin, setSummaryPointsMin] = useState<number>(3);
  const [summaryPointsMax, setSummaryPointsMax] = useState<number>(6);
  const [summarySourcesMax, setSummarySourcesMax] = useState<number>(3);
  const [systemPrompt, setSystemPrompt] = useState<string>('你是一个智能助手，请总结知识库的内容来回答问题。\n\n【输出格式要求】\n请使用 Markdown 格式返回回答，支持代码块、表格、列表等标准 Markdown 语法。');
  // Hook配置（只支持直接选择Hooks）
  const [selectedPreHooks, setSelectedPreHooks] = useState<string[]>([]);
  const [selectedPostHooks, setSelectedPostHooks] = useState<string[]>([]);
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
  const [maxTokens, setMaxTokens] = useState<number>(4000);
  const [stream, setStream] = useState<boolean>(true);
  const [outputMode, setOutputMode] = useState<OutputMode>('markdown');
  const [embedProvider, setEmbedProvider] = useState<string | undefined>(undefined);
  const [embedModelId, setEmbedModelId] = useState<string | undefined>(undefined);

  // 输出模式联动：当切换输出模式时，智能更新系统提示词的输出格式指令
  useEffect(() => {
    // 定义各模式的输出格式指令
    const formatInstructions: Record<OutputMode, string> = {
      markdown: '\n\n【输出格式要求】\n请使用 Markdown 格式返回回答，支持代码块、表格、列表等标准 Markdown 语法。',
      html: '\n\n【输出格式要求】\n重要：必须使用 HTML 格式返回所有内容！\n- 段落使用 <p></p> 标签\n- 标题使用 <h1> 到 <h6> 标签\n- 加粗使用 <strong></strong> 标签\n- 斜体使用 <em></em> 标签\n- 列表使用 <ul><li></li></ul> 或 <ol><li></li></ol>\n- 表格使用 <table><tr><td></td></tr></table>\n- 换行使用 <br/> 标签\n\n不要使用 Markdown 语法（如 **加粗** 或 # 标题），必须直接输出 HTML 标签。\n\n示例：\n输入：什么是人工智能？\n输出：<h2>人工智能简介</h2><p>人工智能（AI）是一门<strong>前沿技术</strong>，主要特点包括：</p><ul><li>机器学习能力</li><li>自然语言处理</li><li>计算机视觉</li></ul>',
      mixed: '\n\n【输出格式要求】\n请根据内容自动选择 Markdown 或 HTML 格式返回回答，确保格式正确。'
    };

    setSystemPrompt((prev) => {
      // 移除现有的输出格式指令（更精确的正则）
      const cleanPrompt = prev.replace(/\n\n【输出格式要求】[\s\S]*$/g, '');
      // 追加新的输出格式指令
      return cleanPrompt.trim() + formatInstructions[outputMode];
    });
  }, [outputMode]); // 只依赖 outputMode

  // 中间对话测试
  type StudioMsg = { role:'user'|'assistant'|'step', content:string, ts?: number, status?: 'processing'|'answering'|'done' };
  const [messages, setMessages] = useState<Array<StudioMsg>>([
    { role: 'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？', ts: Date.now() }
  ]);

  // 🔥 DEBUG: 监控 messages 变化
  useEffect(() => {
    const assistantMsgs = messages.filter(m => m.role === 'assistant');
    if (assistantMsgs.length > 0) {
      const last = assistantMsgs[assistantMsgs.length - 1];
      console.log('[MESSAGES DEBUG] assistant消息数量:', assistantMsgs.length, '最后一条长度:', last.content?.length, '前50字:', last.content?.substring(0, 50));
    }
  }, [messages]);

  const typingTimerRef = React.useRef<number | null>(null);
  const typingFullRef = React.useRef<string>('');

  // 🔥 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);
  const allowAnswerRef = useRef<boolean>(false);
  const pendingCitationsRef = useRef<any[]>([]);
  // 即时"检索溯源"面板（和最终消息的 citations 解耦显示，避免丢失）
  const [retrievalCitations, setRetrievalCitations] = useState<any[]>([]);
  const answerStartedRef = useRef<boolean>(false);
  // 工作流会话：用于多轮对话（让后端持久化上下文）
  const sessionIdRef = useRef<string | null>(null);
  // 记录当前运行对应的"思考卡片"索引，避免新一轮对话把思考增量写到上一次卡片
  const activeReasoningIndexRef = useRef<number | null>(null);
  // 生成一个本地对话session_id（用于保存反馈）
  const [studioSessionId] = useState<string>(()=> `studio_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);

  // 消息容器和输入框的引用
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const isAutoScrollingRef = useRef<boolean>(true); // 是否自动滚动

  // 自动滚动到底部的函数
  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesContainerRef.current && isAutoScrollingRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
      isAutoScrollingRef.current = isAtBottom;
    }
  };

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
  // 溯源展开状态：以消息索引为键
  const [openCitations, setOpenCitations] = useState<Record<number, boolean>>({});
  const toggleCitations = (idx: number) => setOpenCitations(prev => ({ ...prev, [idx]: !prev[idx] }));

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

  // 🔥 Agent配置预览数据（实时根据当前状态生成，始终显示）
  const agentConfigPreview = useMemo(() => {
    // 查找当前选中的知识库详情
    const selectedCollections = collectionId
      ? collections.filter(c => c.id === collectionId).map(c => ({
          id: c.id,
          name: c.name,
          document_count: c.document_count || 0
        }))
      : [];

    // 查找选中工具的详细信息
    const toolsWithNames = selectedTools.map(toolCode => {
      const toolInfo = availableTools.find(t => t.tool_code === toolCode);
      return {
        code: toolCode,
        name: toolInfo?.tool_name || toolCode,
        type: 'tool'
      };
    });

    // 添加Pre-Hooks到工具列表
    const preHooksWithNames = selectedPreHooks.map(hookCode => ({
      code: `pre-hook:${hookCode}`,
      name: `Pre-Hook: ${hookCode}`,
      type: 'pre-hook'
    }));

    // 添加Post-Hooks到工具列表
    const postHooksWithNames = selectedPostHooks.map(hookCode => ({
      code: `post-hook:${hookCode}`,
      name: `Post-Hook: ${hookCode}`,
      type: 'post-hook'
    }));

    // 合并所有工具和hooks
    const allToolsWithNames = [...toolsWithNames, ...preHooksWithNames, ...postHooksWithNames];

    // 推导检索策略
    const derivedRetrievalStrategy = retrievalRoute || 'default';

    return {
      id: agentId || 'preview',
      name: agentName || '我的助手',
      model: chatModel,
      tools: selectedTools,
      toolsWithNames: allToolsWithNames,
      collections: selectedCollections,
      retrieval_strategy: derivedRetrievalStrategy,
      rerank_model: rerankModel,
      temperature: temperature,
      top_k: topN
    };
  }, [agentId, agentName, selectedTools, availableTools, selectedPreHooks, selectedPostHooks, collectionId, collections, chatModel, rerankModel, temperature, topN, retrievalRoute]);

  // 页面加载时自动聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 消息变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // 流式响应时持续滚动
  useEffect(() => {
    if (testing) {
      const interval = setInterval(() => {
        scrollToBottom(false);
      }, 100); // 每100ms检查一次并滚动
      return () => clearInterval(interval);
    }
  }, [testing]);

  // 监控 testing 状态变化（调试用）
  useEffect(() => {
    console.log('[DEBUG] testing 状态变化:', testing);
  }, [testing]);

  const hasUserMessage = (arr: Array<{role:'user'|'assistant',content:string}>) => arr.some(m=>m.role==='user' && String(m.content||'').trim().length>0);
  const handleNewConversation = () => {
    if (!hasUserMessage(messages)) return; // 只有当前会话有用户消息时允许新建
    const title = messages.find(m=>m.role==='user')?.content?.slice(0,18) || '新对话';
    const next = { id: `conv_${Date.now()}`, title, messages: [{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}], createdAt: Date.now() };
    setConversations(prev => [...prev, next]);
    setCurrentConvIdx(conversations.length);
    // 切换会话时清理当前工作流 session（开启多轮时会重新建立新会话）
    sessionIdRef.current = null;
  };
  const handleClearConversation = () => {
    setMessages([{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}]);
    setConversations(prev => prev.map((c,i)=> i===currentConvIdx ? { ...c, messages: [{ role:'assistant', content: '你好！我是你的助手，有什么可以帮助你吗？'}], summary: undefined } : c));
    // 清空持久化会话
    sessionIdRef.current = null;
    // 重新聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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
        const [tpls, cols, tools, enabled, pipelines] = await Promise.all([
          userAgentService.getAgentTemplates(),
          userAgentService.getKnowledgeCollections(),
          userAgentService.getAvailableTools(),
          userAgentService.getEnabledModelsUnified(),
          fetch('/api/v1/hook-pipelines').then(r => r.ok ? r.json() : []).catch(() => [])
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
                const supports = m?.supports_tools === true;
                chatOpts.push({ value: mid, label: dname, provider: pname, isDefault: isDef, supportsTools: supports });
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
          setModels(chatOpts.map(o => ({ id:o.value, name:o.label, provider:o.provider||'', isDefault: !!o.isDefault, supportsTools: !!o.supportsTools } as any)));
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
              // 名称规范：优先使用"智能体"作为后缀
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
        } else if (agentId) {
          // 🔥 若通过 agentId 进入（从"我的智能体"点击对话），加载智能体配置
          try {
            console.log('[AgentStudio] 加载用户智能体配置, agentId:', agentId);
            const agentDetail = await userAgentService.getUserAgent(agentId);

            // 设置智能体基本信息
            setAgentName(agentDetail.agent_name || '我的助手');
            setAgentDesc(agentDetail.description || '');

            // 设置工具配置
            if (agentDetail.selected_tools && Array.isArray(agentDetail.selected_tools)) {
              setSelectedTools(agentDetail.selected_tools);
              console.log('[AgentStudio] 加载工具配置:', agentDetail.selected_tools);
            }
            if (agentDetail.tools_config) {
              const toolsConfig = agentDetail.tools_config as any;
              if (toolsConfig.configs) {
                setToolConfigs(toolsConfig.configs);
              }
            }

            // 设置模型配置
            if (agentDetail.model_config) {
              const modelCfg = agentDetail.model_config as any;
              if (modelCfg.default_model) setChatModel(modelCfg.default_model);
              if (typeof modelCfg.temperature === 'number') setTemperature(modelCfg.temperature);
              if (typeof modelCfg.max_tokens === 'number') setMaxTokens(modelCfg.max_tokens);
              if (typeof modelCfg.top_p === 'number') setTopP(modelCfg.top_p);
            }

            // 设置自定义配置
            if (agentDetail.custom_config) {
              const customCfg = agentDetail.custom_config as any;
              if (customCfg.custom_prompt) setSystemPrompt(customCfg.custom_prompt);

              // 加载资源配置
              if (customCfg.resources) {
                const res = customCfg.resources;
                if (res.knowledge_collection?.collection_id) {
                  setCollectionId(res.knowledge_collection.collection_id);
                  setShowKnowledge(true);
                }
                if (res.embedding_model) {
                  if (res.embedding_model.provider) setEmbedProvider(res.embedding_model.provider);
                  if (res.embedding_model.model_id) setEmbedModelId(res.embedding_model.model_id);
                }
                if (res.cross_collections && Array.isArray(res.cross_collections)) {
                  setCrossCollections(res.cross_collections);
                }
              }

              // 加载检索策略配置
              if (customCfg.retrieval_flags) {
                const flags = customCfg.retrieval_flags;
                if (typeof flags.use_qa_routing === 'boolean') setUseQARouting(flags.use_qa_routing);
                if (typeof flags.include_documents === 'boolean') setIncludeDocuments(flags.include_documents);
                if (typeof flags.include_qa_datasets === 'boolean') setIncludeQADatasets(flags.include_qa_datasets);
                if (typeof flags.enable_reranking === 'boolean') setUseReranking(flags.enable_reranking);
              }

              // 加载 Agentic Filters 配置
              if (typeof customCfg.agentic_filters_enabled === 'boolean') {
                setEnableAgenticFilters(customCfg.agentic_filters_enabled);
              }

              // 加载Hook配置
              if (customCfg.hooks) {
                const hooksCfg = customCfg.hooks;
                if (Array.isArray(hooksCfg.pre_hooks)) setSelectedPreHooks(hooksCfg.pre_hooks);
                if (Array.isArray(hooksCfg.post_hooks)) setSelectedPostHooks(hooksCfg.post_hooks);
                console.log('[AgentStudio] 加载Hook配置:', hooksCfg);
              }
            }

            console.log('[AgentStudio] 智能体配置加载完成:', {
              name: agentDetail.agent_name,
              tools: agentDetail.selected_tools?.length || 0,
              model: agentDetail.model_config?.default_model
            });
          } catch (e: any) {
            console.error('[AgentStudio] 加载智能体配置失败:', e);
            message.error(e?.message || '加载智能体配置失败');
          }
        }

        // 🔥 在加载完基础数据后，恢复草稿数据
        // 只有在从模板创建（有templateId但无agentId）时才恢复草稿
        if (templateId && !agentId) {
          try {
            const savedDraft = localStorage.getItem('agent_studio_draft');
            if (savedDraft) {
              const draft = JSON.parse(savedDraft);
              // 检查草稿是否匹配当前模板
              if (draft.templateId === templateId) {
                const req = draft.req;
                console.log('[AgentStudio] 恢复草稿数据:', req);

                // 恢复基本信息
                if (req.agent_name) setAgentName(req.agent_name);
                if (req.description) setAgentDesc(req.description);

                // 恢复知识库配置
                if (req.collection_id) {
                  setCollectionId(req.collection_id);
                }

                // 恢复工具配置
                if (req.selected_tools && Array.isArray(req.selected_tools)) {
                  console.log('[AgentStudio] 恢复工具列表:', req.selected_tools);
                  setSelectedTools(req.selected_tools);
                }
                if (req.tool_configs) {
                  console.log('[AgentStudio] 恢复工具配置:', req.tool_configs);
                  setToolConfigs(req.tool_configs);
                }

                // 恢复模型配置
                if (req.model_config) {
                  if (req.model_config.default_model) setChatModel(req.model_config.default_model);
                  if (typeof req.model_config.temperature === 'number') setTemperature(req.model_config.temperature);
                  if (typeof req.model_config.max_tokens === 'number') setMaxTokens(req.model_config.max_tokens);
                  if (typeof req.model_config.top_p === 'number') setTopP(req.model_config.top_p);
                }

                // 恢复自定义配置
                if (req.custom_config) {
                  if (req.custom_config.custom_prompt) setSystemPrompt(req.custom_config.custom_prompt);

                  // 恢复资源配置
                  if (req.custom_config.resources) {
                    const res = req.custom_config.resources;
                    if (res.embedding_model) {
                      if (res.embedding_model.provider) setEmbedProvider(res.embedding_model.provider);
                      if (res.embedding_model.model_id) setEmbedModelId(res.embedding_model.model_id);
                    }
                    if (res.cross_collections && Array.isArray(res.cross_collections)) {
                      setCrossCollections(res.cross_collections);
                    }
                  }

                  // 恢复检索策略配置
                  if (req.custom_config.retrieval_flags) {
                    const flags = req.custom_config.retrieval_flags;
                    if (typeof flags.use_qa_routing === 'boolean') setUseQARouting(flags.use_qa_routing);
                    if (typeof flags.include_documents === 'boolean') setIncludeDocuments(flags.include_documents);
                    if (typeof flags.include_qa_datasets === 'boolean') setIncludeQADatasets(flags.include_qa_datasets);
                    if (typeof flags.enable_reranking === 'boolean') setUseReranking(flags.enable_reranking);
                  }

                  // 恢复 Agentic Filters 配置
                  if (typeof req.custom_config.agentic_filters_enabled === 'boolean') {
                    setEnableAgenticFilters(req.custom_config.agentic_filters_enabled);
                  }

                  // 恢复Hook配置
                  if (req.custom_config.hooks) {
                    console.log('[AgentStudio] 恢复Hook配置:', req.custom_config.hooks);
                    if (Array.isArray(req.custom_config.hooks.pre_hooks)) {
                      console.log('[AgentStudio] 恢复Pre-Hooks:', req.custom_config.hooks.pre_hooks);
                      setSelectedPreHooks(req.custom_config.hooks.pre_hooks);
                    }
                    if (Array.isArray(req.custom_config.hooks.post_hooks)) {
                      console.log('[AgentStudio] 恢复Post-Hooks:', req.custom_config.hooks.post_hooks);
                      setSelectedPostHooks(req.custom_config.hooks.post_hooks);
                    }
                  } else {
                    console.log('[AgentStudio] 草稿中没有Hook配置');
                  }
                }

                message.success('已恢复草稿配置');
              }
            }
          } catch (e: any) {
            console.error('[AgentStudio] 恢复草稿失败:', e);
            // 不显示错误提示，静默失败
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
  // 另存/加载/删除草稿能力已移除，仅保留 handleSave 快速保存

  const handleSave = async () => {
    try {
      if (!templateId) { message.warning('请从模板入口进入'); return; }
      if (!agentName.trim()) { message.warning('请填写助手名称'); return; }
      // 依据检索策略开关推导检索模式（仅用于兼容工具内模式切换）
      const derivedMode: 'all'|'qa_only'|'papers_only' = (includeDocuments && !includeQADatasets) ? 'papers_only'
        : ((!includeDocuments && includeQADatasets) ? 'qa_only' : 'all');

      // 规范化草稿名称：去除旧的 draft 后缀，添加当前时间戳
      const now = new Date();
      const pad = (n:number)=> String(n).padStart(2,'0');
      const yy = String(now.getFullYear()).slice(-2);
      const MM = pad(now.getMonth()+1);
      const dd = pad(now.getDate());
      const HH = pad(now.getHours());
      const mm2 = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const suffix = ` · draft-${yy}${MM}${dd}-${HH}${mm2}${ss}`;
      const stripDraft = (name:string)=> (name||'').replace(/\s*·\s*(draft|草稿).*$/i,'').trim();
      const baseName = stripDraft(agentName || '我的助手');
      const agentNameForDraft = `${baseName}${suffix}`;

      const draft = { templateId, createdAt: Date.now(), req: {
        template_id: templateId,
        agent_name: agentNameForDraft,
        description: agentDesc || undefined,
        collection_id: collectionId,
        enable_knowledge_search: !!showKnowledge,
        enable_graph_search: false,
        retrieval_mode: derivedMode,
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
          // 持久化检索策略开关
          retrieval_flags: {
            use_qa_routing: !!useQARouting,
            include_documents: includeDocuments !== false,
            include_qa_datasets: includeQADatasets !== false,
            enable_reranking: useReranking !== false,
          },
          // Agentic Filters 开关
          agentic_filters_enabled: !!enableAgenticFilters,
          // 总结输出风格
          summary_prefs: { intro_max_chars: summaryIntroMax, point_max_chars: summaryPointMax, points_min: summaryPointsMin, points_max: summaryPointsMax, sources_max: summarySourcesMax },
          chat_config: {
            multi_turn: !!multiTurn,
            max_rounds: Number(maxRounds) || 0
          },
          ...(useMetadata ? { metadata_filters: metadataFilters || [] } : {}),
          // Hook配置
          hooks: {
            pre_hooks: selectedPreHooks || [],
            post_hooks: selectedPostHooks || []
          }
        }
      } };
      console.log('[AgentStudio] 保存草稿，selectedTools:', selectedTools);
      console.log('[AgentStudio] 保存草稿，toolConfigs:', toolConfigs);
      console.log('[AgentStudio] 保存草稿，Pre-Hooks:', selectedPreHooks);
      console.log('[AgentStudio] 保存草稿，Post-Hooks:', selectedPostHooks);
      localStorage.setItem('agent_studio_draft', JSON.stringify(draft));
      // 同步创建临时智能体（服务端草稿）
      try {
        const res: any = await userAgentService.createDraftUserAgent(draft.req as any);
        if (res?.id) localStorage.setItem('last_draft_agent_id', res.id);
        // 固定使用规范化后的草稿名，避免多次保存累积后缀
        setAgentName(agentNameForDraft);
      } catch {}
      message.success('保存为草稿，仅用于创建页测试');
    } catch (e: any) {
      message.error(e?.message || '保存草稿失败');
    }
  };

  // 中止当前请求
  const handleAbort = () => {
    if (runRef.current) {
      runRef.current.abort();
      runRef.current = null;
    }
    setTesting(false);
    // 更新最后一条步骤消息为中止状态
    setMessages(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i >= 0; i--) {
        if ((arr[i] as any).role === 'step') {
          arr[i] = {
            ...(arr[i] as any),
            content: '已中止',
            status: 'done',
            ts: Date.now()
          } as any;
          break;
        }
      }
      return arr;
    });
    // 重新聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleRun = async () => {
    console.log('[DEBUG] handleRun 开始执行');
    const text = inputText.trim();
    if (!text) {
      console.log('[DEBUG] 文本为空，退出');
      return;
    }
    if (testing) {
      console.log('[DEBUG] 正在处理中，退出');
      return;
    }
    console.log('[DEBUG] 准备发送消息:', text);
    setInputText('');
    setMessages(prev => [...prev, { role:'user', content: text, ts: Date.now() }]);
    // 新一轮运行前重置思考卡片索引
    activeReasoningIndexRef.current = null;
    // 启用自动滚动
    isAutoScrollingRef.current = true;
    // 添加初始处理状态提示
    setMessages(prev => [...prev, { role:'step', content: '正在处理您的请求...', status: 'processing', ts: Date.now() } as any]);
    // 重新聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    try {
      console.log('[DEBUG] 即将设置 testing=true');
      setTesting(true);
      console.log('[DEBUG] 已调用 setTesting(true)');
      // 重置状态
      answerStartedRef.current = false;
      // 流式累积缓冲
      let hasStream = false;
      let streamBuffer = '';
      // 思考过程捕获（基于简单标签）
      let reasoningActive = false;
      let reasoningBuf = '';
      // 初始化检索面板事件（如果选择了知识库或跨库，或开启了图谱检索）
      try {
        const initEvents: any[] = [];
        if (collectionId || (crossCollections && crossCollections.length)) {
          initEvents.push({ stage: 'retrieve', mode: 'auto', query: text, top_n: topN, collections: [collectionId, ...(crossCollections||[])].filter(Boolean) });
        }
        if (showGraph) {
          initEvents.push({ stage: 'retrieve_graph', mode: graphQueryMode, query: text, top_n: graphTopK });
        }
        setRetrievalEvents(initEvents);
      } catch {}
      // 基于当前检索开关推导检索模式（仅用于兼容工具/后端日志）
      const derivedMode: 'all'|'qa_only'|'papers_only' = (includeDocuments && !includeQADatasets) ? 'papers_only'
        : ((!includeDocuments && includeQADatasets) ? 'qa_only' : 'all');

      // 组装历史对话（仅 assistant/user，且不包含本轮用户消息；后端会追加规范化后的提示为 user）。
      // 仅当开启"多轮对话优化"时才传递。
      const history = (() => {
        if (!multiTurn) return [] as Array<{role:'user'|'assistant', content:string}>;
        const arr = [...messages];
        if (arr.length && arr[arr.length-1].role === 'user') arr.pop();
        return arr.filter(m => m.role === 'user' || m.role === 'assistant')
                  .map(m => ({ role: m.role as any, content: m.content }));
      })();

      // 🔥 关键修复：根据agentId选择正确的API端点
      // - 如果agentId存在（从"我的智能体"列表点击对话进入），调用用户智能体端点
      // - 否则（从模板创建或草稿测试），调用工作室workflow端点
      let handle: { abort: () => void };

      if (agentId) {
        // 使用用户智能体端点 - 从数据库加载配置并执行
        console.log('[AgentStudio] 使用用户智能体端点, agentId:', agentId);
        handle = await userAgentService.invokeUserAgentStream(
          agentId,
          {
            message: text,
            session_id: multiTurn ? (sessionIdRef.current || undefined) : undefined,
            stream: !!stream,
            ...(multiTurn ? {
              chat_messages: history as any,
              chat_config: { max_rounds: maxRounds || 6 }
            } : {})
          },
          (ev) => {
        try {
          try { console.debug('[WF event]', JSON.stringify(ev)); } catch {}
          // unwrap step_event
          const payload: any = (ev && ev.type === 'step_event' && ev.data) ? ev.data : ev;

          // 🔥 调试：追踪所有事件
          if (payload?.stage) {
            console.log('[EVENT DEBUG] 事件类型:', ev?.type, 'stage:', payload.stage, 'status:', payload.status, 'has_citations:', !!payload.citations, 'citations_length:', payload.citations?.length || 0);
            if (payload.citations?.length > 0) {
              console.log('[EVENT DEBUG] citations数据:', payload.citations);
            }
          }


          // 接收并缓存服务端的 session_id/state，供下一轮复用
          if (ev?.type === 'session_state') {
            if (multiTurn && ev?.session_id) sessionIdRef.current = String(ev.session_id);
          }

          // 在LLM正式输出前，输出工作流执行步骤到消息列表（独立展示）
          // 仅对非 execute 阶段或非 answering/thinking 状态的事件渲染，避免把增量 token 当步骤渲染
          if (ev?.type === 'step_event') {
            const stg = payload?.stage || payload?.step || 'step';
            const stat = (payload?.status || payload?.state || '').toString().toLowerCase();
            const hasDelta = typeof payload?.delta === 'string' && payload?.delta.length > 0;
            // 白名单：仅渲染 prepare / plan / retrieve / retrieve_graph 等步骤
            const whitelist = new Set(['prepare', 'plan', 'retrieve', 'retrieve_graph']);
            if (!whitelist.has(stg.toLowerCase())) {
              // 对 execute 等阶段，不在此处渲染（对应的增量/最终输出由下方专用分支处理）
            } else if (!hasDelta && stat !== 'answering' && stat !== 'thinking') {
              const name = payload?.name || payload?.title || '';
              const brief = payload?.desc || payload?.message || payload?.tip || '';
              const line = `${stg}${stat ? ` · ${stat}` : ''}${name ? `\n• ${name}` : ''}${brief ? `\n${brief}` : ''}`;
              setMessages(prev => {
                const arr = [...prev];
                if (arr.length && arr[arr.length-1].role === 'step') {
                  arr[arr.length-1] = { role:'step', content: line, ts: Date.now() } as any;
                  return arr;
                }
                return [...prev, { role:'step', content: line, ts: Date.now() }];
              });
            }
            // 不 return，允许后续针对检索面板等专用处理继续执行
          }

          // 检索阶段事件：更新检索面板
          if (payload?.stage === 'retrieve') {
            console.log('[RETRIEVE EVENT DEBUG] 收到retrieve事件, 完整payload:', JSON.stringify(payload).substring(0, 500));
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
          if (payload?.stage === 'retrieve_graph') {
            const evt: any = {
              stage: 'retrieve_graph',
              mode: payload.mode || graphQueryMode || 'mix',
              top_n: payload.top_n || graphTopK,
              query: text,
              hits: payload.hits,
              context_preview: payload.context_preview,
              warning: payload.warning,
            };
            setRetrievalEvents(prev => ([...prev, evt]));
            return;
          }

      const clearTyping = () => {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          // 收尾：确保最后一个assistant内容为完整文本
          const finalFull = typingFullRef.current || '';
          if (finalFull) {
            setMessages(prev => {
              const arr = [...prev];
              if (arr.length && arr[arr.length-1].role === 'assistant') {
                (arr[arr.length-1] as any).content = finalFull;
                (arr[arr.length-1] as any).ts = Date.now();
              }
              return arr;
            });
          }
        }
      };

      const simulateTyping = (full: string) => {
        clearTyping();
        typingFullRef.current = full;
        let idx = 0;
        // 插入占位assistant
        setMessages(prev => {
          const arr = [...prev];
          // 若最后一条是assistant则复用，否则新建
          if (!arr.length || arr[arr.length-1].role !== 'assistant') {
            arr.push({ role:'assistant', content:'', ts: Date.now() } as any);
          } else {
            (arr[arr.length-1] as any).content = '';
          }
          return arr;
        });
        // 🔥 恢复打字机效果，但使用 ref 保存完整内容避免被覆盖
        typingFullRef.current = full; // 保存到 ref
        idx = 0;
        typingTimerRef.current = window.setInterval(() => {
          const fullText = typingFullRef.current; // 从 ref 读取
          idx += Math.max(1, Math.floor(fullText.length / 60));
          if (idx >= fullText.length) idx = fullText.length;
          const slice = fullText.slice(0, idx);
          setMessages(prev => {
            const arr = [...prev];
            if (arr.length && arr[arr.length-1].role === 'assistant') {
              (arr[arr.length-1] as any).content = slice;
              (arr[arr.length-1] as any).ts = Date.now();
            }
            return arr;
          });
          if (idx >= fullText.length) clearTyping();
        }, 30);
      };

      // 检索阶段状态提示
      if (payload?.stage === 'retrieve' && payload?.status) {
        setMessages(prev => {
          const arr = [...prev];
          const lastIdx = arr.length - 1;
          if (lastIdx >= 0 && arr[lastIdx].role === 'step') {
            arr[lastIdx] = {
              role: 'step',
              content: '正在检索知识库...',
              status: 'retrieving',
              ts: Date.now()
            } as any;
          } else {
            arr.push({
              role: 'step',
              content: '正在检索知识库...',
              status: 'retrieving',
              ts: Date.now()
            } as any);
          }
          return arr;
        });
      }

      // 执行阶段：在thinking时显示思考文本/占位，收到增量时变"回答中 …"，结束后"回答完毕"
      if (payload?.stage === 'execute' && (payload?.status || payload?.state) && !payload?.delta && !payload?.result) {
        const stat = (payload?.status || payload?.state || '').toString().toLowerCase();
        if (stat === 'thinking') {
          // 只占位，不使用 payload.content，避免把回答写进思考卡
          allowAnswerRef.current = false;
          setMessages(prev => {
            const arr = [...prev];
            if (activeReasoningIndexRef.current === null) {
              activeReasoningIndexRef.current = arr.length;
              arr.push({ role:'reasoning', content: '思考中…', status:'thinking', ts: Date.now() } as any);
            }
            return arr;
          });
          return;
        }
        if (stat === 'answering') { allowAnswerRef.current = true; return; }
      }

      // 检索阶段与执行阶段：若收到溯源引用，保存到pendingCitationsRef，等待下一个assistant消息创建时附加
      if (payload?.stage === 'retrieve' || payload?.stage === 'execute') {
        console.log('[CITATIONS DEBUG] 收到事件, stage:', payload.stage, 'payload.citations存在:', !!payload.citations, '是数组:', Array.isArray(payload.citations), '长度:', payload.citations?.length);
        const citations = Array.isArray(payload.citations) ? payload.citations : undefined;
        if (citations && citations.length) {
          console.log('[CITATIONS DEBUG] 收到检索citations:', citations.length, '条, 来自:', payload.stage);
          console.log('[CITATIONS DEBUG] citations详细数据:', JSON.stringify(citations.slice(0, 2)).substring(0, 300));
          // 保存到pending，等待新assistant消息创建时附加
          (pendingCitationsRef as any).current = citations;
          // 同时更新retrievalCitations状态用于调试显示
          setRetrievalCitations(citations);
          console.log('[CITATIONS DEBUG] 保存到pendingCitationsRef和retrievalCitations，等待新assistant消息创建');
        }
      }

      // 优先处理 reasoning delta（后端格式：{"delta": "...", "reasoning": true}）
      if (payload?.reasoning === true && payload?.delta && typeof payload.delta === 'string') {
        const reasoningDelta = payload.delta;
        reasoningBuf += reasoningDelta;
        const content = reasoningBuf.trim();

        // 无论 content 是否为空，都更新思考卡片（即使是空白也要创建占位）
        setMessages(prev => {
          const arr = [...prev];

          if (activeReasoningIndexRef.current === null) {
            // 创建新的 reasoning 消息
            activeReasoningIndexRef.current = arr.length;
            const newMsg = { role:'reasoning', content: content || '思考中…', status:'thinking', ts: Date.now() } as any;
            arr.push(newMsg);
          } else {
            const idx = activeReasoningIndexRef.current;

            // 检查索引是否有效，如果无效则重新创建
            if (idx != null && idx < arr.length && arr[idx] && arr[idx].role === 'reasoning') {
              // 更新现有的 reasoning 消息
              const r = { ...(arr[idx] as any) };
              r.content = content || r.content || '思考中…';
              r.ts = Date.now();
              arr[idx] = r as any;
            } else {
              // 索引无效或消息已被替换，重新创建
              activeReasoningIndexRef.current = arr.length;
              const newMsg = { role:'reasoning', content: content || '思考中…', status:'thinking', ts: Date.now() } as any;
              arr.push(newMsg);
            }
          }
          return arr;
        });
        setTimeout(scrollReasoningToBottom, 0);
        return; // 关键：必须 return，防止被后续的 execute 逻辑处理
      }

      // 流式增量（execute阶段）与通用增量事件兼容
      if (payload?.stage === 'execute' || ev?.type === 'llm_delta' || ev?.type === 'assistant_delta' || typeof (payload?.delta) === 'string' || typeof (ev as any)?.token === 'string') {
            // 🔥 DEBUG: 打印收到的事件
            console.log('[STREAM DEBUG] 收到事件, stage:', payload?.stage, 'delta存在:', !!payload?.delta, 'delta长度:', payload?.delta?.length, 'status:', payload?.status);

            // 状态提示（思考/回答中）可在UI上做轻提示，这里先忽略
            if (typeof payload.delta === 'string' && payload.delta.length) {
              hasStream = true;
              const token = payload.delta as string;
              console.log('[STREAM DEBUG] 处理delta, token长度:', token.length, '前20字:', token.substring(0, 20));
              try { console.debug('[LLM delta]', token); } catch {}
              streamBuffer += token;
              // 仅在显式标记下才把增量视作"思考"
              try {
                const norm = token.replace(/\r/g, '');
                const isReasoningDelta = ((payload as any)?.reasoning === true || /(<think>|【思考】)/i.test(norm));
                if (!reasoningActive && isReasoningDelta) {
                  reasoningActive = true;
                }
                if (reasoningActive) {
                  let chunk = norm;
                  // 删除明显标签
                  chunk = chunk.replace(/<think>|【思考】/gi, '');
                  // 检测结束
                  if (/(<\/think>|【\/思考】)/i.test(chunk)) {
                    chunk = chunk.replace(/<\/think>|【\/思考】/gi, '');
                    reasoningActive = false;
                  }
                  reasoningBuf += chunk;
                  const content = reasoningBuf.trim();
                  if (content) {
                    // 将增量写入“当前轮次”的思考卡片（必要时创建）
                    setMessages(prev => {
                      const arr = [...prev];
                      if (activeReasoningIndexRef.current === null) {
                        activeReasoningIndexRef.current = arr.length;
                        arr.push({ role:'reasoning', content: (content?.trim() ? content : '思考中…'), status:'thinking', ts: Date.now() } as any);
                      }
                      const idx = activeReasoningIndexRef.current!;
                      if (idx != null && content && content.trim()) {
                        const r = { ...(arr[idx] as any) };
                        r.content = content;
                        r.ts = Date.now();
                        arr[idx] = r as any;
                      }
                      return arr;
                    });
                    // 保持滚动到思考卡片末尾
                    setTimeout(scrollReasoningToBottom, 0);
                  }
                  return; // 思考 token 不拼接到回答气泡
                }
                // 没有显式"思考"标记：将增量视为回答
                allowAnswerRef.current = true;

                // 当开始回答时，将 reasoning 状态设为 complete
                if (activeReasoningIndexRef.current !== null) {
                  setMessages(prev => {
                    const arr = [...prev];
                    const idx = activeReasoningIndexRef.current;
                    if (idx != null && idx < arr.length && arr[idx] && arr[idx].role === 'reasoning') {
                      const r = { ...(arr[idx] as any) };
                      if (r.status !== 'complete') {
                        r.status = 'complete';
                        r.ts = Date.now();
                        arr[idx] = r as any;
                      }
                    }
                    return arr;
                  });
                }
              } catch {}
              // 更新步骤状态为"回答中 …"
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答中', status: 'answering', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答中', status: 'answering', ts: Date.now() } as any);
                return arr;
              });
              // 直接累积到 assistant 消息，让 React 自然批量更新
              setMessages(prev => {
                const arr = [...prev];
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  const msg: any = { role:'assistant', content: token, ts: Date.now(), streaming: true };
                  console.log('[CITATIONS DEBUG] 创建新assistant消息，pendingCitationsRef有数据:', !!pendingCitationsRef.current?.length, '条数:', pendingCitationsRef.current?.length || 0);
                  if (pendingCitationsRef.current?.length) {
                    msg.citations = pendingCitationsRef.current;
                    console.log('[CITATIONS DEBUG] 创建assistant消息时附加citations:', pendingCitationsRef.current.length, '条');
                    // 不要立即清空，等workflow_end时再清空
                    // pendingCitationsRef.current = [];
                  }
                  arr.push(msg as any);
                  answerStartedRef.current = true;
                } else {
                  const last = { ...arr[arr.length-1] } as any;
                  // 保留已有的citations
                  const existingCitations = last.citations;
                  if (last.typing) { delete last.typing; last.content = ''; }
                  if (last.status === 'thinking') delete last.status;
                  // 如果没有citations，尝试从pendingCitationsRef获取
                  if (!Array.isArray(existingCitations) || !existingCitations.length) {
                    if (pendingCitationsRef.current?.length) {
                      last.citations = pendingCitationsRef.current;
                      console.log('[CITATIONS DEBUG] 更新assistant消息时附加citations:', pendingCitationsRef.current.length, '条');
                      // 不要立即清空
                      // pendingCitationsRef.current = [];
                    }
                  } else {
                    // 确保保留已有的citations
                    last.citations = existingCitations;
                    console.log('[CITATIONS DEBUG] 保留已有citations:', existingCitations.length, '条');
                  }
                  last.content = (last.content || '') + token;
                  last.ts = Date.now();
                  arr[arr.length-1] = last;
                }
                return arr;
              });
              return;
            }
            // 兼容不同后端字段：ev.token 作为增量
            if (typeof (ev as any)?.token === 'string') {
              hasStream = true;
              const token = (ev as any).token as string;
              try { console.debug('[LLM token]', token); } catch {}
              streamBuffer += token;
              // 直接累积到 assistant 消息，让 React 自然批量更新
              setMessages(prev => {
                const arr = [...prev];
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  const msg: any = { role:'assistant', content: token, ts: Date.now(), streaming: true };
                  if (pendingCitationsRef.current?.length) { msg.citations = pendingCitationsRef.current; pendingCitationsRef.current = []; }
                  arr.push(msg as any);
                } else {
                  const last = { ...arr[arr.length-1] } as any;
                  // 保留已有的citations
                  const existingCitations = last.citations;
                  if (!Array.isArray(existingCitations) || !existingCitations.length) {
                    if (pendingCitationsRef.current?.length) { last.citations = pendingCitationsRef.current; pendingCitationsRef.current = []; }
                  } else {
                    // 确保保留已有的citations
                    last.citations = existingCitations;
                  }
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
              reasoningActive = false;
              const citations = Array.isArray(payload.citations) ? payload.citations : undefined;
              // 完成：更新步骤为“回答完毕”
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答完毕', status: 'done', ts: Date.now() } as any);
                return arr;
              });
              // 本轮结束，清空思考卡片索引
              activeReasoningIndexRef.current = null;
              if (stream && !hasStream) {
                simulateTyping(full);
              } else {
                setMessages(prev => {
                  if (hasStream && prev.length && prev[prev.length-1].role === 'assistant') {
                    // 🔥 修复：已经通过流式累积了内容，不要用payload.result覆盖
                    // payload.result可能被截断（如2000字符限制）
                    const arr = [...prev];
                    const last = { ...arr[arr.length-1] } as any;
                    // 保持流式累积的完整内容，不要覆盖
                    // last.content = full;  ❌ 不要覆盖！
                    delete last.streaming;
                    last.ts = Date.now();
                    if (citations) (last as any).citations = citations;
                    arr[arr.length-1] = last;
                    console.log('[DEBUG] 保持流式累积的内容，不覆盖。长度:', last.content?.length);
                    return arr;
                  }
                  return [...prev, { role:'assistant', content: full, ts: Date.now(), citations } as any];
                });
              }
              return;
            }
            // 兼容：ev.content/ev.text 作为一次性结果
            if (typeof (ev as any)?.content === 'string' || typeof (ev as any)?.text === 'string') {
              const full = ((ev as any).content || (ev as any).text || '').trim();
              if (!full) return;
              reasoningActive = false;
              const citations = Array.isArray((ev as any).citations) ? (ev as any).citations : undefined;
              // 完成：更新步骤为“回答完毕”
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答完毕', status: 'done', ts: Date.now() } as any);
                return arr;
              });
              activeReasoningIndexRef.current = null;

              // 🔥 修复：检查是否已经存在assistant消息，如果存在就不要覆盖
              // 因为流式响应可能已经累积了完整内容
              setMessages(prev => {
                const hasAssistant = prev.some(m => m.role === 'assistant');
                if (hasAssistant) {
                  // 已经存在assistant消息，不要覆盖
                  console.log('[DEBUG] 已存在assistant消息，跳过ev.content事件');
                  return prev;
                }
                // 不存在assistant消息，创建新的
                if (stream && !hasStream) {
                  simulateTyping(full);
                  return prev;
                } else {
                  return [...prev, { role:'assistant', content: full, ts: Date.now(), citations } as any];
                }
              });
              return;
            }
      }

          // 错误事件
          if (ev?.type === 'workflow_error' || ev?.type === 'step_error' || ev?.type === 'error') {
            console.log('[DEBUG] 收到错误事件，设置 testing=false');
            const msg = ev?.detail || ev?.error || '执行出错';
            setMessages(prev => [...prev, { role:'assistant', content: `执行失败：${msg}`, ts: Date.now() }]);
            // 流式传输出错，设置 testing=false
            setTesting(false);
            runRef.current = null;
            return;
          }
          if (ev?.type === 'workflow_end') {
            console.log('[DEBUG] 收到 workflow_end 事件，设置 testing=false');
            clearTyping();
            // 🔥 清理streaming状态 + 最后检查pending citations
            setMessages(prev => {
              const arr = [...prev];
              if (arr.length && arr[arr.length-1].role === 'assistant') {
                const last = { ...arr[arr.length-1] } as any;
                delete last.streaming;
                // 🔥 workflow结束时，如果pendingCitationsRef还有数据，强制附加上去
                if (pendingCitationsRef.current?.length && (!last.citations || !last.citations.length)) {
                  last.citations = pendingCitationsRef.current;
                  console.log('[CITATIONS DEBUG] workflow_end时强制附加citations:', pendingCitationsRef.current.length, '条');
                  pendingCitationsRef.current = [];
                }
                arr[arr.length-1] = last;
              }
              return arr;
            });
            activeReasoningIndexRef.current = null;
            // 若仍有步骤气泡不是"done"，在此补齐
            setMessages(prev => {
              const arr = [...prev];
              for (let i = arr.length - 1; i >= 0; i--) {
                if ((arr[i] as any).role === 'step' && (arr[i] as any).status !== 'done') {
                  arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any;
                  break;
                }
              }
              return arr;
            });
            // 如果前面没有产生execute结果，则给个简短提示
            setMessages(prev => {
              const hasAssistant = prev.some(m => m.role==='assistant');
              if (!hasAssistant) {
                return [...prev, { role:'assistant', content: '已完成测试运行', ts: Date.now() }];
              }
              return prev;
            });
            // 流式传输完成，设置 testing=false
            setTesting(false);
            runRef.current = null;
            return;
          }
        } catch {}
          }
        );
      } else {
        // 使用工作室workflow端点 - 用于从模板创建和草稿测试
        console.log('[AgentStudio] 使用工作室workflow端点');
        handle = await runWorkflowStream({
        agent_name: agentName || 'studio_agent',
        prompt: text,
        selected_tools: selectedTools,  // 使用用户选择的工具
        model: chatModel || (models[0]?.id || ''),
        // 仅当开启"多轮对话优化"时才持久化会话
        save_session: !!multiTurn,
        session_id: multiTurn ? (sessionIdRef.current || undefined) : undefined,
        stream: !!stream,
        // 仅多轮开启时传入历史消息与回合限制（后端 step_execute 会读取 chat_messages/chat_config）
        ...(multiTurn ? { chat_messages: history as any, chat_config: { max_rounds: maxRounds || 6 } } : {}),
        // 将资源透传到工作流，以便后端检索步骤使用跨知识库
        session_state: undefined,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        custom_prompt: systemPrompt,
        // 传递推理思考开关到后端
        reasoning: !!reasoning,
        // 兼容：向后端提示检索模式（如工具内需要）
        retrieval_mode: derivedMode,
        ...(collectionId || (crossCollections && crossCollections.length) || embedModelId || showGraph ? {
          resources: {
            ...(collectionId ? { knowledge_collection: { collection_id: collectionId } } : {}),
            ...(crossCollections && crossCollections.length ? { cross_collections: crossCollections } : {}),
            ...(embedModelId ? { embedding_model: { provider: embedProvider, model_id: embedModelId } } : {})
          },
          top_n: topN,
          sim_threshold: simThreshold,
          sim_weight: simWeight,
          enable_reranking: useReranking,
          summary_prefs: { intro_max_chars: summaryIntroMax, point_max_chars: summaryPointMax, points_min: summaryPointsMin, points_max: summaryPointsMax, sources_max: summarySourcesMax },
          agentic_filters_enabled: !!enableAgenticFilters,
          ...(useMetadata && metadataFilters && metadataFilters.length ? { filters: { metadata_filters: metadataFilters } } : {}),
          // 新增：检索路径与路由开关透传到后端 filters.search
          filters: {
            ...(useMetadata && metadataFilters && metadataFilters.length ? { metadata_filters: metadataFilters } : {}),
            search: {
              ...(useQARouting ? { use_qa_routing: true } : {}),
              include_documents: includeDocuments,
              include_qa_datasets: includeQADatasets,
              enable_reranking: useReranking,
            }
          }
        } : {}),
        // 明确传递图谱开关：关闭时也显式 enabled:false，避免跨轮残留
        graph_config: showGraph ? {
          enabled: true,
          trigger: graphMode,
          query_mode: graphQueryMode,
          fixed_query: graphFixedQuery || undefined,
          top_k: graphTopK,
          chunk_top_k: graphChunkTopK,
        } : { enabled: false },
      }, (ev) => {
        try {
          try { console.debug('[WF event]', JSON.stringify(ev)); } catch {}
          // unwrap step_event
          const payload: any = (ev && ev.type === 'step_event' && ev.data) ? ev.data : ev;

          // 🔥 调试：追踪所有事件
          if (payload?.stage) {
            console.log('[EVENT DEBUG] 事件类型:', ev?.type, 'stage:', payload.stage, 'status:', payload.status, 'has_citations:', !!payload.citations, 'citations_length:', payload.citations?.length || 0);
            if (payload.citations?.length > 0) {
              console.log('[EVENT DEBUG] citations数据:', payload.citations);
            }
          }


          // 接收并缓存服务端的 session_id/state，供下一轮复用
          if (ev?.type === 'session_state') {
            if (multiTurn && ev?.session_id) sessionIdRef.current = String(ev.session_id);
          }

          // 在LLM正式输出前，输出工作流执行步骤到消息列表（独立展示）
          // 仅对非 execute 阶段或非 answering/thinking 状态的事件渲染，避免把增量 token 当步骤渲染
          if (ev?.type === 'step_event') {
            const stg = payload?.stage || payload?.step || 'step';
            const stat = (payload?.status || payload?.state || '').toString().toLowerCase();
            const hasDelta = typeof payload?.delta === 'string' && payload?.delta.length > 0;
            // 白名单：仅渲染 prepare / plan / retrieve / retrieve_graph 等步骤
            const whitelist = new Set(['prepare', 'plan', 'retrieve', 'retrieve_graph']);
            if (!whitelist.has(stg.toLowerCase())) {
              // 对 execute 等阶段，不在此处渲染（对应的增量/最终输出由下方专用分支处理）
            } else if (!hasDelta && stat !== 'answering' && stat !== 'thinking') {
              const name = payload?.name || payload?.title || '';
              const brief = payload?.desc || payload?.message || payload?.tip || '';
              const line = `${stg}${stat ? ` · ${stat}` : ''}${name ? `\n• ${name}` : ''}${brief ? `\n${brief}` : ''}`;
              setMessages(prev => {
                const arr = [...prev];
                if (arr.length && arr[arr.length-1].role === 'step') {
                  arr[arr.length-1] = { role:'step', content: line, ts: Date.now() } as any;
                  return arr;
                }
                return [...prev, { role:'step', content: line, ts: Date.now() }];
              });
            }
            // 不 return，允许后续针对检索面板等专用处理继续执行
          }

          // 检索阶段事件：更新检索面板
          if (payload?.stage === 'retrieve') {
            console.log('[RETRIEVE EVENT DEBUG] 收到retrieve事件, 完整payload:', JSON.stringify(payload).substring(0, 500));
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
          if (payload?.stage === 'retrieve_graph') {
            const evt: any = {
              stage: 'retrieve_graph',
              mode: payload.mode || graphQueryMode || 'mix',
              top_n: payload.top_n || graphTopK,
              query: text,
              hits: payload.hits,
              context_preview: payload.context_preview,
              warning: payload.warning,
            };
            setRetrievalEvents(prev => ([...prev, evt]));
            return;
          }

      const clearTyping = () => {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          // 收尾：确保最后一个assistant内容为完整文本
          const finalFull = typingFullRef.current || '';
          if (finalFull) {
            setMessages(prev => {
              const arr = [...prev];
              if (arr.length && arr[arr.length-1].role === 'assistant') {
                (arr[arr.length-1] as any).content = finalFull;
                (arr[arr.length-1] as any).ts = Date.now();
              }
              return arr;
            });
          }
        }
      };

      const simulateTyping = (full: string) => {
        clearTyping();
        typingFullRef.current = full;
        let idx = 0;
        // 插入占位assistant
        setMessages(prev => {
          const arr = [...prev];
          // 若最后一条是assistant则复用，否则新建
          if (!arr.length || arr[arr.length-1].role !== 'assistant') {
            arr.push({ role:'assistant', content:'', ts: Date.now() } as any);
          } else {
            (arr[arr.length-1] as any).content = '';
          }
          return arr;
        });
        // 🔥 恢复打字机效果，但使用 ref 保存完整内容避免被覆盖
        typingFullRef.current = full; // 保存到 ref
        idx = 0;
        typingTimerRef.current = window.setInterval(() => {
          const fullText = typingFullRef.current; // 从 ref 读取
          idx += Math.max(1, Math.floor(fullText.length / 60));
          if (idx >= fullText.length) idx = fullText.length;
          const slice = fullText.slice(0, idx);
          setMessages(prev => {
            const arr = [...prev];
            if (arr.length && arr[arr.length-1].role === 'assistant') {
              (arr[arr.length-1] as any).content = slice;
              (arr[arr.length-1] as any).ts = Date.now();
            }
            return arr;
          });
          if (idx >= fullText.length) clearTyping();
        }, 30);
      };

      // 检索阶段状态提示
      if (payload?.stage === 'retrieve' && payload?.status) {
        setMessages(prev => {
          const arr = [...prev];
          const lastIdx = arr.length - 1;
          if (lastIdx >= 0 && arr[lastIdx].role === 'step') {
            arr[lastIdx] = {
              role: 'step',
              content: '正在检索知识库...',
              status: 'retrieving',
              ts: Date.now()
            } as any;
          } else {
            arr.push({
              role: 'step',
              content: '正在检索知识库...',
              status: 'retrieving',
              ts: Date.now()
            } as any);
          }
          return arr;
        });
      }

      // 执行阶段：在thinking时显示思考文本/占位，收到增量时变"回答中 …"，结束后"回答完毕"
      if (payload?.stage === 'execute' && (payload?.status || payload?.state) && !payload?.delta && !payload?.result) {
        const stat = (payload?.status || payload?.state || '').toString().toLowerCase();
        if (stat === 'thinking') {
          // 只占位，不使用 payload.content，避免把回答写进思考卡
          allowAnswerRef.current = false;
          setMessages(prev => {
            const arr = [...prev];
            if (activeReasoningIndexRef.current === null) {
              activeReasoningIndexRef.current = arr.length;
              arr.push({ role:'reasoning', content: '思考中…', status:'thinking', ts: Date.now() } as any);
            }
            return arr;
          });
          return;
        }
        if (stat === 'answering') { allowAnswerRef.current = true; return; }
      }

      // 检索阶段与执行阶段：若收到溯源引用，保存到pendingCitationsRef，等待下一个assistant消息创建时附加
      if (payload?.stage === 'retrieve' || payload?.stage === 'execute') {
        console.log('[CITATIONS DEBUG] 收到事件, stage:', payload.stage, 'payload.citations存在:', !!payload.citations, '是数组:', Array.isArray(payload.citations), '长度:', payload.citations?.length);
        const citations = Array.isArray(payload.citations) ? payload.citations : undefined;
        if (citations && citations.length) {
          console.log('[CITATIONS DEBUG] 收到检索citations:', citations.length, '条, 来自:', payload.stage);
          console.log('[CITATIONS DEBUG] citations详细数据:', JSON.stringify(citations.slice(0, 2)).substring(0, 300));
          // 保存到pending，等待新assistant消息创建时附加
          (pendingCitationsRef as any).current = citations;
          // 同时更新retrievalCitations状态用于调试显示
          setRetrievalCitations(citations);
          console.log('[CITATIONS DEBUG] 保存到pendingCitationsRef和retrievalCitations，等待新assistant消息创建');
        }
      }

      // 优先处理 reasoning delta（后端格式：{"delta": "...", "reasoning": true}）
      if (payload?.reasoning === true && payload?.delta && typeof payload.delta === 'string') {
        const reasoningDelta = payload.delta;
        reasoningBuf += reasoningDelta;
        const content = reasoningBuf.trim();

        // 无论 content 是否为空，都更新思考卡片（即使是空白也要创建占位）
        setMessages(prev => {
          const arr = [...prev];

          if (activeReasoningIndexRef.current === null) {
            // 创建新的 reasoning 消息
            activeReasoningIndexRef.current = arr.length;
            const newMsg = { role:'reasoning', content: content || '思考中…', status:'thinking', ts: Date.now() } as any;
            arr.push(newMsg);
          } else {
            const idx = activeReasoningIndexRef.current;

            // 检查索引是否有效，如果无效则重新创建
            if (idx != null && idx < arr.length && arr[idx] && arr[idx].role === 'reasoning') {
              // 更新现有的 reasoning 消息
              const r = { ...(arr[idx] as any) };
              r.content = content || r.content || '思考中…';
              r.ts = Date.now();
              arr[idx] = r as any;
            } else {
              // 索引无效或消息已被替换，重新创建
              activeReasoningIndexRef.current = arr.length;
              const newMsg = { role:'reasoning', content: content || '思考中…', status:'thinking', ts: Date.now() } as any;
              arr.push(newMsg);
            }
          }
          return arr;
        });
        setTimeout(scrollReasoningToBottom, 0);
        return; // 关键：必须 return，防止被后续的 execute 逻辑处理
      }

      // 流式增量（execute阶段）与通用增量事件兼容
      if (payload?.stage === 'execute' || ev?.type === 'llm_delta' || ev?.type === 'assistant_delta' || typeof (payload?.delta) === 'string' || typeof (ev as any)?.token === 'string') {
            // 🔥 DEBUG: 打印收到的事件
            console.log('[STREAM DEBUG] 收到事件, stage:', payload?.stage, 'delta存在:', !!payload?.delta, 'delta长度:', payload?.delta?.length, 'status:', payload?.status);

            // 状态提示（思考/回答中）可在UI上做轻提示，这里先忽略
            if (typeof payload.delta === 'string' && payload.delta.length) {
              hasStream = true;
              const token = payload.delta as string;
              console.log('[STREAM DEBUG] 处理delta, token长度:', token.length, '前20字:', token.substring(0, 20));
              try { console.debug('[LLM delta]', token); } catch {}
              streamBuffer += token;
              // 仅在显式标记下才把增量视作"思考"
              try {
                const norm = token.replace(/\r/g, '');
                const isReasoningDelta = ((payload as any)?.reasoning === true || /(<think>|【思考】)/i.test(norm));
                if (!reasoningActive && isReasoningDelta) {
                  reasoningActive = true;
                }
                if (reasoningActive) {
                  let chunk = norm;
                  // 删除明显标签
                  chunk = chunk.replace(/<think>|【思考】/gi, '');
                  // 检测结束
                  if (/(<\/think>|【\/思考】)/i.test(chunk)) {
                    chunk = chunk.replace(/<\/think>|【\/思考】/gi, '');
                    reasoningActive = false;
                  }
                  reasoningBuf += chunk;
                  const content = reasoningBuf.trim();
                  if (content) {
                    // 将增量写入“当前轮次”的思考卡片（必要时创建）
                    setMessages(prev => {
                      const arr = [...prev];
                      if (activeReasoningIndexRef.current === null) {
                        activeReasoningIndexRef.current = arr.length;
                        arr.push({ role:'reasoning', content: (content?.trim() ? content : '思考中…'), status:'thinking', ts: Date.now() } as any);
                      }
                      const idx = activeReasoningIndexRef.current!;
                      if (idx != null && content && content.trim()) {
                        const r = { ...(arr[idx] as any) };
                        r.content = content;
                        r.ts = Date.now();
                        arr[idx] = r as any;
                      }
                      return arr;
                    });
                    // 保持滚动到思考卡片末尾
                    setTimeout(scrollReasoningToBottom, 0);
                  }
                  return; // 思考 token 不拼接到回答气泡
                }
                // 没有显式"思考"标记：将增量视为回答
                allowAnswerRef.current = true;

                // 当开始回答时，将 reasoning 状态设为 complete
                if (activeReasoningIndexRef.current !== null) {
                  setMessages(prev => {
                    const arr = [...prev];
                    const idx = activeReasoningIndexRef.current;
                    if (idx != null && idx < arr.length && arr[idx] && arr[idx].role === 'reasoning') {
                      const r = { ...(arr[idx] as any) };
                      if (r.status !== 'complete') {
                        r.status = 'complete';
                        r.ts = Date.now();
                        arr[idx] = r as any;
                      }
                    }
                    return arr;
                  });
                }
              } catch {}
              // 更新步骤状态为"回答中 …"
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答中', status: 'answering', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答中', status: 'answering', ts: Date.now() } as any);
                return arr;
              });
              // 直接累积到 assistant 消息，让 React 自然批量更新
              setMessages(prev => {
                const arr = [...prev];
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  const msg: any = { role:'assistant', content: token, ts: Date.now(), streaming: true };
                  console.log('[CITATIONS DEBUG] 创建新assistant消息，pendingCitationsRef有数据:', !!pendingCitationsRef.current?.length, '条数:', pendingCitationsRef.current?.length || 0);
                  if (pendingCitationsRef.current?.length) {
                    msg.citations = pendingCitationsRef.current;
                    console.log('[CITATIONS DEBUG] 创建assistant消息时附加citations:', pendingCitationsRef.current.length, '条');
                    // 不要立即清空，等workflow_end时再清空
                    // pendingCitationsRef.current = [];
                  }
                  arr.push(msg as any);
                  answerStartedRef.current = true;
                } else {
                  const last = { ...arr[arr.length-1] } as any;
                  // 保留已有的citations
                  const existingCitations = last.citations;
                  if (last.typing) { delete last.typing; last.content = ''; }
                  if (last.status === 'thinking') delete last.status;
                  // 如果没有citations，尝试从pendingCitationsRef获取
                  if (!Array.isArray(existingCitations) || !existingCitations.length) {
                    if (pendingCitationsRef.current?.length) {
                      last.citations = pendingCitationsRef.current;
                      console.log('[CITATIONS DEBUG] 更新assistant消息时附加citations:', pendingCitationsRef.current.length, '条');
                      // 不要立即清空
                      // pendingCitationsRef.current = [];
                    }
                  } else {
                    // 确保保留已有的citations
                    last.citations = existingCitations;
                    console.log('[CITATIONS DEBUG] 保留已有citations:', existingCitations.length, '条');
                  }
                  last.content = (last.content || '') + token;
                  last.ts = Date.now();
                  arr[arr.length-1] = last;
                }
                return arr;
              });
              return;
            }
            // 兼容不同后端字段：ev.token 作为增量
            if (typeof (ev as any)?.token === 'string') {
              hasStream = true;
              const token = (ev as any).token as string;
              try { console.debug('[LLM token]', token); } catch {}
              streamBuffer += token;
              // 直接累积到 assistant 消息，让 React 自然批量更新
              setMessages(prev => {
                const arr = [...prev];
                if (!arr.length || arr[arr.length-1].role !== 'assistant') {
                  const msg: any = { role:'assistant', content: token, ts: Date.now(), streaming: true };
                  if (pendingCitationsRef.current?.length) { msg.citations = pendingCitationsRef.current; pendingCitationsRef.current = []; }
                  arr.push(msg as any);
                } else {
                  const last = { ...arr[arr.length-1] } as any;
                  // 保留已有的citations
                  const existingCitations = last.citations;
                  if (!Array.isArray(existingCitations) || !existingCitations.length) {
                    if (pendingCitationsRef.current?.length) { last.citations = pendingCitationsRef.current; pendingCitationsRef.current = []; }
                  } else {
                    // 确保保留已有的citations
                    last.citations = existingCitations;
                  }
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
              reasoningActive = false;
              const citations = Array.isArray(payload.citations) ? payload.citations : undefined;
              // 完成：更新步骤为“回答完毕”
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答完毕', status: 'done', ts: Date.now() } as any);
                return arr;
              });
              // 本轮结束，清空思考卡片索引
              activeReasoningIndexRef.current = null;
              if (stream && !hasStream) {
                simulateTyping(full);
              } else {
                setMessages(prev => {
                  if (hasStream && prev.length && prev[prev.length-1].role === 'assistant') {
                    // 🔥 修复：已经通过流式累积了内容，不要用payload.result覆盖
                    // payload.result可能被截断（如2000字符限制）
                    const arr = [...prev];
                    const last = { ...arr[arr.length-1] } as any;
                    // 保持流式累积的完整内容，不要覆盖
                    // last.content = full;  ❌ 不要覆盖！
                    delete last.streaming;
                    last.ts = Date.now();
                    if (citations) (last as any).citations = citations;
                    arr[arr.length-1] = last;
                    console.log('[DEBUG] 保持流式累积的内容，不覆盖。长度:', last.content?.length);
                    return arr;
                  }
                  return [...prev, { role:'assistant', content: full, ts: Date.now(), citations } as any];
                });
              }
              return;
            }
            // 兼容：ev.content/ev.text 作为一次性结果
            if (typeof (ev as any)?.content === 'string' || typeof (ev as any)?.text === 'string') {
              const full = ((ev as any).content || (ev as any).text || '').trim();
              if (!full) return;
              reasoningActive = false;
              const citations = Array.isArray((ev as any).citations) ? (ev as any).citations : undefined;
              // 完成：更新步骤为“回答完毕”
              setMessages(prev => {
                const arr = [...prev];
                let updated = false;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if ((arr[i] as any).role === 'step') { arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any; updated = true; break; }
                }
                if (!updated) arr.push({ role:'step', content: '回答完毕', status: 'done', ts: Date.now() } as any);
                return arr;
              });
              activeReasoningIndexRef.current = null;

              // 🔥 修复：检查是否已经存在assistant消息，如果存在就不要覆盖
              // 因为流式响应可能已经累积了完整内容
              setMessages(prev => {
                const hasAssistant = prev.some(m => m.role === 'assistant');
                if (hasAssistant) {
                  // 已经存在assistant消息，不要覆盖
                  console.log('[DEBUG] 已存在assistant消息，跳过ev.content事件');
                  return prev;
                }
                // 不存在assistant消息，创建新的
                if (stream && !hasStream) {
                  simulateTyping(full);
                  return prev;
                } else {
                  return [...prev, { role:'assistant', content: full, ts: Date.now(), citations } as any];
                }
              });
              return;
            }
      }

          // 错误事件
          if (ev?.type === 'workflow_error' || ev?.type === 'step_error' || ev?.type === 'error') {
            console.log('[DEBUG] 收到错误事件，设置 testing=false');
            const msg = ev?.detail || ev?.error || '执行出错';
            setMessages(prev => [...prev, { role:'assistant', content: `执行失败：${msg}`, ts: Date.now() }]);
            // 流式传输出错，设置 testing=false
            setTesting(false);
            runRef.current = null;
            return;
          }
          if (ev?.type === 'workflow_end') {
            console.log('[DEBUG] 收到 workflow_end 事件，设置 testing=false');
            clearTyping();
            // 🔥 清理streaming状态 + 最后检查pending citations
            setMessages(prev => {
              const arr = [...prev];
              if (arr.length && arr[arr.length-1].role === 'assistant') {
                const last = { ...arr[arr.length-1] } as any;
                delete last.streaming;
                // 🔥 workflow结束时，如果pendingCitationsRef还有数据，强制附加上去
                if (pendingCitationsRef.current?.length && (!last.citations || !last.citations.length)) {
                  last.citations = pendingCitationsRef.current;
                  console.log('[CITATIONS DEBUG] workflow_end时强制附加citations:', pendingCitationsRef.current.length, '条');
                  pendingCitationsRef.current = [];
                }
                arr[arr.length-1] = last;
              }
              return arr;
            });
            activeReasoningIndexRef.current = null;
            // 若仍有步骤气泡不是"done"，在此补齐
            setMessages(prev => {
              const arr = [...prev];
              for (let i = arr.length - 1; i >= 0; i--) {
                if ((arr[i] as any).role === 'step' && (arr[i] as any).status !== 'done') {
                  arr[i] = { ...(arr[i] as any), content: '回答完毕', status: 'done', ts: Date.now() } as any;
                  break;
                }
              }
              return arr;
            });
            // 如果前面没有产生execute结果，则给个简短提示
            setMessages(prev => {
              const hasAssistant = prev.some(m => m.role==='assistant');
              if (!hasAssistant) {
                return [...prev, { role:'assistant', content: '已完成测试运行', ts: Date.now() }];
              }
              return prev;
            });
            // 流式传输完成，设置 testing=false
            setTesting(false);
            runRef.current = null;
            return;
          }
        } catch {}
      });
      } // 关闭 else 块

      runRef.current = handle;
    } catch (e: any) {
      console.error('[DEBUG] 捕获到错误:', e);
      message.error(e?.message || '测试运行失败');
      // 发生错误时也要重置状态
      setTesting(false);
      runRef.current = null;
    } finally {
      console.log('[DEBUG] 进入 finally 块');
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

  // 将正文中的 [n] 替换为可点击的引用标签
  // 清理重复的“纯数字”引用标记，保留 [n] 样式
  const cleanNumericMarkers = (raw: string, citations: any[]): string => {
    let t = String(raw || '');
    // 去除括号数字 (1) / （1）
    t = t.replace(/\(\d+\)/g, '');
    t = t.replace(/（\d+）/g, '');
    // 去除上标数字 ¹²³⁴⁵⁶⁷⁸⁹⁰
    t = t.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079]+/g, '');
    // 去除圈号数字 ①②…⑳
    t = t.replace(/[\u2460-\u2473\u3251-\u325F\u32B1-\u32BF]/g, '');
    // 去除位于文本末尾、仅由空格和 [n] 串联的尾巴（如 “ [1] [2] [3]”）
    t = t.replace(/(\s*(\[\d+\]))+\s*$/g, '');
    // 将全角【n】标准化为 [n]
    t = t.replace(/【(\d+)】/g, '[$1]');
    // 处理重复形态：[n] 后紧跟相同数字，如 "[3]3" 或 "[3] 3"
    t = t.replace(/\[(\d+)\]\s*\1/g, '[$1]');
    // 删除超出 citations 范围的 [n]
    const maxN = Array.isArray(citations) ? citations.length : 0;
    if (maxN >= 0) {
      t = t.replace(/\[(\d+)\]/g, (m, d) => {
        const n = parseInt(String(d), 10);
        return (n >= 1 && n <= maxN) ? m : '';
      });
    }
    return t;
  };

  const renderContentWithInlineCitations = (text: string, citations: any[]) => {
    const cleaned = cleanNumericMarkers(text, citations);
    const parts = cleaned.split(/(\[(\d+)\])/g); // 保留分隔符与数字
    return (
      <>
        {parts.map((seg, idx) => {
          const m = seg.match(/^\[(\d+)\]$/);
          if (m) {
            const n = parseInt(m[1], 10);
            const cit = citations.find((c:any)=> Number(c.index) === n);
            if (!cit) return <></>;
            return (
              <sup
                key={`seg-${idx}`}
                style={{ cursor:'pointer', color:'#2563eb' }}
                title={`${cit.title || ''}${(!cit.unscored && typeof cit.combined_score==='number') ? ` (综合 ${Math.round(Math.max(0,Math.min(1,cit.combined_score))*100)}%)` : ''}`}
                onClick={()=>{ try { const head = cit.unscored ? '评分：不适用（全量召回）' : `评分：综合 ${(cit.combined_score??cit.score??0).toFixed?.(3) ?? '0.000'}，关键词 ${(cit.keyword_score??0).toFixed?.(3) ?? '0.000'}，向量 ${(cit.general_score??0).toFixed?.(3) ?? '0.000'}，领域 ${(cit.domain_score??0).toFixed?.(3) ?? '0.000'}`; alert(`【${cit.index}】${cit.title}\n${head}\n\n${cit.content}`);} catch {} }}
              >
                [{n}]
              </sup>
            );
          }
          return <span key={`seg-${idx}`}>{seg}</span>;
        })}
      </>
    );
  };

  const providerOptions = Object.keys(embeddingMap || {});
  const selectedTemplate = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);

  // 根据模板类型获取返回路径
  const getBackPath = () => {
    const templateType = selectedTemplate?.template_type;
    const agentType = (selectedTemplate as any)?.agent_type;

    // 如果没有模板信息，尝试从URL参数判断
    const urlKind = sp.get('kind')?.toLowerCase();
    const fromParam = sp.get('from')?.toLowerCase();

    console.log('[AgentStudioPage] getBackPath debug:', {
      templateId,
      templateType,
      agentType,
      urlKind,
      fromParam,
      selectedTemplate
    });

    // 优先使用from参数
    if (fromParam === 'single' || fromParam === 'single-agents') {
      return '/app/agent/single-agents';
    } else if (fromParam === 'team' || fromParam === 'team-agents') {
      return '/app/agent/team-agents';
    }

    // 然后使用模板类型
    if (templateType === 'single' || agentType === 'single') {
      return '/app/agent/single-agents';
    } else if (templateType === 'team' || agentType === 'team') {
      return '/app/agent/team-agents';
    }

    return '/app/agent/navigation';
  };

  // 处理返回按钮点击 - 显示确认弹窗
  const handleBackClick = () => {
    setShowBackConfirm(true);
  };

  // 确认返回 - 关闭弹窗并导航
  const confirmBack = () => {
    setShowBackConfirm(false);
    navigate(getBackPath());
  };

  // 当选中的模板包含 documents 路径且开启 rerank 时，同步到模型设置（以"使用网关默认重排模型"为语义，具体模型在 9050 配置）
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
      <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
        {m.provider ? <Tag style={{ marginLeft: 8, flex: 'none' }} color="cyan">{m.provider}</Tag> : null}
        {m.isDefault ? <Tag style={{ marginLeft: 6, flex: 'none' }} color="gold">默认</Tag> : null}
        {m.supportsTools ? (
          <Tag
            color="purple"
            style={{
              marginLeft: 6,
              borderRadius: '50%',
              minWidth: 18,
              height: 18,
              padding: 0,
              textAlign: 'center',
              lineHeight: '18px',
              fontWeight: 600,
              flex: 'none',
            }}
          >
            f
          </Tag>
        ) : null}
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
                onClick={handleBackClick}
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

          {/* 配置状态条（始终显示） */}
          {agentConfigPreview && (
            <AgentConfigCard agent={agentConfigPreview} />
          )}

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
            <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
              <Spin spinning={loading} style={{ height: '100%' }}>
                {messages.map((m, i) => {
                  const isUser = m.role === 'user';
                  const isStep = m.role === 'step';
                  // 兜底：若某些帧以 assistant 角色写入但处于 thinking 状态，也按"思考卡片"渲染
                  // 仅当显式的 reasoning 消息时渲染黄色思考卡片
                  const isReason = (m as any).role === 'reasoning';

                  // 判断是否是当前对话回合的第一个bot消息（需要显示头像）
                  // 规则：向前查找，如果前一个是user或者前一个不是bot消息（step/reasoning/assistant），则显示头像
                  const isBotMessage = isStep || isReason || (!isUser && m.role === 'assistant');
                  const showAvatar = isBotMessage && (i === 0 || messages[i-1].role === 'user');

                  // 思考气泡渲染
                  if (isReason) {
                    return (
                      <ReasoningBubble
                        key={i}
                        content={String((m as any).content || '')}
                        status={(m as any).status === 'thinking' ? 'thinking' : 'complete'}
                        timestamp={m.ts}
                        outputMode={outputMode}
                        showAvatar={showAvatar}
                        onExpand={() => {
                          setActiveReasoning(String((m as any).content || ''));
                          setShowReasoningModal(true);
                        }}
                      />
                    );
                  }

                  // 用户消息气泡渲染
                  if (isUser) {
                    return (
                      <UserBubble
                        key={i}
                        content={m.content}
                        timestamp={m.ts}
                        onCopy={() => navigator.clipboard.writeText(m.content)}
                      />
                    );
                  }

                  // 步骤状态消息渲染
                  if (isStep) {
                    return (
                      <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        {showAvatar ? (
                          <div style={{ flexShrink: 0 }}>
                            <Avatar size={32} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', fontWeight: 600, color: '#ffffff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>助</Avatar>
                          </div>
                        ) : (
                          <div style={{ width: '32px', flexShrink: 0 }}></div>
                        )}
                        <div style={{ flex: 1, maxWidth: '75%' }}>
                          <StatusIndicator
                            content={m.content}
                            status={m.status as any}
                            timestamp={m.ts}
                          />
                        </div>
                      </div>
                    );
                  }

                  // 助手回答气泡渲染
                  return (
                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                      {showAvatar ? (
                        <div className="answer-bubble-avatar" style={{ flexShrink: 0 }}>
                          <Avatar size={32} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', fontWeight: 600, color: '#ffffff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>助</Avatar>
                        </div>
                      ) : (
                        <div style={{ width: '32px', flexShrink: 0 }}></div>
                      )}
                      <div style={{ flex: 1, maxWidth: '75%' }}>
                        {/* 🔥 Action面板：独立显示工具调用 */}
                        {m.content && /Action:\s*\w+\s*Action Input:/.test(m.content) && (
                          <ActionPanel content={m.content} />
                        )}

                        {/* 🔥 答案气泡 - 始终显示，内部处理内容提取 */}
                        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0' }}>
                          <div style={{ minHeight: '20px' }}>
                            {(m as any).streaming && !m.content && (
                              <span style={{ display: 'inline-flex', gap: '4px', padding: '8px 0' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e0', animation: 'bounce 1.4s infinite' }}></span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e0', animation: 'bounce 1.4s infinite 0.2s' }}></span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e0', animation: 'bounce 1.4s infinite 0.4s' }}></span>
                              </span>
                            )}
                            {m.content && (() => {
                              // 提取显示内容
                              const hasAction = /Action:\s*\w+\s*Action Input:/.test(m.content);
                              let displayContent = m.content;

                              // 如果有Action，尝试提取Final Answer
                              if (hasAction) {
                                const finalAnswerIndex = m.content.indexOf('Final Answer:');

                                if (finalAnswerIndex !== -1) {
                                  displayContent = m.content.substring(finalAnswerIndex + 'Final Answer:'.length).trim();
                                } else {
                                  // 有Action但没有Final Answer，显示等待状态
                                  const hasObservation = /Observation:/.test(m.content);
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: '#64748b' }}>
                                      <span style={{ display: 'inline-flex', gap: '4px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite' }}></span>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.2s' }}></span>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.4s' }}></span>
                                      </span>
                                      <span style={{ fontSize: '14px' }}>
                                        {hasObservation ? '正在整理答案...' : '工具执行中，请稍候...'}
                                      </span>
                                    </div>
                                  );
                                }
                              }

                              // 渲染内容
                              return (
                                <>
                                  {(() => {
                                      // 处理带引用的内容
                                      const citations = (m as any).citations;
                                      console.log('[INLINE CITATIONS DEBUG] 消息', i, 'streaming:', !!(m as any).streaming, 'citations:', citations?.length || 0);
                                      if (!Array.isArray(citations) || citations.length === 0) {
                                        return (
                                          <StreamContentRenderer
                                            content={displayContent}
                                            mode={outputMode}
                                            className="stream-content-renderer"
                                          />
                                        );
                                      }

                                  // 创建一个包装组件来使用hooks
                                  const ContentWithCitations = () => {
                                    const contentRef = React.useRef<HTMLDivElement>(null);

                                    // 在渲染后处理引用标签
                                    React.useEffect(() => {
                                      if (!contentRef.current) return;

                                      // 查找所有文本节点中的[N]模式
                                      const walker = document.createTreeWalker(
                                        contentRef.current,
                                        NodeFilter.SHOW_TEXT,
                                        null
                                      );

                                      const nodesToReplace: { node: Text; replacements: Array<{ start: number; end: number; index: number }> }[] = [];

                                      let node: Text | null;
                                      while ((node = walker.nextNode() as Text | null)) {
                                        const text = node.textContent || '';
                                        const regex = /\[(\d+)\]/g;
                                        let match;
                                        const replacements: Array<{ start: number; end: number; index: number }> = [];

                                        while ((match = regex.exec(text)) !== null) {
                                          const index = parseInt(match[1], 10);
                                          if (index >= 1 && index <= citations.length) {
                                            replacements.push({
                                              start: match.index,
                                              end: match.index + match[0].length,
                                              index: index
                                            });
                                          }
                                        }

                                        if (replacements.length > 0) {
                                          nodesToReplace.push({ node, replacements });
                                        }
                                      }

                                      // 替换文本节点为sup标签
                                      nodesToReplace.forEach(({ node, replacements }) => {
                                        const text = node.textContent || '';
                                        const parent = node.parentNode;
                                        if (!parent) return;

                                        const fragment = document.createDocumentFragment();
                                        let lastEnd = 0;

                                        replacements.forEach(({ start, end, index }) => {
                                          // 添加前面的文本
                                          if (start > lastEnd) {
                                            fragment.appendChild(document.createTextNode(text.substring(lastEnd, start)));
                                          }

                                          // 创建span标签(不使用sup,保持在原位)
                                          const span = document.createElement('span');
                                          span.className = 'citation-tag';
                                          span.setAttribute('data-index', String(index));
                                          span.style.cursor = 'pointer';
                                          span.style.color = '#3b82f6';
                                          span.textContent = `[${index}]`;
                                          fragment.appendChild(span);

                                          lastEnd = end;
                                        });

                                        // 添加剩余文本
                                        if (lastEnd < text.length) {
                                          fragment.appendChild(document.createTextNode(text.substring(lastEnd)));
                                        }

                                        parent.replaceChild(fragment, node);
                                      });
                                    }, [displayContent, citations]);

                                    return (
                                      <div
                                        ref={contentRef}
                                        className="content-with-citations"
                                        onClick={(e) => {
                                          const target = e.target as HTMLElement;
                                          if (target.classList.contains('citation-tag') || target.closest('.citation-tag')) {
                                            const citTag = target.classList.contains('citation-tag') ? target : target.closest('.citation-tag');
                                            if (citTag) {
                                              const citIndex = parseInt(citTag.getAttribute('data-index') || '0', 10);
                                              const cit = citations.find((c: any) => c.index === citIndex) || citations[citIndex - 1];
                                              if (cit) {
                                                setActiveCitation(cit);
                                                setShowCitationModal(true);
                                              }
                                              e.stopPropagation();
                                              e.preventDefault();
                                            }
                                          }
                                        }}
                                      >
                                        <StreamContentRenderer
                                          content={displayContent}
                                          mode={outputMode}
                                          className="stream-content-renderer"
                                        />
                                      </div>
                                    );
                                  };

                                  return (
                                    <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#2d3748' }}>
                                      <ContentWithCitations />
                                    </div>
                                  );
                                })()}
                              </>
                              );
                            })()}
                          </div>
                          {/* 参考来源 - 简洁的Tag样式显示在气泡内部 */}
                          {(() => {
                            const citations = (m as any).citations;
                            const hasCitations = Array.isArray(citations) && citations.length > 0;
                            console.log('[CITATIONS DEBUG] 渲染消息', i, '，citations:', hasCitations ? citations.length : 0, '条');
                            return hasCitations ? (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>参考来源 ({citations.length}):</span>
                                  {citations.map((cit: any, idx: number) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        setActiveCitation(cit);
                                        setShowCitationModal(true);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '2px 8px',
                                        background: '#e0e7ff',
                                        color: '#3b82f6',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#3b82f6';
                                        e.currentTarget.style.color = '#ffffff';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#e0e7ff';
                                        e.currentTarget.style.color = '#3b82f6';
                                      }}
                                    >
                                      [{cit.index}] {(cit.title || '未知来源').slice(0, 20)}{(cit.title?.length || 0) > 20 ? '...' : ''}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '11px', color: '#a0aec0' }}>
                              {m.ts ? new Date(m.ts).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText(m.content)} style={{ color: '#718096', padding: '4px 8px', height: '28px' }} />
                              <Button type="text" size="small" icon={<LikeOutlined />} onClick={() => postReaction(i, 'like')} style={{ color: '#718096', padding: '4px 8px', height: '28px' }} />
                              <Button type="text" size="small" icon={<DislikeOutlined />} onClick={() => postReaction(i, 'dislike')} style={{ color: '#718096', padding: '4px 8px', height: '28px' }} />
                              <Button type="text" size="small" icon={<RedoOutlined />} onClick={() => rerunFrom(i)} style={{ color: '#718096', padding: '4px 8px', height: '28px' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Spin>
            </div>
            <div className="chat-input-area">
              <div className="studio-inputbar">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={e=>setInputText(e.target.value)}
                  placeholder="输入消息..."
                  onPressEnter={testing ? undefined : handleRun}
                  disabled={testing}
                  style={{ border: 'none', boxShadow: 'none' }}
                />
                {testing ? (
                  <Button type="default" danger icon={<StopOutlined />} onClick={handleAbort}>
                    中止
                  </Button>
                ) : (
                  <Button type="primary" icon={<SendOutlined />} onClick={handleRun}>
                    发送
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Content>

      {/* 思考 Modal 预览（完整思考内容） */}
      <Modal open={showReasoningModal} onCancel={()=>setShowReasoningModal(false)} onOk={()=>setShowReasoningModal(false)} okText="关闭" cancelButtonProps={{ style:{ display:'none' } }} title={'思考过程（完整）'} width={800}>
        <div style={{ lineHeight:1.65 }}>
          <StreamContentRenderer
            content={activeReasoning}
            mode={outputMode}
            className="stream-content-renderer"
          />
        </div>
      </Modal>

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
          onCancel={handleBackClick}
          onSave={handleSave}
          onExport={async ()=>{
            try {
              if (!templateId) { message.warning('请从模板入口进入'); return; }
              if (!agentName.trim()) { message.warning('请填写助手名称'); return; }
              // 依据检索策略开关推导检索模式（仅用于兼容工具内模式切换）
              const derivedMode: 'all'|'qa_only'|'papers_only' = (includeDocuments && !includeQADatasets) ? 'papers_only'
                : ((!includeDocuments && includeQADatasets) ? 'qa_only' : 'all');

              const req: any = {
                template_id: templateId,
                agent_name: agentName,
                description: agentDesc || undefined,
                collection_id: collectionId,
                enable_knowledge_search: !!showKnowledge,
                enable_graph_search: !!showGraph,
                retrieval_mode: derivedMode,
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
                  summary_prefs: { intro_max_chars: summaryIntroMax, point_max_chars: summaryPointMax, points_min: summaryPointsMin, points_max: summaryPointsMax, sources_max: summarySourcesMax },
                  // 持久化检索策略开关
                  retrieval_flags: {
                    use_qa_routing: !!useQARouting,
                    include_documents: includeDocuments !== false,
                    include_qa_datasets: includeQADatasets !== false,
                    enable_reranking: useReranking !== false,
                  },
                  chat_config: { multi_turn: !!multiTurn, max_rounds: Number(maxRounds) || 0 },
                  ...(useMetadata ? { metadata_filters: metadataFilters || [] } : {}),
                  ...(showGraph ? { graph_config: {
                    trigger: graphMode,
                    query_mode: graphQueryMode,
                    fixed_query: graphFixedQuery || undefined,
                    top_k: graphTopK,
                    chunk_top_k: graphChunkTopK,
                  }} : {}),
                  // Hook配置
                  hooks: {
                    pre_hooks: selectedPreHooks || [],
                    post_hooks: selectedPostHooks || []
                  }
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
              message.success('已导出到"我的智能体"');
              navigate(`${getBackPath()}?created=${encodeURIComponent(res.id)}`);
            } catch(e:any) { message.error(e?.message||'导出失败'); }
          }}
          showKnowledge={showKnowledge}
          showGraph={showGraph}
          basic={{
            useMetadata, setUseMetadata, hideMetadata: true,
            systemPrompt, setSystemPrompt,
            multiTurn, setMultiTurn,
            maxRounds, setMaxRounds,
            reasoning, setReasoning,
            agentName, setAgentName,
            agentDesc, setAgentDesc,
            greeting, setGreeting,
            emptyReply, setEmptyReply,
            outputMode, setOutputMode,
          }}
          knowledge={{
            collections,
            collectionId, setCollectionId,
            crossCollections, setCrossCollections,
            useQARouting, setUseQARouting,
            includeDocuments, setIncludeDocuments,
            includeQADatasets, setIncludeQADatasets,
            useReranking, setUseReranking,
            simThreshold, setSimThreshold,
            simWeight, setSimWeight,
            topN, setTopN,
          }}
          graph={{
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
            stream, setStream,
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
            // Hook配置
            selectedPreHooks, setSelectedPreHooks,
            selectedPostHooks, setSelectedPostHooks,
          }}
          advanced={{
            kbId: collectionId,
            useMetadata: !!useMetadata, setUseMetadata,
            metadataFilters, setMetadataFilters,
            hiragEnabled, setHiragEnabled,
            enableAgenticFilters, setEnableAgenticFilters,
            summaryIntroMax, setSummaryIntroMax,
            summaryPointMax, setSummaryPointMax,
            summaryPointsMin, setSummaryPointsMin,
            summaryPointsMax, setSummaryPointsMax,
            summarySourcesMax, setSummarySourcesMax,
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

      {/* 引用详情弹窗 */}
      <Modal
        open={showCitationModal}
        onCancel={() => setShowCitationModal(false)}
        footer={null}
        width={800}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              [{activeCitation?.index || 0}]
            </span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
              {activeCitation?.title || '引用来源'}
            </span>
          </div>
        }
      >
        {activeCitation && (
          <div style={{ padding: '8px 0' }}>
            {/* 评分信息 */}
            {!activeCitation.unscored && (
              <div style={{
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                  相关性评分
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>综合评分：</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                      {((activeCitation.combined_score ?? activeCitation.score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>关键词匹配：</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                      {((activeCitation.keyword_score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>向量相似度：</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#8b5cf6' }}>
                      {((activeCitation.general_score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>领域相关性：</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>
                      {((activeCitation.domain_score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeCitation.unscored && (
              <div style={{
                background: '#fef3c7',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
                  全量召回（未评分）
                </div>
              </div>
            )}

            {/* 引用内容 */}
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                原文内容
              </div>
              <div style={{
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {activeCitation.content}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 返回确认弹窗 */}
      <Modal
        open={showBackConfirm}
        onCancel={() => setShowBackConfirm(false)}
        onOk={confirmBack}
        title="确认返回"
        okText="确认返回"
        cancelText="继续配置"
        okButtonProps={{ danger: true }}
      >
        <p>确定要返回吗？当前的配置将不会被保存。</p>
      </Modal>
    </Layout>
  );
};

export default AgentStudioPage;
