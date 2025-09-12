/**
 * NextAgent Lite 场景管理服务
 * 管理四大基础场景的DAG执行模板
 */

import { apiRequest } from './api';

// 场景配置类型定义
export interface ScenarioConfig {
  id: string;
  name: string;
  display_name: string;
  description: string;
  dag_template: {
    execution_sequence: Array<{
      agent: string;
      action: string;
      depends_on?: string[];
    }>;
    parallel_execution: boolean;
    parallel_agents?: string[];
    timeout_seconds: number;
  };
  agents: string[];
  status: 'active' | 'inactive' | 'testing';
  performance_metrics: {
    success_rate: number;
    avg_response_time: number;
    total_executions: number;
    last_execution?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ScenarioTemplate {
  template_id: string;
  scenario_name: string;
  execution_mode: string;
  dag_config: any;
  agents_config: any;
  is_active: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScenarioRequest {
  name: string;
  display_name: string;
  description: string;
  execution_mode: 'direct_answer' | 'knowledge_retrieval' | 'graph_enhanced' | 'multilang_qa';
  parallel_execution?: boolean;
  timeout_seconds?: number;
}

export interface UpdateScenarioRequest {
  display_name?: string;
  description?: string;
  parallel_execution?: boolean;
  timeout_seconds?: number;
  status?: 'active' | 'inactive' | 'testing';
}

class ScenarioService {
  private readonly baseUrl = '/scenarios';

  /**
   * 获取所有场景配置
   */
  async getAllScenarios(): Promise<ScenarioConfig[]> {
    try {
      // 首先尝试从API获取实际数据
      const response = await apiRequest('GET', this.baseUrl);
      return response.data || this.getDefaultScenarios();
    } catch (error) {
      console.warn('获取场景配置失败，使用默认配置:', error);
      // 如果API不可用，返回基于配置文件的默认场景
      return this.getDefaultScenarios();
    }
  }

  /**
   * 获取特定场景配置
   */
  async getScenario(scenarioId: string): Promise<ScenarioConfig | null> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/${scenarioId}`);
      return response.data || null;
    } catch (error) {
      console.error(`获取场景 ${scenarioId} 失败:`, error);
      // 尝试从默认场景中查找
      const defaultScenarios = this.getDefaultScenarios();
      return defaultScenarios.find(s => s.id === scenarioId) || null;
    }
  }

  /**
   * 创建新场景
   */
  async createScenario(request: CreateScenarioRequest): Promise<ScenarioConfig | null> {
    try {
      const response = await apiRequest('POST', this.baseUrl, request);
      return response.data || null;
    } catch (error) {
      console.error('创建场景失败:', error);
      throw error;
    }
  }

  /**
   * 更新场景配置
   */
  async updateScenario(scenarioId: string, request: UpdateScenarioRequest): Promise<ScenarioConfig | null> {
    try {
      const response = await apiRequest('PUT', `${this.baseUrl}/${scenarioId}`, request);
      return response.data || null;
    } catch (error) {
      console.error(`更新场景 ${scenarioId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除场景
   */
  async deleteScenario(scenarioId: string): Promise<boolean> {
    try {
      await apiRequest('DELETE', `${this.baseUrl}/${scenarioId}`);
      return true;
    } catch (error) {
      console.error(`删除场景 ${scenarioId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 切换场景状态
   */
  async toggleScenarioStatus(scenarioId: string, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      await apiRequest('PUT', `${this.baseUrl}/${scenarioId}/status`, { status });
      return true;
    } catch (error) {
      console.error(`切换场景状态失败:`, error);
      throw error;
    }
  }

  /**
   * 获取场景性能指标
   */
  async getScenarioMetrics(scenarioId: string): Promise<any> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/${scenarioId}/metrics`);
      return response.data || {};
    } catch (error) {
      console.error(`获取场景指标失败:`, error);
      return {};
    }
  }

  /**
   * 执行场景测试
   */
  async testScenario(scenarioId: string, testQuery: string): Promise<any> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/${scenarioId}/test`, { 
        query: testQuery 
      });
      return response.data || null;
    } catch (error) {
      console.error(`测试场景失败:`, error);
      throw error;
    }
  }

  /**
   * 获取默认的四大基础场景（基于配置文件）
   */
  private getDefaultScenarios(): ScenarioConfig[] {
    return [
      {
        id: 'direct_answer',
        name: 'direct_answer',
        display_name: '直接回答模式',
        description: '适用于简单问候、常识性问题，直接回答无需复杂检索',
        dag_template: {
          execution_sequence: [
            { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
            { agent: 'summary_answer_agent', action: 'direct_answer', depends_on: ['intelligent_routing_agent'] }
          ],
          parallel_execution: false,
          timeout_seconds: 15
        },
        agents: ['intelligent_routing_agent', 'summary_answer_agent'],
        status: 'active',
        performance_metrics: {
          success_rate: 97.5,
          avg_response_time: 800,
          total_executions: 2340
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 'knowledge_retrieval',
        name: 'knowledge_retrieval',
        display_name: '知识库检索模式',
        description: '适用于具体政策条款查询，需要从知识库检索准确信息',
        dag_template: {
          execution_sequence: [
            { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
            { agent: 'knowledge_retrieval_agent', action: 'search_policies', depends_on: ['intelligent_routing_agent'] },
            { agent: 'summary_answer_agent', action: 'summarize_with_retrieval', depends_on: ['knowledge_retrieval_agent'] }
          ],
          parallel_execution: false,
          timeout_seconds: 30
        },
        agents: ['intelligent_routing_agent', 'knowledge_retrieval_agent', 'summary_answer_agent'],
        status: 'active',
        performance_metrics: {
          success_rate: 92.8,
          avg_response_time: 1800,
          total_executions: 1890
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 'graph_enhanced',
        name: 'graph_enhanced',
        display_name: '图谱增强检索模式',
        description: '适用于复杂政策关系分析，同时调用知识库和知识图谱',
        dag_template: {
          execution_sequence: [
            { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
            { agent: 'knowledge_retrieval_agent', action: 'search_policies', depends_on: ['intelligent_routing_agent'] },
            { agent: 'knowledge_graph_agent', action: 'search_graph', depends_on: ['intelligent_routing_agent'] },
            { agent: 'summary_answer_agent', action: 'summarize_with_graph', depends_on: ['knowledge_retrieval_agent', 'knowledge_graph_agent'] }
          ],
          parallel_execution: true,
          parallel_agents: ['knowledge_retrieval_agent', 'knowledge_graph_agent'],
          timeout_seconds: 45
        },
        agents: ['intelligent_routing_agent', 'knowledge_retrieval_agent', 'knowledge_graph_agent', 'summary_answer_agent'],
        status: 'active',
        performance_metrics: {
          success_rate: 89.3,
          avg_response_time: 2800,
          total_executions: 1240
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 'multilang_qa',
        name: 'multilang_qa_team_v2',
        display_name: '多语言智能问答模式',
        description: '支持中英文双语问答，具备智能路由和DAG重构能力',
        dag_template: {
          execution_sequence: [
            { agent: 'question_decomposition_agent', action: 'analyze_question' },
            { agent: 'intelligent_routing_agent', action: 'route_and_decide', depends_on: ['question_decomposition_agent'] },
            { agent: 'dag_reconstruction_agent', action: 'optimize_execution', depends_on: ['intelligent_routing_agent'] },
            { agent: 'knowledge_retrieval_agent', action: 'retrieve_knowledge', depends_on: ['dag_reconstruction_agent'] },
            { agent: 'translation_agent', action: 'translate_if_needed', depends_on: ['knowledge_retrieval_agent'] },
            { agent: 'summary_answer_agent', action: 'generate_final_answer', depends_on: ['translation_agent'] }
          ],
          parallel_execution: false,
          timeout_seconds: 60
        },
        agents: ['question_decomposition_agent', 'intelligent_routing_agent', 'dag_reconstruction_agent', 
                'knowledge_retrieval_agent', 'translation_agent', 'summary_answer_agent'],
        status: 'active',
        performance_metrics: {
          success_rate: 94.2,
          avg_response_time: 3200,
          total_executions: 980
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      }
    ];
  }

  /**
   * 获取场景类型配置信息
   */
  getScenarioTypeConfig(name: string) {
    const configs = {
      direct_answer: {
        name: '直接回答',
        color: '#52c41a',
        icon: '💬',
        description: '简单快速响应'
      },
      knowledge_retrieval: {
        name: '知识检索',
        color: '#1890ff',
        icon: '📚',
        description: '基于知识库查询'
      },
      graph_enhanced: {
        name: '图谱增强',
        color: '#fa8c16',
        icon: '🕸️',
        description: '复杂关系分析'
      },
      multilang_qa_team_v2: {
        name: '多语言问答',
        color: '#722ed1',
        icon: '🌐',
        description: '智能路由处理'
      }
    };
    return configs[name as keyof typeof configs] || {
      name: '通用场景',
      color: '#d9d9d9',
      icon: '❓',
      description: '默认处理模式'
    };
  }

  /**
   * 验证DAG执行序列的合法性
   */
  validateDAGSequence(sequence: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const agents = new Set<string>();

    // 检查每个步骤的有效性
    for (let index = 0; index < sequence.length; index++) {
      const step = sequence[index];
      if (!step.agent) {
        errors.push(`步骤 ${index + 1}: 缺少智能体配置`);
        continue;
      }
      
      if (!step.action) {
        errors.push(`步骤 ${index + 1}: 缺少动作配置`);
      }

      agents.add(step.agent);

      // 检查依赖关系是否有效
      if (step.depends_on) {
        for (const dependency of step.depends_on) {
          if (!agents.has(dependency)) {
            errors.push(`步骤 ${index + 1}: 依赖的智能体 ${dependency} 未在前面定义`);
          }
        }
      }
    }

    // 检查是否存在循环依赖（简单检查）
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (agent: string): boolean => {
      if (recursionStack.has(agent)) return true;
      if (visited.has(agent)) return false;

      visited.add(agent);
      recursionStack.add(agent);

      const step = sequence.find(s => s.agent === agent);
      if (step && step.depends_on) {
        for (const dep of step.depends_on) {
          if (hasCycle(dep)) return true;
        }
      }

      recursionStack.delete(agent);
      return false;
    };

    for (const step of sequence) {
      if (hasCycle(step.agent)) {
        errors.push('检测到循环依赖');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 根据执行模式生成推荐的DAG配置
   */
  generateRecommendedDAG(executionMode: string): any {
    const recommendations = {
      direct_answer: {
        execution_sequence: [
          { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
          { agent: 'summary_answer_agent', action: 'direct_answer', depends_on: ['intelligent_routing_agent'] }
        ],
        parallel_execution: false,
        timeout_seconds: 15
      },
      knowledge_retrieval: {
        execution_sequence: [
          { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
          { agent: 'knowledge_retrieval_agent', action: 'search_policies', depends_on: ['intelligent_routing_agent'] },
          { agent: 'summary_answer_agent', action: 'summarize_with_retrieval', depends_on: ['knowledge_retrieval_agent'] }
        ],
        parallel_execution: false,
        timeout_seconds: 30
      },
      graph_enhanced: {
        execution_sequence: [
          { agent: 'intelligent_routing_agent', action: 'analyze_and_route' },
          { agent: 'knowledge_retrieval_agent', action: 'search_policies', depends_on: ['intelligent_routing_agent'] },
          { agent: 'knowledge_graph_agent', action: 'search_graph', depends_on: ['intelligent_routing_agent'] },
          { agent: 'summary_answer_agent', action: 'summarize_with_graph', depends_on: ['knowledge_retrieval_agent', 'knowledge_graph_agent'] }
        ],
        parallel_execution: true,
        parallel_agents: ['knowledge_retrieval_agent', 'knowledge_graph_agent'],
        timeout_seconds: 45
      }
    };

    return recommendations[executionMode as keyof typeof recommendations] || recommendations.knowledge_retrieval;
  }
}

// 导出单例实例
export const scenarioService = new ScenarioService();