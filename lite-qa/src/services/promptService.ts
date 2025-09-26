import axios from 'axios';

export interface RenderPreviewRequest {
  prompt_text: string;
  question?: string;
  selected_tools?: string[];
  resources?: {
    knowledge_collection?: { collection_id?: string };
    cross_collections?: string[];
  };
  top_n?: number;
  sim_threshold?: number;
}

export async function renderPromptPreview(payload: RenderPreviewRequest) {
  const { data } = await axios.post('/api/v1/prompts/render-preview', payload);
  return data as { final_prompt: string; injections: { knowledge_preview: string; tools_exec_preview: string } };
}

export interface AutoGenerateRequest {
  scenario: string;
  keywords: string;
  selected_tools?: string[];
  resources?: RenderPreviewRequest['resources'];
}

export async function autoGeneratePrompt(payload: AutoGenerateRequest) {
  const { data } = await axios.post('/api/v1/prompts/auto-generate', payload);
  return data as { text: string };
}

export function wsGeneratePrompt(payload: AutoGenerateRequest, onMessage: (text: string)=>void) {
  try {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${loc.host}/api/v1/prompts/ws/auto-generate`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify(payload));
    };
    ws.onmessage = (ev) => {
      onMessage(ev.data || '');
    };
    ws.onerror = () => {
      // 忽略，前端可回退到HTTP
    };
    return ws;
  } catch (e) {
    return null as any;
  }
}
