import React, { useEffect, useState } from 'react';
import { Select, Switch, Input, InputNumber, Slider, Typography, Space, Divider, Alert, Tooltip, Button, Modal, Tag } from 'antd';
import { BookOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { RetrievalPath } from '../../../services/qaRoutingService';
import { getRetrievalPaths, getKBTemplates, applyTemplateById, updateTemplate } from '../../../services/qaRoutingService';

const { TextArea } = Input;
const { Text } = Typography;

// 最大字符显示数
const MAX_ID_CHARS = 22;

// 将较长的 ID 做中间省略
function truncateMiddle(text: string, max = MAX_ID_CHARS) {
  if (!text) return '';
  if (text.length <= max) return text;
  const keep = Math.max(4, Math.floor((max - 3) / 2));
  return text.slice(0, keep) + '...' + text.slice(-keep);
}

export interface KnowledgeSettingsProps {
  collections: Array<{ id: string; name: string; document_count?: number }>;
  collectionId?: string;
  setCollectionId: (v?: string) => void;
  crossCollections: string[];
  setCrossCollections: (v: string[]) => void;
  // 检索策略开关
  useQARouting?: boolean;
  setUseQARouting?: (v: boolean) => void;
  includeDocuments?: boolean;
  setIncludeDocuments?: (v: boolean) => void;
  includeQADatasets?: boolean;
  setIncludeQADatasets?: (v: boolean) => void;
  useReranking?: boolean;
  setUseReranking?: (v: boolean) => void;
  // 检索参数配置
  simThreshold?: number;
  setSimThreshold?: (v: number) => void;
  simWeight?: number;
  setSimWeight?: (v: number) => void;
  topN?: number;
  setTopN?: (v: number) => void;
}

const KnowledgeSettingsSection: React.FC<KnowledgeSettingsProps> = (props) => {
  const {
    collections,
    collectionId,
    setCollectionId,
    crossCollections,
    setCrossCollections,
    useQARouting,
    setUseQARouting,
    includeDocuments,
    setIncludeDocuments,
    includeQADatasets,
    setIncludeQADatasets,
    useReranking,
    setUseReranking,
    simThreshold,
    setSimThreshold,
    simWeight,
    setSimWeight,
    topN,
    setTopN,
  } = props;

  // 与知识库绑定联动的检索路径
  const [kbPaths, setKbPaths] = useState<RetrievalPath[]>([]);
  const [kbTemplates, setKbTemplates] = useState<any[]>([]);
  const [activeTplId, setActiveTplId] = useState<string | undefined>(undefined);
  const activeTpl = kbTemplates.find((t: any) => t.id === activeTplId);

  // 详情弹窗
  const [showDetail, setShowDetail] = useState(false);
  const [detailPath, setDetailPath] = useState<any>(null);

  // 权重设置
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      if (!collectionId || !useQARouting) {
        setKbPaths([]);
        setKbTemplates([]);
        setActiveTplId(undefined);
        return;
      }
      try {
        const list = await getRetrievalPaths(collectionId);
        setKbPaths(list || []);
        const tpls = await getKBTemplates(collectionId);
        setKbTemplates(tpls || []);
        const def = (tpls || []).find((t: any) => t.is_default) || (tpls || [])[0];
        setActiveTplId(def?.id);
      } catch {
        setKbPaths([]);
        setKbTemplates([]);
        setActiveTplId(undefined);
      }
    })();
  }, [collectionId, useQARouting]);

  // 选择模板后自动应用
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
    const map: Record<string, number> = {};
    kbPaths.forEach((p) => {
      map[p.path_name] = weights[p.path_name] ?? 1.0;
    });
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

  // 多知识库挂载
  const kbSelections: string[] = [
    ...(collectionId ? [collectionId] : []),
    ...(crossCollections || []),
  ];

  const setKbSelections = (arr: string[]) => {
    const uniq = Array.from(new Set(arr.filter(Boolean)));
    const first = uniq[0];
    const rest = uniq.slice(1);
    setCollectionId(first);
    setCrossCollections(rest);
  };

  const addKbSelection = () => {
    const used = new Set(kbSelections);
    const candidate = (collections || []).find((c) => !used.has(c.id));
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
    const filtered = crossCollections.filter((id) => id !== collectionId);
    if (filtered.length !== crossCollections.length) {
      setCrossCollections(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  return (
    <div>
      <div className="studio-section settings-group-knowledge">
        <div className="section-header kb">
          <BookOutlined style={{ marginRight: 6 }} />
          <span>知识库绑定</span>
        </div>

        {/* 多知识库挂载 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {(kbSelections.length ? kbSelections : ['']).map((val, idx) => {
            const used = new Set(kbSelections.filter((_, i) => i !== idx));
            const opts = (collections || []).filter((c) => !used.has(c.id));
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 36px',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Select
                  style={{ width: '100%', borderRadius: 8 }}
                  value={val || undefined}
                  onChange={(v) => {
                    const arr = [...kbSelections];
                    arr[idx] = v;
                    setKbSelections(arr);
                  }}
                  allowClear
                  placeholder={idx === 0 ? '选择知识库' : '选择附加知识库'}
                  size="large"
                  optionLabelProp="label"
                  options={opts.map((c) => ({
                    value: c.id,
                    label: (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Tag color="geekblue" style={{ marginRight: 8 }}>
                          {c.name}
                        </Tag>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Tag color="blue">{c.document_count ?? 0} 文档</Tag>
                          <Tooltip title={c.id} placement="left">
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              ID: {truncateMiddle(c.id)}
                            </span>
                          </Tooltip>
                        </span>
                      </div>
                    ),
                  }))}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx > 0 ? (
                    <Button
                      size="large"
                      icon={<CloseOutlined />}
                      onClick={() => removeKbSelection(idx)}
                    />
                  ) : (
                    <Button
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={addKbSelection}
                      disabled={(collections || []).length <= kbSelections.length}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {useQARouting && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              路由模板
            </Typography.Text>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              <Select
                size="small"
                style={{ flex: 1 }}
                value={activeTplId}
                onChange={setActiveTplId}
                options={(kbTemplates || []).map((t: any) => ({
                  value: t.id,
                  label: t.template_name,
                }))}
                placeholder="选择模板"
              />
              {activeTpl?.mode && (
                <Tag
                  color={
                    String(activeTpl.mode).toLowerCase() === 'force'
                      ? 'red'
                      : String(activeTpl.mode).toLowerCase() === 'custom'
                      ? 'gold'
                      : 'blue'
                  }
                >
                  模式：
                  {String(activeTpl.mode).toLowerCase() === 'force'
                    ? '强制'
                    : String(activeTpl.mode).toLowerCase() === 'custom'
                    ? '自定义'
                    : '平衡'}
                </Tag>
              )}
              {activeTpl?.mode === 'custom' && (
                <Button size="small" onClick={openWeights}>
                  权重设置
                </Button>
              )}
              <Button size="small" type="link" onClick={goRoutingEditor}>
                前往路由编辑
              </Button>
            </div>
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* 检索策略开关 */}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          检索策略
        </Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid #eef2f7',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <span style={{ color: '#64748b' }}>启用问答路由</span>
            <Switch
              size="small"
              checked={!!useQARouting}
              onChange={(v) => setUseQARouting && setUseQARouting(v)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid #eef2f7',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <span style={{ color: '#64748b' }}>检索文档</span>
            <Switch
              size="small"
              checked={includeDocuments !== false}
              onChange={(v) => setIncludeDocuments && setIncludeDocuments(v)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid #eef2f7',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <span style={{ color: '#64748b' }}>检索QA数据集</span>
            <Switch
              size="small"
              checked={includeQADatasets !== false}
              onChange={(v) => setIncludeQADatasets && setIncludeQADatasets(v)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid #eef2f7',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <span style={{ color: '#64748b' }}>启用重排序</span>
            <Switch
              size="small"
              checked={useReranking !== false}
              onChange={(v) => setUseReranking && setUseReranking(v)}
            />
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 检索参数配置 */}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          检索参数
        </Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
          {/* Top N */}
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Top N</div>
            <InputNumber
              min={1}
              max={50}
              value={topN || 8}
              onChange={(v) => setTopN && setTopN(Number(v || 8))}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          {/* 相似度阈值 */}
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>相似度阈值</div>
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              value={simThreshold || 0.2}
              onChange={(v) => setSimThreshold && setSimThreshold(Number(v || 0.2))}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          {/* 相似度权重 */}
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>相似度权重</div>
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              value={simWeight || 0.3}
              onChange={(v) => setSimWeight && setSimWeight(Number(v || 0.3))}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
        </div>

        {useQARouting && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              检索路径（按顺序执行）
            </Typography.Text>
            {!collectionId && (
              <Alert
                type="info"
                showIcon
                message="请选择知识库后加载检索路径"
                style={{ marginTop: 8 }}
              />
            )}
            {collectionId && kbPaths.length === 0 && (
              <Alert
                type="warning"
                showIcon
                message="该知识库尚未配置检索路径，系统将使用默认策略"
                style={{ marginTop: 8 }}
              />
            )}
            {collectionId && kbPaths.length > 0 && (
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 8,
                }}
              >
                {kbPaths.map((rp, idx) => (
                  <div
                    key={rp.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 8,
                      alignItems: 'center',
                      padding: '8px 6px',
                      borderBottom: idx === kbPaths.length - 1 ? 'none' : '1px dashed #f0f0f0',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          background: '#eef2ff',
                          color: '#4338ca',
                          fontSize: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {rp.path_order}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rp.path_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          来源：
                          {rp.source_type === 'qa_routes'
                            ? '问答路由'
                            : rp.source_type === 'qa_datasets'
                            ? 'QA数据集'
                            : '知识文档'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Space size={8}>
                        <Tag color={rp.is_enabled ? 'green' : 'red'}>
                          {rp.is_enabled ? '启用' : '停用'}
                        </Tag>
                        <Button size="small" onClick={() => openDetail(rp)}>
                          详情
                        </Button>
                      </Space>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      <Modal
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        onOk={() => setShowDetail(false)}
        title="路径详情"
        width={680}
      >
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
            <pre
              style={{
                background: '#f8fafc',
                padding: 10,
                borderRadius: 6,
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(detailPath.config, null, 2)}
            </pre>
            <Alert
              type="info"
              showIcon
              message='如需修改路径或配置，请前往"问答路由"页面进行编辑。'
            />
          </div>
        ) : null}
      </Modal>

      {/* 权重设置 */}
      <Modal
        open={showWeights}
        onCancel={() => setShowWeights(false)}
        onOk={saveWeights}
        title="自定义权重设置"
        width={520}
        okText="保存"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
          {kbPaths.map((p) => (
            <React.Fragment key={p.id}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>{p.path_name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{p.source_type}</span>
              </div>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={weights[p.path_name] ?? 1.0}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [p.path_name]: Number(e.target.value || 0) }))
                }
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="这些权重会保存到当前选中模板（自定义模式）用于结果聚合重排。"
          />
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeSettingsSection;
