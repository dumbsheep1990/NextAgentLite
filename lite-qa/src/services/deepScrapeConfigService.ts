/**
 * DeepScrape配置管理服务
 * 提供DeepScrape爬虫服务配置的API调用
 */
import { getApiUrl } from '../config/appConfig';

export interface LLMConfig {
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  maxRetries: number;
  extractionType: 'structured' | 'summary' | 'qa';
  promptFormat: 'zero-shot' | 'few-shot';
}

export interface CleaningConfig {
  removeAds: boolean;
  removeTracking: boolean;
  removeScripts: boolean;
  removeHiddenElements: boolean;
  removeSocialButtons: boolean;
  removeComments: boolean;
  removePopups: boolean;
}

export interface ScrapingConfig {
  timeout: number;
  blockAds: boolean;
  blockResources: boolean;
  userAgent: string;
  javascript: boolean;
  fullPage: boolean;
  extractorFormat: 'html' | 'markdown' | 'text';
}

export interface BatchConfig {
  enabled: boolean;
  concurrency: number;
  maxConcurrentJobs: number;
}

export interface DeepScrapeConfig {
  id?: string;
  userId?: number;
  configName: string;
  llm: LLMConfig;
  cleaning: CleaningConfig;
  scraping: ScrapingConfig;
  batch: BatchConfig;
  extendedConfig?: Record<string, any>;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length?: number;
  isDefault?: boolean;
}

class DeepScrapeConfigService {
  /**
   * 获取可用的LLM模型列表
   * 从模型网关服务获取（端口9050）
   */
  async getAvailableModels(): Promise<ModelOption[]> {
    try {
      const url = getApiUrl('/models-gateway/models?type=chat&enabled=1');
      console.log('📡 请求URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('📡 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API错误响应:', error);
        throw new Error(error.detail || '获取可用模型失败');
      }

      const data = await response.json();
      console.log('📦 原始响应数据:', data);

      // 过滤和映射模型数据
      const models = (data || [])
        .filter((m: any) => m && m.model_id && String(m.model_id).toLowerCase() !== 'string')
        .map((m: any) => ({
          id: m.model_id,
          name: m.display_name || m.model_id,
          provider: m.provider_name || m.provider_type || '',
          description: `${m.provider_name || m.provider_type || ''}`,
          context_length: m.context_length || 0,
          isDefault: m.default_chat || false,  // 检查default_chat字段
        }));

      console.log('✅ 处理后的模型列表:', models);
      return models;
    } catch (error) {
      console.error('❌ 获取模型列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取DeepScrape配置
   * @param configName 配置名称，默认为 "default"
   */
  async getConfig(configName: string = 'default'): Promise<DeepScrapeConfig> {
    try {
      const response = await fetch(getApiUrl(`/deepscrape-config/get?config_name=${configName}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '获取配置失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取DeepScrape配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存DeepScrape配置
   * @param config 配置对象
   */
  async saveConfig(config: DeepScrapeConfig): Promise<DeepScrapeConfig> {
    try {
      const response = await fetch(getApiUrl('/deepscrape-config/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '保存配置失败');
      }

      return await response.json();
    } catch (error) {
      console.error('保存DeepScrape配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除DeepScrape配置
   * @param configName 配置名称
   */
  async deleteConfig(configName: string): Promise<void> {
    try {
      const response = await fetch(getApiUrl(`/deepscrape-config/delete?config_name=${configName}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '删除配置失败');
      }
    } catch (error) {
      console.error('删除DeepScrape配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): DeepScrapeConfig {
    return {
      configName: 'default',
      llm: {
        enabled: false,
        provider: 'openai',
        model: '', // 不设置默认值,从9050服务获取
        temperature: 0.2,
        maxTokens: 4000,
        timeout: 120000,
        maxRetries: 3,
        extractionType: 'summary',
        promptFormat: 'zero-shot'
      },
      cleaning: {
        removeAds: true,
        removeTracking: true,
        removeScripts: true,
        removeHiddenElements: true,
        removeSocialButtons: true,
        removeComments: true,
        removePopups: true
      },
      scraping: {
        timeout: 30000,
        blockAds: true,
        blockResources: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        javascript: true,
        fullPage: false,
        extractorFormat: 'markdown'
      },
      batch: {
        enabled: true,
        concurrency: 3,
        maxConcurrentJobs: 5
      },
      isDefault: true
    };
  }
}

export const deepScrapeConfigService = new DeepScrapeConfigService();
