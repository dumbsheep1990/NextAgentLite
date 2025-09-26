import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Tag, Space, Typography, message, Layout, List, Skeleton, Badge, Modal, Switch, Popconfirm } from 'antd';
import axios from 'axios';
import './CustomQARoutesPage.css';

const { TextArea } = Input;
const { Text } = Typography;
const { Sider, Content } = Layout;

type QARoute = {
  id: string;
  knowledge_base_id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
  source_type: 'manual'|'imported';
  source_ref?: string;
  metadata: Record<string, any>;
};

type KBItem = {
  id: string;
  name: string;
  description?: string;
  metadata_template?: string;
  is_active?: boolean;
  document_count?: number;
};

const CustomQARoutesPage: React.FC = () => {
  const [kbId, setKbId] = useState<string>('');
  const [routes, setRoutes] = useState<QARoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [kbs, setKbs] = useState<KBItem[]>([]);
  const [kbLoading, setKbLoading] = useState<boolean>(false);
  const [manualEnabled, setManualEnabled] = useState<boolean>(true);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    keywords: '' as string,
    category: '自定义问答',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [datasetId, setDatasetId] = useState<string>('');
  const [hitsMap, setHitsMap] = useState<Record<string, {query:string, created_at?:string}[]>>({});

  const loadKBs = async () => {
    setKbLoading(true);
    try {
      // 后端实际路由前缀为 /collections（见 api/routes.py include_router）
      // FastAPI端点限制 size <= 100（见后端校验），此处取最大100
      const res = await axios.get('/api/v1/collections', { params: { page: 1, size: 100 } });
      const list = res.data?.collections || [];
      setKbs(list);
      // 默认选中第一个
      if (!kbId && list.length > 0) setKbId(list[0].id);
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '加载知识库失败');
    } finally {
      setKbLoading(false);
    }
  };

  const load = async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      // 获取该知识库的检索路径，读取自定义数据集的启用状态
      try {
        const pathsRes = await axios.get(`/api/v1/qa-routing/knowledge-base/${kbId}/retrieval-paths`);
        const paths = pathsRes.data?.paths || [];
        const manual = paths.find((p: any) => {
          const cfg = p?.config || {};
          return p?.source_type === 'qa_datasets' && (cfg.dataset_tag === 'manual_custom' || cfg.dataset_name === 'manual_custom');
        });
        if (manual) setManualEnabled(!!manual.is_enabled); else setManualEnabled(false);
      } catch (e) {
        // 忽略错误
      }
      // 1) 找到该KB的自定义数据集（dataset_metadata.tag == manual_custom）
      const dsRes = await axios.get('/api/v1/qa-dataset/list', { params: { collection_id: kbId, limit: 100 } });
      const datasets = dsRes.data?.datasets || [];
      // 兼容后端未携带 dataset_metadata 的情况：使用 category===manual_custom 识别
      const manual = datasets.find((d: any) => (d?.dataset_metadata?.tag === 'manual_custom') || (d?.category === 'manual_custom'));
      if (!manual) {
        setRoutes([]);
        setDatasetId('');
        setHitsMap({});
        return;
      }
      setDatasetId(manual.id);
      // 2) 拉取该数据集下的问答对
      const pairsRes = await axios.get(`/api/v1/qa-dataset/${manual.id}/qa-pairs`, { params: { limit: 1000 } });
      const pairs = pairsRes.data?.qa_pairs || [];
      // 转换为 QARoute 结构以复用表格
      const rows = pairs.map((p: any) => ({
        id: p.id,
        knowledge_base_id: kbId,
        category: p.category,
        question: p.question,
        answer: p.answer,
        keywords: (p.qa_metadata?.keywords || []),
        priority: 1000,
        is_active: true,
        source_type: 'manual',
        metadata: {}
      }));
      setRoutes(rows);
      // 拉取最近命中查询（每条最多3条）
      try {
        const hitsRes = await axios.get(`/api/v1/qa-dataset/${manual.id}/qa-hits`, { params: { limit: 3 } });
        setHitsMap(hitsRes.data?.hits || {});
      } catch (e:any) {
        // 忽略
      }
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadKBs(); }, []);
  useEffect(() => { void load(); }, [kbId]);

  const addRoute = async () => {
    if (!kbId) return message.warning('请先选择知识库');
    if (!form.question.trim() || !form.answer.trim()) return message.warning('请填写问题与答案');
    try {
      const payload = {
        kb_id: kbId,
        question: form.question,
        answer: form.answer,
        keywords: form.keywords.split(',').map(s=>s.trim()).filter(Boolean),
        category: form.category,
      };
      await axios.post('/api/v1/qa-dataset/custom/add', payload);
      message.success('已添加');
      setForm({ question:'', answer:'', keywords:'', category:'自定义问答' });
      setShowAddModal(false);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '添加失败');
    }
  };

  const toggleActive = async (r: QARoute, v: boolean) => {
    try {
      await axios.put(`/api/v1/qa-routing/routes/${r.id}`, { is_active: v });
      setRoutes(prev => prev.map(x => x.id === r.id ? { ...x, is_active: v } : x));
    } catch (e: any) {
      message.error('保存失败');
    }
  };

  const updatePriority = async (r: QARoute, pval: number) => {
    try {
      await axios.put(`/api/v1/qa-routing/routes/${r.id}`, { priority: pval });
      setRoutes(prev => prev.map(x => x.id === r.id ? { ...x, priority: pval } : x));
    } catch (e: any) {
      message.error('保存失败');
    }
  };

  const columns = [
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '问题', dataIndex: 'question', key: 'question' },
    { title: '答案', dataIndex: 'answer', key: 'answer' },
    { title: '关键词', dataIndex: 'keywords', key: 'keywords', width: 220, render: (arr: string[]) => (<Space wrap>{(arr||[]).map((k,i)=>(<Tag key={i}>{k}</Tag>))}</Space>) },
    { title: '命中次数', dataIndex: 'usage_count', key: 'usage_count', width: 110, render: (v: number) => (v ?? 0) },
    { title: '最近命中', key: 'recent_hits', width: 360,
      render: (_: any, row: any) => {
        const items = hitsMap[row.id] || [];
        if (!items.length) return <span style={{color:'#999'}}>—</span>;
        return (
          <div style={{display:'flex', flexDirection:'column', gap:4}}>
            {items.map((h, idx)=>(
              <div key={idx} style={{fontSize:12, color:'#374151'}}>
                <span style={{color:'#6b7280'}}>{h.created_at ? h.created_at.replace('T',' ').slice(0,19) : ''}</span>
                <span style={{marginLeft:8}}>{h.query}</span>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, row: any) => (
        <Popconfirm
          title="确认删除该问答？"
          description={row.question}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={async ()=>{
            try{
              await axios.delete(`/api/v1/qa-dataset/qa-pairs/${row.id}`);
              message.success('已删除');
              await load();
            }catch(e:any){ message.error(e?.response?.data?.detail || '删除失败'); }
          }}
        >
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="custom-qa-routes-page">
      <Layout className="custom-qa-layout">
        <Sider width={280} className="kb-sidebar">
          <div className="kb-sidebar-title">知识库列表</div>
          <div className="kb-list-container">
            {kbLoading ? (
              <Skeleton active />
            ) : (
              <List
                size="small"
                dataSource={kbs}
                renderItem={(item) => (
                  <List.Item
                    className={`kb-list-item ${kbId === item.id ? 'active' : ''} fade-in`}
                    onClick={() => setKbId(item.id)}
                  >
                    <div className="kb-item-content">
                      <div className="kb-item-header">
                        <span className="kb-item-name">{item.name}</span>
                        {item.document_count !== undefined && (
                          <div className="kb-item-badge">
                            <Badge count={item.document_count} style={{ backgroundColor: '#52c41a' }} />
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <div className="kb-item-description">{item.description}</div>
                      )}
                      <div className="kb-item-meta">
                        <span className="kb-item-status">活跃</span>
                        <span className="kb-item-docs-count">{item.document_count || 0} 个文档</span>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Sider>
        
        <Content className="main-content">
          <div className="content-body">
            <div className="qa-table-container fade-in">
              <div className="table-wrapper">
                <Table
                  size="small"
                  rowKey="id"
                  columns={columns as any}
                  dataSource={routes.filter(r => !q || r.question.includes(q) || r.answer.includes(q))}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  title={() => (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
                      <div className="qa-table-title">
                        自定义问答列表
                        <span style={{marginLeft:8, color:'#999', fontSize:12}}>
                          当前知识库：{kbs.find(k=>k.id===kbId)?.name || '未选择'}
                        </span>
                      </div>
                      <Space className="table-header-actions">
                        <span style={{color:'#555'}}>自定义问答</span>
                        <Switch
                          checked={manualEnabled}
                          checkedChildren="启用"
                          unCheckedChildren="关闭"
                          onChange={async (checked)=>{
                            try{
                              await axios.put(`/api/v1/qa-routing/knowledge-base/${kbId}/custom-dataset/enabled`, { enabled: checked });
                              setManualEnabled(checked);
                              message.success(checked ? '已启用自定义问答路由' : '已关闭自定义问答路由');
                            }catch(e:any){
                              message.error(e?.response?.data?.detail || '更新失败');
                            }
                          }}
                        />
                        <Input 
                          placeholder="搜索问题/答案" 
                          value={q} 
                          onChange={(e)=>setQ(e.target.value)} 
                          style={{ width: 260 }}
                        />
                        <Button onClick={load}>刷新</Button>
                        <Button type="primary" disabled={!kbId} onClick={()=>setShowAddModal(true)}>添加问答</Button>
                      </Space>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          <Modal
            open={showAddModal}
            title="添加自定义问答（优先命中）"
            onCancel={()=>setShowAddModal(false)}
            onOk={addRoute}
            okButtonProps={{ disabled: !kbId }}
            cancelText="取消"
            okText="添加问答"
            destroyOnClose
            width={600}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="modal-form-item">
                <label className="modal-form-label">
                  分类
                </label>
                <Input 
                  placeholder="默认：自定义问答" 
                  value={form.category} 
                  onChange={(e)=>setForm(s=>({...s, category: e.target.value}))} 
                  size="large"
                />
              </div>

              <div className="modal-form-item">
                <label className="modal-form-label">
                  问题<span className="required">*</span>
                </label>
                <Input 
                  placeholder="请输入问题内容" 
                  value={form.question} 
                  onChange={(e)=>setForm(s=>({...s, question: e.target.value}))} 
                  size="large"
                />
              </div>

              <div className="modal-form-item">
                <label className="modal-form-label">
                  答案<span className="required">*</span>
                </label>
                <TextArea 
                  rows={4} 
                  placeholder="请输入答案内容"
                  value={form.answer} 
                  onChange={(e)=>setForm(s=>({...s, answer: e.target.value}))} 
                  showCount
                  maxLength={1000}
                />
              </div>

              <div className="modal-form-item">
                <label className="modal-form-label">
                  关键词
                </label>
                <Input 
                  placeholder="多个关键词请用逗号分隔，如：材料,强度,性能" 
                  value={form.keywords} 
                  onChange={(e)=>setForm(s=>({...s, keywords: e.target.value}))} 
                  size="large"
                />
              </div>
            </div>
          </Modal>
        </Content>
      </Layout>
    </div>
  );
};

export default CustomQARoutesPage;
