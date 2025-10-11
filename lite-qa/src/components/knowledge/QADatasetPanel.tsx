/**
 * QA数据集面板 - 完全基于SSE事件驱动
 * 移除所有HTTP轮询，使用统一SSE推送获取状态更新
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Space,
  Tag,
  Progress,
  Switch,
  message,
  Popconfirm,
  Drawer,
  List,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Pagination,
  Select,
  Tooltip,
  Badge,
  Dropdown,
  Divider,
  Descriptions,
  type MenuProps
} from 'antd';

import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  CopyOutlined,
  ImportOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  QuestionCircleOutlined,
  ExperimentOutlined,
  InboxOutlined,
  FileTextOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';

import { qaDatasetService } from '../../services/qaDatasetService';
import { copyToClipboard, getClipboardInfo } from '../../utils/clipboardUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface QAUploadFile {
  uid: string;
  name: string;
  size: number;
  originFileObj?: File;
  title?: string;
  description?: string;
  category?: string;
}

interface QADataset {
  id: string;
  title: string;
  description: string;
  category: string;
  file_name: string;
  file_path?: string;
  file_size?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  vectorization_status: 'pending' | 'processing' | 'completed' | 'failed';
  total_qa_pairs: number;
  processed_qa_pairs: number;
  categories_count: number;
  vector_model: string;
  created_at: string;
  updated_at: string;
  
  // 新增：支持自动提取的字段
  data_source_type?: 'manual_upload' | 'auto_extraction';
  source_document_id?: string;
  source_document_title?: string;
  source_document_filename?: string;
  source_document_type?: string;
  extraction_task_id?: string;
  extraction_method?: string;
  extraction_model?: string;
  extraction_started_at?: string;
  extraction_completed_at?: string;
  extraction_duration_seconds?: number;
  extraction_error_message?: string;
  extraction_task_status?: string;
  extraction_priority?: number;
  extraction_retry_count?: number;
  display_title?: string;
  
  processing_logs?: {
    vectorization?: {
      progress: number;
      status: string;
      message: string;
      details: {
        stage?: string;
        total_pairs?: number;
        vectorized_pairs?: number;
        current_batch?: number;
        total_batches?: number;
        success_rate?: number;
        error?: string;
      };
      updated_at: string;
    };
  };
  metadata?: {
    original_filename?: string;
  };
}

interface QAPair {
  id: string;
  category: string;
  question: string;
  answer: string;
  row_number: number;
  source_sheet: string;
  vector_status: string;
  quality_score: number;
  is_validated: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface QADatasetPanelProps {
  onUploadTrigger?: () => void;
  collectionId?: string | null;
}

const QADatasetPanel: React.FC<QADatasetPanelProps> = ({ onUploadTrigger, collectionId }) => {
  // 基础状态
  const [datasets, setDatasets] = useState<QADataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<QADataset | null>(null);
  const [qaPairs, setQAPairs] = useState<QAPair[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // UI状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deletingDatasets, setDeletingDatasets] = useState<Set<string>>(new Set());
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPairs, setTotalPairs] = useState(0);
  const [qaPairsLoading, setQAPairsLoading] = useState(false);
  const [qaPairsTotal, setQAPairsTotal] = useState(0);
  // 向量化数据查看
  const [vectorDrawerVisible, setVectorDrawerVisible] = useState(false);
  const [vectorDataset, setVectorDataset] = useState<QADataset | null>(null);
  const [vectorPairs, setVectorPairs] = useState<QAPair[]>([]);
  const [vectorOnlyCompleted, setVectorOnlyCompleted] = useState(true);
  const [vectorLoading, setVectorLoading] = useState(false);
  const [vectorPage, setVectorPage] = useState(1);
  const vectorPageSize = 20;
  
  // Form实例
  const [uploadForm] = Form.useForm();
  
  // 多文件上传状态
  const [fileList, setFileList] = useState<QAUploadFile[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  
  // 批量选择状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  
  // 数据集列表分页状态
  const [currentDatasetPage, setCurrentDatasetPage] = useState(1);
  const datasetPageSize = 6;

  // 统计数据
  const stats = {
    totalDatasets: datasets.length,
    completedDatasets: datasets.filter(d => d.status === 'completed' || d.vectorization_status === 'completed').length,
    totalQAPairs: datasets.reduce((sum, d) => sum + (Number(d.total_qa_pairs) || 0), 0),
    vectorizedQAPairs: datasets.reduce((sum, d) => {
      const processedPairs = Number(d.processed_qa_pairs) || 0;
      const totalPairs = Number(d.total_qa_pairs) || 0;
      
      // 🔧 智能统计逻辑：根据不同状态确定已向量化数量
      if (d.vectorization_status === 'completed') {
        // 已完成状态：如果processed_qa_pairs为0，使用total_qa_pairs
        if (processedPairs === 0 && totalPairs > 0) {
          console.log(`📊 统计修正: 数据集${d.title}(${d.id})向量化完成但processed_qa_pairs为0，使用total_qa_pairs=${totalPairs}`);
          return sum + totalPairs;
        }
        return sum + processedPairs;
      } else if (d.status === 'completed' && processedPairs === 0 && totalPairs > 0) {
        // 处理状态为完成但向量化状态不明确的情况
        console.log(`📊 统计修正: 数据集${d.title}(${d.id})状态完成但processed_qa_pairs为0，使用total_qa_pairs=${totalPairs}`);
        return sum + totalPairs;
      } else {
        // 其他情况：使用实际的已处理数量
        return sum + processedPairs;
      }
    }, 0)
  };

  // 加载数据集列表
  const loadDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await qaDatasetService.listDatasets(
        undefined, // status
        50, // limit  
        0, // offset
        collectionId || undefined // collectionId
      );
      const rawDatasets = Array.isArray(data) ? data : data.datasets;
      
      // 🔧 修正数据：对于已完成但processed_qa_pairs为0的数据集，设置为total_qa_pairs
      const correctedDatasets = rawDatasets.map(dataset => {
        const totalPairs = Number(dataset.total_qa_pairs) || 0;
        const processedPairs = Number(dataset.processed_qa_pairs) || 0;
        
        // 如果数据集已完成向量化但processed_qa_pairs为0，修正为total_qa_pairs
        if ((dataset.status === 'completed' || dataset.vectorization_status === 'completed') && 
            processedPairs === 0 && totalPairs > 0) {
          console.log(`📊 数据加载修正: 数据集${dataset.title}(${dataset.id})已完成但processed_qa_pairs为0，修正为${totalPairs}`);
          return {
            ...dataset,
            processed_qa_pairs: totalPairs
          };
        }
        
        return dataset;
      });
      
      setDatasets(correctedDatasets);
    } catch (error) {
      message.error('加载QA数据集失败');
      console.error('Load datasets error:', error);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // 暴露全局刷新钩子，便于外部事件触发
  useEffect(() => {
    (window as any).refreshQADatasets = () => {
      loadDatasets();
    };
    return () => {
      if ((window as any).refreshQADatasets) delete (window as any).refreshQADatasets;
    };
  }, [loadDatasets]);

  // 监听 QA 任务创建事件，自动刷新数据集列表
  useEffect(() => {
    const handler = () => loadDatasets();
    window.addEventListener('qa-task-created', handler);
    return () => window.removeEventListener('qa-task-created', handler);
  }, [loadDatasets]);

  // 加载问答对列表
  const loadQAPairs = async (datasetId: string, page: number = 1, category?: string | null) => {
    setQAPairsLoading(true);
    try {
      console.log('发起问答对请求，数据集ID:', datasetId, '页码:', page, '分类:', category);
      
      const offset = (page - 1) * pageSize;
      const data = await qaDatasetService.getQAPairs(datasetId, category || undefined, pageSize, offset);
      console.log('获取到的问答对数据:', data);
      console.log('问答对数量:', data?.qa_pairs?.length || 0);
      
      setQAPairs(data.qa_pairs || []);
      setQAPairsTotal(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载问答对失败:', error);
      message.error('加载问答对失败');
    } finally {
      setQAPairsLoading(false);
    }
  };

  // SSE事件处理器
  const handleSSEMessage = useCallback((event: CustomEvent) => {
    const data = event.detail;
    console.log('📡 QADatasetPanel收到SSE消息:', data);
    console.log('📡 消息类型:', data.type);
    console.log('📡 任务ID:', data.task_id);
    console.log('📡 消息数据:', data.data);

    switch (data.type) {
      case 'connection_established':
        if (data.unified_sse) {
          console.log('📡 QA数据集面板：统一SSE连接已建立');
        }
        break;

      case 'task_progress_update':
        console.log('📡 收到任务进度更新事件:', data);
        {
          const progressData = data.data;
          const datasetId = progressData.document_id || progressData.dataset_id || progressData.qa_dataset_id;
          const taskType = progressData.task_type;
          
          console.log('📡 进度数据解析结果:', { datasetId, taskType, progress: progressData.progress });
          
          // 增强过滤逻辑，确保QA数据集事件被正确处理
          if (datasetId && taskType && (
            taskType.includes('qa_dataset') || 
            taskType.includes('qa') || 
            taskType === 'vectorization' ||
            taskType === 'qa_dataset_vectorization'  // 添加明确的QA数据集向量化类型
          )) {
            console.log('📡 匹配到QA数据集事件，更新状态:', { datasetId, taskType, progress: progressData.progress });
            
            setDatasets(prevDatasets => 
              prevDatasets.map(dataset => {
                if (dataset.id === datasetId) {
                  // 🔧 优化向量化数量的实时更新逻辑
                  const currentVectorized = Number(progressData.vectorized_pairs || progressData.processed_pairs) || 0;
                  const totalPairs = Number(progressData.total_pairs || progressData.total) || dataset.total_qa_pairs || 0;
                  
                  console.log('📡 更新数据集状态:', dataset.id, `进度${progressData.progress}%, 已向量化${currentVectorized}/${totalPairs}`);
                  
                  return {
                    ...dataset,
                    status: 'processing',
                    vectorization_status: 'processing',
                    // 🔧 实时更新已处理数量，确保显示正确
                    processed_qa_pairs: Math.max(currentVectorized, dataset.processed_qa_pairs || 0),
                    total_qa_pairs: totalPairs > 0 ? totalPairs : dataset.total_qa_pairs,
                    processing_logs: {
                      ...dataset.processing_logs,
                      vectorization: {
                        progress: progressData.progress || 0,
                        status: progressData.stage || progressData.message || '处理中',
                        message: progressData.detail || progressData.message || '',
                        details: {
                          stage: progressData.stage || progressData.current_stage,
                          total_pairs: totalPairs,
                          vectorized_pairs: currentVectorized,
                          current_batch: progressData.current_batch,
                          total_batches: progressData.total_batches,
                          success_rate: progressData.success_rate
                        },
                        updated_at: new Date().toISOString()
                      }
                    }
                  };
                }
                return dataset;
              })
            );
          } else {
            console.log('📡 QA数据集事件过滤：不匹配', { datasetId, taskType });
          }
        }
        break;

      case 'task_completed':
        console.log('📡 收到任务完成事件:', data);
        {
          const resultData = data.data;
          const datasetId = resultData.document_id || resultData.dataset_id || resultData.qa_dataset_id;
          const taskType = resultData.task_type;
          
          if (datasetId && taskType && (taskType.includes('qa_dataset') || taskType.includes('qa') || taskType === 'vectorization')) {
            console.log('📡 处理QA数据集完成事件，数据:', resultData);
            
            setDatasets(prevDatasets => 
              prevDatasets.map(dataset => {
                if (dataset.id === datasetId) {
                  // 🔧 优先使用后端返回的准确数据，避免回退到可能不准确的数据
                  const totalPairs = Number(resultData.total_qa_pairs) || Number(resultData.total) || dataset.total_qa_pairs || 0;
                  const processedPairs = Number(resultData.processed_qa_pairs) || Number(resultData.vectorized_pairs) || 0;
                  
                  // 🔧 关键修复：如果processed_qa_pairs为0但total_qa_pairs有值，且成功率很高，设置为总数
                  let finalProcessedPairs = processedPairs;
                  if (processedPairs === 0 && totalPairs > 0 && resultData.success_rate >= 80) {
                    finalProcessedPairs = totalPairs;
                    console.log(`📡 修正QA数据集${datasetId}的已处理数量: ${processedPairs} -> ${finalProcessedPairs} (基于成功率${resultData.success_rate}%)`);
                  }
                  
                  console.log(`📡 更新QA数据集${datasetId}状态: 总数=${totalPairs}, 已向量化=${finalProcessedPairs}`);
                  
                  return {
                    ...dataset,
                    status: 'completed',
                    vectorization_status: 'completed',
                    total_qa_pairs: totalPairs,
                    processed_qa_pairs: finalProcessedPairs,
                    processing_logs: {
                      ...dataset.processing_logs,
                      vectorization: {
                        progress: 100,
                        status: '已完成',
                        message: '处理完成',
                        details: {
                          stage: '已完成',
                          total_pairs: totalPairs,
                          vectorized_pairs: finalProcessedPairs,
                          success_rate: resultData.success_rate || 100
                        },
                        updated_at: new Date().toISOString()
                      }
                    }
                  };
                }
                return dataset;
              })
            );
            message.success(`QA数据集处理完成`);
            // 延迟刷新以确保最新状态
            setTimeout(() => {
              loadDatasets();
            }, 1000);
          }
        }
        break;

      case 'task_failed':
        console.log('📡 收到任务失败事件:', data);
        {
          const errorData = data.data;
          const datasetId = errorData.document_id || errorData.dataset_id || errorData.qa_dataset_id;
          const taskType = errorData.task_type;
          
          if (datasetId && taskType && (taskType.includes('qa_dataset') || taskType.includes('qa') || taskType === 'vectorization')) {
            setDatasets(prevDatasets => 
              prevDatasets.map(dataset => {
                if (dataset.id === datasetId) {
                  return {
                    ...dataset,
                    status: 'failed',
                    vectorization_status: 'failed',
                    processing_logs: {
                      ...dataset.processing_logs,
                      vectorization: {
                        progress: 0,
                        status: '失败',
                        message: errorData.error_message || errorData.message || '处理失败',
                        details: {
                          stage: '失败',
                          error: errorData.error_message || errorData.message
                        },
                        updated_at: new Date().toISOString()
                      }
                    }
                  };
                }
                return dataset;
              })
            );
            message.error(`QA数据集处理失败: ${errorData.error_message || errorData.message || '未知错误'}`);
            loadDatasets();
          }
        }
        break;

      case 'task_cancelled':
        console.log('📡 收到任务取消事件:', data);
        break;

              default:
          console.log('📡 QA数据集面板收到其他SSE消息类型:', data.type, data);
      }
    }, [loadDatasets]);



  // 监听清理事件
  useEffect(() => {
    const handleClearStores = () => {
      console.log('🧹 QADatasetPanel: 收到清理事件');
      
      // 清空状态
      setDatasets([]);
      setSelectedDataset(null);
      setQAPairs([]);
      setCategories([]);
      setSelectedCategory(null);
      setLoading(false);
      setDetailDrawerVisible(false);
      setUploadModalVisible(false);
      setDeletingDatasets(new Set());
    };

    window.addEventListener('clear-all-stores', handleClearStores);
    return () => window.removeEventListener('clear-all-stores', handleClearStores);
  }, []);

  // 查看向量化数据
  const handleViewVectors = async (dataset: QADataset) => {
    setVectorDataset(dataset);
    setVectorDrawerVisible(true);
    setVectorPage(1);
    await loadVectorPairs(dataset.id, 1, vectorOnlyCompleted);
  };

  const loadVectorPairs = async (datasetId: string, page = 1, onlyCompleted = true) => {
    setVectorLoading(true);
    try {
      const offset = (page - 1) * vectorPageSize;
      const data = await qaDatasetService.getQAPairs(datasetId, undefined, vectorPageSize, offset);
      let pairs = data.qa_pairs || [];
      if (onlyCompleted) {
        pairs = pairs.filter(p => (p.vector_status || '').toLowerCase() === 'completed');
      }
      setVectorPairs(pairs);
      setVectorPage(page);
    } catch (e) {
      console.error('加载向量化数据失败:', e);
      message.error('加载向量化数据失败');
    } finally {
      setVectorLoading(false);
    }
  };

  // 初始化和SSE事件监听
  useEffect(() => {
    // 监听SSE消息事件
    window.addEventListener('sse-message', handleSSEMessage as EventListener);
    
    // 加载数据集列表
    loadDatasets();
    
    return () => {
      window.removeEventListener('sse-message', handleSSEMessage as EventListener);
    };
  }, [handleSSEMessage]);

  // 验证Excel文件内容
  const validateExcelFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    try {
      // 检查文件扩展名
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        return { valid: false, error: '文件格式错误：仅支持 .xlsx 和 .xls 格式' };
      }
      
      // 检查文件大小（50MB限制）
      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: '文件过大：超过50MB限制' };
      }
      
      // 检查文件是否为空
      if (file.size === 0) {
        return { valid: false, error: '文件为空：请选择包含数据的Excel文件' };
      }
      
      // 基础验证通过
      return { valid: true };
      
    } catch (error) {
      console.error('文件验证错误:', error);
      return { valid: false, error: '文件验证失败：请检查文件是否损坏' };
    }
  };

  // 处理文件选择
  const handleFileChange = async (info: any) => {
    let newFileList = [...info.fileList];
    
    // 过滤并验证Excel文件
    const validatedFiles = [];
    
    for (const file of newFileList) {
      const originFile = file.originFileObj || file;
      
      // 跳过已经验证过的文件
      if (file.status === 'done' || !originFile) {
        validatedFiles.push({
          uid: file.uid || `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          originFileObj: originFile,
          title: file.title || '',
          description: file.description || '',
          category: file.category || '',
          status: file.status
        });
        continue;
      }
      
      // 验证新文件
      const validation = await validateExcelFile(originFile);
      
      if (validation.valid) {
        validatedFiles.push({
          uid: file.uid || `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          originFileObj: originFile,
          title: file.title || '',
          description: file.description || '',
          category: file.category || '',
          status: 'done'
        });
      } else {
        message.error(`${file.name}: ${validation.error}`);
        // 不添加到文件列表中
      }
    }
    
    setFileList(validatedFiles);
    
    // 重置配置索引
    if (validatedFiles.length === 0) {
      setCurrentConfigIndex(0);
    } else if (currentConfigIndex >= validatedFiles.length) {
      setCurrentConfigIndex(validatedFiles.length - 1);
    }
  };

  // 删除文件
  const handleRemoveFile = (fileUid: string) => {
    const newFileList = fileList.filter(file => file.uid !== fileUid);
    setFileList(newFileList);
    
    if (currentConfigIndex >= newFileList.length && newFileList.length > 0) {
      setCurrentConfigIndex(newFileList.length - 1);
    } else if (newFileList.length === 0) {
      setCurrentConfigIndex(0);
    }
  };

  // 清空所有文件
  const handleClearAllFiles = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有已选择的文件吗？',
      onOk: () => {
        setFileList([]);
        setCurrentConfigIndex(0);
        uploadForm.resetFields();
      }
    });
  };

  // 更新当前文件的元数据
  const updateCurrentFileMetadata = (field: string, value: any) => {
    if (fileList.length === 0) return;
    
    const updatedFileList = [...fileList];
    updatedFileList[currentConfigIndex] = {
      ...updatedFileList[currentConfigIndex],
      [field]: value
    };
    setFileList(updatedFileList);
  };

  // 上传QA数据集（支持多文件）
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择至少一个Excel文件');
      return;
    }

    const uploadingMessage = message.loading('正在上传文件...', 0);

    try {
      const uploadPromises = fileList.map(async (file) => {
    try {
      const formData = new FormData();
          
          // 使用原始文件对象
          const originalFile = file.originFileObj;
          if (!originalFile) {
            throw new Error(`无法获取文件 ${file.name} 的原始文件对象`);
          }

          // 再次验证文件
          const validation = await validateExcelFile(originalFile);
          if (!validation.valid) {
            throw new Error(`文件验证失败: ${validation.error}`);
          }
          
          formData.append('file', originalFile);
          if (file.title) formData.append('title', file.title);
          if (file.description) formData.append('description', file.description);
          if (file.category) formData.append('category', file.category);
          if (collectionId) formData.append('collection_id', collectionId);

      const result = await qaDatasetService.uploadDataset(formData);
      
          return {
            success: true,
            fileName: file.name,
            file: file,
            result: result
          };
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          return {
            success: false,
            fileName: file.name,
            file: file,
            error: error instanceof Error ? error.message : '未知错误'
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      uploadingMessage();
      
      // 统计结果
      const successResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      const successCount = successResults.length;
      const duplicateCount = successResults.filter(r => r.result?.status === 'duplicate').length;
      const failCount = failedResults.length;
      
      // 显示结果消息
      if (successCount > 0) {
        const validUploads = successCount - duplicateCount;
        if (validUploads > 0) {
          message.success(`成功上传 ${validUploads} 个QA数据集，正在后台处理...`);
        }
      }
      
      if (duplicateCount > 0) {
        message.warning(`${duplicateCount} 个文件已存在，已跳过`);
      }
      
      if (failCount > 0) {
        console.error('上传失败的文件:', failedResults);
        
        // 显示失败详情
        Modal.error({
          title: `${failCount} 个文件上传失败`,
          content: (
            <div>
              <p>以下文件上传失败:</p>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {failedResults.map((file, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    <strong>{file.fileName}</strong>: {file.error}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: '12px', padding: '8px', background: '#f6f8fa', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#666' }}>常见问题和解决方案:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#666' }}>
                  <li>文件格式：仅支持 .xlsx 和 .xls 格式</li>
                  <li>文件大小：不超过 50MB</li>
                  <li>必需列：文件必须包含"分类"、"问题"、"答案"列</li>
                  <li>数据质量：检查是否存在空值、特殊字符或格式错误</li>
                  <li>文件完整性：确保文件未损坏且可正常打开</li>
                </ul>
              </div>
            </div>
          ),
          width: 600
        });
      }

      // 不创建初始数据集条目，等待后端SSE事件或重新加载数据
      console.log('上传成功，等待后端处理完成后自动刷新数据列表');
      
      // 延迟一下重新加载数据列表，让后端有时间处理
      setTimeout(() => {
        loadDatasets();
      }, 1000);
      
      // 只有当至少有一个文件上传成功时才关闭模态框
      if (successCount > 0) {
      setUploadModalVisible(false);
        setFileList([]);
        setCurrentConfigIndex(0);
      uploadForm.resetFields();
      } else {
        // 全部失败时，只清除失败的文件，保留可能的有效文件
        const failedFileNames = new Set(failedResults.map(r => r.fileName));
        setFileList(prev => prev.filter(f => !failedFileNames.has(f.name)));
      }
      
    } catch (error) {
      uploadingMessage();
      console.error('批量上传失败:', error);
      message.error(`批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除数据集
  const handleDelete = async (datasetId: string) => {
    try {
      // 添加到删除中状态
      setDeletingDatasets(prev => new Set([...prev, datasetId]));
      
      // 停止该数据集的轮询
      // stopDatasetPolling(datasetId); // 移除轮询，改为SSE
      
      await qaDatasetService.deleteDataset(datasetId);
      message.success('数据集删除成功');
      
      // 删除成功后刷新列表并调整分页
      const remainingCount = datasets.length - 1;
      const maxPage = Math.ceil(remainingCount / datasetPageSize);
      if (currentDatasetPage > maxPage && maxPage > 0) {
        setCurrentDatasetPage(maxPage);
      }
      
      await loadDatasets();
    } catch (error) {
      message.error('删除失败');
    } finally {
      // 移除删除中状态
      setDeletingDatasets(prev => {
        const newSet = new Set(prev);
        newSet.delete(datasetId);
        return newSet;
      });
    }
  };

  // 批量删除数据集
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据集');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedRowKeys.length} 个数据集吗？此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setBatchDeleting(true);
          // 添加到删除状态集合中
          setDeletingDatasets(prev => new Set([...prev, ...selectedRowKeys]));
          
          // 并行删除所有选中的数据集
          const deletePromises = selectedRowKeys.map(id => 
            qaDatasetService.deleteDataset(id)
          );
          
          await Promise.all(deletePromises);
          
          message.success(`成功删除 ${selectedRowKeys.length} 个数据集`);
          setSelectedRowKeys([]);
          
          // 计算删除后是否需要调整页码
          const remainingCount = datasets.length - selectedRowKeys.length;
          const maxPage = Math.ceil(remainingCount / datasetPageSize);
          if (currentDatasetPage > maxPage && maxPage > 0) {
            setCurrentDatasetPage(maxPage);
          }
          
          loadDatasets();
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败，请重试');
        } finally {
          setBatchDeleting(false);
          // 从删除状态集合中移除
          setDeletingDatasets(prev => {
            const next = new Set(prev);
            selectedRowKeys.forEach(id => next.delete(id));
            return next;
          });
        }
      }
    });
  };

  // 重新处理数据集
  const handleReprocess = async (datasetId: string) => {
    try {
      await qaDatasetService.reprocessDataset(datasetId);
      message.success('重新处理任务已提交');
      loadDatasets();
    } catch (error) {
      message.error('重新处理失败');
    }
  };

  // 查看详情
  const handleViewDetail = async (dataset: QADataset) => {
    console.log('开始查看详情，数据集:', dataset);
    
    // 立即显示抽屉和基础信息
    setDetailDrawerVisible(true);
    setSelectedDataset(dataset); // 先使用传入的数据
    setQAPairs([]); // 清空之前的问答对数据
    setQAPairsTotal(0);
    setCurrentPage(1);
    setCategories([]); // 重置分类列表
    setSelectedCategory(null); // 重置选中的分类
    
    // 异步获取最新的数据集信息
    const updateDatasetInfo = async () => {
      try {
        console.log('刷新数据集列表以获取最新信息');
        const listData = await qaDatasetService.listDatasets();
        const datasets = Array.isArray(listData) ? listData : listData.datasets;
        const latestDataset = datasets.find(d => d.id === dataset.id);
        
        if (latestDataset) {
          console.log('找到最新的数据集信息:', latestDataset);
          setSelectedDataset(latestDataset);
        }
      } catch (error) {
        console.error('获取最新数据集信息失败:', error);
      }
    };
    
    // 异步获取分类信息
    const loadCategories = async () => {
      try {
        // 获取所有问答对的分类（不分页）
        const allData = await qaDatasetService.getQAPairs(dataset.id, undefined, 1000, 0);
        if (allData.qa_pairs && allData.qa_pairs.length > 0) {
          const allCategories = [...new Set(allData.qa_pairs.map(pair => pair.category))].filter(Boolean);
          setCategories(allCategories);
        }
      } catch (error) {
        console.error('获取分类信息失败:', error);
      }
    };

    // 并行执行
    Promise.all([updateDatasetInfo(), loadQAPairs(dataset.id, 1), loadCategories()]);
  };

  // 处理分类筛选
  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1); // 重置到第一页
    if (selectedDataset) {
      loadQAPairs(selectedDataset.id, 1, category);
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

  // 状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待处理' },
      processing: { color: 'processing', icon: <ClockCircleOutlined />, text: '处理中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'error', icon: <ExclamationCircleOutlined />, text: '处理失败' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 向量化状态标签
  const getVectorizationStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待向量化' },
      processing: { color: 'processing', icon: <ClockCircleOutlined />, text: '向量化中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '向量化完成' },
      failed: { color: 'error', icon: <ExclamationCircleOutlined />, text: '向量化失败' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 表格列定义
  const columns: ColumnsType<QADataset> = [
    {
      title: '数据集名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            {record.display_title || text}
            {record.data_source_type === 'auto_extraction' && (
              <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
                自动提取
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.data_source_type === 'auto_extraction' ? (
              <>
                <FileTextOutlined style={{ marginRight: 4 }} />
                来源: {record.source_document_title || record.source_document_filename}
              </>
            ) : (
              <>
                <FileExcelOutlined style={{ marginRight: 4 }} />
                {record.metadata?.original_filename || record.file_name}
              </>
            )}
          </div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? <Tag>{category}</Tag> : <Text type="secondary">未分类</Text>
    },
    {
      title: '数据来源',
      key: 'data_source',
      width: 150,
      render: (record) => (
        <div>
          <div>
            {record.data_source_type === 'auto_extraction' ? (
              <Tag color="blue" icon={<ExperimentOutlined />}>
                自动提取
              </Tag>
            ) : (
              <Tag color="green" icon={<UploadOutlined />}>
                手动上传
              </Tag>
            )}
          </div>
          {record.data_source_type === 'auto_extraction' && record.extraction_method && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {record.extraction_method}
            </div>
          )}
          {record.data_source_type === 'auto_extraction' && record.extraction_duration_seconds && (
            <div style={{ fontSize: 11, color: '#666' }}>
              用时: {record.extraction_duration_seconds}s
            </div>
          )}
        </div>
      )
    },
    {
      title: '问答对数量',
      key: 'qa_pairs',
      render: (record) => {
        // 🔧 简单的数字转换，确保是数字类型
        const totalPairs = Number(record.total_qa_pairs) || 0;
        const processedPairs = Number(record.processed_qa_pairs) || 0;
        
        return (
          <div>
            <div>{totalPairs.toLocaleString()} 个</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              向量化: {processedPairs.toLocaleString()}/{totalPairs.toLocaleString()}
            </div>
          </div>
        );
      }
    },
    {
      title: '处理状态',
      key: 'status',
      width: 200,
      render: (record) => {
        const processingLogs = record.processing_logs || {};
        const vectorizationLog = processingLogs.vectorization || {};
        const progress = vectorizationLog.progress || 0;
        const details = vectorizationLog.details || {};
        
        return (
          <div>
            {/* 队列状态和处理状态显示 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {/* 队列状态 */}
              {record.status === 'pending' && (
                <Tag color="orange" icon={<ClockCircleOutlined />}>
                  队列等待中
                </Tag>
              )}
              {record.status === 'processing' && record.vectorization_status === 'pending' && (
                <Tag color="blue" icon={<ClockCircleOutlined />}>
                  队列处理中
                </Tag>
              )}
              
              {/* 向量化状态 */}
              {getVectorizationStatusTag(record.vectorization_status)}
              
              {/* 只在完成状态显示通用向量标识 */}
              {record.vectorization_status === 'completed' && (
                <Tag color="blue">
                  通用向量
                </Tag>
              )}
            </div>
            
            {/* QA数据集向量化进度显示 */}
            {record.vectorization_status === 'processing' && (
              <div style={{ marginTop: 6 }}>
                {details.vectorized_pairs !== undefined && details.total_pairs !== undefined && details.total_pairs > 0 ? (
                  (() => {
                    // 🔧 简单的数字转换
                    const vectorizedPairs = Number(details.vectorized_pairs) || 0;
                    const totalPairs = Number(details.total_pairs) || 0;
                    
                    // 🔧 判断是否为大文件（>20000个QA对）
                    const isLargeFile = totalPairs > 20000;
                    
                    return (
                      <div style={{ fontSize: 12, color: '#1890ff' }}>
                        {isLargeFile ? (
                          // 🔧 大文件显示格式：强调批次处理
                          <>
                            <div>大文件向量化: {vectorizedPairs.toLocaleString()}/{totalPairs.toLocaleString()}</div>
                            {details.current_batch && details.total_batches && (
                              <div style={{ color: '#666', fontSize: 11 }}>
                                批次进度: {details.current_batch}/{details.total_batches} | 进度: {Math.round((vectorizedPairs / totalPairs) * 100)}%
                              </div>
                            )}
                          </>
                        ) : (
                          // 🔧 普通文件显示格式
                          <>
                            向量化: {vectorizedPairs}/{totalPairs}
                            {details.current_batch && details.total_batches && (
                              <span style={{ marginLeft: 4, color: '#666' }}>
                                (批次 {details.current_batch}/{details.total_batches})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  // 没有有效数据时显示简单的处理中状态
                  <div style={{ fontSize: 12, color: '#1890ff' }}>
                    向量化处理中...
                  </div>
                )}
              </div>
            )}
            
            {/* 失败状态的错误信息 */}
            {record.vectorization_status === 'failed' && details.error && (
              <Tooltip title={details.error}>
                <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 4, cursor: 'pointer' }}>
                  查看错误详情
                </div>
              </Tooltip>
            )}
          </div>
        );
      }
    },
    // 去掉文件大小列
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="查看向量化数据">
            <Button
              type="text"
              icon={<ExperimentOutlined />}
              onClick={() => handleViewVectors(record)}
            />
          </Tooltip>
          {(() => {
            const isProcessing = record.vectorization_status === 'processing';
            const isCompleted = record.vectorization_status === 'completed';
            const disabled = isProcessing || isCompleted;
            const tip = isProcessing ? '向量化进行中' : (isCompleted ? '已完成向量化' : '手动向量化');
            return (
              <Tooltip title={tip}>
                <Popconfirm
                  title="确认手动触发向量化？"
                  description="将立即重新开始处理该数据集，可能会消耗额度。"
                  onConfirm={async () => {
                    try {
                      const res = await qaDatasetService.reprocessDataset(record.id);
                      if ((res as any)?.success !== false) {
                        message.success('已触发向量化处理');
                        loadDatasets();
                      } else {
                        message.error('触发向量化失败');
                      }
                    } catch (e) {
                      console.error('手动向量化失败:', e);
                      message.error('手动向量化失败');
                    }
                  }}
                  okText="确认"
                  cancelText="取消"
                  disabled={disabled}
                >
                  <Button
                    type="text"
                    icon={<PlayCircleOutlined />}
                    disabled={disabled}
                  />
                </Popconfirm>
              </Tooltip>
            );
          })()}
          
          {record.status === 'failed' && (
            <Tooltip title="重新处理">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => handleReprocess(record.id)}
              />
            </Tooltip>
          )}
          
          <Popconfirm
            title="确定要删除这个QA数据集吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={deletingDatasets.has(record.id)}
          >
            <Tooltip title={deletingDatasets.has(record.id) ? "删除中..." : "删除"}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deletingDatasets.has(record.id)}
                disabled={deletingDatasets.has(record.id)}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 问答对表格列定义
  const qaPairColumns: ColumnsType<QAPair> = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag>{category}</Tag>
    },
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      width: '35%',
      ellipsis: { showTitle: false },
      render: (question) => {
        const displayText = question.length > 45 ? question.substring(0, 45) + '...' : question;
        
        // 复制问题功能
        const handleCopyQuestion = async (e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const success = await copyToClipboard(question);
            if (success) {
              message.success('问题已复制到剪贴板');
            } else {
              message.error('复制失败，请手动复制');
              // 在控制台显示问题内容，方便用户手动复制
              console.log('复制的问题内容:', question);
            }
          } catch (error) {
            console.error('复制失败:', error);
            message.error('复制失败，请手动复制');
            // 在控制台显示问题内容，方便用户手动复制
            console.log('复制的问题内容:', question);
          }
        };
        
        // 导入测试功能
        const handleImportTest = (e: React.MouseEvent) => {
          e.stopPropagation();
          // 将问题添加到检索测试的快速测试问题列表中
          // 这里可以通过事件或状态管理来实现
          if (typeof window !== 'undefined') {
            // 发送自定义事件，让检索测试组件监听
            const event = new CustomEvent('addQuickTestQuestion', {
              detail: { question }
            });
            window.dispatchEvent(event);
            // 移除重复的消息提示，由接收事件的组件负责显示
          }
        };
        
        return (
          <div 
            className="question-cell"
            style={{ 
              lineHeight: '1.4',
              maxHeight: '42px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            {/* 原始内容 */}
            <Tooltip title={question} placement="topLeft">
              <div className="question-content">
                {displayText}
              </div>
            </Tooltip>
            
            {/* Hover遮罩层 */}
            <div className="question-overlay">
              <div className="question-actions">
                <Tooltip title="复制问题">
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={handleCopyQuestion}
                    className="question-action-btn"
                  >
                    复制问题
                  </Button>
                </Tooltip>
                <Tooltip title="导入测试">
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<ExperimentOutlined />}
                    onClick={handleImportTest}
                    className="question-action-btn"
                  >
                    导入测试
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: '答案',
      dataIndex: 'answer',
      key: 'answer',
      width: '35%',
      ellipsis: { showTitle: false },
      render: (answer) => {
        const displayText = answer.length > 50 ? answer.substring(0, 50) + '...' : answer;
        return (
          <Tooltip title={answer} placement="topLeft">
            <div style={{ 
              lineHeight: '1.4',
              maxHeight: '42px',
              overflow: 'hidden'
            }}>
              {displayText}
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'vector_status',
      key: 'vector_status',
      width: 90,
      render: (status) => getVectorizationStatusTag(status)
    },
    {
      title: '使用',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 60,
      align: 'center'
    }
  ];

  useEffect(() => {
    loadDatasets();
    
    // 组件卸载时清理所有轮询
    return () => {
      // stopAllPolling(); // 移除轮询，改为SSE
    };
  }, []);

  // 监听外部上传触发 - 无论onUploadTrigger是否传入都要设置
  useEffect(() => {
    // 延迟确保组件完全挂载
    const timer = setTimeout(() => {
      // 将触发上传的函数暴露给外部
      (window as any).triggerQADatasetUpload = () => {
        console.log('触发QA数据集上传');
        setUploadModalVisible(true);
      };
      // 将刷新函数暴露给外部
      (window as any).triggerQADatasetRefresh = () => {
        console.log('触发QA数据集刷新');
        loadDatasets();
      };
      
      console.log('QA数据集全局函数已注册');
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if ((window as any).triggerQADatasetUpload) {
        delete (window as any).triggerQADatasetUpload;
      }
      if ((window as any).triggerQADatasetRefresh) {
        delete (window as any).triggerQADatasetRefresh;
      }
    };
  }, [loadDatasets]);

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 当前知识库提示 */}
      {collectionId && (
        <div style={{ 
          marginBottom: 16, 
          padding: '8px 12px', 
          background: '#f0f7ff', 
          border: '1px solid #d6e4ff',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#0958d9'
        }}>
          当前显示知识库的QA数据集，上传的数据将归属于此知识库
        </div>
      )}
      
      {!collectionId && (
        <div style={{ 
          marginBottom: 16, 
          padding: '8px 12px', 
          background: '#fff7e6', 
          border: '1px solid #ffd591',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#d48806'
        }}>
          请先选择一个知识库，然后查看对应的QA数据集
        </div>
      )}
      
      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>数据集总数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalDatasets}</div>
            </div>
            <FileExcelOutlined style={{ fontSize: '28px', opacity: 0.7 }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>已完成</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.completedDatasets}
                <span style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.8 }}>
                  / {stats.totalDatasets}
                </span>
              </div>
            </div>
            <CheckCircleOutlined style={{ fontSize: '28px', opacity: 0.7 }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>问答对总数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalQAPairs.toLocaleString()}</div>
            </div>
            <QuestionCircleOutlined style={{ fontSize: '28px', opacity: 0.7 }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            borderRadius: '12px',
            padding: '16px',
            color: '#2d3748',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>已向量化</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.vectorizedQAPairs.toLocaleString()}
                <span style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.7 }}>
                  / {stats.totalQAPairs.toLocaleString()}
                </span>
              </div>
            </div>
            <CheckCircleOutlined style={{ fontSize: '28px', opacity: 0.6 }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }} />
          </div>
        </Col>
      </Row>


      {/* 数据集表格 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={datasets
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice((currentDatasetPage - 1) * datasetPageSize, currentDatasetPage * datasetPageSize)}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[]) => {
              setSelectedRowKeys(newSelectedRowKeys as string[]);
            },
            getCheckboxProps: (record: QADataset) => ({
              disabled: deletingDatasets.has(record.id), // 删除中的数据集不能选择
            }),
          }}
          pagination={false}
          rowClassName={(record) => 
            deletingDatasets.has(record.id) ? 'dataset-deleting' : ''
          }
        />
        
        {/* 底部工具栏：批量操作 + 分页器 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid #f0f0f0',
          marginTop: '8px'
        }}>
          {/* 左侧：批量操作区域 */}
          <div style={{ flex: 1 }}>
            {selectedRowKeys.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '14px', color: '#656d76' }}>
                  已选择 <span style={{ color: '#0969da', fontWeight: 'bold' }}>{selectedRowKeys.length}</span> 个数据集
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="small"
                    onClick={() => setSelectedRowKeys([])}
                  >
                    取消选择
                  </Button>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    loading={batchDeleting}
                    onClick={handleBatchDelete}
                    icon={<DeleteOutlined />}
                  >
                    批量删除
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          
          {/* 右侧：分页器 */}
          <div>
            {datasets.length > datasetPageSize ? (
              <Pagination
                current={currentDatasetPage}
                total={datasets.length}
                pageSize={datasetPageSize}
                showSizeChanger={false}
                showQuickJumper={true}
                showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 条`}
                size="small"
                onChange={(page) => {
                  setCurrentDatasetPage(page);
                  setSelectedRowKeys([]); // 切换页面时清空选择
                }}
              />
            ) : (
              <span style={{ fontSize: '14px', color: '#656d76' }}>
                共 {datasets.length} 条
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 上传Modal */}
      <Modal
        title="上传QA数据集"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setCurrentConfigIndex(0);
          uploadForm.resetFields();
        }}
        footer={null}
        width={800}
        style={{ height: '80vh' }}
      >
        <div style={{ height: '600px', display: 'flex', gap: '16px' }}>
          {/* 左侧：上传区域 */}
          <div style={{ 
            flex: '50%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: '1px solid #d0d7de',
            paddingRight: '16px'
          }}>
            {/* 拖拽上传区域 */}
            <div style={{ height: '80%', marginBottom: '12px' }}>
              <Dragger
                fileList={fileList as UploadFile[]}
                onChange={handleFileChange}
              beforeUpload={() => false}
              accept=".xlsx,.xls"
                multiple={true}
                showUploadList={false}
                style={{ 
                  height: '100%', 
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <p style={{ margin: '0 0 16px 0' }}>
                  <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                </p>
                <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>点击或拖拽Excel文件到此区域上传</p>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>支持单个或批量上传，每个文件不超过50MB</p>
              </Dragger>
            </div>
            
            {/* 说明区域 */}
            <div style={{ 
              flex: 1, 
              padding: '12px', 
              backgroundColor: '#f6f8fa', 
              borderRadius: '8px', 
              fontSize: '12px',
              border: '1px solid #d0d7de'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#24292f' }}>批量上传指南</div>
                              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6', color: '#656d76' }}>
                <li>支持 .xlsx 和 .xls 格式</li>
                <li>必须包含列：分类、问题、答案</li>
                <li>可选列：编号</li>
                <li>每个文件大小不超过50MB</li>
                <li>可为每个文件单独设置标题、描述、分类</li>
              </ul>
            </div>
          </div>

          {/* 右侧：文件列表和配置 */}
          <div style={{ 
            flex: '50%', 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            {/* 文件列表标题和清空按钮 */}
            <div style={{ 
              padding: '10px 12px', 
              backgroundColor: '#f6f8fa', 
              borderRadius: '8px 8px 0 0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              border: '1px solid #d0d7de',
              borderBottom: 'none'
            }}>
              <Text style={{ fontSize: '14px', fontWeight: 'bold' }}>已选择的文件</Text>
              {fileList.length > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleClearAllFiles}
                  style={{ padding: '0 4px', height: 'auto' }}
                >
                  清空
                </Button>
              )}
            </div>

            {/* 文件列表和配置区域 */}
            <div style={{ 
              flex: 1, 
              border: '1px solid #d0d7de', 
              borderTop: 'none', 
              borderRadius: '0 0 8px 8px',
              backgroundColor: '#fff'
            }}>
              {fileList.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                  <FileTextOutlined style={{ fontSize: 32, marginBottom: '8px' }} />
                  <div>暂无选择的文件</div>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 文件列表 */}
                  <div style={{ flex: 1, padding: '8px', overflowY: 'auto', maxHeight: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {fileList.map((file, index) => (
                                                 <div
                           key={file.uid}
                           style={{
                             padding: '12px',
                             border: currentConfigIndex === index ? '2px solid #0969da' : '1px solid #d0d7de',
                             borderRadius: '8px',
                             cursor: 'pointer',
                             backgroundColor: currentConfigIndex === index ? '#dbeafe' : '#f8fafc',
                             transition: 'all 0.2s',
                             boxShadow: currentConfigIndex === index ? '0 3px 12px rgba(9, 105, 218, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                           }}
                           onClick={() => setCurrentConfigIndex(index)}
                         >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file.uid);
                              }}
                              style={{ color: '#ff4d4f' }}
                            />
                          </div>
                                                     {file.title && (
                             <div style={{ fontSize: '12px', color: '#0969da', marginTop: '4px' }}>
                               标题: {file.title}
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 当前文件配置 */}
                  {fileList.length > 0 && (
                                         <div style={{ 
                       borderTop: '1px solid #d0d7de', 
                       padding: '12px',
                       backgroundColor: '#f6f8fa',
                       borderRadius: '0 0 8px 8px'
                     }}>
                                             <div style={{ 
                         marginBottom: '12px', 
                         fontSize: '13px', 
                         fontWeight: 'bold',
                         color: '#24292f',
                         paddingBottom: '8px',
                         borderBottom: '1px solid #d0d7de'
                       }}>
                        配置文件: {fileList[currentConfigIndex]?.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#656d76', marginBottom: '4px', fontWeight: '500' }}>数据集标题</div>
                          <Input
                            placeholder="请输入数据集标题"
                            size="small"
                            value={fileList[currentConfigIndex]?.title || ''}
                            onChange={(e) => updateCurrentFileMetadata('title', e.target.value)}
                            style={{ 
                              borderRadius: '6px', 
                              border: '1px solid #d0d7de',
                              height: '30px'
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#656d76', marginBottom: '4px', fontWeight: '500' }}>描述</div>
                          <TextArea
                            placeholder="请输入数据集描述"
                            size="small"
                            rows={2}
                            value={fileList[currentConfigIndex]?.description || ''}
                            onChange={(e) => updateCurrentFileMetadata('description', e.target.value)}
                            style={{ 
                              borderRadius: '6px', 
                              border: '1px solid #d0d7de'
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#656d76', marginBottom: '4px', fontWeight: '500' }}>分类</div>
                          <Select
                            placeholder="请选择分类"
                            size="small"
                            allowClear
                            value={fileList[currentConfigIndex]?.category || undefined}
                            onChange={(value) => updateCurrentFileMetadata('category', value)}
                            style={{ 
                              width: '100%', 
                              borderRadius: '6px'
                            }}
                            dropdownStyle={{ borderRadius: '6px' }}
                          >
              <Option value="技术文档">技术文档</Option>
              <Option value="产品手册">产品手册</Option>
              <Option value="工程技术">工程技术</Option>
              <Option value="培训资料">培训资料</Option>
              <Option value="政策文件">政策文件</Option>
              <Option value="其他">其他</Option>
            </Select>
                          <style>{`
                            .ant-select-small .ant-select-selector {
                              height: 30px !important;
                              border: 1px solid #d0d7de !important;
                              border-radius: 6px !important;
                            }
                            .ant-select-small .ant-select-selection-item {
                              line-height: 28px !important;
                            }
                          `}</style>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 文件统计信息 */}
            {fileList.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                padding: '10px 12px',
                fontSize: '12px', 
                color: '#656d76', 
                textAlign: 'center',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                fontWeight: '500'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>共选择 <strong style={{ color: '#0969da' }}>{fileList.length}</strong> 个文件</span>
                  <span>总大小 <strong style={{ color: '#0969da' }}>{formatFileSize(fileList.reduce((sum, file) => sum + file.size, 0))}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Space>
            <Button onClick={() => {
              setUploadModalVisible(false);
              setFileList([]);
              setCurrentConfigIndex(0);
              uploadForm.resetFields();
            }}>
                取消
              </Button>
            <Button 
              type="primary" 
              onClick={handleUpload}
              disabled={fileList.length === 0}
            >
              上传 {fileList.length > 0 && `(${fileList.length}个文件)`}
              </Button>
            </Space>
        </div>
      </Modal>

      {/* 向量化数据 Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined />
            向量化数据{vectorDataset ? ` - ${vectorDataset.display_title || vectorDataset.title}` : ''}
          </div>
        }
        placement="right"
        size="large"
        onClose={() => setVectorDrawerVisible(false)}
        open={vectorDrawerVisible}
      >
        {vectorDataset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Tag color="blue">总数: {vectorDataset.total_qa_pairs}</Tag>
              <Tag color="green">已向量化: {vectorDataset.processed_qa_pairs}</Tag>
              <Tag color="default">状态: {getVectorizationStatusTag(vectorDataset.vectorization_status)}</Tag>
              <div style={{ marginLeft: 'auto' }}>
                <Space>
                  <span style={{ fontSize: 12, color: '#666' }}>仅显示已向量化</span>
                  <Switch
                    size="small"
                    checked={vectorOnlyCompleted}
                    onChange={async (checked) => {
                      setVectorOnlyCompleted(checked);
                      await loadVectorPairs(vectorDataset.id, 1, checked);
                    }}
                  />
                </Space>
              </div>
            </div>

            <Table<QAPair>
              rowKey={(r) => r.id}
              dataSource={vectorPairs}
              loading={vectorLoading}
              pagination={{
                current: vectorPage,
                pageSize: vectorPageSize,
                onChange: (p) => loadVectorPairs(vectorDataset.id, p, vectorOnlyCompleted),
              }}
              columns={[
                {
                  title: '分类',
                  dataIndex: 'category',
                  key: 'category',
                  width: 120,
                  render: (c) => <Tag>{c || '未分类'}</Tag>,
                },
                {
                  title: '问题',
                  dataIndex: 'question',
                  key: 'question',
                  width: '40%',
                  render: (q) => <span title={q}>{q?.length > 60 ? q.slice(0, 60) + '…' : q}</span>,
                },
                {
                  title: '答案',
                  dataIndex: 'answer',
                  key: 'answer',
                  width: '40%',
                  render: (a) => <span title={a}>{a?.length > 80 ? a.slice(0, 80) + '…' : a}</span>,
                },
                {
                  title: '向量状态',
                  dataIndex: 'vector_status',
                  key: 'vector_status',
                  width: 120,
                  render: (s) => getVectorizationStatusTag(s),
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* 详情Drawer */}
      <Drawer
        title="QA数据集详情"
        placement="right"
        size="large"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        styles={{
          body: { 
            padding: '16px',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden'
          }
        }}
      >
        {selectedDataset && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 基础信息区域 - 固定高度 */}
            <div style={{ flexShrink: 0, marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="数据集名称">{selectedDataset.display_title || selectedDataset.title}</Descriptions.Item>
                <Descriptions.Item label="数据来源">
                  {selectedDataset.data_source_type === 'auto_extraction' ? (
                    <Tag color="blue" icon={<ExperimentOutlined />}>自动提取</Tag>
                  ) : (
                    <Tag color="green" icon={<UploadOutlined />}>手动上传</Tag>
                  )}
                </Descriptions.Item>
                
                {selectedDataset.data_source_type === 'auto_extraction' ? (
                  <>
                    <Descriptions.Item label="源文档">{selectedDataset.source_document_title}</Descriptions.Item>
                    <Descriptions.Item label="提取方法">{selectedDataset.extraction_method || 'GC-QA-RAG'}</Descriptions.Item>
                    {selectedDataset.extraction_model && (
                      <Descriptions.Item label="提取模型">{selectedDataset.extraction_model}</Descriptions.Item>
                    )}
                    {selectedDataset.extraction_duration_seconds && (
                      <Descriptions.Item label="提取耗时">{selectedDataset.extraction_duration_seconds}秒</Descriptions.Item>
                    )}
                    {selectedDataset.extraction_started_at && (
                      <Descriptions.Item label="提取开始时间">
                        {new Date(selectedDataset.extraction_started_at).toLocaleString()}
                      </Descriptions.Item>
                    )}
                    {selectedDataset.extraction_completed_at && (
                      <Descriptions.Item label="提取完成时间">
                        {new Date(selectedDataset.extraction_completed_at).toLocaleString()}
                      </Descriptions.Item>
                    )}
                  </>
                ) : (
                  <>
                    <Descriptions.Item label="文件名">{selectedDataset.file_name}</Descriptions.Item>
                    <Descriptions.Item label="文件大小">{formatFileSize(selectedDataset.file_size || 0)}</Descriptions.Item>
                  </>
                )}
                
                <Descriptions.Item label="分类">{selectedDataset.category || '未分类'}</Descriptions.Item>
                <Descriptions.Item label="处理状态">{getStatusTag(selectedDataset.status)}</Descriptions.Item>
                <Descriptions.Item label="向量化状态">{getVectorizationStatusTag(selectedDataset.vectorization_status)}</Descriptions.Item>
                <Descriptions.Item label="问答对总数">{selectedDataset.total_qa_pairs}</Descriptions.Item>
                <Descriptions.Item label="已处理">{selectedDataset.processed_qa_pairs}</Descriptions.Item>
                <Descriptions.Item label="分类数量">{selectedDataset.categories_count}</Descriptions.Item>
                <Descriptions.Item label="向量模型">{selectedDataset.vector_model || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {new Date(selectedDataset.created_at).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              {selectedDataset.description && (
                <div style={{ marginTop: 12 }}>
                  <Title level={5} style={{ margin: '8px 0' }}>描述</Title>
                  <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
                    {selectedDataset.description}
                  </div>
                </div>
              )}
            </div>

            {/* 问答对列表区域 - 弹性高度 */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>问答对列表</Title>
                
                {/* 分类筛选下拉框 */}
                {categories.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>分类筛选:</Text>
                    <Select
                      value={selectedCategory}
                      placeholder="选择分类"
                      style={{ width: 150 }}
                      size="small"
                      allowClear
                      onChange={handleCategoryFilter}
                    >
                      <Option value={null}>全部</Option>
                      {categories.map(category => (
                        <Option key={category} value={category}>
                          {category}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              {qaPairs.length === 0 && !qaPairsLoading && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  {selectedDataset?.total_qa_pairs > 0 ? '数据加载中...' : '暂无问答对数据'}
                </div>
              )}
              <Table
                columns={qaPairColumns}
                dataSource={qaPairs}
                rowKey="id"
                loading={qaPairsLoading}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: qaPairsTotal,
                  showSizeChanger: false,
                  showQuickJumper: false, // 只有5页，不需要快速跳转
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  onChange: (page) => {
                    if (selectedDataset) {
                      loadQAPairs(selectedDataset.id, page, selectedCategory);
                    }
                  },
                  size: "small"
                }}
                size="small"
                locale={{
                  emptyText: qaPairsLoading ? '加载中...' : '暂无数据'
                }}
                scroll={{ 
                  y: 'calc(100vh - 500px)', // 动态计算高度，确保不会产生滚动
                  x: 'max-content'
                }}
                style={{ 
                  height: '100%',
                  overflow: 'hidden'
                }}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* 删除状态样式和问题Hover样式 */}
      <style>{`
        .dataset-deleting {
          background-color: #fff2f0 !important;
          opacity: 0.7;
          position: relative;
        }
        
        .dataset-deleting::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 77, 79, 0.1) 50%, transparent 70%);
          pointer-events: none;
          animation: deleting-shimmer 1.5s infinite;
        }
        
        @keyframes deleting-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .dataset-deleting .ant-checkbox-wrapper {
          opacity: 0.5;
          pointer-events: none;
        }
        
        /* 问题列Hover样式 */
        .question-cell {
          position: relative;
        }
        
        .question-content {
          transition: all 0.2s ease;
        }
        
        .question-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          border-radius: 4px;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        .question-cell:hover .question-overlay {
          opacity: 1;
          visibility: visible;
        }
        
        .question-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .question-action-btn {
          height: 32px !important;
          padding: 0 16px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          background: transparent !important;
          color: #374151 !important;
          border: 1px solid #374151 !important;
          transition: all 0.2s ease !important;
          box-shadow: none !important;
        }
        
        .question-action-btn:hover {
          background: rgba(55, 65, 81, 0.1) !important;
          color: #374151 !important;
          border-color: #374151 !important;
          box-shadow: none !important;
        }
        
        .question-action-btn .anticon {
          margin-right: 6px !important;
        }
        
        /* 确保遮罩层不会影响其他列 */
        .ant-table-tbody > tr > td {
          position: relative;
          overflow: visible;
        }
        
        .ant-table-tbody > tr:hover > td .question-overlay {
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default QADatasetPanel;
