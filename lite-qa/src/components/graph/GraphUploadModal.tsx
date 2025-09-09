/**
 * 知识图谱文件上传Modal组件
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
  message,
  Divider,
  Tooltip
} from 'antd';
import { 
  InboxOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { graphService } from '../../services/graphService';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Text } = Typography;

interface GraphUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files: FileList, metadata?: Array<{
    fileIndex: number;
    tags?: string[];
    description?: string;
  }>) => Promise<void>;
  onSuccess?: () => void;
  loading?: boolean;
}

// 扩展UploadFile接口
interface FileWithMetadata extends UploadFile {
  tags?: string[];
  description?: string;
}

export const GraphUploadModal: React.FC<GraphUploadModalProps> = ({
  visible,
  onCancel,
  onUpload,
  onSuccess,
  loading = false
}) => {
  const [fileList, setFileList] = useState<FileWithMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'processing'>('upload');
  const [currentConfigIndex, setCurrentConfigIndex] = useState<number>(0);
  
  // 重复文件检查相关状态
  const [duplicateFiles, setDuplicateFiles] = useState<Set<string>>(new Set());
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // 支持的文件类型
  const acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

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
      const result = await graphService.getKnowledgeGraphDocuments({ search: '' });
      const existingFiles = new Set(result.documents.map(doc => doc.filename));
      
      // 3. 合并两种重复检查的结果
      const allDuplicates = new Set<string>();
      
      // 添加内部重复文件
      internalDuplicates.forEach(filename => allDuplicates.add(filename));
      
      // 添加与数据库重复的文件
      filenames.forEach(filename => {
        if (existingFiles.has(filename)) {
          allDuplicates.add(filename);
        }
      });
      
      setDuplicateFiles(allDuplicates);
      
      // 显示重复文件提示
      if (allDuplicates.size > 0) {
        let warningMessage = '';
        const dbDuplicates = filenames.filter(f => existingFiles.has(f)).length;
        
        if (internalDuplicates.size > 0 && dbDuplicates > 0) {
          warningMessage = `发现 ${internalDuplicates.size} 个选择文件内部重复，${dbDuplicates} 个与已有文档重复，请删除后重新上传`;
        } else if (internalDuplicates.size > 0) {
          warningMessage = `发现 ${internalDuplicates.size} 个选择文件内部重复，请删除重复文件`;
        } else if (dbDuplicates > 0) {
          warningMessage = `发现 ${dbDuplicates} 个与已有文档重复，请删除后重新上传`;
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
      description: (file as FileWithMetadata).description || ''
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
        setDuplicateFiles(new Set());
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

  // 处理上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    // 检查是否有重复文件
    if (duplicateFiles.size > 0) {
      message.error('请先删除重复的文件后再上传');
      return;
    }

    setCurrentStep('processing');
    setUploading(true);

    try {
      // 创建FileList对象
      const files = new DataTransfer();
      fileList.forEach(file => {
        if (file.originFileObj) {
          files.items.add(file.originFileObj);
        }
      });

      // 构建元数据
      const metadata = fileList.map((file, index) => ({
        fileIndex: index,
        tags: file.tags,
        description: file.description
      }));
      
      await onUpload(files.files, metadata);
      message.success('文档上传成功');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      
      // 提取具体的错误信息
      let errorMessage = '文档上传失败';
      
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
            errorMessage = `上传失败: ${response.statusText}`;
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      message.error(errorMessage);
      setCurrentStep('metadata');
    } finally {
      setUploading(false);
    }
  };

  // 关闭Modal
  const handleClose = () => {
    setFileList([]);
    setCurrentStep('upload');
    setUploading(false);
    setCurrentConfigIndex(0);
    setDuplicateFiles(new Set());
    setCheckingDuplicates(false);
    onCancel();
  };

  // 下一步
  const handleNext = () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }
    setCurrentStep('metadata');
    setCurrentConfigIndex(0); // 重置到第一个文档
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
        <div style={{ flex: 1, overflowY: 'auto' }} className="space-y-2">
          {fileList.map((file, index) => (
            <div 
              key={file.uid} 
              className="flex items-center p-2 border border-gray-200 rounded-md hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              {/* 文件图标 */}
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded mr-2 flex-shrink-0">
                <FileTextOutlined className="text-orange-600" style={{ fontSize: 14 }} />
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
                  <Tag color="orange" className="text-xs">
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
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <FileTextOutlined className="text-orange-500 mr-2" />
            <Text strong>{currentFile.name}</Text>
            <Tag color="orange" className="ml-2">
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
            <Input
              placeholder="输入标签，用逗号分隔"
              value={currentFile.tags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                updateCurrentFileMetadata({ tags });
              }}
            />
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
      </div>
    );
  };

  // 渲染元数据编辑
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
        <UploadOutlined style={{ fontSize: 48, color: '#fa8c16' }} />
      </div>
      <div className="mb-4">
        <Text className="text-lg">正在上传文档...</Text>
      </div>
      <Progress percent={uploading ? 60 : 100} status={uploading ? 'active' : 'success'} />
      <div className="mt-4 text-sm text-gray-500">
        {uploading ? '请稍候，正在处理您的文档' : '上传完成'}
      </div>
    </div>
  );

  return (
    <Modal
      title="上传知识图谱文档"
      open={visible}
      onCancel={handleClose}
      width={800}
      style={{ height: '80vh' }}
      bodyStyle={{ 
        height: '600px', 
        overflow: 'hidden',
        padding: '24px'
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
            disabled={fileList.length === 0 || duplicateFiles.size > 0}
            loading={checkingDuplicates}
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
          >
            {checkingDuplicates ? '检查重复文件...' : '下一步'}
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
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
          >
            开始上传
          </Button>
        ] : null
      }
    >
      {currentStep === 'upload' && (
        <div style={{ height: '100%', display: 'flex' }}>
          {/* 左侧：上传区域 */}
          <div style={{ width: '50%', paddingRight: '12px', display: 'flex', flexDirection: 'column' }}>
            <Dragger
              multiple
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept={acceptedTypes.join(',')}
              showUploadList={false}
              fileList={fileList}
              style={{ 
                flex: '1 1 80%',
                minHeight: '400px',
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

            {/* 上传说明 */}
            <div 
              className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100"
              style={{ flex: '0 0 auto' }}
            >
              <div className="flex items-start">
                <ExclamationCircleOutlined className="text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-orange-800">
                    <div className="font-semibold mb-2">
                      知识图谱文档上传
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>• 支持同时上传多个文档进行知识图谱构建</div>
                      <div>• 自动进行实体识别和关系抽取</div>
                      <div>• 构建结构化的知识图谱数据库</div>
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
                    <Tag color="orange">{fileList.length} 个文件</Tag>
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
      )}

      {currentStep === 'metadata' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="mb-4">
            <Text>配置文档信息</Text>
            <div className="text-sm text-gray-500 mt-1">
              您可以为每个文档添加标签和描述，这将有助于后续的知识图谱检索和管理
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