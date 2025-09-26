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
      {/* 检索路径与路由设置已移动到“基础配置 > 知识库绑定”卡片下方，这里只保留元数据与高级设置。 */}

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
          <span>HiRAG 检索（占位）</span>
          <span className="req-pill hollow">预研中</span>
        </div>
        <div className="studio-row">
          <span>启用 HiRAG</span>
          <Switch checked={p.hiragEnabled} onChange={p.setHiragEnabled} />
        </div>
        <Text type="secondary" style={{ display:'block', marginTop: 8, fontSize: 12 }}>
          HiRAG（分层检索增强生成）暂未实现，当前仅做配置占位，后续将支持层级召回、逐层 rerank 与上下文合成。
        </Text>
      </div>
    </div>
  );
};

export default AdvancedSettingsSection;
