/**
 * 系统配置服务 - 对接后端系统配置管理API
 */
import { apiService } from './api';

export interface SystemConfigSection {
  name: string;
  title: string;
  description: string;
  status: string;
  settings: Record<string, any>;
  editable: boolean;
  requires_restart: boolean;
}

export interface ServiceConfigStatus {
  name: string;
  status: string;
  message: string;
  details: Record<string, any>;
  has_fallback: boolean;
  fallback_active: boolean;
}

export interface SystemConfigResponse {
  sections: SystemConfigSection[];
  service_status: ServiceConfigStatus[];
  fallback_configs: Record<string, any>;
  last_validation?: string;
  environment_variables: string[];
}

export interface ConfigValidationResult {
  overall_status: string;
  warnings: string[];
  critical_issues: string[];
  fallback_configs: Record<string, any>;
}

export interface RetrievalModeInfo {
  current_mode: string;
  available_modes: string[];
  mode_capabilities: Record<string, {
    description: string;
    features: string[];
    performance: string;
  }>;
  recommendations: string[];
  fallback_mode: string;
}

export interface ConfigRecommendation {
  type: 'warning' | 'error' | 'improvement' | 'performance' | 'quality' | 'environment';
  message: string;
  category: string;
}

export class SystemConfigService {
  
  /**
   * 获取完整系统配置
   */
  async getSystemConfig(): Promise<SystemConfigResponse> {
    try {
      // Request system configuration
      
      const response = await apiService.get<SystemConfigResponse>('/config/');
      
      // System config loaded successfully
      return response;
    } catch (error) {
      // Failed to get system configuration
      
      // 返回默认配置
      const fallbackConfig = {
        sections: [],
        service_status: [],
        fallback_configs: {},
        environment_variables: []
      };
      
      // Using fallback configuration
      return fallbackConfig;
    }
  }

  /**
   * 重新验证系统配置
   */
  async validateConfig(): Promise<ConfigValidationResult> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: ConfigValidationResult;
      }>('/config/validate');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('配置验证失败');
      }
    } catch (error) {
      // Configuration validation failed
      throw error;
    }
  }

  /**
   * 更新配置项
   */
  async updateConfig(section: string, settings: Record<string, any>, restartServices: boolean = false): Promise<{
    section: string;
    backup_file: string;
    restart_required: boolean;
  }> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: {
          section: string;
          backup_file: string;
          restart_required: boolean;
        };
      }>('/config/update', {
        section,
        settings,
        restart_services: restartServices
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('配置更新失败');
      }
    } catch (error) {
      // Configuration update failed
      throw error;
    }
  }

  /**
   * 获取环境变量状态
   */
  async getEnvironmentVariables(): Promise<{
    required_variables: string[];
    current_status: Record<string, {
      configured: boolean;
      value: string | null;
    }>;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          required_variables: string[];
          current_status: Record<string, {
            configured: boolean;
            value: string | null;
          }>;
        };
      }>('/config/environment-variables');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取环境变量状态失败');
      }
    } catch (error) {
      // Failed to get environment status
      return {
        required_variables: [],
        current_status: {}
      };
    }
  }

  /**
   * 测试特定服务连接
   */
  async testServiceConnection(serviceName: string): Promise<{
    service: string;
    status: string;
    message: string;
    details: Record<string, any>;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          service: string;
          status: string;
          message: string;
          details: Record<string, any>;
        };
      }>(`/config/test-connection/${serviceName}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(`测试 ${serviceName} 连接失败`);
      }
    } catch (error) {
      // Service connection test failed
      throw error;
    }
  }

  /**
   * 获取智能检索模式信息
   */
  async getRetrievalModes(): Promise<RetrievalModeInfo> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: RetrievalModeInfo;
      }>('/config/retrieval-modes');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取检索模式信息失败');
      }
    } catch (error) {
      // Failed to get retrieval mode info
      // 返回默认模式信息
      return {
        current_mode: 'general',
        available_modes: ['general'],
        mode_capabilities: {},
        recommendations: [],
        fallback_mode: 'general'
      };
    }
  }

  /**
   * 切换检索模式
   */
  async switchRetrievalMode(mode: string): Promise<{
    current_mode: string;
    config: Record<string, any>;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        data: {
          current_mode: string;
          config: Record<string, any>;
        };
      }>('/config/retrieval-modes/switch', { mode });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '切换检索模式失败');
      }
    } catch (error) {
      // Failed to switch retrieval mode
      throw error;
    }
  }

  /**
   * 获取配置改进建议
   */
  async getConfigRecommendations(): Promise<{
    recommendations: ConfigRecommendation[];
    total_count: number;
    categories: string[];
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          recommendations: ConfigRecommendation[];
          total_count: number;
          categories: string[];
        };
      }>('/config/recommendations');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取配置建议失败');
      }
    } catch (error) {
      // Failed to get config suggestions
      return {
        recommendations: [],
        total_count: 0,
        categories: []
      };
    }
  }

  /**
   * 获取系统状态概览
   */
  async getSystemStatus(): Promise<{
    status: string;
    uptime: string;
    memory_usage: number;
    cpu_usage: number;
    disk_usage: number;
    memory_available_gb: number;
    disk_free_gb: number;
    services: Record<string, string>;
    timestamp: string;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          status: string;
          uptime: string;
          memory_usage: number;
          cpu_usage: number;
          disk_usage: number;
          memory_available_gb: number;
          disk_free_gb: number;
          services: Record<string, string>;
          timestamp: string;
        };
      }>('/system/status');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取系统状态失败');
      }
    } catch (error) {
      // Failed to get system status
      throw error;
    }
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(): Promise<{
    theme: string;
    language: string;
    fontSize: string;
    autoSave: boolean;
    showSources: boolean;
    showConfidence: boolean;
    pageSize: number;
    enableNotifications: boolean;
    defaultSearchMode: string;
    ui_layout: Record<string, any>;
    qa_settings: Record<string, any>;
    knowledge_settings: Record<string, any>;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          theme: string;
          language: string;
          fontSize: string;
          autoSave: boolean;
          showSources: boolean;
          showConfidence: boolean;
          pageSize: number;
          enableNotifications: boolean;
          defaultSearchMode: string;
          ui_layout: Record<string, any>;
          qa_settings: Record<string, any>;
          knowledge_settings: Record<string, any>;
        };
      }>('/user/preferences');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取用户偏好失败');
      }
    } catch (error) {
      // Failed to get user preferences
      // 返回默认偏好设置
      return {
        theme: 'light',
        language: 'zh',
        fontSize: 'medium',
        autoSave: true,
        showSources: true,
        showConfidence: true,
        pageSize: 20,
        enableNotifications: true,
        defaultSearchMode: 'dual',
        ui_layout: {
          sidebar_collapsed: false,
          chat_width: '50%',
          knowledge_view: 'grid',
          show_advanced_options: false
        },
        qa_settings: {
          auto_expand_sources: true,
          show_processing_time: true,
          enable_quick_actions: true,
          default_agent: 'nextagent_qa_team'
        },
        knowledge_settings: {
          auto_vectorize: true,
          show_upload_progress: true,
          default_file_filters: ['pdf', 'docx', 'txt'],
          enable_batch_operations: true
        }
      };
    }
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(preferences: Record<string, any>): Promise<void> {
    try {
      const response = await apiService.put<{
        success: boolean;
      }>('/user/preferences', preferences);
      
      if (!response.success) {
        throw new Error('更新用户偏好失败');
      }
    } catch (error) {
      // Failed to update user preferences
      throw error;
    }
  }

  /**
   * 获取统计概览
   */
  async getStatsOverview(): Promise<{
    documents: {
      total: number;
      vectorized: number;
      vectorization_rate: number;
      processing: number;
      failed: number;
    };
    conversations: {
      total: number;
      today: number;
      average_messages: number;
      active_sessions: number;
    };
    system: {
      uptime: string;
      memory_usage: number;
      cpu_usage: number;
      active_users: number;
      server_load: number;
    };
    services: Record<string, string>;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          documents: {
            total: number;
            vectorized: number;
            vectorization_rate: number;
            processing: number;
            failed: number;
          };
          conversations: {
            total: number;
            today: number;
            average_messages: number;
            active_sessions: number;
          };
          system: {
            uptime: string;
            memory_usage: number;
            cpu_usage: number;
            active_users: number;
            server_load: number;
          };
          services: Record<string, string>;
        };
      }>('/stats/overview');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取统计概览失败');
      }
    } catch (error) {
      // Failed to get statistics overview
      throw error;
    }
  }

  /**
   * 获取数据库状态
   */
  async getDatabaseStatus(): Promise<{
    postgresql: {
      status: string;
      connection_count: number;
      database_size: string;
      last_backup?: string;
    };
    elasticsearch: {
      status: string;
      cluster_health: string;
      indices_count: number;
      total_documents: number;
    };
    arangodb: {
      status: string;
      database_count: number;
      collection_count: number;
      graph_count: number;
    };
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          postgresql: {
            status: string;
            connection_count: number;
            database_size: string;
            last_backup?: string;
          };
          elasticsearch: {
            status: string;
            cluster_health: string;
            indices_count: number;
            total_documents: number;
          };
          arangodb: {
            status: string;
            database_count: number;
            collection_count: number;
            graph_count: number;
          };
        };
      }>('/database/status');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取数据库状态失败');
      }
    } catch (error) {
      // Failed to get database status
      throw error;
    }
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection(dbType: 'postgresql' | 'elasticsearch' | 'arangodb'): Promise<{
    status: string;
    message: string;
    response_time: number;
    details: Record<string, any>;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          status: string;
          message: string;
          response_time: number;
          details: Record<string, any>;
        };
      }>('/database/test-connection', { database_type: dbType });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(`测试 ${dbType} 连接失败`);
      }
    } catch (error) {
      // Database connection test failed
      throw error;
    }
  }

  /**
   * 获取模型配置状态
   */
  async getModelConfig(): Promise<{
    llm_providers: Record<string, {
      status: string;
      models: Array<{
        id: string;
        name: string;
        status: string;
        last_used?: string;
      }>;
    }>;
    embedding_providers: Record<string, {
      status: string;
      models: Array<{
        id: string;
        name: string;
        dimension: number;
        status: string;
      }>;
    }>;
    current_defaults: {
      chat_model: string;
      general_embedding: string;
      domain_embedding: string;
    };
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          llm_providers: Record<string, {
            status: string;
            models: Array<{
              id: string;
              name: string;
              status: string;
              last_used?: string;
            }>;
          }>;
          embedding_providers: Record<string, {
            status: string;
            models: Array<{
              id: string;
              name: string;
              dimension: number;
              status: string;
            }>;
          }>;
          current_defaults: {
            chat_model: string;
            general_embedding: string;
            domain_embedding: string;
          };
        };
      }>('/models/config');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('获取模型配置失败');
      }
    } catch (error) {
      // Failed to get model configuration
      throw error;
    }
  }

  /**
   * 测试模型连接
   */
  async testModelConnection(provider: string, modelId: string): Promise<{
    status: string;
    message: string;
    response_time: number;
    model_info: Record<string, any>;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          status: string;
          message: string;
          response_time: number;
          model_info: Record<string, any>;
        };
      }>('/models/test', {
        provider,
        model_id: modelId
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(`测试模型 ${provider}/${modelId} 连接失败`);
      }
    } catch (error) {
      // Model connection test failed
      throw error;
    }
  }
}

// 导出服务实例
export const systemConfigService = new SystemConfigService();