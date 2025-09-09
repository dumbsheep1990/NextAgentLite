/**
 * 切分配置服务
 */
import { apiService } from './api';

export interface ChunkingConfig {
  id: string;
  name: string;
  description: string;
  strategy: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
  chunkSize: number;
  maxTokenNum: number;
  chunkOverlap: number;
  tokenizer: 'simple' | 'tiktoken' | 'huggingface';
  separators: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  // 后端兼容性字段
  chunk_token_num?: number;
  max_token_num?: number;
  chunk_overlap?: number;
}

export interface ChunkingConfigResponse {
  configs: ChunkingConfig[];
  total: number;
}

class ChunkingConfigService {
  private baseUrl = '/knowledge/chunking-configs';

  /**
   * 获取所有切分配置
   */
  async getAllConfigs(): Promise<ChunkingConfig[]> {
    try {
      const response = await apiService.get<ChunkingConfigResponse>(`${this.baseUrl}`);
      return response.configs || [];
    } catch (error) {
      console.error('获取切分配置失败:', error);
      // 返回默认配置
      return this.getDefaultConfigs();
    }
  }

  /**
   * 获取默认配置
   */
  async getDefaultConfig(): Promise<ChunkingConfig | null> {
    try {
      const response = await apiService.get<ChunkingConfig>(`${this.baseUrl}/default`);
      return response;
    } catch (error) {
      console.error('获取默认切分配置失败:', error);
      return this.getDefaultConfigs()[0];
    }
  }

  /**
   * 根据ID获取配置
   */
  async getConfigById(id: string): Promise<ChunkingConfig | null> {
    try {
      const response = await apiService.get<ChunkingConfig>(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      console.error(`获取切分配置失败 ${id}:`, error);
      return null;
    }
  }

  /**
   * 创建新配置
   */
  async createConfig(config: Omit<ChunkingConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    message: string;
    config: ChunkingConfig;
  }> {
    try {
      const response = await apiService.post<{
        message: string;
        config: ChunkingConfig;
      }>(this.baseUrl, config);
      return response;
    } catch (error) {
      console.error('创建切分配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(id: string, updates: Partial<ChunkingConfig>): Promise<ChunkingConfig> {
    try {
      const response = await apiService.put<ChunkingConfig>(`${this.baseUrl}/${id}`, updates);
      return response;
    } catch (error) {
      console.error(`更新切分配置失败 ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`删除切分配置失败 ${id}:`, error);
      throw error;
    }
  }

  /**
   * 设置默认配置
   */
  async setDefaultConfig(id: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/set-default`, { config_id: id });
    } catch (error) {
      console.error(`设置默认配置失败 ${id}:`, error);
      throw error;
    }
  }

  /**
   * 预览切分效果
   */
  async previewChunking(text: string, configId: string): Promise<{
    chunks: string[];
    metadata: {
      totalChunks: number;
      avgChunkSize: number;
      overlap: number;
    };
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${configId}/preview`, {
        text
      });
      return response;
    } catch (error) {
      console.error('预览切分失败:', error);
      throw error;
    }
  }

  /**
   * 获取内置默认配置（作为后备）
   */
  private getDefaultConfigs(): ChunkingConfig[] {
    return [
      {
        id: 'default-semantic',
        name: '语义切分',
        description: '基于语义的智能切分，适合大多数文档',
        strategy: 'semantic',
        chunkSize: 400,
        maxTokenNum: 512,
        chunkOverlap: 50,
        tokenizer: 'tiktoken',
        separators: ['。', '！', '？', '\n\n', '\n'],
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fixed-size',
        name: '固定长度切分',
        description: '按固定字符数切分，适合结构化文档',
        strategy: 'fixed',
        chunkSize: 500,
        maxTokenNum: 600,
        chunkOverlap: 50,
        tokenizer: 'simple',
        separators: [],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sentence-based',
        name: '句子切分',
        description: '按句子边界切分，保持语义完整性',
        strategy: 'sentence',
        chunkSize: 300,
        maxTokenNum: 400,
        chunkOverlap: 30,
        tokenizer: 'simple',
        separators: ['。', '！', '？', ';'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const chunkingConfigService = new ChunkingConfigService();