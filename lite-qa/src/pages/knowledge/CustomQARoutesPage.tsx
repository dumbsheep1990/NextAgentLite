import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Tag, Space, Typography, message, Layout, List, Skeleton, Badge, Modal, Switch, Popconfirm, Tooltip, Card, Statistic, Row, Col } from 'antd';
import { DatabaseOutlined, ToolOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api'; // 修复：使用配置好的api实例
import EnhancedQAModal from '../../components/knowledge/EnhancedQAModal';
import type { EnhancedQAFormData } from '../../types/customQA';
import './CustomQARoutesPage.css';
// 🔥 修复：静态导入collectionService，避免动态import触发SSE重连
import collectionService from '../../services/collectionService';

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
  // 增强字段
  enable_kb_routing?: boolean;
  route_to_kb_ids?: string[];
  enable_tool_call?: boolean;
  tool_names?: string[];
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
  // 从localStorage读取指定知识库的toggle状态
  const getStoredToggleState = (kbId: string): boolean | null => {
    if (!kbId) return null;
    try {
      const stored = localStorage.getItem(`qa_routing_toggle_${kbId}`);
      return stored === null ? null : stored === 'true';
    } catch {
      return null;
    }
  };

  // 保存指定知识库的toggle状态到localStorage
  const saveToggleState = (kbId: string, enabled: boolean) => {
    if (!kbId) return;
    try {
      localStorage.setItem(`qa_routing_toggle_${kbId}`, enabled.toString());
      console.log(`💾 保存知识库 ${kbId} 的toggle状态:`, enabled);
    } catch (err) {
      console.error('💾 保存toggle状态失败:', err);
    }
  };

  const [kbId, setKbId] = useState<string>('');
  const [routes, setRoutes] = useState<QARoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [kbs, setKbs] = useState<KBItem[]>([]);
  const [kbLoading, setKbLoading] = useState<boolean>(false);
  const [manualEnabled, setManualEnabled] = useState<boolean>(true);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingQA, setEditingQA] = useState<QARoute | null>(null);
  const [datasetId, setDatasetId] = useState<string>('');
  const [hitsMap, setHitsMap] = useState<Record<string, {query:string, created_at?:string}[]>>({});
  // 工具映射表（tool_code -> tool_name）
  const [toolsMap, setToolsMap] = useState<Record<string, string>>({});
  // 知识库映射表（kb_id -> kb_name）
  const [kbsMap, setKbsMap] = useState<Record<string, string>>({});

  const loadToolsMap = async () => {
    try {
      const res = await api.get('/user-agents/tools');
      // FastAPI返回List[AgentToolResponse]，直接就是数组
      const tools = Array.isArray(res.data) ? res.data : [];
      const map: Record<string, string> = {};
      tools.forEach((tool: any) => {
        map[tool.tool_code] = tool.tool_name;
      });
      setToolsMap(map);
    } catch (e: any) {
      console.error('加载工具映射失败:', e);
    }
  };

  const loadKBs = async () => {
    setKbLoading(true);
    try {
      // 🔥 修复：直接使用静态导入的collectionService，避免动态import触发SSE重连
      console.log('📚 [CustomQARoutes] 开始加载知识库列表...');
      const result = await collectionService.getCollections({ page: 1, size: 100, status: 'all' });
      const list = result.collections || [];

      console.log('📚 [CustomQARoutes] 成功加载知识库列表:', list.length, '个');
      setKbs(list);

      // 构建知识库映射表
      const map: Record<string, string> = {};
      list.forEach((kb: KBItem) => {
        map[kb.id] = kb.name;
      });
      setKbsMap(map);

      // 默认选中第一个
      if (!kbId && list.length > 0) setKbId(list[0].id);
    } catch (e: any) {
      console.error('❌ [CustomQARoutes] 加载知识库失败:', e);
      message.error(e?.message || e?.response?.data?.detail || '加载知识库失败: 未获取到知识库列表');
    } finally {
      setKbLoading(false);
    }
  };

  const load = async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      // 优先从localStorage读取状态，如果没有则从API读取
      const storedState = getStoredToggleState(kbId);

      if (storedState !== null) {
        console.log(`📚 从localStorage读取知识库 ${kbId} 的toggle状态:`, storedState);
        setManualEnabled(storedState);
      } else {
        // 从API获取该知识库的检索路径，读取自定义数据集的启用状态
        try {
          const pathsRes = await api.get(`/qa-routing/knowledge-base/${kbId}/retrieval-paths`);
          const paths = pathsRes.data?.paths || [];
          const manual = paths.find((p: any) => {
            const cfg = p?.config || {};
            return p?.source_type === 'qa_datasets' && (cfg.dataset_tag === 'manual_custom' || cfg.dataset_name === 'manual_custom');
          });
          const apiState = manual ? !!manual.is_enabled : false;
          console.log(`📚 从API读取知识库 ${kbId} 的toggle状态:`, apiState);
          setManualEnabled(apiState);
          // 保存到localStorage供下次使用
          saveToggleState(kbId, apiState);
        } catch (e) {
          console.error('读取toggle状态失败:', e);
          setManualEnabled(false);
        }
      }
      // 1) 找到该KB的自定义数据集（dataset_metadata.tag == manual_custom）
      const dsRes = await api.get('/qa-dataset/list', { params: { collection_id: kbId, limit: 100 } });
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
      const pairsRes = await api.get(`/qa-dataset/${manual.id}/qa-pairs`, { params: { limit: 1000 } });
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
        metadata: {},
        // 增强字段 - 从 qa_metadata 中解析
        enable_kb_routing: p.qa_metadata?.enable_kb_routing || false,
        route_to_kb_ids: p.qa_metadata?.route_to_kb_ids || [],
        enable_tool_call: p.qa_metadata?.enable_tool_call || false,
        tool_names: p.qa_metadata?.tool_names || []
      }));
      setRoutes(rows);
      // 拉取最近命中查询（每条最多3条）
      try {
        const hitsRes = await api.get(`/qa-dataset/${manual.id}/qa-hits`, { params: { limit: 3 } });
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

  useEffect(() => {
    void loadKBs();
    void loadToolsMap(); // 加载工具映射表
  }, []);
  useEffect(() => { void load(); }, [kbId]);

  const handleSubmitQA = async (formData: EnhancedQAFormData) => {
    if (!kbId) {
      message.warning('请先选择知识库');
      throw new Error('未选择知识库');
    }

    try {
      const payload = {
        kb_id: kbId,
        question: formData.question,
        answer: formData.answer,
        keywords: formData.keywords,
        category: formData.category,
        // 将增强字段放入 qa_metadata
        qa_metadata: {
          keywords: formData.keywords,
          enable_kb_routing: formData.enable_kb_routing,
          route_to_kb_ids: formData.route_to_kb_ids,
          enable_tool_call: formData.enable_tool_call,
          tool_names: formData.tool_names
        }
      };

      if (modalMode === 'add') {
        await api.post('/qa-dataset/custom/add', payload);
        message.success('自定义问答已添加');
      } else {
        // 编辑模式
        if (!editingQA) throw new Error('无效的编辑数据');
        await api.put(`/qa-dataset/qa-pairs/${editingQA.id}`, payload);
        message.success('自定义问答已更新');
      }

      await load();
    } catch (e: any) {
      console.error('保存失败详情:', e.response?.data);
      message.error(e?.response?.data?.detail || (modalMode === 'add' ? '添加失败' : '更新失败'));
      throw e;
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingQA(null);
    setShowEnhancedModal(true);
  };

  const handleOpenEditModal = (row: QARoute) => {
    setModalMode('edit');
    setEditingQA(row);
    setShowEnhancedModal(true);
  };

  const toggleActive = async (r: QARoute, v: boolean) => {
    try {
      await api.put(`/qa-routing/routes/${r.id}`, { is_active: v });
      setRoutes(prev => prev.map(x => x.id === r.id ? { ...x, is_active: v } : x));
    } catch (e: any) {
      message.error('保存失败');
    }
  };

  const updatePriority = async (r: QARoute, pval: number) => {
    try {
      await api.put(`/qa-routing/routes/${r.id}`, { priority: pval });
      setRoutes(prev => prev.map(x => x.id === r.id ? { ...x, priority: pval } : x));
    } catch (e: any) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => (
        <Tag color="default" style={{ fontSize: 11, margin: 0, border: '1px solid #e5e7eb' }}>
          {text}
        </Tag>
      )
    },
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <div style={{ fontWeight: 500, color: '#1f2937', fontSize: 13 }}>{text}</div>
        </Tooltip>
      )
    },
    {
      title: '答案',
      dataIndex: 'answer',
      key: 'answer',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <div style={{ color: '#4b5563', fontSize: 13 }}>
            {text || <span style={{ color: '#9ca3af' }}>—</span>}
          </div>
        </Tooltip>
      )
    },
    {
      title: '配置的知识库',
      key: 'kb_routing',
      width: 180,
      render: (_: any, row: QARoute) => {
        const kbNames = (row.route_to_kb_ids || []).map(id => kbsMap[id] || id);

        if (!row.enable_kb_routing || !kbNames.length) {
          return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {kbNames.map((name, idx) => (
              <Tag key={idx} icon={<DatabaseOutlined />} color="cyan" style={{ fontSize: 11, margin: 0 }}>
                {name}
              </Tag>
            ))}
          </div>
        );
      }
    },
    {
      title: '配置的工具',
      key: 'tool_calling',
      width: 180,
      render: (_: any, row: QARoute) => {
        const toolNames = (row.tool_names || []).map(code => toolsMap[code] || code);

        if (!row.enable_tool_call || !toolNames.length) {
          return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {toolNames.map((name, idx) => (
              <Tag key={idx} icon={<ToolOutlined />} color="orange" style={{ fontSize: 11, margin: 0 }}>
                {name}
              </Tag>
            ))}
          </div>
        );
      }
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 150,
      render: (arr: string[]) => (
        <Space wrap size={4}>
          {(arr||[]).slice(0, 2).map((k,i)=>(
            <Tag key={i} style={{fontSize:11, margin: 0, maxWidth: 60}} ellipsis>{k}</Tag>
          ))}
          {(arr||[]).length > 2 && (
            <Tooltip title={(arr||[]).slice(2).join('、')}>
              <Tag style={{fontSize:11, margin: 0, cursor: 'help'}}>+{(arr||[]).length - 2}</Tag>
            </Tooltip>
          )}
          {!(arr||[]).length && <span style={{color:'#9ca3af', fontSize:12}}>—</span>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_: any, row: any) => (
        <Space size={8}>
          <Tooltip title="编辑问答">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(row)}
              style={{
                borderColor: '#3b82f6',
                color: '#3b82f6'
              }}
            >
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确认删除该问答？"
            description={
              <div style={{ maxWidth: 300 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>问题：</div>
                <div style={{ color: '#6b7280' }}>{row.question}</div>
              </div>
            }
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={async ()=>{
              try{
                await api.delete(`/qa-dataset/qa-pairs/${row.id}`);
                message.success('已删除');
                await load();
              }catch(e:any){ message.error(e?.response?.data?.detail || '删除失败'); }
            }}
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
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
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                  scroll={{ x: 1200 }}
                  title={() => (
                    <div className="qa-table-header">
                      <div className="qa-table-header-left">
                        <div className="qa-table-title">
                          自定义问答列表
                        </div>
                        <div className="current-kb-info">
                          <DatabaseOutlined style={{ color: '#6b7280', fontSize: 12 }} />
                          <span>当前知识库：</span>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>
                            {kbs.find(k=>k.id===kbId)?.name || '未选择'}
                          </span>
                        </div>
                      </div>
                      <div className="qa-table-header-right">
                        <Space className="table-header-actions" size={12}>
                          <Tooltip title={`为知识库「${kbs.find(k=>k.id===kbId)?.name || '当前知识库'}」启用或禁用自定义问答路由`}>
                            <div className="switch-container">
                              <span className="switch-label">自定义问答路由</span>
                              <Switch
                                checked={manualEnabled}
                                checkedChildren="启用"
                                unCheckedChildren="禁用"
                                onChange={async (checked)=>{
                                  try{
                                    await api.put(`/qa-routing/knowledge-base/${kbId}/custom-dataset/enabled`, { enabled: checked });
                                    setManualEnabled(checked);
                                    // 保存到localStorage
                                    saveToggleState(kbId, checked);
                                    message.success(checked ? `已为「${kbs.find(k=>k.id===kbId)?.name}」启用自定义问答路由` : `已为「${kbs.find(k=>k.id===kbId)?.name}」禁用自定义问答路由`);
                                  }catch(e:any){
                                    message.error(e?.response?.data?.detail || '更新失败');
                                  }
                                }}
                              />
                            </div>
                          </Tooltip>
                          <Input
                            placeholder="搜索问题/答案"
                            value={q}
                            onChange={(e)=>setQ(e.target.value)}
                            style={{ width: 220 }}
                            allowClear
                          />
                          <Button onClick={load}>刷新</Button>
                          <Button type="primary" disabled={!kbId} onClick={handleOpenAddModal}>
                            添加问答
                          </Button>
                        </Space>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 增强版问答编辑Modal */}
          <EnhancedQAModal
            open={showEnhancedModal}
            onClose={() => {
              setShowEnhancedModal(false);
              setEditingQA(null);
            }}
            onSubmit={handleSubmitQA}
            currentKbId={kbId}
            mode={modalMode}
            initialData={editingQA ? {
              question: editingQA.question,
              answer: editingQA.answer,
              keywords: editingQA.keywords || [],
              category: editingQA.category,
              enable_kb_routing: editingQA.enable_kb_routing || false,
              route_to_kb_ids: editingQA.route_to_kb_ids || [],
              enable_tool_call: editingQA.enable_tool_call || false,
              tool_names: editingQA.tool_names || []
            } : undefined}
          />
        </Content>
      </Layout>
    </div>
  );
};

export default CustomQARoutesPage;
