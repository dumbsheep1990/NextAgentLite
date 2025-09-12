/**
 * NextAgent Lite 团队模板服务
 * 管理团队模板的获取、创建实例等操作
 */

import { apiRequest } from './api';

// 类型定义
export interface AgentConfig {
  agent_id: string;
  name: string;
  description: string;
  model_provider: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  is_active: boolean;
}

export interface TeamTemplate {
  template_id: string;
  team_name: string;
  execution_mode: string;
  agent_sequence: any[];
  dependencies: Record<string, string[]>;
  timeout_config: Record<string, any>;
  retry_config: Record<string, any>;
  is_active: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface TeamInstance {
  instance_id: string;
  template_id: string;
  team_name: string;
  execution_mode: string;
  status: string;
  created_at: string;
  agents: Record<string, AgentConfig>;
}

export interface ExecutionModeInfo {
  available_modes: string[];
  default_mode: string;
  mode_descriptions: Record<string, string>;
}

export interface CreateTeamInstanceRequest {
  template_id: string;
  execution_mode?: string;
}

export interface TeamTemplateHealth {
  status: string;
  templates_count: number;
  active_instances: number;
  timestamp: string;
}

class TeamTemplateService {
  private readonly baseUrl = '/team-templates';

  /**
   * 获取所有团队模板
   */
  async getAllTemplates(): Promise<TeamTemplate[]> {
    try {
      const response = await apiRequest('GET', this.baseUrl);
      return response.data || [];
    } catch (error) {
      console.error('获取团队模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定团队模板
   */
  async getTemplate(templateId: string): Promise<TeamTemplate | null> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/${templateId}`);
      return response.data || null;
    } catch (error) {
      console.error(`获取模板 ${templateId} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取模板的智能体配置
   */
  async getTemplateAgents(templateId: string): Promise<Record<string, AgentConfig> | null> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/${templateId}/agents`);
      return response.data || null;
    } catch (error) {
      console.error(`获取模板智能体配置失败:`, error);
      return null;
    }
  }

  /**
   * 创建团队实例
   */
  async createTeamInstance(request: CreateTeamInstanceRequest): Promise<TeamInstance | null> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/instances`, request);
      return response.data || null;
    } catch (error) {
      console.error('创建团队实例失败:', error);
      throw error;
    }
  }

  /**
   * 获取团队实例
   */
  async getTeamInstance(instanceKey: string): Promise<TeamInstance | null> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/instances/${instanceKey}`);
      return response.data || null;
    } catch (error) {
      console.error(`获取团队实例失败:`, error);
      return null;
    }
  }

  /**
   * 获取可用的执行模式
   */
  async getExecutionModes(): Promise<ExecutionModeInfo> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/execution-modes`);
      return response.data || {
        available_modes: ['knowledge_retrieval'],
        default_mode: 'knowledge_retrieval',
        mode_descriptions: {
          'knowledge_retrieval': '知识库检索模式 - 适用于专业知识查询'
        }
      };
    } catch (error) {
      console.error('获取执行模式失败:', error);
      // 返回默认值
      return {
        available_modes: ['knowledge_retrieval'],
        default_mode: 'knowledge_retrieval',
        mode_descriptions: {
          'knowledge_retrieval': '知识库检索模式 - 适用于专业知识查询'
        }
      };
    }
  }

  /**
   * 清理已完成的实例
   */
  async cleanupInstances(): Promise<boolean> {
    try {
      await apiRequest('POST', `${this.baseUrl}/cleanup`);
      return true;
    } catch (error) {
      console.error('清理实例失败:', error);
      return false;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<TeamTemplateHealth> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/health`);
      return response.data || {
        status: 'unknown',
        templates_count: 0,
        active_instances: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('团队模板健康检查失败:', error);
      return {
        status: 'unhealthy',
        templates_count: 0,
        active_instances: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取默认的团队模板ID
   */
  getDefaultTeamTemplateId(): string {
    return 'nextAgent_qa_team';
  }

  /**
   * 获取执行模式的显示名称
   */
  getExecutionModeDisplayName(mode: string): string {
    const modeNames: Record<string, string> = {
      'direct_answer': '直接回答',
      'knowledge_retrieval': '知识检索',
      'graph_enhanced': '图谱增强'
    };
    return modeNames[mode] || mode;
  }

  /**
   * 获取执行模式的描述
   */
  getExecutionModeDescription(mode: string): string {
    const descriptions: Record<string, string> = {
      'direct_answer': '直接回答模式 - 适用于简单问候、常识性问题，无需调用检索服务',
      'knowledge_retrieval': '知识库检索模式 - 适用于专业知识查询，调用知识库检索',
      'graph_enhanced': '图谱增强模式 - 适用于复杂知识关系分析，同时调用知识库和知识图谱检索'
    };
    return descriptions[mode] || '未知模式';
  }

  /**
   * 获取执行模式的图标
   */
  getExecutionModeIcon(mode: string): string {
    const icons: Record<string, string> = {
      'direct_answer': '💬',
      'knowledge_retrieval': '📚',
      'graph_enhanced': '🕸️'
    };
    return icons[mode] || '❓';
  }
}

// 导出单例实例
export const teamTemplateService = new TeamTemplateService();