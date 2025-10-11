import React, { useEffect, useState } from 'react';
import { Select, Switch, Input, InputNumber, Slider, Typography, Space, Divider, Alert, Tooltip } from 'antd';
import type { RetrievalPath } from '../../../services/qaRoutingService';
import { getRetrievalPaths, getKBTemplates, applyTemplateById, updateTemplate } from '../../../services/qaRoutingService';
import { Button, Modal, Tag } from 'antd';
import { BookOutlined, NodeIndexOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { OutputMode } from '../../../components/studio/StreamContentRenderer';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

// 最大字符显示数（可按需微调）
const MAX_ID_CHARS = 22;

// 将较长的 ID 做中间省略，提升可读性
function truncateMiddle(text: string, max = MAX_ID_CHARS) {
  if (!text) return '';
  if (text.length <= max) return text;
  const keep = Math.max(4, Math.floor((max - 3) / 2));
  return text.slice(0, keep) + '...' + text.slice(-keep);
}

export interface BasicSettingsProps {
  showKnowledge: boolean;
  showGraph: boolean;
  requirements: any[];
  collections: Array<{ id: string; name: string; document_count?: number }>;
  collectionId?: string;
  setCollectionId: (v?: string) => void;
  // 元数据开关移动到“高级配置”，此处保留可选占位以兼容历史调用
  useMetadata?: boolean;
  setUseMetadata?: (v: boolean) => void;
  hideMetadata?: boolean;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  simThreshold: number;
  setSimThreshold: (v: number) => void;
  simWeight: number;
  setSimWeight: (v: number) => void;
  topN: number;
  setTopN: (v: number) => void;
  multiTurn: boolean;
  setMultiTurn: (v: boolean) => void;
  maxRounds: number;
  setMaxRounds: (v: number) => void;
  reasoning: boolean;
  setReasoning: (v: boolean) => void;
  crossCollections: string[];
  setCrossCollections: (v: string[]) => void;
  agentName: string;
  setAgentName: (v: string) => void;
  agentDesc: string;
  setAgentDesc: (v: string) => void;
  greeting: string;
  setGreeting: (v: string) => void;
  emptyReply: string;
  setEmptyReply: (v: string) => void;
  // 可选：显示跨知识库搜索
  showCrossKnowledge?: boolean;
  // 知识图谱检索配置
  graphMode: 'auto' | 'fixed';
  setGraphMode: (v: 'auto' | 'fixed') => void;
  graphQueryMode: 'local' | 'global' | 'hybrid' | 'naive' | 'mix' | 'bypass';
  setGraphQueryMode: (v: 'local' | 'global' | 'hybrid' | 'naive' | 'mix' | 'bypass') => void;
  graphFixedQuery: string;
  setGraphFixedQuery: (v: string) => void;
  graphTopK: number;
  setGraphTopK: (v: number) => void;
  graphChunkTopK: number;
  setGraphChunkTopK: (v: number) => void;
  // 检索路径/路由开关（新增）
  useQARouting?: boolean;
  setUseQARouting?: (v: boolean) => void;
  includeDocuments?: boolean;
  setIncludeDocuments?: (v: boolean) => void;
  includeQADatasets?: boolean;
  setIncludeQADatasets?: (v: boolean) => void;
  useReranking?: boolean;
  setUseReranking?: (v: boolean) => void;
  // 输出模式
  outputMode?: OutputMode;
  setOutputMode?: (v: OutputMode) => void;
}

const BasicSettingsSection: React.FC<BasicSettingsProps> = (props) => {
  const {
    showKnowledge, showGraph, requirements, collections,
    collectionId, setCollectionId,
    useMetadata, setUseMetadata, hideMetadata,
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
    graphMode, setGraphMode,
    graphQueryMode, setGraphQueryMode,
    graphFixedQuery, setGraphFixedQuery,
    graphTopK, setGraphTopK,
    graphChunkTopK, setGraphChunkTopK,
    useQARouting, setUseQARouting,
    includeDocuments, setIncludeDocuments,
    includeQADatasets, setIncludeQADatasets,
    useReranking, setUseReranking,
    outputMode, setOutputMode,
  } = props;
  // 是否显示知识库绑定：严格依据上层模板/需求判断
  const shouldShowKnowledge = !!showKnowledge;
  // 仅有一个知识库时，跨库搜索不可用
  const onlyOneKB = (collections || []).length <= 1;

  // 与知识库绑定联动的检索路径（从知识库加载并可就地修改）
  const [kbPaths, setKbPaths] = useState<RetrievalPath[]>([]);
  const [kbSaving, setKbSaving] = useState<string>('');
  const [kbTemplates, setKbTemplates] = useState<any[]>([]);
  const [activeTplId, setActiveTplId] = useState<string | undefined>(undefined);
  const activeTpl = kbTemplates.find((t:any)=>t.id===activeTplId);

  // 详情弹窗
  const [showDetail, setShowDetail] = useState(false);
  const [detailPath, setDetailPath] = useState<any>(null);

  // 权重设置（仅自定义权重模式）
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      if (!collectionId || !useQARouting) { setKbPaths([]); setKbTemplates([]); setActiveTplId(undefined); return; }
      try {
        const list = await getRetrievalPaths(collectionId); setKbPaths(list||[]);
        const tpls = await getKBTemplates(collectionId); setKbTemplates(tpls||[]);
        const def = (tpls||[]).find((t:any)=>t.is_default) || (tpls||[])[0];
        setActiveTplId(def?.id);
      } catch { setKbPaths([]); setKbTemplates([]); setActiveTplId(undefined); }
    })();
  }, [collectionId, useQARouting]);

  // 选择模板后自动应用到检索路径（减少“模板已选但无路径”的困惑）
  useEffect(() => {
    (async () => {
      if (!useQARouting || !collectionId || !activeTplId) return;
      try {
        await applyTemplateById(activeTplId);
        const list = await getRetrievalPaths(collectionId);
        setKbPaths(list || []);
      } catch {}
    })();
  }, [activeTplId, collectionId, useQARouting]);
  const goRoutingEditor = () => {
    if (!collectionId) return;
    window.open(`/app/knowledge/qa-routing?kb=${encodeURIComponent(collectionId)}`, '_blank');
  };

  const openDetail = (rp: RetrievalPath) => {
    setDetailPath(rp);
    setShowDetail(true);
  };

  const openWeights = () => {
    // 初始化当前权重（按路径名作为键）
    const map: Record<string, number> = {};
    kbPaths.forEach(p => { map[p.path_name] = weights[p.path_name] ?? 1.0; });
    setWeights(map);
    setShowWeights(true);
  };

  const saveWeights = async () => {
    if (!activeTplId) return;
    try {
      await updateTemplate(activeTplId, { weights });
      setShowWeights(false);
    } catch {}
  };

  // 计算可供跨库选择的知识库（排除当前挂载的）
  const crossSelectableCollections = (collections || []).filter(c => c.id !== collectionId);

  // 多知识库挂载：由原来的 collectionId + crossCollections 扩展为可视上的多个选择框
  const kbSelections: string[] = [
    ...(collectionId ? [collectionId] : []),
    ...(crossCollections || [])
  ];
  const setKbSelections = (arr: string[]) => {
    const uniq = Array.from(new Set(arr.filter(Boolean)));
    const first = uniq[0];
    const rest = uniq.slice(1);
    setCollectionId(first);
    setCrossCollections(rest);
  };
  const addKbSelection = () => {
    // 选择下一个未选的知识库
    const used = new Set(kbSelections);
    const candidate = (collections || []).find(c => !used.has(c.id));
    if (candidate) setKbSelections([...kbSelections, candidate.id]);
  };
  const removeKbSelection = (idx: number) => {
    const arr = [...kbSelections];
    arr.splice(idx, 1);
    setKbSelections(arr);
  };

  // 当切换绑定库时，自动将已选的跨库列表中移除当前绑定库
  useEffect(() => {
    if (!crossCollections || crossCollections.length === 0) return;
    const filtered = crossCollections.filter(id => id !== collectionId);
    if (filtered.length !== crossCollections.length) {
      setCrossCollections(filtered);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  return (
    <div>
      <div className="studio-section settings-group-basic">
        <div className="section-header">
          <span>助手基本信息</span>
          <span className="req-pill">必填</span>
        </div>

        <div className="agent-profile-area">
          <div className="basic-info-fields" style={{ width: '100%' }}>
            <div className="field-group">
              <Text type="secondary" className="setting-label">助手名称 *</Text>
              <Input
                value={agentName}
                onChange={(e)=>setAgentName(e.target.value)}
                placeholder="为您的助手起个名字"
                size="large"
                className="styled-input"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">助手描述</Text>
              <TextArea
                rows={3}
                value={agentDesc}
                onChange={(e)=>setAgentDesc(e.target.value)}
                placeholder="简要描述助手的功能特点..."
                className="styled-textarea"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">开场白</Text>
              <TextArea
                rows={2}
                value={greeting}
                onChange={(e)=>setGreeting(e.target.value)}
                placeholder="设置助手的欢迎语..."
                className="styled-textarea"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">空回复处理</Text>
              <TextArea
                rows={2}
                value={emptyReply}
                onChange={(e)=>setEmptyReply(e.target.value)}
                placeholder="当助手无法回答时的提示语..."
                className="styled-textarea"
              />
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div className="field-group">
              <Text type="secondary" className="setting-label">输出模式</Text>
              <Select
                value={outputMode || 'markdown'}
                onChange={(value) => setOutputMode && setOutputMode(value)}
                style={{ width: '100%' }}
                size="large"
                optionLabelProp="label"
              >
                <Option
                  value="markdown"
                  label={<Tag color="blue">Markdown</Tag>}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>Markdown</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>支持 Markdown 格式，代码高亮、表格等</div>
                  </div>
                </Option>
                <Option
                  value="html"
                  label={<Tag color="orange">HTML</Tag>}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>HTML</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>支持原始 HTML 渲染（自动清理危险标签）</div>
                  </div>
                </Option>
                <Option
                  value="mixed"
                  label={<Tag color="green">混合模式（智能识别）</Tag>}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>混合模式（智能识别）</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>自动检测内容格式，选择最佳渲染方式</div>
                  </div>
                </Option>
              </Select>
              <Alert
                type="warning"
                showIcon
                message={
                  <div>
                    <div style={{ fontWeight: 600 }}>切换输出模式会自动更新系统提示词</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#d97706' }}>
                      ⚠️ 请在切换模式后<strong>发送新消息</strong>以应用新的格式设置
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11 }}>
                      {outputMode === 'html' && '• HTML 模式：模型将返回 HTML 标签格式的内容'}
                      {outputMode === 'markdown' && '• Markdown 模式：模型将返回 Markdown 格式的内容（推荐）'}
                      {outputMode === 'mixed' && '• 混合模式：自动检测并渲染 Markdown 或 HTML 内容'}
                    </div>
                  </div>
                }
                style={{ marginTop: 8, fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      </div>

      {shouldShowKnowledge && (
        <div className="studio-section settings-group-knowledge">
          <div className="section-header kb">
            <BookOutlined style={{ marginRight: 6 }} />
            <span>知识库绑定</span>
            <span className="req-pill">{requirements.some(r=>r.type==='knowledge_collection' && r.required) ? '必需' : '可选'}</span>
          </div>
          {/* 多知识库挂载：每个选择一行，可新增 */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop: 8 }}>
            { (kbSelections.length ? kbSelections : ['']).map((val, idx) => {
              // 当前下拉的可选项：排除其他已选（保留当前值）
              const used = new Set(kbSelections.filter((_,i)=>i!==idx));
              const opts = (collections || []).filter(c => !used.has(c.id));
              return (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 36px', gap:8, alignItems:'center' }}>
                  <Select
                    style={{ width: '100%', borderRadius: 8 }}
                    value={val || undefined}
                    onChange={(v)=>{
                      const arr = [...kbSelections];
                      arr[idx] = v;
                      setKbSelections(arr);
                    }}
                    allowClear
                    placeholder={idx===0 ? '选择知识库' : '选择附加知识库'}
                    size="large"
                    optionLabelProp="label"
                    options={opts.map(c => ({
                      value: c.id,
                      label: (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <Tag color="geekblue" style={{ marginRight: 8 }}>{c.name}</Tag>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                            <Tag color="blue">{c.document_count ?? 0} 文档</Tag>
                            <Tooltip title={c.id} placement="left">
                              <span style={{ fontSize: 12, color: '#64748b' }}>ID: {truncateMiddle(c.id)}</span>
                            </Tooltip>
                          </span>
                        </div>
                      )
                    }))}
                  />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {idx>0 ? (
                      <Button size="large" icon={<CloseOutlined />} onClick={()=>removeKbSelection(idx)} />
                    ) : (
                      <Button size="large" icon={<PlusOutlined />} onClick={addKbSelection} disabled={(collections||[]).length <= kbSelections.length} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {useQARouting && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              {/* 路由模板选择/应用（仅启用问答路由时显示） */}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>路由模板</Typography.Text>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop: 6 }}>
                <Select size="small" style={{ flex:1 }} value={activeTplId} onChange={setActiveTplId}
                  options={(kbTemplates||[]).map((t:any)=>({ value:t.id, label:t.template_name }))} placeholder="选择模板" />
                {activeTpl?.mode && (
                  <Tag color={String(activeTpl.mode).toLowerCase()==='force' ? 'red' : String(activeTpl.mode).toLowerCase()==='custom' ? 'gold' : 'blue'}>
                    模式：{String(activeTpl.mode).toLowerCase()==='force' ? '强制' : String(activeTpl.mode).toLowerCase()==='custom' ? '自定义' : '平衡'}
                  </Tag>
                )}
                {activeTpl?.mode === 'custom' && (
                  <Button size="small" onClick={openWeights}>权重设置</Button>
                )}
                <Button size="small" type="link" onClick={goRoutingEditor}>前往路由编辑</Button>
              </div>
            </>
          )}

          <Divider style={{ margin: '12px 0' }} />
          {/* 检索策略开关（路由/数据源） */}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>检索策略</Typography.Text>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop: 8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'8px 10px', border:'1px solid #eef2f7', borderRadius: 8, background:'#fff' }}>
              <span style={{ color:'#64748b' }}>启用问答路由</span>
              <Switch size="small" checked={!!useQARouting} onChange={(v)=>setUseQARouting && setUseQARouting(v)} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'8px 10px', border:'1px solid #eef2f7', borderRadius: 8, background:'#fff' }}>
              <span style={{ color:'#64748b' }}>检索文档</span>
              <Switch size="small" checked={includeDocuments !== false} onChange={(v)=>setIncludeDocuments && setIncludeDocuments(v)} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'8px 10px', border:'1px solid #eef2f7', borderRadius: 8, background:'#fff' }}>
              <span style={{ color:'#64748b' }}>检索QA数据集</span>
              <Switch size="small" checked={includeQADatasets !== false} onChange={(v)=>setIncludeQADatasets && setIncludeQADatasets(v)} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'8px 10px', border:'1px solid #eef2f7', borderRadius: 8, background:'#fff' }}>
              <span style={{ color:'#64748b' }}>启用重排序</span>
              <Switch size="small" checked={useReranking !== false} onChange={(v)=>setUseReranking && setUseReranking(v)} />
            </div>
          </div>

          {useQARouting && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>检索路径（按顺序执行）</Typography.Text>
              {!collectionId && <Alert type="info" showIcon message="请选择知识库后加载检索路径" style={{ marginTop: 8 }} />}
              {collectionId && kbPaths.length === 0 && <Alert type="warning" showIcon message="该知识库尚未配置检索路径，系统将使用默认策略" style={{ marginTop: 8 }} />}
              {collectionId && kbPaths.length > 0 && (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, marginTop: 8 }}>
                  {kbPaths.map((rp, idx) => (
                    <div key={rp.id} style={{ display:'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems:'center', padding: '8px 6px', borderBottom: idx === kbPaths.length-1 ? 'none' : '1px dashed #f0f0f0' }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{
                          display:'inline-flex', width:22, height:22, borderRadius:11,
                          background:'#eef2ff', color:'#4338ca', fontSize:12, alignItems:'center', justifyContent:'center'
                        }}>{rp.path_order}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{rp.path_name}</div>
                          <div style={{ fontSize:12, color:'#64748b' }}>
                            来源：{rp.source_type === 'qa_routes' ? '问答路由' : rp.source_type === 'qa_datasets' ? 'QA数据集' : '知识文档'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Space size={8}>
                          <Tag color={rp.is_enabled ? 'green' : 'red'}>{rp.is_enabled ? '启用' : '停用'}</Tag>
                          <Button size="small" onClick={()=>openDetail(rp)}>详情</Button>
                        </Space>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showGraph && (
        <div className="studio-section settings-group-knowledge">
          <div className="section-header graph">
            <NodeIndexOutlined style={{ marginRight: 6 }} />
            <span>图谱检索</span>
            <span className="req-pill">{requirements.some(r=>r.type==='graph_service' && r.required) ? '必需' : '可选'}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop: 8 }}>
            <div>
              <span className="setting-label" style={{ fontSize: 12, color:'#64748b' }}>检索触发</span>
              <Select
                size="large"
                value={graphMode}
                onChange={(v)=>setGraphMode(v as any)}
                style={{ width:'100%', marginTop: 6, borderRadius: 8 }}
                options={[
                  { value: 'auto', label: '自动（使用对话输入作为检索）' },
                  { value: 'fixed', label: '固定（始终使用预设查询）' }
                ]}
              />
            </div>
            <div>
              <span className="setting-label" style={{ fontSize: 12, color:'#64748b' }}>检索模式</span>
              <Select
                size="large"
                value={graphQueryMode}
                onChange={(v)=>setGraphQueryMode(v as any)}
                style={{ width:'100%', marginTop: 6, borderRadius: 8 }}
                options={[
                  { value:'mix', label:'mix（推荐）' },
                  { value:'local', label:'local（实体为主）' },
                  { value:'global', label:'global（关系为主）' },
                  { value:'hybrid', label:'hybrid' },
                  { value:'naive', label:'naive' },
                  { value:'bypass', label:'bypass' },
                ]}
              />
            </div>
          </div>
          {graphMode === 'fixed' && (
            <div className="field-group" style={{ marginTop: 10 }}>
              <span className="setting-label" style={{ fontSize: 12, color:'#64748b' }}>固定查询</span>
              <TextArea
                rows={2}
                value={graphFixedQuery}
                onChange={(e)=>setGraphFixedQuery(e.target.value)}
                placeholder="请输入固定检索的查询文本..."
                className="styled-textarea"
              />
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop: 10 }}>
            <div>
              <span className="setting-label" style={{ fontSize: 12, color:'#64748b' }}>TopK</span>
              <InputNumber min={1} max={200} value={graphTopK} onChange={(v)=>setGraphTopK(Number(v||0))} style={{ width:'100%', marginTop: 6, borderRadius: 8 }} />
            </div>
            <div>
              <span className="setting-label" style={{ fontSize: 12, color:'#64748b' }}>Chunk TopK</span>
              <InputNumber min={1} max={200} value={graphChunkTopK} onChange={(v)=>setGraphChunkTopK(Number(v||0))} style={{ width:'100%', marginTop: 6, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      )}

      {!hideMetadata && (
        <div className="studio-section settings-group-knowledge">
          <Text type="secondary" className="setting-label">元数据</Text>
          <Select
            value={useMetadata ? 'enable':'disable'}
            onChange={(v)=>setUseMetadata && setUseMetadata(v==='enable')}
            style={{ width:'100%', marginTop: 8, borderRadius: 8 }}
            size="large"
          >
            <Option value="disable">禁用</Option>
            <Option value="enable">启用</Option>
          </Select>
        </div>
      )}

      {/* 系统提示词已迁移至“提示词”Tab */}

      <div className="studio-section settings-group-advanced">
        <Text type="secondary" className="setting-label">相似度阈值</Text>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginTop: 8 }}>
          <Slider min={0} max={1} step={0.01} value={simThreshold} onChange={setSimThreshold} style={{ flex:1 }} />
          <InputNumber min={0} max={1} step={0.01} value={simThreshold} onChange={(v)=>setSimThreshold(Number(v))} style={{ borderRadius: 6 }} />
        </div>
      </div>

      <div className="studio-section settings-group-advanced">
        <Text type="secondary" className="setting-label">相似度权重</Text>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginTop: 8 }}>
          <Slider min={0} max={1} step={0.01} value={simWeight} onChange={setSimWeight} style={{ flex:1 }} />
          <InputNumber min={0} max={1} step={0.01} value={simWeight} onChange={(v)=>setSimWeight(Number(v))} style={{ borderRadius: 6 }} />
        </div>
      </div>

      <div className="studio-section settings-group-advanced">
        <Text type="secondary" className="setting-label">Top N</Text>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginTop: 8 }}>
          <Slider min={1} max={20} step={1} value={topN} onChange={setTopN} style={{ flex:1 }} />
          <InputNumber min={1} max={100} step={1} value={topN} onChange={(v)=>setTopN(Number(v))} style={{ borderRadius: 6 }} />
        </div>
      </div>

      <div className="studio-section settings-group-advanced">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
          <Text className="setting-label" style={{ margin: 0 }}>多轮对话优化</Text>
          <Switch checked={multiTurn} onChange={setMultiTurn} />
        </div>
        {multiTurn && (
          <div style={{ display:'flex', gap:14, alignItems:'center', marginTop: 12 }}>
            <Text className="setting-label" style={{ margin: 0 }}>最大轮数</Text>
            <Slider min={1} max={30} step={1} value={maxRounds} onChange={(v)=>setMaxRounds(Number(v))} style={{ flex:1 }} />
            <InputNumber min={1} max={50} step={1} value={maxRounds} onChange={(v)=>setMaxRounds(Number(v))} style={{ borderRadius: 6 }} />
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', marginTop: 16 }}>
          <Text className="setting-label" style={{ margin: 0 }}>推理</Text>
          <Switch checked={reasoning} onChange={setReasoning} />
        </div>
      </div>

      {/* 跨知识库卡片移除：通过多个挂载选择框替代 */}
      {/* 详情弹窗 */}
    <Modal open={showDetail} onCancel={()=>setShowDetail(false)} onOk={()=>setShowDetail(false)} title="路径详情" width={680}>
      {detailPath ? (
        <div style={{ lineHeight: 1.9 }}>
          <div>顺序：{detailPath.path_order}</div>
          <div>名称：{detailPath.path_name}</div>
          <div>来源：{detailPath.source_type}</div>
          <div>状态：{detailPath.is_enabled ? '启用' : '停用'}</div>
          <div>最小置信：{detailPath.min_confidence}</div>
          <div>最大结果：{detailPath.max_results}</div>
          <div>失败动作：{detailPath.fallback_action}</div>
          <div style={{ marginTop: 8 }}>执行设计（只读）：</div>
          <pre style={{ background:'#f8fafc', padding:10, borderRadius:6, maxHeight:220, overflow:'auto' }}>{JSON.stringify(detailPath.config, null, 2)}</pre>
          <Alert type="info" showIcon message="如需修改路径或配置，请前往“问答路由”页面进行编辑。" />
        </div>
      ) : null}
    </Modal>

    {/* 权重设置（仅自定义模式） */}
    <Modal open={showWeights} onCancel={()=>setShowWeights(false)} onOk={saveWeights} title="自定义权重设置" width={520} okText="保存">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:12 }}>
        {kbPaths.map(p => (
          <React.Fragment key={p.id}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontWeight: 600 }}>{p.path_name}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{p.source_type}</span>
            </div>
            <InputNumber min={0} max={10} step={0.1} value={weights[p.path_name] ?? 1.0} onChange={(v)=>setWeights(prev=>({ ...prev, [p.path_name]: Number(v||0) }))} />
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Alert type="info" showIcon message="这些权重会保存到当前选中模板（自定义模式）用于结果聚合重排。" />
      </div>
    </Modal>
    </div>
  );
};

export default BasicSettingsSection;
