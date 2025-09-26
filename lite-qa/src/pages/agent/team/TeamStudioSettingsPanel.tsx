import React from 'react';
import { Tabs, Space, Button, Switch, Tag, Tooltip, Select, InputNumber } from 'antd';
const { Option } = Select;
import ToolsSettingsSection from '../../agent/studio/ToolsSettingsSection';
import type { AgentTool } from '../../../services/userAgentService';
import { getKBTemplates } from '../../../services/qaRoutingService';

export type TeamMemberConfig = {
  id: string;
  name: string;
  role?: string;
  enabled: boolean;
  prompt: string;
  model?: string;
  /** 是否允许关闭（切换为禁用）。为 false 时必启，开关禁用 */
  canToggle?: boolean;
};

export interface MembersTabProps {
  members: TeamMemberConfig[];
  setMembers: (updater: (prev: TeamMemberConfig[]) => TeamMemberConfig[]) => void;
  modelOptions: Array<{ value: string; label: string }>; 
}

export interface ResourcesTabProps {
  collections: Array<{ id: string; name: string; document_count?: number }>;
  members: TeamMemberConfig[];
  resources: Record<string, {
    // 知识库智能体配置
    collectionId?: string;
    retrievalMode?: 'hybrid'|'hirag';
    retrievalTemplateId?: string;
    // 图谱智能体配置（knowledge_graph_agent）
    graphTrigger?: 'auto'|'fixed';
    graphQueryMode?: 'local'|'global'|'hybrid'|'naive'|'mix'|'bypass';
    graphFixedQuery?: string;
    graphTopK?: number;
    graphChunkTopK?: number;
  }>;
  setResources: (updater: (prev: ResourcesTabProps['resources']) => ResourcesTabProps['resources']) => void;
}

export interface ExecutionTabProps {
  timeoutMs: number;
  setTimeoutMs: (v: number) => void;
  maxRetries: number;
  setMaxRetries: (v: number) => void;
  teamMode: 'sequential'|'parallel'|'collaborative';
  setTeamMode: (v: 'sequential'|'parallel'|'collaborative') => void;
  maxConcurrency: number;
  setMaxConcurrency: (v: number) => void;
  maxIterations: number;
  setMaxIterations: (v: number) => void;
  perAgentTimeoutMs: number;
  setPerAgentTimeoutMs: (v: number) => void;
  perAgentRetryLimit: number;
  setPerAgentRetryLimit: (v: number) => void;
  stopOnFirstSuccess: boolean;
  setStopOnFirstSuccess: (v: boolean) => void;
}

export interface ToolsTabProps {
  availableTools: AgentTool[];
  selectedTools: string[];
  setSelectedTools: (updater: (prev: string[]) => string[]) => void;
  toolTab: 'builtin'|'mcp'|'api';
  setToolTab: (v: 'builtin'|'mcp'|'api') => void;
  activeTool?: string;
  setActiveTool: (code?: string) => void;
  filteredTools: AgentTool[];
  renderToolForm: (tool: AgentTool) => React.ReactNode;
}

export interface TeamStudioSettingsPanelProps {
  activeTab: 'members'|'resources'|'tools'|'execution';
  setActiveTab: (k: 'members'|'resources'|'tools'|'execution') => void;
  onCancel: () => void;
  onSave: () => void;
  membersTab: MembersTabProps;
  resourcesTab: ResourcesTabProps;
  toolsTab: ToolsTabProps;
  executionTab: ExecutionTabProps;
}

const MembersSection: React.FC<MembersTabProps> = ({ members, setMembers, modelOptions }) => {
  const upd = (id: string, patch: Partial<TeamMemberConfig>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };
  return (
    <div>
      <div className="studio-section settings-group-basic">
        <div className="section-header">
          <span>子智能体列表</span>
          <span className="req-pill">必填</span>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {members.map(m => {
            const bg = m.canToggle === false
              ? '#eef5ff' // 必启：淡蓝背景
              : (m.enabled ? '#f0fdf4' : '#fff'); // 启用：淡绿；禁用：白
            const border = m.canToggle === false
              ? '#bfdbfe'
              : (m.enabled ? '#bbf7d0' : '#e8ecf3');
            return (
            <div key={m.id} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 12, background: bg }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap: 8 }}>
                <div style={{ fontWeight: 600, display:'flex', alignItems:'center', gap:6 }}>
                  <span>{m.name}{m.role ? ` · ${m.role}` : ''}</span>
                  {m.canToggle === false && <Tag color="blue">必启</Tag>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#64748b' }}>{m.enabled ? '已启用' : '未启用'}</span>
                  <Tooltip title={m.canToggle === false ? '模板要求该子智能体为必启，不可关闭' : ''}>
                    <Switch
                      size="small"
                      checked={m.enabled}
                      disabled={m.canToggle === false}
                      onChange={(v)=>{
                        if (m.canToggle === false) return;
                        upd(m.id, { enabled: v });
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>提示词</div>
                <textarea
                  value={m.prompt}
                  onChange={(e)=>upd(m.id,{ prompt: e.target.value })}
                  rows={3}
                  style={{ width:'100%', borderRadius:8, border:'1px solid #e8ecf3', padding:8 }}
                  placeholder="为该子智能体设置系统提示词"
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>模型</div>
                <Select
                  value={m.model || undefined}
                  onChange={(v)=>upd(m.id,{ model: v as string })}
                  allowClear
                  placeholder="选择模型"
                  style={{ width:'100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {modelOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </div>
            </div>
          )})}
          {members.length === 0 && (
            <div className="empty">暂无子智能体，请在模板中预置或后续添加</div>
          )}
        </Space>
      </div>
    </div>
  );
};

const ResourcesSection: React.FC<ResourcesTabProps> = ({ collections, members, resources, setResources }) => {
  const [tplCache, setTplCache] = React.useState<Record<string, Array<{ id:string; template_name:string; mode?:string }>>>({});
  const [loadingTplKey, setLoadingTplKey] = React.useState<string | null>(null);

  const ensureTemplates = async (collectionId?: string) => {
    if (!collectionId) return;
    if (tplCache[collectionId]) return;
    setLoadingTplKey(collectionId);
    try {
      const list = await getKBTemplates(collectionId);
      const arr = Array.isArray(list) ? list : [];
      setTplCache(prev => ({ ...prev, [collectionId]: arr.map((t:any)=>({ id:String(t.id), template_name: String(t.template_name || t.name || t.id), mode: t.mode })) }));
    } catch {
      setTplCache(prev => ({ ...prev, [collectionId]: [] }));
    } finally {
      setLoadingTplKey(k => (k === collectionId ? null : k));
    }
  };

  return (
    <div>
      {members.map(m => {
        const cfg = resources[m.id] || {};
        const disabled = !m.enabled;
      const isKB = m.id === 'knowledge_retrieval_agent';
      const isGraph = m.id === 'knowledge_graph_agent';
        const tplList = cfg.collectionId ? (tplCache[cfg.collectionId] || []) : [];
        return (
          <div key={m.id} className="studio-section settings-group-knowledge" style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div className="section-header kb">
              <span>资源挂载 · {m.name}</span>
              <span className="req-pill">{m.enabled ? '启用' : '已关闭'}</span>
            </div>
            {isKB ? (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>知识库</div>
                  <Select
                    value={cfg.collectionId}
                    onChange={async (v)=> {
                      setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], collectionId: v as string, retrievalTemplateId: undefined } }));
                      await ensureTemplates(String(v));
                    }}
                    allowClear
                    placeholder="选择知识库"
                    style={{ width:'100%' }}
                    disabled={disabled}
                  >
                    {collections.map(c => (
                      <Option key={c.id} value={c.id}>{c.name} ({c.document_count ?? 0})</Option>
                    ))}
                  </Select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索模式</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={()=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], retrievalMode: 'hybrid' } }))}
                      className="btn"
                      style={{ padding:'6px 10px', borderRadius:8, border: (cfg.retrievalMode||'hybrid')==='hybrid'?'1px solid #1677ff':'1px solid #e8ecf3', background: (cfg.retrievalMode||'hybrid')==='hybrid'?'#eef5ff':'#fff' }}
                      disabled={disabled}
                    >
                      Hybrid（默认）
                    </button>
                    <button
                      onClick={()=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], retrievalMode: 'hirag' } }))}
                      className="btn"
                      style={{ padding:'6px 10px', borderRadius:8, border: cfg.retrievalMode==='hirag'?'1px solid #1677ff':'1px solid #e8ecf3', background: cfg.retrievalMode==='hirag'?'#eef5ff':'#fff' }}
                      disabled={disabled}
                    >
                      HiRAG（多层检索）
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>路由模板</div>
                  <Select
                    value={cfg.retrievalTemplateId}
                    onClick={async ()=> { await ensureTemplates(cfg.collectionId); }}
                    onChange={(v)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], retrievalTemplateId: v as string } }))}
                    allowClear
                    placeholder={cfg.collectionId ? '选择路由模板' : '请先选择知识库'}
                    style={{ width:'100%' }}
                    disabled={disabled || !cfg.collectionId}
                    loading={loadingTplKey === cfg.collectionId}
                  >
                    {(tplList || []).map(t => (
                      <Option key={t.id} value={t.id}>{t.template_name}</Option>
                    ))}
                  </Select>
                  <div style={{ marginTop:6, color:'#94a3b8', fontSize:12 }}>
                    路由模板包含一组有序“检索路径”，作为整体执行。
                  </div>
                </div>
              </>
            ) : isGraph ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索触发</div>
                    <Select
                      value={cfg.graphTrigger || 'auto'}
                      onChange={(v)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], graphTrigger: v as any } }))}
                      style={{ width:'100%' }}
                      disabled={disabled}
                    >
                      <Option value="auto">自动（使用对话输入）</Option>
                      <Option value="fixed">固定（使用预设查询）</Option>
                    </Select>
                  </div>
                  <div>
                    <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索模式</div>
                    <Select
                      value={cfg.graphQueryMode || 'mix'}
                      onChange={(v)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], graphQueryMode: v as any } }))}
                      style={{ width:'100%' }}
                      disabled={disabled}
                    >
                      <Option value="mix">mix（推荐）</Option>
                      <Option value="local">local（实体优先）</Option>
                      <Option value="global">global（关系优先）</Option>
                      <Option value="hybrid">hybrid</Option>
                      <Option value="naive">naive</Option>
                      <Option value="bypass">bypass</Option>
                    </Select>
                  </div>
                </div>

                {(cfg.graphTrigger || 'auto') === 'fixed' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>固定查询</div>
                    <textarea
                      value={cfg.graphFixedQuery || ''}
                      onChange={(e)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], graphFixedQuery: e.target.value } }))}
                      placeholder="请输入固定检索的查询文本..."
                      style={{ width:'100%', minHeight: 64, border:'1px solid #e8ecf3', borderRadius:8, padding:8 }}
                      disabled={disabled}
                    />
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop: 10 }}>
                  <div>
                    <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>TopK</div>
                    <InputNumber min={1} max={200} value={Number(cfg.graphTopK ?? 40)} onChange={(v)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], graphTopK: Number(v||0) } }))} style={{ width:'100%' }} disabled={disabled} />
                  </div>
                  <div>
                    <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>Chunk TopK</div>
                    <InputNumber min={1} max={200} value={Number(cfg.graphChunkTopK ?? 10)} onChange={(v)=> setResources(prev => ({ ...prev, [m.id]: { ...prev[m.id], graphChunkTopK: Number(v||0) } }))} style={{ width:'100%' }} disabled={disabled} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color:'#64748b', fontSize:13 }}>该子智能体无需额外资源配置。</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ExecutionSection: React.FC<ExecutionTabProps> = ({
  timeoutMs, setTimeoutMs, maxRetries, setMaxRetries,
  teamMode, setTeamMode, maxConcurrency, setMaxConcurrency,
  maxIterations, setMaxIterations, perAgentTimeoutMs, setPerAgentTimeoutMs,
  perAgentRetryLimit, setPerAgentRetryLimit, stopOnFirstSuccess, setStopOnFirstSuccess
}) => {
  return (
    <div>
      <div className="studio-section settings-group-model">
        <div className="section-header">
          <span>执行参数</span>
          <span className="req-pill hollow">团队控制</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>团队模式</div>
            <Select value={teamMode} onChange={(v)=>setTeamMode(v)} style={{ width:'100%' }}>
              <Option value="sequential">顺序执行</Option>
              <Option value="parallel">并行执行</Option>
              <Option value="collaborative">协同（推荐）</Option>
            </Select>
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>最大并发</div>
            <InputNumber min={1} max={32} value={maxConcurrency} onChange={(v)=>setMaxConcurrency(Number(v)||1)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>最大迭代轮次</div>
            <InputNumber min={1} max={50} value={maxIterations} onChange={(v)=>setMaxIterations(Number(v)||1)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>全局超时（ms）</div>
            <InputNumber min={1000} step={500} value={timeoutMs} onChange={(v)=>setTimeoutMs(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>全局最大重试</div>
            <InputNumber min={0} max={10} value={maxRetries} onChange={(v)=>setMaxRetries(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>单Agent超时（ms）</div>
            <InputNumber min={500} step={500} value={perAgentTimeoutMs} onChange={(v)=>setPerAgentTimeoutMs(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>单Agent最大重试</div>
            <InputNumber min={0} max={5} value={perAgentRetryLimit} onChange={(v)=>setPerAgentRetryLimit(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div className="studio-row" style={{ gridColumn: '1 / span 2' }}>
            <span>首次成功即停止</span>
            <Switch checked={stopOnFirstSuccess} onChange={setStopOnFirstSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamStudioSettingsPanel: React.FC<TeamStudioSettingsPanelProps> = ({ activeTab, setActiveTab, onCancel, onSave, membersTab, resourcesTab, toolsTab, executionTab }) => {
  return (
    <div className="studio-settings-panel">
      <div className="settings-header">
        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={(k)=>setActiveTab(k as any)}
          items={[{key:'members', label:'子智能体'}, {key:'resources', label:'资源挂载'}, {key:'tools', label:'工具配置'}, {key:'execution', label:'执行参数'}]}
        />
      </div>
      <div className="settings-scroll">
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {activeTab === 'members' ? (
            <MembersSection {...membersTab} />
          ) : activeTab === 'resources' ? (
            <ResourcesSection {...resourcesTab} />
          ) : activeTab === 'tools' ? (
            <ToolsSettingsSection {...toolsTab} />
          ) : (
            <ExecutionSection {...executionTab} />
          )}
        </Space>
      </div>
      <div className="studio-actions fixed">
        <Button
          onClick={onCancel}
          type="default"
          style={{ background:'#f8fafc', borderColor:'#e2e8f0', color:'#334155' }}
        >
          取消
        </Button>
        <Button type="primary" onClick={onSave}>保存</Button>
      </div>
    </div>
  );
};

export default TeamStudioSettingsPanel;
