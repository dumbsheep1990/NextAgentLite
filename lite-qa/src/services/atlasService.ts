/**
 * Embedding Atlas 服务层
 * 与后端Atlas API进行交互
 */

import { api } from './api';

// 类型定义
export interface AtlasStartRequest {
  document_ids?: string[];
  port?: number;
  limit?: number;
  host?: string;
}

export interface AtlasResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface AtlasStatus {
  running: boolean;
  services: Array<{
    port: number;
    pid: number;
    url: string;
  }>;
  count: number;
}

export interface AtlasDataStats {
  total_chunks: number;
  total_documents: number;
  vectorized_chunks: number;
  vectorization_rate: number;
  latest_update: string | null;
}

class AtlasService {
  private readonly baseURL = '/atlas';

  /**
   * 启动Atlas可视化服务
   */
  async startService(options: AtlasStartRequest = {}): Promise<AtlasResponse> {
    try {
      console.log('🚀 启动Atlas服务...', options);
      
      const response = await api.post(`${this.baseURL}/start`, {
        document_ids: options.document_ids,
        port: options.port || 8081,
        limit: options.limit || 10000,
        host: options.host || 'localhost'
      });

      console.log('✅ Atlas服务响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 启动Atlas服务失败:', error);
      throw new Error(error.response?.data?.message || error.message || '启动Atlas服务失败');
    }
  }

  /**
   * 停止Atlas服务
   */
  async stopService(port: number = 8081): Promise<AtlasResponse> {
    try {
      console.log('🛑 停止Atlas服务...', { port });
      
      const response = await api.post(`${this.baseURL}/stop`, null, {
        params: { port }
      });

      console.log('✅ Atlas服务已停止:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 停止Atlas服务失败:', error);
      throw new Error(error.response?.data?.message || error.message || '停止Atlas服务失败');
    }
  }

  /**
   * 获取Atlas服务状态
   */
  async getStatus(): Promise<AtlasResponse & { data: AtlasStatus }> {
    try {
      const response = await api.get(`${this.baseURL}/status`);
      return response.data;
    } catch (error: any) {
      console.error('❌ 获取Atlas状态失败:', error);
      throw new Error(error.response?.data?.message || error.message || '获取Atlas状态失败');
    }
  }

  /**
   * 获取向量数据统计信息
   */
  async getDataStatistics(): Promise<AtlasResponse & { data: AtlasDataStats }> {
    try {
      const response = await api.get(`${this.baseURL}/data-stats`);
      return response.data;
    } catch (error: any) {
      console.error('❌ 获取数据统计失败:', error);
      throw new Error(error.response?.data?.message || error.message || '获取数据统计失败');
    }
  }

  /**
   * 检查Atlas服务是否可访问
   */
  async checkServiceHealth(url: string): Promise<boolean> {
    try {
      // 尝试访问Atlas服务的健康检查端点
      // 这里简单地尝试fetch，实际Atlas可能有专门的健康检查端点
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'no-cors' // 避免CORS问题
      });
      
      // 如果能够发送请求（即使CORS阻止了响应），说明服务可能在运行
      return true;
    } catch (error) {
      console.warn('⚠️ Atlas服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 为嵌入式Atlas准备数据
   */
  async prepareAtlasData(options: AtlasStartRequest): Promise<AtlasResponse> {
    try {
      console.log('🔄 准备Atlas数据...', options);
      
      const response = await api.post(`${this.baseURL}/prepare-data`, {
        document_ids: options.document_ids,
        limit: options.limit || 5000
      });

      console.log('✅ Atlas数据准备完成:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 准备Atlas数据失败:', error);
      throw new Error(error.response?.data?.message || error.message || '准备Atlas数据失败');
    }
  }

  /**
   * 获取Atlas数据文件内容
   */
  async getDataFile(path: string): Promise<any[]> {
    try {
      console.log('📂 获取Atlas数据文件:', path);
      
      const response = await api.get(`${this.baseURL}/data-file`, {
        params: { path }
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      console.log('✅ 数据文件读取完成，记录数:', response.data.data.length);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ 获取数据文件失败:', error);
      throw new Error(error.response?.data?.message || error.message || '获取数据文件失败');
    }
  }

  /**
   * 生成Atlas服务配置
   */
  generateServiceConfig(options: AtlasStartRequest) {
    return {
      port: options.port || 8081,
      host: options.host || 'localhost',
      dataLimit: options.limit || 10000,
      documentScope: options.document_ids ? 'selected' : 'all',
      serviceUrl: `http://${options.host || 'localhost'}:${options.port || 8081}`
    };
  }
}

// 导出单例实例
export const atlasService = new AtlasService();

export default atlasService;