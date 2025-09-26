import { getApiUrl } from '../config/appConfig';

export interface RunWorkflowParams {
  agent_name?: string;
  prompt: string;
  selected_tools?: string[];
  model?: string;
  provider?: string;
  session_state?: string;
  save_session?: boolean;
  session_id?: string | null;
  // 运行期资源与检索/模型参数（扩展）
  resources?: any;
  // 兼容直传集合与检索模式
  collection_id?: string;
  retrieval_mode?: 'hybrid' | 'hirag' | 'auto';
  top_n?: number;
  sim_threshold?: number;
  sim_weight?: number;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  custom_prompt?: string;
}

export type WorkflowEvent = Record<string, any>;

export interface RunHandle {
  abort: () => void;
}

export async function runWorkflowStream(
  params: RunWorkflowParams,
  onEvent: (ev: WorkflowEvent) => void
): Promise<RunHandle> {
  const url = getApiUrl('/workflows/run');
  const controller = new AbortController();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE frames separated by \n\n
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          // Parse lines like: data: {...}
          const lines = frame.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr) {
                try {
                  const obj = JSON.parse(jsonStr);
                  onEvent(obj);
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // reading aborted or failed
    }
  })();

  return {
    abort: () => controller.abort(),
  };
}

export async function listWorkflowSessions(limit = 50) {
  const url = getApiUrl(`/workflows/sessions?limit=${limit}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelWorkflowSession(sessionId: string) {
  const url = getApiUrl(`/workflows/sessions/${sessionId}/cancel`);
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Templates CRUD + validate
export interface WorkflowTemplateDto {
  template_name: string;
  description?: string;
  team_config?: any;
  execution_flow: any;
  is_default?: boolean;
}

export async function listWorkflowTemplates() {
  const url = getApiUrl('/workflows/templates');
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getWorkflowTemplate(name: string) {
  const url = getApiUrl(`/workflows/templates/${encodeURIComponent(name)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function upsertWorkflowTemplate(payload: WorkflowTemplateDto) {
  const exists = await (async () => {
    try {
      await getWorkflowTemplate(payload.template_name);
      return true;
    } catch { return false; }
  })();
  const url = exists
    ? getApiUrl(`/workflows/templates/${encodeURIComponent(payload.template_name)}`)
    : getApiUrl('/workflows/templates');
  const method = exists ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteWorkflowTemplate(name: string) {
  const url = getApiUrl(`/workflows/templates/${encodeURIComponent(name)}`);
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function validateWorkflowTemplate(team_config: any, execution_flow: any) {
  const url = getApiUrl('/workflows/templates/validate');
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team_config, execution_flow }) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Run template (SSE)
export interface RunTemplateParams {
  template_name: string;
  prompt?: string;
  overrides?: Record<string, any>;
  save_session?: boolean;
}

export async function runTemplateStream(
  params: RunTemplateParams,
  onEvent: (ev: WorkflowEvent) => void
): Promise<RunHandle> {
  const url = getApiUrl('/workflows/run-template');
  const controller = new AbortController();
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal: controller.signal });
  if (!res.ok || !res.body) throw new Error(await res.text());
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of frame.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr) {
                try { onEvent(JSON.parse(jsonStr)); } catch {}
              }
            }
          }
        }
      }
    } catch {}
  })();
  return { abort: () => controller.abort() };
}

// Gateway resources (for auto-complete)
export async function listGatewayApiConfigs() {
  const url = getApiUrl('/agent-templates/external/api-configs');
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listGatewayEmbeddingModels() {
  const url = getApiUrl('/agent-templates/external/embedding-models');
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
