import api from './api';

export interface ChatModelMetaDto {
  provider: string;
  model_id: string;
  supports_tools?: boolean;
  last_error?: string;
}

export const llmMetaApi = {
  async saveTestResult(payload: ChatModelMetaDto) {
    const { data } = await api.post('/llm/models/meta/test-result', payload);
    return data;
  },
  async list(provider?: string) {
    const { data } = await api.get('/llm/models/meta', { params: provider ? { provider } : {} });
    return data?.data || [];
  },
};

