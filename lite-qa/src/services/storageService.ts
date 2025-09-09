/**
 * 存储服务 API 客户端
 */
import { api } from './api';

export interface StorageConfig {
  type: 'minio' | 'local';
  minio: {
    enabled: boolean;
    endpoint: string;
    accessKey: string;
    secretKey: string;
    documentsBucket: string;
    mediaBucket: string;
    thumbnailsBucket: string;
    publicEndpoint: string;
    autoCreateBuckets: boolean;
  };
}

export interface StorageHealthResponse {
  status: 'healthy' | 'error';
  storage_type: 'minio' | 'local';
  endpoint?: string;
  buckets?: {
    documents: string;
    media: string;
    thumbnails: string;
  };
  upload_directory?: string;
  directory_exists?: boolean;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  object_name: string;
  file_url: string;
  file_size: number;
}

export interface FileInfo {
  object_name: string;
  file_size: number;
  content_type: string;
  last_modified?: string;
  file_url: string;
}

export interface PresignedUrlResponse {
  presigned_url: string;
  expires_in: number;
}

class StorageService {
  /**
   * 检查存储服务健康状态
   */
  async checkHealth(): Promise<StorageHealthResponse> {
    const response = await api.get<StorageHealthResponse>('/storage/health');
    return response.data;
  }

  /**
   * 上传文档文件
   */
  async uploadDocument(
    file: File,
    description?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post<UploadResponse>(
      '/storage/upload/document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(
    file: File,
    description?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post<UploadResponse>(
      '/storage/upload/media',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * 下载文件（本地存储模式）
   */
  async downloadFile(filePath: string): Promise<Blob> {
    const response = await api.get(`/storage/files/${filePath}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * 从指定存储桶下载文件
   */
  async downloadFileFromBucket(
    bucketType: 'documents' | 'media' | 'thumbnails',
    objectName: string,
    inline: boolean = false
  ): Promise<Blob> {
    const response = await api.get(
      `/storage/download/${bucketType}/${objectName}`,
      {
        params: { inline },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * 获取预签名URL（仅MinIO）
   */
  async getPresignedUrl(
    bucketType: 'documents' | 'media' | 'thumbnails',
    objectName: string,
    expiresIn: number = 3600
  ): Promise<PresignedUrlResponse> {
    const response = await api.get<PresignedUrlResponse>(
      `/storage/presigned-url/${bucketType}/${objectName}`,
      {
        params: { expires_in: expiresIn },
      }
    );
    return response.data;
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(
    bucketType: 'documents' | 'media' | 'thumbnails',
    objectName: string
  ): Promise<FileInfo> {
    const response = await api.get<FileInfo>(
      `/storage/info/${bucketType}/${objectName}`
    );
    return response.data;
  }

  /**
   * 删除文件
   */
  async deleteFile(
    bucketType: 'documents' | 'media' | 'thumbnails',
    objectName: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(
      `/storage/files/${bucketType}/${objectName}`
    );
    return response.data;
  }

  /**
   * 获取存储配置
   */
  async getConfig(): Promise<StorageConfig> {
    const response = await api.get<StorageConfig>('/storage/config');
    return response.data;
  }

  /**
   * 更新存储配置
   */
  async updateConfig(config: Partial<StorageConfig>): Promise<StorageConfig> {
    const response = await api.put<StorageConfig>('/storage/config', config);
    return response.data;
  }

  /**
   * 测试存储连接
   */
  async testConnection(config: Partial<StorageConfig>): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    const response = await api.post('/storage/test-connection', config);
    return response.data;
  }

  /**
   * 生成文件访问URL
   */
  generateFileUrl(
    bucketType: 'documents' | 'media' | 'thumbnails',
    objectName: string,
    baseUrl?: string
  ): string {
    const apiBase = baseUrl || api.defaults.baseURL || '';
    return `${apiBase}/storage/download/${bucketType}/${objectName}?inline=true`;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件类型图标
   */
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📄',
      md: '📝',
      html: '🌐',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      webp: '🖼️',
      mp4: '🎬',
      avi: '🎬',
      mov: '🎬',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
    };

    return iconMap[ext] || '📎';
  }

  /**
   * 验证文件类型
   */
  validateFileType(
    file: File,
    allowedTypes: string[],
    category: 'document' | 'media' = 'document'
  ): { valid: boolean; message?: string } {
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';

    // 预定义的文件类型分类
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'md', 'html'];
    const mediaTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'avi', 'mov', 'mp3', 'wav'];

    // 检查扩展名
    if (!allowedTypes.includes(fileExt)) {
      return {
        valid: false,
        message: `不支持的文件类型。支持的类型: ${allowedTypes.join(', ')}`
      };
    }

    // 检查文件分类
    const categoryTypes = category === 'document' ? documentTypes : mediaTypes;
    if (!categoryTypes.includes(fileExt)) {
      return {
        valid: false,
        message: `文件类型与分类不匹配。${category === 'document' ? '文档' : '媒体'}类型支持: ${categoryTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * 获取文件上传进度回调
   */
  createUploadProgressCallback(
    onProgress: (progress: number) => void
  ) {
    return (progressEvent: any) => {
      if (progressEvent.lengthComputable) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    };
  }
}

// 导出单例实例
export const storageService = new StorageService();
export default storageService; 