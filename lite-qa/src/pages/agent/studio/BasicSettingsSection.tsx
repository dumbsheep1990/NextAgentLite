import React, { useEffect, useState } from 'react';
import { Select, Switch, Input, InputNumber, Slider, Typography, Space, Divider, Alert, Tooltip } from 'antd';
import type { RetrievalPath } from '../../../services/qaRoutingService';
import { getRetrievalPaths, getKBTemplates, applyTemplateById, updateTemplate } from '../../../services/qaRoutingService';
import { Button, Modal, Tag } from 'antd';
import { BookOutlined, NodeIndexOutlined } from '@ant-design/icons';

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
  } = props;
  // 是否显示知识库绑定：严格依据上层模板/需求判断
  const shouldShowKnowledge = !!showKnowledge;

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
      if (!collectionId) { setKbPaths([]); return; }
      try {
        const list = await getRetrievalPaths(collectionId); setKbPaths(list||[]);
        const tpls = await getKBTemplates(collectionId); setKbTemplates(tpls||[]);
        const def = (tpls||[]).find((t:any)=>t.is_default) || (tpls||[])[0];
        setActiveTplId(def?.id);
      } catch { setKbPaths([]); setKbTemplates([]); setActiveTplId(undefined); }
    })();
  }, [collectionId]);

  // 选择模板后自动应用到检索路径（减少“模板已选但无路径”的困惑）
  useEffect(() => {
    (async () => {
      if (!collectionId || !activeTplId) return;
      try {
        await applyTemplateById(activeTplId);
        const list = await getRetrievalPaths(collectionId);
        setKbPaths(list || []);
      } catch {}
    })();
  }, [activeTplId, collectionId]);
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
          <Select
            style={{ width: '100%', marginTop: 8, borderRadius: 8 }}
            value={collectionId}
            onChange={setCollectionId}
            allowClear
            placeholder="选择知识库"
            size="large"
            optionLabelProp="label"
            options={collections.map(c => ({
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

          <Divider style={{ margin: '12px 0' }} />
          {/* 路由模板选择/应用 */}
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

      {props.showCrossKnowledge !== false && (
        <div className="studio-section settings-group-knowledge">
          <Text type="secondary" className="setting-label">跨知识库搜索（可多选）</Text>
          <Select
            mode="multiple"
            value={crossCollections}
            onChange={setCrossCollections}
            placeholder="选择需要联动检索的知识库"
            size="large"
            style={{ width: '100%', borderRadius: 8 }}
            options={collections.map(c => ({
              value: c.id,
              label: (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Tag color="geekblue" style={{ marginRight: 8 }}>{c.name}</Tag>
                  <Tooltip title={c.id} placement="left">
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: {truncateMiddle(c.id)}</span>
                  </Tooltip>
                </div>
              )
            }))}
          />
        </div>
      )}
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
