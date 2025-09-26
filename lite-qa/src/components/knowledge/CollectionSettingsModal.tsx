import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Space,
  Typography,
  Card,
  Divider,
  message,
  Switch,
  Select,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { KnowledgeCollection } from '../../types';
import { collectionService } from '../../services/collectionService';
import { apiService } from '../../services/api';

const { Title, Text } = Typography;

interface CollectionSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  collection: KnowledgeCollection | null;
  onDeleteCollection: (collection: KnowledgeCollection) => void;
  onManageVectorIndex: (collection: KnowledgeCollection) => void;
  onRefresh?: () => void;
}

// 索引类型配置
const INDEX_TYPES = [
  {
    value: 'none',
    label: '无索引',
    description: '顺序扫描，适合小数据集（<1000条）',
    color: 'default',
    performance: '低',
    buildTime: '无',
    memoryUsage: '低'
  },
  {
    value: 'ivfflat',
    label: 'IVF-Flat',
    description: '倒排文件索引，平衡速度和精度',
    color: 'blue',
    performance: '中',
    buildTime: '快',
    memoryUsage: '中',
    params: {
      lists: 100  // 聚类中心数
    }
  },
  {
    value: 'hnsw',
    label: 'HNSW',
    description: '分层导航小世界图，高精度快速检索',
    color: 'green',
    performance: '高',
    buildTime: '慢',
    memoryUsage: '高',
    params: {
      m: 16,  // 每个节点的连接数
      ef_construction: 64  // 构建时的动态列表大小
    }
  }
];

const CollectionSettingsModal: React.FC<CollectionSettingsModalProps> = ({
  visible,
  onCancel,
  collection,
  onDeleteCollection,
  onManageVectorIndex,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('retrieval');
  const [retrievalLoading, setRetrievalLoading] = useState(false);
  const [hiragCaps, setHiragCaps] = useState<any>(null);
  const [retrievalMode, setRetrievalMode] = useState<'hybrid'|'hirag'>('hybrid');
  const [buildSessionId, setBuildSessionId] = useState<string | null>(null);
  const [buildProgress, setBuildProgress] = useState<{progress:number;stage:string;detail?:string;status:string}>({progress:0,stage:'',status:'idle'});
  const [qaExtractionLoading, setQaExtractionLoading] = useState(false);
  const [currentIndexType, setCurrentIndexType] = useState('hnsw'); // 默认使用HNSW索引
  const [indexSwitching, setIndexSwitching] = useState(false);
  // Embedding 模型设置
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [embeddingDefault, setEmbeddingDefault] = useState<{ model_id: string; provider: string }>({ model_id: '', provider: '' });
  const [embeddingCurrent, setEmbeddingCurrent] = useState<{ model_id?: string; provider?: string }>({});
  const [embeddingModels, setEmbeddingModels] = useState<Array<{ model_id: string; display_name: string; provider_name: string }>>([]);
  const [selectedEmbedding, setSelectedEmbedding] = useState<string>('__default__');

  const handleExportData = () => {
    if (!collection) return;
    message.info('导出功能开发中...');
  };

  const handleDeleteCollection = () => {
    if (!collection) return;
    onDeleteCollection(collection);
    onCancel();
  };

  // 拉取 HiRAG 能力
  useEffect(() => {
    const fetchCaps = async () => {
      if (!collection) return;
      try {
        const caps = await collectionService.getHiragCapabilities(collection.id);
        setHiragCaps(caps);
        // 读取检索配置，若未设置则默认展示为 hybrid
        const cfg = await collectionService.getRetrievalConfig(collection.id);
        const mode = cfg?.retrieval?.mode === 'hirag' ? 'hirag' : 'hybrid';
        setRetrievalMode(mode);
      } catch (e) {
        console.warn('加载HiRAG能力失败', e);
      }
    };
    fetchCaps();
  }, [collection?.id]);

  // 加载 Embedding 模型（默认、当前、列表）
  useEffect(() => {
    (async () => {
      if (!collection?.id) return;
      try {
        setEmbeddingLoading(true);
        let data: any = {};
        try {
          data = await apiService.get<any>(`/collections/${collection.id}/embedding-model`);
        } catch (e) {
          data = {};
        }
        // 默认与当前
        const def = (data && data.default) || { model_id: '', provider: '' };
        const cur = (data && data.current) || {};
        setEmbeddingDefault(def);
        setEmbeddingCurrent(cur);
        // 可用模型列表（优先集合端点提供，空则回退统一网关清单）
        let models = Array.isArray(data?.available_models) ? data.available_models : [];
        if (!models.length) {
          try {
            const fallback = await collectionService.getEmbeddingDefaultsAndModels();
            if (fallback && Array.isArray(fallback.models)) {
              models = fallback.models.map((m: any) => ({
                model_id: m.model_id,
                display_name: m.display_name || m.model_id,
                provider_name: m.provider_name || m.provider || ''
              }));
              // 若默认为空则用回退默认
              if ((!def.model_id || !def.provider) && fallback.default) {
                setEmbeddingDefault({ model_id: fallback.default.model_id || '', provider: fallback.default.provider || '' });
              }
            }
          } catch {}
        } else {
          models = models.map((m: any) => ({
            model_id: m.model_id || m.id,
            display_name: m.display_name || m.model_id || m.id,
            provider_name: m.provider || m.provider_name || ''
          }));
        }
        setEmbeddingModels(models);
        // 选择值
        if (cur && cur.model_id && cur.provider) {
          setSelectedEmbedding(`${cur.provider}::${cur.model_id}`);
        } else {
          setSelectedEmbedding('__default__');
        }
      } catch (e) {
        console.warn('加载集合Embedding配置失败', e);
      } finally {
        setEmbeddingLoading(false);
      }
    })();
  }, [collection?.id]);

  // 监听构建进度（SSE）
  useEffect(() => {
    const onProgress = (e: any) => {
      const d = e.detail || {};
      if (!buildSessionId) return;
      setBuildProgress({
        progress: d.progress ?? 0,
        stage: d.stage ?? '',
        detail: d.detail,
        status: d.status ?? 'running'
      });
    };
    const onCompleted = (e: any) => {
      const d = e.detail || {};
      if (!buildSessionId) return;
      setBuildProgress({ progress: 100, stage: '完成', detail: d.detail, status: 'completed' });
      // 完成后刷新能力与配置
      (async () => {
        if (collection) {
          const updated = await collectionService.getHiragCapabilities(collection.id);
          setHiragCaps(updated);
          // 自动切换为HiRAG
          try {
            await collectionService.setRetrievalConfig(collection.id, 'hirag', true);
            message.success('构建完成，已启用 HiRAG');
            onRefresh?.();
          } catch (e:any) {
            message.warning('构建完成，但启用失败，请手动切换');
          }
        }
      })();
    };
    const onFailed = (e: any) => {
      const d = e.detail || {};
      if (!buildSessionId) return;
      setBuildProgress({ progress: d.progress ?? 0, stage: '失败', detail: d.detail, status: 'failed' });
      message.error(`构建失败：${d.detail || d.error_message || '未知错误'}`);
    };

    window.addEventListener('sse-task-progress', onProgress as any);
    window.addEventListener('sse-task-completed', onCompleted as any);
    window.addEventListener('sse-task-failed', onFailed as any);
    return () => {
      window.removeEventListener('sse-task-progress', onProgress as any);
      window.removeEventListener('sse-task-completed', onCompleted as any);
      window.removeEventListener('sse-task-failed', onFailed as any);
    };
  }, [buildSessionId, collection?.id]);

  const handleEnableHirag = async () => {
    if (!collection) return;
    try {
      setRetrievalLoading(true);
      // 检查全局状态
      const status = await collectionService.getHiragStatus();
      if (!status?.ready) {
        Modal.error({
          title: '无法启用 HiRAG',
          content: '全局模型网关不可用或默认模型未配置，请先在模型网关设置默认聊天与嵌入模型。'
        });
        return;
      }

      // 检查集合能力
      const caps = await collectionService.getHiragCapabilities(collection.id);
      setHiragCaps(caps);

      if (caps?.ready) {
        Modal.confirm({
          title: '启用 HiRAG 检索',
          content: '启用后将使用层次检索（HiRAG），基于实体-图谱-社区报告多层次知识增强。是否启用？',
          onOk: async () => {
            await collectionService.setRetrievalConfig(collection.id, 'hirag', true);
            message.success('已启用 HiRAG');
            onRefresh?.();
            const updated = await collectionService.getHiragCapabilities(collection.id);
            setHiragCaps(updated);
            setRetrievalMode('hirag');
          }
        });
      } else {
        // 先 dryRun 预估
        const est = await collectionService.hiragIndexDryRun(collection.id);
        Modal.confirm({
          title: '构建 HiRAG 索引',
          content: (
            <div>
              <div>将执行实体/关系抽取与社区报告生成。</div>
              <div style={{ marginTop: 8 }}>预估：</div>
              <ul style={{ marginLeft: 20 }}>
                <li>文档数：{est?.stats?.documents ?? 0}</li>
                <li>分块数：{est?.stats?.chunks ?? 0}</li>
                <li>估算 Tokens：{est?.stats?.est_tokens ?? 0}</li>
              </ul>
              <div style={{ marginTop: 8 }}>确认后将开始构建，完成后自动启用 HiRAG。</div>
            </div>
          ),
          okText: '开始构建',
          onOk: async () => {
            const sessionId = 'hirag_' + Date.now();
            setBuildSessionId(sessionId);
            // 建立SSE连接
            const { documentStatusSSE } = await import('../../services/sseService');
            await documentStatusSSE.connect(sessionId, true);
            await collectionService.hiragIndexConfirm(collection.id, sessionId, true);
            message.success('已开始构建');
          }
        });
      }
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '操作失败');
    } finally {
      setRetrievalLoading(false);
    }
  };

  const handleDisableHirag = async () => {
    if (!collection) return;
    Modal.confirm({
      title: '切换为通用混合检索',
      content: '确认切换为通用混合检索（Hybrid）？',
      onOk: async () => {
        try {
          setRetrievalLoading(true);
          await collectionService.setRetrievalConfig(collection.id, 'hybrid', false);
          message.success('已切换为 Hybrid');
          onRefresh?.();
          const updated = await collectionService.getHiragCapabilities(collection.id);
          setHiragCaps(updated);
          setRetrievalMode('hybrid');
        } catch (e: any) {
          message.error(e?.message || '操作失败');
        } finally {
          setRetrievalLoading(false);
        }
      }
    });
  };

  const handleQAToggle = async (enabled: boolean) => {
    if (!collection) return;
    
    try {
      setQaExtractionLoading(true);
      console.log('🔄 准备切换QA提取状态:', { collectionId: collection.id, enabled, currentValue: collection.auto_qa_extraction_enabled });
      
      // 调用API切换QA提取状态
      const result = await collectionService.toggleQAExtraction(collection.id, enabled);
      console.log('🎯 API返回结果:', result);
      
      if (result.success) {
        // 立即更新本地collection对象的状态
        if (collection) {
          collection.auto_qa_extraction_enabled = enabled;
        }
        
        message.success(enabled ? 'QA自动提取已开启' : 'QA自动提取已关闭');
        
        // 延迟刷新以确保状态更新
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 100);
      } else {
        message.error('设置失败，请重试');
      }
    } catch (error: any) {
      console.error('❌ QA提取开关操作失败:', error);
      console.error('❌ 错误详情:', error.response?.data || error.message);
      message.error(`设置失败: ${error.response?.data?.detail || error.message || '请重试'}`);
    } finally {
      setQaExtractionLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          <span>知识库设置</span>
          {collection && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              - {collection.name}
            </Text>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      className="collection-settings-modal"
    >
      {collection && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'retrieval',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ThunderboltOutlined />
                  检索模式
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert
                    type="info"
                    showIcon
                    message="检索模式切换"
                    description={
                      <div>
                        <div>当前集合 {collection?.name}</div>
                        <div style={{ marginTop: 6 }}>
                          当前模式：
                          <Tag color={retrievalMode === 'hirag' ? 'green' : 'blue'}>
                            {retrievalMode === 'hirag' ? 'HiRAG' : 'Hybrid（默认）'}
                          </Tag>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          能力状态：
                          <Tag color={hiragCaps?.enabled ? 'green' : 'default'}>
                            {hiragCaps?.enabled ? 'HiRAG已启用' : '未启用'}
                          </Tag>
                          <Tag color={hiragCaps?.ready ? 'green' : 'default'}>
                            {hiragCaps?.ready ? '已构建' : '未构建'}
                          </Tag>
                        </div>
                      </div>
                    }
                  />
                  <Space>
                    {retrievalMode === 'hybrid' ? (
                      <Button type="primary" loading={retrievalLoading} onClick={handleEnableHirag}>
                        启用 HiRAG 检索
                      </Button>
                    ) : (
                      <Button danger loading={retrievalLoading} onClick={handleDisableHirag}>
                        切换为 Hybrid
                      </Button>
                    )}
                  </Space>
                  {buildSessionId && (
                    <Card size="small" style={{ marginTop: 12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontWeight:500 }}>构建进度：{buildProgress.progress}%</div>
                          <div style={{ color:'#666', fontSize:12 }}>{buildProgress.stage} {buildProgress.detail ? `- ${buildProgress.detail}` : ''}</div>
                        </div>
                        <div><Tag color={buildProgress.status==='completed'?'green':buildProgress.status==='failed'?'red':'blue'}>{buildProgress.status}</Tag></div>
                      </div>
                    </Card>
                  )}
                  <div>
                    <Text type="secondary">启用将使用层次检索（实体-图谱-社区报告）。未构建将先进行索引构建。</Text>
                  </div>

                  {/* 模式说明 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Card size="small" title={<span><InfoCircleOutlined style={{ marginRight: 6, color: '#1890ff' }} />Hybrid（通用混合检索）</span>}>
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                        <li>关键词（BM25） + 向量（script_score）混合召回</li>
                        <li>支持结构化过滤（时间/标签/模板字段）</li>
                        <li>零等待：无需额外构建，适合大多数常规检索</li>
                        <li>响应快、资源占用低，默认推荐</li>
                      </ul>
                    </Card>
                    <Card size="small" title={<span><InfoCircleOutlined style={{ marginRight: 6, color: '#52c41a' }} />HiRAG（分层检索）</span>}>
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                        <li>基于实体-关系图与“社区报告”的多层次检索</li>
                        <li>返回更全面、可解释的证据（实体/路径/社区）</li>
                        <li>首次启用需构建：实体/关系抽取 + 社区报告生成</li>
                        <li>适合政策/研究等复杂综合问题的检索与洞察</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              )
            },
            {
              key: 'embedding',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DatabaseOutlined />
                  向量模型
                </span>
              ),
              children: (
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">默认模型</Text>
                      <div style={{ marginTop: 4, display:'flex', alignItems:'center', gap:8 }}>
                        <Tag color="blue">默认</Tag>
                        {embeddingDefault?.provider ? (
                          <Tag color="cyan">{embeddingDefault.provider}</Tag>
                        ) : (
                          <Tag>未配置</Tag>
                        )}
                        <span style={{ color: '#334155' }}>{embeddingDefault?.model_id || '—'}</span>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text strong>当前模型</Text>
                      <div style={{ marginTop: 8 }}>
                        <Select
                          loading={embeddingLoading}
                          value={selectedEmbedding}
                          onChange={setSelectedEmbedding as any}
                          style={{ width: 420 }}
                        >
                          <Select.Option key="__default__" value="__default__">
                            <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                              <Tag color="cyan">{embeddingDefault?.provider || '默认'}</Tag>
                              <span>{embeddingDefault?.display_name || embeddingDefault?.model_id || '—'}</span>
                            </span>
                          </Select.Option>
                          {embeddingModels.map(m => (
                            <Select.Option key={`${m.provider_name}::${m.model_id}`} value={`${m.provider_name}::${m.model_id}`}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                                <Tag color="cyan">{m.provider_name || 'local'}</Tag>
                                <span>{m.display_name}</span>
                                <span style={{ color:'#94a3b8' }}>({m.model_id})</span>
                              </span>
                            </Select.Option>
                          ))}
                        </Select>
                        <Button
                          type="primary"
                          style={{ marginLeft: 12 }}
                          loading={embeddingLoading}
                          onClick={async ()=>{
                            if (!collection?.id) return;
                            try {
                              setEmbeddingLoading(true);
                              let model_id: string; let provider: string;
                              if (selectedEmbedding === '__default__') { model_id = embeddingDefault.model_id; provider = embeddingDefault.provider; }
                              else { const [prov, mid] = selectedEmbedding.split('::'); provider = prov; model_id = mid; }
                              await apiService.post(`/collections/${collection.id}/embedding-model/set`, { model_id, provider, dryRun: false, forceReindex: true });
                              message.success('已应用，正在重向量化...');
                            } catch (e: any) {
                              message.error(e?.message || '应用失败');
                            } finally {
                              setEmbeddingLoading(false);
                            }
                          }}
                        >应用并重建</Button>
                      </div>
                    </div>
                  </Space>
                </Card>
              )
            },
            {
              key: 'index',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ThunderboltOutlined />
                  向量索引管理
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 当前索引状态 */}
                  <Alert
                    message="向量索引配置"
                    description={
                      <div>
                        <Text>pgvector 版本: 0.8.0 | 支持索引类型: IVF-Flat, HNSW</Text>
                        <br />
                        <Text type="secondary">向量索引可以大幅提升检索速度，选择合适的索引类型以平衡性能和资源消耗</Text>
                      </div>
                    }
                    type="info"
                    icon={<InfoCircleOutlined />}
                    showIcon
                  />

                  {/* 索引统计 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>{collection.document_count || 0}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>文档总数</Text>
                    </Card>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <BarChartOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>{collection.vectorized_count || 0}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>已向量化</Text>
                    </Card>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>
                        <Tag color={INDEX_TYPES.find(t => t.value === currentIndexType)?.color}>
                          {INDEX_TYPES.find(t => t.value === currentIndexType)?.label}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>当前索引</Text>
                    </Card>
                  </div>

                  {/* 索引类型选择 */}
                  <Card size="small" title="索引类型配置">
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>选择索引类型：</Text>
                      <Select
                        value={currentIndexType}
                        onChange={(value) => {
                          Modal.confirm({
                            title: '切换索引类型',
                            content: `确认要切换到 ${INDEX_TYPES.find(t => t.value === value)?.label} 索引吗？这将重建ES索引并重推本集合，可能需要一些时间。`,
                            onOk: async () => {
                              try {
                                setIndexSwitching(true);
                                const { knowledgeService } = await import('../../services/knowledgeService');
                                const indexing = value === 'hnsw' ? 'hnsw' : 'none';
                                // 1) 重建全局索引
                                await knowledgeService.initSearchIndex(true, 1024, indexing as any);
                                // 2) 重推当前集合
                                if (collection) {
                                  await knowledgeService.reindexCollection(collection.id, false, 1024);
                                }
                                setCurrentIndexType(value);
                                message.success('索引切换成功');
                              } catch (e: any) {
                                message.error(e?.message || '索引切换失败');
                              } finally {
                                setIndexSwitching(false);
                              }
                            }
                          });
                        }}
                        style={{ width: '100%', marginTop: '8px' }}
                        loading={indexSwitching}
                      >
                        {INDEX_TYPES.map(type => (
                          <Select.Option key={type.value} value={type.value}>
                            <div>
                              <Tag color={type.color}>{type.label}</Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {type.description}
                              </Text>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    {/* 索引类型对比 */}
                    <Divider />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {INDEX_TYPES.map(type => (
                        <Card 
                          key={type.value} 
                          size="small" 
                          style={{ 
                            border: currentIndexType === type.value ? '1px solid #1890ff' : '1px solid #f0f0f0',
                            background: currentIndexType === type.value ? '#f6ffed' : '#fafafa'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ marginBottom: '8px' }}>
                                <Tag color={type.color}>{type.label}</Tag>
                                {currentIndexType === type.value && (
                                  <Tag color="green">当前使用</Tag>
                                )}
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {type.description}
                              </Text>
                              {type.params && (
                                <div style={{ marginTop: '8px' }}>
                                  <Text type="secondary" style={{ fontSize: '11px' }}>
                                    参数: {JSON.stringify(type.params)}
                                  </Text>
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px' }}>
                              <div><Text type="secondary">性能:</Text> <Tag color={type.performance === '高' ? 'green' : type.performance === '中' ? 'blue' : 'default'}>{type.performance}</Tag></div>
                              <div style={{ marginTop: '4px' }}><Text type="secondary">构建:</Text> <Text>{type.buildTime}</Text></div>
                              <div style={{ marginTop: '4px' }}><Text type="secondary">内存:</Text> <Text>{type.memoryUsage}</Text></div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* 建议提示 */}
                    <Alert
                      message="选择建议"
                      description={
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                          <li>小于 1,000 条向量：使用无索引（顺序扫描）</li>
                          <li>1,000 - 100,000 条向量：使用 IVF-Flat 索引</li>
                          <li>超过 100,000 条向量：使用 HNSW 索引获得最佳性能</li>
                        </ul>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  </Card>
                </div>
              )
            },
            {
              key: 'export',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExportOutlined />
                  导出数据
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title level={5} className="mb-1">数据导出</Title>
                        <Text type="secondary">
                          导出知识库中的文档和向量数据
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        icon={<ExportOutlined />}
                        onClick={handleExportData}
                      >
                        导出数据
                      </Button>
                    </div>
                  </Card>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Card size="small" hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>文档数据</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              导出原始文档内容和元数据
                            </Text>
                          </div>
                        </div>
                        <Button size="small" disabled>即将支持</Button>
                      </div>
                    </Card>
                    
                    <Card size="small" hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <DatabaseOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>向量数据</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              导出文档的向量嵌入数据
                            </Text>
                          </div>
                        </div>
                        <Button size="small" disabled>即将支持</Button>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            },
            {
              key: 'qa-extraction',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QuestionCircleOutlined />
                  QA对提取
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Title level={5} style={{ marginBottom: '4px' }}>自动QA对提取</Title>
                        <Text type="secondary">
                          开启后，文档上传时将自动执行QA对提取任务
                        </Text>
                      </div>
                      <Switch
                        checked={collection?.auto_qa_extraction_enabled || false}
                        onChange={handleQAToggle}
                        loading={qaExtractionLoading}
                        checkedChildren="开启"
                        unCheckedChildren="关闭"
                      />
                    </div>
                  </Card>
                  
                  <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <QuestionCircleOutlined style={{ fontSize: '16px', color: '#52c41a', marginTop: '2px' }} />
                      <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#52c41a' }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>功能说明：</div>
                        <div>• 开启后，所有新上传的文档将自动提取QA对</div>
                        <div>• 提取的QA对将自动同步到对应的QA数据集</div>
                        <div>• 可在文档列表的任务管理中查看提取进度</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: 'danger',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DeleteOutlined />
                  危险操作
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card size="small" style={{ borderColor: '#ffccc7' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <DeleteOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '8px' }} />
                        <Title level={4} style={{ color: '#cf1322', marginBottom: '4px' }}>删除知识库</Title>
                        <Text type="secondary">
                          此操作将永久删除知识库及其所有数据，无法恢复
                        </Text>
                      </div>
                      
                      <Divider />
                      
                      <div style={{ 
                        backgroundColor: '#fff2f0', 
                        padding: '16px', 
                        borderRadius: '6px', 
                        border: '1px solid #ffccc7' 
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                          <Text strong style={{ color: '#a8071a' }}>删除前请确认：</Text>
                          <ul style={{ 
                            fontSize: '14px', 
                            color: '#cf1322', 
                            marginLeft: '16px',
                            lineHeight: 1.6
                          }}>
                            <li>• 所有文档和分块数据将被永久删除</li>
                            <li>• 所有向量索引将被清除</li>
                            <li>• 所有相关的QA数据集将被删除</li>
                            <li>• 此操作无法撤销</li>
                          </ul>
                        </div>
                      </div>
                      
                      <Button
                        danger
                        type="primary"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteCollection}
                        size="large"
                      >
                        确认删除知识库
                      </Button>
                    </div>
                  </Card>
                </div>
              )
            }
          ]}
        />
      )}
    </Modal>
  );
};

export default CollectionSettingsModal;
