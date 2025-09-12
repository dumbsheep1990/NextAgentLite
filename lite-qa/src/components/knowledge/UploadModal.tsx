/**
 * 文档上传Modal组件
 */
import React, { useState } from 'react';
import { 
  Modal, 
  Upload, 
  Button, 
  Progress, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Input,
  Select,
  message,
  Divider,
  InputNumber,
  Switch,
  Collapse,
  Tooltip,
  Tabs,
  Form,
  Alert,
  Spin
} from 'antd';
import { 
  InboxOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  LinkOutlined,
  GlobalOutlined,
  LoadingOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useGlobalResourceStore } from '../../stores/globalResourceStore';
import { knowledgeService } from '../../services/knowledgeService';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

interface UploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files?: FileList, urls?: string[], metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
    folderId?: string;
    vectorConfig?: {
      useDefault: boolean;
      chunkSize?: number;
      chunkOverlap?: number;
      chunkingStrategy?: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
    };
    chunkingConfigId?: string;
    customChunkSize?: number;
    customChunkOverlap?: number;
    collectionChunkingConfig?: any;
  }>) => Promise<void>;
  loading?: boolean;
  collectionId?: string; // 添加知识库ID
  selectedFolder?: {
    id: string;
    name: string;
    folder_path?: string;
  } | null; // 添加选中的文件夹
}

// 扩展UploadFile接口
interface FileWithMetadata extends UploadFile {
  tags?: string[];
  description?: string;
  vectorConfig?: {
    useDefault: boolean;
    chunkSize?: number;
    chunkOverlap?: number;
    chunkingStrategy?: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
  };
  customChunkSize?: number;
  customChunkOverlap?: number;
}

// 切分配置接口
interface ChunkingConfig {
  id: string;
  name: string;
  description?: string;
  strategy: string;
  chunk_token_num: number;
  max_token_num: number;
  is_default: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onCancel,
  onUpload,
  loading = false,
  collectionId,
  selectedFolder
}) => {
  // 文档类型选择状态
  const [documentType, setDocumentType] = useState<'file' | 'url'>('file');
  
  // 文件上传相关状态
  const [fileList, setFileList] = useState<FileWithMetadata[]>([]);
  
  // URL相关状态
  const [urlList, setUrlList] = useState<string[]>(['']);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [urlValidation, setUrlValidation] = useState<{[key: number]: boolean}>({});
  const [crawlingUrls, setCrawlingUrls] = useState(false);
  
  // 通用状态
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'processing'>('upload');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [useCustomParams, setUseCustomParams] = useState(false);
  const [customChunkSize, setCustomChunkSize] = useState<number>(512);
  const [customChunkOverlap, setCustomChunkOverlap] = useState<number>(50);
  const [currentConfigIndex, setCurrentConfigIndex] = useState<number>(0);
  
  // 重复文件检查相关状态
  const [duplicateFiles, setDuplicateFiles] = useState<Set<string>>(new Set());
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  
  // 知识库特定的切分配置
  const [collectionChunkingConfig, setCollectionChunkingConfig] = useState<any>(null);
  const [loadingCollectionConfig, setLoadingCollectionConfig] = useState(false);
  
  // 使用全局store中的切分配置
  const { 
    chunkingConfigs, 
    defaultChunkingConfig,
    isResourceLoaded
  } = useGlobalResourceStore();
  
  const chunkingConfigsLoading = !isResourceLoaded('切分配置');

  // 获取知识库的切分配置
  React.useEffect(() => {
    const fetchCollectionChunkingConfig = async () => {
      if (collectionId && visible) {
        setLoadingCollectionConfig(true);
        try {
          const response = await fetch(`http://localhost:8000/api/v1/collections/${collectionId}/chunking-config`);
          if (response.ok) {
            const apiResponse = await response.json();
            console.log('🔍 知识库切分配置API响应:', apiResponse);
            
            if (apiResponse.success && apiResponse.data) {
              const data = apiResponse.data;
              setCollectionChunkingConfig(data);
              
              // 如果知识库有切分配置，设置为当前选中的配置
              if (data?.chunking_config?.id) {
                setSelectedConfigId(data.chunking_config.id);
                setUseCustomParams(false); // 使用预设配置而非自定义参数
                
                // 记录配置信息用于调试
                console.log('✅ 知识库切分配置加载成功:', {
                  configId: data.chunking_config.id,
                  configName: data.chunking_config.name,
                  configType: data.custom_chunking_config?.inherit_from_global !== false ? '系统配置' : '自定义配置'
                });
              }
            } else {
              console.warn('API响应格式异常:', apiResponse);
            }
          }
        } catch (error) {
          console.error('获取知识库切分配置失败:', error);
        } finally {
          setLoadingCollectionConfig(false);
        }
      }
    };
    
    fetchCollectionChunkingConfig();
  }, [collectionId, visible]);

  // 获取策略显示名称的工具函数
  const getStrategyDisplayName = (strategy: string) => {
    switch (strategy) {
      case 'semantic': return '语义切分';
      case 'fixed': return '固定切分';
      case 'naive': return '朴素切分';
      case 'sentence': return '句子切分';
      case 'paragraph': return '段落切分';
      default: return strategy.charAt(0).toUpperCase() + strategy.slice(1);
    }
  };

  // 支持的文件类型
  const acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  
  // URL验证函数
  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  // 初始化默认配置选择
  const initializeDefaultConfig = () => {
    // 优先使用知识库的配置，其次使用全局默认配置
    if (collectionChunkingConfig?.chunking_config?.id) {
      setSelectedConfigId(collectionChunkingConfig.chunking_config.id);
    } else if (defaultChunkingConfig && !selectedConfigId) {
      setSelectedConfigId(defaultChunkingConfig.id);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 检查重复文件
  const checkDuplicateFiles = async (files: FileWithMetadata[]) => {
    try {
      setCheckingDuplicates(true);
      const filenames = files.map(file => file.name).filter(Boolean) as string[];
      
      if (filenames.length === 0) {
        setDuplicateFiles(new Set());
        return;
      }
      
      // 1. 先检查用户选择的文件列表内部是否有重复文件名
      const filenameCount = new Map<string, number>();
      const internalDuplicates = new Set<string>();
      
      filenames.forEach(filename => {
        const count = filenameCount.get(filename) || 0;
        filenameCount.set(filename, count + 1);
        if (count > 0) {
          internalDuplicates.add(filename);
        }
      });
      
      // 2. 再检查与数据库中已有文件的重复
      const result = await knowledgeService.checkDuplicateFilenames(filenames);
      
      // 3. 合并两种重复检查的结果
      const allDuplicates = new Set<string>();
      
      // 添加内部重复文件
      internalDuplicates.forEach(filename => allDuplicates.add(filename));
      
      // 添加与数据库重复的文件
      if (result.hasDuplicates) {
        result.duplicateFiles.forEach(f => allDuplicates.add(f.filename));
      }
      
      setDuplicateFiles(allDuplicates);
      
      // 显示重复文件提示
      if (allDuplicates.size > 0) {
        let warningMessage = '';
        if (internalDuplicates.size > 0 && result.hasDuplicates) {
          warningMessage = `发现 ${internalDuplicates.size} 个选择文件内部重复，${result.duplicateFiles.length} 个与已有文档重复，请删除后重新上传`;
        } else if (internalDuplicates.size > 0) {
          warningMessage = `发现 ${internalDuplicates.size} 个选择文件内部重复，请删除重复文件`;
        } else if (result.hasDuplicates) {
          warningMessage = `发现 ${result.duplicateFiles.length} 个与已有文档重复，请删除后重新上传`;
        }
        message.warning(warningMessage);
      }
    } catch (error) {
      console.error('检查重复文件失败:', error);
      setDuplicateFiles(new Set());
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // 处理文件选择
  const handleFileChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    
    // 过滤文件大小和类型，并初始化默认配置
    newFileList = newFileList.filter((file) => {
      const isValidType = acceptedTypes.some(type => 
        file.name?.toLowerCase().endsWith(type.slice(1))
      );
      const isValidSize = file.size ? file.size <= maxFileSize : true;
      
      if (!isValidType) {
        message.error(`${file.name} 不是支持的文件类型`);
        return false;
      }
      
      if (!isValidSize) {
        message.error(`${file.name} 文件大小超过50MB限制`);
        return false;
      }
      
      return true;
    }).map(file => ({
      ...file,
      // 为每个文件初始化默认配置
      tags: (file as FileWithMetadata).tags || [],
      description: (file as FileWithMetadata).description || '',
      vectorConfig: (file as FileWithMetadata).vectorConfig || {
        useDefault: true,
        chunkSize: undefined,
        chunkOverlap: undefined,
        chunkingStrategy: undefined
      },
      customChunkSize: (file as FileWithMetadata).customChunkSize || 512,
      customChunkOverlap: (file as FileWithMetadata).customChunkOverlap || 50
    } as FileWithMetadata));
    
    setFileList(newFileList);
    // 重置配置索引
    if (newFileList.length === 0) {
      setCurrentConfigIndex(0);
    } else if (currentConfigIndex >= newFileList.length) {
      setCurrentConfigIndex(newFileList.length - 1);
    }
    
    // 检查重复文件
    if (newFileList.length > 0) {
      checkDuplicateFiles(newFileList);
    }
  };

  // 删除文件
  const handleRemoveFile = (file: FileWithMetadata) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    setFileList(newFileList);
    
    // 重新检查重复文件
    if (newFileList.length > 0) {
      checkDuplicateFiles(newFileList);
    } else {
      setDuplicateFiles(new Set());
    }
    
    // 如果删除的是当前正在配置的文件，需要调整索引
    if (currentConfigIndex >= newFileList.length && newFileList.length > 0) {
      setCurrentConfigIndex(newFileList.length - 1);
    } else if (newFileList.length === 0) {
      setCurrentConfigIndex(0);
    }
  };

  // 清空所有文件
  const handleClearAllFiles = () => {
    Modal.confirm({
      title: '确认清空所有文件？',
      content: `您即将删除所有已选择的 ${fileList.length} 个文件，此操作不可撤销。`,
      okText: '确认清空',
      cancelText: '取消',
      okType: 'danger',
      onOk() {
        setFileList([]);
        setCurrentConfigIndex(0);
        // 重置切分配置相关状态
        setSelectedConfigId('');
        setUseCustomParams(false);
        setCustomChunkSize(512);
        setCustomChunkOverlap(50);
        message.success('已清空所有文件');
      }
    });
  };

  // 更新文件元数据
  const updateFileMetadata = (file: FileWithMetadata, metadata: Partial<FileWithMetadata>) => {
    setFileList(prev => prev.map(item => 
      item.uid === file.uid ? { ...item, ...metadata } : item
    ));
  };

  // 更新当前文件的元数据
  const updateCurrentFileMetadata = (metadata: Partial<FileWithMetadata>) => {
    if (fileList[currentConfigIndex]) {
      updateFileMetadata(fileList[currentConfigIndex], metadata);
    }
  };

  // 更新全局自定义参数到所有文件
  const updateGlobalCustomParams = () => {
    if (useCustomParams) {
      setFileList(prev => prev.map(file => ({
        ...file,
        customChunkSize: customChunkSize,
        customChunkOverlap: customChunkOverlap
      })));
    }
  };


  // URL相关处理函数
  const handleAddUrl = () => {
    setUrlList([...urlList, '']);
  };
  
  const handleRemoveUrl = (index: number) => {
    if (urlList.length > 1) {
      const newUrlList = urlList.filter((_, i) => i !== index);
      setUrlList(newUrlList);
      // 清除该索引的验证状态
      const newValidation = { ...urlValidation };
      delete newValidation[index];
      setUrlValidation(newValidation);
    }
  };
  
  const handleUrlChange = (index: number, value: string) => {
    const newUrlList = [...urlList];
    newUrlList[index] = value;
    setUrlList(newUrlList);
    
    // 更新验证状态
    const newValidation = { ...urlValidation };
    if (value.trim()) {
      newValidation[index] = validateUrl(value.trim());
    } else {
      delete newValidation[index];
    }
    setUrlValidation(newValidation);
  };
  
  const getValidUrls = () => {
    return urlList.filter((url, index) => 
      url.trim() && urlValidation[index] !== false
    ).map(url => url.trim());
  };

  // 处理上传
  const handleUpload = async () => {
    // 根据文档类型进行不同的验证
    if (documentType === 'file') {
      if (fileList.length === 0) {
        message.warning('请先选择要上传的文件');
        return;
      }
      
      // 检查是否有重复文件
      if (duplicateFiles.size > 0) {
        message.error('请先删除重复的文件后再上传');
        return;
      }
    } else {
      const validUrls = getValidUrls();
      if (validUrls.length === 0) {
        message.warning('请输入至少一个有效的URL地址');
        return;
      }
      
      // 验证所有URL格式
      const hasInvalidUrls = urlList.some((url, index) => 
        url.trim() && urlValidation[index] === false
      );
      if (hasInvalidUrls) {
        message.error('请修正无效的URL地址');
        return;
      }
    }

    setCurrentStep('processing');
    setUploading(true);

    try {
      let files: FileList | undefined;
      let urls: string[] | undefined;
      
      if (documentType === 'file') {
        // 文件上传模式
        const fileData = new DataTransfer();
        fileList.forEach(file => {
          if (file.originFileObj) {
            fileData.items.add(file.originFileObj);
          }
        });
        files = fileData.files;
        
        // 构建文件元数据
        const metadata = fileList.map((file, index) => {
          const configId = collectionChunkingConfig?.chunking_config?.id || selectedConfigId;
          const meta = {
            fileIndex: index,
            tags: file.tags,
            description: file.description,
            folderId: selectedFolder?.id, // 添加文件夹ID
            vectorConfig: file.vectorConfig || { useDefault: false },
            chunkingConfigId: configId,
            customChunkSize: undefined,
            customChunkOverlap: undefined,
            // 直接传递知识库的切分配置信息，避免异步加载问题
            collectionChunkingConfig: collectionChunkingConfig
          };
          
          console.log('📋 构建文件元数据:', {
            fileName: file.name,
            useCustomParams: false,
            customChunkSize: meta.customChunkSize,
            customChunkOverlap: meta.customChunkOverlap,
            selectedConfigId,
            chunkingConfigId: meta.chunkingConfigId,
            hasCollectionConfig: !!collectionChunkingConfig
          });
          
          return meta;
        });
        
        await onUpload(files, undefined, metadata);
      } else {
        // URL爬取模式
        urls = getValidUrls();
        setCrawlingUrls(true);
        
        // 构建URL元数据（暂时使用通用配置）
        const configId = collectionChunkingConfig?.chunking_config?.id || selectedConfigId;
        const metadata = urls.map((url, index) => ({
          fileIndex: index,
          tags: [],
          description: `来源URL: ${url}`,
          folderId: selectedFolder?.id, // 添加文件夹ID
          vectorConfig: { useDefault: true },
          chunkingConfigId: configId,
          customChunkSize: undefined,
          customChunkOverlap: undefined,
          collectionChunkingConfig: collectionChunkingConfig
        }));
        
        console.log('📋 构建URL元数据:', {
          urls,
          metadata,
          useCustomParams: false,
          selectedConfigId
        });
        
        await onUpload(undefined, urls, metadata);
      }
      
      message.success(documentType === 'file' ? '文档上传成功' : 'URL爬取处理成功');
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      
      // 提取具体的错误信息
      let errorMessage = documentType === 'file' ? '文档上传失败' : 'URL处理失败';
      
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = error.message as string;
        } else if ('detail' in error && error.detail) {
          errorMessage = error.detail as string;
        } else if ('response' in error && error.response) {
          const response = error.response as any;
          if (response.data && response.data.detail) {
            errorMessage = response.data.detail;
          } else if (response.data && response.data.message) {
            errorMessage = response.data.message;
          } else if (response.statusText) {
            errorMessage = `处理失败: ${response.statusText}`;
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('📋 显示错误信息:', errorMessage);
      message.error(errorMessage);
      setCurrentStep('metadata');
    } finally {
      setUploading(false);
      setCrawlingUrls(false);
    }
  };

  // 关闭Modal
  const handleClose = () => {
    // 重置文档类型
    setDocumentType('file');
    
    // 重置文件相关状态
    setFileList([]);
    setDuplicateFiles(new Set());
    setCheckingDuplicates(false);
    
    // 重置URL相关状态
    setUrlList(['']);
    setCurrentUrl('');
    setUrlValidation({});
    setCrawlingUrls(false);
    
    // 重置通用状态
    setCurrentStep('upload');
    setUploading(false);
    setSelectedConfigId('');
    setUseCustomParams(false);
    setCustomChunkSize(512);
    setCustomChunkOverlap(50);
    setCurrentConfigIndex(0);
    
    onCancel();
  };

  // Modal打开时初始化默认配置
  React.useEffect(() => {
    if (visible) {
      initializeDefaultConfig();
    }
  }, [visible, defaultChunkingConfig, collectionChunkingConfig]);

  // 下一步
  const handleNext = () => {
    if (documentType === 'file') {
      if (fileList.length === 0) {
        message.warning('请先选择要上传的文件');
        return;
      }
    } else {
      const validUrls = getValidUrls();
      if (validUrls.length === 0) {
        message.warning('请输入至少一个有效的URL地址');
        return;
      }
    }
    
    setCurrentStep('metadata');
    setCurrentConfigIndex(0);
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep('upload');
  };

  // 切换到上一个文档配置
  const handlePrevConfig = () => {
    if (currentConfigIndex > 0) {
      setCurrentConfigIndex(currentConfigIndex - 1);
    }
  };

  // 切换到下一个文档配置
  const handleNextConfig = () => {
    if (currentConfigIndex < fileList.length - 1) {
      setCurrentConfigIndex(currentConfigIndex + 1);
    }
  };

  // 渲染文件列表（带滚动）
  const renderFileList = () => {
    const totalSize = fileList.reduce((acc, file) => acc + (file.size || 0), 0);
    
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 文件统计信息 */}
        <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
          <span>总大小: {formatFileSize(totalSize)}</span>
          <span>最大: 50MB/文件</span>
        </div>
        
        {/* 文件列表 */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }} className="space-y-2">
          {fileList.map((file, index) => (
            <div 
              key={file.uid} 
              className="flex items-center p-2 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              {/* 文件图标 */}
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded mr-2 flex-shrink-0">
                <FileTextOutlined className="text-blue-600" style={{ fontSize: 14 }} />
              </div>
              
              {/* 文件信息 */}
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Text 
                    strong 
                    className="truncate text-sm" 
                    style={{ maxWidth: '180px' }}
                    title={file.name}
                  >
                    {file.name}
                  </Text>
                  <Tag color="blue" className="text-xs">
                    {file.name?.split('.').pop()?.toUpperCase()}
                  </Tag>
                  {/* 重复文件标识 */}
                  {duplicateFiles.has(file.name || '') && (
                    <Tag color="red" className="text-xs">
                      重复
                    </Tag>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size || 0)}
                  {duplicateFiles.has(file.name || '') && (
                    <span className="text-red-500 ml-2">• 此文档已存在，请删除</span>
                  )}
                </div>
              </div>
              
              {/* 删除按钮 */}
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                onClick={() => handleRemoveFile(file)}
                danger
                size="small"
                className="flex-shrink-0"
                title="删除文件"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染单个文档的配置界面
  const renderSingleFileConfig = () => {
    if (!fileList[currentConfigIndex]) return null;
    
    const currentFile = fileList[currentConfigIndex];
    
    return (
      <div className="space-y-4">
        {/* 文档信息标题 */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <FileTextOutlined className="text-blue-500 mr-2" />
            <Text strong>{currentFile.name}</Text>
            <Tag color="blue" className="ml-2">
              {currentFile.name?.split('.').pop()?.toUpperCase()}
            </Tag>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              type="text" 
              icon={<LeftOutlined />} 
              onClick={handlePrevConfig}
              disabled={currentConfigIndex === 0}
            />
            <Text className="text-sm text-gray-600">
              {currentConfigIndex + 1} / {fileList.length}
            </Text>
            <Button 
              type="text" 
              icon={<RightOutlined />} 
              onClick={handleNextConfig}
              disabled={currentConfigIndex === fileList.length - 1}
            />
          </div>
        </div>

        {/* 基本信息 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签 (可选)
            </label>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="添加标签，按回车确认"
              value={currentFile.tags || []}
              onChange={(tags) => updateCurrentFileMetadata({ tags })}
            >
              <Option value="力学性能">力学性能</Option>
              <Option value="微观结构">微观结构</Option>
              <Option value="耐久性">耐久性</Option>
              <Option value="碱激发剂">碱激发剂</Option>
              <Option value="配方优化">配方优化</Option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述 (可选)
            </label>
            <TextArea
              rows={3}
              placeholder="添加文档描述或备注..."
              value={currentFile.description || ''}
              onChange={(e) => updateCurrentFileMetadata({ description: e.target.value })}
            />
          </div>
        </div>

        <Divider />

        {/* 当前知识库切分配置 */}
        <div>
          <div className="flex items-center mb-3">
            <SettingOutlined className="mr-2" />
            <Text strong>切分配置</Text>
            <Text type="secondary" className="ml-2 text-sm">
              (使用知识库当前启用的配置)
            </Text>
          </div>

          {/* 显示知识库当前启用的切分配置 */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            {loadingCollectionConfig ? (
              <div className="flex items-center justify-center py-8">
                <LoadingOutlined className="text-blue-500 mr-3" />
                <Text type="secondary" className="text-gray-600">正在加载配置...</Text>
              </div>
            ) : collectionChunkingConfig?.chunking_config ? (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <SettingOutlined className="text-blue-600 mr-3 text-lg" />
                    <Text strong className="text-gray-800 text-lg">当前切分配置</Text>
                  </div>
                  <Tag color={collectionChunkingConfig.custom_chunking_config?.inherit_from_global !== false ? 'blue' : 'green'} className="px-3 py-1 rounded-full border-0 font-medium">
                    {collectionChunkingConfig.custom_chunking_config?.inherit_from_global !== false ? '系统配置' : '自定义配置'}
                  </Tag>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg border border-blue-100">
                    <Text className="text-gray-700 font-semibold">配置名称</Text>
                    <Text className="text-blue-900 font-bold">{collectionChunkingConfig.chunking_config.name}</Text>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                      <Text className="text-gray-600 text-sm font-medium mb-1">切分策略</Text>
                      <Text className="text-gray-900 font-semibold">{getStrategyDisplayName(collectionChunkingConfig.chunking_config.strategy)}</Text>
                    </div>
                    
                    <div className="flex flex-col py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                      <Text className="text-gray-600 text-sm font-medium mb-1">重叠大小</Text>
                      <Text className="text-gray-900 font-semibold font-mono">{collectionChunkingConfig.chunking_config.chunk_overlap} Token</Text>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                      <Text className="text-gray-600 text-sm font-medium mb-1">最小Token数</Text>
                      <Text className="text-gray-900 font-semibold font-mono">{collectionChunkingConfig.chunking_config.chunk_token_num}</Text>
                    </div>
                    
                    <div className="flex flex-col py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                      <Text className="text-gray-600 text-sm font-medium mb-1">最大Token数</Text>
                      <Text className="text-gray-900 font-semibold font-mono">{collectionChunkingConfig.chunking_config.max_token_num}</Text>
                    </div>
                  </div>
                  
                  <div className="flex flex-col py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                    <Text className="text-gray-600 text-sm font-medium mb-1">分隔符</Text>
                    <Text className="text-gray-900 font-mono text-sm bg-white px-2 py-1 rounded border inline-block">{collectionChunkingConfig.chunking_config.delimiter}</Text>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-100 bg-blue-50 rounded-lg p-4">
                  <Text className="text-blue-800 text-sm font-medium">
                    配置管理提示
                  </Text>
                  <Text type="secondary" className="text-blue-600 text-xs mt-1 block">
                    如需修改切分配置，请前往 <Text strong className="text-blue-700">知识库管理 → 切分策略</Text> 进行设置
                  </Text>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationCircleOutlined className="text-orange-500 text-xl mb-3" />
                <div>
                  <Text type="warning" className="font-medium">未获取到知识库切分配置</Text>
                  <br />
                  <Text type="secondary" className="text-sm">将使用系统默认配置</Text>
                </div>
              </div>
            )}
          </div>

          {false && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-md">
              <div className="flex items-center mb-3">
                <SettingOutlined className="text-blue-600 mr-2" />
                <Text strong className="text-blue-800">自定义切分参数</Text>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    切分大小 (Token数)
                  </label>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={customChunkSize}
                    onChange={(value) => setCustomChunkSize(value || 512)}
                    min={128}
                    max={2048}
                    step={64}
                    placeholder="512"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    建议范围: 128-2048
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重叠大小 (Token数)
                  </label>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={customChunkOverlap}
                    onChange={(value) => setCustomChunkOverlap(value || 50)}
                    min={0}
                    max={Math.floor(customChunkSize * 0.3)}
                    step={10}
                    placeholder="50"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    建议不超过切分大小的30%
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="text-sm text-blue-700">
                  <div className="font-medium mb-1">参数说明:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>切分大小</strong>: 每个文本块的最大Token数量</li>
                    <li>• <strong>重叠大小</strong>: 相邻文本块之间的重叠Token数量</li>
                    <li>• 适当的重叠可以保持上下文连贯性，提高检索效果</li>
                    <li>• 这些参数将应用到本次上传的所有文件</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // 渲染元数据编辑（使用切换逻辑）
  const renderMetadataEdit = () => (
    <div style={{ height: '500px', overflowY: 'auto' }}>
      {fileList.length > 0 ? renderSingleFileConfig() : (
        <div className="text-center py-8 text-gray-500">
          <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <div className="mt-4">暂无文件需要配置</div>
        </div>
      )}
    </div>
  );

  // 渲染处理进度
  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="mb-4">
        {documentType === 'file' ? (
          <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        ) : (
          <GlobalOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        )}
      </div>
      <div className="mb-4">
        <Text className="text-lg">
          {documentType === 'file' ? '正在上传文档...' : '正在爬取URL内容...'}
        </Text>
      </div>
      <Progress percent={uploading ? 60 : 100} status={uploading ? 'active' : 'success'} />
      <div className="mt-4 text-sm text-gray-500">
        {uploading ? 
          (documentType === 'file' ? '请稍候，正在处理您的文档' : '请稍候，正在爬取和处理网页内容') : 
          '处理完成'
        }
      </div>
      
      {documentType === 'url' && uploading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="text-xs text-blue-700">
            <div className="space-y-1">
              <div>• 正在访问目标网页</div>
              <div>• 提取和清理网页内容</div>
              <div>• 转换为Markdown格式</div>
              <div>• 执行文本分块和向量化</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染URL输入界面
  const renderUrlUploadSection = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="mb-4">
        <Alert
          message="URL爬取说明"
          description="支持HTTP/HTTPS网页链接，系统将自动提取内容并转换为Markdown格式进行处理。请确保URL可访问且包含有效内容。"
          type="info"
          showIcon
          icon={<GlobalOutlined />}
        />
      </div>
      
      <div className="space-y-4" style={{ flex: 1, overflowY: 'auto' }}>
        {urlList.map((url, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                placeholder={`输入URL地址 ${index + 1}`}
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                prefix={<LinkOutlined />}
                status={url.trim() && urlValidation[index] === false ? 'error' : undefined}
              />
              {url.trim() && urlValidation[index] === false && (
                <div className="text-red-500 text-xs mt-1">
                  请输入有效的HTTP或HTTPS链接
                </div>
              )}
            </div>
            
            {urlList.length > 1 && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleRemoveUrl(index)}
                title="删除此URL"
              />
            )}
          </div>
        ))}
        
        <Button
          type="dashed"
          onClick={handleAddUrl}
          icon={<PlusOutlined />}
          className="w-full"
        >
          添加更多URL
        </Button>
        
        {/* URL统计信息 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>有效URL: {getValidUrls().length} 个</span>
            <span>总计: {urlList.filter(url => url.trim()).length} 个</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title="上传文档"
      open={visible}
      onCancel={handleClose}
      width={800}
      style={{ top: 20 }}
      styles={{
        body: {
          height: '70vh', 
          maxHeight: '600px',
          overflow: 'hidden',
          padding: '24px'
        }
      }}
      footer={
        currentStep === 'upload' ? [
          <Button key="cancel" onClick={handleClose}>
            取消
          </Button>,
          <Button 
            key="next" 
            type="primary" 
            onClick={handleNext}
            disabled={
              (documentType === 'file' && (fileList.length === 0 || duplicateFiles.size > 0)) ||
              (documentType === 'url' && getValidUrls().length === 0)
            }
            loading={checkingDuplicates || crawlingUrls}
          >
            {checkingDuplicates ? '检查重复文件...' : 
             crawlingUrls ? '验证URL...' : '下一步'}
          </Button>
        ] : currentStep === 'metadata' ? [
          <Button key="prev" onClick={handlePrev}>
            上一步
          </Button>,
          <Button key="cancel" onClick={handleClose}>
            取消
          </Button>,
          <Button 
            key="upload" 
            type="primary" 
            onClick={handleUpload}
            loading={uploading}
          >
            {documentType === 'file' ? '开始上传' : '开始爬取处理'}
          </Button>
        ] : null
      }
    >
      {currentStep === 'upload' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 文档类型选择Tabs */}
          <div className="mb-4">
            <Tabs
              activeKey={documentType}
              onChange={(key) => setDocumentType(key as 'file' | 'url')}
              items={[
                {
                  key: 'file',
                  label: (
                    <span>
                      <InboxOutlined className="mr-2" />
                      文件上传
                    </span>
                  ),
                  children: null,
                },
                {
                  key: 'url',
                  label: (
                    <span>
                      <LinkOutlined className="mr-2" />
                      URL爬取
                    </span>
                  ),
                  children: null,
                }
              ]}
            />
          </div>
          
          {/* 文件夹信息显示 */}
          {selectedFolder && (
            <div className="mb-4">
              <Alert
                message={
                  <div className="flex items-center space-x-2">
                    <FolderOutlined />
                    <span>上传目标文件夹: <strong>{selectedFolder.name}</strong></span>
                    {selectedFolder.folder_path && (
                      <Text type="secondary" className="text-sm">
                        ({selectedFolder.folder_path})
                      </Text>
                    )}
                  </div>
                }
                type="info"
                showIcon={false}
                style={{ 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #bae6fd',
                  borderRadius: '6px'
                }}
              />
            </div>
          )}
          
          {/* 内容区域 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {documentType === 'file' ? (
              <div style={{ height: '100%', display: 'flex' }}>
                {/* 左侧：文件上传区域 */}
                <div style={{ width: '50%', paddingRight: '12px', display: 'flex', flexDirection: 'column' }}>
                  <Dragger
                    multiple
                    beforeUpload={() => false}
                    onChange={handleFileChange}
                    accept={acceptedTypes.join(',')}
                    showUploadList={false}
                    fileList={fileList}
                    style={{ 
                      flex: '1 1 auto',
                      minHeight: '300px',
                      maxHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到这里上传</p>
                    <p className="ant-upload-hint">
                      支持 PDF, DOC, DOCX, TXT, MD 格式，单个文件不超过 50MB
                    </p>
                  </Dragger>

                  {/* 文件上传说明 */}
                  <div 
                    className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                    style={{ flex: '0 0 auto' }}
                  >
                    <div className="flex items-start">
                      <ExclamationCircleOutlined className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-blue-800">
                          <div className="font-semibold mb-2">
                            批量文件上传指南
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>• 支持同时上传多个文档进行批量处理</div>
                            <div>• 自动进行文本提取和智能预处理</div>
                            <div>• 可配置向量化参数构建知识库</div>
                            <div>• 支持PDF、DOC、DOCX、TXT、MD格式</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右侧：文件列表 */}
                <div style={{ width: '50%', paddingLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                    <div className="flex items-center justify-between">
                      <Text strong className="text-base">已选择的文件</Text>
                      {fileList.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag color="blue">{fileList.length} 个文件</Tag>
                          <Button 
                            size="small" 
                            type="text" 
                            onClick={handleClearAllFiles}
                            className="text-gray-500 hover:text-red-500"
                          >
                            清空全部
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {fileList.length > 0 ? (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {renderFileList()}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center text-gray-400">
                        <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                        <div className="text-sm">暂无选择文件</div>
                        <div className="text-xs mt-1">请从左侧上传文件</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              renderUrlUploadSection()
            )}
          </div>
        </div>
      )}

      {currentStep === 'metadata' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="mb-4">
            <Text>配置文档信息和向量化参数</Text>
            <div className="text-sm text-gray-500 mt-1">
              您可以为每个文档单独配置标签、描述和向量化参数，或使用系统默认配置
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {renderMetadataEdit()}
          </div>
        </div>
      )}

      {currentStep === 'processing' && renderProcessing()}
    </Modal>
  );
}; 