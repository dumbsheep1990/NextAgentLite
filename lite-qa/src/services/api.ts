/**
 * API服务基础配置 - BFF层
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiError } from '../types';
import { APP_CONFIG, getApiBaseUrl, isDevelopment } from '../config/appConfig';

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: APP_CONFIG.api.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 可以在这里添加认证token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求时间戳
      config.metadata = { startTime: Date.now() };
      
      // API request logging could be added here if needed
      return config;
    },
    (error) => {
      // API request error
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 计算请求时间
      const endTime = Date.now();
      const startTime = response.config.metadata?.startTime || endTime;
      const duration = endTime - startTime;
      
      // API response successful

      return response;
    },
    (error) => {
      const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
      
      // API error occurred

      // 统一错误处理
      const apiError: ApiError = {
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.detail || error.response?.data?.message || error.message || '网络错误',
        details: error.response?.data?.details || {}
      };

      // 根据错误类型进行不同处理
      switch (error.response?.status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          // Insufficient permissions
          break;
        case 404:
          // 资源不存在
          // Resource not found
          break;
        case 500:
          // 服务器错误
          // Internal server error
          break;
        default:
          break;
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// 导出API实例
export const api = createApiInstance();

// 扩展axios配置类型以支持metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// 通用请求方法
export class ApiService {
  private instance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.instance = instance;
  }

  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // 文件上传
  async upload<T>(url: string, data: File | FormData, onProgress?: (progress: number) => void): Promise<T> {
    const formData = data instanceof FormData ? data : (() => {
      const fd = new FormData();
      fd.append('file', data);
      return fd;
    })();

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.instance.post<T>(url, formData, config);
    return response.data;
  }

  // 下载文件
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// 导出API服务实例
export const apiService = new ApiService(api);

// 错误处理工具函数
export const handleApiError = (error: any): ApiError => {
  if (error.code && error.message) {
    return error as ApiError;
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '未知错误',
    details: {}
  };
}; 