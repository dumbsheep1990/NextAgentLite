import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Modal, Input, Select, Checkbox, Space, InputNumber, Divider, Typography, Switch, message, Alert, Steps, Card } from 'antd';

const { Text } = Typography;

type WizardProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: any) => Promise<void> | void;
  kbId?: string;
};

const TemplateWizard: React.FC<WizardProps> = ({ open, onClose, onCreate, kbId }) => {
  const [name, setName] = useState('默认模板');
  const [mode, setMode] = useState<'force'|'balanced'|'custom'>('balanced');
  const [useQADatasets, setUseQADatasets] = useState(true);
  const [useQADatasetsAuto, setUseQADatasetsAuto] = useState(false);
  const [useDocuments, setUseDocuments] = useState(true);
  const [docRerank, setDocRerank] = useState(false);
  const [useKG, setUseKG] = useState(false);
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
        const { data } = await axios.get(`/api/v1/qa-dataset/list?collection_id=${kbId}&limit=100`);
        const list = Array.isArray(data?.datasets) ? data.datasets : [];
        setDatasets(list);
      } catch (e: any) {
        message.error(`加载数据集失败: ${e?.message || '未知错误'}`);
        setDatasets([]);
      }
    };
    load();
  }, [open, kbId]);

  // 校验：无数据集时阻止启用并提示
  const handleToggleManual = (checked: boolean) => {
    if (checked && manualDatasets.length === 0) {
      message.warning('当前知识库暂无“自定义问答”数据集，请先创建。');
      setUseQADatasets(false);
      return;
    }
    setUseQADatasets(checked);
  };
  const handleToggleAuto = (checked: boolean) => {
    if (checked && autoDatasets.length === 0) {
      message.warning('当前知识库暂无“自动提取问答”数据集，请先创建。');
      setUseQADatasetsAuto(false);
      return;
    }
    setUseQADatasetsAuto(checked);
  };

  const paths = useMemo(() => {
    const arr: any[] = [];
    let order = 1;
    if (useQADatasets) {
      arr.push({
        path_name: '自定义问答优先',
        path_order: order++,
        source_type: 'qa_datasets',
        is_enabled: true,
        config: selectedManualDatasets.length ? { dataset_ids: selectedManualDatasets } : { dataset_tag: 'manual_custom' },
        fallback_action: 'continue',
        min_confidence: 0,
        max_results: 10,
      });
    }
    if (useQADatasetsAuto) {
      arr.push({
        path_name: '自动提取问答',
        path_order: order++,
        source_type: 'qa_datasets',
        is_enabled: true,
        config: selectedAutoDatasets.length ? { dataset_ids: selectedAutoDatasets } : { dataset_tag: 'auto_extracted' },
        fallback_action: 'continue',
        min_confidence: 0,
        max_results: 10,
      });
    }
    if (useDocuments) {
      arr.push({
        path_name: '知识文档',
        path_order: order++,
        source_type: 'documents',
        is_enabled: true,
        config: { search_mode: 'hybrid', top_k: 10, rerank: !!docRerank },
        fallback_action: 'continue',
        min_confidence: 0,
        max_results: 10,
      });
    }
    if (useKG) {
      arr.push({
        path_name: '知识图谱',
        path_order: order++,
        source_type: 'documents',
        is_enabled: true,
        config: { type: 'kg', host: kgHost, port: kgPort },
        fallback_action: 'continue',
        min_confidence: 0,
        max_results: 10,
      });
    }
    return arr;
  }, [useQADatasets, useQADatasetsAuto, useDocuments, docRerank, useKG, kgHost, kgPort, selectedManualDatasets, selectedAutoDatasets]);

  const weights = useMemo(() => {
    if (mode !== 'custom') return undefined;
    const m: Record<string, number> = {};
    if (useQADatasets || useQADatasetsAuto) m['qa_datasets'] = wQADatasets;
    if (useDocuments) m['documents'] = wDocuments;
    if (useKG) m['kg'] = wKG;
    return m;
  }, [mode, useQADatasets, useQADatasetsAuto, useDocuments, useKG, wQADatasets, wDocuments, wKG]);

  const nothingSelected = !(useQADatasets || useQADatasetsAuto || useDocuments || useKG);

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

        <Divider plain>包含的检索层</Divider>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 260, border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
            <div onClick={() => handleToggleManual(!useQADatasets)} style={{ display: 'flex', alignItems: 'center', padding: '8px 6px', cursor: 'pointer', borderRadius: 4, background: useQADatasets ? '#f6ffed' : undefined }}>
              <Checkbox checked={useQADatasets} onChange={(e) => handleToggleManual(e.target.checked)} style={{ marginRight: 8 }} /> 自定义问答（手工）
            </div>
            <div onClick={() => handleToggleAuto(!useQADatasetsAuto)} style={{ display: 'flex', alignItems: 'center', padding: '8px 6px', cursor: 'pointer', borderRadius: 4, background: useQADatasetsAuto ? '#f6ffed' : undefined }}>
              <Checkbox checked={useQADatasetsAuto} onChange={(e) => handleToggleAuto(e.target.checked)} style={{ marginRight: 8 }} /> 自动提取问答
            </div>
            <div onClick={() => setUseDocuments(!useDocuments)} style={{ display: 'flex', alignItems: 'center', padding: '8px 6px', cursor: 'pointer', borderRadius: 4, background: useDocuments ? '#e6f4ff' : undefined }}>
              <Checkbox checked={useDocuments} onChange={(e) => setUseDocuments(e.target.checked)} style={{ marginRight: 8 }} /> 知识文档（documents）
            </div>
            <div onClick={() => setUseKG(!useKG)} style={{ display: 'flex', alignItems: 'center', padding: '8px 6px', cursor: 'pointer', borderRadius: 4, background: useKG ? '#f0f5ff' : undefined }}>
              <Checkbox checked={useKG} onChange={(e) => setUseKG(e.target.checked)} style={{ marginRight: 8 }} /> 知识图谱（kg）
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
          {/* 固定问答（规则）已取消在模板内配置 */}

          <Card size="small" title={<Text strong>自定义问答（手工）</Text>}>
            {useQADatasets ? (
              manualDatasets.length > 0 ? (
                <Select
                  mode="multiple"
                  placeholder="选择手工数据集"
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
          </Card>

          <Card size="small" title={<Text strong>自动提取问答</Text>}>
            {useQADatasetsAuto ? (
              autoDatasets.length > 0 ? (
                <Select
                  mode="multiple"
                  placeholder="选择自动提取数据集"
                  style={{ width: '100%' }}
                  value={selectedAutoDatasets}
                  onChange={(v) => setSelectedAutoDatasets(v)}
                  options={autoDatasets.map((d: any) => ({
                    value: d.id,
                    label: `${d.title || d.file_name || d.id} (${d.category || d?.dataset_metadata?.tag || 'unknown'})`,
                  }))}
                />
              ) : (
                <Alert type="warning" message="暂无自动提取问答数据集，请先创建后再启用此节点。" showIcon />
              )
            ) : (
              <Text type="secondary">启用后可选择自动提取的问答数据集参与检索。</Text>
            )}
          </Card>

          <Card size="small" title={<Text strong>知识文档（documents）</Text>}>
            <Space>
              <Text type="secondary">文档重排</Text>
              <Switch checked={docRerank} onChange={setDocRerank} />
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">默认采用混合检索（hybrid，top_k=10）。</Text>
            </div>
          </Card>

          <Card size="small" title={<Text strong>知识图谱（kg）</Text>}>
            {useKG ? (
              <Space>
                <Input placeholder="host" value={kgHost} onChange={(e) => setKgHost(e.target.value)} style={{ width: 220 }} />
                <InputNumber placeholder={9622} value={kgPort} onChange={(v) => setKgPort(Number(v || 9622))} />
              </Space>
            ) : (
              <Text type="secondary">启用后需配置图谱服务地址。</Text>
            )}
          </Card>
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
        {nothingSelected && (<Alert type="info" showIcon message="请至少选择一个检索节点（如固定问答/自定义问答/文档/图谱）。" />)}
      </Space>
    </Modal>
  );
};

export default TemplateWizard;
