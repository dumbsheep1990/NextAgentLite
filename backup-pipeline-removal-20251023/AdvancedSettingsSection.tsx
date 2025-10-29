import React, { useEffect, useState } from 'react';
import { Select, Switch, Input, InputNumber, Button, Space, Typography, Segmented, Collapse, message, Alert, Tag, Divider } from 'antd';
import axios from 'axios';

const { Text } = Typography;

export type MetadataFilter = {
  key: string;
  op: '='|'!='|'>'|'>='|'<'|'<='|'in'|'contains';
  value: string;
};

export interface AdvancedSettingsProps {
  kbId?: string;
  useMetadata: boolean;
  setUseMetadata: (v: boolean) => void;
  metadataFilters: MetadataFilter[];
  setMetadataFilters: (v: MetadataFilter[]) => void;
  hiragEnabled: boolean;
  setHiragEnabled: (v: boolean) => void;
  // Agentic Filters
  enableAgenticFilters?: boolean;
  setEnableAgenticFilters?: (v: boolean) => void;
  // Hook Pipeline配置
  pipelineId?: string;
  setPipelineId?: (v: string) => void;
  enablePreHooks?: boolean;
  setEnablePreHooks?: (v: boolean) => void;
  enablePostHooks?: boolean;
  setEnablePostHooks?: (v: boolean) => void;
  // 总结输出风格（Agentic Search 配置）
  summaryIntroMax: number;
  setSummaryIntroMax: (v: number) => void;
  summaryPointMax: number;
  setSummaryPointMax: (v: number) => void;
  summaryPointsMin: number;
  setSummaryPointsMin: (v: number) => void;
  summaryPointsMax: number;
  setSummaryPointsMax: (v: number) => void;
  summarySourcesMax: number;
  setSummarySourcesMax: (v: number) => void;
}

const AdvancedSettingsSection: React.FC<AdvancedSettingsProps> = (p) => {
  const ops: MetadataFilter['op'][] = ['=','!=','>','>=','<','<=','in','contains'];
  // 自定义过滤独立维护
  const [customFilters, setCustomFilters] = useState<MetadataFilter[]>([]);
  const addCustom = () => setCustomFilters(prev => ([...prev, { key:'', op:'=', value:'' }]));
  const rmCustom = (i: number) => setCustomFilters(prev => prev.filter((_,idx)=>idx!==i));
  const updCustom = (i: number, patch: Partial<MetadataFilter>) => {
    setCustomFilters(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch } as MetadataFilter;
      return next;
    });
  };

  // Hook Pipeline状态
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  // 加载Hook Pipelines
  useEffect(() => {
    (async () => {
      setLoadingPipelines(true);
      try {
        const { data } = await axios.get('/api/v1/hook-pipelines');
        setPipelines(data || []);
      } catch (e: any) {
        message.error(`加载Hook Pipeline列表失败: ${e?.message || '未知错误'}`);
        setPipelines([]);
      } finally {
        setLoadingPipelines(false);
      }
    })();
  }, []);

  // 加载选中的Pipeline详情
  useEffect(() => {
    (async () => {
      if (!p.pipelineId) {
        setSelectedPipeline(null);
        return;
      }
      try {
        const { data } = await axios.get(`/api/v1/hook-pipelines/${p.pipelineId}`);
        setSelectedPipeline(data);
      } catch (e: any) {
        console.error('加载Pipeline详情失败:', e);
        setSelectedPipeline(null);
      }
    })();
  }, [p.pipelineId]);

  useEffect(() => {
    (async () => {
      if (!p.kbId) return;
      try {
        const sf = await axios.get(`/api/v1/knowledge_collections/${encodeURIComponent(p.kbId)}/scenario-filters`).then(r=>r.data).catch(()=>null);
        setScenario(sf);
      } catch (e) {
        // ignore
      }
    })();
  }, [p.kbId]);

  const [scenario, setScenario] = useState<any>(null);
  const [opByKey, setOpByKey] = useState<Record<string,string>>({});
  const setOp = (key: string, op: string) => setOpByKey(prev => ({ ...prev, [key]: op }));
  // 分离开关与各自的过滤集合
  const [scenarioEnabled, setScenarioEnabled] = useState(true);
  const [genericEnabled, setGenericEnabled] = useState(true);
  const [scenFilters, setScenFilters] = useState<MetadataFilter[]>([]);
  const [genFilters, setGenFilters] = useState<MetadataFilter[]>([]);
  const templateLabel = (tpl?: string) => {
    const t = (tpl||'').toLowerCase();
    if (t === 'academic') return '学术';
    if (t === 'policy') return '政策';
    if (t === 'education') return '教育';
    return '通用';
  };

  // 初次载入或场景变化时，尝试将父层的 filters 拆分为三类（场景/通用/自定义）
  useEffect(() => {
    if (!scenario) return;
    const scenKeys = new Set((scenario.fields||[]).map((f:any)=> String(f.key)));
    const genKeys  = new Set((scenario.generic||[]).map((f:any)=> String(f.key)));
    const src = p.metadataFilters || [];
    const sf: MetadataFilter[] = []; const gf: MetadataFilter[] = []; const cf: MetadataFilter[] = [];
    src.forEach(f => {
      if (scenKeys.has(f.key)) sf.push(f);
      else if (genKeys.has(f.key)) gf.push(f);
      else cf.push(f);
    });
    setScenFilters(sf);
    setGenFilters(gf);
    setCustomFilters(cf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(scenario)]);

  // 合并三类过滤并回传
  useEffect(() => {
    if (!p.useMetadata) { p.setMetadataFilters([]); return; }
    const merged: MetadataFilter[] = [
      ...(scenarioEnabled ? scenFilters : []),
      ...(genericEnabled ? genFilters : []),
      ...customFilters,
    ];
    p.setMetadataFilters(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.useMetadata, scenarioEnabled, genericEnabled, JSON.stringify(scenFilters), JSON.stringify(genFilters), JSON.stringify(customFilters)]);

  return (
    <div>
      {/* Hook Pipeline配置 */}
      <div className="studio-section settings-group-knowledge">
        <div className="section-header">
          <span>Hook Pipeline</span>
          <span className="req-pill hollow">Pre/Post Hooks</span>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div className="studio-row">
            <span>选择Hook Pipeline</span>
            <Select
              style={{ width: 300 }}
              placeholder="选择Pipeline（可选）"
              loading={loadingPipelines}
              allowClear
              value={p.pipelineId || undefined}
              onChange={(v) => p.setPipelineId && p.setPipelineId(v || '')}
              options={pipelines.map((pipeline) => ({
                value: pipeline.id || pipeline.pipeline_name,
                label: `${pipeline.pipeline_name} (${pipeline.scenario || 'general'})`,
              }))}
            />
          </div>

          {p.pipelineId && (
            <>
              <div className="studio-row">
                <span>启用 Pre-Hooks</span>
                <Switch
                  checked={!!p.enablePreHooks}
                  onChange={(v) => p.setEnablePreHooks && p.setEnablePreHooks(v)}
                />
              </div>
              <div className="studio-row">
                <span>启用 Post-Hooks</span>
                <Switch
                  checked={!!p.enablePostHooks}
                  onChange={(v) => p.setEnablePostHooks && p.setEnablePostHooks(v)}
                />
              </div>

              {selectedPipeline && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                    Pipeline描述：{selectedPipeline.description || '无描述'}
                  </Text>
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: 'hooks-detail',
                        label: 'Hook配置详情',
                        children: (
                          <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {p.enablePreHooks && (
                              <div>
                                <Text strong>Pre-Hooks:</Text>
                                {selectedPipeline.pre_hooks_config?.length > 0 ? (
                                  <div style={{ marginTop: 4 }}>
                                    {selectedPipeline.pre_hooks_config.map((hook: any, idx: number) => (
                                      <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                                        {idx + 1}. {hook.hook_id}
                                      </Tag>
                                    ))}
                                  </div>
                                ) : (
                                  <Text type="secondary"> 无</Text>
                                )}
                              </div>
                            )}
                            {p.enablePostHooks && (
                              <div>
                                <Text strong>Post-Hooks:</Text>
                                {selectedPipeline.post_hooks_config?.length > 0 ? (
                                  <div style={{ marginTop: 4 }}>
                                    {selectedPipeline.post_hooks_config.map((hook: any, idx: number) => (
                                      <Tag key={idx} color="green" style={{ marginBottom: 4 }}>
                                        {idx + 1}. {hook.hook_id}
                                      </Tag>
                                    ))}
                                  </div>
                                ) : (
                                  <Text type="secondary"> 无</Text>
                                )}
                              </div>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </>
          )}

          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            Hook Pipeline允许在问答流程的前后执行自定义处理逻辑（如意图分析、检索策略路由、引用格式化等）。
          </Text>
        </Space>
      </div>

      {/* Agentic Filters */}
      <div className="studio-section settings-group-knowledge">
        <div className="section-header">
          <span>Agentic 过滤</span>
          <span className="req-pill hollow">自动抽取元数据</span>
        </div>
        <div className="studio-row">
          <span>启用 Agentic Filters</span>
          <Switch checked={!!p.enableAgenticFilters} onChange={(v)=>p.setEnableAgenticFilters && p.setEnableAgenticFilters(v)} />
        </div>
        <Text type="secondary" style={{ display:'block', marginTop: 6, fontSize: 12 }}>
          启用后，系统会从查询中自动抽取如用户ID、文档类型、年份等元数据过滤（支持递减放宽）。
        </Text>
      </div>
      {/* 检索路径与路由设置已移动到"基础配置 > 知识库绑定"卡片下方，这里只保留元数据与高级设置。 */}

      <div className="studio-section settings-group-knowledge">
        <div className="section-header">
          <span>元数据标量过滤（场景 + 通用）</span>
          <span className="req-pill hollow">可选</span>
        </div>
        <div className="studio-row" style={{ marginBottom: 10 }}>
          <span>启用元数据过滤</span>
          <Switch checked={p.useMetadata} onChange={(v)=>{
            if (v && !p.kbId) {
              message.warning('请先选择知识库再启用元数据过滤');
              return; // 阻止开启
            }
            p.setUseMetadata(v);
          }} />
        </div>
        {p.useMetadata && !p.kbId && (
          <Alert type="warning" showIcon message="未选择知识库，无法配置元数据过滤。请选择知识库后再试。" />
        )}
        {p.useMetadata && p.kbId && (
          <>
            {scenario && (
              <>
                <Text type="secondary" style={{ display:'block', marginBottom: 6 }}>场景：<Tag color="blue">{templateLabel(scenario.template)}</Tag></Text>
                {/* 场景专有过滤 */}
                <div className="studio-row" style={{ marginBottom: 8 }}>
                  <span>启用场景专有过滤</span>
                  <Switch checked={scenarioEnabled} onChange={setScenarioEnabled} />
                </div>
                {scenarioEnabled && (
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  {/* 场景专属字段 */}
                  {(scenario.fields || []).map((f:any, idx:number) => (
                    <Space key={idx} style={{ display:'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8 }}>
                      <Input disabled value={f.label} />
                      <Select
                        value={opByKey[f.key] || (f.ops?.[0] || '=')}
                        options={(f.ops||['=']).map((o:string)=>({value:o,label:o}))}
                        onChange={(v)=> setOp(f.key, v)}
                      />
                      <Input placeholder={`输入${f.label}`} onBlur={(e)=>{
                        const v = e.target.value?.trim();
                        if (!v) return;
                        const nv: MetadataFilter = { key: f.key, op: (opByKey[f.key] || (f.ops||['='])[0]), value: v };
                        setScenFilters(prev => [...prev.filter(x=>x.key!==nv.key), nv]);
                      }} />
                      <Button size="small" onClick={()=>{
                        setScenFilters(prev => prev.filter(x=>x.key!==f.key));
                      }}>清除</Button>
                    </Space>
                  ))}
                  {(scenFilters && scenFilters.length>0) && (
                    <div>
                      <Text type="secondary" style={{ marginRight: 8 }}>已添加（场景）:</Text>
                      <Space wrap>
                        {scenFilters.map((f, idx) => (
                          <Tag key={`sf-${idx}`} closable onClose={(e)=>{ e.preventDefault(); setScenFilters(prev => prev.filter((_,i)=>i!==idx)); }}>
                            {f.key} {f.op} {String(f.value)}
                          </Tag>
                        ))}
                        <Button size="small" onClick={()=> setScenFilters([])}>清空</Button>
                      </Space>
                    </div>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                </Space>
                )}
                {/* 通用字段 */}
                <div className="studio-row" style={{ marginBottom: 8 }}>
                  <span>启用通用过滤</span>
                  <Switch checked={genericEnabled} onChange={setGenericEnabled} />
                </div>
                {genericEnabled && (
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  {(scenario.generic || []).map((f:any, idx:number) => (
                    <Space key={`g-${idx}`} style={{ display:'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8 }}>
                      <Input disabled value={`通用 · ${f.label}`} />
                      <Select
                        value={opByKey[f.key] || (f.ops?.[0] || '=')}
                        options={(f.ops||['=']).map((o:string)=>({value:o,label:o}))}
                        onChange={(v)=> setOp(f.key, v)}
                      />
                      <Input placeholder={`输入${f.label}`} onBlur={(e)=>{
                        const v = e.target.value?.trim(); if (!v) return;
                        const nv: MetadataFilter = { key: f.key, op: (opByKey[f.key] || (f.ops||['='])[0]), value: v };
                        setGenFilters(prev => [...prev.filter(x=>x.key!==nv.key), nv]);
                      }} />
                      <Button size="small" onClick={()=>{
                        setGenFilters(prev => prev.filter(x=>x.key!==f.key));
                      }}>清除</Button>
                    </Space>
                  ))}
                  {(genFilters && genFilters.length>0) && (
                    <div>
                      <Text type="secondary" style={{ marginRight: 8 }}>已添加（通用）:</Text>
                      <Space wrap>
                        {genFilters.map((f, idx) => (
                          <Tag key={`gf-${idx}`} closable onClose={(e)=>{ e.preventDefault(); setGenFilters(prev => prev.filter((_,i)=>i!==idx)); }}>
                            {f.key} {f.op} {String(f.value)}
                          </Tag>
                        ))}
                        <Button size="small" onClick={()=> setGenFilters([])}>清空</Button>
                      </Space>
                    </div>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                </Space>
                )}
                <div style={{height:8}} />
                <Alert type="info" showIcon message="提示：仅当文档包含对应结构化元数据时该过滤才会生效；系统会自动回退到可用的通用字段。" />
              </>
            )}
            {/* 自定义过滤 */}
            <Divider orientation="left" style={{ margin: '10px 0' }}>自定义过滤</Divider>
            {customFilters.map((f, i) => (
              <Space key={i} style={{ display:'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8, marginBottom: 8 }}>
                <Input placeholder="字段名" value={f.key} onChange={(e)=>updCustom(i,{key: e.target.value})} />
                <Select value={f.op} onChange={(v)=>updCustom(i,{op: v})} options={ops.map(o=>({value:o,label:o}))} />
                <Input placeholder="值（in 请用逗号分隔）" value={f.value} onChange={(e)=>updCustom(i,{value:e.target.value})} />
                <Button danger size="small" onClick={()=>rmCustom(i)}>删除</Button>
              </Space>
            ))}
            <Button type="dashed" size="small" onClick={addCustom}>添加过滤条件</Button>
          </>
        )}
      </div>

      <div className="studio-section settings-group-model">
        <div className="section-header">
          <span>总结输出风格（Agentic Search）</span>
          <span className="req-pill hollow">高级</span>
        </div>
        <Space direction="vertical" style={{ width:'100%' }} size={10}>
          <Space style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:8 }}>
            <Text type="secondary">整体摘要最大字数</Text>
            <InputNumber min={30} max={500} value={p.summaryIntroMax} onChange={(v)=>p.setSummaryIntroMax(Number(v||0))} />
          </Space>
          <Space style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:8 }}>
            <Text type="secondary">单条要点最大字数</Text>
            <InputNumber min={20} max={200} value={p.summaryPointMax} onChange={(v)=>p.setSummaryPointMax(Number(v||0))} />
          </Space>
          <Space style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr 140px', gap:8 }}>
            <Text type="secondary">要点条数下限</Text>
            <InputNumber min={1} max={10} value={p.summaryPointsMin} onChange={(v)=>p.setSummaryPointsMin(Number(v||0))} />
            <Text type="secondary">要点条数上限</Text>
            <InputNumber min={1} max={10} value={p.summaryPointsMax} onChange={(v)=>p.setSummaryPointsMax(Number(v||0))} />
          </Space>
          <Space style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:8 }}>
            <Text type="secondary">引用来源最大条数</Text>
            <InputNumber min={1} max={10} value={p.summarySourcesMax} onChange={(v)=>p.setSummarySourcesMax(Number(v||0))} />
          </Space>
          <Text type="secondary" style={{ display:'block', marginTop: 6, fontSize: 12 }}>
            这些设置仅用于“总结/综述/对比/步骤/列表”等意图，指导模型在依据资料的基础上进行归纳陈述；不会影响事实问答类输出。
          </Text>
        </Space>
      </div>

      {/* 恢复 HiRAG 检索设置（实验/占位） */}
      <div className="studio-section settings-group-model">
        <div className="section-header">
          <span>HiRAG 检索</span>
          <span className="req-pill hollow">实验</span>
        </div>
        <div className="studio-row">
          <span>启用 HiRAG</span>
          <Switch checked={p.hiragEnabled} onChange={p.setHiragEnabled} />
        </div>
        <Text type="secondary" style={{ display:'block', marginTop: 8, fontSize: 12 }}>
          HiRAG（分层检索增强生成）为实验性功能：后续将支持层级召回、逐层重排与上下文合成。当前仅暴露开关，具体执行策略将在工作流中按需接入。
        </Text>
      </div>
    </div>
  );
};

export default AdvancedSettingsSection;
