/**
 * 智能体模板服务
 * 提供智能体模板的查询、管理和配置接口
 */
import { apiService } from './api';

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
  is_system: boolean;
  is_active: boolean;
  team_members?: TeamMember[];
  team_mode?: string;
}

export interface TeamMember {
  agent_id: string;
  role: 'leader' | 'member' | 'coordinator';
  order: number;
}

export interface AgentTemplateCreate {
  template_code: string;
  template_name: string;
  template_type: 'single' | 'team';
  category?: string;
  description?: string;
  icon?: string;
  color?: string;
  base_config?: Record<string, any>;
  model_config?: Record<string, any>;
  tools_config?: string[];
  team_members?: TeamMember[];
  team_mode?: string;
}

export interface AgentTemplateUpdate {
  template_name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  base_config?: Record<string, any>;
  model_config?: Record<string, any>;
  tools_config?: string[];
  team_members?: TeamMember[];
  team_mode?: string;
  is_active?: boolean;
}

export interface AvailableAgents {
  single: AgentSummary[];
  team: AgentSummary[];
}

export interface AgentSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  icon: string;
  color: string;
  is_system: boolean;
  team_members?: TeamMember[];
  team_mode?: string;
}

export interface AgentConfig {
  template_id: string;
  template_code: string;
  name: string;
  type: 'single' | 'team';
  base_config: Record<string, any>;
  model_config: Record<string, any>;
  tools_config: string[];
  team_members?: TeamMember[];
  team_mode?: string;
}

export interface AgentCategory {
  code: string;
  name: string;
  icon: string;
}

class AgentTemplateService {
  /**
   * 获取智能体模板列表
   */
  async getTemplateList(params?: {
    template_type?: 'single' | 'team';
    category?: string;
    is_active?: boolean;
  }): Promise<AgentTemplate[]> {
    return await apiService.get<AgentTemplate[]>('/agent-templates/list', { params });
  }

  /**
   * 获取可用的智能体列表（按类型分组）
   */
  async getAvailableAgents(): Promise<AvailableAgents> {
    const response = await apiService.get<{data: AvailableAgents}>('/agent-templates/available');
    return response.data;
  }

  /**
   * 获取智能体模板详情
   */
  async getTemplateDetail(templateCode: string): Promise<AgentTemplate> {
    const response = await apiService.get<{data: AgentTemplate}>(`/agent-templates/detail/${templateCode}`);
    return response.data;
  }

  /**
   * 获取智能体配置（用于实例化）
   */
  async getAgentConfig(templateCode: string): Promise<AgentConfig> {
    const response = await apiService.get<{data: AgentConfig}>(`/agent-templates/config/${templateCode}`);
    return response.data;
  }

  /**
   * 创建智能体模板
   */
  async createTemplate(data: AgentTemplateCreate): Promise<AgentTemplate> {
    const response = await apiService.post<{data: AgentTemplate}>('/agent-templates/create', data);
    return response.data;
  }

  /**
   * 更新智能体模板
   */
  async updateTemplate(templateId: string, data: AgentTemplateUpdate): Promise<AgentTemplate> {
    const response = await apiService.put<{data: AgentTemplate}>(`/agent-templates/update/${templateId}`, data);
    return response.data;
  }

  /**
   * 删除智能体模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await apiService.delete(`/agent-templates/delete/${templateId}`);
  }

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<AgentCategory[]> {
    const response = await apiService.get<{data: AgentCategory[]}>('/agent-templates/categories');
    return response.data;
  }

  /**
   * 获取单智能体列表（简化版）
   */
  async getSingleAgents(): Promise<AgentSummary[]> {
    const agents = await this.getAvailableAgents();
    return agents.single;
  }

  /**
   * 获取Team列表（简化版）
   */
  async getTeamAgents(): Promise<AgentSummary[]> {
    const agents = await this.getAvailableAgents();
    return agents.team;
  }

  /**
   * 根据类型获取智能体列表
   */
  async getAgentsByType(type: 'single' | 'team'): Promise<AgentSummary[]> {
    const agents = await this.getAvailableAgents();
    return type === 'single' ? agents.single : agents.team;
  }

  /**
   * 搜索智能体
   */
  async searchAgents(keyword: string): Promise<AgentSummary[]> {
    const agents = await this.getAvailableAgents();
    const allAgents = [...agents.single, ...agents.team];
    
    return allAgents.filter(agent => 
      agent.name.toLowerCase().includes(keyword.toLowerCase()) ||
      agent.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      agent.code.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 获取智能体图标映射
   */
  getIconMap(): Record<string, string> {
    return {
      'question_decomposition_agent': '🔍',
      'translation_agent': '🌐',
      'knowledge_retrieval_agent': '📚',
      'knowledge_graph_agent': '🕸️',
      'summary_answer_agent': '📝',
      'intelligent_routing_agent': '🚦',
      'dag_reconstruction_agent': '📊',
      'qa_coordinator_v2': '🎯',
      'general_qa_team_v2': '👥',
      'intelligent_routing_team': '🚀'
    };
  }

  /**
   * 格式化智能体名称（用于显示）
   */
  formatAgentName(agent: AgentSummary): string {
    const iconMap = this.getIconMap();
    const icon = iconMap[agent.code] || agent.icon || '🤖';
    return `${icon} ${agent.name}`;
  }

  /**
   * 验证模板代码是否可用
   */
  async isTemplateCodeAvailable(code: string): Promise<boolean> {
    try {
      await this.getTemplateDetail(code);
      return false; // 如果能获取到，说明已存在
    } catch {
      return true; // 获取失败，说明不存在，可用
    }
  }
}

// 导出服务实例
export const agentTemplateService = new AgentTemplateService();