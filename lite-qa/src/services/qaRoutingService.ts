import api from './api'; // 修复：使用配置好的api实例

export type RetrievalPath = {
  id: string;
  knowledge_base_id: string;
  path_name: string;
  path_order: number;
  source_type: 'qa_routes'|'qa_datasets'|'documents';
  is_enabled: boolean;
  config: Record<string, any>;
  fallback_action: 'continue'|'stop';
  min_confidence: number;
  max_results: number;
};

export async function getRetrievalPaths(kbId: string) {
  const { data } = await api.get(`/qa-routing/knowledge-base/${encodeURIComponent(kbId)}/retrieval-paths`);
  // 兼容多种返回格式
  let list: any = undefined;
  if (Array.isArray(data)) list = data;
  else list = data?.paths || data?.retrieval_paths || data?.items;
  return (Array.isArray(list) ? list : []) as RetrievalPath[];
}

export async function createRetrievalPath(payload: Partial<RetrievalPath> & { knowledge_base_id: string }) {
  const { data } = await api.post(`/qa-routing/retrieval-paths`, payload);
  return data as RetrievalPath;
}

export async function updateRetrievalPath(id: string, patch: Partial<RetrievalPath>) {
  const { data } = await api.put(`/qa-routing/retrieval-paths/${id}`, patch);
  return data;
}

export async function getKBTemplates(kbId: string) {
  const { data } = await api.get(`/qa-routing/knowledge-base/${kbId}/templates`);
  return (data?.templates || []) as any[];
}

export async function applyTemplateById(templateId: string) {
  const { data } = await api.post(`/qa-routing/templates/${templateId}/apply`);
  return data;
}

export async function updateTemplate(templateId: string, payload: any) {
  const { data } = await api.put(`/qa-routing/templates/${templateId}`, payload);
  return data;
}
