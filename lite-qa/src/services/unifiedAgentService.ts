import api from './api';

// 智能体配置接口
export interface AgentConfig {
  // Agno Team配置
  coordinator?: string;
  members?: string[];
  mode?: string;
  
  // Youtu-Agent配置
  model?: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  toolkits?: string[];
  environment?: string;
  
  // 混合配置
  primaryFramework?: string;
  fallbackFramework?: string;
  routingRules?: Array<{
    condition: string;
    target: string;
    framework: string;
  }>;
}

// 知识库绑定接口
export interface KnowledgeBinding {
  collections: string[];
  retrievalMode: string;
  customFilters: any[];
}

// 统一智能体接口
export interface UnifiedAgent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  framework: 'agno' | 'youtu' | 'hybrid';
  type: 'team' | 'simple' | 'orchestra' | 'hybrid';
  status: 'active' | 'inactive' | 'configuring' | 'error';
  config: AgentConfig;
  knowledgeBinding: KnowledgeBinding;
  performanceStats: {
    successRate: number;
    avgResponseTime: number;
    totalExecutions: number;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// 智能体模板接口
export interface AgentTemplate {
  id: string;
  name: string;
  framework: string;
  type: string;
  category: string;
  description?: string;
  defaultConfig: AgentConfig;
  isPublic: boolean;
  createdAt: string;
}

// 执行记录接口
export interface AgentExecution {
  id: string;
  agentId: string;
  sessionId?: string;
  query: string;
  response?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  executionTimeMs?: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

// 创建智能体请求接口
export interface CreateAgentRequest {
  name: string;
  displayName: string;
  description?: string;
  framework: string;
  type: string;
  config: AgentConfig;
  knowledgeBinding: KnowledgeBinding;
  tags: string[];
}

// 更新智能体请求接口
export interface UpdateAgentRequest {
  displayName?: string;
  description?: string;
  status?: string;
  config?: AgentConfig;
  knowledgeBinding?: KnowledgeBinding;
  tags?: string[];
}

// 执行智能体请求接口
export interface ExecuteAgentRequest {
  query: string;
  sessionId?: string;
  stream?: boolean;
  metadata?: Record<string, any>;
}

// 智能体概览统计接口
export interface AgentOverview {
  totalAgents: number;
  activeAgents: number;
  frameworkStats: {
    agno: number;
    youtu: number;
    hybrid: number;
  };
  recentExecutions: number;
  successfulExecutions: number;
  avgExecutionTime: number;
}

class UnifiedAgentService {
  private baseURL = 'unified-agents';

  // 智能体管理
  async listAgents(params?: {
    framework?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<UnifiedAgent[]> {
    const response = await api.get(this.baseURL, { params });
    return response.data;
  }

  async getAgent(agentId: string): Promise<UnifiedAgent> {
    const response = await api.get(`${this.baseURL}/${agentId}`);
    return response.data;
  }

  async createAgent(request: CreateAgentRequest): Promise<UnifiedAgent> {
    const response = await api.post(this.baseURL, request);
    return response.data;
  }

  async updateAgent(agentId: string, request: UpdateAgentRequest): Promise<UnifiedAgent> {
    const response = await api.put(`${this.baseURL}/${agentId}`, request);
    return response.data;
  }

  async deleteAgent(agentId: string): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseURL}/${agentId}`);
    return response.data;
  }

  async toggleAgentStatus(agentId: string): Promise<{ status: string; message: string }> {
    const response = await api.post(`${this.baseURL}/${agentId}/toggle`);
    return response.data;
  }

  // 模板管理
  async listTemplates(params?: {
    framework?: string;
    category?: string;
  }): Promise<AgentTemplate[]> {
    const response = await api.get(`${this.baseURL}/templates`, { params });
    return response.data;
  }

  // 智能体执行
  async executeAgent(agentId: string, request: ExecuteAgentRequest): Promise<{
    executionId: string;
    sessionId: string;
    status: string;
    message: string;
  }> {
    const response = await api.post(`${this.baseURL}/${agentId}/execute`, request);
    return response.data;
  }

  async executeAgentStream(agentId: string, request: ExecuteAgentRequest): Promise<ReadableStream> {
    const response = await fetch(`${api.defaults.baseURL}${this.baseURL}/${agentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  }

  // 执行记录
  async getAgentExecutions(agentId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<AgentExecution[]> {
    const response = await api.get(`${this.baseURL}/${agentId}/executions`, { params });
    return response.data;
  }

  // 配置导出
  async exportAgentConfig(agentId: string): Promise<any> {
    const response = await api.get(`${this.baseURL}/${agentId}/export`);
    return response.data;
  }

  // 统计概览
  async getAgentsOverview(): Promise<AgentOverview> {
    const response = await api.get(`${this.baseURL}/stats/overview`);
    return response.data;
  }

  // 实用方法
  getFrameworkConfig(framework: string) {
    const configs = {
      agno: {
        name: '团队协作模式',
        color: '#1890ff',
        description: '多角色协同处理复杂任务'
      },
      youtu: {
        name: '智能助手模式',
        color: '#52c41a',
        description: '单一智能体高效处理'
      },
      hybrid: {
        name: '智能路由模式',
        color: '#fa8c16',
        description: '自动选择最优处理方式'
      }
    };
    return configs[framework as keyof typeof configs] || configs.youtu;
  }

  getTypeConfig(type: string) {
    const configs = {
      team: { name: '协作处理', color: '#1890ff' },
      simple: { name: '直接处理', color: '#52c41a' },
      orchestra: { name: '编排处理', color: '#722ed1' },
      hybrid: { name: '智能选择', color: '#fa8c16' }
    };
    return configs[type as keyof typeof configs] || configs.simple;
  }

  getStatusConfig(status: string) {
    const configs = {
      active: { color: '#52c41a', text: '运行中' },
      inactive: { color: '#d9d9d9', text: '已停用' },
      configuring: { color: '#faad14', text: '配置中' },
      error: { color: '#ff4d4f', text: '错误' }
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  }

  // 配置验证
  validateAgentConfig(framework: string, type: string, config: AgentConfig): string[] {
    const errors: string[] = [];

    if (framework === 'agno') {
      if (type === 'team') {
        if (!config.coordinator) errors.push('协调器不能为空');
        if (!config.members || config.members.length === 0) errors.push('团队成员不能为空');
        if (!config.mode) errors.push('协作模式不能为空');
      }
    } else if (framework === 'youtu') {
      if (!config.model) {
        errors.push('模型配置不能为空');
      } else {
        if (!config.model.provider) errors.push('模型提供商不能为空');
        if (!config.model.model) errors.push('模型名称不能为空');
      }
      if (!config.toolkits || config.toolkits.length === 0) errors.push('工具包不能为空');
    } else if (framework === 'hybrid') {
      if (!config.primaryFramework) errors.push('主框架不能为空');
      if (!config.fallbackFramework) errors.push('备用框架不能为空');
    }

    return errors;
  }

  // 生成默认配置 - 基于Youtu Agent官方文档
  generateDefaultConfig(framework: string, type: string): AgentConfig {
    if (framework === 'agno' && type === 'team') {
      return {
        coordinator: 'knowledge_coordinator',
        members: ['retrieval_specialist', 'analysis_specialist', 'synthesis_specialist'],
        mode: 'collaborative'
      };
    } else if (framework === 'youtu' && type === 'simple') {
      return {
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 4000
        },
        toolkits: ['search_toolkit', 'document_toolkit', 'web_toolkit'],
        environment: 'shell_local'
      };
    } else if (framework === 'youtu' && type === 'orchestra') {
      return {
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.3,
          maxTokens: 8000
        },
        toolkits: ['search_toolkit', 'document_toolkit', 'code_toolkit', 'web_toolkit', 'file_toolkit'],
        environment: 'browser_env'
      };
    } else if (framework === 'hybrid') {
      return {
        primaryFramework: 'youtu',
        fallbackFramework: 'agno',
        routingRules: [
          {
            condition: '任务复杂度高且需要多角色协作',
            target: 'team',
            framework: 'agno'
          },
          {
            condition: '单一领域专业问题',
            target: 'simple',
            framework: 'youtu'
          },
          {
            condition: '需要复杂推理和工具调用',
            target: 'orchestra',
            framework: 'youtu'
          }
        ]
      };
    }

    return {};
  }

  // 生成默认知识库绑定
  generateDefaultKnowledgeBinding(): KnowledgeBinding {
    return {
      collections: [],
      retrievalMode: 'all',
      customFilters: []
    };
  }
}

// 创建服务实例
export const unifiedAgentService = new UnifiedAgentService();

// 默认导出
export default unifiedAgentService;

// 强制更新模块缓存
// Updated: 2025-09-12