import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Input, Space, Button, Tabs, Spin, message, Modal, Tag, List, Switch, Select, InputNumber } from 'antd';
import { PlusOutlined, ReloadOutlined, MessageOutlined, LinkOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAgentService } from '../../services/userAgentService';
import type { AgentTemplate, UserAgent } from '../../services/userAgentService';
import { AgentGradientCard, Grid } from '../../components/ui/agent-gradient-card';

const { Title, Text } = Typography;

const AgentNavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [published, setPublished] = useState<Array<{agent_id:string, agent_name:string, description?:string, icon?:string, color?:string, version:number, published_at:string, service_name?:string, publish_mode?:string, enabled?:boolean, deleted?:boolean}>>([]);
  const [query, setQuery] = useState('');
  // 模板详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTpl, setDetailTpl] = useState<AgentTemplate | null>(null);
  const [detailMembers, setDetailMembers] = useState<Array<{id:string; name:string; role?:string; required?:boolean; canToggle?:boolean;}>>([]);
  // 发布弹窗状态
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<UserAgent | null>(null);
  const [publishServiceName, setPublishServiceName] = useState('');
  const [publishMode, setPublishMode] = useState<'api'|'embed'>('api');
  const [publishing, setPublishing] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tpls, myAgents, pub] = await Promise.all([
        userAgentService.getAgentTemplates().catch(()=>[]),
        userAgentService.getMyAgents().catch(()=>[]),
        userAgentService.getPublishedAgents().catch(()=>[]),
      ]);
      setTemplates(tpls || []);
      setAgents(myAgents || []);
      setPublished(pub || []);
    } catch (e: any) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // 文本规范化（支持多语言/对象）
  const normText = (v: any, fallback?: string): string => {
    if (v == null) return fallback || '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
      const first = v.find(x => typeof x === 'string') || v[0];
      const s = normText(first);
      if (s) return s;
      try { return JSON.stringify(v); } catch { return fallback || ''; }
    }
    if (typeof v === 'object') {
      const first = (v as any).zh || (v as any).cn || (v as any)['zh-CN'] || (v as any).en;
      if (first) return normText(first, fallback);
      const nameLike = (v as any).name || (v as any).display_name || (v as any).displayName || (v as any).label || (v as any).title || (v as any).text || (v as any).value || (v as any).default;
      if (nameLike) return normText(nameLike, fallback);
      try { return JSON.stringify(v); } catch { /* ignore */ }
    }
    return fallback || '';
  };

  const openTemplateDetail = async (tpl: AgentTemplate) => {
    setDetailOpen(true);
    setDetailTpl(tpl);
    setDetailLoading(true);
    setDetailMembers([]);
    try {
      const _full = await userAgentService.getAgentTemplateDetail(tpl.id);
      const full: any = (_full as any)?.data || _full;
      if ((import.meta as any).env?.DEV) {
        try {
          // eslint-disable-next-line no-console
          console.debug('[AgentNavigation] template-detail', full);
        } catch {}
      }
      const bc: any = (full as any).base_config || {};
      const teamCfg: any = bc.team || {};
      let mems: any[] | undefined = Array.isArray(teamCfg.members) ? teamCfg.members : undefined;
      if (!mems && Array.isArray((full as any).team_members)) {
        const arr = (full as any).team_members as any[];
        if (arr.length && typeof arr[0] === 'string') {
          mems = arr.map((id:string)=>({ id }));
        } else {
          mems = arr; // 对象形式，包含 agent_id/role/order
        }
      }
      const KNOWN_NAMES: Record<string, {name:string; role?:string; canToggle?:boolean; required?:boolean}> = {
        question_decomposition_agent: { name:'问题分解', role:'任务拆解', canToggle:true },
        intelligent_routing_agent:   { name:'智能路由', role:'路径规划', canToggle:false, required:true },
        knowledge_retrieval_agent:   { name:'知识检索', role:'召回证据', canToggle:true },
        summary_answer_agent:        { name:'答案总结', role:'总结生成', canToggle:false, required:true },
        translation_agent:           { name:'翻译处理', role:'语言工具', canToggle:true },
        knowledge_graph_agent:       { name:'知识图谱', role:'图谱检索', canToggle:true },
        dag_reconstruction_agent:    { name:'DAG重构', role:'DAG重构', canToggle:true },
      };
      // 使用组件级 normText
      if (Array.isArray(mems)) {
        let parsed = mems.map((m:any, i:number) => {
          const id = String(m.id || m.agent_id || m.agent_name || m.name || `member_${i}`);
          const known = KNOWN_NAMES[id] || { name: id };
          const required = !!m.required || m.canToggle === false || !!known.required;
          return {
            id,
            name: normText(m.name ?? m.display_name, known.name),
            role: normText(m.role, known.role),
            required,
            canToggle: required ? false : (m.canToggle ?? known.canToggle ?? true),
          };
        });
        // 按模板上下文应用必启规则
        const tcode = String((full as any)?.template_code || '').toLowerCase();
        const tname = normText((full as any)?.template_name).toLowerCase();
        const isRouting = tcode.includes('routing') || tname.includes('路由');
        const isGeneralQA = tcode.includes('general_qa') || tname.includes('通用问答') || tcode.includes('qa_team');
        if (isRouting) parsed = parsed.map(m => m.id === 'knowledge_retrieval_agent' ? { ...m, required: true, canToggle: false } : m);
        if (isGeneralQA) parsed = parsed.map(m => m.id === 'question_decomposition_agent' ? { ...m, required: true, canToggle: false } : m);
        setDetailMembers(parsed);
        if ((import.meta as any).env?.DEV) {
          try {
            // eslint-disable-next-line no-console
            console.debug('[AgentNavigation] members-raw', mems);
            // eslint-disable-next-line no-console
            console.debug('[AgentNavigation] members-parsed', parsed);
          } catch {}
        }
      }
    } catch (e:any) {
      message.error(e?.message || '加载模板详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTemplates = (templates || []).filter(t => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (t.template_name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
  });
  const filteredAgents = (agents || []).filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (a.agent_name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q);
  });
  
  // 单智能体：只展示三个基础模板（问答/知识库/图谱）。
  const singleTemplatesAll = filteredTemplates.filter(t => (t.template_type === 'single'));
  // 明确挑选三大基础单体模板（若存在则固定显示）
  const preferredCodes = ['qa_expert', 'knowledge_retrieval_agent', 'knowledge_graph_agent'];
  const picksByCode: AgentTemplate[] = preferredCodes
    .map(code => singleTemplatesAll.find(t => (t.template_code || '').toLowerCase() === code))
    .filter(Boolean) as AgentTemplate[];
  let singleTemplates: AgentTemplate[];
  if (picksByCode.length === 3) {
    singleTemplates = picksByCode;
  } else {
    // 回退：用启发式挑选
    const baseNameKeywords = ['问答智能体','知识库检索智能体','知识图谱检索智能体','通用问答智能体','知识库问答智能体'];
    const baseCodeKeywords = ['qa','knowledge','graph'];
    const pickScore = (t: AgentTemplate) => {
      const name = (t.template_name || '').toLowerCase();
      const code = (t.template_code || '').toLowerCase();
      let score = 0;
      if (baseCodeKeywords.some(k => code.includes(k))) score += 2;
      if (baseNameKeywords.some(k => (t.template_name || '').includes(k))) score += 3;
      if ((t.category || '').includes('基础')) score += 1;
      return score;
    };
    singleTemplates = [...singleTemplatesAll]
      .sort((a,b) => pickScore(b) - pickScore(a))
      .slice(0, 3);
  }

  // 多智能体：两个测试模板（优先匹配“测试/演示/示例”）
  const multiAll = filteredTemplates.filter(t => (t.template_type === 'team'));
  const testKeywords = ['测试','演示','示例','demo','test'];
  const multiSorted = [...multiAll].sort((a,b)=>{
    const an = (a.template_name||'') + (a.category||'');
    const bn = (b.template_name||'') + (b.category||'');
    const as = testKeywords.some(k => an.toLowerCase().includes(k)) ? 1 : 0;
    const bs = testKeywords.some(k => bn.toLowerCase().includes(k)) ? 1 : 0;
    return bs - as;
  });
  const multiTemplates = multiSorted.slice(0, 2);

  const getTemplateKind = (t: AgentTemplate): 'qa'|'knowledge'|'graph'|'team' => {
    const code = (t.template_code || '').toLowerCase();
    const name = (t.template_name || '').toLowerCase();
    if ((t.template_type as any) === 'team') return 'team';
    if (code.includes('knowledge') || name.includes('知识库') || name.includes('文档问答')) return 'knowledge';
    if (code.includes('graph') || name.includes('图谱')) return 'graph';
    return 'qa';
  };

  const singleCount = singleTemplates.length;
  const multiCount = multiTemplates.length;
  const myCount = filteredAgents.length;
  const pubCount = published.length;
  // API 说明弹窗
  const [apiOpen, setApiOpen] = useState(false);
  const [apiAgent, setApiAgent] = useState<{agent_id:string, agent_name:string, version:number, published_at:string} | null>(null);
  // 运行时设置
  const [rtOpen, setRtOpen] = useState(false);
  const [rtAgentId, setRtAgentId] = useState<string | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [rtModels, setRtModels] = useState<Array<{value:string,label:string}>>([]);
  const [rtModel, setRtModel] = useState<string>('');
  const [rtMulti, setRtMulti] = useState<boolean>(false);
  const [rtMaxRounds, setRtMaxRounds] = useState<number>(6);
  const [rtContextWin, setRtContextWin] = useState<number>(8);

  return (
    <>
    <div style={{ padding: 20 }}>
      <style>{`
        /* 导航页卡片统一 hover 层次 */
        .agent-card:hover { border-color: #c7daf4 !important; box-shadow: 0 6px 24px rgba(30,64,175,0.08) !important; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>智能体导航</Title>
        <Space>
          <Input.Search allowClear placeholder="搜索模板或我的智能体" value={query} onChange={e=>setQuery(e.target.value)} style={{ width: 280 }} />
          <Button icon={<ReloadOutlined />} onClick={loadAll}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={()=> navigate('/app/agent/studio')}>新建（工作室）</Button>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'single',
            label: `单智能体 (${singleCount})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {singleTemplates.map(t => (
                    <Col key={t.id} xs={24} sm={12} md={8} lg={6}>
                      <AgentGradientCard
                        type="template"
                        agent={t as any}
                        onCreateFromTemplate={(tpl)=> {
                          // 单体模板进入单体工作室
                          const kind = getTemplateKind(tpl);
                          navigate(`/app/agent/studio?templateId=${encodeURIComponent(tpl.id)}&kind=${kind}`);
                        }}
                        onShowDetails={(tpl)=> openTemplateDetail(tpl as AgentTemplate)}
                      />
                    </Col>
                  ))}
                  {(!loading && singleTemplates.length === 0) && (
                    <Col span={24}><Text type="secondary">暂无单智能体模板</Text></Col>
                  )}
                </Row>
              </Spin>
            )
          },
          {
            key: 'multi',
            label: `多智能体 (${multiCount})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {multiTemplates.map(t => (
                    <Col key={t.id} xs={24} sm={12} md={8} lg={6}>
                      <AgentGradientCard
                        type="template"
                        agent={t as any}
                        onCreateFromTemplate={(tpl)=> {
                          // 多智能体模板进入团队工作室
                          navigate(`/app/agent/team-studio?templateId=${encodeURIComponent(tpl.id)}`);
                        }}
                        onShowDetails={(tpl)=> openTemplateDetail(tpl as AgentTemplate)}
                      />
                    </Col>
                  ))}
                  {(!loading && multiTemplates.length === 0) && (
                    <Col span={24}><Text type="secondary">暂无多智能体模板</Text></Col>
                  )}
                </Row>
              </Spin>
            )
          },
          {
            key: 'my',
            label: `我的智能体 (${myCount})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {filteredAgents.map(a => (
                    <Col key={a.id} xs={24} sm={12} md={8} lg={6}>
                      <AgentGradientCard
                        type="user"
                        agent={a as any}
                        deletable={true}
                        onChatWithAgent={(ag)=> navigate(`/app/agent/studio?agentId=${encodeURIComponent(ag.id)}`)}
                        onEditAgent={(ag)=> navigate(`/app/agent/studio?agentId=${encodeURIComponent(ag.id)}&openConfig=1`)}
                        onDeleteAgent={async (ag)=>{
                          try {
                            await userAgentService.deleteUserAgent(ag.id);
                            message.success('已删除');
                            // 重新加载我的智能体
                            const myAgents = await userAgentService.getMyAgents().catch(()=>[]);
                            setAgents(myAgents || []);
                          } catch(e:any) {
                            message.error(e?.message || '删除失败');
                          }
                        }}
                        onPublishAgent={(ag)=>{
                          setPublishTarget(ag as any);
                          setPublishServiceName((ag as any)?.agent_name || '我的智能体');
                          setPublishMode('api');
                          setPublishOpen(true);
                        }}
                      />
                    </Col>
                  ))}
                  {(!loading && filteredAgents.length === 0) && (
                    <Col span={24}><Text type="secondary">暂无智能体</Text></Col>
                  )}
                </Row>
              </Spin>
            )
          },
          {
            key: 'published',
            label: `已发布 (${pubCount})`,
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                  {published.map(p => (
                    <Col key={`${p.agent_id}-v${p.version}`} xs={24} sm={12} md={8} lg={6}>
                      <div className="relative p-6 rounded-3xl overflow-hidden min-h-[240px] flex flex-col transition-shadow duration-200"
                           style={{ background: 'linear-gradient(to bottom, #ffffff, #f9fafb)', border:'1px solid #d5e4f7', boxShadow:'0 2px 12px rgba(30,64,175,0.04)' }}>
                        <Grid size={20} />
                        {/* 顶部右上角 启用开关 */}
                        <div style={{ position:'absolute', top:10, right:10, display:'flex', alignItems:'center', gap:6, padding:'4px 8px', background:'#ffffffcc', border:'1px solid #d5e4f7', borderRadius:999 }}>
                          <span style={{ fontSize:12, color:'#64748b' }}>启用</span>
                          <Switch size="small"
                            disabled={!!p.deleted}
                            checked={!(p.enabled===false) && !p.deleted}
                            onChange={async (checked)=>{
                              try {
                                await userAgentService.setPublishEnabled(p.agent_id, checked);
                                const pub = await userAgentService.getPublishedAgents().catch(()=>[]);
                                setPublished(pub||[]);
                              } catch(e:any) { message.error(e?.message||'切换失败'); }
                            }}
                          />
                        </div>
                        <div className="relative z-20 flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color:'#1f2937' }}>{p.service_name || p.agent_name}</h3>
                          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                            <Tag color={'blue'}>嵌入</Tag>
                            <Tag color={'purple'}>API</Tag>
                            <Tag>v{p.version}</Tag>
                            <Tag color={p.enabled===false || p.deleted ? 'red' : 'green'}>{p.deleted ? '已删除' : (p.enabled===false ? '已禁用' : '已启用')}</Tag>
                          </div>
                          <div style={{ color:'#6b7280', fontSize:12, marginBottom:12 }}>发布于 {new Date(p.published_at).toLocaleString()}</div>
                          <div className="mt-auto" style={{ display:'flex', gap:8 }}>
                            <Button
                              type="primary"
                              icon={<MessageOutlined />}
                              shape="round"
                              size="small"
                              onClick={()=> navigate(`/app/agent/studio?agentId=${encodeURIComponent(p.agent_id)}`)}
                              disabled={p.enabled===false || p.deleted}
                              style={{ background:'#2563eb', borderColor:'#2563eb' }}
                            >对话</Button>
                            <Button
                              icon={<LinkOutlined />}
                              shape="round"
                              size="small"
                              onClick={()=> window.open(`/embed/agent/${encodeURIComponent(p.agent_id)}`, '_blank')}
                              disabled={p.enabled===false || p.deleted}
                              style={{ background: (p.enabled===false || p.deleted) ? undefined : '#10b981', borderColor:(p.enabled===false || p.deleted) ? undefined : '#10b981', color:(p.enabled===false || p.deleted)? undefined : '#fff' }}
                            >嵌入页</Button>
                            <Button
                              icon={<ApiOutlined />}
                              shape="round"
                              size="small"
                              onClick={()=> { setApiAgent(p as any); setApiOpen(true); }}
                              style={{ background:'#a855f7', borderColor:'#a855f7', color:'#fff' }}
                            >API</Button>
                            <Button
                              shape="round"
                              size="small"
                              onClick={async ()=>{
                                setRtOpen(true); setRtAgentId(p.agent_id); setRtLoading(true);
                                try {
                                  // 加载可用模型
                                  const models = await userAgentService.getAvailableModels().catch(()=>[]);
                                  setRtModels((models||[]).map((m:any)=>({ value:m.id, label: m.name })));
                                  // 加载当前运行设置
                                  const rs = await userAgentService.getRuntimeSettings(p.agent_id);
                                  setRtModel(rs?.default_model || '');
                                  const chat = rs?.chat || {};
                                  setRtMulti(!!chat?.multi_turn);
                                  setRtMaxRounds(typeof chat?.max_rounds==='number'? chat?.max_rounds : 6);
                                  setRtContextWin(typeof chat?.context_window==='number'? chat?.context_window : 8);
                                } catch(e:any) {
                                  message.error(e?.message||'加载设置失败');
                                } finally {
                                  setRtLoading(false);
                                }
                              }}
                            style={{ background:'#f59e0b', borderColor:'#f59e0b', color:'#fff' }}>设置</Button>
                          </div>
                        </div>
                        <div className="relative z-20 mt-3 flex items-center justify-between">
                          <div style={{ color:'#64748b', fontSize:12, maxWidth:'66%' }}>{p.description || ' '}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Button danger size="small" shape="round" onClick={async ()=>{
                              try { await userAgentService.deletePublish(p.agent_id); const pub = await userAgentService.getPublishedAgents().catch(()=>[]); setPublished(pub||[]); }
                              catch(e:any){ message.error(e?.message||'删除失败'); }
                            }}>删除</Button>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                  {(!loading && published.length === 0) && (
                    <Col span={24}><Text type="secondary">暂无发布版本</Text></Col>
                  )}
                </Row>
              </Spin>
            )
          }
        ]}
      />
    </div>
    {/* API 说明弹窗 */}
    <Modal
      title="API 调用说明"
      open={apiOpen}
      onCancel={()=> setApiOpen(false)}
      footer={null}
      width={720}
    >
      {apiAgent ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>调用地址：</div>
          <pre style={{ background:'#0f172a', color:'#e2e8f0', padding:12, borderRadius:8, overflow:'auto' }}>{`
POST http://localhost:8000/api/v1/user-agents/${apiAgent.agent_id}/invoke
Content-Type: application/json
Cookie: <登录后会话>

{
  "prompt": "你好，介绍一下你能做什么？"
}
`}</pre>
          <div>cURL 示例：</div>
          <pre style={{ background:'#0f172a', color:'#e2e8f0', padding:12, borderRadius:8, overflow:'auto' }}>{`curl -X POST \
  http://localhost:8000/api/v1/user-agents/${apiAgent.agent_id}/invoke \
  -H 'Content-Type: application/json' \
  -b 'your_session_cookie' \
  -d '{"prompt":"你好，介绍一下你能做什么？"}'`}</pre>
          <div style={{ color:'#64748b', fontSize:12 }}>说明：此接口直接按智能体发布/保存时的配置执行一次问答并返回结果。</div>
        </div>
      ) : null}
    </Modal>
    {/* 运行时设置弹窗 */}
    <Modal
      title="运行时设置（即时生效）"
      open={rtOpen}
      onCancel={()=> setRtOpen(false)}
      okText="保存"
      confirmLoading={rtLoading}
      onOk={async ()=>{
        if (!rtAgentId) return;
        try {
          setRtLoading(true);
          await userAgentService.updateRuntimeSettings(rtAgentId, {
            default_model: rtModel || undefined,
            chat: { multi_turn: rtMulti, max_rounds: rtMaxRounds, context_window: rtContextWin }
          });
          message.success('已保存');
          setRtOpen(false);
        } catch(e:any) {
          message.error(e?.message||'保存失败');
        } finally {
          setRtLoading(false);
        }
      }}
      width={560}
    >
      <Spin spinning={rtLoading}>
        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:12 }}>
          <div style={{ lineHeight:'32px', color:'#64748b' }}>对话模型</div>
          <Select
            showSearch
            value={rtModel}
            onChange={setRtModel}
            options={rtModels}
            placeholder="选择对话模型"
          />
          <div style={{ lineHeight:'32px', color:'#64748b' }}>启用多轮</div>
          <Select value={rtMulti? 'on':'off'} onChange={(v)=>setRtMulti(v==='on')} options={[{value:'off',label:'关闭'},{value:'on',label:'开启'}]} />
          <div style={{ lineHeight:'32px', color:'#64748b' }}>最大轮数</div>
          <InputNumber min={1} max={50} step={1} value={rtMaxRounds} onChange={(v)=>setRtMaxRounds(Number(v||1))} />
          <div style={{ lineHeight:'32px', color:'#64748b' }}>上下文窗口</div>
          <InputNumber min={0} max={50} step={1} value={rtContextWin} onChange={(v)=>setRtContextWin(Number(v||0))} />
        </div>
        <div style={{ marginTop:8, color:'#94a3b8', fontSize:12 }}>说明：参数保存后，嵌入页与 API 直调将立即使用新的设置。</div>
      </Spin>
    </Modal>
    {/* 发布确认弹窗 */}
    <Modal
      title={
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:700 }}>发布智能体</span>
          <span style={{ color:'#94a3b8', fontSize:12 }}>发布后自动支持「对话 / 嵌入页 / API」三种访问方式</span>
        </div>
      }
      open={publishOpen}
      onCancel={()=> setPublishOpen(false)}
      onOk={async ()=>{
        if (!publishTarget) return;
        try {
          setPublishing(true);
          const res = await userAgentService.publishUserAgent(publishTarget.id, { service_name: publishServiceName?.trim() || undefined });
          message.success(`已发布 v${res.version}`);
          const pub = await userAgentService.getPublishedAgents().catch(()=>[]);
          setPublished(pub||[]);
          setPublishOpen(false);
        } catch(e:any) {
          message.error(e?.message || '发布失败');
        } finally {
          setPublishing(false);
        }
      }}
      confirmLoading={publishing}
      okText="发布"
      cancelText="取消"
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:12, background:'#fafafa' }}>
          <div style={{ fontWeight:600, marginBottom:6 }}>服务名称</div>
          <Input
            value={publishServiceName}
            onChange={e=>setPublishServiceName(e.target.value)}
            placeholder="用于对外展示与区分，如：知识库助手A"
            maxLength={60}
          />
          <div style={{ color:'#94a3b8', fontSize:12, marginTop:6 }}>说明：发布后将自动支持「对话（工作室）/ 对话嵌入 / API 直调」三种方式。</div>
        </div>
      </div>
    </Modal>
    {/* 模板详情弹窗 */}
    <Modal
      title={
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>模板详情</span>
          {detailTpl && (
            <Tag>{detailTpl.template_type === 'team' ? '团队模板' : '单体模板'}</Tag>
          )}
        </div>
      }
      open={detailOpen}
      onCancel={()=> setDetailOpen(false)}
      footer={null}
      width={720}
    >
      <Spin spinning={detailLoading}>
        {detailTpl && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:16 }}>{normText((detailTpl as any).template_name) || '模板'}</div>
                <div style={{ color:'#64748b', fontSize:13 }}>{normText((detailTpl as any).description) || '暂无描述'}</div>
                <div style={{ marginTop:6, display:'flex', gap:8 }}>
                  {(detailTpl as any).category && <Tag color="blue">{normText((detailTpl as any).category)}</Tag>}
                  <Tag>{(detailTpl as any).template_type}</Tag>
                </div>
              </div>
            {detailTpl.template_type === 'team' && (
              <div style={{ border:'1px solid #e8ecf3', borderRadius:10, padding:12 }}>
                <div style={{ fontWeight:600, marginBottom:8 }}>子智能体</div>
                {detailMembers.length === 0 && <div className="empty">该模板未声明子智能体清单</div>}
                {detailMembers.length > 0 && (
                  <List
                    dataSource={detailMembers}
                    renderItem={(m)=> (
                      <List.Item key={m.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:600 }}>{m.name}</div>
                          <div style={{ color:'#64748b', fontSize:12 }}>{m.id}{m.role? ` · ${m.role}`: ''}</div>
                        </div>
                        <div style={{ color:'#64748b', fontSize:12 }}>{m.required ? <Tag color="blue">必启</Tag> : <Tag>可关闭</Tag>}</div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Spin>
    </Modal>
    </>
  );
};

export default AgentNavigationPage;
