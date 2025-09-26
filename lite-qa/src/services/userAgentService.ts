/**
 * 用户智能体管理服务
 * 专门用于新的智能体导航流程
 */
import { getApiUrl } from '../config/appConfig';

// 用户智能体API的基础路径
const USER_AGENTS_BASE = '/user-agents';

// 类型定义
export interface AgentTemplate {
  id: string;
  template_code: string;
  template_name: string;
  template_type: 'single' | 'team';
  category?: string;
  description?: string;
  icon: string;
  color: string;
  base_config: Record<string, any>;
  model_config?: Record<string, any>;
  tools_config?: Record<string, any>;
  team_members?: string[];
  team_mode?: string;
  is_system: boolean;
}

export interface AgentTool {
  id: string;
  tool_code: string;
  tool_name: string;
  tool_type: string;
  description?: string;
  config_schema?: Record<string, any>;
}

export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  document_count: number;
  status: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length?: number;
}

export interface CreateUserAgentRequest {
  template_id: string;
  agent_name: string;
  description?: string;
  collection_id?: string;
  enable_knowledge_search: boolean;
  enable_graph_search: boolean;
  retrieval_mode: 'all' | 'qa_only' | 'papers_only';
  selected_tools: string[];
  tool_configs: Record<string, any>;
  model_config?: Record<string, any>;
  custom_config?: Record<string, any>;
  icon?: string;
  color?: string;
}

export interface UserAgent {
  id: string;
  agent_code: string;
  agent_name: string;
  agent_type: 'single' | 'team';
  description?: string;
  template_name?: string;
  collection_name?: string;
  icon?: string;
  color?: string;
  status: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
}

class UserAgentService {
  /**
   * 获取所有可用的智能体模板
   */
  async getAgentTemplates(): Promise<AgentTemplate[]> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/templates`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取智能体模板失败');
    }

    return response.json();
  }

  /**
   * 获取特定模板详情
   */
  async getAgentTemplateDetail(templateId: string): Promise<AgentTemplate> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/templates/${templateId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取模板详情失败');
    }

    return response.json();
  }

  /**
   * 获取所有可用的工具
   */
  async getAvailableTools(): Promise<AgentTool[]> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/tools`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取可用工具失败');
    }

    return response.json();
  }

  /**
   * 获取知识库集合
   */
  async getKnowledgeCollections(): Promise<KnowledgeCollection[]> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/collections`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取知识库集合失败');
    }

    return response.json();
  }

  /**
   * 获取可用模型
   */
  async getAvailableModels(): Promise<ModelOption[]> {
    // 改为统一从模型网关代理读取，仅返回启用的对话模型
    const response = await fetch(getApiUrl(`/models-gateway/models?type=chat&enabled=1`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取可用模型失败');
    }
    const data = await response.json();
    // 后端返回字段: model_id, display_name, provider_name, provider_type
    return (data || [])
      .filter((m: any) => m && m.model_id && String(m.model_id).toLowerCase() !== 'string')
      .map((m: any) => ({
        id: m.model_id,
        name: m.display_name || m.model_id,
        provider: m.provider_name || m.provider_type || '',
        description: `${m.provider_name || m.provider_type || ''}`,
        context_length: m.context_length || 0,
      }));
  }

  async getAvailableRerankModels(): Promise<Array<{ id:string; name:string; provider:string }>> {
    const response = await fetch(getApiUrl(`/models-gateway/models?type=rerank&enabled=1`), {
      method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return (data || []).map((m:any) => ({ id: m.model_id, name: m.display_name || m.model_id, provider: m.provider_name || m.provider_type || '' }));
  }

  async getEnabledModelsUnified(): Promise<any> {
    const res = await fetch(getApiUrl(`/models-gateway/models/enabled`), { credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * 创建用户智能体
   */
  async createUserAgent(request: CreateUserAgentRequest): Promise<UserAgent> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/create`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建智能体失败');
    }

    return response.json();
  }

  // 草稿：创建临时智能体（继承模板，status='draft'）
  async createDraftUserAgent(request: CreateUserAgentRequest): Promise<{ id: string; status: string; name?: string; marker?: string }> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/drafts`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  // 草稿晋升为正式
  async promoteUserAgent(agentId: string): Promise<{ id: string; status: string }> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/promote`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  /**
   * 获取当前用户的智能体列表
   */
  async getMyAgents(): Promise<UserAgent[]> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/my-agents`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取我的智能体失败');
    }

    return response.json();
  }

  async publishUserAgent(
    agentId: string,
    options?: { service_name?: string; mode?: 'api' | 'embed' }
  ): Promise<{agent_id:string, version:number, published_at:string}> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/publish`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options || {})
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '发布失败');
    }
    return response.json();
  }

  async getPublishedAgents(): Promise<Array<{agent_id:string, agent_name:string, description?:string, icon?:string, color?:string, version:number, published_at:string}>> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/published`), {
      method: 'GET', headers: { 'Content-Type':'application/json' }, credentials: 'include'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取已发布智能体失败');
    }
    return response.json();
  }

  async setPublishEnabled(agentId: string, enabled: boolean): Promise<{agent_id:string, enabled:boolean}> {
    const res = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/publish/enable`), {
      method: 'PUT', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async deletePublish(agentId: string): Promise<void> {
    const res = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/publish`), {
      method: 'DELETE', headers: { 'Content-Type':'application/json' }, credentials: 'include'
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async getRuntimeSettings(agentId: string): Promise<{ default_model?: string; chat?: { multi_turn?: boolean; max_rounds?: number; context_window?: number } }> {
    const res = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/runtime-settings`), { credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async updateRuntimeSettings(agentId: string, payload: { default_model?: string; chat?: { multi_turn?: boolean; max_rounds?: number; context_window?: number } }): Promise<any> {
    const res = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${encodeURIComponent(agentId)}/runtime-settings`), {
      method: 'PUT', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // 模板资源需求与校验
  async getTemplateRequirements(templateCode: string): Promise<any> {
    const url = getApiUrl(`/agent-templates/${encodeURIComponent(templateCode)}/requirements`);
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async validateTemplateResources(templateCode: string, selections: any): Promise<any> {
    const url = getApiUrl('/agent-templates/validate-resources');
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ template_code: templateCode, selections }) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * 删除用户智能体
   */
  async deleteUserAgent(agentId: string): Promise<void> {
    const response = await fetch(getApiUrl(`${USER_AGENTS_BASE}/${agentId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '删除智能体失败');
    }
  }

  /**
   * 更新智能体模板的 base_config（用于写入 requirements 等）
   */
  async updateTemplateBaseConfig(templateId: string, baseConfig: Record<string, any>): Promise<any> {
    const url = getApiUrl(`/agent-templates/update/${encodeURIComponent(templateId)}`);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ base_config: baseConfig })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const userAgentService = new UserAgentService();
