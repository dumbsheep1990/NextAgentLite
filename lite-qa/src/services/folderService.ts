/**
 * 文件夹管理服务
 * 提供文件夹的增删改查和文档管理功能
 */

import { apiService } from './api';

export interface FolderInfo {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  collection_id: string;
  folder_path: string;
  depth_level: number;
  sort_order: number;
  is_active: boolean;
  folder_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  document_count?: number;
  subfolder_count?: number;
  children?: FolderInfo[];
}

export interface CreateFolderRequest {
  name: string;
  collection_id: string;
  parent_folder_id?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface FolderDocument {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  vectorized?: boolean;
  vectorization_status?: string;
  dual_vectorized?: boolean;
  tags?: string[];
  folder_path: string;
  document_category?: string;
  domain_type?: string;
  metadata?: Record<string, any>;
  processing_progress?: number;
  vector_status?: {
    progress: number;
    chunks: number;
    currentPhase?: string;
    chunksCompleted?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface FolderDocumentsResponse {
  documents: FolderDocument[];
  folder: FolderInfo;
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

export class FolderService {
  
  /**
   * 创建文件夹
   */
  async createFolder(request: CreateFolderRequest): Promise<FolderInfo> {
    try {
      const response = await apiService.post('/folders/', request);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '创建文件夹失败');
      }
    } catch (error: any) {
      console.error('创建文件夹失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '创建文件夹失败');
    }
  }
  
  /**
   * 获取知识库文件夹列表
   */
  async getCollectionFolders(
    collectionId: string,
    parentFolderId?: string,
    recursive: boolean = false,
    includeDocuments: boolean = true
  ): Promise<FolderInfo[]> {
    try {
      const params: Record<string, any> = {
        recursive,
        include_documents: includeDocuments
      };
      
      if (parentFolderId !== undefined) {
        params.parent_folder_id = parentFolderId;
      }
      
      const response = await apiService.get(`/folders/collection/${collectionId}`, {
        params
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '获取文件夹列表失败');
      }
    } catch (error: any) {
      console.error('获取文件夹列表失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '获取文件夹列表失败');
    }
  }
  
  /**
   * 获取文件夹层级结构
   */
  async getFolderHierarchy(collectionId: string): Promise<{
    hierarchy: FolderInfo[];
    total_folders: number;
  }> {
    try {
      const response = await apiService.get(`/folders/collection/${collectionId}/hierarchy`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '获取文件夹层级结构失败');
      }
    } catch (error: any) {
      console.error('获取文件夹层级结构失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '获取文件夹层级结构失败');
    }
  }
  
  /**
   * 更新文件夹
   */
  async updateFolder(
    folderId: string,
    collectionId: string,
    request: UpdateFolderRequest
  ): Promise<FolderInfo> {
    try {
      const response = await apiService.put(`/folders/${folderId}`, request, {
        params: { collection_id: collectionId }
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '更新文件夹失败');
      }
    } catch (error: any) {
      console.error('更新文件夹失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '更新文件夹失败');
    }
  }
  
  /**
   * 重命名文件夹
   */
  async renameFolder(
    folderId: string,
    collectionId: string,
    newName: string
  ): Promise<FolderInfo> {
    return this.updateFolder(folderId, collectionId, { name: newName });
  }
  
  /**
   * 移动文件夹
   */
  async moveFolder(
    folderId: string,
    collectionId: string,
    newParentId?: string
  ): Promise<FolderInfo> {
    try {
      const response = await apiService.put(`/folders/${folderId}/move`, {
        new_parent_id: newParentId
      }, {
        params: { collection_id: collectionId }
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '移动文件夹失败');
      }
    } catch (error: any) {
      console.error('移动文件夹失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '移动文件夹失败');
    }
  }
  
  /**
   * 删除文件夹
   */
  async deleteFolder(
    folderId: string,
    collectionId: string,
    force: boolean = false
  ): Promise<void> {
    try {
      const response = await apiService.delete(`/folders/${folderId}`, {
        params: {
          collection_id: collectionId,
          force
        }
      });
      
      if (!response.success) {
        throw new Error(response.message || '删除文件夹失败');
      }
    } catch (error: any) {
      console.error('删除文件夹失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '删除文件夹失败');
    }
  }
  
  /**
   * 获取文件夹中的文档
   */
  async getFolderDocuments(
    folderId: string,
    collectionId: string,
    options: {
      page?: number;
      size?: number;
      search?: string;
      fileType?: string;
      status?: string;
    } = {}
  ): Promise<FolderDocumentsResponse> {
    try {
      const params = {
        collection_id: collectionId,
        page: options.page || 1,
        size: options.size || 20,
        ...(options.search && { search: options.search }),
        ...(options.fileType && { file_type: options.fileType }),
        ...(options.status && { status: options.status })
      };
      
      const response = await apiService.get(`/folders/${folderId}/documents`, {
        params
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '获取文件夹文档失败');
      }
    } catch (error: any) {
      console.error('获取文件夹文档失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '获取文件夹文档失败');
    }
  }
  
  /**
   * 移动文档到文件夹
   */
  async moveDocumentsToFolder(
    targetFolderId: string,
    collectionId: string,
    documentIds: string[]
  ): Promise<void> {
    try {
      const response = await apiService.put(`/folders/${targetFolderId}/documents/move`, {
        document_ids: documentIds
      }, {
        params: { collection_id: collectionId }
      });
      
      if (!response.success) {
        throw new Error(response.message || '移动文档失败');
      }
    } catch (error: any) {
      console.error('移动文档失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '移动文档失败');
    }
  }
  
  /**
   * 获取元数据过滤选项
   */
  async getMetadataFilters(collectionId: string): Promise<{
    document_categories: string[];
    domain_types: string[];
    file_types: string[];
  }> {
    try {
      const response = await apiService.get('/folders/metadata/filters', {
        params: { collection_id: collectionId }
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '获取过滤选项失败');
      }
    } catch (error: any) {
      console.error('获取过滤选项失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '获取过滤选项失败');
    }
  }
  
  /**
   * 检查文件夹名称是否可用
   */
  validateFolderName(name: string): { valid: boolean; message?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: '文件夹名称不能为空' };
    }
    
    if (name.length > 200) {
      return { valid: false, message: '文件夹名称不能超过200个字符' };
    }
    
    const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    const hasInvalidChar = invalidChars.some(char => name.includes(char));
    
    if (hasInvalidChar) {
      return {
        valid: false,
        message: `文件夹名称不能包含以下字符: ${invalidChars.join(', ')}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * 生成文件夹路径显示文本
   */
  formatFolderPath(folder: FolderInfo, maxLength: number = 50): string {
    if (!folder.folder_path) return folder.name;
    
    const path = folder.folder_path;
    if (path.length <= maxLength) {
      return path;
    }
    
    // 截断路径，保留开头和结尾
    const start = path.substring(0, Math.floor(maxLength / 2) - 2);
    const end = path.substring(path.length - Math.floor(maxLength / 2) + 2);
    return `${start}...${end}`;
  }
  
  /**
   * 获取文件夹图标
   */
  getFolderIcon(folder: FolderInfo): string {
    if (folder.folder_metadata?.system_folder) {
      return '🏠'; // 系统文件夹
    }
    
    if (folder.depth_level === 0) {
      return '📁'; // 根文件夹
    }
    
    return '📂'; // 普通文件夹
  }
  
  /**
   * 检查是否可以添加子文件夹
   */
  canAddSubfolder(folder: FolderInfo): boolean {
    return folder.depth_level < 1; // 最多支持2层（0层根文件夹 + 1层子文件夹）
  }
}

// 创建并导出服务实例
export const folderService = new FolderService();