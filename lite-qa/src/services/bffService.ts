/**
 * BFF (Backend for Frontend) 服务层
 * 整合和统一前端API调用，处理数据格式转换和业务逻辑
 */
import { qaService } from './qaService';
import { knowledgeService } from './knowledgeService';
import { graphService } from './graphService';
import { systemConfigService } from './systemConfigService';
import { apiService } from './api';
import type { 
  QARequest, 
  QAResponse, 
  Message,
  HistoryConversation,
  KnowledgeDocument,
  GraphNode,
  GraphEdge,
  VectorConfig,
  ModelConfig,
  RetrievalResult,
  AgentInfo
} from '../types';

export class BFFService {
  // ============ QA问答相关 ============
  
  /**
   * 统一问答接口 - 处理前后端数据格式差异
   */
  async askQuestion(request: {
    message: string;
    conversation_id?: string;
    agent_config?: {
      model: string;
      temperature?: number;
      max_tokens?: number;
    };
    agentType?: 'team' | 'single';
    agentName?: string;
  }): Promise<{
    message: string;
    sources: any[];
    conversation_id: string;
    message_id: string;
    confidence?: number;
    processing_time?: number;
  }> {
    try {
      // 转换前端请求格式到后端格式
      const backendRequest = {
        question: request.message,
        session_id: request.conversation_id,
        agent_type: request.agentType || 'team',
        agent_name: request.agentName,
        context: request.agent_config ? {
          model_config: request.agent_config
        } : undefined
      };

      const response = await apiService.post<{
        answer: string;
        session_id: string;
        agent_name: string;
        model_used: string;
        confidence_score?: number;
        processing_time: number;
        sources?: any[];
        metadata?: any;
        timestamp: number;
      }>('/qa/ask', backendRequest);

      // 转换后端响应格式到前端格式
      return {
        message: response.answer,
        sources: response.sources || [],
        conversation_id: response.session_id,
        message_id: `msg_${response.timestamp}`,
        confidence: response.confidence_score,
        processing_time: response.processing_time
      };
    } catch (error) {
      console.error('BFF问答请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取对话历史 - 统一数据格式
   */
  async getConversationHistory(): Promise<HistoryConversation[]> {
    try {
      const response = await apiService.get<{
        conversations: Array<{
          id: number;
          session_id: string;
          title?: string;
          message_count: number;
          last_message?: string;
          created_at: string;
          updated_at?: string;
        }>;
        total: number;
      }>('/conversations');

      // 转换数据格式
      return response.conversations.map(conv => ({
        id: conv.session_id,
        title: conv.title || '新对话',
        lastMessage: conv.last_message || '',
        time: conv.updated_at || conv.created_at,
        messageCount: conv.message_count
      }));
    } catch (error) {
      console.error('BFF获取对话历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取对话消息列表
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      // 这里需要后端提供相应接口
      const response = await apiService.get<Message[]>(`/conversations/${conversationId}/messages`);
      return response;
    } catch (error) {
      console.error('BFF获取对话消息失败:', error);
      // 返回空数组作为默认值
      return [];
    }
  }

  /**
   * 创建新对话
   */
  async createConversation(title?: string): Promise<HistoryConversation> {
    try {
      const response = await apiService.post<{
        id: number;
        session_id: string;
        title?: string;
        created_at: string;
      }>('/conversations', {
        title: title || '新对话'
      });

      return {
        id: response.session_id,
        title: response.title || '新对话',
        lastMessage: '',
        time: response.created_at,
        messageCount: 0
      };
    } catch (error) {
      console.error('BFF创建对话失败:', error);
      throw error;
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiService.delete(`/conversations/${conversationId}`);
    } catch (error) {
      console.error('BFF删除对话失败:', error);
      throw error;
    }
  }

  // ============ 知识库管理相关 ============
  
  /**
   * 获取文档列表
   */
  async getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
    return knowledgeService.getDocuments();
  }

  /**
   * 上传文档
   */
  async uploadKnowledgeDocuments(files: FileList, metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
    vectorConfig?: {
      useDefault: boolean;
      chunkSize?: number;
      chunkOverlap?: number;
      chunkingStrategy?: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
    };
    chunkingConfigId?: string;
    customChunkSize?: number;
    customChunkOverlap?: number;
  }>): Promise<KnowledgeDocument[]> {
    return knowledgeService.uploadDocuments(files, metadata);
  }

  /**
   * 向量化文档
   */
  async vectorizeDocuments(documentIds: string[], config?: Partial<VectorConfig>): Promise<void> {
    return knowledgeService.vectorizeDocuments(documentIds, config);
  }

  /**
   * 测试检索
   */
  async testRetrieval(query: string, config?: {
    topK?: number;
    threshold?: number;
    useRerank?: boolean;
  }): Promise<RetrievalResult[]> {
    return knowledgeService.testRetrieval(query, config);
  }

  /**
   * 获取向量配置
   */
  async getVectorConfigs(): Promise<VectorConfig[]> {
    try {
      const config = await knowledgeService.getVectorConfig();
      return [config]; // 包装成数组格式
    } catch (error) {
      console.error('BFF获取向量配置失败:', error);
      return [];
    }
  }

  /**
   * 获取模型配置
   */
  async getModelConfigs(): Promise<ModelConfig[]> {
    return knowledgeService.getModelConfigs();
  }

  // ============ 知识图谱相关 ============
  
  /**
   * 获取图谱数据
   */
  async getGraphData(): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }> {
    try {
      const result = await graphService.getGraphData();
      return {
        nodes: result.nodes,
        edges: result.edges
      };
    } catch (error) {
      console.error('BFF获取图谱数据失败:', error);
      // 返回模拟数据
      return {
        nodes: [],
        edges: []
      };
    }
  }

  /**
   * 搜索图谱节点
   */
  async searchGraphNodes(query: string): Promise<GraphNode[]> {
    return graphService.searchNodes(query);
  }

  /**
   * 创建图谱节点
   */
  async createGraphNode(nodeData: Omit<GraphNode, 'id'>): Promise<GraphNode> {
    return graphService.createNode(nodeData);
  }

  /**
   * 创建图谱关系
   */
  async createGraphEdge(edgeData: Omit<GraphEdge, 'id'>): Promise<GraphEdge> {
    return graphService.createEdge(edgeData);
  }

  // ============ 系统配置相关 ============
  
  /**
   * 获取可用智能体列表
   */
  async getAvailableAgents(): Promise<AgentInfo[]> {
    try {
      const response = await apiService.get<Array<{
        name: string;
        type: string;
        description: string;
      }>>('/qa/agents');

      return response.map(agent => ({
        id: agent.name,
        name: agent.name,
        description: agent.description,
        type: agent.type as 'agent' | 'team',
        models: [], // 需要后端提供具体模型信息
        defaultModel: ''
      }));
    } catch (error) {
      console.error('BFF获取智能体列表失败:', error);
      return [];
    }
  }

  /**
   * 获取支持的模型列表
   */
  async getSupportedModels(): Promise<Record<string, string[]>> {
    try {
      const response = await apiService.get<{ models: Record<string, string[]> }>('/qa/models');
      return response.models;
    } catch (error) {
      console.error('BFF获取模型列表失败:', error);
      return {};
    }
  }

  // ============ 数据导出相关 ============
  
  /**
   * 导出对话记录
   */
  async exportConversation(conversationId: string, format: 'pdf' | 'markdown' | 'json' = 'markdown'): Promise<void> {
    try {
      await apiService.download(
        `/conversations/${conversationId}/export?format=${format}`,
        `conversation_${conversationId}.${format}`
      );
    } catch (error) {
      console.error('BFF导出对话失败:', error);
      throw error;
    }
  }

  /**
   * 导出知识库数据
   */
  async exportKnowledgeData(format: 'csv' | 'json' = 'json'): Promise<void> {
    return knowledgeService.exportDocuments(format);
  }

  // ============ 统计信息相关 ============
  
  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    conversations: number;
    documents: number;
    graphNodes: number;
    graphEdges: number;
  }> {
    try {
      const [convStats, knowledgeStats, graphStats] = await Promise.all([
        apiService.get<any>('/conversations/stats/overview').catch(() => ({ total_conversations: 0 })),
        knowledgeService.getStatistics().catch(() => ({ totalDocuments: 0 })),
        graphService.getGraphStats().catch(() => ({ nodeCount: 0, edgeCount: 0 }))
      ]);

      return {
        conversations: convStats.total_conversations || 0,
        documents: knowledgeStats.totalDocuments || 0,
        graphNodes: graphStats.nodeCount || 0,
        graphEdges: graphStats.edgeCount || 0
      };
    } catch (error) {
      console.error('BFF获取系统统计失败:', error);
      return {
        conversations: 0,
        documents: 0,
        graphNodes: 0,
        graphEdges: 0
      };
    }
  }

  // ============ 系统配置管理相关 ============

  /**
   * 获取完整系统配置
   */
  async getSystemConfig() {
    return systemConfigService.getSystemConfig();
  }

  /**
   * 验证系统配置
   */
  async validateSystemConfig() {
    return systemConfigService.validateConfig();
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(section: string, settings: Record<string, any>, restartServices: boolean = false) {
    return systemConfigService.updateConfig(section, settings, restartServices);
  }

  /**
   * 获取环境变量状态
   */
  async getEnvironmentVariables() {
    return systemConfigService.getEnvironmentVariables();
  }

  /**
   * 测试服务连接
   */
  async testServiceConnection(serviceName: string) {
    return systemConfigService.testServiceConnection(serviceName);
  }

  /**
   * 获取智能检索模式信息
   */
  async getRetrievalModes() {
    return systemConfigService.getRetrievalModes();
  }

  /**
   * 切换检索模式
   */
  async switchRetrievalMode(mode: string) {
    return systemConfigService.switchRetrievalMode(mode);
  }

  /**
   * 获取配置改进建议
   */
  async getConfigRecommendations() {
    return systemConfigService.getConfigRecommendations();
  }

  /**
   * 获取系统状态概览
   */
  async getSystemStatus() {
    return systemConfigService.getSystemStatus();
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences() {
    return systemConfigService.getUserPreferences();
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(preferences: Record<string, any>) {
    return systemConfigService.updateUserPreferences(preferences);
  }

  /**
   * 获取统计概览
   */
  async getStatsOverview() {
    return systemConfigService.getStatsOverview();
  }

  /**
   * 获取数据库状态
   */
  async getDatabaseStatus() {
    return systemConfigService.getDatabaseStatus();
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection(dbType: 'postgresql' | 'elasticsearch' | 'arangodb') {
    return systemConfigService.testDatabaseConnection(dbType);
  }

  /**
   * 获取模型配置状态
   */
  async getModelConfig() {
    return systemConfigService.getModelConfig();
  }

  /**
   * 测试模型连接
   */
  async testModelConnection(provider: string, modelId: string) {
    return systemConfigService.testModelConnection(provider, modelId);
  }

  // ============ 增强配置管理功能 ============

  /**
   * 批量更新系统配置
   */
  async batchUpdateConfigs(configs: Array<{
    section: string;
    settings: Record<string, any>;
    restartServices?: boolean;
  }>): Promise<{
    success: boolean;
    results: Array<{
      section: string;
      success: boolean;
      error?: string;
      backup_file?: string;
      restart_required?: boolean;
    }>;
  }> {
    const results = [];
    let overallSuccess = true;

    for (const config of configs) {
      try {
        const result = await this.updateSystemConfig(
          config.section, 
          config.settings, 
          config.restartServices || false
        );
        results.push({
          section: config.section,
          success: true,
          backup_file: result.backup_file,
          restart_required: result.restart_required
        });
      } catch (error) {
        console.error(`配置段落 ${config.section} 更新失败:`, error);
        results.push({
          section: config.section,
          success: false,
          error: error?.message || '未知错误'
        });
        overallSuccess = false;
      }
    }

    return {
      success: overallSuccess,
      results
    };
  }

  /**
   * 获取配置变更历史
   */
  async getConfigHistory(section?: string, limit: number = 10): Promise<Array<{
    timestamp: string;
    section: string;
    changes: Record<string, any>;
    user?: string;
    backup_file?: string;
  }>> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Array<{
          timestamp: string;
          section: string;
          changes: Record<string, any>;
          user?: string;
          backup_file?: string;
        }>;
      }>('/config/history', {
        params: { section, limit }
      });

      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取配置历史失败:', error);
      return [];
    }
  }

  /**
   * 回滚配置到指定版本
   */
  async rollbackConfig(section: string, backupFile: string): Promise<{
    success: boolean;
    message: string;
    restart_required: boolean;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        restart_required: boolean;
      }>('/config/rollback', {
        section,
        backup_file: backupFile
      });

      return response;
    } catch (error) {
      console.error('配置回滚失败:', error);
      throw error;
    }
  }

  /**
   * 导出系统配置
   */
  async exportSystemConfig(sections?: string[]): Promise<{
    config: Record<string, any>;
    metadata: {
      export_time: string;
      sections: string[];
      version: string;
    };
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          config: Record<string, any>;
          metadata: {
            export_time: string;
            sections: string[];
            version: string;
          };
        };
      }>('/config/export', {
        params: { sections: sections?.join(',') }
      });

      if (response.success) {
        return response.data;
      }
      throw new Error('导出配置失败');
    } catch (error) {
      console.error('导出系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 导入系统配置
   */
  async importSystemConfig(
    configData: Record<string, any>, 
    options: {
      overwrite?: boolean;
      validate?: boolean;
      backup?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    imported_sections: string[];
    skipped_sections: string[];
    backup_file?: string;
    restart_required: boolean;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          imported_sections: string[];
          skipped_sections: string[];
          backup_file?: string;
          restart_required: boolean;
        };
      }>('/config/import', {
        config: configData,
        options: {
          overwrite: options.overwrite ?? true,
          validate: options.validate ?? true,
          backup: options.backup ?? true
        }
      });

      if (response.success) {
        return {
          success: true,
          ...response.data
        };
      }
      throw new Error('导入配置失败');
    } catch (error) {
      console.error('导入系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 实时获取配置状态
   */
  async getConfigStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    sections: Record<string, {
      status: 'healthy' | 'warning' | 'error';
      last_updated: string;
      validation_errors?: string[];
    }>;
    pending_restarts: string[];
    last_validation: string;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          status: 'healthy' | 'warning' | 'error';
          sections: Record<string, {
            status: 'healthy' | 'warning' | 'error';
            last_updated: string;
            validation_errors?: string[];
          }>;
          pending_restarts: string[];
          last_validation: string;
        };
      }>('/config/status');

      if (response.success) {
        return response.data;
      }
      throw new Error('获取配置状态失败');
    } catch (error) {
      console.error('获取配置状态失败:', error);
      return {
        status: 'error',
        sections: {},
        pending_restarts: [],
        last_validation: new Date().toISOString()
      };
    }
  }

  /**
   * 重置配置段落为默认值
   */
  async resetConfigSection(section: string, backup: boolean = true): Promise<{
    success: boolean;
    message: string;
    backup_file?: string;
    restart_required: boolean;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        backup_file?: string;
        restart_required: boolean;
      }>('/config/reset', {
        section,
        backup
      });

      return response;
    } catch (error) {
      console.error('重置配置段落失败:', error);
      throw error;
    }
  }

  /**
   * 应用配置模板
   */
  async applyConfigTemplate(templateName: string, customizations?: Record<string, any>): Promise<{
    success: boolean;
    applied_sections: string[];
    backup_file: string;
    restart_required: boolean;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          applied_sections: string[];
          backup_file: string;
          restart_required: boolean;
        };
      }>('/config/templates/apply', {
        template_name: templateName,
        customizations: customizations || {}
      });

      if (response.success) {
        return {
          success: true,
          ...response.data
        };
      }
      throw new Error('应用配置模板失败');
    } catch (error) {
      console.error('应用配置模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用配置模板
   */
  async getConfigTemplates(): Promise<Array<{
    name: string;
    description: string;
    sections: string[];
    suitable_for: string[];
    preview: Record<string, any>;
  }>> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Array<{
          name: string;
          description: string;
          sections: string[];
          suitable_for: string[];
          preview: Record<string, any>;
        }>;
      }>('/config/templates');

      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取配置模板失败:', error);
      return [];
    }
  }

}

// 导出BFF服务实例
export const bffService = new BFFService();