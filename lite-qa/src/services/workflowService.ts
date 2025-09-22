import { getApiUrl } from '../config/appConfig';

export interface RunWorkflowParams {
  agent_name?: string;
  prompt: string;
  selected_tools?: string[];
  model?: string;
  provider?: string;
  session_state?: string;
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

