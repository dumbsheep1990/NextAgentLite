import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api'; // 修复：使用配置好的api实例
import { Modal, Input, Select, Checkbox, Space, InputNumber, Divider, Typography, Switch, message, Alert, Steps, Card } from 'antd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '../../../components/knowledge/SortableItem';

const { Text } = Typography;

type WizardProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: any) => Promise<void> | void;
  kbId?: string;
};

// 定义检索层类型
type RetrievalLayer = {
  id: string;
  order: number;
  enabled: boolean;
  title: string;
  sourceType: string;
};

const TemplateWizard: React.FC<WizardProps> = ({ open, onClose, onCreate, kbId }) => {
  const [name, setName] = useState('默认模板');
  const [mode, setMode] = useState<'force'|'balanced'|'custom'>('balanced');

  // 使用可排序的检索层列表
  const [retrievalLayers, setRetrievalLayers] = useState<RetrievalLayer[]>([
    { id: 'manual_qa', order: 1, enabled: true, title: '自定义问答', sourceType: 'qa_datasets' },
    { id: 'auto_qa', order: 2, enabled: false, title: 'QA数据集', sourceType: 'qa_datasets' },
    { id: 'documents', order: 3, enabled: true, title: '知识库文档', sourceType: 'documents' },
    { id: 'kg', order: 4, enabled: false, title: '知识图谱', sourceType: 'kg' },
  ]);

  const [docRerank, setDocRerank] = useState(false);
  const [kgHost, setKgHost] = useState('http://localhost');
  const [kgPort, setKgPort] = useState<number | undefined>(9622);

  // 自定义权重（仅 custom 模式）
  const [wQADatasets, setWQADatasets] = useState<number>(1);
  const [wDocuments, setWDocuments] = useState<number>(1);
  const [wKG, setWKG] = useState<number>(1);

  // 数据集选择
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedManualDatasets, setSelectedManualDatasets] = useState<string[]>([]);
  const [selectedAutoDatasets, setSelectedAutoDatasets] = useState<string[]>([]);
  const manualDatasets = useMemo(() => (datasets || []).filter((d: any) => {
    const tag = d?.dataset_metadata?.tag || d?.category || '';
    return String(tag).includes('manual') || String(tag).includes('custom') || String(tag) === 'manual_custom';
  }), [datasets]);
  const autoDatasets = useMemo(() => (datasets || []).filter((d: any) => {
    const tag = d?.dataset_metadata?.tag || d?.category || '';
    return String(tag).includes('auto') || String(tag) === 'auto_extracted';
  }), [datasets]);

  useEffect(() => {
    const load = async () => {
      if (!open || !kbId) return;
      try {
        const { data } = await api.get(`/qa-dataset/list?collection_id=${kbId}&limit=100`);
        const list = Array.isArray(data?.datasets) ? data.datasets : [];
        setDatasets(list);
      } catch (e: any) {
        message.error(`加载数据集失败: ${e?.message || '未知错误'}`);
        setDatasets([]);
      }
    };
    load();
  }, [open, kbId]);

  // 获取便捷访问函数
  const useQADatasets = retrievalLayers.find(l => l.id === 'manual_qa')?.enabled || false;
  const useQADatasetsAuto = retrievalLayers.find(l => l.id === 'auto_qa')?.enabled || false;
  const useDocuments = retrievalLayers.find(l => l.id === 'documents')?.enabled || false;
  const useKG = retrievalLayers.find(l => l.id === 'kg')?.enabled || false;

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRetrievalLayers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // 重新计算order
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  // 切换层启用状态
  const toggleLayer = (id: string, checked: boolean) => {
    if (checked) {
      // 启用时的验证
      if (id === 'manual_qa' && manualDatasets.length === 0) {
        message.warning('当前知识库暂无"自定义问答"数据集，请先创建。');
        return;
      }
      if (id === 'auto_qa' && autoDatasets.length === 0) {
        message.warning('当前知识库暂无"QA数据集"，请先创建。');
        return;
      }
    }

    setRetrievalLayers((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: checked } : item
      )
    );
  };

  const paths = useMemo(() => {
    // 按照用户拖拽的顺序生成paths，只包含启用的层
    return retrievalLayers
      .filter(layer => layer.enabled)
      .map(layer => {
        const baseConfig: any = {
          path_name: layer.title,
          path_order: layer.order,
          source_type: layer.sourceType,
          is_enabled: true,
          fallback_action: 'continue',
          min_confidence: 0,
          max_results: 10,
        };

        // 根据不同的层类型配置config
        switch (layer.id) {
          case 'manual_qa':
            baseConfig.config = selectedManualDatasets.length
              ? { dataset_ids: selectedManualDatasets }
              : { dataset_tag: 'manual_custom' };
            break;
          case 'auto_qa':
            baseConfig.config = selectedAutoDatasets.length
              ? { dataset_ids: selectedAutoDatasets }
              : { dataset_tag: 'auto_extracted' };
            break;
          case 'documents':
            baseConfig.config = { search_mode: 'hybrid', top_k: 10, rerank: !!docRerank };
            break;
          case 'kg':
            baseConfig.config = { type: 'kg', host: kgHost, port: kgPort };
            baseConfig.source_type = 'documents'; // KG使用documents作为source_type
            break;
        }

        return baseConfig;
      });
  }, [retrievalLayers, docRerank, kgHost, kgPort, selectedManualDatasets, selectedAutoDatasets]);

  const weights = useMemo(() => {
    if (mode !== 'custom') return undefined;
    const m: Record<string, number> = {};
    if (useQADatasets || useQADatasetsAuto) m['qa_datasets'] = wQADatasets;
    if (useDocuments) m['documents'] = wDocuments;
    if (useKG) m['kg'] = wKG;
    return m;
  }, [mode, useQADatasets, useQADatasetsAuto, useDocuments, useKG, wQADatasets, wDocuments, wKG]);

  const nothingSelected = !retrievalLayers.some(layer => layer.enabled);

  // 获取启用的层ID列表用于排序
  const enabledLayerIds = useMemo(
    () => retrievalLayers.filter(layer => layer.enabled).map(layer => layer.id),
    [retrievalLayers]
  );

  return (
    <Modal
      title="模板向导"
      open={open}
      onCancel={onClose}
      onOk={async () => {
        await onCreate({ template_name: name, mode, paths, weights });
      }}
      okText="创建模板"
      okButtonProps={{ disabled: nothingSelected || !name.trim() }}
      width={860}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Steps size="small" current={2} items={[{ title: '基础信息' }, { title: '检索节点' }, { title: '模式/权重' }]} />
        <Space style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 6 }}>模板名称</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="模板名称" />
          </div>
          <div style={{ width: 240 }}>
            <div style={{ marginBottom: 6 }}>检索模式</div>
            <Select
              value={mode}
              onChange={(v) => setMode(v)}
              options={[
                { value: 'force', label: '强制（仅第一层）' },
                { value: 'balanced', label: '平衡（顺序检索）' },
                { value: 'custom', label: '自定义权重' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </Space>

        <Divider plain>检索层配置（拖拽调整顺序）</Divider>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* 左侧：启用检索层的复选框 */}
          <div style={{ width: 260, border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
            {retrievalLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => toggleLayer(layer.id, !layer.enabled)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 6px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  background: layer.enabled ? '#f6ffed' : undefined,
                  marginBottom: 4,
                }}
              >
                <Checkbox
                  checked={layer.enabled}
                  onChange={(e) => toggleLayer(layer.id, e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                {layer.title}
              </div>
            ))}
          </div>

          {/* 右侧：可拖拽排序的检索层配置 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={enabledLayerIds}
                strategy={verticalListSortingStrategy}
              >
                {retrievalLayers.map((layer) => {
                  const layerOrder = retrievalLayers
                    .filter(l => l.enabled)
                    .findIndex(l => l.id === layer.id) + 1;

                  return (
                    <SortableItem
                      key={layer.id}
                      id={layer.id}
                      order={layerOrder}
                      title={layer.title}
                      enabled={layer.enabled}
                    >
                      {layer.id === 'manual_qa' && (
                        <>
                          {layer.enabled ? (
                            manualDatasets.length > 0 ? (
                              <Select
                                mode="multiple"
                                placeholder="选择自定义问答数据集"
                                style={{ width: '100%' }}
                                value={selectedManualDatasets}
                                onChange={(v) => setSelectedManualDatasets(v)}
                                options={manualDatasets.map((d: any) => ({
                                  value: d.id,
                                  label: `${d.title || d.file_name || d.id} (${d.category || d?.dataset_metadata?.tag || 'unknown'})`,
                                }))}
                              />
                            ) : (
                              <Alert type="warning" message="暂无自定义问答数据集，请先创建后再启用此节点。" showIcon />
                            )
                          ) : (
                            <Text type="secondary">启用后可选择自定义问答数据集参与检索。</Text>
                          )}
                        </>
                      )}

                      {layer.id === 'auto_qa' && (
                        <>
                          {layer.enabled ? (
                            autoDatasets.length > 0 ? (
                              <Select
                                mode="multiple"
                                placeholder="选择QA数据集"
                                style={{ width: '100%' }}
                                value={selectedAutoDatasets}
                                onChange={(v) => setSelectedAutoDatasets(v)}
                                options={autoDatasets.map((d: any) => ({
                                  value: d.id,
                                  label: `${d.title || d.file_name || d.id} (${d.category || d?.dataset_metadata?.tag || 'unknown'})`,
                                }))}
                              />
                            ) : (
                              <Alert type="warning" message="暂无QA数据集，请先创建后再启用此节点。" showIcon />
                            )
                          ) : (
                            <Text type="secondary">启用后可选择QA数据集参与检索。</Text>
                          )}
                        </>
                      )}

                      {layer.id === 'documents' && (
                        <>
                          {layer.enabled ? (
                            <>
                              <Space>
                                <Text type="secondary">文档重排</Text>
                                <Switch checked={docRerank} onChange={setDocRerank} />
                              </Space>
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary">默认采用混合检索（hybrid，top_k=10）。</Text>
                              </div>
                            </>
                          ) : (
                            <Text type="secondary">启用后可配置文档检索参数。</Text>
                          )}
                        </>
                      )}

                      {layer.id === 'kg' && (
                        <>
                          {layer.enabled ? (
                            <Space>
                              <Input placeholder="host" value={kgHost} onChange={(e) => setKgHost(e.target.value)} style={{ width: 220 }} />
                              <InputNumber placeholder={9622} value={kgPort} onChange={(v) => setKgPort(Number(v || 9622))} />
                            </Space>
                          ) : (
                            <Text type="secondary">启用后需配置图谱服务地址。</Text>
                          )}
                        </>
                      )}
                    </SortableItem>
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {mode === 'custom' && (
          <>
            <Divider plain>自定义权重</Divider>
            <Space wrap>
              {/* 固定问答（规则）不参与模板权重 */}
              {(useQADatasets || useQADatasetsAuto) && (<>
                <Text style={{ width: 150 }}>qa_datasets 权重</Text>
                <InputNumber min={0} max={10} step={0.1} value={wQADatasets} onChange={(v) => setWQADatasets(Number(v || 0))} />
              </>)}
              {useDocuments && (<>
                <Text style={{ width: 150 }}>documents 权重</Text>
                <InputNumber min={0} max={10} step={0.1} value={wDocuments} onChange={(v) => setWDocuments(Number(v || 0))} />
              </>)}
              {useKG && (<>
                <Text style={{ width: 120 }}>kg 权重</Text>
                <InputNumber min={0} max={10} step={0.1} value={wKG} onChange={(v) => setWKG(Number(v || 0))} />
              </>)}
            </Space>
          </>
        )}
        {nothingSelected && (<Alert type="info" showIcon message="请至少选择一个检索节点（如自定义问答/QA数据集/知识库文档/图谱）。" />)}
      </Space>
    </Modal>
  );
};

export default TemplateWizard;
