import React, { useEffect, useState } from 'react';
import { Select, Switch, Input, InputNumber, Button, Space, Typography, Segmented, Collapse, message, Alert, Tag, Divider } from 'antd';
import api from '../../../services/api'; // 修复：使用配置好的api实例

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

  // 新增：加载元数据标签
  const [metadataTags, setMetadataTags] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!p.kbId) return;
      try {
        // 加载场景过滤字段定义
        const sf = await api.get(`/collections/${encodeURIComponent(p.kbId)}/scenario-filters`).then(r=>r.data).catch(()=>null);
        setScenario(sf);

        // 加载文档实际的元数据标签
        const tags = await api.get(`/collections/${encodeURIComponent(p.kbId)}/metadata-tags`).then(r=>r.data).catch(()=>null);
        setMetadataTags(tags);
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
          <span>标签过滤（基于文档元数据）</span>
          <span className="req-pill hollow">可选</span>
        </div>
        <div className="studio-row" style={{ marginBottom: 10 }}>
          <span>启用标签过滤</span>
          <Switch checked={p.useMetadata} onChange={(v)=>{
            if (v && !p.kbId) {
              message.warning('请先选择知识库再启用标签过滤');
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
            {metadataTags && metadataTags.metadata_tags && Object.keys(metadataTags.metadata_tags).length > 0 && (
              <>
                <Text type="secondary" style={{ display:'block', marginBottom: 10 }}>
                  知识库：<Tag color="blue">{templateLabel(metadataTags.template)}</Tag>
                  <span style={{ marginLeft: 8 }}>可用标签字段：{metadataTags.total_fields} 个</span>
                </Text>
                {/* 标签字段列表 */}
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  {Object.entries(metadataTags.metadata_tags).map(([fieldKey, values]: [string, any], idx) => {
                    const fieldLabel = fieldKey === 'keywords' ? '关键词' :
                                     fieldKey === 'tags' ? '标签' :
                                     fieldKey === 'policy_category' ? '政策分类' :
                                     fieldKey === 'policy_title' ? '政策标题' :
                                     fieldKey === 'title' ? '标题' :
                                     fieldKey === 'language' ? '语言' :
                                     fieldKey === 'content_type' ? '内容类型' :
                                     fieldKey;
                    const ops = ['in', 'contains', '=', '!='];

                    return (
                      <Space key={`tag-${idx}`} style={{ display:'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8, alignItems: 'center' }}>
                        <Input
                          size="small"
                          disabled
                          value={fieldLabel}
                          style={{ height: '28px' }}
                        />
                        <Select
                          size="small"
                          value={opByKey[fieldKey] || 'in'}
                          options={ops.map(o=>({value:o,label:o}))}
                          onChange={(v)=> setOp(fieldKey, v)}
                          style={{ height: '28px' }}
                        />
                        <Select
                          size="small"
                          mode="tags"
                          placeholder={`选择${fieldLabel}（可多选）`}
                          options={Array.isArray(values) ? values.map((v: string) => ({value:v, label:v})) : []}
                          onChange={(selectedValues)=>{
                            if (selectedValues && selectedValues.length > 0) {
                              const nv: MetadataFilter = {
                                key: fieldKey,
                                op: (opByKey[fieldKey] || 'in') as MetadataFilter['op'],
                                value: selectedValues.join(',')
                              };
                              setScenFilters(prev => [...prev.filter(x=>x.key!==nv.key), nv]);
                            } else {
                              setScenFilters(prev => prev.filter(x=>x.key!==fieldKey));
                            }
                          }}
                          style={{ width: '100%', minHeight: '28px' }}
                          maxTagCount={3}
                        />
                        <Button size="small" onClick={()=>{
                          setScenFilters(prev => prev.filter(x=>x.key!==fieldKey));
                        }}>清除</Button>
                      </Space>
                    );
                  })}
                  {(scenFilters && scenFilters.length>0) && (
                    <div>
                      <Text type="secondary" style={{ marginRight: 8 }}>已添加标签过滤:</Text>
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
                </Space>
                <div style={{height:8}} />
                <Alert type="info" showIcon message="提示：标签值来自知识库中文档的实际元数据。支持多选，使用 'in' 操作符表示包含任一标签，'contains' 表示模糊匹配。" />
              </>
            )}
            {metadataTags && (!metadataTags.metadata_tags || Object.keys(metadataTags.metadata_tags).length === 0) && (
              <Alert type="warning" showIcon message="该知识库暂无文档元数据标签。请先上传文档并进行元数据提取。" />
            )}
            {!metadataTags && (
              <Alert type="info" showIcon message="正在加载元数据标签..." />
            )}
            {/* 自定义过滤 */}
            <Divider orientation="left" style={{ margin: '10px 0' }}>自定义过滤（手动输入）</Divider>
            {customFilters.map((f, i) => (
              <Space key={i} style={{ display:'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <Input size="small" placeholder="字段名" value={f.key} onChange={(e)=>updCustom(i,{key: e.target.value})} style={{ height: '28px' }} />
                <Select size="small" value={f.op} onChange={(v)=>updCustom(i,{op: v})} options={ops.map(o=>({value:o,label:o}))} style={{ height: '28px' }} />
                <Input size="small" placeholder="值（in 请用逗号分隔）" value={f.value} onChange={(e)=>updCustom(i,{value:e.target.value})} style={{ height: '28px' }} />
                <Button danger size="small" onClick={()=>rmCustom(i)}>删除</Button>
              </Space>
            ))}
            <Button type="dashed" size="small" onClick={addCustom}>添加自定义过滤</Button>
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
