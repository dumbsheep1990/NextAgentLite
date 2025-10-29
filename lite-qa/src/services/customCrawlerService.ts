/**
 * 自定义工具服务
 * 提供各类自定义工具的创建、管理、执行等API调用
 * 当前支持基于URL的网页内容抓取工具
 */

import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ==================== 类型定义 ====================

export interface SelectorConfig {
  result_container: string;
  item_selector: string;
  title_selector: string;
  link_selector: string;
  content_selector?: string;
  date_selector?: string;
}

export interface ParseConfig {
  extract_full_content: boolean;
  follow_links: boolean;
  max_results: number;
  encoding: string;
  timeout: number;
}

export interface ParamsMapping {
  [key: string]: {
    param_name: string;
    param_type: string;
    required: boolean;
    description: string;
    default_value?: string;
  };
}

export interface CrawlerTool {
  id: number;
  name: string;
  description?: string;
  base_url: string;
  url_template: string;
  method: string;
  headers?: Record<string, string>;
  params_mapping: ParamsMapping;
  selector_config: SelectorConfig;
  parse_config: ParseConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolExecution {
  id: number;
  tool_id: number;
  tool_name: string;
  query_keyword: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  results_count: number;
  results?: any[];
  execution_time?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface URLAnalyzeRequest {
  url: string;
  keyword_param?: string;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  base_url: string;
  url_template: string;
  method?: string;
  headers?: Record<string, string>;
  params_mapping: ParamsMapping;
  selector_config: SelectorConfig;
  parse_config?: ParseConfig;
  enabled?: boolean;
}

export interface ExecuteToolRequest {
  keyword: string;
  user_id?: number;
}

// ==================== API 方法 ====================

/**
 * 分析URL并生成工具配置建议
 */
export const analyzeURL = async (request: URLAnalyzeRequest): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/analyze-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'URL分析失败');
    }

    return data.data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 创建新工具
 */
export const createTool = async (request: CreateToolRequest): Promise<CrawlerTool> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '创建工具失败');
    }

    message.success('工具创建成功');
    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 获取工具列表
 */
export const getTools = async (
  enabledOnly: boolean = false,
  skip: number = 0,
  limit: number = 100
): Promise<{ total: number; data: CrawlerTool[] }> => {
  try {
    const params = new URLSearchParams({
      enabled_only: String(enabledOnly),
      skip: String(skip),
      limit: String(limit),
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '获取工具列表失败');
    }

    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 获取工具详情
 */
export const getTool = async (toolId: number): Promise<CrawlerTool> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools/${toolId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '获取工具详情失败');
    }

    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 更新工具
 */
export const updateTool = async (
  toolId: number,
  request: Partial<CreateToolRequest>
): Promise<CrawlerTool> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools/${toolId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '更新工具失败');
    }

    message.success('工具更新成功');
    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 删除工具
 */
export const deleteTool = async (toolId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools/${toolId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '删除工具失败');
    }

    message.success('工具已删除');
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 执行工具
 */
export const executeTool = async (
  toolId: number,
  request: ExecuteToolRequest
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/tools/${toolId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '执行工具失败');
    }

    message.success(`成功获取 ${data.results_count} 条结果`);
    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 获取执行历史
 */
export const getExecutions = async (
  toolId?: number,
  userId?: number,
  status?: string,
  skip: number = 0,
  limit: number = 50
): Promise<{ total: number; data: ToolExecution[] }> => {
  try {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });

    if (toolId !== undefined) params.append('tool_id', String(toolId));
    if (userId !== undefined) params.append('user_id', String(userId));
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/executions?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '获取执行历史失败');
    }

    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 获取执行详情
 */
export const getExecution = async (executionId: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/executions/${executionId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '获取执行详情失败');
    }

    return data.data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};

/**
 * 测试选择器配置
 */
export const testSelector = async (
  url: string,
  selectorConfig: SelectorConfig,
  parseConfig?: ParseConfig
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/custom-tools/test-selector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        selector_config: selectorConfig,
        parse_config: parseConfig,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || '测试选择器失败');
    }

    return data;
  } catch (error: any) {
    message.error(error.message || '网络请求失败');
    throw error;
  }
};
