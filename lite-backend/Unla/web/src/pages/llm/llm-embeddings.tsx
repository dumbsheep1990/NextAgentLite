import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Switch, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import ProviderIcon from '@/components/ProviderIcon';
import LocalIcon from '@/components/LocalIcon';
import AddEmbeddingModelModal from '@/pages/llm/components/AddEmbeddingModelModal';
import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/llm-providers';
import { llmConfigApi } from '@/services/llm-config';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { toast } from '@/utils/toast';

const EMBEDDING_WHITELIST = new Set([
  'ollama','vllm','xinference','huggingface','openrouter','cohere','qwen','wenxin','tencentcloud','zhipu','siliconcloud','minimax','moonshot','jina','openai','custom'
]);

const LLMEmbeddingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { providers: llmProviders, updateProvider } = useLLMConfig();
  const [providers, setProviders] = useState<any[]>([]);
  const [providerQuery, setProviderQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [hasUserSelected, setHasUserSelected] = useState<boolean>(false);

  const [models, setModels] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<{ default_embedding?: string }>({});
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [showAddEmbedModal, setShowAddEmbedModal] = useState(false);
  const [remoteModels, setRemoteModels] = useState<string[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [providerStats, setProviderStats] = useState<Record<string,{enabled:number;total:number;hasDefault?:boolean}>>({});
  const [showUnsetDialog, setShowUnsetDialog] = useState(false);
  const [pendingUnsetModelId, setPendingUnsetModelId] = useState<string>('');
  const [editTemp, setEditTemp] = useState<Record<string, { dim?: number; ctx?: number }>>({});

  // 计算默认模型所属的厂商ID（用于显示厂商图标）
  const defaultProviderId = useMemo(() => {
    for (const pid of Object.keys(providerStats)) {
      if (providerStats[pid]?.hasDefault) return pid;
    }
    return '';
  }, [providerStats]);
  const selectedProvider = useMemo(() => DEFAULT_MODEL_PROVIDER_LIST.find(p => p.id === selectedProviderId), [selectedProviderId]);

  const filteredProviders = useMemo(() => {
    const base = DEFAULT_MODEL_PROVIDER_LIST.filter(p => EMBEDDING_WHITELIST.has(p.id));
    const list = [...base, { id: 'custom_embedding', name: '自定义向量模型' } as any];
    const q = providerQuery.trim().toLowerCase();
    const filtered = q ? list.filter(p => (p.name || p.id).toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) : list;
    // 重排：默认模型所在厂商优先，其次启用厂商优先
    const enabledMap = new Map<string, boolean>(llmProviders.map((p:any)=> [p.id, !!p.enabled]));
    return filtered.slice().sort((a:any,b:any)=>{
      const aDef = providerStats[a.id]?.hasDefault ? 1 : 0;
      const bDef = providerStats[b.id]?.hasDefault ? 1 : 0;
      if (aDef !== bDef) return bDef - aDef;
      const aEn = enabledMap.get(a.id)? 1: 0;
      const bEn = enabledMap.get(b.id)? 1: 0;
      if (aEn !== bEn) return bEn - aEn;
      return 0;
    });
  }, [providerQuery, llmProviders, providerStats]);

  const loadDefaults = async () => {
    const d = await llmConfigApi.getDefaults();
    setDefaults(d || {});
  };

  const loadModels = async (providerId: string) => {
    if (!providerId) { setModels([]); return; }
    const ms = await llmConfigApi.listModels({ provider: providerId });
    setModels(ms || []);
  };

  useEffect(() => { loadDefaults(); }, []);
  useEffect(() => { if (selectedProviderId) loadModels(selectedProviderId === 'custom_embedding' ? 'custom' : selectedProviderId); }, [selectedProviderId]);
  // 首次进入页面或列表变化时，自动选中列表第一项并加载对应模型
  useEffect(() => {
    if (filteredProviders.length === 0) return;
    const firstId = filteredProviders[0].id as string;
    // 初次或未手动选择时，始终跟随排序后的第一项
    if ((selectedProviderId === '' || !hasUserSelected) && firstId !== selectedProviderId) {
      setSelectedProviderId(firstId);
    }
  }, [filteredProviders, selectedProviderId, hasUserSelected]);

  useEffect(() => {
    (async () => {
      const stats: Record<string,{enabled:number;total:number;hasDefault?:boolean}> = {};
      for (const p of DEFAULT_MODEL_PROVIDER_LIST.filter(p=>EMBEDDING_WHITELIST.has(p.id))) {
        try {
          const ms = await llmConfigApi.listModels({ provider: p.id });
          const total = Array.isArray(ms) ? ms.length : 0;
          const enabled = Array.isArray(ms) ? ms.filter((m:any)=> m.status==='active').length : 0;
          const hasDefault = defaults?.default_embedding ? (Array.isArray(ms) ? ms.some((m:any)=> m.model_id === defaults.default_embedding) : false) : false;
          stats[p.id] = { enabled, total, hasDefault };
        } catch {}
      }
      setProviderStats(stats);
    })();
  }, [defaults]);

  const handleSelectProvider = (pid: string) => {
    setSelectedProviderId(pid);
    setHasUserSelected(true);
    setNewModelId(''); setNewModelName('');
  };

  const handleAddModel = async () => {
    if (selectedProviderId !== 'custom_embedding' || !newModelId.trim()) { toast.error('请在自定义向量模型中添加'); return; }
    await llmConfigApi.createModel({ provider: 'custom', model_id: newModelId.trim(), display_name: newModelName.trim() });
    toast.success('已添加');
    setNewModelId(''); setNewModelName('');
    await loadModels('custom');
  };

  const buildAuthHeaders = (pid: string) => {
    const p = llmProviders.find(p => p.id === pid);
    const cfg = p?.config || {} as any;
    const headers: Record<string,string> = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers['Authorization'] = `Bearer ${String(cfg.apiKey)}`;
    if (pid === 'anthropic') headers['anthropic-version'] = '2023-06-01';
    return headers;
  };

  const getBaseURL = (pid: string) => {
    const p = llmProviders.find(p => p.id === pid);
    return (p?.config as any)?.baseURL || '';
  };

  const fetchEmbeddingModels = async () => {
    if (!selectedProviderId) return;
    setLoadingRemote(true);
    try {
      const base = getBaseURL(selectedProviderId);
      const headers = buildAuthHeaders(selectedProviderId);
      let url = '';
      if (selectedProviderId === 'siliconcloud') {
        url = `${base || 'https://api.siliconflow.cn/v1'}/models?sub_type=embedding&type=text`;
      } else if (selectedProviderId === 'openai') {
        url = `${base || 'https://api.openai.com/v1'}/models`;
      } else if (selectedProviderId === 'ollama') {
        url = `${base || 'http://localhost:11434'}/api/tags`;
      } else {
        // 尝试通用模型列表
        url = `${base}/v1/models`;
      }
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error(`${resp.status}`);
      const data = await resp.json();
      let ids: string[] = [];
      if (selectedProviderId === 'siliconcloud') {
        // data.data[] with id
        ids = (data.data || []).map((m: any) => m.id);
      } else if (selectedProviderId === 'openai') {
        ids = (data.data || []).map((m: any) => m.id).filter((id: string)=> id.includes('embedding'));
      } else if (selectedProviderId === 'ollama') {
        ids = (data.models || []).map((m: any) => m.name).filter((id: string)=> id.toLowerCase().includes('embed'));
      } else {
        ids = (data.data || []).map((m: any) => m.id).filter((id: string)=> id.toLowerCase().includes('embed'));
      }
      setRemoteModels(ids);
      // 持久化保存至该厂商下（初始为未启用），并刷新本地DB列表
      const providerId = selectedProviderId === 'custom_embedding' ? 'custom' : selectedProviderId;
      if (ids.length > 0 && providerId && providerId !== 'custom') {
        try { await llmConfigApi.bulkUpsertModels({ provider: providerId, models: ids }); } catch {}
        await loadModels(providerId);
      }
    } catch (e) {
      setRemoteModels([]);
    } finally {
      setLoadingRemote(false);
    }
  };

  const enableRemoteModel = async (mid: string) => {
    if (!selectedProviderId) return;
    // 若已存在于DB，设为active；否则创建
    const exists = models.find(m => m.model_id === mid);
    if (exists) {
      await llmConfigApi.setModelStatus({ provider: selectedProviderId, model_id: mid, status: 'active' });
    } else {
      await llmConfigApi.createModel({ provider: selectedProviderId, model_id: mid, display_name: mid });
    }
    await loadModels(selectedProviderId);
  };

  const handleSetDefault = async (modelId: string) => {
    const providerId = selectedProviderId === 'custom_embedding' ? 'custom' : selectedProviderId;
    try {
      // 若该模型未启用或未写入DB，则先确保其为active
      const exists = models.find((m:any)=> m.model_id === modelId);
      if (!exists) {
        await llmConfigApi.createModel({ provider: providerId, model_id: modelId, display_name: modelId });
        await llmConfigApi.setModelStatus({ provider: providerId, model_id: modelId, status: 'active' });
        await loadModels(providerId);
      } else if (exists.status !== 'active') {
        await llmConfigApi.setModelStatus({ provider: providerId, model_id: modelId, status: 'active' });
        await loadModels(providerId);
      }

      // 设置为默认
      await llmConfigApi.setDefaults({ default_embedding: modelId });
      toast.success('已设为默认Embedding');
      await loadDefaults();
    } catch (e) {
      toast.error('设置默认Embedding失败');
    }
  };

  const handleUnsetDefault = (mid: string) => {
    setPendingUnsetModelId(mid);
    setShowUnsetDialog(true);
  };

  const confirmUnsetDefault = async () => {
    try {
      await llmConfigApi.setDefaults({ default_embedding: '' as any });
      toast.success('已取消默认Embedding');
      await loadDefaults();
    } finally {
      setShowUnsetDialog(false);
      setPendingUnsetModelId('');
    }
  };

  // 展示列表：把 DB 中的模型与远程获取但未配置的模型合并为一个列表，统一用开关操作
  const displayModels = useMemo(() => {
    const ids = new Set((models || []).map((m:any)=> m.model_id));
    const base = (models || []).map((m:any) => ({
      key: String(m.id),
      mid: m.model_id,
      name: m.display_name || m.model_id,
      active: m.status === 'active',
      source: 'db' as const,
      dim: m.dimension,
      ctx: m.context_window,
    }));
    const remote = (remoteModels || []).filter(id => !ids.has(id)).map((id) => ({
      key: `remote:${id}`,
      mid: id,
      name: id,
      active: false,
      source: 'remote' as const,
      dim: undefined as any,
      ctx: undefined as any,
    }));
    return [...base, ...remote].sort((a,b)=> (a.active===b.active? 0 : a.active? -1: 1));
  }, [models, remoteModels]);

  const toggleDisplayModel = async (item: { mid: string; active: boolean; source: 'db'|'remote' }) => {
    const providerId = selectedProviderId === 'custom_embedding' ? 'custom' : selectedProviderId;
    if (!providerId) return;
    if (item.active) {
      // active -> inactive
      await llmConfigApi.setModelStatus({ provider: providerId, model_id: item.mid, status: 'inactive' });
    } else {
      // inactive -> active
      const exists = models.find((m:any)=> m.model_id === item.mid);
      if (exists) {
        await llmConfigApi.setModelStatus({ provider: providerId, model_id: item.mid, status: 'active' });
      } else {
        await llmConfigApi.createModel({ provider: providerId, model_id: item.mid, display_name: item.mid });
      }
    }
    await loadModels(providerId);
  };

  // 当当前厂商的模型发生变化时，同步更新左侧该厂商的统计（启用/总数），保证刷新前也能反映最新状态
  useEffect(() => {
    if (!selectedProviderId) return;
    const total = Array.isArray(models) ? models.length : 0;
    const enabled = Array.isArray(models) ? models.filter((m:any)=> m.status === 'active').length : 0;
    setProviderStats(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...(prev[selectedProviderId] || {}),
        total,
        enabled,
        hasDefault: (!!defaults?.default_embedding) ? models.some((m:any)=> m.model_id === defaults.default_embedding) : (prev[selectedProviderId]?.hasDefault || false),
      }
    }));
  }, [models, selectedProviderId, defaults]);

  return (<>
    <div className="p-4 flex h-full w-full gap-4">
      {/* 左侧：厂商列表（宽度与模型配置页一致 w-80） */}
      <div className="w-80 flex-shrink-0">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-lg">向量模型厂商</div>
          </div>
          <Input
            placeholder="搜索厂商"
            value={providerQuery}
            onChange={(e) => setProviderQuery(e.target.value)}
          />
          <div className="mt-3 space-y-1 max-h-[80vh] overflow-auto">
            {filteredProviders.map(p => {
              const isCustom = p.id === 'custom_embedding';
              const isSelected = selectedProviderId === p.id;
              const isEnabled = !!llmProviders.find(x=>x.id===p.id)?.enabled;
              const baseClass = isCustom
                ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
                : (isSelected
                    ? 'border-primary bg-primary/5'
                    : (isEnabled ? 'border-success/60 bg-success/10' : 'border-default-200 hover:bg-default-100'));
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProvider(p.id)}
                  className={`w-full px-3 py-2 rounded-lg border ${baseClass}`}
                >
                  {isCustom ? (
                    <div className="w-full flex items-center justify-center gap-2">
                      <LocalIcon icon="lucide:plus" className="w-5 h-5 text-yellow-700" />
                      <span className="font-medium">{p.name || p.id}</span>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProviderIcon providerId={p.id} className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium flex items-center gap-2">
                            <span>{p.name || p.id}</span>
                            <span className="text-xs text-default-500">{(providerStats[p.id]?.enabled||0)} / {(providerStats[p.id]?.total||0)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {providerStats[p.id]?.hasDefault && (
                          <span className="w-2 h-2 rounded-full bg-success inline-block" title="默认模型在该厂商" />
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 右侧：模型列表与默认设置 */}
      <div className="flex-1 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 标题：厂商图标 + 名称 + 状态 + 数量 */}
              {selectedProviderId ? (
                selectedProviderId === 'custom_embedding' ? (
                  <LocalIcon icon="lucide:plus" className="w-5 h-5 text-yellow-700" />
                ) : (
                  <ProviderIcon providerId={selectedProviderId} className="w-5 h-5" />
                )
              ) : null}
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">
                  {selectedProviderId === 'custom_embedding' ? '自定义模型' : (selectedProvider?.name || selectedProviderId || '请选择厂商')}
                </span>
                {selectedProviderId && selectedProviderId !== 'custom_embedding' && (
                  <Chip
                    size="sm"
                    color={(llmProviders.find(p=>p.id===selectedProviderId)?.enabled) ? 'success' : 'default'}
                    variant="flat"
                    className="text-2xs"
                  >
                    {(llmProviders.find(p=>p.id===selectedProviderId)?.enabled) ? '已启用' : '未启用'}
                  </Chip>
                )}
                {selectedProviderId && selectedProviderId !== 'custom_embedding' && providerStats[selectedProviderId]?.hasDefault && (
                  <span className="w-2 h-2 rounded-full bg-success inline-block" title="默认模型在该厂商" />
                )}
                {selectedProviderId && selectedProviderId !== 'custom_embedding' && (
                  <span className="text-xs text-default-500">
                    {(providerStats[selectedProviderId]?.enabled || 0)} / {(providerStats[selectedProviderId]?.total || 0)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedProviderId && selectedProviderId !== 'custom_embedding' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">启用</span>
                  <Switch size="sm" isSelected={!!llmProviders.find(p=>p.id===selectedProviderId)?.enabled} onValueChange={(v)=> updateProvider(selectedProviderId, { enabled: v })} />
                </div>
              )}
              {selectedProviderId !== 'custom_embedding' && (
                <Button size="sm" variant="flat" isLoading={loadingRemote} onPress={fetchEmbeddingModels} isDisabled={!selectedProviderId}>获取模型</Button>
              )}
              <div className="text-sm text-default-500">
                <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-default-200 bg-default-100" title="当前默认Embedding">
                  {/* 厂商图标 */}
                  {defaultProviderId ? (
                    <ProviderIcon providerId={defaultProviderId} className="w-4 h-4" />
                  ) : (
                    <LocalIcon icon="lucide:dot" className="w-4 h-4 text-default-400" />
                  )}
                  {/* 默认标记小圆点 */}
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  <span className="text-xs text-default-600">默认</span>
                  <span className="text-xs font-medium text-foreground max-w-[260px] truncate">{defaults?.default_embedding || '-'}</span>
                </span>
              </div>
            </div>
          </div>
          {selectedProviderId === 'custom_embedding' && (
            <div className="mt-4">
              <Button color="primary" startContent={<LocalIcon icon="lucide:plus" />} onPress={() => setShowAddEmbedModal(true)}>添加自定义向量模型</Button>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="font-bold">向量模型</div>
            <div className="flex items-center gap-1 text-xs text-default-500">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{displayModels.filter(m=>m.active).length}</span>
              <span>/</span>
              <span className="text-default-400">{displayModels.length}</span>
            </div>
          </div>
          {/* 缩短可视高度，内部滚动，避免整页滚动 */}
          <div className="space-y-1 max-h-[80vh] overflow-auto pr-2">
            {displayModels.map((item) => (
              <div key={item.key} className="p-3 rounded-lg border border-default-200 bg-background hover:bg-default-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      {item.active ? (
                        <Chip size="sm" color="success" variant="flat" className="text-xs">启用</Chip>
                      ) : (
                        <Chip size="sm" variant="flat" className="text-xs">未启用</Chip>
                      )}
                      {item.source === 'remote' && (
                        <Chip size="sm" variant="flat" className="text-xs">未配置</Chip>
                      )}
                    </div>
                    <div className="text-xs text-default-400">{item.mid}</div>
                    <div className="text-xs text-default-400 flex items-center gap-2">
                      {item.source === 'db' ? (
                        <>
                          <span>维度：</span>
                          <Popover>
                            <PopoverTrigger>
                              <Button size="sm" variant="light" className="min-w-unit-10 h-7 text-xs px-2">
                                {item.dim || '-'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-1 w-32">
                              <Input
                                size="sm"
                                type="number"
                                className="w-24 h-7 text-xs"
                                classNames={{ inputWrapper: 'h-7 min-h-7', input: 'text-xs' } as any}
                                defaultValue={item.dim ? String(item.dim) : ''}
                                onChange={(e)=> setEditTemp(prev => ({ ...prev, [item.mid]: { ...(prev[item.mid]||{}), dim: parseInt(e.target.value||'0')||0 } }))}
                                onBlur={async (e)=>{
                                  const raw = e.target.value;
                                  const val = Number.isFinite(parseInt(raw)) ? parseInt(raw) : (item.dim ?? 0);
                                  await llmConfigApi.updateModel({ provider: selectedProviderId==='custom_embedding'?'custom':selectedProviderId, model_id: item.mid, dimension: val });
                                  await loadModels(selectedProviderId==='custom_embedding'?'custom':selectedProviderId);
                                }}
                                onKeyDown={async (e:any)=>{
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <span className="ml-1">Context：</span>
                          <Popover>
                            <PopoverTrigger>
                              <Button size="sm" variant="light" className="min-w-unit-10 h-7 text-xs px-2">
                                {item.ctx || '-'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-1 w-32">
                              <Input
                                size="sm"
                                type="number"
                                className="w-24 h-7 text-xs"
                                classNames={{ inputWrapper: 'h-7 min-h-7', input: 'text-xs' } as any}
                                defaultValue={item.ctx ? String(item.ctx) : ''}
                                onChange={(e)=> setEditTemp(prev => ({ ...prev, [item.mid]: { ...(prev[item.mid]||{}), ctx: parseInt(e.target.value||'0')||0 } }))}
                                onBlur={async (e)=>{
                                  const raw = e.target.value;
                                  const val = Number.isFinite(parseInt(raw)) ? parseInt(raw) : (item.ctx ?? 0);
                                  await llmConfigApi.updateModel({ provider: selectedProviderId==='custom_embedding'?'custom':selectedProviderId, model_id: item.mid, context_window: val });
                                  await loadModels(selectedProviderId==='custom_embedding'?'custom':selectedProviderId);
                                }}
                                onKeyDown={async (e:any)=>{
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </>
                      ) : (
                        <>
                          <span>维度：-</span>
                          <span className="mx-2">|</span>
                          <span>Context：-</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {defaults?.default_embedding===item.mid ? (
                      <Button size="sm" color="warning" variant="flat" onPress={()=>handleUnsetDefault(item.mid)}>取消设置</Button>
                    ) : (
                      <Button size="sm" variant="flat" onPress={()=>handleSetDefault(item.mid)}>设为默认</Button>
                    )}
                    <Switch size="sm" color="primary" isSelected={item.active} onValueChange={()=>toggleDisplayModel(item)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 远程模型已整合到统一列表中显示，取消单独卡片 */}
      </div>
    </div>
    <AddEmbeddingModelModal
      isOpen={showAddEmbedModal}
      onClose={() => setShowAddEmbedModal(false)}
      onSubmit={async (data) => {
        await llmConfigApi.createModel({ provider: 'custom', model_id: data.modelId, display_name: data.displayName, base_url: data.baseURL, api_key: data.apiKey, dimension: data.dimension, context_window: data.contextWindow });
        toast.success('已添加自定义向量模型');
        await loadModels('custom');
      }}
    />
    <Modal isOpen={showUnsetDialog} onOpenChange={setShowUnsetDialog}>
      <ModalContent>
        <ModalHeader>取消默认模型</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">
            建议直接在其他模型上点击“设为默认”，将覆盖当前默认设置并自动更新状态。
          </p>
          <p className="text-xs text-default-400">
            如仍要取消当前默认，将暂时不设置默认Embedding。
          </p>
          <div className="text-xs text-default-500 break-all">当前默认：{defaults?.default_embedding || '-'}</div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={()=>setShowUnsetDialog(false)}>去选择新的默认</Button>
          <Button color="warning" onPress={confirmUnsetDefault}>仍要取消</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </>);
};

export default LLMEmbeddingsPage;
