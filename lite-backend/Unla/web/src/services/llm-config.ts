import axios from 'axios';
import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/llm-providers';

// Switch to Unla apiserver DB-backed endpoints for embedding config
export const llmConfigApi = {
  async listProviders() {
    // Use Unla's current provider data from frontend config, filtered to embedding-supported vendors
    try {
      const allowed = new Set([
        'ollama','vllm','xinference','huggingface','openrouter','cohere','qwen','wenxin','tencentcloud','zhipu','siliconcloud','minimax','moonshot','jina','openai','custom'
      ]);
      return DEFAULT_MODEL_PROVIDER_LIST
        .filter((p) => allowed.has(p.id))
        .map((p) => ({ id: p.id, name: p.name || p.id }));
    } catch (e) {
      return [];
    }
  },
  async listModels(params?: { provider?: string }) {
    const search = new URLSearchParams();
    if (params?.provider) search.set('provider', params.provider);
    const qs = search.toString();
    return axios.get(`/api/embeddings/models${qs ? '?' + qs : ''}`).then(r => r.data);
  },
  async createModel(data: any) {
    return axios.post(`/api/embeddings/models`, data).then(r => r.data);
  },
  async setModelStatus(data: { provider: string; model_id: string; status: 'active'|'inactive' }) {
    return axios.post(`/api/embeddings/models/status`, data).then(r => r.data);
  },
  async bulkUpsertModels(data: { provider: string; models: string[] }) {
    return axios.post(`/api/embeddings/models/bulk`, data).then(r => r.data);
  },
  async updateModel(data: any) {
    return axios.put(`/api/embeddings/models`, data).then(r => r.data);
  },
  async getDefaults() {
    return axios.get(`/api/embeddings/defaults`).then(r => r.data);
  },
  async setDefaults(data: { default_embedding: string }) {
    return axios.post(`/api/embeddings/defaults`, data).then(r => r.data);
  },
  async syncToGateway() {
    return axios.post(`/api/embeddings/sync-to-gateway`).then(r => r.data);
  }
};

// Chat 模型默认值：通过 9050 网关（支持 CORS）
const getGatewayBase = (): string => {
  // 优先 runtime 配置，其次 .env，最后本地默认
  const rc = (window as any)?.RUNTIME_CONFIG;
  const fromRC = rc?.LLM_GATEWAY_URL as string | undefined;
  const fromEnv = (import.meta as any)?.env?.VITE_LLM_GATEWAY_URL as string | undefined;
  return (fromRC || fromEnv || 'http://127.0.0.1:9050').replace(/\/$/, '');
};

export const llmGatewayApi = {
  async getDefaults() {
    const base = getGatewayBase();
    return axios.get(`${base}/v1/defaults`).then(r => r.data);
  },
  async setDefaults(data: { default_model?: string; default_embedding?: string }) {
    const base = getGatewayBase();
    return axios.post(`${base}/v1/defaults`, data).then(r => r.data);
  },
  async importChatConfig(payload: { default_model?: string; providers: Array<{ name: string; type: string; base_url?: string; api_key?: string; models: Array<{ id: string; enabled: boolean }> }> }) {
    const base = getGatewayBase();
    return axios.post(`${base}/admin/import-chat-config`, payload).then(r => r.data);
  }
};

// MCP gateway (9050) APIs for shared runtime
export const mcpGatewayApi = {
  base(): string { return getGatewayBase(); },
  async registry() {
    const base = getGatewayBase();
    return axios.get(`${base}/mcp/registry`).then(r=>r.data as Array<any>);
  },
  async startServer(name: string) {
    const base = getGatewayBase();
    return axios.post(`${base}/mcp/servers/${encodeURIComponent(name)}/start`).then(r=>r.data);
  },
  async stopServer(name: string) {
    const base = getGatewayBase();
    return axios.post(`${base}/mcp/servers/${encodeURIComponent(name)}/stop`).then(r=>r.data);
  },
  async listTools(name: string) {
    const base = getGatewayBase();
    return axios.get(`${base}/mcp/servers/${encodeURIComponent(name)}/tools`).then(r=>r.data as Array<{name:string;description?:string}>);
  },
  async callTool(name: string, tool: string, args?: any) {
    const base = getGatewayBase();
    return axios.post(`${base}/mcp/servers/${encodeURIComponent(name)}/tools/${encodeURIComponent(tool)}/call`, args||{}).then(r=>r.data);
  }
};

// API Tools (HTTP tools) via 9050
export const apiToolsGatewayApi = {
  base(): string { return getGatewayBase(); },
  async syncFromUnlaDb(prefix?: string) {
    const base = getGatewayBase();
    return axios.post(`${base}/admin/sync-api-from-unla-db`, prefix ? { prefix } : {}).then(r=>r.data);
  },
  async listConfigs() {
    const base = getGatewayBase();
    return axios.get(`${base}/api-tools/configs`).then(r=>r.data as Array<{name:string;tools:number;servers?: Array<{name:string;base_url?:string;allowed?:number}>; routers?: Array<{prefix:string;server:string}>}>);
  },
  async listTools(configName: string) {
    const base = getGatewayBase();
    return axios.get(`${base}/api-tools/configs/${encodeURIComponent(configName)}/tools`).then(r=>r.data as Array<{name:string;description?:string;method:string;endpoint:string}>);
  },
  async call(configName: string, toolName: string, args?: any) {
    const base = getGatewayBase();
    return axios.post(`${base}/api-tools/configs/${encodeURIComponent(configName)}/tools/${encodeURIComponent(toolName)}/call`, args||{});
  }
};

export const apiToolsMgmtApi = {
  base(): string { return getGatewayBase(); },
  async allow(configName: string, payload: { server: string; tools: string[]; action?: 'add'|'remove'; tenant?: string }) {
    const base = getGatewayBase();
    return axios.post(`${base}/api-tools/configs/${encodeURIComponent(configName)}/allow`, payload).then(r=>r.data);
  },
  async routers(configName: string, payload: { action?: 'add'|'remove'; prefix: string; server: string; tenant?: string }) {
    const base = getGatewayBase();
    return axios.post(`${base}/api-tools/configs/${encodeURIComponent(configName)}/routers`, payload).then(r=>r.data);
  }
};

// Rerank models API (Unla apiserver DB-backed)
export const llmRerankApi = {
  async listProviders() {
    return axios.get(`/api/rerank/providers`).then(r => r.data);
  },
  async listModels(params?: { provider?: string }) {
    const search = new URLSearchParams();
    if (params?.provider) search.set('provider', params.provider);
    const qs = search.toString();
    return axios.get(`/api/rerank/models${qs ? '?' + qs : ''}`).then(r => r.data);
  },
  async createModel(data: any) {
    return axios.post(`/api/rerank/models`, data).then(r => r.data);
  },
  async setModelStatus(data: { provider: string; model_id: string; status: 'active'|'inactive' }) {
    return axios.post(`/api/rerank/models/status`, data).then(r => r.data);
  },
  async bulkUpsertModels(data: { provider: string; models: string[] }) {
    return axios.post(`/api/rerank/models/bulk`, data).then(r => r.data);
  },
  async updateModel(data: any) {
    return axios.put(`/api/rerank/models`, data).then(r => r.data);
  },
  async getDefaults() {
    return axios.get(`/api/rerank/defaults`).then(r => r.data);
  },
  async setDefaults(data: { default_rerank: string }) {
    return axios.post(`/api/rerank/defaults`, data).then(r => r.data);
  },
  async syncToGateway() {
    return axios.post(`/api/rerank/sync-to-gateway`).then(r => r.data);
  }
};
