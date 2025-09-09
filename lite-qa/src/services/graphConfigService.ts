/**
 * 知识图谱配置服务
 */

export interface GraphConfig {
  model: {
    extractionModel: string;
    temperature: number;
    maxTokens: number;
  };
  extraction: {
    chunkSize: number;
    chunkOverlap: number;
    minEntityConfidence: number;
    minRelationConfidence: number;
    enableContinueExtraction: boolean;
    maxRetries: number;
  };
  entityTypes: {
    [category: string]: string[];
  };
  relationshipTypes: string[];
  prompts: {
    [key: string]: string;
  };
  availableModels?: string[];
}

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

class GraphConfigService {
  private baseUrl = '/api/v1/graph';

  /**
   * 获取知识图谱配置
   */
  async getConfig(): Promise<GraphConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/extraction-config`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取知识图谱配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新知识图谱配置
   */
  async updateConfig(config: Partial<GraphConfig>): Promise<GraphConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/extraction-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('更新知识图谱配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取提示词模板
   */
  async getPromptTemplates(): Promise<{[key: string]: PromptTemplate}> {
    try {
      const response = await fetch(`${this.baseUrl}/prompts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取提示词模板失败:', error);
      throw error;
    }
  }

  /**
   * 验证提示词模板
   */
  async validatePrompt(template: string, variables: string[]): Promise<{
    isValid: boolean;
    missingVariables: string[];
    variableCount: number;
    templateLength: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/prompts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template,
          variables,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('验证提示词失败:', error);
      throw error;
    }
  }

  /**
   * 获取提取统计信息
   */
  async getExtractionStats(): Promise<{
    totalDocuments: number;
    totalEntities: number;
    totalRelationships: number;
    extractionSuccess: number;
    extractionFailed: number;
    avgEntitiesPerDocument: number;
    avgRelationshipsPerDocument: number;
    modelUsage: {[model: string]: number};
    entityTypeDistribution: {[type: string]: number};
    relationshipTypeDistribution: {[type: string]: number};
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/extraction-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取提取统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('/api/v1/config/models/current');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // 从响应中提取模型列表
      if (result.success && result.data?.llm?.configured_models) {
        return result.data.llm.configured_models;
      } else if (result.success && result.data?.llm?.by_vendor) {
        // 如果有按供应商分组的模型，展平成列表
        const allModels: string[] = [];
        for (const vendor in result.data.llm.by_vendor) {
          allModels.push(...result.data.llm.by_vendor[vendor]);
        }
        return allModels;
      }
      
      // 如果上面都没有，返回默认模型列表
      return [];
    } catch (error) {
      console.error('获取可用模型失败:', error);
      throw error;
    }
  }
}

// 创建单例
export const graphConfigService = new GraphConfigService();