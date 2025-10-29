import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Button, Switch, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import ProviderIcon from '@/components/ProviderIcon';
import LocalIcon from '@/components/LocalIcon';
import { toast } from '@/utils/toast';
import { llmRerankApi } from '@/services/llm-config';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import AddEmbeddingModelModal from '@/pages/llm/components/AddEmbeddingModelModal';

const RERANK_WHITELIST = new Set(['siliconcloud','ollama','vllm','qwen','jina']);

const LLMRerankPage: React.FC = () => {
  const [providerQuery, setProviderQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [hasUserSelected, setHasUserSelected] = useState<boolean>(false);
  const [models, setModels] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<{ default_rerank?: string }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteModels, setRemoteModels] = useState<string[]>([]);
  const [syncingToGateway, setSyncingToGateway] = useState(false);

  const { providers: llmProviders, updateProvider } = useLLMConfig();
  const [providerStats, setProviderStats] = useState<Record<string,{total:number;hasDefault?:boolean}>>({});

  const providers = useMemo(() => {
    const base = ['siliconcloud','ollama','vllm','qwen','jina'].map(id => ({ id, name: id }));
    const q = providerQuery.trim().toLowerCase();
    return q ? base.filter(p => (p.name||p.id).toLowerCase().includes(q)) : base;
  }, [providerQuery]);

  const filteredProviders = providers;

  const loadDefaults = async () => {
    try { const d = await llmRerankApi.getDefaults(); setDefaults(d || {}); } catch { setDefaults({}); }
  };
  const loadModels = async (providerId: string) => {
    if (!providerId) { setModels([]); return; }
    try { const ms = await llmRerankApi.listModels({ provider: providerId }); setModels(ms || []); } catch { setModels([]); }
  };

  useEffect(() => { loadDefaults(); }, []);
  useEffect(() => { if (selectedProviderId) loadModels(selectedProviderId); }, [selectedProviderId]);
  // 统计每个厂商的数量和是否含默认
  useEffect(() => {
    (async () => {
      const stats: Record<string,{total:number;hasDefault?:boolean}> = {};
      for (const pid of ['siliconcloud','ollama','vllm','qwen','jina']) {
        try {
          const ms = await llmRerankApi.listModels({ provider: pid });
          const total = Array.isArray(ms)? ms.length: 0;
          const hasDefault = defaults?.default_rerank ? (Array.isArray(ms)? ms.some((m:any)=> m.model_id===defaults.default_rerank): false): false;
          stats[pid] = { total, hasDefault };
        } catch { stats[pid] = { total: 0, hasDefault: false }; }
      }
      setProviderStats(stats);
    })();
  }, [defaults]);
  useEffect(() => {
    if (filteredProviders.length === 0) return;
    const firstId = filteredProviders[0].id as string;
    if ((selectedProviderId === '' || !hasUserSelected) && firstId !== selectedProviderId) {
      setSelectedProviderId(firstId);
    }
  }, [filteredProviders, selectedProviderId, hasUserSelected]);

  const toggleModel = async (mid: string, active: boolean) => {
    try {
      await llmRerankApi.setModelStatus({ provider: selectedProviderId, model_id: mid, status: active ? 'inactive' : 'active' });
      await loadModels(selectedProviderId);
    } catch { toast.error('切换失败'); }
  };

  // Helpers: pick baseURL and headers from chat provider config
  const getBaseURL = (pid: string): string => {
    const p = (llmProviders as any[]).find(x => x.id === pid);
    const base = p?.config?.baseURL as string | undefined;
    if (base && base.trim()) return base.trim().replace(/\/$/, '');
    switch (pid) {
      case 'siliconcloud': return 'https://api.siliconflow.cn/v1';
      case 'ollama': return 'http://localhost:11434';
      default: return '';
    }
  };
  const buildAuthHeaders = (pid: string): Record<string,string> => {
    const p = (llmProviders as any[]).find(x => x.id === pid);
    const key = p?.config?.apiKey as string | undefined;
    if (!key || pid === 'ollama') return {};
    return { 'Authorization': `Bearer ${key}` };
  };

  const fetchRerankModels = async () => {
    if (!selectedProviderId) return;
    setLoadingRemote(true);
    try {
      const base = getBaseURL(selectedProviderId);
      const headers: any = { ...buildAuthHeaders(selectedProviderId) };
      let url = '';
      if (selectedProviderId === 'siliconcloud') {
        // SiliconFlow 正确参数：type=text&sub_type=reranker
        url = `${base || 'https://api.siliconflow.cn/v1'}/models?type=text&sub_type=reranker`;
      } else if (selectedProviderId === 'ollama') {
        url = `${base || 'http://localhost:11434'}/api/tags`;
      } else {
        url = `${base}/v1/models`;
      }
      let resp = await fetch(url, { headers });
      // 如果 SiliconFlow 返回非 2xx，尝试兼容旧的 sub_type=rerank
      if (!resp.ok && selectedProviderId === 'siliconcloud') {
        const alt = `${base || 'https://api.siliconflow.cn/v1'}/models?type=text&sub_type=rerank`;
        resp = await fetch(alt, { headers });
      }
      if (!resp.ok) throw new Error(`${resp.status}`);
      const data = await resp.json();
      let ids: string[] = [];
      if (selectedProviderId === 'siliconcloud') {
        // SiliconFlow 返回 { data: [{ id, ... }] }
        ids = (data.data || []).map((m: any) => m.id);
      } else if (selectedProviderId === 'ollama') {
        ids = (data.models || []).map((m: any) => m.name).filter((id: string)=> id.toLowerCase().includes('rerank') || id.toLowerCase().includes('reranker'));
      } else {
        ids = (data.data || []).map((m: any) => m.id).filter((id: string)=> id.toLowerCase().includes('rerank') || id.toLowerCase().includes('reranker'));
      }
      setRemoteModels(ids);
      if (ids.length > 0 && selectedProviderId) {
        try { await llmRerankApi.bulkUpsertModels({ provider: selectedProviderId, models: ids }); } catch {}
        await loadModels(selectedProviderId);
      }
    } catch (e) {
      setRemoteModels([]);
      toast.error('获取可用模型失败');
    } finally {
      setLoadingRemote(false);
    }
  };

  const setAsDefault = async (mid: string) => {
    try {
      // ensure exists and active
      const exists = models.find((m:any)=> m.model_id === mid);
      if (!exists) { await llmRerankApi.createModel({ provider: selectedProviderId, model_id: mid, display_name: mid }); }
      else if (exists.status !== 'active') { await llmRerankApi.setModelStatus({ provider: selectedProviderId, model_id: mid, status: 'active' }); }
      await llmRerankApi.setDefaults({ default_rerank: mid });
      await loadDefaults();
      toast.success('已设为默认重排模型');
    } catch { toast.error('设置失败'); }
  };

  const unsetDefault = async () => {
    try { await llmRerankApi.setDefaults({ default_rerank: '' as any }); await loadDefaults(); toast.success('已取消默认'); } catch {}
  };

  const handleSyncToGateway = async () => {
    setSyncingToGateway(true);
    try {
      await llmRerankApi.syncToGateway();
      toast.success('已同步重排模型配置到LLM网关');
    } catch (e: any) {
      toast.error('同步失败: ' + (e.response?.data?.error || e.message));
    } finally {
      setSyncingToGateway(false);
    }
  };

  return (
    <div className="p-4 flex h-full w-full gap-4">
      <div className="w-80 flex-shrink-0">
        <Card className="p-4">
          <div className="font-bold text-lg">重排模型厂商</div>
          <Input placeholder="搜索厂商" value={providerQuery} onChange={(e)=> setProviderQuery(e.target.value)} />
          <div className="mt-3 space-y-1 max-h-[80vh] overflow-auto">
            {filteredProviders.map(p => {
              const isSelected = selectedProviderId === p.id;
              const baseClass = isSelected ? 'border-primary bg-primary/5' : 'border-default-200 hover:bg-default-100';
              return (
                <button key={p.id} onClick={()=>{ setSelectedProviderId(p.id); setHasUserSelected(true); } } className={`w-full px-3 py-2 rounded-lg border ${baseClass}`}>
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProviderIcon providerId={p.id} name={p.name} className="w-6 h-6" />
                      <div className="font-medium flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-xs text-default-500">{providerStats[p.id]?.total || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {providerStats[p.id]?.hasDefault && (
                        <span className="w-2 h-2 rounded-full bg-success inline-block" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {/* 底部固定的自定义创建按钮（与向量模型一致） */}
            <div className="pt-2">
              <button
                onClick={()=> setShowAddModal(true)}
                className="w-full px-3 py-2 rounded-lg border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800"
              >
                <div className="w-full flex items-center justify-center gap-2">
                  <LocalIcon icon="lucide:plus" className="w-5 h-5 text-yellow-700" />
                  <span className="font-medium">添加自定义重排模型</span>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedProviderId && <ProviderIcon providerId={selectedProviderId} name={selectedProviderId} className="w-5 h-5" />}
              <span className="text-base font-semibold">{selectedProviderId || '请选择厂商'}</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedProviderId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">启用</span>
                  <Switch size="sm" isSelected={!!llmProviders.find(p=>p.id===selectedProviderId)?.enabled} onValueChange={(v)=> updateProvider(selectedProviderId, { enabled: v })} />
                </div>
              )}
              {selectedProviderId && (
                <Button size="sm" variant="flat" isLoading={loadingRemote} onPress={fetchRerankModels} isDisabled={!selectedProviderId}>获取模型</Button>
              )}
              <Button size="sm" color="primary" variant="flat" isLoading={syncingToGateway} onPress={handleSyncToGateway} startContent={<LocalIcon icon="lucide:refresh-cw" />}>
                同步到网关
              </Button>
              <div className="text-sm text-default-500">
                <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-default-200 bg-default-100" title="当前默认重排模型">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  <span className="text-xs text-default-600">默认</span>
                  <span className="text-xs font-medium text-foreground max-w-[260px] truncate">{defaults?.default_rerank || '-'}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2 font-bold">
              <LocalIcon icon="lucide:list-filter" className="w-4 h-4 text-default-500" />
              <span>重排模型</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-default-500">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{models.filter((m:any)=>m.status==='active').length}</span>
              <span>/</span>
              <span className="text-default-400">{models.length}</span>
            </div>
            <div className="flex-1" />
            {/* 自定义按钮已移动到左侧列表底部，保留顶部快捷入口可按需启用 */}
          </div>
          <div className="space-y-1 max-h-[80vh] overflow-auto pr-2">
            {models.map((item:any) => (
              <div key={item.id || item.model_id} className="p-3 rounded-lg border border-default-200 bg-background hover:bg-default-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm truncate">{item.display_name || item.model_id}</div>
                      {item.status==='active' ? (
                        <Chip size="sm" color="success" variant="flat" className="text-xs">启用</Chip>
                      ) : (
                        <Chip size="sm" variant="flat" className="text-xs">未启用</Chip>
                      )}
                    </div>
                    <div className="text-xs text-default-400">{item.model_id}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {defaults?.default_rerank===item.model_id ? (
                      <Button size="sm" color="warning" variant="flat" onPress={unsetDefault}>取消设置</Button>
                    ) : (
                      <Button size="sm" variant="flat" onPress={()=> setAsDefault(item.model_id)}>设为默认</Button>
                    )}
                    <Switch size="sm" color="primary" isSelected={item.status==='active'} onValueChange={()=> toggleModel(item.model_id, item.status==='active')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AddEmbeddingModelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (data) => {
          const provider = 'custom'; // 自定义重排模型归入 custom
          await llmRerankApi.createModel({ provider, model_id: data.modelId, display_name: data.displayName, base_url: data.baseURL, api_key: data.apiKey });
          toast.success('已添加自定义重排模型');
          if (selectedProviderId === 'custom_rerank') { await loadModels('custom_rerank'); }
        }}
      />
    </div>
  );
};

export default LLMRerankPage;
