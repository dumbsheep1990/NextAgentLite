import React, { useState } from 'react';
import { Tabs, Space, Button, Switch, Tag, Tooltip, Select, InputNumber, Input } from 'antd';
import { SettingOutlined, ExpandOutlined, InfoCircleOutlined } from '@ant-design/icons';
const { Option } = Select;
const { TextArea } = Input;
import ToolsSettingsSection from '../../agent/studio/ToolsSettingsSection';
import type { AgentTool } from '../../../services/userAgentService';
import { getKBTemplates } from '../../../services/qaRoutingService';
import TeamMemberConfigModal from './TeamMemberConfigModal';
import SubAgentDetailModal from './SubAgentDetailModal';
import { getAllScenarios, getCoordinatorByScenario } from '../../../config/teamCoordinators';

export type TeamMemberConfig = {
  id: string;
  name: string;
  role?: string;
  enabled: boolean;
  prompt: string;
  model?: string;
  /** 是否允许关闭（切换为禁用）。为 false 时必启，开关禁用 */
  canToggle?: boolean;
  // Agno 模型参数
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  showToolCalls?: boolean;
  markdown?: boolean;
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
  // === 基础执行配置 ===
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

  // === Team基础配置 (Agno) ===
  scenario?: 'general' | 'policy' | 'academic' | 'enterprise';
  setScenario: (v: 'general' | 'policy' | 'academic' | 'enterprise') => void;
  teamInstructions?: string;
  setTeamInstructions: (v?: string) => void;
  successCriteria?: string;
  setSuccessCriteria: (v?: string) => void;

  // === 细化超时配置 (Agno) ===
  translationTimeout?: number;
  setTranslationTimeout: (v: number) => void;
  retrievalTimeout?: number;
  setRetrievalTimeout: (v: number) => void;
  graphQueryTimeout?: number;
  setGraphQueryTimeout: (v: number) => void;
  knowledgeSearchTimeout?: number;
  setKnowledgeSearchTimeout: (v: number) => void;

  // === 缓存配置 (Agno) ===
  cacheEnabled?: boolean;
  setCacheEnabled: (v: boolean) => void;
  translationCacheTTL?: number;
  setTranslationCacheTTL: (v: number) => void;
  retrievalCacheTTL?: number;
  setRetrievalCacheTTL: (v: number) => void;
  graphCacheTTL?: number;
  setGraphCacheTTL: (v: number) => void;

  // === 细化并发配置 (Agno) ===
  maxParallelRetrievals?: number;
  setMaxParallelRetrievals: (v: number) => void;
  maxParallelTranslations?: number;
  setMaxParallelTranslations: (v: number) => void;
}

export interface ToolsTabProps {
  availableTools: AgentTool[];
  selectedTools: string[];
  setSelectedTools: (updater: (prev: string[]) => string[]) => void;
  toolTab: 'builtin'|'mcp'|'api'|'custom_crawler';
  setToolTab: (v: 'builtin'|'mcp'|'api'|'custom_crawler') => void;
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
  onSaveDraft?: () => void; // 添加保存草稿回调
  membersTab: MembersTabProps;
  resourcesTab: ResourcesTabProps;
  toolsTab: ToolsTabProps;
  executionTab: ExecutionTabProps;
}

const MembersSection: React.FC<MembersTabProps> = ({ members, setMembers, modelOptions }) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [detailModalAgent, setDetailModalAgent] = useState<TeamMemberConfig | null>(null);

  const upd = (id: string, patch: Partial<TeamMemberConfig>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const handleConfirmConfig = (updatedMembers: TeamMemberConfig[]) => {
    setMembers(() => updatedMembers);
  };

  const handleConfirmDetailConfig = (updatedAgent: TeamMemberConfig) => {
    setMembers(prev => prev.map(m => m.id === updatedAgent.id ? updatedAgent : m));
  };

  return (
    <div>
      <div className="studio-section settings-group-basic">
        <div className="section-header">
          <span>子智能体列表</span>
          <Space>
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setShowConfigModal(true)}
              type="primary"
              ghost
            >
              统一配置
            </Button>
            <span className="req-pill">必填</span>
          </Space>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {members.map(m => {
            // 根据启用状态调整卡片样式
            const opacity = m.enabled ? 1 : 0.6;
            const bg = m.canToggle === false ? '#eef5ff' : (m.enabled ? '#fff' : '#fafafa');
            const border = m.canToggle === false ? '#bfdbfe' : (m.enabled ? '#e2e8f0' : '#e8ecf3');

            return (
            <div key={m.id} style={{
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: 12,
              background: bg,
              opacity,
              transition: 'opacity 0.2s',
              position: 'relative'
            }}>
              {/* 右上角放大按钮 */}
              <Tooltip title="查看详细配置">
                <Button
                  type="text"
                  size="small"
                  icon={<ExpandOutlined />}
                  onClick={() => setDetailModalAgent(m)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#64748b',
                    padding: '4px 8px'
                  }}
                />
              </Tooltip>

              {/* 卡片头部：名称 + 状态标签 */}
              <div style={{ marginBottom: 10, paddingRight: 32 }}>
                <div style={{ fontWeight: 600, display:'flex', alignItems:'center', gap:6, marginBottom: 4 }}>
                  <span>{m.name}</span>
                  {m.canToggle === false && <Tag color="blue" style={{ fontSize: 11 }}>必要</Tag>}
                  {m.enabled ? (
                    <Tag color="success" style={{ fontSize: 11 }}>已启用</Tag>
                  ) : (
                    <Tag color="default" style={{ fontSize: 11 }}>未启用</Tag>
                  )}
                  {m.model && <Tag color="purple" style={{ fontSize: 11 }}>{m.model.split('/').pop()?.slice(0,15) || m.model}</Tag>}
                </div>
                {m.role && (
                  <div style={{ fontSize: 13, color: '#64748b' }}>{m.role}</div>
                )}
              </div>

              {/* 提示词编辑区 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>
                  系统提示词 <span style={{ color:'#f59e0b' }}>✱</span>
                </div>
                <textarea
                  value={m.prompt}
                  onChange={(e)=>upd(m.id,{ prompt: e.target.value })}
                  rows={4}
                  style={{
                    width:'100%',
                    borderRadius:8,
                    border:'1px solid #e8ecf3',
                    padding:8,
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontFamily: 'monospace'
                  }}
                  placeholder="为该子智能体设置系统提示词（instructions）"
                  disabled={!m.enabled}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  提示词定义了子智能体的行为模式和约束规则
                </div>
              </div>

              {/* 折叠详细参数（Agno模型参数） */}
              <details style={{ marginTop: 8 }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: 12,
                  userSelect: 'none',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  高级参数 (模型控制)
                </summary>
                <div style={{ paddingLeft: 8, borderLeft: '2px solid #e2e8f0', marginLeft: 4 }}>
                  {/* Temperature */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Temperature</span>
                      <InputNumber
                        size="small"
                        min={0}
                        max={2}
                        step={0.1}
                        value={m.temperature ?? 0.1}
                        onChange={(v) => upd(m.id, { temperature: v ?? 0.1 })}
                        style={{ width: 80 }}
                        disabled={!m.enabled}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>控制输出随机性（0=确定性，2=高创造性）</div>
                  </div>

                  {/* Max Tokens */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Max Tokens</span>
                      <InputNumber
                        size="small"
                        min={256}
                        max={8192}
                        step={256}
                        value={m.maxTokens ?? 4096}
                        onChange={(v) => upd(m.id, { maxTokens: v ?? 4096 })}
                        style={{ width: 80 }}
                        disabled={!m.enabled}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>最大输出token数量</div>
                  </div>

                  {/* Top P */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Top P</span>
                      <InputNumber
                        size="small"
                        min={0}
                        max={1}
                        step={0.1}
                        value={m.topP ?? 1.0}
                        onChange={(v) => upd(m.id, { topP: v ?? 1.0 })}
                        style={{ width: 80 }}
                        disabled={!m.enabled}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>核采样参数（通常设为1.0）</div>
                  </div>

                  {/* 行为开关 */}
                  <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px dashed #e8ecf3' }}>
                    <div className="studio-row" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>显示工具调用</span>
                      <Switch
                        size="small"
                        checked={m.showToolCalls ?? true}
                        onChange={(v) => upd(m.id, { showToolCalls: v })}
                        disabled={!m.enabled}
                      />
                    </div>
                    <div className="studio-row">
                      <span style={{ fontSize: 12, color: '#64748b' }}>Markdown输出</span>
                      <Switch
                        size="small"
                        checked={m.markdown ?? true}
                        onChange={(v) => upd(m.id, { markdown: v })}
                        disabled={!m.enabled}
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )})}
          {members.length === 0 && (
            <div className="empty">暂无子智能体，请在模板中预置或后续添加</div>
          )}
        </Space>
      </div>

      {/* 统一配置Modal */}
      <TeamMemberConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        members={members}
        onConfirm={handleConfirmConfig}
        modelOptions={modelOptions}
      />

      {/* 单个子智能体详细配置Modal */}
      <SubAgentDetailModal
        open={!!detailModalAgent}
        onClose={() => setDetailModalAgent(null)}
        agent={detailModalAgent}
        onConfirm={handleConfirmDetailConfig}
        modelOptions={modelOptions}
      />
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
  perAgentRetryLimit, setPerAgentRetryLimit, stopOnFirstSuccess, setStopOnFirstSuccess,
  // Team基础配置
  scenario, setScenario, teamInstructions, setTeamInstructions,
  successCriteria, setSuccessCriteria,
  // 细化超时配置
  translationTimeout, setTranslationTimeout, retrievalTimeout, setRetrievalTimeout,
  graphQueryTimeout, setGraphQueryTimeout, knowledgeSearchTimeout, setKnowledgeSearchTimeout,
  // 缓存配置
  cacheEnabled, setCacheEnabled, translationCacheTTL, setTranslationCacheTTL,
  retrievalCacheTTL, setRetrievalCacheTTL, graphCacheTTL, setGraphCacheTTL,
  // 细化并发配置
  maxParallelRetrievals, setMaxParallelRetrievals, maxParallelTranslations, setMaxParallelTranslations,
}) => {
  return (
    <div>
      {/* Team基础配置 */}
      <div className="studio-section settings-group-basic" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span>团队设置</span>
          <span className="req-pill hollow">Agno Team</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>
            场景类型
            <Tooltip title="根据场景类型自动配置对应的协调器，协调整个Team的执行流程（仅协同模式有效）">
              <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12, color: '#94a3b8', cursor: 'help' }} />
            </Tooltip>
          </div>
          <Select
            value={scenario || 'general'}
            onChange={setScenario}
            placeholder="选择场景类型"
            style={{ width:'100%' }}
            disabled={teamMode !== 'collaborative'}
          >
            {getAllScenarios().map(s => (
              <Option key={s.value} value={s.value} title={s.description}>
                {s.label}
              </Option>
            ))}
          </Select>
          {scenario && teamMode === 'collaborative' && (
            <div style={{
              marginTop: 8,
              padding: 10,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                <strong>协调器:</strong> {getCoordinatorByScenario(scenario).name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {getCoordinatorByScenario(scenario).description}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>团队整体指令（可选）</div>
          <TextArea
            value={teamInstructions}
            onChange={(e) => setTeamInstructions(e.target.value)}
            rows={3}
            placeholder="为整个Team设置整体指令和协作策略..."
            style={{ fontSize: 13 }}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            团队整体指令定义了Team级别的协作策略，不同于单个Agent的instructions
          </div>
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>成功标准（可选）</div>
          <Input
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder="例如：提供准确、全面、多语言的知识问答结果"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* 基础执行参数 */}
      <div className="studio-section settings-group-model" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span>执行参数</span>
          <span className="req-pill hollow">核心控制</span>
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
          <div className="studio-row" style={{ gridColumn: '1 / span 2' }}>
            <span>首次成功即停止</span>
            <Switch checked={stopOnFirstSuccess} onChange={setStopOnFirstSuccess} />
          </div>
        </div>
      </div>

      {/* 并发配置 */}
      <div className="studio-section settings-group-model" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span>并发控制</span>
          <span className="req-pill hollow">性能优化</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>Agent并发数</div>
            <InputNumber min={1} max={32} value={maxConcurrency} onChange={(v)=>setMaxConcurrency(Number(v)||1)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索并发数</div>
            <InputNumber min={1} max={10} value={maxParallelRetrievals ?? 2} onChange={(v)=>setMaxParallelRetrievals(Number(v)||2)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>翻译并发数</div>
            <InputNumber min={1} max={10} value={maxParallelTranslations ?? 2} onChange={(v)=>setMaxParallelTranslations(Number(v)||2)} style={{ width:'100%' }} />
          </div>
        </div>
      </div>

      {/* 超时配置 */}
      <div className="studio-section settings-group-model" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span>超时配置</span>
          <span className="req-pill hollow">细化控制</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>单Agent超时（ms）</div>
            <InputNumber min={500} step={500} value={perAgentTimeoutMs} onChange={(v)=>setPerAgentTimeoutMs(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>单Agent最大重试</div>
            <InputNumber min={0} max={5} value={perAgentRetryLimit} onChange={(v)=>setPerAgentRetryLimit(Number(v)||0)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>翻译超时（秒）</div>
            <InputNumber min={1} max={60} value={translationTimeout ?? 10} onChange={(v)=>setTranslationTimeout(Number(v)||10)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索超时（秒）</div>
            <InputNumber min={1} max={120} value={retrievalTimeout ?? 15} onChange={(v)=>setRetrievalTimeout(Number(v)||15)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>图谱查询超时（秒）</div>
            <InputNumber min={1} max={120} value={graphQueryTimeout ?? 30} onChange={(v)=>setGraphQueryTimeout(Number(v)||30)} style={{ width:'100%' }} />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>知识搜索超时（秒）</div>
            <InputNumber min={1} max={60} value={knowledgeSearchTimeout ?? 12} onChange={(v)=>setKnowledgeSearchTimeout(Number(v)||12)} style={{ width:'100%' }} />
          </div>
        </div>
      </div>

      {/* 缓存配置 */}
      <div className="studio-section settings-group-model">
        <div className="section-header">
          <span>缓存配置</span>
          <span className="req-pill hollow">性能优化</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="studio-row">
            <Space>
              <span style={{ color:'#64748b', fontSize:13 }}>启用缓存</span>
              <Tooltip title="缓存可以显著提升重复查询的响应速度">
                <InfoCircleOutlined style={{ fontSize: 12, color: '#94a3b8', cursor: 'help' }} />
              </Tooltip>
            </Space>
            <Switch checked={cacheEnabled ?? true} onChange={setCacheEnabled} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>翻译缓存TTL（秒）</div>
            <InputNumber
              min={60}
              max={86400}
              step={60}
              value={translationCacheTTL ?? 3600}
              onChange={(v)=>setTranslationCacheTTL(Number(v)||3600)}
              style={{ width:'100%' }}
              disabled={!cacheEnabled}
            />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>检索缓存TTL（秒）</div>
            <InputNumber
              min={60}
              max={86400}
              step={60}
              value={retrievalCacheTTL ?? 1800}
              onChange={(v)=>setRetrievalCacheTTL(Number(v)||1800)}
              style={{ width:'100%' }}
              disabled={!cacheEnabled}
            />
          </div>
          <div>
            <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>图谱缓存TTL（秒）</div>
            <InputNumber
              min={60}
              max={86400}
              step={60}
              value={graphCacheTTL ?? 7200}
              onChange={(v)=>setGraphCacheTTL(Number(v)||7200)}
              style={{ width:'100%' }}
              disabled={!cacheEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamStudioSettingsPanel: React.FC<TeamStudioSettingsPanelProps> = ({ activeTab, setActiveTab, onCancel, onSave, onSaveDraft, membersTab, resourcesTab, toolsTab, executionTab }) => {
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
        {onSaveDraft && (
          <Button onClick={onSaveDraft} style={{ background:'#fff7ed', borderColor:'#fdba74', color:'#ea580c' }}>
            保存草稿
          </Button>
        )}
        <Button type="primary" onClick={onSave}>导出</Button>
      </div>
    </div>
  );
};

export default TeamStudioSettingsPanel;
