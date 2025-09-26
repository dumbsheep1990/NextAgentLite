/**
 * 问答路由页面（修复版，知识库为主）
 */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Layout, List, Card, Space, Typography, Tag, Button, Select, message, Alert, Divider, Drawer, Table, Switch, InputNumber, Modal, Input, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import { getRetrievalPaths, type RetrievalPath } from '../../services/qaRoutingService';
import './qa-routing.css';
import TemplateWizard from './components/TemplateWizard';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;
// 已移除配置编辑弹窗，不再需要 TextArea

type KBItem = { id: string; name: string; description?: string; document_count?: number; status?: string };

const sourceTypeColor: Record<string, string> = {
  qa_routes: 'blue',
  qa_datasets: 'purple',
  documents: 'green',
};

const QARoutingKBPage: React.FC = () => {
  const [kbs, setKbs] = useState<KBItem[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KBItem | null>(null);
  const [paths, setPaths] = useState<RetrievalPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);
  // 取消单路径编辑与新增能力，统一通过模板管理
  const [tpls, setTpls] = useState<any[]>([]);
  const [loadingTpls, setLoadingTpls] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeTplId, setActiveTplId] = useState<string | undefined>(undefined);
  // 模板内路径编辑 Drawer
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<string>('balanced');
  const [editPaths, setEditPaths] = useState<any[]>([]);
  const [cfgModal, setCfgModal] = useState<{ open: boolean; index?: number; text?: string }>({ open: false });
  // 预览
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPaths, setPreviewPaths] = useState<any[]>([]);

  const normalizeKBList = (raw: any): KBItem[] => {
    if (Array.isArray(raw)) return raw as KBItem[];
    if (raw && Array.isArray(raw.items)) return raw.items as KBItem[];
    if (raw && Array.isArray(raw.collections)) return raw.collections as KBItem[];
    return [];
  };

  const loadKBs = async () => {
    setLoadingKB(true);
    try {
      let list: KBItem[] = [];
      try {
        const { data } = await axios.get('/api/v1/qa-routing/resources/collections');
        list = normalizeKBList(data);
      } catch {}
      if (!list.length) {
        try {
          const { data } = await axios.get('/api/v1/collections');
          list = normalizeKBList(data);
        } catch {}
      }
      if (!list.length) {
        try {
          const { data } = await axios.get('/api/v1/collections?page=1&size=1000');
          list = normalizeKBList(data);
        } catch {}
      }
      if (!list.length) throw new Error('未获取到知识库列表');
      setKbs(list);
      if (!selectedKB && list.length > 0) setSelectedKB(list[0]);
    } catch (e: any) {
      message.error(`加载知识库失败: ${e?.message || '未知错误'}`);
      setKbs([]);
    } finally {
      setLoadingKB(false);
    }
  };

  const loadPaths = async (kbId?: string) => {
    if (!kbId) return;
    setLoadingPaths(true);
    try {
      const res = await getRetrievalPaths(kbId);
      setPaths(res.sort((a, b) => a.path_order - b.path_order));
    } catch (e: any) {
      message.error(`加载检索路径失败: ${e?.message || '未知错误'}`);
      setPaths([]);
    } finally {
      setLoadingPaths(false);
    }
  };

  useEffect(() => {
    loadKBs();
  }, []);

  useEffect(() => {
    if (selectedKB?.id) {
      loadPaths(selectedKB.id);
      loadTemplates(selectedKB.id);
    }
  }, [selectedKB?.id]);

  //

  const loadTemplates = async (kbId?: string) => {
    if (!kbId) return;
    setLoadingTpls(true);
    try {
      const { data } = await axios.get(`/api/v1/qa-routing/knowledge-base/${kbId}/templates`);
      const list = Array.isArray(data?.templates) ? data.templates : [];
      const norm = list.map((t: any) => {
        // 兼容不同字段：paths / template_paths / definition.paths / config.paths / 字符串JSON
        let paths: any = t.paths;
        if (typeof paths === 'string') { try { paths = JSON.parse(paths); } catch { paths = []; } }
        if (!Array.isArray(paths)) paths = t.template_paths;
        if (!Array.isArray(paths) && t.definition && Array.isArray(t.definition.paths)) paths = t.definition.paths;
        if (!Array.isArray(paths) && typeof t.definition === 'string') { try { const o = JSON.parse(t.definition); if (Array.isArray(o?.paths)) paths = o.paths; } catch {} }
        if (!Array.isArray(paths) && t.config && Array.isArray(t.config.paths)) paths = t.config.paths;
        if (!Array.isArray(paths)) paths = [];
        return { ...t, _paths: paths, _mode: t.mode || t?.definition?.mode || (typeof t.definition==='string' ? (()=>{ try { return JSON.parse(t.definition).mode } catch { return undefined } })() : undefined) };
      });
      setTpls(norm);
      // 设置当前模板（优先 is_default，其次取第一个）
      const def = norm.find((t: any) => t.is_default) || norm[0];
      if (def) setActiveTplId(def.id);
    } catch (e: any) {
      message.error(`加载模板失败: ${e?.message || '未知错误'}`);
      setTpls([]);
    } finally {
      setLoadingTpls(false);
    }
  };

  const saveCurrentAsTemplate = async () => {
    if (!selectedKB) return;
    const name = prompt('输入模板名称', '默认模板');
    if (!name) return;
    try {
      await axios.post(`/api/v1/qa-routing/knowledge-base/${selectedKB.id}/templates/save-from-current`, {
        template_name: name,
        mode: 'balanced',
      });
      message.success('已保存为模板');
      loadTemplates(selectedKB.id);
    } catch (e: any) {
      message.error(`保存模板失败: ${e?.message || '未知错误'}`);
    }
  };

  const applyTemplate = async (id: string) => {
    try {
      await axios.post(`/api/v1/qa-routing/templates/${id}/apply`);
      message.success('模板已应用');
      setActiveTplId(id);
      if (selectedKB?.id) loadPaths(selectedKB.id);
    } catch (e: any) {
      message.error(`应用模板失败: ${e?.message || '未知错误'}`);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await axios.delete(`/api/v1/qa-routing/templates/${id}`);
      message.success('模板已删除');
      if (selectedKB?.id) loadTemplates(selectedKB.id);
    } catch (e: any) {
      message.error(`删除模板失败: ${e?.message || '未知错误'}`);
    }
  };

  // 打开模板编辑
  const openEdit = () => {
    const cur = tpls.find((t: any) => t.id === activeTplId) || tpls[0];
    if (!cur) return;
    const paths = Array.isArray(cur._paths) ? cur._paths : (Array.isArray(cur.paths) ? cur.paths : []);
    setEditMode(cur._mode || cur.mode || 'balanced');
    // 深拷贝，避免直接修改源
    setEditPaths(paths.map((p: any) => ({
      id: p.id || undefined,
      path_order: p.path_order ?? 1,
      source_type: p.source_type,
      is_enabled: p.is_enabled ?? true,
      min_confidence: p.min_confidence ?? 0,
      max_results: p.max_results ?? 10,
      fallback_action: p.fallback_action || 'continue',
      config: p.config || {},
      path_name: p.path_name || '',
    })));
    setEditOpen(true);
  };

  const tplColumns: ColumnsType<any> = [
    {
      title: '顺序',
      dataIndex: 'path_order',
      width: 90,
      render: (v, r, idx) => (
        <InputNumber min={1} value={v} onChange={(val) => {
          const nv = Number(val || 1);
          setEditPaths(prev => prev.map((p, i) => i === idx ? { ...p, path_order: nv } : p).sort((a,b)=>a.path_order-b.path_order));
        }} />
      )
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      render: (t: string) => <Tag color={sourceTypeColor[t] || 'default'}>{t}</Tag>
    },
    {
      title: '启用',
      dataIndex: 'is_enabled',
      width: 100,
      render: (v: boolean, r, idx) => (
        <Switch checked={!!v} onChange={(checked) => setEditPaths(prev => prev.map((p,i)=> i===idx ? { ...p, is_enabled: checked } : p))} />
      )
    },
    {
      title: '最小置信',
      dataIndex: 'min_confidence',
      width: 140,
      render: (v: number, r, idx) => (
        <InputNumber min={0} max={1} step={0.01} value={v} onChange={(val)=> setEditPaths(prev => prev.map((p,i)=> i===idx ? { ...p, min_confidence: Number(val||0) } : p))} />
      )
    },
    {
      title: '最大结果',
      dataIndex: 'max_results',
      width: 130,
      render: (v: number, r, idx) => (
        <InputNumber min={1} max={100} value={v} onChange={(val)=> setEditPaths(prev => prev.map((p,i)=> i===idx ? { ...p, max_results: Number(val||10) } : p))} />
      )
    },
    {
      title: '回退',
      dataIndex: 'fallback_action',
      width: 130,
      render: (v: string, r, idx) => (
        <Select
          value={v}
          style={{ width: 110 }}
          options={[{ value: 'continue', label: '继续' }, { value: 'stop', label: '停止' }]}
          onChange={(val)=> setEditPaths(prev => prev.map((p,i)=> i===idx ? { ...p, fallback_action: val } : p))}
        />
      )
    },
    {
      title: '配置JSON',
      dataIndex: 'config',
      render: (_: any, r, idx) => (
        <Button size="small" onClick={() => setCfgModal({ open: true, index: idx, text: JSON.stringify(r.config || {}, null, 2) })}>编辑</Button>
      )
    }
  ];

  const saveTemplate = async () => {
    const cur = tpls.find((t: any) => t.id === activeTplId) || tpls[0];
    if (!cur || !activeTplId) return;
    try {
      await axios.put(`/api/v1/qa-routing/templates/${activeTplId}`, {
        template_name: cur.template_name,
        mode: editMode,
        paths: editPaths,
        // 兼容后端可能的字段定义
        definition: { mode: editMode, paths: editPaths }
      });
      message.success('模板已保存');
      setEditOpen(false);
      if (selectedKB?.id) loadTemplates(selectedKB.id);
    } catch (e: any) {
      message.error(`保存失败: ${e?.message || '未知错误'}`);
    }
  };

  return (
    <Layout
      style={{
        background: 'transparent',
        // 减去顶部栏高度，避免整页产生滚动；如需微调可将 64px 改为实际头部高度
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', height: '100%', overflow: 'auto' }}>
        <div style={{ height: 56, padding: '0 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>知识库</Title>
            <Button icon={<ReloadOutlined />} size="small" onClick={loadKBs} loading={loadingKB}>刷新</Button>
          </Space>
        </div>
        <List
          className="kb-list"
          loading={loadingKB}
          dataSource={kbs}
          renderItem={(item) => (
            <List.Item
              className={`kb-list-item${selectedKB?.id === item.id ? ' selected' : ''}`}
              onClick={() => setSelectedKB(item)}
            >
              <List.Item.Meta
                title={<Space size={8} wrap>
                  <Text strong>{item.name}</Text>
                  {item.document_count !== undefined && <Tag>{item.document_count} 文档</Tag>}
                </Space>}
                description={<Typography.Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{item.description || ' '}</Typography.Paragraph>}
              />
            </List.Item>
          )}
        />
      </Sider>
      <Content style={{ padding: 16, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 当前模板卡片 */}
        <Card className="qa-routing-card" title={
          <Space>
            <span>路由模板（当前） - {selectedKB ? selectedKB.name : '请选择知识库'}</span>
            {selectedKB && <Tag color="blue">ID: {selectedKB.id}</Tag>}
          </Space>
        } extra={
          <Space>
            <Button onClick={() => setWizardOpen(true)} disabled={!selectedKB}>模板向导</Button>
            <Button onClick={saveCurrentAsTemplate} disabled={!selectedKB}>保存当前为模板</Button>
            <Button icon={<ReloadOutlined />} onClick={() => selectedKB?.id && loadTemplates(selectedKB.id)} disabled={!selectedKB}>刷新</Button>
          </Space>
        } bodyStyle={{ padding: 16 }}>
          {!tpls.length ? (
            <Alert type="info" showIcon message="当前知识库暂无模板，可使用‘模板向导’创建。" />
          ) : (
            <>
              <div className="tpl-list">
                {tpls.map((t: any, idx: number) => {
                  const isActive = activeTplId ? activeTplId === t.id : idx === 0;
                  const paths = Array.isArray(t._paths) ? t._paths : (Array.isArray(t.paths) ? t.paths : []);
                  const qa = paths.filter((p: any) => p.source_type === 'qa_datasets');
                  const docs = paths.find((p: any) => p.source_type === 'documents');
                  const hasKG = paths.find((p: any) => p.source_type === 'documents' && p.config?.type === 'kg');
                  const manualDatasets = qa.find((p: any) => Array.isArray(p.config?.dataset_ids))?.config?.dataset_ids?.length || 0;
                  const autoDatasets = qa.filter((p: any) => p.config?.dataset_tag === 'auto_extracted').length;
                  const rerank = docs?.config?.rerank ? '开启' : '关闭';
                  return (
                    <>
                      <div key={t.id} className={`tpl-item${isActive ? ' active' : ''}`} onClick={() => setActiveTplId(t.id)}>
                        <div className="left">
                          <Tag color="blue">#{idx + 1}</Tag>
                          <Text strong style={{ marginRight: 8 }}>{t.template_name}</Text>
                          {t.is_default && <Tag color="green">默认</Tag>}
                          {t.updated_at && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>更新于 {new Date(t.updated_at).toLocaleString()}</Text>}
                        </div>
                        <div className="right">
                          <Space size={8}>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); setActiveTplId(t.id); setPreviewPaths(paths); setPreviewOpen(true); }}>预览</Button>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); setActiveTplId(t.id); openEdit(); }}>编辑</Button>
                            <Popconfirm title="确认删除此模板？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
                              onConfirm={() => { setActiveTplId(t.id); deleteTemplate(t.id); }}>
                              <Button size="small" danger onClick={(e)=> e.stopPropagation()}>删除</Button>
                            </Popconfirm>
                            {/* 应用模板改到智能体构建页进行选择，这里不再提供“应用” */}
                          </Space>
                        </div>
                      </div>
                      {isActive && (
                        <div className="tpl-summary tpl-summary-inline">
                          <div className="item">
                            <div className="label">模式</div>
                            <div className="value"><Tag color="geekblue">{String(t._mode || t.mode || 'balanced')}</Tag></div>
                          </div>
                          <div className="item">
                            <div className="label">QA（手工/自动）</div>
                            <div className="value">{manualDatasets}个手工数据集，{autoDatasets}个自动数据集</div>
                          </div>
                          <div className="item">
                            <div className="label">文档重排</div>
                            <div className="value">{rerank}</div>
                          </div>
                          <div className="item">
                            <div className="label">知识图谱</div>
                            <div className="value">{hasKG ? '已启用' : '未启用'}</div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* 模板生成的检索路径内容区已删除。请使用“模板向导”创建/编辑，并用“应用”将模板写入路径。 */}
      

        {/* 模板生成的检索路径内容区已删除。使用“编辑”在抽屉中修改模板并保存。 */}

        <Drawer
          title={(
            <Space>
              <span>编辑模板</span>
              <Select size="small" value={editMode} style={{ width: 140 }}
                onChange={setEditMode}
                options={[{ value: 'force', label: 'force' }, { value: 'balanced', label: 'balanced' }, { value: 'custom', label: 'custom' }]} />
            </Space>
          )}
          placement="right"
          width={720}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          extra={<Space><Button onClick={()=>setEditOpen(false)}>取消</Button><Button type="primary" onClick={saveTemplate}>保存</Button></Space>}
        >
          <Alert type="info" showIcon message="此处编辑的是模板内部路径，不直接改动数据库。保存后可再‘应用’模板写入实际路径。" style={{ marginBottom: 12 }} />
          <Table rowKey={(r)=>`${r.source_type}-${r.path_order}-${Math.random()}`}
                 columns={tplColumns} dataSource={editPaths} pagination={false} size="small" />
        </Drawer>

        <Modal title="编辑配置JSON" open={cfgModal.open}
          onCancel={() => setCfgModal({ open: false })}
          onOk={() => { try { const parsed = cfgModal.text ? JSON.parse(cfgModal.text) : {}; const idx=cfgModal.index!; setEditPaths(prev=>prev.map((p,i)=> i===idx ? { ...p, config: parsed } : p)); setCfgModal({ open:false }); } catch(e){ message.error('JSON 格式错误'); } }}
          okText="保存" width={720}>
          <Input.TextArea rows={16} value={cfgModal.text}
            onChange={(e)=> setCfgModal(prev=>({ ...prev as any, text: e.target.value }))}
            placeholder={`{\n  \"search_mode\": \"hybrid\",\n  \"top_k\": 10\n}` } />
        </Modal>

        <Drawer
          title="模板预览"
          placement="right"
          width={680}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        >
          <Table
            rowKey={(r:any, i:number)=>String(i)}
            size="small"
            pagination={false}
            columns={[
              { title: '顺序', dataIndex: 'path_order', width: 80 },
              { title: '来源', dataIndex: 'source_type', render:(t:string)=> <Tag color={sourceTypeColor[t]||'default'}>{t}</Tag> },
              { title: '启用', dataIndex: 'is_enabled', width: 80, render:(v:boolean)=> v? '是':'否' },
              { title: '最小置信', dataIndex: 'min_confidence', width: 120 },
              { title: '最大结果', dataIndex: 'max_results', width: 110 },
              { title: '回退', dataIndex: 'fallback_action', width: 100 },
            ] as any}
            dataSource={previewPaths}
          />
        </Drawer>
</Content>
      {/* 模板向导 */}
      <TemplateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={async (tpl) => {
          if (!selectedKB) return;
          try {
            await axios.post(`/api/v1/qa-routing/knowledge-base/${selectedKB.id}/templates/create`, tpl);
            message.success('模板创建成功');
            setWizardOpen(false);
            loadTemplates(selectedKB.id);
          } catch (e: any) {
            message.error(`模板创建失败: ${e?.message || '未知错误'}`);
          }
        }}
        kbId={selectedKB?.id}
      />
      {/* 取消单路径创建，使用模板向导作为主入口 */}
    </Layout>
  );
};

export default QARoutingKBPage;
