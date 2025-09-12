/**
 * Youtu-Agent 服务层 - 对接后端Youtu-Agent集成API
 */
import { api } from './api';
import type { ApiResponse } from '../types';

// 类型定义
export interface YoutuAgentConfig {
  id?: string;
  name: string;
  display_name: string;
  agent_type: 'SimpleAgent' | 'OrchestraAgent';
  description: string;
  instructions: string[];
  model_config: {
    provider: string;
    model_id: string;
    temperature: number;
    max_tokens: number;
    top_p?: number;
  };
  tools: string[];
  environments: string[];
  security_level?: string;
  agno_compatible_config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface MetaAgentSession {
  session_id: string;
  session_name: string;
  domain: string;
  initial_description: string;
  status: 'in_progress' | 'completed' | 'failed';
  conversation_history: ConversationMessage[];
  generated_config_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface HybridAgentStrategy {
  name: string;
  description: string;
  config: Record<string, any>;
  user_defined?: boolean;
  created_at?: string;
}

export interface ExecutionHistory {
  id: string;
  query: string;
  user_id?: string;
  agent_config_id?: string;
  execution_mode: string;
  execution_status: string;
  result?: any;
  error_message?: string;
  performance_metrics?: Record<string, any>;
  strategy_config?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface SystemInfo {
  service: string;
  version: string;
  status: string;
  statistics: {
    total_agent_configs: number;
    total_executions: number;
    supported_agent_types: string[];
    supported_execution_modes: string[];
  };
  capabilities: {
    frameworks: string[];
    agent_types: string[];
    environments: string[];
    tools: string[];
    streaming: boolean;
    meta_generation: boolean;
  };
}

// API请求参数类型
export interface CreateAgentConfigParams {
  name: string;
  display_name: string;
  agent_type: 'SimpleAgent' | 'OrchestraAgent';
  description: string;
  instructions: string[];
  model_config: {
    provider: string;
    model_id: string;
    temperature: number;
    max_tokens: number;
    top_p?: number;
  };
  tools?: string[];
  environments?: string[];
  security_level?: string;
}

export interface CreateMetaSessionParams {
  initial_description: string;
  domain?: string;
  user_id?: string;
  context?: Record<string, any>;
}

export interface ContinueConversationParams {
  session_id: string;
  user_message: string;
}

export interface ExecuteAgentParams {
  config_id?: string;
  query: string;
  user_id?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface HybridQueryParams {
  query: string;
  user_id?: string;
  strategy?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface CreateCustomStrategyParams {
  name: string;
  description: string;
  config: Record<string, any>;
  user_id?: string;
}

class YoutuAgentService {
  private baseURL = '/youtu';  // 相对路径，baseURL已经包含/api/v1

  // Agent配置管理
  async createAgentConfig(params: CreateAgentConfigParams): Promise<ApiResponse<YoutuAgentConfig>> {
    const response = await api.post(`${this.baseURL}/agent/config`, params);
    return response.data;
  }

  async getAgentConfigs(params?: {
    user_id?: string;
    agent_type?: 'SimpleAgent' | 'OrchestraAgent';
    limit?: number;
  }): Promise<ApiResponse<YoutuAgentConfig[]>> {
    const response = await api.get(`${this.baseURL}/agent/configs`, { params });
    return response.data;
  }

  async getAgentConfig(configId: string): Promise<ApiResponse<YoutuAgentConfig>> {
    const response = await api.get(`${this.baseURL}/agent/config/${configId}`);
    return response.data;
  }

  async updateAgentConfig(configId: string, params: Partial<CreateAgentConfigParams>): Promise<ApiResponse<YoutuAgentConfig>> {
    const response = await api.put(`${this.baseURL}/agent/config/${configId}`, params);
    return response.data;
  }

  async deleteAgentConfig(configId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseURL}/agent/config/${configId}`);
    return response.data;
  }

  // Agent执行
  async executeAgent(params: ExecuteAgentParams): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseURL}/agent/execute`, params);
    return response.data;
  }

  async quickQuery(params: { 
    query: string; 
    user_id?: string; 
    context?: Record<string, any>; 
    stream?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseURL}/agent/quick-query`, params);
    return response.data;
  }

  // 流式查询 (EventSource方式)
  createQuickQueryStream(params: {
    query: string;
    user_id?: string;
    context?: Record<string, any>;
  }): EventSource {
    const url = new URL(`${window.location.origin}${this.baseURL}/agent/quick-query`);
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    searchParams.append('stream', 'true');
    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.context) searchParams.append('context', JSON.stringify(params.context));

    return new EventSource(`${url}?${searchParams}`);
  }

  // 元智能体 - Meta-Agent自动生成
  async createMetaSession(params: CreateMetaSessionParams): Promise<ApiResponse<MetaAgentSession>> {
    const response = await api.post(`${this.baseURL}/meta/session`, params);
    return response.data;
  }

  async continueConversation(params: ContinueConversationParams): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseURL}/meta/continue`, params);
    return response.data;
  }

  // 基于YOUTU-Agent SimpleAgentGenerator的自动生成流程
  async startAutoGeneration(requirement: string): Promise<ApiResponse<{
    session_id: string;
    initial_response: string;
  }>> {
    const response = await api.post(`${this.baseURL}/meta/auto-generate`, {
      requirement,
      generator_type: 'SimpleAgentGenerator'
    });
    return response.data;
  }

  // 继续Meta-Agent对话生成流程
  async continueAutoGeneration(params: {
    session_id: string;
    user_response: string;
  }): Promise<ApiResponse<{
    assistant_response: string;
    is_complete: boolean;
    generated_config?: any;
  }>> {
    const response = await api.post(`${this.baseURL}/meta/continue-generation`, params);
    return response.data;
  }

  // 获取生成的Agent配置预览
  async getGeneratedConfig(sessionId: string): Promise<ApiResponse<{
    config: CreateAgentConfigParams;
    yaml_content: string;
  }>> {
    const response = await api.get(`${this.baseURL}/meta/generated-config/${sessionId}`);
    return response.data;
  }

  async getMetaSession(sessionId: string): Promise<ApiResponse<MetaAgentSession>> {
    const response = await api.get(`${this.baseURL}/meta/session/${sessionId}`);
    return response.data;
  }

  async getMetaSessions(params?: {
    user_id?: string;
    limit?: number;
  }): Promise<ApiResponse<MetaAgentSession[]>> {
    const response = await api.get(`${this.baseURL}/meta/sessions`, { params });
    return response.data;
  }

  // 混合智能体
  async hybridQuery(params: HybridQueryParams): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseURL}/hybrid/query`, params);
    return response.data;
  }

  async getHybridStrategies(): Promise<ApiResponse<{
    strategies: Record<string, HybridAgentStrategy>;
    default_strategy: string;
    framework_capabilities: Record<string, any>;
  }>> {
    const response = await api.get(`${this.baseURL}/hybrid/strategies`);
    return response.data;
  }

  async createCustomStrategy(params: CreateCustomStrategyParams): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseURL}/hybrid/strategy`, params);
    return response.data;
  }

  // 创建混合查询流
  createHybridQueryStream(params: HybridQueryParams): EventSource {
    const url = new URL(`${window.location.origin}${this.baseURL}/hybrid/query`);
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    searchParams.append('stream', 'true');
    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.strategy) searchParams.append('strategy', params.strategy);
    if (params.context) searchParams.append('context', JSON.stringify(params.context));

    return new EventSource(`${url}?${searchParams}`);
  }

  // 执行历史和监控
  async getExecutionHistory(params?: {
    user_id?: string;
    strategy?: string;
    limit?: number;
  }): Promise<ApiResponse<ExecutionHistory[]>> {
    const response = await api.get(`${this.baseURL}/execution/history`, { params });
    return response.data;
  }

  async getExecutionDetails(executionId: string): Promise<ApiResponse<ExecutionHistory>> {
    const response = await api.get(`${this.baseURL}/execution/${executionId}`);
    return response.data;
  }

  // 系统信息
  async getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    const response = await api.get(`${this.baseURL}/info`);
    return response.data;
  }

  async healthCheck(): Promise<ApiResponse<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
    features: Record<string, string>;
  }>> {
    const response = await api.get(`${this.baseURL}/health`);
    return response.data;
  }

  // 工具方法
  validateAgentConfig(config: Partial<CreateAgentConfigParams>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.name?.trim()) {
      errors.push('Agent名称不能为空');
    }

    if (!config.display_name?.trim()) {
      errors.push('显示名称不能为空');
    }

    if (!config.agent_type) {
      errors.push('必须选择Agent类型');
    }

    if (!config.description?.trim()) {
      errors.push('描述不能为空');
    }

    if (!config.instructions || config.instructions.length === 0) {
      errors.push('至少需要一条指令');
    }

    if (!config.model_config) {
      errors.push('模型配置不能为空');
    } else {
      if (!config.model_config.provider) {
        errors.push('必须指定模型提供商');
      }
      if (!config.model_config.model_id) {
        errors.push('必须指定模型ID');
      }
      if (config.model_config.temperature < 0 || config.model_config.temperature > 2) {
        errors.push('温度参数必须在0-2之间');
      }
      if (config.model_config.max_tokens < 1 || config.model_config.max_tokens > 8192) {
        errors.push('最大token数必须在1-8192之间');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 获取默认配置
  getDefaultAgentConfig(): CreateAgentConfigParams {
    return {
      name: '',
      display_name: '',
      agent_type: 'SimpleAgent',
      description: '',
      instructions: ['回答用户问题', '保持友好和专业'],
      model_config: {
        provider: 'one_api',
        model_id: 'Qwen/Qwen3-30B-A3B-Thinking-2507',
        temperature: 0.1,
        max_tokens: 4096,
        top_p: 1.0
      },
      tools: ['knowledge'],
      environments: ['knowledge_env'],
      security_level: 'medium'
    };
  }

  // 获取支持的工具列表
  getSupportedTools(): { id: string; name: string; description: string; category: string }[] {
    return [
      { id: 'knowledge', name: '知识检索', description: '检索知识库中的相关信息', category: 'knowledge' },
      { id: 'search', name: '网络搜索', description: '搜索互联网上的最新信息', category: 'web' },
      { id: 'translation', name: '翻译工具', description: '提供中英文翻译服务', category: 'language' },
      { id: 'graph', name: '图谱查询', description: '查询知识图谱中的实体关系', category: 'knowledge' },
      { id: 'file_ops', name: '文件操作', description: '处理和分析文档文件', category: 'system' },
      { id: 'tabular_data', name: '表格数据处理', description: '处理CSV、Excel等表格数据', category: 'data' },
      { id: 'analysis', name: '数据分析', description: '数据统计分析和可视化', category: 'data' },
      { id: 'code_exec', name: '代码执行', description: '代码运行和调试', category: 'development' },
      { id: 'git', name: 'Git操作', description: 'Git版本控制操作', category: 'development' }
    ];
  }

  // 获取支持的环境列表  
  getSupportedEnvironments(): { id: string; name: string; description: string; type: string }[] {
    return [
      { id: 'knowledge_env', name: '知识环境', description: '提供知识库和图谱查询能力', type: 'knowledge' },
      { id: 'browser_env', name: '浏览器环境', description: '提供网络浏览和搜索能力', type: 'web' },
      { id: 'shell_env', name: '终端环境', description: '提供系统命令执行能力', type: 'system' }
    ];
  }

  // 获取可用工具（动态加载）
  async getAvailableTools(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseURL}/config/tools`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to load available tools:', error);
      return {
        success: false,
        message: error.message || '获取工具配置失败',
        data: this.getSupportedTools()
      };
    }
  }

  // 获取可用环境（动态加载）
  async getAvailableEnvironments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseURL}/config/environments`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to load available environments:', error);
      return {
        success: false,
        message: error.message || '获取环境配置失败',
        data: this.getSupportedEnvironments()
      };
    }
  }

  // 获取Agent类型（动态加载）
  async getAgentTypes(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseURL}/config/agent-types`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to load agent types:', error);
      return {
        success: false,
        message: error.message || '获取Agent类型失败',
        data: [
          { 
            id: 'SimpleAgent', 
            name: 'SimpleAgent', 
            displayName: '简单Agent', 
            description: '基于ReAct模式的单步推理Agent', 
            features: ['快速响应', '直接执行', '适合简单任务'] 
          },
          { 
            id: 'OrchestraAgent', 
            name: 'OrchestraAgent', 
            displayName: '协作Agent', 
            description: '基于Plan-Execute模式的多步骤协作Agent', 
            features: ['复杂规划', '多步执行', '适合复杂任务'] 
          }
        ]
      };
    }
  }

  // 获取动态模板（动态加载）
  async getDynamicTemplates(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseURL}/config/templates`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to load dynamic templates:', error);
      return {
        success: false,
        message: error.message || '获取模板配置失败',
        data: []
      };
    }
  }

  // 获取模型配置选项
  getModelOptions(): { 
    providers: Array<{ id: string; name: string; models: Array<{ id: string; name: string }> }> 
  } {
    return {
      providers: [
        {
          id: 'one_api',
          name: 'One API',
          models: [
            { id: 'Qwen/Qwen3-30B-A3B-Thinking-2507', name: 'Qwen3-30B-Thinking' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          ]
        },
        {
          id: 'alibaba',
          name: '阿里云DashScope',
          models: [
            { id: 'qwen-turbo', name: 'Qwen Turbo' },
            { id: 'qwen-plus', name: 'Qwen Plus' },
            { id: 'qwen-max', name: 'Qwen Max' },
          ]
        }
      ]
    };
  }
}

export const youtuAgentService = new YoutuAgentService();